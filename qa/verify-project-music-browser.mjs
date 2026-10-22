import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
import {WARM_ARRANGEMENT,WARM_PROJECT_ID} from '../src/projectMusic.js'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4251'
const appBase=base.endsWith('/')?base:base+'/'
const out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-project-music'
await mkdir(out,{recursive:true})
let server,browser,activePage,activeWidth,activeActor
try{
 if(!process.env.IEUM_BASE_URL){
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4251','--strictPort'],{stdio:['ignore','pipe','inherit']})
  await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})
 }
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required',...(process.env.IEUM_QA_FAKE_AUDIO_FILE?[`--use-file-for-fake-audio-capture=${process.env.IEUM_QA_FAKE_AUDIO_FILE}`]:[])]})
 for(const width of (process.env.IEUM_QA_WIDTHS||'390,430').split(',').map(Number)){
  const context=await browser.newContext({viewport:{width,height:932},permissions:['microphone'],reducedMotion:'reduce'})
  await context.addInitScript(()=>{
   window.qaStarts=[]
   window.qaRecorderEvents=[]
   window.qaReviewTransitions=[]
   window.qaLongTasks=[]
   window.qaDecodes=[]
   window.qaOfflineRenders=[]
   window.qaClockSamples=[]
   window.qaNavigation=[]
   const forward=History.prototype.forward
   History.prototype.forward=function(...args){
    window.qaNavigation.push({event:'forward',wallMs:performance.now(),screen:window.__IEUM_V2__?.state.screen})
    return forward.apply(this,args)
   }
   addEventListener('popstate',event=>window.qaNavigation.push({event:'popstate',wallMs:performance.now(),target:event.state?.ieumScreen,screen:window.__IEUM_V2__?.state.screen}))
   // Wall time and Web Audio can diverge under output/render starvation.
   // Observe both without substituting a wall clock for the musical timeline.
   setInterval(()=>{
    const rt=window.__IEUM_V2__?.audioRuntime
    if(!rt?.context||!rt.recorder||rt.recorder.state==='inactive')return
    window.qaClockSamples.push({wallMs:performance.now(),audioSec:rt.context.currentTime,contextState:rt.context.state,recorder:rt.recorder.state,elapsed:rt.activeElapsedSec,started:rt.activeStartedAt,clock:document.querySelector('[data-recording-entry]')?.textContent})
    if(window.qaClockSamples.length>120)window.qaClockSamples.shift()
   },1000)
   let lastReviewState=''
   const inspectReview=()=>{
    const screen=document.querySelector('[data-recording-status]'),submit=document.querySelector('[data-action="record-submit"]')
    const status=screen?.dataset.recordingStatus,disabled=submit?.disabled
    const signature=JSON.stringify([status,Boolean(submit),disabled])
    if(signature===lastReviewState)return
    lastReviewState=signature
    window.qaReviewTransitions.push({wallMs:performance.now(),audioSec:window.__IEUM_V2__?.audioRuntime?.context?.currentTime,status,submit:Boolean(submit),disabled})
   }
   new MutationObserver(inspectReview).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['data-recording-status','disabled']})
   if(PerformanceObserver.supportedEntryTypes?.includes('longtask'))new PerformanceObserver(list=>{
    for(const entry of list.getEntries())window.qaLongTasks.push({start:entry.startTime,duration:entry.duration})
    if(window.qaLongTasks.length>200)window.qaLongTasks.splice(0,window.qaLongTasks.length-200)
   }).observe({type:'longtask',buffered:true})
   for(const ContextClass of [AudioContext,OfflineAudioContext]){
    const decode=ContextClass.prototype.decodeAudioData
    ContextClass.prototype.decodeAudioData=function(...args){
     const entry={start:performance.now(),bytes:args[0]?.byteLength,context:ContextClass.name};window.qaDecodes.push(entry)
     return decode.apply(this,args).then(buffer=>{entry.end=performance.now();entry.duration=buffer.duration;return buffer},error=>{entry.end=performance.now();entry.error=String(error);throw error})
    }
   }
   const render=OfflineAudioContext.prototype.startRendering
   OfflineAudioContext.prototype.startRendering=function(...args){
    const entry={start:performance.now(),frames:this.length,sampleRate:this.sampleRate,channels:this.destination.channelCount};window.qaOfflineRenders.push(entry)
    return render.apply(this,args).then(buffer=>{entry.end=performance.now();entry.duration=buffer.duration;return buffer},error=>{entry.end=performance.now();entry.error=String(error);throw error})
   }
   const observed=new WeakSet()
   const trace=(recorder,event)=>{
    const rt=window.__IEUM_V2__?.audioRuntime
    window.qaRecorderEvents.push({event,wallMs:performance.now(),audioSec:rt?.context?.currentTime,state:recorder.state,elapsed:rt?.activeElapsedSec,started:rt?.activeStartedAt,segment:rt?.recordingSegmentActive})
   }
   for(const name of ['start','pause','resume','stop']){
    const original=MediaRecorder.prototype[name]
    MediaRecorder.prototype[name]=function(...args){
     if(!observed.has(this)){
      observed.add(this)
      for(const event of ['start','pause','resume','stop'])this.addEventListener(event,()=>trace(this,event+' event'))
      this.addEventListener('dataavailable',event=>{
       window.qaRecorderEvents.push({event:'dataavailable',wallMs:performance.now(),audioSec:window.__IEUM_V2__?.audioRuntime?.context?.currentTime,timecode:event.timecode,bytes:event.data.size})
      })
     }
     trace(this,name+' call')
     return original.apply(this,args)
    }
   }
   const create=AudioContext.prototype.createBufferSource
   AudioContext.prototype.createBufferSource=function(){const node=create.call(this),start=node.start.bind(node),ctx=this;node.start=(at,offset=0,...rest)=>{window.qaStarts.push({at,offset,now:ctx.currentTime,duration:node.buffer?.duration,timeline:window.__IEUM_V2__?.audioRuntime?{elapsed:window.__IEUM_V2__.audioRuntime.activeElapsedSec,started:window.__IEUM_V2__.audioRuntime.activeStartedAt,sync:window.__IEUM_V2__.audioRuntime.syncOffsetSec,state:window.__IEUM_V2__.audioRuntime.recorder?.state}:null});return start(at,offset,...rest)};return node}
  })
  const page=await context.newPage();page.setDefaultTimeout(20000)
  activePage=page;activeWidth=width;activeActor=null
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  await page.goto(new URL('?embedded=1',appBase).href);await page.waitForFunction(()=>window.__IEUM_V2__?.state)
  await page.evaluate(()=>localStorage.setItem('qa:original-user-sentinel','preserve'))
  const decoded=await page.evaluate(async appBase=>{
   const ctx=new AudioContext(),result=[]
   for(const [folder,duration] of [['ai-light-v1',16],['ai-warm-direct-v1',19],['ai-rain-v1',18],['project-warm-unison-v1',22]]){
    for(const file of folder.startsWith('project-')?['backing.mp3','reference.mp3']:['sample.mp3','backing.mp3']){
     const response=await fetch(new URL('audio/'+folder+'/'+file,appBase));if(!response.ok)throw Error('Missing '+folder+'/'+file)
     const b=await ctx.decodeAudioData(await response.arrayBuffer());result.push({file:folder+'/'+file,duration:b.duration,expected:duration})
    }
   }await ctx.close();return result
  },appBase)
  assert.ok(decoded.every(x=>Math.abs(x.duration-x.expected)<.01));console.log('PASS',width,'all 3 existing source excerpts and registered arrangement native decode durations',JSON.stringify(decoded))

  for(const actor of ['a','b']){
   activeActor=actor
   await page.goto(new URL('?scene=music-'+actor,appBase).href)
   await page.waitForFunction(()=>window.__IEUM_V2__?.state.activeProject?.audioSource);await page.waitForSelector('.workspace-v2-screen')
   const initial=await page.evaluate(()=>({id:window.__IEUM_V2__.state.activeProject.id,tracks:Object.keys(window.__IEUM_V2__.state.activeTracks),key:window.__IEUM_V2__.state.activeProject.key}))
   assert.equal(initial.id,'demo:'+WARM_PROJECT_ID);assert.equal(initial.tracks.length,actor==='a'?0:1);assert.equal(initial.key,'원키')
   await page.locator('[data-action="record-part"]').click()
   await page.waitForSelector('[data-action="record-start"]:enabled')
   assert.equal(await page.locator('.lyric-source-note').count(),0)
   assert.ok((await page.locator('[data-recording-entry]').textContent()).includes('3.0초'))
   assert.equal(await page.locator('.lyrics .active').textContent(),'')
   const ref=page.locator('.project-reference')
   await ref.getByRole('button',{name:'재생',exact:true}).click()
   await page.waitForFunction(()=>document.querySelector('.project-reference audio')?.currentTime>.15)
   await page.locator('[data-action="record-start"]').click()
   await page.waitForSelector('[data-action="record-pause"]')
   assert.equal(await page.locator('.project-reference audio').count(),0,'Reference listening ends before microphone capture')
   await page.waitForFunction(()=>document.querySelector('.lyrics .active')?.textContent==='오늘도 함께해요');console.log('CHECK',width,actor,'first lyric at 3s')
   await page.waitForFunction(()=>document.querySelector('[data-recording-entry]')?.textContent.includes('00:03'))
   const atFirst=await page.locator('[data-recording-entry]').textContent();assert.ok(atFirst.includes('00:03'))
   await page.locator('[data-action="record-pause"]').click()
   const paused=await page.locator('[data-recording-entry]').textContent()
   await page.waitForTimeout(450)
   assert.equal(await page.locator('[data-recording-entry]').textContent(),paused)
   await page.locator('[data-action="record-resume"]').click()
   assert.equal(await page.getByRole('checkbox',{name:'Guide 반주',exact:true}).count(),0,'Project backing is always provided')
   if(actor==='b'){
    await page.getByRole('slider',{name:'가이드 보컬 볼륨',exact:true}).fill('25')
   }
   await page.waitForFunction(()=>document.querySelector('.lyrics .active')?.textContent==='우리 함께 걸어요',{},{timeout:15000})
   const scheduled=await page.evaluate(()=>window.qaStarts.filter(s=>s.timeline&&s.duration>21.9&&s.at-s.now<.01&&s.timeline.elapsed>0))
   assert.ok(scheduled.length>=1,'Resume reschedules the always-on backing; removed toggle no longer adds a second restart')
   for(const s of scheduled){const musical=s.timeline.elapsed+(s.timeline.state==='recording'?s.now-s.timeline.started:0)-s.timeline.sync;assert.ok(Math.abs(s.offset-musical)<.075,'Resume/toggle follows the same musical time without repeated lead-in')}
   await page.waitForFunction(()=>{
    if(document.querySelector('.lyrics .active')?.textContent!=='작은 노래 모아서')return false
    window.qaLastLyric={wallMs:performance.now(),audioSec:window.__IEUM_V2__.audioRuntime.context.currentTime}
    return true
   },{},{timeout:10000});console.log('CHECK',width,actor,'all 3 lyric cues')
   await page.waitForSelector('[data-action="record-submit"]',{timeout:12000})
   await page.waitForSelector('.record-review audio',{state:'attached'})
   assert.ok((await page.locator('.record-review').textContent()).includes('내 녹음과 반주'))
   await page.locator('.record-review .play-btn').click()
   await page.waitForFunction(()=>document.querySelector('.record-review audio')?.currentTime>.15)
   const draft=await page.evaluate(async()=>{
    const rt=window.__IEUM_V2__.audioRuntime
    const hash=async blob=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('')
    return {hash:await hash(rt.recordingBlob),offset:rt.syncOffsetSec,bytes:rt.recordingBlob.size,timeline:rt.activeElapsedSec,encoded:rt.decoded?.duration}
   })
   await page.screenshot({path:`${out}/review-${width}-${actor}.png`})
   await page.locator('[data-action="record-submit"]').click()
   await page.waitForFunction(n=>Object.keys(window.__IEUM_V2__.state.activeTracks).length===n,actor==='a'?1:2)
   console.log('CAPTURE',width,actor,JSON.stringify(draft))
   const track=await page.evaluate(async actor=>{
    const t=window.__IEUM_V2__.state.activeTracks['voice-'+actor]
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await t.blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('')
    return {hash,origin:t.origin,ref:t.audioSourceRef,sync:t.syncOffsetMs,participantId:t.participantId,duration:t.duration}
   },actor)
   assert.equal(track.hash,draft.hash);assert.equal(track.origin,'live-microphone-recording');assert.equal(track.ref.backingSha256,WARM_ARRANGEMENT.backingSha256)
   assert.equal(track.sync,Math.round(draft.offset*1000));assert.ok(track.sync>=0&&track.sync<100)
   assert.equal(track.participantId,actor==='a'?'jisun':'demo-music-b')
   console.log('TRACK DURATION',width,actor,track.duration);assert.ok(track.duration>21.9&&track.duration<22.6,JSON.stringify(track))
   if(actor==='a'){assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeMix||null),null)}
   console.log('PASS',width,actor,'actual 22s backing, timed lyrics, pause/resume/toggle, Review, microphone-only original, submitted source binding',JSON.stringify(track))
  }
  await page.waitForFunction(()=>window.__IEUM_V2__?.state.screen==='complete'&&window.__IEUM_V2__.state.activeMix?.blob,{},{timeout:30000})
  const mix=await page.evaluate(async()=>{
   const s=window.__IEUM_V2__.state,m=s.activeMix,ctx=new AudioContext(),buffer=await ctx.decodeAudioData(await m.blob.arrayBuffer()),a=buffer.getChannelData(0)
   let sum=0,peak=0;for(const v of a){sum+=v*v;peak=Math.max(peak,Math.abs(v))}await ctx.close()
   return {duration:buffer.duration,rms:Math.sqrt(sum/a.length),peak,bytes:m.blob.size,ref:m.audioSourceRef,inputs:m.inputManifest}
  })
  assert.ok(Math.abs(mix.duration-22)<.01);assert.ok(mix.rms>.001);assert.ok(mix.peak<=10**(-3/20)+1e-5)
  await page.locator('.complete-screen .play-btn').click()
  await page.waitForFunction(()=>document.querySelector('.complete-screen audio')?.currentTime>.2)
  await page.screenshot({path:`${out}/complete-${width}.png`})
  await page.reload();await page.waitForFunction(()=>!!window.__IEUM_V2__?.state.activeMix?.blob)
  assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks).length),2)
  assert.equal(await page.evaluate(()=>localStorage.getItem('qa:original-user-sentinel')),'preserve')
  assert.equal(await page.evaluate(()=>document.body.scrollWidth<=innerWidth),true)
  await page.evaluate(()=>{const state={...history.state,ieumScreen:'workspace'};history.pushState(state,'','#workspace');dispatchEvent(new PopStateEvent('popstate',{state}))})
  await page.waitForSelector('.workspace-v2-screen')
  const toggles=page.locator('.v2-part-actions input[type=checkbox]')
  assert.equal(await toggles.count(),2)
  assert.equal(await page.locator('.v2-part-actions .v2-metal-play').count(),0)
  await page.locator('[data-action="turntable-play"]:enabled').click()
  await page.waitForFunction(()=>document.querySelector('#current-mix audio')?.currentTime>.1)
  const previousSource=await page.locator('#current-mix audio').getAttribute('src')
  await toggles.first().uncheck()
  await page.waitForFunction(src=>{const a=document.querySelector('#current-mix audio');return a&&a.src!==src&&a.paused},previousSource)
  assert.match(await page.locator('.current-mix-head').innerText(),/1개 선택/)
  await toggles.nth(1).uncheck()
  await page.waitForFunction(()=>document.querySelector('[data-action="turntable-play"]')?.disabled)
  await toggles.first().check()
  await page.locator('[data-action="turntable-play"]:enabled').waitFor()
  assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks).length),2)
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeMix.blob.size),mix.bytes,'Listening selection preserves the completed Mix')
  assert.equal(await page.evaluate(()=>window.qaNavigation.filter(event=>event.event==='forward').length),0,'Committed submission must not bounce forward into Recorder')
  console.log('PASS',width,'selected Track rebuilds native Current Mix, stops old playback, zero selection disables play; originals/final Mix preserved')
  assert.deepEqual(errors,[])
  await writeFile(`${out}/result-${width}.json`,JSON.stringify(mix,null,2))
  console.log('PASS',width,'last Track -> native Auto Mix -> 22s Complete playback, peak ceiling, reload and original-user preservation',JSON.stringify({...mix,inputs:undefined}))
  await context.close()
 }
}catch(error){
 const diagnostic={width:activeWidth,actor:activeActor,error:String(error),fakeAudio:process.env.IEUM_QA_FAKE_AUDIO_FILE?'file':'default'}
 try{
  diagnostic.runtime=await activePage.evaluate(()=>{
   const rt=window.__IEUM_V2__?.audioRuntime
   const button=document.querySelector('[data-action="record-submit"]')
   const ancestors=[]
   for(let node=button;node&&ancestors.length<6;node=node.parentElement){const style=getComputedStyle(node);ancestors.push({tag:node.tagName,className:node.className,rect:node.getBoundingClientRect().toJSON(),display:style.display,visibility:style.visibility,overflow:style.overflow})}
   return {wallMs:performance.now(),audioSec:rt?.context?.currentTime,lastLyric:window.qaLastLyric,screen:window.__IEUM_V2__?.state.screen,status:document.querySelector('[data-recording-status]')?.dataset.recordingStatus,clock:document.querySelector('[data-recording-entry]')?.textContent,errors:[...document.querySelectorAll('.permission-error')].map(n=>n.textContent),recorder:rt?.recorder?.state,elapsed:rt?.activeElapsedSec,sync:rt?.syncOffsetSec,decoded:rt?.decoded?.duration,bytes:rt?.recordingBlob?.size,streamActive:rt?.stream?.active,submit:{present:Boolean(button),disabled:button?.disabled,ancestors},navigation:window.qaNavigation,clockSamples:window.qaClockSamples,events:window.qaRecorderEvents,reviewTransitions:window.qaReviewTransitions,longTasks:window.qaLongTasks,decodes:window.qaDecodes,offlineRenders:window.qaOfflineRenders,projectState:{projectId:window.__IEUM_V2__?.state.activeProject?.id,tracks:Object.keys(window.__IEUM_V2__?.state.activeTracks||{}),mixStatus:window.__IEUM_V2__?.state.activeMixStatus,mixBytes:window.__IEUM_V2__?.state.activeMix?.blob?.size}}
  })
 }catch(reason){diagnostic.inspectError=String(reason)}
 await writeFile(`${out}/failure-${activeWidth||'startup'}.json`,JSON.stringify(diagnostic,null,2))
 console.error('FAILURE DIAGNOSTIC',JSON.stringify(diagnostic))
 throw error
}finally{await browser?.close();server?.kill()}
