import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4202'
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4202','--strictPort'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',code=>reject(Error('Vite '+code)))})
}
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-recording-review'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
const results=[]
const stress=page=>page.evaluate(()=>{
 const panel=document.querySelector('.record-review')
 // Scoped CSS text enlargement, not native device zoom or product fixture data.
 const values=[...panel.querySelectorAll('.v2-take-status,.player-caption,.player-clock,.review-actions button')].map(n=>({n,size:parseFloat(getComputedStyle(n).fontSize),line:parseFloat(getComputedStyle(n).lineHeight)}))
 for(const {n,size,line}of values){if(n.dataset.qaEnlarged)continue;n.dataset.qaEnlarged='true';n.style.setProperty('font-size',size*2+'px','important');n.style.setProperty('line-height',line*2+'px','important')}
 panel.querySelector('.player-caption').textContent='내 녹음을 처음부터 끝까지 다시 들어보기'
 panel.querySelector('.v2-take-status span').textContent=panel.closest('.v2-instrument').dataset.instrumentState==='submitting'?'녹음을 제출하고 있어요. 잠시 기다려 주세요.':'저장한 녹음을 듣고 제출할 Track을 확인해 주세요.'
})
const measure=page=>page.locator('.record-review').evaluate(panel=>{
 const box=n=>{const r=n.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}}
 const text=n=>{const r=document.createRange();r.selectNodeContents(n);return box({getBoundingClientRect:()=>r.getBoundingClientRect()})}
 const caption=panel.querySelector('.player-caption'),clock=panel.querySelector('.player-clock'),player=panel.querySelector('.audio-player'),slider=panel.querySelector('input'),summary=panel.querySelector('.player-summary')
 const p=box(panel),c=text(caption),t=text(clock),s=box(slider),info=box(summary)
 const inside=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1
 return {panel:p,player:box(player),caption:c,clock:t,slider:s,status:box(panel.querySelector('.v2-take-status')),info,
  contained:inside(c,info)&&inside(t,info)&&inside(box(player),p)&&inside(s,p),
  textSeparate:c.right<=t.left+1||t.right<=c.left+1||c.bottom<=t.top+1||t.bottom<=c.top+1,
  seekBelowText:s.top+s.height/2>=Math.max(c.bottom,t.bottom)+2,
  buttons:[...panel.querySelectorAll('.review-actions button')].map(n=>({box:box(n),contained:inside(text(n.querySelector('span')),box(n)),surface:getComputedStyle(n,'::before').borderImageSource})),body:document.body.scrollWidth}
})
const check=(value,width)=>{assert.equal(value.body,width);assert.equal(value.contained,true,'Text, native seek target and player stay inside their containers');assert.equal(value.textSeparate,true,'Caption and real time must not overlap');assert.equal(value.seekBelowText,true,'Visible seek track stays below enlarged text');for(const b of value.buttons){assert.equal(b.contained,true,'Button label remains readable');assert.ok(b.box.height>=44)}}
try{
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},locale:'ko-KR',permissions:['microphone'],reducedMotion:'reduce'}),page=await context.newPage(),errors=[]
  page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  await page.goto(base+'/?scene=recording');await page.waitForSelector('[data-action="record-start"]:not(:disabled)')
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream?.active||false),false)
  await page.locator('[data-action="record-start"]').click();await page.waitForFunction(()=>document.querySelector('.recording-v2-screen')?.dataset.recordingStatus==='recording')
  await page.waitForTimeout(1600);await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('[data-action="record-submit"]:not(:disabled)')
  await page.evaluate(()=>document.fonts.ready)
  const normal=await measure(page);assert.ok(Math.abs(normal.panel.height-190)<.03);assert.ok(Math.abs(normal.player.height-58.429)<.03)
  const count=await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),take=await page.locator('.record-review audio').getAttribute('src')
  await stress(page);const review=await measure(page);console.log(JSON.stringify({width,state:'review',...review}));await page.locator('.record-review').screenshot({path:output+'/review-text-'+width+'.png'})
  check(review,width)
  const seek=page.locator('.record-review input');await seek.focus();await page.keyboard.press('End');assert.ok(Number(await seek.inputValue())>0);await page.keyboard.press('Home')
  await page.locator('.record-review .play-btn').click();await page.waitForFunction(()=>document.querySelector('.record-review audio').currentTime>.1)
  await page.locator('[data-action="record-retry"]').click();await page.getByRole('button',{name:'지금 녹음 유지',exact:true}).click();assert.equal(await page.locator('.record-review audio').getAttribute('src'),take)
  await page.evaluate(()=>{window.__originalDigest=crypto.subtle.digest.bind(crypto.subtle);crypto.subtle.digest=()=>new Promise((resolve,reject)=>{window.__rejectSubmission=()=>reject(Error('QA controlled submit failure'))})})
  await page.locator('[data-action="record-submit"]').click();await page.waitForFunction(()=>!!window.__rejectSubmission);await stress(page)
  const submitting=await measure(page);console.log(JSON.stringify({width,state:'submitting',...submitting}));await page.locator('.record-review').screenshot({path:output+'/submitting-text-'+width+'.png'});check(submitting,width)
  assert.equal(await seek.isDisabled(),true);assert.equal(await page.locator('.record-review .play-btn').isDisabled(),true);assert.equal(await page.locator('[data-action="record-retry"]').count(),0)
  await page.evaluate(()=>{crypto.subtle.digest=window.__originalDigest;window.__rejectSubmission()});await page.waitForSelector('[data-action="record-submit"]:not(:disabled)')
  assert.equal(await page.locator('.record-review audio').getAttribute('src'),take);assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),count)
  await page.reload();await page.waitForSelector('[data-action="record-submit"]:not(:disabled)');assert.equal(await page.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream?.active||false),false)
  await page.locator('[data-action="record-submit"]').click();await page.waitForSelector('.workspace-v2-screen');assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),count+1)
  assert.deepEqual(errors,[]);results.push({width,normal,review,submitting,errors});await context.close()
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2));console.log('PASS Review/Submitting long copy, 2x CSS text, real seek/play, cancel, failed submit preservation/reload/retry at 390/430px. Synthetic microphone only; physical device zoom/listening unverified.')
}finally{await browser.close();server?.kill()}
