const TAU=Math.PI*2;
export function motionParams(p){return [1.25+(1-p.air)*.7+p.brightness*.3,.09+p.brightness*.16+p.pitch*.03,p.phase,.18*(1-p.air)];}
export function motionPulse(t,lane,time,p){const z=t*2/TAU-time*p[0]/TAU+p[2]/TAU+lane*.07,q=z-Math.floor(z),x=Math.pow(Math.min(1,Math.max(0,q/.34)),.72);return Math.sin(Math.PI*x)**2*(1+p[3]*Math.sin(4*Math.PI*x)*Math.exp(-3*x));}
export function motionLift(t,lane,time,p,play,energy,onset){return p[1]*(.16+play*(.65+energy*1.2+onset*.5))*motionPulse(t,lane,time,p);}
// Height follows the per-voice measured RMS envelope, with no traveling phase.
export function motionGain(t,lane,time,p,play,energy,onset){return Math.max(0,Math.min(1,energy));}
export function heightEnvelope(energy,age,playing){if(!playing)return 1;if(age<=.18)return Math.max(0,1-age/.18);return Math.max(0,Math.min(1,energy))*Math.min(1,(age-.18)/.16);}
export function audioHeightAt(wave,t){const x=((t/TAU)%1+1)%1*64,i=Math.floor(x);return wave[i]*(1-x+i)+wave[(i+1)%64]*(x-i);}
// Find broad existing height crests; pulse centers never travel around the curve.
export function findPulseCenters(heightAt){const n=360,h=Array.from({length:n},(_,i)=>heightAt(i/n*TAU));const sm=h.map((_,i)=>{let v=0;for(let j=-8;j<=8;j++)v+=h[(i+j+n)%n];return v/17;});const peaks=sm.map((v,i)=>({v,i})).filter(({v,i})=>v>=sm[(i+n-1)%n]&&v>sm[(i+1)%n]).sort((a,b)=>b.v-a.v);const chosen=[];for(const peak of peaks){if(chosen.every(k=>Math.min(Math.abs(k-peak.i),n-Math.abs(k-peak.i))>32))chosen.push(peak.i);if(chosen.length===6)break;}return (chosen.length?chosen:[sm.indexOf(Math.max(...sm))]).sort((a,b)=>a-b).map(i=>i/n*TAU);}
export function hopPulse(q){q=((q%1)+1)%1;const ease=x=>x*x*x*(x*(x*6-15)+10);if(q<.42)return ease(q/.42);if(q<.50)return 1;if(q<.98)return 1-ease((q-.50)/.48);return 0;}
export function bendHeightAt(centers,levels,t){t=((t%TAU)+TAU)%TAU;let i=centers.length-1;for(let k=0;k<centers.length;k++)if(t>=centers[k])i=k;const j=(i+1)%centers.length,a=centers[i],b=centers[j]+(j===0?TAU:0),x=(t+(t<a?TAU:0)-a)/(b-a),u=x*x*(3-2*x);return levels[i]+(levels[j]-levels[i])*u;}
// iOS9+ lifecycle/phase adapted from kopiro/siriwave (MIT); see siriwave-LICENSE.txt.
export const SIRI_SPEED=.05;
const siriRand=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function spawnSiriPartial(bend,part,generation,voicePhase){const key=bend*103+part*29+generation*997+voicePhase*11;return {phase:0,amplitude:0,age:0,lifetime:.5+1.5*siriRand(key+1),speed:.5+.5*siriRand(key+2),finalAmplitude:.3+.7*siriRand(key+3),offset:-3+6*siriRand(key+4),width:1+2*siriRand(key+5),verse:-1+2*siriRand(key+6),generation};}
const smoother=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
export function softSiriAbs(x){const e=.06;return (Math.sqrt(x*x+e*e)-e)/(Math.sqrt(1+e*e)-e);}
export function stepSiriPartial(p,dt){p.age+=dt;const ramp=p.finalAmplitude/(.02*60);p.amplitude=p.finalAmplitude*smoother(p.age/ramp)*(1-smoother((p.age-p.lifetime)/ramp));p.phase=(p.phase+SIRI_SPEED*p.speed*60*dt)%TAU;const x=p.offset*.25/p.width,att=(4/(4+x*x))**4;return p.amplitude*softSiriAbs(Math.sin(p.verse*x-p.phase))*att;}
export function updateWaveform(wave,data,referenceRms,dt,age,playing,energy=0,bands={},phase=0){
 const centers=wave.centers||[0,TAU/3,TAU*2/3];
 if(!playing||age<=.18){wave.drives=new Float64Array(centers.length);wave.levels=new Float64Array(centers.length);wave.siri=null;wave.fill(heightEnvelope(0,age,playing));return wave;}
 if(!dt)return wave;
 wave.drives??=new Float64Array(centers.length);wave.levels??=new Float64Array(centers.length);
 wave.siri??=centers.map((_,k)=>Array.from({length:2+Math.floor(siriRand(k+phase)*3)},(_,j)=>spawnSiriPartial(k,j,0,phase)));
 const u=Math.max(0,Math.min(1,(age-.18)/.35)),gate=u*u*(3-2*u);
 for(let k=0;k<centers.length;k++){
  const parts=wave.siri[k];let sum=0;
  for(let j=0;j<parts.length;j++){let p=parts[j];sum+=stepSiriPartial(p,dt);if(p.age>p.lifetime&&p.amplitude===0)parts[j]=spawnSiriPartial(k,j,p.generation+1,phase);}
  const activity=Math.max(0,Math.min(1,(energy-.008)/.16));
  wave.drives[k]+=(activity-wave.drives[k])*(1-Math.exp(-dt*(activity>wave.drives[k]?10:5)));
  // Normalize the reference's low canvas amplitude to the existing high crest ceiling.
  wave.levels[k]=wave.drives[k]*gate*Math.sin(Math.min(1,2*sum/parts.length)*Math.PI/2);
 }
 for(let i=0;i<64;i++)wave[i]=Math.max(0,Math.min(1,bendHeightAt(centers,wave.levels,i/64*TAU)));return wave;
}

export const motionGLSL=`
uniform vec4 uDance;
uniform float uDanceOn,uPlay,uHeightGain;uniform float uWave[64];
float motionPulse(float t,float lane,float time){float q=fract(t*2./6.28318530718-time*uDance.x/6.28318530718+uDance.z/6.28318530718+lane*.07);float x=pow(clamp(q/.34,0.,1.),.72);return pow(sin(3.14159265359*x),2.)*(1.+uDance.w*sin(12.56637061436*x)*exp(-3.*x));}
float motionLift(float t,float lane,float time){return uDance.y*(.16+uPlay*(.65+uEnergy*1.2+uBands.w*.5))*motionPulse(t,lane,time);}
float motionGain(float t,float lane,float time){float x=fract(t/6.28318530718)*64.;int i=int(floor(x));return mix(uWave[i],uWave[(i+1)%64],fract(x));}
`;
