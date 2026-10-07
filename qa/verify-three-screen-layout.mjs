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
    const layout=await player.evaluate(element=>{const label=element.querySelector('.player-clock').getBoundingClientRect(),seek=element.querySelector('input').getBoundingClientRect();return {labelHeight:label.height,seekTop:seek.top,labelBottom:label.bottom,seekHeight:seek.height}})
    assert.equal(layout.labelHeight,16,'Player time must stay on one line');assert.ok(layout.seekHeight>=44,'Seek must provide a 44px touch height')
    assert.ok(layout.seekTop>=layout.labelBottom,'Seek must sit below the time label')
   }
   results.push({width,screen,...geometry})
  }
  await measure('workspace')
  const summary=await page.locator('.player-summary').evaluate(row=>{const caption=row.querySelector('.player-caption').getBoundingClientRect(),clock=row.querySelector('.player-clock').getBoundingClientRect();return {overlap:caption.right>clock.left,right:clock.right,rowRight:row.getBoundingClientRect().right}})
  assert.ok(await page.locator('.player-caption').evaluate(el=>getComputedStyle(el).fontFamily.includes('Pretendard IEUM')),'Mix caption must use the Figma Sans family');assert.ok(!summary.overlap);assert.ok(Math.abs(summary.right-summary.rowRight)<1,'Workspace time must align right beside its caption')

  assert.equal(await page.locator('.workspace-track-row .track-play').first().evaluate(button=>getComputedStyle(button,'::before').width),'32px','Track artwork must stay 32px while touch area is 44px')
  assert.ok((await page.locator('.track-person strong').first().textContent()).startsWith('01 '))
  const touchTargets=await page.locator('.workspace-track-row .track-checkbox,.workspace-track-row .track-play,.workspace-track-row .row-action').evaluateAll(elements=>elements.map(element=>({width:element.getBoundingClientRect().width,height:element.getBoundingClientRect().height})))
  assert.ok(touchTargets.length>0);for(const target of touchTargets)assert.ok(target.width>=44&&target.height>=44,'Track controls must provide 44px touch targets')


  await page.locator('.workspace-track-row .track-play:not(:disabled)').first().click()
  await page.waitForSelector('.listening-context')
  assert.equal(await page.locator('.player-caption').textContent(),'개별 Track 듣기')
  const returnMix=page.getByRole('button',{name:'현재 Mix로',exact:true})
  assert.ok(await returnMix.evaluate(button=>button.getBoundingClientRect().height>=44))
  assert.ok(await page.locator('.listening-context').evaluate(row=>parseFloat(getComputedStyle(row).fontSize)>=12))
  await returnMix.click();assert.equal(await page.locator('.player-caption').textContent(),'선택 트랙 함께 듣기')
  await page.locator('[data-action="toggle-project-like"]').click()
  await page.locator('[data-action="record-part"]').click()
  await page.waitForSelector('.recording-screen')
  assert.equal(await page.locator('.bottom-nav').count(),0)
  const chips=page.locator('.guide-track-chips input')
  assert.equal(await chips.count(),2)
  const backing=page.getByRole('checkbox',{name:'Guide 반주',exact:true}),backingEnabled=await backing.isChecked()
  await backing.focus();await page.keyboard.press('Space');assert.notEqual(await backing.isChecked(),backingEnabled)
  assert.notEqual(await backing.evaluate(input=>getComputedStyle(input.nextElementSibling).outlineStyle),'none','Hidden backing checkbox must expose visible keyboard focus')
  await page.keyboard.press('Space');assert.equal(await backing.isChecked(),backingEnabled)

  const wasChecked=await chips.first().isChecked()
  await chips.first().click()
  assert.notEqual(await chips.first().isChecked(),wasChecked)
  await page.locator('[data-action="record-start"]').click()
  await page.waitForSelector('[data-action="record-pause"]')
  const opener=page.getByRole('button',{name:'뒤로',exact:true})
  await opener.click();const dialog=page.getByRole('dialog');await dialog.waitFor()
  assert.ok(await dialog.evaluate(el=>el.matches(':modal')),'Native confirmation must block the background')
  assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement)))
  for(let i=0;i<5;i++){await page.keyboard.press('Tab');assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement)),'Tab must remain inside confirmation')}
  await dialog.screenshot({path:path.join(output,`record-confirm-${width}.png`)})
  const enlarged=await dialog.evaluate(el=>{
   const texts=Array.from(el.querySelectorAll('p,h2,button')).map(node=>({node,font:parseFloat(getComputedStyle(node).fontSize),line:parseFloat(getComputedStyle(node).lineHeight)}))
   for(const {node,font,line} of texts){node.style.setProperty('font-size',font*2+'px','important');if(Number.isFinite(line))node.style.setProperty('line-height',line*2+'px','important')}
   const box=el.getBoundingClientRect();return {width:box.width,height:box.height,overflow:el.scrollWidth>el.clientWidth+1,viewport:innerHeight}
  })
  assert.ok(enlarged.width<=width-48&&!enlarged.overflow,'200% confirmation text must not overflow horizontally')
  assert.ok(enlarged.height<=enlarged.viewport-48,'Confirmation must remain inside viewport or scroll internally')
  await dialog.screenshot({path:path.join(output,`record-confirm-text-200-${width}.png`)})

  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'})
  assert.ok(await opener.evaluate(el=>el===document.activeElement),'Cancel must restore focus to opener')
  await page.waitForSelector('[data-action="record-pause"]')

  await page.waitForSelector('.record-inflow[data-renderer="webgl-inflow"]')
  await measure('recording')
  const lyricRows=await page.locator('.lyrics>span').evaluateAll(rows=>rows.map(row=>({visible:getComputedStyle(row).display!=='none',height:row.getBoundingClientRect().height,active:row.classList.contains('active')})))
  assert.equal(lyricRows.length,3);assert.ok(lyricRows.every(row=>row.visible&&row.height>=42));assert.ok(lyricRows[1].active&&!lyricRows[0].active&&!lyricRows[2].active,'Current lyric must remain in the center slot')

  await page.locator('[data-action="record-pause"]').click()
  await page.waitForSelector('[data-action="record-resume"]')
  assert.deepEqual(await page.locator('.recorder-controls .record-control>span').allTextContents(),['다시 녹음','정지','이어서 녹음'])
  await page.getByRole('button',{name:'다시 녹음',exact:true}).click();await page.getByRole('dialog').waitFor()
  await page.keyboard.press('Escape');assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'paused','Cancel must preserve paused Take')

  await page.locator('[data-action="record-resume"]').click()
  await page.locator('[data-action="record-stop"]').click()
  await page.waitForSelector('[data-action="record-submit"]')
  const retainedDuration=await page.locator('.record-review .kicker').textContent()
  await page.locator('[data-action="record-retry"]').click();await page.getByRole('dialog').waitFor()
  await page.getByRole('button',{name:'지금 녹음 유지',exact:true}).click()
  assert.equal(await page.locator('.record-review .kicker').textContent(),retainedDuration,'Cancel retake must preserve Review and Take')
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
  for(const part of await page.locator('.record-center-credits button small').all()){assert.ok(await part.evaluate(el=>getComputedStyle(el).fontFamily.includes('JetBrains')));assert.equal(await part.evaluate(el=>getComputedStyle(el).textTransform),'uppercase')}
  assert.equal(await page.locator('.record-center-credits button strong').first().evaluate(el=>getComputedStyle(el).fontWeight),'600')
  const creditGeometry=await page.locator('.record-center-credits button').evaluateAll(buttons=>buttons.map(button=>{
   const name=button.querySelector('strong');name.textContent='함께노래하는참여자'
   const box=button.getBoundingClientRect(),text=name.getBoundingClientRect()
   return {width:box.width,height:box.height,font:Number.parseFloat(getComputedStyle(name).fontSize),inside:text.left>=box.left-.5&&text.right<=box.right+.5,wrapped:text.height>Number.parseFloat(getComputedStyle(name).fontSize)*1.8,overflow:name.scrollWidth>name.clientWidth+1}
  }))
  for(const credit of creditGeometry){assert.ok(credit.width>=44&&credit.height>=44,'Each credit must retain its touch target');assert.ok(credit.font>=12);assert.ok(credit.inside&&!credit.overflow,'Long credit names must remain inside their own Part');assert.ok(credit.wrapped,'Long names must wrap rather than truncate')}

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
