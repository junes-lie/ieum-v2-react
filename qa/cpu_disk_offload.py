"""Release CPU placeholders only after actual Diffusers disk offload.

Diffusers 0.41 reloads each parameter's .data from safetensors before forward.
Its full-size empty CPU placeholders otherwise retain the model's RAM budget.
This process-local adjustment preserves disk weights and text encoder storage.
"""
import torch
from diffusers.hooks.group_offloading import ModuleGroup


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
