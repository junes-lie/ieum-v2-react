"""Run actual ACE-Step inference for an original IEUM song, without user audio."""
import argparse,hashlib,json,time
from pathlib import Path
import truststore
truststore.inject_into_ssl()
import numpy as np
import soundfile as sf
import torch
from diffusers import AceStepPipeline,AceStepTransformer1DModel
from transformers import AutoModel
from cpu_disk_offload import release_cpu_disk_offload_storage
parser=argparse.ArgumentParser()
parser.add_argument('--model-dir',type=Path,required=True)
parser.add_argument('--output-dir',type=Path,required=True)
parser.add_argument('--duration',type=float,default=20)
parser.add_argument('--seed',type=int,default=65346)
parser.add_argument('--spec',type=Path,default=Path(__file__).with_name('ai-song-spec.json'))
parser.add_argument('--audio-codes',type=Path)
parser.add_argument('--audio-cover-strength',type=float,default=1.0)
parser.add_argument('--offload-dir',type=Path)
args=parser.parse_args()
assert 0<=args.audio_cover_strength<=1
assert not any((args.output_dir/name).exists() for name in ['ieum-original-song.wav','song-generation-report.json','actual-generated-latents.pt']),'Use a new output directory; never overwrite an existing inference'
spec=json.loads(args.spec.read_text(encoding='utf-8'))
lyrics=spec['lyrics'];prompt=spec['prompt']
code_report=None
if args.audio_codes:
 code_report=json.loads(args.audio_codes.read_text(encoding='utf-8'))
 assert code_report['actualInference'] and code_report['spec']==spec
 assert code_report['requestedDuration']==args.duration
 assert hashlib.sha256(code_report['audioCodes'].encode()).hexdigest()==code_report['codesSha256']
torch.set_num_threads(4)
release_cpu_disk_offload_storage()
args.output_dir.mkdir(parents=True,exist_ok=True)
print('Loading actual converted ACE-Step weights on CPU',flush=True)
# Load and offload large components sequentially, avoiding a full FP32 model peak.
transformer=AceStepTransformer1DModel.from_pretrained(args.model_dir,subfolder='transformer',torch_dtype=torch.float32,local_files_only=True,low_cpu_mem_usage=True)
offload_dir=args.offload_dir or args.output_dir/'transformer-offload'
if args.offload_dir:
 cached=json.loads((offload_dir.parent/'song-generation-report.json').read_text(encoding='utf-8'))
 assert cached['model']=='ACE-Step/Ace-Step1.5' and cached['revision']=='19671f406d603126926c1b7e2adc169acbcade22','Reuse only the verified same model cache'
 assert len(list(offload_dir.glob('group_*.safetensors')))==13,'Only a complete offload cache can be reused'
transformer.enable_group_offload(onload_device=torch.device('cpu'),offload_device=torch.device('cpu'),offload_type='block_level',num_blocks_per_group=2,offload_to_disk_path=str(offload_dir))
print('Transformer prepared; loading text encoder separately',flush=True)
print(f'Actual offloaded transformer storage: {sum(p.numel() for p in transformer.parameters())} tensor elements',flush=True)
text_encoder=AutoModel.from_pretrained(args.model_dir/'text_encoder',dtype=torch.float32,local_files_only=True,low_cpu_mem_usage=True)
# ACE-Step accesses the lyric embedding directly after text_encoder.forward.
# Root-level text disk offload replaces that embedding with empty storage before
# the direct call, silently corrupting lyric conditioning. Keep this small model
# resident; only the DiT uses block offloading.
pipe=AceStepPipeline.from_pretrained(args.model_dir,transformer=transformer,text_encoder=text_encoder,dtype=torch.float32,local_files_only=True,low_cpu_mem_usage=True)
# Oobleck exposes its implemented temporal tiling through this runtime flag.
pipe.vae.use_tiling=True
start=time.time()
print('Generating original song; no personal voice or existing commercial song input',flush=True)
def progress(pipeline,step,timestep,values):
 print(f'Actual music diffusion step {step+1}/8; elapsed {time.time()-start:.1f}s',flush=True)
 if step==7:
  torch.save(values['latents'].detach().cpu(),args.output_dir/'actual-generated-latents.pt')
 return values
result=pipe(callback_on_step_end=progress,prompt=prompt,lyrics=lyrics,vocal_language=spec['language'],audio_duration=args.duration,num_inference_steps=8,bpm=spec['bpm'],keyscale=spec['key'],timesignature=spec['timesignature'],audio_codes=code_report['audioCodes'] if code_report else None,audio_cover_strength=args.audio_cover_strength,generator=torch.Generator('cpu').manual_seed(args.seed))
audio=result.audios[0].detach().float().cpu().numpy().T
assert np.isfinite(audio).all() and audio.ndim==2 and audio.shape[1]==2
assert np.sqrt(np.mean(audio**2))>1e-5,'Model output is silent'
file=args.output_dir/'ieum-original-song.wav'
sf.write(file,audio,pipe.sample_rate,subtype='PCM_16')
report={'status':'actual-model-inference','title':'서로의 빛','model':'ACE-Step/Ace-Step1.5','revision':'19671f406d603126926c1b7e2adc169acbcade22','license':'MIT','seed':args.seed,'prompt':prompt,'lyrics':lyrics,'requestedBpm':80,'requestedKey':'C major','requestedDuration':args.duration,'sampleRate':pipe.sample_rate,'duration':len(audio)/pipe.sample_rate,'channels':2,'peak':float(np.max(np.abs(audio))),'rms':float(np.sqrt(np.mean(audio**2))),'outputSha256':hashlib.sha256(file.read_bytes()).hexdigest(),'inferenceSeconds':time.time()-start,'output':str(file.resolve()),'limitations':['Requested key and tempo are conditioning, not measured guarantees','Vocal quality, separated backing, lyric timestamps and Part ranges require actual output verification','No shared service or physical microphone acceptance']}
report.update(title=spec['title'],requestedBpm=spec['bpm'],requestedKey=spec['key'],outputFile=file.name,musicCodeModel={k:code_report[k] for k in ['model','revision','codesSha256','codeCount']} if code_report else None,taskType='cover' if code_report else 'text2music',audioCoverStrength=args.audio_cover_strength if code_report else None,lyricEmbeddingStorage='resident text encoder; DiT-only disk offload',vaeTemporalTiling=pipe.vae.use_tiling,specSha256=hashlib.sha256(args.spec.read_bytes()).hexdigest(),latentSha256=hashlib.sha256((args.output_dir/'actual-generated-latents.pt').read_bytes()).hexdigest())
(args.output_dir/'song-generation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False),flush=True)
