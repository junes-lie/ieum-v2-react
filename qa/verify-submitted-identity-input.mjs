import assert from 'node:assert/strict'
import {indexedDB} from 'fake-indexeddb'
import {saveSubmittedTrack,saveTrack,loadTrack} from '../src/trackStore.js'
import {prepareSubmittedTrackRecord} from '../src/trackSource.js'
import {analyzeAudioBuffer} from '../src/voiceAnalysis.js'
import {loadSubmittedTrackIdentityInput} from '../src/voiceIdentitySources.js'
globalThis.indexedDB=indexedDB
const pcm=Float32Array.from({length:32000},(_,index)=>.1*Math.sin(2*Math.PI*220*index/16000))
const features=analyzeAudioBuffer({sampleRate:16000,duration:2,getChannelData:()=>pcm})
const record=await prepareSubmittedTrackRecord({id:'project:part',projectId:'project',partId:'part',participantId:'private-owner',origin:'live-microphone-recording',blob:new Blob([pcm]),features,duration:2})
await saveSubmittedTrack(record)
const input={projectId:'project',partId:'part',identityOwnerId:'private-owner',identityRef:{id:'opaque-fixture-result',revision:'fixture-revision',outputSha256:'a'.repeat(64)},generatorVersion:'explicit-fixture-layer-version'}
const first=await loadSubmittedTrackIdentityInput(input)
assert.deepEqual(first,await loadSubmittedTrackIdentityInput(structuredClone(input)))
assert.equal(first.source.purpose,'project-track')
assert.equal(first.source.data.sourceRevision,record.sourceProvenance.revision)
assert.equal(first.source.data.assessment.candidates.actualRange.status,'estimated')
assert.equal(first.source.data.assessment.candidates.bpm.value,null)
assert.equal(JSON.stringify(first).includes('private-owner'),false)
assert.notEqual(first.inputDigest,(await loadSubmittedTrackIdentityInput({...input,generatorVersion:'different-generator'})).inputDigest)
assert.notEqual(first.inputDigest,(await loadSubmittedTrackIdentityInput({...input,identityRef:{...input.identityRef,revision:'different-personal-revision'}})).inputDigest)
assert.deepEqual(await loadTrack(record.id),record,'Read-only preparation must not alter submission or original')
await assert.rejects(loadSubmittedTrackIdentityInput({...input,identityOwnerId:'other-owner'}))
await assert.rejects(loadSubmittedTrackIdentityInput({...input,partId:'missing'}))
await assert.rejects(loadSubmittedTrackIdentityInput({...input,identityRef:null}))
for(const changed of [
 {...record,kind:'temporary-recording'},
 {...record,origin:'live-microphone-voice-sample'},
 {...record,sourceProvenance:null},
 {...record,blob:new Blob(['different original'])},
 {...record,features:{...features,version:'unsupported'}},
 {...record,sourceProvenance:{...record.sourceProvenance,analysisVersion:'different'}},
 {...record,sourceProvenance:{...record.sourceProvenance,revision:7}}
]) {await saveTrack(changed);await assert.rejects(loadSubmittedTrackIdentityInput(input))}
await saveTrack(record)
const ref=structuredClone(input.identityRef),pending=loadSubmittedTrackIdentityInput({...input,identityRef:ref})
ref.revision='changed-during-read'
assert.deepEqual(await pending,first,'Personal reference must bind before asynchronous reads')
const revised={...record,sourceProvenance:{...record.sourceProvenance,revision:crypto.randomUUID()}}
await saveTrack(revised)
assert.notEqual(first.inputDigest,(await loadSubmittedTrackIdentityInput(input)).inputDigest)
console.log('PASS persisted submitted Track→private layer input: original hash, source/analysis revision, owner, immutable reference, Review/Sample/legacy rejection, read-only and unsupported-null. Fixture personal reference; no generated/approved shape, Layer or Mix claim.')
