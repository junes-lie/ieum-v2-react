// Keep the accepted Siri temporal motion; distribute its support around a closed loop.
import {TAU,spawnGroup,stepGroup,attenuation,sampleUpper} from './siri-upper.mjs';
export {sampleUpper};
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function orbitAt(group,t,envelope=false){
 const n=group.parts.length,sector=TAU/n;let sum=0;
 group.parts.forEach((p,j)=>{
  const center=j*sector+p.offset/3*sector*.15,width=sector*(.45+.15*(p.width-1));
  const delta=((t-center+Math.PI)%TAU+TAU)%TAU-Math.PI;
  for(const shift of [-TAU,0,TAU]){
   const distance=delta+shift,edge=smooth((TAU-Math.abs(distance))/(TAU*.25));
   if(!edge)continue;
   const x=distance/width;
   sum+=(envelope?p.finalAmplitude:Math.abs(p.amplitude*Math.sin(p.verse*x-p.phase)))*attenuation(x)*edge;
  }
 });
 return .8*sum/n;
}
function prepare(seed,generation){const g=spawnGroup(seed,generation);let max=0;for(let j=0;j<512;j++)max=Math.max(max,orbitAt(g,j/512*TAU,true));g.normalizer=Math.max(1e-6,max);return g;}
export function updateWaveform(wave,data,referenceRms,dt,age,playing,energy=0,bands={},seed=0){
 wave.lift??=0;
 if(!playing){
  wave.lift*=Math.exp(-Math.max(0,dt)*7);
  if(wave.lift<.0001)wave.lift=0;
  const previous=wave.lastLift||0,scale=smooth(wave.lift);
  if(previous>0)for(let j=0;j<wave.length;j++)wave[j]*=scale/previous;else wave.fill(0);
  wave.lastLift=scale;if(wave.lift===0)wave.orbit=null;return wave;
 }
 if(!(dt>0))return wave;
 let g=wave.orbit;if(!g)g=wave.orbit=prepare(seed,0);
 let remaining=g.accumulator+dt;
 while(remaining>=1/60-1e-10){
  if(g.reset)g=wave.orbit=prepare(seed,g.generation+1);
  stepGroup(g);
  // Regenerate only after all parts have faded; no discontinuous spatial reset.
  g.reset=g.parts.every(p=>p.amplitude===0);
  remaining-=1/60;
 }
 g.accumulator=Math.max(0,remaining);g.transportAge=age;
 wave.lift+=(1-wave.lift)*(1-Math.exp(-dt*5));
 const gate=smooth(wave.lift),activity=clamp((energy-.008)/.16);
 for(let j=0;j<wave.length;j++){
  const height=clamp(orbitAt(g,j/wave.length*TAU)/g.normalizer);
  wave[j]=gate*(.14+.86*height*activity);
 }
 // Store the scale actually applied for a continuous pause/stop descent.
 wave.lastLift=gate;
 return wave;
}
