import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
globalThis.window={AudioContext:class{}}
globalThis.cancelAnimationFrame=()=>{}
const {audioRuntime:r,recordingVoicePlan,updateRecordingGuides,pauseRecording,resumeRecording}=await import('../src/audio.js')
const path=new URL('../public/audio/project-warm-unison-v1/provided-vocal.mp3',import.meta.url)
const hash=createHash('sha256').update(readFileSync(path)).digest('hex')
const decoded=spawnSync('ffmpeg',['-v','error','-i',path.pathname,'-ar','44100','-ac','1','-f','f32le','-'],{maxBuffer:16*1024*1024})
assert.equal(decoded.status,0)
const pcm=new Float32Array(decoded.stdout.buffer.slice(decoded.stdout.byteOffset,decoded.stdout.byteOffset+decoded.stdout.byteLength))
const buffer={duration:pcm.length/44100,numberOfChannels:1,getChannelData:()=>pcm}
const copies=[0,1,3].map(partIndex=>({track:{partIndex,origin:'presentation-provided-vocal-fixture',sourceProvenance:{audioSha256:hash}},buffer}))
const state={guides:{backing:false,parts:[true,true,false,true],vocalVolume:.5},decodedGuides:copies,decodedVocalGuide:buffer,vocalGuideSha256:hash,vocalGuideOffsetSec:0}
const render=plan=>{
 const output=new Float32Array(4410)
 for(const voice of plan){const start=Math.floor(voice.offset*44100);for(let i=0;i<output.length;i++)output[i]+=(voice.buffer.getChannelData(0)[start+i]||0)*voice.gain}
 let peak=0,energy=0;for(const value of output){peak=Math.max(peak,Math.abs(value));energy+=value*value}
 return {peak,rms:Math.sqrt(energy/output.length)}
}
const audible=render(recordingVoicePlan(state,4));assert.ok(audible.rms>0)
assert.ok(Math.abs(recordingVoicePlan(state,4).reduce((sum,v)=>sum+v.gain,0)-.29)<1e-9,'Four copies cannot quadruple provided guide volume')
let sources=[]
r.context={state:'running',currentTime:4,destination:{},createBufferSource:()=>({connect(gain){this.gain= gain.gain;return gain},start(at,offset){this.entry={buffer:this.buffer,offset,gain:this.gain.value,stop:false};sources.push(this.entry)},stop(){if(this.entry)this.entry.stop=true}}),createGain:()=>({gain:{value:0},connect(){return this}})}
r.recorder={state:'recording',pause(){this.state='paused'},resume(){this.state='recording'}}
r.activeStartedAt=0;r.activeElapsedSec=0;r.syncOffsetSec=0;r.recordingGuideState=state
for(const volume of [.5,0,.5,0]){
 updateRecordingGuides({...state.guides,vocalVolume:volume})
 const active=sources.filter(v=>!v.stop);const measured=render(active)
 if(volume===0){assert.equal(measured.peak,0);assert.equal(measured.rms,0);assert.equal(active.length,0)}
 else assert.ok(measured.rms>0)
}
pauseRecording();updateRecordingGuides({...state.guides,vocalVolume:0});resumeRecording()
assert.deepEqual(render(sources.filter(v=>!v.stop)),{peak:0,rms:0},'Paused zero must remain silent after resume')
const actual={track:{partIndex:2,origin:'live-microphone-recording'},buffer}
const zeroWithReal=recordingVoicePlan({...state,guides:{...state.guides,parts:[true,true,true,true],vocalVolume:0},decodedGuides:[...copies,actual]},4)
assert.deepEqual(zeroWithReal.map(v=>v.kind),['participant'],'An independently recorded participant is not the provided guide')
for(const mask of [[true,false,false,false],[false,false,false,false]]){
 const plan=recordingVoicePlan({...state,guides:{...state.guides,parts:mask,vocalVolume:.5}},4)
 assert.equal(plan.filter(v=>v.kind==='provided-guide-copy').length,mask[0]?1:0,'Existing participant toggles remain effective')
}
console.log(JSON.stringify({passed:true,sourceSha256:hash,beforeMute:audible,zero:{peak:0,rms:0},checks:['live 50→0 twice','paused→0→resume','same-source gain deduplication','participant toggles preserved','real recording independent'],limits:'Real MP3 decoded with ffmpeg; PCM rendering and actual scheduler through a simulated AudioContext, not physical-device listening'},null,2))
