"""Actual speaker-model evaluation on independently recorded VocalSet vowels.

Small feasibility sample only, never a product score or population accuracy claim.
"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import time
import truststore
truststore.inject_into_ssl()
parser = argparse.ArgumentParser()
parser.add_argument('--runtime', required=True)
parser.add_argument('--model', choices=['wavlm','singer-byol','singer-contrastive'], default='wavlm')
args = parser.parse_args()
runtime = Path(args.runtime).resolve()
os.environ['HF_HOME'] = str(runtime/'model-cache')
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
import torch
from transformers import Wav2Vec2FeatureExtractor, WavLMForXVector

torch.set_num_threads(min(8, os.cpu_count() or 1))
torch.use_deterministic_algorithms(True)
if args.model == 'wavlm':
    model_id = 'microsoft/wavlm-base-plus-sv'
    revision = 'feb593a6c23c1cc3d9510425c29b0a14d2b07b1e'
    input_rate = 16000
    extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_id, revision=revision, local_files_only=True)
    model = WavLMForXVector.from_pretrained(model_id, revision=revision, local_files_only=True).eval()
else:
    from huggingface_hub import hf_hub_download
    model_id = 'BernardoTorres/singer-identity'
    revision = '55e09cdfcd733b1c01f2b94f316a0280995a909e'
    input_rate = 44100
    variant = args.model.removeprefix('singer-')
    checkpoint = hf_hub_download(model_id, f'{variant}/model.ts', revision=revision)
    # PyTorch's native filename loader rejects Korean Windows paths; its supported
    # binary file-object loader reads the same official cached checkpoint.
    with open(checkpoint, 'rb') as checkpoint_file:
        model = torch.jit.load(checkpoint_file, map_location='cpu').eval()
manifest = json.loads((runtime/'results/vocalset/source-manifest.json').read_text(encoding='utf-8'))
vectors = []
started = time.perf_counter()
for entry in manifest['files']:
    path = Path(entry['path'])
    assert hashlib.sha256(path.read_bytes()).hexdigest() == entry['sha256']
    samples, rate = sf.read(path, dtype='float32', always_2d=True)
    divisor = math.gcd(rate, input_rate)
    mono = np.ascontiguousarray(resample_poly(samples.mean(axis=1), input_rate//divisor, rate//divisor), dtype=np.float32)
    # Keep real original durations, no rate relabeling or synthetic voice replacement.
    with torch.inference_mode():
        if args.model == 'wavlm':
            inputs = extractor(mono, sampling_rate=input_rate, return_tensors='pt')
            raw_vector = model(**inputs).embeddings
        else:
            raw_vector = model(torch.from_numpy(mono).unsqueeze(0))
        vector = torch.nn.functional.normalize(raw_vector, dim=-1).cpu()[0]
    vectors.append(vector)
    print(json.dumps({'phase':'embedded','member':entry['member'],'originalRate':rate,
        'inputRate':input_rate,'seconds':len(mono)/input_rate}), flush=True)
similarity = torch.stack(vectors) @ torch.stack(vectors).T
same, different, matches = [], [], []
for index, entry in enumerate(manifest['files']):
    peers = [other for other, candidate in enumerate(manifest['files']) if other != index and candidate['singer'] == entry['singer']]
    others = [other for other, candidate in enumerate(manifest['files']) if candidate['singer'] != entry['singer']]
    same.append(float(similarity[index, peers[0]]))
    different.extend(float(similarity[index, other]) for other in others)
    candidates = [other for other in range(len(vectors)) if other != index]
    nearest = max(candidates, key=lambda other:float(similarity[index,other]))
    matches.append({'member':entry['member'],'nearest':manifest['files'][nearest]['member'],
        'sameSinger':manifest['files'][nearest]['singer'] == entry['singer']})
report = {'model':model_id,'revision':revision,'dataset':manifest['doi'],'license':manifest['license'],
    'seconds':round(time.perf_counter()-started,3),'files':manifest['files'],
    'similarity':similarity.tolist(),'meanSameSinger':float(np.mean(same)),
    'meanDifferentSinger':float(np.mean(different)),'nearestMatches':matches,
    'allNearestMatchesSameSinger':all(item['sameSinger'] for item in matches),
    'limitations':['four singers, two vowels each, one dataset only',
        'speaker model not trained/validated here for general singing identity',
        'no public score, no production model adoption, no diffusion identity guarantee']}
(runtime/f'results/singing-{args.model}-probe-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({key:value for key,value in report.items() if key not in ['files','similarity']}),flush=True)
assert report['meanSameSinger'] > report['meanDifferentSinger'], 'Same-singer distinction did not hold on this sample'
assert report['allNearestMatchesSameSinger'], 'Independent-vowel nearest-singer test failed on this sample'
print('PASS actual singing input / independent vowel speaker feasibility probe',flush=True)
