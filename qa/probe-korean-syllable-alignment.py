"""Research-only Korean syllable alignment; never approves a score or catalog.
Run via run-ai-resource-guard.ps1. Dependencies/checkpoint live outside Git.
"""
import argparse, hashlib, json, math, re, sys, time
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('--runtime-dir',type=Path,required=True)
p.add_argument('--audio-file',type=Path,required=True)
p.add_argument('--output-dir',type=Path,required=True)
p.add_argument('--start-second',type=float,default=0)
p.add_argument('--duration-second',type=float,default=7)
p.add_argument('--text',default='오늘도 함께해요')
p.add_argument('--expected-score-report',type=Path)
a=p.parse_args()
assert math.isfinite(a.start_second) and a.start_second>=0
assert math.isfinite(a.duration_second) and 0<a.duration_second<=10
assert a.audio_file.is_file() and not a.output_dir.exists()
syllables=[c for c in a.text if not c.isspace()]
assert syllables and all('\uac00'<=c<='\ud7a3' for c in syllables)
root=a.runtime_dir.resolve()
checkpoint=root/'mms-model/model.pt'
assert checkpoint.is_file() and checkpoint.stat().st_size==1262047414
sys.path.insert(0,str(root/'mms-deps'))
import numpy as np
import soundfile as sf
import torch,torchaudio,uroman
from torchaudio.pipelines._wav2vec2 import utils
assert torch.__version__=='2.8.0+cu126' and torchaudio.__version__=='2.8.0+cu126'
assert torch.cuda.is_available()
torch.set_num_threads(2)
def sha(path):
 digest=hashlib.sha256()
 with Path(path).open('rb') as f:
  for chunk in iter(lambda:f.read(1048576),b''):digest.update(chunk)
 return digest.hexdigest()
assert sha(checkpoint)=='20ef12963ab4924bef49ac4fc7f58ad5da2ee43b2c11bc8c853c9b90ecdbc680'
expected=None
if a.expected_score_report:
 source=json.loads(a.expected_score_report.read_text(encoding='utf-8'))
 assert source['outputSha256']==sha(a.audio_file)
 expected=[];elapsed=0
 for char,duration in zip(source['score']['syllables'],source['score']['durationsSeconds']):
  if char!='<X>':expected.append({'syllable':char,'requestedStart':elapsed,'requestedEnd':elapsed+duration})
  elapsed+=duration
 assert [r['syllable'] for r in expected]==syllables
with sf.SoundFile(a.audio_file) as f:
 rate=f.samplerate
 f.seek(round(a.start_second*rate))
 audio=f.read(round(a.duration_second*rate),dtype='float32',always_2d=True).mean(axis=1)
assert len(audio)>0 and np.isfinite(audio).all() and np.sqrt(np.mean(audio**2))>1e-5
bundle=torchaudio.pipelines.MMS_FA
romanizer=uroman.Uroman()
def romanize(chars):
 words=[re.sub("[^a-z']",'',romanizer.romanize_string(c,lcode='kor').lower()) for c in chars]
 assert all(words)
 return words
words=romanize(syllables)
wrong_chars=list('차갑게식은바람')
wrong_words=romanize(wrong_chars)
tokenizer=bundle.get_tokenizer();aligner=bundle.get_aligner()
for text in [words,wrong_words]:tokenizer(text)
wave=torchaudio.functional.resample(torch.from_numpy(audio)[None],rate,bundle.sample_rate)
start=time.perf_counter()
with torch.device('meta'):
 model=utils._get_model(bundle._model_type,bundle._params)
state=torch.load(checkpoint,map_location='cpu',weights_only=True,mmap=True)
if bundle._remove_aux_axis:utils._remove_aux_axes(state,bundle._remove_aux_axis)
model.load_state_dict(state,strict=True,assign=True)
del state
model=utils._extend_model(model,normalize_waveform=bundle._normalize_waveform,apply_log_softmax=True,append_star=False).eval().cuda()
torch.cuda.reset_peak_memory_stats()
with torch.inference_mode():emission,_=model(wave.cuda())
peak=torch.cuda.max_memory_allocated()
emission=emission.cpu();del model;torch.cuda.empty_cache()
ratio=wave.shape[1]/emission.shape[1]/bundle.sample_rate
labels=bundle.get_labels(star=None)
greedy=torch.unique_consecutive(emission[0].argmax(dim=-1)).tolist()
raw=''.join(labels[i] for i in greedy if i!=0)
def align(chars,words):
 spans=aligner(emission[0],tokenizer(words))
 rows=[]
 for char,word,group in zip(chars,words,spans):
  count=sum(x.end-x.start for x in group)
  rows.append({'syllable':char,'romanized':word,'start':a.start_second+group[0].start*ratio,'end':a.start_second+group[-1].end*ratio,'tokenFrames':count,'meanPathProbability':sum(float(x.score)*(x.end-x.start) for x in group)/count,'tokens':[{'label':labels[x.token],'startFrame':x.start,'endFrame':x.end,'score':float(x.score)} for x in group]})
 return rows
correct=align(syllables,words);wrong=align(wrong_chars,wrong_words)
if expected:
 for row,target in zip(correct,expected):row['startDifferenceFromRequestedScore']=row['start']-target['requestedStart']
report={'status':'unapproved-forced-alignment-candidate','model':'MMS_FA','modelUrl':bundle._path,'license':'CC-BY-NC-4.0; no production adoption','checkpointSha256':sha(checkpoint),'audioSha256':sha(a.audio_file),'scriptSha256':sha(Path(__file__)),'torchVersion':torch.__version__,'torchaudioVersion':torchaudio.__version__,'uromanVersion':'1.3.1','window':{'start':a.start_second,'duration':len(audio)/rate},'rawGreedyRomanization':raw,'correctTranscript':a.text,'correctSyllables':correct,'wrongTranscriptControl':''.join(wrong_chars),'wrongSyllables':wrong,'requestedScoreComparison':expected,'wallSeconds':time.perf_counter()-start,'gpuPeakAllocatedBytes':peak,'sourceScoreVerified':False,'syllableTimingApproved':False,'harmonyApproved':False,'catalogRegistrationApproved':False,'limitations':['Forced text is an input, not independently recognized lyrics','Requested synthetic score boundaries are not measured acoustic ground truth','Path scores are observations, not calibrated correctness probabilities','No physical listening or production license approval']}
a.output_dir.mkdir(parents=True)
(a.output_dir/'syllable-alignment-candidate.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'status':report['status'],'correctRows':len(correct),'wrongRows':len(wrong),'meanCorrectScore':sum(r['meanPathProbability'] for r in correct)/len(correct),'meanWrongScore':sum(r['meanPathProbability'] for r in wrong)/len(wrong),'gpuPeakAllocatedBytes':peak,'wallSeconds':report['wallSeconds']},ensure_ascii=False),flush=True)
