"""Prepare a real excerpt for independent validation; preserve full-song failures."""
import argparse,json,hashlib
from pathlib import Path
import soundfile as sf
p=argparse.ArgumentParser();p.add_argument('--song-dir',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--start',type=float,required=True);p.add_argument('--duration',type=float,required=True);p.add_argument('--first-line',type=int,default=0);p.add_argument('--line-count',type=int,required=True);a=p.parse_args()
assert 15<=a.duration<=20 and not a.output_dir.exists()
read=lambda n:json.loads((a.song_dir/n).read_text(encoding='utf-8'))
g=read('song-generation-report.json');s=read('stem-separation-report.json')
assert g['outputSha256']==s['sourceSha256']
lines=[l for l in g['lyrics'].splitlines() if l.strip() and not l.startswith('[')]
target=lines[a.first_line:a.first_line+a.line_count];assert len(target)==a.line_count
a.output_dir.mkdir(parents=True)
lineage={'originalSourceSha256':g['outputSha256'],'originalDuration':g['duration'],'sourceStart':a.start,'duration':a.duration,'originalGenerationDirectory':str(a.song_dir),'limits':'Excerpt target must pass independent actual ASR and word alignment. Full-song failure remains unchanged.'}
for name,hashval in [('ieum-original-song.wav',g['outputSha256']),('vocals.wav',s['stems']['vocals']['sha256']),('backing.wav',s['stems']['backing']['sha256'])]:
 source=a.song_dir/name;assert hashlib.sha256(source.read_bytes()).hexdigest()==hashval
 audio,sr=sf.read(source,dtype='float32',always_2d=True)
 clip=audio[round(a.start*sr):round((a.start+a.duration)*sr)];assert len(clip)==round(a.duration*sr)
 out=a.output_dir/name;sf.write(out,clip,sr,subtype='PCM_16');h=hashlib.sha256(out.read_bytes()).hexdigest()
 if name=='ieum-original-song.wav':g.update(outputSha256=h,duration=a.duration,requestedDuration=None,lyrics='\n'.join(target),status='derived-excerpt-of-actual-model-output',outputFile=name,excerptLineage=lineage)
 else:s['stems'][name[:-4]].update(sha256=h,duration=a.duration)
s.update(sourceSha256=g['outputSha256'],excerptLineage=lineage)
for name,data in [('song-generation-report.json',g),('stem-separation-report.json',s)]:
 (a.output_dir/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(lineage,ensure_ascii=False))
