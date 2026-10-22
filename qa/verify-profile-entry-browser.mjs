import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir} from 'node:fs/promises'

// Isolated contexts/DB fixtures only. No personal browser, real account or Track submission.
const require=createRequire(import.meta.url)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4198'
const out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-profile-entry-qa'
await mkdir(out,{recursive:true})
let server
if(!process.env.IEUM_BASE_URL){
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4198','--strictPort'],{stdio:['ignore','pipe','pipe']})
  await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(String(data).includes('Local:'))resolve()});server.on('error',reject);server.on('exit',code=>reject(Error('Vite exited '+code)))})
}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,
  ...(process.env.IEUM_BROWSER_PROXY?{proxy:{server:process.env.IEUM_BROWSER_PROXY}}:{}),
  args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
try{
  for(const width of [390,430]){
    const context=await browser.newContext({viewport:{width:1440,height:1100},ignoreHTTPSErrors:process.env.IEUM_QA_IGNORE_HTTPS==='1'})
    const page=await context.newPage(),errors=[]
    page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(15000)
    await context.addInitScript(()=>{
      window.qaProfileStates=[]
      setInterval(()=>{const state=window.__IEUM_V2__?.state;if(state)window.qaProfileStates.push(Boolean(state.profile))},20)
    })
    await page.goto(base);await page.waitForFunction(()=>window.__IEUM_V2__?.state)
    const sentinel=await page.evaluate(()=>{localStorage.setItem('ieum-v2:user-state:v7',JSON.stringify({joined:false,fixtureSentinel:'profile-entry-real-user'}));return localStorage.getItem('ieum-v2:user-state:v7')})
    const scene=async(id,hasProfile)=>{
      await page.goto(`${base}/?demo=${id}`)
      await page.getByRole('button',{name:String(width),exact:true}).click()
      await page.locator(`[data-demo-profile-state="${hasProfile?'present':'absent'}"]`).waitFor()
      const frame=page.frames().find(frame=>frame.url().includes('scene='+id))
      assert.ok(frame)
      assert.equal(await frame.evaluate(()=>Boolean(window.__IEUM_V2__.state.profile)),hasProfile)
      assert.equal(await frame.evaluate(()=>innerWidth),width,'Test the actual app viewport, not just the outer menu')
      assert.equal(await frame.evaluate(()=>document.body.scrollWidth<=innerWidth),true)
      assert.equal(await frame.evaluate(()=>window.__IEUM_V2__.audioRuntime.stream?.active||false),false)
      return frame
    }
    let frame=await scene('first-visit',false)
    assert.equal(await frame.locator('.v2-recommended').getAttribute('data-recommendation-mode'),'general')
    assert.match(await frame.locator('.v2-recommended').innerText(),/Voice Profile을 만들면/)
    assert.doesNotMatch(await frame.locator('.v2-recruitment').innerText(),/내 음역과 취향에 맞는/)
    await frame.locator('[data-action="open-parts"]').click()
    await frame.locator('[data-part="tenor"] .row-action').click()
    assert.match(await frame.locator('[data-action="voice-setup"]').innerText(),/내 목소리 알아보기/)
    assert.equal(await frame.locator('[data-action="join-part"]').count(),0)
    await frame.locator('[data-action="voice-setup"]').click()
    await frame.waitForFunction(()=>window.__IEUM_V2__.state.screen==='voice')
    assert.equal(await frame.evaluate(()=>window.__IEUM_V2__.state.joined),false)
    await frame.locator('.screen [data-action="back"]').click()
    await frame.waitForFunction(()=>window.__IEUM_V2__.state.screen==='detail')

    // Simulate an already saved registration in this isolated first-visit DB.
    // Reload must preserve it and label the actual state, rather than delete it.
    await frame.evaluate(async()=>{
      const id='ieum-v2:voice-profile:v7',blob=await(await fetch('/demo-stems/soprano.wav')).blob()
      const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ieum-v2-demo-records:first-visit',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
      await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite'),store=tx.objectStore('tracks');store.put({id:id+':range',projectId:id,kind:'voice-range',range:'QA C3–G4',rangeData:{lowMidi:48,highMidi:67}});store.put({id:id+':sample',projectId:id,kind:'voice-sample',blob,duration:7,songLabel:'Saved isolated QA sample'});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})
      db.close()
    })
    frame=await scene('first-visit',true)
    assert.equal(await frame.evaluate(()=>window.__IEUM_V2__.state.profile.sampleSong),'Saved isolated QA sample')
    assert.match(await page.locator('[data-demo-profile-state]').innerText(),/직접 등록/)
    assert.equal(await frame.locator('.v2-recommended').getAttribute('data-recommendation-mode'),'range')
    assert.match(await frame.locator('.v2-song-count').first().innerText(),/내 음역 OPEN/)
    await page.screenshot({path:`${out}/restored-${width}.png`,fullPage:true})

    // Delay bootstrap independently of initial React render: present entry stays present.
    let release
    const gate=new Promise(resolve=>{release=resolve})
    const held=[]
    const hold=route=>{const task=gate.then(()=>route.continue());held.push(task);return task}
    await context.route('**/demo-stems/manifest.json',hold)
    try{
      await page.goto(`${base}/?demo=profile-ready`)
      await page.getByRole('button',{name:String(width),exact:true}).click()
      await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.__IEUM_V2__?.state)
      frame=page.frames().find(frame=>frame.url().includes('scene=profile-ready'))
      await frame.waitForFunction(()=>window.__IEUM_V2__?.state?.profile?.demo===true)
      assert.equal(await frame.locator('.loading-state').count(),1,'Keep the existing source-restore gate')
      assert.equal(await frame.evaluate(()=>window.qaProfileStates.includes(false)),false,'No absent-profile flash during delayed bootstrap')
    }finally{release();await Promise.all(held);await context.unroute('**/demo-stems/manifest.json',hold)}
    await page.locator('[data-demo-profile-state="present"]').waitFor()
    assert.equal(await frame.locator('.v2-recommended').getAttribute('data-recommendation-mode'),'range')
    await page.locator('.demo-menu nav a[href="?demo=profile-ready"]').click()
    assert.equal(await page.locator('[data-demo-profile-state="present"]').count(),1,'Reselecting the same scene preserves the reported state')
    await page.goBack()
    assert.equal(await page.locator('[data-demo-profile-state="present"]').count(),1,'Back across a duplicate scene does not lose the status')
    await frame.locator('[data-action="open-parts"]').click()
    await frame.locator('[data-part="tenor"] .row-action').click()
    assert.doesNotMatch(await frame.locator('[data-action="join-part"]').innerText(),/내 목소리 알아보기/)
    await frame.locator('[data-action="join-part"]').click()
    await frame.waitForFunction(()=>window.__IEUM_V2__.state.screen==='workspace')
    assert.equal(await frame.evaluate(()=>Object.keys(window.__IEUM_V2__.state.projectTracks).length),2,'Joining does not submit a Track')
    await page.screenshot({path:`${out}/present-${width}.png`,fullPage:true})

    // Reset is explicit and scoped; the regular user and other scenes survive.
    await scene('first-visit',true)
    await page.getByRole('button',{name:'이 상황 처음부터 다시 보기'}).click()
    await page.locator('[data-demo-profile-state="absent"]').waitFor()
    await page.screenshot({path:`${out}/absent-${width}.png`,fullPage:true})
    await scene('profile-ready',true)
    for(const id of ['music-a','music-b']){
      frame=await scene(id,true)
      assert.equal(await frame.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks).length),0,'No pre-submitted music Tracks')
    }
    assert.equal(await page.evaluate(()=>localStorage.getItem('ieum-v2:user-state:v7')),sentinel)
    await page.goto(base);await page.waitForFunction(()=>Object.keys(window.__IEUM_V2__?.state?.projectTracks||{}).length===2)
    assert.equal(await page.evaluate(()=>window.__IEUM_V2__.state.profile),null)
    assert.deepEqual(errors,[])
    await context.close()
    console.log(`PASS ${width}px: absent/present entry, delayed bootstrap, range recommendation, Setup return, direct join, saved registration reload, explicit isolated reset, original user and empty music A/B preserved`)
  }
}finally{await browser.close();server?.kill('SIGTERM')}
