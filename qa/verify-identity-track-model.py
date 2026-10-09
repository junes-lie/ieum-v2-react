"""Actual VAE experiment preserving personal latents while varying real Track audio.
Diagnostic mapping, not a trained audio-image adapter or chosen UI design.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--runtime',type=Path,required=True)
parser.add_argument('--personal',type=Path,required=True)
parser.add_argument('--sources',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
parser.add_argument('--blend-source',type=Path)
args = parser.parse_args()
output = args.output.resolve()
output.mkdir(parents=True,exist_ok=False)
os.environ['HF_HOME'] = str(args.runtime.resolve()/'model-cache')
os.environ['HF_HUB_OFFLINE'] = '1'

import numpy as np
import soundfile as sf
import torch
from PIL import Image
from diffusers import AutoencoderKL

torch.set_num_threads(min(8,os.cpu_count() or 1))
torch.use_deterministic_algorithms(True)
personal = json.loads((args.personal/'personal-identity-model-report.json').read_text(encoding='utf-8'))
source_report = json.loads(args.sources.read_text(encoding='utf-8'))
vae = AutoencoderKL.from_pretrained(personal['model'],subfolder='vae',revision=personal['revision'],variant='fp16',torch_dtype=torch.float32,local_files_only=True)
root = Path(__file__).resolve().parent.parent
node_code = '''
import fs from 'node:fs';
const {analyzeAudioBuffer}=await import(process.argv[1]);
const {buildTrackIdentityInput}=await import(process.argv[2]);
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const bytes=fs.readFileSync(input.pcm);
const pcm=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const features=analyzeAudioBuffer({sampleRate:input.sampleRate,duration:pcm.length/input.sampleRate,getChannelData:()=>pcm});
const manifest=await buildTrackIdentityInput({trackId:input.trackId,identityRef:input.identityRef,generatorVersion:'ieum-track-model-probe-v1',source:{recordId:input.trackId,purpose:'project-track',sha256:input.sha256,analysisVersion:features.version,data:features}});
console.log(JSON.stringify({features,manifest}));
'''
indices = [0,2,3,4]
originals, transformed, artifacts = [], [], []
def gray(latent):
    with torch.inference_mode():
        decoded = vae.decode(latent / vae.config.scaling_factor,return_dict=False)[0]
    pixels = (decoded[0].clamp(-1,1).permute(1,2,0).numpy()+1)*127.5
    image = Image.fromarray(pixels.round().clip(0,255).astype(np.uint8))
    return image,np.asarray(image.convert('L'),dtype=np.float32)/255

if args.blend_source:
    previous = json.loads((args.blend_source/'identity-track-model-report.json').read_text(encoding='utf-8'))
    layers = []
    for index, artifact in enumerate(previous['artifacts']):
        assert hashlib.sha256(Path(artifact['path']).read_bytes()).hexdigest() == artifact['outputSha256']
        layers.append(torch.load(args.blend_source/f'track-layer-{index}.pt',map_location='cpu',weights_only=True))
    original_hashes = [hashlib.sha256(layer.numpy().tobytes()).hexdigest() for layer in layers]
    comparisons = []
    for count in [2,3,4]:
        stacked = torch.stack(layers[:count])
        # Spatial weight comes from generated voice fields, not fixed sectors.
        strength = stacked.square().mean(dim=2,keepdim=True).sqrt()
        weights = torch.softmax(strength*3,dim=0)
        candidate = (stacked*weights).sum(dim=0)
        image,candidate_gray = gray(candidate)
        _,mean_gray = gray(stacked.mean(dim=0))
        repeated,_ = gray((stacked*torch.softmax(strength*3,dim=0)).sum(dim=0))
        assert image.tobytes() == repeated.tobytes()
        assert original_hashes == [hashlib.sha256(layer.numpy().tobytes()).hexdigest() for layer in layers]
        path = output/f'activation-blend-{count}.png'
        image.save(path)
        comparison = {'partCount':count,'path':str(path),'outputSha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'meanContrastStd':float(mean_gray.std()),'candidateContrastStd':float(candidate_gray.std()),
            'layerWeightMeans':weights.mean(dim=(1,2,3,4)).tolist(),
            'dominantPixelRatios':[(weights.argmax(dim=0)==index).float().mean().item() for index in range(count)],
            'repeatPixels':True,'originalLayersPreserved':True,'latentSha256':original_hashes[:count]}
        comparisons.append(comparison)
        print(json.dumps(comparison),flush=True)
    (output/'blend-comparison-report.json').write_text(json.dumps({'method':'whole-plane actual latent activation weighting',
        'model':personal['model'],'revision':personal['revision'],'comparisons':comparisons,
        'limitations':['contrast improvement is not participant recognition','no selected design or production integration',
        'Project Seed linkage and perceptual acceptance remain unverified']},ensure_ascii=False,indent=2),encoding='utf-8')
    raise SystemExit(0)

for person_index, case_index in enumerate(indices):
    base_result = personal['results'][case_index]
    base = torch.load(args.personal/f'personal-case-{case_index}.pt',map_location='cpu',weights_only=True)
    base_hash = hashlib.sha256(base.numpy().tobytes()).hexdigest()
    track_path = Path(source_report['sources'][person_index]['path'].replace('_a.wav','_e.wav'))
    assert track_path.exists(), 'A separate real recording from the same singer is required'
    track_sha = hashlib.sha256(track_path.read_bytes()).hexdigest()
    assert track_sha != base_result['sourceSha256']
    samples,rate = sf.read(track_path,dtype='float32',always_2d=True)
    pcm_path = output/f'track-{person_index}.f32'
    pcm_path.write_bytes(np.ascontiguousarray(samples.mean(axis=1),dtype='<f4').tobytes())
    value = {'pcm':str(pcm_path),'sampleRate':rate,'sha256':track_sha,'trackId':f'evaluation-track-{person_index}',
             'identityRef':{'id':f'opaque-evaluation-{person_index}','revision':'evaluation-1','outputSha256':base_result['outputSha256']}}
    analysis = json.loads(subprocess.check_output(['node','--input-type=module','-e',node_code,(root/'src/voiceAnalysis.js').as_uri(),(root/'src/voiceIdentityContract.js').as_uri()],input=json.dumps(value),text=True,encoding='utf-8'))
    features = analysis['features']
    # Entire-plane modulation; no participant quadrants or ring allocation.
    envelope = torch.tensor(features['envelope'],dtype=torch.float32)
    envelope = torch.nn.functional.interpolate(envelope[None,None,:],size=64,mode='linear',align_corners=False)[0,0]
    x = torch.linspace(0,2*np.pi,64)
    y = torch.linspace(0,2*np.pi,64)
    field = torch.sin(x[None,:]*(1+features['brightness'])) * torch.cos(y[:,None]*(1+features['roughness']))
    modulation = field[None,None,:,:]*(.04+.08*features['dynamicRange']) + envelope[None,None,None,:]*.06
    changed = base + modulation
    assert hashlib.sha256(base.numpy().tobytes()).hexdigest() == base_hash
    base_image,base_gray = gray(base)
    image,track_gray = gray(changed)
    repeat_image,_ = gray(base+modulation)
    assert image.tobytes() == repeat_image.tobytes()
    correlation = float(np.corrcoef(base_gray.ravel(),track_gray.ravel())[0,1])
    rmse = float(np.sqrt(np.mean((base_gray-track_gray)**2)))
    assert correlation > .9, 'Numerical structure preservation failed'
    assert rmse > .0001, 'Actual Track did not change output'
    path = output/f'track-layer-{person_index}.png'
    image.save(path)
    torch.save(changed,output/f'track-layer-{person_index}.pt')
    transformed.append(changed)
    originals.append(base_hash)
    artifacts.append({'personIndex':person_index,'sourceSha256':track_sha,'identityRef':analysis['manifest']['identityRef'],
        'trackInputDigest':analysis['manifest']['inputDigest'],'path':str(path),'outputSha256':hashlib.sha256(path.read_bytes()).hexdigest(),
        'baseCorrelation':correlation,'grayRmse':rmse,'repeatPixels':True,'features':features})
    print(json.dumps({key:value for key,value in artifacts[-1].items() if key!='features'}),flush=True)
blends = []
layer_hashes = [hashlib.sha256(layer.numpy().tobytes()).hexdigest() for layer in transformed]
for count in [2,3,4]:
    image,_ = gray(torch.stack(transformed[:count]).mean(dim=0))
    path = output/f'project-blend-{count}.png'
    image.save(path)
    repeat,_ = gray(torch.stack(transformed[:count]).mean(dim=0))
    assert image.tobytes() == repeat.tobytes()
    assert layer_hashes == [hashlib.sha256(layer.numpy().tobytes()).hexdigest() for layer in transformed]
    blends.append({'partCount':count,'path':str(path),'outputSha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                   'layerRefs':[artifact['outputSha256'] for artifact in artifacts[:count]],'repeatPixels':True,'originalLayersPreserved':True})
    print(json.dumps(blends[-1]),flush=True)
report = {'generatorVersion':'ieum-track-model-probe-v1','model':personal['model'],'revision':personal['revision'],
    'method':'real Track spectral/envelope modulation of saved personal model latent; actual VAE decoding',
    'artifacts':artifacts,'blends':blends,'limitations':['numerical correlation is not human identification acceptance',
    'mean latent combination can obscure individual traces; perceptual blend acceptance remains open',
    'no trained audio-image adapter or production inference','not chosen visual design or completed Project']}
(output/'identity-track-model-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS numerical personal-latent preservation, real alternate Track modulation, repeat decoding, 2–4 actual VAE blends',flush=True)
