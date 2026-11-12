// Actual decoded MP3 samples -> production Transport RMS/FFT-band mapping ->
// prepared-song routing -> production flow fields. Audio nodes/clock and DOM
// are simulated: this is NOT browser/Web Audio/render or listening validation.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import FFT from 'fft.js';
import {installPreparedSong} from './experiments/music-box/prepared-song.js';
import {createFlow,stepFlow,fillFlow} from './experiments/music-box/particle-flow.mjs';
const pcm=new Map();
for(const name of ['reference','steven','kara','backing']){
 const bytes=execFileSync('ffmpeg',['-v','error','-i',`public/audio/chance/${name}.mp3`,'-ac','1','-ar','44100','-f','f32le','-'],{maxBuffer:60e6});
 const a=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));pcm.set(name,{duration:a.length/44100,a});
}
assert.equal(new Set([...pcm.values()].map(b=>b.a.length)).size,1);
let audio=fs.readFileSync('src/audio.js','utf8').replace("'./profiles.js'",JSON.stringify(pathToFileURL(process.cwd()+'/src/profiles.js').href)).replace('v.muted?0:1','v.muted?0:(v.playbackGain??1)');
const {Transport}=await import('data:text/javascript;base64,'+Buffer.from(audio).toString('base64'));
const fft=new FFT(1024),complex=fft.createComplexArray();
class Node {connect(n){if(n)n.source=this.source||this;return n;}disconnect(){}}
class Context {
 constructor(){this.sampleRate=44100;this.currentTime=0;this.destination=new Node();}
 async resume(){}createDynamicsCompressor(){return new Node();}createGain(){const n=new Node();n.gain={value:1,setTargetAtTime(v){this.value=v;}};return n;}
 createBufferSource(){const n=new Node();n.start=(at,offset)=>{n.at=at;n.offset=offset;};n.stop=()=>{};return n;}
 createAnalyser(){const n=new Node();n.frequencyBinCount=512;n.getFloatTimeDomainData=out=>{const s=n.source;const at=Math.floor((this.currentTime-s.at+s.offset)*44100);for(let j=0;j<out.length;j++)out[j]=s.buffer.a[at+j]||0;};n.getByteFrequencyData=out=>{const data=new Float32Array(1024);n.getFloatTimeDomainData(data);fft.realTransform(complex,data);for(let j=0;j<512;j++){const mag=Math.hypot(complex[2*j],complex[2*j+1])/1024;out[j]=Math.max(0,Math.min(255,(20*Math.log10(mag||1e-12)+100)/70*255));}};return n;}
 async decodeAudioData(name){return pcm.get(name);}
}
globalThis.AudioContext=Context;
const nodes=new Map();const node=()=>({style:{},value:'',textContent:'',disabled:false,parentElement:{before(){}},before(){},after(){},append(){},setAttribute(){},onclick(){},onchange(){}});
for(const id of ['#play','#demo','#seek','#duration','#source-label','#voice-count'])nodes.set(id,node());
globalThis.document={querySelector:s=>nodes.get(s),createElement:node};
globalThis.fetch=async url=>({ok:true,arrayBuffer:async()=>url.split('/').pop().replace('.mp3','')});
const voices=Array.from({length:4},(_,i)=>{const m=new Map();return{active:i<3,energy:0,referenceRms:.1,card:{querySelector(s){if(!m.has(s))m.set(s,node());return m.get(s);}}};});
const transport=new Transport();nodes.get('#play').onclick=()=>transport.play();
const app=installPreparedSong({transport,voices,note(){},updatePlay(){},format:String});await nodes.get('#play').onclick();
assert.deepEqual(transport.sources.map(s=>s.gain.gain.value),[1,0,0,0]);
assert.equal(new Set(transport.sources.map(s=>s.source.at)).size,1);
const flows=[.35,2.65,5.25].map(createFlow),waves=flows.map(()=>new Float32Array(64));
const ranges=[['intro',3,10],['Steven1',13,23],['Kara1',25,34],['Steven2',37,46],['Kara2',49,58],['duet',82,93]];
const stats=ranges.map(([name,start,end])=>({name,start,end,n:0,energy:[0,0,0],activity:[0,0,0],field:[0,0,0]}));
for(let frame=0;frame<176*60;frame++){
 const t=frame/60;transport.ctx.currentTime=transport.startAt+t;transport.tick(1/60);
 for(let i=0;i<3;i++){stepFlow(flows[i],1/60,transport.playing,voices[i].energy,voices[i].bands);fillFlow(waves[i],flows[i]);assert.ok(waves[i].every(Number.isFinite));}
 for(const s of stats)if(t>=s.start&&t<s.end){s.n++;for(let i=0;i<3;i++){s.energy[i]+=voices[i].energy;s.activity[i]+=flows[i].activity;s.field[i]+=Math.sqrt(waves[i].reduce((a,b)=>a+b*b,0)/64);}}
}
for(const s of stats)for(const key of ['energy','activity','field'])s[key]=s[key].map(x=>+(x/s.n).toFixed(5));
for(const s of stats.filter(s=>/Steven|Kara/.test(s.name))){const lead=s.name.startsWith('Steven')?0:1,other=1-lead;assert.ok(s.energy[lead]>s.energy[other]*3,JSON.stringify(s));assert.ok(s.field[lead]>s.field[other]*2,JSON.stringify(s));}
assert.ok(stats[0].field.every(x=>x>0));assert.ok(stats[5].energy[0]>.05&&stats[5].energy[1]>.05);
await transport.seek(25);assert.equal(transport.sources.length,4);assert.ok(transport.sources.every(s=>s.source.offset===25));
transport.pause();assert.equal(transport.sources.length,0);transport.tick(1/60);assert.ok(voices.every(v=>v.energy===0));
transport.loop=true;await transport.play();transport.ctx.currentTime=transport.startAt+transport.duration;transport.tick(1/60);await new Promise(r=>setImmediate(r));assert.equal(transport.sources.length,4);assert.ok(transport.sources.every(s=>s.source.offset===0));transport.pause();
const report={scope:'Decoded real MP3; simulated audio nodes/FFT/clock; actual production routing/energy/flow. No browser or visual approval.',duration:pcm.get('reference').duration,stats,checks:['one audible mix','aligned starts','whole-song finite','lead ownership reverses in four solo phrases','both vocals active in duet','quiet intro','seek offsets','pause releases sources','loop restart']};
fs.writeFileSync(process.env.IEUM_CHANCE_REPORT||'/tmp/chance-audio-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
