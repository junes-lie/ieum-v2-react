import assert from 'node:assert/strict'
import {createServer} from 'vite'
import {createRequire} from 'node:module'
import path from 'node:path'
import os from 'node:os'
import {fileURLToPath} from 'node:url'

// Owned local module QA only; no user tabs, external sources or visual design.
assert.ok(os.freemem()>2*2**30,'Insufficient free RAM for bounded browser QA')
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)))
const server=await createServer({root,configFile:false,cacheDir:path.join(os.tmpdir(),`ieum-identity-qa-${process.pid}`),
  esbuild:{jsx:'transform'},server:{host:'127.0.0.1',port:0,strictPort:false},plugins:[{
    name:'isolated-identity-consumer-qa',
    resolveId(id){if(id==='/qa-react-entry.js')return '\0ieum-consumer-qa'},
    load(id){if(id==='\0ieum-consumer-qa')return "import React from 'react';import {createRoot} from 'react-dom/client';import {VoiceIdentityQA,ResonanceRecordQA,Home,PersonalArea} from '/src/App.jsx';export {React,createRoot,VoiceIdentityQA,ResonanceRecordQA,Home,PersonalArea}"},
    transform(code,id){if(id.endsWith('/src/App.jsx'))return `${code}\nexport {VoiceIdentity as VoiceIdentityQA,ResonanceRecord as ResonanceRecordQA}`},
    configureServer(instance){instance.middlewares.use((request,response,next)=>{
      if(request.url==='/'){response.setHeader('Content-Type','text/html');response.end('<!doctype html><title>Private Identity storage QA</title>');return}
      next()
    })}
  }]})
await server.listen()
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
let browser
try{
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
  const context=await browser.newContext(),page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/`)
  const initial=await page.evaluate(async()=>{
    const {buildIdentityInputManifest}=await import('/src/voiceIdentityContract.js')
    const {analyzeAudioBuffer}=await import('/src/voiceAnalysis.js')
    const {persistPersonalIdentityResult,prepareStoredSubmittedVoiceControls,persistStoredTrackVoiceLayer,persistStoredProjectRecordInput}=await import('/src/voiceIdentityStore.js')
    const {prepareSubmittedTrackRecord}=await import('/src/trackSource.js')
    const {saveSubmittedTrack}=await import('/src/trackStore.js')
    const pcm=Float32Array.from({length:16000},(_,i)=>.1*Math.sin(2*Math.PI*220*i/16000))
    const features=analyzeAudioBuffer({sampleRate:16000,duration:1,getChannelData:()=>pcm})
    const manifest=await buildIdentityInputManifest({userId:'private-browser-fixture',profileRevision:'fixture-1',generatorVersion:'fixture-generator',
      sources:[{recordId:'fixture:sample',purpose:'voice-sample',sha256:'a'.repeat(64),analysisVersion:features.version,data:features}]})
    // Valid native PNG fixture for decode/resource lifetime tests, not AI art.
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512
    const paint=canvas.getContext('2d');paint.fillStyle='#ece6d6';paint.fillRect(0,0,512,512)
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))
    const bytes=new Uint8Array(await blob.arrayBuffer())
    const outputSha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('')
    const artifact={id:'opaque-browser-result',revision:'result-1',inputDigest:manifest.inputDigest,generatorVersion:manifest.generatorVersion,
      model:'fixture',modelRevision:'b'.repeat(40),inferenceSeed:'1',outputSha256,blob}
    const result=await persistPersonalIdentityResult({profileProjectId:'isolated-profile',manifest,artifact})
    const project={id:'isolated-project',seed:'isolated-seed',partIds:['lead','chorus']},layerRefs={}
    for(const partId of project.partIds){
      const track=await prepareSubmittedTrackRecord({id:`${project.id}:${partId}`,projectId:project.id,partId,participantId:manifest.userId,
        origin:'live-microphone-recording',blob:new Blob([pcm]),features,duration:1})
      await saveSubmittedTrack(track)
      const args={profileProjectId:'isolated-profile',userId:manifest.userId,identityRef:result.ref,projectId:project.id,partId,
        projectSeed:project.seed,generatorVersion:'fixture-flow'}
      const prepared=await prepareStoredSubmittedVoiceControls(args)
      const layer=await persistStoredTrackVoiceLayer({...args,result:{id:`opaque-${partId}`,revision:'layer-1',inputDigest:prepared.trackInput.inputDigest,
        artifact:{version:'ieum-ai-voice-layer-v1',projectId:project.id,partId,participantId:manifest.userId,projectSeed:project.seed,
          inferenceSeed:1,model:'fixture',revision:'b'.repeat(40),sourceSha256:track.sourceProvenance.audioSha256,outputSha256,blob:artifact.blob}}})
      layerRefs[partId]=layer.ref
    }
    const graph=await persistStoredProjectRecordInput({project,layerRefs,generatorVersion:'fixture-project'})
    return {selector:{profileProjectId:'isolated-profile',userId:manifest.userId,id:artifact.id,revision:artifact.revision},ref:result.ref,traits:result.traits,
      graphRef:graph.ref,graphInput:graph.input,byteLength:blob.size}
  })
  await page.reload()
  const restored=await page.evaluate(async selector=>{
    const {loadPersonalIdentityResult}=await import('/src/voiceIdentityStore.js')
    const result=await loadPersonalIdentityResult(selector)
    if(!(result.artifact.blob instanceof Blob))throw new Error('Stored Blob was not restored')
    return {ref:result.ref,traits:result.traits,bytes:result.artifact.blob.size}
  },initial.selector)
  assert.deepEqual(restored.ref,initial.ref)
  assert.deepEqual(restored.traits,initial.traits)
  assert.equal(restored.bytes,initial.byteLength)
  const graph=await page.evaluate(async ref=>(await import('/src/voiceIdentityStore.js')).loadStoredProjectRecordInput(ref),initial.graphRef)
  assert.deepEqual(graph.input,initial.graphInput)
  assert.equal(graph.input.submittedCount,2)
  assert.equal(graph.input.allSubmittedLayersReady,true)
  const decoded=await page.evaluate(async({selector,graphRef})=>{
    const {loadStoredPersonalGraphic,loadStoredProjectRenderResources}=await import('/src/voiceIdentityResources.js')
    const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL),live=new Set()
    URL.createObjectURL=blob=>{const url=create(blob);live.add(url);return url}
    URL.revokeObjectURL=url=>{live.delete(url);revoke(url)}
    let personal,project
    try{
      personal=await loadStoredPersonalGraphic(selector)
      project=await loadStoredProjectRenderResources(graphRef)
      const output={personalImage:personal.image.startsWith('blob:'),fields:project.fields.length,
        partIds:project.fields.map(field=>field.partId),styleParts:project.styles.map(item=>item.partId),
        dimensions:project.fields.map(field=>[field.image.naturalWidth,field.image.naturalHeight]),liveBefore:live.size}
      if(personal.image.includes(selector.userId))throw new Error('Raw owner exposed in image URL')
      personal.dispose();personal=null;project.dispose();project=null
      output.liveAfter=live.size
      return output
    }finally{
      personal?.dispose();project?.dispose();URL.createObjectURL=create;URL.revokeObjectURL=revoke
    }
  },{selector:initial.selector,graphRef:initial.graphRef})
  assert.equal(decoded.personalImage,true)
  assert.deepEqual(decoded.partIds,['lead','chorus'])
  assert.deepEqual(decoded.styleParts,decoded.partIds)
  assert.deepEqual(decoded.dimensions,[[512,512],[512,512]])
  assert.equal(decoded.liveBefore,3)
  assert.equal(decoded.liveAfter,0)
  // Exercise the actual existing React consumers, exported only by this
  // in-memory QA transform. Production source gains no test-only exports.
  await page.evaluate(async({selector,graphRef})=>{
    const {React,createRoot,VoiceIdentityQA,ResonanceRecordQA}=await import('/qa-react-entry.js')
    const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL),live=new Set()
    window.consumerURLQa={create,revoke,live}
    URL.createObjectURL=blob=>{const url=create(blob);live.add(url);return url}
    URL.revokeObjectURL=url=>{live.delete(url);revoke(url)}
    document.body.innerHTML='<style>.record{position:relative;width:360px;height:360px}.record canvas{position:absolute;width:360px;height:360px}</style><div id="identity"></div><div id="record"></div>'
    const identityRoot=createRoot(document.getElementById('identity')),recordRoot=createRoot(document.getElementById('record'))
    const element=React.createElement
    window.consumerQa={identityRoot,recordRoot,renderRecord:seed=>recordRoot.render(element(ResonanceRecordQA,
      {parts:[{id:'lead'},{id:'chorus'}],projectId:graphRef.projectId,seed,recordRef:graphRef}))}
    identityRoot.render(element(VoiceIdentityQA,{identity:{selector}}))
    window.consumerQa.renderRecord('isolated-seed')
  },{selector:initial.selector,graphRef:initial.graphRef})
  await page.waitForFunction(()=>document.querySelector('#identity img')?.complete && document.querySelector('#identity img')?.naturalWidth===512)
  await page.waitForFunction(()=>{
    const gl=document.querySelector('.record-particles')?.getContext('webgl'),program=gl?.getParameter(gl.CURRENT_PROGRAM)
    if(!program)return false
    return Array.from({length:4},(_,i)=>gl.getUniform(program,gl.getUniformLocation(program,`uVoice${i}`))?.[3] || 0).filter(Boolean).length===2
  },{},{timeout:10000})
  assert.equal(await page.locator('.record-error').count(),0)
  await page.evaluate(()=>window.consumerQa.renderRecord('wrong-project-seed'))
  await page.waitForFunction(()=>document.querySelector('.record-error')?.textContent.includes('does not match this Project'))
  const flags=await page.evaluate(()=>{
    const gl=document.querySelector('.record-particles').getContext('webgl'),program=gl.getParameter(gl.CURRENT_PROGRAM)
    return Array.from({length:4},(_,i)=>gl.getUniform(program,gl.getUniformLocation(program,`uVoice${i}`))?.[3] || 0)
  })
  assert.deepEqual(flags,[0,0,0,0],'Wrong Project must not reuse old personal styles')
  await page.evaluate(()=>{window.consumerQa.identityRoot.unmount();window.consumerQa.recordRoot.unmount()})
  await page.waitForFunction(()=>window.consumerURLQa.live.size===0)
  // The same immutable Project ref must reach existing Home and Collection
  // covers; no graphic, layout or automatic selection policy is introduced.
  for(const route of ['home','created-collection','main-projects','main-collection']){
    await page.evaluate(async({route,graphRef})=>{
      const {React,createRoot,Home,PersonalArea}=await import('/qa-react-entry.js')
      const project={id:graphRef.projectId,seed:'isolated-seed',voiceRecordRef:graphRef,
        title:'QA Project',name:'QA Session',songId:'a-thousand-years',partCount:2,
        parts:[{id:'lead',name:'Lead',status:'open'},{id:'chorus',name:'Chorus',status:'open'}]}
      // Main routes have the fixed catalog id; use the fixture as an explicit
      // graphic consumer model only. Counts and participation are not inferred.
      const mainId='ieum-thousand-years-v7'
      const noop=()=>{}
      document.body.innerHTML='<style>.record{position:relative;width:240px;height:240px}.record canvas{position:absolute;width:240px;height:240px}</style><div id="route"></div>'
      const root=createRoot(document.getElementById('route'));window.routeIdentityQa=root
      const props={mainProject:project,layers:[],projectTracks:{},profile:null,mix:null,
        createdProjects:route==='created-collection'?[project]:[],createdProjectTracks:{},createdMixes:{},
        projectLikes:[{projectId:route==='created-collection'?project.id:mainId}],vocalSaves:[],songSaves:[],
        joined:route==='main-projects',type:route==='main-projects'?'projects':'collection',trackCount:0,
        go:noop,openSong:noop,openCreateProject:noop,openComplete:noop,openCreatedProject:noop,
        openMainWorkspace:noop,toggleProjectLike:noop,toggleProjectById:noop,toggleVocalSave:noop,toggleSongSave:noop}
      root.render(React.createElement(route==='home'?Home:PersonalArea,props))
    },{route,graphRef:initial.graphRef})
    await page.waitForFunction(()=>{
      const canvases=[...document.querySelectorAll('.record-particles')]
      return canvases.length>0 && canvases.every(canvas=>{
        const gl=canvas.getContext('webgl'),program=gl?.getParameter(gl.CURRENT_PROGRAM)
        return program && Array.from({length:4},(_,i)=>gl.getUniform(program,gl.getUniformLocation(program,`uVoice${i}`))?.[3] || 0).filter(Boolean).length===2
      })
    },{},{timeout:10000})
    assert.equal(await page.locator('.record-error').count(),0,route)
    await page.evaluate(()=>window.routeIdentityQa.unmount())
    await page.waitForFunction(()=>window.consumerURLQa.live.size===0)
  }
  await page.evaluate(()=>{URL.createObjectURL=window.consumerURLQa.create;URL.revokeObjectURL=window.consumerURLQa.revoke})
  assert.deepEqual(errors,[])
  console.log('PASS native DB/reload + PNG decode/resource cleanup + actual React Identity/Project/Home/Collection covers and wrong-Project refusal; canvas PNG fixtures, not microphone, AI inference, perceptual design or Production acceptance')
}finally{
  await browser?.close()
  await server.close()
}
