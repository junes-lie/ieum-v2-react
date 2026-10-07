import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const results=[]
 for(const count of [2,3,4]) {
  const context=await browser.newContext(),page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4193/')
  await page.waitForSelector('[data-action="create-project"]');await page.locator('[data-action="create-project"]').click()
  await page.getByRole('button',{name:'Part 구성하기',exact:true}).click()
  await page.locator('.choice-grid button').filter({hasText:String(count)}).click()
  await page.locator('.field-label select').selectOption('E minor')
  await page.getByRole('button',{name:'프로젝트 확인',exact:true}).click()
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.createdProjects.length),0,'Final review must not create a project')
  {
   await page.locator('.create-project-screen [data-action="back"]').click()
   assert.equal(await page.locator('.owner-part-field').count(),1,'Review Back must return to setup with its values')
   assert.equal(await page.locator('.field-label select').inputValue(),'E minor')
   assert.equal(await page.locator('.choice-grid button.active').textContent(),String(count)+'PARTS')
   await page.getByRole('button',{name:'프로젝트 확인',exact:true}).click()
  }
  await page.evaluate(()=>{const button=document.querySelector('[data-action="confirm-project-create"]');button.click();button.click()})
  await page.waitForSelector('.workspace-screen')
  const result=await page.evaluate(()=>({projects:window.__IEUM_V2__.state.createdProjects,trackCount:Object.keys(window.__IEUM_V2__.state.activeTracks).length}))
  assert.equal(result.projects.length,1,'Same-time confirm clicks must create exactly one project')
  const project=result.projects[0];assert.equal(project.partCount,count);assert.equal(project.key,'E minor');assert.equal(project.progress,0);assert.equal(result.trackCount,0)
  assert.equal(project.parts.filter(part=>part.participantId==='jisun').length,1)
  assert.equal(project.parts.filter(part=>!part.participantId&&part.status==='open').length,count-1)
  await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.createdProjects.length===1)
  assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.createdProjects[0].id),project.id)
  assert.deepEqual(errors,[]);results.push({count,oneProject:true,reviewBeforeCreate:true,setupValuesPreserved:true,assignedOwnerAndOpenOthers:true,zeroTracks:true,reload:true,errors})
  await context.close()
 }
 console.log(JSON.stringify({passed:true,results,limits:'Isolated local project creation; no shared backend or other participant assignment claim.'}))
}finally{await browser.close()}
