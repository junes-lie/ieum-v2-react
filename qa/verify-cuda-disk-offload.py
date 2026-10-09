"""Actual CUDA native disk lifecycle parity; never music quality approval."""
import json,tempfile
from pathlib import Path
import torch
from diffusers.hooks import apply_group_offloading
from cuda_disk_offload import enable_cuda_disk_storage_release,release_after_one_shot,enable_cuda_lossless_cache,cuda_lossless_cache_stats

assert torch.cuda.is_available()
torch.manual_seed(65358)
model=torch.nn.Sequential(torch.nn.Linear(16,32),torch.nn.SiLU(),torch.nn.Linear(32,8)).eval()
x=torch.randn(4,16)
with torch.no_grad(): expected=model(x)
enable_cuda_disk_storage_release()
folder=Path(tempfile.mkdtemp(prefix='ieum-cuda-disk-'))
sentinel=folder/'preserved.txt';sentinel.write_text('preserve',encoding='utf-8')
apply_group_offloading(model,onload_device=torch.device('cuda'),offload_device=torch.device('cpu'),offload_type='leaf_level',use_stream=False,offload_to_disk_path=str(folder))
assert all(p.numel()==0 for p in model.parameters())
with torch.no_grad():
    for _ in range(3):
        actual=model(x.to('cuda')).cpu()
        torch.testing.assert_close(actual,expected,rtol=1e-5,atol=1e-6)
        assert all(p.numel()==0 and p.device.type=='cpu' for p in model.parameters())
assert sentinel.read_text(encoding='utf-8')=='preserve'
cached=torch.nn.Linear(16,8).eval()
with torch.no_grad():
    cached.weight.copy_(cached.weight.to(torch.bfloat16).float())
    cached.bias[0]=1.0003
    expected_cache=cached(x)
enable_cuda_lossless_cache()
cache_folder=Path(tempfile.mkdtemp(prefix='ieum-cuda-packed-'))
apply_group_offloading(cached,onload_device=torch.device('cuda'),offload_device=torch.device('cpu'),offload_type='leaf_level',use_stream=False,offload_to_disk_path=str(cache_folder))
try: cached(x.to('cuda'))
except AssertionError as error: assert 'inference-only' in str(error)
else: raise AssertionError('Training must be rejected before restoring inference weights')
with torch.no_grad():
    for _ in range(3):
        result=cached(x.to('cuda')).cpu()
        torch.testing.assert_close(result,expected_cache,rtol=1e-5,atol=1e-6)
        assert all(p.numel()==0 for p in cached.parameters())
assert cuda_lossless_cache_stats()['packedTensors']>0 and cuda_lossless_cache_stats()['originalFormatTensors']>0
condition=torch.nn.Linear(16,8).eval().to('cuda')
condition.register_buffer('preserved_buffer',torch.ones(2,device='cuda'))
condition.register_parameter('null_condition_emb',torch.nn.Parameter(torch.ones(2,device='cuda')))
with torch.no_grad(): reference=condition(x.to('cuda')).clone()
once=release_after_one_shot(condition.forward,condition,'test condition',preserve_parameters=('null_condition_emb',))
with torch.no_grad():
    retained=once(x.to('cuda'))
    torch.testing.assert_close(retained,reference,rtol=0,atol=0)
    try: once(x.to('cuda'))
    except AssertionError: pass
    else: raise AssertionError('Second use must fail before invoking empty weights')
assert all(p.numel()==0 for name,p in condition.named_parameters() if name!='null_condition_emb')
assert torch.equal(condition.null_condition_emb,torch.ones(2,device='cuda'))
assert torch.equal(condition.preserved_buffer,torch.ones(2,device='cuda'))
print(json.dumps({'actualCudaOutputs':6,'nativeCpuParity':True,'emptyCpuPlaceholders':True,'preservedSentinel':True,'oneShotOutputExact':True,'buffersPreserved':True,'secondUseRejected':True,'failedTrainingRetryPreserved':True,'cache':cuda_lossless_cache_stats(),'precisionSensitiveFallback':True,'evidence':str(folder),'limits':'Actual CUDA lifecycle test, not music output/quality approval'}))
