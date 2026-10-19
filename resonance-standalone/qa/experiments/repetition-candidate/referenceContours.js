// Full closed-curve family derived from the user-provided coral geometry.
// The entire sequence of large bends repeats, with inward progression and
// changing bend correspondence. No three macro bands or local circular loops.
// Source occlusions and extracted geometry are approximate, not recovered truth.
const c=[373.98333327777794,-37.0202328412657,-20.2606866468337,-8.127043651151213,-16.5823555452808,1.2257699017754833,-13.615811793735007,3.956667058532515,-4.216751531652443,23.618343100751982,-10.991084861570812,7.9455368917190095,3.9692937181380494,-9.725872371861776,-1.5603178148595451,1.2830213026470487,8.608042818411855,-0.9798981192700734,3.2573236498322915,-2.447972210658044,2.003063736308321,-0.2051806655220259,-1.789091157550788,-0.7515855793180716,-2.3192957163297283];
const fit=[-0.11703155359378592,0.5338607321770386,59.54934281180499,1.367348571326637,-1.4766303007965593];
export const referenceContourCount=24;
export const referenceThetaStart=-Math.PI*2/3;
export function referenceContour(p,t,lane,out=[0,0,0]){
 const u=Math.max(0,Math.min(1,lane)),q=t+fit[0]+fit[1]*u;
 let low=c[0],bends=0;
 for(let k=1;k<=12;k++){
  if(k<=3)low+=c[2*k-1]*Math.cos(k*q)+c[2*k]*Math.sin(k*q);
  else bends+=c[2*k-1]*Math.cos(k*q)+c[2*k]*Math.sin(k*q);
 }
 const r=(low+bends*fit[3]*(1-.12*u)-fit[2]*u+fit[4])/240;
 const a=t+referenceThetaStart+(p.phase-2.65)*.70;
 out[0]=Math.cos(a)*r*(1+.035*(p.pitch-.48));
 out[2]=Math.sin(a)*r*(1+.035*(p.air-.28));
 out[1]=.031+.009*Math.sin(3*t+p.phase)+.004*Math.sin(Math.PI*2*u+2*t);
 return out;
}
