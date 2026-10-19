"""Pinned official ONNX/windowing/postprocessing research, no full package install."""
import argparse,ast,hashlib,json,math,time
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--runtime-dir',type=Path,required=True);p.add_argument('--audio',type=Path,required=True);p.add_argument('--start',type=float,default=0);p.add_argument('--duration',type=float,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
assert a.audio.is_file() and not a.output.exists() and math.isfinite(a.start) and a.start>=0 and math.isfinite(a.duration) and 0<a.duration<=10
root=a.runtime_dir.resolve();manifest=json.loads((root/'source-manifest.json').read_text(encoding='utf-8-sig'))
assert manifest['revision']=='fa5997af0a8210982619003269994a1be25eddf3'
pinned={
 'LICENSE':'929c910bae2152fa87199a5d0660e09263419b7eee6d4b301d05ee2aaf211c37',
 'NOTICE':'b810e55c0e3b520fabb45fc2ccc74880187bf84e309971968541cc812dcde905',
 'basic_pitch/constants.py':'4dab8b61240dbf3320bc4983b9a215d93254df84caf19adef3859d1390189181',
 'basic_pitch/inference.py':'b85aeaa13d421861378d8bd5e841d9087cecd3dc4bfd15abc1f40c1ea2b8abc9',
 'basic_pitch/note_creation.py':'83346193f834edfc37aeadbed91a4092b574727dd2b4535e03e5ad89d2e89506',
 'basic_pitch/saved_models/icassp_2022/nmp.onnx':'2c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec',
}
assert {item['path']:item['sha256'] for item in manifest['files']}==pinned,'Pinned source manifest changed'
for item in manifest['files']:
 file=root/item['path'].replace('/','__');assert hashlib.sha256(file.read_bytes()).hexdigest()==item['sha256']
model=root/'basic_pitch__saved_models__icassp_2022__nmp.onnx';assert hashlib.sha256(model.read_bytes()).hexdigest()=='2c3c1d144bfa61ad236e92e169c13535c880469a12a047d4e73451f2c059a0ec'
import numpy as np,onnxruntime as ort,librosa,scipy.signal
scope={'np':np,'librosa':librosa,'scipy':scipy}
constants=ast.parse((root/'basic_pitch__constants.py').read_text(encoding='utf-8'));exec(compile(constants,'pinned-basic-pitch-constants','exec'),scope)
for filename,selected in [('basic_pitch__inference.py',{'window_audio_file','unwrap_output'}),('basic_pitch__note_creation.py',{'get_infered_onsets','constrain_frequency','model_frames_to_time','output_to_notes_polyphonic'})]:
 tree=ast.parse((root/filename).read_text(encoding='utf-8'));functions=[node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name in selected];assert len(functions)==len(selected)
 # Preserve the reviewed official bodies, avoiding unrelated MIDI/framework imports.
 module=ast.Module(body=[ast.ImportFrom(module='__future__',names=[ast.alias(name='annotations')],level=0)]+functions,type_ignores=[]);ast.fix_missing_locations(module);exec(compile(module,filename,'exec'),scope)
scope.update(MIDI_OFFSET=21,MAX_FREQ_IDX=87,MAGIC_ALIGNMENT_OFFSET=.0018)
options=ort.SessionOptions();options.intra_op_num_threads=2;options.inter_op_num_threads=1
session=ort.InferenceSession(str(model),sess_options=options,providers=['CPUExecutionProvider'])
interface={'inputs':[{'name':v.name,'shape':v.shape,'type':v.type} for v in session.get_inputs()],'outputs':[{'name':v.name,'shape':v.shape,'type':v.type} for v in session.get_outputs()]}
audio,sr=librosa.load(a.audio,sr=22050,mono=True,offset=a.start,duration=a.duration)
assert sr==22050 and len(audio)>0 and np.isfinite(audio).all()
start=time.perf_counter();original_length=len(audio);overlap=30;hop=scope['AUDIO_N_SAMPLES']-overlap*scope['FFT_HOP'];audio=np.concatenate([np.zeros(overlap*scope['FFT_HOP']//2,dtype=np.float32),audio])
outputs={key:[] for key in ['note','onset','contour']}
for window,_ in scope['window_audio_file'](audio,hop):
 result=session.run(['StatefulPartitionedCall:1','StatefulPartitionedCall:2','StatefulPartitionedCall:0'],{'serving_default_input_2:0':window[None]})
 for key,value in zip(outputs,result):outputs[key].append(value)
outputs={key:scope['unwrap_output'](np.concatenate(value),original_length,overlap,hop) for key,value in outputs.items()}
assert all(np.isfinite(value).all() for value in outputs.values())
# Official predict defaults, no thresholds tuned against input or annotations.
minimum_note_frames=int(np.round(.1277*22050/256))
events=scope['output_to_notes_polyphonic'](outputs['note'],outputs['onset'],onset_thresh=.5,frame_thresh=.3,min_note_len=minimum_note_frames,infer_onsets=True,max_freq=None,min_freq=None,melodia_trick=True)
times=scope['model_frames_to_time'](outputs['note'].shape[0]);notes=[]
for begin,end,midi,amplitude in sorted(events):
 notes.append({'start':a.start+float(times[begin]),'end':a.start+float(times[end]),'midi':int(midi),'meanActivation':float(amplitude),'startFrame':int(begin),'endFrame':int(end)})
report={'status':'unapproved-polyphonic-note-candidate','revision':manifest['revision'],'modelSha256':hashlib.sha256(model.read_bytes()).hexdigest(),'sourceAudioSha256':hashlib.sha256(a.audio.read_bytes()).hexdigest(),'window':{'start':a.start,'duration':original_length/22050},'interface':interface,'onnxruntimeVersion':ort.__version__,'provider':'CPUExecutionProvider','threads':{'intra':2,'inter':1},'officialOverlapFrames':overlap,'officialOnsetThreshold':.5,'officialFrameThreshold':.3,'officialMinimumNoteMilliseconds':127.7,'minimumNoteFrames':minimum_note_frames,'nativeNotes':notes,'rawShapes':{key:list(value.shape) for key,value in outputs.items()},'inferenceSeconds':time.perf_counter()-start,'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'harmonyApproved':False,'catalogRegistrationApproved':False,'limits':['Direct existing ONNX runtime and reviewed pinned functions; Basic Pitch Python package not installed or claimed supported on Python3.13','Polyphonic note candidates are not chord/key or approved score','Official model is best on one instrument at a time; mixed backing is a limitation','Official time correction preserved, no manual output shift, no threshold tuning','No listening or new Part approval']}
a.output.write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
