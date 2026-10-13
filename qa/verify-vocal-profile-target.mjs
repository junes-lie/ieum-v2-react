import assert from 'node:assert/strict'
import {createServer} from 'vite'
import {createRequire} from 'node:module'
import path from 'node:path'
import os from 'node:os'
import {fileURLToPath} from 'node:url'
import {PERSON_BY_ID} from '../src/catalog.js'
assert.ok(os.freemem()>2*2**30,'Insufficient free RAM for one bounded browser QA')
const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),configFile:false,
  cacheDir:path.join(os.tmpdir(),`ieum-profile-target-qa-${process.pid}`),esbuild:{jsx:'transform'},server:{host:'127.0.0.1',port:0},plugins:[{
    name:'profile-target-local-qa',
    resolveId(id){if(id==='/qa-vocal-profile-entry.js')return '\0profile-target-entry'},
    load(id){if(id==='\0profile-target-entry')return "import React from 'react';import {createRoot} from 'react-dom/client';import App from '/src/App.jsx';createRoot(document.getElementById('root')).render(React.createElement(App));"},
    configureServer(instance){instance.middlewares.use((req,res,next)=>{
      if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><link rel="icon" href="data:,"><div id="root"></div><script type="module" src="/qa-vocal-profile-entry.js"></script>');return}
      // Empty isolated bootstrap: navigation QA does not re-analyse demo audio.
      if(req.url==='/demo-stems/manifest.json'){res.setHeader('Content-Type','application/json');res.end('{"tracks":[]}');return}
      next()
    })}
  }]})
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json'),{chromium}=require('playwright')
let browser,page
const errors=[]
try{
  if(!process.env.IEUM_QA_URL)await server.listen()
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
  page=await browser.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text().slice(0,300))})
  await page.addInitScript(()=>{if(!history.state?.ieumScreen)history.replaceState({ieumScreen:'vocal-profile',selectedVocalId:'min'},'','#vocal-profile')})
  await page.route('**/demo-stems/manifest.json',route=>route.fulfill({json:{tracks:[]}}))
  await page.goto(`${(process.env.IEUM_QA_URL || `http://127.0.0.1:${server.httpServer.address().port}`).replace(/\/$/,'')}/#vocal-profile`)
  const name=PERSON_BY_ID.min.name
  await page.waitForSelector('.vocal-name-line h1');assert.equal(await page.locator('.vocal-name-line h1').textContent(),name)
  const original=await page.evaluate(()=>JSON.stringify({profile:window.__IEUM_V2__.state.profile,tracks:window.__IEUM_V2__.state.projectTracks,projects:window.__IEUM_V2__.state.createdProjects}))
  await page.reload();await page.waitForSelector('.vocal-name-line h1')
  assert.equal(await page.locator('.vocal-name-line h1').textContent(),name)
  assert.equal(await page.evaluate(()=>history.state.selectedVocalId),'min')
  for(const id of ['missing-person','constructor','__proto__']){
    await page.evaluate(id=>{history.pushState({ieumScreen:'vocal-profile',selectedVocalId:id},'','#vocal-profile');dispatchEvent(new PopStateEvent('popstate',{state:history.state}))},id)
    await page.waitForSelector('.other-vocal-screen .empty-state')
    assert.ok((await page.locator('.empty-state').textContent()).includes('선택한 보컬 프로필을 확인할 수 없어요.'))
    assert.equal(await page.locator('.vocal-name-line,.voice-sample-block,[data-action="toggle-vocal-save"]').count(),0)
    await page.reload();await page.waitForSelector('.other-vocal-screen .empty-state')
    assert.equal(await page.evaluate(()=>history.state.selectedVocalId),id)
    await page.goBack();await page.waitForSelector('.vocal-name-line h1')
    assert.equal(await page.locator('.vocal-name-line h1').textContent(),name)
  }
  assert.equal(await page.evaluate(()=>JSON.stringify({profile:window.__IEUM_V2__.state.profile,tracks:window.__IEUM_V2__.state.projectTracks,projects:window.__IEUM_V2__.state.createdProjects})),original)
  assert.deepEqual(errors,[])
  console.log('PASS actual existing App 05A: chosen person survives reload/back; unknown/inherited IDs remain unavailable across reload; no other person/Sample/save action or Profile/Track/Project mutation. Empty isolated audio bootstrap, not real candidate/voice/design acceptance.')
}catch(error){console.error(JSON.stringify({message:error.message,errors,state:await page?.evaluate(()=>({history:history.state,screen:window.__IEUM_V2__?.state?.screen,text:document.body.innerText.slice(0,800)})).catch(()=>null)}));process.exitCode=1}
finally{await browser?.close();await server.close()}
