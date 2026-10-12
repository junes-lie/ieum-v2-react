"""Actual CUDA prompt output survives release of its one-shot text model."""
import argparse
import hashlib
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--pipeline-dir', type=Path, required=True)
parser.add_argument('--spec', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
assert not args.output.exists(), 'Preserve previous evidence'
spec = json.loads(args.spec.read_text(encoding='utf-8'))
import torch
from low_ram_music_init import encode_cuda_prompt_once

torch.set_num_threads(4)
torch.cuda.empty_cache()
before = torch.cuda.memory_allocated()
encoded = encode_cuda_prompt_once(args.pipeline_dir, spec, spec['lyrics'], 8, 'lego')
torch.cuda.synchronize()
after = torch.cuda.memory_allocated()
assert 0 <= after - before < 64 * 1024**2, 'One-shot text model must not remain allocated'
assert all(value.device.type == 'cuda' for value in encoded)
assert all(torch.isfinite(value).all() for value in encoded if value.is_floating_point())
outputs = [{'shape': list(value.shape), 'dtype': str(value.dtype),
            'sha256': hashlib.sha256(value.detach().cpu().contiguous().numpy().tobytes()).hexdigest()} for value in encoded]
report = {'allocatedBeforeBytes': before, 'allocatedAfterBytes': after,
          'reservedAfterBytes': torch.cuda.memory_reserved(), 'outputs': outputs,
          'specSha256': hashlib.sha256(args.spec.read_bytes()).hexdigest(),
          'textModelReleased': True, 'outputsFinite': True, 'musicGenerated': False}
args.output.write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report), flush=True)
