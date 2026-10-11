import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try {
 const context=await browser.newContext({permissions:['microphone']})
 await context.addInitScript(()=>{
  const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL)
  window.qaStopUrls=[];window.qaStopRevoked=[]
  URL.createObjectURL=blob=>{const url=create(blob);if(blob.type.includes('webm'))window.qaStopUrls.push(url);return url}
  URL.revokeObjectURL=url=>{window.qaStopRevoked.push(url);return revoke(url)}
 })
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/')
 await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state?.projectTracks||{}).length===2)
 const originalProfileHash=await page.evaluate(async()=>{
  const id='ieum-v2:voice-profile:v7',blob=await(await fetch('/demo-stems/soprano.wav')).blob()
  const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)})
  await new Promise(resolve=>{const tx=db.transaction('tracks','readwrite'),s=tx.objectStore('tracks');s.put({id:id+':range',projectId:id,kind:'voice-range',range:'C3–G4',rangeData:{lowMidi:48,highMidi:67,label:'C3–G4'}});s.put({id:id+':sample',projectId:id,kind:'voice-sample',blob,duration:7,songLabel:'Protected sample'});tx.oncomplete=resolve});db.close();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',')
 })
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.sampleSong==='Protected sample')
 await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click()
 await page.locator('.sample-select-stage > button.primary').click();await page.locator('[data-action="sample-start"]').click()
 await page.waitForSelector('[data-action="sample-stop"]');await page.waitForTimeout(3200)
 await page.locator('[data-action="sample-stop"]').click();await page.waitForSelector('[data-action="voice-complete"]');
 const takeUrl=await page.locator('.sample-stage audio').getAttribute('src');
 await page.locator('[data-nav="user"]').click();await page.locator('.voice-screen').waitFor({state:'detached'});
 console.log(JSON.stringify(await page.evaluate(url=>({url,revoked:window.qaStopRevoked.includes(url),profile:window.__IEUM_V2__.state.profile.sampleSong}),takeUrl)));
 assert.equal(await page.evaluate(url=>window.qaStopRevoked.includes(url),takeUrl),true,'Unsubmitted Sample Review URL must be released after navigation');
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile.sampleSong),'Protected sample')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream),null)
 assert.deepEqual(await page.evaluate(()=>({decoded:window.__IEUM_V2__.audioRuntime.decoded,lastAnalysis:window.__IEUM_V2__.audioRuntime.lastAnalysis})),{decoded:null,lastAnalysis:null},'Review navigation must preserve cleared analysis buffers')
 assert.deepEqual(errors,[])
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.sampleSong==='Protected sample')
 await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click();await page.locator('.sample-select-stage > button.primary').click();await page.locator('[data-action="sample-start"]').click();await page.waitForSelector('[data-action="sample-stop"]');await page.waitForTimeout(3200);await page.locator('[data-action="sample-stop"]').click();await page.waitForSelector('[data-action="voice-complete"]');
 const pendingUrl=await page.locator('.sample-stage audio').getAttribute('src');await page.locator('[data-action="voice-complete"]').click();
 await page.evaluate(()=>{
  const open=indexedDB.open.bind(indexedDB),put=IDBObjectStore.prototype.put;
  indexedDB.open=(...args)=>{indexedDB.open=open;const request=open(...args);Object.defineProperty(request,'onsuccess',{configurable:true,set(handler){request.addEventListener('success',event=>{window.qaReleasePendingSave=()=>handler.call(request,event)},{once:true})}});return request};
  IDBObjectStore.prototype.put=function(value,...args){if(value.kind==='voice-sample')throw new Error('QA late Sample save failure');return put.call(this,value,...args)};
 });
 await page.locator('[data-action="profile-finish"]').click();await page.waitForFunction(()=>typeof window.qaReleasePendingSave==='function');await page.locator('[data-nav="user"]').click();await page.locator('.voice-screen').waitFor({state:'detached'});await page.evaluate(()=>window.qaReleasePendingSave());
 await page.waitForFunction(url=>window.qaStopRevoked.includes(url),pendingUrl);
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile.sampleSong),'Protected sample');assert.deepEqual(errors,[]);
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.sampleSong==='Protected sample');
 const finalProfileHash=await page.evaluate(async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await(await fetch(window.__IEUM_V2__.state.profile.sampleUrl)).arrayBuffer()))).join(','));assert.equal(finalProfileHash,originalProfileHash);
 console.log(JSON.stringify({passed:true,originalProfileBytesExact:true,unsubmittedReviewUrlReleased:true,lateFailedSaveUrlReleased:true,clearedAnalysisBuffersPreserved:true,existingProfilePreserved:true,streamReleased:true,limits:'Native browser/fake microphone; unsaved Review navigation, no physical-device acceptance'}))
}finally{await browser.close()}
