import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try {
 const results=[]
 for(const mode of (process.env.IEUM_QA_DECODE_FAILURE==='1'?['decode-failure']:['normal','decode-failure','paused-decode-failure'])){
 const context=await browser.newContext({permissions:['microphone']}),page=await context.newPage(),errors=[]
 await context.addInitScript(()=>localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'})))
 page.on('pageerror',error=>errors.push(error.message))
 const url=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/');url.searchParams.set('design','figma');await page.goto(url.href)
 await page.waitForSelector('[data-action="record-part"]');await page.locator('[data-action="record-part"]').click()
 await page.waitForFunction(()=>document.querySelector('[data-action="record-start"]')?.disabled===false)
 await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]');await page.waitForTimeout(1200)
 const failedDecode=mode!=='normal'
 if(mode==='paused-decode-failure'){await page.locator('[data-action="record-pause"]').click();await page.waitForTimeout(700)}
 const endedElapsed=await page.evaluate(failed=>{const runtime=window.__IEUM_V2__.audioRuntime;if(failed)runtime.context.decodeAudioData=async()=>{throw new Error('QA analysis decoder unavailable')};const elapsed=runtime.activeElapsedSec+(runtime.recorder.state==='recording'?runtime.context.currentTime-runtime.activeStartedAt:0);runtime.stream.getTracks().forEach(track=>track.stop());return elapsed},failedDecode)
 await page.waitForFunction(()=>window.__IEUM_V2__.audioRuntime.recorder.state==='inactive'&&window.__IEUM_V2__.audioRuntime.chunks.length>0)
 const originalHash=await page.evaluate(async()=>{const runtime=window.__IEUM_V2__.audioRuntime;const bytes=await new Blob(runtime.chunks,{type:runtime.recorder.mimeType}).arrayBuffer();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).join(',')})
 if(failedDecode)await page.waitForTimeout(700)
 await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('[data-action="record-submit"]',{timeout:5000})
 const reviewHash=await page.evaluate(async()=>{const blob=await(await fetch(document.querySelector('.record-review audio').src)).blob();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',')})
 assert.equal(reviewHash,originalHash)
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.chunks.length),0,'Finalizing must release redundant encoded chunk references')
 assert.ok(await page.locator('.record-review audio').getAttribute('src'));assert.deepEqual(errors,[])
 await page.locator('.recording-screen [data-action="back"]').click();await page.waitForSelector('.workspace-screen')
 if(failedDecode){const duration=await page.evaluate(async()=>{const request=indexedDB.open('ieum-v2-records');const db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});try{return await new Promise((resolve,reject)=>{const get=db.transaction('tracks').objectStore('tracks').get('jisun:ieum-thousand-years-v7:tenor:temporary-recording');get.onsuccess=()=>resolve(get.result?.duration);get.onerror=()=>reject(get.error)})}finally{db.close()}});assert.ok(Math.abs(duration-endedElapsed)<.3,`Ended Take duration must survive analysis failure without counting later wait: ${duration} vs ${endedElapsed}`)}
 await page.locator('[data-action="record-part"]').click();await page.waitForSelector('[data-action="record-submit"]')
 const restoredHash=await page.evaluate(async()=>{const blob=await(await fetch(document.querySelector('.record-review audio').src)).blob();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',')})
 assert.equal(restoredHash,originalHash)
 results.push({mode,endedMicrophoneTakePreserved:true,reviewHashMatches:true,draftRestored:true,encodedChunksReleased:true,elapsedFallbackChecked:failedDecode,errors})
 await context.close()
 }
 console.log(JSON.stringify({passed:true,results,limits:'Isolated fake stream ended event and injected analysis failure; no physical unplug or listening acceptance'}))
} finally {await browser.close()}
