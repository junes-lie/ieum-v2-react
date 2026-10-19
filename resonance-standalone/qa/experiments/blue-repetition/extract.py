from pathlib import Path
import numpy as np,json
from PIL import Image,ImageDraw
from scipy.ndimage import map_coordinates,gaussian_filter1d
root=Path(__file__).resolve().parents[3]
import sys
sys.path.insert(0,str(root/'qa/experiments'))
from reference_source import repetition_reference
source,source_sha=repetition_reference();a=np.array(Image.open(source).convert('RGB'));R,G,B=a.astype(float).transpose(2,0,1);m=(B>R*1.22)&(G>R*1.15)&(B>80);score=np.clip((B-R)/100,0,1)*m
N=360;t=np.arange(N)*2*np.pi/N;radius=np.arange(165,561);x=625+np.cos(t[:,None])*radius;y=615+np.sin(t[:,None])*radius;v=map_coordinates(score,[y,x],order=1)

import hashlib
curves=[]
for group,(lo,hi) in enumerate([(350,560),(165,335)]):
 w=v.copy();w[:,(radius<lo)|(radius>hi)]=0
 for lane in range(12):
  quantile=.10+.80*lane/11;rs=np.array([np.interp(row.sum()*quantile,np.cumsum(row),radius) if row.sum()>1.5 else np.nan for row in w]);good=np.isfinite(rs);ix=np.arange(N);rs=np.interp(ix,np.r_[ix[good]-N,ix[good],ix[good]+N],np.tile(rs[good],3));rs=gaussian_filter1d(rs,6,mode='wrap')
  curves.append({'group':group,'quantile':quantile,'radius':rs.round(4).tolist(),'observed':good.tolist()})
out={'sourceSha256':hashlib.sha256((root/'qa/renders/approved-repetition-reference.png').read_bytes()).hexdigest(),'center':[625,615],'scale':240,'method':'Two separately sampled source blue radial components; no paths fill the black gap. All unobserved arcs interpolated periodically, not recovered thread identities.','samples':360,'curves':curves,'visualApproval':False}
p=root/'qa/experiments/blue-repetition';p.mkdir(exist_ok=True);(p/'paths.json').write_text(json.dumps(out,separators=(',',':')))
# Source overlay: representative whole outer and inner path, inferred arc dashed.
im=Image.fromarray(a);dr=ImageDraw.Draw(im)
for j in [6,18]:
 c=curves[j];r=np.array(c['radius']);xy=np.c_[625+np.cos(t)*r,615+np.sin(t)*r]
 for i in range(N):
  if not c['observed'][i] and i%6>=3:continue
  dr.line([tuple(xy[i]),tuple(xy[(i+1)%N])],fill=('#70ffd1' if j<12 else '#ffdf82') if c['observed'][i] else '#f76af2',width=3)
im.save(root/'public/review/blue-source-overlay.jpg',quality=92)
isolated=np.zeros_like(a);isolated[m]=a[m];Image.fromarray(isolated).save(root/'public/review/blue-source-isolation.jpg',quality=91)

# Refresh runtime samples from the same extraction, keeping the interpolation function.
import re
module=root/'qa/experiments/blue-repetition/referenceContours.js'
text=module.read_text();text=re.sub(r'const paths=.*?;',lambda _: 'const paths='+json.dumps([c['radius'] for c in curves],separators=(',',':'))+';',text,count=1)
module.write_text(text)
