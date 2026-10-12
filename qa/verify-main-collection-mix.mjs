import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const context=await browser.newContext(),page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await context.addInitScript(()=>{
  window.qaMainMixWrites=0
  const put=IDBObjectStore.prototype.put
  IDBObjectStore.prototype.put=function(value,...args){if(value.kind==='auto-mix'){window.qaMainMixWrites++;if(sessionStorage.getItem('qa-main-mix-failure'))throw new Error('QA main Mix save refused')}return put.call(this,value,...args)}
 })
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4187/')
 await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state.projectTracks||{}).length===2)
 const original=await page.evaluate(async()=>{
  const projectId='ieum-thousand-years-v7',blob=await(await fetch('/demo-stems/soprano.wav')).blob()
  const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)})
  await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');for(const [partIndex,partId] of [[2,'tenor'],[3,'bass']])tx.objectStore('tracks').put({id:projectId+':'+partId,projectId,partId,partIndex,participantId:partId==='tenor'?'jisun':'qa-bass',participant:partId==='tenor'?'JISUN':'QA Bass',blob,duration:18,origin:'local-formant-singing-demo',layer:null});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})
  const records=await new Promise(resolve=>{const r=db.transaction('tracks').objectStore('tracks').getAll();r.onsuccess=()=>resolve(r.result.filter(v=>v.projectId===projectId&&v.blob&&v.kind!=='auto-mix'))})
  const hashes=await Promise.all(records.map(async v=>({id:v.id,hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await v.blob.arrayBuffer()))].join(',')})))
  db.close();localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor',projectLikes:[{projectId}]}));sessionStorage.setItem('qa-main-mix-failure','1');return hashes.sort((a,b)=>a.id.localeCompare(b.id))
 })
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__.state.mixStatus==='error')
 await page.locator('[data-nav="bookmark"]').click()
 const card=page.locator('.collection-card[data-project-id="ieum-thousand-years-v7"]')
 assert.equal(await card.locator('.collection-card-head > span').textContent(),'MIXING · 04/04','Main Collection must reflect all submitted Tracks until Mix persists')
 await card.locator('[data-action="open-project-like"]').click();await page.waitForSelector('.mix-error')
 assert.equal(await page.locator('.complete-screen').count(),0)
 assert.equal(await page.locator('[data-action="retry-auto-mix"]').count(),1)
 await page.evaluate(()=>{const retry=document.querySelector('[data-action="retry-auto-mix"]');retry.click();retry.click()})
 await page.waitForFunction(()=>window.qaMainMixWrites===2);await page.waitForSelector('[data-action="retry-auto-mix"]')
 assert.equal(await page.locator('.complete-screen').count(),0)
 await page.evaluate(()=>{sessionStorage.removeItem('qa-main-mix-failure');const retry=document.querySelector('[data-action="retry-auto-mix"]');retry.click();retry.click()})
 await page.waitForFunction(()=>window.__IEUM_V2__.state.mix?.blob)
 assert.equal(await page.evaluate(()=>window.qaMainMixWrites),3,'One main Mix job per explicit retry')
 await page.reload()
 await page.waitForFunction(()=>window.__IEUM_V2__.state.mix?.blob)
 await page.locator('[data-nav="bookmark"]').click()
 assert.equal(await card.locator('.collection-card-head > span').textContent(),'COMPLETE · 04/04')
 await card.locator('[data-action="open-project-like"]').click();await page.waitForSelector('.complete-screen')
 assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),4)
 const restored=await page.evaluate(async()=>Promise.all(Object.values(window.__IEUM_V2__.state.projectTracks).map(async v=>({id:v.id,hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await v.blob.arrayBuffer()))].join(',')}))))
 assert.deepEqual(restored.sort((a,b)=>a.id.localeCompare(b.id)),original,'Mix failure and recovery preserve every original Track hash')
 assert.deepEqual(errors,[])
 console.log('PASS main failed Mix/retry→MIXING, one job per double click, successful retry→COMPLETE retained after reload; four original Tracks preserved. Isolated audio only.')
 await context.close()
}finally{await browser.close()}
