"""Observe actual native preparation and stop before any diffusion forward.

Launch under the existing live RAM guard. No generated audio is approved.
"""
import argparse
import functools
import hashlib
import json
import runpy
import sys
import time
from pathlib import Path


class PreparationObserved(Exception):
    pass


def observe_preparation(pipeline_class, emit, stop_after, prepare=None):
    original = pipeline_class.__call__

    @functools.wraps(original)
    def call(self, *args, **kwargs):
        saved = []

        def observe(owner, name, phase):
            function = getattr(owner, name)
            had_instance_value = name in vars(owner)
            previous = vars(owner).get(name)

            @functools.wraps(function)
            def watched(*values, **options):
                emit(phase + '-start', self)
                result = function(*values, **options)
                emit(phase + '-complete', self, result)
                if phase == stop_after:
                    raise PreparationObserved(phase)
                return result

            setattr(owner, name, watched)
            saved.append((owner, name, had_instance_value, previous))

        def prevent_diffusion(*_):
            emit('diffusion-forward-prevented', self)
            raise PreparationObserved('before-diffusion')

        handle = self.transformer.register_forward_pre_hook(prevent_diffusion)
        try:
            if prepare is not None:
                prepare(self, emit)
            observe(self, 'encode_prompt', 'prompt')
            observe(self, 'prepare_src_latents', 'source')
            observe(self.condition_encoder, 'forward', 'condition')
            emit('native-call-start', self)
            return original(self, *args, **kwargs)
        finally:
            handle.remove()
            for owner, name, had_instance_value, previous in reversed(saved):
                if had_instance_value:
                    setattr(owner, name, previous)
                else:
                    delattr(owner, name)

    pipeline_class.__call__ = call
    return original


def retain_condition_on_cuda(pipeline, emit):
    import torch
    from diffusers.hooks.group_offloading import _GROUP_OFFLOADING
    condition = pipeline.condition_encoder
    parameter_bytes = sum(p.numel() * p.element_size() for p in condition.parameters())
    assert 0 < parameter_bytes < 3 * 1024**3, 'Bound the resident condition model'
    assert all(p.dtype == torch.float32 and p.device.type == 'cpu' for p in condition.parameters())
    free, _ = torch.cuda.mem_get_info()
    assert free > parameter_bytes + 2 * 1024**3, 'Keep two GiB GPU headroom for source/condition activations'
    hooks = []
    for module in condition.modules():
        registry = getattr(module, '_diffusers_hook', None)
        hook = registry.get_hook(_GROUP_OFFLOADING) if registry else None
        if hook is not None:
            assert hook.group.stream is None and not hook.group._is_offloaded_to_disk
            assert hook.group.onload_device.type == 'cuda' and hook.group.offload_device.type == 'cpu'
            hooks.append(registry)
    assert hooks, 'Only the observed existing CPU leaf offload path is supported'
    emit('condition-resident-transfer-start', pipeline)
    for registry in hooks:
        registry.remove_hook(_GROUP_OFFLOADING)
    condition.to(device='cuda', dtype=torch.float32)
    assert all(p.device.type == 'cuda' and p.dtype == torch.float32 for p in condition.parameters())
    # Removing the root hook restores the native forward; reconnect the same
    # one-shot release after changing storage, before installing phase observers.
    from cuda_disk_offload import release_after_one_shot
    condition.forward = release_after_one_shot(condition.forward, condition, 'resident condition encoding',
                                               preserve_parameters=('null_condition_emb',))
    emit('condition-resident-transfer-complete', pipeline)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--trace', type=Path, required=True)
    parser.add_argument('--stop-after', choices=['source', 'condition'], required=True)
    parser.add_argument('--resident-condition-cuda', action='store_true', help='Diagnostic only: whole CPU-to-CUDA transfer previously hit the RAM guard; not a validated low-RAM path')
    parser.add_argument('--bounded-condition-cuda', action='store_true', help='Diagnostic exact tensor-wise CUDA loading; still stops before music diffusion')
    parser.add_argument('generation_arguments', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    assert not args.trace.exists(), 'Preserve previous phase evidence'
    arguments = args.generation_arguments
    assert arguments and arguments[0] == '--', 'Separate unchanged generator arguments with --'
    assert not (args.resident_condition_cuda and args.bounded_condition_cuda)
    if args.resident_condition_cuda or args.bounded_condition_cuda:
        assert arguments[arguments.index('--device') + 1] == 'cuda'
        assert arguments[arguments.index('--compute-dtype') + 1] == 'float32'
        assert arguments[arguments.index('--task') + 1] in ('lego', 'repaint'), 'Preserve one-shot conditioning'
    generator = Path(__file__).with_name('generate-ai-provided-song.py')
    generator_sha = hashlib.sha256(generator.read_bytes()).hexdigest()
    started = time.monotonic()
    import torch
    from diffusers import AceStepPipeline, AceStepConditionEncoder
    import diffusers.hooks

    def emit(phase, pipeline=None, result=None):
        components = {}
        if pipeline is not None:
            for name, module in pipeline.components.items():
                if isinstance(module, torch.nn.Module):
                    components[name] = {'cpuParameterBytes': sum(p.numel() * p.element_size() for p in module.parameters() if p.device.type == 'cpu'),
                                        'cudaParameterBytes': sum(p.numel() * p.element_size() for p in module.parameters() if p.device.type == 'cuda')}
        results = []
        def inspect(value):
            if isinstance(value, torch.Tensor):
                if value.is_floating_point():
                    assert torch.isfinite(value).all(), 'Preparation returned non-finite values'
                results.append({'shape': list(value.shape), 'dtype': str(value.dtype), 'device': str(value.device)})
            elif isinstance(value, (tuple, list)):
                for item in value:
                    inspect(item)
        inspect(result)
        row = {'phase': phase, 'elapsedSeconds': time.monotonic() - started,
               'generatorSha256': generator_sha, 'components': components,
               'results': results,
               'gpuAllocatedBytes': torch.cuda.memory_allocated(), 'gpuReservedBytes': torch.cuda.memory_reserved(),
               'musicGenerated': False}
        with args.trace.open('a', encoding='utf-8') as stream:
            stream.write(json.dumps(row) + '\n')
        print(json.dumps(row), flush=True)

    original = observe_preparation(AceStepPipeline, emit, args.stop_after,
                                   retain_condition_on_cuda if args.resident_condition_cuda else None)
    previous_loader = AceStepConditionEncoder.__dict__.get('from_pretrained')
    previous_offload = diffusers.hooks.apply_group_offloading
    if args.bounded_condition_cuda:
        from music_cuda_checkpoint import load_bounded_fp32_model
        lineage_path = Path(arguments[arguments.index('--model-lineage') + 1])
        expected_sha = json.loads(lineage_path.read_text(encoding='utf-8'))['componentHashes']['condition_encoder/diffusion_pytorch_model.safetensors']
        def bounded_loader(cls, directory, **options):
            assert options.get('torch_dtype', options.get('dtype')) == torch.float32
            directory = Path(directory) / options.get('subfolder', '')
            emit('bounded-condition-load-start')
            model, report = load_bounded_fp32_model(cls, directory, expected_sha)
            print(json.dumps({'phase': 'bounded-condition-weights', **report}), flush=True)
            emit('bounded-condition-load-complete')
            model._ieum_bounded_condition = report
            return model
        def offload_except_condition(module, *values, **options):
            if isinstance(module, AceStepConditionEncoder) and hasattr(module, '_ieum_bounded_condition'):
                assert all(p.device.type == 'cuda' and p.dtype == torch.float32 for p in module.parameters())
                return
            return previous_offload(module, *values, **options)
        AceStepConditionEncoder.from_pretrained = classmethod(bounded_loader)
        diffusers.hooks.apply_group_offloading = offload_except_condition
    previous_argv = sys.argv
    sys.argv = [str(generator), *arguments[1:]]
    try:
        emit('probe-start')
        runpy.run_path(str(generator), run_name='__main__')
        raise AssertionError('Diagnostic must stop before diffusion/output')
    except PreparationObserved as complete:
        emit('probe-complete:' + str(complete))
    finally:
        AceStepPipeline.__call__ = original
        diffusers.hooks.apply_group_offloading = previous_offload
        if args.bounded_condition_cuda:
            if previous_loader is None:
                delattr(AceStepConditionEncoder, 'from_pretrained')
            else:
                AceStepConditionEncoder.from_pretrained = previous_loader
        sys.argv = previous_argv


if __name__ == '__main__':
    main()
