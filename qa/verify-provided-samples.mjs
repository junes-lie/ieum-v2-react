import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
const samples=JSON.parse(await readFile(new URL('../src/providedSamples.json',import.meta.url),'utf8'))
const baseUrl=process.env.IEUM_QA_URL||'http://127.0.0.1:4195/'
assert.equal(samples.length,3,'VP03 provided sample bundle has three actual excerpts')
assert.equal(new Set(samples.map(song=>song.id)).size,samples.length)
for(const song of samples){
 assert.equal(song.provenance.clipValidation?.passed,true,'Each installed excerpt needs its own actual ASR validation')
 assert.ok(song.provenance.clipValidation.similarity>=.8)
 assert.equal(song.provenance.clipValidation.timestampsWithinAudio,true)
 assert.ok(song.duration>=15&&song.duration<=20)
 assert.ok(song.lyrics.length>0)
 assert.ok(song.lyrics.every((line,i)=>line.time>=0&&line.time<song.duration&&(!i||line.time>song.lyrics[i-1].time)))
 for(const [file,hash] of [[song.audioFile,song.provenance.audioSha256],[song.backingFile,song.provenance.backingSha256]]){
  const bytes=await readFile(new URL('../public'+file,import.meta.url))
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash)
  const response=await fetch(new URL(file,baseUrl),{signal:AbortSignal.timeout(30000)})
  assert.equal(response.status,200)
  assert.equal(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'),hash,'Served audio must match the verified asset')
 }
}
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']})
try{
 const context=await browser.newContext({permissions:['microphone']})
 await context.addInitScript(()=>{
  window.qaMicRequests=0
  const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
  navigator.mediaDevices.getUserMedia=(...args)=>{window.qaMicRequests++;return get(...args)}
 })
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto(baseUrl)
 await page.waitForFunction(()=>window.__IEUM_V2__?.state)
 await page.locator('[data-nav="user"]').click()
 // Existing range/profile setup is supplied in isolated QA storage, never a user session.
 await page.evaluate(async()=>{
  const id='ieum-v2:voice-profile:v7',blob=await(await fetch('/demo-stems/soprano.wav')).blob()
  const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)})
  await new Promise(resolve=>{const tx=db.transaction('tracks','readwrite'),s=tx.objectStore('tracks');s.put({id:id+':range',projectId:id,kind:'voice-range',range:'C3–G4',rangeData:{lowMidi:48,highMidi:67,label:'C3–G4'}});s.put({id:id+':sample',projectId:id,kind:'voice-sample',blob,duration:7,songLabel:'Protected original sample'});tx.oncomplete=resolve});db.close()
 })
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.sampleSong==='Protected original sample')
 await page.locator('[data-nav="user"]').click()
 await page.getByRole('button',{name:'다시 등록',exact:true}).click()
 await page.waitForSelector('.sample-song-list')
 assert.equal(await page.locator('.sample-song-list button').count(),samples.length)
 for(let i=0;i<samples.length;i++){
  await page.locator('.sample-song-list button').nth(i).click()
  await page.waitForFunction(file=>document.querySelector('.sample-select-stage audio')?.getAttribute('src')===file,samples[i].audioFile)
  await page.waitForFunction(()=>document.querySelector('.sample-select-stage audio')?.readyState>=1)
  const state=await page.locator('.sample-select-stage audio').evaluate(audio=>({paused:audio.paused,time:audio.currentTime,duration:audio.duration}))
  assert.equal(state.paused,true)
  assert.ok(state.time<.2)
  assert.ok(Math.abs(state.duration-samples[i].duration)<.15)
  await page.locator('.sample-select-stage .play-btn').click()
  await page.waitForFunction(()=>document.querySelector('.sample-select-stage audio')?.currentTime>.2)
 }
 await page.locator('.sample-song-list button').first().click()
 await page.locator('.sample-select-stage .play-btn').click()
 await page.waitForFunction(()=>document.querySelector('.sample-select-stage audio')?.currentTime>.2)
 await page.evaluate(()=>{window.qaPreviousPreview=document.querySelector('.sample-select-stage audio')})
 await page.locator('.sample-select-stage > button.primary').click()
 assert.equal(await page.evaluate(()=>window.qaPreviousPreview.paused),true,'Provided vocal preview must stop before opening microphone recording')
 const first=samples[0]
 let release,requested
 const held=new Promise(resolve=>{release=resolve}),seen=new Promise(resolve=>{requested=resolve})
 await page.route('**'+first.backingFile,async route=>{requested();await held;await route.continue()})
 await page.locator('[data-action="sample-start"]').click();await seen
 await page.locator('[data-nav="home"]').click();release()
 await page.waitForTimeout(1000)
 assert.equal(await page.evaluate(()=>window.qaMicRequests),0,'Leaving during audio loading must not start a microphone after unmount')
 await page.unroute('**'+first.backingFile)
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.sampleSong==='Protected original sample')
 await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click()
 await page.locator('.sample-select-stage > button.primary').click()
 await page.evaluate(()=>{
  const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
  navigator.mediaDevices.getUserMedia=async(...args)=>{window.qaPendingMic=true;await new Promise(resolve=>{window.qaReleaseMic=resolve});const stream=await get(...args);window.qaReturnedMic=stream;return stream}
 })
 await page.locator('[data-action="sample-start"]').click();await page.waitForFunction(()=>window.qaPendingMic)
 await page.locator('[data-nav="home"]').click();await page.evaluate(()=>window.qaReleaseMic())
 await page.waitForFunction(()=>window.qaMicRequests===1)
 await page.waitForFunction(()=>window.qaReturnedMic?.getTracks().every(track=>track.readyState==='ended'))
 assert.equal(await page.evaluate(()=>Boolean(window.__IEUM_V2__.audioRuntime.stream?.active)),false,'Leaving during permission resolution must release a late microphone stream')
 assert.notEqual(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recorder?.state),'recording')
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.sampleSong==='Protected original sample')
 await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click()
 await page.locator('.sample-select-stage > button.primary').click()
 await page.evaluate(()=>{
  const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
  let attempts=0
  navigator.mediaDevices.getUserMedia=async(...args)=>{
   const number=++attempts
   if(number===1){window.qaOldMicPending=true;await new Promise(resolve=>{window.qaReleaseOldMic=resolve})}
   const stream=await get(...args)
   if(number===1)window.qaOldMicStream=stream;else window.qaNewMicStream=stream
   return stream
  }
 })
 await page.locator('[data-action="sample-start"]').click();await page.waitForFunction(()=>window.qaOldMicPending)
 await page.locator('[data-nav="home"]').click()
 await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click()
 await page.locator('.sample-select-stage > button.primary').click()
 await page.locator('[data-action="sample-start"]').click();await page.waitForSelector('[data-action="sample-stop"]')
 await page.evaluate(()=>window.qaReleaseOldMic())
 await page.waitForFunction(()=>window.qaOldMicStream?.getTracks().every(track=>track.readyState==='ended'))
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recorder?.state),'recording','A stale permission response must not cancel the new Take')
 assert.equal(await page.evaluate(()=>window.qaNewMicStream.getTracks().every(track=>track.readyState==='live')),true)
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.sampleSong==='Protected original sample')
 await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click()
 await page.locator('.sample-select-stage > button.primary').click()
 await page.evaluate(()=>{
  const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
  let attempts=0
  navigator.mediaDevices.getUserMedia=async(...args)=>{
   const number=++attempts
   if(number===1)await new Promise(resolve=>{window.qaReleaseTimedOutMic=resolve})
   const stream=await get(...args)
   if(number===1)window.qaTimedOutMicStream=stream
   return stream
  }
 })
 await page.locator('[data-action="sample-start"]').click()
 await page.locator('.permission-error').waitFor()
 assert.ok((await page.locator('.permission-error').textContent()).includes('마이크 권한 응답이 없습니다'))
 await page.locator('[data-action="sample-start"]').click();await page.waitForSelector('[data-action="sample-stop"]')
 await page.evaluate(()=>window.qaReleaseTimedOutMic())
 await page.waitForFunction(()=>window.qaTimedOutMicStream)
 assert.equal(await page.evaluate(()=>window.qaTimedOutMicStream.getTracks().every(track=>track.readyState==='ended')),true,'A permission response after timeout must release only its own late stream')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recorder?.state),'recording')
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.sampleSong==='Protected original sample')
 await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click()
 await page.locator('.sample-select-stage > button.primary').click()
 await page.route('**'+first.backingFile,route=>route.fulfill({status:503,body:'QA backing unavailable'}))
 await page.locator('[data-action="sample-start"]').click()
 await page.getByRole('alert').waitFor()
 assert.equal(await page.evaluate(()=>window.qaMicRequests),0,'Unavailable backing must fail before microphone capture')
 await page.unroute('**'+first.backingFile)
 await page.route('**'+first.backingFile,route=>route.fulfill({status:200,contentType:'audio/mpeg',body:'QA mismatched audio'}))
 await page.locator('[data-action="sample-start"]').click()
 await page.getByRole('alert').waitFor()
 assert.equal(await page.evaluate(()=>window.qaMicRequests),0,'Mismatched backing must fail before microphone capture')
 await page.unroute('**'+first.backingFile)
 await page.locator('[data-action="sample-start"]').click()
 await page.waitForSelector('[data-action="sample-stop"]')
 assert.equal(await page.evaluate(()=>window.qaMicRequests),1)
 const backingDuration=await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recordingGuideState.decodedBacking.duration)
 assert.ok(Math.abs(backingDuration-first.duration)<.15)
 await page.waitForTimeout(1600)
 const before=await page.evaluate(()=>{const r=window.__IEUM_V2__.audioRuntime;return r.activeElapsedSec+r.context.currentTime-r.activeStartedAt})
 await page.getByRole('checkbox',{name:'Sample Guide 반주'}).uncheck()
 await page.waitForTimeout(300)
 await page.getByRole('checkbox',{name:'Sample Guide 반주'}).check()
 await page.waitForTimeout(1600)
 const after=await page.evaluate(()=>{const r=window.__IEUM_V2__.audioRuntime;return r.activeElapsedSec+r.context.currentTime-r.activeStartedAt})
 assert.ok(after>before+1,`Guide toggle must not reset or pause the Take clock: ${before} -> ${after}`)
 if(first.lyrics.length>1){
  await page.waitForFunction(time=>{const r=window.__IEUM_V2__.audioRuntime;return r.activeElapsedSec+r.context.currentTime-r.activeStartedAt>time+.2},first.lyrics[1].time)
  assert.ok((await page.locator('[data-sample-lyric]').textContent()).includes(first.lyrics[1].text))
 }
 await page.waitForFunction(duration=>{const r=window.__IEUM_V2__.audioRuntime;return r.activeElapsedSec+r.context.currentTime-r.activeStartedAt>=duration},first.duration)
 await page.locator('[data-action="sample-stop"]').click()
 await page.waitForSelector('[data-action="voice-complete"]')
 assert.ok(await page.locator('.sample-stage audio').getAttribute('src'))
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile.sampleSong),'Protected original sample')
 for(let i=1;i<samples.length;i++){
  await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.sampleSong==='Protected original sample')
  await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click()
  await page.locator('.sample-song-list button').nth(i).click()
  await page.locator('.sample-select-stage > button.primary').click()
  await page.locator('[data-action="sample-start"]').click();await page.waitForSelector('[data-action="sample-stop"]')
  const duration=await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recordingGuideState.decodedBacking.duration)
  assert.ok(Math.abs(duration-samples[i].duration)<.15)
  if(samples[i].lyrics.length>1){
   await page.waitForFunction(time=>{const r=window.__IEUM_V2__.audioRuntime;return r.activeElapsedSec+r.context.currentTime-r.activeStartedAt>time+.2},samples[i].lyrics[1].time)
   assert.ok((await page.locator('[data-sample-lyric]').textContent()).includes(samples[i].lyrics[1].text))
  }
  await page.waitForFunction(duration=>{const r=window.__IEUM_V2__.audioRuntime;return r.activeElapsedSec+r.context.currentTime-r.activeStartedAt>=duration},samples[i].duration)
  await page.locator('[data-action="sample-stop"]').click();await page.waitForSelector('[data-action="voice-complete"]')
  assert.ok(await page.locator('.sample-stage audio').getAttribute('src'))
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile.sampleSong),'Protected original sample')
 }
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,samples:samples.length,assetHashes:true,preview:true,allProvidedGuides:true,stalePermissionKeepsNewTake:true,leaveDuringLoadingReleasesCapture:true,missingAndMismatchedBackingRejectedBeforeMicrophone:true,retry:true,guideToggle:true,actualBackingDuration:backingDuration,lyricTimeline:true,fullSpecifiedTake:true,recordedTake:true,clockBeforeToggle:before,limits:'Isolated synthetic microphone; pronunciation, acoustic Guide leakage and physical-device acceptance remain pending.'}))
 await context.close()
}finally{await browser.close()}
