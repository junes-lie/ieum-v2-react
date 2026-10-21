import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4201'
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4201','--strictPort'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',code=>reject(Error('Vite '+code)))})
}
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-focus-clearance'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
try{
 for(const width of [390,430,1100]){
  const context=await browser.newContext({viewport:{width,height:932},reducedMotion:'reduce',locale:'ko-KR'}),page=await context.newPage()
  for(const [scene,selector]of [['profile-ready','.v2-project-action'],['search','.search-v2-result'],['workspace','.current-mix input[type="range"]']]){
   await page.goto(base+'/?scene='+scene)
   const target=page.locator(selector).last();await target.waitFor()
   await page.waitForFunction(()=>!!window.__IEUM_V2__?.state.projectTracks.soprano)
   if(scene==='workspace')await page.waitForFunction(()=>document.querySelector('.workspace-v2-screen audio')?.duration>0)
   await page.evaluate(()=>document.fonts.ready)
   await target.waitFor({state:'visible'})
   await target.evaluate(n=>{const nodes=[...document.querySelectorAll('.screen button,.screen input,.screen a,.screen select,.screen textarea')].filter(e=>!e.disabled&&e.tabIndex>=0&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');const i=nodes.indexOf(n);if(i<1)throw Error('Expected an enabled target after a preceding focusable control');nodes[i-1].focus({preventScroll:true});document.querySelector('.screen').scrollTo(0,0);scrollTo(0,0)})
   await page.keyboard.press('Tab');await page.waitForTimeout(500)
   const result=await target.evaluate(n=>{const r=n.getBoundingClientRect(),nav=document.querySelector('.bottom-nav').getBoundingClientRect();return {focused:n===document.activeElement,top:r.top,bottom:r.bottom,footerTop:nav.top,visible:r.top>=0&&r.bottom<=nav.top}})
   results.push({width,scene,...result});console.log(JSON.stringify(results.at(-1)))
   assert.equal(result.focused,true);assert.equal(result.visible,true,'Native Tab focus must be fully visible above fixed navigation')
   await page.screenshot({path:output+'/'+scene+'-'+width+'.png'})
  }
  await context.close()
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
 console.log('PASS native Tab focus clearance on Home/Search/Workspace at 390/430/1100px')
}finally{await browser.close();server?.kill()}
