from pathlib import Path
import numpy as np,json
from scipy.ndimage import distance_transform_edt,map_coordinates
from scipy.spatial import cKDTree
from scipy.optimize import differential_evolution
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2]
from reference_source import repetition_reference
source,source_sha=repetition_reference();im=Image.open(source).convert('RGB');a=np.asarray(im,float);R,G,B=a.transpose(2,0,1);yy,xx=np.indices(R.shape);rr=np.hypot(xx-625,yy-615);mask=(R>90)&(R>G*1.25)&(G>B*1.07)&((R-G)>2*(G-B))&(rr>200)&(rr<560);dt=distance_transform_edt(~mask);hidden=((B>R*1.15)&(G>R*.95))|((R-G<65)&(G>110)&(B>85));ref=np.c_[xx[mask],yy[mask]][::35]
d=json.loads((root/'qa/experiments/reference-contour-traces.json').read_text());raw=np.array(d['candidates'][0]['radius']);n=len(raw);t=np.arange(n)/n*2*np.pi;F=np.stack([np.ones(n)]+[f(k*t) for k in range(1,13) for f in [np.cos,np.sin]],1);c=np.linalg.lstsq(F,raw,rcond=None)[0];u=np.linspace(0,1,24)[:,None]
def curves(p,steps=240):
 theta=np.arange(steps)[None,:]/steps*2*np.pi;alpha,span,inset,amplitude,offset=p
 low=c[0]+sum(c[2*k-1]*np.cos(k*theta)+c[2*k]*np.sin(k*theta) for k in range(1,4))
 q=theta+alpha+span*u
 high=sum(c[2*k-1]*np.cos(k*q)+c[2*k]*np.sin(k*q) for k in range(4,13))
 radius=low+high*amplitude*(1-.12*u)-inset*u+offset
 angle=theta+d['thetaStart'];return np.stack([625+np.cos(angle)*radius,615+np.sin(angle)*radius],-1)
def loss(p):
 v=curves(p).reshape(-1,2);dist=map_coordinates(dt,[v[:,1],v[:,0]],order=1,mode='constant',cval=60);h=map_coordinates(hidden.astype(float),[v[:,1],v[:,0]],order=0,mode='constant',cval=0)>.5;cov=cKDTree(v).query(ref)[0]
 return np.mean(np.minimum(dist[~h],25)**2)+.8*np.mean(np.minimum(cov,25)**2)
Path('/tmp/ieum-reference-contours').mkdir(exist_ok=True)
x0=[0,.6,20,1.1,-10];print('initial',loss(x0),flush=True);res=differential_evolution(loss,[(-.35,.35),(.12,1.0),(0,60),(.7,1.4),(-40,10)],x0=x0,popsize=7,maxiter=75,polish=False,seed=21)
v=curves(res.x,800);out=im.copy();d2=ImageDraw.Draw(out)
for row in v:d2.line([tuple(q) for q in row],fill='#ffa992',width=1)
out.save('/tmp/ieum-reference-contours/template-family-overlay.png');alone=Image.new('RGB',im.size,'#101111');dr=ImageDraw.Draw(alone)
for row in v:dr.line([tuple(q) for q in row],fill='#f18c76',width=1)
alone.save('/tmp/ieum-reference-contours/template-family-alone.png');report={'parameters':res.x.tolist(),'loss':float(res.fun),'sourceFourier':c.tolist(),'method':'Phase-shifted whole reference contour, low harmonics preserve placement; large bends repeat inward. Source-guided approximation, not exact recovered thread identity.','visualApproval':False};Path('/tmp/ieum-reference-contours/template-family.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
