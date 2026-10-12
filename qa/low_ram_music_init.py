"""Opt-in CUDA initialization from verified existing disk groups, without full DiT RAM."""
import gc, hashlib, json, types
from pathlib import Path
import torch
from torch import nn
from accelerate import init_empty_weights
from transformers import AutoModel, AutoTokenizer
from diffusers import AceStepTransformer1DModel, AceStepPipeline
from diffusers.hooks.group_offloading import ModuleGroup
from music_cache_bytes import tensor_header, assert_cache_tensor_bytes

def _sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(8 * 1024 * 1024), b''): h.update(chunk)
    return h.hexdigest()

def load_verified_cached_transformer(model_dir, cache_dir, lineage):
    """Reuse only exact FP32 cache tensors; never create or replace a group file."""
    model_dir, cache_dir = Path(model_dir), Path(cache_dir).resolve()
    parent = json.loads((cache_dir.parent / 'song-generation-report.json').read_text(encoding='utf-8'))
    assert parent['status'] == 'actual-model-inference' and parent['executionDevice'] == 'cuda'
    assert parent['computeDtype'] == 'float32'
    assert (parent['model'], parent['revision']) == (lineage['model'], lineage['revision'])
    config = AceStepTransformer1DModel.load_config(model_dir, subfolder='transformer')
    assert config['is_turbo'] is False
    with init_empty_weights(include_buffers=True):
        model = AceStepTransformer1DModel.from_config(config)
    expected, aliases = {}, {}
    elements = sum(p.numel() for p in model.parameters())
    for module_name, module in model.named_modules():
        for name, parameter in list(module._parameters.items()):
            if parameter is None: continue
            assert parameter.device.type == 'meta'
            full_name = f'{module_name}.{name}' if module_name else name
            if id(parameter) not in aliases:
                replacement = nn.Parameter(torch.empty(0, dtype=torch.float32), requires_grad=False)
                aliases[id(parameter)] = replacement
                expected[replacement] = (full_name, tuple(parameter.shape))
            module._parameters[name] = aliases[id(parameter)]
        # This transformer has no stored, unverified meta buffers. Fail rather
        # than fabricate a buffer value if a later architecture adds any.
        assert all(buffer is None or buffer.device.type != 'meta' for buffer in module._buffers.values())
    files = set(cache_dir.glob('group_*.safetensors'))
    assert len(files) == 13, 'Only the existing complete two-block cache is supported'
    checked = set(); reports = []; covered = set()
    original_offload = ModuleGroup._offload_to_disk
    sources = {}
    for path in (model_dir / 'transformer').glob('diffusion_pytorch_model*.safetensors'):
        header, start = tensor_header(path)
        for key, entry in header.items():
            if key == '__metadata__': continue
            assert key not in sources
            sources[key] = (path, entry, start)
    assert set(name for name, _ in expected.values()) == set(sources)

    def audit_then_offload(group):
        path = Path(group.safetensors_file_path).resolve()
        assert path in files and path.is_file(), 'Do not create missing or differently grouped cache files'
        if path not in checked:
            header, start = tensor_header(path)
            assert set(header)-{'__metadata__'} == set(group.key_to_tensor)
            for key, placeholder in group.key_to_tensor.items():
                assert placeholder in expected
                name, shape = expected[placeholder]
                assert tuple(header[key]['shape']) == shape
                source_path, source_entry, source_start = sources[name]
                assert_cache_tensor_bytes(path, header[key], start, source_path, source_entry, source_start)
                covered.add(name)
            reports.append({'file': path.name, 'sha256': _sha(path), 'tensorCount': len(group.key_to_tensor)})
            checked.add(path)
        return original_offload(group)

    ModuleGroup._offload_to_disk = audit_then_offload
    try:
        model.enable_group_offload(onload_device=torch.device('cuda'), offload_device=torch.device('cpu'),
                                  offload_type='block_level', num_blocks_per_group=2,
                                  use_stream=False, offload_to_disk_path=str(cache_dir))
    finally:
        ModuleGroup._offload_to_disk = original_offload
    assert checked == files and covered == set(sources)
    assert all(parameter.device.type == 'cpu' and parameter.numel() == 0 for parameter in model.parameters())
    model.eval()
    model._ieum_original_parameter_elements = elements
    return model, {'originalParameterElements': elements, 'fullTransformerLoadedInCpuRam': False,
                   'evaluationMode': all(not module.training for module in model.modules()),
                   'verifiedTensorCount': len(covered), 'cacheFiles': reports,
                   'verification':'Bounded exact F32/BF16 byte comparison; no mapped full weights',
                   'parentReportSha256': _sha(cache_dir.parent / 'song-generation-report.json'),
                   'cacheFilesModified': False}

def encode_cuda_prompt_once(model_dir, spec, model_lyrics, duration, task):
    """Use the native encode method on CUDA, then return all text weights."""
    model_dir = Path(model_dir)
    encoder = AutoModel.from_pretrained(model_dir / 'text_encoder', dtype=torch.float32,
                                       local_files_only=True, low_cpu_mem_usage=True).eval().to('cuda')
    host = types.SimpleNamespace(text_encoder=encoder,
                                 tokenizer=AutoTokenizer.from_pretrained(model_dir / 'tokenizer', local_files_only=True),
                                 _build_metadata_string=AceStepPipeline._build_metadata_string)
    host._format_prompt = types.MethodType(AceStepPipeline._format_prompt, host)
    instruction = AceStepPipeline._get_task_instruction(task_type=task, track_name='vocals' if task == 'lego' else None)
    try:
        with torch.inference_mode():
            encoded = AceStepPipeline.encode_prompt(host, prompt=spec['prompt'], lyrics=model_lyrics,
                                                   device=torch.device('cuda'), vocal_language=spec['language'],
                                                   audio_duration=duration, instruction=instruction,
                                                   bpm=spec['bpm'], keyscale=spec['key'], timesignature=spec['timesignature'])
        assert all(torch.isfinite(value).all() for value in encoded if value.is_floating_point())
        return encoded
    finally:
        # MethodType(host) creates host -> bound method -> host. `del host`
        # alone leaves its CUDA encoder alive until a later cyclic GC pass.
        del host._format_prompt
        host.text_encoder = None
        del host, encoder
        gc.collect()
        torch.cuda.empty_cache()
