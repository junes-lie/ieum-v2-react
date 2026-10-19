import assert from 'node:assert/strict'
import {analyzeAudioBuffer,buildVoiceLayer} from '../src/voiceAnalysis.js'
import {assessVoiceCandidates} from '../src/voiceIdentityContract.js'
for(const sampleRate of [16000,44100,48000]) {
 const tone=hz=>Float32Array.from({length:sampleRate*2},(_,i)=>.1*Math.sin(2*Math.PI*hz*i/sampleRate))
 for(const hz of [110,220,330]) {
  const pcm=tone(hz),buffer={sampleRate,duration:2,getChannelData:()=>pcm}
  const features=analyzeAudioBuffer(buffer),observation=features.pitchObservation,expected=69+12*Math.log2(hz/440)
  assert.deepEqual(features,analyzeAudioBuffer(buffer))
  assert.ok(observation.attemptedFrames<=36)
  assert.equal(observation.status,'estimated')
  for(const key of ['minimumMidi','maximumMidi','medianMidi'])assert.ok(Math.abs(observation[key]-expected)<.2,`${sampleRate}Hz / ${hz}Hz ${key}`)
  const {pitchObservation,...legacyBase}=features
  assert.deepEqual(buildVoiceLayer('preserved','tenor',features),buildVoiceLayer('preserved','tenor',legacyBase),'Additive observation must not alter existing Layer input')
 }
 const changing=Float32Array.from({length:sampleRate*2},(_,i)=>.1*Math.sin(2*Math.PI*(i<sampleRate?110:220)*i/sampleRate))
 const observation=analyzeAudioBuffer({sampleRate,duration:2,getChannelData:()=>changing}).pitchObservation
 assert.ok(Math.abs(observation.minimumMidi-45)<.2 && Math.abs(observation.maximumMidi-57)<.2)
 const silent=analyzeAudioBuffer({sampleRate,duration:2,getChannelData:()=>new Float32Array(sampleRate*2)})
 assert.equal(silent.pitchObservation.status,'insufficient-data');assert.equal(silent.pitchObservation.minimumMidi,null)
 assert.equal(assessVoiceCandidates(silent,'project-track').candidates.actualRange.value,null)
 const short=analyzeAudioBuffer({sampleRate,duration:.001,getChannelData:()=>new Float32Array(16)})
 assert.equal(short.pitchObservation.attemptedFrames,0);assert.equal(short.pitchObservation.maximumMidi,null)
}
console.log('Actual sampled F0 observations: 3 sample rates/low-mid tones/changing pitch, deterministic/versioned data, silence/short/legacy unknown, unchanged Layer inputs. No real voice or full-range accuracy claim.')

const {indexedDB}=await import('fake-indexeddb')
globalThis.indexedDB=indexedDB
const {prepareSubmittedTrackRecord}=await import('../src/trackSource.js')
const {saveSubmittedTrack,loadTrack}=await import('../src/trackStore.js')
const sampleRate=16000,pcm=Float32Array.from({length:32000},(_,i)=>.1*Math.sin(2*Math.PI*220*i/sampleRate))
const features=analyzeAudioBuffer({sampleRate,duration:2,getChannelData:()=>pcm})
const encoded=Buffer.alloc(44+pcm.length*2)
encoded.write('RIFF');encoded.writeUInt32LE(encoded.length-8,4);encoded.write('WAVEfmt ',8);encoded.writeUInt32LE(16,16);encoded.writeUInt16LE(1,20);encoded.writeUInt16LE(1,22);encoded.writeUInt32LE(sampleRate,24);encoded.writeUInt32LE(sampleRate*2,28);encoded.writeUInt16LE(2,32);encoded.writeUInt16LE(16,34);encoded.write('data',36);encoded.writeUInt32LE(pcm.length*2,40)
for(let index=0;index<pcm.length;index++)encoded.writeInt16LE(Math.round(pcm[index]*32767),44+index*2)
const record=await prepareSubmittedTrackRecord({id:'pitch-observation:lead',projectId:'pitch-observation',partId:'lead',kind:'project-track',origin:'live-microphone-recording',blob:new Blob([encoded],{type:'audio/wav'}),features,layer:buildVoiceLayer('preserved','lead',features)})
await saveSubmittedTrack(record)
const restored=await loadTrack(record.id)
assert.deepEqual(restored.features.pitchObservation,features.pitchObservation)
assert.deepEqual(assessVoiceCandidates(restored.features,'project-track'),assessVoiceCandidates(features,'project-track'))
assert.equal(restored.layer.signature,record.layer.signature)
console.log('Submitted synthetic WAV: source/Layer and sampled-F0 observation persist together; reload assessment exact.')
