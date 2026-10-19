import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import songs from '../src/providedSamples.json' with {type:'json'}
import {recommendSampleSongs} from '../src/matching.js'
assert.equal(recommendSampleSongs({lowMidi:48,highMidi:67},songs)[0].song.id,songs[1].id)
assert.equal(recommendSampleSongs({lowMidi:60,highMidi:61},songs).some(item=>item.fit.eligible),false)
assert.equal(recommendSampleSongs(null,songs).some(item=>item.fit.eligible),false)
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const context=await browser.newContext(),page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4199/')
 await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state?.projectTracks||{}).length===2)
 const seedRange=async(lowMidi,highMidi)=>page.evaluate(async({lowMidi,highMidi})=>{
  const id='ieum-v2:voice-profile:v7',blob=await (await fetch('/demo-stems/soprano.wav')).blob()
  const db=await new Promise(resolve=>{const request=indexedDB.open('ieum-v2-records',1);request.onsuccess=()=>resolve(request.result)})
  await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite'),store=tx.objectStore('tracks');store.put({id:id+':range',projectId:id,kind:'voice-range',range:'QA measured fixture',rangeData:{lowMidi,highMidi}});store.put({id:id+':sample',projectId:id,kind:'voice-sample',blob,duration:7,songLabel:'Preserved sample'});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})
  db.close()
 },{lowMidi,highMidi})
 const openSample=async()=>{await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.sampleSong==='Preserved sample');await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'다시 등록',exact:true}).click();await page.waitForSelector('.sample-song-list')}
 await seedRange(48,67);await openSample()
 assert.equal(await page.locator('.sample-song-list button.active > span').textContent(),songs[1].title)
 assert.equal(await page.locator('[data-sample-fit="eligible"]').count(),1)
 assert.equal(await page.locator('.sample-select-stage audio').getAttribute('src'),songs[1].audioFile)
 await page.locator('.sample-song-list button').filter({has:page.getByText(songs[0].title,{exact:true})}).click()
 assert.equal(await page.locator('.sample-select-stage audio').getAttribute('src'),songs[0].audioFile,'Recommendation must not prevent manual selection')
 await page.locator('.voice-screen [data-action="back"]').click()
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile.sampleSong),'Preserved sample')
 await seedRange(60,61);await openSample()
 assert.equal(await page.locator('[data-sample-fit="eligible"]').count(),0)
 assert.match(await page.locator('.sample-select-stage').textContent(),/현재 측정 음역 안에 들어오는 제공 구간이 없어요/)
 assert.equal(await page.locator('.sample-song-list button').count(),songs.length)
 assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),2)
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.joined),false)
 assert.deepEqual(errors,[])
 console.log('PASS VP03 stored range recommendation, correct initial preview, manual choice, no eligible song warning, Profile/Track preservation. Range fixtures only; no singing-quality claim.')
 await context.close()
} finally {await browser.close()}
