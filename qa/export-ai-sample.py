"""Export a measured 16–20 second excerpt of the actual AI song, preserving originals."""
import argparse,hashlib,json,subprocess,math
from pathlib import Path
import numpy as np
import soundfile as sf
import librosa,imageio_ffmpeg
from scipy.signal import resample_poly
p=argparse.ArgumentParser();p.add_argument('--song-dir',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--id',default='ieum-ai-light-v1-sample');p.add_argument('--first-line',type=int,default=1);a=p.parse_args()
read=lambda name:json.loads((a.song_dir/name).read_text(encoding='utf-8'))
generated=read('song-generation-report.json');stems=read('stem-separation-report.json');alignment=read('lyric-word-alignment-report.json')
assert alignment['alignmentAccepted'] and alignment['sourceSha256']==generated['outputSha256']==stems['sourceSha256']
# Find a 16–20 second section containing complete recognized lyric lines.
# Phrase boundaries come from measured word times; no even timing is invented.
lines=alignment['lyrics'];assert 0<=a.first_line<len(lines)
start=max(0,math.floor((lines[a.first_line]['time']-.2)*10)/10)
words=alignment['actualWordRecognition']['chunks'];chosen=None
for last in range(a.first_line,len(lines)):
 next_start=lines[last+1]['time'] if last+1<len(lines) else generated['duration']
 endings=[float(w['timestamp'][1]) for w in words if w['timestamp'][0] is not None and w['timestamp'][1] is not None and lines[last]['time']<=float(w['timestamp'][0])<next_start]
 if not endings:continue
 duration=max(16,math.ceil(max(endings)+.5-start))
 if duration<=20 and start+duration<=next_start:
  chosen=lines[a.first_line:last+1];break
assert chosen,'No complete 16–20 second phrase section at this measured start'
a.output_dir.mkdir(parents=True,exist_ok=True)
exported={}
for name,file,expected in [('sample','ieum-original-song.wav',generated['outputSha256']),('backing','backing.wav',stems['stems']['backing']['sha256']),('vocals','vocals.wav',stems['stems']['vocals']['sha256'])]:
 source=a.song_dir/file;assert hashlib.sha256(source.read_bytes()).hexdigest()==expected
 audio,sr=sf.read(source,dtype='float32',always_2d=True)
 clipped=audio[round(start*sr):round((start+duration)*sr)]
 assert len(clipped)==round(duration*sr) and np.isfinite(clipped).all()
 wav=a.output_dir/(name+'.wav');assert not wav.exists(),'Do not overwrite an existing edition'
 sf.write(wav,clipped,sr,subtype='PCM_16')
 if name=='vocals':
  g=math.gcd(sr,22050);voice=resample_poly(clipped.mean(axis=1),22050//g,sr//g)
  f0,voiced,prob=librosa.pyin(voice,sr=22050,fmin=librosa.note_to_hz('C2'),fmax=librosa.note_to_hz('C6'),hop_length=256)
  midis=librosa.hz_to_midi(f0[voiced & np.isfinite(f0) & (prob>=.75)])
  assert len(midis)>100
  observed_range={'lowMidi':int(np.floor(midis.min())),'highMidi':int(np.ceil(midis.max())),'frames':int(len(midis)),'method':'pYIN voiced observations at probability >=0.75; estimated, not a score-certified range'}
 else:
  mp3=a.output_dir/(name+'.mp3');assert not mp3.exists()
  subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-n','-i',str(wav),'-codec:a','libmp3lame','-q:a','3',str(mp3)],check=True)
  exported[name]={'file':mp3.name,'sha256':hashlib.sha256(mp3.read_bytes()).hexdigest(),'bytes':mp3.stat().st_size}
lyrics=[{'time':round(line['time']-start,3),'text':line['text']} for line in chosen]
validation=read('vocal-validation-report-robust-seek.json')
assert validation['lyricAcceptance'] and validation['sourceSha256']==generated['outputSha256']
report={'id':a.id,'title':generated['title'],'duration':duration,'sourceStart':start,'sourceSha256':generated['outputSha256'],'model':generated['model'],'revision':generated['revision'],'license':generated['license'],'seed':generated['seed'],'files':exported,'lyrics':lyrics,'observedRange':observed_range,'keyLabel':'원키','keyStatus':'unconfirmed; requested key is not asserted as actual key','asrGate':{'model':validation['asrModel'],'similarity':validation['textSimilarity']},'limits':['Automatic ASR acceptance is not pronunciation listening acceptance; preserve cross-check results separately','Word times are model estimates, not manual alignment','This is provided Guide audio, never a participant submission or personal profile sample']}
(a.output_dir/'sample-edition-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False),flush=True)
