"""Actual CUDA parity under a bounded host cache; no music-quality claim."""
import json,tempfile
from pathlib import Path
import torch
from diffusers.hooks import apply_group_offloading
from cuda_disk_offload import enable_cuda_lossless_cache,cuda_lossless_cache_stats,release_cuda_lossless_cache

assert torch.cuda.is_available()
for invalid in (-1,True,1.5):
    try:enable_cuda_lossless_cache(invalid)
    except ValueError:pass
    else:raise AssertionError('Invalid budget accepted')
torch.manual_seed(65359)
model=torch.nn.Sequential(torch.nn.Linear(16,8),torch.nn.Linear(8,16)).eval().cuda()
x=torch.randn(4,16,device='cuda')
with torch.no_grad():expected=model(x).clone()
model.cpu()
budget=8*16*4+8*4
enable_cuda_lossless_cache(budget)
folder=Path(tempfile.mkdtemp(prefix='ieum-cuda-budget-'))
apply_group_offloading(model,onload_device=torch.device('cuda'),offload_device=torch.device('cpu'),offload_type='leaf_level',use_stream=False,offload_to_disk_path=str(folder))
disk_before={file.name:file.read_bytes() for file in folder.glob('*.safetensors')}
assert disk_before
with torch.no_grad():
    for _ in range(3):
        torch.testing.assert_close(model(x),expected,rtol=0,atol=0)
        stats=cuda_lossless_cache_stats()
        assert 0<stats['liveResidentBytes']<=budget
        assert stats['skippedBudgetLoads']>0
        assert all(p.device.type=='cpu' and p.numel()==0 for p in model.parameters())
try:enable_cuda_lossless_cache(0)
except ValueError:pass
else:raise AssertionError('Active budget change accepted')
released=release_cuda_lossless_cache()
assert released['releasedHostBytes']>0 and cuda_lossless_cache_stats()['liveResidentBytes']==0
enable_cuda_lossless_cache(0)
with torch.no_grad():
    for _ in range(2):torch.testing.assert_close(model(x),expected,rtol=0,atol=0)
assert cuda_lossless_cache_stats()['liveResidentBytes']==0
assert release_cuda_lossless_cache()['releasedHostBytes']==0
enable_cuda_lossless_cache(budget)
with torch.no_grad():torch.testing.assert_close(model(x),expected,rtol=0,atol=0)
assert 0<cuda_lossless_cache_stats()['liveResidentBytes']<=budget
assert disk_before=={file.name:file.read_bytes() for file in folder.glob('*.safetensors')}
stats=cuda_lossless_cache_stats();release_cuda_lossless_cache()
print(json.dumps({'passed':True,'budgetBytes':budget,'stats':stats,'outputsExact':True,'zeroBudgetDiskFallback':True,'activeBudgetChangeRejected':True,'diskFilesPreserved':True,'released':released,'limits':'Small actual CUDA model lifecycle. Budget bounds retained host cache only, not total process RAM, temporary allocations or model inference speed.'}))
