import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4208'
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4208'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('Local:'))resolve()});server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})
}
const output=process.env.IEUM_QA_OUTPUT||'qa/captures/shared-system-check'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
try{
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},reducedMotion:'reduce',locale:'ko-KR'})
  await context.addInitScript(()=>{window.__micRequests=0;const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=(...args)=>{window.__micRequests++;return original(...args)}})
  const page=await context.newPage();page.setDefaultTimeout(15000)
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  const enter=async(screen,scene='workspace')=>{
   await page.goto(`${base}/?scene=${scene}`);await page.waitForFunction(()=>window.__IEUM_V2__?.state)
   await page.evaluate(screen=>{history.replaceState({...history.state,ieumScreen:screen},'','#'+screen);dispatchEvent(new PopStateEvent('popstate',{state:history.state}))},screen)
   await page.waitForFunction(s=>window.__IEUM_V2__?.state.screen===s,screen)
   await page.evaluate(()=>document.fonts.ready)
  }
  const check=async(name)=>{
   const facts=await page.locator('.screen').evaluate(n=>{
    const rect=n.getBoundingClientRect(),style=getComputedStyle(n)
    const fonts=[...n.querySelectorAll('h1,h2,p,button,input,select,small,strong')].filter(e=>e.getClientRects().length&&e.textContent.trim()).map(e=>getComputedStyle(e).fontFamily)
    const controls=[...n.querySelectorAll('.primary,.secondary,input:not([type=checkbox]):not([type=radio]):not([type=range]),select')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent.slice(0,30),width:r.width,height:r.height,inside:r.left>=rect.left-.5&&r.right<=rect.right+.5}})
    return {width:rect.width,body:document.body.scrollWidth,bg:style.backgroundColor,fonts,controls,mic:window.__micRequests}
   })
   assert.equal(facts.width,width,name);assert.equal(facts.body,width,name+' body width')
   assert.equal(facts.bg,'rgb(21, 17, 14)',name+' canvas')
   assert.ok(facts.fonts.every(f=>!/(Inter IEUM|JetBrains|Instrument Serif)/.test(f)),name+' old font remains')
   assert.ok(facts.controls.every(c=>c.inside&&c.height>=44),name+' control containment '+JSON.stringify(facts.controls))
   assert.equal(facts.mic,0,name+' must not activate microphone')
   await page.screenshot({path:`${output}/${name}-${width}.png`})
   results.push({width,name,...facts});console.log('PASS',width,name)
  }
  for(const [screen,scene] of [['detail','participate'],['finder','workspace'],['projects','workspace'],['collection','profile-ready'],['my','profile-ready'],['create-project','profile-ready'],['voice','first-visit'],['song-browser','profile-ready']]){
   await enter(screen,scene);await page.locator('.ds-v2-screen').waitFor();await check(screen)
   if(screen==='finder'){
    const lines=await page.locator('.sort-row button').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).whiteSpace));assert.ok(lines.every(v=>v==='nowrap'))
    await page.getByRole('button',{name:'필터',exact:true}).click();await check('finder-filters')
    await page.getByRole('combobox',{name:'선호 장르'}).selectOption({index:1})
    await page.locator('[data-action="clear-finder-filters"]').click()
    await page.locator('[data-action="candidate"]').first().click();await check('match')
    const identity=await page.locator('.candidate-identity').evaluate(n=>{const [a,b]=[...n.children].map(e=>e.getBoundingClientRect());return {right:a.right,left:b.left}});assert.ok(identity.right<=identity.left,'Candidate image must not overlap name')
    await page.locator('.identity-link').click();await check('vocal-profile')
    const save=page.locator('[data-action="toggle-vocal-save"]');await save.click();assert.equal(await save.getAttribute('aria-pressed'),'true')
    await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.locator('.identity-link').waitFor()
    await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.locator('.finder-screen').waitFor();await check('finder-return')
   }
   if(screen==='my'){
    const inside=await page.locator('.profile-card .time-row').evaluate(n=>{const a=n.getBoundingClientRect(),b=n.closest('.profile-card').getBoundingClientRect();return a.right<=b.right&&a.left>=b.left});assert.ok(inside,'Profile transport must stay inside its card')
    await page.getByRole('button',{name:'선호 역할 · 장르 · 취향 수정',exact:true}).click();await check('my-preferences');await page.getByRole('button',{name:'취소',exact:true}).click()
   }
   if(screen==='collection')for(const name of ['보컬','곡','프로젝트']){await page.getByRole('tab',{name:new RegExp(name)}).click();await check('collection-'+name)}
   if(screen==='create-project'){
    await page.getByRole('button',{name:'Part 구성하기',exact:true}).click();await check('create-structure')
    await page.getByRole('button',{name:'프로젝트 확인',exact:true}).click();await check('create-confirm')
    await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.getByRole('button',{name:'프로젝트 확인',exact:true}).waitFor()
   }
  }
  await enter('home','complete');await page.locator('.v2-completed-card').first().click();await check('complete')
  await page.locator('[data-action="toggle-project-like"]').click();assert.equal(await page.locator('[data-action="toggle-project-like"]').getAttribute('aria-pressed'),'true')
  // All native controls and their media/storage contracts are tested separately
  // in verify-v2-integration-browser. This pass stresses real text reflow.
  for(const screen of ['finder','my','collection','create-project']){
   await enter(screen,screen==='finder'?'workspace':'profile-ready')
   await page.addStyleTag({content:'.ds-v2-screen h1{font-size:64px!important;line-height:80px!important}.ds-v2-screen :is(p,button,select){font-size:26px!important;line-height:38px!important}'})
   await check(screen+'-enlarged')
  }
  assert.deepEqual(errors,[]);await context.close()
 }
 await writeFile(`${output}/results.json`,JSON.stringify(results,null,2))
 console.log('Shared screen styles, native controls/return paths and CSS text stress passed. No physical-device/microphone/listening claim.')
}finally{await browser.close();server?.kill()}
