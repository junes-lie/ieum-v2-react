import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4198',baseline=Boolean(process.env.IEUM_QA_BASELINE)
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4198','--strictPort'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',data=>String(data).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',code=>reject(Error('Vite exited '+code)))})
}
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-recording-copy-layout'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
const results=[]
try{
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},locale:'ko-KR',permissions:['microphone'],reducedMotion:'reduce'}),page=await context.newPage(),errors=[]
  page.setDefaultTimeout(20000)
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await page.goto(base+'/?scene=recording');await page.waitForSelector('[data-action="record-start"]:not(:disabled)');await page.evaluate(()=>document.fonts.ready)
  const measure=()=>page.evaluate(()=>{
   const box=s=>{const n=typeof s==='string'?document.querySelector(s):s,r=n.getBoundingClientRect(),c=getComputedStyle(n);return {x:r.x,y:r.y,width:r.width,height:r.height,font:c.fontSize,line:c.lineHeight,family:c.fontFamily,weight:c.fontWeight,color:c.color,display:c.display,text:n.textContent}}
   return {body:document.body.scrollWidth,heading:box('.topbar-center'),title:box('.topbar-center h1'),meta:box('.topbar-center small'),monitor:box('.v2-monitoring'),lyrics:box('.lyrics'),lines:[...document.querySelectorAll('.lyrics>span')].map(box),instrument:box('.v2-instrument'),stream:window.__IEUM_V2__.audioRuntime.stream?.active||false}
  })
  const empty=await measure();if(baseline)console.log('LAYOUT',width,JSON.stringify(empty))
  assert.equal(empty.body,width);assert.equal(empty.title.text,'A Thousand Years');assert.equal(empty.stream,false)
  assert.ok((await page.locator('.lyric-source-note').textContent()).includes('아직 등록되지'))
  assert.equal(await page.locator('.count-in').count(),0)
  if(!baseline){
   assert.equal(empty.title.font,'18px');assert.equal(empty.title.line,'24px');assert.ok(empty.title.family.includes('Montserrat'))
   assert.equal(empty.meta.font,'12px');assert.equal(empty.meta.line,'16px');assert.ok(empty.meta.family.includes('Pretendard'));assert.equal(empty.meta.color,'rgb(145, 138, 128)')
   assert.equal(empty.title.y,15);assert.equal(empty.meta.y,41);assert.equal(empty.monitor.y,104)
   assert.ok(Math.abs(empty.lyrics.y-284)<1);assert.ok(Math.abs(empty.instrument.y-752)<.3)
   assert.equal(empty.lines[0].display,'block');assert.equal(empty.lines[2].display,'block')
   assert.equal(empty.lines[0].height,30);assert.equal(empty.lines[1].height,40);assert.equal(empty.lines[2].height,30)
  }
  await page.locator('.screen').screenshot({path:`${output}/empty-${width}.png`})
  // Test-only timed text in this browser's isolated demo storage; not real Song lyrics.
  await page.evaluate(()=>{
   const project=structuredClone(window.__IEUM_V2__.state.activeProject),id='qa-recording-copy-layout'
   const key='ieum-demo:recording:ieum-v2:user-state:v7',state=JSON.parse(localStorage.getItem(key)||'{}')
   Object.assign(project,{id,name:'QA 가사 배치 검증',ownerPartId:'tenor',lyrics:[{time:0,text:'QA 이전 줄'},{time:0,text:'QA 현재 줄'},{time:5,text:'QA 다음 줄'}]})
   project.parts=project.parts.map(part=>({...part,participantId:part.id==='tenor'?'jisun':null,participant:part.id==='tenor'?'JISUN':null,status:part.id==='tenor'?'ready':'open'}))
   localStorage.setItem(key,JSON.stringify({...state,createdProjects:[project],activeCreatedProjectId:id,joined:true,joinedPart:'tenor'}))
  })
  await page.reload();await page.waitForSelector('[data-action="record-start"]:not(:disabled)');await page.evaluate(()=>document.fonts.ready)
  const populated=await measure()
  assert.equal(await page.locator('.lyric-source-note').count(),0)
  assert.equal(populated.lines[1].text,'QA 현재 줄')
  if(!baseline){
   assert.deepEqual(populated.lines.map(line=>line.font),['24px','32px','24px'])
   assert.deepEqual(populated.lines.map(line=>line.line),['30px','40px','30px'])
   assert.ok(populated.lines.every(line=>line.display==='block'))
   assert.equal(populated.lines[1].y-populated.lines[0].y,54);assert.equal(populated.lines[2].y-populated.lines[1].y,64)
   assert.equal(populated.lines[1].color,'rgb(236, 230, 220)');assert.equal(populated.lines[0].color,'rgb(145, 138, 128)')
  }
  await page.locator('.lyrics').screenshot({path:`${output}/timed-text-${width}.png`})
  if(!baseline){
   await page.evaluate(()=>{
    const title=document.querySelector('.topbar-center h1');title.lang='ko';title.textContent='QA 긴 한글 곡명과 영문 Song title이 함께 있는 줄바꿈 검증'
    document.querySelector('.lyrics .active').textContent='QA 여러 줄로 이어지는 긴 한글 가사 배치 검증 문장'
    const nodes=[...document.querySelectorAll('.topbar-center h1,.topbar-center small,.lyrics>span')]
    const values=nodes.map(n=>({n,size:parseFloat(getComputedStyle(n).fontSize),line:parseFloat(getComputedStyle(n).lineHeight)}))
    for(const {n,size,line} of values){n.style.setProperty('font-size',size*2+'px','important');n.style.setProperty('line-height',line*2+'px','important')}
   })
   const stress=await page.evaluate(()=>{
    const h=document.querySelector('.topbar-center').getBoundingClientRect(),m=document.querySelector('.v2-monitoring').getBoundingClientRect(),l=document.querySelector('.lyrics').getBoundingClientRect(),p=document.querySelector('.v2-instrument').getBoundingClientRect()
    const inside=[...document.querySelectorAll('.topbar-center h1,.topbar-center small,.lyrics>span')].every(n=>{const range=document.createRange();range.selectNodeContents(n);const box=n.getBoundingClientRect();return [...range.getClientRects()].every(r=>r.left>=0&&r.right<=innerWidth&&r.top>=box.top&&r.bottom<=box.bottom+1)})
    return {body:document.body.scrollWidth,inside,separate:h.bottom<=m.top&&m.bottom<=l.top&&l.bottom<=p.top,headingHeight:h.height,lyricsHeight:l.height}
   })
   assert.equal(stress.body,width);assert.equal(stress.inside,true);assert.equal(stress.separate,true)
   assert.ok(stress.headingHeight>empty.heading.height&&stress.lyricsHeight>populated.lyrics.height)
   await page.locator('.screen').screenshot({path:`${output}/long-text-stress-${width}.png`})
   await page.reload();await page.waitForSelector('[data-action="record-start"]:not(:disabled)')
   await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]')
   await page.locator('[data-action="record-pause"]').click();assert.equal(await page.locator('[data-recording-readout]').textContent(),'일시정지')
   await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('[data-action="record-submit"]')
   assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks).length),0)
   await page.locator('[data-action="back"]').click();await page.waitForSelector('.workspace-v2-screen')
   assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeProject.id),'qa-recording-copy-layout')
   await page.locator('[data-action="record-part"]').click();await page.waitForSelector('[data-action="record-submit"]')
   assert.equal(await page.locator('.recording-v2-screen').getAttribute('data-recording-status'),'review')
  }
  results.push({width,empty,populated,errors});assert.deepEqual(errors,[]);await context.close()
  console.log(baseline?'BASELINE':'PASS','Recording source typography/geometry, timed-text fixture, missing-source notice and Review/Back',width)
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
}catch(error){console.error(error);throw error}finally{await browser.close();server?.kill('SIGTERM')}
