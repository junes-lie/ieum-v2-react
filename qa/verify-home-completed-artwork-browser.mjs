import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4279/',out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-home-completed-local'
await mkdir(out,{recursive:true});let server,browser;const results=[]
const near=(a,b)=>assert.ok(Math.abs(a-b)<.3,`${a} vs ${b}`)
try{
 if(!process.env.IEUM_BASE_URL){server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4279','--strictPort'],{stdio:['ignore','pipe','inherit']});await new Promise((ok,no)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&ok());server.on('error',no)})}
 browser=await chromium.launch({headless:true,executablePath:'/tmp/chromium',proxy:process.env.IEUM_BROWSER_PROXY?{server:process.env.IEUM_BROWSER_PROXY}:undefined,args:['--no-sandbox','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},reducedMotion:'reduce',ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000)
  try{
   const url=new URL(base);url.searchParams.set('scene',width===390?'first-visit':'profile-ready');url.searchParams.set('run','home-completed-'+Date.now());await page.goto(url.href);await page.waitForSelector('.home-v2-screen');await page.evaluate(()=>document.fonts.ready)
   await page.waitForFunction(()=>[...document.querySelectorAll('.v2-completed-example-artwork img')].length===3&&[...document.querySelectorAll('.v2-completed-example-artwork img')].every(n=>n.complete&&n.naturalWidth===228))
   const cards=page.locator('.v2-completed-public-example');assert.equal(await cards.count(),3)
   const before=await page.evaluate(()=>{const s=window.__IEUM_V2__.state;return{profile:s.profile,tracks:Object.keys(s.projectTracks)}}),geometry=[]
   for(let index=0;index<3;index++){
    const card=cards.nth(index);await card.scrollIntoViewIfNeeded();const g=await card.evaluate(root=>{const box=n=>{const b=n.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}},art=root.querySelector('.v2-completed-example-artwork'),img=art.querySelector('img'),info=root.querySelector(':scope>span');return{card:box(root),art:box(art),img:box(img),info:box(info),gap:getComputedStyle(info).gap,overflow:getComputedStyle(art).overflow,title:root.querySelector('strong').textContent,id:root.dataset.projectId,canvas:root.querySelectorAll('canvas').length,body:document.documentElement.scrollWidth}})
    near(g.card.w,Math.min(368,width-48));near(g.card.h,196);near(g.art.w,g.card.w*212/368);near(g.art.h,196);near(g.img.w,228);near(g.img.h,228);near(g.img.x-g.art.x,-16);near(g.img.y-g.art.y,-16);near(g.info.x-g.art.right,12);near(g.info.w,g.card.w-g.art.w-12-16);assert.equal(g.gap,'6px');assert.equal(g.overflow,'hidden');assert.equal(g.canvas,0);assert.equal(g.body,width);assert.match(g.id,/^showcase:/);await card.screenshot({path:`${out}/card-${width}-${index}.png`});geometry.push(g)
   }
   await cards.first().click();await page.waitForSelector('.complete-screen');assert.match(await page.locator('.demo-disclosure').innerText(),/실제 사용자 협업 결과는 아니에요/);await page.getByRole('button',{name:'뒤로',exact:true}).press('Enter');await page.waitForSelector('.home-v2-screen');assert.deepEqual(await page.evaluate(()=>{const s=window.__IEUM_V2__.state;return{profile:s.profile,tracks:Object.keys(s.projectTracks)}}),before);assert.deepEqual(errors,[])
   results.push({width,geometry,scope:'Home public-example artwork crop and existing Completed navigation; no Track or audio changes'});console.log('PASS Home completed artwork/crop/groups and existing navigation',width)
  }catch(e){await page.screenshot({path:`${out}/failure-${width}.png`,fullPage:true}).catch(()=>{});await writeFile(`${out}/failure-${width}.txt`,e.stack+'\n'+await page.locator('body').innerText());throw e}finally{await context.close()}
 }
 await writeFile(out+'/results.json',JSON.stringify(results,null,2))
}finally{await browser?.close();server?.kill()}
