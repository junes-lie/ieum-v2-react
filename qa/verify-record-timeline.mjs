import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {createHash} from 'node:crypto'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const url=process.env.IEUM_QA_URL || 'http://127.0.0.1:4191/?design=figma'
const errors=[]
try{
 const context=await browser.newContext({viewport:{width:430,height:932},permissions:['microphone']})
 await context.addInitScript(()=>localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'})))
 const page=await context.newPage()
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
 await page.goto(url);await page.waitForSelector('.record-particles[data-rotation]')
 const sample=()=>page.locator('.record-particles').first().evaluate(canvas=>({rotation:Number(canvas.dataset.rotation),rate:Number(canvas.dataset.angularRate),signature:canvas.closest('.record').dataset.recordSignature,time:performance.now()}))
 await page.waitForTimeout(800)
 const first=await sample();await page.waitForTimeout(1000);const second=await sample()
 const measuredRate=(second.rotation-first.rotation)/((second.time-first.time)/1000)
 assert.ok(Math.abs(measuredRate-Math.PI*2/30)<.035,'Rest must rotate in approximately 30 seconds')
 await page.locator('[data-action="record-part"]').click();await page.locator('[data-action="record-start"]').click();await page.waitForSelector('[data-action="record-pause"]');await page.waitForTimeout(800)
 const moving=await sample();await page.locator('[data-action="record-pause"]').click();const immediate=await sample()
 assert.ok(Math.abs(immediate.rotation-moving.rotation)<.12,'Pause must preserve current rotation, not jump to zero')
 await page.waitForTimeout(750);const stopped=await sample();assert.equal(stopped.rate,0)
 const beforeBreath=hash(await page.locator('.record-particles').screenshot());await page.waitForTimeout(800);const afterPause=await sample()
 assert.ok(Math.abs(afterPause.rotation-stopped.rotation)<.001,'Rotation must stop after 600ms deceleration')
 assert.notEqual(hash(await page.locator('.record-particles').screenshot()),beforeBreath,'Paused Record must retain subtle breathing')
 await page.locator('[data-action="record-resume"]').click();const resumed=await sample();assert.ok(Math.abs(resumed.rotation-afterPause.rotation)<.12,'Resume must preserve current rotation')
 await page.waitForTimeout(800);assert.ok((await sample()).rotation>resumed.rotation)
 const reduced=await browser.newContext({viewport:{width:430,height:932},reducedMotion:'reduce'}),quiet=await reduced.newPage()
 await quiet.goto(url);await quiet.waitForSelector('.record-particles[data-rotation]');await quiet.waitForTimeout(500)
 const quietRecord=quiet.locator('.record-particles').first(),quietFirst=hash(await quietRecord.screenshot());await quiet.waitForTimeout(1000)
 assert.equal(hash(await quietRecord.screenshot()),quietFirst,'Reduced motion must remain static')
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,measuredRestPeriodSeconds:Math.PI*2/measuredRate,pauseDeceleration:true,phasePreserved:true,breathing:true,reducedMotion:true,errors,limitation:'Isolated browser with synthetic microphone; no physical device acceptance.'},null,2))
}finally{await browser.close()}
