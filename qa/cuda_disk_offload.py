"""Release CPU placeholders only for native CUDA disk-offloaded groups."""
import torch,weakref
from diffusers.hooks.group_offloading import ModuleGroup

_cache_stats={'groups':0,'originalBytes':0,'residentBytes':0,'packedTensors':0,'originalFormatTensors':0}
_cached_group_refs=[]

def cuda_lossless_cache_stats():
    return dict(_cache_stats)

def release_cuda_lossless_cache():
    """Return host cache after inference; native persisted weights remain reusable."""
    groups=[ref() for ref in _cached_group_refs if ref() is not None]
    groups=[group for group in groups if hasattr(group,'_ieum_cuda_packed')]
    # Validate all groups before modifying any: never release an active forward.
    for group in groups:
        assert group._is_offloaded_to_disk and all(tensor.numel()==0 for tensor in group.tensor_to_key),'Release CUDA cache only after complete native offload'
    released=sum(value.numel()*value.element_size() for group in groups for value in group._ieum_cuda_packed.values())
    for group in groups:
        for name in ('_ieum_cuda_packed','_ieum_cuda_dtypes','_ieum_cuda_shapes'):
            delattr(group,name)
    _cached_group_refs.clear()
    return {'groups':len(groups),'releasedHostBytes':released,'nativeDiskWeightsPreserved':True}

def enable_cuda_lossless_cache():
    """Cache after first CUDA load; restore original compute dtype on CUDA."""
    enable_cuda_disk_storage_release()
    if getattr(ModuleGroup,'_ieum_cuda_lossless_cache',False):return
    original_load=ModuleGroup._onload_from_disk
    original_offload=ModuleGroup._offload_to_disk
    def eligible(group):
        return torch.device(group.onload_device).type=='cuda' and group.stream is None
    def load(group):
        if not eligible(group):return original_load(group)
        assert not torch.is_grad_enabled(),'CUDA cache is inference-only'
        if hasattr(group,'_ieum_cuda_packed'):
            for key,tensor in group.key_to_tensor.items():
                value=group._ieum_cuda_packed[key].to(device=group.onload_device,dtype=group._ieum_cuda_dtypes[key])
                assert value.shape==group._ieum_cuda_shapes[key]
                tensor.data=value
            return
        original_load(group)
        packed={};dtypes={};shapes={}
        for key,tensor in group.key_to_tensor.items():
            value=tensor.detach().cpu()
            candidate=value.to(torch.bfloat16) if value.is_floating_point() else value
            exact=torch.equal(candidate.to(value.dtype),value)
            stored=candidate if exact else value.clone()
            packed[key]=stored;dtypes[key]=value.dtype;shapes[key]=value.shape
            _cache_stats['originalBytes']+=value.numel()*value.element_size()
            _cache_stats['residentBytes']+=stored.numel()*stored.element_size()
            _cache_stats['packedTensors' if stored.element_size()<value.element_size() else 'originalFormatTensors']+=1
        group._ieum_cuda_packed=packed;group._ieum_cuda_dtypes=dtypes;group._ieum_cuda_shapes=shapes
        _cached_group_refs.append(weakref.ref(group))
        _cache_stats['groups']+=1
    def offload(group):
        if not eligible(group) or not hasattr(group,'_ieum_cuda_packed'):return original_offload(group)
        assert group._is_offloaded_to_disk,'Preserve native disk cache'
        for tensor in group.tensor_to_key:
            tensor.data=torch.empty(0,dtype=tensor.dtype,device='cpu')
    ModuleGroup._onload_from_disk=load;ModuleGroup._offload_to_disk=offload
    ModuleGroup._ieum_cuda_lossless_cache=True

def enable_cuda_disk_storage_release():
    assert torch.cuda.is_available(), 'CUDA storage path requires a CUDA runtime'
    if getattr(ModuleGroup, '_ieum_cuda_storage_release', False):
        return
    original = ModuleGroup._offload_to_disk
    def offload(group):
        original(group)
        if torch.device(group.onload_device).type == 'cuda':
            assert group._is_offloaded_to_disk, 'Release only persisted weights'
            for tensor in group.tensor_to_key:
                assert tensor.device.type == 'cpu'
                tensor.data = torch.empty(0, dtype=tensor.dtype, device='cpu')
    ModuleGroup._offload_to_disk = offload
    ModuleGroup._ieum_cuda_storage_release = True

def release_after_one_shot(function, module, label, preserve_parameters=()):
    """Release inference-only conditioning weights after their complete output."""
    completed=False
    def once(*args, **kwargs):
        nonlocal completed
        assert not completed, f'{label} is one-shot; do not reuse released weights'
        assert not torch.is_grad_enabled(), 'CUDA conditioning release is inference-only'
        result=function(*args, **kwargs)
        completed=True
        for name,parameter in module.named_parameters():
            if name not in preserve_parameters:
                parameter.data=torch.empty(0,dtype=parameter.dtype,device='cpu')
        torch.cuda.empty_cache()
        print(f'Complete native {label} output retained; one-shot weights released',flush=True)
        return result
    return once
