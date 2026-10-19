import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {openProjectRangeAvailability} from '../src/matching.js'
const range={lowMidi:48,highMidi:67}
const available={parts:[{status:'open',range:'C3–G4'}]}
assert.deepEqual(openProjectRangeAvailability(range,[available,{parts:[{status:'open'}]},{parts:[{status:'open',range:'C4–C5'}]},{parts:[{status:'submitted',range:'C3–G4'}]},{parts:[{status:'open',participantId:'someone',range:'C3–G4'}]}]),{matchingProjects:1,unverifiedProjects:1})
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const context=await browser.newContext(),page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await context.addInitScript(()=>localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({createdProjects:[{id:'qa-home-availability',seed:'qa-home',songId:'ocean-eyes',title:'Ocean Eyes',name:'QA Home',partCount:2,ownerPartId:'owner',key:'C major',status:'RECRUITING',progress:0,parts:[{id:'owner',name:'Owner',participantId:'jisun',status:'ready',range:'C3–G4'},{id:'open',name:'Open',status:'open',range:'C3–G4'}]}]})))
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4199/')
 await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state?.projectTracks||{}).length===2)
 assert.match(await page.locator('.for-you .song-row').first().textContent(),/관련 프로젝트 · 3/)
 await page.evaluate(async()=>{
  const id='ieum-v2:voice-profile:v7',blob=await (await fetch('/demo-stems/soprano.wav')).blob()
  const db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)})
  await new Promise(resolve=>{const tx=db.transaction('tracks','readwrite'),s=tx.objectStore('tracks');s.put({id:id+':range',projectId:id,kind:'voice-range',range:'C3–G4',rangeData:{lowMidi:48,highMidi:67}});s.put({id:id+':sample',projectId:id,kind:'voice-sample',blob,duration:7,songLabel:'QA existing sample'});tx.oncomplete=resolve});db.close()
 })
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile)
 assert.match(await page.locator('.for-you .song-row').first().textContent(),/음역 확인된 OPEN Project · 1 · 음역 미확인 2/)
 assert.match(await page.locator('.for-you .song-row').last().textContent(),/음역 확인된 OPEN Project · 0 · 음역 미확인 1/)
 assert.equal(await page.locator('.for-you').getByText('참여 가능한 OPEN Part · 2',{exact:true}).count(),0)
 await page.locator('.for-you .song-row').first().click()
 await page.waitForSelector('.detail-screen')
 assert.equal(await page.locator('.song-identity h1').textContent(),'Ocean Eyes')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.joined),false)
 assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),2)
 assert.deepEqual(errors,[])
 console.log('PASS Home counts registered eligible OPEN Projects, distinguishes missing ranges, includes current projects, keeps Song Detail/navigation/Track state. Fixture metadata only.')
 await context.close()
} finally {await browser.close()}
