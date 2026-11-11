const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.IEUM_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-upper';fs.mkdirSync(out,{recursive:true});
const server=require('http').createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(fs.readFileSync(path.join(root,'public/index.html')));});
(async()=>{await new Promise(r=>server.listen(8784,'127.0.0.1',r));let browser;const report={checks:[],errors:[]};try{
 browser=await chromium.launch({headless:true,executablePath:process.env.IEUM_CHROMIUM_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 for(const width of [1100,390])for(const mode of ['upper','box']){
  const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:width===390?2:1,recordVideo:{dir:out,size:{width,height:1000}}});const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto('http://127.0.0.1:8784/'+(mode==='box'?'?motionStudy=box':''));await page.waitForFunction(()=>window.ieumDebug?.view);
  assert.equal(await page.locator('nav[aria-label="3D 모션 비교"] a').count(),3);
  await page.locator('#stage').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${width}-${mode}-rest.png`)});
  await page.click('#play',{force:true});await page.waitForTimeout(8000);
  const state=await page.evaluate(()=>({sources:ieumDebug.transport.sources.length,layers:ieumDebug.view.layers.map(l=>({active:l.uniforms.uUpperActive.value,ceiling:l.uniforms.uUpperCeiling.value,count:l.uniforms.uWave.value.length,min:Math.min(...l.uniforms.uWave.value),max:Math.max(...l.uniforms.uWave.value),sparkle:l.points.material.uniforms.uSparkle.value,finite:l.pos.every(Number.isFinite)}))}));
  assert.equal(state.sources,3);assert.ok(state.layers.every(l=>l.active===(mode==='upper'?1:0)&&l.count===(mode==='upper'?256:64)&&l.ceiling>1&&l.min>=0&&l.max<=1&&l.sparkle===1&&l.finite));
  await page.locator('#stage').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${width}-${mode}-play.png`)});
  await page.click('#flat',{force:true});await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>ieumDebug.view.morph),0);
  await page.click('#raised',{force:true});await page.click('#play',{force:true});await page.waitForFunction(()=>ieumDebug.view.layers.every(l=>l.uniforms.uUpperActive.value===0&&Array.from(l.uniforms.uWave.value).every(x=>x===1)));
  report.checks.push({width,mode,state});await context.close();
 }assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
