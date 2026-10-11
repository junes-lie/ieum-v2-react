"""Research-only pinned GAME ONNX observations; run with the live RAM guard."""
import argparse,hashlib,json,math,time
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--runtime-dir',type=Path,required=True);p.add_argument('--audio',type=Path,required=True);p.add_argument('--start',type=float,default=0);p.add_argument('--duration',type=float,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--seed',type=int,default=None);a=p.parse_args()
assert a.seed is None or 0<=a.seed<=2147483647,'Seed must fit a nonnegative signed 32-bit integer'
assert a.audio.is_file() and not a.output.exists() and math.isfinite(a.start) and a.start>=0 and math.isfinite(a.duration) and 0<a.duration<=10
root=a.runtime_dir.resolve();manifest=json.loads((root/'source-manifest.json').read_text());model=root/'model/GAME-1.0.3-small-onnx';config=json.loads((model/'config.json').read_text())
assert manifest['assetSha256']=='00ba0c64115b6b874d9ea4afd3e6cf822abda2a04e52569233b0a044fd40e4e8' and manifest['tag']=='v1.0.3'
assert config=={'samplerate':44100,'timestep':.01,'languages':{'en':1,'ja':2,'yue':3,'zh':4},'loop':True,'embedding_dim':128}
pinned={'bd2dur.onnx':'6672d56b00f27a20e9bfaa92801c15e394bb520e49031d3ed2515b0a6cf27402','config.json':'60dfe7e7b57db29475604eeea9b2abf5f8cd2a49326f1f4bc0e1c14ed151a55e','dur2bd.onnx':'49d10d1ea186e43c51fd2c51cedb01a3852d363f1c7056ae77df50f7e8dd0996','encoder.onnx':'a6868a702d9c88ccc06b19e54f49d88b7f8cba4a68517f20806bd81ef6f94e06','estimator.onnx':'a84738b2504472a1f22773cc6b0eccad1353a8f36229ad490b8fea85388bb5e1','segmenter.onnx':'7724db4ba59a388fff5aba2f08f0ac025d4ca59caef80e7f474053a1455c88e5'}
for name,expected in pinned.items():assert hashlib.sha256((model/name).read_bytes()).hexdigest()==expected,'Pinned model file changed'
import numpy as np,soundfile as sf,onnxruntime as ort
from scipy.signal import resample_poly
with sf.SoundFile(a.audio) as file:
 rate=file.samplerate;file.seek(round(a.start*rate));wave=file.read(round(a.duration*rate),dtype='float32',always_2d=True).mean(axis=1)
assert len(wave)>0 and np.isfinite(wave).all();actual_duration=len(wave)/rate;g=math.gcd(rate,config['samplerate']);wave=resample_poly(wave,config['samplerate']//g,rate//g).astype(np.float32)[None]
options=ort.SessionOptions();options.intra_op_num_threads=2;options.inter_op_num_threads=1
if a.seed is not None:ort.set_seed(a.seed)
sessions={name:ort.InferenceSession(str(model/(name+'.onnx')),sess_options=options,providers=['CPUExecutionProvider']) for name in ['encoder','dur2bd','segmenter','bd2dur','estimator']}
start=time.perf_counter();duration=np.array([actual_duration],dtype=np.float32)
x_seg,x_est,maskT=sessions['encoder'].run(None,{'waveform':wave,'duration':duration})
known=sessions['dur2bd'].run(None,{'durations':duration[:,None],'maskT':maskT})[0];boundaries=known
ts=[i/8 for i in range(8)]
for t in ts:
 boundaries=sessions['segmenter'].run(None,{'x_seg':x_seg,'language':np.array([0],dtype=np.int64),'known_boundaries':known,'prev_boundaries':boundaries,'t':np.array([t],dtype=np.float32),'maskT':maskT,'threshold':np.array(.2,dtype=np.float32),'radius':np.array(2,dtype=np.int64)})[0]
durations,maskN=sessions['bd2dur'].run(None,{'boundaries':boundaries,'maskT':maskT})
presence,scores=sessions['estimator'].run(None,{'x_est':x_est,'boundaries':boundaries,'maskT':maskT,'maskN':maskN,'threshold':np.array(.2,dtype=np.float32)})
rows=[];position=a.start
for length,valid,voiced,midi in zip(durations[0],maskN[0],presence[0],scores[0]):
 if not valid:continue
 assert np.isfinite(length) and length>0 and (not voiced or np.isfinite(midi))
 rows.append({'start':position,'end':position+float(length),'duration':float(length),'voicePresent':bool(voiced),'observedMidi':float(midi) if voiced else None,'rawModelScore':float(midi)})
 position+=float(length)
report={'status':'research-note-extraction-candidate','audioSha256':hashlib.sha256(a.audio.read_bytes()).hexdigest(),'window':{'start':a.start,'duration':actual_duration},'model':'openvpi/GAME 1.0.3 small ONNX','assetSha256':manifest['assetSha256'],'license':manifest['weightLicense'],'onnxruntimeVersion':ort.__version__,'executionProvider':'CPUExecutionProvider','cpuIntraThreads':2,'cpuInterThreads':1,'languageId':0,'languageReason':'Korean is not a native language in this model map; official unset/universal ID used, not claimed Korean support','boundaryThreshold':.2,'presenceThreshold':.2,'radiusFrames':2,'sampleTimes':ts,'timestep':config['timestep'],'notes':rows,'sumDuration':sum(r['duration'] for r in rows),'inferenceSeconds':time.perf_counter()-start,'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'sourceScoreVerified':False,'syllableTimingApproved':False,'harmonyApproved':False,'catalogRegistrationApproved':False,'limitations':['Predicted notes are not lyrics or approved score','No thresholds changed to match the reference','No original PCM shift, transpose or overwrite','No physical listening or commercial model adoption']}
report['randomSeed']=a.seed;report['seedScope']='ONNX Runtime global seed set before session creation in this isolated process; exact reproducibility requires measurement, not guaranteed'
a.output.write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
