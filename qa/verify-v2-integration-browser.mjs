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
  }
  await page.locator('.v2-recent').scrollIntoViewIfNeeded()
  await page.waitForFunction(()=>[...document.querySelectorAll('.v2-song-artwork img,.v2-hero-artwork,.v2-profile-icon img')].every(img=>img.complete&&img.naturalWidth>0))
  await page.evaluate(()=>scrollTo(0,0))
  await check('home');assert.equal(await page.locator('.v2-song-grid>button').count(),3)
  assert.equal(await page.locator('.v2-song-grid img').count(),3,'All recommended songs have local cover art')
  const artworkGeometry=await page.locator('.v2-project-thumbnail').evaluateAll(nodes=>nodes.map(node=>{
    const bounds=node.getBoundingClientRect(),record=node.querySelector('.v2-thumbnail-record').getBoundingClientRect(),sleeve=node.querySelector('.v2-thumbnail-sleeve').getBoundingClientRect()
    return {inside:[record,sleeve].every(r=>r.left>=bounds.left&&r.right<=bounds.right&&r.top>=bounds.top&&r.bottom<=bounds.bottom),recordWidth:record.width,sleeveWidth:sleeve.width}
  }))
  assert.ok(artworkGeometry.every(item=>item.inside&&item.recordWidth===56&&item.sleeveWidth===54),'Sleeve and live record remain within each 72px thumbnail')
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
  await page.locator('[data-action="record-part"]').click();await page.waitForSelector('.recording-v2-screen');await check('recording')
  assert.equal(await page.locator('.bottom-nav').count(),0)
  const guide=page.getByRole('checkbox',{name:'Guide 반주',exact:true});await guide.focus();await page.keyboard.press('Space');assert.equal(await guide.isChecked(),false)
  await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]');await page.waitForTimeout(1200)
  await page.locator('[data-action="record-pause"]').click();assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'paused')
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
