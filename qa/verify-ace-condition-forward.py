"""Compare Base condition forwards, not song quality, with fixed official source."""
import argparse, ast, gc, hashlib, importlib.util, json, math, struct, time
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('--native-source', type=Path, required=True)
p.add_argument('--raw-dir', type=Path, required=True)
p.add_argument('--pipeline-dir', type=Path, required=True)
p.add_argument('--spec', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
p.add_argument('--validate-only', action='store_true')
a = p.parse_args()
assert not a.output.exists(), 'Preserve previous forward evidence'
expected = {
    'modeling_acestep_v15_base.py': 'f3edaa0f86ce174c0c6703a8d80442673783ba96515a0fa84126a9b605b0919d',
    'configuration_common.py': '0d66f38eba6a3d1665c9449a1a52724d68354477bc88dcf02389640e3602a0c7',
}
for name, digest in expected.items():
    assert hashlib.sha256((a.native_source / name).read_bytes()).hexdigest() == digest, name
with (a.raw_dir / 'model.safetensors').open('rb') as f:
    size = struct.unpack('<Q', f.read(8))[0]
    assert 0 < size < 16 * 1024 * 1024
    header = json.loads(f.read(size))
parameter_bytes = sum(math.prod(value['shape']) * 4 for name, value in header.items()
                      if name.startswith('encoder.'))
assert parameter_bytes < 3 * 1024**3, 'Do not load an unbounded component'
preflight = {'conditionFloat32GiB': parameter_bytes / 1024**3,
             'decoderLoaded': False, 'musicInferenceExecuted': False}
if a.validate_only:
    print(json.dumps(preflight)); raise SystemExit(0)

import torch
from torch import nn
import torch.nn.functional as F
from typing import Callable, List, Optional, Union
from accelerate import init_empty_weights
from safetensors import safe_open
from transformers import AutoModel, AutoTokenizer
from transformers.cache_utils import Cache, DynamicCache, EncoderDecoderCache
from transformers.modeling_attn_mask_utils import _prepare_4d_causal_attention_mask
from transformers.modeling_flash_attention_utils import FlashAttentionKwargs
from transformers.modeling_layers import GradientCheckpointingLayer
from transformers.modeling_outputs import BaseModelOutput
from transformers.modeling_utils import ALL_ATTENTION_FUNCTIONS, PreTrainedModel
from transformers.processing_utils import Unpack
from transformers.utils import auto_docstring, can_return_tuple, logging
from transformers.models.qwen3.modeling_qwen3 import (
    Qwen3MLP, Qwen3RMSNorm, Qwen3RotaryEmbedding,
    apply_rotary_pos_emb, eager_attention_forward,
)
from diffusers.pipelines.ace_step.modeling_ace_step import AceStepConditionEncoder
from diffusers.pipelines.ace_step.pipeline_ace_step import AceStepPipeline
from ai_music_models import PINNED_AUDIO_MODELS

torch.set_num_threads(2); torch.manual_seed(65359)
start = time.perf_counter()
cfg_spec = importlib.util.spec_from_file_location('ieum_native_base_config', a.native_source / 'configuration_common.py')
cfg_module = importlib.util.module_from_spec(cfg_spec); cfg_spec.loader.exec_module(cfg_module)
AceStepConfig = cfg_module.AceStepConfig
config = AceStepConfig.from_pretrained(a.raw_dir, local_files_only=True)
config._attn_implementation = 'eager'
assert not config.is_turbo
names = {'create_4d_mask', 'pack_sequences', 'AceStepAttention', 'AceStepEncoderLayer',
         'AceStepPreTrainedModel', 'AceStepLyricEncoder', 'AceStepTimbreEncoder', 'AceStepConditionEncoder'}
tree = ast.parse((a.native_source / 'modeling_acestep_v15_base.py').read_text(encoding='utf-8'))
nodes = [node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name in names]
assert {node.name for node in nodes} == names
namespace = dict(globals(), logger=logging.get_logger('ieum-native-condition'))
# Execute unchanged selected declarations; no native sampler, decoder, or main.
exec(compile(ast.Module(body=nodes, type_ignores=[]), str(a.native_source / 'modeling_acestep_v15_base.py'), 'exec'), namespace)

spec = json.loads(a.spec.read_text(encoding='utf-8'))
formatted = AceStepPipeline._format_prompt(
    object.__new__(AceStepPipeline), prompt=spec['prompt'], lyrics=spec['lyrics'],
    vocal_language=spec['language'], audio_duration=19, bpm=spec['bpm'],
    keyscale=spec['key'], timesignature=spec['timesignature'])
tokenizer = AutoTokenizer.from_pretrained(a.pipeline_dir / 'tokenizer', local_files_only=True)
text = tokenizer([formatted[0]], return_tensors='pt')
lyrics = tokenizer([formatted[1]], return_tensors='pt')
assert text.input_ids.shape[1] <= 256 and lyrics.input_ids.shape[1] <= 2048
encoder = AutoModel.from_pretrained(a.pipeline_dir / 'text_encoder', dtype=torch.float32,
                                   local_files_only=True, low_cpu_mem_usage=True).eval()
with torch.inference_mode():
    text_hs = encoder(input_ids=text.input_ids).last_hidden_state.detach().clone()
    lyric_hs = encoder.get_input_embeddings()(lyrics.input_ids).detach().clone()
del encoder; gc.collect()
print('Actual Korean token lookup and caption forward finished; text weights released', flush=True)
raw_hash = hashlib.sha256()
with (a.raw_dir / 'model.safetensors').open('rb') as f:
    for chunk in iter(lambda: f.read(8 * 1024 * 1024), b''): raw_hash.update(chunk)
assert raw_hash.hexdigest() == PINNED_AUDIO_MODELS['base']['weightsSha256']
with safe_open(a.raw_dir / 'model.safetensors', framework='pt', device='cpu') as f:
    states = {name.removeprefix('encoder.'): f.get_tensor(name).float()
              for name in f.keys() if name.startswith('encoder.')}
with init_empty_weights(): native = namespace['AceStepConditionEncoder'](config)
native.load_state_dict(states, strict=True, assign=True); native.eval()
converted_states = {}
for name, value in states.items():
    for old, new in [('.q_proj.', '.to_q.'), ('.k_proj.', '.to_k.'), ('.v_proj.', '.to_v.'),
                     ('.o_proj.', '.to_out.0.'), ('.q_norm.', '.norm_q.'), ('.k_norm.', '.norm_k.')]:
        name = name.replace(old, new)
    converted_states[name] = value
converted_config = json.loads((a.pipeline_dir / 'condition_encoder/config.json').read_text())
with init_empty_weights(): converted = AceStepConditionEncoder.from_config(converted_config)
missing, unexpected = converted.load_state_dict(converted_states, strict=False, assign=True)
assert set(missing) == {'null_condition_emb', 'silence_latent'} and not unexpected
silence = torch.load(a.raw_dir / 'silence_latent.pt', map_location='cpu', weights_only=True).transpose(1, 2).float()[:, :750].contiguous()
converted.null_condition_emb = nn.Parameter(torch.zeros(1, 1, config.hidden_size), requires_grad=False)
converted.silence_latent = silence; converted.eval()
cases = []
for padding in [0, 17]:
    inputs = dict(text_hidden_states=F.pad(text_hs, (0, 0, 0, padding)),
                  text_attention_mask=F.pad(text.attention_mask.bool(), (0, padding)),
                  lyric_hidden_states=F.pad(lyric_hs, (0, 0, 0, padding)),
                  lyric_attention_mask=F.pad(lyrics.attention_mask.bool(), (0, padding)),
                  refer_audio_acoustic_hidden_states_packed=silence,
                  refer_audio_order_mask=torch.tensor([0]))
    with torch.inference_mode():
        reference, reference_mask = native(**inputs)
        observed, observed_mask = converted(**inputs)
    assert torch.isfinite(reference).all() and torch.isfinite(observed).all()
    valid = reference_mask.bool()
    relative = float(torch.linalg.vector_norm((reference-observed)[valid]) / torch.linalg.vector_norm(reference[valid]))
    cases.append({'paddingTokens': padding, 'shape': list(reference.shape),
                  'validTokens': int(valid.sum()), 'masksEqual': bool(torch.equal(reference_mask, observed_mask)),
                  'relativeRmse': relative, 'passed': torch.equal(reference_mask, observed_mask) and relative < .001})
report = dict(preflight, officialSourceRevision='ca1e85fe9430179831e6bc6be790c332190a3866',
              sourceHashes=expected, rawWeightsSha256=raw_hash.hexdigest(),
              specSha256=hashlib.sha256(a.spec.read_bytes()).hexdigest(),
              textTokenCount=text.input_ids.shape[1], lyricTokenCount=lyrics.input_ids.shape[1],
              actualCaptionForward=True, actualKoreanLyricEmbedding=True,
              sameWeightsSharedAcrossModels=True, cases=cases, seconds=time.perf_counter()-start,
              passed=all(case['passed'] for case in cases),
              limits=['Selected official current Base condition declarations, not the full native music pipeline',
                      'Actual caption/lyric inputs and silence reference; no lyric timing, harmony, voice or catalog approval'])
a.output.parent.mkdir(parents=True, exist_ok=True)
a.output.write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report), flush=True)
if not report['passed']: raise SystemExit(2)
