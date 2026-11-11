import assert from 'node:assert/strict';
import {defaults} from '../src/profiles.js';
import {updateWaveform,orbitAt} from './experiments/music-box/siri-orbit.mjs';
import {spawnGroup,stepGroup,TAU} from './experiments/music-box/siri-upper.mjs';
const report=[];
for(const seed of defaults.map(p=>p.phase)){
 const a=new Float32Array(256),b=new Float32Array(256),lo=new Float64Array(256).fill(1),hi=new Float64Array(256),sectors=Array(12).fill(0);let maxStep=0,previous=Array(256).fill(0);
 updateWaveform(a,null,.1,1/60,0,false);assert.ok(a.every(v=>v===0));
 for(let f=0;f<900;f++){
  updateWaveform(a,null,.1,1/60,f/60,true,.3,{},seed);updateWaveform(b,null,.1,1/60,f/60,true,.3,{},seed);assert.deepEqual(a,b);
  assert.ok(a.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
  for(let j=0;j<256;j++){maxStep=Math.max(maxStep,Math.abs(a[j]-previous[j]));if(f>120){lo[j]=Math.min(lo[j],a[j]);hi[j]=Math.max(hi[j],a[j]);}}
  previous=Array.from(a);
 }
 for(let j=0;j<256;j++)sectors[Math.min(11,Math.floor(j/256*12))]=Math.max(sectors[Math.min(11,Math.floor(j/256*12))],hi[j]-lo[j]);
 const minTravel=Math.min(...hi.map((v,i)=>v-lo[i]));assert.ok(minTravel>.15,'every sample must move over time');assert.ok(sectors.every(x=>x>.25));assert.ok(Math.min(...a)>=.139,'playing floats above record');
 for(let f=0;f<120;f++)updateWaveform(a,null,.1,1/60,0,false);assert.ok(a.every(v=>v===0));
 const g=spawnGroup(seed);for(let f=0;f<30;f++)stepGroup(g);
 assert.ok(Math.abs(orbitAt(g,0)-orbitAt(g,TAU))<1e-12);
 assert.ok(Math.abs(orbitAt(g,1e-6)-orbitAt(g,TAU-1e-6))<1e-5);
 report.push({seed,minTravel,sectors,maxStep,landed:true,seamClosed:true});
}
console.log(JSON.stringify({passed:true,coverage:report},null,2));
