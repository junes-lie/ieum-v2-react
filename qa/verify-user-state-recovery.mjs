import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
const key='ieum-v2:user-state:v7',url=process.env.IEUM_QA_URL||'http://127.0.0.1:4194/'
try {
 for(const mode of ['invalid-json','invalid-shape','temporary-read-error']) {
  const context=await browser.newContext(),page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  const original=mode==='invalid-json'?'{"joined":true,broken':mode==='invalid-shape'?'[]':JSON.stringify({joined:true,joinedPart:'tenor',projectLikes:[{projectId:'preserve-project',savedAt:'2026-10-12T00:00:00Z'}]})
  await context.addInitScript(({key,original,mode})=>{
   const get=Storage.prototype.getItem,set=Storage.prototype.setItem
   if(!sessionStorage.getItem('qa-state-initialized')){set.call(localStorage,key,original);sessionStorage.setItem('qa-state-initialized','1');sessionStorage.setItem('qa-state-read-failure','1')}
   window.qaOriginalState=()=>get.call(localStorage,key);window.qaStateWrites=0;window.qaDatabaseOpens=0
   Storage.prototype.getItem=function(name){if(this===localStorage&&name===key&&mode==='temporary-read-error'&&sessionStorage.getItem('qa-state-read-failure')==='1')throw new DOMException('QA read unavailable','SecurityError');return get.call(this,name)}
   Storage.prototype.setItem=function(name,value){if(this===localStorage&&name===key)window.qaStateWrites++;return set.call(this,name,value)}
   const open=IDBFactory.prototype.open;IDBFactory.prototype.open=function(...args){window.qaDatabaseOpens++;return open.apply(this,args)}
  },{key,original,mode})
  await page.goto(url);await page.waitForSelector('[data-action="tracks-load-retry"]')
  assert.equal(await page.evaluate(()=>window.qaOriginalState()),original)
  assert.equal(await page.evaluate(()=>window.qaStateWrites),0)
  assert.equal(await page.evaluate(()=>window.qaDatabaseOpens),0)
  assert.equal(await page.locator('[data-nav]').count(),0)
  if(mode==='temporary-read-error') {
   await page.evaluate(()=>sessionStorage.setItem('qa-state-read-failure','0'))
   await Promise.all([page.waitForEvent('load'),page.locator('[data-action="tracks-load-retry"]').click()])
   await page.waitForSelector('[data-nav="user"]')
   assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.joined),true)
   assert.deepEqual(await page.evaluate(()=>window.__IEUM_V2__.state.projectLikes),JSON.parse(original).projectLikes)
  } else {
   await Promise.all([page.waitForEvent('load'),page.locator('[data-action="tracks-load-retry"]').click()])
   await page.waitForSelector('[data-action="tracks-load-retry"]')
   assert.equal(await page.evaluate(()=>window.qaOriginalState()),original)
   assert.equal(await page.evaluate(()=>window.qaStateWrites),0)
  }
  assert.deepEqual(errors,[]);await context.close()
 }
 const context=await browser.newContext({permissions:['microphone']})
 await context.addInitScript(()=>{localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'}));window.qaMicRequests=0;const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=(...args)=>{window.qaMicRequests++;return get(...args)}})
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message))
 await page.goto(url);await page.waitForSelector('[data-nav="folder"]');await page.locator('[data-nav="folder"]').click();await page.locator('[data-action="resume-project"]').click();await page.waitForSelector('[data-action="record-part"]')
 const original=await page.evaluate(()=>localStorage.getItem('ieum-v2:user-state:v7'))
 await page.evaluate(()=>{window.qaFailStateWrite=true;const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(this===localStorage&&key==='ieum-v2:user-state:v7'&&window.qaFailStateWrite)throw new DOMException('QA storage full','QuotaExceededError');return set.call(this,key,value)}})
 await page.locator('[data-action="record-part"]').click();await page.waitForSelector('[data-action="record-start"]')
 await page.waitForFunction(()=>!document.querySelector('[data-action="record-start"]')?.disabled)
 const frame=await page.locator('.recording-screen').boundingBox()
 await page.locator('[data-action="record-start"]').click()
 await page.waitForSelector('[data-action="user-state-save-retry"]')
 await page.waitForFunction(()=>document.querySelector('.recording-screen')?.dataset.recordingStatus==='recording')
 assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'recording')
 assert.deepEqual(await page.locator('.recording-screen').boundingBox(),frame)
 await page.evaluate(()=>{window.qaRecorderNode=document.querySelector('.recording-screen')})
 assert.equal(await page.evaluate(()=>localStorage.getItem('ieum-v2:user-state:v7')),original)
 await page.locator('[data-action="user-state-save-retry"]').click()
 await page.waitForSelector('[data-action="user-state-save-retry"]')
 assert.equal(await page.evaluate(()=>document.querySelector('.recording-screen')===window.qaRecorderNode),true)
 await page.evaluate(()=>{window.qaFailStateWrite=false})
 await page.locator('[data-action="user-state-save-retry"]').click()
 await page.waitForFunction(()=>!document.querySelector('[data-action="user-state-save-retry"]'))
 assert.equal(await page.evaluate(()=>document.querySelector('.recording-screen')===window.qaRecorderNode),true)
 assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'recording')
 assert.deepEqual(await page.locator('.recording-screen').boundingBox(),frame)
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ieum-v2:user-state:v7')))
 assert.equal(saved.joined,true);assert.equal(saved.mainKeyLocked,true);assert.ok(Object.keys(saved.projectActivity).length)
 assert.equal(await page.evaluate(()=>window.qaMicRequests),1)
 assert.deepEqual(errors,[]);await context.close()
 console.log(JSON.stringify({passed:true,invalidJsonAndShapePreserved:true,temporaryReadRetryRestoresState:true,noDefaultOverwriteOrDatabaseInitialization:true,quotaRetryKeepsRecorderMounted:true,latestInMemoryStateSaved:true,limits:'Isolated native Storage failures and rendered app; no physical device or backend acceptance.'}))
} finally {await browser.close()}
