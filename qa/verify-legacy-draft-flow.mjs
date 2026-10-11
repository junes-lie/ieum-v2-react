import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const results=[]
 for(const owner of [null,'jisun','another-user']) {
  const context=await browser.newContext()
  await context.addInitScript(()=>localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'})))
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4193/?design=figma')
  await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state?.projectTracks||{}).length===2)
  await page.evaluate(async owner=>{
   const projectId='ieum-thousand-years-v7',id=`${projectId}:tenor:temporary-recording`
   const blob=await (await fetch('/demo-stems/soprano.wav')).blob()
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
   await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').put({id,projectId,partId:'tenor',kind:'temporary-recording',userId:owner,blob,duration:7,guides:{backing:false,parts:[false,false,false,false]}});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})
   db.close()
  },owner)
  await page.evaluate(()=>{window.qaRestoredUrls=0;const create=URL.createObjectURL;URL.createObjectURL=function(...args){window.qaRestoredUrls++;return create.apply(this,args)}})
  await page.locator('[data-action="record-part"]').click()
  await page.waitForFunction(()=>document.querySelector('[data-action="record-submit"]')||document.querySelector('[data-action="record-start"]'))
  if(owner==='another-user') {
   assert.equal(await page.locator('[data-action="record-submit"]').count(),0)
   await page.waitForFunction(()=>!document.querySelector('[data-action="record-start"]')?.disabled)
   assert.equal(await page.evaluate(()=>window.qaRestoredUrls),0,'Foreign draft must not allocate a playback URL')
  } else {
   await page.waitForSelector('[data-action="record-submit"]')
   assert.equal(await page.locator('.lyrics .active').textContent(),'가사 없음')
   await page.locator('[data-action="record-retry"]').click();await page.locator('[data-action="confirm-retry"]').click()
   await page.waitForSelector('[data-action="record-start"]')
   await page.locator('.recording-screen .topbar button').first().click()
   await page.locator('[data-action="record-part"]').click();await page.waitForSelector('[data-action="record-start"]')
   assert.equal(await page.locator('[data-action="record-submit"]').count(),0)
  }
  const remaining=await page.evaluate(async()=>{
   const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)})
   const value=await new Promise(resolve=>{const r=db.transaction('tracks').objectStore('tracks').get('ieum-thousand-years-v7:tenor:temporary-recording');r.onsuccess=()=>resolve(r.result)})
   db.close();return value?{owner:value.userId,bytes:value.blob.size}:null
  })
  if(owner==='another-user'){assert.equal(remaining.owner,owner);assert.ok(remaining.bytes>0)}else assert.equal(remaining,null)
  assert.deepEqual(errors,[]);results.push({owner,discardedTakeDoesNotReturn:owner!=='another-user',otherOwnerPreserved:owner==='another-user',errors})
  await context.close()
 }
 console.log(JSON.stringify({passed:true,results,limits:'Isolated legacy fixture and browser DB; no physical microphone or shared service claim.'}))
}finally{await browser.close()}
