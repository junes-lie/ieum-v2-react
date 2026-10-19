import assert from 'node:assert/strict'
import {indexedDB,IDBObjectStore} from 'fake-indexeddb'
import {saveTrack,loadTrack,deleteRecordingDraft} from '../src/trackStore.js'
globalThis.indexedDB=indexedDB
const scope={userId:'me',projectId:'project',partId:'tenor'}
const legacy='project:tenor:temporary-recording',current=`me:${legacy}`
const draft=(id,userId)=>({id,projectId:'project',partId:'tenor',kind:'temporary-recording',userId,blob:new Blob(['original Take'])})
await saveTrack(draft(legacy));await saveTrack(draft(current,'me'))
const originalDelete=IDBObjectStore.prototype.delete
try {
 IDBObjectStore.prototype.delete=function(id){if(id===legacy)throw new Error('QA legacy cleanup failure');return originalDelete.call(this,id)}
 await assert.rejects(()=>deleteRecordingDraft(scope),/QA legacy cleanup failure/)
 assert.equal(await (await loadTrack(current)).blob.text(),'original Take')
 assert.equal(await (await loadTrack(legacy)).blob.text(),'original Take')
} finally {IDBObjectStore.prototype.delete=originalDelete}
await deleteRecordingDraft(scope)
assert.equal(await loadTrack(current),null);assert.equal(await loadTrack(legacy),null)
await saveTrack(draft(current,'me'));await saveTrack(draft(legacy,'other'))
await deleteRecordingDraft(scope)
assert.equal(await loadTrack(current),null)
assert.equal((await loadTrack(legacy)).userId,'other')
await saveTrack({...draft(current,'me'),kind:'voice-sample'})
await deleteRecordingDraft(scope)
assert.equal((await loadTrack(current)).kind,'voice-sample')
await assert.rejects(()=>deleteRecordingDraft({...scope,userId:null}))
console.log('Draft cleanup: atomic rollback preserves both original Blobs; owned current/legacy keys clear together; other owner and non-draft records stay intact.')
