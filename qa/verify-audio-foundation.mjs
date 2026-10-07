import assert from 'node:assert/strict'
import { evaluatePartFit, noteToMidi } from '../src/matching.js'

assert.equal(noteToMidi('B♭2'),46)
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:67},part:{range:'C3–G4'}}).eligible,true)
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:67},part:{range:'C3–G4'},transposeSemitones:1}).status,'ineligible')
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:67},part:{}}).status,'unavailable')
assert.equal(evaluatePartFit({part:{range:'C3–G4'}}).status,'profile-required')
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:67,comfortableRange:{lowMidi:52,highMidi:65}},part:{range:'C3–G4',tessitura:'D3–F4'}}).tessituraFit,false)
assert.equal(evaluatePartFit({rangeData:{lowMidi:48,highMidi:67},part:{range:'C3–G4'}}).tessituraFit,null)

globalThis.window = {AudioContext:class {}}
const {limitBufferPeak,audioRuntime,getRecordingTimeline,pauseRecording,resumeRecording,updateRecordingGuides} = await import('../src/audio.js')
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
audioRuntime.context.createBufferSource=()=>({connect(){return this},start(at,offset){scheduled.push({at,offset})},stop(){}})
audioRuntime.context.createGain=()=>({gain:{value:0},connect(){return this}})
audioRuntime.syncOffsetSec=.035
audioRuntime.recordingGuideState={guides:{backing:false,parts:[true]},duration:20,decodedGuides:[{track:{partIndex:0,syncOffsetMs:100},buffer:{duration:20}}]}
updateRecordingGuides({backing:false,parts:[true]})
assert.ok(Math.abs(scheduled[0].offset-7.1)<1e-9,'Guide offset includes its own encoded lead-in, not another recording lead-in')
assert.ok(Math.abs(scheduled[0].at-101.035)<1e-9,'Guide starts on the same scheduling latency as initial recording')
pauseRecording()
updateRecordingGuides({backing:false,parts:[true]})
assert.equal(scheduled.length,1,'Changing paused guides does not restart audio')
audioRuntime.context.currentTime=150
resumeRecording()
assert.ok(Math.abs(scheduled[1].offset-7.1)<1e-9,'Resume preserves project time and guide trim')
console.log('Audio foundation: range/key gates, missing metadata, 2/3/4-track master peak safety, pause/resume timeline passed.')
