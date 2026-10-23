import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4228/'
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-home-heart-local'
await mkdir(output,{recursive:true})
let server,browser
const results=[]
const close=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<.1,`${label}: ${actual} vs ${expected}`)
const measure=page=>page.evaluate(()=>{
 const box=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}}
 const q=s=>document.querySelector(s),copy=q('.v2-hero-copy'),p=copy.querySelector('p'),style=getComputedStyle(p)
 const guide=q('.v2-first-visit-guide'),control=q('.v2-scroll-control')
 const words=[...p.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>{const r=document.createRange();r.selectNodeContents(n);return [...r.getClientRects()].map(r=>({x:r.x,right:r.right,y:r.y}))}).flat()
 return {body:document.body.scrollWidth,copy:box(copy),heading:box(copy.querySelector('h1')),text:box(p),words,fontFamily:style.fontFamily,fontLoaded:document.fonts.check('15px "Pretendard IEUM"'),textContent:p.innerText,color:style.color,fontSize:style.fontSize,lineHeight:style.lineHeight,scrim:box(q('.v2-hero-copy-scrim')),scrimBackground:getComputedStyle(q('.v2-hero-copy-scrim')).backgroundImage,guide:guide?box(guide):null,guideCopy:guide?box(q('.v2-first-visit-copy')):null,control:control?box(control):null,images:[...document.querySelectorAll('.v2-scroll-control img')].map(n=>({src:n.getAttribute('src'),loaded:n.complete&&n.naturalWidth>0})),recruitmentCount:document.querySelectorAll('#recruiting-projects').length}
})
try{
 if(!process.env.IEUM_BASE_URL){
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4228','--strictPort'],{stdio:['ignore','pipe','inherit']})
  await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',code=>reject(Error('Preview '+code)))})
 }
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,proxy:process.env.IEUM_BROWSER_PROXY?{server:process.env.IEUM_BROWSER_PROXY}:undefined,args:['--no-sandbox','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
 for(const width of (process.env.IEUM_QA_WIDTHS||'390,430').split(',').map(Number)){
  const context=await browser.newContext({viewport:{width,height:932},ignoreHTTPSErrors:true,reducedMotion:'no-preference'}),page=await context.newPage(),errors=[]
  page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message))
  try{
   for(const scene of ['first-visit','profile-ready']){
    const url=new URL(base);url.searchParams.set('scene',scene)
    await page.goto(url.href);await page.waitForSelector('.home-v2-screen');await page.evaluate(()=>document.fonts.ready)
    if(scene==='first-visit')await page.waitForFunction(()=>[...document.querySelectorAll('.v2-scroll-control img')].every(n=>n.complete&&n.naturalWidth))
    const m=await measure(page)
    assert.equal(m.body,width);close(m.copy.x,width-191,'copy x');close(m.copy.y,88,'copy y');close(m.copy.width,191,'copy width');close(m.heading.width,153,'heading width');close(m.text.width,167,'text width');close(m.text.height,44,'two-line copy');close(m.text.y,180,'text y')
    assert.equal(m.color,'rgb(236, 230, 220)');assert.equal(m.fontSize,'15px');assert.equal(m.lineHeight,'22px');assert.ok(m.words.every(r=>r.x>=0&&r.right<=width-23),'All painted hero text remains in viewport')
    close(m.scrim.x,width-258,'scrim x');close(m.scrim.y,116,'scrim y');close(m.scrim.width,310,'scrim width');close(m.scrim.height,160,'scrim height');assert.ok(m.scrimBackground.includes('radial-gradient'))
    results.push({width,scene,measure:m})
    await page.screenshot({timeout:15000,path:`${output}/${scene}-${width}.png`,clip:{x:0,y:0,width,height:Math.ceil(m.guide?.bottom||400)}})
    if(scene==='first-visit'){
     close(m.guide.y,400,'guide y');close(m.guideCopy.y,428,'guide content y');close(m.control.width,70,'scroll width');close(m.control.height,70,'scroll height');close(m.control.bottom,m.guideCopy.bottom,'bottom alignment');close(m.control.x-m.guideCopy.right,43,'group gap');assert.ok(m.images.every(i=>i.loaded));assert.equal(m.recruitmentCount,1)
     if(width===430){close(m.guideCopy.width,269,'original guide copy');close(m.guideCopy.height,142,'original guide height');close(m.control.x,336,'original scroll x');close(m.control.y,500,'original scroll y')}
     const scroll=page.getByRole('button',{name:'파트 모집 중으로 이동',exact:true})
     assert.equal(await scroll.innerText(),'')
     const motion=await scroll.evaluate(n=>{
      const ring=n.querySelector('.v2-scroll-ring'),arrow=n.querySelector('.v2-scroll-arrow'),a=ring.getAnimations()[0],style=getComputedStyle(ring),before=arrow.getBoundingClientRect().toJSON(),timing=a.effect.getTiming()
      a.pause();const matrices=[0,1500,3000,6000].map(t=>{a.currentTime=t;return getComputedStyle(ring).transform});const after=arrow.getBoundingClientRect().toJSON()
      return {duration:style.animationDuration,easing:style.animationTimingFunction,iteration:style.animationIterationCount,period:timing.duration,matrices,arrowFixed:JSON.stringify(before)===JSON.stringify(after),arrowAnimation:getComputedStyle(arrow).animationName}
     })
     assert.equal(motion.duration,'6s');assert.equal(motion.easing,'linear');assert.equal(motion.iteration,'infinite');assert.equal(motion.period,6000);assert.notEqual(motion.matrices[0],motion.matrices[1]);assert.equal(motion.matrices[0],motion.matrices[3]);assert.ok(motion.arrowFixed);assert.equal(motion.arrowAnimation,'none');results.push({width,motion})
     for(const key of [null,'Enter','Space']){
      await page.evaluate(async()=>{scrollTo({top:0,behavior:'instant'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))})
      if(key){await scroll.focus();await scroll.press(key)}else await scroll.click()
      await page.waitForFunction(()=>document.activeElement?.id==='recruiting-projects'&&Math.abs(document.querySelector('#recruiting-projects').getBoundingClientRect().top-16)<2).catch(async e=>{console.log('SCROLL FAILURE',key,await page.evaluate(()=>({active:document.activeElement?.outerHTML.slice(0,300),y:scrollY,target:document.querySelector('#recruiting-projects').getBoundingClientRect().toJSON()})));throw e})
     }
     await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(async()=>{scrollTo({top:0,behavior:'instant'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))});await scroll.focus();await scroll.press('Enter')
     const reduced=await scroll.evaluate(n=>({animation:getComputedStyle(n.querySelector('.v2-scroll-ring')).animationName,top:document.querySelector('#recruiting-projects').getBoundingClientRect().top,focused:document.activeElement.id}))
     assert.equal(reduced.animation,'none');close(reduced.top,16,'reduced motion immediate scroll');assert.equal(reduced.focused,'recruiting-projects');results.push({width,reduced})
     await page.emulateMedia({reducedMotion:'no-preference'})
    }else{
     await page.locator('[data-action="open-parts"]').press('Enter');await page.waitForSelector('.detail-v2-screen')
     const heart=page.locator('[data-action="toggle-song-save"]'),art=heart.locator('img')
     await art.evaluate(n=>n.decode());assert.equal(await heart.getAttribute('aria-pressed'),'false');assert.equal(await heart.getAttribute('aria-label'),'곡 좋아요');assert.ok((await art.getAttribute('src')).endsWith('detail-heart-default.svg'))
     const initial=await heart.boundingBox();assert.equal(initial.width,44);assert.equal(initial.height,44)

     await heart.evaluate(n=>{const r=n.getBoundingClientRect();if(document.elementFromPoint(r.x+22,r.y+22)?.closest('button')!==n)throw Error('Heart hit target is obscured')});await page.mouse.move(initial.x+22,initial.y+22);await page.mouse.down()
     const pressed=await art.evaluate(n=>({transform:getComputedStyle(n).transform,opacity:getComputedStyle(n).opacity,hitWidth:n.parentElement.getBoundingClientRect().width,hitHeight:n.parentElement.getBoundingClientRect().height}))
     assert.equal(pressed.transform,'matrix(0.9, 0, 0, 0.9, 0, 0)');assert.equal(pressed.opacity,'0.72');assert.equal(pressed.hitWidth,44);assert.equal(pressed.hitHeight,44)
     await page.mouse.up()
     await page.waitForFunction(()=>document.querySelector('[data-action="toggle-song-save"]').getAttribute('aria-pressed')==='true')
     assert.equal(await heart.getAttribute('aria-label'),'곡 좋아요 취소');assert.ok((await art.getAttribute('src')).endsWith('detail-heart-selected.svg'));await art.evaluate(n=>n.decode())
     await page.reload();await page.waitForSelector('.home-v2-screen');await page.locator('[data-action="open-parts"]').press('Enter');await page.waitForSelector('.detail-v2-screen');assert.equal(await heart.getAttribute('aria-pressed'),'true','Like persists after reload')
     await heart.press('Space');assert.equal(await heart.getAttribute('aria-pressed'),'false');await heart.press('Enter');assert.equal(await heart.getAttribute('aria-pressed'),'true');const off=await heart.boundingBox();await page.mouse.click(off.x+22,off.y+22);assert.equal(await heart.getAttribute('aria-pressed'),'false')
     results.push({width,heart:{initial,pressed,persistence:true,keyboard:true,toggleOff:true}})
    }
   }
   await writeFile(output+'/results-'+width+'.json',JSON.stringify(results.filter(r=>r.width===width),null,2));assert.deepEqual(errors,[]);console.log('PASS Home guide/hero and Detail heart',width)
  }finally{await context.close()}
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
}finally{await browser?.close();server?.kill()}
