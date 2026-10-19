"""Monitor an actual CUDA music inference without changing CPU runtimes."""
import argparse,json,subprocess,sys,threading,time
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('--output-dir',type=Path,required=True)
p.add_argument('generation_args',nargs=argparse.REMAINDER)
a=p.parse_args()
target=a.output_dir/'gpu-execution-monitor.json'
assert not target.exists(),'Preserve existing GPU evidence'
args=a.generation_args
if args and args[0]=='--':args=args[1:]
assert '--device' not in args and '--output-dir' not in args
a.output_dir.mkdir(parents=True,exist_ok=True)
samples=[];errors=[];stop=threading.Event()
def monitor():
 while not stop.is_set():
  try:
   r=subprocess.run(['nvidia-smi','--query-gpu=utilization.gpu,memory.used,memory.total','--format=csv,noheader,nounits'],capture_output=True,text=True,check=True,timeout=5)
   values=[int(x.strip()) for x in r.stdout.strip().splitlines()[0].split(',')]
   samples.append({'elapsedSeconds':time.perf_counter()-start,'utilizationPercent':values[0],'totalUsedMiB':values[1],'totalMiB':values[2]})
  except Exception as error:errors.append(str(error))
  stop.wait(1)
start=time.perf_counter()
thread=threading.Thread(target=monitor,daemon=True);thread.start()
code=-1
try:
 code=subprocess.call([sys.executable,'-u','-X','utf8',str(Path(__file__).with_name('generate-ai-provided-song.py')),'--device','cuda','--output-dir',str(a.output_dir),*args])
finally:
 stop.set();thread.join(timeout=6)
 report={'exitCode':code,'wallSeconds':time.perf_counter()-start,'samples':samples,'monitorErrors':errors,'limits':['NVIDIA utilization/total VRAM include other applications; generator reports its own allocated peak','Kernel success is not lyric/harmony/range approval; CPU environment retained']}
 target.write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps({k:v for k,v in report.items() if k!='samples'}),flush=True)
if code==0:
 result=json.loads((a.output_dir/'song-generation-report.json').read_text(encoding='utf-8'))
 assert result['executionDevice']=='cuda' and result['gpu']['peakAllocatedBytes']>0
 assert samples and not errors,'GPU monitoring must succeed'
raise SystemExit(code)
