import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4296/'
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-review-save-order'
await mkdir(output,{recursive:true})
let server,browser
try {
 if(!process.env.IEUM_BASE_URL){
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4296','--strictPort'],{cwd:new URL('../',import.meta.url),stdio:['ignore','pipe','inherit']})
  await new Promise((resolve,reject)=>{server.stdout.on('data',data=>String(data).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',code=>reject(Error(`Preview exited ${code}`)))})
 }
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,proxy:process.env.IEUM_BROWSER_PROXY?{server:process.env.IEUM_BROWSER_PROXY}:undefined,args:['--no-sandbox','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']})
 const results=[]
 for(const width of (process.env.IEUM_QA_WIDTHS||'390,430').split(',').map(Number)){
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width,height:932},permissions:['microphone'],reducedMotion:'reduce'})
  await context.addInitScript(()=>{
   window.qaDraftPending=false;window.qaOverlappingDecodes=0;window.qaDraftWrites=0
   const put=IDBObjectStore.prototype.put
   IDBObjectStore.prototype.put=function(value,...args){
    if(value?.kind==='temporary-recording'&&window.qaDelayDraft){this.transaction.qaDraftSave=true;window.qaDraftPending=true;window.qaDraftWrites++}
    return put.call(this,value,...args)
   }
   const completion=Object.getOwnPropertyDescriptor(IDBTransaction.prototype,'oncomplete')
   Object.defineProperty(IDBTransaction.prototype,'oncomplete',{...completion,set(handler){
    const transaction=this
    completion.set.call(this,function(event){
     if(transaction.qaDraftSave){window.qaReleaseDraft=()=>{window.qaDraftPending=false;window.qaDelayDraft=false;handler.call(transaction,event)};return}
     handler.call(transaction,event)
    })
   }})
   const decode=AudioContext.prototype.decodeAudioData
   AudioContext.prototype.decodeAudioData=function(...args){if(window.qaDraftPending)window.qaOverlappingDecodes++;return decode.apply(this,args)}
  })
  const page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(20000)
  try {
   const target=new URL(base);target.searchParams.set('scene','workspace');target.searchParams.set('run','review-save-order')
   await page.goto(target.href);await page.waitForSelector('.workspace-v2-screen')
   assert.deepEqual(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks)),[])
   await page.locator('[data-action="record-part"]').click();await page.locator('[data-action="record-start"]:enabled').waitFor()
   await page.evaluate(()=>window.qaDelayDraft=true)
   await page.locator('[data-action="record-start"]').click()
   await page.waitForSelector('[data-action="record-pause"]')
   await page.waitForFunction(()=>typeof window.qaReleaseDraft==='function',null,{timeout:45000})
   assert.equal(await page.locator('[data-action="record-submit"]').isDisabled(),true)
   await page.waitForTimeout(1000)
   const overlap=await page.evaluate(()=>window.qaOverlappingDecodes)
   assert.equal(overlap,0,'Optional Review mix must not decode/render while the original Take save is awaiting completion')
   const original=await page.evaluate(async()=>({hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await window.__IEUM_V2__.audioRuntime.recordingBlob.arrayBuffer())),v=>v.toString(16).padStart(2,'0')).join(''),bytes:window.__IEUM_V2__.audioRuntime.recordingBlob.size,duration:window.__IEUM_V2__.audioRuntime.decoded.duration,micActive:Boolean(window.__IEUM_V2__.audioRuntime.stream?.active)}))
   await writeFile(`${output}/original-${width}.json`,JSON.stringify(original,null,2))
   assert.ok(original.duration>21.9&&original.duration<22.6,JSON.stringify(original));assert.equal(original.micActive,false)
   await page.screenshot({path:`${output}/saving-${width}.png`})
   await page.evaluate(()=>window.qaReleaseDraft())
   await page.locator('[data-action="record-submit"]:enabled').waitFor()
   await page.locator('.record-review audio').waitFor({state:'attached'})
   await page.locator('.record-review .play-btn').click()
   await page.waitForFunction(()=>document.querySelector('.record-review audio')?.currentTime>.15)
   const rect=await page.locator('[data-action="record-submit"]').boundingBox();assert.ok(rect.y+rect.height<=932)
   await page.screenshot({path:`${output}/review-${width}.png`})
   await page.locator('[data-action="record-submit"]').click();await page.waitForSelector('.workspace-v2-screen')
   await page.reload();await page.waitForFunction(()=>Boolean(window.__IEUM_V2__?.state.activeTracks.tenor?.blob))
   const restored=await page.evaluate(async()=>{const state=window.__IEUM_V2__.state,t=state.activeTracks.tenor;return {hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await t.blob.arrayBuffer())),v=>v.toString(16).padStart(2,'0')).join(''),bytes:t.blob.size,tracks:Object.keys(state.activeTracks),mix:Boolean(state.activeMix?.blob)}})
   assert.equal(restored.hash,original.hash);assert.equal(restored.bytes,original.bytes);assert.deepEqual(restored.tracks,['tenor']);assert.equal(restored.mix,false);assert.deepEqual(errors,[])
   results.push({width,original,restored,overlappingDecodes:overlap,delayedSave:true,reviewPlayback:true})
   console.log('PASS',width,'delayed original save precedes Review mix, real 22s backing/native synthetic microphone, Review playback, submission and reload preserve hash; remains 1/4')
  }finally{await context.close()}
 }
 await writeFile(`${output}/results.json`,JSON.stringify({scope:'Isolated synthetic microphone and delayed IndexedDB completion. Not physical, four-user or server acceptance.',results},null,2))
}finally{await browser?.close();server?.kill()}
