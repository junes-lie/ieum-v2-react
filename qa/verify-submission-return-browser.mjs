import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=(process.env.IEUM_BASE_URL||'http://127.0.0.1:4270').replace(/\/$/,'')+'/'
const out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-submission-return'
await mkdir(out,{recursive:true})
let server,browser,page
try{
 if(!process.env.IEUM_BASE_URL){
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4270','--strictPort'],{stdio:['ignore','pipe','inherit']})
  await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})
 }
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']})
 for(const width of (process.env.IEUM_QA_WIDTHS||'390,430').split(',').map(Number)){
  const context=await browser.newContext({viewport:{width,height:932},permissions:['microphone'],reducedMotion:'reduce'})
  await context.addInitScript(()=>{
   window.qaForwardCalls=0
   const forward=History.prototype.forward
   History.prototype.forward=function(...args){window.qaForwardCalls++;return forward.apply(this,args)}
   // Model the real gap between React rendering a committed Track and the effect
   // updating its presentation bridge. Only that bridge is stale; native capture,
   // history, storage, the Recorder guard and the real app remain untouched.
   let bridge
   Object.defineProperty(window,'__IEUM_V2__',{configurable:true,get:()=>{
    if(!bridge)return bridge
    return {...bridge,state:{...bridge.state,screen:window.qaStaleRecordBridge?'record':bridge.state.screen}}
   },set:value=>{bridge=value}})
  })
  page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message))
  const takes=[]
  for(const actor of ['a','b']){
   await page.goto(new URL('?scene=music-'+actor,base).href)
   await page.waitForSelector('.workspace-v2-screen')
   await page.locator('[data-action="record-part"]').click()
   await page.locator('[data-action="record-start"]:enabled').click()
   await page.waitForFunction(()=>document.querySelector('.lyrics .active')?.textContent==='오늘도 함께해요')
   await page.locator('[data-action="record-stop"]').click()
   await page.locator('[data-action="record-submit"]:enabled').waitFor()
   const original=await page.evaluate(async()=>{
    const blob=window.__IEUM_V2__.audioRuntime.recordingBlob
    return {hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].join(','),bytes:blob.size}
   })
   await page.screenshot({path:`${out}/review-${width}-${actor}.png`})
   await page.evaluate(()=>{window.qaStaleRecordBridge=true})
   await page.locator('[data-action="record-submit"]').click()
   await page.waitForSelector(actor==='a'?'.workspace-v2-screen':'.complete-screen',{timeout:15000})
   assert.equal(await page.evaluate(()=>window.qaForwardCalls),0,'Committed Track must bypass the stale presentation guard without browser.forward')
   await page.evaluate(()=>{window.qaStaleRecordBridge=false})
   const submitted=await page.evaluate(async actor=>{
    const t=window.__IEUM_V2__.state.activeTracks['voice-'+actor]
    return {hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await t.blob.arrayBuffer()))].join(','),bytes:t.blob.size,duration:t.duration}
   },actor)
   assert.equal(submitted.hash,original.hash);assert.equal(submitted.bytes,original.bytes)
   takes.push({actor,bytes:submitted.bytes,duration:submitted.duration})
  }
  assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks).length),2)
  await page.locator('.complete-screen .play-btn').click()
  await page.waitForFunction(()=>document.querySelector('.complete-screen audio')?.currentTime>.2)
  await page.screenshot({path:`${out}/complete-${width}.png`})
  await page.reload();await page.waitForFunction(()=>Boolean(window.__IEUM_V2__?.state.activeMix?.blob))
  assert.deepEqual(errors,[])
  await writeFile(`${out}/result-${width}.json`,JSON.stringify({width,takes,scope:'Short native microphone Takes with real backing; submission/history race, local Auto Mix and reload. Not full 22s capture acceptance.'},null,2))
  console.log('PASS',width,'short native Takes; stale bridge cannot reject committed submission; exact original hashes, Workspace/Completed, local Mix playback and reload')
  await context.close()
 }
}catch(error){
 await page?.screenshot({path:`${out}/failure.png`}).catch(()=>{})
 console.error('SUBMISSION RETURN',await page?.evaluate(()=>({screen:window.__IEUM_V2__?.state.screen,forward:window.qaForwardCalls,history:history.state,text:document.body.innerText.slice(-1300)})).catch(()=>null));throw error
}
finally{await browser?.close();server?.kill()}
