import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
const require = createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium} = require('playwright')
const url = new URL(process.env.IEUM_QA_URL || 'http://127.0.0.1:4196/')
url.searchParams.set('design','figma')
const rate=16000,samples=rate,wav=Buffer.alloc(44+samples*2)
wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40)
for(let index=0;index<samples;index++)wav.writeInt16LE(Math.round(Math.sin(index/rate*Math.PI*440)*1500),44+index*2)
const sample=JSON.parse(await readFile(new URL('../src/providedSamples.json',import.meta.url),'utf8')).find(s=>s.duration===19)
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']})
try {
  for(const mode of [2,3,4]) {
    const count=mode==='main'?4:mode
    const context=await browser.newContext(),page=await context.newPage(),errors=[]
    page.on('pageerror',error=>errors.push(error.message))
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
    await page.goto(url.href);await page.waitForFunction(()=>window.__IEUM_V2__?.state)
    const id=mode==='main'?'ieum-thousand-years-v7':`qa-graphics-independent-${count}`,seed=mode==='main'?'ieum:thousand-years:original-c:0048':`qa-preserved-seed-${count}`
    await page.evaluate(async({count,id,seed,audio,mode,sample})=>{
      const bytes=Uint8Array.from(atob(audio),character=>character.charCodeAt(0))
      const blob=new Blob([bytes],{type:'audio/wav'})
      const parts=Array.from({length:count},(_,index)=>({id:mode==='main'?['soprano','alto','tenor','bass'][index]:`free-${index}`,name:`Voice ${index}`,participantId:index?'other-'+index:'jisun',participant:index?'Other '+index:'JISUN',range:'C3–G4',status:'submitted'}))
      const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('ieum-v2-records',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})
      await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');parts.forEach((part,index)=>tx.objectStore('tracks').put({id:`${id}:${part.id}`,projectId:id,projectSeed:seed,partId:part.id,partIndex:index,participantId:part.participantId,participant:part.participant,blob,audioSourceRef:{songId:'a-thousand-years',key:'QA original key',revision:'isolated-binding-test-v1',duration:19,sourceSha256:sample.provenance.sourceSha256,backingSha256:sample.provenance.backingSha256},duration:1,origin:mode==='main'?'live-microphone-recording':'qa-isolated-audio',features:{version:'ieum-basic-voice-v3'},layer:null}));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})
      db.close()
      localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,createdProjects:mode==='main'?[]:[{id,seed,songId:'a-thousand-years',title:'QA',name:'QA',key:'QA original key',recordingDuration:sample.duration,audioSource:{kind:'project-arrangement',songId:'a-thousand-years',key:'QA original key',revision:'isolated-binding-test-v1',duration:19,sourceSha256:sample.provenance.sourceSha256,backingFile:sample.backingFile,backingSha256:sample.provenance.backingSha256},partCount:count,totalParts:count,parts,ownerPartId:parts[0].id,status:'RECORDING'}],activeCreatedProjectId:mode==='main'?null:id}))
    },{count,id,seed,mode,audio:wav.toString('base64'),sample})
    await page.reload()
    await page.waitForFunction(id=>window.__IEUM_V2__?.state.activeProject.id===id && (window.__IEUM_V2__.state.createdMixes[id]?.blob || window.__IEUM_V2__.state.mix?.blob),id,{timeout:30000}).catch(async error=>{console.log(JSON.stringify({errors,state:await page.evaluate(()=>{const s=window.__IEUM_V2__?.state;return s?{id:s.activeProject?.id,tracks:Object.keys(s.activeTracks||{}),mixStatus:s.activeMixStatus,projects:s.createdProjects}:null})}));throw error})
    const result=await page.evaluate(async id=>{
      const state=window.__IEUM_V2__.state
      const output=state.createdMixes[id]||state.mix,ctx=new AudioContext(),decoded=await ctx.decodeAudioData(await output.blob.arrayBuffer())
      const tail=decoded.getChannelData(0).slice(Math.floor(18.2*decoded.sampleRate),Math.floor(18.7*decoded.sampleRate));let square=0;for(const v of tail)square+=v*v;await ctx.close()
      return {duration:output.duration,tailRms:Math.sqrt(square/tail.length),seed:state.activeProject.seed,tracks:Object.keys(state.activeTracks).length,layers:Object.values(state.activeTracks).filter(track=>track.layer).length,mixBytes:(state.createdMixes[id]||state.mix).blob.size,mixStatus:state.activeMixStatus}
    },id)
    assert.ok(Math.abs(result.duration-19)<.02);assert.ok(result.tailRms>1e-5);assert.equal(result.seed,seed);assert.equal(result.tracks,count);assert.equal(result.layers,0);assert.ok(result.mixBytes>44);assert.equal(result.mixStatus,'complete')
    await page.reload()
    if(mode!=='main'){
      await page.locator('[data-nav="folder"]').click()
      await page.locator('[data-action="open-created-project"]').click()
    }
    await page.waitForFunction(id=>window.__IEUM_V2__?.state.createdMixes[id]?.blob || window.__IEUM_V2__?.state.mix?.blob,id)
    assert.deepEqual(errors,[])
    console.log(JSON.stringify(result));console.log(`PASS ${mode} Project / ${count} submitted audio Tracks with zero graphics: native Auto Mix succeeds, saved output/seed/Tracks reload`)
    await context.close()
  }
  for(const failure of ['http','hash','key','snapshot','none']) {
    const context=await browser.newContext({permissions:['microphone']}),page=await context.newPage()
    await context.addInitScript(()=>{window.qaMicRequests=0;window.qaBackingDuration=null;const mic=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=(...args)=>{window.qaMicRequests++;return mic(...args)};const make=AudioContext.prototype.createBufferSource;AudioContext.prototype.createBufferSource=function(){const value=make.call(this),start=value.start.bind(value);value.start=(...args)=>{window.qaBackingDuration=value.buffer?.duration;return start(...args)};return value}})
    await page.goto(url.href);await page.waitForFunction(()=>window.__IEUM_V2__?.state)
    await page.evaluate(({sample,failure})=>{
      const id='qa-backing-record',parts=[{id:'lead',name:'Lead',participantId:'jisun',participant:'JISUN',status:'ready'},{id:'second',name:'Second',status:'open'}]
      localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({createdProjects:[{id,seed:'qa-original-seed',songId:'a-thousand-years',name:'QA binding only',lyrics:[{time:3.5,text:'QA first measured lyric'}],key:'QA original key',parts,partCount:2,ownerPartId:'lead',audioSource:{kind:'project-arrangement',songId:'a-thousand-years',key:failure==='key'?'wrong-key':'QA original key',revision:'qa-v1',duration:19,sourceSha256:sample.provenance.sourceSha256,backingFile:sample.backingFile,backingSha256:sample.provenance.backingSha256}}],activeCreatedProjectId:id}))
    },{sample,failure})
    if(failure==='http'||failure==='hash')await page.route('**'+sample.backingFile,route=>route.fulfill({status:failure==='http'?503:200,body:'Isolated invalid audio response'}))
    if(failure==='snapshot')await page.evaluate(async audio=>{
      const blob=new Blob([Uint8Array.from(atob(audio),c=>c.charCodeAt(0))],{type:'audio/wav'})
      const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)})
      await new Promise(resolve=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').put({id:'jisun:qa-backing-record:lead:temporary-recording',projectId:'qa-backing-record',partId:'lead',userId:'jisun',kind:'temporary-recording',blob,duration:1,audioSourceRef:{revision:'older'}});tx.oncomplete=resolve});db.close()
    },wav.toString('base64'))
    await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state)
    await page.locator('[data-nav="folder"]').click();await page.locator('[data-action="open-created-project"]').click()
    await page.locator('[data-action="record-part"]').click()
    if(failure==='snapshot') {
      await page.waitForSelector('[data-action="record-submit"]');await page.locator('[data-action="record-submit"]').click();await page.waitForSelector('.permission-error')
      assert.equal(await page.evaluate(()=>window.qaMicRequests),0)
      assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'review')
      assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks).length),0)
      const preserved=await page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)});const item=await new Promise(resolve=>{const r=db.transaction('tracks').objectStore('tracks').get('jisun:qa-backing-record:lead:temporary-recording');r.onsuccess=()=>resolve(r.result)});db.close();return item?.blob?.size})
      assert.equal(preserved,wav.length);await context.close();console.log('PASS changed audio snapshot refuses submission and preserves original Draft');continue
    }
    assert.equal(await page.locator('.lyrics .active').textContent(),'','Intro must not claim the first lyric is currently sung')
    assert.ok((await page.locator('.lyrics').textContent()).includes('QA first measured lyric'),'First lyric remains visible as the upcoming line')
    assert.ok((await page.locator('[data-recording-entry]').textContent()).includes('첫 가사 · 시작 후 3.5초'))
    await page.locator('[data-action="record-start"]').click()
    if(failure==='none') {
      await page.waitForFunction(()=>window.qaBackingDuration!==null)
      assert.equal(await page.evaluate(()=>window.qaMicRequests),1)
      assert.ok(Math.abs(await page.evaluate(()=>window.qaBackingDuration)-19)<.03)
      await page.waitForFunction(()=>document.querySelector('[data-recording-entry]')?.textContent.includes('첫 가사까지'))
      await page.locator('[data-action="record-pause"]').click()
      const pausedEntry=await page.locator('[data-recording-entry]').textContent()
      assert.ok(pausedEntry.includes('일시정지'))
      await page.waitForTimeout(600)
      assert.equal(await page.locator('[data-recording-entry]').textContent(),pausedEntry,'Entry countdown must freeze with the Take timeline')
      await page.locator('[data-action="record-resume"]').click()
      await page.waitForFunction(()=>document.querySelector('[data-recording-entry]')?.textContent.includes('지금 첫 가사를 부르세요'))
      await page.waitForFunction(()=>document.querySelector('.lyrics .active')?.textContent==='QA first measured lyric')
      await page.locator('[data-action="record-stop"]').click();await page.waitForSelector('[data-action="record-submit"]')
      await page.locator('[data-action="record-submit"]').click();await page.waitForSelector('.workspace-screen')
      const reference=await page.evaluate(()=>window.__IEUM_V2__.state.activeTracks.lead.audioSourceRef)
      assert.equal(reference.revision,'qa-v1');assert.equal(reference.backingSha256,sample.provenance.backingSha256)
      await page.waitForFunction(()=>document.querySelector('#current-mix audio')?.duration>18)
      assert.ok(Math.abs(await page.locator('#current-mix audio').evaluate(audio=>audio.duration)-19)<.03,'Current Mix includes the whole actual backing; individual source Track remains separate')

    } else {
      await page.waitForSelector('.permission-error [role="alert"],.permission-error')
      assert.equal(await page.evaluate(()=>window.qaMicRequests),0,'Invalid backing must not request microphone')
      assert.equal(await page.locator('.permission-error ol').count(),0,'Audio failure is not a microphone permission instruction')
      assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'ready')
      assert.equal(await page.locator('[data-action="record-submit"]').count(),0)
    }
    console.log('PASS Project recording backing '+failure+' / isolated microphone and actual AI backing')
    await context.close()
  }
} finally {await browser.close()}
console.log('Isolated synthetic audio and native browser mix; actual registered 19-second AI backing plus synthetic Tracks; isolated Project binding, not published song/Part arrangement or physical listening acceptance')
