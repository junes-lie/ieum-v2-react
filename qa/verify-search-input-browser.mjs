import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4204'
let server
if(!process.env.IEUM_BASE_URL){server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4204','--strictPort'],{stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})}
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-search-input'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
const visibleFocus=async page=>{
 await page.waitForFunction(()=>{const n=document.activeElement;if(!n||n===document.body)return false;const r=n.getBoundingClientRect(),nav=document.querySelector('.bottom-nav')?.getBoundingClientRect();return r.top>=0&&r.bottom<=(nav?.top??innerHeight)+1})
 assert.equal(await page.evaluate(()=>document.body.scrollWidth),page.viewportSize().width)
}
try{
 for(const width of [390,430])for(const height of [568,360]){
  const context=await browser.newContext({viewport:{width,height:932},reducedMotion:'reduce',locale:'ko-KR'}),page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.setDefaultTimeout(20000)
  await page.goto(base+'/?scene=search');await page.waitForSelector('.search-v2-result');await page.evaluate(()=>document.fonts.ready)
  await page.waitForFunction(()=>!!window.__IEUM_V2__?.state.projectTracks.soprano)
  const snapshot=()=>page.evaluate(()=>({tracks:Object.keys(window.__IEUM_V2__.state.projectTracks).length,joined:window.__IEUM_V2__.state.joined,saves:window.__IEUM_V2__.state.songSaves}))
  const before=await snapshot(),input=page.getByRole('textbox',{name:'곡, 아티스트, 프로젝트 검색'})
  await input.focus();await page.setViewportSize({width,height});await visibleFocus(page)
  await page.keyboard.type('Ocean');assert.ok(await page.locator('.search-v2-result').count()>0);assert.ok((await page.locator('.search-v2-result strong').allTextContents()).every(t=>t.includes('Ocean')))
  const focus=await input.evaluate(n=>{const s=getComputedStyle(n.parentElement),b=n.parentElement.getBoundingClientRect();return {outline:s.outlineStyle,width:s.outlineWidth,fieldHeight:b.height}})
  assert.equal(focus.outline,'solid');assert.equal(focus.width,'2px');assert.equal(focus.fieldHeight,48)
  await page.keyboard.press('Tab');const clear=page.getByRole('button',{name:'검색어 지우기',exact:true})
  assert.equal(await clear.evaluate(n=>n===document.activeElement),true);await visibleFocus(page)
  const target=await clear.boundingBox();assert.ok(target.width>=44&&target.height>=44)
  assert.equal(await clear.locator('svg[data-icon="xmark"]').count(),1)
  await clear.press('Enter');assert.equal(await input.inputValue(),'');assert.equal(await input.evaluate(n=>n===document.activeElement),true)
  await page.keyboard.type('Ocean');await page.screenshot({path:`${output}/input-${width}-${height}.png`})
  await page.getByRole('tab',{name:'곡',exact:true}).click();await input.fill('A Thousand')
  await page.locator('.search-v2-controls button').last().focus();await visibleFocus(page);await page.keyboard.press('Enter')
  await page.getByRole('button',{name:'팝',exact:true}).focus();await visibleFocus(page);await page.keyboard.press('Space')
  await page.getByRole('button',{name:'적용',exact:true}).focus();await visibleFocus(page);await page.screenshot({path:`${output}/filter-${width}-${height}.png`});await page.keyboard.press('Enter')
  await page.getByLabel('결과 정렬').selectOption('최근 추가된 순')
  const title=await page.locator('.search-v2-result strong').first().textContent()
  await page.locator('.search-v2-result').first().focus();await visibleFocus(page);await page.keyboard.press('Enter');await page.waitForSelector('.detail-screen')
  await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.search-v2-result')
  assert.equal(await input.inputValue(),'A Thousand');assert.equal(await page.getByLabel('결과 정렬').inputValue(),'최근 추가된 순');assert.equal(await page.locator('.search-v2-result strong').first().textContent(),title)
  await page.getByRole('tab',{name:'모집 프로젝트',exact:true}).click();assert.equal(await input.inputValue(),'Ocean')
  await page.locator('[data-action="open-my-voice"]').click();await page.waitForFunction(()=>window.__IEUM_V2__.state.screen==='my');await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.search-v2-result');assert.equal(await input.inputValue(),'Ocean')
  await input.focus();await visibleFocus(page);await page.screenshot({path:`${output}/return-${width}-${height}.png`})
  assert.deepEqual(await snapshot(),before);assert.deepEqual(errors,[]);results.push({width,height,focus,clearTarget:target,title,errors});await context.close()
  console.log('PASS Search input/clear focus, native keyboard filters/result, exact tab/detail/My Voice Back and unchanged data',width,height)
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2));console.log('Viewport resize only: native IME, physical microphone and device text zoom remain unverified.')
}finally{await browser.close();server?.kill()}
