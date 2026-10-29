"""Register the verified existing CC0 duet and actual separated backing.

Run after separate-ai-provided-song.py --source on its decoded stereo WAV.
Preserves originals; refuses to overwrite an existing registration.
"""
import argparse, hashlib, json, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf

p=argparse.ArgumentParser()
p.add_argument('--stems-dir',type=Path,required=True)
p.add_argument('--decoded-source',type=Path,required=True)
a=p.parse_args()
root=Path(__file__).resolve().parents[1]
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
source=root/'public/audio/presentation/slowly-coloring-us.mp3'
assert sha(source)=='1f2270ac18af16028e0a86488ce88898a652c5fa13895d4db18948acc5a4f4c4'
report=json.loads((a.stems_dir/'stem-separation-report.json').read_text())
assert report['actualModelInference'] and report['sourceSha256']==sha(a.decoded_source)
assert report['sumResidualPeak']<1e-6
decoded,sr=sf.read(a.decoded_source,dtype='float32',always_2d=True)
assert sr==44100 and decoded.shape[1]==2
stems={}
for name in ['backing','vocals']:
    path=a.stems_dir/f'{name}.wav'
    assert sha(path)==report['stems'][name]['sha256']
    samples,rate=sf.read(path,dtype='float32',always_2d=True)
    assert rate==sr and samples.shape==decoded.shape and np.isfinite(samples).all()
    assert float(np.sqrt(np.mean(samples**2)))>.001
    stems[name]=samples
assert np.max(np.abs(decoded-stems['backing']-stems['vocals']))<1e-6
assert not np.allclose(stems['backing'],stems['vocals'])
gain=min(1.,.95/max(float(np.max(np.abs(s))) for s in stems.values()))
target=root/'public/audio/slowly-coloring-us-v1'
manifest=root/'src/licensedDuetAudio.json'
assert not manifest.exists() and not target.exists(), 'Existing registration preserved'
target.mkdir(parents=True)
for name in stems:
    subprocess.run(['ffmpeg','-v','error','-n','-i',str(a.stems_dir/f'{name}.wav'),
        '-af',f'volume={gain}','-c:a','libmp3lame','-b:a','192k',str(target/f'{name}.mp3')],check=True)
data={
    'duration':len(decoded)/sr,'sourceSha256':sha(source),
    'backingFile':'/audio/slowly-coloring-us-v1/backing.mp3','backingSha256':sha(target/'backing.mp3'),
    'referenceFile':'/audio/presentation/slowly-coloring-us.mp3','referenceSha256':sha(source),
    'combinedVocalFile':'/audio/slowly-coloring-us-v1/vocals.mp3','combinedVocalSha256':sha(target/'vocals.mp3'),
    'provenance':{
        'sourcePage':'https://musebox.co.kr/t/천천히-물드는-우리/',
        'downloadUrl':'https://musebox.co.kr/api/tracks/fcd9f5d8-0c1e-4bdc-a71e-8821c5dc7cb4/download',
        'license':'CC0-1.0','licenseEvidence':'Publisher page explicitly permits editing and redistribution; original download byte-identical to retained source',
        'model':report['model'],'decodedSourceSha256':report['sourceSha256'],
        'separationResidualPeak':report['sumResidualPeak'],'exportGain':gain,
        'listeningAcceptance':'pending','partGuideStatus':'not-separated-per-singer',
        'partRangeStatus':'unverified','lyricTimingStatus':'unverified'
    }
}
manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'duration':data['duration'],'backingSha256':data['backingSha256'],'combinedVocalSha256':data['combinedVocalSha256'],'gain':gain}))
