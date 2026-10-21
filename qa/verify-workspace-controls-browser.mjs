import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4198'
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4198','--strictPort'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(String(data).includes('Local:'))resolve()});server.on('error',reject);server.on('exit',code=>reject(Error('Vite exited '+code)))})
}
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-workspace-controls'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
try{
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},locale:'ko-KR',reducedMotion:'reduce'})
  const page=await context.newPage(),errors=[]
  page.setDefaultTimeout(20000)
  page.on('pageerror',error=>errors.push(error.message))
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await page.goto(base+'/?scene=workspace')
  await page.waitForFunction(()=>window.__IEUM_V2__?.state?.screen==='workspace'&&Object.keys(window.__IEUM_V2__.state.projectTracks).length===2)
  await page.waitForFunction(()=>[...document.querySelectorAll('.v2-part-actions img')].every(img=>img.complete&&img.naturalWidth>0))
  const geometry=await page.evaluate(()=>{
   const rect=n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})
   const record=document.querySelector('[data-action="record-part"]'),track=document.querySelector('.v2-metal-play'),toggle=document.querySelector('.v2-part-actions .v2-toggle'),row=document.querySelector('.v2-part-modules')
   return {body:document.body.scrollWidth,cardWidths:[...document.querySelectorAll('.v2-part-module')].map(n=>rect(n).width),row:{width:row.clientWidth,scrollWidth:row.scrollWidth},record:rect(record),recordSurface:rect(record.querySelector('img')),recordIcon:rect(record.querySelector('svg')),font:getComputedStyle(record).fontSize,line:getComputedStyle(record).lineHeight,track:rect(track),trackSurface:rect(track.querySelector('img')),trackIcon:rect(track.querySelector('svg')),toggle:rect(toggle),toggleSurface:rect(toggle.querySelector('i')),separate:track.getBoundingClientRect().right<=toggle.getBoundingClientRect().left,stream:window.__IEUM_V2__.audioRuntime.stream?.active||false}
  })
  assert.equal(geometry.body,width);assert.ok(geometry.cardWidths.every(n=>n>=99))
  assert.equal(geometry.row.scrollWidth,414)
  assert.deepEqual(geometry.record,{width:84,height:44});assert.deepEqual(geometry.recordSurface,{width:84,height:40})
  assert.deepEqual(geometry.recordIcon,{width:14,height:14});assert.equal(geometry.font,'12px');assert.equal(geometry.line,'16px')
  assert.deepEqual(geometry.track,{width:44,height:44});assert.deepEqual(geometry.trackSurface,{width:32,height:32});assert.deepEqual(geometry.trackIcon,{width:14,height:14})
  assert.deepEqual(geometry.toggle,{width:44,height:44});assert.ok(Math.abs(geometry.toggleSurface.width-33.12)<.02&&Math.abs(geometry.toggleSurface.height-18.72)<.02)
  assert.equal(geometry.separate,true);assert.equal(geometry.stream,false)
  for(const name of ['figma-compact-button.svg','figma-vocal-finder-disabled.svg','figma-track-play-surface.svg']){
   const response=await page.request.get(base+'/artwork/'+name)
   assert.equal(response.status(),200);assert.deepEqual(await response.body(),await readFile(new URL('../public/artwork/'+name,import.meta.url)))
  }
  await page.locator('.screen').screenshot({path:`${output}/workspace-${width}.png`})
  await page.locator('.v2-part-modules').screenshot({path:`${output}/part-controls-${width}.png`})
  const inclusion=page.getByRole('checkbox',{name:'Soprano 현재 Mix 포함',exact:true}),checked=await inclusion.isChecked()
  await inclusion.focus();await page.keyboard.press('Space');assert.notEqual(await inclusion.isChecked(),checked)
  assert.ok((await inclusion.locator('..').locator('i').evaluate(n=>getComputedStyle(n).backgroundImage)).includes('figma-toggle-off.svg'))
  await inclusion.click();assert.equal(await inclusion.isChecked(),checked)
  await page.getByRole('button',{name:'Soprano Track 재생',exact:true}).click();await page.waitForSelector('.listening-context')
  await page.waitForFunction(()=>document.querySelector('.workspace-v2-screen audio')?.currentTime>.1)
  await page.locator('[data-action="turntable-play"]').click();await page.waitForFunction(()=>document.querySelector('.workspace-v2-screen audio')?.paused)
  await page.getByRole('button',{name:'현재 Mix로',exact:true}).click()
  await page.locator('[data-action="record-part"]').click();await page.waitForSelector('.recording-v2-screen')
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream?.active||false),false,'Opening Record never requests the microphone')
  await page.goto(base+'/?design=figma')
  await page.waitForFunction(()=>window.__IEUM_V2__?.state?.screen==='workspace'&&Object.keys(window.__IEUM_V2__.state.projectTracks).length===2)
  const disabled=page.locator('.v2-compact-action:disabled').first()
  await disabled.waitFor()
  assert.ok((await disabled.locator('img').getAttribute('src')).endsWith('figma-vocal-finder-disabled.svg'))
  assert.equal(await disabled.evaluate(n=>getComputedStyle(n).opacity),'1')
  assert.equal(await disabled.evaluate(n=>getComputedStyle(n).color),'rgb(145, 138, 128)')
  await disabled.evaluate(n=>n.click());assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.screen),'workspace')
  await page.locator('.v2-part-modules').screenshot({path:`${output}/disabled-controls-${width}.png`})
  assert.deepEqual(errors,[]);results.push({width,geometry,errors})
  await context.close();console.log('PASS Workspace original surfaces, geometry, native targets, disabled state, keyboard toggle, Track playback and Record entry',width)
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
 console.log('No physical microphone, audible playback or complete screen fidelity claim.')
}catch(error){console.error(error);throw error}finally{await browser.close();server?.kill('SIGTERM')}
