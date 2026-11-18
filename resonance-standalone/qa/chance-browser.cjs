// Run against the built public directory; no Computer Use dependency.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.IEUM_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'../public'),out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-chance-browser';fs.mkdirSync(out,{recursive:true});
const server=require('http').createServer((q,r)=>{const name=decodeURIComponent(new URL(q.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){r.writeHead(403);return r.end();}try{r.setHeader('Content-Type',file.endsWith('.mp3')?'audio/mpeg':file.endsWith('.json')?'application/json':'text/html');r.end(fs.readFileSync(file));}catch{r.writeHead(404);r.end();}});
(async()=>{let browser;const report={checks:[],errors:[]};try{
 browser=await chromium.launch({headless:true,executablePath:process.env.IEUM_CHROMIUM_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(8787,'127.0.0.1',resolve);});
 for(const width of [1100,390]){
 const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:width===390?2:1});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))report.errors.push(m.text());});
 await page.goto('http://127.0.0.1:8787/');await page.waitForFunction(()=>window.ieumDebug?.view);await page.click('#play',{force:true});await page.waitForFunction(()=>ieumDebug.transport.sources.length===4,null,{timeout:60000});
 assert.deepEqual(await page.evaluate(()=>ieumDebug.transport.sources.map(s=>s.gain.gain.value)),[1,0,0,0]);
 for(const [label,t,lead] of [['intro',3,-1],['Steven',14,0],['Kara',26,1],['duet',83,-1]]){
 await page.evaluate(t=>ieumDebug.transport.seek(t),t);await page.waitForTimeout(1500);const samples=await page.evaluate(()=>new Promise(resolve=>{const values=[];const timer=setInterval(()=>{values.push({time:ieumDebug.transport.time,energy:ieumDebug.voices.map(v=>v.energy),field:ieumDebug.view.layers.map(l=>Math.sqrt(l.uniforms.uWave.value.reduce((s,x)=>s+x*x,0)/64)),finite:ieumDebug.view.layers.every(l=>l.pos.every(Number.isFinite))});if(values.length===12){clearInterval(timer);resolve(values);}},100);}));
 const avg=i=>samples.reduce((s,x)=>s+x.energy[i],0)/samples.length;console.log(width,label,samples[0].time,samples.at(-1).time,[0,1,2].map(avg));if(lead>=0)assert.ok(avg(lead)>avg(1-lead)*3,`${width} ${label} ownership`);assert.ok(samples.every(s=>s.finite));report.checks.push({width,label,energy:[0,1,2].map(avg),samples});
 await page.locator('#stage').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${width}-${label}.png`),fullPage:width===1100});}
 await page.evaluate(()=>ieumDebug.setCount(2));assert.equal(await page.evaluate(()=>ieumDebug.transport.sources.length),4);await page.evaluate(()=>ieumDebug.setCount(4));await page.evaluate(()=>ieumDebug.setCount(3));
 await page.evaluate(()=>ieumDebug.transport.seek(60));await page.waitForTimeout(1000);const before=await page.evaluate(()=>({frames:ieumDebug.view.frames,memory:{...ieumDebug.view.renderer.info.memory}}));await page.waitForTimeout(45000);const after=await page.evaluate(()=>({frames:ieumDebug.view.frames,memory:{...ieumDebug.view.renderer.info.memory},sources:ieumDebug.transport.sources.length}));assert.ok(after.frames>before.frames);assert.deepEqual(after.memory,before.memory);assert.equal(after.sources,4);report.checks.push({width,stability:{before,after}});
 await page.click('#flat',{force:true});await page.waitForTimeout(1500);await page.waitForFunction(()=>ieumDebug.view.morph<.001);await page.click('#raised',{force:true});
 await page.evaluate(()=>{document.querySelector('#particles').checked=false;document.querySelector('#particles').dispatchEvent(new Event('change'));});assert.equal(await page.evaluate(()=>ieumDebug.view.particles),false);
 await page.click('#play',{force:true});await page.waitForTimeout(4000);assert.equal(await page.evaluate(()=>ieumDebug.transport.sources.length),0);
 await page.waitForFunction(()=>ieumDebug.view.layers.every(l=>l.uniforms.uFlowLift.value<.001),null,{timeout:30000});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.evaluate(()=>{document.querySelector('#motion').checked=false;document.querySelector('#motion').dispatchEvent(new Event('change'));});assert.equal(await page.evaluate(()=>ieumDebug.view.speed),0);
 await page.evaluate(()=>ieumPreparedSong.select('today'));assert.equal(await page.evaluate(()=>ieumDebug.transport.items.length),1);await page.evaluate(()=>ieumPreparedSong.select('chance'));assert.equal(await page.evaluate(()=>ieumDebug.transport.items.length),4);

 await page.evaluate(()=>{document.querySelector('#motion').checked=true;document.querySelector('#motion').dispatchEvent(new Event('change'));document.querySelector('#particles').checked=true;document.querySelector('#particles').dispatchEvent(new Event('change'));});
 await page.evaluate(()=>ieumPreparedSong.select('slowly'));assert.equal(await page.evaluate(()=>ieumDebug.transport.items.length),4);
 assert.ok(Math.abs(await page.evaluate(()=>ieumDebug.transport.duration)-397.2)<.06);
 await page.evaluate(()=>ieumDebug.transport.play());
 for(const [label,t,lead] of [['slowly-B',31,1],['slowly-A',43,0],['slowly-duet',65,-1]]){
  await page.evaluate(t=>ieumDebug.transport.seek(t),t);await page.waitForTimeout(1500);const samples=await page.evaluate(()=>new Promise(resolve=>{const values=[];const timer=setInterval(()=>{values.push({energy:ieumDebug.voices.map(v=>v.energy),finite:ieumDebug.view.layers.every(l=>l.pos.every(Number.isFinite))});if(values.length===12){clearInterval(timer);resolve(values);}},100);}));
  const avg=i=>samples.reduce((s,x)=>s+x.energy[i],0)/samples.length;console.log(width,label,[0,1,2].map(avg));if(lead>=0)assert.ok(avg(lead)>avg(1-lead)*2,`${width} ${label} independent sources`);
  assert.ok(samples.every(x=>x.finite));report.checks.push({width,label,energy:[0,1,2].map(avg)});
  await page.locator('#stage').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${width}-${label}.png`),fullPage:width===1100});
 }
 await page.selectOption('#stem-audition','0');await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>ieumDebug.transport.items.map(s=>s.playbackGain)),[0,1,0,0]);
 await page.selectOption('#stem-audition','-1');assert.deepEqual(await page.evaluate(()=>ieumDebug.transport.items.map(s=>s.playbackGain)),[1,0,0,0]);
 await page.evaluate(()=>ieumDebug.transport.pause());assert.equal(await page.evaluate(()=>ieumDebug.transport.sources.length),0);
 await page.evaluate(()=>ieumPreparedSong.select('combined'));assert.equal(await page.evaluate(()=>ieumDebug.transport.items.length),2);
 await page.evaluate(()=>ieumPreparedSong.select('slowly'));assert.ok(page.url().includes('song=slowly'));
 await page.reload();await page.waitForFunction(()=>window.ieumDebug?.view);assert.equal(await page.locator('#prepared-choice').inputValue(),'slowly');
 await context.close();}
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 }finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
