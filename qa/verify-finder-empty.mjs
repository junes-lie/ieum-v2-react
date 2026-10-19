import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const context=await browser.newContext(),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await context.addInitScript(()=>{
  const project={id:'qa-finder-empty',seed:'qa-finder',songId:'a-thousand-years',title:'Finder QA',name:'Finder QA',partCount:2,ownerPartId:'free-0',key:'C major',status:'RECORDING',progress:0,parts:[{id:'free-0',name:'Voice 1',participantId:'jisun',participant:'JISUN',status:'ready',range:'C3–E4'},{id:'free-1',name:'Voice 2',status:'open',range:'C3–E4'}]}
  localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,activeCreatedProjectId:project.id,createdProjects:[project]}))
 })
 const url=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4193/');url.searchParams.set('design','figma')
 await page.goto(url.href)
 await page.getByRole('button',{name:'보컬 찾기',exact:true}).click()
 await page.waitForSelector('.finder-screen')
 const count=await page.locator('[data-action="candidate"]').count();assert.ok(count>0)
 await page.getByRole('button',{name:'필터',exact:true}).click()
 await page.locator('.finder-filters input').check()
 assert.equal(await page.locator('[data-action="candidate"]').count(),0)
 assert.equal(await page.getByText('이 조건에 맞는 보컬이 없어요. 필터를 바꿔 다시 찾아보세요.',{exact:true}).count(),1,'Empty Finder must explain the condition and offer reset')
 await page.locator('[data-action="reset-finder"]').click()
 assert.equal(await page.locator('[data-action="candidate"]').count(),count)
 assert.equal(await page.locator('.finder-filters input').isChecked(),false)
 const state=await page.evaluate(()=>window.__IEUM_V2__.state)
 assert.equal(state.activeProject.parts.filter(p=>p.participantId).length,1)
 assert.equal(state.activeProject.parts.find(p=>p.id==='free-1').status,'open')
 assert.equal(Object.keys(state.activeTracks).length,0)
 await page.locator('.finder-screen [data-action="back"]').click();await page.waitForSelector('.workspace-screen')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeProject.id),'qa-finder-empty')
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,emptyExplanation:true,resetRestoresCandidates:true,noAssignmentOrTrack:true,backToSameProject:true,errors,limits:'Isolated fixture; no measured recommendation or shared server claim.'}))
 await context.close()
}finally{await browser.close()}
