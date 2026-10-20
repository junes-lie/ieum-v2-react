import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdir} from 'node:fs/promises'
import {spawn} from 'node:child_process'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4198'
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4198','--strictPort'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(String(data).includes('Local:'))resolve()});server.on('error',reject);server.on('exit',code=>reject(Error('Vite exited '+code)))})
}
const out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-demo-stage-qa'
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try {
 const context=await browser.newContext({viewport:{width:1440,height:1100},permissions:['microphone']})
 const page=await context.newPage(),errors=[]
 page.setDefaultTimeout(15000)
 page.on('pageerror',error=>errors.push(error.message))
 await page.goto(base);await page.waitForFunction(()=>window.__IEUM_V2__?.state)
 await page.evaluate(()=>{localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:false,fixtureSentinel:'real-user'}))})
 const original=await page.evaluate(()=>localStorage.getItem('ieum-v2:user-state:v7'))
 assert.equal(await page.locator('.demo-launcher a').count(),3)
 await page.locator('.demo-launcher a').first().click()
 const scene=async(id,screen,profile)=>{
  await page.locator(`.demo-menu nav a[href="?demo=${id}"]`).click()
  await page.waitForFunction(({id})=>document.querySelector('iframe')?.contentWindow?.__IEUM_V2__?.state && document.querySelector('iframe').contentWindow.location.search.includes('scene='+id),{id})
  const frame=page.frames().find(frame=>frame.url().includes('scene='+id))
  await frame.waitForFunction(({screen,profile})=>window.__IEUM_V2__?.state.screen===screen && !!window.__IEUM_V2__.state.profile===profile && !!window.__IEUM_V2__.state.projectTracks.soprano,{screen,profile})
  const state=await frame.evaluate(()=>({profile:!!window.__IEUM_V2__.state.profile,joined:window.__IEUM_V2__.state.joined,screen:window.__IEUM_V2__.state.screen,tracks:Object.keys(window.__IEUM_V2__.state.projectTracks)}))
  assert.equal(state.profile,profile)
  assert.equal(await frame.evaluate(()=>document.body.scrollWidth<=innerWidth),true)
  await page.screenshot({path:`${out}/${id}.png`,fullPage:true})
  return frame
 }
 await scene('first-visit','home',false)
 await scene('profile-ready','home',true)
 let frame=await scene('participate','detail',true)
 await frame.locator('[data-part="tenor"] .row-action').click()
 await frame.locator('[data-action="join-part"]').click()
 await frame.waitForSelector('.workspace-v2-screen')
 assert.equal(await frame.evaluate(()=>window.__IEUM_V2__.state.joined),true)
 frame=await scene('workspace','workspace',true)
 assert.equal(await frame.locator('.v2-part-module').count(),4)
 await frame.locator('[data-action="record-part"]').click()
 await frame.waitForSelector('.recording-v2-screen')
 frame=await scene('recording','record',true)
 assert.equal(await frame.locator('[data-nav]').count(),0)
 assert.equal(await frame.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream?.active||false),false,'Entry never auto-starts microphone')
 await frame.locator('[data-action="record-start"]').click()
 await frame.waitForSelector('[data-action="record-pause"]')
 await frame.locator('[data-action="record-pause"]').click()
 await frame.locator('[data-action="record-resume"]').click()
 await frame.waitForTimeout(1100)
 await frame.locator('[data-action="record-stop"]').click()
 await frame.waitForSelector('[data-action="record-submit"]')
 await frame.locator('[data-action="record-submit"]').click()
 await frame.waitForSelector('.workspace-v2-screen')
 assert.equal(await frame.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),3)
 await page.getByRole('button',{name:'이 상황 처음부터 다시 보기'}).click()
 await page.waitForFunction(()=>{const state=document.querySelector('iframe')?.contentWindow?.__IEUM_V2__?.state;return state?.screen==='record'&&Object.keys(state.projectTracks).length===2})
 frame=page.frames().find(frame=>frame.url().includes('scene=recording'))
 assert.equal(await frame.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),2)
 await scene('search','search',true)
 frame=await scene('complete','complete',true)
 await frame.locator('audio').waitFor({state:'attached'})
 await scene('workspace','workspace',true)
 await page.goBack();await page.waitForFunction(()=>document.querySelector('.demo-menu nav [aria-current]')?.getAttribute('href')==='?demo=complete')
 assert.equal(await page.evaluate(()=>localStorage.getItem('ieum-v2:user-state:v7')),original)
 await page.goto(base);await page.waitForFunction(()=>window.__IEUM_V2__?.state)
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile),null)
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.joined),false)
 for(const width of [390,430]){
  await page.setViewportSize({width,height:932})
  await page.goto(base+'/?demo=recording')
  await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.__IEUM_V2__?.state)
  assert.equal(await page.evaluate(()=>document.body.scrollWidth<=innerWidth),true)
  await page.screenshot({path:`${out}/mobile-${width}.png`,fullPage:true})
 }
 assert.deepEqual(errors,[])
 console.log('PASS 7 demo scenarios, one-click Workspace/Recording, participation, fake-mic pause/resume/Review/submit, isolated reset/storage, Back, desktop and 390/430px. No physical microphone or exact Figma fidelity claim.')
 await context.close()
} finally {await browser.close();server?.kill('SIGTERM')}
