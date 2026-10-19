import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
const require = createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium} = require('playwright')
const url = new URL(process.env.IEUM_QA_URL || 'http://127.0.0.1:4196/')
url.searchParams.set('design','figma')
const missingAnalysis=process.env.IEUM_QA_MISSING_ANALYSIS==='1'
const rate=16000,samples=rate,wav=Buffer.alloc(44+samples*2)
wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40)
for(let index=0;index<samples;index++)wav.writeInt16LE(Math.round(Math.sin(index/rate*Math.PI*440)*1500),44+index*2)
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
  for(const mode of [2,'main']) {
    const count=mode==='main'?4:mode
    const context=await browser.newContext(),page=await context.newPage(),errors=[]
    await context.addInitScript(()=>{
      const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL),put=IDBObjectStore.prototype.put
      window.qaUrls=[];window.qaRevoked=[];window.qaFailedMixUrl=null
      URL.createObjectURL=blob=>{const url=create(blob);window.qaUrls.push({blob,url});return url}
      URL.revokeObjectURL=url=>{window.qaRevoked.push(url);return revoke(url)}
      IDBObjectStore.prototype.put=function(value,...args){
        if(value.kind==='auto-mix'){
          window.qaFailedMixUrl=window.qaUrls.find(item=>item.blob===value.blob)?.url
          throw new Error('QA Auto Mix result storage unavailable')
        }
        return put.call(this,value,...args)
      }
    })
    page.on('pageerror',error=>errors.push(error.message))
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
    await page.goto(url.href);await page.waitForFunction(()=>window.__IEUM_V2__?.state)
    const id=mode==='main'?'ieum-thousand-years-v7':`qa-graphics-independent-${count}`,seed=mode==='main'?'ieum:thousand-years:original-c:0048':`qa-preserved-seed-${count}`
    await page.evaluate(async({count,id,seed,audio,mode,missingAnalysis})=>{
      const bytes=Uint8Array.from(atob(audio),character=>character.charCodeAt(0))
      const blob=new Blob([bytes],{type:'audio/wav'})
      const parts=Array.from({length:count},(_,index)=>({id:mode==='main'?['soprano','alto','tenor','bass'][index]:`free-${index}`,name:`Voice ${index}`,participantId:index?'other-'+index:'jisun',participant:index?'Other '+index:'JISUN',range:'C3–G4',status:'submitted'}))
      const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('ieum-v2-records',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})
      await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');parts.forEach((part,index)=>tx.objectStore('tracks').put({id:`${id}:${part.id}`,projectId:id,projectSeed:seed,partId:part.id,partIndex:index,participantId:part.participantId,participant:part.participant,blob,duration:1,origin:mode==='main'?'live-microphone-recording':'qa-isolated-audio',features:missingAnalysis?null:{version:'ieum-basic-voice-v3'},layer:null}));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})
      db.close()
      localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,createdProjects:mode==='main'?[]:[{id,seed,songId:'a-thousand-years',title:'QA',name:'QA',key:'C major',partCount:count,totalParts:count,parts,ownerPartId:parts[0].id,status:'RECORDING'}],activeCreatedProjectId:mode==='main'?null:id}))
    },{count,id,seed,mode,missingAnalysis,audio:wav.toString('base64')})
    await page.reload()
    await page.waitForFunction(()=>window.qaFailedMixUrl,{},{timeout:30000})
    if(mode!=='main'){await page.locator('[data-nav="folder"]').click();await page.locator('[data-action="open-created-project"]').click()}
    const result=await page.evaluate(async()=>{
      const state=window.__IEUM_V2__.state
      const hashes=await Promise.all(Object.values(state.activeTracks).map(async track=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await track.blob.arrayBuffer())),value=>value.toString(16).padStart(2,'0')).join('')))
      return {revoked:window.qaRevoked.includes(window.qaFailedMixUrl),tracks:hashes.length,hashes,mix:state.activeMix}
    })
    assert.equal(result.tracks,count,'Failed result save must preserve submitted originals')
    assert.deepEqual(result.hashes,Array(count).fill(createHash('sha256').update(wav).digest('hex')),'Submitted original bytes must remain exact after Mix storage failure')
    assert.ok(!result.mix,'Failed result save cannot publish a completed Mix')
    assert.equal(result.revoked,true,'Unpublished failed Mix Blob URL must be released')
    assert.deepEqual(errors.filter(message=>!message.includes('QA Auto Mix result storage unavailable')),[])
    console.log(JSON.stringify({mode,passed:true,unpublishedMixUrlReleased:true,submittedOriginalsPreserved:count,limits:'Isolated native render and injected IndexedDB failure; no physical listening or server acceptance'}))
    await context.close()
  }
} finally {await browser.close()}
console.log('Isolated synthetic audio and native browser mix; no physical listening or personal graphic acceptance claim')
