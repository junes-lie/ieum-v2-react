import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4253'
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-music-recovery'
await mkdir(output,{recursive:true})
let server,browser
const results=[]
try {
 if(!process.env.IEUM_BASE_URL){
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4253','--strictPort'],{stdio:['ignore','pipe','inherit']})
  await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})
 }
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']})
 for(const width of (process.env.IEUM_QA_WIDTHS||'390,430').split(',').map(Number)){
  const context=await browser.newContext({viewport:{width,height:932},permissions:['microphone'],reducedMotion:'reduce'})
  await context.addInitScript(()=>{
   window.qaMicRequests=0;window.qaStreams=[]
   const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
   navigator.mediaDevices.getUserMedia=async(...args)=>{
    window.qaMicRequests++
    if(window.qaDenyMic)throw new DOMException('QA microphone denied','NotAllowedError')
    await new Promise(r=>setTimeout(r,100))
    const stream=await get(...args);window.qaStreams.push(stream);return stream
   }
   const put=IDBObjectStore.prototype.put
   IDBObjectStore.prototype.put=function(value,...args){
    if(value.kind==='auto-mix'){window.qaMixWrites=(window.qaMixWrites||0)+1;if(window.qaRejectMix)throw Error('QA mix storage failure')}
    if(window.qaRejectSubmission&&value.origin==='live-microphone-recording')throw Error('QA submission storage failure')
    if(window.qaRejectDraft&&value.kind==='temporary-recording')throw Error('QA draft storage failure')
    return put.call(this,value,...args)
   }
  })
  const page=await context.newPage();page.setDefaultTimeout(15000)
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  const state=()=>page.evaluate(()=>({tracks:Object.keys(window.__IEUM_V2__.state.activeTracks).length,mix:!!window.__IEUM_V2__.state.activeMix,streams:window.qaStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))}))
  const hash=async()=>{await page.waitForSelector('.record-review audio',{state:'attached'});return page.evaluate(async()=>{
   const app=window.__IEUM_V2__
   let blob=app.audioRuntime.recordingBlob
   if(!blob){
    const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('ieum-v2-demo-records:music');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})
    try{const rows=await new Promise((resolve,reject)=>{const q=db.transaction('tracks').objectStore('tracks').getAll();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});blob=rows.find(t=>t.kind==='temporary-recording'&&t.partId===app.state.activeProject.ownerPartId)?.blob}finally{db.close()}
   }
   if(!blob?.size)throw Error('Original microphone Take missing')
   if(!(await fetch(document.querySelector('.record-review audio').src)).ok)throw Error('Review URL no longer playable')
   return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('')
  })}
  const enter=async()=>{await page.locator('[data-action="record-part"]').click();await page.waitForSelector('[data-action="record-start"]:enabled')}
  await page.goto(base+'/?scene=music-a');await page.waitForSelector('.workspace-v2-screen');await enter()
  assert.equal(await page.evaluate(()=>window.qaMicRequests),0,'Entering Recording never opens microphone')
  await page.evaluate(()=>window.qaDenyMic=true)
  await page.locator('[data-action="record-start"]').click();await page.waitForSelector('.permission-error')
  assert.equal(await page.locator('[data-action="record-submit"]').count(),0)
  assert.deepEqual(await state(),{tracks:0,mix:false,streams:true})
  await page.evaluate(()=>window.qaDenyMic=false)
  await page.locator('[data-action="record-start"]').evaluate(n=>{n.click();n.click()})
  await page.waitForSelector('[data-action="record-pause"]')
  assert.equal(await page.evaluate(()=>window.qaMicRequests),2,'Double Start only opens one new stream after denial')
  await page.waitForTimeout(1200)
  await page.locator('[data-action="record-stop"]').evaluate(n=>{n.click();n.click()})
  await page.waitForSelector('[data-action="record-submit"]');await page.waitForSelector('.record-review audio',{state:'attached'})
  const firstHash=await hash();assert.equal((await state()).streams,true)
  results.push({width,pass:'permission-denial-and-concurrent-start-stop',original:firstHash})
  console.log('PASS',width,'denial/retry, no mount acquisition, double Start/Stop and released microphone')

  // Review leaves and reloads through real IndexedDB; no seeded Track or fake completion.
  await page.locator('.recording-screen [data-action="back"]').click();await page.waitForSelector('.workspace-v2-screen')
  assert.equal((await state()).tracks,0)
  await page.reload();await page.waitForSelector('.workspace-v2-screen')
  await page.locator('[data-action="record-part"]').click();await page.waitForSelector('[data-action="record-submit"]')
  assert.equal(await hash(),firstHash,'Reload must restore exact microphone original')
  assert.equal(await page.evaluate(()=>window.qaMicRequests),0,'Restoring Review does not acquire microphone')
  await page.evaluate(()=>window.qaRejectSubmission=true)
  await page.locator('[data-action="record-submit"]').click();await page.waitForSelector('.permission-error')
  assert.equal(await hash(),firstHash);assert.equal((await state()).tracks,0)
  await page.evaluate(()=>window.qaRejectSubmission=false)
  await page.locator('[data-action="record-submit"]').evaluate(n=>{n.click();n.click()})
  await page.waitForSelector('.workspace-v2-screen')
  const submitted=await page.evaluate(async()=>{const t=window.__IEUM_V2__.state.activeTracks['voice-a'];return {hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await t.blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join(''),ref:t.audioSourceRef}})
  assert.equal(submitted.hash,firstHash);assert.equal((await state()).tracks,1);assert.equal((await state()).mix,false)
  results.push({width,pass:'draft-reload-failed-submit-retry',source:submitted.ref})
  console.log('PASS',width,'draft reload, failed submission keeps exact original, double retry submits one Track without premature Mix')

  // B remains empty; a failed draft write must retain the in-memory Take.
  await page.goto(base+'/?scene=music-b');await page.waitForSelector('.workspace-v2-screen');await enter()
  await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]')
  await page.waitForFunction(()=>window.__IEUM_V2__.audioRuntime.chunks.length>0)
  await page.evaluate(()=>{const r=window.__IEUM_V2__.audioRuntime;window.qaOldCallback=r.recorder.ondataavailable;window.qaOldChunk=r.chunks[0]})
  await page.getByRole('button',{name:'다시 녹음',exact:true}).click();await page.locator('[data-action="confirm-retry"]').click()
  await page.waitForSelector('[data-action="record-start"]:enabled')
  await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]')
  const isolated=await page.evaluate(()=>{const r=window.__IEUM_V2__.audioRuntime,n=r.chunks.length;window.qaOldCallback({data:window.qaOldChunk});return {sameCount:r.chunks.length===n,oldAbsent:!r.chunks.includes(window.qaOldChunk)}})
  assert.deepEqual(isolated,{sameCount:true,oldAbsent:true})
  results.push({width,pass:'retake-ignores-late-discarded-recorder-chunks'})
  console.log('PASS',width,'retake acquires a new session and ignores late bytes from discarded Take')
  await page.waitForTimeout(1200);await page.locator('[data-action="record-pause"]').click()
  await page.evaluate(()=>window.qaRejectDraft=true)
  await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('[data-action="record-submit"]');await page.waitForSelector('.permission-error')
  const secondHash=await hash();assert.equal((await state()).tracks,1);assert.equal((await state()).streams,true)
  await page.locator('.recording-screen [data-action="back"]').click()
  assert.equal(await page.locator('[data-action="record-submit"]').count(),1,'Failed draft write must prevent navigation/data loss')
  assert.equal(await hash(),secondHash)
  await page.evaluate(()=>window.qaRejectDraft=false)
  await page.locator('.recording-screen [data-action="back"]').click();await page.waitForSelector('.workspace-v2-screen')
  await page.reload();await page.waitForSelector('.workspace-v2-screen');await page.locator('[data-action="record-part"]').click();await page.waitForSelector('[data-action="record-submit"]')
  assert.equal(await hash(),secondHash)
  results.push({width,pass:'paused-stop-failed-draft-navigation-retry',original:secondHash})
  console.log('PASS',width,'paused Stop, failed draft write prevents data loss, save retry and exact B restoration')
  await page.screenshot({path:`${output}/recovered-review-${width}.png`})
  await page.evaluate(()=>window.qaRejectMix=true)
  await page.locator('[data-action="record-submit"]').click();await page.waitForSelector('.mix-error')
  assert.equal(await page.locator('.complete-screen').count(),0)
  assert.equal((await state()).tracks,2);assert.equal((await state()).mix,false)
  const tracksBefore=await page.evaluate(async()=>Promise.all(Object.values(window.__IEUM_V2__.state.activeTracks).map(async t=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await t.blob.arrayBuffer()))).join(','))))
  assert.equal(await page.evaluate(()=>window.qaMixWrites),1,'A failed Mix does not retry itself in a loop')
  await page.evaluate(()=>window.qaRejectMix=false)
  await page.locator('[data-action="retry-auto-mix"]').evaluate(n=>{n.click();n.click()})
  await page.waitForSelector('.complete-screen')
  assert.equal(await page.evaluate(()=>window.qaMixWrites),2,'Double retry creates one successful Mix')
  const tracksAfter=await page.evaluate(async()=>Promise.all(Object.values(window.__IEUM_V2__.state.activeTracks).map(async t=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await t.blob.arrayBuffer()))).join(','))))
  assert.deepEqual(tracksAfter,tracksBefore)
  const duration=await page.evaluate(async()=>{const c=new AudioContext();try{return (await c.decodeAudioData(await window.__IEUM_V2__.state.activeMix.blob.arrayBuffer())).duration}finally{await c.close()}})
  assert.ok(Math.abs(duration-22)<.01)
  results.push({width,pass:'failed-auto-mix-keeps-two-originals-and-single-retry',duration})
  console.log('PASS',width,'failed Auto Mix preserves both originals, no false completion or retry loop, double retry creates one 22s Mix')
  assert.deepEqual(errors,[]);await context.close()
 }
 await writeFile(`${output}/results.json`,JSON.stringify({results,limits:'Synthetic microphone; no physical microphone, listening or live multi-user acceptance.'},null,2))
} finally {await browser?.close();server?.kill()}
