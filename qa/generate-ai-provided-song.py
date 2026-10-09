"""Run actual ACE-Step inference for an original IEUM song, without user audio."""
import argparse,hashlib,json,time
from pathlib import Path
import truststore
truststore.inject_into_ssl()
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
import torch
from diffusers import AceStepPipeline,AceStepTransformer1DModel
from transformers import AutoModel
from cpu_disk_offload import release_cpu_disk_offload_storage,enable_lossless_cpu_inference_cache,lossless_cpu_cache_stats
parser=argparse.ArgumentParser()
parser.add_argument('--model-dir',type=Path,required=True)
parser.add_argument('--output-dir',type=Path,required=True)
parser.add_argument('--duration',type=float,default=20)
parser.add_argument('--seed',type=int,default=65346)
parser.add_argument('--spec',type=Path,default=Path(__file__).with_name('ai-song-spec.json'))
parser.add_argument('--audio-codes',type=Path)
parser.add_argument('--audio-cover-strength',type=float,default=1.0)
parser.add_argument('--offload-dir',type=Path)
parser.add_argument('--source-song',type=Path,help='Verified generated source directory for an audio-conditioned vocal Part candidate')
parser.add_argument('--task',choices=['text2music','lego'],default='text2music')
parser.add_argument('--model-lineage',type=Path,help='Verified Base conversion manifest; required for Base inference')
parser.add_argument('--source-start',type=float,default=0,help='Actual source window start; output retains its duration and source offset')
parser.add_argument('--source-stem',choices=['mix','backing'],default='mix',help='Verified original mix or its actual separated backing as Lego context')
parser.add_argument('--steps',type=int)
parser.add_argument('--lossless-cpu-cache',action='store_true',help='Opt-in one-shot Base lego inference with exact CPU weight restoration')
args=parser.parse_args()
script_sha=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
assert (args.task=='lego')==bool(args.source_song),'lego requires a verified generated source; text2music has no source'
assert not (args.source_song and args.audio_codes),'Do not mix two conditioning sources'
assert args.source_song or args.source_start==0,'Source offset requires source audio'
assert args.source_song or args.source_stem=='mix','Source stem requires source audio'
model_config=json.loads((args.model_dir/'transformer'/'config.json').read_text(encoding='utf-8'))
is_base=not model_config.get('is_turbo',False)
assert not args.lossless_cpu_cache or (is_base and args.task=='lego'),'Lossless one-shot cache is validated for Base lego only'
if args.task=='lego' and not is_base:raise ValueError('lego requires verified Base weights; installed Turbo does not support lego')
model_id='ACE-Step/Ace-Step1.5';model_revision='19671f406d603126926c1b7e2adc169acbcade22'
lineage=None
if is_base:
 assert args.model_lineage,'Base inference requires verified conversion lineage'
 lineage=json.loads(args.model_lineage.read_text(encoding='utf-8'))
 assert lineage['model']=='ACE-Step/acestep-v15-base' and lineage['revision']=='e432212fec32b8965a14ffa57ae653438d6abd14'
 assert lineage['rawWeightsSha256']=='4177f600501a6d4bd81cadaa0abac557ffd15c54e5c8cb52053cdb24a0844d6b' and lineage['tensorParityVerified']
 for component,expected in lineage['componentHashes'].items():
  assert '..' not in component and not Path(component).is_absolute()
  h=hashlib.sha256()
  with (args.model_dir/component).open('rb') as f:
   for chunk in iter(lambda:f.read(16*1024*1024),b''):h.update(chunk)
  assert h.hexdigest()==expected,f'Changed converted Base component: {component}'
 model_id=lineage['model'];model_revision=lineage['revision']
steps=args.steps if args.steps is not None else (50 if is_base else 8)
assert 32<=steps<=64 if is_base else steps==8
assert 0<=args.audio_cover_strength<=1
assert not any((args.output_dir/name).exists() for name in ['ieum-original-song.wav','song-generation-report.json','actual-generated-latents.pt']),'Use a new output directory; never overwrite an existing inference'
spec=json.loads(args.spec.read_text(encoding='utf-8'))
lyrics=spec['lyrics'];prompt=spec['prompt']
source_report=None;source_audio=None;conditioning_audio_sha=None
if args.source_song:
 source_report=json.loads((args.source_song/'song-generation-report.json').read_text(encoding='utf-8'))
 source_file=args.source_song/'ieum-original-song.wav'
 assert source_report['status']=='actual-model-inference'
 assert hashlib.sha256(source_file.read_bytes()).hexdigest()==source_report['outputSha256']
 source_audio,source_sr=sf.read(source_file,dtype='float32',always_2d=True)
 assert source_sr==48000 and source_audio.shape[1]==2 and np.isfinite(source_audio).all()
 assert abs(len(source_audio)/source_sr-source_report['duration'])<.1
 if args.source_stem=='backing':
  stems=json.loads((args.source_song/'stem-separation-report.json').read_text(encoding='utf-8'))
  assert stems['actualModelInference'] and stems['sourceSha256']==source_report['outputSha256']
  stem=stems['stems']['backing'];stem_file=args.source_song/stem['file']
  assert stem['file']=='backing.wav'
  conditioning_audio_sha=hashlib.sha256(stem_file.read_bytes()).hexdigest()
  assert conditioning_audio_sha==stem['sha256']
  source_audio,stem_sr=sf.read(stem_file,dtype='float32',always_2d=True)
  assert stem_sr==44100 and source_audio.shape[1]==2 and np.isfinite(source_audio).all()
  assert abs(len(source_audio)/stem_sr-source_report['duration'])<.1
  assert np.sqrt(np.mean(source_audio**2))>1e-5,'Source backing is silent'
  source_audio=resample_poly(source_audio,160,147,axis=0).astype(np.float32)
 else:conditioning_audio_sha=source_report['outputSha256']
 assert 0<=args.source_start and args.source_start+args.duration<=len(source_audio)/source_sr
 source_audio=source_audio[round(args.source_start*source_sr):round((args.source_start+args.duration)*source_sr)]
 source_audio=torch.from_numpy(source_audio.T.copy())
code_report=None
if args.audio_codes:
 code_report=json.loads(args.audio_codes.read_text(encoding='utf-8'))
 assert code_report['actualInference'] and code_report['spec']==spec
 assert code_report['requestedDuration']==args.duration
 assert hashlib.sha256(code_report['audioCodes'].encode()).hexdigest()==code_report['codesSha256']
torch.set_num_threads(4)
torch.manual_seed(args.seed)
release_cpu_disk_offload_storage()
if args.lossless_cpu_cache:enable_lossless_cpu_inference_cache()
args.output_dir.mkdir(parents=True,exist_ok=True)
print('Loading actual converted ACE-Step weights on CPU',flush=True)
# Load and offload large components sequentially, avoiding a full FP32 model peak.
transformer=AceStepTransformer1DModel.from_pretrained(args.model_dir,subfolder='transformer',torch_dtype=torch.float32,local_files_only=True,low_cpu_mem_usage=True)
offload_dir=args.offload_dir or args.output_dir/'transformer-offload'
if args.offload_dir:
 cached=json.loads((offload_dir.parent/'song-generation-report.json').read_text(encoding='utf-8'))
 assert cached['model']==model_id and cached['revision']==model_revision,'Reuse only the verified same model cache'
 assert len(list(offload_dir.glob('group_*.safetensors')))==13,'Only a complete offload cache can be reused'
transformer.enable_group_offload(onload_device=torch.device('cpu'),offload_device=torch.device('cpu'),offload_type='block_level',num_blocks_per_group=2,offload_to_disk_path=str(offload_dir))
print('Transformer prepared; loading text encoder separately',flush=True)
print(f'Actual offloaded transformer storage: {sum(p.numel() for p in transformer.parameters())} tensor elements',flush=True)
text_encoder=AutoModel.from_pretrained(args.model_dir/'text_encoder',dtype=torch.float32,local_files_only=True,low_cpu_mem_usage=True)
# ACE-Step accesses the lyric embedding directly after text_encoder.forward.
# Root-level text disk offload replaces that embedding with empty storage before
# the direct call, silently corrupting lyric conditioning. Keep this small model
# resident; only the DiT uses block offloading.
optional_components={'audio_tokenizer':None,'audio_token_detokenizer':None} if args.task=='lego' else {}
pipe=AceStepPipeline.from_pretrained(args.model_dir,transformer=transformer,text_encoder=text_encoder,dtype=torch.float32,local_files_only=True,low_cpu_mem_usage=True,**optional_components)
# Oobleck exposes its implemented temporal tiling through this runtime flag.
pipe.vae.use_tiling=True
if args.lossless_cpu_cache:
 encode_prompt=pipe.encode_prompt
 def encode_then_release(*values,**kwargs):
  encoded=encode_prompt(*values,**kwargs)
  # Keep the lyric embedding alive through the entire native encode_prompt.
  # This one-shot lego path does not call the encoder again after these outputs.
  for parameter in pipe.text_encoder.parameters():
   parameter.data=torch.empty(0,dtype=parameter.dtype,device='cpu')
  print('Actual caption and lyric encoding complete; one-shot text weights released',flush=True)
  return encoded
 pipe.encode_prompt=encode_then_release
start=time.time()
print('Generating original song; no personal voice or existing commercial song input',flush=True)
def progress(pipeline,step,timestep,values):
 print(f'Actual music diffusion step {step+1}/{steps}; elapsed {time.time()-start:.1f}s',flush=True)
 if step==steps-1:
  torch.save(values['latents'].detach().cpu(),args.output_dir/'actual-generated-latents.pt')
 return values
result=pipe(callback_on_step_end=progress,prompt=prompt,lyrics=lyrics,vocal_language=spec['language'],audio_duration=args.duration,num_inference_steps=steps,bpm=spec['bpm'],keyscale=spec['key'],timesignature=spec['timesignature'],task_type='lego' if args.source_song else ('cover' if code_report else 'text2music'),track_name='vocals' if args.source_song else None,src_audio=source_audio,audio_codes=code_report['audioCodes'] if code_report else None,audio_cover_strength=args.audio_cover_strength,generator=torch.Generator('cpu').manual_seed(args.seed))
audio=result.audios[0].detach().float().cpu().numpy().T
assert np.isfinite(audio).all() and audio.ndim==2 and audio.shape[1]==2
assert np.sqrt(np.mean(audio**2))>1e-5,'Model output is silent'
file=args.output_dir/'ieum-original-song.wav'
sf.write(file,audio,pipe.sample_rate,subtype='PCM_16')
report={'status':'actual-model-inference','title':'서로의 빛','model':'ACE-Step/Ace-Step1.5','revision':'19671f406d603126926c1b7e2adc169acbcade22','license':'MIT','seed':args.seed,'prompt':prompt,'lyrics':lyrics,'requestedBpm':80,'requestedKey':'C major','requestedDuration':args.duration,'sampleRate':pipe.sample_rate,'duration':len(audio)/pipe.sample_rate,'channels':2,'peak':float(np.max(np.abs(audio))),'rms':float(np.sqrt(np.mean(audio**2))),'outputSha256':hashlib.sha256(file.read_bytes()).hexdigest(),'inferenceSeconds':time.time()-start,'output':str(file.resolve()),'limitations':['Requested key and tempo are conditioning, not measured guarantees','Vocal quality, separated backing, lyric timestamps and Part ranges require actual output verification','No shared service or physical microphone acceptance']}
report.update(title=spec['title'],requestedBpm=spec['bpm'],requestedKey=spec['key'],outputFile=file.name,musicCodeModel={k:code_report[k] for k in ['model','revision','codesSha256','codeCount']} if code_report else None,taskType='cover' if code_report else 'text2music',audioCoverStrength=args.audio_cover_strength if code_report else None,lyricEmbeddingStorage='resident text encoder; DiT-only disk offload',vaeTemporalTiling=pipe.vae.use_tiling,specSha256=hashlib.sha256(args.spec.read_bytes()).hexdigest(),latentSha256=hashlib.sha256((args.output_dir/'actual-generated-latents.pt').read_bytes()).hexdigest())
if source_report:
 report.update(taskType='lego',trackName='vocals',conditioningSourceSha256=source_report['outputSha256'],conditioningSourceRevision=source_report['revision'],conditioningSourceWindow={'start':args.source_start,'end':args.source_start+args.duration},partArrangementApproved=False)
 report.update(conditioningSourceStem=args.source_stem,conditioningAudioSha256=conditioning_audio_sha)
report.update(model=model_id,revision=model_revision,inferenceSteps=steps,modelLineageSha256=hashlib.sha256(args.model_lineage.read_bytes()).hexdigest() if lineage else None,generatorScriptSha256=script_sha,guidanceScale=7.0 if is_base else None)
report['semanticCodeComponentsLoaded']=args.task!='lego'
report['cpuInferenceCache']=lossless_cpu_cache_stats() if args.lossless_cpu_cache else None
report['textEncoderStorage']='released after complete native caption and lyric encoding' if args.lossless_cpu_cache else 'resident'
report['lyricEmbeddingStorage']=report['textEncoderStorage']
report['transformerStorage']='exact CPU RAM cache; original dtype restored before native forward' if args.lossless_cpu_cache else 'DiT-only disk offload'
(args.output_dir/'song-generation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False),flush=True)
