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
const page=await browser.newPage({viewport:{width:430,height:932},reducedMotion:'reduce'})
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
   return {width:innerWidth,body:document.body.scrollWidth,hero:q('.v2-hero'),guide:q('.v2-intro-guide'),info:q('.v2-recruit-info'),dots:q('.v2-carousel-nav'),cta:q('.v2-project-action'),sections:[...document.querySelectorAll('main>section')].map(box),rows:[...document.querySelectorAll('.v2-project-row')].map(n=>({box:box(n),thumb:box(n.querySelector('.v2-project-thumbnail')),tags:[...n.querySelectorAll('.v2-role-tag')].map(box)})),heading:[...document.querySelectorAll('.v2-home-section-heading')].map(n=>({title:box(n.querySelector('h2')),arrow:box(n.querySelector('button'))})),broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src'))}
  })
  assert.equal(geometry.body,width);assert.deepEqual(geometry.broken,[])
  assert.ok(geometry.hero.h>=556);near(geometry.hero.h,556,'Home composition height');near(geometry.hero.b-geometry.guide.b,60,'Guide to artwork end');near(geometry.guide.y,384,'Guide inside artwork')
  near(geometry.dots.y-geometry.info.b,32,'Info to pagination');near(geometry.cta.y-geometry.dots.b,24,'Pagination to action')
  near(geometry.cta.x,24,'CTA left');near(geometry.cta.w,width-48,'CTA fluid width')
  for(let i=1;i<geometry.sections.length;i++)near(geometry.sections[i].y-geometry.sections[i-1].b,76,'Section gap')
  for(const h of geometry.heading){near(h.title.y+h.title.h/2,h.arrow.y+h.arrow.h/2,'Heading/arrow center');near(h.arrow.x+h.arrow.w,width-24,'Arrow right inset')}
  for(const row of geometry.rows){near(row.box.h,98,'Two-tag row');near(row.thumb.w,80,'Thumbnail');for(const tag of row.tags){near(tag.h,24,'Tag height');assert.ok(tag.w<64,'Tags hug content')}}
  await page.screenshot({path:`${output}/${scene}-${width}-viewport.png`})
  const style=await page.addStyleTag({content:'.bottom-nav{visibility:hidden!important}'})
  await page.screenshot({path:`${output}/${scene}-${width}.png`,fullPage:true});await style.evaluate(n=>n.remove())
  const dots=page.locator('.v2-carousel-nav button'),count=await dots.count()
  const seen=new Set()
  for(let i=0;i<count;i++){await dots.nth(i).click();assert.equal(await dots.nth(i).getAttribute('aria-current'),'true');seen.add(await page.locator('.v2-recruit-record').getAttribute('data-project-id'))}
  assert.equal(seen.size,count);await dots.first().click()
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
