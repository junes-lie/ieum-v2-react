"""Actual ACE-Step LM inference with user-specified song conditions.

Prompt format follows the official build_formatted_prompt_with_cot implementation.
Metadata below is requested conditioning, not inferred or measured song metadata.
"""
import argparse, hashlib, json, time
from pathlib import Path
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, LogitsProcessor

p=argparse.ArgumentParser()
p.add_argument('--model-dir',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
p.add_argument('--spec',type=Path,default=Path(__file__).with_name('ai-song-spec.json'))
p.add_argument('--duration',type=int,default=60)
p.add_argument('--seed',type=int,default=65348)
a=p.parse_args()
assert not a.output.exists(),'Use a new output path; never overwrite existing music codes'
spec=json.loads(a.spec.read_text(encoding='utf-8'))
torch.set_num_threads(4);torch.manual_seed(a.seed)
tok=AutoTokenizer.from_pretrained(a.model_dir,local_files_only=True)
model=AutoModelForCausalLM.from_pretrained(a.model_dir,dtype=torch.float32,local_files_only=True,low_cpu_mem_usage=True).eval()
metadata=f"bpm: {spec['bpm']}\ncaption: {spec['prompt']}\nduration: {a.duration}\nkeyscale: {spec['key']}\nlanguage: {spec['language']}\ntimesignature: {spec['timesignature']}"
prompt=tok.apply_chat_template([
 {'role':'system','content':'# Instruction\nGenerate audio semantic tokens based on the given conditions:\n\n'},
 {'role':'user','content':f"# Caption\n{spec['prompt']}\n\n# Lyric\n{spec['lyrics']}\n"}],tokenize=False,add_generation_prompt=True)
prompt+=f'<think>\n{metadata}\n</think>\n\n'
inputs=tok(prompt,return_tensors='pt')
allowed=[i for text,i in tok.get_vocab().items() if text.startswith('<|audio_code_') and text.endswith('|>')]
assert len(allowed)>1000,'Audio code vocabulary is missing'
class AudioOnly(LogitsProcessor):
 def __call__(self,input_ids,scores):
  mask=torch.full_like(scores,float('-inf'));mask[:,allowed]=scores[:,allowed]
  return mask
started=time.time();count=a.duration*5
print(f'Actual music LM inference: {count} semantic tokens',flush=True)
with torch.inference_mode():
 generated=model.generate(**inputs,max_new_tokens=count,min_new_tokens=count,do_sample=True,temperature=.85,top_k=50,top_p=.95,logits_processor=[AudioOnly()],pad_token_id=tok.eos_token_id)
codes=tok.decode(generated[0,inputs.input_ids.shape[1]:],skip_special_tokens=False)
assert codes.count('<|audio_code_')==count
report={'model':'ACE-Step/acestep-5Hz-lm-0.6B','revision':'148d8ea0225bdab342ee1ae3a354275ccd60ca80','license':'MIT','actualInference':True,'spec':spec,'requestedDuration':a.duration,'seed':a.seed,'audioCodes':codes,'codeCount':count,'codesSha256':hashlib.sha256(codes.encode()).hexdigest(),'inferenceSeconds':time.time()-started,'metadataOrigin':'explicit requested conditioning; not measured or LM-inferred metadata'}
a.output.parent.mkdir(parents=True,exist_ok=True)
a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ['audioCodes','spec']},ensure_ascii=False),flush=True)
