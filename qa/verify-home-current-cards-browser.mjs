import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-home-current'
await mkdir(output,{recursive:true})
const server=process.env.IEUM_BASE_URL?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4187'],{stdio:['ignore','pipe','inherit']})
if(server)await new Promise(resolve=>server.stdout.once('data',resolve))
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
const near=(a,b)=>assert.ok(Math.abs(a-b)<1.1,`${a} != ${b}`)
try{
 for(const width of [390,430])for(const scene of ['first-visit','profile-ready']){
  const page=await browser.newPage({viewport:{width,height:932},reducedMotion:'reduce'}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  const url=new URL(process.env.IEUM_BASE_URL||'http://127.0.0.1:4187/');url.searchParams.set('scene',scene)
  await page.goto(url.href);await page.waitForSelector('.home-v2-screen');await page.evaluate(()=>document.fonts.ready)
  const measures=await page.evaluate(()=>{
   const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom}},root=document.querySelector('.home-v2-screen'),card=root.querySelector('.v2-song-card'),info=card.querySelector('.v2-song-info'),cover=card.querySelector('.v2-cover-slot'),completed=root.querySelector('.v2-completed-card'),media=completed.querySelector('.v2-completed-media'),ci=completed.querySelector('.v2-completed-info')
   return {body:document.documentElement.scrollWidth,profile:root.dataset.profileState,coverGap:rect(info).y-rect(cover).b,titleGap:rect(info.lastChild).y-rect(info.firstChild).b,card:rect(completed),infoGap:rect(ci).y-rect(media).b,play:rect(media.querySelector('button.v2-home-preview')),media:rect(media),sections:[...root.querySelectorAll(':scope>main>section')].map(rect),nestedButtons:root.querySelectorAll('button button').length}
  })
  assert.equal(measures.body,width);near(measures.coverGap,8);near(measures.titleGap,2);near(measures.card.w,320);near(measures.card.h,254);near(measures.infoGap,4);near(measures.play.b,measures.media.b);assert.equal(measures.nestedButtons,0)
  for(let i=1;i<measures.sections.length;i++)near(measures.sections[i].y-measures.sections[i-1].b,76)
  assert.equal(await page.locator('[data-action=home-voice-setup]').count(),scene==='first-visit'?1:0)
  await page.screenshot({path:`${output}/${scene}-${width}.png`,fullPage:true})
  const card=page.locator('.v2-completed-card').first(),play=card.locator('[data-action=home-preview]')
  await play.click();await page.waitForFunction(()=>document.querySelector('.v2-completed-card audio')?.currentTime>0)
  assert.equal(await page.locator('.home-v2-screen').count(),1)
  await play.click();assert.equal(await card.locator('audio').evaluate(a=>a.paused),true)
  const carousel=page.locator('.v2-completed-carousel');await carousel.focus();await carousel.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.v2-completed-carousel').scrollLeft>0)
  await card.locator('.v2-completed-title').click();await page.waitForSelector('.complete-screen')
  assert.deepEqual(errors,[]);results.push({width,scene,measures,playback:true,navigation:true});await page.close()
 }
 await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));console.log('PASS four Home states: grouped gaps, 320×254 cards, no overflow, separate playback/navigation, carousel keyboard scroll')
}finally{await browser.close();server?.kill()}
