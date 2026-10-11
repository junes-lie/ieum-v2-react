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
from ai_music_models import PINNED_AUDIO_MODELS
parser=argparse.ArgumentParser()
parser.add_argument('--model-dir',type=Path,required=True)
parser.add_argument('--device',choices=['cpu','cuda'],default='cpu')
parser.add_argument('--compute-dtype',choices=['float32','float16'],default='float32')
parser.add_argument('--lossless-gpu-cache',action='store_true',help='Opt-in exact packed host cache; original dtype restored on CUDA')
parser.add_argument('--output-dir',type=Path,required=True)
parser.add_argument('--duration',type=float,default=20)
parser.add_argument('--seed',type=int,default=65346)
parser.add_argument('--spec',type=Path,default=Path(__file__).with_name('ai-song-spec.json'))
parser.add_argument('--audio-codes',type=Path)
parser.add_argument('--audio-cover-strength',type=float,default=1.0)
parser.add_argument('--offload-dir',type=Path)
parser.add_argument('--source-song',type=Path,help='Verified generated source directory for an audio-conditioned vocal Part candidate')
parser.add_argument('--task',choices=['text2music','lego','repaint'],default='text2music')
parser.add_argument('--model-lineage',type=Path,help='Verified pinned Base/SFT conversion manifest; required for non-turbo inference')
parser.add_argument('--source-start',type=float,default=0,help='Actual source window start; output retains its duration and source offset')
parser.add_argument('--source-stem',choices=['mix','backing'],default='mix',help='Verified original mix or its actual separated backing as Lego context')
parser.add_argument('--generation-start',type=float,help='Native generation mask start within the actual input window; diagnostic only')
parser.add_argument('--generation-end',type=float)
parser.add_argument('--region-lyric-line',type=int,help='Repaint only: condition on a source candidate lyric line; keep full expected output lyrics for independent QA')
parser.add_argument('--steps',type=int)
parser.add_argument('--lossless-cpu-cache',action='store_true',help='Opt-in one-shot Base lego inference with exact CPU weight restoration')
args=parser.parse_args()
assert (args.generation_start is None)==(args.generation_end is None),'Specify both generation mask boundaries'
if args.generation_start is not None:
 assert args.task in ('lego','repaint') and args.source_song and args.source_stem=='mix','Partial generation requires a verified candidate mix source'
 assert 0<=args.generation_start<args.generation_end<=args.duration,'Mask must remain inside actual input duration'
assert args.region_lyric_line is None or (args.task=='repaint' and args.generation_start is not None),'Region lyric conditioning requires explicit Repaint mask'
assert args.device=='cuda' or args.compute_dtype=='float32','Preserve CPU float32 inference'
assert not args.lossless_gpu_cache or args.device=='cuda','GPU cache cannot change CPU inference'
compute_dtype=getattr(torch,args.compute_dtype)
if args.device=='cuda':
 assert torch.cuda.is_available(),'CUDA runtime unavailable; preserve CPU environment'
 assert not args.lossless_cpu_cache and not args.offload_dir,'CPU-specific cache/disk hooks cannot be used on GPU'
 torch.cuda.reset_peak_memory_stats()
script_sha=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
assert (args.task in ('lego','repaint'))==bool(args.source_song),'Audio-conditioned tasks require a verified generated source; text2music has no source'
assert not (args.source_song and args.audio_codes),'Do not mix two conditioning sources'
assert args.source_song or args.source_start==0,'Source offset requires source audio'
assert args.source_song or args.source_stem=='mix','Source stem requires source audio'
model_config=json.loads((args.model_dir/'transformer'/'config.json').read_text(encoding='utf-8'))
is_base=not model_config.get('is_turbo',False)
assert not (args.device=='cuda' and is_base and args.compute_dtype=='float16'),'Non-turbo CUDA FP16 is not validated; use FP32 (Base FP16 produced non-finite actual latents)'
assert not args.lossless_gpu_cache or (is_base and args.task in ('lego','repaint') and args.compute_dtype=='float32'),'GPU cache requires verified non-turbo FP32 audio conditioning'
if args.task=='repaint':
 assert is_base and args.device=='cuda' and args.compute_dtype=='float32' and args.generation_start is not None,'Repaint diagnostic requires verified non-turbo CUDA FP32 and explicit native mask'
assert not args.lossless_cpu_cache or (is_base and args.task=='lego'),'Lossless one-shot cache is validated for Base lego only'
if args.task=='lego' and not is_base:raise ValueError('lego requires verified Base weights; installed Turbo does not support lego')
model_id='ACE-Step/Ace-Step1.5';model_revision='19671f406d603126926c1b7e2adc169acbcade22'
lineage=None
if is_base:
 assert args.model_lineage,'Non-turbo inference requires verified conversion lineage'
 lineage=json.loads(args.model_lineage.read_text(encoding='utf-8'))
 policy=next((item for item in PINNED_AUDIO_MODELS.values() if item['model']==lineage['model']),None)
 assert policy and lineage['revision']==policy['revision'],'Unverified model revision'
 assert args.task in policy['tasks'],f"{lineage['model']} does not support {args.task}; preserve Base Lego"
 assert lineage['rawWeightsSha256']==policy['weightsSha256'] and lineage['tensorParityVerified']
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
assert not any((args.output_dir/name).exists() for name in ['ieum-original-song.wav','song-generation-report.json','actual-generated-latents.pt','actual-generation-mask.pt']),'Use a new output directory; never overwrite an existing inference'
spec=json.loads(args.spec.read_text(encoding='utf-8'))
lyrics=spec['lyrics'];prompt=spec['prompt']
model_lyrics=lyrics
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
 if args.region_lyric_line is not None:
  assert source_report.get('taskType') in ('lego','repaint') and source_report.get('trackName')=='vocals','Region repair requires an actual generated vocal candidate'
  assert source_report['lyrics']==lyrics,'Do not change the full expected lyrics to force QA acceptance'
  lines=[line.strip() for line in lyrics.splitlines() if line.strip() and not line.startswith('[')]
  assert 0<=args.region_lyric_line<len(lines)
  model_lyrics='[Verse]\n'+lines[args.region_lyric_line]
code_report=None
if args.audio_codes:
 code_report=json.loads(args.audio_codes.read_text(encoding='utf-8'))
 assert code_report['actualInference'] and code_report['spec']==spec
 assert code_report['requestedDuration']==args.duration
 assert hashlib.sha256(code_report['audioCodes'].encode()).hexdigest()==code_report['codesSha256']
torch.set_num_threads(4)
torch.manual_seed(args.seed)
if args.device=='cpu':
 from cpu_disk_offload import release_cpu_disk_offload_storage,enable_lossless_cpu_inference_cache,lossless_cpu_cache_stats
 release_cpu_disk_offload_storage()
 if args.lossless_cpu_cache:enable_lossless_cpu_inference_cache()
args.output_dir.mkdir(parents=True,exist_ok=True)
print(f'Loading actual converted ACE-Step weights for {args.device} inference',flush=True)
# Load and offload large components sequentially, avoiding a full FP32 model peak.
transformer=AceStepTransformer1DModel.from_pretrained(args.model_dir,subfolder='transformer',torch_dtype=compute_dtype,local_files_only=True,low_cpu_mem_usage=True)
offload_dir=args.offload_dir or args.output_dir/'transformer-offload'
if args.offload_dir:
 cached=json.loads((offload_dir.parent/'song-generation-report.json').read_text(encoding='utf-8'))
 assert cached['model']==model_id and cached['revision']==model_revision,'Reuse only the verified same model cache'
 assert len(list(offload_dir.glob('group_*.safetensors')))==13,'Only a complete offload cache can be reused'
if args.device=='cpu':
 transformer.enable_group_offload(onload_device=torch.device('cpu'),offload_device=torch.device('cpu'),offload_type='block_level',num_blocks_per_group=2,offload_to_disk_path=str(offload_dir))
else:
 from cuda_disk_offload import enable_cuda_disk_storage_release
 enable_cuda_disk_storage_release()
 if args.lossless_gpu_cache:
  from cuda_disk_offload import enable_cuda_lossless_cache,cuda_lossless_cache_stats
  enable_cuda_lossless_cache()
 transformer.enable_group_offload(onload_device=torch.device('cuda'),offload_device=torch.device('cpu'),offload_type='block_level',num_blocks_per_group=2,use_stream=False,offload_to_disk_path=str(offload_dir))
print('Transformer prepared; loading text encoder separately',flush=True)
print(f'Actual offloaded transformer storage: {sum(p.numel() for p in transformer.parameters())} tensor elements',flush=True)
text_encoder=AutoModel.from_pretrained(args.model_dir/'text_encoder',dtype=compute_dtype,local_files_only=True,low_cpu_mem_usage=True)
# ACE-Step accesses the lyric embedding directly after text_encoder.forward.
# Root-level text disk offload replaces that embedding with empty storage before
# the direct call, silently corrupting lyric conditioning. Keep this small model
# resident; only the DiT uses block offloading.
optional_components={'audio_tokenizer':None,'audio_token_detokenizer':None} if args.task in ('lego','repaint') else {}
pipe=AceStepPipeline.from_pretrained(args.model_dir,transformer=transformer,text_encoder=text_encoder,dtype=compute_dtype,local_files_only=True,low_cpu_mem_usage=True,**optional_components)
# Oobleck exposes its implemented temporal tiling through this runtime flag.
pipe.vae.use_tiling=True
if args.device=='cuda':
 from diffusers.hooks import apply_group_offloading
 # Legacy weight_norm pre-hooks run before Diffusers onload and cache a CPU
 # weight. For inference, materialize exactly the same normalized VAE weight.
 normalized_vae_weights=0
 for module in pipe.vae.modules():
  if hasattr(module,'weight_g') and hasattr(module,'weight_v'):
   from torch.nn.utils.weight_norm import WeightNorm
   hook=next(hook for hook in module._forward_pre_hooks.values() if isinstance(hook,WeightNorm) and hook.name=='weight')
   # from_pretrained can leave the cached weight on Meta; derive the reference
   # from the loaded weight_g/weight_v using PyTorch's own normalization hook.
   before=hook.compute_weight(module).detach().clone()
   torch.nn.utils.remove_weight_norm(module)
   assert torch.equal(before,module.weight.detach()),'VAE weight normalization changed values'
   normalized_vae_weights+=1
 print(f'Exact VAE normalized weight parity: {normalized_vae_weights} modules',flush=True)
 for name,module in pipe.components.items():
  if name!='transformer' and isinstance(module,torch.nn.Module):
   apply_group_offloading(module,onload_device=torch.device('cuda'),offload_device=torch.device('cpu'),offload_type='leaf_level',use_stream=False)
 assert pipe._execution_device.type=='cuda','Native pipeline must compute on CUDA'
 if args.task in ('lego','repaint'):
  from cuda_disk_offload import release_after_one_shot
  # Native Lego calls these once; cover's second encode_prompt is excluded.
  # Preserve condition buffers, including silence_latent used later.
  pipe.encode_prompt=release_after_one_shot(pipe.encode_prompt,pipe.text_encoder,'text/lyric encoding')
  pipe.condition_encoder.forward=release_after_one_shot(pipe.condition_encoder.forward,pipe.condition_encoder,'condition encoding',preserve_parameters=('null_condition_emb',))
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
if args.device=='cuda':torch.cuda.synchronize()
mask_report=None
if args.generation_start is not None:
 native_mask=pipe._build_chunk_mask
 def audited_mask(*values,**kwargs):
  global mask_report
  mask=native_mask(*values,**kwargs)
  left=int(args.generation_start*pipe.latents_per_second)
  right=int(args.generation_end*pipe.latents_per_second)
  assert 0<=left<right<=mask.shape[1]
  assert torch.all(mask[:,left:right,:]==1) and torch.all(mask[:,:left,:]==0) and torch.all(mask[:,right:,:]==0),'Native generation mask differs from the requested region'
  file=args.output_dir/'actual-generation-mask.pt'
  torch.save(mask.detach().cpu(),file)
  mask_report={'file':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'shape':list(mask.shape),'firstActiveFrame':left,'endActiveFrameExclusive':right,'latentsPerSecond':pipe.latents_per_second,'outsideWindowMaskZero':True,'insideWindowMaskOne':True,'limits':'Native conditioning mask does not guarantee exact decoded PCM outside the selected region'}
  return mask
 pipe._build_chunk_mask=audited_mask
start=time.time()
print('Generating original song; no personal voice or existing commercial song input',flush=True)
def progress(pipeline,step,timestep,values):
 if args.device=='cuda':torch.cuda.synchronize()
 assert torch.isfinite(values['latents']).all(),f'Non-finite diffusion latent at step {step+1}; preserve evidence and reject output'
 print(f'Actual music diffusion step {step+1}/{steps}; elapsed {time.time()-start:.1f}s',flush=True)
 if step==steps-1:
  torch.save(values['latents'].detach().cpu(),args.output_dir/'actual-generated-latents.pt')
 return values
result=pipe(callback_on_step_end=progress,prompt=prompt,lyrics=model_lyrics,vocal_language=spec['language'],audio_duration=args.duration,num_inference_steps=steps,bpm=spec['bpm'],keyscale=spec['key'],timesignature=spec['timesignature'],task_type=args.task if args.source_song else ('cover' if code_report else 'text2music'),track_name='vocals' if args.task=='lego' else None,src_audio=source_audio,audio_codes=code_report['audioCodes'] if code_report else None,audio_cover_strength=args.audio_cover_strength,generator=torch.Generator(args.device).manual_seed(args.seed),repainting_start=args.generation_start,repainting_end=args.generation_end)
audio=result.audios[0].detach().float().cpu().numpy().T
assert np.isfinite(audio).all() and audio.ndim==2 and audio.shape[1]==2
assert np.sqrt(np.mean(audio**2))>1e-5,'Model output is silent'
file=args.output_dir/'ieum-original-song.wav'
sf.write(file,audio,pipe.sample_rate,subtype='PCM_16')
report={'status':'actual-model-inference','title':'서로의 빛','model':'ACE-Step/Ace-Step1.5','revision':'19671f406d603126926c1b7e2adc169acbcade22','license':'MIT','seed':args.seed,'prompt':prompt,'lyrics':lyrics,'requestedBpm':80,'requestedKey':'C major','requestedDuration':args.duration,'sampleRate':pipe.sample_rate,'duration':len(audio)/pipe.sample_rate,'channels':2,'peak':float(np.max(np.abs(audio))),'rms':float(np.sqrt(np.mean(audio**2))),'outputSha256':hashlib.sha256(file.read_bytes()).hexdigest(),'inferenceSeconds':time.time()-start,'output':str(file.resolve()),'limitations':['Requested key and tempo are conditioning, not measured guarantees','Vocal quality, separated backing, lyric timestamps and Part ranges require actual output verification','No shared service or physical microphone acceptance']}
report.update(title=spec['title'],requestedBpm=spec['bpm'],requestedKey=spec['key'],outputFile=file.name,musicCodeModel={k:code_report[k] for k in ['model','revision','codesSha256','codeCount']} if code_report else None,taskType='cover' if code_report else 'text2music',audioCoverStrength=args.audio_cover_strength if code_report else None,lyricEmbeddingStorage='resident text encoder; DiT-only disk offload',vaeTemporalTiling=pipe.vae.use_tiling,specSha256=hashlib.sha256(args.spec.read_bytes()).hexdigest(),latentSha256=hashlib.sha256((args.output_dir/'actual-generated-latents.pt').read_bytes()).hexdigest())
if source_report:
 report.update(taskType=args.task,trackName='vocals',conditioningSourceSha256=source_report['outputSha256'],conditioningSourceRevision=source_report['revision'],conditioningSourceWindow={'start':args.source_start,'end':args.source_start+args.duration},partArrangementApproved=False)
 report.update(conditioningSourceStem=args.source_stem,conditioningAudioSha256=conditioning_audio_sha)
 report['conditioningReportSha256']=hashlib.sha256((args.source_song/'song-generation-report.json').read_bytes()).hexdigest()
 report['conditioningParentAncestry']={key:source_report.get(key) for key in ['taskType','conditioningSourceSha256','conditioningSourceWindow','conditioningReportSha256','conditioningParentAncestry']}
 report['nativeGenerationWindow']={'start':args.generation_start,'end':args.generation_end} if args.generation_start is not None else None
 report['outsideGenerationWindowPcmPreserved']=None
 report['nativeGenerationMask']=mask_report
report.update(model=model_id,revision=model_revision,inferenceSteps=steps,modelLineageSha256=hashlib.sha256(args.model_lineage.read_bytes()).hexdigest() if lineage else None,generatorScriptSha256=script_sha,guidanceScale=7.0 if is_base else None)
report.update(modelLyrics=model_lyrics,regionLyricLineIndex=args.region_lyric_line,fullExpectedLyricsUnchanged=True)
if args.region_lyric_line is not None:
 report['limitations'].append('Region repair uses modelLyrics for the selected line; lyrics retains all expected output lines for independent ASR. No automatic syllable/timing/harmony approval.')
report['semanticCodeComponentsLoaded']=args.task not in ('lego','repaint')
report['cpuInferenceCache']=lossless_cpu_cache_stats() if args.lossless_cpu_cache else None
report['textEncoderStorage']='released after complete native caption and lyric encoding' if args.lossless_cpu_cache else 'resident'
report['lyricEmbeddingStorage']=report['textEncoderStorage']
report['transformerStorage']='exact CPU RAM cache; original dtype restored before native forward' if args.lossless_cpu_cache else 'DiT-only disk offload'
report.update(executionDevice=args.device,torchVersion=torch.__version__,computeDtype=args.compute_dtype)
report['gpuInferenceCache']=cuda_lossless_cache_stats() if args.lossless_gpu_cache else None
if args.device=='cuda':
 report.update(transformerStorage='native CUDA block disk offload with CUDA-only CPU-placeholder release; CPU inference hooks excluded',textEncoderStorage='released after complete native encoding' if args.task in ('lego','repaint') else 'native CUDA leaf group offload',lyricEmbeddingStorage='released after complete native encoding' if args.task in ('lego','repaint') else 'native CUDA leaf group offload',conditionEncoderStorage='parameters released after complete native encoding; buffers preserved' if args.task in ('lego','repaint') else 'native CUDA leaf group offload',vaeNormalizedWeightParityModules=normalized_vae_weights,gpu={'name':torch.cuda.get_device_name(),'capability':torch.cuda.get_device_capability(),'peakAllocatedBytes':torch.cuda.max_memory_allocated(),'peakReservedBytes':torch.cuda.max_memory_reserved(),'cudaRuntime':torch.version.cuda})
if args.device=='cuda' and args.lossless_gpu_cache:
 from cuda_disk_offload import release_cuda_lossless_cache
 report['gpuCacheRelease']=release_cuda_lossless_cache()
(args.output_dir/'song-generation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False),flush=True)
