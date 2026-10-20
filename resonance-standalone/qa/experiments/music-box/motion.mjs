const TAU=Math.PI*2;
export function motionParams(p){return [1.25+(1-p.air)*.7+p.brightness*.3,.09+p.brightness*.16+p.pitch*.03,p.phase,.18*(1-p.air)];}
export function motionPulse(t,lane,time,p){const z=t*2/TAU-time*p[0]/TAU+p[2]/TAU+lane*.07,q=z-Math.floor(z),x=Math.pow(Math.min(1,Math.max(0,q/.34)),.72);return Math.sin(Math.PI*x)**2*(1+p[3]*Math.sin(4*Math.PI*x)*Math.exp(-3*x));}
export function motionLift(t,lane,time,p,play,energy,onset){return p[1]*(.16+play*(.65+energy*1.2+onset*.5))*motionPulse(t,lane,time,p);}
// Height follows the per-voice measured RMS envelope, with no traveling phase.
export function motionGain(t,lane,time,p,play,energy,onset){return Math.max(0,Math.min(1,energy));}
export function heightEnvelope(energy,age,playing){if(!playing)return 1;if(age<=.18)return Math.max(0,1-age/.18);return Math.max(0,Math.min(1,energy))*Math.min(1,(age-.18)/.16);}
export function audioHeightAt(wave,t){const x=((t/TAU)%1+1)%1*64,i=Math.floor(x);return wave[i]*(1-x+i)+wave[(i+1)%64]*(x-i);}
export function updateWaveform(wave,data,referenceRms,dt,age,playing){for(let i=0;i<64;i++){let sum=0;const n=data?.length||0,a=Math.floor(i*n/64),b=Math.floor((i+1)*n/64);for(let k=a;k<b;k++)sum+=data[k]*data[k];const raw=n?Math.min(1,Math.sqrt(sum/Math.max(1,b-a))/Math.max(.08,referenceRms||.2)):0;const target=heightEnvelope(raw,age,playing);wave[i]+=(target-wave[i])*(1-Math.exp(-dt*(target>wave[i]?24:18)));}return wave;}
export const motionGLSL=`
uniform vec4 uDance;
uniform float uDanceOn,uPlay,uHeightGain;uniform float uWave[64];
float motionPulse(float t,float lane,float time){float q=fract(t*2./6.28318530718-time*uDance.x/6.28318530718+uDance.z/6.28318530718+lane*.07);float x=pow(clamp(q/.34,0.,1.),.72);return pow(sin(3.14159265359*x),2.)*(1.+uDance.w*sin(12.56637061436*x)*exp(-3.*x));}
float motionLift(float t,float lane,float time){return uDance.y*(.16+uPlay*(.65+uEnergy*1.2+uBands.w*.5))*motionPulse(t,lane,time);}
float motionGain(float t,float lane,float time){float x=fract(t/6.28318530718)*64.;int i=int(floor(x));return mix(uWave[i],uWave[(i+1)%64],fract(x));}
`;
