// Run with IEUM_PLAYWRIGHT_PATH and IEUM_CHROMIUM_PATH as needed.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.IEUM_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-spectral';
fs.mkdirSync(out,{recursive:true});
const server=require('http').createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(fs.readFileSync(path.join(root,'public/index.html')));});
(async()=>{await new Promise(r=>server.listen(8783,'127.0.0.1',r));let b;const report={errors:[],checks:[]};try{
 b=await chromium.launch({headless:true,executablePath:process.env.IEUM_CHROMIUM_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 for(const width of [1100,390])for(const mode of ['spectral','box']){
  const context=await b.newContext({viewport:{width,height:1000},deviceScaleFactor:width===390?2:1,recordVideo:{dir:out,size:{width,height:1000}}});
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await p.goto('http://127.0.0.1:8783/'+(mode==='box'?'?motionStudy=box':''));await p.waitForFunction(()=>window.ieumDebug?.view);
  await p.locator('#stage').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,`${width}-${mode}-rest.png`)});
  await p.evaluate(()=>ieumDebug.transport.loop=true);await p.click('#play',{force:true});await p.waitForTimeout(8000);
  const state=await p.evaluate(()=>({sources:ieumDebug.transport.sources.length,mode:ieumDebug.view.mode,layers:ieumDebug.view.layers.map(l=>({spectral:!!l.uniforms.uWave.value.spectral,finite:Array.from(l.uniforms.uWave.value).every(Number.isFinite),spread:Math.max(...l.uniforms.uWave.value)-Math.min(...l.uniforms.uWave.value),count:l.count}))}));
  assert.equal(state.sources,3);assert.ok(state.layers.every(l=>l.finite&&l.spectral===(mode==='spectral')));
  await p.locator('#stage').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,`${width}-${mode}-play.png`)});
  await p.click('#play',{force:true});await p.waitForFunction(()=>ieumDebug.view.layers.every(l=>Array.from(l.uniforms.uWave.value).every(x=>x===1)));
  report.checks.push({width,mode,state});await context.close();
 }
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'spectral-browser.json'),JSON.stringify(report,null,2));
}finally{if(b)await b.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
