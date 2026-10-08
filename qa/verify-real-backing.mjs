import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {createHash} from 'node:crypto'
const file=process.argv[2]
assert.ok(file,'Pass an actual separated backing WAV path')
const backing=await readFile(file)
assert.equal(backing.subarray(0,4).toString(),'RIFF')
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']})
try{
 const context=await browser.newContext({permissions:['microphone']})
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/__qa_backing.wav',route=>route.fulfill({status:200,contentType:'audio/wav',body:backing}))
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4193/')
 const report=await page.evaluate(async()=>{
  const a=await import('/src/audio.js')
  const backingBlob=await (await fetch('/__qa_backing.wav')).blob()
  const probe=new AudioContext(),decoded=await probe.decodeAudioData(await backingBlob.arrayBuffer());await probe.close()
  let invalidBackingRejected=false
  try{await a.startRecording({guides:{backing:true,parts:[]},backingBlob:new Blob(['invalid audio']),duration:decoded.duration})}catch{invalidBackingRejected=true}
  if(!invalidBackingRejected||a.audioRuntime.stream?.active)throw new Error('Failed backing decode must reject and release the microphone')
  const starts=[]
  const createSource=AudioContext.prototype.createBufferSource
  AudioContext.prototype.createBufferSource=function(){const source=createSource.call(this),start=source.start.bind(source);source.start=(at,offset)=>{starts.push({at,offset,duration:source.buffer.duration});return start(at,offset)};return source}
  const oscillator=AudioContext.prototype.createOscillator
  AudioContext.prototype.createOscillator=function(){throw new Error('Actual backing unexpectedly replaced by synthetic audio')}
  const offlineOscillator=OfflineAudioContext.prototype.createOscillator
  OfflineAudioContext.prototype.createOscillator=function(){throw new Error('Offline mix unexpectedly replaced actual backing')}
  const wait=ms=>new Promise(r=>setTimeout(r,ms))
  try{
   await a.startRecording({guides:{backing:true,parts:[]},backingBlob,duration:decoded.duration})
   await wait(700)
   a.pauseRecording();const paused=a.getRecordingTimeline().elapsedSec,pausedStarts=starts.length
   a.updateRecordingGuides({backing:false,parts:[]});a.updateRecordingGuides({backing:true,parts:[]})
   await wait(250);const frozen=a.getRecordingTimeline().elapsedSec
   a.resumeRecording();const resumed=starts.at(-1)
   await wait(250);a.updateRecordingGuides({backing:false,parts:[]});const offCount=starts.length
   a.updateRecordingGuides({backing:true,parts:[]});const toggled=starts.at(-1)
   const take=await a.stopRecording();a.stopMicrophone()
   const playbackCount=a.audioRuntime.playback.length
   const mix=await a.createPreviewMix({tracks:[],backing:true,backingBlob,duration:2})
   const afterOffline=a.audioRuntime.playback.length
   const decodedMix=await a.analyzeBlob(mix.blob)
   const output=decodedMix.decoded.getChannelData(0)
   let square=0;for(const sample of output)square+=sample*sample
   URL.revokeObjectURL(mix.url);URL.revokeObjectURL(take.url)
   return{invalidBackingRejected,microphoneReleasedAfterDecodeFailure:true,backingDuration:decoded.duration,first:starts[0],paused,frozen,pausedStarts,resumed,offCount,toggled,takeBytes:take.bytes,mixDuration:mix.duration,mixRms:Math.sqrt(square/output.length),playbackCount,afterOffline}
  }finally{a.cancelRecording();a.stopMicrophone();AudioContext.prototype.createBufferSource=createSource;AudioContext.prototype.createOscillator=oscillator;OfflineAudioContext.prototype.createOscillator=offlineOscillator}
 })
 assert.equal(report.first.duration,report.backingDuration)
 assert.equal(report.first.offset,0)
 assert.equal(report.frozen,report.paused)
 assert.ok(Math.abs(report.resumed.offset-report.paused)<.05)
 assert.ok(report.toggled.offset>=report.resumed.offset+.15)
 assert.ok(report.takeBytes>0)
 assert.ok(report.mixRms>1e-5)
 assert.equal(report.playbackCount,report.afterOffline,'Offline render must not retain nodes in the live player')
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,backingSha256:createHash('sha256').update(backing).digest('hex'),...report,limits:'Actual separated WAV and Web Audio; synthetic microphone, isolated storage, no physical listening acceptance.'}))
 await context.close()
}finally{await browser.close()}
