import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4198'
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4198','--strictPort'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',data=>String(data).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',code=>reject(Error('Vite exited '+code)))})
}
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-bottom-navigation'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
try{
 for(const width of [390,430,1100]){
  const context=await browser.newContext({viewport:{width,height:932},locale:'ko-KR',reducedMotion:'reduce'}),page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  await page.goto(base+'/?scene=profile-ready')
  await page.waitForFunction(()=>window.__IEUM_V2__?.state.screen==='home'&&!!window.__IEUM_V2__.state.projectTracks.soprano)
  const original=await page.evaluate(()=>JSON.stringify({tracks:window.__IEUM_V2__.state.projectTracks,joined:window.__IEUM_V2__.state.joined}))
  for(const [key,screen,art] of [['search','search','search'],['folder','projects','projects'],['bookmark','collection','collection'],['home','home','home']]){
   const button=page.locator('[data-nav="'+key+'"]')
   await button.press('Enter')
   await page.waitForFunction(screen=>window.__IEUM_V2__.state.screen===screen,screen)
   await page.evaluate(()=>document.fonts.ready)
   await page.waitForFunction(()=>[...document.querySelectorAll('.bottom-nav img')].every(n=>n.complete&&n.naturalWidth===20))
   assert.equal(await page.locator('.bottom-nav [aria-current="page"]').count(),1)
   assert.equal(await button.getAttribute('aria-current'),'page')
   assert.ok((await button.locator('img').getAttribute('src')).endsWith('/nav-'+art+'-active.svg'))
   const geometry=await page.locator('.bottom-nav').evaluate(n=>{
    const r=n.getBoundingClientRect()
    return {x:r.x,y:r.y,width:r.width,height:r.height,overflow:document.body.scrollWidth,tabs:[...n.querySelectorAll('button')].map(b=>{
     const t=b.getBoundingClientRect(),i=b.querySelector('img').getBoundingClientRect(),s=getComputedStyle(b.querySelector('span')),before=getComputedStyle(b,'::before'),after=getComputedStyle(b,'::after')
     return {x:t.x,y:t.y,width:t.width,height:t.height,iconWidth:i.width,iconHeight:i.height,font:s.fontFamily,size:s.fontSize,line:s.lineHeight,tracking:s.letterSpacing,opacity:getComputedStyle(b.querySelector('img')).opacity,active:b.classList.contains('active'),glow:[before.width,before.height,before.filter],indicator:[after.width,after.height,after.top]}
    })}
   })
   const shell=Math.min(width,430),pad=width<430?20:24
   assert.equal(geometry.width,shell);assert.equal(geometry.height,76);assert.equal(geometry.y,width>430?836:856);assert.equal(geometry.x,(width-shell)/2);assert.equal(geometry.overflow,width)
   for(const [i,t]of geometry.tabs.entries()){
    assert.equal(t.x,geometry.x+pad+i*(shell-2*pad)/4);assert.equal(t.y,geometry.y+12)
    assert.equal(t.width,(shell-2*pad)/4);assert.equal(t.height,52)
    assert.equal(t.iconWidth,20);assert.equal(t.iconHeight,20);assert.equal(t.opacity,'1')
    assert.ok(t.font.includes('Pretendard'));assert.equal(t.size,'11px');assert.equal(t.line,'16px');assert.equal(t.tracking,'normal')
    if(t.active){assert.deepEqual(t.glow,['80px','76px','blur(5px)']);assert.deepEqual(t.indicator,['40px','1.5px','-13px'])}
   }
   await page.locator('.bottom-nav').screenshot({path:output+'/nav-'+key+'-'+width+'.png'})
   results.push({width,key,geometry})
  }
  await page.locator('[data-action="open-my-voice"]').click()
  await page.waitForFunction(()=>window.__IEUM_V2__.state.screen==='my')
  await page.getByRole('button',{name:'뒤로',exact:true}).click()
  await page.waitForFunction(()=>window.__IEUM_V2__.state.screen==='home')
  await page.locator('.v2-create-project').scrollIntoViewIfNeeded()
  const clearance=await page.locator('.v2-create-project').evaluate(n=>({bottom:n.getBoundingClientRect().bottom,nav:document.querySelector('.bottom-nav').getBoundingClientRect().top}))
  assert.ok(clearance.bottom<=clearance.nav,'Last Home CTA stays above navigation')
  assert.equal(await page.evaluate(()=>JSON.stringify({tracks:window.__IEUM_V2__.state.projectTracks,joined:window.__IEUM_V2__.state.joined})),original)
  assert.deepEqual(errors,[])
  await context.close()
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
 console.log('PASS: four navigation states, original icons, typography/geometry, keyboard routes, My Voice Back, final CTA and unchanged Tracks at 390/430/1100px')
}finally{await browser.close();server?.kill()}
