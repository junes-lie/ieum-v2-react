import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdir,writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
const output=path.join(os.tmpdir(),'ieum-stage2-layout')
await mkdir(output,{recursive:true})
const results=[]
try{
 for(const width of [360,390,430]){
  const context=await browser.newContext({viewport:{width,height:932},permissions:['microphone'],locale:'ko-KR'})
  await context.addInitScript(()=>{if(!localStorage.getItem('ieum-v2:user-state:v7'))localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'}))})
  const page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await page.goto('http://127.0.0.1:4191/?design=figma')
  await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state?.projectTracks||{}).length===2)
  await page.evaluate(()=>location.hash='#workspace')
  await page.waitForSelector('[data-action="record-part"]')
  const measure=async screen=>{
   await page.locator(`.${screen}-screen`).screenshot({path:path.join(output,`${screen}-${width}.png`)})
   const geometry=await page.evaluate(()=>({bodyWidth:document.body.scrollWidth,viewport:innerWidth,screenWidth:document.querySelector('.screen').getBoundingClientRect().width,nav:!!document.querySelector('.bottom-nav'),record:!!document.querySelector('.record-particles[data-renderer="webgl-particles"]')}))
   assert.equal(geometry.bodyWidth,width,'Artwork must not cause horizontal page overflow')
   assert.equal(geometry.screenWidth,width)
   assert.ok(geometry.record)
   const icons=await page.locator('img[src^="/figma/"]').evaluateAll(images=>images.map(image=>({source:image.getAttribute('src'),loaded:image.complete&&image.naturalWidth>0,natural:image.naturalWidth,width:image.getBoundingClientRect().width})))
   for(const icon of icons){assert.ok(icon.loaded,`Missing Figma icon: ${icon.source}`);assert.ok(Math.abs(icon.width-icon.natural)<1,`Figma icon must retain its native dimensions: ${icon.source}`)}
   for(const player of await page.locator('.figma-player').all()){
    const layout=await player.evaluate(element=>{const label=element.querySelector('.player-clock').getBoundingClientRect(),seek=element.querySelector('input').getBoundingClientRect();return {labelHeight:label.height,seekTop:seek.top,labelBottom:label.bottom}})
    assert.equal(layout.labelHeight,16,'Player time must stay on one line')
    assert.ok(layout.seekTop>=layout.labelBottom,'Seek must sit below the time label')
   }
   results.push({width,screen,...geometry})
  }
  await measure('workspace')
  await page.locator('[data-action="toggle-project-like"]').click()
  await page.locator('[data-action="record-part"]').click()
  await page.waitForSelector('.recording-screen')
  assert.equal(await page.locator('.bottom-nav').count(),0)
  const chips=page.locator('.guide-track-chips input')
  assert.equal(await chips.count(),2)
  const wasChecked=await chips.first().isChecked()
  await chips.first().click()
  assert.notEqual(await chips.first().isChecked(),wasChecked)
  await page.locator('[data-action="record-start"]').click()
  await page.waitForSelector('[data-action="record-pause"]')
  await page.waitForSelector('.record-inflow[data-renderer="webgl-inflow"]')
  await measure('recording')
  await page.locator('[data-action="record-pause"]').click()
  await page.waitForSelector('[data-action="record-resume"]')
  await page.locator('[data-action="record-resume"]').click()
  await page.locator('[data-action="record-stop"]').click()
  await page.waitForSelector('[data-action="record-submit"]')
  assert.equal(await page.locator('.bottom-nav').count(),0)
  // Persisted synthetic audio fixture for layout only, never a real user/AI claim.
  await page.evaluate(async()=>{
   const {saveTrack}=await import('/src/trackStore.js')
   const {createAutoMix}=await import('/src/audio.js')
   const state=window.__IEUM_V2__.state
   const tracks=state.activeProject.parts.map((part,index)=>state.projectTracks[part.id]||{...Object.values(state.projectTracks)[0],id:state.activeProject.id+':'+part.id,partId:part.id,participantId:part.id==='tenor'?'jisun':'luna',participant:part.id==='tenor'?'JISUN':'LUNA',demo:true,origin:'local-formant-singing-demo'})
   for(const track of tracks)await saveTrack(track)
   const mixed=await createAutoMix({tracks,duration:2})
   await saveTrack({id:state.activeProject.id+':auto-mix',projectId:state.activeProject.id,kind:'auto-mix',blob:mixed.blob,duration:mixed.duration,createdAt:'2026-10-08T00:00:00Z'})
  })
  await page.goto('http://127.0.0.1:4191/?design=figma')
  await page.reload()
  await page.waitForFunction(()=>Boolean(window.__IEUM_V2__?.state?.mix?.url))
  await page.evaluate(()=>location.hash='#complete')
  await page.waitForSelector('.complete-screen .record-center-credits')
  await page.waitForSelector('.complete-screen .audio-player audio',{state:'attached'})
  const expansion=await page.locator('.complete-screen .record-particles').evaluate(canvas=>new Promise(resolve=>{
   const values=[],started=performance.now()
   const sample=()=>{values.push(Number(canvas.dataset.bloom));if(performance.now()-started>1300)resolve(values);else requestAnimationFrame(sample)}
   sample()
  }))
  assert.ok(Math.max(...expansion)>.005,'Complete must expand once on entry')
  assert.ok(expansion.at(-1)<.0001,'Complete must settle after its entry expansion')
  await measure('complete')
  assert.equal(await page.locator('.record-center-credits button').count(),4)
  assert.equal(await page.locator('.bottom-nav').count(),1)
  assert.equal(await page.locator('.complete-screen .audio-player audio').count(),1)
  assert.deepEqual(errors,[])
  await context.close()
 }
 const desktop=await browser.newContext({viewport:{width:1200,height:1100}})
 const desktopPage=await desktop.newPage()
 await desktopPage.goto('http://127.0.0.1:4191/?design=figma')
 await desktopPage.waitForSelector('.workspace-screen')
 const frame=await desktopPage.locator('.screen').evaluate(element=>({width:element.getBoundingClientRect().width,height:element.getBoundingClientRect().height,overflow:getComputedStyle(element).overflowY}))
 assert.equal(frame.width,430)
 assert.equal(frame.height,932,'Desktop preview must retain the requested mobile height cap')
 assert.equal(frame.overflow,'auto')
 results.push({screen:'desktop-mobile-frame',...frame})
 await desktop.close()
 await writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2))
 console.log(JSON.stringify({passed:true,results,artifacts:output,limits:'Synthetic browser microphone and persisted mix fixture only; no physical microphone, listening, full project completion or AI renderer integration claim.'},null,2))
}finally{await browser.close()}
