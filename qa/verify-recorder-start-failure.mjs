import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try {
 for(const failure of ['constructor','start','context-resume']) {
  const context=await browser.newContext({permissions:['microphone']})
  await context.addInitScript(failure=>{
   localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'}))
   window.qaFailure=failure;window.qaStreams=[]
   const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
   navigator.mediaDevices.getUserMedia=async(...args)=>{const stream=await get(...args);window.qaStreams.push(stream);return stream}
   const resume=AudioContext.prototype.resume
   AudioContext.prototype.resume=function(...args){if(window.qaFailure==='context-resume')return Promise.reject(new Error('QA audio context resume failure'));return resume.apply(this,args)}
   const Recorder=window.MediaRecorder
   window.MediaRecorder=class extends Recorder {
    constructor(...args){if(window.qaFailure==='constructor')throw new DOMException('QA recorder constructor failure','NotSupportedError');super(...args)}
    start(...args){if(window.qaFailure==='start')throw new DOMException('QA recorder start failure','NotSupportedError');return super.start(...args)}
   }
  },failure)
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
  const url=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/');url.searchParams.set('design','figma');await page.goto(url.href)
  await page.waitForSelector('[data-action="record-part"]');await page.locator('[data-action="record-part"]').click()
  await page.waitForFunction(()=>document.querySelector('[data-action="record-start"]')?.disabled===false)
  await page.locator('[data-action="record-start"]').click();await page.waitForSelector('.permission-error')
  assert.equal(await page.evaluate(()=>window.qaStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended'))),true,`${failure} failure must release acquired microphone tracks`)
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream),null)
  assert.equal(await page.locator('[data-action="record-submit"]').count(),0)
  await page.evaluate(()=>{window.qaFailure=null})
  await page.locator('.permission-error button').click();await page.waitForSelector('[data-action="record-pause"]')
  assert.equal(await page.evaluate(()=>window.qaStreams.length),2,'Retry acquires a fresh microphone')
  await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('[data-action="record-submit"]')
  assert.ok(await page.locator('.record-review audio').getAttribute('src'));assert.deepEqual(errors,[])
  console.log(JSON.stringify({passed:true,failure,microphoneReleased:true,freshRetry:true,reviewPlayable:true,errors,limits:'Isolated fake microphone and recorder/context errors; no physical capture acceptance'}))
  await context.close()
 }
} finally {await browser.close()}
