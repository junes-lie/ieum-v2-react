import assert from 'node:assert/strict'
import { evaluatePartFit, noteToMidi } from '../src/matching.js'

assert.equal(noteToMidi('B♭2'),46)
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:67},part:{range:'C3–G4'}}).eligible,true)
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:67},part:{range:'C3–G4'},transposeSemitones:1}).status,'ineligible')
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:67},part:{}}).status,'unavailable')
assert.equal(evaluatePartFit({part:{range:'C3–G4'}}).status,'profile-required')
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:67,comfortableRange:{lowMidi:52,highMidi:65}},part:{range:'C3–G4',tessitura:'D3–F4'}}).tessituraFit,false)
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:67,comfortableRange:{lowMidi:52,highMidi:65}},part:{range:'C3–G4',tessitura:'D3–F4'}}).eligible,false,'A known incompatible tessitura must fail the Complete Gate')
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:67,comfortableRange:{lowMidi:50,highMidi:65}},part:{range:'C3–G4',tessitura:'D3–F4'}}).eligible,true)
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:67},part:{range:'C3–G4'}}).tessituraFit,null)

globalThis.window = {AudioContext:class {}}
const {limitBufferPeak,cancelRecording,audioRuntime,getRecordingTimeline,pauseRecording,resumeRecording,updateRecordingGuides} = await import('../src/audio.js')
for (const count of [2,3,4]) {
  const channels=[Float32Array.from([count*.7,-count*.8,.02]),Float32Array.from([count*.5,-.1,.2])]
  const result=limitBufferPeak({numberOfChannels:2,getChannelData:index=>channels[index]})
  assert.ok(result.masterGain<1)
  assert.ok(Math.max(...channels.flatMap(channel=>Array.from(channel,Math.abs)))<=10**(-3/20)+1e-7)
  assert.ok(Math.abs(channels[0][0]/channels[0][1]-.7/-.8)<1e-6,'Peak ceiling preserves waveform ratio')
}
assert.throws(()=>limitBufferPeak({numberOfChannels:1,getChannelData:()=>[NaN]}))
audioRuntime.context={currentTime:10,state:'running'}
audioRuntime.activeStartedAt=7
audioRuntime.activeElapsedSec=2
audioRuntime.recorder={state:'recording',pause(){this.state='paused'},resume(){this.state='recording'}}
assert.equal(getRecordingTimeline().elapsedSec,5)
pauseRecording()
audioRuntime.context.currentTime=99
assert.equal(getRecordingTimeline().elapsedSec,5,'Pause excludes elapsed wall time')
resumeRecording()
audioRuntime.context.currentTime=101
assert.equal(getRecordingTimeline().elapsedSec,7,'Resume continues the same timeline')
const scheduled=[]
audioRuntime.context.createBufferSource=()=>({connect(node){if(node?.gain)this.qaGain=node;return node},start(at,offset){scheduled.push({at,offset,gain:this.qaGain?.gain.value})},stop(){}})
audioRuntime.context.createGain=()=>({gain:{value:0},connect(){return this}})
audioRuntime.syncOffsetSec=.035
audioRuntime.recordingGuideState={guides:{backing:false,parts:[true]},duration:20,decodedGuides:[{track:{partIndex:0,syncOffsetMs:100},buffer:{duration:20}}]}
updateRecordingGuides({backing:false,parts:[true]})
assert.ok(Math.abs(scheduled[0].offset-7.065)<1e-9,'Guide offset includes its own encoded lead-in, not another recording lead-in')
assert.ok(Math.abs(scheduled[0].at-101)<1e-9,'Guide toggle adds no new lead-in to an already running musical timeline')
assert.equal(scheduled[0].gain,.29,'Guide vocals default to the confirmed 50% level')
updateRecordingGuides({backing:false,parts:[true],vocalVolume:.25})
assert.equal(scheduled.at(-1).gain,.145,'Guide-vocal volume scales the actual guide Track gain')
updateRecordingGuides({backing:false,parts:[true],vocalVolume:0})
assert.equal(scheduled.length,2,'Zero guide-vocal volume does not schedule a silent guide Track')
pauseRecording()
updateRecordingGuides({backing:false,parts:[true]})
assert.equal(scheduled.length,2,'Changing paused guides does not restart audio')
audioRuntime.context.currentTime=150
resumeRecording()
assert.equal(scheduled.length,3)
assert.ok(Math.abs(scheduled.at(-1).offset-7.065)<1e-9,'Resume preserves project time and guide trim')
assert.equal(scheduled.at(-1).gain,.29,'Resume preserves the confirmed default guide-vocal level')
const actualBacking={duration:20}
audioRuntime.context.createOscillator=()=>{throw new Error('A supplied backing must never be replaced by synthetic tones')}
audioRuntime.context.createBufferSource=()=>({connect(){return this},start(at,offset){scheduled.push({at,offset,buffer:this.buffer})},stop(){}})
audioRuntime.recordingGuideState.decodedBacking=actualBacking
updateRecordingGuides({backing:true,parts:[false]})
assert.equal(scheduled.at(-1).buffer,actualBacking)
assert.equal(scheduled.at(-1).offset,6.965,'Actual backing follows the same elapsed project time')
pauseRecording()
const pausedCount=scheduled.length
updateRecordingGuides({backing:false,parts:[false]})
updateRecordingGuides({backing:true,parts:[false]})
assert.equal(scheduled.length,pausedCount,'Paused backing toggles must not start audio')
audioRuntime.context.currentTime=200
resumeRecording()
assert.equal(scheduled.at(-1).buffer,actualBacking)
assert.equal(scheduled.at(-1).offset,6.965,'Actual backing resumes at the preserved project time')
audioRuntime.context.currentTime=220
const beforeEnd=scheduled.length
updateRecordingGuides({backing:true,parts:[false]})
assert.equal(scheduled.length,beforeEnd,'A finished actual backing neither restarts nor falls back to synthetic audio')
console.log('Audio foundation: range/key gates, missing metadata, 2/3/4-track master peak safety, pause/resume timeline and actual backing continuity passed.')

globalThis.cancelAnimationFrame=()=>{}
const retainedTake=new Blob(['original persisted Take'],{type:'audio/webm'})
const retainedUrl=URL.createObjectURL(retainedTake)
audioRuntime.recorder={state:'inactive'}
audioRuntime.recordingBlob=retainedTake;audioRuntime.recordingUrl=retainedUrl
audioRuntime.decoded={duration:90};audioRuntime.lastAnalysis={features:{rms:.1}}
cancelRecording()
assert.equal(audioRuntime.decoded,null)
assert.equal(audioRuntime.recordingBlob,null)
assert.equal(audioRuntime.lastAnalysis,null)
assert.equal(await (await fetch(retainedUrl)).text(),'original persisted Take','Session cleanup must preserve independently owned Review/Profile audio')
URL.revokeObjectURL(retainedUrl)
console.log('PASS session cleanup releases analysis references while preserving independently owned Take bytes and playable URL')
