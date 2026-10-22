import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawn,execFileSync} from 'node:child_process'

const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright')
const baseline=execFileSync('git',['show',`${process.env.IEUM_QA_RENDERER_BASELINE||'HEAD'}:src/resonanceWebGL.js`],{encoding:'utf8'})
let server,browser
try {
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4256','--strictPort'],{stdio:['ignore','pipe','inherit']})
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>String(d).includes('Local:')&&resolve());server.on('error',reject);server.on('exit',c=>reject(Error('Vite '+c)))})
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
 for(const ratio of [1,2]){
  const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:ratio}),page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.route('**/material-qa',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><body></body>'}))
  await page.goto('http://127.0.0.1:4256/material-qa')
  const result=await page.evaluate(async baseline=>{
   history.replaceState(null,'','?resonanceTime=7')
   const previousUrl=URL.createObjectURL(new Blob([baseline],{type:'text/javascript'}))
   const old=await import(previousUrl),current=await import('/src/resonanceWebGL.js')
   URL.revokeObjectURL(previousUrl)
   const paints=new WeakMap(),clear=CanvasRenderingContext2D.prototype.clearRect
   CanvasRenderingContext2D.prototype.clearRect=function(...args){paints.set(this.canvas,(paints.get(this.canvas)||0)+1);return clear.apply(this,args)}
   const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
   const results=[]
   for(const counterRotate of [false,true]){
    const levelRef={current:.3},renderers=[],pairs=[]
    for(const module of [old,current]){
     const box=document.createElement('div');box.style.cssText='position:relative;width:128px;height:128px'
     const canvas=document.createElement('canvas'),materialCanvas=document.createElement('canvas')
     for(const node of [canvas,materialCanvas]){node.style.cssText='position:absolute;width:100%;height:100%';box.append(node)}document.body.append(box)
     pairs.push({box,canvas,materialCanvas})
     renderers.push(module.createResonanceRenderer({canvas,materialCanvas,slots:[{partId:'soprano',seed:123,spread:.1,turbulence:.72,opacity:.34,drift:.24},null,null,null],projectSeed:'material-regression',state:'recording',activePartIndex:0,levelRef,reducedMotion:false,counterRotate}))
    }
    const snapshot=()=>pairs.map(({canvas,materialCanvas})=>({material:materialCanvas.toDataURL(),particles:canvas.toDataURL(),paints:paints.get(materialCanvas)||0,pixels:materialCanvas.width}))
    await frames();const first=snapshot()
    await frames();const repeat=snapshot()
    levelRef.current=.9;await frames();const live=snapshot()
    history.replaceState(null,'','?resonanceTime=8');await frames();const rotated=snapshot()
    pairs.forEach(({box})=>box.style.width='160px');await frames();const resized=snapshot()
    pairs.forEach(({materialCanvas})=>{materialCanvas.width=materialCanvas.width;materialCanvas.dispatchEvent(new Event('contextrestored'))})
    await frames();const restored=snapshot()
    results.push({counterRotate,first,repeat,live,rotated,resized,restored})
    renderers.forEach(r=>r.dispose());pairs.forEach(({box})=>box.remove())
    history.replaceState(null,'','?resonanceTime=7')
   }
   CanvasRenderingContext2D.prototype.clearRect=clear
   return results
  },baseline)
  for(const row of result){
   for(const stage of ['first','repeat','live','rotated','resized','restored']){
    assert.equal(row[stage][1].material,row[stage][0].material,`${stage}: material pixels match baseline`)
    assert.equal(row[stage][1].particles,row[stage][0].particles,`${stage}: particle pixels match baseline`)
   }
   assert.equal(row.repeat[1].paints,row.first[1].paints,'Unchanged material is reused while particles keep drawing')
   assert.notEqual(row.live[1].particles,row.repeat[1].particles,'Live microphone amplitude still changes particles')
   if(row.counterRotate){assert.notEqual(row.rotated[1].material,row.live[1].material);assert.ok(row.rotated[1].paints>row.live[1].paints)}
   assert.equal(row.resized[1].pixels,160*ratio);assert.ok(row.resized[1].paints>row.rotated[1].paints,'Resize invalidates material')
   assert.equal(row.restored[1].material,row.resized[1].material);assert.ok(row.restored[1].paints>row.resized[1].paints,'Context restoration repaints the material')
  }
  assert.deepEqual(errors,[])
  console.log('PASS DPR',ratio,'baseline material AND particle pixel equality; live amplitude, rotation and resize preserved; identical material repaint removed')
  await context.close()
 }
}finally{await browser?.close();server?.kill()}
