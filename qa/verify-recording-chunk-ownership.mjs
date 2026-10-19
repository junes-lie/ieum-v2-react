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
 await page.locator('[data-action="record-start"]').click();await page.waitForFunction(()=>window.__IEUM_V2__.audioRuntime.chunks.length>0)
 await page.evaluate(()=>{const runtime=window.__IEUM_V2__.audioRuntime;window.qaOldDataCallback=runtime.recorder.ondataavailable;window.qaOldChunk=runtime.chunks[0];window.qaOldChunkArray=runtime.chunks})
 await page.getByRole('button',{name:'다시 녹음',exact:true}).click();await page.locator('[data-action="confirm-retry"]').click()
 await page.waitForSelector('[data-action="record-start"]');await page.locator('[data-action="record-start"]').click()
 await page.waitForFunction(()=>window.__IEUM_V2__.audioRuntime.chunks.length>0)
 const ownership=await page.evaluate(()=>{
  const runtime=window.__IEUM_V2__.audioRuntime;window.qaExpectedNewChunks=[...runtime.chunks];window.qaNewChunkArray=runtime.chunks
  runtime.recorder.addEventListener('dataavailable',event=>{if(event.data.size)window.qaExpectedNewChunks.push(event.data)})
  const count=runtime.chunks.length;window.qaOldDataCallback({data:window.qaOldChunk})
  return {before:count,after:runtime.chunks.length,containsDiscardedChunk:runtime.chunks.includes(window.qaOldChunk)}
 })
 assert.equal(ownership.after,ownership.before,'A delayed discarded-recorder event must not append bytes to the new Take')
 assert.equal(ownership.containsDiscardedChunk,false)
 assert.equal(await page.evaluate(()=>window.qaOldChunkArray.length),0,'Cancelled recorder callback must release its old chunk array')
 await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('[data-action="record-submit"]')
 const hashes=await page.evaluate(async()=>{const hash=async blob=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',');return {expected:await hash(new Blob(window.qaExpectedNewChunks)),actual:await hash(await(await fetch(document.querySelector('.record-review audio').src)).blob())}})
 assert.equal(hashes.actual,hashes.expected);assert.equal(await page.evaluate(()=>window.qaNewChunkArray.length),0,'Finalized recorder callback must release its encoded chunk array');assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,lateDiscardedEventIgnored:true,cancelledCollectorReleased:true,finalizedCollectorReleased:true,newTakeBytesExact:true,errors,limits:'Native fake microphone with delayed prior callback injected; no physical timing or listening acceptance'}))
} finally {await browser.close()}
