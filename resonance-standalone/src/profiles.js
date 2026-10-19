import {contourStudy} from './contourStudy.js';
export const TAU=Math.PI*2;
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const defaults=[
 {id:'A',name:'BLUE',color:'#68baf0',pitch:.20,brightness:.22,air:.12,phase:.35},
 {id:'B',name:'CORAL',color:'#f18c76',pitch:.48,brightness:.85,air:.28,phase:2.65},
 {id:'C',name:'IVORY',color:'#eee0c4',pitch:.84,brightness:.42,air:.76,phase:5.25},
 {id:'D',name:'SAGE',color:'#b0c6a4',pitch:.38,brightness:.58,air:.47,phase:1.55}
];
export const profiles=defaults.map(p=>({...p}));
// Fixed descriptors define identity; playback energy only adds small deformations.
// The same descriptors drive two distinct forms: a personal knot and a record trace.
export function knot(p,t,lane,out=[0,0,0]){
 // A shared continuous harmonic knot family. Descriptors change proportion and tension,
 // never select a flower/star template or use participant order as identity.
 const tall=clamp((p.pitch-.40)/.5),compact=clamp((p.brightness-.35)/.5);
 const center=a=>{
  const q=a+.12*Math.sin(a+p.phase),blend=.90+.10*tall;
  const x=Math.sin(q)*(1-blend)+(Math.sin(q)+2*Math.sin(2*q))/3*blend;
  const y=.70*Math.sin(2*q)*(1-blend)+(Math.cos(q)-2*Math.cos(2*q))/3*blend;
  return [(x*(1-compact)+.76*Math.sin(2*q)*compact)*(1.18-.39*tall),
   -(y*(1-compact)+.76*Math.sin(3*q+.24)*compact)*(.74+.40*tall),
   (.28*Math.cos(q)*(1-blend)-.30*Math.sin(3*q)*blend)*(1-compact)+.23*Math.cos(q)*compact];
 };
 const c=center(t),prev=center(t-.002),next=center(t+.002);
 const dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.max(.0001,Math.hypot(dx,dy));
 const strand=(lane-.5)*2;
 const gather=.30+.70*Math.pow(.5+.5*Math.sin(2*t+p.phase),1.4);
 const width=(.10+.09*gather)*(1-.18*p.air);
 // Periodic strand offsets preserve the closed path while breaking comb-like spacing.
 const filament=.009*Math.sin(7*t+lane*31+p.phase)+.005*Math.sin(11*t-lane*19);
 const offset=strand*width+.014*Math.sin(3*t+lane*17)*Math.sin(Math.PI*lane)+filament*Math.sin(Math.PI*lane);
 out[0]=c[0]-dy/len*offset;out[1]=c[1]+dx/len*offset;
 out[2]=c[2]+.04*Math.sin(lane*11+t*2)+.012*Math.sin(5*t+lane*23+p.phase);return out;
}
// Compatibility alias for existing profile exports.
export const flower=knot;
export function record(p,t,lane,energy=0,time=0,lift=1,out=[0,0,0]){
 const folds=3+Math.round(p.brightness*5), strand=(lane-.5)*2;
 const center=1.64+.22*Math.sin(2*t+p.phase)+.15*Math.sin(3*t-p.phase);
 const gather=.16+.84*Math.pow(.5+.5*Math.cos(2*t+p.phase),1.7);
 const width=(.17+.11*(1-p.brightness))*gather;
 const filament=(.009*Math.sin(7*t+lane*31+p.phase)+.005*Math.sin(11*t-lane*19))*gather;
 const r=center+strand*width+filament+.045*Math.sin(3*t+lane*29)*gather*Math.sin(Math.PI*lane)+.075*p.brightness*Math.sin(folds*t+p.phase);
 const turn=t+.07*strand*Math.sin(3*t+p.phase);
 const main=Math.pow(.5+.5*Math.cos(t-p.phase),2.5+p.pitch*3.5)+.26*Math.pow(.5+.5*Math.cos(2*t+p.phase),4);
 const detail=Math.pow(.5+.5*Math.sin(folds*t-p.phase),3);
 const arch=(.55+.90*p.pitch)*main+(.10+.24*p.brightness)*detail;
 const spread=.08+(.13+.10*p.air)*gather;
 const rawY=.055+arch+filament*.7+strand*spread*Math.sin(2*t+p.phase+.4)+.055*Math.sin(4*t+lane*23)*gather
  +.075*(1-strand*strand)*Math.sin(3*t+p.phase)+energy*.15;
 // Smooth clearance avoids a clipped horizontal sheet where strands approach the record.
 const clearance=rawY-.025;const y=.025+.5*(clearance+Math.sqrt(clearance*clearance+.004));
 out[0]=Math.cos(turn)*r;out[1]=.018+lift*y;out[2]=Math.sin(turn)*r;return out;
}

// Planar counterpart of the same voice descriptors. All strands are closed paths.
// Alternating strand convergence creates a woven interior without a filled surface.
function baselinePlanar(p,t,lane,out=[0,0,0]){
 const s=(lane-.5)*2,phase=p.phase;
 const center=1.66+.24*Math.sin(2*t+phase)+.17*Math.sin(3*t-phase)+.10*(1-p.pitch);
 // Periodic phase warping changes spacing continuously with the voice descriptors.
 // Integer harmonics keep every strand closed, including extreme input profiles.
 const local=t+(.12+.19*(1-p.brightness))*Math.sin(t+phase)+(.04+.13*p.air)*Math.sin(2*t-phase);
 const gather=.18+.82*Math.pow(.5+.5*Math.sin(3*local+phase*.8),.65+.6*p.air);
 const twist=3*local+phase+(.18+.55*p.brightness)*Math.sin(2*t-phase)
  +.24*p.air*Math.sin(5*t+phase)+.16*p.brightness*Math.sin(3*t+lane*9+phase);
 const spread=(.48+.10*p.air+.06*(1-p.brightness))*gather;
 // A coherent fan opens from a common gathering region. Relative phase changes
 // smoothly per filament; a full 2pi lane offset would make an even crosshatch.
 const fan=s+(.12+.16*p.air)*Math.sin(lane*TAU+phase)*Math.sin(Math.PI*lane);
 const lag=(.34+.36*p.brightness)*s+.16*Math.sin(lane*11+phase)*Math.sin(Math.PI*lane);
 const fold=twist+lag*gather;
 const across=.65*fan*Math.sin(fold)+.45*Math.sin(twist+lane*TAU)+.10*Math.sin(lane*TAU+2*local+phase)*Math.sin(Math.PI*lane);
 const raw=.94*(center+spread*across+(.012+.028*p.brightness)*gather*Math.sin(5*t+lane*17+phase));
 const inner=raw-.84,cleared=.84+.5*(inner+Math.sqrt(inner*inner+.0025));
 const outer=2.50-cleared,r=2.50-.5*(outer+Math.sqrt(outer*outer+.0025));
 const turn=t+.19*gather*(.65*fan*Math.cos(fold)+.35*Math.cos(twist+lane*TAU))+.025*Math.sin(2*t+phase);
 out[0]=Math.cos(turn)*r;out[2]=Math.sin(turn)*r;
 out[1]=.028+.022*Math.sin(3*t+phase)+.004*s*Math.sin(twist);
 return out;
}

// Static per-particle texture from descriptors, independent of color and participant slot.
export function planarGrain(p,u,v){
 return {size:1.3+.8*u+2.8*p.brightness*u**4+1.8*p.air*u**2,
  alpha:clamp(.62+.40*v+.24*p.air*u**4)};
}

// Monotone periodic remapping bunches grains without changing their stored phase.
// The 3D trace still uses its original t; both endpoints meet continuously.
export function planarParticleT(p,t){
 return t+(.06+.17*p.brightness+.06*p.air)*Math.sin(3*t+p.phase);
}

// Opt-in QA mode; preserve the existing default renderer and all audio/UI behavior.
export const planar = typeof location !== 'undefined' && new URLSearchParams(location.search).get('contourStudy') === '1' ? contourStudy : baselinePlanar;
