import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4198/'
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-workspace-timeline'
await mkdir(output,{recursive:true})
let server,browser
const results=[]
try{
 if(!process.env.IEUM_BASE_URL){
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4198','--strictPort'],{cwd:new URL('../',import.meta.url),stdio:['ignore','pipe','inherit']})
  await new Promise((resolve,reject)=>{server.stdout.on('data',v=>String(v).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Preview '+c)))})
 }
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,proxy:process.env.IEUM_BROWSER_PROXY?{server:process.env.IEUM_BROWSER_PROXY}:undefined,args:['--no-sandbox','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']})
 for(const width of (process.env.IEUM_QA_WIDTHS||'390,430').split(',').map(Number)){
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width,height:932},permissions:['microphone'],reducedMotion:'reduce'})
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message))
  try{
   const url=new URL(base);url.searchParams.set('scene','workspace');url.searchParams.set('run','workspace-player')
   await page.goto(url.href);await page.waitForSelector('.workspace-v2-screen');await page.evaluate(()=>document.fonts.ready)
   const button=page.locator('#current-mix [data-action="current-mix-play"]')
   assert.equal(await button.count(),1,'Workspace transport stays beside its seek bar')
   assert.equal(await page.locator('.v2-workspace-stage .v2-turntable-play').count(),0,'Workspace turntable has no duplicate transport')
   assert.equal(await button.isDisabled(),true)
   const geometry=await page.evaluate(()=>{
    const box=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}
    const m=document.querySelector('#current-mix'),b=m.querySelector('.play-btn'),r=m.querySelector('input'),clock=m.querySelector('.player-split-clock')
    return {mix:box(m),button:box(b),surface:box(b.querySelector('img')),icon:box(b.querySelector('svg')),range:box(r),clock:box(clock),body:document.body.scrollWidth,clockFont:getComputedStyle(clock).fontFamily,clockSize:getComputedStyle(clock).fontSize,clockLine:getComputedStyle(clock).lineHeight}
   })
   assert.equal(geometry.mix.width,Math.min(370,width-(width===390?40:48)))
   assert.equal(geometry.mix.height,80,'Figma 1623:41443 is 24px heading + 8px separation + 48px controls')
   assert.deepEqual([geometry.button.width,geometry.button.height],[48,48]);assert.deepEqual([geometry.surface.width,geometry.surface.height],[48,48])
   assert.ok(Math.abs(geometry.icon.width-14.4)<.02&&Math.abs(geometry.icon.height-14.4)<.02)
   assert.equal(geometry.button.y-geometry.mix.y,32)
   assert.equal(geometry.range.x-geometry.button.x,64)
   assert.equal(geometry.range.y+geometry.range.height/2-geometry.button.y,16,'Keep source seek center; do not align the combined seek+clock box mechanically')
   assert.equal(geometry.clock.y-geometry.button.y,30)
   assert.equal(geometry.clockSize,'11px');assert.equal(geometry.clockLine,'16px');assert.ok(geometry.clockFont.includes('Montserrat'));assert.equal(geometry.body,width)
   await page.screenshot({path:`${output}/workspace-empty-${width}.png`,fullPage:true})
   await page.locator('[data-action="record-part"]').click();await page.locator('[data-action="record-start"]:enabled').waitFor()
   await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]')
   await page.waitForFunction(()=>window.__IEUM_V2__.audioRuntime.activeElapsedSec+window.__IEUM_V2__.audioRuntime.context.currentTime-window.__IEUM_V2__.audioRuntime.activeStartedAt>2.2)
   await page.locator('[data-action="record-stop"]').click();await page.locator('[data-action="record-submit"]:enabled').waitFor()
   const original=await page.evaluate(async()=>{const r=window.__IEUM_V2__.audioRuntime;return {hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await r.recordingBlob.arrayBuffer())),v=>v.toString(16).padStart(2,'0')).join(''),bytes:r.recordingBlob.size}})
   await page.locator('[data-action="record-submit"]').click();await page.waitForSelector('.workspace-v2-screen')
   await button.locator('img').waitFor();await button.waitFor()
   await page.waitForFunction(()=>!document.querySelector('#current-mix [data-action="current-mix-play"]')?.disabled)
   await button.focus();await page.keyboard.press('Enter')
   await page.waitForFunction(()=>document.querySelector('#current-mix audio')?.currentTime>.15)
   assert.equal(await button.getAttribute('aria-label'),'현재 듣기 일시정지')
   const toggle=page.getByRole('checkbox',{name:'Tenor 현재 Mix 포함',exact:true})
   await toggle.uncheck();await page.waitForFunction(()=>document.querySelector('#current-mix [data-action="current-mix-play"]')?.disabled)
   assert.equal(await page.locator('#current-mix audio').count(),0)
   await toggle.check();await page.waitForFunction(()=>!document.querySelector('#current-mix [data-action="current-mix-play"]')?.disabled)
   await button.click();await page.waitForFunction(()=>document.querySelector('#current-mix audio')?.currentTime>.15)
   await button.click();await page.waitForFunction(()=>document.querySelector('#current-mix audio')?.paused)
   const seek=page.locator('#current-mix input[aria-label="재생 위치"]')
   await seek.focus();await page.keyboard.press('ArrowRight');assert.ok(Number(await seek.inputValue())>0)
   assert.equal(await seek.evaluate(n=>n.matches(':focus-visible')),true)
   const focusGeometry=await seek.evaluate(n=>{
    const row=n.parentElement,clock=row.querySelector('.player-split-clock'),r=row.getBoundingClientRect(),c=clock.getBoundingClientRect(),s=getComputedStyle(row,'::after')
    return {hitHeight:n.getBoundingClientRect().height,clockTop:c.top-r.top,clockHeight:c.height,indicator:s.content,indicatorTop:parseFloat(s.top),indicatorHeight:parseFloat(s.height),inputOutline:getComputedStyle(n).outlineStyle}
   })
   const clock=page.locator('#current-mix .player-split-clock')
   const focusedClock=await clock.screenshot({path:`${output}/clock-focused-${width}.png`})
   await page.locator('#current-mix').screenshot({path:`${output}/player-${width}.png`})
   await seek.blur()
   const blurredClock=await clock.screenshot({path:`${output}/clock-blurred-${width}.png`})
   await page.locator('#current-mix').screenshot({path:`${output}/player-blurred-${width}.png`})
   const focusResult={...focusGeometry,clockPixelsUnchanged:focusedClock.equals(blurredClock)}
   await writeFile(`${output}/focus-${width}.json`,JSON.stringify(focusResult,null,2))
   assert.equal(focusGeometry.hitHeight,44,'Keep the native 44px touch target')
   assert.equal(focusResult.clockPixelsUnchanged,true,'Keyboard focus must not paint over clock glyphs')
   assert.equal(focusGeometry.inputOutline,'none')
   assert.notEqual(focusGeometry.indicator,'none','Keyboard focus remains visible around the seek area')
   assert.ok(focusGeometry.indicatorTop>=0&&focusGeometry.indicatorTop+focusGeometry.indicatorHeight<=focusGeometry.clockTop)
   assert.equal(await seek.evaluate(n=>getComputedStyle(n.parentElement,'::after').content),'none','Blur removes only the focus indicator')
   await page.screenshot({path:`${output}/workspace-submitted-${width}.png`,fullPage:true})
   const retained=await page.evaluate(async()=>{const s=window.__IEUM_V2__.state,t=s.activeTracks.tenor;return {hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await t.blob.arrayBuffer())),v=>v.toString(16).padStart(2,'0')).join(''),bytes:t.blob.size,tracks:Object.keys(s.activeTracks),mix:Boolean(s.activeMix?.blob)}})
   assert.equal(retained.hash,original.hash);assert.equal(retained.bytes,original.bytes);assert.deepEqual(retained.tracks,['tenor']);assert.equal(retained.mix,false)
   await page.evaluate(()=>{for(const n of document.querySelectorAll('#current-mix :is(p,strong,span,b)'))if([...n.childNodes].some(c=>c.nodeType===Node.TEXT_NODE&&c.textContent.trim())){const st=getComputedStyle(n),size=parseFloat(st.fontSize),line=parseFloat(st.lineHeight);n.style.fontSize=size*2+'px';if(Number.isFinite(line))n.style.lineHeight=line*2+'px'}})
   assert.equal(await page.evaluate(()=>document.body.scrollWidth),width)
   assert.ok(await page.evaluate(()=>{const m=document.querySelector('#current-mix').getBoundingClientRect(),clock=document.querySelector('.player-split-clock').getBoundingClientRect();return clock.bottom<=m.bottom}))
   assert.deepEqual(errors,[]);results.push({width,geometry,focusResult,original,retained,keyboardPlayback:true,selectionRebuild:true,textStress:true})
   console.log('PASS',width,'Figma 80px transport / 48px play / 64px seek inset, native microphone submission and toggle playback preserve original; remains 1/4')
  }finally{await context.close()}
 }
 await writeFile(`${output}/results.json`,JSON.stringify({scope:'Figma geometry plus isolated native synthetic microphone and browser playback. Not physical capture, four-user completion or listening-quality acceptance.',results},null,2))
}finally{await browser?.close();server?.kill()}
