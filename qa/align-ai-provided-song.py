"""Measure lyric word times from actual vocals; no forced transcript or uniform timing."""
import argparse,hashlib,json,math,re,difflib
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
import torch
from transformers import WhisperProcessor,WhisperForConditionalGeneration,pipeline

p=argparse.ArgumentParser()
p.add_argument('--song-dir',type=Path,required=True)
p.add_argument('--asr-dir',type=Path,required=True)
p.add_argument('--asr-model',choices=['small','turbo'],default='small')
p.add_argument('--output-dir',type=Path)
p.add_argument('--start-seconds',type=float,default=0)
p.add_argument('--end-seconds',type=float)
a=p.parse_args()
output_dir=a.output_dir or a.song_dir
output_file=output_dir/'lyric-word-alignment-report.json'
if output_file.exists():raise FileExistsError(f'Preserve existing alignment evidence: {output_file}')
generation=json.loads((a.song_dir/'song-generation-report.json').read_text(encoding='utf-8'))
stems=json.loads((a.song_dir/'stem-separation-report.json').read_text(encoding='utf-8'))
validation_name='vocal-validation-report'+('-turbo' if a.asr_model=='turbo' else '')+'-robust-seek.json'
accepted=json.loads((a.song_dir/validation_name).read_text(encoding='utf-8'))
assert accepted['asrModel']==('openai/whisper-large-v3-turbo' if a.asr_model=='turbo' else 'openai/whisper-small')
assert accepted['lyricAcceptance'] and accepted['sourceSha256']==generation['outputSha256']==stems['sourceSha256']
file=a.song_dir/'vocals.wav'
input_hash=hashlib.sha256(file.read_bytes()).hexdigest()
assert input_hash==accepted['inputSha256']==stems['stems']['vocals']['sha256']
audio,sr=sf.read(file,dtype='float32',always_2d=True)
duration=len(audio)/sr
end_seconds=a.end_seconds if a.end_seconds is not None else duration
assert 0<=a.start_seconds<end_seconds<=duration
audio_window=audio[round(a.start_seconds*sr):round(end_seconds*sr)]
g=math.gcd(sr,16000)
mono=resample_poly(audio_window.mean(axis=1),16000//g,sr//g)
torch.set_num_threads(2)
processor=WhisperProcessor.from_pretrained(a.asr_dir,local_files_only=True)
model=WhisperForConditionalGeneration.from_pretrained(a.asr_dir,local_files_only=True,dtype=torch.float32,attn_implementation='eager',low_cpu_mem_usage=True)
asr=pipeline('automatic-speech-recognition',model=model,tokenizer=processor.tokenizer,feature_extractor=processor.feature_extractor,device='cpu')
print('Actual word alignment inference; lyrics are not supplied to ASR',flush=True)
result=asr({'array':mono,'sampling_rate':16000},return_timestamps='word',generate_kwargs={'language':'korean','task':'transcribe','condition_on_prev_tokens':False,'compression_ratio_threshold':1.35,'temperature':(0.,.2,.4,.6,.8,1.),'logprob_threshold':-1.,'no_speech_threshold':.6})
for word in result['chunks']:
 word['timestamp']=tuple(None if t is None else float(t)+a.start_seconds for t in word['timestamp'])
norm=lambda x:re.sub(r'[^가-힣a-zA-Z0-9]','',x).lower()
lines=[line for line in generation['lyrics'].splitlines() if line.strip() and not line.startswith('[')]
expected=''.join(norm(line) for line in lines)
observed='';char_times=[]
for word in result['chunks']:
 value=norm(word['text']);start,end=word['timestamp']
 if start is None or end is None:continue
 observed+=value;char_times.extend([float(start)]*len(value))
matcher=difflib.SequenceMatcher(None,expected,observed,autojunk=False)
matched={}
for block in matcher.get_matching_blocks():
 for i in range(block.size):matched[block.a+i]=char_times[block.b+i]
offset=0;aligned=[]
for line in lines:
 length=len(norm(line));times=[matched[i] for i in range(offset,offset+length) if i in matched]
 aligned.append({'text':line,'time':min(times) if times else None,'matchedCharacters':len(times),'characters':length})
 offset+=length
times=[line['time'] for line in aligned]
valid=all(t is not None and 0<=t<len(audio)/sr for t in times) and all(x<y for x,y in zip(times,times[1:]))
word_timing_valid=all(start is not None and end is not None and a.start_seconds<=start<=end<=end_seconds+.1 for start,end in (word['timestamp'] for word in result['chunks']))
word_starts=[word['timestamp'][0] for word in result['chunks']]
word_timing_valid=word_timing_valid and all(t is not None for t in word_starts) and word_starts==sorted(word_starts,key=lambda t:float('-inf') if t is None else t)
report={'sourceSha256':generation['outputSha256'],'vocalSha256':input_hash,'asrModel':accepted['asrModel'],'asrRevision':accepted['asrRevision'],'actualWordRecognition':result,'textSimilarity':matcher.ratio(),'lyrics':aligned,'alignmentAccepted':valid and matcher.ratio()>=.8,'method':'Whisper cross-attention word alignment; line starts are first actually matched word times, not evenly spaced or forced text','limits':['ASR word times and fuzzy matching require listening review','No measured key, tempo or Part range guarantee']}
report.update(analysisWindow={'start':a.start_seconds,'end':end_seconds},wordTimestampsWithinWindow=word_timing_valid,catalogRegistrationApproved=False)
report['limits'].extend(['Windowed recognition does not approve excluded intro or outro','Word onset requires independent acoustic and listening validation; text similarity alone is insufficient'])
report['alignmentAccepted']=report['alignmentAccepted'] and word_timing_valid
boundary_censored=bool(times and times[0] is not None and times[0]<=a.start_seconds)
report.update(firstWordBoundaryCensored=boundary_censored,entryTimingCandidate=times[0] if report['alignmentAccepted'] and not boundary_censored else None,entryTimingAccepted=False,approvedEntryTime=None)
if boundary_censored:report['limits'].append('First matched word starts at the analysis boundary; its actual onset is unresolved')
output_dir.mkdir(parents=True,exist_ok=True)
output_file.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False),flush=True)
if not report['alignmentAccepted']:raise SystemExit(2)
