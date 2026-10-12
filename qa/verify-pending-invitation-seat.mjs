import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {seedCreationProfile} from './project-profile-fixture.mjs'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const context=await browser.newContext(),page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await context.addInitScript(()=>{
  if(localStorage.getItem('ieum-v2:user-state:v7'))return
  const project={id:'qa-pending-seat',seed:'qa-seat',songId:'ocean-eyes',title:'Ocean Eyes',name:'QA pending seat',key:'C major',partCount:2,ownerPartId:'mine',progress:0,status:'RECRUITING',parts:[{id:'mine',name:'Tenor',participantId:'jisun',participant:'JISUN',status:'ready',range:'C3–G4'},{id:'open',name:'Bass',participantId:null,status:'open',range:'E3–E4'}]}
  localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({activeCreatedProjectId:project.id,createdProjects:[project]}))
 })
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4199/')
 await seedCreationProfile(page)
 const availability=()=>page.locator('.for-you .song-row').first().textContent()
 assert.match(await availability(),/음역 확인된 OPEN Project · 1/)
 await page.locator('[data-nav="folder"]').click();await page.locator('[data-action="open-created-project"]').click()
 await page.getByRole('button',{name:'보컬 찾기',exact:true}).click()
 await page.locator('[data-action="candidate"]').first().click()
 const candidateName=await page.locator('.candidate-identity h1').textContent()
 await page.evaluate(()=>{const b=document.querySelector('[data-action="invite"]');b.click();b.click()})
 await page.waitForSelector('.workspace-screen')
 let snapshot=await page.evaluate(()=>window.__IEUM_V2__.state)
 let part=snapshot.activeProject.parts.find(item=>item.id==='open')
 assert.equal(part.status,'open');assert.equal(part.participantId,null)
 assert.equal(part.invitations.length,1);assert.equal(part.invitations[0].vocalName,candidateName)
 assert.equal(Object.keys(snapshot.activeTracks).length,0);assert.equal(snapshot.activeMix==null,true)
 assert.match(await page.locator('[data-invite-state="sent"]').textContent(),/1명 수락 대기/)
 assert.match(await page.locator('.workspace-track-row').last().textContent(),/OPEN/)
 await page.locator('[data-nav="home"]').click()
 assert.match(await availability(),/음역 확인된 OPEN Project · 1/,'Pending invitation must not remove an OPEN Project')
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile)
 assert.match(await availability(),/음역 확인된 OPEN Project · 1/)
 await page.locator('[data-nav="folder"]').click();await page.locator('[data-action="open-created-project"]').click()
 await page.getByRole('button',{name:'다른 보컬 찾기',exact:true}).click()
 await page.locator('[data-action="candidate"]').first().click()
 assert.equal(await page.locator('[data-action="invite"]').isDisabled(),true)
 await page.locator('[data-action="back"]').click()
 await page.locator('[data-action="candidate"]').nth(1).click();await page.locator('[data-action="invite"]').click()
 await page.waitForSelector('.workspace-screen')
 snapshot=await page.evaluate(()=>window.__IEUM_V2__.state);part=snapshot.activeProject.parts.find(item=>item.id==='open')
 assert.equal(part.invitations.length,2);assert.equal(part.status,'open');assert.equal(part.participantId,null)
 assert.equal(snapshot.activeProject.parts.filter(item=>item.participantId).length,1)
 assert.equal(Object.keys(snapshot.activeTracks).length,0);assert.equal(snapshot.activeMix==null,true)
 assert.deepEqual(errors,[])
 const originals={seed:snapshot.activeProject.seed,invitations:part.invitations}
 // Previous app versions persisted pending seats as invited. Preserve invitations
 // and normalize only an unassigned pending seat, never an accepted participant.
 await page.evaluate(()=>{
  const key='ieum-v2:user-state:v7',state=JSON.parse(localStorage.getItem(key))
  state.createdProjects[0].parts.find(part=>part.id==='open').status='invited'
  localStorage.setItem(key,JSON.stringify(state))
 })
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.createdProjects.length===1)
 snapshot=await page.evaluate(()=>window.__IEUM_V2__.state)
 part=snapshot.createdProjects[0].parts.find(item=>item.id==='open')
 assert.equal(part.status,'open');assert.equal(part.participantId,null)
 assert.deepEqual(part.invitations,originals.invitations)
 assert.equal(snapshot.createdProjects[0].seed,originals.seed)
 assert.equal(Object.keys(snapshot.activeTracks).length,0)
 await page.evaluate(()=>{
  const key='ieum-v2:user-state:v7',state=JSON.parse(localStorage.getItem(key))
  state.createdProjects[0].parts.find(part=>part.id==='open').range='C5–C6'
  localStorage.setItem(key,JSON.stringify(state))
 })
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.createdProjects.length===1)
 await page.evaluate(()=>{
  const state={...history.state,ieumScreen:'finder',finderPartId:'open',selectedMatchVocalId:'luna'}
  history.pushState(state,'','#finder');dispatchEvent(new PopStateEvent('popstate',{state}))
 })
 await page.waitForSelector('.candidate-screen')
 assert.equal(await page.locator('[data-action="invite"]').isDisabled(),true,'A stale candidate must pass the current Part Gate')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeProject.parts.find(part=>part.id==='open').invitations.length),2)
 await page.evaluate(()=>{
  const key='ieum-v2:user-state:v7',state=JSON.parse(localStorage.getItem(key))
  Object.assign(state.createdProjects[0].parts.find(part=>part.id==='open'),{status:'accepted',participantId:'luna',participant:'Luna'})
  localStorage.setItem(key,JSON.stringify(state))
 })
 await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.createdProjects.length===1)
 await page.evaluate(()=>{const state={...history.state,ieumScreen:'finder',finderPartId:'open',selectedMatchVocalId:'min'};history.pushState(state,'','#finder');dispatchEvent(new PopStateEvent('popstate',{state}))})
 await page.waitForSelector('.candidate-screen')
 assert.equal(await page.locator('[data-action="invite"]').count(),0,'An assigned seat cannot receive new invitations')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeProject.parts.find(part=>part.id==='open').status),'accepted')
 await context.close()
 // A read-only visitor may browse candidates, but cannot send an invitation.
 const visitor=await browser.newContext(),visitorPage=await visitor.newPage()
 await visitorPage.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4199/')
 await visitorPage.locator('[data-nav="folder"]').click()
 // Main demo Workspace can also be reached through history without joining.
 await visitorPage.evaluate(()=>{history.pushState({ieumScreen:'workspace'},'','#workspace');dispatchEvent(new PopStateEvent('popstate',{state:history.state}))})
 await visitorPage.waitForSelector('.workspace-screen')
 await visitorPage.getByRole('button',{name:'보컬 찾기',exact:true}).click()
 await visitorPage.locator('[data-action="candidate"]').first().click()
 assert.equal(await visitorPage.locator('[data-action="invite"]').count(),0)
 assert.equal(await visitorPage.evaluate(()=>window.__IEUM_V2__.state.invited),false)
 await visitor.close()
 console.log('PASS invitation keeps OPEN/unassigned seat across duplicate clicks, different candidates, Home counts and reload; no Track/Mix increment; unjoined visitor has no send action. Local demo only; no real acceptance/concurrency claim.')
} finally {await browser.close()}
