import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {createHash} from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import {buildVoiceLayer} from '../src/voiceAnalysis.js'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const targetUrl=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4191/');targetUrl.searchParams.set('design','figma');const url=targetUrl.href
// Synthetic WAV and isolated browser storage. No physical microphone or server claim.
const rate=16000,samples=rate*2,wav=Buffer.alloc(44+samples*2)
wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40)
for(let i=0;i<samples;i++)wav.writeInt16LE(Math.round(Math.sin(i/rate*Math.PI*440)*1800),44+i*2)
const features={version:'ieum-basic-voice-v3',fingerprint:'qa-screen-continuity',brightness:.5,low:.33,dynamicRange:.4,spectralFlux:.2,roughness:.3,energy:.5,activeRatio:.8,articulation:.2,pitchVariation:.1,envelope:[.2,.7,.4],durationSec:2}
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
const results=[]
try{
 for(const count of [2,3,4]){
  const context=await browser.newContext({viewport:{width:430,height:932}}),page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await page.goto(url);await page.waitForFunction(()=>!!window.__IEUM_V2__?.state)
  const id=`qa-screen-${count}`,seed=`qa-screen-seed-${count}`
  const parts=Array.from({length:count},(_,i)=>({id:`free-${i}`,name:`Voice ${i+1}`,color:'#3b82f6',participantId:i?'luna':'jisun',participant:i?'LUNA':'JISUN',status:i?'submitted':'ready'}))
  const featuresByPart=parts.map((_,index)=>index===1?{...features,version:'ieum-basic-voice-v4',pitchAnalysisVersion:'normalized-difference-v1',fingerprint:'qa-screen-continuity-v4'}:index===2?{...features,version:'ieum-basic-voice-v5',pitchAnalysisVersion:'normalized-difference-v1',pitchFrameLength:4096,fingerprint:'qa-screen-continuity-v5'}:features)
  const layers=parts.map((part,index)=>buildVoiceLayer(seed,part.id,featuresByPart[index]))
  await page.evaluate(async({id,seed,parts,layers,featuresByPart,audio})=>{
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ieum-v2-records',1);r.onupgradeneeded=()=>r.result.createObjectStore('tracks',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
   const blob=new Blob([Uint8Array.from(atob(audio),c=>c.charCodeAt(0))],{type:'audio/wav'})
   await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');for(const [i,part] of parts.entries())tx.objectStore('tracks').put({id:i?id+':'+part.id:`jisun:${id}:${part.id}:temporary-recording`,projectId:id,projectSeed:seed,partId:part.id,partIndex:i,participantId:part.participantId,participant:part.participant,userId:'jisun',kind:i?undefined:'temporary-recording',blob,duration:2,features:featuresByPart[i],layer:layers[i],origin:'qa-synthetic-wav',createdAt:new Date().toISOString(),guides:{backing:false,parts:[]}});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()
   localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,createdProjects:[{id,seed,songId:'a-thousand-years',title:'QA Project',lyrics:[{time:0,text:'QA previous'},{time:1,text:'QA current'},{time:3,text:'QA next'},{time:4,text:'QA outside window'}],name:'QA Group',key:'E minor',keyLocked:true,partCount:parts.length,totalParts:parts.length,parts,ownerPartId:parts[0].id,status:'RECORDING',createdAt:new Date().toISOString()}],activeCreatedProjectId:id}))
  },{id,seed,parts,layers,featuresByPart,audio:wav.toString('base64')})
  await page.goto(url);await page.waitForFunction(id=>window.__IEUM_V2__?.state?.activeProject?.id===id,id)
  await page.waitForSelector('[data-action="record-part"]')
  await page.locator('[data-action="record-part"]').click();await page.waitForSelector('[data-action="record-submit"]')
  await page.waitForFunction(()=>window.__IEUM_V2__.state.activeTracks?.['free-1'])
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeTracks['free-1'].features.version),'ieum-basic-voice-v4')
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeTracks['free-1'].layer.signature),layers[1].signature,'Stored v4 Layer must retain its exact lineage')
  if(count>=3)assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeTracks['free-2'].layer.signature),layers[2].signature,'Stored v5 Layer must not be reanalyzed')
  assert.equal(await page.locator('.bottom-nav').count(),0)
  assert.deepEqual(await page.locator('.lyrics>span').allTextContents(),['QA previous','QA current','QA next'])
  assert.equal(await page.locator('.lyrics>span.active').textContent(),'QA current')
  assert.equal(await page.locator('.lyrics>span.active').evaluate(row=>Array.from(row.parentElement.children).indexOf(row)),1)

  await page.evaluate(()=>{
   const originalPut=IDBObjectStore.prototype.put
   window.qaFailTrackWrite=true;window.qaTrackWriteCount=0
   IDBObjectStore.prototype.put=function(value,...args){
    if(value.projectId?.startsWith('qa-screen-')&&value.kind!=='temporary-recording'&&value.partId==='free-0'){window.qaTrackWriteCount++;if(window.qaFailTrackWrite)throw new Error('QA storage failure')}
    return originalPut.call(this,value,...args)
   }
  })
  await page.evaluate(()=>{const button=document.querySelector('[data-action="record-submit"]');button.click();button.click()})
  await page.waitForFunction(()=>document.querySelector('[role="alert"]')?.textContent.includes('QA storage failure'))
  assert.equal(await page.evaluate(()=>window.qaTrackWriteCount),1,'Concurrent submit clicks must attempt one Track write')
  assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'review')
  assert.equal(await page.locator('.recording-screen .permission-error button').count(),0,'Storage failure must not offer microphone restart')
  assert.equal(await page.locator('.recording-screen .permission-error ol').count(),0,'Storage failure must not show permission instructions')
  await page.screenshot({path:path.join(os.tmpdir(),`ieum-record-errors-${count}.png`),fullPage:true})
  assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks||{}).length),count-1)
  const preservedHash=await page.evaluate(async draftId=>{
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
   const draft=await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readonly'),r=tx.objectStore('tracks').get(draftId);tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error)})
   db.close()
   return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await draft.blob.arrayBuffer()))].map(b=>b.toString(16).padStart(2,'0')).join('')
  },`jisun:${id}:${parts[0].id}:temporary-recording`)
  assert.equal(preservedHash,createHash('sha256').update(wav).digest('hex'),'Failed submit must preserve original audio bytes')
  assert.equal(await page.locator('[data-action="record-submit"]').isEnabled(),true)
  await page.evaluate(()=>{window.qaFailTrackWrite=false})
  await page.evaluate(()=>{const button=document.querySelector('[data-action="record-submit"]');button.click();button.click()})
  await page.waitForSelector('.complete-screen',{timeout:45000})
  const state=await page.evaluate(()=>({id:window.__IEUM_V2__.state.activeProject.id,key:window.__IEUM_V2__.state.activeProject.key,tracks:Object.keys(window.__IEUM_V2__.state.activeTracks||{}).length}))
  assert.equal(state.id,id);assert.equal(state.key,'E minor');assert.equal(state.tracks,count)
  assert.equal(await page.locator('.record-center-credits button').count(),count)
  assert.equal(await page.locator('.record-particles[data-renderer="webgl-particles"]').count(),1)
  const audio=page.locator('.complete-screen audio');await audio.evaluate(el=>new Promise((resolve,reject)=>{if(el.readyState>=1)return resolve();el.addEventListener('loadedmetadata',resolve,{once:true});el.addEventListener('error',reject,{once:true})}))
  assert.ok(await audio.evaluate(el=>el.duration>0&&Number.isFinite(el.duration)))
  const seek=page.getByRole('slider',{name:'재생 위치'})
  await seek.focus();await seek.press('Home');await seek.press('ArrowRight')
  assert.ok(await audio.evaluate(el=>el.currentTime>0&&el.currentTime<=el.duration),'Keyboard seek must update actual audio time')

  for(const width of [360,390,430]){await page.setViewportSize({width,height:932});assert.equal(await page.evaluate(()=>document.body.scrollWidth),width)}
  await page.locator('.record-center-credits button').nth(1).click();await page.waitForSelector('.other-vocal-screen')
  await page.locator('[data-action="back"]').click();await page.waitForSelector('.complete-screen')
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeProject.id),id)
  assert.equal(await page.evaluate(()=>window.qaTrackWriteCount),2,'Failed double click plus successful double click must total two writes')
  await page.reload();await page.waitForSelector('[data-action="open-complete"]');await page.locator('[data-action="open-complete"]').click();await page.waitForSelector('.complete-screen')
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeTracks['free-1'].layer.signature),layers[1].signature,'v4 Layer must survive submission/Mix/reload beside legacy v3 Layers')
  if(count>=3)assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeTracks['free-2'].layer.signature),layers[2].signature,'v5 Layer must survive submission/Mix/reload beside v3/v4 Layers')
  assert.equal(await page.locator('.record-center-credits button').count(),count)
  assert.deepEqual(errors,[])
  results.push({count,duplicateSubmitBlocked:true,projectPreserved:true,reviewSubmit:true,failurePreservesSource:true,permissionUISeparated:true,actualSyntheticMix:true,creditsProfileReturn:true,reload:true,widths:[360,390,430],errors});await context.close()
 }
 console.log(JSON.stringify({passed:true,results,limitations:'Isolated synthetic audio; no physical microphone, listening, shared server or visual equivalence acceptance.'},null,2))
}finally{await browser.close()}
