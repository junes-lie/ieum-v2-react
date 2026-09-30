import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire('C:\\Users\\LEE\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright\\package.json')
const { chromium } = require('playwright')
const browser = await chromium.launch({ headless:true, executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' })
const context = await browser.newContext({ viewport:{ width:390, height:844 }, locale:'ko-KR' })
const page = await context.newPage()
const errors=[]
page.on('console', message => { if (message.type()==='error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))

await page.goto('http://127.0.0.1:4191/#workspace', { waitUntil:'domcontentloaded' })
await page.waitForFunction(() => Object.keys(window.__IEUM_V2__?.state?.projectTracks || {}).length === 2, null, { timeout:30000 })
await page.evaluate(() => { location.hash='#workspace' })
await page.waitForSelector('.workspace-screen .record[data-resonance-engine="webgl-particles"]')
const record = page.locator('.workspace-screen .record').first()
const frameTimes=[0,2500,5000,7500,10000]
const frames=[]
let previous=0
for (const elapsed of frameTimes) {
  await page.waitForTimeout(elapsed-previous)
  previous=elapsed
  const file=path.join(here,`resonance-motion-${String(elapsed/1000).padStart(2,'0')}s.png`)
  const bytes=await record.screenshot({ path:file })
  frames.push({ elapsed, file:path.basename(file), sha256:createHash('sha256').update(bytes).digest('hex') })
}
const runtime=await record.evaluate(element => {
  const canvas=element.querySelector('.record-particles')
  return {
    engine:element.dataset.resonanceEngine,
    renderer:canvas?.dataset.renderer,
    particleCount:Number(canvas?.dataset.particleCount || 0),
    canvasTransform:getComputedStyle(canvas).transform,
    signature:element.dataset.recordSignature,
    webgl:Boolean(canvas?.getContext('webgl'))
  }
})
const result={
  runtime,
  frameHashesDistinct:new Set(frames.map(frame=>frame.sha256)).size===frames.length,
  frames,
  consoleErrors:errors
}
await fs.writeFile(path.join(here,'resonance-motion-results.json'),JSON.stringify(result,null,2))
console.log(JSON.stringify(result,null,2))
await browser.close()
