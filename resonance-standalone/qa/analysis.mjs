import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeBuffer} from '../src/analyze.js';
import {record,planar,planarGrain,planarParticleT,flower,defaults,TAU} from '../src/profiles.js';
const results=[];
const check=(name,condition,detail)=>{assert.ok(condition,name+': '+JSON.stringify(detail));results.push({name,pass:true,detail});};
function buffer(hz,{gain=.2,noise=0,harmonics=0,sr=44100,stereo=false,seconds=2}={}){const a=new Float32Array(sr*seconds);let seed=123456;for(let i=0;i<a.length;i++){seed=(1664525*seed+1013904223)>>>0;const t=i/sr;a[i]=gain*(Math.sin(TAU*hz*t)+harmonics*Math.sin(TAU*hz*3*t))+noise*(seed/4294967296*2-1);}return {duration:seconds,sampleRate:sr,length:a.length,numberOfChannels:stereo?2:1,getChannelData:i=>i?Float32Array.from(a,x=>-x):a};}
for(const hz of [90,146.83,220,440,880]){const r=await analyzeBuffer(buffer(hz));check('pitch '+hz,Math.abs(r.metrics.medianHz-hz)<3,r.metrics.medianHz);}
const low=await analyzeBuffer(buffer(146.83)),high=await analyzeBuffer(buffer(440));check('pitch changes proportions',high.profile.pitch>low.profile.pitch,{low:low.profile.pitch,high:high.profile.pitch});
const a=await analyzeBuffer(buffer(220)),bright=await analyzeBuffer(buffer(220,{harmonics:.8}));check('harmonics increase brightness',bright.metrics.centroidHz>a.metrics.centroidHz+100,{a:a.metrics.centroidHz,b:bright.metrics.centroidHz});
const quiet=await analyzeBuffer(buffer(220,{gain:.03}));check('gain-invariant descriptors',JSON.stringify(a.profile)===JSON.stringify(quiet.profile),{a:a.profile,b:quiet.profile});
const repeat=await analyzeBuffer(buffer(220));check('deterministic same input',JSON.stringify(a)===JSON.stringify(repeat));
const stereo=await analyzeBuffer(buffer(220,{stereo:true}));check('opposite phase stereo',Math.abs(stereo.metrics.medianHz-220)<3);
const resampled=await analyzeBuffer(buffer(220,{sr:48000}));check('sample-rate consistency',Math.abs(resampled.metrics.medianHz-220)<3);
for(const [name,buf] of [['silence',buffer(0,{gain:0})],['noise',buffer(0,{gain:0,noise:.2})],['too short',buffer(220,{seconds:.2})]]){let rejected=false;try{await analyzeBuffer(buf);}catch{rejected=true;}check('reject '+name,rejected);}
let cancel=false;try{await analyzeBuffer(buffer(220),{cancelled:()=>true});}catch(e){cancel=e.message==='cancelled';}check('analysis cancellation',cancel);
for(const p of defaults){let maxR=0,minR=9,minY=9,maxY=0,seam=0;for(let l=0;l<=10;l++){const s=record(p,0,l/10),e=record(p,TAU,l/10);seam=Math.max(seam,Math.hypot(...s.map((v,i)=>v-e[i])));for(let i=0;i<720;i++){let t=TAU*i/720;const flat=record(p,t,l/10,0,0,0),up=record(p,t,l/10);assert.ok(up.every(Number.isFinite));assert.equal(flat[0],up[0]);assert.equal(flat[2],up[2]);const r=Math.hypot(up[0],up[2]);maxR=Math.max(maxR,r);minR=Math.min(minR,r);minY=Math.min(minY,up[1]);maxY=Math.max(maxY,up[1]);}}check(p.id+' closed, within record, raised',seam<1e-9&&minR>.60&&maxR<2.62&&minY>0&&maxY>.7,{seam,minR,maxR,minY,maxY});}
for(const p of defaults){
 let minR=9,maxR=0,seam=0;
 for(let l=0;l<24;l++){const lane=l/23,a=planar(p,0,lane),b=planar(p,TAU,lane);seam=Math.max(seam,Math.hypot(...a.map((v,i)=>v-b[i])));for(let i=0;i<720;i++){const v=planar(p,TAU*i/720,lane);assert.ok(v.every(Number.isFinite));const r=Math.hypot(v[0],v[2]);minR=Math.min(minR,r);maxR=Math.max(maxR,r);}}
 check(p.id+' planar closed, label-clear, within vinyl',seam<1e-9&&minR>.8&&maxR<2.62,{seam,minR,maxR});
 check(p.id+' planar deterministic and slot independent',JSON.stringify(planar(p,1.23,.37))===JSON.stringify(planar({...p,id:'other',color:'#000000'},1.23,.37)));
}
// Texture must vary by measured descriptors, never by display color or slot.
for(const p of defaults){const a=Array.from({length:100},(_,i)=>planarGrain(p,i/99,(i*37%100)/99));const b=Array.from({length:100},(_,i)=>planarGrain({...p,id:'X',color:'#000000'},i/99,(i*37%100)/99));check(p.id+' grain finite bounded and identity independent',a.every(g=>Number.isFinite(g.size)&&g.size>0&&g.size<6.3&&g.alpha>=0&&g.alpha<=1)&&JSON.stringify(a)===JSON.stringify(b));}
// Include descriptor extremes beyond the four demo profiles for particle-size safety.
let grainDomainSafe=true;
for(const brightness of [0,.5,1])for(const air of [0,.5,1])for(const u of [0,.25,.5,.75,1])for(const v of [0,.5,1]){
 const g=planarGrain({brightness,air},u,v);
 grainDomainSafe&&=Number.isFinite(g.size)&&g.size>0&&g.size<=7&&g.alpha>=0&&g.alpha<=1;
}
check('grain descriptor-domain size and opacity bounded',grainDomainSafe);
const tails=defaults.map(p=>planarGrain(p,.98,.8).size);check('coral and ivory grain tails differ from fine blue',tails[1]>tails[0]*1.3&&tails[2]>tails[0]*1.3&&Math.abs(tails[1]-tails[2])>.03,tails);
// A gathered band must converge in both radial and tangential directions.
for(const p of defaults){let min=9,max=0;for(let i=0;i<360;i++){const pts=Array.from({length:24},(_,l)=>planar(p,i/360*TAU,l/23));const x=pts.reduce((s,p)=>s+p[0],0)/24,z=pts.reduce((s,p)=>s+p[2],0)/24;const rms=Math.sqrt(pts.reduce((s,p)=>s+(p[0]-x)**2+(p[2]-z)**2,0)/24);min=Math.min(min,rms);max=Math.max(max,rms);}check(p.id+' band gathers in both planar axes',max/min>4&&min>.025,{min,max,ratio:max/min});}
// Sweep descriptor endpoints and interior values: local warping must never open a
// seam, create a cusp at the seam, or enter the label / leave the record.
let worstSeam=0,worstTangent=0,minSweepR=9,maxSweepR=0;
for(const pitch of [0,.5,1])for(const brightness of [0,.5,1])for(const air of [0,.5,1])for(const phase of [0,1.7,5.9]){
 const p={pitch,brightness,air,phase};
 for(const lane of [0,.23,.57,1]){
  const start=planar(p,0,lane),end=planar(p,TAU,lane),left=planar(p,-1e-5,lane),right=planar(p,1e-5,lane);
  worstSeam=Math.max(worstSeam,Math.hypot(...start.map((v,i)=>v-end[i])));
  worstTangent=Math.max(worstTangent,Math.hypot(...start.map((v,i)=>(right[i]-2*v+left[i])/1e-5)));
  for(let i=0;i<360;i++){const v=planar(p,i/360*TAU,lane);assert.ok(v.every(Number.isFinite));const r=Math.hypot(v[0],v[2]);minSweepR=Math.min(minSweepR,r);maxSweepR=Math.max(maxSweepR,r);}
 }
}
check('descriptor-domain planar seams and tangents continuous',worstSeam<1e-9&&worstTangent<.01,{worstSeam,worstTangent});
check('descriptor-domain planar clearance and bounds',minSweepR>.8&&maxSweepR<2.62,{minSweepR,maxSweepR});
// A density remap must remain monotone, periodic and slot independent to avoid
// particle reversal or jumps when the stored phase wraps around the closed loop.
for(const brightness of [0,.5,1])for(const air of [0,.5,1]){
 const p={brightness,air,phase:1.7};let minStep=Infinity,maxStep=0;
 for(let i=0;i<720;i++){const a=planarParticleT(p,i/720*TAU),b=planarParticleT(p,(i+1)/720*TAU);minStep=Math.min(minStep,b-a);maxStep=Math.max(maxStep,b-a);}
 const seam=planarParticleT(p,TAU)-planarParticleT(p,0)-TAU;
 check('grain flow monotone and closed '+brightness+'/'+air,minStep>0&&Math.abs(seam)<1e-12,{minStep,maxStep,seam});
}
fs.writeFileSync(new URL('./analysis-verification.json',import.meta.url),JSON.stringify(results,null,2));console.log(`${results.length} analysis/geometry checks passed`);
