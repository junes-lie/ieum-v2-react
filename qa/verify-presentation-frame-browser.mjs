import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir} from 'node:fs/promises'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4196'
const out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-presentation-frame'
await mkdir(out,{recursive:true})
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4196','--strictPort'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})
}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
try{
 const page=await browser.newPage({viewport:{width:1920,height:945},reducedMotion:'reduce'})
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 for(const width of [390,430]){
  await page.goto(base+'/?demo=profile-ready')
  await page.getByRole('button',{name:String(width),exact:true}).click()
  await page.locator('[data-demo-profile-state="present"]').waitFor()
  const f=page.frames().find(f=>f.url().includes('scene='))
  const geometry=async viewport=>{
   const box=await page.locator('.demo-phone').boundingBox()
   assert.equal(box.width,width)
   assert.equal(box.height,Math.min(932,viewport.height-40))
   assert.equal(box.x+box.width/2,viewport.width/2)
   assert.equal(box.y+box.height/2,viewport.height/2)
   assert.equal(await f.evaluate(()=>innerWidth),width)
   assert.equal(await f.evaluate(()=>innerHeight),box.height)
   assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),true)
   assert.equal(await page.locator('.demo-menu').evaluate(n=>getComputedStyle(n).position),'fixed')
   const nav=await f.locator('.bottom-nav').count()?await f.locator('.bottom-nav').boundingBox():null
   if(nav)assert.ok(Math.abs(nav.y+nav.height-(box.y+box.height))<2,'Navigation stays at the same mobile frame bottom')
  }
  for(const viewport of [{width:1920,height:945},{width:1440,height:1100},{width:1280,height:720}]){
   await page.setViewportSize(viewport);await geometry(viewport)
  }
  await page.setViewportSize({width:1920,height:945})
  const screens=['home','detail','projects','workspace','record','voice','finder','search','my','collection','create-project']
  for(const screen of screens){
   await f.evaluate(screen=>{history.replaceState({...history.state,ieumScreen:screen},'','#'+screen);dispatchEvent(new PopStateEvent('popstate',{state:history.state}))},screen)
   await f.waitForFunction(screen=>window.__IEUM_V2__?.state.screen===screen,screen)
   await geometry({width:1920,height:945})
   if(['home','workspace','record'].includes(screen)){
    await f.evaluate(()=>document.fonts.ready)
    await page.screenshot({path:`${out}/${screen}-${width}.png`})
   }
  }
  console.log(`PASS ${width}: one centered adaptive frame through ${screens.length} screens, 3 desktop heights, inner scroll, fixed menu and contained bottom navigation`)
 }
 for(const width of [390,430]){
  await page.setViewportSize({width,height:932});await page.goto(base)
  await page.locator('[data-demo-profile-state="absent"]').waitFor()
  const box=await page.locator('.demo-phone').boundingBox()
  assert.ok(box.x>=0&&box.x+box.width<=width)
  assert.ok(box.y>=128&&box.y+box.height<=932)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
 }
 assert.deepEqual(errors,[])
 await page.close()
}finally{await browser.close();server?.kill()}
