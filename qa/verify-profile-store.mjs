import assert from 'node:assert/strict'
import {indexedDB,IDBObjectStore} from 'fake-indexeddb'
import {saveTracks,loadTrack} from '../src/trackStore.js'
globalThis.indexedDB=indexedDB
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
