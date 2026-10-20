"""Diagnostic only: proximity to blue pixels cannot prove same-filament identity."""
import json, hashlib
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt
base=Path(__file__).resolve().parent
source=base.parents[1]/'renders/approved-repetition-reference.png'
a=np.asarray(Image.open(source).convert('RGB')).astype(float)
r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
blue=(b-r>30)&(g-r>20)&(b>90)
d=distance_transform_edt(~blue)
report=json.loads((base/'upper-connectivity.json').read_text())
for s in report['segments']:
 t=np.linspace(0,1,1001)[:,None];w=1-t
 p=w**3*s['from']+3*w*w*t*s['c1']+3*w*t*t*s['c2']+t**3*s['to']
 xy=np.rint(p).astype(int);v=d[xy[:,1],xy[:,0]]
 s['bluePixelSupportWithin2px']=round(float((v<=2).mean()),4)
 s['maxBluePixelDistance']=round(float(v.max()),2)
report['sourceSHA256']=hashlib.sha256(source.read_bytes()).hexdigest()
report['pixelCaveat']='Blue proximity is necessary local evidence, not sufficient filament continuity; crossing and occlusion remain ambiguous.'
(base/'upper-connectivity.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
