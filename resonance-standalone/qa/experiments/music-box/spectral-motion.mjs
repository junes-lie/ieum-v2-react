import {bendHeightAt,heightEnvelope,spawnSiriPartial,stepSiriPartial} from './motion.mjs';
const TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x));
// Two cascaded exponential followers preserve state across changing targets.
// Exact constant-target integration avoids frame-rate-dependent easing restarts.
export function followPair(first,second,target,dt,tau){
 const q=dt/tau,e=Math.exp(-q),a=first-target,b=second-target;
 return [target+a*e,target+(b+a*q)*e];
}
export function bendWeights(k,phase){
 const center=((k*.381966+phase*.07)%1+1)%1*2;
 const w=[0,1,2].map(i=>Math.exp(-(((i-center)/.48)**2))+.025),sum=w.reduce((a,b)=>a+b,0);
 return w.map(x=>x/sum);
}
export function updateWaveform(wave,data,referenceRms,dt,age,playing,energy=0,bands={},phase=0){
 const centers=wave.centers||[0,TAU/3,TAU*2/3];
 if(!playing||age<=.18){wave.spectral=null;wave.fill(heightEnvelope(0,age,playing));return wave;}
 if(!(dt>0))return wave;
 if(!wave.spectral||wave.spectral.lastAge>age){wave.spectral={lastAge:age,first:new Float64Array(centers.length),levels:new Float64Array(centers.length),parts:centers.map((_,k)=>spawnSiriPartial(k,0,0,phase))};}
 const state=wave.spectral;state.lastAge=age;
 const input=[bands.low,bands.mid,bands.high].map(x=>clamp(Number.isFinite(x)?x:0));
 const activity=clamp((energy-.008)/.16),u=clamp((age-.18)/.35),gate=u*u*(3-2*u);
 for(let k=0;k<centers.length;k++){
  let part=state.parts[k];const siri=stepSiriPartial(part,dt);
  if(part.age>part.lifetime&&part.amplitude===0)state.parts[k]=spawnSiriPartial(k,0,part.generation+1,phase);
  const weights=bendWeights(k,phase),band=input.reduce((sum,v,i)=>sum+v*weights[i],0);
  // Fixed bands, no moving spatial phase. Strong bands can reach the original ceiling.
  // Siri is at most a 4% accent; its lifecycle cannot collapse sustained sound.
  const target=clamp(activity*Math.pow(clamp(band*2.4),.65)*(1+.04*siri))*gate;
  const tau=target>state.first[k]?.10:.23;
  [state.first[k],state.levels[k]]=followPair(state.first[k],state.levels[k],target,dt,tau);
 }
 wave.levels=state.levels;
 for(let i=0;i<64;i++)wave[i]=clamp(bendHeightAt(centers,state.levels,i/64*TAU));
 return wave;
}
