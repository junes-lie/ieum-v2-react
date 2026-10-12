"""Separate rest DC offset from AC/frequency energy; not listening approval."""
import argparse,hashlib,json,math,wave
from pathlib import Path
import numpy as np
p=argparse.ArgumentParser();p.add_argument('--song-dir',type=Path,required=True);p.add_argument('--frame-timeline',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
assert not a.output.exists(),'Preserve previous evidence'
root=a.song_dir.resolve();report_path=root/'song-generation-report.json';report=json.loads(report_path.read_text(encoding='utf-8'))
source=root/report['outputFile'];assert hashlib.sha256(source.read_bytes()).hexdigest()==report['outputSha256']
with wave.open(str(source),'rb') as stream:
 assert stream.getsampwidth()==2 and stream.getcomptype()=='NONE','Expected retained PCM16 output'
 sr=stream.getframerate();channels=stream.getnchannels();audio=np.frombuffer(stream.readframes(stream.getnframes()),dtype='<i2').reshape(-1,channels).mean(axis=1)/32768.0
if a.frame_timeline:
 timeline=json.loads(a.frame_timeline.read_text(encoding='utf-8'))
 assert timeline['sourceAudioSha256']==report['outputSha256'] and timeline['generationReportSha256']==hashlib.sha256(report_path.read_bytes()).hexdigest()
 segments=timeline['segments'];scope='Verified native conditioning intervals'
else:
 position=0;segments=[]
 for index,(syllable,duration) in enumerate(zip(report['score']['syllables'],report['score']['durationsSeconds'])):
  segments.append({'syllableIndex':index,'syllable':syllable,'nativeStartSeconds':position,'nativeEndSeconds':position+duration});position+=duration
 scope='Requested score intervals; converter frame boundaries not supplied'
def observe(samples):
 if not len(samples):return None
 dc=float(np.mean(samples));ac=samples-dc;raw=float(np.mean(samples*samples));ac_power=float(np.mean(ac*ac))
 window=np.hanning(len(ac));spectrum=np.abs(np.fft.rfft(ac*window))**2;frequencies=np.fft.rfftfreq(len(ac),1/sr);total=float(spectrum.sum())
 return {'samples':len(samples),'rawRms':math.sqrt(raw),'dcOffset':dc,'acRms':math.sqrt(ac_power),'peak':float(np.max(np.abs(samples))),
  'dcPowerFraction':dc*dc/raw if raw else None,'windowedSpectralPowerFraction':{f'{low}-{high}Hz':float(spectrum[(frequencies>=low)&(frequencies<high)].sum()/total) if total else None for low,high in [(0,20),(20,100),(100,1000),(1000,8000),(8000,sr/2+1)]}}
rests=[]
for row in segments:
 if row['syllable']!='<X>':continue
 start,end=row['nativeStartSeconds'],min(row['nativeEndSeconds'],len(audio)/sr)
 slices=[]
 for index in range(4):
  left=start+(end-start)*index/4;right=start+(end-start)*(index+1)/4
  slices.append({'startSeconds':left,'endSeconds':right,'energy':observe(audio[round(left*sr):round(right*sr)])})
 rests.append({'syllableIndex':row['syllableIndex'],'startSeconds':start,'endSeconds':end,'energy':observe(audio[round(start*sr):round(end*sr)]),'quarters':slices})
result={'sourceAudioSha256':report['outputSha256'],'generationReportSha256':hashlib.sha256(report_path.read_bytes()).hexdigest(),'sampleRate':sr,'intervalScope':scope,'restObservations':rests,'musicalQualityApproved':False,'limitations':['AC and spectral energy are signal observations, not audibility or noise-source identification','Windowed band fractions are not perceptual loudness','No filtering, crop, silence masking, inference or file modification']}
a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
