"""Compare actual excerpt/full-source beat grids. Estimates never approve a count-in."""
import argparse, hashlib, json, math, subprocess
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
from scipy.signal import resample_poly

p=argparse.ArgumentParser()
p.add_argument('--output',type=Path,required=True)
a=p.parse_args()
root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'src/providedSamples.json').read_text(encoding='utf-8'))
full_dirs=[root.parent/'.ieum-p0-runtime/results/ieum-original-song-complete',root.parent/'.ieum-p0-runtime/results/ieum-original-warm-direct',Path('D:/IEUM-AI-runtime/results/ieum-original-rain-direct')]
ffmpeg=root.parent/'.ieum-p0-runtime/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
sr=22050;hop=256
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
def wav(file):
 y,rate=sf.read(file,dtype='float32',always_2d=True)
 divisor=math.gcd(rate,sr)
 return resample_poly(y.mean(axis=1),sr//divisor,rate//divisor)
def measure(y):
 onset=librosa.onset.onset_strength(y=y,sr=sr,hop_length=hop)
 tempo,frames=librosa.beat.beat_track(onset_envelope=onset,sr=sr,hop_length=hop,trim=False)
 times=librosa.frames_to_time(frames,sr=sr,hop_length=hop)
 intervals=np.diff(times)
 return {'bpm':float(np.asarray(tempo).reshape(-1)[0]),'beats':times.tolist(),'intervalCv':float(np.std(intervals)/np.mean(intervals)) if len(intervals)>1 else None}
results=[]
for song,directory in zip(catalog,full_dirs):
 print('Analyzing actual backing: '+song['title'],flush=True)
 generation=json.loads((directory/'song-generation-report.json').read_text(encoding='utf-8'))
 stems=json.loads((directory/'stem-separation-report.json').read_text(encoding='utf-8'))
 lineage=song['provenance'].get('excerptLineage')
 expected_source=lineage['originalSourceSha256'] if lineage else song['provenance']['sourceSha256']
 assert generation['outputSha256']==stems['sourceSha256']==expected_source,'Full-song source lineage mismatch'
 backing=directory/stems['stems']['backing']['file']
 assert sha(backing)==stems['stems']['backing']['sha256']
 excerpt=root/'public'/song['backingFile'].lstrip('/')
 assert sha(excerpt)==song['provenance']['backingSha256']
 decoded=subprocess.run([str(ffmpeg),'-v','error','-i',str(excerpt),'-f','f32le','-ac','1','-ar',str(sr),'pipe:1'],check=True,capture_output=True).stdout
 y=np.frombuffer(decoded,dtype='<f4');actual=measure(y);repeat=measure(y)
 assert actual==repeat,'Same actual signal must reproduce beat estimates'
 full=measure(wav(backing));start=lineage['sourceStart'] if lineage else song['provenance']['sourceStart'];end=start+song['duration']
 source_beats=np.array(full['beats']);mapped=source_beats[(source_beats>=start)&(source_beats<end)]-start
 times=np.array(actual['beats']);distances=[float(np.min(np.abs(mapped-time))) for time in times if len(mapped)]
 agreement=float(np.mean(np.array(distances)<=.08)) if distances else 0
 bpm_delta=abs(actual['bpm']-full['bpm'])/max(1,full['bpm'])
 stable=agreement>=.9 and bpm_delta<=.02 and actual['intervalCv'] is not None and actual['intervalCv']<=.08
 lead=root/'public'/song['leadInFile'].lstrip('/')
 info=song['provenance']['leadIn']
 assert sha(lead)==info['sha256'] and info['sourceSha256']==expected_source
 assert info['fullBackingSha256']==sha(backing) and info['sourceEnd']==start and info['sourceStart']==start-3
 lead_audio,rate=sf.read(lead,dtype='float32',always_2d=True)
 full_audio,full_rate=sf.read(backing,dtype='float32',always_2d=True)
 exact=full_audio[round((start-3)*full_rate):round(start*full_rate)]
 assert rate==full_rate and np.array_equal(lead_audio,exact),'Lead-in must be exact preceding source PCM'
 results.append({'id':song['id'],'title':song['title'],'excerptSha256':sha(excerpt),'fullBackingSha256':sha(backing),'sourceSha256':generation['outputSha256'],'sourceStart':start,'duration':song['duration'],'excerptEstimate':actual,'fullSourceEstimate':full,'mappedFullBeats':mapped.tolist(),'gridAgreementWithin80ms':agreement,'relativeTempoDifference':bpm_delta,'stableGridCandidate':bool(stable),'repeatExactlyEqual':True,'leadInExactSourcePcm':True,'countInApproved':False,'downbeat':None,'firstSungSyllableConfirmed':False})
report={'method':'librosa onset-strength + beat_track; whole separated backing versus actual deployed MP3 excerpt','librosaVersion':librosa.__version__,'sampleRate':sr,'hopLength':hop,'results':results,'limits':['Tempo/beat estimates are signal observations, not confirmed meter/downbeats','Half/double-time ambiguity and separation/encoding artefacts remain','No actual count-in, first syllable, hearing or device acceptance is approved','No requested BPM or genre preset is used as a measurement']}
a.output.parent.mkdir(parents=True,exist_ok=True)
with a.output.open('x',encoding='utf-8') as out:json.dump(report,out,ensure_ascii=False,indent=2)
print(json.dumps({'output':str(a.output),'results':[{k:r[k] for k in ['title','gridAgreementWithin80ms','relativeTempoDifference','stableGridCandidate','repeatExactlyEqual','countInApproved']}|{'excerptBpm':r['excerptEstimate']['bpm'],'fullBpm':r['fullSourceEstimate']['bpm'],'intervalCv':r['excerptEstimate']['intervalCv']} for r in results]},ensure_ascii=False),flush=True)
