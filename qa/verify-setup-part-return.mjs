import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try{
 const context=await browser.newContext({permissions:['microphone']}),page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await context.addInitScript(()=>{
  const get=Storage.prototype.getItem,set=Storage.prototype.setItem
  Storage.prototype.getItem=function(...args){if(this===sessionStorage)throw new DOMException('QA navigation cache unavailable','SecurityError');return get.apply(this,args)}
  Storage.prototype.setItem=function(...args){if(this===sessionStorage)throw new DOMException('QA navigation cache unavailable','SecurityError');return set.apply(this,args)}
 })
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/')
 await page.locator('.project-feature').click();await page.waitForSelector('.detail-screen')
 await page.locator('.part-list [data-part="bass"] button.row-action').click()
 assert.match(await page.locator('[data-testid="part-fit"] .kicker').textContent(),/Bass/)
 await page.locator('[data-action="voice-setup"]').click();await page.waitForSelector('[data-action="range-start"]')
 await page.locator('.voice-screen [data-action="back"]').click();await page.waitForSelector('.detail-screen')
 assert.match(await page.locator('[data-testid="part-fit"] .kicker').textContent(),/Bass/,'Setup cancellation must restore the actual selected Part even if session cache is unavailable')
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.joined),false)
 assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),2)
 await page.locator('[data-action="voice-setup"]').click();await page.locator('[data-action="range-start"]').click()
 await page.waitForFunction(()=>Number(document.querySelector('[data-action="range-finish"]')?.textContent.match(/(\d+) samples/)?.[1])>=6)
 await page.locator('[data-action="range-finish"]').click();await page.locator('[data-action="sample-next"]').click()
 await page.locator('.sample-select-stage > button.primary').click();await page.locator('[data-action="sample-start"]').click()
 await page.waitForSelector('[data-action="sample-stop"]');await page.waitForTimeout(3400)
 await page.locator('[data-action="sample-stop"]').click();await page.waitForSelector('[data-action="voice-complete"]')
 await page.locator('[data-action="voice-complete"]').click();await page.locator('[data-action="preferences-skip"]').click();await page.locator('[data-action="profile-finish"]').click()
 await page.waitForSelector('.detail-screen')
 assert.match(await page.locator('[data-testid="part-fit"] .kicker').textContent(),/Bass/,'Successful Profile Setup must return to the same Part for fit recheck')
 assert.equal(await page.locator('[data-action="join-part"]').count(),1)
 assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.joined),false,'Profile save must not automatically confirm participation')
 assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),2)
 assert.deepEqual(errors,[])
 console.log('PASS Setup cancel/save → original Bass Part and fit recheck with unavailable session cache; no automatic participation/Track. Synthetic microphone only.')
 await context.close()
}finally{await browser.close()}
