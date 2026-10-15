import {PitchDetector} from 'pitchy';
import FFT from 'fft.js';
import {clamp,TAU} from './profiles.js';
const percentile=(a,q)=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor((b.length-1)*q)]??0;};
// Analyze distributed windows rather than reading the entire file into a second copy.
// FFT centroid is a brightness descriptor; aperiodicity/flatness is a texture proxy, NOT breathiness diagnosis.
export async function analyzeBuffer(buffer,{progress=()=>{},cancelled=()=>false}={}){
 const sr=buffer.sampleRate,N=4096,detector=PitchDetector.forFloat32Array(N),fft=new FFT(N),spectrum=fft.createComplexArray(),raw=new Float32Array(N),windowed=new Float32Array(N);
 if(buffer.duration<.5)throw Error('0.5초 이상의 보컬 녹음을 선택해 주세요.');
 const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
 // Use the strongest channel to avoid cancellation in opposite-phase stereo recordings.
 const channel=channels.map(ch=>{let energy=0;for(let i=0;i<ch.length;i+=31)energy+=ch[i]*ch[i];return{ch,energy};}).sort((a,b)=>b.energy-a.energy)[0].ch;
 const count=Math.min(150,Math.max(12,Math.floor(buffer.duration*12))),frames=[];
 for(let f=0;f<count;f++){
  if(cancelled())throw Error('cancelled');
  const start=Math.floor((buffer.length-N)*f/Math.max(1,count-1));let mean=0,power=0,peak=0;
  for(let i=0;i<N;i++){raw[i]=channel[Math.max(0,start+i)]||0;mean+=raw[i];}mean/=N;
  for(let i=0;i<N;i++){raw[i]-=mean;power+=raw[i]**2;peak=Math.max(peak,Math.abs(raw[i]));windowed[i]=raw[i]*(.5-.5*Math.cos(TAU*i/(N-1)));}
  const rms=Math.sqrt(power/N);if(rms>.0005){const [pitch,clarity]=detector.findPitch(raw,sr);fft.realTransform(spectrum,windowed);let sum=0,weighted=0,log=0,bins=0;
   for(let k=Math.ceil(70*N/sr);k<Math.min(N/2,Math.floor(8000*N/sr));k++){const mag=Math.hypot(spectrum[2*k],spectrum[2*k+1]);sum+=mag;weighted+=mag*k*sr/N;log+=Math.log(Math.max(mag,1e-12));bins++;}
   frames.push({rms,pitch,clarity,centroid:weighted/(sum||1),flat:Math.exp(log/bins)/(sum/bins||1),peak});}
  if(f%8===0){progress(f/count);await new Promise(r=>setTimeout(r,0));}
 }
 const loud=percentile(frames.map(f=>f.rms),.9),active=frames.filter(f=>f.rms>Math.max(.001,loud*.13)),voiced=active.filter(f=>f.clarity>.82&&f.pitch>=65&&f.pitch<=1100);
 if(active.length<5||loud<.0015)throw Error('분석할 소리가 너무 작습니다. 보컬이 들리는 녹음을 선택해 주세요.');
 if(voiced.length<Math.max(5,active.length*.2))throw Error('안정적인 음높이를 찾지 못했습니다. 반주 없는 보컬 녹음으로 다시 시도해 주세요.');
 const hz=percentile(voiced.map(f=>f.pitch),.5),centroid=percentile(voiced.map(f=>f.centroid),.5),flat=percentile(voiced.map(f=>f.flat),.5),clarity=percentile(voiced.map(f=>f.clarity),.5);
 const pitch=clamp(Math.log2(hz/85)/Math.log2(650/85)),brightness=clamp(Math.log2(Math.max(180,centroid)/250)/Math.log2(4200/250)),air=clamp((1-clarity)*2.2+Math.sqrt(flat)*.85);
 // Quantized descriptors suppress accidental last-digit variation; slot/color is not used in geometry.
 const q=x=>Math.round(x*100)/100;
 progress(1);return {profile:{pitch:q(pitch),brightness:q(brightness),air:q(air),phase:q((pitch*2.1+brightness*2.7+air*1.5)%TAU)},metrics:{medianHz:Math.round(hz),lowHz:Math.round(percentile(voiced.map(f=>f.pitch),.1)),highHz:Math.round(percentile(voiced.map(f=>f.pitch),.9)),centroidHz:Math.round(centroid),clarity:+clarity.toFixed(3),flatness:+flat.toFixed(4),voicedFrames:voiced.length,activeFrames:active.length,sampledFrames:count,peakRms:loud,clipping:active.filter(f=>f.peak>.995).length/active.length},version:1};
}
