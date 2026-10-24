import assert from 'node:assert/strict'
globalThis.window={AudioContext:class {}}
const {audioRuntime:r,getGuideVolume,setGuideVolume,vocalGuideGain,updateRecordingGuides}=await import('../src/audio.js')
const buffer=value=>({numberOfChannels:1,duration:20,getChannelData:()=>Float32Array.from([value,-value])})
assert.equal(getGuideVolume(),.5)
setGuideVolume(.12);assert.equal(getGuideVolume(),.12,'Profile choice survives project component mounting')
assert.equal(setGuideVolume(2),1);assert.equal(setGuideVolume(-1),0)
const loud=buffer(.8),quiet=buffer(.08)
assert.equal(vocalGuideGain(.5),.29,'Restore original 50% guide gain without source attenuation')
assert.equal(vocalGuideGain(1),.58)
assert.equal(vocalGuideGain(0),0)
const gains=[]
const node=()=>({connect(){return this},start(){},stop(){}})
r.context={currentTime:1,state:'running',destination:{},createBufferSource:node,createGain:()=>{const n=node();n.gain={};gains.push(n.gain);return n}}
r.recorder={state:'recording'};r.activeStartedAt=1;r.activeElapsedSec=0
r.recordingGuideState={decodedVocalGuide:loud,decodedBacking:null,decodedGuides:[{track:{partIndex:0},buffer:quiet}],guides:{backing:false,parts:[true]},vocalGuideOffsetSec:0}
updateRecordingGuides({backing:false,parts:[true],vocalVolume:1})
assert.equal(gains[0].value,.58);assert.equal(gains.length,2);assert.equal(gains[1].value,.29)
gains.length=0
updateRecordingGuides({backing:false,parts:[true],vocalVolume:0})
assert.equal(gains.length,1,'Zero removes vocal only; participant monitoring remains')
assert.equal(gains[0].value,.29)
console.log('PASS shared preference, bounds, original guide gain, independent participant monitoring, live volume update')

// Decode the registered audio, then exercise the actual live/resume scheduler.
const {spawnSync}=await import('node:child_process')
const {createHash}=await import('node:crypto')
const {readFileSync}=await import('node:fs')
const {WARM_ARRANGEMENT}=await import('../src/projectMusic.js')
const {recordingGuides,backingPlaybackGain,pauseRecording,resumeRecording}=await import('../src/audio.js')
const decode=path=>{
 const result=spawnSync('ffmpeg',['-v','error','-i',new URL('../public'+path,import.meta.url).pathname,'-ar','44100','-ac','2','-f','f32le','-'],{maxBuffer:32*1024*1024})
 if(result.status!==0)throw Error(result.stderr?.toString()||'ffmpeg unavailable')
 const pcm=new Float32Array(result.stdout.buffer.slice(result.stdout.byteOffset,result.stdout.byteOffset+result.stdout.byteLength))
 const channels=[new Float32Array(pcm.length/2),new Float32Array(pcm.length/2)]
 for(let i=0;i<channels[0].length;i++){channels[0][i]=pcm[i*2];channels[1][i]=pcm[i*2+1]}
 return {numberOfChannels:2,duration:channels[0].length/44100,getChannelData:i=>channels[i]}
}
const referencePath=WARM_ARRANGEMENT.backingLevelReferenceFile
assert.equal(createHash('sha256').update(readFileSync(new URL('../public'+referencePath,import.meta.url))).digest('hex'),WARM_ARRANGEMENT.backingLevelReferenceSha256)
const reference=decode(referencePath),projectBacking=decode(WARM_ARRANGEMENT.backingFile)
const expected=backingPlaybackGain(reference)
setGuideVolume(.25)
const observed=[]
globalThis.cancelAnimationFrame=()=>{}
for(const entry of ['sample','register-then-project','registered-project']){
 const settings=recordingGuides()
 assert.equal(settings.vocalVolume,.25)
 r.recorder={state:'recording',pause(){this.state='paused'},resume(){this.state='recording'}}
 r.context.currentTime=1;r.activeStartedAt=1;r.activeElapsedSec=0;r.syncOffsetSec=0
 r.recordingGuideState={decodedBacking:entry==='sample'?reference:projectBacking,decodedBackingReference:reference,decodedGuides:[],guides:settings}
 gains.length=0;updateRecordingGuides(settings)
 assert.equal(gains[0].value,expected,entry+' must use the same registered reference')
 pauseRecording();resumeRecording()
 assert.equal(gains.at(-1).value,expected,entry+' resume must preserve gain')
 updateRecordingGuides({...settings,vocalVolume:0})
 assert.equal(gains.at(-1).value,expected,entry+' vocal change must preserve backing gain')
 observed.push({entry,backingGain:expected})
}
console.log('PASS actual registered backing: '+JSON.stringify(observed))
