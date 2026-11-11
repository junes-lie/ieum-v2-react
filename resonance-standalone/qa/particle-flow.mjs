import assert from 'node:assert/strict';
import {createFlow,stepFlow,fillFlow,sampleFlow,flowHeight} from './experiments/music-box/particle-flow.mjs';
const run=(seed,hz=60,seconds=15,bands={low:.8,mid:.7,high:.5})=>{
 const s=createFlow(seed),wave=new Float32Array(64),lo=new Float32Array(64).fill(Infinity),hi=new Float32Array(64).fill(-Infinity);
 let previous=null,maxDelta=0;
 for(let i=0;i<hz*seconds;i++){
  stepFlow(s,1/hz,true,.7,bands);fillFlow(wave,s);
  for(let j=0;j<64;j++){assert.ok(Number.isFinite(wave[j])&&Math.abs(wave[j])<=1.2);lo[j]=Math.min(lo[j],wave[j]);hi[j]=Math.max(hi[j],wave[j]);if(previous)maxDelta=Math.max(maxDelta,Math.abs(wave[j]-previous[j]));}
  previous=wave.slice();
 }
 return {s,wave,minMotion:Math.min(...hi.map((v,i)=>v-lo[i])),maxDelta};
};
const a=run(.7),b=run(.7),other=run(1.9);
assert.deepEqual(a.wave,b.wave);assert.notDeepEqual(a.wave,other.wave);
assert.ok(a.minMotion>.1);assert.ok(a.maxDelta<.12);
assert.ok(Math.abs(sampleFlow(a.wave,0)-sampleFlow(a.wave,Math.PI*2))<1e-9);
// Different original heights retain their ordering at the same spatial field.
for(let f=-1.2;f<=1.2;f+=.1){assert.ok(flowHeight(1.5,f,1)>flowHeight(.5,f,1));assert.equal(flowHeight(1.5,f,0),.018);}
for(let i=0;i<360;i++){stepFlow(a.s,1/60,false,0,{});fillFlow(a.wave,a.s);}
assert.ok(a.s.lift<1e-6&&Math.max(...a.wave.map(Math.abs))<1e-6);
const low=run(.7,60,15,{low:.1,mid:.7,high:.5});assert.ok(b.s.clock>low.s.clock);
const quiet=run(.7,60,15,{low:.8,mid:.05,high:.05});assert.ok(Math.max(...b.wave.map(Math.abs))>Math.max(...quiet.wave.map(Math.abs)));
const rates=[30,60,120].map(hz=>run(.7,hz));
const rateError=Math.max(...rates[0].wave.map((x,i)=>Math.abs(x-rates[2].wave[i])));assert.ok(rateError<.02);
const long=run(.7,30,600);assert.ok(long.minMotion>.1);
console.log(JSON.stringify({deterministic:true,distinctVoices:true,all64PositionsMove:b.minMotion,maxFrameDelta:b.maxDelta,frameRateError:rateError,restLift:a.s.lift,tenMinuteFinite:true,originalHeightOrdering:true,visualApproval:false},null,2));
