"""Exercise real native offload forwards, exact outputs and precision-sensitive fallback."""
import json,tempfile
from pathlib import Path
import torch
from diffusers.hooks import apply_group_offloading
from cpu_disk_offload import enable_lossless_cpu_inference_cache,lossless_cpu_cache_stats

torch.set_num_threads(2)
torch.manual_seed(65357)
class Model(torch.nn.Module):
 def __init__(self):
  super().__init__()
  self.blocks=torch.nn.ModuleList([torch.nn.Linear(64,64) for _ in range(3)])
 def forward(self,x):
  for block in self.blocks:x=torch.tanh(block(x))
  return x
model=Model().eval()
with torch.no_grad():
 for param in model.parameters():param.data=param.data.bfloat16().float()
 model.blocks[-1].weight[0,0]=.1234567
 assert model.blocks[-1].weight[0,0].bfloat16().float()!=model.blocks[-1].weight[0,0]
 x=torch.randn(5,64)
 expected=model(x).clone()
folder=Path(tempfile.mkdtemp(prefix='ieum-lossless-cache-'))
sentinel=folder/'preserved.txt';sentinel.write_text('preserve',encoding='utf-8')
enable_lossless_cpu_inference_cache()
apply_group_offloading(model,onload_device='cpu',offload_device='cpu',offload_type='block_level',num_blocks_per_group=2,offload_to_disk_path=str(folder))
with torch.no_grad():
 for _ in range(3):assert torch.equal(model(x),expected),'Cache changed real FP32 model output'
try:model(x)
except RuntimeError as error:assert 'inference-only' in str(error)
else:raise AssertionError('Training use must be rejected')
with torch.no_grad():assert torch.equal(model(x),expected),'Failed use corrupted retry'
stats=lossless_cpu_cache_stats()
assert 0<stats['residentBytes']<stats['originalBytes']
assert stats['packedTensors']>0 and stats['originalFormatTensors']>0
assert sentinel.read_text(encoding='utf-8')=='preserve'
assert not list(folder.glob('*.safetensors')),'RAM cache should not rewrite disk weights'
print(json.dumps({'exactNativeOutputs':4,'precisionSensitiveFallback':True,'failedTrainingRetryPreserved':True,'existingFilePreserved':True,'cache':stats,'limits':'Native tensor lifecycle test; actual Base audio inference is separate'}),flush=True)
