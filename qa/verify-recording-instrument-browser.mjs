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
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-recording-instrument'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
const results=[]
const near=(value,target)=>assert.ok(Math.abs(value-target)<.03,`${value} differs from ${target}`)
try{
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},locale:'ko-KR',permissions:['microphone'],reducedMotion:'reduce'})
  const page=await context.newPage(),errors=[]
  page.setDefaultTimeout(20000)
  page.on('pageerror',error=>errors.push(error.message))
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await page.goto(base+'/?scene=recording')
  await page.waitForFunction(()=>window.__IEUM_V2__?.state?.screen==='record'&&document.querySelector('[data-action="record-start"]:not(:disabled)'))
  await page.evaluate(()=>document.fonts.ready)
  await page.waitForFunction(()=>[...document.querySelectorAll('.v2-recording-surface')].every(img=>img.complete&&img.naturalWidth>0))
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream?.active||false),false)
  assert.equal(await page.locator('.bottom-nav').count(),0)
  assert.equal(await page.locator('[data-recording-readout]').textContent(),'준비')
  const measure=()=>page.locator('.v2-instrument').evaluate(panel=>{
   const box=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}
   const readout=panel.querySelector('.v2-instrument-readout'),controls=panel.querySelector('.recorder-controls')
   return {panel:box(panel),readout:box(readout),controls:box(controls),border:getComputedStyle(panel).borderTopWidth,radius:getComputedStyle(panel).borderRadius,font:getComputedStyle(readout.querySelector('b')).fontFamily,fontSize:getComputedStyle(readout.querySelector('b')).fontSize,lineHeight:getComputedStyle(readout.querySelector('b')).lineHeight,body:document.body.scrollWidth,buttons:[...controls.querySelectorAll('button')].map(button=>({label:button.getAttribute('aria-label'),button:box(button),surface:box(button.querySelector('.v2-recording-surface')),icon:box(button.querySelector('svg')),background:getComputedStyle(button).backgroundImage,labelFont:getComputedStyle(button.nextElementSibling).fontSize,labelLine:getComputedStyle(button.nextElementSibling).lineHeight}))}
  })
  const ready=await measure()
  assert.equal(ready.panel.width,width-(width===390?40:48));near(ready.panel.height,160)
  assert.equal(ready.radius,'10px');assert.equal(ready.fontSize,'11px');assert.equal(ready.lineHeight,'16px');assert.ok(ready.font.includes('Montserrat'))
  assert.equal(ready.buttons.length,1);near(ready.buttons[0].button.width,84.48);near(ready.buttons[0].surface.width,84.48);near(ready.buttons[0].icon.width,26.88)
  assert.equal(ready.buttons[0].background,'none');assert.equal(ready.body,width)
  for(const size of [72,96]){
   const file=`figma-recording-surface-${size}.svg`,response=await page.request.get(base+'/artwork/'+file)
   assert.equal(response.status(),200);assert.deepEqual(await response.body(),await readFile(new URL('../public/artwork/'+file,import.meta.url)))
  }
  await page.locator('.v2-instrument').screenshot({path:`${output}/ready-${width}.png`})
  await page.locator('[data-action="record-start"]').focus();await page.keyboard.press('Enter')
  await page.waitForFunction(()=>document.querySelector('.recording-v2-screen')?.dataset.recordingStatus==='recording')
  await page.waitForFunction(()=>{const time=document.querySelector('.v2-recording-time b')?.textContent.split(' / ')[0]||'00:00';const [minutes,seconds]=time.split(':').map(Number);return minutes*60+seconds>=1})
  await page.waitForFunction(()=>[...document.querySelectorAll('.v2-recording-surface')].every(img=>img.complete&&img.naturalWidth>0))
  assert.equal(await page.locator('canvas[data-live-input="microphone"]').count(),1)
  assert.equal(await page.locator('.input-meter').count(),0)
  const recording=await measure();assert.equal(recording.buttons.length,3)
  const [restart,stop,pause]=recording.buttons
  for(const side of [restart,pause]){near(side.button.width,63.36);near(side.button.height,63.36);near(side.surface.width,63.36);near(side.icon.width,22.77);assert.equal(side.background,'none');assert.equal(side.labelFont,'10.07px')}
  near(stop.button.width,84.48);near(stop.surface.height,84.48);near(stop.icon.width,26.88)
  near(restart.button.y-stop.button.y,10.56);near(pause.button.y-stop.button.y,10.56)
  near(stop.button.x-(restart.button.x+restart.button.width),24);near(pause.button.x-(stop.button.x+stop.button.width),24)
  assert.equal(stop.labelFont,'13.2px');assert.equal(await page.locator('[data-action="record-stop"] svg').getAttribute('data-icon'),'stop')
  assert.equal(await page.getByRole('button',{name:'다시 녹음',exact:true}).locator('svg').getAttribute('data-icon'),'rotate-right')
  await page.locator('.v2-instrument').screenshot({path:`${output}/recording-${width}.png`})
  await page.locator('[data-action="record-pause"]').click()
  await page.waitForFunction(()=>document.querySelector('.recording-v2-screen')?.dataset.recordingStatus==='paused')
  assert.equal(await page.locator('[data-recording-readout]').textContent(),'일시정지')
  assert.equal(await page.locator('[data-action="record-resume"] svg').getAttribute('data-icon'),'play')
  const pausedTime=await page.locator('.v2-recording-time b').textContent()
  await page.waitForTimeout(1100);assert.equal(await page.locator('.v2-recording-time b').textContent(),pausedTime)
  await page.getByRole('button',{name:'다시 녹음',exact:true}).click()
  await page.getByRole('button',{name:'지금 녹음 유지',exact:true}).click()
  assert.equal(await page.locator('.recording-v2-screen').getAttribute('data-recording-status'),'paused')
  await page.locator('.v2-instrument').screenshot({path:`${output}/paused-${width}.png`})
  await page.evaluate(()=>{const nodes=[...document.querySelectorAll('.v2-instrument :is(span,b,button)')].filter(n=>[...n.childNodes].some(c=>c.nodeType===Node.TEXT_NODE&&c.textContent.trim()));const values=nodes.map(n=>({n,size:parseFloat(getComputedStyle(n).fontSize),line:parseFloat(getComputedStyle(n).lineHeight)}));for(const {n,size,line} of values){n.style.setProperty('font-size',size*2+'px','important');if(Number.isFinite(line))n.style.setProperty('line-height',line*2+'px','important')}})
  assert.equal(await page.evaluate(()=>document.body.scrollWidth),width)
  assert.equal(await page.locator('.v2-instrument').evaluate(panel=>{const r=panel.getBoundingClientRect(),readout=panel.querySelector('.v2-instrument-readout').getBoundingClientRect(),controls=panel.querySelector('.recorder-controls').getBoundingClientRect();return readout.bottom<=controls.top&&[...panel.querySelectorAll('.record-control>span')].every(n=>{const b=n.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right&&b.bottom<=r.bottom})}),true)
  await page.locator('.v2-instrument').screenshot({path:`${output}/text-stress-${width}.png`})
  await page.locator('[data-action="record-resume"]').focus();await page.keyboard.press('Enter')
  await page.waitForFunction(()=>document.querySelector('.recording-v2-screen')?.dataset.recordingStatus==='recording')
  await page.waitForTimeout(400)
  await page.locator('[data-action="record-stop"]').click()
  await page.waitForSelector('[data-action="record-submit"]')
  assert.equal(await page.locator('.recording-v2-screen').getAttribute('data-recording-status'),'review')
  assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),2,'Stopping does not submit a Track')
  await page.reload();await page.waitForSelector('[data-action="record-submit"]')
  assert.equal(await page.locator('.recording-v2-screen').getAttribute('data-recording-status'),'review')
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream?.active||false),false)
  assert.deepEqual(errors,[]);results.push({width,ready,recording,errors})
  await context.close();console.log('PASS Recording original surfaces/geometry, no automatic mic, actual synthetic recording, pause/resume, retake cancellation, Review persistence and 2x text stress',width)
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
 console.log('Synthetic microphone only. Physical microphone/listening/device text zoom remain unverified.')
}catch(error){console.error(error);throw error}finally{await browser.close();server?.kill('SIGTERM')}
