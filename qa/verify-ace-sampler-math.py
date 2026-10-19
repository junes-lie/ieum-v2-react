"""Pinned native APG/Euler mathematics vs installed Diffusers; no music model."""
import argparse
import ast
import hashlib
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--source-dir', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
assert not args.output.exists(), 'Preserve previous evidence'
native_path = args.source_dir / 'modeling_acestep_v15_base.py'
apg_path = args.source_dir / 'common_apg_guidance.py'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
assert sha(native_path) == 'f3edaa0f86ce174c0c6703a8d80442673783ba96515a0fa84126a9b605b0919d'
assert sha(apg_path) == '89ecdc4686e174225d6e6d304939d75892297dc3c19fbb11e04345dc3d4685db'

import torch
from diffusers import AceStepPipeline, FlowMatchEulerDiscreteScheduler
from diffusers.guiders.adaptive_projected_guidance import MomentumBuffer, normalized_guidance
import inspect

torch.set_num_threads(2)
native_tree = ast.parse(native_path.read_text(encoding='utf-8'))
apg_tree = ast.parse(apg_path.read_text(encoding='utf-8'))
future = ast.ImportFrom(module='__future__', names=[ast.alias(name='annotations')], level=0)
selected = [node for node in apg_tree.body if isinstance(node, (ast.FunctionDef, ast.ClassDef))
            and node.name in {'MomentumBuffer', 'project', 'apg_forward'}]
assert len(selected) == 3
native = {'torch': torch}
exec(compile(ast.fix_missing_locations(ast.Module(body=[future, *selected], type_ignores=[])),
             str(apg_path), 'exec'), native)
generate = next(node for node in ast.walk(native_tree)
                if isinstance(node, ast.FunctionDef) and node.name == 'generate_audio')
euler = next(node for node in ast.walk(generate) if isinstance(node, ast.If)
             and ast.unparse(node.test) == "infer_method == 'ode'")
assert [ast.unparse(node.targets[0]) for node in euler.body if isinstance(node, ast.Assign)] == ['dt', 'dt_tensor', 'xt', 't_after_step']
euler_code = compile(ast.fix_missing_locations(ast.Module(body=euler.body, type_ignores=[])),
                     str(native_path), 'exec')
schedule = inspect.getsource(AceStepPipeline._get_timestep_schedule)
pipeline_file = Path(inspect.getfile(AceStepPipeline))
guidance_file = Path(inspect.getfile(normalized_guidance))
scheduler_file = Path(inspect.getfile(FlowMatchEulerDiscreteScheduler))

cases = []
for steps in (32, 50, 64):
    for shift in (1., 2., 3.):
        # This is the exact native schedule expression, separately checked
        # against the installed pipeline function, including terminal sigma.
        time = torch.linspace(1., 0., steps + 1, dtype=torch.float32)
        if shift != 1.:
            time = shift * time / (1 + (shift - 1) * time)
        converted = AceStepPipeline._get_timestep_schedule(None, steps, shift, device='cpu', dtype=torch.float32)
        assert torch.equal(time[:-1], converted)
        scheduler = FlowMatchEulerDiscreteScheduler(num_train_timesteps=1, shift=1.)
        scheduler.set_timesteps(sigmas=converted.tolist(), device='cpu')
        assert torch.equal(scheduler.sigmas, time)
        generator = torch.Generator().manual_seed(65346)
        native_state = torch.randn((2, 200, 64), generator=generator)
        converted_state = native_state.clone()
        native_buffer, converted_buffer = native['MomentumBuffer'](), MomentumBuffer(momentum=-.75)
        max_guidance, max_step = 0., 0.
        for index, (current, following) in enumerate(zip(time[:-1], time[1:])):
            # Fixed controlled predictions test sampler math independently of
            # DiT weights, acoustic conditions and model quality.
            conditional = torch.randn(native_state.shape, generator=generator) * (1. + index / steps)
            unconditional = torch.randn(native_state.shape, generator=generator)
            expected = native['apg_forward'](conditional, unconditional, 7., native_buffer, dims=[1])
            actual = normalized_guidance(conditional, unconditional, 6., converted_buffer,
                                         eta=0., norm_threshold=2.5,
                                         use_original_formulation=True, norm_dim=(1,))
            torch.testing.assert_close(actual, expected, rtol=1e-6, atol=1e-6)
            assert torch.equal(native_buffer.running_average, converted_buffer.running_average)
            max_guidance = max(max_guidance, (actual - expected).abs().max().item())
            scope = {'torch': torch, 'xt': native_state, 'vt': expected, 't_curr': current,
                     't_prev': following, 'bsz': native_state.shape[0], 'device': native_state.device,
                     'dtype': native_state.dtype}
            exec(euler_code, scope)
            native_state = scope['xt']
            converted_state = scheduler.step(actual, scheduler.timesteps[index], converted_state, return_dict=False)[0]
            torch.testing.assert_close(converted_state, native_state, rtol=1e-5, atol=1e-5)
            max_step = max(max_step, (native_state - converted_state).abs().max().item())
        cases.append({'steps': steps, 'shift': shift, 'maxGuidanceAbsoluteDifference': max_guidance,
                      'maxEulerAbsoluteDifference': max_step, 'terminalSigma': float(time[-1])})

# These differences are observed coverage limits, not a new generator policy.
native_arguments = {arg.arg: ast.unparse(default) for arg, default in
                    zip(generate.args.args[-len(generate.args.defaults):], generate.args.defaults)}
assert native_arguments['dcw_enabled'] == 'True'
assert native_arguments['dcw_scaler'] == '0.05'
assert native_arguments['dcw_high_scaler'] == '0.02'
pipeline_tree = ast.parse(pipeline_file.read_text(encoding='utf-8'))
native_interval = next(node.value for node in ast.walk(generate) if isinstance(node, ast.Assign)
                       and any(isinstance(target, ast.Name) and target.id == 'apply_cfg_guidance' for target in node.targets))
converted_interval = next(node.value for node in ast.walk(pipeline_tree) if isinstance(node, ast.Assign)
                          and any(isinstance(target, ast.Name) and target.id == 'apply_cfg' for target in node.targets))
interval_cases = []
for current in (1., .8, .5, .2, 0.):
    scope = {'t_curr': current, 'timestep_ratio': 1. - current, 'do_cfg': True,
             'cfg_interval_start': .2, 'cfg_interval_end': .7}
    original = eval(compile(ast.Expression(native_interval), str(native_path), 'eval'), scope)
    converted = eval(compile(ast.Expression(converted_interval), str(pipeline_file), 'eval'), scope)
    interval_cases.append({'timestep': current, 'native': original, 'converted': converted})
assert any(row['native'] != row['converted'] for row in interval_cases)
report = {'version': 'ieum-ace-sampler-math-v1', 'nativeRevision': 'ca1e85fe9430179831e6bc6be790c332190a3866',
          'sources': {'nativeSha256': sha(native_path), 'apgSha256': sha(apg_path),
                      'installedPipelineSha256': sha(pipeline_file), 'installedGuidanceSha256': sha(guidance_file),
                      'installedSchedulerSha256': sha(scheduler_file)},
          'executionDevice': 'cpu', 'dtype': 'float32', 'modelsLoaded': False, 'musicGenerated': False,
          'apgEulerCases': cases, 'partialCfgIntervalCases': interval_cases,
          'nativeDcwDefaults': {key: native_arguments[key] for key in ('dcw_enabled', 'dcw_scaler', 'dcw_high_scaler')},
          'limitations': ['Controlled prediction tensors only; no actual DiT, source VAE or audio decoder parity.',
                          'APG/Euler core only; native DCW, partial CFG intervals, cover switching and repaint injection excluded.',
                          'Default full CFG interval agrees; partial interval conventions differ.',
                          'No music quality, exact lyrics, harmony, rights, catalog or full native pipeline approval.']}
args.output.write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report), flush=True)
