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
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-heading-spacing'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
try{
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},reducedMotion:'reduce',locale:'ko-KR'}),page=await context.newPage(),errors=[]
  page.setDefaultTimeout(20000)
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await page.goto(base+'/?scene=profile-ready');await page.waitForSelector('.v2-hero-copy');await page.evaluate(()=>document.fonts.ready)
  await page.waitForFunction(()=>[...document.querySelectorAll('.v2-hero-artwork,.v2-profile-icon img,.v2-song-artwork img,.v2-turntable-housing')].every(img=>img.complete&&img.naturalWidth>0))
  const home=await page.evaluate(()=>{
   const get=s=>{const n=document.querySelector(s),r=n.getBoundingClientRect(),c=getComputedStyle(n);return {x:r.x,y:r.y,width:r.width,height:r.height,font:c.fontSize,line:c.lineHeight}}
   const textBounds=s=>{const n=document.querySelector(s),range=document.createRange();range.selectNodeContents(n);return [...range.getClientRects()].every(r=>r.left>=0&&r.right<=innerWidth)}
   return {body:document.body.scrollWidth,hero:get('.v2-hero'),title:get('.v2-hero-copy h1'),copy:get('.v2-hero-copy p'),copyInside:textBounds('.v2-hero-copy p')&&textBounds('.v2-hero-copy h1'),heading:get('.v2-recruitment .v2-section-heading'),note:get('.v2-section-note'),nav:get('.v2-carousel-nav'),stage:get('.v2-turntable-stage'),project:get('.v2-recruit-info h3'),action:get('.v2-project-action'),more:get('.v2-recruitment .v2-section-heading button')}
  })
  assert.equal(home.body,width);assert.equal(home.hero.height,400)
  assert.equal(home.title.y,64);assert.equal(home.title.font,'32px');assert.equal(home.title.line,'40px')
  assert.equal(home.copy.y,156);assert.equal(home.copy.font,'15px');assert.equal(home.copy.line,'22px');assert.equal(home.copyInside,true)
  assert.equal(home.heading.y,412);assert.equal(home.heading.height,30);assert.equal(home.note.y,450);assert.equal(home.note.line,'19px')
  assert.equal(home.nav.y,485);assert.equal(home.nav.height,35);assert.equal(home.stage.y,536);assert.equal(home.stage.height,255)
  assert.equal(home.project.font,'36px');assert.equal(home.project.line,'40px');assert.equal(home.action.height,48);assert.equal(home.more.height,44)
  await page.locator('.screen').screenshot({path:`${output}/home-${width}.png`})
  await page.locator('.v2-recruitment .v2-section-heading button').click();await page.waitForSelector('.search-v2-screen')
  assert.equal(await page.getByRole('tab',{name:'모집 프로젝트',exact:true}).getAttribute('aria-selected'),'true')
  await page.goto(base+'/?scene=workspace');await page.waitForSelector('.workspace-v2-screen');await page.evaluate(()=>document.fonts.ready)
  const workspace=await page.evaluate(()=>{
   const get=s=>{const n=document.querySelector(s),r=n.getBoundingClientRect(),c=getComputedStyle(n);return {x:r.x,y:r.y,width:r.width,height:r.height,font:c.fontSize,line:c.lineHeight,color:c.color,text:n.textContent}}
   return {body:document.body.scrollWidth,header:get('.topbar'),brand:get('.topbar-center'),back:get('[data-action="back"]'),identity:get('.title-row'),title:get('.title-row h1'),metadata:get('.workspace-project-name'),parts:get('.v2-part-modules'),stream:window.__IEUM_V2__.audioRuntime.stream?.active||false}
  })
  assert.equal(workspace.body,width);assert.equal(workspace.header.height,60)
  assert.equal(workspace.brand.text,'IEUM');assert.equal(workspace.brand.y,19);assert.equal(workspace.brand.font,'15px');assert.equal(workspace.brand.line,'22px')
  assert.equal(workspace.back.x,16);assert.equal(workspace.back.y,8);assert.equal(workspace.back.width,44);assert.equal(workspace.back.height,44)
  assert.equal(workspace.identity.y,61);assert.equal(workspace.title.text,'A Thousand Years');assert.equal(workspace.title.height,120,'Actual two-line Song title remains readable')
  assert.equal(workspace.title.font,'56px');assert.equal(workspace.title.line,'60px')
  assert.equal(workspace.metadata.y,workspace.title.y+workspace.title.height+3);assert.equal(workspace.metadata.line,'16px');assert.equal(workspace.metadata.color,'rgb(145, 138, 128)')
  assert.equal(workspace.parts.y,workspace.metadata.y+workspace.metadata.height+31);assert.equal(workspace.stream,false)
  await page.locator('.screen').screenshot({path:`${output}/workspace-${width}.png`})
  const like=page.locator('[data-action="toggle-project-like"]'),pressed=await like.getAttribute('aria-pressed')
  await like.press('Enter');assert.notEqual(await like.getAttribute('aria-pressed'),pressed);await like.press('Enter');assert.equal(await like.getAttribute('aria-pressed'),pressed)
  await page.getByRole('button',{name:'뒤로',exact:true}).press('Enter');await page.waitForSelector('.detail-screen')
  assert.deepEqual(errors,[]);results.push({width,home,workspace,errors});await context.close();console.log('PASS Home/Workspace original heading geometry, readable titles, native targets and navigation',width)
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
 console.log('No complete screen fidelity, physical microphone or audible-quality claim.')
}catch(error){console.error(error);throw error}finally{await browser.close();server?.kill()}
