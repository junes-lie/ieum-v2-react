import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4198'
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4198','--strictPort'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',code=>reject(Error('Vite '+code)))})
}
const baseline=process.env.IEUM_QA_BASELINE==='1',output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-home-discovery-cards'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
try{
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},reducedMotion:'reduce',locale:'ko-KR'}),page=await context.newPage(),errors=[]
  page.setDefaultTimeout(20000)
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await page.goto(base);await page.waitForSelector('.v2-completed-card');await page.evaluate(()=>document.fonts.ready)
  await page.locator('.v2-recommended').scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll('.v2-cover-slot img,.v2-listen img')].every(img=>img.complete&&img.naturalWidth>0))
  const read=()=>page.evaluate(()=>{
   const rect=n=>{if(!n)return null;const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}}
   const recommended=document.querySelector('.v2-recommended'),completed=document.querySelector('.v2-completed'),heading=section=>{const n=section.querySelector('.v2-section-heading');return {height:n.getBoundingClientRect().height,font:getComputedStyle(n.querySelector('h2')).fontSize,target:rect(n.querySelector('button'))}}
   const grid=document.querySelector('.v2-song-grid'),carousel=document.querySelector('.v2-completed-carousel')
   return {body:document.body.scrollWidth,recommended:{heading:heading(recommended),gridOffset:rect(grid).y-rect(recommended).y,gap:getComputedStyle(grid).gap,cards:[...document.querySelectorAll('.v2-song-card')].map(n=>({title:n.querySelector('strong').textContent,artist:n.querySelector('small').textContent,cover:n.querySelector('img').getAttribute('src'),width:rect(n).width,art:rect(n.querySelector('.v2-cover-slot')),titleFont:getComputedStyle(n.querySelector('strong')).fontSize,titleLine:getComputedStyle(n.querySelector('strong')).lineHeight,countFont:getComputedStyle(n.querySelector('small:last-child')).fontSize}))},completed:{heading:heading(completed),carouselOffset:rect(carousel).y-rect(completed).y,cards:[...document.querySelectorAll('.v2-completed-card')].map(n=>{const details=n.querySelector(':scope>span'),title=n.querySelector('strong'),d=rect(details),range=document.createRange();range.selectNodeContents(title);return {title:title.textContent,card:rect(n),details:d,gap:getComputedStyle(details).gap,status:n.querySelector('small').textContent,statusBorder:getComputedStyle(n.querySelector('small')).borderTopWidth,meta:n.querySelector('.v2-completed-meta')?.textContent,time:n.querySelector('.v2-completed-duration')?.textContent,surface:rect(n.querySelector('.v2-listen-control img')),icon:rect(n.querySelector('.v2-listen-control svg')),titleInside:[...range.getClientRects()].every(r=>r.x>=d.x&&r.right<=d.right&&r.bottom<=rect(n).bottom),nestedButtons:n.querySelectorAll('button').length}})}}
  })
  const geometry=await read();results.push({width,geometry});console.log(baseline?'BASELINE':'CHECK',width,JSON.stringify(geometry))
  if(!baseline){
   assert.equal(geometry.body,width)
   assert.equal(geometry.recommended.heading.height,30);assert.equal(geometry.recommended.heading.font,'24px');assert.equal(geometry.recommended.heading.target.height,44);assert.equal(geometry.recommended.gridOffset,74);assert.equal(geometry.recommended.gap,'12px')
   assert.equal(geometry.recommended.cards.length,3)
   for(const card of geometry.recommended.cards){assert.ok(Math.abs(card.art.width-card.art.height)<.1);assert.equal(card.titleFont,'15px');assert.equal(card.titleLine,'22px');assert.equal(card.countFont,'11px');if(width===430)assert.ok(Math.abs(card.width-119)<.4)}
   assert.equal(geometry.completed.heading.height,30);assert.equal(geometry.completed.heading.font,'24px');assert.equal(geometry.completed.heading.target.height,44);assert.equal(geometry.completed.carouselOffset,78)
   assert.deepEqual(geometry.completed.cards.map(c=>[c.title,c.meta,c.time]),[['서로의 빛','시연 음원','00:16'],['천천히 함께','시연 음원','00:19'],['비가 그친 뒤','시연 음원','00:18']])
   for(const card of geometry.completed.cards){assert.equal(card.card.width,width===430?368:342);assert.ok(card.card.height>=196);assert.equal(card.gap,'6px');assert.equal(card.status,'완성곡');assert.notEqual(card.statusBorder,'0px');assert.equal(card.surface.width,36);assert.equal(card.surface.height,36);assert.ok(Math.abs(card.icon.width-10.8)<.02);assert.equal(card.nestedButtons,0);assert.equal(card.titleInside,true)}
   await page.locator('.v2-recommended').screenshot({path:`${output}/recommended-${width}.png`})
   await page.locator('.v2-completed').screenshot({path:`${output}/completed-${width}.png`})
   const tracks=await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length)
   await page.locator('.v2-song-card').first().click();await page.waitForSelector('.detail-screen');assert.ok((await page.locator('.detail-screen').textContent()).includes('A Thousand Years'))
   await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.home-v2-screen')
   await page.locator('.v2-completed-card').first().locator('.v2-listen-control').click();await page.waitForSelector('.complete-screen');assert.ok((await page.locator('.complete-screen').textContent()).includes('서로의 빛'))
   await page.locator('.complete-screen .play-btn').click();await page.waitForFunction(()=>document.querySelector('.complete-screen audio')?.currentTime>.1);await page.locator('.complete-screen .play-btn').click()
   await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.home-v2-screen')
   await page.locator('.v2-completed-card').last().press('Enter');await page.waitForSelector('.complete-screen');assert.ok((await page.locator('.complete-screen').textContent()).includes('비가 그친 뒤'))
   await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.home-v2-screen');assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),tracks)
   await page.locator('.v2-completed>.v2-section-heading button').click();await page.waitForSelector('.search-v2-screen');assert.equal(await page.getByRole('tab',{name:'완성곡',exact:true}).getAttribute('aria-selected'),'true')
   await page.locator('[data-nav="home"]').click();await page.waitForSelector('.home-v2-screen')
   // Scoped 2x text-size stress, not native browser/device text zoom.
   await page.addStyleTag({content:'.v2-song-card strong{font-size:30px!important;line-height:44px!important}.v2-song-card small{font-size:24px!important;line-height:32px!important}.v2-completed-card strong{font-size:36px!important;line-height:48px!important}.v2-completed-card small,.v2-listen{font-size:24px!important;line-height:32px!important}'})
   const large=await read();assert.equal(large.body,width);assert.ok(large.completed.cards.every(card=>card.titleInside&&card.card.height>=196))
   assert.deepEqual(large.recommended.cards.map(c=>[c.title,c.artist,c.cover]),geometry.recommended.cards.map(c=>[c.title,c.artist,c.cover]))
   await page.locator('.v2-completed').screenshot({path:`${output}/completed-2x-text-${width}.png`})
  }
  assert.deepEqual(errors,[]);await context.close();console.log(baseline?'BASELINE COMPLETE':'PASS',width)
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
}catch(error){console.error(error);throw error}finally{await browser.close();server?.kill()}
