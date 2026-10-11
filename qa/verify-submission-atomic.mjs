import assert from 'node:assert/strict'
import {indexedDB,IDBObjectStore} from 'fake-indexeddb'
import {saveTrack,saveSubmittedTrack,loadTrack} from '../src/trackStore.js'

globalThis.indexedDB=indexedDB
const candidate=(name,partId='lead')=>({id:`qa-submission:${partId}`,projectId:'qa-submission',partId,participantId:'qa-user',origin:'live-microphone-recording',blob:new Blob([name]),createdAt:name})
for(const names of [['first','second'],['third','fourth']]) {
  const tracks=names.map(name=>candidate(name))
  const results=await Promise.all(tracks.map(saveSubmittedTrack))
  const persisted=await loadTrack(tracks[0].id)
  assert.equal(await persisted.blob.text(),'first')
  for(const result of results)assert.equal(await result.blob.text(),'first','Concurrent and repeated submissions return the committed original')
}
await Promise.all(['second-part','third-part','fourth-part'].map(part=>saveSubmittedTrack(candidate(part,part))))
for(const part of ['second-part','third-part','fourth-part'])assert.equal(await (await loadTrack(`qa-submission:${part}`)).blob.text(),part)
await saveTrack({...candidate('bootstrap','demo'),origin:'local-formant-singing-demo'})
assert.equal(await (await saveSubmittedTrack(candidate('real-take','demo'))).blob.text(),'real-take','A first real submission may replace the existing demo')

const nativePut=IDBObjectStore.prototype.put
IDBObjectStore.prototype.put=function(value,...args){if(value.id==='qa-submission:failed')throw new Error('QA write failure');return nativePut.call(this,value,...args)}
try {await assert.rejects(saveSubmittedTrack(candidate('must-not-commit','failed')),/QA write failure/)}finally{IDBObjectStore.prototype.put=nativePut}
assert.equal(await loadTrack('qa-submission:failed'),null)
assert.equal(await (await loadTrack('qa-submission:lead')).blob.text(),'first','Failed submission cannot damage another Part')
assert.equal(await (await saveSubmittedTrack(candidate('retry','failed'))).blob.text(),'retry')
await assert.rejects(saveSubmittedTrack({...candidate('invalid'),id:'other-id'}),/프로젝트·Part/)
await assert.rejects(saveSubmittedTrack({...candidate('invalid'),blob:new Blob([])}),/프로젝트·Part/)
console.log('PASS: atomic first submission, concurrent/repeated original preservation, independent Parts, first real demo replacement, write abort/no commit and retry; fake IndexedDB, not shared server proof')

if(process.env.IEUM_QA_SOURCE_URL) {
  const {createRequire}=await import('node:module')
  const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
  const {chromium}=require('playwright')
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
  try {
    const context=await browser.newContext(),pages=await Promise.all([context.newPage(),context.newPage()])
    await Promise.all(pages.map(page=>page.goto(process.env.IEUM_QA_SOURCE_URL)))
    await pages[0].evaluate(async()=>{
      const {saveTrack}=await import('/src/trackStore.js')
      await saveTrack({id:'qa-owner:qa-native-submit:lead:temporary-recording',projectId:'qa-native-submit',partId:'lead',kind:'temporary-recording',blob:new Blob(['draft-original'])})
    })
    const submit=(page,label)=>page.evaluate(async label=>{
      const {saveSubmittedTrack}=await import('/src/trackStore.js')
      const result=await saveSubmittedTrack({id:'qa-native-submit:lead',projectId:'qa-native-submit',partId:'lead',participantId:'qa-owner',origin:'live-microphone-recording',blob:new Blob([label])})
      return result.blob.text()
    },label)
    const results=await Promise.all(pages.map((page,index)=>submit(page,`tab-${index}`)))
    assert.equal(results[0],results[1],'Two native IndexedDB connections must return the same committed original')
    assert.equal(await submit(pages[1],'retry-after-race'),results[0])
    const preserved=await pages[0].evaluate(async()=>{
      const {loadTrack}=await import('/src/trackStore.js')
      return {track:await (await loadTrack('qa-native-submit:lead')).blob.text(),draft:await (await loadTrack('qa-owner:qa-native-submit:lead:temporary-recording')).blob.text()}
    })
    assert.equal(preserved.track,results[0]);assert.equal(preserved.draft,'draft-original')
    console.log(JSON.stringify({passed:true,nativeTwoTabSubmission:true,...preserved,limits:'Isolated same-device IndexedDB; no multi-user server or physical microphone claim'}))
  } finally {await browser.close()}
}
