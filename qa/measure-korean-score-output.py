"""Measure actual audio against diagnostic score inputs, without musical approval."""
import argparse,hashlib,json,math
from pathlib import Path
import numpy as np,soundfile as sf,librosa
from scipy.signal import resample_poly
p=argparse.ArgumentParser();p.add_argument('--song-dir',type=Path,required=True);p.add_argument('--output-dir',type=Path);p.add_argument('--legacy-model-index',action='store_true',help='Explicitly interpret old notesMidi field as pinned model indices; preserve prior evidence');a=p.parse_args()
root=a.song_dir.resolve()
target=(a.output_dir or root)/'score-measurement.json';assert not target.exists()
report=json.loads((root/'song-generation-report.json').read_text(encoding='utf-8'))
source=root/report['outputFile'];assert hashlib.sha256(source.read_bytes()).hexdigest()==report['outputSha256']
audio,sr=sf.read(source,dtype='float32',always_2d=True)
assert np.isfinite(audio).all() and len(audio)>0
g=math.gcd(sr,22050)
mono=resample_poly(audio.mean(axis=1),22050//g,sr//g)
f0,voiced,confidence=librosa.pyin(mono,sr=22050,fmin=librosa.note_to_hz('C2'),fmax=librosa.note_to_hz('C7'),frame_length=2048,hop_length=256)
times=librosa.frames_to_time(np.arange(len(f0)),sr=22050,hop_length=256)
valid=voiced&np.isfinite(f0)&(confidence>=.75)
midi=librosa.hz_to_midi(np.where(np.isfinite(f0),f0,1))
score=report['score']
indices=score.get('modelNoteIndices',score.get('notesMidi'))
encoded='modelNoteIndices' in score or a.legacy_model_index
if encoded:
 assert report['model']=='CODEJIN/DiffSingerKR' and report['revision']=='26f95ac2554b6a6725706ed2a7991a62f7f714a9','Encoding applies only to the pinned diagnostic model'
expected=[n-12 if n else None for n in indices] if encoded else [n if n else None for n in indices]
assert len(score['syllables'])==len(indices)==len(score['durationsSeconds'])
def full_interval_observation(start,end):
 interval=(times>=start)&(times<end)
 selected=interval&valid
 values=midi[selected]
 frames=np.flatnonzero(selected)
 runs=np.split(frames,np.flatnonzero(np.diff(frames)>1)+1) if len(frames) else []
 return {'totalFrames':int(interval.sum()),'confidentFrames':int(selected.sum()),
         'observedMedianMidi':float(np.median(values)) if len(values) else None,
         'observedMinMidi':float(np.min(values)) if len(values) else None,
         'observedMaxMidi':float(np.max(values)) if len(values) else None,
         'firstConfidentFrameSeconds':float(times[frames[0]]) if len(frames) else None,
         'lastConfidentFrameSeconds':float(times[frames[-1]]) if len(frames) else None,
         'longestConsecutiveConfidentFrames':max((len(run) for run in runs),default=0),
         'frameHopSeconds':256/22050,'analysisWindowSeconds':2048/22050}

position=0;observations=[]
for index,(syllable,note,expected_note,duration) in enumerate(zip(score['syllables'],indices,expected,score['durationsSeconds'])):
 curve=(score.get('noteCurves') or [None]*len(indices))[index]
 varying=curve is not None and len({event['modelNoteIndex'] for event in curve})>1
 if varying:expected_note=None
 selected=(times>=position+.08)&(times<position+duration-.08)&valid
 segment=audio[round(position*sr):round((position+duration)*sr)]
 observed=float(np.median(midi[selected])) if selected.any() else None
 observations.append({'syllable':syllable,'start':position,'end':position+duration,'modelNoteIndex':note if encoded and not varying else None,'expectedMidi':expected_note,'expectedPitchVaries':varying,'confidentFrames':int(selected.sum()),'observedMedianMidi':observed,'differenceSemitones':observed-expected_note if observed is not None and expected_note is not None else None,'rms':float(np.sqrt(np.mean(segment**2))) if segment.size else None})
 observations[-1].update(fullInterval=full_interval_observation(position,position+duration),interiorWindowSeconds=max(0,duration-.16))
 position+=duration
event_observations=[]
for event in score.get('expandedNoteEvents',[]):
 start=event['actualStartSeconds'];end=event['actualEndSeconds']
 selected=(times>=start+.08)&(times<end-.08)&valid
 observed=float(np.median(midi[selected])) if selected.any() else None
 event_observations.append({**event,'confidentFrames':int(selected.sum()),'observedMedianMidi':observed,'differenceSemitones':observed-event['expectedMidi'] if observed is not None else None})
 event_observations[-1].update(fullInterval=full_interval_observation(start,end),interiorWindowSeconds=max(0,end-start-.16))
result={'sourceSha256':report['outputSha256'],'inputDuration':position,'actualDuration':len(audio)/sr,'durationDifference':len(audio)/sr-position,'observations':observations,'noteEventObservations':event_observations,'inputEncoding':'pinned model index offset +12' if encoded else 'legacy uncalibrated MIDI label','legacyReinterpretation':a.legacy_model_index,'measurementScriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'analysis':'pYIN probability >= .75, excluding 80ms segment edges; measured output, not inferred input','musicalHarmonyApproved':False,'sourceSongConnected':False,'catalogRegistrationApproved':False,'limitations':['Explicit diagnostic score; no original-song chord or syllable alignment validation','F0 estimates can contain octave/separation errors','No listening or voice identity acceptance']}
result['inputPurpose']=score.get('inputPurpose',(report.get('scoreCalibration') or {}).get('purpose'))
result['fullIntervalScope']='Untrimmed interval distribution alongside unchanged interior estimate; not a substitute pass criterion. Short windows/glides and confidence filtering can bias either estimate.'
result['frameTimingScope']='Centered analysis-frame timestamps and consecutive voiced-confidence support only; not phonetic/note boundaries, exact sustained duration or validation of the expected pitch. Gaps and the 2048-sample analysis window limit timing interpretation.'
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=False))
