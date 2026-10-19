"""Verify pinned non-turbo conversion tensors before actual audio diagnostics."""
import argparse,contextlib,hashlib,json
from pathlib import Path
import torch
from safetensors import safe_open
from ai_music_models import PINNED_AUDIO_MODELS

p=argparse.ArgumentParser()
p.add_argument('--raw-dir',type=Path,required=True)
p.add_argument('--pipeline-dir',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
p.add_argument('--model-variant',choices=list(PINNED_AUDIO_MODELS),default='base')
a=p.parse_args()
policy=PINNED_AUDIO_MODELS[a.model_variant]
assert not a.output.exists(),'Preserve prior conversion evidence'
torch.set_num_threads(2)
def sha(file):
 h=hashlib.sha256()
 with file.open('rb') as f:
  for chunk in iter(lambda:f.read(16*1024*1024),b''):h.update(chunk)
 return h.hexdigest()
raw_sha=sha(a.raw_dir/'model.safetensors')
assert raw_sha==policy['weightsSha256'],'Unverified checkpoint weights'
config=json.loads((a.pipeline_dir/'transformer/config.json').read_text(encoding='utf-8'))
assert config['is_turbo'] is False,'Expected pinned non-turbo weights'
renames=[('.q_proj.','.to_q.'),('.k_proj.','.to_k.'),('.v_proj.','.to_v.'),('.o_proj.','.to_out.0.'),('.q_norm.','.norm_q.'),('.k_norm.','.norm_k.')]
with contextlib.ExitStack() as stack:
 raw=stack.enter_context(safe_open(a.raw_dir/'model.safetensors',framework='pt',device='cpu'))
 components={}
 for name in ['transformer','condition_encoder','audio_tokenizer','audio_token_detokenizer']:
  tensors={}
  for file in (a.pipeline_dir/name).glob('diffusion_pytorch_model*.safetensors'):
   handle=stack.enter_context(safe_open(file,framework='pt',device='cpu'))
   for key in handle.keys():
    assert key not in tensors,'Duplicate converted tensor'
    tensors[key]=handle
  assert tensors,f'Missing component: {name}'
  components[name]=tensors
 matched={name:set() for name in components}
 for key in raw.keys():
  if key=='null_condition_emb':name,new='condition_encoder',key
  else:
   prefix,new=key.split('.',1)
   name={'decoder':'transformer','encoder':'condition_encoder','tokenizer':'audio_tokenizer','detokenizer':'audio_token_detokenizer'}[prefix]
  new=new.replace('proj_in.1.','proj_in_conv.').replace('proj_out.1.','proj_out_conv.')
  for old,replacement in renames:new=new.replace(old,replacement)
  assert new in components[name],f'Missing converted parameter: {key}'
  assert torch.equal(raw.get_tensor(key).float(),components[name][new].get_tensor(new).float()),f'Changed parameter: {key}'
  matched[name].add(new)
 for name,tensors in components.items():
  extra=set(tensors)-matched[name]
  assert extra==({'silence_latent'} if name=='condition_encoder' else set()),f'Unverified extra tensors: {name}/{extra}'
  if 'silence_latent' in extra:
   silence=torch.load(a.raw_dir/'silence_latent.pt',map_location='cpu',weights_only=True).transpose(1,2).float()
   assert torch.equal(silence,tensors['silence_latent'].get_tensor('silence_latent').float()),'Changed silence conditioning buffer'
 count=sum(len(keys) for keys in matched.values())
 assert count==len(raw.keys())
hashes={str(file.relative_to(a.pipeline_dir)).replace('\\','/'):sha(file) for file in a.pipeline_dir.rglob('*') if file.is_file() and file.suffix in ['.json','.safetensors','.txt','.model']}
report={'model':policy['model'],'revision':policy['revision'],'rawWeightsSha256':raw_sha,'tensorParityVerified':True,'matchedRawTensors':count,'componentTensorCounts':{name:len(keys) for name,keys in matched.items()},'componentHashes':hashes,'allowedDiagnosticTasks':list(policy['tasks']),'limits':['Conversion parity is not Part quality or lyric/entry approval','No production inference service or catalog registration']}
a.output.parent.mkdir(parents=True,exist_ok=True)
a.output.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='componentHashes'}),flush=True)
