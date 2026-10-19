"""Run the real generator's input path while forbidding heavy imports."""
import argparse,builtins,contextlib,io,json,runpy,sys,tempfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--runtime-dir',type=Path,required=True);a=p.parse_args()
root=a.runtime_dir.resolve();script=Path(__file__).with_name('probe-korean-score-synthesis.py')
original_import=builtins.__import__
def guarded_import(name,*args,**kwargs):
    if name.split('.')[0] in {'torch','numpy','scipy','soundfile','Modules'}:
        raise RuntimeError('Heavy runtime imported before score validation: '+name)
    return original_import(name,*args,**kwargs)
cases=[
 ({'syllables':['<X>','가','<X>'],'notes':[0,67,0],'durationsSeconds':[.5,.5,.5]},True),
 ({'syllables':['가'],'notes':[67],'durationsSeconds':[.5],'noteCurves':[[{'offsetSeconds':0,'modelNoteIndex':67},{'offsetSeconds':.25,'modelNoteIndex':71}]]},True),
 ({'syllables':['가'],'notes':[67],'durationsSeconds':[.0001]},False),
 ({'syllables':['<X>'],'notes':[0],'durationsSeconds':[.0001]},False),
 ({'syllables':['가'],'notes':[0],'durationsSeconds':[.5]},False),
 ({'syllables':['<X>'],'notes':[67],'durationsSeconds':[.5]},False),
 ({'syllables':['가'],'notes':[67],'durationsSeconds':[.5],'noteCurves':[[{'offsetSeconds':0,'modelNoteIndex':67},{'offsetSeconds':.001,'modelNoteIndex':71}]]},False)
]
with tempfile.TemporaryDirectory(prefix='.qa-score-input-',dir=script.parent) as directory:
    for index,(score,valid) in enumerate(cases):
        path=Path(directory)/f'score-{index}.json';path.write_text(json.dumps(score,ensure_ascii=False),encoding='utf-8')
        args=sys.argv;sys.argv=[str(script),'--runtime-dir',str(root),'--score-spec',str(path),'--validate-score-only']
        output=io.StringIO();builtins.__import__=guarded_import
        try:
            with contextlib.redirect_stdout(output):runpy.run_path(str(script),run_name='__main__')
        except SystemExit as result:
            assert valid and result.code==0
            report=json.loads(output.getvalue());assert report['modelLoaded'] is False and report['inferenceExecuted'] is False
            assert report['expandedScoreSegments'] and report['status']=='score-validation-only'
        except (AssertionError,ValueError):
            if valid:raise
        else:raise AssertionError('Generator must terminate validation-only execution')
        finally:sys.argv=args;builtins.__import__=original_import
print(f'PASS actual generator score path: {len(cases)} valid/invalid scores and note curves, heavy imports forbidden, no model/inference/output creation')
