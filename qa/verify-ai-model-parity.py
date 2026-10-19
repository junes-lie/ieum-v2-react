"""Compare native and converted ACE-Step lyric encoder using the same weights/input."""
import argparse,importlib,sys,json,time,gc
from pathlib import Path
import torch
from accelerate import init_empty_weights
from safetensors import safe_open
from diffusers.pipelines.ace_step.modeling_ace_step import AceStepLyricEncoder
p=argparse.ArgumentParser();p.add_argument('--native-dir',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
sys.path.insert(0,str(a.native_dir.resolve()))
native=importlib.import_module('modeling_acestep_v15_turbo')
config=native.AceStepConfig.from_pretrained(a.native_dir)
config._attn_implementation='eager'
torch.set_num_threads(4);torch.manual_seed(42)
states={}
with safe_open(a.native_dir/'model.safetensors',framework='pt',device='cpu') as f:
 for key in f.keys():
  if key.startswith('encoder.lyric_encoder.'):
   states[key.removeprefix('encoder.lyric_encoder.')]=f.get_tensor(key).float()
with init_empty_weights(): original=native.AceStepLyricEncoder(config)
original.load_state_dict(states,strict=True,assign=True)
original.eval()
x=torch.randn(1,64,config.text_hidden_dim);mask=torch.ones(1,64,dtype=torch.bool)
start=time.time()
with torch.inference_mode(): reference=original(inputs_embeds=x,attention_mask=mask).last_hidden_state
del original;gc.collect()
converted_states={}
for key,value in states.items():
 for old,new in [('.q_proj.','.to_q.'),('.k_proj.','.to_k.'),('.v_proj.','.to_v.'),('.o_proj.','.to_out.0.'),('.q_norm.','.norm_q.'),('.k_norm.','.norm_k.')]:key=key.replace(old,new)
 converted_states[key]=value
with init_empty_weights():
 converted=AceStepLyricEncoder(hidden_size=config.hidden_size,intermediate_size=config.intermediate_size,text_hidden_dim=config.text_hidden_dim,num_lyric_encoder_hidden_layers=config.num_lyric_encoder_hidden_layers,num_attention_heads=config.num_attention_heads,num_key_value_heads=config.num_key_value_heads,head_dim=config.head_dim,rope_theta=config.rope_theta,rms_norm_eps=config.rms_norm_eps,sliding_window=config.sliding_window,layer_types=config.layer_types)
converted.load_state_dict(converted_states,strict=True,assign=True);converted.eval()
with torch.inference_mode(): result=converted(inputs_embeds=x,attention_mask=mask)
relative=float(torch.sqrt(torch.mean((reference-result)**2))/torch.sqrt(torch.mean(reference**2)))
report={'component':'lyric_encoder','actualSameWeightComparison':True,'inputShape':list(x.shape),'relativeRmse':relative,'cosine':float(torch.nn.functional.cosine_similarity(reference.flatten(),result.flatten(),dim=0)),'seconds':time.time()-start,'passed':relative<.001,'limits':['Random tensor parity checks numerical conversion, not song quality or actual lyric alignment']}
a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(report,indent=2))
print(json.dumps(report),flush=True)
if not report['passed']:raise SystemExit(2)
