"""Measure actual audio against diagnostic score inputs, without musical approval."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np,soundfile as sf,librosa
from scipy.signal import resample_poly
p=argparse.ArgumentParser();p.add_argument('--song-dir',type=Path,required=True);a=p.parse_args()
root=a.song_dir.resolve()
target=root/'score-measurement.json';assert not target.exists()
report=json.loads((root/'song-generation-report.json').read_text(encoding='utf-8'))
source=root/report['outputFile'];assert hashlib.sha256(source.read_bytes()).hexdigest()==report['outputSha256']
audio,sr=sf.read(source,dtype='float32',always_2d=True)
mono=resample_poly(audio.mean(axis=1),147,320)
f0,voiced,confidence=librosa.pyin(mono,sr=22050,fmin=librosa.note_to_hz('C2'),fmax=librosa.note_to_hz('C7'),frame_length=2048,hop_length=256)
times=librosa.frames_to_time(np.arange(len(f0)),sr=22050,hop_length=256)
valid=voiced&np.isfinite(f0)&(confidence>=.75)
midi=librosa.hz_to_midi(np.where(np.isfinite(f0),f0,1))
position=0;observations=[]
for syllable,note,duration in zip(report['score']['syllables'],report['score']['notesMidi'],report['score']['durationsSeconds']):
 selected=(times>=position+.08)&(times<position+duration-.08)&valid
 segment=audio[round(position*sr):round((position+duration)*sr)]
 observed=float(np.median(midi[selected])) if selected.any() else None
 observations.append({'syllable':syllable,'start':position,'end':position+duration,'inputMidi':note,'confidentFrames':int(selected.sum()),'observedMedianMidi':observed,'differenceSemitones':observed-note if observed is not None and note else None,'rms':float(np.sqrt(np.mean(segment**2))) if segment.size else None})
 position+=duration
result={'sourceSha256':report['outputSha256'],'inputDuration':position,'actualDuration':len(audio)/sr,'durationDifference':len(audio)/sr-position,'observations':observations,'analysis':'pYIN probability >= .75, excluding 80ms segment edges; measured output, not inferred input','musicalHarmonyApproved':False,'sourceSongConnected':False,'catalogRegistrationApproved':False,'limitations':['A synthetic diagnostic score; no original-song chord or syllable alignment validation','F0 estimates can contain octave/separation errors','No listening or voice identity acceptance']}
target.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=False))
