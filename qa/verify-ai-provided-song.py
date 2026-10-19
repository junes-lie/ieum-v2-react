"""Validate actual generated WAV and report ASR evidence; never invent timestamps."""
import argparse,hashlib,json,re,difflib,math
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
import torch
from transformers import WhisperProcessor,WhisperForConditionalGeneration
p=argparse.ArgumentParser();p.add_argument('--song-dir',type=Path,required=True);p.add_argument('--asr-dir',type=Path,required=True);p.add_argument('--vocals',action='store_true');p.add_argument('--chunk-seconds',type=int,default=0);p.add_argument('--asr-model',choices=['small','turbo'],default='small');p.add_argument('--robust',action='store_true')
p.add_argument('--output-dir',type=Path)
p.add_argument('--start-seconds',type=float,default=0)
p.add_argument('--end-seconds',type=float)
p.add_argument('--lyric-line',type=int,help='Zero-based nonempty lyric line from the verified generation report; diagnostic only')
p.add_argument('--asr-device',choices=['cpu','cuda'],default='cpu',help='Explicit FP32 ASR execution device; no automatic fallback')
args=p.parse_args()
name='vocal-validation-report' if args.vocals else 'song-validation-report'
if args.chunk_seconds:name+=f'-chunks-{args.chunk_seconds}'
if args.asr_model!='small':name+='-'+args.asr_model
if args.robust:name+='-robust'
name+='-seek'
output_file=(args.output_dir or args.song_dir)/(name+'.json')
assert not output_file.exists(),f'Preserve existing ASR evidence: {output_file}'
report=json.loads((args.song_dir/'song-generation-report.json').read_text(encoding='utf-8'))
file=args.song_dir/'ieum-original-song.wav'
assert hashlib.sha256(file.read_bytes()).hexdigest()==report['outputSha256']
audio,sr=sf.read(file,dtype='float32',always_2d=True)
assert audio.shape[1]==2 and sr==48000 and abs(len(audio)/sr-report['duration'])<.1
assert np.isfinite(audio).all() and np.sqrt(np.mean(audio**2))>1e-5
source_hash=report['outputSha256']
if args.vocals:
 stems=json.loads((args.song_dir/'stem-separation-report.json').read_text(encoding='utf-8'))
 assert stems['sourceSha256']==source_hash
 file=args.song_dir/stems['stems']['vocals']['file']
 assert hashlib.sha256(file.read_bytes()).hexdigest()==stems['stems']['vocals']['sha256']
 audio,sr=sf.read(file,dtype='float32',always_2d=True)
full_duration=len(audio)/sr
end=args.end_seconds if args.end_seconds is not None else full_duration
assert 0<=args.start_seconds<end<=full_duration
assert args.lyric_line is None or args.output_dir,'Phrase diagnostics require a separate output directory'
audio=audio[round(args.start_seconds*sr):round(end*sr)]
g=math.gcd(sr,16000)
mono=resample_poly(audio.mean(axis=1),16000//g,sr//g)
torch.set_num_threads(2)
print('Loading actual Korean ASR validation model',flush=True)
processor=WhisperProcessor.from_pretrained(args.asr_dir,local_files_only=True)
asr_options={}
asr_weight_hashes=None
if args.asr_device=='cuda':
 from music_cache_bytes import tensor_header
 assert torch.cuda.is_available(),'CUDA ASR unavailable; preserve CPU results'
 files=sorted(args.asr_dir.glob('model*.safetensors'))
 assert files,'Inspect local actual weights before CUDA ASR'
 parameter_bytes=0;asr_weight_hashes={}
 for weight_file in files:
  header,_=tensor_header(weight_file)
  for name,entry in header.items():
   if name=='__metadata__':continue
   assert entry['dtype'] in ('F32','F16','BF16'),'Unvalidated ASR weight dtype'
   parameter_bytes+=math.prod(entry['shape'])*4
  with weight_file.open('rb') as stream:asr_weight_hashes[weight_file.name]=hashlib.file_digest(stream,'sha256').hexdigest()
 torch.cuda.empty_cache()
 free,_=torch.cuda.mem_get_info()
 assert free>parameter_bytes+2*1024**3,'Keep two GiB GPU headroom for actual FP32 ASR'
 asr_options['device_map']={'':'cuda'}
model=WhisperForConditionalGeneration.from_pretrained(args.asr_dir,local_files_only=True,attn_implementation='eager',dtype=torch.float32,low_cpu_mem_usage=True,**asr_options)
assert all(parameter.device.type==args.asr_device and parameter.dtype==torch.float32 for parameter in model.parameters()),'Actual ASR compute device/dtype mismatch'
assert args.chunk_seconds==0 or 5<=args.chunk_seconds<=30
chunk_size=args.chunk_seconds*16000 if args.chunk_seconds else len(mono)
segments=[]
generation_kwargs={'language':'korean','task':'transcribe','return_timestamps':True,'max_new_tokens':96 if args.chunk_seconds else 240}
if args.robust:
 generation_kwargs.update(condition_on_prev_tokens=False,compression_ratio_threshold=1.35,temperature=(0.,.2,.4,.6,.8,1.),logprob_threshold=-1.,no_speech_threshold=.6)
for offset in range(0,len(mono),chunk_size):
 chunk=mono[offset:offset+chunk_size]
 inputs=processor(chunk,sampling_rate=16000,return_tensors='pt',truncation=False,padding='longest',return_attention_mask=True)
 long_form=len(chunk)>30*16000
 with torch.inference_mode():
  output=model.generate(inputs.input_features.to(args.asr_device),attention_mask=inputs.attention_mask.to(args.asr_device),return_segments=long_form,**generation_kwargs)
 ids=output['sequences'] if isinstance(output,dict) else output
 recognized=processor.batch_decode(ids,skip_special_tokens=True)[0]
 sentence_segments=[]
 if long_form:
  # Long-form token timestamps reset at each seek. Use returned segments,
  # which include the model's actual seek offset; never flatten local times.
  for segment in output['segments'][0]:
   sentence_segments.append({'start':float(segment['start'])+offset/16000,'end':float(segment['end'])+offset/16000,'text':processor.tokenizer.decode(segment['tokens'],skip_special_tokens=True)})
  timed=' '.join(f"<|{s['start']:.2f}|>{s['text']}<|{s['end']:.2f}|>" for s in sentence_segments)
 else:
  timed=processor.batch_decode(ids,skip_special_tokens=True,decode_with_timestamps=True)[0]
  timed=re.sub(r'<\|([0-9]+\.[0-9]+)\|>',lambda m:f'<|{float(m.group(1))+offset/16000:.2f}|>',timed)
 segments.append({'start':offset/16000,'end':min(len(mono),offset+chunk_size)/16000,'text':recognized,'timestamped':timed,'sentenceSegments':sentence_segments})
 print(f'Actual ASR segment {len(segments)} complete',flush=True)
text=' '.join(s['text'] for s in segments)
timestamped=' '.join(s['timestamped'] for s in segments)
expected=re.sub(r'\[[^]]+\]','',report['lyrics'])
if args.lyric_line is not None:
 lines=[line.strip() for line in expected.splitlines() if line.strip()]
 assert 0<=args.lyric_line<len(lines)
 expected=lines[args.lyric_line]
normalize=lambda x:re.sub(r'[^가-힣a-zA-Z0-9]','',x).lower()
similarity=difflib.SequenceMatcher(None,normalize(expected),normalize(text)).ratio()
asr_model,asr_revision=('openai/whisper-large-v3-turbo','41f01f3fe87f28c78e2fbf8b568835947dd65ed9') if args.asr_model=='turbo' else ('openai/whisper-small','973afd24965f72e36ca33b3055d56a652f456b4d')
result={'actualAudioHashVerified':True,'sampleRate':sr,'duration':len(audio)/sr,'rms':float(np.sqrt(np.mean(audio**2))),'peak':float(np.max(np.abs(audio))),'asrModel':asr_model,'asrRevision':asr_revision,'recognizedLyrics':text,'timestampedRecognition':timestamped,'expectedLyrics':expected,'textSimilarity':similarity,'limits':['ASR recognition is evidence, not human listening or guaranteed lyric alignment','Requested tempo/key/Part range are not measured here','Backing separation and Guide integration remain separate verification']}
result.update(asrExecutionDevice=args.asr_device,asrComputeDtype='float32',asrWeightHashes=asr_weight_hashes)
timestamps=[float(t) for t in re.findall(r'<\|([0-9]+\.[0-9]+)\|>',timestamped)]
segment_timing_valid=all(all(s['start']<=float(t)<=s['end']+.1 for t in re.findall(r'<\|([0-9]+\.[0-9]+)\|>',s['timestamped'])) for s in segments)
timing_valid=bool(timestamps) and segment_timing_valid and all(0<=t<=len(audio)/sr+.1 for t in timestamps) and timestamps==sorted(timestamps)
result.update(sourceSha256=source_hash,inputFile=file.name,inputSha256=hashlib.sha256(file.read_bytes()).hexdigest(),timestampsWithinAudio=timing_valid,lyricAcceptance=similarity>=.8 and timing_valid,acceptanceRule='Automatic QA: normalized lyric similarity >=0.8 and monotonic timestamps within actual audio; human listening still required')
result.update(chunkSeconds=args.chunk_seconds,segments=segments,generationParameters=generation_kwargs,timestampSource='returned model segments with absolute seek offsets; short chunks use local model timestamps plus input offset')
result.update(analysisWindow={'start':args.start_seconds,'end':end},originalDuration=full_duration,lyricLineIndex=args.lyric_line,normalizedLyricsExact=normalize(expected)==normalize(text),diagnosticWindowOnly=args.start_seconds!=0 or end!=full_duration or args.lyric_line is not None,catalogRegistrationApproved=False,entryTimingAccepted=False)
result['limits'].append('Diagnostic window timestamps are relative to that window; excluded audio and full-song lyrics are not approved')
result.update(validationVersion='ieum-actual-asr-window-v1',validationScriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest())
output_file.parent.mkdir(parents=True,exist_ok=True)
output_file.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=True),flush=True)
if not result['lyricAcceptance']:raise SystemExit(2)
