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
p.add_argument('--source-alignment',type=Path)
p.add_argument('--part-alignment',type=Path)
p.add_argument('--generation-window-only',action='store_true',help='Measure actual PCM inside/outside a native mask; no Project harmony claims')
a=p.parse_args()
assert bool(a.source_alignment)==bool(a.part_alignment),'Compare two actual alignment reports together'
target=a.output_dir/'part-source-comparison.json'
assert not target.exists(),'Preserve existing comparison evidence'
read=lambda folder,name:json.loads((folder/name).read_text(encoding='utf-8'))
part=read(a.song_dir,'song-generation-report.json')
source=read(a.source_song,'song-generation-report.json')
assert part['taskType'] in ('lego','repaint') and part['trackName']=='vocals'
assert part['conditioningSourceSha256']==source['outputSha256']
for folder,report in [(a.song_dir,part),(a.source_song,source)]:
    file=folder/report['outputFile']
    assert hashlib.sha256(file.read_bytes()).hexdigest()==report['outputSha256']
if a.generation_window_only:
    assert not a.source_alignment and part.get('nativeGenerationWindow') and part.get('nativeGenerationMask')
    assert part['conditioningReportSha256']==hashlib.sha256((a.source_song/'song-generation-report.json').read_bytes()).hexdigest()
    original,rate=sf.read(a.source_song/source['outputFile'],dtype='float32',always_2d=True)
    generated,generated_rate=sf.read(a.song_dir/part['outputFile'],dtype='float32',always_2d=True)
    assert rate==generated_rate and original.shape[1]==generated.shape[1]
    source_window=part['conditioningSourceWindow']
    original=original[round(source_window['start']*rate):round(source_window['end']*rate)]
    assert original.shape==generated.shape
    mask=part['nativeGenerationMask']
    assert hashlib.sha256((a.song_dir/mask['file']).read_bytes()).hexdigest()==mask['sha256']
    window=part['nativeGenerationWindow'];duration=len(generated)/rate
    assert 0<=window['start']<window['end']<=duration
    regions=[]
    for name,start,end in [('before',0,window['start']),('inside',window['start'],window['end']),('after',window['end'],duration)]:
        reference=original[round(start*rate):round(end*rate)]
        candidate=generated[round(start*rate):round(end*rate)]
        if not reference.size:continue
        difference=candidate-reference
        regions.append({'region':name,'start':start,'end':end,'sampleValues':int(reference.size),'pcmExact':bool(np.array_equal(reference,candidate)),'rmsDifference':float(np.sqrt(np.mean(difference**2))),'maximumAbsoluteDifference':float(np.max(np.abs(difference)))})
    outside_regions=[region for region in regions if region['region']!='inside']
    result={'analysisVersion':'ieum-native-mask-pcm-v1','analysisScriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'sourceSha256':source['outputSha256'],'partSha256':part['outputSha256'],'nativeGenerationWindow':window,'maskSha256':mask['sha256'],'regions':regions,'outsideGenerationWindowPcmPreserved':all(region['pcmExact'] for region in outside_regions) if outside_regions else None,'musicalHarmonyApproved':False,'partArrangementApproved':False,'catalogRegistrationApproved':False,'limits':['Native latent conditioning mask is not a guarantee of decoded PCM preservation','Immediate parent candidate comparison, not an original Project chord or syllable alignment approval','No generated region spliced into existing audio; source remains unchanged']}
    a.output_dir.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False),flush=True)
    raise SystemExit(0)

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
backing_report=read(a.source_song,'stem-separation-report.json')['stems']['backing']
backing_file=a.source_song/backing_report['file']
assert hashlib.sha256(backing_file.read_bytes()).hexdigest()==backing_report['sha256']
backing,backing_rate=sf.read(backing_file,dtype='float32',always_2d=True)
backing=librosa.resample(backing.mean(axis=1),orig_sr=backing_rate,target_sr=22050)
backing=backing[round(window['start']*22050):round(window['end']*22050)][:length]
assert len(backing)==length
chroma=librosa.feature.chroma_stft(y=backing,sr=22050,n_fft=4096,hop_length=256,norm=None)
frames=np.flatnonzero(layer_valid)
assert chroma.shape[1]==layer.shape[0]
pitch_classes=np.rint(layer[frames]).astype(int)%12
energy=chroma[pitch_classes,frames]
total=chroma[:,frames].sum(axis=0)
nonzero=total>0
tone_energy={'sourceBackingSha256':backing_report['sha256'],'observedFrames':int(nonzero.sum()),'medianPitchClassEnergyShare':float(np.median(energy[nonzero]/total[nonzero])) if nonzero.any() else None,'pitchClassFrameCounts':{str(int(k)):int(v) for k,v in zip(*np.unique(pitch_classes,return_counts=True))},'method':'Actual source backing STFT chroma at confident Part F0 frame times; no chord labels or approval threshold','limits':['Spectral pitch-class overlap does not prove consonance, chord role, key or syllable timing','Backing overtone energy, detuning, separation leakage and F0 octave errors affect observations']}
result={'analysisVersion':'ieum-part-pair-signal-v1','sourceSha256':source['outputSha256'],'partSha256':part['outputSha256'],'sourceVocalSha256':reference_hash,'partVocalSha256':candidate_hash,'sourceWindow':window,'pairedVoicedFrames':int(paired.sum()),'sourceVoicedFrames':int(lead_valid.sum()),'partVoicedFrames':int(layer_valid.sum()),'pcmCorrelationAtSourceTime':correlation,'medianSemitoneDifference':float(np.median(delta)) if delta.size else None,'lowerFrameFraction':float(np.mean(delta<-.5)) if delta.size else None,'nearUnisonFrameFraction':float(np.mean(np.abs(delta)<=.5)) if delta.size else None,'roundedSemitoneIntervalCounts':{str(int(k)):int(v) for k,v in zip(intervals,counts)},'musicalHarmonyApproved':False,'partArrangementApproved':False,'catalogRegistrationApproved':False,'limits':['Corresponding source timestamps, not automatically verified syllable alignment','Pitch estimates can include octave errors and separation leakage','Different/lower pitches and PCM differences do not prove harmony against actual chords/key','No source transposition, inferred key approval, Track submission or catalog registration']}
a.output_dir.mkdir(parents=True,exist_ok=True)
result['actualBackingToneObservations']=tone_energy
result['analysisVersion']='ieum-part-pair-signal-v2'
result['analysisScriptSha256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
if a.source_alignment:
 source_alignment=json.loads(a.source_alignment.read_text(encoding='utf-8'))
 part_alignment=json.loads(a.part_alignment.read_text(encoding='utf-8'))
 for alignment,report,stem_hash in [(source_alignment,source,reference_hash),(part_alignment,part,candidate_hash)]:
  assert alignment['sourceSha256']==report['outputSha256'] and alignment['vocalSha256']==stem_hash
  assert alignment['alignmentAccepted'] and alignment['wordTimestampsWithinWindow']
 line_deltas=[]
 source_lines=[line for line in source_alignment['lyrics'] if line['time'] is not None and window['start']<=line['time']<window['end']]
 assert len(source_lines)==len(part_alignment['lyrics'])
 for lead_line,part_line in zip(source_lines,part_alignment['lyrics']):
  assert ''.join(lead_line['text'].split())==''.join(part_line['text'].split())
  assert part_line['time'] is not None
  line_deltas.append({'text':part_line['text'],'sourceWindowSeconds':lead_line['time']-window['start'],'partSeconds':part_line['time'],'partMinusSourceSeconds':part_line['time']-(lead_line['time']-window['start']),'sourceMatchedCharacters':lead_line['matchedCharacters'],'partMatchedCharacters':part_line['matchedCharacters'],'characters':part_line['characters']})
 result['actualLyricLineTimingComparison']={'lines':line_deltas,'sourceAlignmentSha256':hashlib.sha256(a.source_alignment.read_bytes()).hexdigest(),'partAlignmentSha256':hashlib.sha256(a.part_alignment.read_bytes()).hexdigest(),'timingApproved':False,'limits':['Cross-attention word estimates and fuzzy character matches are observations, not acoustic onset or syllable synchrony approval','Boundary-censored first word remains unresolved; no audio shifted or lyric time rewritten']}
target.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False),flush=True)
