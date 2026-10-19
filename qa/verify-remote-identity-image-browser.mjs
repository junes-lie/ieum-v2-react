import assert from 'node:assert/strict'
import {createServer} from 'vite'
import {createRequire} from 'node:module'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
assert.ok(os.freemem()>2*2**30,'Insufficient free RAM for one bounded browser QA; no browser/model launch')
const root=fileURLToPath(new URL('../',import.meta.url))
const server=await createServer({root,configFile:false,cacheDir:path.join(os.tmpdir(),`ieum-remote-image-qa-${process.pid}`),esbuild:{jsx:'transform'},server:{host:'127.0.0.1',port:0},plugins:[{
  name:'owned-remote-image-module-qa',
  resolveId(id){if(id==='/qa-owned-image-entry.js')return '\0owned-image-entry'},
  load(id){if(id==='\0owned-image-entry')return "import React from 'react';import {createRoot} from 'react-dom/client';import {VoiceIdentityQA,ResonanceRecordQA} from '/src/App.jsx';export {React,createRoot,VoiceIdentityQA,ResonanceRecordQA}"},
  transform(code,id){if(id.endsWith('/src/App.jsx'))return `${code}\nexport {VoiceIdentity as VoiceIdentityQA,ResonanceRecord as ResonanceRecordQA}`},
  configureServer(instance){instance.middlewares.use((req,res,next)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Owned image module QA</title>');return}next()})}
}]})
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json'),{chromium}=require('playwright')
let browser
try{
  await server.listen()
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
  const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/`)
  const result=await page.evaluate(async()=>{
    const {createServiceSession}=await import('/src/serviceSession.js')
    const {loadRemotePersonalGraphic,loadRemoteTrackGraphic}=await import('/src/voiceIdentityResources.js')
    const {loadAiVoiceFields}=await import('/src/aiVoiceLayer.js')
    const {React,createRoot,VoiceIdentityQA,ResonanceRecordQA}=await import('/qa-owned-image-entry.js')
    // Native canvas test PNG only, not AI/prototype/Figma reference.
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512
    canvas.getContext('2d').fillRect(0,0,512,512)
    const good=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))
    const hash=async blob=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')
    let blob=good,reference={id:'opaque-native-image',revision:'r1',outputSha256:await hash(good)}
    const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL),live=new Set(),NativeImage=Image
    URL.createObjectURL=value=>{const url=create(value);live.add(url);return url}
    URL.revokeObjectURL=url=>{live.delete(url);revoke(url)}
    const layerRef={...reference,inputDigest:'b'.repeat(64),generatorVersion:'fixture-layer-v1'}
    let layerReply={resultStatus:'stored',projectId:'project',partId:'lead',projectSeed:'seed',ref:layerRef,personalRef:{...layerRef,id:'personal-source'}}
    let imageReads=0
    const session=createServiceSession({baseUrl:'https://ieum.example/api',fetchImpl:async(url,init)=>{
      if(url.endsWith('/capabilities'))return Response.json({contractVersion:'ieum-service-v1',mode:'remote',authenticated:true,sharedProjects:true})
      if(url.endsWith('/me/session'))return Response.json({authenticated:true,user:{id:'11111111-1111-4111-8111-111111111111'}})
      if(init.headers.Authorization!=='Bearer fixture-token')throw new Error('Missing session')
      const q=new URL(url).searchParams
      if(q.get('kind')==='track-layer')return Response.json(layerReply)
      imageReads++
      const offset=Number(q.get('offset')),length=Number(q.get('length')),part=blob.slice(offset,offset+length)
      return new Response(part,{status:206,headers:{'Content-Type':'application/octet-stream','Content-Length':String(part.size),
        'Content-Range':`bytes ${offset}-${offset+part.size-1}/${blob.size}`,'X-Content-SHA256':reference.outputSha256}})
    }})
    const opts=()=>({session,ref:reference,maxBytes:8388608})
    const rejected=async operation=>{try{await operation();return false}catch{return true}}
    try{
      await session.connect('fixture-token')
      const graphic=await loadRemotePersonalGraphic(opts()),image=new NativeImage();image.src=graphic.image;await image.decode()
      const dimensions=[image.naturalWidth,image.naturalHeight],before=live.size,urlIsOpaque=!graphic.image.includes(reference.id)
      const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
      root.render(React.createElement(VoiceIdentityQA,{identity:graphic}))
      for(let i=0;i<100 && !host.querySelector('img');i++)await new Promise(resolve=>setTimeout(resolve,10))
      const rendered=host.querySelector('img')?.getAttribute('src')===graphic.image && host.querySelector('.voice-identity.pending')===null
      root.unmount();host.remove()
      graphic.dispose();graphic.dispose()
      const normalReleased=live.size===0 && graphic.disposed
      const trackOptions={session,ref:layerRef,projectId:'project',partId:'lead',projectSeed:'seed',maxBytes:8388608}
      const trackGraphic=await loadRemoteTrackGraphic(trackOptions)
      const trackDecoded=trackGraphic.field.image.naturalWidth===512 && trackGraphic.field.partId==='lead' &&
        trackGraphic.field.projectSeed==='seed' && trackGraphic.personalRef.id==='personal-source' && trackGraphic.ref.id===layerRef.id
      trackGraphic.dispose();trackGraphic.dispose()
      const trackReleased=live.size===0 && trackGraphic.disposed,beforeImages=imageReads
      layerReply={...layerReply,projectSeed:'wrong-project-seed'}
      const wrongLayerRefused=await rejected(()=>loadRemoteTrackGraphic(trackOptions)) && imageReads===beforeImages && live.size===0
      layerReply={...layerReply,projectSeed:'seed'}
      const originalLayer=structuredClone(layerReply)
      let invalidLayersRefused=true
      for(const mutate of [r=>r.resultStatus='pending',r=>r.partId='other',r=>r.ref.outputSha256='c'.repeat(64),
        r=>r.ref.generatorVersion='other',r=>r.personalRef.inputDigest='invalid']){
        layerReply=structuredClone(originalLayer);mutate(layerReply)
        const before=imageReads
        invalidLayersRefused=invalidLayersRefused && await rejected(()=>loadRemoteTrackGraphic(trackOptions)) && before===imageReads && live.size===0
      }
      layerReply=originalLayer
      const source=new Blob(['submitted original']),sourceSha256=await hash(source)
      const track=partId=>({id:`project:${partId}`,projectId:'project',partId,participantId:'private-fixture',kind:'project-track',submissionStatus:'success',blob:source,
        aiVoiceLayer:{version:'ieum-ai-voice-layer-v1',projectId:'project',partId,participantId:'private-fixture',projectSeed:'seed',inferenceSeed:1,
          model:'fixture',revision:'a'.repeat(40),sourceSha256,outputSha256:reference.outputSha256,blob:good}})
      const tracks={lead:track('lead'),chorus:{...track('chorus'),kind:'recording-draft',submissionStatus:'review'}}
      const fields=loadAiVoiceFields(tracks,'seed',['lead','chorus'],'project')
      tracks.lead.submissionStatus='review';tracks.lead.aiVoiceLayer.blob=new Blob(['changed'])
      const finalFields=await fields
      const submittedOnly=finalFields.length===1 && finalFields[0].partId==='lead' && finalFields[0].image.naturalWidth===512 && live.size===0
      const draftOnly=(await loadAiVoiceFields({chorus:tracks.chorus},'seed',['lead','chorus'],'project')).length===0
      const recordHost=document.createElement('div'),style=document.createElement('style')
      style.textContent='.record{position:relative;width:240px;height:240px}.record canvas{position:absolute;width:240px;height:240px}'
      document.body.append(style,recordHost);const recordRoot=createRoot(recordHost)
      const renderRecord=value=>recordRoot.render(React.createElement(ResonanceRecordQA,{parts:[{id:'lead'},{id:'chorus'}],projectId:'project',seed:'seed',
        tracks:value,layers:[{partId:'lead',seed:1,signature:'test',spread:.1,turbulence:.7,opacity:.3,drift:.2}],compact:true}))
      const flags=()=>{const gl=recordHost.querySelector('.record-particles')?.getContext('webgl'),program=gl?.getParameter(gl.CURRENT_PROGRAM)
        return program?gl.getUniform(program,gl.getUniformLocation(program,'uFieldEnabled')):null}
      const waitCount=async count=>{for(let i=0;i<100;i++){const value=flags();if(value && [...value].filter(Boolean).length===count)return true;await new Promise(resolve=>setTimeout(resolve,20))}return false}
      renderRecord({lead:track('lead'),chorus:tracks.chorus})
      const renderedSubmitted=await waitCount(1)
      let excludedStates=true
      for(const submissionStatus of ['review','draft','processing','failed']){
        renderRecord({lead:{...track('lead'),submissionStatus},chorus:tracks.chorus})
        excludedStates=excludedStates && await waitCount(0)
      }
      const layerErrors=recordHost.querySelectorAll('.record-error').length
      recordRoot.unmount();recordHost.remove();style.remove()
      // A correct SHA/header does not replace the browser's full PNG decode.
      blob=new Blob([await good.slice(0,33).arrayBuffer()],{type:'image/png'});reference={...reference,outputSha256:await hash(blob)}
      const badRefused=await rejected(()=>loadRemotePersonalGraphic(opts())),badReleased=live.size===0
      blob=good;reference={...reference,outputSha256:await hash(good)}
      let release,started
      const began=new Promise(resolve=>{started=resolve}),hold=new Promise(resolve=>{release=resolve})
      window.Image=class extends NativeImage{async decode(){await super.decode();started();await hold}}
      const pending=loadRemotePersonalGraphic(opts());await began;session.disconnect();release()
      const logoutRefused=await rejected(()=>pending),logoutReleased=live.size===0
      await session.connect('fixture-token')
      const trackBegan=new Promise(resolve=>{started=resolve}),trackHold=new Promise(resolve=>{release=resolve})
      window.Image=class extends NativeImage{async decode(){await super.decode();started();await trackHold}}
      const trackPending=loadRemoteTrackGraphic(trackOptions);await trackBegan;session.disconnect();release()
      const trackLogoutRefused=await rejected(()=>trackPending) && live.size===0
      return {dimensions,before,urlIsOpaque,rendered,normalReleased,trackDecoded,trackReleased,wrongLayerRefused,invalidLayersRefused,trackLogoutRefused,submittedOnly,draftOnly,renderedSubmitted,excludedStates,layerErrors,badRefused,badReleased,logoutRefused,logoutReleased}
    }finally{session.disconnect();window.Image=NativeImage;for(const url of live)revoke(url);URL.createObjectURL=create;URL.revokeObjectURL=revoke}
  })
  assert.deepEqual(result,{dimensions:[512,512],before:1,urlIsOpaque:true,rendered:true,normalReleased:true,trackDecoded:true,trackReleased:true,wrongLayerRefused:true,invalidLayersRefused:true,trackLogoutRefused:true,submittedOnly:true,draftOnly:true,renderedSubmitted:true,excludedStates:true,layerErrors:0,badRefused:true,badReleased:true,logoutRefused:true,logoutReleased:true})
  assert.deepEqual(errors,[])
  console.log('PASS owned remote bytes→native PNG decode→existing React Identity/Record: opaque URL, disposal, decode failure/logout cleanup, immutable caller snapshot and actual WebGL submitted1/review-draft-processing-failed0. Injected Auth/HTTP and canvas PNG, not AI/design/real user acceptance.')
}finally{await browser?.close();await server.close()}
