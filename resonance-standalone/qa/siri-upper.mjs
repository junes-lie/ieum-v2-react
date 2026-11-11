import assert from 'node:assert/strict';
import {spawnGroup,upperAt,stepGroup,updateWaveform,sampleUpper,TAU} from './experiments/music-box/siri-upper.mjs';
const make=()=>new Float32Array(256);
const wave=make(),again=make();let peak=0,previousPeak=-1,peakMoved=false,generations=new Set();
for(let frame=0;frame<900;frame++){
 const age=frame/60;
 updateWaveform(wave,null,.1,1/60,age,true,.3,{},.35);
 updateWaveform(again,null,.1,1/60,age,true,.3,{},.35);
 assert.deepEqual(wave,again);assert.ok(wave.every(x=>Number.isFinite(x)&&x>=0&&x<=1));
 if(age>.6){const max=Math.max(...wave),where=wave.indexOf(max);peak=Math.max(peak,max);if(previousPeak>=0&&where!==previousPeak)peakMoved=true;previousPeak=where;generations.add(wave.upper.generation);assert.equal(wave[0],0);}
}
assert.ok(peak>.8&&peakMoved&&generations.size>2);
assert.equal(sampleUpper(wave,0),sampleUpper(wave,TAU));
updateWaveform(wave,null,.1,1/60,16,true,0,{},.35);assert.ok(wave.every(x=>x===0));
updateWaveform(wave,null,.1,1/60,0,false);assert.ok(wave.every(x=>x===1));
updateWaveform(wave,null,.1,1/60,.18,true);assert.ok(wave.every(x=>x===0));
// Absolute height varies spatially even when no fixed crest centers exist.
const group=spawnGroup(.35);for(let i=0;i<30;i++)stepGroup(group);
assert.ok(upperAt(group,-10)!==upperAt(group,0));
const runs=[30,60,120].map(hz=>{const w=make();for(let i=0;i<hz*2;i++)updateWaveform(w,null,.1,1/hz,1+(i+1)/hz,true,.3,{},.35);return w;});
for(let i=0;i<256;i++)assert.ok(Math.abs(runs[0][i]-runs[1][i])<1e-6&&Math.abs(runs[1][i]-runs[2][i])<1e-6);
console.log(JSON.stringify({passed:true,peak,peakMoved,generations:generations.size,nonnegative:true,seamClosed:true,deterministic:true,fixed60HzEquivalent:true,silenceRestDrop:true},null,2));
