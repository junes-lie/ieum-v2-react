import assert from 'node:assert/strict'
import {seedCreationProfile} from './project-profile-fixture.mjs'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try{
 const context=await browser.newContext(),page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await context.addInitScript(()=>localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({songSaves:[{songId:'a-thousand-years'},{songId:'ocean-eyes'}]})))
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/')
 await seedCreationProfile(page)
 await page.locator('[data-nav="bookmark"]').click();await page.locator('[data-action="collection-tab-songs"]').click()
 await page.locator('[data-action="open-song-save"]').first().click();await page.locator('[data-action="create-project-for-song"]').click()
 await page.waitForSelector('.owner-part-field')
 await page.locator('[data-nav="user"]').click();await page.locator('[data-nav="bookmark"]').click()
 await page.locator('[data-action="open-song-save"]').nth(1).click();await page.locator('[data-action="create-project-for-song"]').click()
 await page.waitForSelector('.owner-part-field')
 for(let i=0;i<4;i++)await page.goBack()
 await page.waitForSelector('.owner-part-field');await page.getByRole('button',{name:'프로젝트 확인',exact:true}).click()
 assert.match(await page.locator('.create-project-screen .result-block h1').textContent(),/A Thousand Years/,'Earlier song-based creation must not inherit the later song')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.createdProjects.length),0)
 for(let i=0;i<4;i++)await page.goForward()
 await page.waitForSelector('.owner-part-field');await page.getByRole('button',{name:'프로젝트 확인',exact:true}).click()
 assert.match(await page.locator('.create-project-screen .result-block h1').textContent(),/Ocean Eyes/)
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.createdProjects.length),0)
 await page.locator('[data-action="confirm-project-create"]').click();await page.waitForSelector('.workspace-screen')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.createdProjects[0].songId),'ocean-eyes')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.createdProjects.length),1)
 assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks).length),0)
 assert.deepEqual(errors,[])
 console.log('PASS song-based Project Back/Forward selects the correct song; final confirmation creates one Project with zero Tracks.')
 await context.close()
}finally{await browser.close()}
