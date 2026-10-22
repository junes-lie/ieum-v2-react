import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4264/'
let server,browser,observedPage
try{
 if(!process.env.IEUM_BASE_URL){
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4264','--strictPort'],{stdio:['ignore','pipe','inherit']})
  await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})
 }
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
 for(const width of (process.env.IEUM_QA_WIDTHS||'390,430').split(',').map(Number)){
  const context=await browser.newContext({viewport:{width,height:932},permissions:['microphone'],reducedMotion:'reduce'})
  const page=await context.newPage(),errors=[]
  observedPage=page
  page.on('pageerror',e=>errors.push(e.message))
  const screen=async name=>page.waitForFunction(name=>window.__IEUM_V2__?.state.screen===name,name)
  await page.goto(new URL('?embedded=1&scene=profile-ready',base).href)
  await page.locator('[data-nav="search"]').click()
  assert.ok(await page.locator('[data-result-art="sleeve-record"]').count())
  await page.getByRole('tab',{name:'완성곡',exact:true}).click()
  assert.ok(await page.locator('[data-result-art="record"] .record').count())
  assert.equal(await page.locator('[data-result-art="record"] .v2-song-artwork').count(),0)
  await page.getByRole('tab',{name:'곡',exact:true}).click()
  await page.getByRole('textbox').fill('Thousand')
  await page.locator('.search-v2-result').first().click();await screen('detail')
  assert.equal(await page.evaluate(()=>scrollY),0)
  assert.equal(await page.locator('.detail-member-controls').count(),0)
  assert.match(await page.locator('.detail-match-reasons').innerText(),/시연 프로필.*실제 녹음 분석값/)
  await page.locator('[data-action="back"]').click();await screen('search')
  assert.equal(await page.getByRole('textbox').inputValue(),'Thousand')
  await page.locator('.search-v2-result').first().click()
  await page.locator('[data-part="tenor"] .row-action').click()
  await page.locator('[data-action="join-part"]').click();await screen('workspace')
  assert.equal(await page.evaluate(()=>scrollY),0)
  assert.equal(await page.locator('.v2-part-actions .v2-metal-play').count(),0)
  await page.locator('[data-action="record-part"]').click()
  await page.locator('[data-action="record-start"]:enabled').waitFor()
  assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),932)
  await page.locator('[data-action="back"]').click();await screen('workspace')
  await page.locator('[data-action="back"]').click();await screen('detail')
  await page.goBack();await screen('search')
  // Real native capture and browser Back use the same source-preserving draft path.
  await page.goto(new URL('?embedded=1&scene=music-a',base).href)
  await page.locator('[data-action="record-part"]').click()
  await page.locator('[data-action="record-start"]:enabled').click()
  await page.locator('[data-action="record-pause"]').waitFor()
  await page.waitForTimeout(1000)
  page.once('dialog',d=>d.dismiss())
  await page.goBack();await page.waitForURL(/#record$/);await screen('record')
  await page.locator('[data-action="record-pause"]').waitFor()
  page.once('dialog',d=>d.accept())
  await page.goBack();await screen('workspace')
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream?.active||false),false)
  await page.locator('[data-action="record-part"]').click()
  await page.locator('[data-action="record-submit"]:enabled').waitFor()
  assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks).length),0,'Back saves a draft, never submits')
  // Explicit QA-only PCM fixtures isolate Mix selection from intermittent capture
  // scheduling. They are never evidence of a microphone or a completed song.
  await page.evaluate(async()=>{
   const project=window.__IEUM_V2__.state.activeProject,source=project.audioSource
   const ref=Object.fromEntries(['songId','key','revision','duration','sourceSha256','backingSha256'].map(k=>[k,source[k]]))
   const rate=8000,n=rate*22
   const tone=hz=>{
    const bytes=new ArrayBuffer(44+n*2),v=new DataView(bytes)
    const text=(at,s)=>[...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)))
    text(0,'RIFF');v.setUint32(4,36+n*2,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,n*2,true)
    for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.sin(i*2*Math.PI*hz/rate)*2000,true)
    return new Blob([bytes],{type:'audio/wav'})
   }
   const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('ieum-v2-demo-records:music');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})
   try{await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');for(const [i,part] of project.parts.entries())tx.objectStore('tracks').put({id:project.id+':'+part.id,projectId:project.id,partId:part.id,kind:'project-track',origin:'live-microphone-recording',participantId:'qa-fixture-'+i,participant:'QA tone fixture '+i,demo:true,disclosure:'QA PCM fixture; not a user recording',blob:tone(330+i*110),duration:22,syncOffsetMs:0,audioSourceRef:ref,features:{version:'ieum-basic-voice-v3',brightness:.3,roughness:.2},createdAt:new Date().toISOString()});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})}finally{db.close()}
  })
  await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state.screen==='complete'&&Boolean(window.__IEUM_V2__.state.activeMix?.blob))
  await page.evaluate(()=>{const state={...history.state,ieumScreen:'workspace'};history.pushState(state,'','#workspace');dispatchEvent(new PopStateEvent('popstate',{state}))})
  const toggles=page.locator('.v2-part-actions input[type=checkbox]')
  await page.locator('[data-action="turntable-play"]:enabled').click()
  await page.waitForFunction(()=>document.querySelector('#current-mix audio')?.currentTime>.1)
  const previous=await page.locator('#current-mix audio').getAttribute('src')
  await toggles.first().uncheck()
  await page.waitForFunction(src=>{const a=document.querySelector('#current-mix audio');return a&&a.src!==src&&a.paused},previous)
  assert.match(await page.locator('.current-mix-head').innerText(),/1개 선택/)
  await toggles.nth(1).uncheck();await page.waitForFunction(()=>document.querySelector('[data-action="turntable-play"]')?.disabled)
  await toggles.first().check();await page.locator('[data-action="turntable-play"]:enabled').waitFor()
  assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks).length),2)
  assert.deepEqual(errors,[])
  console.log('PASS',width,'Search/state, native Back cancel/save/Review; PCM fixture Mix source rebuild, pause and zero selection; synthetic microphone and explicit audio fixtures')
  await context.close()
 }
}catch(error){
 console.error('UI DIAGNOSTIC',await observedPage?.evaluate(()=>({screen:window.__IEUM_V2__?.state.screen,project:window.__IEUM_V2__?.state.activeProject?.id,tracks:Object.keys(window.__IEUM_V2__?.state.activeTracks||{}),text:document.body.innerText.slice(-1800)})).catch(()=>null));throw error
}finally{await browser?.close();server?.kill()}
