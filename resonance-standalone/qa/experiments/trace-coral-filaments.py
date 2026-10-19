"""Trace TWO VISIBLE ARCS, not envelopes or recovered closed loops.
Usage: python trace-coral-filaments.py [reference.png] [output-prefix]
Defaults to the committed repetition reference and /tmp/ieum-coral-filaments.
Requires numpy, scipy, Pillow. Exact source hash is enforced.
The narrow manual corridors select candidate filaments. Second-order dynamic
programming prefers coral pixels and tangent continuity across intersections.
No output is imported into the runtime; occluded full-loop identity is unknown.
"""
import sys,json,hashlib
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from scipy.interpolate import PchipInterpolator
from reference_source import repetition_reference
source,sha=repetition_reference(sys.argv[1] if len(sys.argv)>1 else None)
prefix=Path(sys.argv[2]) if len(sys.argv)>2 else Path('/tmp/ieum-coral-filaments')
im=Image.open(source).convert('RGB');a=np.asarray(im,dtype=float)
r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
score=np.clip((r-g*1.10)/90,0,1)*np.clip((r-b)/90,0,1)
# Pixel coordinates manually observed in the top-left coral fan, not color boundaries.
anchors=[[[460,324],[480,338],[500,359],[520,374],[540,384],[560,390],[580,396]],
         [[460,377],[480,363],[500,344],[520,328],[540,321],[560,324],[580,336]]]
paths=[]
for anchor in anchors:
 anchor=np.array(anchor);xs=np.arange(470,513,2);guide=PchipInterpolator(anchor[:,0],anchor[:,1])(xs)
 ys=np.round(guide[:,None]).astype(int)+np.arange(-6,7)[None,:];n,k=ys.shape
 cost=-5*score[ys,xs[:,None]]+.025*(ys-guide[:,None])**2
 dp=cost[0,:,None]+cost[1,None,:]+.20*((ys[1,None,:]-ys[0,:,None])-(guide[1]-guide[0]))**2
 back=[]
 for i in range(2,n):
  bend=(ys[i,None,None,:]-2*ys[i-1,None,:,None]+ys[i-2,:,None,None])
  candidates=dp[:,:,None]+2.5*bend**2
  ix=candidates.argmin(axis=0);back.append(ix)
  dp=candidates.min(axis=0)+cost[i,None,:]
 j,l=np.unravel_index(dp.argmin(),dp.shape);indices=[l,j]
 for ix in reversed(back):
  j,l=int(ix[j,l]),j;indices.append(j)
 indices=indices[::-1];p=np.c_[xs,ys[np.arange(n),indices]]
 paths.append(p)
delta=paths[0][:,1]-paths[1][:,1];cross=[]
for i in range(len(delta)-1):
 if delta[i]*delta[i+1]<0 or delta[i]==0:
  f=0 if delta[i]==0 else abs(delta[i])/(abs(delta[i])+abs(delta[i+1]))
  cross.append((paths[0][i]*(1-f)+paths[0][i+1]*f).tolist())
report={'sourceSha256':sha,'sourceName':'삼색 직조 공명 바이닐(1).png',
 'scope':'Two 42-pixel-wide visible crossing arcs ONLY; not two complete closed contours. Longer initial traces jumped between adjacent filaments and were excluded.',
 'method':'Manual narrow corridors + second-order pixel ridge path; no extrapolation through white/blue occlusion.',
 'anchors':anchors,'arcs':[p.tolist() for p in paths],'intersections':cross,
 'pixelSupport':[float(np.mean(score[p[:,1],p[:,0]]>.15)) for p in paths],
 'globalFilamentIdentityVerified':False,'closedLoopRecovery':False,'runtimeAdopted':False,
 'limitation':'At dense crossings, local continuation is a hypothesis, not proof of the same filament over a full loop. Pixel support cannot establish identity.',
 'next':'Track corresponding visible arcs at the other lobes; mark hidden connections as estimated. Do not fill the whole curve using color envelopes.'}
prefix.parent.mkdir(parents=True,exist_ok=True);prefix.with_suffix('.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
# Side-by-side source and thin annotation: precise QA overlay, not generated imagery.
box=(415,295,665,435);scale=4;crop=im.crop(box).resize((1000,560));out=Image.new('RGB',(2000,620),'#181818');out.paste(crop,(0,60));out.paste(crop,(1000,60));d=ImageDraw.Draw(out)
d.text((20,20),'REFERENCE / visible coral fan',fill='white');d.text((1020,20),'ARC CANDIDATES / cyan A, yellow B / no hidden connections',fill='white')
for p,color in zip(paths,['#21d9ff','#ffed00']):
 q=[(1000+(int(x)-box[0])*scale,60+(int(y)-box[1])*scale) for x,y in p]
 d.line(q,fill=color,width=2)
 for x,y in [q[0],q[-1]]:d.ellipse((x-4,y-4,x+4,y+4),outline=color,width=2)
out.save(prefix.with_suffix('.jpg'),quality=88)
print(json.dumps({k:report[k] for k in ['pixelSupport','intersections','closedLoopRecovery','runtimeAdopted']}))
