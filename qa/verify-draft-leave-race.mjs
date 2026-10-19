import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try {
 const context=await browser.newContext({permissions:['microphone']}),page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await context.addInitScript(()=>{
  localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'}))
  const put=IDBObjectStore.prototype.put
  window.qaDraftWrites=0
  IDBObjectStore.prototype.put=function(value,...args){
   if(value.kind==='temporary-recording'&&window.qaCountLeave){window.qaDraftWrites++;if(window.qaFailLeave)throw new Error('QA draft leave save rejected')}
   return put.call(this,value,...args)
  }
  const completion=Object.getOwnPropertyDescriptor(IDBTransaction.prototype,'oncomplete')
  Object.defineProperty(IDBTransaction.prototype,'oncomplete',{...completion,set(handler){const transaction=this;completion.set.call(this,function(event){if(window.qaHoldLeave&&transaction.mode==='readwrite'){window.qaReleaseLeave=()=>handler.call(transaction,event);return}handler.call(transaction,event)})}})
 })
 const url=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4191/');url.searchParams.set('design','figma')
 await page.goto(url.href);await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state.projectTracks||{}).length===2)
 const original=await page.evaluate(async()=>{
  const projectId=window.__IEUM_V2__.state.activeProject.id,id=`jisun:${projectId}:tenor:temporary-recording`,blob=await(await fetch('/demo-stems/soprano.wav')).blob()
  const db=await new Promise(resolve=>{const request=indexedDB.open('ieum-v2-records',1);request.onsuccess=()=>resolve(request.result)})
  await new Promise(resolve=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').put({id,projectId,partId:'tenor',userId:'jisun',kind:'temporary-recording',blob,duration:7});tx.oncomplete=resolve});db.close()
  return {id,hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',')}
 })
 await page.locator('[data-action="record-part"]').click();await page.waitForSelector('[data-action="record-submit"]')
 const source=await page.locator('.record-review audio').getAttribute('src')
 await page.evaluate(()=>{window.qaCountLeave=true;window.qaFailLeave=true})
 await page.locator('.recording-screen [data-action="back"]').click()
 await page.waitForFunction(()=>document.querySelector('[role="alert"]')?.textContent.includes('임시 저장하지 못했어요.'))
 assert.equal(await page.locator('.record-review audio').getAttribute('src'),source)
 assert.equal(await page.locator('[data-action="record-submit"]').isDisabled(),false,'Failed leave must unlock Review')
 await page.evaluate(()=>{window.qaFailLeave=false;window.qaHoldLeave=true;window.qaDraftWrites=0;const back=document.querySelector('.recording-screen [data-action="back"]');back.click();back.click()})
 await page.waitForFunction(()=>typeof window.qaReleaseLeave==='function')
 const writes=await page.evaluate(()=>window.qaDraftWrites)
 const submitDisabled=await page.locator('[data-action="record-submit"]').isDisabled()
 await page.evaluate(()=>{history.replaceState({ieumScreen:'my'},'','#my');window.dispatchEvent(new PopStateEvent('popstate',{state:history.state}))})
 await page.waitForFunction(()=>window.__IEUM_V2__.state.screen==='my')
 await page.evaluate(()=>{window.qaHoldLeave=false;window.qaReleaseLeave()})
 // Allow any obsolete navigation callback and React render to run.
 await page.waitForTimeout(250)
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.screen),'my','Old Draft save must not navigate away from the current screen')
 assert.equal(writes,1,'Same-tick Back clicks must save the Draft once')
 assert.equal(submitDisabled,true,'Pending leave must block a concurrent submission')
 await page.evaluate(()=>{history.replaceState({ieumScreen:'workspace'},'','#workspace');window.dispatchEvent(new PopStateEvent('popstate',{state:history.state}))})
 await page.waitForSelector('.workspace-screen');await page.locator('[data-action="record-part"]').click();await page.waitForSelector('[data-action="record-submit"]')
 const hash=await page.evaluate(async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await(await fetch(document.querySelector('.record-review audio').src)).arrayBuffer()))).join(','))
 assert.equal(hash,original.hash);assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),2)
 await page.locator('.recording-screen [data-action="back"]').click();await page.waitForSelector('.workspace-screen')
 await page.locator('[data-action="record-part"]').click();await page.waitForSelector('[data-action="record-submit"]')
 await page.locator('[data-action="record-retry"]').click();await page.locator('[data-action="confirm-retry"]').click();await page.waitForSelector('[data-action="record-start"]')
 await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]');await page.waitForTimeout(1100)
 await page.locator('.recording-screen [data-action="back"]').click()
 await page.evaluate(()=>{window.qaFailLeave=true})
 await page.locator('[data-action="confirm-leave"]').click()
 await page.waitForFunction(()=>document.querySelector('[role="alert"]')?.textContent.includes('임시 저장하지 못했어요.'))
 assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'review')
 assert.equal(await page.locator('dialog').count(),0)
 assert.equal(await page.locator('[data-action="record-submit"]').isDisabled(),false)
 await page.evaluate(()=>{window.qaFailLeave=false})
 await page.locator('.recording-screen [data-action="back"]').click();await page.waitForSelector('.workspace-screen')
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,failedSaveKeepsReview:true,singleLeaveSave:true,pendingLeaveBlocksSubmission:true,lateSaveKeepsCurrentScreen:true,reloadedDraftBytesExact:true,confirmedStopSaveFailureKeepsReview:true,normalLeave:true,errors,limits:'Stored audio fixture/synthetic microphone and injected IndexedDB delay/failure/popstate; no physical microphone or listening acceptance.'}))
 await context.close()
}finally{await browser.close()}
