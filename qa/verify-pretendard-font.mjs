import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
try {
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage()
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4191/?design=figma')
 await page.waitForSelector('.workspace-screen')
 for(const element of await page.locator('.workspace-screen,.track-person span,.track-person button,.track-status').all()){assert.ok(await element.evaluate(el=>getComputedStyle(el).fontFamily.split(',')[0].includes('Pretendard IEUM')),'Workspace body and Track participant/status must prefer Pretendard')}
 const weights=await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=900;canvas.height=100
  const ctx=canvas.getContext('2d'),results=[]
  for(const weight of [400,500,600,700]){
   const font=`${weight} 40px "Pretendard IEUM"`
   const faces=await document.fonts.load(font,'함께한 목소리 JISUN')
   if(!faces.length)throw new Error('Pretendard face did not load')
   ctx.clearRect(0,0,canvas.width,canvas.height);ctx.font=font;ctx.fillText('함께한 목소리 JISUN',5,60)
   const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data
   const digest=await crypto.subtle.digest('SHA-256',pixels)
   results.push({weight,sha256:[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')})
  }
  return results
 })
 assert.equal(new Set(weights.map(row=>row.sha256)).size,4,'Pretendard 400/500/600/700 must have distinct real rendered weights')
 console.log(JSON.stringify({passed:true,weights,limits:'Isolated browser font rendering; no physical device claim.'}))
 await context.close()
}finally{await browser.close()}
