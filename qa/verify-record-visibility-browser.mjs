import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
let server,browser
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4254'
try {
 if(!process.env.IEUM_BASE_URL){
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4254','--strictPort'],{stdio:['ignore','pipe','inherit']})
  await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})
 }
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},reducedMotion:'no-preference'})
  const page=await context.newPage();page.setDefaultTimeout(15000)
  await page.goto(base);await page.waitForSelector('.v2-recruit-record')
  const record=page.locator('.v2-carousel-record[data-slot="0"] .record'),canvas=record.locator('.record-particles')
  await record.scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.v2-carousel-record[data-slot="0"] .record-particles')?.dataset.renderVisibility==='visible')
  const signature=await record.getAttribute('data-record-signature'),before=await canvas.getAttribute('data-rotation')
  await page.waitForFunction(before=>document.querySelector('.v2-carousel-record[data-slot="0"] .record-particles')?.dataset.rotation!==before,before)
  await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}))
  await page.waitForFunction(()=>document.querySelector('.v2-carousel-record[data-slot="0"] .record-particles')?.dataset.renderVisibility==='offscreen')
  const paused=await canvas.getAttribute('data-rotation')
  await page.waitForTimeout(250)
  assert.equal(await canvas.getAttribute('data-rotation'),paused,'Offscreen records stop drawing GPU frames')
  await record.scrollIntoViewIfNeeded()
  await page.waitForFunction(paused=>document.querySelector('.v2-carousel-record[data-slot="0"] .record-particles')?.dataset.rotation!==paused,paused)
  assert.equal(await record.getAttribute('data-record-signature'),signature,'Returning preserves the Project graphic identity')
  assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),2,'Visibility never changes submitted Tracks')
  console.log('PASS',width,'normal-motion Record animates in view, suspends outside viewport, resumes same identity without changing Tracks')
  await context.close()
 }
}finally{await browser?.close();server?.kill()}
