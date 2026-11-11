// SiriWave iOS9 upper half, adapted from kopiro/siriwave (MIT).
// Baseline = record surface. Evaluate the spatial waveform, not fixed crest gains.
export const TAU=Math.PI*2,SAMPLES=256,SPEED=.05;
const clamp=x=>Math.max(0,Math.min(1,x));
const rand=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export const attenuation=x=>(4/(4+x*x))**4;
export function spawnGroup(seed,generation=0){
 const key=seed*11+generation*997,count=2+Math.floor(rand(key+1)*3);
 return {generation,age:0,accumulator:0,previousMax:0,reset:false,normalizer:1,parts:Array.from({length:count},(_,j)=>{
  const n=key+j*29;return {phase:0,amplitude:0,lifetime:.5+1.5*rand(n+2),offset:-3+6*rand(n+3),speed:.5+.5*rand(n+4),finalAmplitude:.3+.7*rand(n+5),width:1+2*rand(n+6),verse:-1+2*rand(n+7)};
 })};
}
export function upperAt(group,i,envelope=false){
 let y=0;const n=group.parts.length;
 group.parts.forEach((p,j)=>{const t=4*(-1+j/(n-1)*2)+p.offset,x=i/p.width-t;y+=(envelope?p.finalAmplitude:Math.abs(p.amplitude*Math.sin(p.verse*x-p.phase)))*attenuation(x);});
 return .8*y/n*attenuation(i/25*2);
}
// Only the closed-loop seam differs from the straight reference domain.
// Last 5% on both ends returns smoothly to the common record baseline.
export function seam(i){const u=clamp((25-Math.abs(i))/2.5);return u*u*(3-2*u);}
function prepare(seed,generation){const g=spawnGroup(seed,generation);let max=0;for(let j=0;j<=1000;j++){const i=-25+j/20;max=Math.max(max,upperAt(g,i,true)*seam(i));}g.normalizer=Math.max(1e-6,max);return g;}
export function stepGroup(group){
 group.age+=1/60;
 for(const p of group.parts){p.amplitude=Math.max(0,Math.min(p.finalAmplitude,p.amplitude+(group.age>=p.lifetime?-.02:.02)));p.phase=(p.phase+SPEED*p.speed)%TAU;}
 let max=0;for(let j=0;j<=250;j++)max=Math.max(max,upperAt(group,-25+j/5));
 // Original demo's 2 canvas pixels, using its 300px height / 144px half-height.
 group.reset=max<2/144&&group.previousMax>max;group.previousMax=max;
}
export function sampleUpper(wave,t){const x=((t/TAU)%1+1)%1*wave.length,i=Math.floor(x);return wave[i]*(1-x+i)+wave[(i+1)%wave.length]*(x-i);}
export function updateWaveform(wave,data,referenceRms,dt,age,playing,energy=0,bands={},seed=0){
 if(!playing||age<=.18){wave.upper=null;wave.fill(playing?Math.max(0,1-age/.18):1);return wave;}
 if(!(dt>0))return wave;
 let g=wave.upper;if(!g||g.transportAge>age)g=wave.upper=prepare(seed,0);
 let remaining=g.accumulator+dt;
 while(remaining>=1/60-1e-10){if(g.reset)g=wave.upper=prepare(seed,g.generation+1);stepGroup(g);remaining-=1/60;}
 g.accumulator=Math.max(0,remaining);g.transportAge=age;
 const u=clamp((age-.18)/.35),gate=u*u*(3-2*u),activity=clamp((energy-.008)/.16);
 // A fixed per-generation vertical scale preserves the complete upper contour.
 // No per-frame peak normalization, FFT-to-crest mapping or original height mask.
 for(let j=0;j<wave.length;j++){const i=-25+j/wave.length*50;wave[j]=clamp(upperAt(g,i)*seam(i)/g.normalizer)*gate*activity;}
 return wave;
}
