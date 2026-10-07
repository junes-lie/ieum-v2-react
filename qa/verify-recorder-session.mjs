import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try {
 const context=await browser.newContext({permissions:['microphone']})
 await context.addInitScript(()=>{
  localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'}))
  const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices),set=window.setInterval.bind(window),clear=window.clearInterval.bind(window)
  window.qaRequests=0;window.qaTimers=new Set()
  navigator.mediaDevices.getUserMedia=async(...args)=>{window.qaRequests++;await new Promise(r=>setTimeout(r,200));return get(...args)}
  window.setInterval=(fn,delay,...args)=>{const id=set(fn,delay,...args);if(delay===100)window.qaTimers.add(id);return id}
  window.clearInterval=id=>{window.qaTimers.delete(id);clear(id)}
 })
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
 const url=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4193/');url.searchParams.set('design','figma');await page.goto(url.href)
 await page.locator('[data-action="record-part"]').click()
 await page.evaluate(()=>{const b=document.querySelector('[data-action="record-start"]');b.click();b.click()})
 await page.waitForSelector('[data-action="record-pause"]');await page.waitForTimeout(700)
 assert.equal(await page.evaluate(()=>window.qaRequests),1,'Concurrent Start must request one microphone session')
 assert.equal(await page.evaluate(()=>window.qaTimers.size),1,'Concurrent Start must create one timeline timer')
 await page.locator('[data-action="record-pause"]').click()
 await page.evaluate(()=>{const b=document.querySelector('[data-action="record-resume"]');b.click();b.click()})
 await page.waitForSelector('[data-action="record-pause"]')
 assert.equal(await page.evaluate(()=>window.qaTimers.size),1,'Concurrent Resume must create one timeline timer')
 await page.waitForTimeout(1000)
 await page.evaluate(()=>{const b=document.querySelector('[data-action="record-stop"]');b.click();b.click()})
 await page.waitForSelector('[data-action="record-submit"]')
 assert.equal(await page.evaluate(()=>window.qaTimers.size),0)
 assert.equal(await page.locator('.permission-error').count(),0,'Concurrent Stop must preserve successful Review without false storage error')
 assert.ok(await page.locator('.record-review audio').getAttribute('src'))
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,oneMicrophoneSession:true,oneTimelineTimer:true,concurrentStopKeepsReview:true,errors,limits:'Synthetic microphone and isolated DB; no physical microphone acceptance.'}))
 await context.close()
}finally{await browser.close()}
