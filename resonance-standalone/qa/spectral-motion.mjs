import assert from 'node:assert/strict';
import {updateWaveform,followPair} from './experiments/music-box/spectral-motion.mjs';
const make=()=>Object.assign(new Float32Array(64),{centers:[0,1,2,3,4,5]});
function run(bands,seconds=4,energy=.3,hz=60){const w=make();for(let i=0;i<seconds*hz;i++)updateWaveform(w,null,.12,1/hz,i/hz,true,energy,bands,.35);return w;}
const low=run({low:.7,mid:0,high:0}),high=run({low:0,mid:0,high:.7});
assert.ok(Math.max(...low)>.65&&Math.max(...high)>.65);
assert.ok(low.some((v,i)=>Math.abs(v-high[i])>.35),'same RMS with different spectrum must move different bends');
assert.deepEqual(low,run({low:.7,mid:0,high:0}));
let w=make(),minSustain=1,maxDelta=0,previous=0;
for(let i=0;i<1800;i++){
 updateWaveform(w,null,.12,1/60,i/60,true,.3,{low:.7,mid:.7,high:.7},.35);
 assert.ok(w.every(x=>Number.isFinite(x)&&x>=0&&x<=1));
 if(i>180)minSustain=Math.min(minSustain,...w);
 if(i>12)maxDelta=Math.max(maxDelta,Math.abs(w[0]-previous));previous=w[0];
}
assert.ok(minSustain>.99,'sustained sound must not collapse on Siri lifecycle');
assert.ok(maxDelta<.07);
for(let i=0;i<180;i++)updateWaveform(w,null,.12,1/60,30+i/60,true,0,{low:0,mid:0,high:0},.35);
assert.ok(Math.max(...w)<.001,'silence decays to floor');
updateWaveform(w,null,.12,1/60,0,false);assert.ok(w.every(x=>x===1));
updateWaveform(w,null,.12,1/60,.18,true);assert.ok(w.every(x=>x===0));
const frameRates=[30,60,120].map(hz=>{let a=0,b=0;for(let i=0;i<hz;i++)[a,b]=followPair(a,b,.8,1/hz,.1);return b;});
assert.ok(Math.max(...frameRates)-Math.min(...frameRates)<1e-12);
console.log(JSON.stringify({passed:true,sameEnergyDifferentBands:true,deterministic:true,minSustain,maxDelta,silenceAndRestart:true,frameRates},null,2));
