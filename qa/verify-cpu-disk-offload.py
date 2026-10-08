"""Check actual disk reload numerics and CPU placeholder release, without music claims."""
import argparse, tempfile, torch
from pathlib import Path
from diffusers.hooks.group_offloading import apply_group_offloading
from cpu_disk_offload import release_cpu_disk_offload_storage

p = argparse.ArgumentParser()
p.add_argument('--cache-dir', type=Path, required=True)
a = p.parse_args()
release_cpu_disk_offload_storage()
model = torch.nn.Sequential(torch.nn.Linear(8,16),torch.nn.SiLU(),torch.nn.Linear(16,4)).eval()
x = torch.randn(2,8)
with torch.inference_mode():
    expected = model(x).clone()
with tempfile.TemporaryDirectory(dir=a.cache_dir) as cache:
    apply_group_offloading(model, onload_device=torch.device('cpu'), offload_device=torch.device('cpu'), offload_type='leaf_level', offload_to_disk_path=cache)
    assert sum(t.numel() for t in model.parameters()) == 0
    with torch.inference_mode():
        for _ in range(3):
            torch.testing.assert_close(model(x), expected, rtol=0, atol=0)
            assert sum(t.numel() for t in model.parameters()) == 0
print('Actual CPU disk reload: 3 forwards exactly match original; offloaded placeholders retain 0 elements. Not music quality evidence.')
