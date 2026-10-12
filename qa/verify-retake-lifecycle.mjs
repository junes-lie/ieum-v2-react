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
  const revoke=URL.revokeObjectURL.bind(URL);window.qaRetakeRevoked=[]
  URL.revokeObjectURL=url=>{window.qaRetakeRevoked.push(url);return revoke(url)}
  const remove=IDBObjectStore.prototype.delete
  IDBObjectStore.prototype.delete=function(key){if(window.qaFailDraftDelete&&String(key).endsWith(':temporary-recording'))throw new Error('QA draft deletion failure');return remove.call(this,key)}
  const transaction=IDBDatabase.prototype.transaction
  window.qaDiscardTransactions=0
  IDBDatabase.prototype.transaction=function(stores,mode,...args){if(window.qaCountDiscard&&mode==='readwrite')window.qaDiscardTransactions++;return transaction.call(this,stores,mode,...args)}
  const completion=Object.getOwnPropertyDescriptor(IDBTransaction.prototype,'oncomplete')
  Object.defineProperty(IDBTransaction.prototype,'oncomplete',{...completion,set(handler){const transaction=this;completion.set.call(this,function(event){if(window.qaHoldDiscardCompletion&&transaction.mode==='readwrite'){window.qaReleaseDiscard=()=>handler.call(transaction,event);return}handler.call(transaction,event)})}})
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
 assert.equal(await page.evaluate(url=>window.qaRetakeRevoked.includes(url),originalUrl),false,'Failed discard must keep the original Review URL playable')
 await page.evaluate(()=>{window.qaFailDraftDelete=false})
 await page.getByRole('button',{name:'다시 녹음',exact:true}).click()
 await page.evaluate(()=>{window.qaCountDiscard=true;const button=document.querySelector('[data-action="confirm-retry"]');button.click();button.click()})
 await page.waitForSelector('[data-action="record-start"]')
 assert.equal(await page.evaluate(()=>window.qaDiscardTransactions),1,'Repeated confirmation must perform one discard transaction')
 await page.evaluate(()=>{window.qaCountDiscard=false})
 assert.equal(await page.evaluate(url=>window.qaRetakeRevoked.includes(url),originalUrl),true,'Successful confirmed discard must release the former Review URL')
 await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]')
 assert.equal(await page.evaluate(()=>window.qaRecordingTimers.size),1)
 await page.getByRole('button',{name:'다시 녹음',exact:true}).click();await page.locator('[data-action="confirm-retry"]').click()
 await page.waitForSelector('[data-action="record-start"]')
 assert.equal(await page.evaluate(()=>window.qaRecordingTimers.size),0,'Retake must clear the previous UI timer')
 await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]')
 await page.getByRole('button',{name:'다시 녹음',exact:true}).click()
 await page.evaluate(()=>{window.qaHoldDiscardCompletion=true;document.querySelector('[data-action="confirm-retry"]').click()})
 await page.waitForFunction(()=>typeof window.qaReleaseDiscard==='function')
 assert.equal(await page.locator('[data-action="confirm-retry"]').isDisabled(),true)
 await page.evaluate(()=>{history.replaceState({ieumScreen:'workspace'},'','#workspace');window.dispatchEvent(new PopStateEvent('popstate',{state:history.state}))})
 await page.waitForSelector('.workspace-screen')
 await page.locator('[data-action="record-part"]').click();await page.locator('[data-action="record-start"]').click()
 await page.waitForSelector('[data-action="record-pause"]')
 await page.evaluate(()=>{window.qaHoldDiscardCompletion=false;window.qaReleaseDiscard()})
 assert.equal(await page.evaluate(async()=>{const audio=await import('/src/audio.js');return audio.getRecordingTimeline().state}),'recording','An old discard completion must not cancel a new Recorder session')
 assert.equal(await page.evaluate(()=>window.qaRecordingTimers.size),1)
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,failedRetakePreserves:['recording','paused','review'],singleDiscardTransaction:true,lateDiscardPreservesNewRecorder:true,timerCleanup:true,errors,limits:'Isolated synthetic microphone, injected IndexedDB failure/completion delay and popstate; no physical capture claim.'}))
 await context.close()
}finally{await browser.close()}
