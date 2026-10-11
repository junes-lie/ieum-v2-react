import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const page=await browser.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4194/')
 await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state?.projectTracks||{}).length===2)
 const snapshot=()=>page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('ieum-v2-records',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})
  const records=await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readonly'),request=tx.objectStore('tracks').getAll();tx.oncomplete=()=>resolve(request.result);tx.onabort=()=>reject(tx.error)})
  db.close()
  return Promise.all(records.map(async record=>({id:record.id,kind:record.kind,origin:record.origin,hash:record.blob?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await record.blob.arrayBuffer()))).join(','):null})))
 })
 const original=await snapshot()
 await page.addInitScript(()=>{
  window.qaFailBootstrap=true;window.qaBootstrapWrites=0;window.qaBootstrapMic=0;window.qaBootstrapReadFailures=0
  const read=IDBObjectStore.prototype.getAll,put=IDBObjectStore.prototype.put
  IDBObjectStore.prototype.getAll=function(...args){if(window.qaFailBootstrap){window.qaBootstrapReadFailures++;throw new Error('QA bootstrap read failure')};return read.apply(this,args)}
  IDBObjectStore.prototype.put=function(...args){window.qaBootstrapWrites++;return put.apply(this,args)}
  navigator.mediaDevices.getUserMedia=async()=>{window.qaBootstrapMic++;throw new Error('Bootstrap must not request microphone')}
 })
 await page.reload();await page.waitForSelector('[data-action="tracks-load-retry"]')
 assert.equal(await page.locator('[data-action="record-part"]').count(),0)
 assert.equal(await page.locator('[data-nav]').count(),0)
 assert.equal(await page.evaluate(()=>window.qaBootstrapWrites),0)
 await page.locator('[data-action="tracks-load-retry"]').click()
 await page.waitForFunction(()=>window.qaBootstrapReadFailures>=4&&document.querySelector('[data-action="tracks-load-retry"]')?.closest('[role="alert"]'))
 assert.equal(await page.locator('[data-action="record-part"]').count(),0)
 await page.evaluate(()=>{window.qaFailBootstrap=false})
 await page.locator('[data-action="tracks-load-retry"]').click()
 await page.waitForSelector('[data-nav="user"]')
 assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),2)
 assert.equal(await page.evaluate(()=>window.qaBootstrapWrites),0)
 assert.equal(await page.evaluate(()=>window.qaBootstrapMic),0)
 assert.deepEqual(await snapshot(),original)
 assert.deepEqual(errors,[])
 await page.evaluate(()=>{const key='ieum-v2:user-state:v7',state=JSON.parse(localStorage.getItem(key));state.createdProjects=[{...window.__IEUM_V2__.state.activeProject,id:'qa-late-read',seed:'qa-preserved-seed',ownerPartId:'tenor'}];localStorage.setItem(key,JSON.stringify(state))})
 await page.addInitScript(()=>{
  window.qaFailBootstrap=false;window.qaFailLateRead=true;window.qaReadCount=0;window.qaCreatedUrls=[];window.qaRevokedUrls=[]
  const read=IDBObjectStore.prototype.getAll,create=URL.createObjectURL,revoke=URL.revokeObjectURL
  IDBObjectStore.prototype.getAll=function(...args){window.qaReadCount++;if(window.qaFailLateRead&&window.qaReadCount%3===0)throw new Error('QA late project read failure');return read.apply(this,args)}
  URL.createObjectURL=function(blob){const url=create.call(this,blob);window.qaCreatedUrls.push(url);return url}
  URL.revokeObjectURL=function(url){window.qaRevokedUrls.push(url);return revoke.call(this,url)}
 })
 await page.reload();await page.waitForSelector('[data-action="tracks-load-retry"]')
 assert.equal(await page.evaluate(()=>window.qaCreatedUrls.length),2)
 assert.deepEqual(await page.evaluate(()=>window.qaRevokedUrls),await page.evaluate(()=>window.qaCreatedUrls))
 await page.locator('[data-action="tracks-load-retry"]').click()
 await page.waitForFunction(()=>window.qaCreatedUrls.length===4&&window.qaRevokedUrls.length===4)
 assert.equal(await page.locator('[data-nav]').count(),0)
 await page.evaluate(()=>{window.qaFailLateRead=false})
 await page.locator('[data-action="tracks-load-retry"]').click();await page.waitForSelector('[data-nav="user"]')
 assert.equal(await page.evaluate(()=>window.qaCreatedUrls.length-window.qaRevokedUrls.length),2)
 assert.equal(await page.evaluate(()=>window.qaBootstrapWrites),0)
 assert.deepEqual(await snapshot(),original)
 const liveUrls=await page.evaluate(()=>Object.values(window.__IEUM_V2__.state.projectTracks).map(track=>track.url))
 assert.equal(await page.evaluate(async urls=>(await Promise.all(urls.map(url=>fetch(url).then(response=>response.ok)))).every(Boolean),liveUrls),true)
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,failedReadBlocksApp:true,repeatedFailureStaysBlocked:true,retryRestoresSavedTracks:true,noWritesOrMic:true,originalHashesPreserved:true,lateFailureReleasesOnlyOwnedUrls:true,repeatedRetryDoesNotAccumulateUrls:true,successfulRecoveryKeepsPlayableUrls:true,limits:'Isolated rendered app/native IndexedDB; no physical mic, listening, design or backend acceptance.'}))
} finally {await browser.close()}
