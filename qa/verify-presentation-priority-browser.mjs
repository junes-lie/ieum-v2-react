import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
import {PRESENTATION_AUDIO} from '../src/presentationAudio.js'
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4213/'
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-presentation-local'
await mkdir(output,{recursive:true})
let server,browser
const results=[]
const route=async(page,screen)=>{await page.evaluate(screen=>{history.replaceState({...history.state,ieumScreen:screen},'','#'+screen);dispatchEvent(new PopStateEvent('popstate',{state:history.state}))},screen);await page.waitForFunction(screen=>window.__IEUM_V2__?.state.screen===screen,screen)}
const capture=async(page,name,width)=>{await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.body.scrollWidth),width,name+' horizontal overflow');await page.screenshot({path:`${output}/${name}-${width}.png`,fullPage:true})}
const bytes=page=>page.evaluate(async()=>{const tracks=window.__IEUM_V2__.state.projectTracks;return Promise.all(Object.values(tracks).map(async t=>({id:t.id,partId:t.partId,bytes:t.blob.size,hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await t.blob.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('')})))})
try{
 if(!process.env.IEUM_BASE_URL){server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4213','--strictPort'],{stdio:['ignore','pipe','inherit']});await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Preview '+c)))})}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,proxy:process.env.IEUM_BROWSER_PROXY?{server:process.env.IEUM_BROWSER_PROXY}:undefined,args:['--no-sandbox','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream',...(process.env.IEUM_QA_TONE?['--use-file-for-fake-audio-capture='+process.env.IEUM_QA_TONE]:[])]})
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},reducedMotion:'reduce',permissions:['microphone'],ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[]
  page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message))
  try{
   const url=new URL(base);url.searchParams.set('scene','first-visit');url.searchParams.set('run','presentation-priority')
   await page.goto(url.href);await page.waitForFunction(()=>window.__IEUM_V2__?.state)
   const before=await bytes(page)
   await page.locator('.v2-recruit-info').scrollIntoViewIfNeeded()
   const home=await page.locator('[data-action="home-preview"]').evaluate(n=>{const rect=n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height}},deck=n.closest('.v2-turntable-frame'),surface=n.querySelector('.v2-home-preview-surface'),d=rect(deck),s=rect(surface),b=rect(n);return {deck:d,surface:s,button:b,surfaceOffset:{x:s.x-d.x,y:s.y-d.y},hit:document.elementFromPoint(b.x+1,b.y+22)?.closest('button')===n,kind:n.dataset.previewKind}})
   assert.deepEqual(home.surfaceOffset,{x:205.5,y:197});assert.equal(home.surface.width,30);assert.equal(home.button.width,44);assert.equal(home.button.height,44);assert.ok(home.hit);assert.equal(home.kind,'reference')
   await page.locator('[data-action="home-preview"]').click();await page.waitForFunction(()=>document.querySelector('[data-home-preview-audio]')?.currentTime>.15)
   await page.locator('[data-action="home-preview"]').click();assert.equal(await page.locator('[data-home-preview-audio]').evaluate(n=>n.paused),true)
   await capture(page,'home-preview',width)
   await page.locator('[aria-label="다음 모집 프로젝트"]').click();assert.equal(await page.locator('[data-action="home-preview"]').isDisabled(),true)
   assert.equal(await page.locator('[data-home-preview-audio]').evaluate(n=>n.paused&&!n.getAttribute('src')),true)
   await page.locator('[aria-label="이전 모집 프로젝트"]').click();await page.locator('[data-action="open-parts"]').click();await page.waitForSelector('.detail-v2-screen')
   const example=page.locator('.detail-mix[data-presentation-audio]'),player=example.locator('.play-btn'),audio=example.locator('audio')
   assert.equal(await example.getAttribute('data-presentation-audio'),'presentation-complete-example')
   assert.ok((await example.innerText()).includes(PRESENTATION_AUDIO.title));assert.ok((await example.innerText()).includes('시연용 예시 완성 음원'))
   const file=await page.evaluate(async expected=>{const audio=document.querySelector('.detail-mix audio'),r=await fetch(audio.src),b=await r.arrayBuffer();return {status:r.status,bytes:b.byteLength,hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(n=>n.toString(16).padStart(2,'0')).join(''),expected}},PRESENTATION_AUDIO.sha256)
   assert.equal(file.status,200);assert.equal(file.bytes,PRESENTATION_AUDIO.bytes);assert.equal(file.hash,PRESENTATION_AUDIO.sha256)
   await player.click();await page.waitForFunction(()=>document.querySelector('.detail-mix audio')?.currentTime>.2)
   await player.click();assert.equal(await audio.evaluate(n=>n.paused),true)
   const range=example.locator('input[type=range]');await range.focus();await page.keyboard.press('Home');for(let i=0;i<30;i++)await page.keyboard.press('ArrowRight')
   const seek=await audio.evaluate(n=>({time:n.currentTime,duration:n.duration}));assert.ok(seek.time>2);assert.ok(Math.abs(seek.duration-PRESENTATION_AUDIO.duration)<.1)
   await player.click();await page.waitForFunction(start=>document.querySelector('.detail-mix audio')?.currentTime>start+.15,seek.time);await player.click()
   await capture(page,'detail-unregistered',width);assert.deepEqual(await bytes(page),before)
   // A different project never acquires the presentation MP3.
   await page.locator('.project-carousel>button').nth(1).click();assert.equal(await page.locator('[data-presentation-audio]').count(),0)
   await page.locator('.project-carousel>button').first().click()
   if(process.env.IEUM_QA_SMOKE==='1'){
    await page.locator('[data-action="voice-setup"]').click();await page.locator('[data-action="range-start"]').waitFor();await capture(page,'VP01',width)
    url.searchParams.set('scene','workspace');await page.goto(url.href);await page.waitForSelector('.workspace-v2-screen');assert.equal(await page.locator('.v2-part-module input:disabled').count(),4);await capture(page,'workspace-pending-toggles',width)
    await page.locator('[data-nav="home"]').click();await page.locator('.v2-completed-card').first().click();await page.waitForSelector('.complete-screen')
    const control=page.locator('.complete-listening-group .play-btn');await control.click();await page.waitForFunction(()=>document.querySelector('.complete-listening-group audio')?.currentTime>.15);await control.click()
    const geometry=await control.evaluate(n=>{const b=n.getBoundingClientRect(),i=n.querySelector('svg').getBoundingClientRect(),img=n.querySelector('img').getBoundingClientRect(),p=n.closest('.audio-player').getBoundingClientRect();return {button:{w:b.width,h:b.height},surface:{w:img.width,h:img.height},iconCenter:{x:i.x+i.width/2-b.x,y:i.y+i.height/2-b.y},playerHeight:p.height}})
    assert.equal(geometry.surface.w,48);assert.equal(geometry.surface.h,48);assert.ok(Math.abs(geometry.iconCenter.x-24.4)<.1);assert.ok(Math.abs(geometry.iconCenter.y-24)<.1);assert.equal(geometry.playerHeight,72)
    await capture(page,'complete',width);assert.deepEqual(errors,[]);assert.deepEqual(await bytes(page),before)
    results.push({width,home,file,seek,geometry,scope:'Public smoke: changed native playback, visible disabled toggles, VP intro and complete control surface. Full VP/Review synthetic flow was verified locally.'});console.log('PASS smoke',width);continue
   }
   await page.locator('[data-action="voice-setup"]').click();await page.locator('[data-action="range-start"]').waitFor();await capture(page,'VP01',width)
   await page.locator('[data-action="range-start"]').click();await page.locator('[data-action="range-finish"]').waitFor();await capture(page,'VP02',width)
   await page.waitForFunction(()=>Number(document.querySelector('[data-action="range-finish"]')?.textContent.match(/(\d+) samples/)?.[1])>=6)
   await page.locator('[data-action="range-finish"]').click();await page.locator('[data-action="sample-next"]').waitFor();await capture(page,'VP03-range',width)
   await page.locator('[data-action="sample-next"]').click();await page.locator('.sample-select-stage>.primary').waitFor();await capture(page,'VP03-songs',width)
   await page.locator('.sample-select-stage>.primary').click();await capture(page,'VP04',width)
   await page.locator('[data-action="sample-start"]').click();await page.locator('[data-action="sample-stop"]').waitFor();await page.waitForTimeout(3500);await page.locator('[data-action="sample-stop"]').click();await page.locator('[data-action="voice-complete"]').waitFor();await capture(page,'VP05',width)
   await page.locator('[data-action="voice-complete"]').click();await page.locator('[data-action="preferences-skip"]').waitFor();await capture(page,'VP05A',width)
   await page.locator('[data-action="preferences-skip"]').click();await page.locator('[data-action="profile-finish"]').waitFor();await capture(page,'VP06',width)
   await page.locator('[data-action="profile-finish"]').click();await page.waitForSelector('.detail-v2-screen[data-profile-state="present"]');assert.equal(await page.locator('[data-match-percent]').count(),0,'Actual Profile has no invented score')
   await capture(page,'detail-registered',width)
   await page.locator('[data-action="join-part"]').click();await page.waitForSelector('.workspace-v2-screen')
   const toggles=page.locator('.v2-part-module input[type=checkbox]');assert.equal(await toggles.count(),4);assert.equal(await page.locator('.v2-part-module input:disabled').count(),4);assert.equal(await page.locator('.v2-part-module input:checked').count(),0)
   await capture(page,'workspace-pending-toggles',width)
   await page.locator('[data-action="record-part"]').click();await page.locator('[data-action="record-start"]:enabled').click();await page.locator('[data-action="record-pause"]').waitFor();await page.waitForTimeout(2200);await page.locator('[data-action="record-stop"]').click();await page.locator('[data-action="record-submit"]:enabled').waitFor();await capture(page,'recording-review',width)
   await page.locator('[data-action="record-submit"]').click();await page.waitForSelector('.workspace-v2-screen');await page.waitForFunction(()=>!document.querySelector('#current-mix .play-btn').disabled)
   assert.equal(await page.locator('.v2-part-module input:disabled').count(),3);assert.equal(await page.locator('.v2-part-module input:checked').count(),1)
   const own=page.locator('.v2-part-module input:enabled');await own.uncheck();await page.waitForFunction(()=>document.querySelector('#current-mix .play-btn').disabled);await own.check();await page.waitForFunction(()=>!document.querySelector('#current-mix .play-btn').disabled)
   await page.locator('#current-mix .play-btn').click();await page.waitForFunction(()=>document.querySelector('#current-mix audio')?.currentTime>.15);await page.locator('#current-mix .play-btn').click();await capture(page,'workspace-submitted-toggles',width)
   const retained=await bytes(page);assert.equal(retained.length,1)
   await page.locator('[data-nav="home"]').click();await page.locator('.v2-completed-card').first().click();await page.waitForSelector('.complete-screen');await capture(page,'complete',width)
   const complete=await page.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom}},r=box('.complete-record'),t=box('.complete-title'),l=box('.complete-listening-group'),p=box('.complete-listening-group>.audio-player'),a=box('.complete-actions');return {record:r,title:t,listening:l,player:p,actions:a,playerGap:p.y-t.bottom,actionGap:a.y-l.bottom}})
   assert.equal(complete.record.w,460);assert.equal(complete.playerGap,24);assert.equal(complete.actionGap,12)
   assert.deepEqual(await bytes(page),retained);assert.deepEqual(errors,[])
   results.push({width,home,file,seek,complete,workspace:{pendingToggles:4,submittedToggles:1,disabledUnsubmitted:3,inclusionActuallyRebuilt:true},retained,scope:'Native browser audio and isolated synthetic microphone only; no physical microphone or multi-user acceptance.'})
   console.log('PASS',width,'changed Home control, supplied MP3, VP stages, Review, visible Part toggles and completion groups')
  }catch(error){await page.screenshot({path:`${output}/failure-${width}.png`,fullPage:true}).catch(()=>{});await writeFile(`${output}/failure-${width}.json`,JSON.stringify({error:String(error),errors,text:await page.locator('body').innerText().catch(()=>'' )},null,2));throw error}finally{await context.close()}
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
}finally{await browser?.close();server?.kill()}
