"""Release CPU placeholders only after actual Diffusers disk offload.

Diffusers 0.41 reloads each parameter's .data from safetensors before forward.
Its full-size empty CPU placeholders otherwise retain the model's RAM budget.
This process-local adjustment preserves disk weights and text encoder storage.
"""
import torch
from diffusers.hooks.group_offloading import ModuleGroup

_cpu_cache_stats = {'groups': 0, 'originalBytes': 0, 'residentBytes': 0,
                    'packedTensors': 0, 'originalFormatTensors': 0}


def lossless_cpu_cache_stats():
    return dict(_cpu_cache_stats)


def release_cpu_disk_offload_storage():
    if getattr(ModuleGroup, '_ieum_cpu_storage_release', False):
        return
    original = ModuleGroup._offload_to_disk

    def offload_and_release(group):
        original(group)
        if torch.device(group.offload_device).type == 'cpu' and group.stream is None:
            for tensor in group.tensor_to_key:
                tensor.data = torch.empty(0, dtype=tensor.dtype, device='cpu')

    ModuleGroup._offload_to_disk = offload_and_release
    ModuleGroup._ieum_cpu_storage_release = True


def enable_lossless_cpu_inference_cache():
    """Keep exactly representable weights packed in CPU RAM; restore original dtypes.

    Opt-in, process-local, inference-only. Non-representable tensors retain their
    original format. Existing disk files and GPU/stream paths remain untouched.
    """
    release_cpu_disk_offload_storage()
    if getattr(ModuleGroup, '_ieum_lossless_cpu_cache', False):
        return
    original_load = ModuleGroup._onload_from_disk
    original_offload = ModuleGroup._offload_to_disk

    def is_cpu_group(group):
        return (group.stream is None and torch.device(group.onload_device).type == 'cpu'
                and torch.device(group.offload_device).type == 'cpu')

    def cache_and_release(group):
        if not is_cpu_group(group):
            return original_offload(group)
        if not hasattr(group, '_ieum_packed_tensors'):
            packed, dtypes, shapes = {}, {}, {}
            for tensor, key in group.tensor_to_key.items():
                value = tensor.data.detach()
                dtypes[key], shapes[key] = value.dtype, value.shape
                candidate = value.to(torch.bfloat16) if value.is_floating_point() else value
                packed[key] = (candidate if torch.equal(candidate.to(value.dtype), value)
                               else value.clone())
                _cpu_cache_stats['originalBytes'] += value.numel() * value.element_size()
                _cpu_cache_stats['residentBytes'] += packed[key].numel() * packed[key].element_size()
                _cpu_cache_stats['packedTensors' if packed[key].element_size() < value.element_size()
                                 else 'originalFormatTensors'] += 1
            _cpu_cache_stats['groups'] += 1
            group._ieum_packed_tensors = packed
            group._ieum_original_dtypes = dtypes
            group._ieum_original_shapes = shapes
        group._is_offloaded_to_disk = True
        for tensor, key in group.tensor_to_key.items():
            tensor.data = torch.empty(0, dtype=group._ieum_original_dtypes[key], device='cpu')

    def restore_from_cache(group):
        if not is_cpu_group(group) or not hasattr(group, '_ieum_packed_tensors'):
            return original_load(group)
        if torch.is_grad_enabled():
            raise RuntimeError('Lossless CPU cache is inference-only')
        for key, tensor in group.key_to_tensor.items():
            value = group._ieum_packed_tensors[key].to(group._ieum_original_dtypes[key])
            assert value.shape == group._ieum_original_shapes[key]
            tensor.data = value

    ModuleGroup._offload_to_disk = cache_and_release
    ModuleGroup._onload_from_disk = restore_from_cache
    ModuleGroup._ieum_lossless_cpu_cache = True
