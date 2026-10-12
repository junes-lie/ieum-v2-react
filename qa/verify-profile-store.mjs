import assert from 'node:assert/strict'
import {indexedDB,IDBObjectStore} from 'fake-indexeddb'
import {saveTracks,loadTrack} from '../src/trackStore.js'
import {prepareVoiceSampleRecord} from '../src/profileSource.js'
globalThis.indexedDB=indexedDB
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
