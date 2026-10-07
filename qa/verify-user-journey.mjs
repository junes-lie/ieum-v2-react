import assert from 'node:assert/strict'
import {readFile,writeFile,unlink} from 'node:fs/promises'
import {Window} from 'happy-dom'
import {indexedDB,IDBObjectStore} from 'fake-indexeddb'
import {transformWithOxc} from 'vite'
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {saveTrack,loadTrack,clearProjectTracks} from '../src/trackStore.js'
import {buildVoiceLayer} from '../src/voiceAnalysis.js'

// Isolated Node DOM and in-memory IndexedDB only. Never opens a browser or the user's DB.
// GPU renderers and current-mix preview are test-only stubs; microphone is never invoked.
// Media playback and microphone hardware are deliberately outside this test.
const window=new Window({url:'http://localhost/?design=figma'})
for(const key of ['window','document','navigator','location','localStorage','sessionStorage','HTMLElement','Event','PopStateEvent','Image','ResizeObserver'])Object.defineProperty(globalThis,key,{value:key==='window'?window:window[key],configurable:true,writable:true})
globalThis.indexedDB=indexedDB
globalThis.IS_REACT_ACT_ENVIRONMENT=true
globalThis.requestAnimationFrame=callback=>setTimeout(()=>callback(performance.now()),0)
globalThis.cancelAnimationFrame=clearTimeout
window.scrollTo=()=>{}
window.AudioContext=class{}
window.HTMLMediaElement.prototype.play=async()=>{}
window.HTMLMediaElement.prototype.pause=()=>{}
globalThis.fetch=async url=>{assert.equal(url,'/demo-stems/manifest.json','Existing submitted Tracks must prevent loading replacement demo audio');return {ok:true,json:async()=>({tracks:[{partId:'soprano',file:'/demo-stems/soprano.wav'},{partId:'alto',file:'/demo-stems/alto.wav'}]})}}
const appTemp=new URL('../src/.qa-user-journey-app.mjs',import.meta.url)
const iconsTemp=new URL('../src/.qa-user-journey-icons.mjs',import.meta.url)
const projectId='ieum-thousand-years-v7',seed='ieum:thousand-years:original-c:0048',profileId='ieum-v2:voice-profile:v7'
const blob=new Blob(['isolated synthetic recording bytes'],{type:'audio/wav'})
const features={version:'ieum-basic-voice-v3',fingerprint:'qa-preserved',brightness:.5,low:.33,dynamicRange:.4,spectralFlux:.2,roughness:.3,energy:.5,activeRatio:.8,articulation:.2,pitchVariation:.1,envelope:[.2,.7,.4]}
const track=partId=>({id:projectId+':'+partId,projectId,projectSeed:seed,partId,participantId:partId==='tenor'?'jisun':partId,participant:partId,blob,features,layer:buildVoiceLayer(seed,partId,features),duration:7,origin:'live-microphone-recording'})
const draftId='jisun:'+projectId+':tenor:temporary-recording'
let root
const settle=async()=>{await act(async()=>{await new Promise(resolve=>setTimeout(resolve,35))})}
const click=async selector=>{const element=document.querySelector(selector);assert.ok(element,'Missing action '+selector);await act(async()=>element.click());await settle()}
const state=()=>window.__IEUM_V2__.state
const check=(name)=>console.log('PASS '+name)
const errors=[]
globalThis.__qaRecordCalls=[]
const originalError=console.error
console.error=(...args)=>{errors.push(args.map(String).join(' '));originalError(...args)}
try{
 const source=(await readFile(new URL('../src/App.jsx',import.meta.url),'utf8')).replace(/import \{ createRecordingInflowRenderer, createResonanceRenderer \} from ['"]\.\/resonanceWebGL\.js['"]/,'const createRecordingInflowRenderer=()=>()=>{}; const createResonanceRenderer=()=>({dispose(){}})').replace('  createPreviewMix,','  createPreviewMix as realCreatePreviewMix,')+'\nconst createPreviewMix=async()=>({blob:new Blob([\"QA preview\"]),url:URL.createObjectURL(new Blob([\"QA preview\"])),duration:7});'
 const icons=await readFile(new URL('../src/Icons.jsx',import.meta.url),'utf8')
 await writeFile(iconsTemp,(await transformWithOxc(icons,'Icons.jsx',{jsx:{runtime:'classic'}})).code)
 const code=(await transformWithOxc(source,'App.jsx',{jsx:{runtime:'classic'}})).code.replace('./Icons.jsx','./.qa-user-journey-icons.mjs').replace("import { createRecordingInflowRenderer, createResonanceRenderer } from './resonanceWebGL.js'",'const createRecordingInflowRenderer=()=>()=>{}; const createResonanceRenderer=()=>({dispose(){}})')
 await writeFile(appTemp,code.replace(/createResonanceRenderer\s*=\s*\(\)\s*=>\s*\(\{\s*dispose\(\)\s*\{\s*\}\s*\}\)/g, 'createResonanceRenderer=options=>{globalThis.__qaRecordCalls.push(options);return {dispose(){}}}')+'\nexport {ResonanceRecord};')
 const {default:App,ResonanceRecord}=await import(appTemp.href)
 localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor',invited:true,invitedVocalId:'luna',projectLikes:[{projectId}],songSaves:[{songId:'a-thousand-years'}],vocalSaves:[{vocalId:'luna'}]}))
 await saveTrack(track('soprano'));await saveTrack(track('alto'))
 await saveTrack({id:profileId+':range',projectId:profileId,kind:'voice-range',range:'C3–G4',rangeData:{lowMidi:48,highMidi:67}})
 await saveTrack({id:profileId+':sample',projectId:profileId,kind:'voice-sample',blob,duration:7,songLabel:'QA personal sample',features})
 await saveTrack({id:draftId,projectId,partId:'tenor',kind:'temporary-recording',userId:'jisun',blob,features,duration:7,guides:{backing:false,parts:[false,false,false,false]}})
 const container=document.createElement('div');document.body.append(container);root=createRoot(container)
 await act(async()=>root.render(React.createElement(App)));await settle();await settle()
 assert.equal(state().screen,'workspace');assert.equal(Object.keys(state().projectTracks).length,2);assert.equal(state().candidateAccepted,false)
 assert.equal(state().projectTracks.soprano.layer.signature,track('soprano').layer.signature)
 assert.equal(await state().projectTracks.soprano.blob.text(),await blob.text())
 assert.equal((await loadTrack(projectId+':soprano')).origin,'live-microphone-recording')
 assert.equal(await (await loadTrack(projectId+':soprano')).blob.text(),await blob.text())
 check('App bootstrap restores submitted Blob, project seed and exact deterministic Layer; pending invitation does not create a Track')
 assert.equal(state().profile.sampleSong,'QA personal sample');assert.equal(state().profile.rangeData.lowMidi,48);assert.equal(state().songSaves.length,1)
 check('Profile range, personal sample and collection restore from isolated persistence')
 await click('[data-action="record-part"]');assert.equal(state().screen,'record');assert.ok(document.querySelector('[data-action="record-submit"]'));assert.ok(!document.querySelector('[data-action="record-start"]'))
 assert.equal(await (await loadTrack(draftId)).blob.text(),await blob.text())
 check('Recorder restores saved draft into Review without microphone access or replacement')
 const originalPut=IDBObjectStore.prototype.put
 try {
  IDBObjectStore.prototype.put=function(value,...args){
   if(value.id===projectId+':tenor')throw new Error('QA submit storage failure')
   return originalPut.call(this,value,...args)
  }
  await click('[data-action="record-submit"]')
  assert.equal(state().screen,'record')
  assert.equal(Object.keys(state().projectTracks).length,2)
  assert.equal(await loadTrack(projectId+':tenor'),null)
  assert.equal(await (await loadTrack(draftId)).blob.text(),await blob.text())
  assert.ok(document.body.textContent.includes('QA submit storage failure'))
  assert.equal(Boolean(document.querySelector('.recording-screen .permission-error button')),false,'Review storage errors must not offer microphone restart')
  assert.equal(Boolean(document.querySelector('.recording-screen .permission-error ol')),false,'Storage errors must not show permission instructions')
  assert.equal(document.querySelector('[data-action="record-submit"]').disabled,false)
  check('Failed submission keeps Review, original draft and unchanged submitted count; retry remains available')
 } finally { IDBObjectStore.prototype.put=originalPut }
 await click('[data-action="record-submit"]');assert.equal(state().screen,'workspace');assert.equal(Object.keys(state().projectTracks).length,3)
 await settle();assert.equal(await loadTrack(draftId),null);assert.equal((await loadTrack(projectId+':tenor')).layer.projectSeed,seed)
 check('Review submission persists owned Track, increases 2/4 to 3/4, deletes only submitted draft and returns to Workspace')
 await click('[data-nav="user"]');assert.equal(state().screen,'my');assert.ok(document.body.textContent.includes('QA personal sample'))
 await click('[data-nav="bookmark"]');assert.equal(state().screen,'collection');assert.ok(document.querySelector('[data-action="open-project-like"]'))
 await click('[data-action="open-project-like"]');assert.equal(state().screen,'workspace')
 const surface=document.querySelector('.screen');surface.scrollTop=233
 await click('[data-nav="user"]')
 const restored={ieumScreen:'workspace',scrollTop:233}
 await act(async()=>window.dispatchEvent(new window.PopStateEvent('popstate',{state:restored})));await settle()
 assert.equal(state().screen,'workspace');assert.equal(document.querySelector('.screen').scrollTop,233)
 check('Core navigation keeps project context and popstate restores mobile frame scroll')
 await act(async()=>root.unmount())
 await saveTrack(track('bass'));await saveTrack({id:projectId+':auto-mix',projectId,kind:'auto-mix',blob,duration:7,origin:'qa-saved-mix'})
 root=createRoot(container);await act(async()=>root.render(React.createElement(App)));await settle();await settle()
 assert.equal(Object.keys(state().projectTracks).length,4);assert.equal(await state().mix.blob.text(),await blob.text())
 await click('[data-nav="folder"]');await click('[data-action="resume-project"]');assert.equal(state().screen,'complete')
 assert.ok(document.querySelector('.complete-screen audio'));assert.ok(document.querySelector('.complete-screen').textContent.includes('Credits'))
 assert.equal(state().projectTracks.tenor.layer.signature,track('tenor').layer.signature)
 check('Reload restores 4 submitted Tracks and saved final mix; project resume opens Complete with credits and native audio')
 await act(async()=>root.unmount())
 await clearProjectTracks(projectId)
 await saveTrack(track('soprano'));await saveTrack(track('alto'))
 const legacyDraftId=projectId+':tenor:temporary-recording'
 await saveTrack({id:legacyDraftId,projectId,partId:'tenor',kind:'temporary-recording',userId:'another-user',blob,features,duration:7})
 root=createRoot(container);await act(async()=>root.render(React.createElement(App)));await settle();await settle()
 await click('[data-action="record-part"]')
 assert.ok(document.querySelector('[data-action="record-start"]'))
 assert.equal(document.querySelector('[data-action="record-submit"]'),null)
 assert.equal((await loadTrack(legacyDraftId)).userId,'another-user')
 assert.equal(await (await loadTrack(legacyDraftId)).blob.text(),await blob.text())
 check('Legacy draft owned by another user is neither restored as my Take nor deleted')
 await act(async()=>root.unmount())
 await saveTrack({id:legacyDraftId,projectId,partId:'tenor',kind:'temporary-recording',blob,features,duration:7})
 root=createRoot(container);await act(async()=>root.render(React.createElement(App)));await settle();await settle()
 await click('[data-action="record-part"]')
 assert.ok(document.querySelector('[data-action="record-submit"]'))
 assert.equal(document.querySelector('[data-action="record-start"]'),null)
 assert.equal(await (await loadTrack(legacyDraftId)).blob.text(),await blob.text())
 check('Ownerless legacy draft restores into Review without requiring a new recording or losing the original')
 await click('[data-action="record-retry"]');await click('[data-action="confirm-retry"]')
 assert.ok(document.querySelector('[data-action="record-start"]'))
 assert.equal(await loadTrack(legacyDraftId),null)
 assert.equal(await loadTrack(draftId),null)
 await click('.recording-screen .topbar button')
 await click('[data-action="record-part"]')
 assert.ok(document.querySelector('[data-action="record-start"]'))
 check('Confirmed retake removes the restored legacy draft; re-entry cannot resurrect the discarded Take')

 await act(async()=>root.unmount())
 root=createRoot(container)
 await act(async()=>root.render(React.createElement(ResonanceRecord,{parts:[{id:'bass'},{id:'tenor'}],layers:[null,null],seed:'qa-reordered-parts',activePartIndex:0,state:'recording'})))
 const call=globalThis.__qaRecordCalls.at(-1)
 assert.equal(call.activePartIndex,3,'Recording reaction must use the Bass slot, not project array index zero')
 assert.equal(call.slots[3].partId,'bass')
 assert.equal(call.slots[0],null,'Reordered Bass recording must not invent a Soprano layer')
 check('Reordered project Part drives the matching existing Record color/identity slot')
 const tenorLayer=buildVoiceLayer('qa-reordered-parts','tenor',features)
 const bassLayer=buildVoiceLayer('qa-reordered-parts','bass',features)
 await act(async()=>root.render(React.createElement(ResonanceRecord,{parts:[{id:'tenor'},{id:'bass'},{id:'soprano'}],layers:[tenorLayer,bassLayer,null],seed:'qa-reordered-parts',state:'rest'})))
 const restoredCall=globalThis.__qaRecordCalls.at(-1)
 assert.equal(restoredCall.slots[2].signature,tenorLayer.signature,'Empty project Part must not erase an existing mapped Tenor layer')
 assert.equal(restoredCall.slots[3].signature,bassLayer.signature)
 assert.equal(restoredCall.slots[0],null)
 await act(async()=>root.render(React.createElement(ResonanceRecord,{parts:[{id:'free-lead'},{id:'soprano'}],layers:[buildVoiceLayer('qa-free-parts','free-lead',features),buildVoiceLayer('qa-free-parts','soprano',features)],seed:'qa-free-parts',state:'rest'})))
 const freeCall=globalThis.__qaRecordCalls.at(-1)
 assert.equal(freeCall.slots[0].partId,'soprano')
 assert.equal(freeCall.slots[1].partId,'free-lead','Free Part must not collide with reserved Soprano color slot')
 check('Empty/reordered/free project Parts preserve existing Layer signatures and unique slots')
 for (const count of [2,3,4]) {
  await act(async()=>root.unmount())
  const customId=`qa-owned-project-${count}`
  const customSeed=`qa-owned-seed-${count}`
  const customParts=Array.from({length:count},(_,index)=>({id:`free-${index}`,name:`Voice ${index+1}`,color:'#3b82f6',status:index?'open':'ready',participantId:index?null:'jisun',participant:index?null:'JISUN'}))
  const customProject={id:customId,seed:customSeed,songId:'a-thousand-years',title:'QA Project',name:'QA Group',key:'E minor',keyLocked:true,partCount:count,totalParts:count,parts:customParts,ownerPartId:'free-0',status:'RECORDING',progress:0,createdAt:'2026-10-08T00:00:00Z'}
  localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor',createdProjects:[customProject],activeCreatedProjectId:customId}))
  const customDraftId=`jisun:${customId}:free-0:temporary-recording`
  await saveTrack({id:customDraftId,projectId:customId,partId:'free-0',kind:'temporary-recording',userId:'jisun',blob,features,duration:7})
  root=createRoot(container);await act(async()=>root.render(React.createElement(App)));await settle();await settle()
  assert.equal(state().activeProject.id,customId)
  assert.equal(state().activeProject.parts.length,count)
  await click('[data-action="record-part"]')
  assert.equal(state().screen,'record',document.body.textContent)
  assert.ok(document.querySelector('[data-action="record-submit"]'),'Owned project draft must restore to Review')
  assert.equal(globalThis.__qaRecordCalls.at(-1).projectSeed,customSeed)
  assert.equal(globalThis.__qaRecordCalls.at(-1).slots[0].partId,'free-0')
  await click('[data-action="record-submit"]')
  await settle()
  const submitted=await loadTrack(`${customId}:free-0`)
  assert.equal(submitted.projectId,customId)
  assert.equal(submitted.projectSeed,customSeed)
  assert.equal(submitted.partId,'free-0')
  assert.equal(submitted.partIndex,0)
  assert.equal(submitted.participantId,'jisun')
  assert.equal(submitted.layer.projectSeed,customSeed)
  assert.equal(await submitted.blob.text(),await blob.text())
  assert.equal(await loadTrack(customDraftId),null)
  assert.equal(state().activeProject.keyLocked,true)
  assert.equal(Object.keys(state().activeTracks).length,1)
  await act(async()=>root.unmount())
  root=createRoot(container);await act(async()=>root.render(React.createElement(App)));await settle();await settle()
  assert.equal(state().activeTracks['free-0'].layer.signature,submitted.layer.signature)
  assert.equal(state().activeProject.keyLocked,true)
  await clearProjectTracks(customId)
  check(`${count}-Part owned project preserves project/part/user/seed/Blob and Record layer through draft submit and reload`)
 }
 assert.deepEqual(errors,[],'Unexpected App console errors')
 console.log('Node integration passed. No claim of visual fidelity, GPU rendering, microphone capture, audible playback, real AI/backend or physical mobile verification.')
}finally{
 console.error=originalError
 if(root)await act(async()=>root.unmount())
 await Promise.all([unlink(appTemp).catch(()=>{}),unlink(iconsTemp).catch(()=>{})])
 await clearProjectTracks(projectId);await clearProjectTracks(profileId)
 await window.happyDOM.close()
}
