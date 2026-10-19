"""Register a validated real excerpt; never replace user samples or existing assets."""
import argparse,json,hashlib,shutil,re
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--edition-dir',type=Path,required=True);p.add_argument('--song-dir',type=Path,required=True);p.add_argument('--clip-validation',type=Path,required=True);p.add_argument('--clip-alignment',type=Path,required=True);p.add_argument('--asset-directory',required=True);p.add_argument('--mood',required=True);a=p.parse_args()
root=Path(__file__).resolve().parent.parent
read=lambda path:json.loads(path.read_text(encoding='utf-8'))
r=read(a.edition_dir/'sample-edition-report.json');g=read(a.song_dir/'song-generation-report.json');v=read(a.song_dir/'vocal-validation-report-robust-seek.json');alignment=read(a.song_dir/'lyric-word-alignment-report.json')
assert r['sourceSha256']==g['outputSha256']==v['sourceSha256']==alignment['sourceSha256']
assert v['lyricAcceptance'] and alignment['alignmentAccepted'] and 15<=r['duration']<=20
clip=read(a.clip_validation)
assert clip['lyricAcceptance'] and clip['timestampsWithinAudio'] and clip['textSimilarity']>=.8
assert clip['sourceSha256']==hashlib.sha256((a.edition_dir/'sample.wav').read_bytes()).hexdigest()
assert clip['inputSha256']==hashlib.sha256((a.edition_dir/'vocals.wav').read_bytes()).hexdigest()
normalize=lambda text:re.sub(r'[^가-힣a-zA-Z0-9]','',text).lower()
assert normalize(clip['expectedLyrics'])==normalize('\n'.join(line['text'] for line in r['lyrics']))
clip_alignment=read(a.clip_alignment)
assert clip_alignment['alignmentAccepted'] and clip_alignment['sourceSha256']==clip['sourceSha256'] and clip_alignment['vocalSha256']==clip['inputSha256']
assert normalize('\n'.join(line['text'] for line in clip_alignment['lyrics']))==normalize(clip['expectedLyrics'])
destination=(root/'public/audio'/a.asset_directory).resolve();assert destination.is_relative_to(root/'public/audio')
destination.mkdir(parents=True,exist_ok=True)
for kind in ['sample','backing']:
 source=a.edition_dir/r['files'][kind]['file'];expected=r['files'][kind]['sha256']
 assert hashlib.sha256(source.read_bytes()).hexdigest()==expected
 target=destination/(kind+'.mp3')
 if target.exists():assert hashlib.sha256(target.read_bytes()).hexdigest()==expected,'Never overwrite an existing edition'
 else:shutil.copy2(source,target)
 assert hashlib.sha256(target.read_bytes()).hexdigest()==expected
note=lambda midi:['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][midi%12]+str(midi//12-1)
observed=r['observedRange'];range_label=note(observed['lowMidi'])+'–'+note(observed['highMidi'])
song={'id':r['id'],'title':r['title'],'key':r['keyLabel'],'range':range_label,'lyric':r['lyrics'][0]['text'],'mood':a.mood,'duration':r['duration'],'audioFile':'/audio/'+a.asset_directory+'/sample.mp3','backingFile':'/audio/'+a.asset_directory+'/backing.mp3','lyrics':r['lyrics'],'provenance':{'model':r['model'],'revision':r['revision'],'license':r['license'],'seed':r['seed'],'sourceSha256':r['sourceSha256'],'sourceStart':r['sourceStart'],'audioSha256':r['files']['sample']['sha256'],'backingSha256':r['files']['backing']['sha256'],'rangeMethod':f"pYIN voiced observations, probability >= 0.75, {observed['frames']} retained frames; estimated {range_label}",'lyricsMethod':f"Whisper-small actual vocal word alignment; automatic similarity {alignment['textSimilarity']}",'listeningReview':'pending; automatic validation is not pronunciation listening acceptance','keyStatus':r['keyStatus']}}
if g.get('excerptLineage'):
 lineage=g['excerptLineage']
 song['provenance']['excerptLineage']={k:lineage[k] for k in ['originalSourceSha256','originalDuration','sourceStart','duration','limits']}
 song['provenance']['acceptanceScope']='Validated provided excerpt only; not original full-song lyric acceptance'
 original_dir=Path(lineage['originalGenerationDirectory'])
 crosschecks=[]
 for name in ['vocal-validation-report-robust-seek.json','vocal-validation-report-turbo-robust-seek.json']:
  if (original_dir/name).exists():
   check=read(original_dir/name)
   assert check['sourceSha256']==lineage['originalSourceSha256']
   crosschecks.append({'model':check['asrModel'],'similarity':check['textSimilarity'],'passed':check['lyricAcceptance']})
 song['provenance']['originalFullSongValidation']=crosschecks
song['provenance']['generationTask']=g.get('taskType','cover' if g.get('musicCodeModel') else 'text2music')
song['provenance']['clipValidation']={'model':clip['asrModel'],'revision':clip['asrRevision'],'similarity':clip['textSimilarity'],'timestampsWithinAudio':clip['timestampsWithinAudio'],'passed':clip['lyricAcceptance']}
crosschecks=[]
for name in ['vocal-validation-report-robust-seek.json','vocal-validation-report-turbo-robust-seek.json']:
 path=a.clip_validation.parent/name
 if path.exists() and path.resolve()!=a.clip_validation.resolve():
  other=read(path)
  assert other['sourceSha256']==clip['sourceSha256'] and other['inputSha256']==clip['inputSha256']
  crosschecks.append({'model':other['asrModel'],'revision':other['asrRevision'],'similarity':other['textSimilarity'],'timestampsWithinAudio':other['timestampsWithinAudio'],'passed':other['lyricAcceptance']})
if crosschecks:song['provenance']['clipCrosschecks']=crosschecks
song['lyrics']=[{'time':line['time'],'text':line['text']} for line in clip_alignment['lyrics']]
song['provenance']['lyricsMethod']=f"{clip_alignment['asrModel']} actual excerpt word alignment; similarity {clip_alignment['textSimilarity']}"
registry=root/'src/providedSamples.json';songs=read(registry)
existing=next((s for s in songs if s['id']==song['id']),None)
if existing:assert existing==song,'Do not replace registered metadata'
else:songs.append(song);registry.write_text(json.dumps(songs,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'registered':song['id'],'range':range_label,'duration':song['duration'],'assets':song['audioFile'],'sampleCount':len(songs)},ensure_ascii=False))
