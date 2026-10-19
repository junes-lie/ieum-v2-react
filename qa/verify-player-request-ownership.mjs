import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--autoplay-policy=no-user-gesture-required']})
try {
  const context=await browser.newContext(),page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await context.addInitScript(()=>{
    localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'}))
    const play=HTMLMediaElement.prototype.play
    window.qaHoldNextPlay=false
    HTMLMediaElement.prototype.play=function(...args){
      if(window.qaHoldNextPlay){window.qaHoldNextPlay=false;return new Promise((resolve,reject)=>{window.qaRejectOldPlay=reject})}
      return play.apply(this,args)
    }
  })
  await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4207/')
  await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state.projectTracks||{}).length===2)
  await page.locator('[data-nav="folder"]').click()
  await page.locator('[data-action="resume-project"]').click()
  await page.waitForSelector('#current-mix audio',{state:'attached'})
  const play=page.locator('#current-mix .play-btn')
  await page.evaluate(()=>{window.qaHoldNextPlay=true})
  await play.click()
  await page.waitForFunction(()=>typeof window.qaRejectOldPlay==='function')
  await play.click() // Cancel the outstanding request.
  await play.click() // Start a new, real native request.
  await page.waitForFunction(()=>document.querySelector('#current-mix audio')?.paused===false)
  await page.evaluate(()=>window.qaRejectOldPlay(new DOMException('Old cancelled playback','AbortError')))
  await page.waitForTimeout(200)
  assert.equal(await play.getAttribute('aria-label'),'일시정지','A stale rejected play must not cancel the new request')
  assert.equal(await page.locator('#current-mix audio').evaluate(audio=>audio.paused),false)
  await play.click()
  await page.evaluate(()=>{window.qaHoldNextPlay=true})
  await play.click()
  await page.evaluate(()=>window.qaRejectOldPlay(new DOMException('Current playback rejected','NotAllowedError')))
  await page.waitForFunction(()=>document.querySelector('#current-mix .play-btn')?.getAttribute('aria-label')==='재생')
  assert.equal(await page.locator('#current-mix audio').evaluate(audio=>audio.paused),true,'Current request failure must still stop the player')
  assert.deepEqual(errors,[])
  console.log('PASS stale play rejection preserves newer native playback; current rejection resets controls. Isolated browser, no physical listening claim.')
} finally {await browser.close()}
