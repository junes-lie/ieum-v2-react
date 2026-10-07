"""Local P0 inference experiment. No app, browser, account, or user DB access.

Outputs are diagnostic only; this is not proof of singing timbre accuracy,
mobile inference, production service integration, or Figma fidelity.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.request
import truststore

truststore.inject_into_ssl()

parser = argparse.ArgumentParser()
parser.add_argument('--runtime', required=True)
parser.add_argument('--audio', type=Path)
parser.add_argument('--compare-audio', type=Path)
parser.add_argument('--seed', type=int, default=65346)
parser.add_argument('--additional-audio', type=Path, action='append', default=[])
parser.add_argument('--singer-conditioning', action='store_true')
args = parser.parse_args()
runtime = Path(args.runtime).resolve()
outputs = runtime / 'results'
outputs.mkdir(parents=True, exist_ok=True)
os.environ['HF_HOME'] = str(runtime / 'model-cache')
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
source_url = 'https://download.pytorch.org/torchaudio/tutorial-assets/Lab41-SRI-VOiCES-src-sp0307-ch127535-sg0042.wav'
audio_path = args.audio or outputs / 'public-speech.wav'
if not audio_path.exists() and not args.audio:
    urllib.request.urlretrieve(source_url, audio_path)

import numpy as np
import soundfile as sf
import torch
from diffusers import AutoPipelineForText2Image

samples, sample_rate = sf.read(audio_path, dtype='float32', always_2d=True)
mono = np.ascontiguousarray(samples.mean(axis=1), dtype='<f4')
pcm_path = outputs / 'speech.f32'
pcm_path.write_bytes(mono.tobytes())
module_url = (Path(__file__).resolve().parent.parent / 'src' / 'voiceAnalysis.js').as_uri()
node_code = '''
import fs from 'node:fs';
const {analyzeAudioBuffer,buildVoiceLayer}=await import(process.argv[1]);
const bytes=fs.readFileSync(process.argv[2]);
const pcm=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const sampleRate=Number(process.argv[3]);
const features=analyzeAudioBuffer({sampleRate,duration:pcm.length/sampleRate,getChannelData:()=>pcm});
console.log(JSON.stringify({features,layer:buildVoiceLayer('ieum:p0:real-speech','tenor',features)}));
'''
analysis = json.loads(subprocess.check_output(['node','--input-type=module','-e',node_code,module_url,str(pcm_path),str(sample_rate)], text=True, encoding='utf-8'))
features = analysis['features']
def feature_prompt(value):
    return ('abstract organic flowing voice filaments on a warm black background, '
          f"{'fine luminous blue' if value['brightness'] > .3 else 'soft deep cream'} strands, "
          f"{'dense energetic' if value['energy'] > .4 else 'sparse delicate'} particles, "
          f"{'turbulent' if value['roughness'] > .4 else 'smooth'} continuous curves, "
          f"brightness {value['brightness']:.4f}, energy {value['energy']:.4f}, "
          f"spectral roughness {value['roughness']:.4f}, articulation {value['articulation']:.4f}, no text")
prompt = feature_prompt(features)
compare_url = 'https://download.pytorch.org/torchaudio/tutorial-assets/ctc-decoding/1688-142285-0007.wav'
compare_path = args.compare_audio or outputs/'public-speech-comparison.wav'
if not compare_path.exists() and not args.compare_audio:
    urllib.request.urlretrieve(compare_url,compare_path)
compare_samples, compare_rate = sf.read(compare_path,dtype='float32',always_2d=True)
compare_pcm = outputs/'speech-comparison.f32'
compare_pcm.write_bytes(np.ascontiguousarray(compare_samples.mean(axis=1),dtype='<f4').tobytes())
compare_analysis = json.loads(subprocess.check_output(['node','--input-type=module','-e',node_code,module_url,str(compare_pcm),str(compare_rate)],text=True,encoding='utf-8'))
compare_prompt = feature_prompt(compare_analysis['features'])
assert len(args.additional_audio) <= 2, 'P0 supports at most four source layers'
sources = [(audio_path, analysis, prompt), (compare_path, compare_analysis, compare_prompt)]
for index, path in enumerate(args.additional_audio):
    extra_samples, extra_rate = sf.read(path, dtype='float32', always_2d=True)
    extra_pcm = outputs / f'additional-{index}.f32'
    extra_pcm.write_bytes(np.ascontiguousarray(extra_samples.mean(axis=1), dtype='<f4').tobytes())
    extra_analysis = json.loads(subprocess.check_output(
        ['node', '--input-type=module', '-e', node_code, module_url, str(extra_pcm), str(extra_rate)],
        text=True, encoding='utf-8'))
    sources.append((path, extra_analysis, feature_prompt(extra_analysis['features'])))
assert features['fingerprint'] != compare_analysis['features']['fingerprint']
assert prompt != compare_prompt
model_id = 'stabilityai/sd-turbo'
revision = 'b261bac6fd2cf515557d5d0707481eafa0485ec2'
speaker_vectors = []
speaker_metadata = None
if args.singer_conditioning:
    from huggingface_hub import hf_hub_download
    from scipy.signal import resample_poly
    import math
    speaker_id = 'BernardoTorres/singer-identity'
    speaker_revision = '55e09cdfcd733b1c01f2b94f316a0280995a909e'
    checkpoint = hf_hub_download(speaker_id, 'byol/model.ts', revision=speaker_revision, local_files_only=True)
    with open(checkpoint,'rb') as checkpoint_file:
        speaker_model = torch.jit.load(checkpoint_file, map_location='cpu').eval()
    torch.set_num_threads(min(8, os.cpu_count() or 1))
    for path, _, _ in sources:
        pcm, rate = sf.read(path,dtype='float32',always_2d=True)
        divisor = math.gcd(rate,44100)
        waveform = np.ascontiguousarray(resample_poly(pcm.mean(axis=1),44100//divisor,rate//divisor),dtype=np.float32)
        with torch.inference_mode():
            vector = torch.nn.functional.normalize(speaker_model(torch.from_numpy(waveform).unsqueeze(0)),dim=-1)[0].cpu()
        speaker_vectors.append(vector)
    speaker_metadata = {'model':speaker_id,'revision':speaker_revision,'variant':'byol',
        'dimensions':len(speaker_vectors[0]),'method':'fixed project-seed Gaussian projection into initial diffusion noise',
        'vectors':[vector.tolist() for vector in speaker_vectors],
        'limitation':'not a trained audio-image adaptor or reliable singer identification system'}
print(json.dumps({'phase':'load-model','model':model_id,'revision':revision,'sourceFingerprint':features['fingerprint'],'prompt':prompt}), flush=True)
torch.set_num_threads(min(8, os.cpu_count() or 1))
torch.use_deterministic_algorithms(True)
pipeline = AutoPipelineForText2Image.from_pretrained(model_id, revision=revision,
    torch_dtype=torch.float32, variant='fp16', use_safetensors=True)
pipeline.to('cpu')
pipeline.enable_attention_slicing()
results = []
latents = {}
project_noise = torch.randn((1,4,64,64),generator=torch.Generator('cpu').manual_seed(args.seed))
projection = torch.randn((len(speaker_vectors[0]),4*64*64),generator=torch.Generator('cpu').manual_seed(args.seed+1)) if speaker_vectors else None
for index, source_index in enumerate([0, 0, *range(1, len(sources))]):
    started = time.perf_counter()
    conditioned_noise = None
    if projection is not None:
        voice_noise = (speaker_vectors[source_index] @ projection).reshape(1,4,64,64)
        conditioned_noise = (.9375**.5)*project_noise + .25*voice_noise
    latent = pipeline(prompt=sources[source_index][2], height=512, width=512,
        num_inference_steps=1, guidance_scale=0.0,
        generator=torch.Generator('cpu').manual_seed(args.seed), latents=conditioned_noise, output_type='latent').images
    latents[source_index] = latent.detach().clone()
    with torch.inference_mode():
        decoded = pipeline.vae.decode(latent / pipeline.vae.config.scaling_factor, return_dict=False)[0]
    generated = pipeline.image_processor.postprocess(decoded, output_type='pil')[0]
    destination = outputs / f'{"singing-" if args.singer_conditioning else ""}voice-layer-repeat-{index}.png'
    generated.save(destination)
    source_path, source_analysis, _ = sources[source_index]
    results.append({'path':str(destination),'pixelSha256':hashlib.sha256(generated.tobytes()).hexdigest(),
                    'sourceIndex':source_index, 'sourceSha256':hashlib.sha256(source_path.read_bytes()).hexdigest(),
                    'sourceFingerprint':source_analysis['features']['fingerprint'],
                    'seconds':round(time.perf_counter()-started,3)})
    print(json.dumps(results[-1]), flush=True)
blends = []
original_latent_hashes = {index:hashlib.sha256(value.numpy().tobytes()).hexdigest()
                         for index,value in latents.items()}
for count in range(2, len(sources) + 1):
    # Blend actual model latents across the whole plane; no tiles or pie slices.
    mixed_latent = torch.stack([latents[index] for index in range(count)]).mean(dim=0)
    with torch.inference_mode():
        decoded = pipeline.vae.decode(mixed_latent / pipeline.vae.config.scaling_factor, return_dict=False)[0]
    image = pipeline.image_processor.postprocess(decoded, output_type='pil')[0]
    destination = outputs / f'{"singing-" if args.singer_conditioning else ""}voice-layer-latent-blend-{count}.png'
    image.save(destination)
    blends.append({'count':count,'path':str(destination),
        'pixelSha256':hashlib.sha256(image.tobytes()).hexdigest(),
        'sourceIndices':list(range(count)), 'method':'mean model latents then actual VAE decode'})
assert original_latent_hashes == {index:hashlib.sha256(value.numpy().tobytes()).hexdigest()
                                 for index,value in latents.items()}, 'Blend mutated original model layers'
report = {'model':model_id,'revision':revision,'seed':args.seed,'device':'cpu',
    'versions':{'torch':torch.__version__},'source':str(audio_path),
    'sourceUrl':source_url if not args.audio else None,
    'sourceSha256':hashlib.sha256(audio_path.read_bytes()).hexdigest(),
    'analysis':analysis,'prompt':prompt,'results':results,'blends':blends,
    'originalModelLatentsPreserved':True,
    'speakerConditioning':speaker_metadata,
    'sources':[{'path':str(path),'analysis':value,'prompt':source_prompt}
               for path,value,source_prompt in sources],
    'comparison':{'sourceUrl':compare_url if not args.compare_audio else None,'analysis':compare_analysis,'prompt':compare_prompt},
    'differentInputDifferentPixels':results[0]['pixelSha256']!=results[2]['pixelSha256'],
    'sameInputSameSeedPixels':results[0]['pixelSha256']==results[1]['pixelSha256'],
    'limitations':[
        'four public VocalSet singing inputs' if args.singer_conditioning else 'public speech, not singing',
        'learned singer embedding projected into noise; no trained audio-image adaptor' if args.singer_conditioning else 'feature-derived text conditioning only',
        'timbre identity accuracy not established','latent blend is not production motion or Figma fidelity',
        'no runtime app integration']}
(outputs/('ai-singing-voice-layer-report.json' if args.singer_conditioning else 'ai-voice-layer-report.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
assert report['sameInputSameSeedPixels'], 'Same input/seed was not reproducible'
assert report['differentInputDifferentPixels'], 'Different audio did not change generated pixels'
print('PASS actual model inference and same-input/seed pixel reproducibility', flush=True)
