import assert from 'node:assert/strict'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
import path from 'node:path'
import os from 'node:os'
const report=JSON.parse(await readFile(process.argv[2],'utf8'))
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const inputs=[]
for(const [index,source] of report.sources.entries()){
 const result=report.results.find(result=>result.sourceIndex===index)
 const audio=await readFile(source.path),image=await readFile(result.path)
 assert.equal(hash(audio),result.sourceSha256)
 inputs.push({audio:audio.toString('base64'),image:image.toString('base64'),sourceSha256:hash(audio),outputSha256:hash(image),features:source.analysis.features})
}
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
const output=path.join(os.tmpdir(),'ieum-ai-motion')
await mkdir(output,{recursive:true})
const context=await browser.newContext({viewport:{width:430,height:932}}),page=await context.newPage(),errors=[]
page.on('pageerror',error=>errors.push(error.message))
page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
const results=[]
try{
 await page.goto('http://127.0.0.1:4191/?design=figma&resonanceTime=3')
 await page.waitForFunction(()=>Boolean(window.__IEUM_V2__?.state))
 for(const count of [0,2,3,4]){
  await page.evaluate(async({count,inputs,model,revision,seed})=>{
   const {saveTrack}=await import('/src/trackStore.js')
   const {buildVoiceLayer}=await import('/src/voiceAnalysis.js')
   const projectId='qa-ai-motion',projectSeed=String(seed)
   const parts=inputs.map((_,index)=>({id:`voice-${index}`,name:`Voice ${index+1}`,participantId:`public-singer-${index}`,participant:`VocalSet ${index+1}`,status:'submitted',color:'#3b82f6'}))
   const blob=(base64,type)=>new Blob([Uint8Array.from(atob(base64),character=>character.charCodeAt(0))],{type})
   for(const [index,input] of inputs.entries()){
    const partId=parts[index].id,participantId=parts[index].participantId
    const track={id:projectId+':'+partId,projectId,projectSeed,partId,participantId,participant:parts[index].participant,origin:'public-model-evaluation',blob:blob(input.audio,'audio/wav'),features:input.features,layer:buildVoiceLayer(projectSeed,partId,input.features),duration:input.features.durationSec}
    if(index<count)track.aiVoiceLayer={version:'ieum-ai-voice-layer-v1',projectId,projectSeed,partId,participantId,inferenceSeed:seed,model,revision,sourceSha256:input.sourceSha256,outputSha256:input.outputSha256,blob:blob(input.image,'image/png')}
    await saveTrack(track)
   }
   localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,createdProjects:[{id:projectId,seed:projectSeed,songId:'a-thousand-years',name:'AI evaluation',title:'AI evaluation',parts,partCount:4,ownerPartId:'voice-0',key:'C major',keyLocked:true}],activeCreatedProjectId:projectId}))
  },{count,inputs,model:report.model,revision:report.revision,seed:report.seed})
  await page.reload()
  await page.waitForFunction(async()=>Boolean((await (await import('/src/trackStore.js')).loadTrack('qa-ai-motion:auto-mix'))?.blob))
  await page.evaluate(()=>location.hash='#workspace')
  await page.waitForFunction(count=>Number(document.querySelector('.workspace-screen .record-particles')?.dataset.aiLayerCount)===count,count)
  const record=page.locator('.workspace-screen .record')
  const bytes=await record.screenshot({path:path.join(output,`fields-${count}.png`)})
  const runtime=await record.locator('.record-particles').evaluate(canvas=>({aiLayers:Number(canvas.dataset.aiLayerCount),particles:Number(canvas.dataset.particleCount),webgl:!!canvas.getContext('webgl')}))
  assert.ok(runtime.webgl)
  results.push({count,...runtime,sha256:hash(bytes)})
  await page.reload()
  await page.waitForFunction(count=>Number(document.querySelector('.record-particles')?.dataset.aiLayerCount)===count,count)
  const restored=await page.locator('.record').first().screenshot()
  assert.equal(hash(restored),hash(bytes),'Same stored AI output and fixed time must reproduce pixels')
 }
 assert.equal(new Set(results.map(result=>result.sha256)).size,4)
 assert.equal(new Set(results.map(result=>result.particles)).size,1,'AI display must preserve existing particles')
 await page.goto('http://127.0.0.1:4191/?design=figma')
 await page.waitForSelector('.record-particles[data-ai-layer-count="4"]')
 const first=await page.locator('.record').first().screenshot()
 await page.waitForTimeout(1200)
 const second=await page.locator('.record').first().screenshot()
 assert.notEqual(hash(first),hash(second),'AI field must remain an actual moving Record')
 await page.evaluate(async()=>{
  const {loadTrack,saveTrack}=await import('/src/trackStore.js')
  const track=await loadTrack('qa-ai-motion:voice-0')
  await saveTrack({...track,aiVoiceLayer:{...track.aiVoiceLayer,outputSha256:'0'.repeat(64)}})
 })
 await page.reload()
 await page.waitForFunction(()=>document.querySelector('.record-error')?.textContent.includes('해시가 일치하지'))
 await page.waitForSelector('.record-particles[data-ai-layer-count="0"]')
 const preserved=await page.evaluate(async()=>{
  const track=await (await import('/src/trackStore.js')).loadTrack('qa-ai-motion:voice-0')
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await track.blob.arrayBuffer()))].map(value=>value.toString(16).padStart(2,'0')).join('')
 })
 assert.equal(preserved,inputs[0].sourceSha256,'Rejected AI artifact must preserve original audio')
 assert.deepEqual(errors,[])
 await writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2))
 console.log(JSON.stringify({passed:true,results,motion:true,errors,output,limitation:'Actual P0 model files supplied to isolated existing app; no production inference service or Figma pixel equivalence claim.'},null,2))
}catch(error){console.error(JSON.stringify({errors,state:await page.evaluate(()=>({project:window.__IEUM_V2__?.state.activeProject,status:window.__IEUM_V2__?.state.activeMixStatus,screen:window.__IEUM_V2__?.state.screen})),body:await page.locator("body").innerText()}));throw error}finally{await browser.close()}