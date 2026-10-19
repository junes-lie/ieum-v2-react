"""Offline personal conditioning experiment on preserved public singing inputs.

Reuses the existing P0 model and prompts. Does not publish an avatar, change
visual design, access user storage, or assert perceptual identity recognition.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time

parser = argparse.ArgumentParser()
parser.add_argument('--runtime', type=Path, required=True)
parser.add_argument('--report', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--repeat-report', type=Path)
args = parser.parse_args()
runtime = args.runtime.resolve()
output = args.output.resolve()
output.mkdir(parents=True, exist_ok=False)  # Never overwrite previous results.
os.environ['HF_HOME'] = str(runtime / 'model-cache')
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
os.environ['HF_HUB_OFFLINE'] = '1'

import numpy as np
import torch
from diffusers import AutoPipelineForText2Image

report = json.loads(args.report.read_text(encoding='utf-8'))
assert report['speakerConditioning']['dimensions'] == 1000
sources = report['sources']
assert len(sources) == 4
contract = (Path(__file__).resolve().parent.parent / 'src/voiceIdentityContract.js').as_uri()
node_code = '''
import fs from 'node:fs';
const {buildIdentityInputManifest}=await import(process.argv[1]);
const input=JSON.parse(fs.readFileSync(0,'utf8'));
console.log(JSON.stringify(await buildIdentityInputManifest(input)));
'''
manifests = []
for index, source in enumerate(sources):
    path = Path(source['path'])
    source_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    assert source_hash == next(result['sourceSha256'] for result in report['results'] if result['sourceIndex'] == index)
    value = {'userId':f'private-evaluation-person-{index}', 'profileRevision':'evaluation-profile-1',
             'generatorVersion':'ieum-personal-model-probe-v1',
             'sources':[{'recordId':f'evaluation-sample-{index}', 'purpose':'voice-sample',
                         'sha256':source_hash, 'analysisVersion':source['analysis']['features']['version'],
                         'data':source['analysis']['features']}]}
    manifest = json.loads(subprocess.check_output(['node','--input-type=module','-e',node_code,contract],input=json.dumps(value),text=True,encoding='utf-8'))
    manifests.append(manifest)

# Same measured profile with a different user isolates the user conditioning.
other_input = {key:manifests[0][key] for key in ['userId','profileRevision','generatorVersion','sources']}
other_input['userId'] = 'private-evaluation-other-person'
other_manifest = json.loads(subprocess.check_output(['node','--input-type=module','-e',node_code,contract],input=json.dumps(other_input),text=True,encoding='utf-8'))

torch.set_num_threads(min(8, os.cpu_count() or 1))
torch.use_deterministic_algorithms(True)
print(json.dumps({'phase':'load-pinned-local-model','model':report['model'],'revision':report['revision']}),flush=True)
pipeline = AutoPipelineForText2Image.from_pretrained(report['model'],revision=report['revision'],
    torch_dtype=torch.float32,variant='fp16',use_safetensors=True,local_files_only=True)
pipeline.to('cpu')
pipeline.enable_attention_slicing()
vectors = torch.tensor(report['speakerConditioning']['vectors'],dtype=torch.float32)
results, grayscale, latents = [], [], []
cases = [(0,manifests[0]),(0,manifests[0]),*[(index,manifests[index]) for index in range(1,4)],(0,other_manifest)]
if args.repeat_report:
    cases = cases[:2]
for case_index, (source_index, manifest) in enumerate(cases):
    started = time.perf_counter()
    seed = int(manifest['inputDigest'][:16],16) % (2**63-1)
    noise = torch.randn((1,4,64,64),generator=torch.Generator('cpu').manual_seed(seed))
    projection = torch.randn((1000,4*64*64),generator=torch.Generator('cpu').manual_seed(65347))
    voice_noise = (vectors[source_index] @ projection).reshape(1,4,64,64)
    conditioned = (.9375**.5)*noise + .25*voice_noise
    with torch.inference_mode():
        latent = pipeline(prompt=sources[source_index]['prompt'],height=512,width=512,
            num_inference_steps=1,guidance_scale=0.0,latents=conditioned,
            generator=torch.Generator('cpu').manual_seed(seed),output_type='latent').images
        decoded = pipeline.vae.decode(latent / pipeline.vae.config.scaling_factor,return_dict=False)[0]
    image = pipeline.image_processor.postprocess(decoded,output_type='pil')[0]
    gray = np.asarray(image.convert('L'),dtype=np.float32) / 255
    # Edge maps assess non-colour structure, not recognisable personal identity.
    edges = np.hypot(*np.gradient(gray))
    image_path = output / f'personal-case-{case_index}.png'
    image.save(image_path)
    latents.append(latent.detach().clone())
    grayscale.append(gray)
    result = {'case':case_index,'sourceIndex':source_index,'inputDigest':manifest['inputDigest'],
              'sourceSha256':manifest['sources'][0]['sha256'],'inferenceSeed':str(seed),
              'path':str(image_path),'outputSha256':hashlib.sha256(image_path.read_bytes()).hexdigest(),
              'pixelsSha256':hashlib.sha256(image.tobytes()).hexdigest(),
              'graySha256':hashlib.sha256(gray.tobytes()).hexdigest(),
              'edgeSha256':hashlib.sha256(edges.tobytes()).hexdigest(),
              'seconds':round(time.perf_counter()-started,3)}
    results.append(result)
    print(json.dumps(result),flush=True)
assert results[0]['pixelsSha256'] == results[1]['pixelsSha256']
assert results[0]['graySha256'] == results[1]['graySha256']
unique_cases = [0,2,3,4,5]
if args.repeat_report:
    baseline = json.loads(args.repeat_report.read_text(encoding='utf-8'))
    assert results[0]['inputDigest'] == baseline['results'][0]['inputDigest']
    assert results[0]['pixelsSha256'] == baseline['results'][0]['pixelsSha256']
    assert results[0]['edgeSha256'] == baseline['results'][0]['edgeSha256']
else:
    assert len({results[index]['edgeSha256'] for index in unique_cases}) == 5
comparisons = [{'cases':[0,index], 'grayRmse':float(np.sqrt(np.mean((grayscale[0]-grayscale[index])**2)))} for index in ([2,3,4,5] if not args.repeat_report else [])]
for comparison in comparisons:
    assert comparison['grayRmse'] > .01, 'Negligible grayscale distinction'
for index, latent in enumerate(latents):
    torch.save(latent,output / f'personal-case-{index}.pt')
# User mapping is private and stays outside the repository/public assets.
(output/'private-inputs.json').write_text(json.dumps(manifests+[other_manifest],ensure_ascii=False,indent=2),encoding='utf-8')
result_report = {'generatorVersion':'ieum-personal-model-probe-v1','model':report['model'],
    'revision':report['revision'],'torchVersion':torch.__version__,'device':'cpu',
    'sameInputPixels':True,'freshProcessRepeatPixels':True if args.repeat_report else None,
    'differentUsersNonColourStructure':True if not args.repeat_report else None,'comparisons':comparisons,'results':results,
    'limitations':['diagnostic probe; not chosen visual design','no learned audio-image adapter',
                  'no perceptual personal recognition acceptance','Track identity preservation and Project blends not tested here',
                  'no production inference or UI integration']}
(output/'personal-identity-model-report.json').write_text(json.dumps(result_report,ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS actual model fresh-process repeat pixels' if args.repeat_report else 'PASS actual model repeat pixels and different-user grayscale structure; perceptual and Track continuity gates remain open',flush=True)
