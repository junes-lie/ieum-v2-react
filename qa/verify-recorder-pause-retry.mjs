import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try {
 const context=await browser.newContext({permissions:['microphone']})
 await context.addInitScript(()=>{
  localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'}))
  for(const name of ['pause','resume']) {
   const original=MediaRecorder.prototype[name]
   MediaRecorder.prototype[name]=function(...args){if(window.qaRejectControl===name){window.qaRejectControl=null;throw new DOMException(`QA ${name} refused`,'InvalidStateError')}return original.apply(this,args)}
  }
  const createGain=AudioContext.prototype.createGain
  AudioContext.prototype.createGain=function(...args){if(window.qaRejectGuide){window.qaRejectGuide=false;throw new DOMException('QA resumed Guide refused','InvalidStateError')}return createGain.apply(this,args)}
 })
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message))
 const url=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4187/');url.searchParams.set('design','figma')
 await page.goto(url.href);await page.locator('[data-action="record-part"]').click()
 await page.waitForFunction(()=>document.querySelector('[data-action="record-start"]')?.disabled===false)
 await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]')
 for(const name of ['pause','resume']) {
  const before=await page.evaluate(()=>({recorder:window.__IEUM_V2__.audioRuntime.recorder.state,segment:window.__IEUM_V2__.audioRuntime.recordingSegmentActive,chunks:window.__IEUM_V2__.audioRuntime.chunks.length,guides:window.__IEUM_V2__.audioRuntime.guideNodes.length}))
  await page.evaluate(name=>{window.qaRejectControl=name},name)
  await page.locator(`[data-action="record-${name}"]`).click();await page.waitForTimeout(100)
  assert.deepEqual(errors,[],`${name} rejection must be handled`)
  assert.equal(await page.locator('.permission-error').count(),1)
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recorder.state),before.recorder)
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recordingSegmentActive),before.segment)
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.guideNodes.length),before.guides)
  assert.equal(await page.locator('[data-action="record-submit"]').count(),0)
  await page.locator(`[data-action="record-${name}"]`).click()
  await page.waitForSelector(`[data-action="record-${name==='pause'?'resume':'pause'}"]`)
  assert.equal(await page.locator('.permission-error').count(),0)
 }
 await page.locator('[data-action="record-pause"]').click();await page.waitForSelector('[data-action="record-resume"]')
 await page.evaluate(()=>{window.qaRejectGuide=true})
 await page.locator('[data-action="record-resume"]').click();await page.waitForTimeout(100)
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recorder.state),'paused','Guide failure must leave the actual recorder paused')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recordingSegmentActive),false)
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.playback.length),0)
 assert.equal(await page.locator('[data-action="record-resume"]').count(),1)
 assert.deepEqual(errors,[])
 await page.locator('[data-action="record-resume"]').click();await page.waitForSelector('[data-action="record-pause"]')
 await page.getByRole('checkbox',{name:'Guide 반주',exact:true}).uncheck()
 await page.evaluate(()=>{window.qaRejectGuide=true})
 await page.evaluate(()=>document.querySelector('[aria-label="Guide 반주"]').click());await page.waitForTimeout(100)
 assert.deepEqual(errors,[],'Live Guide update failure must not crash the Recorder')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recorder.state),'recording')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recordingSegmentActive),true)
 assert.equal(await page.locator('.permission-error').count(),1)
 await page.getByRole('checkbox',{name:'Guide 반주',exact:true}).uncheck()
 await page.getByRole('checkbox',{name:'Guide 반주',exact:true}).check()
 assert.equal(await page.locator('.permission-error').count(),0)
 await page.waitForTimeout(500);await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('[data-action="record-submit"]')
 assert.ok(await page.locator('.record-review audio').getAttribute('src'));assert.deepEqual(errors,[])
 console.log('PASS rejected pause/resume preserve Take, segment and Guide state; same-button retry and playable Review. Synthetic microphone only.')
 await context.close()
}finally{await browser.close()}
