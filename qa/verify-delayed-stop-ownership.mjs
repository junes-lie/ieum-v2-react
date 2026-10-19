import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try{
 const context=await browser.newContext({permissions:['microphone']}),page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await context.addInitScript(()=>{
  const add=MediaRecorder.prototype.addEventListener
  MediaRecorder.prototype.addEventListener=function(type,handler,options){
   if(window.qaHoldStop && type==='stop' && options?.once){window.qaReleaseStop=()=>handler(new Event('stop'));return}
   return add.call(this,type,handler,options)
  }
 })
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/')
 await page.waitForFunction(()=>window.__IEUM_V2__?.state)
 await page.evaluate(async()=>{
  const id='ieum-v2:voice-profile:v7',blob=await(await fetch('/demo-stems/soprano.wav')).blob()
  const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)})
  await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite'),s=tx.objectStore('tracks');s.put({id:id+':range',projectId:id,kind:'voice-range',range:'C3–G4',rangeData:{lowMidi:48,highMidi:67}});s.put({id:id+':sample',projectId:id,kind:'voice-sample',blob,duration:7,songLabel:'Protected Sample'});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});db.close()
 })
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__.state.profile?.sampleSong==='Protected Sample')
 const openSample=async()=>{await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click();await page.locator('.sample-select-stage > button.primary').click();await page.locator('[data-action="sample-start"]').click();await page.waitForSelector('[data-action="sample-stop"]')}
 await openSample();await page.waitForTimeout(3200);await page.evaluate(()=>{window.qaHoldStop=true})
 await page.locator('[data-action="sample-stop"]').click();await page.waitForFunction(()=>typeof window.qaReleaseStop==='function')
 await page.locator('[data-nav="user"]').click();await page.waitForSelector('.my-voice-details')
 await page.evaluate(()=>{window.qaHoldStop=false})
 await openSample();await page.waitForFunction(()=>window.__IEUM_V2__.audioRuntime.chunks.length>0)
 await page.evaluate(()=>{const r=window.__IEUM_V2__.audioRuntime;window.qaNewRecorder=r.recorder;window.qaNewChunks=r.chunks;window.qaExpectedNewChunks=[...r.chunks];r.recorder.addEventListener('dataavailable',event=>{if(event.data.size)window.qaExpectedNewChunks.push(event.data)});window.qaReleaseStop()})
 await page.waitForTimeout(100)
 const after=await page.evaluate(()=>{const r=window.__IEUM_V2__.audioRuntime;return {sameRecorder:r.recorder===window.qaNewRecorder,sameChunks:r.chunks===window.qaNewChunks,active:r.recordingSegmentActive,guide:!!r.recordingGuideState,count:r.chunks.length}})
 assert.equal(after.sameRecorder,true)
 assert.equal(after.sameChunks,true,'A late old stop must not clear or replace the new Take collector')
 assert.equal(after.active,true,'A late old stop must not close the new timeline segment')
 assert.equal(after.guide,true,'A late old stop must not stop new Guide playback')
 assert.ok(after.count>0)
 await page.waitForTimeout(3400);await page.locator('[data-action="sample-stop"]').click();await page.waitForSelector('[data-action="voice-complete"]')
 assert.ok(await page.locator('.sample-stage audio').getAttribute('src'))
 const hashes=await page.evaluate(async()=>{const hash=async blob=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].join(',');return {expected:await hash(new Blob(window.qaExpectedNewChunks)),actual:await hash(await(await fetch(document.querySelector('.sample-stage audio').src)).blob())}})
 assert.equal(hashes.actual,hashes.expected,'Review must contain exactly the new Take bytes, without discarded or missing chunks')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile.sampleSong),'Protected Sample')
 assert.deepEqual(errors,[])
 console.log('PASS delayed discarded Sample stop cannot mutate new recorder/chunks/timeline/Guide; new Take reaches Review and existing Profile stays intact. Synthetic microphone only.')
 await context.close()
}finally{await browser.close()}
