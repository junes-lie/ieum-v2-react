import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const results=[]
 for(const type of ['NotAllowedError','NotReadableError']){
  const context=await browser.newContext({viewport:{width:390,height:844}})
  await context.addInitScript(type=>{
   localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'}))
   navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('QA microphone error',type)}
  },type)
  const page=await context.newPage()
  await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4191/?design=figma')
  await page.waitForSelector('[data-action="record-part"]');await page.locator('[data-action="record-part"]').click()
  await page.locator('[data-action="record-start"]').click();await page.waitForSelector('.permission-error')
  const denied=type==='NotAllowedError'
  assert.equal(await page.locator('.permission-error ol').count(),denied?1:0,'Permission steps must only appear for a permission refusal')
  assert.equal(await page.locator('.permission-error button').textContent(),denied?'설정 확인 후 다시 요청':'다시 시도')
  if(!denied)assert.equal(await page.locator('.permission-error strong').textContent(),'마이크를 시작하지 못했어요.')
  assert.equal(await page.locator('.recording-screen').getAttribute('data-recording-status'),'ready')
  assert.equal(await page.locator('[data-action="record-submit"]').count(),0)
  results.push({type,permissionInstructions:denied,noFalseRecording:true});await context.close()
 }
 console.log(JSON.stringify({passed:true,results,limits:'Injected isolated API errors; no physical microphone claim.'}))
}finally{await browser.close()}
