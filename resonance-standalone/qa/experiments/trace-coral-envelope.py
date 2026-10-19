"""Measure visible CORAL envelopes; occlusion prevents treating these as full paths.
Usage: python trace-coral-envelope.py reference.png output.json
Requires numpy and Pillow. This is analysis only, not a runtime path generator.
"""
import sys,json,hashlib
import numpy as np
from PIL import Image
from pathlib import Path
source=Path(sys.argv[1]);a=np.asarray(Image.open(source).convert('RGB'),dtype=float)
y,x=np.indices(a.shape[:2]);cx,cy=625.,615.;radius=np.hypot(x-cx,y-cy);theta=np.arctan2(y-cy,x-cx)%(2*np.pi)
r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
mask=(r>90)&(r>g*1.25)&(g>b*1.07)&(radius>200)&(radius<560)
rows=[]
for i in range(72):
 select=mask&(theta>=i*np.pi/36)&(theta<(i+1)*np.pi/36);values=radius[select]
 row={'angleDegrees':i*5+2.5,'pixels':int(values.size)}
 if values.size>=12:
  lo,hi=np.quantile(values,[.05,.95]);angle=(i+.5)*np.pi/36
  row.update(innerRadius=float(lo),outerRadius=float(hi),innerXY=[cx+lo*np.cos(angle),cy+lo*np.sin(angle)],outerXY=[cx+hi*np.cos(angle),cy+hi*np.sin(angle)])
 rows.append(row)
Path(sys.argv[2]).write_text(json.dumps({'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'center':[cx,cy],'method':'72 angular bins; chromatic CORAL mask; radial 5/95 percentiles','limitation':'Visible color envelope, not a traced individual closed filament. White/blue crossings occlude coral. Missing bins must not be silently interpolated into approved geometry.','samples':rows},indent=2))
print('bins with evidence:',sum('innerRadius' in x for x in rows),'/72; pixels:',int(mask.sum()))
