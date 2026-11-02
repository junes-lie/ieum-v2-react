import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4227'
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-home-composition'
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4227','--strictPort'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})
}
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width:430,height:932},reducedMotion:'reduce',hasTouch:true})
const errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[]
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1.1,`${message}: ${actual} != ${expected}`)
try{
 for(const width of [390,430])for(const scene of ['first-visit','profile-ready']){
  await page.setViewportSize({width,height:932})
  const url=new URL(base);url.searchParams.set('scene',scene)
  await page.goto(url.href);await page.waitForSelector('.v2-project-row');await page.evaluate(()=>document.fonts.ready)
  const baseline=await page.evaluate(()=>({joined:window.__IEUM_V2__.state.joined,tracks:Object.keys(window.__IEUM_V2__.state.projectTracks).sort()}))
  const geometry=await page.evaluate(()=>{
   const box=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom}}
   const q=s=>box(document.querySelector(s))
   return {width:innerWidth,body:document.body.scrollWidth,hero:q('.v2-hero'),guide:q('.v2-intro-guide'),info:q('.v2-recruit-info'),dots:q('.v2-carousel-nav'),cta:q('.v2-project-action'),recruitHeading:q('.v2-recruitment-heading'),stage:q('.v2-turntable-stage'),jacket:q('.v2-recruit-jacket'),recentHeading:q('.v2-recent .v2-home-section-heading'),recentRows:q('.v2-project-rows'),completedHeading:q('.v2-completed .v2-home-section-heading'),completedRail:q('.v2-completed-carousel'),recommendedHeading:q('.v2-recommended-heading'),songGrid:q('.v2-song-grid'),sections:[...document.querySelectorAll('main>section')].map(box),rows:[...document.querySelectorAll('.v2-project-row')].map(n=>({box:box(n),thumb:box(n.querySelector('.v2-project-thumbnail')),tags:[...n.querySelectorAll('.v2-role-tag')].map(box)})),heading:[...document.querySelectorAll('.v2-home-section-heading')].map(n=>({title:box(n.querySelector('h2')),arrow:box(n.querySelector('button'))})),broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src'))}
  })
  assert.equal(geometry.body,width);assert.deepEqual(geometry.broken,[])
  assert.ok(geometry.hero.h>=556);near(geometry.hero.h,556,'Home composition height');near(geometry.hero.b-geometry.guide.b,60,'Guide to artwork end');near(geometry.guide.y,384,'Guide inside artwork')
  near(geometry.dots.y-geometry.info.b,16,'Info to pagination');near(geometry.cta.y-geometry.dots.b,32,'Pagination to action')
  near(geometry.stage.y-geometry.recruitHeading.b,2,'Recruitment heading to stage');near(geometry.info.y-geometry.stage.b,-2,'Stage to info');near(geometry.jacket.w,48,'Recruitment sleeve');
  near(geometry.recentRows.y-geometry.recentHeading.b,20,'Recent heading to rows');near(geometry.completedRail.y-geometry.completedHeading.b,20,'Completed heading to cards');near(geometry.songGrid.y-geometry.recommendedHeading.b,20,'Recommended CTA to grid');
  near(geometry.cta.x,24,'CTA left');near(geometry.cta.w,width-48,'CTA fluid width')
  for(let i=1;i<geometry.sections.length;i++)near(geometry.sections[i].y-geometry.sections[i-1].b,76,'Section gap')
  for(const h of geometry.heading){near(h.title.y+h.title.h/2,h.arrow.y+h.arrow.h/2,'Heading/arrow center');near(h.arrow.x+h.arrow.w,width-24,'Arrow right inset')}
  for(const row of geometry.rows){near(row.box.h,98,'Two-tag row');near(row.thumb.w,80,'Thumbnail');for(const tag of row.tags){near(tag.h,24,'Tag height');assert.ok(tag.w<64,'Tags hug content')}}
  await page.screenshot({path:`${output}/${scene}-${width}-viewport.png`})
  const style=await page.addStyleTag({content:'.bottom-nav{visibility:hidden!important}'})
  await page.screenshot({path:`${output}/${scene}-${width}.png`,fullPage:true});await style.evaluate(n=>n.remove())
  if(scene==='first-visit'){
   const registration=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();const h=r('.v2-recommended .v2-home-section-heading'),b=r('.v2-profile-register'),n=r('.v2-recommended-registration p');return {titleGap:b.top-h.bottom,noteGap:n.top-b.bottom,gridGap:r('.v2-song-grid').top-n.bottom}})
   near(registration.titleGap,16,'Recommended title to CTA');near(registration.noteGap,8,'CTA to supporting note');near(registration.gridGap,20,'Note to songs')
  }
  const songsRail=page.locator('.v2-song-grid')
  await songsRail.scrollIntoViewIfNeeded()
  const maxSongsScroll=await songsRail.evaluate(n=>n.scrollWidth-n.clientWidth)
  if(scene==='first-visit')assert.ok(await songsRail.locator('.v2-song-card').count()>3,'Show catalogue beyond the original three cards')
  if(maxSongsScroll>2){
   const sr=await songsRail.boundingBox()
   await page.mouse.move(sr.x+sr.width-30,sr.y+60);await page.mouse.down();await page.mouse.move(sr.x+25,sr.y+60,{steps:12});await page.mouse.up()
   await page.waitForFunction(()=>document.querySelector('.v2-song-grid').scrollLeft>2)
   assert.equal(await page.locator('.home-v2-screen').count(),1,'Recommended drag must not open song')
   assert.equal(await page.evaluate(()=>window.getSelection().toString()),'')
   await songsRail.evaluate(n=>n.scrollTo({left:0,behavior:'instant'}))
   await songsRail.focus();await page.keyboard.press('ArrowRight')
   await page.waitForFunction(()=>document.querySelector('.v2-song-grid').scrollLeft>2)
   await songsRail.evaluate(n=>n.scrollTo({left:0,behavior:'instant'}))
   await songsRail.scrollIntoViewIfNeeded()
   const touch=await page.context().newCDPSession(page)
   await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1})
   const tr=await songsRail.boundingBox(),tx=tr.x+tr.width-30,ty=tr.y+60
   await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]})
   for(let i=1;i<=12;i++)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx-(tr.width-60)*i/12,y:ty}]})
   await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach()
   await page.waitForFunction(()=>document.querySelector('.v2-song-grid').scrollLeft>2)
  }
  await songsRail.evaluate(n=>n.scrollTo({left:0,behavior:'instant'}))
  await songsRail.locator('.v2-song-card').first().click();await page.waitForSelector('.detail-screen')
  await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.home-v2-screen')
  const dots=page.locator('.v2-carousel-nav button'),count=await dots.count()
  const seen=new Set()
  for(let i=0;i<count;i++){await dots.nth(i).click();assert.equal(await dots.nth(i).getAttribute('aria-current'),'true');seen.add(await page.locator('.v2-recruit-record').getAttribute('data-project-id'))}
  assert.equal(seen.size,count);await dots.first().click()
  // Real mouse gestures over the artwork: no selection, native image drag or accidental click.
  const stage=page.locator('.v2-turntable-stage')
  await stage.scrollIntoViewIfNeeded()
  const sb=await stage.boundingBox()
  const startProject=await page.locator('.v2-recruit-record').getAttribute('data-project-id')
  await page.evaluate(()=>{window.__nativeDrags=0;document.addEventListener('dragstart',()=>window.__nativeDrags++)})
  await page.mouse.move(sb.x+sb.width*.7,sb.y+90);await page.mouse.down()
  await page.mouse.move(sb.x+sb.width*.25,sb.y+90,{steps:12});await page.mouse.up()
  assert.notEqual(await page.locator('.v2-recruit-record').getAttribute('data-project-id'),startProject)
  assert.equal(await page.evaluate(()=>window.getSelection().toString()),'')
  assert.equal(await page.evaluate(()=>window.__nativeDrags),0)
  assert.equal(await page.locator('.home-v2-screen').count(),1)
  // Normal click still selects the neighbour after dragging.
  const draggedProject=await page.locator('.v2-recruit-record').getAttribute('data-project-id')
  await page.locator('.v2-carousel-neighbor-next').click()
  assert.notEqual(await page.locator('.v2-recruit-record').getAttribute('data-project-id'),draggedProject)
  const rail=page.locator('.v2-completed-carousel')
  await rail.scrollIntoViewIfNeeded()
  const rb=await rail.boundingBox(),cardCount=await rail.locator('.v2-completed-card').count()
  assert.ok(cardCount>1,'Fixture must contain multiple real completed entries')
  await page.mouse.move(rb.x+rb.width-35,rb.y+80);await page.mouse.down()
  await page.mouse.move(rb.x+35,rb.y+80,{steps:16});await page.mouse.up()
  await page.waitForFunction(()=>document.querySelector('.v2-completed-carousel').scrollLeft>100)
  assert.equal(await page.locator('.home-v2-screen').count(),1,'Drag must not open completed song')
  assert.equal(await page.evaluate(()=>window.getSelection().toString()),'')
  await rail.focus();await page.keyboard.press('ArrowLeft')
  await page.waitForFunction(()=>document.querySelector('.v2-completed-carousel').scrollLeft<2)
  // Actual touch input uses the native horizontal scroller; vertical page scrolling stays available.
  const cdp=await page.context().newCDPSession(page)
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1})
  const touchBox=await rail.boundingBox(),tx=touchBox.x+touchBox.width-35,ty=touchBox.y+80
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]})
  for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx-(touchBox.width-70)*i/12,y:ty}]})
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await page.waitForFunction(()=>document.querySelector('.v2-completed-carousel').scrollLeft>100)
  await cdp.detach()
  await page.screenshot({path:`${output}/${scene}-${width}-completed-slide.png`})
  // Click after a drag still opens the real completed item.
  const visibleCard=await rail.evaluate(n=>[...n.children].findIndex(c=>c.getBoundingClientRect().left>=n.getBoundingClientRect().left-2))
  await rail.locator('.v2-completed-card').nth(Math.max(0,visibleCard)).click()
  await page.waitForSelector('.complete-screen')
  await page.goto(url.href);await page.waitForSelector('.v2-project-action')
  await page.locator('.v2-project-action').click();await page.waitForSelector('.detail-screen')
  await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.home-v2-screen')
  await page.getByRole('button',{name:'최근 열린 프로젝트 전체 보기',exact:true}).click();await page.waitForSelector('.search-screen,.search-v2-screen')
  await page.goto(url.href);await page.waitForSelector('.v2-intro-guide')
  await page.getByRole('button',{name:'함께 부를 곡 목록으로 이동',exact:true}).click()
  near(await page.locator('.v2-recruitment').evaluate(n=>n.getBoundingClientRect().y),16,'Scroll invitation target')
  assert.deepEqual(await page.evaluate(()=>({joined:window.__IEUM_V2__.state.joined,tracks:Object.keys(window.__IEUM_V2__.state.projectTracks).sort()})),baseline)
  results.push({width,scene,geometry,carouselProjects:count,navigation:true,statePreserved:true});console.log('PASS',width,scene)
 }
 assert.deepEqual(errors,[])
 await writeFile(`${output}/results.json`,JSON.stringify(results,null,2))
}finally{await browser.close();server?.kill()}
