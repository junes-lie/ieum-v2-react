import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
import {seedCreationProfile} from './project-profile-fixture.mjs'
const require=createRequire(import.meta.url)
const {chromium}=process.env.PLAYWRIGHT_MODULE_PATH?require(process.env.PLAYWRIGHT_MODULE_PATH):require('playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4198'
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4198'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(String(data).includes('Local:'))resolve()});server.on('error',reject);server.on('exit',code=>reject(Error('Vite exited '+code)))})
}
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-v2-integration'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
const results=[]
try{
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},permissions:['microphone'],locale:'ko-KR'})
  const page=await context.newPage();page.setDefaultTimeout(15000)
  const errors=[];page.on('pageerror',error=>errors.push(error.message))
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await page.goto(base);await page.waitForFunction(()=>window.__IEUM_V2__?.state?.screen==='home')
  const check=async(screen)=>{
   await page.waitForTimeout(200)
   const geometry=await page.evaluate(()=>({width:innerWidth,body:document.body.scrollWidth,screen:document.querySelector('.screen').getBoundingClientRect().width,main:document.querySelector('.screen>main')?.getBoundingClientRect().width}))
   assert.equal(geometry.body,width);assert.equal(geometry.screen,width)
   await page.locator('.screen').screenshot({path:`${output}/${screen}-${width}.png`})
   results.push({width,screen,geometry})
   console.log('CHECK',width,screen)
  }
  await page.locator('.v2-recent').scrollIntoViewIfNeeded()
  await page.waitForFunction(()=>[...document.querySelectorAll('.v2-song-artwork img,.v2-hero-artwork,.v2-profile-icon img,.v2-turntable-housing')].every(img=>img.complete&&img.naturalWidth>0))
  await page.evaluate(()=>scrollTo(0,0))
  await check('home');assert.equal(await page.locator('.v2-song-grid>button').count(),3)
  assert.equal(await page.locator('.v2-song-grid img').count(),3,'All recommended songs have local cover art')
  assert.ok(await page.locator('.v2-turntable-frame canvas').count()>0,'Housing retains the live project renderer')
  const artworkGeometry=await page.locator('.v2-project-thumbnail').evaluateAll(nodes=>nodes.map(node=>{
    const bounds=node.getBoundingClientRect(),record=node.querySelector('.v2-thumbnail-record').getBoundingClientRect(),sleeve=node.querySelector('.v2-thumbnail-sleeve').getBoundingClientRect()
    return {inside:[record,sleeve].every(r=>r.left>=bounds.left&&r.right<=bounds.right&&r.top>=bounds.top&&r.bottom<=bounds.bottom),recordWidth:record.width,sleeveWidth:sleeve.width}
  }))
  assert.ok(artworkGeometry.every(item=>item.inside&&item.recordWidth===56&&item.sleeveWidth===54),'Sleeve and live record remain within each 72px thumbnail')
  const selectedProject=()=>page.locator('.v2-recruit-record').getAttribute('data-project-id')
  const originalProject=await selectedProject(),originalTrackCount=await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length)
  assert.equal(await page.locator('.v2-carousel-neighbor').count(),2)
  const recordSignatures=await page.locator('.v2-turntable-stage .record').evaluateAll(nodes=>nodes.map(n=>n.dataset.recordSignature))
  assert.equal(new Set(recordSignatures).size,3,'Previous, selected and next records have distinct project graphics')
  await page.locator('.v2-project-action').evaluate(n=>n.scrollIntoView({block:'center'}))
  const actionStyle=await page.locator('.v2-project-action').evaluate(n=>({height:n.offsetHeight,radius:getComputedStyle(n).borderRadius,font:getComputedStyle(n).fontSize,surface:getComputedStyle(n.firstElementChild).borderImageSource}))
  assert.equal(actionStyle.height,48);assert.equal(actionStyle.radius,'24px');assert.equal(actionStyle.font,'15px')
  assert.ok(actionStyle.surface.includes('/artwork/figma-project-button.svg'),'Button uses original exported Figma surface')
  await page.locator('.v2-project-action').screenshot({path:`${output}/project-button-${width}.png`})
  await page.evaluate(()=>{window.__housingBefore=document.querySelector('.v2-recruit-record .v2-turntable-housing');window.__housingBounds=window.__housingBefore.getBoundingClientRect().toJSON()})
  await page.locator('.v2-carousel-neighbor-next').click({position:{x:22,y:86}})
  assert.notEqual(await selectedProject(),originalProject,'Neighbour record selects a different actual Project')
  const housing=await page.evaluate(()=>{
    const img=document.querySelector('.v2-recruit-record .v2-turntable-housing')
    const ancestors=[img,img.parentElement,img.parentElement.parentElement]
    return {sameNode:img===window.__housingBefore,stable:img.getBoundingClientRect().x===window.__housingBounds.x,stationary:ancestors.every(n=>getComputedStyle(n).transform==='none'&&n.getAnimations().length===0),sliding:document.querySelector('.v2-recruit-record .v2-record-slide').getAnimations().length>0}
  })
  assert.ok(housing.sameNode&&housing.stable&&housing.stationary,'Turntable housing remains mounted and stationary during record selection')
  assert.ok(housing.sliding,'Only the inner record runs the slide transition')
  await page.locator('.v2-carousel-neighbor-previous').press('Enter')
  assert.equal(await selectedProject(),originalProject,'Keyboard selection returns to the exact Project')
  const stage=await page.locator('.v2-turntable-stage').boundingBox()
  await page.mouse.move(stage.x+stage.width/2+50,stage.y+120);await page.mouse.down()
  await page.mouse.move(stage.x+stage.width/2-50,stage.y+120);await page.mouse.up()
  assert.notEqual(await selectedProject(),originalProject,'Horizontal swipe changes the selected Project')
  await page.getByRole('button',{name:'이전 모집 프로젝트',exact:true}).click()
  assert.equal(await selectedProject(),originalProject)
  assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),originalTrackCount,'Browsing never adds submitted Tracks')
  const first=await page.locator('.v2-recruit-info h3').textContent()
  await page.getByRole('button',{name:'다음 모집 프로젝트',exact:true}).click();assert.notEqual(await page.locator('.v2-recruit-info h3').textContent()+await page.locator('.v2-recruit-info p').textContent(),first+'OPEN · Tenor · Bass 2명 참여')
  await page.locator('[data-nav="search"]').click();await page.waitForSelector('[data-screen-id="01S"]');await check('search')
  const input=page.getByRole('textbox',{name:'곡, 아티스트, 프로젝트 검색'})
  await input.fill('Ocean');assert.ok(await page.locator('.search-v2-result').count()>0)
  await page.getByRole('button',{name:'필터',exact:true}).click();await page.getByRole('button',{name:'팝',exact:true}).click();await page.getByRole('button',{name:'적용',exact:true}).click()
  assert.ok(await page.locator('.search-v2-result').count()>0,'Korean Pop filter matches stored Dream pop metadata')
  await page.locator('.search-v2-result').first().click();await page.waitForSelector('.detail-screen');await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('[data-screen-id="01S"]')
  assert.equal(await input.inputValue(),'Ocean');assert.equal(await page.locator('[data-nav="search"]').getAttribute('aria-current'),'page')
  await input.fill('no-matching-track');assert.equal(await page.locator('.search-v2-result').count(),0);await page.getByRole('button',{name:'검색 조건 초기화',exact:true}).click()
  await page.getByRole('tab',{name:'곡',exact:true}).click();assert.equal(await page.locator('.search-v2-result').count(),4)
  await page.getByRole('tab',{name:'완성곡',exact:true}).click();assert.equal(await page.locator('.search-v2-result').count(),0,'No invented completed tracks')
  await page.locator('[data-action="open-my-voice"]').click();await page.waitForFunction(()=>window.__IEUM_V2__.state.screen==='my');await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('[data-screen-id="01S"]');assert.equal(await page.getByRole('tab',{name:'완성곡',exact:true}).getAttribute('aria-selected'),'true')
  // Isolated broad-range registration and one received demo Track; no real singer or physical mic claim.
  await seedCreationProfile(page)
  await page.evaluate(async()=>{
   const {saveTrack}=await import('/src/trackStore.js'),{analyzeBlob}=await import('/src/audio.js'),{buildVoiceLayer}=await import('/src/voiceAnalysis.js')
   const blob=await(await fetch('/demo-stems/bass.wav')).blob(),analysis=await analyzeBlob(blob),id='ieum-thousand-years-v7',seed='ieum:thousand-years:original-c:0048'
   await saveTrack({id:id+':bass',projectId:id,projectSeed:seed,partId:'bass',participantId:'luna',participant:'Luna',blob,duration:analysis.duration,features:analysis.features,layer:buildVoiceLayer(seed,'bass',analysis.features),origin:'local-formant-singing-demo',demo:true,createdAt:new Date().toISOString()})
  })
  await page.reload();await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state?.projectTracks||{}).length===3)
  await page.locator('[data-action="open-parts"]').click();await page.waitForSelector('.detail-screen');await page.locator('[data-part="tenor"] .row-action').click();await page.locator('[data-action="join-part"]').click();await page.waitForSelector('.workspace-v2-screen')
  await check('workspace');assert.equal(await page.locator('.v2-part-module').count(),4)
  const inclusion=page.getByRole('checkbox',{name:'Soprano 현재 Mix 포함',exact:true});const checked=await inclusion.isChecked();await inclusion.click();assert.notEqual(await inclusion.isChecked(),checked);await inclusion.click()
  await page.getByRole('button',{name:'Soprano Track 재생',exact:true}).click();await page.waitForSelector('.listening-context');await page.getByRole('button',{name:'현재 Mix로',exact:true}).click()
  const turntablePlay=page.locator('[data-action="turntable-play"]')
  await turntablePlay.click();await page.waitForFunction(()=>document.querySelector('.workspace-v2-screen audio')?.currentTime>.1)
  assert.equal(await turntablePlay.getAttribute('aria-label'),'현재 듣기 일시정지')
  await turntablePlay.click();await page.waitForFunction(()=>document.querySelector('.workspace-v2-screen audio')?.paused)
  await page.locator('[data-action="record-part"]').click();await page.waitForSelector('.recording-v2-screen');await check('recording')
  assert.equal(await page.locator('.bottom-nav').count(),0)
  assert.equal(await page.locator('[data-recording-readout]').textContent(),'준비')
  assert.equal(await page.locator('.recording-v2-screen .input-meter').count(),0,'Live input is not duplicated by a second meter graph')
  const recordCrop=await page.locator('.recording-visual .record').boundingBox()
  assert.ok(recordCrop.width>width&&recordCrop.x<0&&recordCrop.y>500,'Live record enters from below and crops across both edges')
  const guide=page.getByRole('checkbox',{name:'Guide 반주',exact:true});await guide.focus();await page.keyboard.press('Space');assert.equal(await guide.isChecked(),false)
  await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]');await page.waitForTimeout(1200)
  assert.equal(await page.locator('[data-recording-readout]').textContent(),'REC')
  assert.equal(await page.locator('canvas[data-live-input="microphone"]').count(),1)
  await check('recording-active')
  await page.locator('[data-action="record-pause"]').click();assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'paused')
  assert.equal(await page.locator('[data-recording-readout]').textContent(),'일시정지')
  await page.locator('[data-action="record-resume"]').click();await page.waitForTimeout(800)
  await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('[data-action="record-submit"]');assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'review')
  await check('review');await page.locator('[data-action="record-submit"]').click();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.screen==='complete',null,{timeout:60000})
  assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),4)
  assert.ok(await page.evaluate(()=>window.__IEUM_V2__.state.mix.blob.size>0));await check('complete')
  await page.locator('[data-nav="search"]').click();await page.getByRole('tab',{name:'완성곡',exact:true}).click();assert.equal(await page.locator('.search-v2-result').count(),1)
  await page.locator('.search-v2-result').click();await page.waitForSelector('.complete-screen')
  assert.deepEqual(errors,[])
  results.push({width,flow:'Home → Part fit/join → Workspace → MediaRecorder(fake mic) → pause/resume → Review → submit → Auto Mix → Completed; Search return/filters/empty/complete selection',errors})
  await context.close();console.log('PASS',width)
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
 console.log('PASS browser integration; isolated fixtures and Chromium synthetic microphone, no physical device or live multi-user backend claim')
}finally{await browser.close();server?.kill()}
