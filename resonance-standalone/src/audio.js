import {clamp,TAU} from './profiles.js';
export class Transport{
 constructor(onEnd=()=>{}){this.ctx=null;this.playing=false;this.offset=0;this.startAt=0;this.items=[];this.sources=[];this.onEnd=onEnd;this.volume=.45;this.loop=false;this.demo=true;this.demoBuffers=[];}
 async ready(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=this.volume;const compressor=this.ctx.createDynamicsCompressor();this.master.connect(compressor);compressor.connect(this.ctx.destination);}await this.ctx.resume();}
 get duration(){return Math.max(0,...this.items.map(v=>v.buffer?.duration||0));}
 get time(){return Math.min(this.duration,this.offset+(this.playing?Math.max(0,this.ctx.currentTime-this.startAt):0));}
 setVolume(v){this.volume=v;if(this.master)this.master.gain.setTargetAtTime(v,this.ctx.currentTime,.025);}
 setItems(items,demo=false){this.pause();this.offset=0;this.items=items;this.demo=demo;}
 async play(){await this.ready();if(this.playing)return;if(!this.duration)return;if(this.offset>=this.duration-.01)this.offset=0;this.startAt=this.ctx.currentTime+.04;this.playing=true;
  for(const v of this.items){if(!v.buffer||this.offset>=v.buffer.duration)continue;const source=this.ctx.createBufferSource(),analyser=this.ctx.createAnalyser(),gain=this.ctx.createGain();source.buffer=v.buffer;analyser.fftSize=1024;analyser.smoothingTimeConstant=.65;gain.gain.value=v.muted?0:1;source.connect(analyser);analyser.connect(gain);gain.connect(this.master);source.start(this.startAt,this.offset);v.analyser=analyser;v.data=new Float32Array(1024);v.gain=gain;this.sources.push({source,analyser,gain,voice:v});}
 }
 pause(){if(this.playing)this.offset=this.time;this.playing=false;for(const s of this.sources){try{s.source.stop();}catch{}s.source.disconnect();s.analyser.disconnect();s.gain.disconnect();s.voice.analyser=null;}this.sources=[];}
 async seek(seconds){const resume=this.playing;this.pause();this.offset=clamp(seconds,0,this.duration);if(resume)await this.play();}
 mute(v,on){v.muted=on;v.gain?.gain.setTargetAtTime(on?0:1,this.ctx.currentTime,.02);}
 tick(dt){if(this.playing&&this.time>=this.duration){this.pause();this.offset=0;if(this.loop)this.play().catch(()=>{});else this.onEnd();}for(const v of this.items){let rms=0;if(this.playing&&v.analyser){v.analyser.getFloatTimeDomainData(v.data);for(const x of v.data)rms+=x*x;rms=Math.sqrt(rms/v.data.length);}const target=v.muted?0:clamp(rms/Math.max(.08,v.referenceRms||.2));v.energy+=(target-v.energy)*Math.min(1,dt*(target>v.energy?14:5));}}
 async makeDemo(){await this.ready();if(this.demoBuffers.length)return this.demoBuffers;for(let k=0;k<3;k++){const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*24,this.ctx.sampleRate),a=buffer.getChannelData(0);let phase=0;for(let i=0;i<a.length;i++){const t=i/buffer.sampleRate,f=[146.83,246.94,392][k]*(1+.009*Math.sin(t*4.2));phase+=TAU*f/buffer.sampleRate;const envelope=Math.min(1,t*3,(24-t)*3)*(.25+.75*Math.max(0,Math.sin(t*(1.4+k*.31)+k))**2);a[i]=envelope*.11*(Math.sin(phase)+[.15,.42,.07][k]*Math.sin(phase*2)+.08*Math.sin(phase*3));}this.demoBuffers.push(buffer);}return this.demoBuffers;}
 dispose(){this.pause();this.ctx?.close();}
}
