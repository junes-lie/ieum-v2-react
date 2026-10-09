"""Measure actual generated song signals; requested key/BPM are not measurements."""
import argparse,hashlib,json,math
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
import librosa

p=argparse.ArgumentParser();p.add_argument('--song-dir',type=Path,required=True);p.add_argument('--output-dir',type=Path);a=p.parse_args()
output=(a.output_dir or a.song_dir)/'song-signal-analysis-report.json'
assert not output.exists(),f'Preserve existing analysis: {output}'
read=lambda name:json.loads((a.song_dir/name).read_text(encoding='utf-8'))
generation=read('song-generation-report.json');stems=read('stem-separation-report.json');alignment=read('lyric-word-alignment-report.json')
assert alignment['alignmentAccepted'] and alignment['sourceSha256']==generation['outputSha256']==stems['sourceSha256']
def load(stem):
 file=a.song_dir/stems['stems'][stem]['file']
 assert hashlib.sha256(file.read_bytes()).hexdigest()==stems['stems'][stem]['sha256']
 audio,sr=sf.read(file,dtype='float32',always_2d=True)
 g=math.gcd(sr,22050)
 return resample_poly(audio.mean(axis=1),22050//g,sr//g)
vocals=load('vocals');backing=load('backing');sr=22050
start=max(0,alignment['lyrics'][0]['time']-.25)
end=max(float(word['timestamp'][1]) for word in alignment['actualWordRecognition']['chunks'] if word['timestamp'][1] is not None)+.25
voice=vocals[int(start*sr):int(end*sr)]
print('Actual pYIN melody measurement',flush=True)
f0,voiced,prob=librosa.pyin(voice,sr=sr,fmin=librosa.note_to_hz('C2'),fmax=librosa.note_to_hz('C6'),frame_length=2048,hop_length=256)
valid=voiced & np.isfinite(f0) & (prob>=.75)
times=librosa.frames_to_time(np.arange(len(valid)),sr=sr,hop_length=256)+start
# Voiced runs are observations, never a replacement for word/beat alignment.
edges=np.diff(np.r_[False,valid,False].astype(int))
runs=[{'start':float(times[left]),'end':float(times[min(right,len(times)-1)])} for left,right in zip(np.flatnonzero(edges==1),np.flatnonzero(edges==-1)) if (right-left)*256/sr>=.15]
midis=librosa.hz_to_midi(f0[valid]);assert len(midis)>100,'Too few confident voiced observations'
pitch={'observedFrames':int(len(midis)),'voicedCoverage':float(np.mean(valid)),'minMidi':float(np.min(midis)),'maxMidi':float(np.max(midis)),'conservativeLowMidi':int(np.floor(np.min(midis))),'conservativeHighMidi':int(np.ceil(np.max(midis))),'tessituraLowMidi':int(np.floor(np.quantile(midis,.1))),'tessituraHighMidi':int(np.ceil(np.quantile(midis,.9))),'probabilityThreshold':.75,'method':'pYIN voiced F0; all retained extrema, not requested range'}
print('Actual backing beat/chroma measurement',flush=True)
tempo,beats=librosa.beat.beat_track(y=backing,sr=sr,units='time')
chroma=librosa.feature.chroma_stft(y=backing,sr=sr,n_fft=4096,hop_length=512,norm=None).mean(axis=1)
# Numeric cognitive key-profile data, not copied Essentia implementation.
# Reference: https://raw.githubusercontent.com/MTG/essentia/master/src/algorithms/tonal/key.cpp
profiles={'major':[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],'minor':[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17]}
names=['C','C#','D','E♭','E','F','F#','G','A♭','A','B♭','B']
keys=sorted([{'key':f'{names[i]} {mode}','correlation':float(np.corrcoef(chroma,np.roll(profile,i))[0,1])} for mode,profile in profiles.items() for i in range(12)],key=lambda x:x['correlation'],reverse=True)
report={'sourceSha256':generation['outputSha256'],'vocalSha256':stems['stems']['vocals']['sha256'],'backingSha256':stems['stems']['backing']['sha256'],'librosaVersion':librosa.__version__,'measuredWindow':{'start':start,'end':end},'melodyPitch':pitch,'estimatedBeatTempoBpm':float(np.asarray(tempo).reshape(-1)[0]),'detectedBeatTimes':beats.tolist(),'estimatedKeys':keys[:5],'keyCorrelationMargin':keys[0]['correlation']-keys[1]['correlation'],'requestedBpm':generation['requestedBpm'],'requestedKey':generation['requestedKey'],'limits':['Signal estimates require listening/score review; pitch octave errors and separation leakage remain possible','Beat tempo has half/double-time ambiguity','Estimated key correlation is not a calibrated probability or definitive key','No invented Part arrangement or physical microphone claim']}
report['confidentVoicedRuns']=runs
report['firstLyricTiming']={'asrStart':alignment['actualWordRecognition']['chunks'][0]['timestamp'][0],'asrEnd':alignment['actualWordRecognition']['chunks'][0]['timestamp'][1],'firstSustainedVoicedEstimate':runs[0]['start'] if runs else None,'approvedEntryTime':None,'limits':'Voicing can include accompaniment leakage or non-lyrical singing; ASR word interval is not a syllable onset. No automatic count-in approval.'}
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False),flush=True)
