"""Tiny exact-byte/control fixtures; no music checkpoint is loaded."""
import hashlib
import tempfile
from pathlib import Path
import torch
from safetensors.torch import save_file
from music_cuda_checkpoint import load_bounded_fp32_model


class TinyModel(torch.nn.Module):
    @staticmethod
    def load_config(directory):
        return {}

    @classmethod
    def from_config(cls, config):
        return cls()

    def __init__(self):
        super().__init__()
        self.projection = torch.nn.Linear(4, 2, bias=False)
        self.register_buffer('reference', torch.zeros(1, 4))


with tempfile.TemporaryDirectory(prefix='checkpoint-control-', dir=Path(__file__).parent) as folder:
    directory = Path(folder)
    path = directory / 'diffusion_pytorch_model.safetensors'
    values = {'projection.weight': torch.tensor([[0., -0., 1., -1.], [2., 3., 4., 5.]]),
              'reference': torch.tensor([[0., -0., .5, -.5]])}
    save_file(values, path)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    for device in ['cpu'] + (['cuda'] if torch.cuda.is_available() else []):
        model, report = load_bounded_fp32_model(TinyModel, directory, digest, device=device)
        assert report['exactTransferBytes'] == 48 and report['tensorCount'] == 2
        for name, tensor in model.state_dict().items():
            assert tensor.detach().cpu().numpy().tobytes() == values[name].numpy().tobytes()
        assert not model.training
    try:
        load_bounded_fp32_model(TinyModel, directory, '0' * 64, device='cpu')
    except AssertionError:
        pass
    else:
        raise AssertionError('Wrong provenance admitted')
    for invalid in ['shape', 'nonfinite', 'missing', 'dtype', 'truncated']:
        changed = {name: value.clone() for name, value in values.items()}
        if invalid == 'shape':
            changed['projection.weight'] = torch.zeros(2, 5)
        elif invalid == 'nonfinite':
            changed['reference'][0, 0] = float('nan')
        elif invalid == 'missing':
            del changed['reference']
        elif invalid == 'dtype':
            changed = {name: value.half() for name, value in changed.items()}
        save_file(changed, path)
        if invalid == 'truncated':
            path.write_bytes(path.read_bytes()[:-1])
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        try:
            load_bounded_fp32_model(TinyModel, directory, digest, device='cpu')
        except AssertionError:
            pass
        else:
            raise AssertionError('Invalid checkpoint admitted: ' + invalid)
print('PASS exact F32/signed-zero transfer, complete parameters/buffers, provenance/shape/dtype/nonfinite/truncation rejection')
