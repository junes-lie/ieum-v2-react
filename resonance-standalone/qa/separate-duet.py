# Inference for Cyru5/MedleyVox vocals 238 (CC BY 4.0).
# Weights/config: https://huggingface.co/Cyru5/MedleyVox/tree/main/vocals%20238
# Usage: python separate-duet.py INPUT.mp3 OUTPUT.npy CONFIG.json WEIGHTS.pth
import json, time, sys, subprocess
import numpy as np, torch
from asteroid_filterbanks import make_enc_dec
from asteroid.masknn import TDConvNet
from asteroid.models.base_models import BaseEncoderMaskerDecoder

torch.set_num_threads(4)
a=json.load(open(sys.argv[3]))['args']
encoder,decoder=make_enc_dec('torch_stft',n_filters=a['nfft'],kernel_size=a['nfft'],stride=a['nhop'],sample_rate=a['sample_rate'])
masker=TDConvNet(in_chan=encoder.n_feats_out,n_src=2,n_blocks=a['n_blocks'],n_repeats=a['n_repeats'],bn_chan=a['bn_chan'],hid_chan=a['hid_chan'],skip_chan=a['skip_chan'],mask_act=a['mask_act'])
model=BaseEncoderMaskerDecoder(encoder,masker,decoder,encoder_activation=a['encoder_activation'])
ckpt=torch.load(sys.argv[4],map_location='cpu',weights_only=True)
state={k.removeprefix('ema_model.module.'):v for k,v in ckpt.items() if k.startswith('ema_model.module.')}
model.load_state_dict(state,strict=True);model.eval()
sr=24000
raw=subprocess.check_output(['ffmpeg','-v','error','-i',sys.argv[1],'-f','f32le','-ac','1','-ar',str(sr),'-'])
x=np.frombuffer(raw,dtype=np.float32).copy()
# Whole-song inference avoids independent chunk permutations. Singer identity
# consistency still requires listening review; outputs are labeled A/B.
# No fabricated singer timing, pitch bins, or repeated combined-vocal signal.
t0=time.time();print('infer',len(x)/sr,'seconds',flush=True)
with torch.inference_mode():
 y=model(torch.from_numpy(x)[None,None,:])[0].numpy()
y += (x-y.sum(axis=0))[None,:]/2
np.save(sys.argv[2],y)
print('done',time.time()-t0,'shape',y.shape,'rms',np.sqrt(np.mean(y*y,axis=1)),'reconstruction',np.max(np.abs(x-y.sum(axis=0))),flush=True)
