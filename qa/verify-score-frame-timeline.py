"""CPU-only original converter checks; no torch/model/audio generation."""
import argparse,hashlib,json,sys
from pathlib import Path
from score_frame_timeline import score_frame_timeline
p=argparse.ArgumentParser();p.add_argument('--runtime-dir',type=Path,required=True);p.add_argument('--song-dir',type=Path);p.add_argument('--output',type=Path);a=p.parse_args()
root=a.runtime_dir.resolve();sys.path[:0]=[str(root/'probe-source'),str(root/'deps')]
from Pattern_Generator import Convert_Feature_Based_Music,Expand_by_Duration
# Pinned runtime's actual native settings, not the 48k delivery format.
import yaml
hp=yaml.safe_load((root/'Hyper_Parameters.yaml').read_text(encoding='utf-8'))
sr=hp['Sound']['Sample_Rate'];shift=hp['Sound']['Frame_Shift'];consonant=hp['Duration']['Consonant_Duration'];equality=hp['Duration']['Equality']
def actual(syllables,notes,seconds):
    converted=Convert_Feature_Based_Music(list(zip(seconds,syllables,notes)),sr,shift,consonant,equality)
    layout=score_frame_timeline(syllables,notes,seconds,converted,sr,shift)
    expanded=Expand_by_Duration(*converted)
    assert layout[-1]['endFrame']==len(expanded[0])==len(expanded[1])==len(expanded[2])
    assert all(row['startFrame']==(layout[index-1]['endFrame'] if index else 0) for index,row in enumerate(layout))
    return layout
layout=actual(['<X>','천','천','히','<X>'],[0,67,67,71,0],[.123,.401,.387,.612,.117])
assert abs(layout[-1]['nativeEndSeconds']-layout[-1]['requestedEndSeconds'])<shift/sr
for syllables,notes,seconds in [(['가'],[67],[.0001]),(['<X>'],[0],[.0001]),(['가'],[0],[.4]),(['<X>'],[67],[.4])]:
    try:actual(syllables,notes,seconds)
    except ValueError:pass
    else:raise AssertionError('Invalid score must not reach model loading')
if a.song_dir:
    report=json.loads((a.song_dir/'song-generation-report.json').read_text(encoding='utf-8'))
    source=root/'probe-source/Pattern_Generator.py'
    assert hashlib.sha256(source.read_bytes()).hexdigest()==report['runtimeSourceHashes']['Pattern_Generator.py']
    score=report['score'];layout=actual(score['syllables'],score['modelNoteIndices'],score['durationsSeconds'])
    result={'sourceAudioSha256':report['outputSha256'],'generationReportSha256':hashlib.sha256((a.song_dir/'song-generation-report.json').read_bytes()).hexdigest(),
        'nativeSampleRate':sr,'nativeFrameShift':shift,'segments':layout,'scope':'Original converter conditioning layout only; no new inference or measured audio boundary approval'}
    if a.output:
        assert not a.output.exists(),'Preserve prior evidence'
        a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False))
print('PASS exact original converter frame continuity/count and invalid zero-frame/rest-note rejection; no model loading')
