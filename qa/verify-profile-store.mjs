import assert from 'node:assert/strict'
import {indexedDB,IDBObjectStore} from 'fake-indexeddb'
import {saveTracks,loadTrack} from '../src/trackStore.js'
import {prepareVoiceRangeRecord,prepareVoiceSampleRecord,voiceSourceRevision} from '../src/profileSource.js'
import {canonicalIdentityInput} from '../src/voiceIdentityContract.js'
globalThis.indexedDB=indexedDB
const measured={id:'provenance:range',projectId:'provenance',kind:'voice-range',rangeData:{analysisVersion:'normalized-difference-v1',lowMidi:48,highMidi:67,sampleCount:10,confidence:.8}}
const pendingRange=prepareVoiceRangeRecord(measured)
measured.rangeData.lowMidi=36
const preparedRange=await pendingRange
assert.equal(preparedRange.rangeData.lowMidi,48,'Measurement snapshot must precede hash awaits')
const rangeDigest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalIdentityInput(preparedRange.rangeData)))
assert.equal(preparedRange.sourceProvenance.measurementSha256,[...new Uint8Array(rangeDigest)].map(value=>value.toString(16).padStart(2,'0')).join(''))
assert.equal(preparedRange.sourceProvenance.analysisVersion,'normalized-difference-v1')
assert.equal('audioSha256' in preparedRange.sourceProvenance,false,'Range measurement is not an audio recording')
await saveTracks([preparedRange])
assert.deepEqual((await loadTrack(preparedRange.id)).sourceProvenance,preparedRange.sourceProvenance)
const repeated=await prepareVoiceRangeRecord({...measured,rangeData:preparedRange.rangeData})
assert.equal(repeated.sourceProvenance.measurementSha256,preparedRange.sourceProvenance.measurementSha256)
assert.notEqual(repeated.sourceProvenance.revision,preparedRange.sourceProvenance.revision)
await assert.rejects(prepareVoiceRangeRecord({...measured,kind:'project-track'}))
await assert.rejects(prepareVoiceRangeRecord({...measured,rangeData:{lowMidi:NaN,highMidi:67}}))
const noVersion=await prepareVoiceRangeRecord({...measured,rangeData:{lowMidi:48,highMidi:67}})
assert.equal(noVersion.sourceProvenance.analysisVersion,null,'Unavailable analysis version must not be invented')
const candidate={id:'provenance:sample',projectId:'provenance',kind:'voice-sample',blob:new Blob(['actual immutable Sample bytes']),features:{version:'ieum-basic-voice-v5',brightness:.4}}
const pending=prepareVoiceSampleRecord(candidate)
candidate.features.brightness=.9
const prepared=await pending
assert.equal(prepared.features.brightness,.4,'Analysis snapshot must be bound before hashing awaits')
const expectedHash=await crypto.subtle.digest('SHA-256',await candidate.blob.arrayBuffer())
assert.equal(prepared.sourceProvenance.audioSha256,[...new Uint8Array(expectedHash)].map(v=>v.toString(16).padStart(2,'0')).join(''))
assert.equal(prepared.sourceProvenance.byteLength,candidate.blob.size)
assert.equal(prepared.sourceProvenance.analysisVersion,'ieum-basic-voice-v5')
await saveTracks([prepared])
assert.deepEqual((await loadTrack(prepared.id)).sourceProvenance,prepared.sourceProvenance,'Stored revision/hash must survive a separate read')
await assert.rejects(prepareVoiceSampleRecord({...candidate,kind:'project-track'}))
await assert.rejects(prepareVoiceSampleRecord({...candidate,blob:new Blob([])}))
const unanalysed=await prepareVoiceSampleRecord({...candidate,features:null})
assert.equal(unanalysed.sourceProvenance.analysisVersion,null,'Unavailable analysis must not be invented')
assert.equal(unanalysed.sourceProvenance.audioSha256,prepared.sourceProvenance.audioSha256)
console.log('Private Sample provenance: exact original hash/size, immutable analysis snapshot, persisted revision, purpose validation and missing analysis passed.')
const range={id:'profile:range',projectId:'profile',kind:'voice-range',range:'Original range'}
const sample={id:'profile:sample',projectId:'profile',kind:'voice-sample',blob:new Blob(['Original sample'])}
await saveTracks([range,sample])
const put=IDBObjectStore.prototype.put
try {
 IDBObjectStore.prototype.put=function(record){if(record.kind==='voice-sample')throw new Error('QA sample write failure');return put.call(this,record)}
 await assert.rejects(()=>saveTracks([{...range,range:'New range'},{...sample,blob:new Blob(['New sample'])}]),/QA sample write failure/)
 assert.equal((await loadTrack(range.id)).range,range.range)
 assert.equal(await (await loadTrack(sample.id)).blob.text(),'Original sample')
 await assert.rejects(()=>saveTracks([{...range,id:'first:range'},{...sample,id:'first:sample'}]),/QA sample write failure/)
 assert.equal(await loadTrack('first:range'),null);assert.equal(await loadTrack('first:sample'),null)
} finally {IDBObjectStore.prototype.put=put}
await saveTracks([{...range,range:'New range'},{...sample,blob:new Blob(['New sample'])}])
assert.equal((await loadTrack(range.id)).range,'New range')
assert.equal(await (await loadTrack(sample.id)).blob.text(),'New sample')
await assert.rejects(()=>saveTracks([]));await assert.rejects(()=>saveTracks([{id:'invalid'}]))
console.log('Profile store: failed sample write rolls back range and sample; no partial initial registration; successful retry commits both.')

const combinedRevision=await voiceSourceRevision(preparedRange.sourceProvenance,prepared.sourceProvenance)
assert.match(combinedRevision,/^ieum-voice-source-set-v1:[a-f0-9]{64}$/)
assert.equal(combinedRevision,await voiceSourceRevision((await loadTrack(preparedRange.id)).sourceProvenance,(await loadTrack(prepared.id)).sourceProvenance))
for(const source of [null,{}, {...preparedRange.sourceProvenance,purpose:'project-track'}]) assert.equal(await voiceSourceRevision(source,prepared.sourceProvenance),null)
assert.notEqual(combinedRevision,await voiceSourceRevision({...preparedRange.sourceProvenance,revision:'new-measurement'},prepared.sourceProvenance))
assert.notEqual(combinedRevision,await voiceSourceRevision(preparedRange.sourceProvenance,{...prepared.sourceProvenance,audioSha256:'f'.repeat(64)}))
assert.notEqual(combinedRevision,await voiceSourceRevision(preparedRange.sourceProvenance,{...prepared.sourceProvenance,analysisVersion:'new-extractor'}))
const rangeSnapshot=structuredClone(preparedRange.sourceProvenance)
const pendingRevision=voiceSourceRevision(rangeSnapshot,prepared.sourceProvenance)
rangeSnapshot.revision='changed-during-await'
assert.equal(await pendingRevision,combinedRevision)
console.log('Measured voice source-set revision: same persisted sources reproduce, source/revision/analysis changes separate, legacy unknown and immutable hash input passed; no graphic update policy.')
