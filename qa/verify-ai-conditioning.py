"""Verify learned audio conditioning provenance against the actual cached model."""
import argparse
import json
import os
from pathlib import Path
import truststore
truststore.inject_into_ssl()
parser=argparse.ArgumentParser()
parser.add_argument('--runtime',required=True)
args=parser.parse_args()
runtime=Path(args.runtime).resolve()
os.environ['HF_HOME']=str(runtime/'model-cache')
import numpy as np
import soundfile as sf
import torch
from huggingface_hub import hf_hub_download
torch.set_num_threads(min(8,os.cpu_count() or 1))
torch.use_deterministic_algorithms(True)
report=json.loads((runtime/'results/ai-singing-voice-layer-report.json').read_text(encoding='utf-8'))
conditioning=report['speakerConditioning']
assert conditioning and len(conditioning['vectors'])==4
checkpoint=hf_hub_download(conditioning['model'],'byol/model.ts',revision=conditioning['revision'],local_files_only=True)
with open(checkpoint,'rb') as checkpoint_file:
    model=torch.jit.load(checkpoint_file,map_location='cpu').eval()
computed=[]
for source,saved_vector in zip(report['sources'],conditioning['vectors'],strict=True):
    samples,rate=sf.read(source['path'],dtype='float32',always_2d=True)
    assert rate==44100
    waveform=torch.from_numpy(np.ascontiguousarray(samples.mean(axis=1))).unsqueeze(0)
    with torch.inference_mode():
        first=torch.nn.functional.normalize(model(waveform),dim=-1)[0]
        repeated=torch.nn.functional.normalize(model(waveform),dim=-1)[0]
    assert torch.allclose(first,repeated,atol=1e-6),'Same input embedding repeat changed'
    assert torch.allclose(first,torch.tensor(saved_vector),atol=1e-6),'Saved conditioning differs from actual model'
    computed.append(first)
assert len({vector.numpy().tobytes() for vector in computed})==4
assert report['sameInputSameSeedPixels'] and report['differentInputDifferentPixels']
print('PASS four actual singing inputs: learned embedding provenance/repeat/distinction and actual diffusion result lineage')
