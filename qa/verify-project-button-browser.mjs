import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4198'
let server
if(!process.env.IEUM_BASE_URL){
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4198','--strictPort'],{stdio:['ignore','pipe','pipe']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',code=>reject(Error('Vite '+code)))})
}
const output=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-project-button'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
try{
 for(const width of [390,430]){
  const context=await browser.newContext({viewport:{width,height:932},locale:'ko-KR',reducedMotion:'reduce'}),page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  await page.goto(base);await page.waitForSelector('.v2-project-action');await page.evaluate(()=>document.fonts.ready)
  const button=page.locator('.v2-project-action')
  await button.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}))
  assert.equal(await button.evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),true,'Project action is unobscured and receives pointer input')
  const geometry=await button.evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n),surface=getComputedStyle(n.firstElementChild),label=n.lastElementChild.getBoundingClientRect();return {width:r.width,height:r.height,radius:s.borderRadius,font:s.fontFamily,size:s.fontSize,line:s.lineHeight,weight:s.fontWeight,color:s.color,surface:surface.borderImageSource,cap:surface.borderImageWidth,labelInside:label.left>=r.left&&label.right<=r.right&&label.top>=r.top&&label.bottom<=r.bottom,body:document.body.scrollWidth}})
  assert.equal(geometry.width,width===390?350:382);assert.equal(geometry.height,48);assert.equal(geometry.radius,'24px')
  assert.ok(geometry.font.includes('Pretendard'));assert.equal(geometry.size,'15px');assert.equal(geometry.line,'22px');assert.equal(geometry.weight,'500');assert.equal(geometry.color,'rgb(61, 50, 33)')
  assert.ok(geometry.surface.includes('/artwork/figma-project-gold-current.svg'));assert.deepEqual(geometry.cap.split(' ').map(parseFloat),[0,24]);assert.equal(geometry.labelInside,true);assert.equal(geometry.body,width)
  const asset=await page.request.get(base+'/artwork/figma-project-gold-current.svg');assert.equal(asset.status(),200)
  assert.deepEqual(await asset.body(),await readFile(new URL('../public/artwork/figma-project-gold-current.svg',import.meta.url)))
  assert.equal(await page.locator('.v2-listen-surface img').first().getAttribute('src'),'/artwork/figma-player-play-surface.svg','Home 36px listening controls retain confirmed Smoky source')
  const project=await page.locator('.v2-recruit-record').getAttribute('data-project-id')
  const tracks=await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length)
  await page.screenshot({path:output+'/home-'+width+'.png'})
  await button.screenshot({path:output+'/project-button-'+width+'.png'})
  await button.click();await page.waitForSelector('.detail-screen')
  await page.getByRole('button',{name:'뒤로',exact:true}).click();await page.waitForSelector('.home-v2-screen')
  assert.equal(await page.locator('.v2-recruit-record').getAttribute('data-project-id'),project)
  assert.equal(await page.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),tracks)
  await page.addStyleTag({content:'.v2-project-action{font-size:30px!important;line-height:44px!important}'})
  const fits=await button.evaluate(n=>{const b=n.getBoundingClientRect(),r=n.lastElementChild.getBoundingClientRect();return r.left>=b.left&&r.right<=b.right&&r.top>=b.top&&r.bottom<=b.bottom})
  assert.equal(fits,true,'2x label stress stays inside the 48px capsule')
  await button.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}))
  await button.screenshot({path:output+'/project-button-2x-text-'+width+'.png'})
  assert.deepEqual(errors,[]);results.push({width,geometry});await context.close()
 }
 await writeFile(output+'/results.json',JSON.stringify(results,null,2))
 console.log('PASS Current Gold project surface, Medium label, uncut 24px caps, exact Back and 2x label stress at 390/430px')
}finally{await browser.close();server?.kill()}
