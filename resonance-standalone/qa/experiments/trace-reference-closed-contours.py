from pathlib import Path
import numpy as np,json,time
from PIL import Image,ImageDraw
from scipy.ndimage import map_coordinates,gaussian_filter1d
from scipy.signal import find_peaks
root=Path(__file__).resolve().parents[2];
from reference_source import repetition_reference
source,sourceSha=repetition_reference();im=Image.open(source).convert('RGB');a=np.asarray(im,float);R,G,B=a.transpose(2,0,1)
score=np.clip((R-G*1.1)/90,0,1)*np.clip((R-B)/90,0,1);score*=((R>90)&(R>G*1.25)&(G>B*1.07)&((R-G)>2.0*(G-B)));occluded=((B>R*1.15)&(G>R*.95))|((R-G<45)&(G>110)&(B>85))
# Trace a complete winding in the source polar image. State stores radius AND
# incoming slope; endpoints must close with the same radius and slope. This is
# a candidate path through visible/occluded areas, never an identity guarantee.
OUTPUT=Path('/tmp/ieum-reference-traces');OUTPUT.mkdir(exist_ok=True)
n=360;rs=np.arange(205,501);ds=np.arange(-12,13);m=len(rs);k=len(ds);theta=np.arange(n+1)*2*np.pi/n-2*np.pi/3
xx=625+np.cos(theta[:,None])*rs;yy=615+np.sin(theta[:,None])*rs
s=map_coordinates(score,[yy,xx],order=1);h=map_coordinates(occluded.astype(float),[yy,xx],order=0)>.5
cost=-np.log(.025+.95*s);cost[h& (s<.2)]=1.35
# Penalize long unsupported black excursions, while retaining occlusion gaps.
peaks,_=find_peaks(s[0],prominence=.08,distance=3);print('start ridges',rs[peaks].tolist(),flush=True)
radidx=np.arange(m)[:,None];didx=np.arange(k)[None,:];prevR=radidx-ds[None,:];valid=(prevR>=0)&(prevR<m);prevR=np.clip(prevR,0,m-1)
def solve(seed,ds0,rank,curvature=.18):
 target=[]
 for thetaIndex,row in enumerate(s):
  u=(.90-rank)/.80
  localRank=np.clip(rank+.24*np.sin(np.pi*u)*(np.sin(6*(theta[thetaIndex]-theta[0])+2*np.pi*u)-np.sin(2*np.pi*u)),.03,.97)
  weights=np.maximum(0,row-.12);cum=np.cumsum(weights);target.append(np.interp(localRank*cum[-1],cum,rs) if cum[-1]>.1 else np.nan)
 target=np.array(target[:-1]);good=np.isfinite(target);ix=np.arange(n);target=np.interp(ix,np.r_[ix[good]-n,ix[good],ix[good]+n],np.tile(target[good],3));target=gaussian_filter1d(target,3,mode="wrap");target=np.r_[target,target[0]]
 preference=.008*(rs[None,:]-target[:,None])**2
 pixelCost=cost+preference
 si=int(seed-rs[0]);di=int(ds0-ds[0]);dp=np.full((m,k),np.inf);dp[si,di]=pixelCost[0,si];backs=np.empty((n,m,k),np.int8)
 for i in range(1,n+1):
  best=np.full((m,k),np.inf);back=np.zeros((m,k),np.int8)
  for delta in range(-3,4):
   pd=np.clip(didx+delta,0,k-1);candidate=dp[prevR,pd]+curvature*delta*delta
   candidate[:,(ds+delta<ds[0])|(ds+delta>ds[-1])]=np.inf;candidate[~valid]=np.inf
   good=candidate<best;best[good]=candidate[good];back[good]=delta
  dp=best+pixelCost[i,:,None];backs[i-1]=back
 value=dp[si,di];ri=si;dd=di;path=[int(rs[ri])]
 for i in range(n-1,-1,-1):
  delta=int(backs[i,ri,dd]);ri-=int(ds[dd]);dd+=delta
  path.append(int(rs[ri]))
 return value,np.array(path[::-1],float)

paths=[];reports=[]
for idx,seed in enumerate(rs[peaks][::-1]):
 rank=.90-.80*idx/(len(peaks)-1)
 choices=[]
 for d0 in [-3,0,3]:
  value,r=solve(int(seed),d0,rank);choices.append((value,r,d0))
 value,r,d0=min(choices,key=lambda v:v[0]);
 # Periodic smoothing removes the integer-radius staircase, including the seam.
 smooth=gaussian_filter1d(r[:-1],1.3,mode='wrap');smooth=np.r_[smooth,smooth[0]]
 p=np.c_[625+np.cos(theta)*smooth,615+np.sin(theta)*smooth];paths.append(p)
 reports.append({'seedRadius':int(seed),'seedSlope':d0,'cost':float(value),'radius':smooth[:-1].round(5).tolist()})
 print('traced',idx+1,'/',len(peaks),flush=True)
out=im.copy();d=ImageDraw.Draw(out)
for p in paths:d.line([tuple(v) for v in p],fill='#ff9d86',width=1)
out.save(OUTPUT/'overlay.png')
alone=Image.new('RGB',im.size,'#101111');d=ImageDraw.Draw(alone)
for p in paths:d.line([tuple(v) for v in p],fill='#f18c76',width=1)
alone.save(OUTPUT/'alone.png')
Path(OUTPUT/'traces.json').write_text(json.dumps({'candidates':reports,'samples':360,'thetaStart':-2*np.pi/3,'center':[625,615],'method':'Closed source-image polar path candidates, with radius/slope seam closure. Hue excludes warm ivory; empty rays interpolate the reference rank prior periodically. All occluded segments inferred, source-thread identity not certified.','visualApproval':False},indent=2))
