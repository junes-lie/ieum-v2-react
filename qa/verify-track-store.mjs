import assert from 'node:assert/strict'
import {saveTrack,loadTrack,loadProjectTracks,deleteTrack,clearProjectTracks} from '../src/trackStore.js'

let closed=0, mode='complete'
const originalError = new Error('simulated quota failure')
globalThis.indexedDB={open(){
  const request={}
  request.result={close(){closed++},transaction(_name,access){
    if(mode==='throw') throw originalError
    const tx={error:null,objectStore(){return {
      get(){return {result:{id:'a',projectId:'p'}}},getAll(){return {result:[{id:'a',projectId:'p'}]}},put(){},delete(){}
    }}}
    queueMicrotask(()=>{
      if(mode==='abort' || mode==='error' || (mode==='clear-abort' && access==='readwrite')) {
        tx.error=originalError
        if(mode==='error')tx.onerror?.(); else tx.onabort?.()
      } else tx.oncomplete?.()
    })
    return tx
  }}
  queueMicrotask(()=>request.onsuccess?.())
  return request
}}
const operations=[()=>saveTrack({id:'a',projectId:'p'}),()=>loadTrack('a'),()=>loadProjectTracks('p'),()=>deleteTrack('a')]
for(const action of operations) for(const outcome of ['complete','abort','error','throw']) {
  mode=outcome
  const before=closed
  if(mode==='complete') await action(); else await assert.rejects(action,error=>error===originalError)
  assert.equal(closed,before+1,'Every opened connection closes, including error/abort/synchronous transaction failure')
}
mode='clear-abort'
const before=closed
await assert.rejects(()=>clearProjectTracks('p'),error=>error===originalError)
assert.equal(closed,before+2,'Read and aborted cleanup connections both close')
console.log('Track store: success/error/abort/transaction-throw closes all connections; cleanup abort rejects original error.')
