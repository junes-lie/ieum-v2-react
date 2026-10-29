"""Actual UVR MDX ONNX vocal inference, with matching model-hash metadata.

STFT/channel packing and overlap-add follow the MIT audio-separator implementation:
https://github.com/nomadkaraoke/python-audio-separator
This CPU-only runner retains original audio and records both stem hashes.
"""
import argparse,hashlib,json,time,math
from pathlib import Path
import numpy as np
import soundfile as sf
import torch
import onnxruntime as ort
from scipy.signal import resample_poly
p=argparse.ArgumentParser();p.add_argument('--song-dir',type=Path,required=True);p.add_argument('--model-dir',type=Path,required=True)
p.add_argument('--source',type=Path,help='Existing permitted stereo WAV; no generation required')
p.add_argument('--source-sha256',help='Expected SHA256 of the existing source WAV')
a=p.parse_args()
metadata=json.loads((a.model_dir/'model-config.json').read_text())
model=a.model_dir/'UVR_MDXNET_Main.onnx'
assert hashlib.sha256(model.read_bytes()).hexdigest()==metadata['sha256']
config=metadata['config'];assert config['primary_stem']=='Vocals'
file=a.source or a.song_dir/'ieum-original-song.wav'
source_hash=a.source_sha256 if a.source else json.loads((a.song_dir/'song-generation-report.json').read_text(encoding='utf-8'))['outputSha256']
assert source_hash and hashlib.sha256(file.read_bytes()).hexdigest()==source_hash
a.song_dir.mkdir(parents=True,exist_ok=True)
assert not any((a.song_dir/name).exists() for name in ['vocals.wav','backing.wav','stem-separation-report.json']), 'Preserve existing separation outputs; select a new output directory'
audio,sr=sf.read(file,dtype='float32',always_2d=True)
g=math.gcd(sr,44100);mix=resample_poly(audio,44100//g,sr//g).T.astype(np.float32)
assert mix.shape[0]==2
torch.set_num_threads(2)
options=ort.SessionOptions();options.intra_op_num_threads=2;options.inter_op_num_threads=1
session=ort.InferenceSession(str(model),sess_options=options,providers=['CPUExecutionProvider'])
nfft=config['mdx_n_fft_scale_set'];dimf=config['mdx_dim_f_set'];frames=2**config['mdx_dim_t_set'];hop=1024
assert session.get_inputs()[0].shape[-2:]==[dimf,frames]
chunk=hop*(frames-1);trim=nfft//2;gen=chunk-2*trim
pad=gen+trim-mix.shape[1]%gen
mixture=np.pad(mix,((0,0),(trim,pad)))
total=np.zeros_like(mixture);weight=np.zeros_like(mixture)
window=torch.hann_window(nfft)
started=time.time();step=chunk//2
for index,start in enumerate(range(0,mixture.shape[1],step)):
 end=min(start+chunk,mixture.shape[1]);length=end-start
 wave=torch.from_numpy(np.pad(mixture[:,start:end],((0,0),(0,chunk-length))))
 with torch.inference_mode():
  spectrum=torch.stft(wave,n_fft=nfft,hop_length=hop,window=window,center=True,return_complex=True)
  packed=torch.view_as_real(spectrum).permute(0,3,1,2).reshape(1,4,nfft//2+1,frames)[:,:,:dimf,:].contiguous()
  packed[:,:,:3,:]=0
  prediction=session.run(None,{session.get_inputs()[0].name:packed.numpy()})[0]
  prediction=torch.from_numpy(prediction)
  prediction=torch.nn.functional.pad(prediction,(0,0,0,nfft//2+1-dimf))
  complex_spec=prediction.reshape(2,2,nfft//2+1,frames).permute(0,2,3,1).contiguous()
  recovered=torch.istft(torch.view_as_complex(complex_spec),n_fft=nfft,hop_length=hop,window=window,center=True,length=chunk).numpy()
 hann=np.hanning(length).astype(np.float32)
 total[:,start:end]+=recovered[:,:length]*hann
 weight[:,start:end]+=hann
 print(f'Actual vocal separation window {index+1}; elapsed {time.time()-started:.1f}s',flush=True)
vocals=(total/np.maximum(weight,1e-8))[:,trim:trim+mix.shape[1]]*config['compensate']
backing=mix-vocals
assert np.isfinite(vocals).all() and np.isfinite(backing).all()
assert np.max(np.abs(mix-vocals-backing))<1e-6
stems={}
for name,samples in [('vocals',vocals),('backing',backing)]:
 target=a.song_dir/f'{name}.wav'
 sf.write(target,samples.T,44100,subtype='FLOAT')
 stems[name]={'file':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'duration':samples.shape[1]/44100,'rms':float(np.sqrt(np.mean(samples**2))),'peak':float(np.max(np.abs(samples)))}
report={'actualModelInference':True,'sourceSha256':source_hash,'model':metadata,'sampleRate':44100,'channels':2,'stems':stems,'sumResidualPeak':float(np.max(np.abs(mix-vocals-backing))),'inferenceSeconds':time.time()-started,'limits':['Model separation is not perfect vocal isolation','Stem sum proves signal preservation, not perceptual separation quality','Vocals contains the combined vocal stack, not independent participant Parts','No measured key, tempo, Part range or physical microphone proof']}
(a.song_dir/'stem-separation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False),flush=True)
