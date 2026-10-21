import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4203'
let server
if(!process.env.IEUM_BASE_URL){server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4203','--strictPort'],{stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})}
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-search-text'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
const enlarge=page=>page.evaluate(()=>{
 const nodes=document.querySelectorAll('.search-v2-tabs button,.search-v2-controls button,.search-v2-controls select,.search-v2-filter-panel button,.search-v2-filter-panel legend,.search-v2-summary,.search-v2-result strong,.search-v2-result small,.search-v2-result em,.search-v2-result-action,.search-v2-input input')
 const sizes=[...nodes].filter(n=>!n.dataset.qaEnlarged).map(n=>({n,size:parseFloat(getComputedStyle(n).fontSize),line:parseFloat(getComputedStyle(n).lineHeight)}))
 for(const {n,size,line}of sizes){n.dataset.qaEnlarged='true';n.style.setProperty('font-size',size*2+'px','important');if(Number.isFinite(line))n.style.setProperty('line-height',line*2+'px','important')}
})
const measure=page=>page.evaluate(()=>{
 const box=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
 const textBox=n=>{const r=document.createRange();r.selectNodeContents(n);return box({getBoundingClientRect:()=>r.getBoundingClientRect()})}
 const inside=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1
 const main=box(document.querySelector('.screen>main')),tabs=[...document.querySelectorAll('.search-v2-tabs button')],controls=[...document.querySelectorAll('.search-v2-controls button,.search-v2-controls select')]
 const rows=[...document.querySelectorAll('.search-v2-result')],panels=[...document.querySelectorAll('.search-v2-filter-panel button')]
 const selector=document.querySelector('.search-v2-sort select'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),style=getComputedStyle(selector);ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
 const sortNeeded=ctx.measureText(selector.selectedOptions[0].textContent).width+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight)+18
 return {frame:box(document.querySelector('.screen')),body:document.body.scrollWidth,main,tabs:tabs.map(n=>({box:box(n),textFits:inside(textBox(n),box(n))})),controls:controls.map(n=>({box:box(n),inside:inside(box(n),main),textFits:n.tagName==='SELECT'?box(n).width>=sortNeeded-2:inside(textBox(n),box(n))})),filterButtons:panels.map(n=>({box:box(n),inside:inside(box(n),main),textFits:inside(textBox(n),box(n))})),rows:rows.map(n=>({box:box(n),art:box(n.querySelector('.search-v2-record')),textFits:[...n.querySelectorAll('strong,small,em,.search-v2-result-action')].every(t=>inside(textBox(t),box(n))),title:n.querySelector('strong').textContent})),summary:box(document.querySelector('.search-v2-summary')),controlsBottom:Math.max(...controls.map(n=>box(n).bottom))}
})
const check=(r,width)=>{assert.equal(r.body,width);assert.ok(r.tabs.every(n=>n.textFits&&n.box.height>=44),'Tab text stays inside its target');assert.ok(r.controls.every(n=>n.inside&&n.textFits&&n.box.height>=44),'Filter/sort controls wrap inside the mobile frame and show the selected option');assert.ok(r.filterButtons.every(n=>n.inside&&n.textFits&&n.box.height>=44));assert.ok(r.summary.top>=r.controlsBottom,'Result summary follows controls');assert.ok(r.rows.every(n=>n.textFits&&n.art.width===92&&n.art.height===92),'Real titles/metadata stay in their row without changing approved artwork geometry')}
try{
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},reducedMotion:'reduce',locale:'ko-KR'}),page=await context.newPage(),errors=[]
  page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  await page.goto(base+'/?scene=search');await page.waitForSelector('.search-v2-result');await page.evaluate(()=>document.fonts.ready)
  await page.waitForFunction(()=>!!window.__IEUM_V2__?.state.projectTracks.soprano)
  const before=await page.evaluate(()=>({tracks:Object.keys(window.__IEUM_V2__.state.projectTracks).length,joined:window.__IEUM_V2__.state.joined,saves:window.__IEUM_V2__.state.songSaves})),normal=await measure(page)
  assert.equal(normal.tabs[0].box.height,44);assert.equal(normal.summary.top,260);assert.equal(normal.rows[0].box.top,296)
  for(const name of ['모집 프로젝트','곡','완성곡']){
   await page.getByRole('tab',{name,exact:true}).click();await page.getByLabel('결과 정렬').selectOption(name==='모집 프로젝트'?'최근 열린 순':'최근 추가된 순')
   await enlarge(page);const value=await measure(page);console.log(JSON.stringify({width,tab:name,controls:value.controls,tabs:value.tabs,body:value.body}));await page.screenshot({path:output+'/search-'+name+'-'+width+'.png',fullPage:true});check(value,width)
   await page.locator('.search-v2-controls button').last().click();await enlarge(page);const filters=await measure(page);check(filters,width)
   await page.getByRole('button',{name:'팝',exact:true}).click();await page.getByRole('button',{name:'적용',exact:true}).click()
   if(name==='모집 프로젝트')await page.getByRole('button',{name:'내 음역에 맞는 Part',exact:true}).click()
   results.push({width,tab:name,normal,value,filters});
   const last=page.locator('.search-v2-result').last();await last.focus();await page.keyboard.press('Enter');await page.waitForSelector(name==='완성곡'?'.complete-screen':'.detail-screen')
   await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.search-v2-result');assert.equal(await page.getByRole('tab',{name,exact:true}).getAttribute('aria-selected'),'true')
  }
  const after=await page.evaluate(()=>({tracks:Object.keys(window.__IEUM_V2__.state.projectTracks).length,joined:window.__IEUM_V2__.state.joined,saves:window.__IEUM_V2__.state.songSaves}));assert.deepEqual(after,before);assert.deepEqual(errors,[]);await context.close()
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2));console.log('PASS Search 2x CSS text, real titles, tabs/filter/sort, original artwork, keyboard detail/Back and unchanged Tracks/participation/saves at 390/430px. Native device zoom remains unverified.')
}finally{await browser.close();server?.kill()}
