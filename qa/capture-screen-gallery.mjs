import {createRequire} from 'node:module'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

// Isolated browser context only. Never reset the user's browser or submit a Track.
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const root=fileURLToPath(new URL('../',import.meta.url))
const stamp=new Date().toISOString().replace(/[:.]/g,'-')
const output=path.resolve(process.env.IEUM_QA_OUTPUT||path.join(root,'qa/captures',stamp))
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4187'
const widths=(process.env.IEUM_QA_WIDTHS||'390,430').split(',').map(Number)
if(widths.some(n=>!Number.isInteger(n)||n<320||n>1440))throw Error('Invalid IEUM_QA_WIDTHS')
const proxy=process.env.IEUM_BROWSER_PROXY
const storage=process.env.IEUM_QA_STORAGE_STATE
const label=process.env.IEUM_CAPTURE_LABEL||'실제 앱 화면 · QA 전용 브라우저'
const revision=process.env.IEUM_CAPTURE_REVISION||'미지정'
const scenes=[
 ['01-home','홈','home','profile-ready'],
 ['01S-search','검색','search','search'],
 ['02-detail','곡·프로젝트 상세','detail','participate'],
 ['03-workspace','작업실','workspace','workspace'],
 ['P0-music-workspace','실제 음악 · 첫 녹음 작업실','workspace','music-a'],
 ['P0-music-recording','실제 음악 · 가사·멜로디·녹음 준비','record','music-a'],
 ['04-finder','보컬 찾기','finder','workspace'],
 ['05-match','후보 상세','finder','workspace','match'],
 ['05A-vocal-profile','다른 보컬 프로필','vocal-profile','workspace'],
 ['06-recording','녹음 준비','record','recording'],
 ['07-complete','완성곡','complete','complete'],
 ['08-projects','내 프로젝트','projects','workspace'],
 ['09-collection','컬렉션','collection','profile-ready'],
 ['10-my-voice','내 목소리','my','profile-ready'],
 ['01C-create-project','새 프로젝트','create-project','profile-ready'],
 ['VP01-voice-setup','목소리 등록 시작','voice','first-visit'],
]
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,
 ...(proxy?{proxy:{server:proxy}}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const results=[]
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
try{
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:1,locale:'ko-KR',reducedMotion:'reduce',ignoreHTTPSErrors:process.env.IEUM_QA_IGNORE_HTTPS==='1',...(storage?{storageState:storage}:{})})
  // Same local demonstration prerequisite used by existing layout QA; no remote writes.
  await context.addInitScript(()=>{if(!localStorage.getItem('ieum-v2:user-state:v7'))localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:true,joinedPart:'tenor'}))})
  const page=await context.newPage();page.setDefaultTimeout(15000)
  // A share URL may establish a cookie, but is never copied to reports/logs.
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000})
  await page.waitForFunction(()=>window.__IEUM_V2__?.state)
  const clean=new URL(page.url());clean.search='';clean.hash=''
  for(const [id,title,screen,scene,action] of scenes){
   const item={id,title,width,requestedScreen:screen,revision,label,status:'failed'}
   try{
    const target=new URL(clean);target.searchParams.set('scene',scene)
    await page.goto(target.href,{waitUntil:'domcontentloaded',timeout:45000})
    await page.waitForFunction(()=>window.__IEUM_V2__?.state)
    if(screen==='complete'){
     await page.evaluate(()=>{history.replaceState({ieumScreen:'home'},'','#home');dispatchEvent(new PopStateEvent('popstate',{state:history.state}))})
     await page.locator('.v2-completed-card').first().waitFor()
     await page.locator('.v2-completed-card').first().click()
    }else await page.evaluate(screen=>{history.replaceState({...history.state,ieumScreen:screen},'',location.pathname+location.search+'#'+screen);dispatchEvent(new PopStateEvent('popstate',{state:history.state}))},screen)
    await page.waitForFunction(screen=>window.__IEUM_V2__?.state?.screen===screen,screen)
    if(action==='match'){
     const candidate=page.locator('[data-action="candidate"],.candidate-open').first()
     await candidate.waitFor();await candidate.click()
     await page.locator('.candidate-screen').waitFor()
    }
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});setTimeout(r,5000)})));scrollTo(0,0);document.querySelector('.screen')?.scrollTo(0,0)})
    await page.waitForTimeout(400)
    if(screen==='search')await page.locator('.search-screen,.search-v2-screen').waitFor()
    if(screen==='complete')await page.locator('.complete-screen').waitFor()
    const surface=page.locator('.screen').first();await surface.waitFor()
    await page.screenshot({path:path.join(output,`${id}-${width}-viewport.png`),animations:'disabled'})
    // Hide fixed navigation only for the full-content export so it cannot obscure rows.
    // The paired viewport PNG is the unchanged real viewport, including its navigation.
    const navStyles=await page.locator('.bottom-nav').evaluateAll(nodes=>nodes.map(n=>{const s=n.getAttribute('style');n.style.setProperty('visibility','hidden','important');return s}))
    const restore=await surface.evaluate(n=>{const s=n.getAttribute('style');n.style.setProperty('max-height','none','important');n.style.setProperty('height','auto','important');n.style.setProperty('overflow','visible','important');return s})
    const file=`${id}-${width}.png`
    await surface.screenshot({path:path.join(output,file),animations:'disabled'})
    await surface.evaluate((n,s)=>s===null?n.removeAttribute('style'):n.setAttribute('style',s),restore)
    await page.locator('.bottom-nav').evaluateAll((nodes,styles)=>nodes.forEach((n,i)=>styles[i]===null?n.removeAttribute('style'):n.setAttribute('style',styles[i])),navStyles)
    item.status='captured';item.file=file;item.viewportFile=`${id}-${width}-viewport.png`;item.actualScreen=await page.evaluate(()=>window.__IEUM_V2__.state.screen)
    item.heading=(await page.locator('.screen h1').allTextContents()).join(' / ')
   }catch(error){item.error=String(error.message).split('\n')[0].replace(/https?:\/\/\S+/g,'[URL]')}
   results.push(item);console.log(item.status,id,width)
  }
  await context.close()
 }
}finally{await browser.close()}
const cards=[]
for(const r of results){
 const image=r.file?`<a download="${escape(r.file)}" href="data:image/png;base64,${(await readFile(path.join(output,r.file))).toString('base64')}"><img alt="${escape(r.title)} ${r.width}px" loading="lazy" src="data:image/png;base64,${(await readFile(path.join(output,r.file))).toString('base64')}"></a>`:`<p class="error">이 버전에서 캡처하지 못함: ${escape(r.error)}</p>`
 const viewport=r.viewportFile?`<a download="${escape(r.viewportFile)}" href="data:image/png;base64,${(await readFile(path.join(output,r.viewportFile))).toString('base64')}">원래 화면 크기 PNG 저장</a>`:''
 cards.push(`<article><h2>${escape(r.id)} · ${escape(r.title)}</h2><p>${r.width}px · ${escape(r.status)} · ${escape(r.heading||'')}</p>${viewport}${image}</article>`)
}
const origin=new URL(base).origin
await writeFile(path.join(output,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),origin,revision,label,results},null,2))
await writeFile(path.join(output,'index.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IEUM 화면 캡처</title><style>body{margin:24px;background:#15110e;color:#ece6dc;font:15px system-ui}header{max-width:900px;margin-bottom:32px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,430px));gap:24px;align-items:start}article{background:#262220;padding:16px;border-radius:8px}h2{font-size:17px}p{color:#bbb3a8;overflow-wrap:anywhere}img{width:100%;height:auto}.error{color:#edb7af}a{color:inherit}</style><header><h1>IEUM 화면 캡처</h1><p>${escape(label)} · ${escape(revision)}</p><p>${escape(origin)} · ${new Date().toISOString()}</p><p>이미지를 클릭하면 전체 내용 PNG를 저장할 수 있습니다. 긴 내용 캡처에서는 고정 하단 탭만 숨기며, 원래 화면 크기 PNG에는 원래 위치대로 포함됩니다. 캡처 실패와 미구현 화면은 그대로 표시합니다. 실제 사용자 데이터·물리 마이크 검증을 의미하지 않습니다.</p></header><main>${cards.join('')}</main></html>`)
console.log(JSON.stringify({output,captured:results.filter(r=>r.status==='captured').length,failed:results.filter(r=>r.status!=='captured').length}))
if(results.some(r=>r.status!=='captured'))process.exitCode=1
