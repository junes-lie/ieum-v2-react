import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
  for(const count of [2,3,4]) {
    const context=await browser.newContext(),page=await context.newPage(),errors=[]
    page.on('pageerror',error=>errors.push(error.message))
    await context.addInitScript(()=>{
      window.qaMixWriteAttempts=0
      const put=IDBObjectStore.prototype.put
      IDBObjectStore.prototype.put=function(value,...args){
        if(value.kind==='auto-mix') {
          window.qaMixWriteAttempts++
          if(sessionStorage.getItem('qa-fail-mix-save')==='1')throw new Error('QA native mix file save failure')
        }
        return put.call(this,value,...args)
      }
    })
    const url=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/');url.searchParams.set('design','figma')
    await page.goto(url.href);await page.waitForFunction(()=>window.__IEUM_V2__?.state)
    const id=`qa-mix-save-${count}`
    const original=await page.evaluate(async({count,id})=>{
      const blob=await(await fetch('/demo-stems/soprano.wav')).blob()
      const parts=Array.from({length:count},(_,index)=>({id:`part-${index}`,name:`Voice ${index+1}`,participantId:index?'qa-other-'+index:'jisun',participant:index?'QA other '+index:'JISUN',status:'submitted'}))
      const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
      await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');parts.forEach((part,index)=>tx.objectStore('tracks').put({id:`${id}:${part.id}`,projectId:id,partId:part.id,partIndex:index,participantId:part.participantId,participant:part.participant,blob,duration:18,origin:'qa-isolated-submitted-track',layer:null}));tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})
      db.close()
      localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({projectLikes:[{projectId:id}],createdProjects:[{id,seed:'qa-preserved-seed',songId:'a-thousand-years',title:'QA Mix failure',name:'QA Mix failure',key:'C major',partCount:count,parts,ownerPartId:parts[0].id,status:'RECORDING'}],activeCreatedProjectId:id}))
      sessionStorage.setItem('qa-fail-mix-save','1')
      return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')
    },{count,id})
    await page.reload()
    await page.locator('[data-nav="folder"]').click()
    await page.locator('[data-action="open-created-project"]').click()
    // The optional diagnostic getter does not refresh on every created-Mix
    // state change; use the rendered error and stored records as evidence.
    await page.waitForSelector('.mix-error')
    assert.equal(await page.evaluate(()=>window.qaMixWriteAttempts),1,'Failed job must not loop automatically')
    assert.equal(await page.locator('.complete-screen').count(),0)
    assert.ok((await page.locator('.mix-error').textContent()).includes('원본 Track'))
    const inspect=()=>page.evaluate(async id=>{
      const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)})
      const records=await new Promise(resolve=>{const r=db.transaction('tracks').objectStore('tracks').getAll();r.onsuccess=()=>resolve(r.result.filter(v=>v.projectId===id))})
      db.close()
      const tracks=records.filter(v=>v.kind!=='auto-mix')
      return {tracks:await Promise.all(tracks.map(async track=>({id:track.id,hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await track.blob.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')}))),mixes:records.filter(v=>v.kind==='auto-mix').map(v=>({size:v.blob.size}))}
    },id)
    const failed=await inspect()
    assert.equal(failed.tracks.length,count);assert.ok(failed.tracks.every(v=>v.hash===original));assert.deepEqual(failed.mixes,[])
    assert.equal(await page.evaluate(id=>window.__IEUM_V2__.state.createdProjects.find(v=>v.id===id).status,id),'RECORDING')
    await page.locator('[data-nav="folder"]').click()
    await page.getByRole('button',{name:'믹싱',exact:true}).click()
    const card=page.locator('.created-project-card')
    assert.equal(await card.count(),1,'All submitted Tracks remain discoverable in the existing mixing filter even when Mix saving fails')
    assert.ok((await card.textContent()).includes('MIXING'))
    assert.equal(await card.locator('.empty-record-mark span').textContent(),String(count).padStart(2,'0'),'Count actual submitted records instead of stale project.progress')
    await page.getByRole('button',{name:'완성',exact:true}).click()
    assert.equal(await page.locator('.created-project-card').count(),0,'Failed Mix must not appear complete')
    await page.locator('[data-nav="bookmark"]').click()
    const savedCard=page.locator('.collection-card').filter({has:page.getByRole('heading',{name:'QA Mix failure',exact:true})})
    assert.equal(await savedCard.locator('.collection-card-head > span').textContent(),`MIXING · ${count}/${count}`,'Collection must use actual submissions while saved Mix is absent')
    await savedCard.getByRole('button',{name:'프로젝트 열기',exact:true}).click()
    await page.waitForSelector('.mix-error')
    assert.equal(await page.locator('.complete-screen').count(),0)
    assert.equal(await page.locator('[data-action="retry-auto-mix"]').count(),1,'Failed Mix must be retryable without reloading')
    await page.evaluate(()=>{const retry=document.querySelector('[data-action="retry-auto-mix"]');retry.click();retry.click()})
    await page.waitForFunction(()=>window.qaMixWriteAttempts===2)
    await page.waitForSelector('[data-action="retry-auto-mix"]')
    assert.deepEqual(await inspect(),failed,'Failed retry preserves submitted originals and does not save a completion')
    await page.evaluate(()=>sessionStorage.removeItem('qa-fail-mix-save'))
    await page.evaluate(()=>{const retry=document.querySelector('[data-action="retry-auto-mix"]');retry.click();retry.click()})
    await page.waitForSelector('.complete-screen')
    assert.equal(await page.evaluate(()=>window.qaMixWriteAttempts),3,'Each retry must start one job despite repeated clicks')
    const recovered=await inspect()
    assert.deepEqual(recovered.tracks,failed.tracks);assert.equal(recovered.mixes.length,1);assert.ok(recovered.mixes[0].size>44)
    await page.reload();await page.waitForSelector('[data-action="open-complete"]')
    await page.locator('[data-nav="folder"]').click()
    await page.getByRole('button',{name:'완성',exact:true}).click()
    assert.equal(await page.locator('.created-project-card').count(),1,'Saved Mix appears complete after reload')
    await page.getByRole('button',{name:'믹싱',exact:true}).click()
    assert.equal(await page.locator('.created-project-card').count(),0,'Completed Mix no longer appears under mixing')
    await page.locator('[data-nav="bookmark"]').click()
    assert.equal(await savedCard.locator('.collection-card-head > span').textContent(),`COMPLETE · ${count}/${count}`,'Collection retains actual submitted count after saved Mix reload')
    await savedCard.getByRole('button',{name:'프로젝트 열기',exact:true}).click()
    await page.waitForSelector('.complete-screen')
    assert.deepEqual(errors,[])
    console.log(`PASS ${count} Parts: Mix save failure and failed retry preserve hashes/status; repeated retry clicks start one job; successful retry saves one Mix before completion; reload retains completion`)
    await context.close()
  }
} finally {await browser.close()}
