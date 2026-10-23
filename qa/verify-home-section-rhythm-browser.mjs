import assert from 'node:assert/strict'
import {songArtwork} from '../src/songArtwork.js'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4206'
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4206','--strictPort'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})
}
const baseline=process.env.IEUM_QA_BASELINE==='1',output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-home-rhythm'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,proxy:process.env.IEUM_BROWSER_PROXY?{server:process.env.IEUM_BROWSER_PROXY}:undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
const measure=page=>page.evaluate(()=>{
 const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}}
 const info=document.querySelector('.v2-recruit-info'),copy=info.querySelector('.v2-recruit-copy')||info,title=info.querySelector('h3'),jacket=info.querySelector('.v2-recruit-jacket'),img=jacket?.querySelector('img'),action=document.querySelector('.v2-project-action')
 const inside=n=>{
  const r=rect(n),bottomLimit=n.tagName==='H3'?n.nextElementSibling.getBoundingClientRect().top:r.bottom,walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),range=document.createRange()
  // Wrapped trailing spaces can extend the Range without painting outside the box.
  // Check words and the next metadata line; serif descent can use the heading gap.
  for(let text; (text=walker.nextNode());)for(const word of text.textContent.matchAll(/\S+/g)){
   range.setStart(text,word.index);range.setEnd(text,word.index+word[0].length)
   if([...range.getClientRects()].some(t=>t.left<r.x-1||t.right>r.right+1||t.bottom>bottomLimit+1))return false
  }
  return true
 }
 const sections=[...document.querySelectorAll('main>section')].map(n=>{const style=getComputedStyle(n),h=n.querySelector('.v2-section-heading'),content=n.querySelector('.v2-song-grid,.v2-project-rows,.v2-completed-carousel');return {name:n.className,top:parseFloat(style.paddingTop),bottom:parseFloat(style.paddingBottom),box:rect(n),heading:rect(h),contentGap:content?rect(content).y-rect(h).bottom:null}})
 const heading=document.querySelector('.v2-recruitment-heading'),feature=document.querySelector('.v2-recruitment-feature'),media=document.querySelector('.v2-recruitment-media'),player=document.querySelector('.v2-recruitment-player'),nav=document.querySelector('.v2-carousel-nav'),stage=document.querySelector('.v2-turntable-stage')
 const groups=heading?{heading:rect(heading),feature:rect(feature),media:rect(media),player:rect(player),nav:rect(nav),stage:rect(stage),arrows:[...nav.querySelectorAll('button')].map(n=>({box:rect(n),img:rect(n.querySelector('img')),decoded:!!n.querySelector('img').naturalWidth,hit:document.elementFromPoint(n.getBoundingClientRect().x+22,n.getBoundingClientRect().bottom-1)?.closest('button')===n})),headingChildren:[...heading.children].map(n=>n.className),featureChildren:[...feature.children].map(n=>n.className),mediaChildren:[...media.children].map(n=>n.className),playerChildren:[...player.children].map(n=>n.className)}:null
 return {groups,width:innerWidth,body:document.body.scrollWidth,sections,project:document.querySelector('.v2-recruit-record').dataset.projectId,title:title.textContent,titleInside:inside(title),info:rect(info),copy:rect(copy),jacket:jacket?rect(jacket):null,src:img?.getAttribute('src'),decoded:!!img?.naturalWidth,actionGap:rect(action).y-rect(info).bottom,metadataInside:[...info.querySelectorAll('p')].every(inside),counts:{tracks:Object.keys(window.__IEUM_V2__.state.projectTracks).length,joined:window.__IEUM_V2__.state.joined}}
})
try{
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},reducedMotion:'reduce',locale:'ko-KR',ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[]
  page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  const entry=new URL(base);entry.searchParams.set('scene','profile-ready');await page.goto(entry.href);await page.waitForSelector('.v2-recruit-info');await page.evaluate(()=>document.fonts.ready)
  await page.locator('.v2-recruit-info').scrollIntoViewIfNeeded()
  await page.waitForFunction(()=>[...document.querySelectorAll('.v2-recruit-info img')].every(n=>n.complete&&n.naturalWidth>0))
  const normal=await measure(page);results.push({width,normal});console.log(JSON.stringify({width,normal}))
  await page.locator('.v2-recruitment').screenshot({path:`${output}/${baseline?'before':'after'}-${width}.png`})
  if(!baseline){
   assert.equal(normal.body,width)
   assert.deepEqual(normal.sections.map(n=>n.top),[48,48,48,48]);assert.deepEqual(normal.sections.map(n=>n.bottom),[0,0,0,32])
   const g=normal.groups;assert.ok(g);assert.deepEqual(g.headingChildren,['v2-section-heading','v2-section-note']);assert.deepEqual(g.featureChildren,['v2-recruitment-media','primary v2-project-action']);assert.deepEqual(g.mediaChildren,['v2-carousel-nav','v2-recruitment-player']);assert.deepEqual(g.playerChildren,['v2-turntable-stage','v2-recruit-info'])
   assert.equal(g.heading.height,57);assert.equal(g.feature.y-g.heading.bottom,24);assert.equal(g.nav.width,158);assert.equal(g.nav.height,48);assert.equal(g.nav.x,(width-158)/2);assert.equal(g.player.y-g.nav.bottom,-12);assert.equal(g.stage.height,255);assert.equal(normal.info.y,g.stage.bottom);assert.equal(g.media.height,351);assert.equal(g.feature.height,434);assert.equal(normal.sections[0].box.height,563)
   assert.ok(g.arrows.every(a=>a.box.width===44&&a.box.height===44&&a.img.width===44&&a.img.height===44&&a.decoded&&a.hit),'Figma native 44px arrows load and keep the overlapping touch targets')
   for(let i=1;i<normal.sections.length;i++)assert.ok(Math.abs(normal.sections[i].box.y-normal.sections[i-1].box.bottom)<.05,'No accumulated bottom margin between sections')
   assert.equal(normal.jacket.width,56);assert.equal(normal.jacket.height,56);assert.equal(normal.copy.x-normal.jacket.right,12);assert.equal(normal.actionGap,35);assert.ok(normal.decoded&&normal.titleInside&&normal.metadataInside)
   // The same Song ID resolves to the same cover in recruitment and recommendations.
   const cover=await page.locator('.v2-song-card').first().locator('img').getAttribute('src');assert.equal(normal.src,cover)
   const seen=new Set()
   for(let step=0;step<6;step++){
    const state=await measure(page);seen.add(state.project);assert.equal(state.body,width);assert.ok(state.titleInside&&state.metadataInside);assert.deepEqual(state.counts,normal.counts)
    const songId={'ieum-thousand-years-v7':'a-thousand-years','a-thousand-warm-duet':'a-thousand-years','ocean-eyes-airy-trio':'ocean-eyes','ocean-eyes-duet':'ocean-eyes','love-poem-four-voices':'love-poem','city-of-stars-duet':'city-of-stars'}[state.project]
    const expected=songArtwork({id:songId})
    assert.ok(state.src.endsWith(expected),'Selected Project jacket follows actual Song identity')
    await page.getByRole('button',{name:'다음 모집 프로젝트',exact:true}).press('Enter');await page.waitForFunction(()=>[...document.querySelectorAll('.v2-recruit-info img')].every(n=>n.complete&&n.naturalWidth>0))
   }
   assert.equal(seen.size,6)
   await page.locator('.v2-project-action').click();await page.waitForSelector('.detail-screen');assert.ok((await page.locator('.detail-screen').textContent()).includes(normal.title));await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.home-v2-screen')
   await page.addStyleTag({content:'.v2-recruit-copy h3{font-size:72px!important;line-height:80px!important}.v2-recruit-copy p,.v2-recruit-copy p span{font-size:24px!important;line-height:32px!important}'})
   const enlarged=await measure(page);await page.locator('.v2-recruitment').screenshot({path:`${output}/text-${width}.png`});assert.equal(enlarged.body,width);assert.ok(enlarged.titleInside&&enlarged.metadataInside);assert.equal(enlarged.jacket.width,56);assert.equal(enlarged.actionGap,35);assert.ok(enlarged.info.height>normal.info.height)
   results.push({width,enlarged})
   entry.searchParams.set('scene','first-visit');await page.goto(entry.href);await page.waitForSelector('.v2-first-visit-guide');await page.evaluate(()=>document.fonts.ready)
   assert.equal(await page.locator('.v2-profile-icon').getAttribute('data-profile-state'),'absent');assert.equal(await page.locator('.v2-profile-icon img').count(),0)
   assert.equal(await page.getByRole('button',{name:'파트 모집 중으로 이동',exact:true}).count(),1)
   assert.ok((await page.locator('.v2-first-visit-copy').innerText()).includes('참여할 프로젝트를 탐색해 보세요.'))
   assert.equal(await page.locator('.v2-recruitment-heading').count(),1);assert.equal(await page.locator('.v2-carousel-nav button img').count(),2)
   await page.locator('.v2-first-visit-guide').screenshot({path:`${output}/first-visit-${width}.png`})
   results.push({width,firstVisitProfileAbsent:true,scrollInvitationPreserved:true})
  }
  assert.deepEqual(errors,[]);await context.close();console.log(baseline?'BASELINE':'PASS',width)
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
}finally{await browser.close();server?.kill()}
