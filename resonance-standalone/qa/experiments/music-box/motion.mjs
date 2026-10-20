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
export function updateWaveform(wave,data,referenceRms,dt,age,playing,energy=0,bands={},phase=0){
 const centers=wave.centers||[0,TAU/3,TAU*2/3];
 if(!playing||age<=.18){wave.drives=new Float64Array(centers.length);wave.levels=new Float64Array(centers.length);wave.fill(heightEnvelope(0,age,playing));return wave;}
 wave.drives??=new Float64Array(centers.length);wave.levels??=new Float64Array(centers.length);
 const u=Math.max(0,Math.min(1,(age-.18)/.45)),gate=u*u*(3-2*u);
 for(let k=0;k<centers.length;k++){
  const period=1.25+.19*((k*3)%5),pulse=.5-.5*Math.cos((age-.18)*TAU/period+k*2.399963+phase);
  const band=[bands.low||0,bands.mid||0,bands.high||0][k%3];
  const target=Math.pow(Math.max(0,Math.min(1,energy)),.72)*gate*(.10+.90*pulse)*(.72+.28*band);
  wave.drives[k]+=(target-wave.drives[k])*(1-Math.exp(-dt*(target>wave.drives[k]?7:4)));
  wave.levels[k]+=(wave.drives[k]-wave.levels[k])*(1-Math.exp(-dt*9));
 }
 for(let i=0;i<64;i++){let total=0,weight=0;for(let k=0;k<centers.length;k++){const w=Math.exp(5*(Math.cos(i/64*TAU-centers[k])-1));total+=w*wave.levels[k];weight+=w;}wave[i]=Math.max(0,Math.min(1,total/weight));}return wave;
}

export const motionGLSL=`
uniform vec4 uDance;
uniform float uDanceOn,uPlay,uHeightGain;uniform float uWave[64];
float motionPulse(float t,float lane,float time){float q=fract(t*2./6.28318530718-time*uDance.x/6.28318530718+uDance.z/6.28318530718+lane*.07);float x=pow(clamp(q/.34,0.,1.),.72);return pow(sin(3.14159265359*x),2.)*(1.+uDance.w*sin(12.56637061436*x)*exp(-3.*x));}
float motionLift(float t,float lane,float time){return uDance.y*(.16+uPlay*(.65+uEnergy*1.2+uBands.w*.5))*motionPulse(t,lane,time);}
float motionGain(float t,float lane,float time){float x=fract(t/6.28318530718)*64.;int i=int(floor(x));return mix(uWave[i],uWave[(i+1)%64],fract(x));}
`;
