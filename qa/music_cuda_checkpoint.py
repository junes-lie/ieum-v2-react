"""Exact bounded F32 checkpoint loading without mapping the complete CPU model."""
import hashlib
import math
from pathlib import Path


def load_bounded_fp32_model(model_class, directory, expected_sha256, device='cuda'):
    import numpy as np
    import torch
    from accelerate import init_empty_weights
    from music_cache_bytes import tensor_header

    directory = Path(directory)
    path = directory / 'diffusion_pytorch_model.safetensors'
    with path.open('rb') as stream:
        actual_sha = hashlib.file_digest(stream, 'sha256').hexdigest()
    assert actual_sha == expected_sha256, 'Use only the verified unchanged checkpoint'
    header, start = tensor_header(path)
    entries = {key: value for key, value in header.items() if key != '__metadata__'}
    assert entries and all(value['dtype'] == 'F32' for value in entries.values()), 'No unverified dtype conversion'
    intervals = sorted(value['data_offsets'] for value in entries.values())
    cursor = 0
    for left, right in intervals:
        assert left == cursor and right > left, 'Reject gaps, overlaps and empty tensors'
        cursor = right
    assert start + cursor == path.stat().st_size
    assert cursor < 3 * 1024**3, 'Bound this component to three GiB'
    largest = max(math.prod(value['shape']) * 4 for value in entries.values())
    assert largest <= 64 * 1024**2, 'Bound each CPU staging tensor to 64 MiB'
    target = torch.device(device)
    assert target.type in ('cpu', 'cuda')
    if target.type == 'cuda':
        assert torch.cuda.is_available()
        # Release only this process's unused allocator cache before checking
        # physical free VRAM; keep the same two-GiB safety threshold.
        torch.cuda.empty_cache()
        free, _ = torch.cuda.mem_get_info()
        assert free > cursor + 2 * 1024**3, 'Keep two GiB GPU activation headroom'
    else:
        assert cursor < 16 * 1024**2, 'CPU mode is only for tiny control fixtures'
    config = model_class.load_config(directory)
    with init_empty_weights(include_buffers=True):
        model = model_class.from_config(config)
    expected = model.state_dict(keep_vars=True)
    assert set(expected) == set(entries), 'No missing/fabricated model state'
    assert len({id(value) for value in expected.values()}) == len(expected), 'Tied-state mapping needs separate validation'
    for name, original in expected.items():
        assert original.device.type == 'meta' and original.dtype == torch.float32
        assert list(original.shape) == entries[name]['shape'], 'Checkpoint shape differs from configured model'
    exact = 0
    with path.open('rb') as stream:
        for name, original in expected.items():
            entry = entries[name]
            left, right = entry['data_offsets']
            assert right - left == math.prod(entry['shape']) * 4
            stream.seek(start + left)
            raw = stream.read(right - left)
            assert len(raw) == right - left
            data = np.frombuffer(raw, dtype='<f4')
            for offset in range(0, len(data), 262144):
                assert np.isfinite(data[offset:offset + 262144]).all(), 'Non-finite checkpoint tensor'
            # A writable bounded copy avoids a readonly-buffer warning. Never
            # materialize all CPU parameters, including during CUDA transfer.
            tensor = torch.from_numpy(data.copy().reshape(entry['shape'])).to(target)
            copied_hash = hashlib.sha256()
            for chunk in tensor.detach().reshape(-1).split(262144):
                copied_hash.update(chunk.cpu().contiguous().numpy().tobytes())
            assert copied_hash.digest() == hashlib.sha256(raw).digest(), 'Transfer changed exact F32 bytes'
            parent_name, _, leaf = name.rpartition('.')
            owner = model.get_submodule(parent_name) if parent_name else model
            if leaf in owner._parameters:
                owner._parameters[leaf] = torch.nn.Parameter(tensor, requires_grad=original.requires_grad)
            else:
                assert leaf in owner._buffers
                owner._buffers[leaf] = tensor
            exact += 1
            del raw, data, tensor
    assert all(value.device.type == target.type for value in model.state_dict().values())
    model.eval()
    return model, {'checkpointSha256': actual_sha, 'tensorCount': exact,
                   'exactTransferBytes': cursor, 'maximumTensorBytes': largest,
                   'completeCpuModelLoaded': False, 'device': str(target)}
