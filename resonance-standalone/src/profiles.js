export const TAU=Math.PI*2;
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const defaults=[
 {id:'A',name:'BLUE',color:'#68baf0',pitch:.20,brightness:.22,air:.12,phase:.35},
 {id:'B',name:'CORAL',color:'#f18c76',pitch:.48,brightness:.85,air:.28,phase:2.65},
 {id:'C',name:'IVORY',color:'#eee0c4',pitch:.84,brightness:.42,air:.76,phase:4.7}
];
export const profiles=defaults.map(p=>({...p}));
// Fixed descriptors define identity; playback energy only adds small deformations.
// The same descriptors drive two distinct forms: a personal knot and a record trace.
export function knot(p,t,lane,out=[0,0,0]){
 const tall=clamp((p.pitch-.45)/.45), compact=clamp((p.brightness-.35)/.5);
 const center=a=>{
  const x=Math.sin(a)*(1-tall)+(Math.sin(a)+2*Math.sin(2*a))/3*tall;
  const y=.70*Math.sin(2*a)*(1-tall)+(Math.cos(a)-2*Math.cos(2*a))/3*tall;
  const bx=.76*Math.sin(2*a),by=.76*Math.sin(3*a+.24);
  return [(x*(1-compact)+bx*compact)*(1.18-.39*tall),
   -(y*(1-compact)+by*compact)*(.74+.40*tall),(.28*Math.cos(a)*(1-tall)-.25*Math.sin(3*a)*tall)*(1-compact)+.23*Math.cos(a)*compact];
 };
 const c=center(t),prev=center(t-.002),next=center(t+.002);
 const dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy);
 const width=(.12+.023*Math.sin(2*t+p.phase))*(1-.25*p.air);
 const offset=(lane-.5)*2*width;
 out[0]=c[0]-dy/len*offset;out[1]=c[1]+dx/len*offset;
 out[2]=c[2]+offset*.35*Math.sin(t*3);return out;
}
// Compatibility alias for existing profile exports.
export const flower=knot;
export function record(p,t,lane,energy=0,time=0,lift=1,out=[0,0,0]){
 const folds=3+Math.round(p.brightness*5), strand=(lane-.5)*2;
 const center=1.64+.22*Math.sin(2*t+p.phase)+.15*Math.sin(3*t-p.phase);
 const gather=.16+.84*Math.pow(.5+.5*Math.cos(2*t+p.phase),1.7);
 const width=(.27+.16*(1-p.brightness))*gather;
 const r=center+strand*width+.075*p.brightness*Math.sin(folds*t+p.phase);
 const turn=t+.07*strand*Math.sin(3*t+p.phase);
 const main=Math.pow(.5+.5*Math.cos(t-p.phase),2.8)+.26*Math.pow(.5+.5*Math.cos(2*t+p.phase),4);
 const detail=Math.pow(.5+.5*Math.sin(folds*t-p.phase),3);
 const arch=(.60+.63*p.pitch)*main+(.10+.24*p.brightness)*detail;
 const spread=.13+(.22+.15*p.air)*gather;
 const y=Math.max(.025,.055+arch+strand*spread*Math.sin(2*t+p.phase+.4)
  +.075*(1-strand*strand)*Math.sin(3*t+p.phase)+energy*.15);
 out[0]=Math.cos(turn)*r;out[1]=.018+lift*y;out[2]=Math.sin(turn)*r;return out;
}
