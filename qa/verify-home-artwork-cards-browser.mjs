import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4198'
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4198','--strictPort'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',code=>reject(Error('Vite '+code)))})
}
const baseline=process.env.IEUM_QA_BASELINE==='1',output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-home-artwork-cards'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
try{
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},reducedMotion:'reduce',locale:'ko-KR'}),page=await context.newPage(),errors=[]
  page.setDefaultTimeout(20000)
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await page.goto(base);await page.waitForSelector('.v2-project-row');await page.evaluate(()=>document.fonts.ready)
  await page.locator('.v2-recent').scrollIntoViewIfNeeded()
  await page.waitForFunction(()=>[...document.querySelectorAll('.v2-hero-artwork,.v2-thumbnail-sleeve img')].every(img=>img.complete&&img.naturalWidth>0))
  const read=()=>page.evaluate(()=>{
   const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}}
   const art=document.querySelector('.v2-hero-artwork'),a=rect(art),style=getComputedStyle(art),hero=document.querySelector('.v2-hero')
   const scale=style.objectFit==='cover'?Math.max(a.width/art.naturalWidth,a.height/art.naturalHeight):Math.min(a.width/art.naturalWidth,a.height/art.naturalHeight)
   return {body:document.body.scrollWidth,hero:{...a,heightOfSlot:hero.getBoundingClientRect().height,fit:style.objectFit,naturalWidth:art.naturalWidth,naturalHeight:art.naturalHeight,horizontalCrop:Math.max(0,art.naturalWidth*scale-a.width),src:art.getAttribute('src')},rows:[...document.querySelectorAll('.v2-project-row')].map(row=>{
    const title=row.querySelector('strong'),info=title.parentElement,roles=row.querySelector('.v2-open-roles'),thumb=row.querySelector('.v2-project-thumbnail'),sleeve=thumb.querySelector('.v2-thumbnail-sleeve'),record=thumb.querySelector('.v2-thumbnail-record'),font=getComputedStyle(title),t=rect(thumb),s=rect(sleeve),r=rect(record),bounds=rect(row)
    const textRange=document.createRange();textRange.selectNodeContents(title)
    return {id:row.dataset.projectId,title:title.textContent,artist:info.querySelector('small').textContent,cover:sleeve.querySelector('img').getAttribute('src'),font:font.fontSize,line:font.lineHeight,weight:font.fontWeight,family:font.fontFamily,lang:title.lang,gap:getComputedStyle(row).gap,thumb:t,sleeve:s,record:r,border:getComputedStyle(sleeve).borderTopWidth,radius:getComputedStyle(sleeve).borderRadius,row:bounds,separate:rect(info).right<=rect(roles).x,titleInside:[...textRange.getClientRects()].every(x=>x.left>=bounds.x&&x.right<=rect(roles).x&&x.bottom<=bounds.bottom),artInside:[s,r].every(x=>x.x>=t.x&&x.right<=t.right&&x.y>=t.y&&x.bottom<=t.bottom)}
   })}
  })
  const state=await read();results.push({width,state});console.log(baseline?'BASELINE':'CHECK',width,JSON.stringify({hero:state.hero,rows:state.rows.map(({title,font,line,separate,titleInside})=>({title,font,line,separate,titleInside}))}))
  if(!baseline){
   assert.equal(state.body,width);assert.equal(state.hero.heightOfSlot,400);assert.equal(state.hero.src,'/artwork/home-hero.webp')
   assert.ok(Math.abs(state.hero.height-width*40/43)<.05);assert.ok(state.hero.horizontalCrop<.05,'Original Hero composition loses no horizontal source pixels')
   assert.equal(state.rows.length,3);assert.equal(state.rows[0].title,'A Thousand Years');assert.equal(state.rows[0].artist,'Christina Perri')
   for(const row of state.rows){assert.equal(row.font,'18px');assert.equal(row.line,'24px');assert.equal(row.lang,'en');assert.ok(row.family.includes('Montserrat'));assert.equal(row.gap,'12px');assert.ok(row.artInside&&row.separate&&row.titleInside);assert.equal(row.thumb.width,72);assert.equal(row.sleeve.width,54);assert.equal(row.record.width,56);assert.equal(row.record.x-row.thumb.x,14);assert.equal(row.radius,'1.8px');assert.notEqual(row.border,'0px')}
   await page.locator('.v2-recent').screenshot({path:`${output}/recent-${width}.png`})
   await page.evaluate(()=>scrollTo(0,0));await page.locator('.v2-hero').screenshot({path:`${output}/hero-${width}.png`})
   await page.locator('.v2-project-row').first().click();await page.waitForSelector('.detail-screen');assert.ok((await page.locator('.detail-screen').textContent()).includes('A Thousand Years'))
   await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.home-v2-screen')
   // Scoped 2x text-size stress, not a claim of native mobile text zoom.
   await page.addStyleTag({content:'.v2-recent strong{font-size:36px!important;line-height:48px!important}.v2-recent small,.v2-open-roles{font-size:24px!important;line-height:32px!important}'})
   const large=await read();assert.equal(large.body,width);assert.ok(large.rows.every(r=>r.separate&&r.titleInside&&r.artInside&&r.row.height>=98))
   assert.deepEqual(large.rows.map(r=>[r.id,r.title,r.artist,r.cover]),state.rows.map(r=>[r.id,r.title,r.artist,r.cover]))
   await page.locator('.v2-recent').screenshot({path:`${output}/recent-2x-text-${width}.png`})
  }
  assert.deepEqual(errors,[]);await context.close();console.log(baseline?'BASELINE COMPLETE':'PASS',width)
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
}catch(error){console.error(error);throw error}finally{await browser.close();server?.kill()}
