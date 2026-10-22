import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4297/'
const out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-profile-detail'
assert.ok(process.env.IEUM_QA_FAKE_AUDIO_FILE,'Provide a voiced WAV for isolated synthetic-microphone range detection; the default Chromium noise source is not a voice fixture')
await mkdir(out,{recursive:true})
let server
if(!process.env.IEUM_BASE_URL){server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4297','--strictPort'],{cwd:new URL('../',import.meta.url),stdio:['ignore','pipe','inherit']});await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required',...(process.env.IEUM_QA_FAKE_AUDIO_FILE?[`--use-file-for-fake-audio-capture=${process.env.IEUM_QA_FAKE_AUDIO_FILE}`]:[])]})
try{for(const width of [390,430]){
 const c=await browser.newContext({viewport:{width,height:932},permissions:['microphone'],reducedMotion:'reduce'}),p=await c.newPage(),errors=[]
 p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(20000)
 await p.goto(base+'?scene=first-visit&run=profile-native')
 await p.locator('[data-action="open-parts"]').scrollIntoViewIfNeeded();await p.locator('[data-action="open-parts"]').click()
 await p.locator('[data-action="voice-setup"]').click()
 await p.locator('[data-action="range-start"]').click()
 await p.waitForFunction(()=>Number(document.querySelector('[data-action="range-finish"]')?.textContent.match(/(\d+) samples/)?.[1])>=6)
 console.log('RANGE',width);await p.locator('[data-action="range-finish"]').click()
 await p.locator('[data-action="sample-next"]').click()
 await p.locator('.sample-select-stage>button.primary').click()
 await p.locator('[data-action="sample-start"]').click()
 await p.waitForSelector('[data-action="sample-stop"]:enabled')
 await p.waitForFunction(()=>window.__IEUM_V2__.audioRuntime.context.currentTime-window.__IEUM_V2__.audioRuntime.activeStartedAt>3.5)
 await p.locator('[data-action="sample-stop"]').click()
 await p.locator('[data-action="voice-complete"]').click()
 await p.locator('[data-action="preferences-skip"]').click()
 await p.locator('[data-action="profile-finish"]').click();console.log('PROFILE SAVED',width)
 await p.waitForSelector('.detail-harmony')
 const profile=await p.evaluate(()=>window.__IEUM_V2__.state.profile)
 assert.ok(profile.rangeData.sampleCount>=6)
 assert.ok(profile.sampleFeatures.fingerprint)
 assert.ok(profile.sampleProvenance.audioSha256)
 assert.equal(profile.demo,undefined)
 assert.equal(profile.matchingPreview,undefined)
 assert.equal(await p.locator('.detail-profile-guide').count(),0)
 assert.match(await p.locator('.detail-fit').innerText(),/요구 음역/)
 assert.match(await p.locator('.detail-match-reasons').innerText(),/기존 참여자의 제출 Track 음색 분석값/)
 assert.equal(await p.locator('[data-action="join-part"]').isEnabled(),true)
 await p.screenshot({path:`${out}/registered-detail-${width}.png`})
 await p.reload();await p.waitForFunction(()=>window.__IEUM_V2__?.state.profile?.sampleFeatures);if(await p.evaluate(()=>window.__IEUM_V2__.state.screen)==='home'){await p.locator('[data-action="open-parts"]').click()}await p.waitForSelector('.detail-harmony')
 assert.equal(await p.evaluate(()=>window.__IEUM_V2__.state.profile.sampleFeatures.fingerprint),profile.sampleFeatures.fingerprint)
 await p.locator('[data-action="join-part"]').click();await p.waitForSelector('.workspace-v2-screen')
 assert.deepEqual(await p.evaluate(()=>Object.keys(window.__IEUM_V2__.state.activeTracks)),[])
 assert.deepEqual(errors,[])
 await writeFile(`${out}/result-${width}.json`,JSON.stringify({scope:'Native synthetic-microphone registration, not physical voice acceptance',range:profile.rangeData,analysis:profile.sampleFeatures,provenance:profile.sampleProvenance,profileReturn:true,missingMemberReasons:true,participation:true},null,2))
 console.log('PASS',width,'native range/sample registration → same Detail, measured Profile restored, Part Fit independent, absent member data explained, participation allowed, no demo scores or submitted Tracks')
 await c.close()
}}finally{await browser.close();server?.kill()}
