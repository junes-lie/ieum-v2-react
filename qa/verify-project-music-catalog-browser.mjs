import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {seedCreationProfile} from './project-profile-fixture.mjs'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4252','--strictPort'],{stdio:['ignore','pipe','inherit']})
let browser
try{
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject)})
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']})
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},permissions:['microphone'],reducedMotion:'reduce'})
  const page=await context.newPage();page.setDefaultTimeout(20000)
  await page.addInitScript(()=>{window.qaMicRequests=0;const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=(...args)=>{window.qaMicRequests++;return get(...args)}})
  await page.goto('http://127.0.0.1:4252/');await seedCreationProfile(page)
  await page.locator('[data-nav="search"]').click()
  await page.getByRole('tab',{name:'곡',exact:true}).click()
  await page.getByRole('textbox',{name:'곡, 아티스트, 프로젝트 검색'}).fill('천천히 함께')
  await page.locator('.search-v2-result').click()
  await page.locator('[data-part="voice-a"] .row-action').click()
  await page.locator('[data-action="join-part"]').click()
  await page.waitForSelector('.workspace-v2-screen')
  const s=await page.evaluate(()=>window.__IEUM_V2__.state.activeProject)
  assert.equal(s.songId,'ieum-original-warm-unison-v1');assert.equal(s.key,'원키');assert.equal(s.ownerPartId,'voice-a');assert.equal(s.audioSource.kind,'project-arrangement')
  await page.locator('[data-action="record-part"]').click()
  const file='**/audio/project-warm-unison-v1/backing.mp3'
  await page.route(file,r=>r.fulfill({status:503,body:'QA unavailable backing'}))
  await page.locator('[data-action="record-start"]').click()
  await page.waitForSelector('.permission-error')
  assert.equal(await page.evaluate(()=>window.qaMicRequests),0)
  assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'ready')
  await page.unroute(file)
  await page.locator('[data-action="record-start"]').click()
  await page.waitForSelector('[data-action="record-pause"]')
  assert.equal(await page.evaluate(()=>window.qaMicRequests),1)
  await page.locator('[data-action="record-stop"]').click()
  await page.waitForSelector('[data-action="record-submit"]')
  // A changed registered arrangement must refuse an old Take without destroying it.
  await page.evaluate(()=>{window.__IEUM_V2__.state.activeProject.audioSource={...window.__IEUM_V2__.state.activeProject.audioSource,revision:'qa-changed-after-recording'}})
  await page.locator('[data-action="record-submit"]').click()
  await page.waitForFunction(()=>document.querySelector('.permission-error')?.textContent.includes('録音')||document.querySelector('.permission-error')?.textContent.includes('버전'))
  assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'review')
  assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks).length),0)
  assert.ok(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.recordingBlob.size>0))

  await page.goto('http://127.0.0.1:4252/');await page.waitForSelector('.v2-hero')
  await page.locator('[data-nav="search"]').click();await page.getByRole('tab',{name:'곡',exact:true}).click()
  await page.getByRole('textbox',{name:'곡, 아티스트, 프로젝트 검색'}).fill('천천히 함께');await page.locator('.search-v2-result').click()
  assert.equal(await page.locator('.project-carousel>button').count(),1,'Joined registered Project replaces its catalogue row without a duplicate')
  await page.locator('[data-action="create-project-for-song"]').click()
  const key=page.locator('.field-label select');assert.equal(await key.inputValue(),'원키');assert.equal(await key.isDisabled(),true)
  assert.equal(await page.locator('.part-choice-grid button').count(),2)
  await page.getByRole('button',{name:'프로젝트 확인',exact:true}).click()
  await page.locator('[data-action="confirm-project-create"]').click();await page.waitForSelector('.workspace-v2-screen')
  const created=await page.evaluate(()=>window.__IEUM_V2__.state.activeProject)
  assert.equal(created.audioSource.kind,'project-arrangement');assert.equal(created.recordingDuration,22);assert.equal(created.key,'원키');assert.equal(created.parts.length,2);assert.equal(created.lyrics[0].time,3)
  assert.equal(await page.evaluate(()=>document.body.scrollWidth<=innerWidth),true)
  console.log('PASS',width,'normal Search Song -> registered Project -> selected Part join; 503 backing blocks mic; retry works; changed source preserves Review and refuses submission')
  await context.close()
 }
}finally{await browser?.close();server.kill()}
