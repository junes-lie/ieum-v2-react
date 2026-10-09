import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
const samples=JSON.parse(await readFile(new URL('../src/providedSamples.json',import.meta.url),'utf8'))
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const target=new URL(process.env.IEUM_QA_URL || 'http://127.0.0.1:4196/');target.searchParams.set('design','figma')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']})
const results=[]
try {
 for(const [index,song] of samples.entries()){
  const context=await browser.newContext({permissions:['microphone']}),page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.addInitScript(()=>{
   window.qaMicRequests=0
   const micRequest=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
   navigator.mediaDevices.getUserMedia=(...args)=>{window.qaMicRequests++;return micRequest(...args)}
   window.qaBackingStarts=[]
   window.qaRecordingStarts=0
   window.qaRecordingClock=null
   const recordStart=MediaRecorder.prototype.start
   MediaRecorder.prototype.start=function(...args){window.qaRecordingStarts++;window.qaRecordingClock=window.qaAudioContext?.currentTime;return recordStart.apply(this,args)}
   const original=AudioContext.prototype.createBufferSource
   AudioContext.prototype.createBufferSource=function(){
    window.qaAudioContext=this
    const audioContext=this
    const source=original.call(this),connect=source.connect.bind(source),start=source.start.bind(source)
    let gainNode
    source.connect=(node,...args)=>{if(node.gain)gainNode=node;return connect(node,...args)}
    source.start=(time,offset)=>{
     const buffer=source.buffer;let square=0,peak=0,count=0
     for(let channel=0;channel<buffer.numberOfChannels;channel++)for(const value of buffer.getChannelData(channel)){square+=value*value;peak=Math.max(peak,Math.abs(value));count++}
     window.qaBackingStarts.push({at:time,scheduledFrom:audioContext.currentTime,gain:gainNode?.gain.value,rms:Math.sqrt(square/count),peak,duration:buffer.duration,offset})
     return start(time,offset)
    }
    return source
   }
  })
  await page.goto(target.href);await page.waitForFunction(()=>window.__IEUM_V2__?.state)
  await page.evaluate(async()=>{
   const id='ieum-v2:voice-profile:v7',blob=await(await fetch('/demo-stems/soprano.wav')).blob()
   const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)})
   await new Promise(resolve=>{const tx=db.transaction('tracks','readwrite'),s=tx.objectStore('tracks');s.put({id:id+':range',projectId:id,kind:'voice-range',range:'C3–G4',rangeData:{lowMidi:48,highMidi:67,label:'C3–G4'}});s.put({id:id+':sample',projectId:id,kind:'voice-sample',blob,duration:7,songLabel:'Protected original sample'});tx.oncomplete=resolve});db.close()
  })
  await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state.profile?.sampleSong==='Protected original sample')
  await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click()
  await page.locator('.sample-song-list button').nth(index).click();await page.locator('.sample-select-stage > button.primary').click()
  if(index===0){
   for(const status of [503,200]){
    await page.route('**'+song.leadInFile,route=>route.fulfill({status,body:status===503?'Unavailable preparation':'Wrong preparation hash'}))
    await page.locator('[data-action="sample-start"]').click()
    await page.getByRole('alert').waitFor()
    assert.equal(await page.evaluate(()=>window.qaMicRequests),0,'Unavailable/mismatched preparation must fail before microphone access')
    await page.unroute('**'+song.leadInFile)
   }
  }
  await page.locator('[data-action="sample-start"]').click()
  await page.waitForFunction(()=>document.querySelector('[data-sample-entry]')?.textContent.includes('녹음 준비'))
  for(const remaining of [3,2,1]){
   await page.waitForFunction(value=>document.querySelector('[data-sample-entry]')?.textContent.includes(`녹음 준비 · ${value}`),remaining)
   assert.ok(await page.evaluate(()=>window.qaBackingStarts.every(entry=>entry.duration<4 || entry.at>window.qaAudioContext.currentTime)),'Singing excerpt must not play before preparation ends')
   assert.equal(await page.evaluate(()=>window.qaRecordingStarts),0,'Preparation must not be captured in the Take')
  }
  await page.waitForSelector('[data-action="sample-stop"]')
  await page.waitForFunction(()=>window.qaBackingStarts.length>0)
  assert.equal(await page.evaluate(()=>window.qaRecordingStarts),1)
  await page.getByRole('checkbox',{name:'Sample Guide 반주',exact:true}).uncheck()
  await page.getByRole('checkbox',{name:'Sample Guide 반주',exact:true}).check()
  await page.waitForFunction(()=>window.qaBackingStarts.length>=3)
  const allStarts=await page.evaluate(()=>window.qaBackingStarts)
  const preparation=allStarts.find(entry=>Math.abs(entry.duration-song.leadInDuration)<.02)
  const starts=allStarts.filter(entry=>Math.abs(entry.duration-song.duration)<.15)
  assert.ok(preparation,'Actual preceding backing must be scheduled')
  assert.ok(Math.abs(starts[0].at-preparation.at-song.leadInDuration)<1e-6,'Preparation and singing excerpt must share one continuous Web Audio schedule')
  assert.equal(preparation.gain,starts[0].gain)
  const recordingClock=await page.evaluate(()=>window.qaRecordingClock)
  assert.ok(recordingClock>=starts[0].at && recordingClock-starts[0].at<.15,'Take must start at the singing excerpt, without recording preparation')
  for(const entry of starts){
   assert.ok(Math.abs(entry.gain-Math.min(1,.05/entry.rms,.6/entry.peak))<1e-5)
   assert.ok(entry.gain*entry.peak<=.6+1e-6)
   assert.ok(Math.abs(entry.duration-song.duration)<.15)
  }
  assert.equal(starts[0].gain,starts[1].gain,'Guide toggle must retain source gain')
  assert.ok(starts[1].offset>=starts[0].offset)
  assert.ok(starts[0].gain<=1,'Backing must not be amplified')
  assert.ok(starts[0].rms*starts[0].gain<=.050001,'Backing must stay at the reduced guide level')
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile.sampleSong),'Protected original sample')
  await page.waitForTimeout(3200);await page.locator('[data-action="sample-stop"]').click();await page.waitForSelector('[data-action="voice-complete"]')
  assert.deepEqual(errors,[])
  results.push({song:song.title,...starts[0],gainImprovementDb:20*Math.log10(starts[0].gain/.65),predictedOutputRms:starts[0].rms*starts[0].gain,profilePreserved:true})
  if(index===0){
   await page.locator('[data-action="sample-retry"]').click()
   await page.locator('[data-action="confirm-sample-discard"]').click()
   await page.locator('[data-action="sample-start"]').click()
   await page.waitForFunction(()=>document.querySelector('[data-sample-entry]')?.textContent.includes('녹음 준비') && window.qaBackingStarts.length>=5)
   const before=await page.evaluate(()=>({audio:window.qaBackingStarts.length,recording:window.qaRecordingStarts}))
   await page.locator('[data-nav="user"]').click()
   await page.waitForTimeout(3500)
   assert.deepEqual(await page.evaluate(()=>({audio:window.qaBackingStarts.length,recording:window.qaRecordingStarts})),before,'Leaving preparation must not start audio or a recorder later')
   assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile.sampleSong),'Protected original sample')
   assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream),null)
  }
  await context.close()
 }
 console.log(JSON.stringify({passed:true,results,limits:'Actual provided audio and native Guide gain; fake microphone, no physical loudness/listening acceptance'},null,2))
}finally{await browser.close()}
