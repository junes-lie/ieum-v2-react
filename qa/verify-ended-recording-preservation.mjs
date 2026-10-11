import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try {
 const context=await browser.newContext({permissions:['microphone']}),page=await context.newPage(),errors=[]
 await context.addInitScript(()=>localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'})))
 page.on('pageerror',error=>errors.push(error.message))
 const url=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/');url.searchParams.set('design','figma');await page.goto(url.href)
 await page.waitForSelector('[data-action="record-part"]');await page.locator('[data-action="record-part"]').click()
 await page.waitForFunction(()=>document.querySelector('[data-action="record-start"]')?.disabled===false)
 await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]');await page.waitForTimeout(1200)
 await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream.getTracks().forEach(track=>track.stop()))
 await page.waitForFunction(()=>window.__IEUM_V2__.audioRuntime.recorder.state==='inactive'&&window.__IEUM_V2__.audioRuntime.chunks.length>0)
 const originalHash=await page.evaluate(async()=>{const runtime=window.__IEUM_V2__.audioRuntime;const bytes=await new Blob(runtime.chunks,{type:runtime.recorder.mimeType}).arrayBuffer();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).join(',')})
 await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('[data-action="record-submit"]',{timeout:5000})
 const reviewHash=await page.evaluate(async()=>{const blob=await(await fetch(document.querySelector('.record-review audio').src)).blob();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',')})
 assert.equal(reviewHash,originalHash)
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.chunks.length),0,'Finalizing must release redundant encoded chunk references')
 assert.ok(await page.locator('.record-review audio').getAttribute('src'));assert.deepEqual(errors,[])
 await page.locator('.recording-screen [data-action="back"]').click();await page.waitForSelector('.workspace-screen')
 await page.locator('[data-action="record-part"]').click();await page.waitForSelector('[data-action="record-submit"]')
 const restoredHash=await page.evaluate(async()=>{const blob=await(await fetch(document.querySelector('.record-review audio').src)).blob();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',')})
 assert.equal(restoredHash,originalHash)
 console.log(JSON.stringify({passed:true,endedMicrophoneTakePreserved:true,reviewHashMatches:true,draftRestored:true,encodedChunksReleased:true,errors,limits:'Isolated fake stream ended event, original bytes preserved; no physical unplug or listening acceptance'}))
} finally {await browser.close()}
