import {createRequire} from 'node:module'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4286/ieum-v2-react/'
let server
if(!process.env.IEUM_BASE_URL){server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4286','--base','/ieum-v2-react/','--strictPort'],{stdio:['ignore','pipe','inherit']});await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject)})}
const browser=await chromium.launch({headless:true,proxy:process.env.IEUM_BASE_URL?{server:process.env.HTTPS_PROXY}:undefined,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']})
try{for(const width of (process.env.IEUM_QA_WIDTHS||'390,430').split(',').map(Number)){
const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width,height:932},permissions:['microphone'],reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(30000)
const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message))
await context.addInitScript(()=>{window.qaAudio=[];window.qaOscillators=0;const osc=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(...a){window.qaOscillators++;return osc.apply(this,a)};const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.qaAudio.push(this.buffer?.duration);return start.apply(this,args)}})
await page.goto(base);await page.locator('iframe').waitFor();const frame=page.frames().find(f=>f!==page.mainFrame());await frame.waitForSelector('.v2-hero').catch(async e=>{console.log('BOOT',await frame.locator('body').innerText(),errors);throw e})
assert.equal(await page.locator('.demo-menu').isVisible(),false)
const initial=await frame.evaluate(()=>{const s=window.__IEUM_V2__.state;return {id:s.activeProject.id,title:s.activeProject.title,tracks:Object.keys(s.activeTracks)}})
assert.equal(initial.title,'오늘 같은 날');assert.ok(!(await frame.locator('body').innerText()).includes('A Thousand Years'),'Replaced presentation item must not appear as a duplicate song');assert.deepEqual(initial.tracks,['voice-a']);console.log('INITIAL',width,initial)
await page.screenshot({path:`/tmp/ieum-present-${width}-home.png`})
await frame.getByRole('button',{name:'프로젝트 보기 →',exact:true}).click()
await frame.waitForSelector('.detail-v2-screen');assert.equal(await frame.locator('.detail-song-title h1').textContent(),'오늘 같은 날');assert.ok((await frame.locator('.detail-selected').textContent()).includes('1/2'))
await frame.waitForFunction(()=>document.querySelector('.detail-mix audio')?.duration>21)
await page.screenshot({path:`/tmp/ieum-present-${width}-detail.png`})
await frame.locator('[data-action="join-part"]').click();await frame.waitForSelector('.workspace-v2-screen')
assert.equal(await frame.locator('.title-row h1').textContent(),'오늘 같은 날');assert.equal(await frame.locator('.v2-part-actions').count()>0,true)
await frame.locator('[data-action="record-part"]').click();await frame.waitForSelector('.recording-screen')
const box=await frame.locator('[data-action="record-start"]').boundingBox();assert.ok(box.y+box.height<=932)
await page.screenshot({path:`/tmp/ieum-present-${width}-record.png`})
await frame.locator('[data-action="record-start"]').click();await frame.waitForSelector('[data-action="record-pause"]');await frame.waitForFunction(()=>window.qaAudio.some(d=>Math.abs(d-22)<.03));await frame.waitForFunction(()=>document.querySelector('.lyrics .active')?.textContent.includes('오늘도 함께해요'))
if(process.env.IEUM_QA_SHORT_TAKE!=='1')await frame.waitForSelector('[data-action="record-submit"]',{timeout:60000});else{await frame.locator('[data-action="record-stop"]').click();await frame.waitForSelector('[data-action="record-submit"]')}
await frame.locator('[data-action="record-submit"]').click();await frame.waitForFunction(()=>window.__IEUM_V2__.state.activeMixStatus==='complete',{timeout:30000})
if(await frame.locator('[data-action="open-complete"]').count())await frame.locator('[data-action="open-complete"]').click()
await frame.waitForSelector('.complete-screen')
const end=await frame.evaluate(async()=>{const s=window.__IEUM_V2__.state;const ctx=new AudioContext(),b=await ctx.decodeAudioData(await s.activeMix.blob.arrayBuffer());let rms=0;for(const v of b.getChannelData(0))rms+=v*v;await ctx.close();return {song:s.activeProject.songId,parts:Object.keys(s.activeTracks),takeDuration:s.activeTracks['voice-b'].duration,duration:b.duration,rms:Math.sqrt(rms/b.length),status:s.activeMixStatus}})
assert.equal(end.parts.length,2);if(process.env.IEUM_QA_SHORT_TAKE!=='1')assert.ok(end.takeDuration>21.5&&end.takeDuration<22.5,`Native Take duration ${end.takeDuration}`);assert.ok(Math.abs(end.duration-22)<.03);assert.ok(end.rms>.001)
await frame.locator('audio').first().evaluate(async a=>{await a.play()});await frame.waitForFunction(()=>document.querySelector('audio')?.currentTime>.1)
assert.deepEqual(errors,[]);assert.equal(await frame.evaluate(()=>window.qaOscillators),0);assert.ok(!requests.some(s=>s.includes('/demo-stems/')))
await page.screenshot({path:`/tmp/ieum-present-${width}-complete.png`});console.log('PASS',width,JSON.stringify(end),'design classes, populated 1/2 -> one user submission -> 2/2 real 22s auto mix and playback');await page.reload();await page.locator('iframe').waitFor();const restored=await (await page.locator('iframe').elementHandle()).contentFrame();await restored.waitForSelector('.v2-hero');await restored.waitForFunction(()=>Object.keys(window.__IEUM_V2__.state.activeTracks).length===2&&window.__IEUM_V2__.state.activeMix?.blob?.size>0);console.log('PASS',width,'reload retains both original Tracks and the final Mix');await context.close()
}}finally{await browser.close();server?.kill()}
