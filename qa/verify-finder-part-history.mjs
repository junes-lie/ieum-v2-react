import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 for(const otherProject of [false,true]) {
 const context=await browser.newContext(),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await context.addInitScript(otherProject=>{
  const project={id:'qa-finder-parts',seed:'qa-finder-parts',songId:'a-thousand-years',title:'QA',name:'QA',partCount:3,ownerPartId:'owner',key:'C major',status:'RECORDING',parts:[{id:'owner',name:'Voice 1',participantId:'jisun',participant:'JISUN',status:'ready',range:'C3–E4'},{id:'tenor',name:'Tenor',status:'open',range:'E3–E4'},{id:'alto',name:'Alto',status:'open',range:'E3–E4'}]}
  const projects=otherProject?[project,{...project,id:'qa-finder-other',seed:'qa-other-seed',name:'Other QA'}]:[project]
  localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,activeCreatedProjectId:project.id,createdProjects:projects}))
 },otherProject)
 const url=new URL(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/');url.searchParams.set('design','figma')
 await page.goto(url.href)
 await page.getByRole('button',{name:'보컬 찾기',exact:true}).first().click()
 await page.waitForSelector('.finder-screen')
 assert.match(await page.locator('.finder-screen h1').textContent(),/^Tenor/)
 await page.locator('[data-nav="user"]').click()
 await page.locator('[data-nav="folder"]').click()
 await page.locator('[data-action="open-created-project"]').nth(otherProject?1:0).click()
 await page.getByRole('button',{name:'보컬 찾기',exact:true}).last().click()
 await page.waitForSelector('.finder-screen')
 assert.match(await page.locator('.finder-screen h1').textContent(),/^Alto/)
 for(let i=0;i<4;i++)await page.goBack()
 await page.waitForSelector('.finder-screen')
 assert.match(await page.locator('.finder-screen h1').textContent(),/^Tenor/)
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeProject.id),'qa-finder-parts')
 for(let i=0;i<4;i++)await page.goForward()
 await page.waitForSelector('.finder-screen')
 assert.match(await page.locator('.finder-screen h1').textContent(),/^Alto/,'Forward must restore the latest Finder Part even before leaving that entry')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.activeProject.id),otherProject?'qa-finder-other':'qa-finder-parts')
 assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks).length),0)
 assert.deepEqual(errors,[])
 console.log(`PASS ${otherProject?'different Projects':'same Project'} Part Finder Back/Forward retains Project/Part and zero submitted Tracks; isolated local fixture`)
 await context.close()
 }
}finally{await browser.close()}
