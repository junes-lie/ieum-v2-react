import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir} from 'node:fs/promises'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-search-qa'
await mkdir(out,{recursive:true})
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4199','--strictPort'],{stdio:['ignore','pipe','pipe']})
await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(String(data).includes('Local:'))resolve()});server.on('error',reject);server.on('exit',code=>reject(Error('Vite exited '+code)))})
let browser
try {
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
 for(const width of [390,430]){
  const page=await browser.newPage({viewport:{width,height:932}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  await page.goto('http://127.0.0.1:4199/?scene=search')
  await page.waitForSelector('.search-v2-result')
  await page.evaluate(()=>document.fonts.ready)
  await page.waitForFunction(()=>[...document.querySelectorAll('.search-v2-result img')].every(img=>img.complete&&img.naturalWidth>0))
  assert.deepEqual(await page.getByRole('tab').allTextContents(),['곡','모집 프로젝트','완성곡'])
  const geometry=await page.evaluate(()=>{
   const q=s=>document.querySelector(s),box=s=>q(s).getBoundingClientRect().toJSON()
   return {title:box('.topbar-center'),input:box('.search-v2-input'),tabs:box('.search-v2-tabs'),summary:box('.search-v2-summary'),row:box('.search-v2-result'),art:box('.search-v2-record'),titleFont:getComputedStyle(q('.search-v2-result strong')).fontSize,border:getComputedStyle(q('.search-v2-result')).borderBottomWidth,hit:[...document.querySelectorAll('.search-v2-controls button,.search-v2-controls select')].map(n=>n.getBoundingClientRect().height),body:document.body.scrollWidth}
  })
  assert.equal(geometry.body,width)
  assert.equal(geometry.input.y,74);assert.equal(geometry.input.height,48)
  assert.equal(geometry.tabs.y,142);assert.equal(geometry.tabs.height,44)
  assert.equal(geometry.summary.y,260);assert.equal(geometry.summary.height,16);assert.equal(geometry.row.y,296)
  assert.equal(geometry.art.width,92);assert.equal(geometry.art.height,92)
  assert.equal(geometry.titleFont,'18px');assert.equal(geometry.border,'0px')
  assert.ok(geometry.hit.every(height=>height>=44))
  await page.screenshot({path:`${out}/search-${width}.png`,fullPage:true})
  const savedTitle=await page.locator('.search-v2-result strong').first().textContent()
  await page.locator('.search-v2-result').first().click();await page.waitForSelector('.detail-screen')
  await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.search-v2-result')
  assert.equal(await page.locator('.search-v2-result strong').first().textContent(),savedTitle)
  await page.getByRole('tab',{name:'완성곡',exact:true}).click()
  assert.equal(await page.locator('.search-v2-result').count(),3)
  assert.ok((await page.locator('.search-v2-result small').allTextContents()).every(text=>text.includes('시연 음원')))
  await page.locator('[data-action="open-my-voice"]').click();await page.waitForFunction(()=>window.__IEUM_V2__.state.screen==='my')
  await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.search-v2-result')
  assert.equal(await page.getByRole('tab',{name:'완성곡',exact:true}).getAttribute('aria-selected'),'true')
  assert.deepEqual(errors,[])
  console.log('PASS Search geometry, art, targets, exact detail/Back, labelled examples and My Voice return',width,JSON.stringify(geometry))
  await page.close()
 }
} finally {await browser?.close();server.kill()}
