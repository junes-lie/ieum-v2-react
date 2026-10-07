import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const context=await browser.newContext(),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await context.addInitScript(()=>{
  const project={id:'qa-finder-empty',seed:'qa-finder',songId:'a-thousand-years',title:'Finder QA',name:'Finder QA',partCount:2,ownerPartId:'free-0',key:'C major',status:'RECORDING',progress:0,parts:[{id:'free-0',name:'Voice 1',participantId:'jisun',participant:'JISUN',status:'ready',range:'C3–E4'},{id:'free-1',name:'Tenor',status:'open',range:'E3–E4'}]}
  localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,activeCreatedProjectId:project.id,createdProjects:[project]}))
 })
 const url=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4193/');url.searchParams.set('design','figma')
 await page.goto(url.href)
 await page.getByRole('button',{name:'보컬 찾기',exact:true}).click()
 await page.waitForSelector('.finder-screen')
 await page.getByRole('button',{name:'음역 적합순',exact:true}).click()
 const names=await page.locator('.candidate-open > span > strong').allTextContents()
 assert.deepEqual(names,['Joon','Noa','Min','Luna'],'Range sorting must follow actual range margins without role preference overriding it')
 await page.getByRole('button',{name:'역할 보완순',exact:true}).click()
 assert.equal(await page.locator('.candidate-open > span > strong').first().textContent(),'Min')
 await page.getByRole('button',{name:'음역 적합순',exact:true}).click()
 await page.locator('[data-action="candidate"]').first().click()
 await page.locator('[data-action="back"]').click()
 assert.equal(await page.locator('.sort-row button.active').textContent(),'음역 적합순')
 assert.deepEqual(await page.locator('.candidate-open > span > strong').allTextContents(),names)
 const state=await page.evaluate(()=>window.__IEUM_V2__.state)
 assert.equal(state.activeProject.parts.filter(p=>p.participantId).length,1)
 assert.equal(Object.keys(state.activeTracks).length,0)
 await page.locator('.finder-screen [data-action="back"]').click();await page.waitForSelector('.workspace-screen')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeProject.id),'qa-finder-empty')
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,rangeSortUsesRange:true,roleSortUsesRole:true,detailBackPreservesSort:true,noAssignmentOrTrack:true,backToSameProject:true,errors,limits:'Isolated fixture; no measured recommendation or shared server claim.'}))
 await context.close()
}finally{await browser.close()}
