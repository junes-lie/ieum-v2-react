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
 await page.evaluate(async()=>{
  const id='ieum-v2:voice-profile:v7',blob=await(await fetch('/demo-stems/soprano.wav')).blob()
  const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)})
  await new Promise(resolve=>{const tx=db.transaction('tracks','readwrite'),s=tx.objectStore('tracks');s.put({id:id+':range',projectId:id,kind:'voice-range',range:'C3–G4',rangeData:{lowMidi:48,highMidi:67,label:'C3–G4'}});s.put({id:id+':sample',projectId:id,kind:'voice-sample',blob,duration:7,songLabel:'Protected sample'});tx.oncomplete=resolve});db.close()
 })
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.sampleSong==='Protected sample')
 await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click()
 await page.locator('.sample-select-stage > button.primary').click();await page.locator('[data-action="sample-start"]').click()
 await page.waitForSelector('[data-action="sample-stop"]');await page.waitForTimeout(3200)
 await page.evaluate(()=>{
  const ctx=window.__IEUM_V2__.audioRuntime.context,decode=ctx.decodeAudioData.bind(ctx)
  ctx.decodeAudioData=async bytes=>{ctx.decodeAudioData=decode;window.qaStopDecodePending=true;const decoded=await decode(bytes);await new Promise(resolve=>window.qaReleaseStopDecode=()=>{window.qaStopReleased=true;resolve()});window.qaStopDecodeDelivered=true;return decoded}
 })
 await page.locator('[data-action="sample-stop"]').click();await page.waitForFunction(()=>typeof window.qaReleaseStopDecode==='function')
 await page.locator('[data-nav="user"]').click();await page.locator('.voice-screen').waitFor({state:'detached'});await page.evaluate(()=>window.qaReleaseStopDecode())
 await page.waitForFunction(()=>window.qaStopUrls.length>0&&window.qaStopRevoked.includes(window.qaStopUrls.at(-1)),null,{timeout:5000}).catch(async error=>{console.log(JSON.stringify(await page.evaluate(()=>({urls:window.qaStopUrls,revoked:window.qaStopRevoked,released:window.qaStopReleased,delivered:window.qaStopDecodeDelivered,screen:window.__IEUM_V2__.state.screen,stream:!!window.__IEUM_V2__.audioRuntime.stream,asset:document.querySelector('script[type="module"]').src}))));throw error})
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile.sampleSong),'Protected sample')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream),null)
 assert.deepEqual(await page.evaluate(()=>({decoded:window.__IEUM_V2__.audioRuntime.decoded,lastAnalysis:window.__IEUM_V2__.audioRuntime.lastAnalysis})),{decoded:null,lastAnalysis:null},'Late completion must not reattach cleared analysis buffers')
 assert.deepEqual(errors,[])
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.sampleSong==='Protected sample')
 console.log(JSON.stringify({passed:true,lateStopUnownedUrlReleased:true,clearedAnalysisBuffersPreserved:true,existingProfilePreserved:true,streamReleased:true,limits:'Native browser/fake microphone; delayed decoding, no physical-device acceptance'}))
}finally{await browser.close()}
