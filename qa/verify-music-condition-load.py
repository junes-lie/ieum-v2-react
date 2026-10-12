"""Actual bounded condition loading, with no transformer or music inference."""
import argparse
import hashlib
import json
import time
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--pipeline-dir', type=Path, required=True)
parser.add_argument('--lineage', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
assert not args.output.exists(), 'Preserve previous evidence'
lineage = json.loads(args.lineage.read_text(encoding='utf-8'))
expected = lineage['componentHashes']['condition_encoder/diffusion_pytorch_model.safetensors']
config = args.pipeline_dir / 'condition_encoder/config.json'
assert hashlib.sha256(config.read_bytes()).hexdigest() == lineage['componentHashes']['condition_encoder/config.json']
import torch
from diffusers import AceStepConditionEncoder
from music_cuda_checkpoint import load_bounded_fp32_model

torch.set_num_threads(4)
torch.cuda.reset_peak_memory_stats()
started = time.monotonic()
model, report = load_bounded_fp32_model(AceStepConditionEncoder, config.parent, expected)
report.update(seconds=time.monotonic() - started, gpuPeakAllocatedBytes=torch.cuda.max_memory_allocated(),
              gpuPeakReservedBytes=torch.cuda.max_memory_reserved(),
              transformerLoaded=False, musicGenerated=False, conditionForwardExecuted=False)
args.output.write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report), flush=True)
