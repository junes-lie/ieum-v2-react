import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {seedCreationProfile} from './project-profile-fixture.mjs'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
const url=process.env.IEUM_QA_URL || 'http://127.0.0.1:4199/'
const errors=[]
const open=async()=>{const context=await browser.newContext({permissions:['microphone'],viewport:{width:430,height:850}});const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(url);await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state?.projectTracks || {}).length===2);return {context,page}}
const protectedState=page=>page.evaluate(async()=>{const s=window.__IEUM_V2__.state,p=s.profile;return {range:p.rangeData,source:p.voiceSourceRevision,sample:p.sampleProvenance,identity:p.identity,hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await(await fetch(p.sampleUrl)).arrayBuffer()))].join(','),trackIds:Object.values(s.projectTracks).map(track=>track.id),signature:s.recordSignature,mix:s.mix,bookmarks:s.songSaves}})
const recordInitial=async page=>{await page.locator('[data-action="range-start"]').click();await page.waitForFunction(()=>Number(document.querySelector('[data-action="range-finish"]')?.textContent.match(/(\d+) samples/)?.[1])>=6);await page.locator('[data-action="range-finish"]').click();await page.locator('[data-action="sample-next"]').click();await page.locator('.sample-select-stage > button.primary').click();await page.locator('[data-action="sample-start"]').click();await page.waitForSelector('[data-action="sample-stop"]');await page.waitForTimeout(3400);await page.locator('[data-action="sample-stop"]').click();await page.waitForSelector('[data-action="voice-complete"]')}
try {
  const {context,page}=await open()
  await seedCreationProfile(page)
  await page.evaluate(()=>{const key='ieum-v2:user-state:v7',state=JSON.parse(localStorage.getItem(key));state.songSaves=[{songId:'city-of-stars',savedAt:'2026-10-12T00:00:00Z'}];localStorage.setItem(key,JSON.stringify(state))});await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile)
  const before=await protectedState(page)
  await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'선호 역할 · 장르 · 취향 수정'}).click()
  const melody=page.getByRole('button',{name:'메인 멜로디',exact:true})
  await melody.focus();await page.keyboard.press('Space');assert.equal(await melody.getAttribute('aria-pressed'),'true');await page.keyboard.press('Enter');assert.equal(await melody.getAttribute('aria-pressed'),'false')
  await page.getByRole('button',{name:'재즈',exact:true}).click()
  const search=page.getByLabel('곡명 또는 아티스트 검색')
  await search.fill('billie');assert.equal(await page.locator('.song-circle').count(),1)
  await page.getByRole('button',{name:'Ocean Eyes · Billie Eilish',exact:true}).click()
  await search.fill('ocean');assert.equal(await page.getByRole('button',{name:'Ocean Eyes · Billie Eilish',exact:true}).getAttribute('aria-pressed'),'true')
  await page.getByRole('button',{name:'Ocean Eyes 선택 해제',exact:true}).click();assert.equal(await page.locator('.preference-selected').count(),0)
  await search.fill('');await page.getByRole('button',{name:'저장곡에서 선택',exact:true}).click();assert.equal(await page.locator('.song-circle').count(),1);await page.getByRole('button',{name:'City of Stars · La La Land Cast',exact:true}).click();await page.getByRole('button',{name:'City of Stars 선택 해제',exact:true}).click()
  await page.getByRole('button',{name:'저장곡에서 선택',exact:true}).click();await page.getByRole('button',{name:'Ocean Eyes · Billie Eilish',exact:true}).click();await page.getByRole('button',{name:'City of Stars · La La Land Cast',exact:true}).click()
  for(const width of [430,320]){
    await page.setViewportSize({width,height:850})
    for(const scale of [1,2]){
      await page.evaluate(scale=>document.documentElement.style.fontSize=`${16*scale}px`,scale)
      assert.equal(await page.locator('.voice-preference-choices').evaluate(el=>el.scrollWidth<=el.clientWidth),true,`${width}px/${scale}x no overflow`)
      const layout=await page.locator('.preference-circle').evaluateAll(items=>items.map(item=>{const r=item.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,overflow:item.scrollWidth>item.clientWidth+1||item.scrollHeight>item.clientHeight+1}}))
      for(const [i,a] of layout.entries()){assert.ok(a.width>=44&&a.height>=44);assert.equal(a.overflow,false,'Circle labels must not clip');for(const b of layout.slice(i+1))assert.equal(a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y,false,'Selection circles must not overlap')}
    }
  }
  await page.evaluate(()=>document.documentElement.style.fontSize='');await page.setViewportSize({width:430,height:850})
  const roleSizes=await page.locator('.role-circle').evaluateAll(items=>items.map(item=>item.getBoundingClientRect().width));assert.equal(roleSizes[0],roleSizes[1],'Role circles have equal sizes')
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.role-circle').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');await page.emulateMedia({reducedMotion:'no-preference'})
  if(process.env.IEUM_QA_SCREENSHOT)await page.screenshot({path:process.env.IEUM_QA_SCREENSHOT,fullPage:true})
  await page.locator('.profile-preferences').getByRole('button',{name:'취소',exact:true}).click();assert.deepEqual(await protectedState(page),before)
  await page.getByRole('button',{name:'선호 역할 · 장르 · 취향 수정'}).click();assert.equal(await page.locator('.preference-circle[aria-pressed=true]').count(),0)
  await page.getByRole('button',{name:'화음·코러스',exact:true}).click();await page.getByRole('button',{name:'Ocean Eyes · Billie Eilish',exact:true}).click()
  await page.locator('.profile-preferences').getByRole('button',{name:'변경 저장',exact:true}).click();await page.waitForFunction(()=>window.__IEUM_V2__.state.profile.preferredSongIds?.[0]==='ocean-eyes');await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state.profile?.preferredSongIds?.[0]==='ocean-eyes')
  assert.deepEqual(await protectedState(page),before)
  await page.locator('[data-nav="user"]').click();await page.getByRole('button',{name:'선호 역할 · 장르 · 취향 수정'}).click();assert.equal(await page.getByRole('button',{name:'화음·코러스',exact:true}).getAttribute('aria-pressed'),'true')
  await page.getByRole('button',{name:'화음·코러스',exact:true}).click();await page.getByRole('button',{name:'Ocean Eyes · Billie Eilish',exact:true}).click();await page.locator('.profile-preferences').getByRole('button',{name:'변경 저장',exact:true}).click();await page.waitForFunction(()=>window.__IEUM_V2__.state.profile.roles.length===0&&window.__IEUM_V2__.state.profile.preferredSongIds.length===0)
  await page.locator('[data-nav="home"]').click();await page.locator('.project-feature').click();await page.locator('.part-list [data-part="bass"] button.row-action').click();assert.equal(await page.locator('[data-action="join-part"]').isEnabled(),true,'Unset preferences must not prevent an otherwise range-eligible participation')
  await context.close()
  for(const skip of [false,true]){
    const {context,page}=await open()
    if(skip)await page.evaluate(async()=>{const id='ieum-v2:voice-profile:v7',db=await new Promise(resolve=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result)});await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').put({id:id+':preferences',projectId:id,kind:'voice-preferences',preferences:{roles:['화음·코러스'],genres:['재즈'],taste:[],preferredSongIds:['city-of-stars']}});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});db.close()})
    await page.locator('.project-feature').click();await page.locator('.part-list [data-part="bass"] button.row-action').click();await page.locator('[data-action="voice-setup"]').click();await recordInitial(page)
    if(!skip){await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;window.qaFailInitialSample=true;IDBObjectStore.prototype.put=function(value,...args){if(value.kind==='voice-sample'&&window.qaFailInitialSample)throw new Error('QA initial Sample failure');return put.call(this,value,...args)}});const take=await page.locator('.sample-stage audio').getAttribute('src');await page.locator('[data-action="voice-complete"]').click();await page.waitForSelector('.voice-screen [role="alert"]');assert.equal(await page.locator('.voice-preferences-stage').count(),0);assert.equal(await page.locator('.sample-stage audio').getAttribute('src'),take);assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile),null);await page.evaluate(()=>window.qaFailInitialSample=false)}
    await page.locator('[data-action="voice-complete"]').click();await page.waitForSelector('.voice-preferences-stage')
    const baseline=await protectedState(page)
    await page.getByRole('button',{name:'메인 멜로디',exact:true}).click();await page.getByRole('button',{name:'Love Poem · IU',exact:true}).click()
    await page.locator('.voice-screen [data-action="back"]').click();assert.equal(await page.locator('.sample-stage audio').getAttribute('src'),await page.evaluate(()=>window.__IEUM_V2__.state.profile.sampleUrl));await page.locator('[data-action="voice-complete"]').click()
    assert.equal(await page.getByRole('button',{name:'메인 멜로디',exact:true}).getAttribute('aria-pressed'),'true','Back/reentry retains pending choices')
    if(skip){await page.locator('[data-action="preferences-skip"]').click();assert.deepEqual(await page.evaluate(()=>window.__IEUM_V2__.state.profile.roles),['화음·코러스']);assert.deepEqual(await page.evaluate(()=>window.__IEUM_V2__.state.profile.preferredSongIds),['city-of-stars'])}else{
      await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;window.qaFailPreference=true;IDBObjectStore.prototype.put=function(value,...args){if(value.kind==='voice-preferences'&&window.qaFailPreference)throw new Error('QA preference failure');return put.call(this,value,...args)}})
      await page.locator('[data-action="preferences-continue"]').click();await page.waitForSelector('.voice-screen [role="alert"]');assert.deepEqual(await protectedState(page),baseline);assert.equal(await page.getByRole('button',{name:'메인 멜로디',exact:true}).getAttribute('aria-pressed'),'true')
      await page.evaluate(()=>window.qaFailPreference=false);await page.locator('[data-action="preferences-continue"]').click();await page.waitForSelector('.voice-complete-stage');assert.deepEqual(await page.evaluate(()=>window.__IEUM_V2__.state.profile.preferredSongIds),['love-poem'])
    }
    await page.locator('[data-action="profile-finish"]').click();await page.waitForSelector('.detail-screen');assert.match(await page.locator('[data-testid="part-fit"] .kicker').textContent(),/Bass/);assert.deepEqual(await protectedState(page),baseline);assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.joined),false)
    await context.close()
  }
  assert.deepEqual(errors,[])
  console.log('PASS circular preferences: keyboard, 320/430px +200% text, search/select/remove, save/cancel/reload, Bookmark/identity/Track/Mix independence, unset participation, VP05A saved Sample/back/failed-save retry/save-or-skip → same Part. Isolated fixtures and synthetic microphone; no physical listening claim.')
} finally {await browser.close()}
