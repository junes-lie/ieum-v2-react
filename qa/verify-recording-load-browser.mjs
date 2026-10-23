import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4295/'
const out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-recording-load'
const repeats=Number(process.env.IEUM_QA_REPEATS||1)
await mkdir(out,{recursive:true})
let server,browser
const results=[]
try{
 if(!process.env.IEUM_BASE_URL){
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4295','--strictPort'],{cwd:new URL('../',import.meta.url),stdio:['ignore','pipe','inherit']})
  await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Preview '+c)))})
 }
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,proxy:process.env.IEUM_BROWSER_PROXY?{server:process.env.IEUM_BROWSER_PROXY}:undefined,args:['--no-sandbox','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']})
 for(const width of (process.env.IEUM_QA_WIDTHS||'390,430').split(',').map(Number))for(let round=1;round<=repeats;round++){
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width,height:932},permissions:['microphone'],reducedMotion:'no-preference'})
  await context.addInitScript(()=>{
   window.qaDraws=[];window.qaRecorder=[];window.qaClocks=[];window.qaTasks=[]
   const draw=WebGLRenderingContext.prototype.drawArrays
   WebGLRenderingContext.prototype.drawArrays=function(...args){
    if(this.canvas.dataset.renderer==='webgl-particles'&&document.querySelector('[data-recording-status]')?.dataset.recordingStatus==='recording')window.qaDraws.push(performance.now())
    return draw.apply(this,args)
   }
   const start=MediaRecorder.prototype.start
   MediaRecorder.prototype.start=function(...args){for(const name of ['start','pause','resume','stop'])this.addEventListener(name,()=>window.qaRecorder.push({event:name,wallMs:performance.now(),audioSec:window.__IEUM_V2__?.audioRuntime.context?.currentTime}));return start.apply(this,args)}
   setInterval(()=>{const r=window.__IEUM_V2__?.audioRuntime;if(r?.recorder?.state==='recording')window.qaClocks.push({wallMs:performance.now(),audioSec:r.context.currentTime,elapsed:r.activeElapsedSec,started:r.activeStartedAt})},250)
   if(PerformanceObserver.supportedEntryTypes?.includes('longtask'))new PerformanceObserver(list=>window.qaTasks.push(...list.getEntries().map(v=>({start:v.startTime,duration:v.duration})))).observe({type:'longtask',buffered:true})
  })
  const page=await context.newPage(),errors=[];let timer,busy=false,captures=0
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000)
  const label=`${width}-${round}`
  try{
   const url=new URL(base);url.searchParams.set('scene','workspace');url.searchParams.set('run','recording-load')
   await page.goto(url.href);await page.waitForSelector('.workspace-v2-screen')
   await page.locator('[data-action="record-part"]').click();await page.locator('[data-action="record-start"]:enabled').waitFor()
   timer=setInterval(async()=>{if(busy)return;busy=true;try{await page.screenshot({animations:'allow'});captures++}catch{}finally{busy=false}},250)
   await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]')
   await page.waitForFunction(()=>document.querySelector('.lyrics .active')?.textContent==='오늘도 함께해요')
   await page.locator('[data-action="record-pause"]').click();await page.waitForTimeout(450);await page.locator('[data-action="record-resume"]').click()
   await page.locator('[data-action="record-submit"]:enabled').waitFor({timeout:45000})
   clearInterval(timer);timer=null
   const record=await page.evaluate(async()=>{
    const r=window.__IEUM_V2__.audioRuntime
    const data=await r.recordingBlob.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('')
    const frames=[...new Set(window.qaDraws)],span=frames.length>1?(frames.at(-1)-frames[0])/1000:0
    const start=window.qaRecorder.find(v=>v.event==='start'),stop=window.qaRecorder.find(v=>v.event==='stop')
    return {hash,bytes:data.byteLength,duration:r.decoded?.duration,timeline:r.activeElapsedSec,syncOffset:r.syncOffsetSec,micActive:Boolean(r.stream?.active),draws:window.qaDraws.length,renderFrames:window.qaDraws.length/2,renderSpanSec:span,renderFps:span?(window.qaDraws.length/2-1)/span:0,wallSpanMs:stop.wallMs-start.wallMs,audioSpanSec:stop.audioSec-start.audioSec,events:window.qaRecorder,clocks:window.qaClocks,longTasks:window.qaTasks,partIds:window.__IEUM_V2__.state.activeProject.parts.map(p=>p.id),submitted:Object.keys(window.__IEUM_V2__.state.activeTracks)}
   })
   const data=await page.evaluate(async()=>Array.from(new Uint8Array(await window.__IEUM_V2__.audioRuntime.recordingBlob.arrayBuffer())))
   await writeFile(`${out}/original-${label}.webm`,Buffer.from(data))
   await page.locator('.record-review audio').waitFor({state:'attached'})
   await page.screenshot({path:`${out}/review-${label}.png`})
   assert.equal(record.micActive,false);assert.deepEqual(record.partIds,['soprano','alto','tenor','bass']);assert.deepEqual(record.submitted,[]);assert.deepEqual(errors,[])
   const durationInRange=record.duration>21.9&&record.duration<22.6
   results.push({width,round,captures,durationInRange,...record})
   await writeFile(`${out}/result-${label}.json`,JSON.stringify(results.at(-1),null,2))
   console.log(JSON.stringify({width,round,captures,duration:record.duration,timeline:record.timeline,renderFps:record.renderFps,durationInRange,maxLongTaskMs:Math.max(0,...record.longTasks.map(v=>v.duration))}))
  }catch(error){results.push({width,round,error:String(error),errors});await writeFile(`${out}/failure-${label}.json`,JSON.stringify({error:String(error),errors,diagnostic:await page.evaluate(()=>({events:window.qaRecorder,clocks:window.qaClocks,draws:window.qaDraws.length,status:document.querySelector('[data-recording-status]')?.dataset.recordingStatus,text:document.body.innerText}))},null,2))}
  finally{clearInterval(timer);await context.close()}
 }
 await writeFile(`${out}/results.json`,JSON.stringify({scope:'Real registered 22s backing, native synthetic microphone, pause/resume and repeated screenshot readback in isolated browsers. No original edits or injected submitted Tracks. Not physical device or indefinite load acceptance.',results},null,2))
 if(results.some(r=>r.error||!r.durationInRange))process.exitCode=1
}finally{await browser?.close();server?.kill()}
