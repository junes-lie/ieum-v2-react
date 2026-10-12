import assert from 'node:assert/strict'
import {indexedDB} from 'fake-indexeddb'
import {prepareVoiceRangeRecord,prepareVoiceSampleRecord} from '../src/profileSource.js'
import {saveTracks,loadTrack} from '../src/trackStore.js'
import {analyzeAudioBuffer} from '../src/voiceAnalysis.js'
import {measuredProfileIdentityInput,loadMeasuredProfileIdentityInput} from '../src/voiceIdentitySources.js'
globalThis.indexedDB=indexedDB
const pcm=Float32Array.from({length:32000},(_,index)=>.1*Math.sin(2*Math.PI*220*index/16000))
const features=analyzeAudioBuffer({sampleRate:16000,duration:2,getChannelData:()=>pcm})
const rangeRecord=await prepareVoiceRangeRecord({id:'profile:range',projectId:'profile',kind:'voice-range',rangeData:{analysisVersion:'normalized-difference-v1',lowMidi:48,highMidi:67,sampleCount:10,confidence:.8}})
const sampleRecord=await prepareVoiceSampleRecord({id:'profile:sample',projectId:'profile',kind:'voice-sample',blob:new Blob(['isolated immutable original']),features})
await saveTracks([rangeRecord,sampleRecord])
const input={userId:'private-user',generatorVersion:'explicit-test-generator',rangeRecord,sampleRecord}
const first=await measuredProfileIdentityInput(input)
assert.deepEqual(first,await loadMeasuredProfileIdentityInput({userId:input.userId,generatorVersion:input.generatorVersion,profileProjectId:'profile'}))
assert.deepEqual(first,await measuredProfileIdentityInput(structuredClone(input)))
assert.deepEqual(first.sources.map(source=>source.purpose),['voice-range','voice-sample'])
assert.equal(first.sources[1].data.pitchFrameLength,4096)
assert.equal(JSON.stringify(first).includes('blob:'),false)
assert.notEqual(first.inputDigest,(await measuredProfileIdentityInput({...input,userId:'other-private-user'})).inputDigest)
assert.notEqual(first.inputDigest,(await measuredProfileIdentityInput({...input,generatorVersion:'next-generator'})).inputDigest)
for(const bad of [
 {...input,rangeRecord:{...rangeRecord,rangeData:{...rangeRecord.rangeData,lowMidi:36}}},
 {...input,sampleRecord:{...sampleRecord,blob:new Blob(['changed immutable original'])}},
 {...input,sampleRecord:{...sampleRecord,features:{...features,version:'unsupported'}}},
 {...input,rangeRecord:{...rangeRecord,sourceProvenance:null}},
 {...input,sampleRecord:{...sampleRecord,kind:'project-track'}},
 {...input,sampleRecord:{...sampleRecord,projectId:'other-profile'}},
 {...input,generatorVersion:''}
]) await assert.rejects(measuredProfileIdentityInput(bad))
const pending=measuredProfileIdentityInput(input)
input.rangeRecord.rangeData.lowMidi=36
input.sampleRecord.features.brightness=.99
assert.deepEqual(await pending,first,'Hash await must not allow replacement of bound measurements')
assert.equal((await loadTrack(rangeRecord.id)).rangeData.lowMidi,48,'Input preparation never writes Profile data')
console.log('Persisted measured Profile → private generation input: actual source hash/size/version checks, deterministic input, source isolation, immutable snapshot, unsupported/legacy rejection passed. No graphic/model completion claim.')
