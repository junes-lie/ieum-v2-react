import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 for(const failure of ['read','write','invalid']) {
  const context=await browser.newContext(),page=await context.newPage(),errors=[]
  await context.addInitScript(failure=>{
   localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor',projectLikes:[{projectId:'ieum-thousand-years-v7'}],songSaves:[{songId:'a-thousand-years'}]}))
   if(failure==='invalid'){sessionStorage.setItem('ieum:collection-tab','unknown');sessionStorage.setItem('ieum:project-filter','unknown')}
   const get=Storage.prototype.getItem,set=Storage.prototype.setItem
   Storage.prototype.getItem=function(...args){if(this===sessionStorage&&failure==='read')throw new DOMException('QA session cache read blocked','SecurityError');return get.apply(this,args)}
   Storage.prototype.setItem=function(...args){if(this===sessionStorage&&failure==='write')throw new DOMException('QA session cache quota','QuotaExceededError');return set.apply(this,args)}
  },failure)
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/')
  await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state?.projectTracks||{}).length===2)
  const before=await page.evaluate(()=>({joined:window.__IEUM_V2__.state.joined,tracks:Object.keys(window.__IEUM_V2__.state.projectTracks).length,saves:window.__IEUM_V2__.state.songSaves.length}))
  await page.locator('[data-nav="bookmark"]').click()
  await page.waitForTimeout(100)
  assert.deepEqual(errors,[],`${failure}: navigation cache must not crash the app`)
  assert.equal(await page.locator('[data-action="collection-tab-projects"]').getAttribute('aria-selected'),'true')
  await page.locator('[data-action="collection-tab-songs"]').click();await page.waitForSelector('[data-action="open-song-save"]')
  await page.locator('[data-action="open-song-save"]').click();await page.waitForSelector('.detail-screen')
  await page.locator('[data-action="back"]').click();await page.waitForSelector('.collection-summary')
  await page.locator('[data-nav="folder"]').click()
  await page.waitForSelector('[data-action="resume-project"]')
  await page.getByRole('button',{name:'모집',exact:true}).click();await page.waitForSelector('[data-action="reset-project-filter"]')
  await page.locator('[data-action="reset-project-filter"]').click();await page.waitForSelector('[data-action="resume-project"]')
  const after=await page.evaluate(()=>({joined:window.__IEUM_V2__.state.joined,tracks:Object.keys(window.__IEUM_V2__.state.projectTracks).length,saves:window.__IEUM_V2__.state.songSaves.length}))
  assert.deepEqual(after,before);assert.deepEqual(errors,[])
  console.log(JSON.stringify({passed:true,failure,navigationAndFiltersUsable:true,participationTracksSavesPreserved:true,errors,limits:'Isolated session cache errors; no server or physical device acceptance'}))
  await context.close()
 }
} finally {await browser.close()}
