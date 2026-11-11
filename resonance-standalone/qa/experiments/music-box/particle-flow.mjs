// Audio mapping studied from Tiago Canzian / ARKx's Codrops visualizer:
// tgcnzn/Interactive-Particles-Music-Visualizer @ afe366de.
// Original IEUM implementation: a seeded curl field sampled on a closed path.
// Preserve each strand's original height; never replace it with a shared surface.
import {SimplexNoise} from 'three/addons/math/SimplexNoise.js';
const TAU=Math.PI*2, clamp=x=>Math.max(0,Math.min(1,x));
function noiseFor(seed){let n=(Math.floor(seed*100003)^0x12345678)>>>0;return new SimplexNoise({random(){n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;}});}
function potential(n,x,y,z,k){return n.noise3d(x+k*17.1,y+k*31.7,z-k*11.3);}
export function curlY(n,x,y,z){const e=.025;return ((potential(n,x,y,z+e,0)-potential(n,x,y,z-e,0))-(potential(n,x+e,y,z,2)-potential(n,x-e,y,z,2)))/(2*e);}
export function createFlow(seed=0){return {noise:noiseFor(seed),seed,clock:0,lift:0,activity:0,low:0,mid:0,high:0};}
function integrate(state,dt,playing,energy,bands={},freeze=false){
 dt=Math.max(0,Math.min(dt,.1));state.dt=dt;
 const follow=(a,b,rate)=>b+(a-b)*Math.exp(-dt*rate);
 state.lift=follow(state.lift,playing?1:0,playing?2.8:3.5);
 const active=playing?clamp(energy/.18):0;
 state.activity=follow(state.activity,freeze?0:active,active>state.activity?6:3);
 for(const key of ['low','mid','high'])state[key]=follow(state[key],playing?clamp(bands[key]||0):0,5);
 // Original .2–.5/frame clock, followed by *.05 in curl coordinates.
 // Convert the spatial clock to seconds (60 Hz), keeping speed continuous.
 const speed=.6+.9*clamp((state.low-.6)/.4);
 if(!freeze)state.clock+=dt*(playing?speed:.09);
 return state;
}
function fillStep(wave,state){
 const amplitude=(.7+.5*state.high)*state.activity;
 const spread=.25+.75*state.mid;
 for(let j=0;j<wave.length;j++){
  const t=j/wave.length*TAU,x=1.15*Math.cos(t),z=1.15*Math.sin(t);
  const a=curlY(state.noise,x+state.clock*.31,state.seed*.17+state.clock*.19,z+state.clock*.23);
  const target=Math.tanh(a*.55)*amplitude*spread;
  wave[j]+=(target-wave[j])*(1-Math.exp(-(state.dt||0)/.14));
 }
 return wave;
}
export function sampleFlow(wave,t){const x=((t/TAU)%1+1)%1*wave.length,i=Math.floor(x);return wave[i]*(1-x+i)+wave[(i+1)%wave.length]*(x-i);}
export function flowHeight(originalHeight,field,lift){return .018+lift*((originalHeight-.018)*(1+.42*field)+.10);}
export const flowGLSL=`
uniform float uFlowOn,uFlowLift;
vec3 flowDeform(vec3 original,vec3 flat,float t){
 float f=motionGain(t,0.,0.);
 vec3 p=mix(flat,original,uMorph);
 p.xz*=1.+uMorph*uFlowLift*.025*f;
 p.y=.018+(1.-uMorph)*flat.y+uLift*uFlowLift*((original.y-.018)*(1.+.42*f)+.10);
 return p;
}`;

// Fixed steps make transport input deterministic across render frame rates.
export function stepFlow(state,dt,playing,energy,bands={},freeze=false){
 state.pending=(state.pending||0)+Math.max(0,Math.min(dt,.1));
 state.input=[playing,energy,bands,freeze];return state;
}
export function fillFlow(wave,state){
 const step=1/120;
 while(state.pending>=step-1e-10){integrate(state,step,...state.input);fillStep(wave,state);state.pending-=step;}
 state.pending=Math.max(0,state.pending||0);return wave;
}
