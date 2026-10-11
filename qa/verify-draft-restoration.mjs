import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const context=await browser.newContext()
 await context.addInitScript(()=>{
  localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'}))
  window.qaMicRequests=0
  navigator.mediaDevices.getUserMedia=async()=>{window.qaMicRequests++;throw new Error('Microphone must not be requested during draft recovery')}
 })
 const page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 const url=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4193/');url.searchParams.set('design','figma')
 await page.goto(url.href)
 await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state?.projectTracks||{}).length===2)
 const original=await page.evaluate(async()=>{
  const projectId=window.__IEUM_V2__.state.activeProject.id
  const id=`jisun:${projectId}:tenor:temporary-recording`,blob=await (await fetch('/demo-stems/soprano.wav')).blob()
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
  await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').put({id,projectId,partId:'tenor',userId:'jisun',kind:'temporary-recording',blob,duration:7});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})
  db.close()
  const get=IDBObjectStore.prototype.get
  window.qaFailRestore=true
  IDBObjectStore.prototype.get=function(key,...args){if(key===id&&window.qaFailRestore)throw new Error('QA native draft read failure');return get.call(this,key,...args)}
  return {id,size:blob.size,hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',')}
 })
 await page.locator('[data-action="record-part"]').click()
 await page.waitForSelector('[data-action="draft-restore-retry"]')
 assert.equal(await page.locator('[data-action="record-start"]').isDisabled(),true)
 await page.locator('[data-action="record-start"]').evaluate(button=>button.click())
 assert.equal(await page.evaluate(()=>window.qaMicRequests),0)
 assert.equal(await page.locator('[data-action="record-submit"]').count(),0)
 await page.evaluate(()=>{window.qaFailRestore=false})
 await page.locator('[data-action="draft-restore-retry"]').click()
 await page.waitForSelector('[data-action="record-submit"]')
 assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'review')
 assert.equal(await page.evaluate(()=>window.qaMicRequests),0)
 const restored=await page.evaluate(async id=>{
  const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)})
  const stored=await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readonly'),r=tx.objectStore('tracks').get(id);tx.oncomplete=()=>resolve(r.result);tx.onabort=()=>reject(tx.error)})
  db.close()
  return {size:stored.blob.size,hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await stored.blob.arrayBuffer()))).join(',')}
 },original.id)
 assert.equal(restored.size,original.size);assert.equal(restored.hash,original.hash)
 assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),2)
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,readFailureBlocksMic:true,retryRestoresReview:true,originalBytesPreserved:true,submittedCountUnchanged:true,limits:'Isolated native IndexedDB and rendered app; no physical microphone, visual design or listening acceptance.'}))
} finally {await browser.close()}
