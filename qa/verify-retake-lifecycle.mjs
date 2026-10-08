import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try {
 const context=await browser.newContext({viewport:{width:390,height:844},permissions:['microphone']})
 await context.addInitScript(()=>{
  localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'}))
  window.qaRecordingTimers=new Set()
  const set=window.setInterval.bind(window),clear=window.clearInterval.bind(window)
  window.setInterval=(fn,delay,...args)=>{const id=set(fn,delay,...args);if(delay===100)window.qaRecordingTimers.add(id);return id}
  window.clearInterval=id=>{window.qaRecordingTimers.delete(id);clear(id)}
  const remove=IDBObjectStore.prototype.delete
  IDBObjectStore.prototype.delete=function(key){if(window.qaFailDraftDelete&&String(key).endsWith(':temporary-recording'))throw new Error('QA draft deletion failure');return remove.call(this,key)}
 })
 const page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 const url=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4191/');url.searchParams.set('design','figma');await page.goto(url.href)
 await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state?.projectTracks||{}).length===2)
 await page.locator('[data-action="record-part"]').click();await page.locator('[data-action="record-start"]').click()
 await page.waitForSelector('[data-action="record-pause"]');await page.waitForTimeout(1100)
 const failedRetake=async status=>{
  await page.evaluate(()=>{window.qaFailDraftDelete=true})
  await page.getByRole('button',{name:'다시 녹음',exact:true}).click();await page.locator('[data-action="confirm-retry"]').click()
  await page.waitForFunction(()=>document.querySelector('[role="alert"]')?.textContent.includes('녹음을 지우지 못했어요.'))
  assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),status)
  assert.equal(await page.locator('.permission-error button').count(),0)
  assert.equal(await page.locator('dialog').count(),0)
 }
 const clock=await page.locator('.recording-clock').textContent()
 await failedRetake('recording')
 await page.waitForFunction(previous=>document.querySelector('.recording-clock').textContent!==previous,clock)
 assert.equal(await page.evaluate(()=>window.qaRecordingTimers.size),1)
 await page.locator('[data-action="record-pause"]').click();await failedRetake('paused')
 assert.equal(await page.evaluate(()=>window.qaRecordingTimers.size),0)
 await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('[data-action="record-submit"]')
 const originalUrl=await page.locator('.record-review audio').getAttribute('src')
 await failedRetake('review');assert.equal(await page.locator('.record-review audio').getAttribute('src'),originalUrl)
 await page.evaluate(()=>{window.qaFailDraftDelete=false})
 await page.getByRole('button',{name:'다시 녹음',exact:true}).click();await page.locator('[data-action="confirm-retry"]').click()
 await page.waitForSelector('[data-action="record-start"]')
 await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]')
 assert.equal(await page.evaluate(()=>window.qaRecordingTimers.size),1)
 await page.getByRole('button',{name:'다시 녹음',exact:true}).click();await page.locator('[data-action="confirm-retry"]').click()
 await page.waitForSelector('[data-action="record-start"]')
 assert.equal(await page.evaluate(()=>window.qaRecordingTimers.size),0,'Retake must clear the previous UI timer')
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,failedRetakePreserves:['recording','paused','review'],timerCleanup:true,errors,limits:'Isolated synthetic microphone and injected IndexedDB failure; no physical capture claim.'}))
 await context.close()
}finally{await browser.close()}
