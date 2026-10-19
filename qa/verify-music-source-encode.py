"""Isolate actual source VAE encoding without loading the music transformer.

Run under run-ai-resource-guard.ps1. This diagnoses resources, not music quality.
"""
import argparse
import hashlib
import json
import time
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--pipeline-dir', type=Path, required=True)
parser.add_argument('--source-song', type=Path, required=True)
parser.add_argument('--source-start', type=float, required=True)
parser.add_argument('--duration', type=float, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
def file_sha256(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

assert not args.output.exists(), 'Preserve previous evidence'
assert 0 <= args.source_start and 0 < args.duration <= 8, 'Bound this diagnostic to eight seconds'
report = json.loads((args.source_song / 'song-generation-report.json').read_text(encoding='utf-8'))
source = args.source_song / 'ieum-original-song.wav'
assert report['status'] == 'actual-model-inference'
source_sha = file_sha256(source)
assert source_sha == report['outputSha256'], 'Use the unchanged actual generated source'
weights = list((args.pipeline_dir / 'vae').glob('*.safetensors'))
assert len(weights) == 1 and weights[0].stat().st_size < 1024**3, 'Load only a bounded local VAE'
weights_sha = file_sha256(weights[0])

import numpy as np
import soundfile as sf
import torch
from diffusers import AutoencoderOobleck
from diffusers.hooks import apply_group_offloading
from torch.nn.utils.weight_norm import WeightNorm

torch.set_num_threads(4)
assert torch.cuda.is_available(), 'Actual CUDA execution is required'
samples, rate = sf.read(source, dtype='float32', always_2d=True)
assert rate == 48000 and samples.shape[1] == 2 and np.isfinite(samples).all()
left = round(args.source_start * rate)
right = round((args.source_start + args.duration) * rate)
assert right <= len(samples)
window = np.ascontiguousarray(samples[left:right].T)
del samples
audio = torch.from_numpy(window).unsqueeze(0)
started = time.monotonic()
print(json.dumps({'phase': 'loading-source-vae', 'inputShape': list(audio.shape)}), flush=True)
vae = AutoencoderOobleck.from_pretrained(args.pipeline_dir / 'vae', torch_dtype=torch.float32, local_files_only=True)
assert vae.sampling_rate == rate
normalized = 0
for module in vae.modules():
    if hasattr(module, 'weight_g') and hasattr(module, 'weight_v'):
        hook = next(h for h in module._forward_pre_hooks.values() if isinstance(h, WeightNorm) and h.name == 'weight')
        reference = hook.compute_weight(module).detach().clone()
        torch.nn.utils.remove_weight_norm(module)
        assert torch.equal(reference, module.weight.detach())
        normalized += 1
vae.use_tiling = True
apply_group_offloading(vae, onload_device=torch.device('cuda'), offload_device=torch.device('cpu'), offload_type='leaf_level', use_stream=False)
torch.cuda.reset_peak_memory_stats()
print(json.dumps({'phase': 'source-encode-start', 'tileThresholdSeconds': vae.tile_sample_min_length / rate,
                  'encodeTilingActive': audio.shape[-1] > vae.tile_sample_min_length}), flush=True)
encode_started = time.monotonic()
with torch.inference_mode():
    posterior = vae.encode(audio.to('cuda')).latent_dist
    mean = posterior.mean.detach().cpu().contiguous()
torch.cuda.synchronize()
assert torch.isfinite(mean).all() and mean.shape[-1] > 0
result = {'sourceSha256': source_sha, 'sourceWindow': {'start': args.source_start, 'duration': args.duration},
          'vaeWeightsSha256': weights_sha,
          'inputShape': list(audio.shape), 'meanShape': list(mean.shape),
          'meanSha256': hashlib.sha256(mean.numpy().tobytes()).hexdigest(),
          'normalizedWeightModules': normalized,
          'tileThresholdSeconds': vae.tile_sample_min_length / rate,
          'encodeTilingActive': audio.shape[-1] > vae.tile_sample_min_length,
          'encodeSeconds': time.monotonic() - encode_started, 'wallSeconds': time.monotonic() - started,
          'gpuPeakAllocatedBytes': torch.cuda.max_memory_allocated(), 'gpuPeakReservedBytes': torch.cuda.max_memory_reserved(),
          'transformerLoaded': False, 'conditionEncoderLoaded': False, 'musicGenerated': False,
          'limitations': ['Isolated VAE resources do not prove full pipeline RAM safety',
                         'Posterior mean is diagnostic; native sampling and music quality are not validated']}
args.output.write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps({'phase': 'source-encode-complete', **result}), flush=True)
