"""Local diagnostic speaker embedding probe; never a UI match/ability score."""
import argparse
import json
import os
from pathlib import Path
import time
import truststore
truststore.inject_into_ssl()

parser=argparse.ArgumentParser()
parser.add_argument('--runtime',required=True)
args=parser.parse_args()
runtime=Path(args.runtime).resolve()
os.environ['HF_HOME']=str(runtime/'model-cache')
os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
import numpy as np
import soundfile as sf
import torch
from transformers import Wav2Vec2FeatureExtractor,WavLMForXVector

torch.set_num_threads(min(8,os.cpu_count() or 1))
torch.use_deterministic_algorithms(True)
model_id='microsoft/wavlm-base-plus-sv'
revision='feb593a6c23c1cc3d9510425c29b0a14d2b07b1e'
extractor=Wav2Vec2FeatureExtractor.from_pretrained(model_id,revision=revision)
model=WavLMForXVector.from_pretrained(model_id,revision=revision).eval()
sources=[]
for name in ['public-speech.wav','public-speech-comparison.wav']:
    pcm,sr=sf.read(runtime/'results'/name,dtype='float32',always_2d=True)
    assert sr==16000,'Probe requires actual 16kHz audio; no implicit rate relabeling'
    sources.append(np.ascontiguousarray(pcm.mean(axis=1)))
first=sources[0]
middle=len(first)//2
clips=[first,first.copy(),first[:middle],first[middle:],sources[1]]
started=time.perf_counter()
inputs=extractor(clips,sampling_rate=16000,padding=True,return_tensors='pt')
with torch.inference_mode():
    vectors=torch.nn.functional.normalize(model(**inputs).embeddings,dim=-1).cpu()
repeat=float(torch.dot(vectors[0],vectors[1]))
same_voice_segments=float(torch.dot(vectors[2],vectors[3]))
other_voice=float(torch.dot(vectors[0],vectors[4]))
report={'model':model_id,'revision':revision,'seconds':round(time.perf_counter()-started,3),
    'sameInputCosine':repeat,'sameRecordingDifferentSegmentsCosine':same_voice_segments,
    'otherRecordingCosine':other_voice,'sameInputAllClose':bool(torch.allclose(vectors[0],vectors[1],atol=1e-6)),
    'sameSegmentsHigherThanOther':same_voice_segments>other_voice,
    'embeddingDimensions':int(vectors.shape[1]),
    'limitations':['two public speech recordings only','same recording halves, not independent takes',
        'not singing validation','not a user-facing compatibility score']}
(runtime/'results'/'speaker-probe-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
assert report['sameInputAllClose'],'Embedding repeat was not stable'
assert report['sameSegmentsHigherThanOther'],'Speaker segment distinction failed on this input'
print('PASS actual speaker model repeat/segment comparison on public speech',flush=True)
