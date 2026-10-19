"""Reproduce direct lyric embedding access after the text encoder's disk offload."""
import argparse,json,torch
from pathlib import Path
from transformers import AutoModel,AutoTokenizer
from diffusers.hooks import apply_group_offloading
p=argparse.ArgumentParser();p.add_argument('--model-dir',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--device',choices=['cpu','cuda'],default='cpu');a=p.parse_args()
assert not (a.output_dir/'embedding-offload-diagnosis.json').exists(),'Preserve existing diagnosis'
a.output_dir.mkdir(parents=True,exist_ok=True);torch.set_num_threads(4)
model=AutoModel.from_pretrained(a.model_dir,dtype=torch.float32,local_files_only=True,low_cpu_mem_usage=True).eval()
tok=AutoTokenizer.from_pretrained(a.model_dir.parent/'tokenizer',local_files_only=True)
ids=tok('작은 숨이 빛이 되어',return_tensors='pt').input_ids
assert ids.numel()>0,'Diagnostic tokenizer must be the saved pipeline tokenizer'
with torch.inference_mode():
 expected=model.get_input_embeddings()(ids).clone()
 expected_context=model(input_ids=ids).last_hidden_state.clone()
 without_offload=model.get_input_embeddings()(ids).clone()
assert torch.equal(expected,without_offload)
if a.device=='cuda':
 assert torch.cuda.is_available()
 apply_group_offloading(model,onload_device=torch.device('cuda'),offload_device=torch.device('cpu'),offload_type='leaf_level',use_stream=False)
 ids=ids.to('cuda')
else:
 apply_group_offloading(model,onload_device=torch.device('cpu'),offload_device=torch.device('cpu'),offload_type='block_level',num_blocks_per_group=2,offload_to_disk_path=str(a.output_dir/'offload'))
with torch.inference_mode():
 actual_context=model(input_ids=ids).last_hidden_state.cpu()
 after_offload=model.get_input_embeddings()(ids).clone().cpu()
if a.device=='cuda':
 assert torch.equal(expected,after_offload),'CUDA lyric lookup must preserve exact trained embeddings'
 torch.testing.assert_close(actual_context,expected_context,rtol=1e-3,atol=1e-4)
report={'actualSameWeightInput':True,'withoutOffloadExactMatch':True,'directEmbeddingAfterDiskOffloadExactMatch':torch.equal(expected,after_offload),'afterOffloadFinite':bool(torch.isfinite(after_offload).all()),'expectedEmbeddingRms':float(expected.square().mean().sqrt()),'afterOffloadEmbeddingRms':float(after_offload.square().mean().sqrt()),'maxAbsoluteDifference':float((expected-after_offload).abs().max()),'reason':'ACE-Step encode_prompt calls text encoder forward, then directly calls get_input_embeddings for lyrics; root-level disk offload empties unmatched embedding storage after forward.'}
report.update(executionDevice=a.device,offloadMode='native CUDA leaf memory' if a.device=='cuda' else 'CPU block disk',contextMaximumDifference=float((expected_context-actual_context).abs().max()),contextCpuCudaClose=True if a.device=='cuda' else None)
(a.output_dir/'embedding-offload-diagnosis.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report),flush=True)
