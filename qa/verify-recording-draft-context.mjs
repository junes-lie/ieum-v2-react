import assert from 'node:assert/strict'
import {createServer} from 'vite'
import {createRequire} from 'node:module'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
assert.ok(os.freemem()>2*2**30,'Insufficient free RAM for one bounded QA browser')
const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),cacheDir:path.join(os.tmpdir(),`ieum-draft-context-${process.pid}`),server:{host:'127.0.0.1',port:0}})
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json'),{chromium}=require('playwright')
let browser
try{
  if(!process.env.IEUM_QA_URL)await server.listen()
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
  const page=await browser.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(()=>{if(!localStorage.getItem('ieum-v2:user-state:v7'))localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor',mainKeyLocked:true}))})
  await page.route('**/demo-stems/manifest.json',route=>route.fulfill({json:{tracks:[]}}))
  const base=process.env.IEUM_QA_URL || `http://127.0.0.1:${server.httpServer.address().port}`
  await page.goto(`${base.replace(/\/$/,'')}/?design=figma`)
  await page.waitForSelector('[data-action="record-part"]')
  for(const context of [{projectId:'another-project',partId:'tenor'},{projectId:'ieum-thousand-years-v7',partId:'alto'},{projectId:'ieum-thousand-years-v7',partId:'tenor',userId:'another-user'}]){
    await page.evaluate(async context=>{
      const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('ieum-v2-records',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})
      try{await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').put({id:'jisun:ieum-thousand-years-v7:tenor:temporary-recording',...context,kind:'temporary-recording',userId:context.userId || 'jisun',blob:new Blob(['original wrong-context fixture'],{type:'audio/webm'}),duration:7});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}finally{db.close()}
    },context)
    await page.locator('[data-action="record-part"]').click()
    await page.waitForSelector('[data-action="draft-restore-retry"]')
    assert.equal(await page.locator('[data-action="record-start"]').isDisabled(),true)
    assert.equal(await page.locator('[data-action="record-submit"]').count(),0)
    await page.locator('[data-action="draft-restore-retry"]').click()
    await page.waitForSelector('[data-action="draft-restore-retry"]')
    assert.equal(await page.locator('[data-action="record-start"]').isDisabled(),true)
    const stored=await page.evaluate(async()=>{
      const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)})
      try{const value=await new Promise(resolve=>{const r=db.transaction('tracks','readonly').objectStore('tracks').get('jisun:ieum-thousand-years-v7:tenor:temporary-recording');r.onsuccess=()=>resolve(r.result)});return {projectId:value.projectId,partId:value.partId,bytes:await value.blob.text(),submitted:Object.keys(window.__IEUM_V2__.state.projectTracks).length}}finally{db.close()}
    })
    assert.deepEqual(stored,{projectId:context.projectId,partId:context.partId,bytes:'original wrong-context fixture',submitted:0})
    await page.locator('.recording-screen .topbar button').click()
    await page.waitForSelector('[data-action="record-part"]')
  }
  assert.deepEqual(errors,[])
  console.log('PASS native existing App/IndexedDB: mismatched Project and Part cannot enter Review/start/submit; retry and back preserve original bytes and zero submitted Tracks. Isolated fixture, no microphone/audio/design acceptance.')
}finally{await browser?.close();await server.close()}
