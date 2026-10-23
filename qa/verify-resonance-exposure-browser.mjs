import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'

// Fixed shader time isolates raster coverage from motion. Compare each small
// record with its own layers at Detail size; never inject a profile or Track.
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const base=process.env.IEUM_BASE_URL||'http://127.0.0.1:4296/'
const out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-glow'
const widths=(process.env.IEUM_QA_WIDTHS||'390,430').split(',').map(Number)
const dprs=(process.env.IEUM_QA_DPRS||'1,2').split(',').map(Number)
const scenes=(process.env.IEUM_QA_SCENES||'first-visit,profile-ready,participate,search,workspace,recording,complete').split(',')
const results=[]
let server,browser
await mkdir(out,{recursive:true})

async function sample(canvas){
  return canvas.evaluate(c=>{
    const scaled=document.createElement('canvas')
    scaled.width=scaled.height=48
    const ctx=scaled.getContext('2d')
    ctx.fillStyle='#000'
    ctx.fillRect(0,0,48,48)
    ctx.drawImage(c,0,0,48,48)
    const data=ctx.getImageData(0,0,48,48).data
    let light=0,hot=0
    for(let i=0;i<data.length;i+=4){
      const l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]
      light+=l
      if(l>160)hot++
    }
    return {light:light/2304,hot}
  })
}

try{
  if(!process.env.IEUM_BASE_URL){
    server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4296','--strictPort'],{stdio:['ignore','pipe','inherit']})
    await new Promise((resolve,reject)=>{
      server.stdout.on('data',d=>String(d).includes('Local:')&&resolve())
      server.on('error',reject)
      server.on('exit',code=>reject(Error('Preview exited: '+code)))
    })
  }
  browser=await chromium.launch({
    executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/tmp/chromium',headless:true,
    proxy:process.env.IEUM_BROWSER_PROXY?{server:process.env.IEUM_BROWSER_PROXY}:undefined,
    args:['--no-sandbox','--no-zygote','--use-angle=swiftshader','--enable-unsafe-swiftshader']
  })
  for(const width of widths)for(const dpr of dprs){
    const context=await browser.newContext({viewport:{width,height:932},deviceScaleFactor:dpr,reducedMotion:'reduce',ignoreHTTPSErrors:true})
    const page=await context.newPage(),errors=[]
    page.on('pageerror',e=>errors.push(e.message))
    page.setDefaultTimeout(30000)
    for(const scene of scenes){
      const url=new URL(base)
      for(const [key,value] of Object.entries({embedded:'1',scene,resonanceTime:'0'}))url.searchParams.set(key,value)
      await page.goto(url.href)
      await page.waitForSelector('.record-particles[data-renderer]')
      await page.evaluate(()=>document.fonts.ready)
      const canvases=page.locator('.record-particles'),count=await canvases.count()
      for(let i=0;i<count;i++){
        const canvas=canvases.nth(i)
        await canvas.scrollIntoViewIfNeeded()
        await page.waitForTimeout(100)
        const original=await canvas.evaluate(c=>({
          css:c.clientWidth,buffer:c.width,signature:c.parentElement.dataset.recordSignature,
          layers:c.parentElement.dataset.resonanceLayerCount,style:c.getAttribute('style'),
          screen:c.closest('main,section')?.className
        }))
        if(original.css<8)continue
        assert.equal(original.buffer,Math.round(Math.max(original.css,184)*dpr))
        if(original.css>=184)continue
        const actual=await sample(canvas)
        await canvas.evaluate(c=>{
          c.style.setProperty('width','184px','important')
          c.style.setProperty('height','184px','important')
        })
        await page.waitForFunction(({i,dpr})=>document.querySelectorAll('.record-particles')[i].width===184*dpr,{i,dpr})
        await page.waitForTimeout(80)
        const reference=await sample(canvas)
        await canvas.evaluate((c,style)=>style===null?c.removeAttribute('style'):c.setAttribute('style',style),original.style)
        await page.waitForTimeout(80)
        assert.equal(await canvas.locator('..').getAttribute('data-record-signature'),original.signature)
        const ratio=actual.light/reference.light
        results.push({width,dpr,scene,i,...original,actual,reference,ratio})
        assert.ok(Math.abs(ratio-1)<.025,JSON.stringify(results.at(-1)))
      }
      if(scene==='participate'){
        const pair=await page.evaluate(()=>[
          document.querySelector('.project-carousel .record'),document.querySelector('.detail-record .record')
        ].map(r=>({signature:r.dataset.recordSignature,pixels:r.querySelector('.record-particles').toDataURL()})))
        assert.equal(pair[0].signature,pair[1].signature)
        assert.equal(pair[0].pixels,pair[1].pixels,'Thumbnail/selected project must render the same light and threads')
      }
      if(dpr===1){
        const target=page.locator('.v2-recent')
        if(await target.count())await target.screenshot({path:`${out}/${scene}-recent-${width}.png`})
        else await page.screenshot({path:`${out}/${scene}-${width}.png`,fullPage:true})
      }
      console.log('PASS',width,dpr,scene,'canvases',count)
    }
    assert.deepEqual(errors,[])
    await context.close()
  }
  // Normal motion remains live after changing the raster size.
  const context=await browser.newContext({viewport:{width:430,height:932},reducedMotion:'no-preference',ignoreHTTPSErrors:true})
  const page=await context.newPage()
  await page.goto(base+'?embedded=1&scene=participate')
  const moving=page.locator('.project-carousel .record-particles').first()
  await moving.waitFor()
  await moving.scrollIntoViewIfNeeded()
  const rotation=await moving.getAttribute('data-rotation')
  await page.waitForFunction(previous=>document.querySelector('.project-carousel .record-particles')?.dataset.rotation!==previous,rotation)
  assert.equal(await moving.evaluate(c=>c.clientWidth),48)
  await context.close()
  await writeFile(out+'/results.json',JSON.stringify(results,null,2))
  console.log('PASS normalized light; maximum ratio',Math.max(...results.map(r=>r.ratio)),'; live motion retained')
}finally{
  await browser?.close()
  server?.kill()
}
