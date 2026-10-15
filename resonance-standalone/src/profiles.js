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
 const offset=strand*width+.014*Math.sin(3*t+lane*17)*Math.sin(Math.PI*lane);
 out[0]=c[0]-dy/len*offset;out[1]=c[1]+dx/len*offset;
 out[2]=c[2]+.04*Math.sin(lane*11+t*2);return out;
}
// Compatibility alias for existing profile exports.
export const flower=knot;
export function record(p,t,lane,energy=0,time=0,lift=1,out=[0,0,0]){
 const folds=3+Math.round(p.brightness*5), strand=(lane-.5)*2;
 const center=1.64+.22*Math.sin(2*t+p.phase)+.15*Math.sin(3*t-p.phase);
 const gather=.16+.84*Math.pow(.5+.5*Math.cos(2*t+p.phase),1.7);
 const width=(.27+.16*(1-p.brightness))*gather;
 const r=center+strand*width+.025*Math.sin(3*t+lane*13)*Math.sin(Math.PI*lane)+.075*p.brightness*Math.sin(folds*t+p.phase);
 const turn=t+.07*strand*Math.sin(3*t+p.phase);
 const main=Math.pow(.5+.5*Math.cos(t-p.phase),2.5+p.pitch*3.5)+.26*Math.pow(.5+.5*Math.cos(2*t+p.phase),4);
 const detail=Math.pow(.5+.5*Math.sin(folds*t-p.phase),3);
 const arch=(.55+.90*p.pitch)*main+(.10+.24*p.brightness)*detail;
 const spread=.13+(.22+.15*p.air)*gather;
 const y=Math.max(.025,.055+arch+strand*spread*Math.sin(2*t+p.phase+.4)+.025*Math.sin(4*t+lane*19)
  +.075*(1-strand*strand)*Math.sin(3*t+p.phase)+energy*.15);
 out[0]=Math.cos(turn)*r;out[1]=.018+lift*y;out[2]=Math.sin(turn)*r;return out;
}
