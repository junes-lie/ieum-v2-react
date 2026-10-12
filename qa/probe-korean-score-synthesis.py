"""Pinned Korean score-control feasibility only; never catalog or harmony approval.
Runtime preparation and unresolved pitch/voice/license gates are documented in the active plan.
The caller must apply live RAM monitoring; this script does not manage other processes.
"""
import argparse,hashlib,json,math,sys,time
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--runtime-dir',type=Path,required=True);p.add_argument('--preflight',action='store_true');p.add_argument('--validate-score-only',action='store_true');p.add_argument('--output-dir',type=Path);p.add_argument('--score-spec',type=Path);p.add_argument('--generation-stage',choices=['diffusion','linear'],default='diffusion');p.add_argument('--sampler',choices=['native','reference-ddim-diagnostic'],default='native');a=p.parse_args()
assert a.sampler=='native' or a.generation_stage=='diffusion','Reference diagnostic requires diffusion stage'
root=a.runtime_dir.resolve()
syllables=['<X>','오','늘','도','함','께','해','요','<X>']
notes=[0,72,74,76,79,77,76,72,0]
seconds=[1.0,.6,.6,.6,.6,.6,.6,1.2,1.2]
score_spec=None
note_curves=None
input_purpose='Built-in synthetic diagnostic score'
if a.score_spec:
 score_spec=json.loads(a.score_spec.read_text(encoding='utf-8'))
 syllables=score_spec['syllables'];notes=score_spec['notes'];seconds=score_spec['durationsSeconds']
 note_curves=score_spec.get('noteCurves')
 input_purpose=score_spec.get('purpose')
 if input_purpose is not None:assert isinstance(input_purpose,str) and 0<len(input_purpose)<=512,'Input purpose must be bounded text, not a verified music verdict'
assert len(syllables)==len(notes)==len(seconds)
assert syllables and all(isinstance(s,str) and (s=='<X>' or len(s)==1 and '\uac00'<=s<='\ud7a3') for s in syllables)
assert all(isinstance(n,int) and not isinstance(n,bool) and 0<=n<128 for n in notes)
assert all((syllable=='<X>')==(note==0) for syllable,note in zip(syllables,notes)),'Rest and sung note encoding must agree'
assert all(isinstance(d,(int,float)) and not isinstance(d,bool) and math.isfinite(d) and d>0 for d in seconds)
assert sum(seconds)<=10,'Short score feasibility only; verify resource bounds before longer input'
if note_curves is not None:
 assert isinstance(note_curves,list) and len(note_curves)==len(syllables),'One optional note curve per score segment is required'
 for index,curve in enumerate(note_curves):
  if curve is None:continue
  assert syllables[index]!='<X>' and isinstance(curve,list) and curve,'Only sung syllables can have a note curve'
  previous=-1
  for event in curve:
   assert isinstance(event,dict) and set(event)=={'offsetSeconds','modelNoteIndex'}
   offset=event['offsetSeconds'];note=event['modelNoteIndex']
   assert isinstance(offset,(int,float)) and not isinstance(offset,bool) and math.isfinite(offset) and previous<offset<seconds[index]
   assert isinstance(note,int) and not isinstance(note,bool) and 0<note<128
   previous=offset
  assert curve[0]['offsetSeconds']==0 and curve[0]['modelNoteIndex']==notes[index],'Curve must start with the declared segment note'
if not (a.preflight or a.validate_score_only):
 assert a.output_dir and not a.output_dir.exists(),'A new output directory is required'
sys.path[:0]=[str(root/'probe-source'),str(root/'deps')]
import yaml
from Arg_Parser import Recursive_Parse
from Pattern_Generator import Convert_Feature_Based_Music,Expand_by_Duration

hp=Recursive_Parse(yaml.safe_load((root/'Hyper_Parameters.yaml').read_text(encoding='utf-8')))
token_dict=yaml.safe_load((root/'YAML/Token.yaml').read_text(encoding='utf-8'))
converted=Convert_Feature_Based_Music(list(zip(seconds,syllables,notes)),hp.Sound.Sample_Rate,hp.Sound.Frame_Shift,hp.Duration.Consonant_Duration,hp.Duration.Equality)
from score_frame_timeline import score_frame_timeline
expanded_score_segments=score_frame_timeline(syllables,notes,seconds,converted,hp.Sound.Sample_Rate,hp.Sound.Frame_Shift)
tokens,expanded_notes,expanded_durations=Expand_by_Duration(*converted)
assert expanded_score_segments[-1]['endFrame']==len(tokens)
assert all(n<hp.Notes for n in notes)
expanded_note_events=[]
if note_curves is not None:
 duration_index=0;frame_start=0
 for index,(syllable,curve) in enumerate(zip(syllables,note_curves)):
  token_count=1 if syllable=='<X>' else 3
  frame_count=sum(converted[2][duration_index:duration_index+token_count])
  duration_index+=token_count
  if curve:
   frames=[round(event['offsetSeconds']*hp.Sound.Sample_Rate/hp.Sound.Frame_Shift) for event in curve]
   assert frame_count>0 and len(set(frames))==len(frames) and all(frame<frame_count for frame in frames),'Note events must occupy distinct frames within their syllable'
   for event_index,event in enumerate(curve):
    assert event['modelNoteIndex']<hp.Notes
    begin=frame_start+frames[event_index]
    end=frame_start+(frames[event_index+1] if event_index+1<len(frames) else frame_count)
    expanded_notes[begin:end]=[event['modelNoteIndex']]*(end-begin)
    expanded_note_events.append({'syllableIndex':index,'syllable':syllable,'startFrame':begin,'endFrame':end,'actualStartSeconds':begin*hp.Sound.Frame_Shift/hp.Sound.Sample_Rate,'actualEndSeconds':end*hp.Sound.Frame_Shift/hp.Sound.Sample_Rate,'modelNoteIndex':event['modelNoteIndex'],'expectedMidi':event['modelNoteIndex']-12})
  frame_start+=frame_count
 assert frame_start==len(tokens)==len(expanded_notes)
assert all(value in token_dict for value in tokens)
assert tokens and len(tokens)*hp.Sound.Frame_Shift/hp.Sound.Sample_Rate<=10
if a.validate_score_only:
 print(json.dumps({'status':'score-validation-only','modelLoaded':False,'inferenceExecuted':False,'nativeSampleRate':hp.Sound.Sample_Rate,'nativeFrameShift':hp.Sound.Frame_Shift,'expandedScoreSegments':expanded_score_segments,'expandedNoteEvents':expanded_note_events},ensure_ascii=False),flush=True)
 raise SystemExit(0)
# Import the heavy runtime only after all input/token/frame checks succeed.
import numpy as np
import soundfile as sf
import torch
from scipy.signal import resample_poly
torch.set_num_threads(2);torch.manual_seed(65359)
from Modules.Modules import DiffSinger
model=DiffSinger(hp).eval()
parameter_bytes=sum(value.numel()*value.element_size() for value in model.parameters())
print(json.dumps({'parameterBytes':parameter_bytes,'checkpointBytes':(root/'Checkpoint/S_200000.pt').stat().st_size,'checkpointLoading':'weights_only=True,mmap=True','diagnosticSeconds':sum(seconds)}),flush=True)
if a.preflight:raise SystemExit(0)
assert torch.cuda.is_available()
checkpoint=root/'Checkpoint/S_200000.pt';vocoder_file=root/'vocoder.pts'
def file_hash(path):
 digest=hashlib.sha256()
 with path.open('rb') as stream:
  for chunk in iter(lambda:stream.read(16*1024*1024),b''):digest.update(chunk)
 return digest.hexdigest()
assert file_hash(checkpoint)=='6482992a43b8a98554e7ef9e487a381c2717c5828d564e6dfc6cac16a0e16092'
assert file_hash(vocoder_file)=='5b47a5d03d744861f94ee973294317f738ccc6dc6d27bafa5d8db5ed18f95566'
state=torch.load(checkpoint,map_location='cpu',weights_only=True,mmap=True)
model.load_state_dict(state['Model']['DiffSVS'],strict=True);del state
model.cuda()
with vocoder_file.open('rb') as stream:
 vocoder=torch.jit.load(stream,map_location='cpu').eval().cuda()
torch.cuda.reset_peak_memory_stats()
inputs=dict(tokens=torch.tensor([[token_dict[value] for value in tokens]],device='cuda'),notes=torch.tensor([expanded_notes],device='cuda'),durations=torch.tensor([expanded_durations],device='cuda'),lengths=torch.tensor([len(tokens)],device='cuda'),singers=torch.tensor([0],device='cuda'),genres=torch.tensor([0],device='cuda'),ddim_steps=50)
start=time.perf_counter()
with torch.inference_mode():
 if a.generation_stage=='linear':
  _,mel=model.encoder(**{key:value for key,value in inputs.items() if key!='ddim_steps'})
 elif a.sampler=='reference-ddim-diagnostic':
  from ddim_reference_diagnostic import sample_reference_ddim
  encodings,linear_prediction=model.encoder(**{key:value for key,value in inputs.items() if key!='ddim_steps'})
  mel=sample_reference_ddim(model.diffusion,torch.cat([encodings,linear_prediction],dim=1),50)
 else:
  _,mel,_,_=model(**inputs)
 ranges=yaml.safe_load((root/'YAML/Mel_Range_Info.yaml').read_text(encoding='utf-8'))['CSD']
 mel=(mel.clamp(-1,1)+1)/2*(ranges['Max']-ranges['Min'])+ranges['Min']
 audio=vocoder(mel).reshape(-1)[:len(tokens)*hp.Sound.Frame_Shift].cpu().numpy()
vocoder_dtype=str(audio.dtype)
assert np.issubdtype(audio.dtype,np.signedinteger),'Pinned vocoder returns signed integer PCM; validate any replacement separately'
pcm_scale=float(-np.iinfo(audio.dtype).min)
audio=audio.astype(np.float32)/pcm_scale
assert np.isfinite(audio).all() and np.sqrt(np.mean(audio**2))>1e-5
audio=resample_poly(audio,320,147).astype(np.float32);audio=np.column_stack([audio,audio])
assert np.max(np.abs(audio))<=1,'Do not silently clip the native vocoder output'
a.output_dir.mkdir(parents=True)
file=a.output_dir/'ieum-original-song.wav';sf.write(file,audio,48000,subtype='PCM_16')
report={'status':'actual-model-inference','model':'CODEJIN/DiffSingerKR','revision':'26f95ac2554b6a6725706ed2a7991a62f7f714a9','checkpointSha256':'6482992a43b8a98554e7ef9e487a381c2717c5828d564e6dfc6cac16a0e16092','outputSha256':hashlib.sha256(file.read_bytes()).hexdigest(),'outputFile':file.name,'duration':len(audio)/48000,'sampleRate':48000,'lyrics':'오늘도 함께해요','score':{'syllables':syllables,'modelNoteIndices':notes,'expectedMidi':[n-12 if n else None for n in notes],'noteEncoding':{'version':'diffsingerkr-main9beec10-note-index-v1','formula':'440 * 2 ** ((index - 69 - 12) / 12); index 0 is rest','source':'https://github.com/CODEJIN/DiffSingerKR/blob/9beec10ffe3dd1068913b0f65827d31134f9460e/Pattern_Generator.py#L679-L692'},'durationsSeconds':seconds,'purpose':'Explicit synthetic diagnostic score, not measured original melody or approved harmony'},'inferenceSeconds':time.perf_counter()-start,'parameterBytes':parameter_bytes,'ownGpuPeakAllocatedBytes':torch.cuda.max_memory_allocated(),'executionDevice':'cuda','seed':65359,'steps':50,'sourceSongConnected':False,'catalogRegistrationApproved':False,'limitations':['Pretrained CSD single singer diagnostic, not user voice or selected singer identity','Explicit score is a feasibility input, not original-song harmony approval','No physical listening, lyric accuracy or production license approval']}
report.update(lyrics=''.join(s for s in syllables if s!='<X>'),scoreSpecSha256=file_hash(a.score_spec) if a.score_spec else None,scoreCalibration=score_spec,generatorScriptSha256=file_hash(Path(__file__)),frameTimelineScriptSha256=file_hash(Path(__file__).with_name('score_frame_timeline.py')),modelCodeCommit='9beec10ffe3dd1068913b0f65827d31134f9460e',runtimeSourceHashes={path.relative_to(root/'probe-source').as_posix():file_hash(path) for path in (root/'probe-source').rglob('*.py')},vocoderOutputDtype=vocoder_dtype,pcmScale=pcm_scale,peak=float(np.max(np.abs(audio))),rms=float(np.sqrt(np.mean(audio**2))))
report['score'].update(expandedScoreSegments=expanded_score_segments,nativeSampleRate=hp.Sound.Sample_Rate,nativeFrameShift=hp.Sound.Frame_Shift,frameTimelineScope='Exact conditioning frames; not measured output phonetic or audible entry boundaries')
report['score'].update(noteCurves=note_curves,expandedNoteEvents=expanded_note_events,noteCurveScope='Diagnostic frame-level note embedding input; no output pitch shift or original-song score approval')
report['score'].update(purpose='Explicit diagnostic score synthesis; no original melody or harmony approval',inputPurpose=input_purpose)
report.update(generationStage=a.generation_stage,steps=50 if a.generation_stage=='diffusion' else None,diffusionExecuted=a.generation_stage=='diffusion')
report.update(sampler=a.sampler,samplerDiagnosticSha256=file_hash(Path(__file__).with_name('ddim_reference_diagnostic.py')) if a.sampler!='native' else None)
if a.sampler!='native':report['limitations'].append('Reference DDIM diagnostic differs from pinned model native sampler; no quality or compatibility approval')
if a.generation_stage=='linear':report['limitations'].append('Intermediate native linear prediction diagnostic; not approved as a quality replacement for diffusion')
(a.output_dir/'song-generation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False),flush=True)
