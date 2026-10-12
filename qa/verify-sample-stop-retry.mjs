import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try{
 const context=await browser.newContext({permissions:['microphone']}),page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await context.addInitScript(()=>{
  const stop=MediaRecorder.prototype.stop
  window.qaRejectStop=false
  MediaRecorder.prototype.stop=function(...args){if(window.qaRejectStop){window.qaRejectStop=false;throw new DOMException('QA stop refused','InvalidStateError')}return stop.apply(this,args)}
 })
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/')
 await page.waitForFunction(()=>window.__IEUM_V2__?.state)
 await page.evaluate(async()=>{
  const id='ieum-v2:voice-profile:v7',blob=await(await fetch('/demo-stems/soprano.wav')).blob()
  const db=await new Promise(resolve=>{const request=indexedDB.open('ieum-v2-records',1);request.onsuccess=()=>resolve(request.result)})
  await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite'),store=tx.objectStore('tracks');store.put({id:id+':range',projectId:id,kind:'voice-range',range:'C3–G4',rangeData:{lowMidi:48,highMidi:67}});store.put({id:id+':sample',projectId:id,kind:'voice-sample',blob,duration:7,songLabel:'Preserved Sample'});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})
  db.close()
 })
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__.state.profile?.sampleSong==='Preserved Sample')
 await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click()
 await page.locator('.sample-select-stage > button.primary').click()
 await page.locator('[data-action="sample-start"]').click();await page.waitForSelector('[data-action="sample-stop"]');await page.waitForTimeout(3400)
 await page.evaluate(()=>{window.qaRejectStop=true})
 await page.locator('[data-action="sample-stop"]').click();await page.waitForTimeout(150)
 assert.deepEqual(errors,[],'Stop failure must be handled in the existing Sample screen')
 assert.equal(await page.locator('.permission-error [role="alert"],.permission-error[role="alert"]').count(),1)
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recorder.state),'recording')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile.sampleSong),'Preserved Sample')
 const before=await page.locator('[data-sample-entry]').textContent();await page.waitForTimeout(1200)
 assert.notEqual(await page.locator('[data-sample-entry]').textContent(),before,'Failed stop must retain live elapsed feedback')
 await page.locator('[data-action="sample-stop"]').click();await page.waitForSelector('[data-action="voice-complete"]')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recorder.state),'inactive')
 assert.ok(await page.locator('.sample-stage audio').getAttribute('src'))
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile.sampleSong),'Preserved Sample')
 assert.deepEqual(errors,[])
 const projectUrl=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/');projectUrl.searchParams.set('design','figma')
 await page.evaluate(()=>localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'})))
 await page.goto(projectUrl.href);await page.waitForSelector('[data-action="record-part"]')
 await page.locator('[data-action="record-part"]').click();await page.waitForFunction(()=>document.querySelector('[data-action="record-start"]')?.disabled===false)
 await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]');await page.waitForTimeout(1100)
 await page.evaluate(()=>{window.qaRejectStop=true})
 await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('.permission-error')
 assert.deepEqual(errors,[])
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recorder.state),'recording')
 assert.equal(await page.locator('[data-action="record-submit"]').count(),0,'Rejected stop must not create a submitted or Review Track')
 await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('[data-action="record-submit"]')
 assert.ok(await page.locator('.record-review audio').getAttribute('src'))
 assert.deepEqual(errors,[])
 console.log('PASS Sample/Project stop rejection → live Take preserved → retry Review; existing Profile unchanged. Synthetic microphone only.')
 await context.close()
}finally{await browser.close()}
