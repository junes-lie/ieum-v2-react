// Latest dedicated Figma source geometry. This is not full pixel, physical-device or multi-user acceptance.
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {createRequire} from 'node:module'
import {mkdir,writeFile} from 'node:fs/promises'
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH)
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4187/';let server
if(!process.env.IEUM_BASE_URL){server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4187','--strictPort'],{cwd:new URL('../',import.meta.url),stdio:['ignore','pipe','inherit']});await new Promise((resolve,reject)=>{server.stdout.on('data',v=>String(v).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Preview '+c)))})}
const out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-figma-spacing';await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,proxy:process.env.IEUM_BROWSER_PROXY?{server:process.env.IEUM_BROWSER_PROXY}:undefined,args:['--no-sandbox','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const metrics=[]
try{for(const width of (process.env.IEUM_QA_WIDTHS||'390,430').split(',').map(Number)){
 const context=await browser.newContext({viewport:{width,height:932},ignoreHTTPSErrors:true,reducedMotion:'reduce'})
 for(const [name,scene,screen] of [['home','profile-ready','home'],['detail','participate','detail'],['workspace','workspace','workspace'],['recording','music-a','record'],['search','search','search']]){
  const page=await context.newPage();try{
   const url=new URL(base);url.searchParams.set('scene',scene);await page.goto(url.href);await page.waitForFunction(()=>window.__IEUM_V2__?.state)
   await page.evaluate(screen=>{history.replaceState({...history.state,ieumScreen:screen},'','#'+screen);dispatchEvent(new PopStateEvent('popstate',{state:history.state}))},screen)
   await page.waitForFunction(screen=>window.__IEUM_V2__.state.screen===screen,screen)
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(n=>n.decode().catch(()=>{})))})
   assert.equal(await page.evaluate(()=>[...document.images].every(n=>n.complete&&n.naturalWidth>0)),true,'All rendered images load')
   await page.screenshot({path:`${out}/${name}-${width}-viewport.png`})
   const data=await page.evaluate(()=>{
    const sels=['.v2-hero-copy h1','.v2-hero-copy p','.detail-harmony-visual','.detail-harmony-analysis','.detail-fit-heading b','.detail-harmony-summary b','.project-carousel>button','.v2-turntable-frame','.search-v2-controls','.topbar','.topbar .icon-btn','.topbar .text-action','.topbar-center','.wordmark','.screen>main','.v2-hero','.v2-hero-copy','.v2-recruitment','.v2-section-heading','.v2-discover-stage','.v2-feature-caption','.v2-recommended','.v2-recent','.v2-completed','.detail-cover','.detail-song-title','.detail-v2-screen>main','.detail-projects','.project-carousel','.detail-project-body','.detail-record','.detail-mix','.detail-primary-action','.detail-analysis','.detail-harmony','.title-row','.v2-part-modules','.v2-part-module','.v2-workspace-stage','.current-mix','.v2-own-recording','.v2-monitoring','.v2-monitor-module','.lyrics','.recording-visual','.v2-instrument','.v2-guide-volume','.recorder-controls','.search-v2-input','.search-v2-tabs','.search-v2-filters','.search-v2-summary','.search-v2-results','.search-form','.search-tabs','.search-filter-row','.search-results','.bottom-nav']
    const r={};for(const sel of sels){const n=document.querySelector(sel);if(!n)continue;const b=n.getBoundingClientRect(),s=getComputedStyle(n);r[sel]={x:b.x,y:b.y,w:b.width,h:b.height,display:s.display,gap:s.gap,padding:s.padding,margin:s.margin,font:s.font,letterSpacing:s.letterSpacing,overflow:s.overflow}}
    return {boxes:r,scrollWidth:document.body.scrollWidth,screenClass:document.querySelector('.screen').className}
   });const boxes=data.boxes,gutter=width===430?24:20
   const near=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<.16,`${name} ${width} ${label}: ${actual} vs ${expected}`)
   const box=(sel)=>{assert.ok(boxes[sel],sel);return boxes[sel]}
   assert.equal(data.scrollWidth,width,'No horizontal document overflow')
   near(box('.topbar').h,name==='search'?74:72,'header height')
   if(name==='home'){
    near(box('.wordmark').x,gutter,'wordmark x');near(box('.wordmark').y,25,'wordmark y')
    near(box('.v2-hero-copy').x,width*.5907,'asymmetric copy x');near(box('.v2-hero-copy').w,280,'copy hug slot')
    near(box('.v2-hero-copy').h,136,'80 + 12 + 44 intro group');near(box('.v2-hero-copy p').y,180,'intro body y')
   }else if(name==='search'){
    near(box('.topbar-center').x,gutter,'title x');near(box('.topbar-center').y,24,'title y')
    for(const [sel,y] of [['.search-v2-input',74],['.search-v2-tabs',142],['.search-v2-summary',260],['.search-v2-results',296]]){near(box(sel).x,gutter,sel+' x');near(box(sel).y,y,sel+' y')}
   }else if(name==='workspace'){
    near(box('.title-row').y,88,'identity y');near(box('.v2-part-modules').y-box('.title-row').y-box('.title-row').h,31,'identity/modules group gap')
    near(box('.v2-part-module').h,152.2,'source module height');near(box('.v2-workspace-stage').h,box('.v2-workspace-stage').w*378/370,'record scene ratio')
    near(box('.current-mix').y,box('.v2-workspace-stage').y+box('.v2-workspace-stage').h,'scene/transport boundary');near(box('.current-mix').h,80,'Current Mix group')
    near(box('.v2-own-recording').y,box('.current-mix').y+80+40,'separate recording action gap');near(box('.v2-own-recording').h,104.2,'own panel hug height')
   }else if(name==='detail'){
    near(box('.project-carousel>button').h,84,'project card height')
    for(const sel of ['.detail-fit-heading b','.detail-harmony-summary b'])near(box(sel).h,40,'percentage type line')
    assert.equal(await page.locator('.detail-fit-heading b').innerText(),'96%');assert.equal(await page.locator('.detail-harmony-summary b').innerText(),'92%')
    near(box('.detail-harmony-visual').gap==='0px'?0:NaN,0,'visual group gap');near(parseFloat(box('.detail-harmony-analysis').gap),16,'analysis group gap')
   }else if(name==='recording'){
    near(box('.topbar-center').x,(width-280)/2,'identity centered slot');near(box('.v2-monitoring').y,88,'monitoring y');near(box('.lyrics').y,252.2,'lyrics y')
    near(box('.recording-visual').x,0,'scene origin');near(box('.recording-visual').y,232,'artwork y');near(box('.recording-visual').w,width,'artwork width')
    near(box('.v2-guide-volume').y+box('.v2-guide-volume').h/2,466,'independent guide center')
    near(box('.v2-instrument').w,350,'fixed recording panel');near(box('.v2-instrument').x,(width-350)/2,'recording panel x');near(box('.v2-instrument').y+box('.v2-instrument').h,912,'20px bottom clearance')
    assert.equal(await page.locator('.bottom-nav').count(),0,'Recording hides global navigation')
   }
   metrics.push({name,width,coordinateAssertions:'passed',...data})
   await page.locator('.bottom-nav').evaluateAll(ns=>ns.forEach(n=>n.style.visibility='hidden'))
   await page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:true});console.log(name,width)
  }finally{await page.close()}
 }await context.close()
}await writeFile(`${out}/metrics.json`,JSON.stringify(metrics,null,2))}finally{await browser.close();server?.kill()}
