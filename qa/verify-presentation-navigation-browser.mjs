import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdir,writeFile} from 'node:fs/promises'
import {spawn} from 'node:child_process'
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4298/'
const out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-presentation-navigation'
await mkdir(out,{recursive:true})
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4298','--strictPort'],{cwd:new URL('../',import.meta.url),stdio:['ignore','pipe','inherit']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',code=>reject(Error('Vite '+code)))})
}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
try {
 for(const width of [390,430]) {
  const context=await browser.newContext({viewport:{width,height:932},reducedMotion:'reduce'})
  const page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  page.setDefaultTimeout(15000)
  await page.goto(base+'?demo=profile-ready')
  const handle=await page.locator('iframe').elementHandle()
  const app=await handle.contentFrame()
  await app.waitForSelector('.v2-hero')
  assert.equal(await app.evaluate(()=>window.__IEUM_V2__.state.profile.matchingPreview.version),'registered-profile-demo-v1')
  const top=()=>app.evaluate(()=>Math.max(window.scrollY,document.querySelector('.screen')?.scrollTop||0))
  await app.locator('[data-nav="search"]').click()
  await app.waitForSelector('.search-v2-screen')
  assert.equal(await top(),0)
  const input=app.getByRole('textbox',{name:'곡, 아티스트, 프로젝트 검색'})
  await input.fill('오늘')
  await app.locator('.search-v2-result').first().click()
  await app.waitForSelector('.detail-screen')
  assert.equal(await top(),0)
  assert.equal(await app.locator('.detail-member-controls').count(),0)
  assert.match(await app.locator('.detail-harmony-summary').innerText(),/92%/)
  await app.locator('[data-action="back"]').click()
  await app.waitForSelector('.search-v2-screen')
  assert.equal(await input.inputValue(),'오늘')
  await app.locator('.search-v2-result').first().click()
  await app.waitForSelector('.detail-screen')
  await app.locator('[data-action="join-part"]').click()
  await app.waitForSelector('.workspace-v2-screen')
  assert.equal(await top(),0)
  assert.equal(await app.locator('[data-nav="folder"]').getAttribute('aria-current'),'page')
  assert.equal(await app.locator('.v2-part-module').count(),4)
  assert.equal(await app.locator('.v2-part-actions button').count(),0)
  await app.getByRole('button',{name:'Bass 보컬 찾기',exact:true}).click()
  await app.waitForSelector('.finder-screen')
  assert.equal(await app.locator('[data-nav="folder"]').getAttribute('aria-current'),'page')
  await app.locator('[data-action="back"]').click()
  await app.waitForSelector('.workspace-v2-screen')
  await app.locator('[data-action="record-part"]').click()
  await app.waitForSelector('[data-action="record-start"]:enabled')
  assert.equal(await top(),0)
  await app.locator('[data-action="back"]').click()
  await app.waitForSelector('.workspace-v2-screen')
  await app.evaluate(()=>history.back())
  await app.waitForSelector('.detail-screen')
  await app.evaluate(()=>history.back())
  await app.waitForSelector('.search-v2-screen')
  assert.equal(await input.inputValue(),'오늘')
  assert.deepEqual(errors,[])
  await page.screenshot({path:`${out}/search-return-${width}.png`})
  results.push({width,iframe:true,demoScoresPreserved:true,searchRestored:true,backTrail:true,partActionsToggleOnly:true})
  console.log('PASS',width,'iframe Search → Detail → Workspace → Finder/Recorder, app/browser Back and saved search; demo scores and four Parts preserved')
  await context.close()
 }
 await writeFile(out+'/results.json',JSON.stringify(results,null,2))
} finally {await browser.close();server?.kill()}
