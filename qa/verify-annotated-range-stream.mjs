import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
import {parseArgs} from 'node:util'
import {resolve} from 'node:path'
const {values}=parseArgs({options:{'runtime-dir':{type:'string'}}})
if(!values['runtime-dir'])throw new Error('Required: --runtime-dir <retained research runtime>; audio is not bundled in the app')
const source=await readFile(resolve(values['runtime-dir'],'csd-app-pitch-input/mono.f32le'))
assert.equal(createHash('sha256').update(source).digest('hex'),'1f787f4781ffa4ad31739f25b57761bdf1385e4aa8a2b78dd02103eb019741bb')
const pcm=Array.from({length:source.length/4},(_,index)=>source.readFloatLE(index*4))
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const results=[]
 for(const mode of ['silence','annotated-singing']){
  const context=await browser.newContext({viewport:{width:390,height:844}})
  await context.addInitScript(({pcm,mode})=>{
   navigator.mediaDevices.getUserMedia=async()=>{
    const audio=new AudioContext({sampleRate:44100}),destination=audio.createMediaStreamDestination()
    const buffer=audio.createBuffer(1,pcm.length,44100)
    if(mode!=='silence')buffer.copyToChannel(Float32Array.from(pcm),0)
    const input=audio.createBufferSource();input.buffer=buffer;input.connect(destination)
    window.qaRangeInput={audio,input,stream:destination.stream,ended:false}
    input.onended=()=>{window.qaRangeInput.ended=true}
    await audio.resume();input.start(audio.currentTime+.25)
    return destination.stream
   }
  },{pcm,mode})
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message))
  await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/')
  await page.waitForFunction(()=>window.__IEUM_V2__?.state?.projectTracks)
  await page.locator('[data-nav="user"]').click()
  await page.getByRole('button',{name:'내 목소리 알아보기',exact:true}).click()
  await page.locator('[data-action="range-start"]').click()
  await page.waitForFunction(()=>window.qaRangeInput?.ended)
  await page.waitForTimeout(450)
  const diagnostics=await page.locator('.pitch-diagnostics').innerText()
  const match=diagnostics.match(/수집\s+(\d+)\/(\d+)/)
  assert.ok(match,'Live range diagnostics must remain visible')
  const accepted=Number(match[1]),checked=Number(match[2])
  assert.ok(checked>=6,'Actual requestAnimationFrame collection must execute')
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile),null,'Measurement must not enroll a Profile')
  await page.locator('[data-action="range-finish"]').click()
  let range=null
  if(mode==='silence'){
   assert.equal(accepted,0)
   assert.equal(await page.locator('.result-block').count(),0)
   assert.match(await page.locator('.permission-error').innerText(),/음정을 충분히 감지하지 못했어요/)
  }else{
   assert.ok(accepted>=6)
   await page.waitForSelector('.result-block')
   range=await page.locator('.result-block').innerText()
   const label=await page.locator('.result-block h1 span').textContent()
   assert.match(label,/^[A-G][♯♭]?3–[A-G][♯♭]?4$/,'This bounded annotated singer must not acquire a false octave-5 upper range')
   assert.ok(range.includes(`${accepted}개의 유효 음정 표본`))
   assert.equal(await page.evaluate(()=>window.qaRangeInput.stream.getTracks().every(track=>track.readyState==='ended')),true,'Finishing range must stop the input stream')
  }
  assert.deepEqual(errors,[])
  await page.evaluate(()=>{window.qaRangeInput.stream.getTracks().forEach(track=>track.stop());return window.qaRangeInput.audio.close()})
  results.push({mode,accepted,checked,range,noProfileEnrollment:true,pageErrors:errors});await context.close()
 }
 console.log(JSON.stringify({passed:true,results,limits:'Bounded CC-BY-NC-SA research PCM injected through native MediaStream/WebAudio; no physical microphone, scientific voice judgement, full-range calibration or Profile/Identicon approval.'}))
}finally{await browser.close()}
