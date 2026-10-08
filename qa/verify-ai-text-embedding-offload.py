"""Reproduce direct lyric embedding access after the text encoder's disk offload."""
import argparse,json,torch
from pathlib import Path
from transformers import AutoModel,AutoTokenizer
from diffusers.hooks import apply_group_offloading
p=argparse.ArgumentParser();p.add_argument('--model-dir',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);a=p.parse_args()
a.output_dir.mkdir(parents=True,exist_ok=True);torch.set_num_threads(4)
model=AutoModel.from_pretrained(a.model_dir,dtype=torch.float32,local_files_only=True,low_cpu_mem_usage=True).eval()
tok=AutoTokenizer.from_pretrained(a.model_dir.parent/'tokenizer',local_files_only=True)
ids=tok('작은 숨이 빛이 되어',return_tensors='pt').input_ids
assert ids.numel()>0,'Diagnostic tokenizer must be the saved pipeline tokenizer'
with torch.inference_mode():
 expected=model.get_input_embeddings()(ids).clone()
 model(input_ids=ids)
 without_offload=model.get_input_embeddings()(ids).clone()
assert torch.equal(expected,without_offload)
apply_group_offloading(model,onload_device=torch.device('cpu'),offload_device=torch.device('cpu'),offload_type='block_level',num_blocks_per_group=2,offload_to_disk_path=str(a.output_dir/'offload'))
with torch.inference_mode():
 model(input_ids=ids)
 after_offload=model.get_input_embeddings()(ids).clone()
report={'actualSameWeightInput':True,'withoutOffloadExactMatch':True,'directEmbeddingAfterDiskOffloadExactMatch':torch.equal(expected,after_offload),'afterOffloadFinite':bool(torch.isfinite(after_offload).all()),'expectedEmbeddingRms':float(expected.square().mean().sqrt()),'afterOffloadEmbeddingRms':float(after_offload.square().mean().sqrt()),'maxAbsoluteDifference':float((expected-after_offload).abs().max()),'reason':'ACE-Step encode_prompt calls text encoder forward, then directly calls get_input_embeddings for lyrics; root-level disk offload empties unmatched embedding storage after forward.'}
(a.output_dir/'embedding-offload-diagnosis.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report),flush=True)
