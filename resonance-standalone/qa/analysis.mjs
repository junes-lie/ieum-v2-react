import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeBuffer} from '../src/analyze.js';
import {record,flower,defaults,TAU} from '../src/profiles.js';
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
fs.writeFileSync(new URL('./analysis-verification.json',import.meta.url),JSON.stringify(results,null,2));console.log(`${results.length} analysis/geometry checks passed`);
