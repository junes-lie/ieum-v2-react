"""Measure actual source/Part pitch intervals; never approve musical harmony."""
import argparse,hashlib,json
from pathlib import Path
import numpy as np
import soundfile as sf
import librosa

p=argparse.ArgumentParser()
p.add_argument('--song-dir',type=Path,required=True)
p.add_argument('--source-song',type=Path,required=True)
p.add_argument('--output-dir',type=Path,required=True)
a=p.parse_args()
target=a.output_dir/'part-source-comparison.json'
assert not target.exists(),'Preserve existing comparison evidence'
read=lambda folder,name:json.loads((folder/name).read_text(encoding='utf-8'))
part=read(a.song_dir,'song-generation-report.json')
source=read(a.source_song,'song-generation-report.json')
assert part['taskType']=='lego' and part['trackName']=='vocals'
assert part['conditioningSourceSha256']==source['outputSha256']
for folder,report in [(a.song_dir,part),(a.source_song,source)]:
    file=folder/report['outputFile']
    assert hashlib.sha256(file.read_bytes()).hexdigest()==report['outputSha256']

def vocal(folder,report):
    stems=read(folder,'stem-separation-report.json')
    assert stems['sourceSha256']==report['outputSha256']
    stem=stems['stems']['vocals'];file=folder/stem['file']
    assert hashlib.sha256(file.read_bytes()).hexdigest()==stem['sha256']
    audio,rate=sf.read(file,dtype='float32',always_2d=True)
    return librosa.resample(audio.mean(axis=1),orig_sr=rate,target_sr=22050),stem['sha256']

reference,reference_hash=vocal(a.source_song,source)
candidate,candidate_hash=vocal(a.song_dir,part)
window=part['conditioningSourceWindow']
reference=reference[round(window['start']*22050):round(window['end']*22050)]
assert abs(len(reference)-len(candidate))<=2,'Compare the actual corresponding source window'
length=min(len(reference),len(candidate))
reference=reference[:length];candidate=candidate[:length]

def pitches(audio):
    f0,voiced,probability=librosa.pyin(audio,fmin=librosa.note_to_hz('C2'),fmax=librosa.note_to_hz('C6'),sr=22050,frame_length=2048,hop_length=256)
    valid=voiced & np.isfinite(f0) & (probability>=.75)
    midi=np.full(f0.shape,np.nan)
    midi[valid]=librosa.hz_to_midi(f0[valid])
    return midi,valid

print('Actual corresponding source/Part pitch interval measurement',flush=True)
lead,lead_valid=pitches(reference)
layer,layer_valid=pitches(candidate)
paired=lead_valid & layer_valid
delta=layer[paired]-lead[paired]
intervals,counts=np.unique(np.rint(delta).astype(int),return_counts=True)
correlation=float(np.corrcoef(reference,candidate)[0,1]) if np.std(reference)>0 and np.std(candidate)>0 else None
result={'analysisVersion':'ieum-part-pair-signal-v1','sourceSha256':source['outputSha256'],'partSha256':part['outputSha256'],'sourceVocalSha256':reference_hash,'partVocalSha256':candidate_hash,'sourceWindow':window,'pairedVoicedFrames':int(paired.sum()),'sourceVoicedFrames':int(lead_valid.sum()),'partVoicedFrames':int(layer_valid.sum()),'pcmCorrelationAtSourceTime':correlation,'medianSemitoneDifference':float(np.median(delta)) if delta.size else None,'lowerFrameFraction':float(np.mean(delta<-.5)) if delta.size else None,'nearUnisonFrameFraction':float(np.mean(np.abs(delta)<=.5)) if delta.size else None,'roundedSemitoneIntervalCounts':{str(int(k)):int(v) for k,v in zip(intervals,counts)},'musicalHarmonyApproved':False,'partArrangementApproved':False,'catalogRegistrationApproved':False,'limits':['Corresponding source timestamps, not automatically verified syllable alignment','Pitch estimates can include octave errors and separation leakage','Different/lower pitches and PCM differences do not prove harmony against actual chords/key','No source transposition, inferred key approval, Track submission or catalog registration']}
a.output_dir.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False),flush=True)
