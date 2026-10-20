// Current composite route: real renderer, responsive framing, audio and resource QA.
const {chromium}=require(process.env.IEUM_PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=process.env.IEUM_QA_OUTPUT||'/tmp/ieum-composite-flow';
fs.mkdirSync(out,{recursive:true});
const report=process.env.IEUM_FLOW_RESUME==='1'?JSON.parse(fs.readFileSync(path.join(out,'report.json'))):{checks:[],errors:[],captures:[],samples:[],environment:'Chromium headless / SwiftShader; emulated touch viewport, not physical iPhone or listening validation'};
delete report.failure;
const pass=(name,detail)=>{report.checks.push({name,detail});console.log('PASS',name,detail===undefined?'':JSON.stringify(detail));};
const file=path.join(root,'public/repetition-candidate.html');
const server=require('node:http').createServer((req,res)=>{try{const f=path.join(root,'public',new URL(req.url,'http://local').pathname);res.setHeader('Content-Type',f.endsWith('.html')?'text/html':f.endsWith('.png')?'image/png':'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.statusCode=404;res.end();}});
function wav(){const sr=24000,n=sr*3,b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++){const t=i/sr,phase=2*Math.PI*220*t,env=Math.min(1,t*8,(3-t)*8);b.writeInt16LE(Math.round(10000*env*(Math.sin(phase)+.15*Math.sin(phase*2))),44+i*2);}return b;}
(async()=>{
 await new Promise(r=>server.listen(8775,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.IEUM_CHROMIUM_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 let page,pump,busy=false;
 const capture=async name=>{await page.locator('#stage canvas').screenshot({path:path.join(out,name+'.png')});report.captures.push(name);};
 const completeMode=async mode=>{await page.click(mode?'#raised':'#flat');await page.evaluate(()=>{const v=ieumDebug.view;v.transitionAt=performance.now()-1000;v.update(0,false);});};
 try{
  for(const width of (process.env.IEUM_FLOW_RESUME==='1'?[1100]:[390,1100])){
   page=await browser.newPage({viewport:{width,height:width===390?844:1100},deviceScaleFactor:width===390?2:1,isMobile:width===390,hasTouch:width===390});page.setDefaultTimeout(30000);
   page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
   const active=page;pump=setInterval(async()=>{if(busy||active.isClosed())return;busy=true;try{await active.screenshot({clip:{x:0,y:0,width:1,height:1},timeout:4000});}catch{}finally{busy=false;}},800);
   await page.goto('http://127.0.0.1:8775/repetition-candidate.html?repetition=1&composite=1');await page.screenshot({clip:{x:0,y:0,width:1,height:1}});await page.waitForFunction(()=>window.ieumDebug?.view?.frames>2);
   await page.evaluate(()=>{ieumDebug.view.speed=0;ieumDebug.view.time=0;});
   if(process.env.IEUM_FLOW_RESUME!=='1'){
   for(const mode of [0,1]){
    await completeMode(mode);await capture(`${width}-${mode?'raised':'flat'}`);
    const bounds=await page.evaluate(()=>{const v=ieumDebug.view,cam=v.camera;cam.updateMatrixWorld();const world=cam.matrixWorldInverse.elements,proj=cam.projectionMatrix.elements;let minX=9,maxX=-9,minY=9,maxY=-9;const mul=(m,p)=>[0,1,2,3].map(row=>m[row]*p[0]+m[4+row]*p[1]+m[8+row]*p[2]+m[12+row]*p[3]);for(const l of v.layers.filter(l=>l.line.visible)){const a=l.line.geometry.attributes.aStart.array,f=l.line.geometry.attributes.aFlatStart.array,t=l.line.geometry.attributes.aT.array;for(let i=0;i<a.length;i+=18){const morph=v.morph,y=.018+(1-morph)*f[i+1]+(a[i+1]-.018)*morph*v.height+morph*v.height*.008*Math.sin(t[i/3]*2);const c=mul(proj,mul(world,[f[i],y,f[i+2],1]));const x=c[0]/c[3],z=c[1]/c[3];minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,z);maxY=Math.max(maxY,z);}}return{minX,maxX,minY,maxY};});
    assert.ok(Object.values(bounds).every(n=>Math.abs(n)<.99),'Colored geometry must fit canvas: '+JSON.stringify(bounds));pass(`${width}px ${mode?'3D':'2D'} line bounds`,bounds);
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));pass(`${width}px no horizontal overflow`);
   const identity=await page.evaluate(()=>ieumDebug.voices.map(v=>JSON.stringify(v.p)));
   for(const count of [2,4,3]){await page.selectOption('#voice-count',String(count));await page.screenshot({clip:{x:0,y:0,width:1,height:1}});await page.waitForFunction(n=>ieumDebug.view.layers.filter(l=>l.line.visible).length===n,count);assert.deepEqual(await page.evaluate(()=>ieumDebug.voices.map(v=>JSON.stringify(v.p))),identity);}
   pass(`${width}px 2–4 participants preserve profiles`);
   for(const id of ['A','B','C','all']){if(width===390)await page.tap(`[data-color="${id}"]`);else await page.click(`[data-color="${id}"]`);assert.deepEqual(await page.evaluate(()=>ieumDebug.voices.filter(v=>v.active&&v.visible).map(v=>v.p.id)),id==='all'?['A','B','C']:[id]);}
   pass(`${width}px color controls ${width===390?'with touch':'with mouse'}`);
   await page.locator('summary').click();await page.locator('#particles').uncheck();assert.equal(await page.evaluate(()=>ieumDebug.view.particles),false);await page.locator('#particles').check();await page.locator('summary').click();pass(`${width}px particle toggle`);
   if(width===390){clearInterval(pump);await page.close();continue;}
   }
  }
  // Real file selection/decode/analysis/transport using a generated known WAV.
  // This validates file handling, not human timbre quality or microphone capture.
  await page.locator('.file').first().setInputFiles({name:'qa-220hz.wav',mimeType:'audio/wav',buffer:wav()});
  await page.waitForFunction(()=>ieumDebug.voices[0].analysis&&!ieumDebug.voices[0].busy);
  const analysis=await page.evaluate(()=>({pitch:ieumDebug.voices[0].analysis.metrics.medianHz,seconds:ieumDebug.voices[0].realBuffer.duration}));assert.ok(analysis.pitch>210&&analysis.pitch<230&&analysis.seconds===3);pass('WAV upload decode and pitch analysis',analysis);
  await page.evaluate(()=>ieumDebug.view.speed=1);
  await page.click('#play');await page.waitForFunction(()=>ieumDebug.voices[0].energy>.02&&ieumDebug.view.layers[0].uniforms.uEnergy.value>.01);assert.equal(await page.evaluate(()=>ieumDebug.transport.sources.length),1);pass('uploaded file drives its voice and GPU deformation only');
  await page.click('#play');await page.waitForFunction(()=>ieumDebug.voices[0].energy<.01);assert.equal(await page.evaluate(()=>ieumDebug.transport.sources.length),0);pass('pause settles energy and releases audio source');
  await page.locator('summary').click();await page.click('#demo');await page.waitForFunction(()=>ieumDebug.voices.every(v=>v.buffer&&!v.realBuffer));await page.locator('summary').click();
  await page.selectOption('#voice-count','4');await page.click('#play');await page.waitForFunction(()=>ieumDebug.voices.every(v=>v.energy>.02&&v.bands.low+v.bands.mid+v.bands.high>.01));pass('four demo buffers populate actual FFT bands');
  await page.click('#play');
  for(let i=0;i<4;i++){await page.click('#play');await page.waitForFunction(()=>ieumDebug.transport.playing);await page.click('#play');assert.equal(await page.evaluate(()=>ieumDebug.transport.sources.length),0);}pass('repeated playback releases sources');
  await page.evaluate(()=>{ieumDebug.transport.loop=true;ieumDebug.view.speed=1;});await page.click('#play');
  const started=Date.now(),soakMs=Number(process.env.IEUM_SOAK_MS||180000);let iteration=0;
  while(Date.now()-started<soakMs){if(iteration%4===0)await completeMode(iteration%8===0?0:1);await page.waitForTimeout(5000);const sample=await page.evaluate(()=>({frames:ieumDebug.view.frames,geometries:ieumDebug.view.renderer.info.memory.geometries,textures:ieumDebug.view.renderer.info.memory.textures,sources:ieumDebug.transport.sources.length,playing:ieumDebug.transport.playing}));report.samples.push({elapsedMs:Date.now()-started,...sample});if(iteration%6===0)console.log('SOAK',JSON.stringify(report.samples.at(-1)));iteration++;}
  assert.ok(report.samples.at(-1).frames>report.samples[0].frames+30);assert.ok(report.samples.every(s=>s.geometries===report.samples[0].geometries&&s.textures===report.samples[0].textures&&s.sources===4&&s.playing));pass('three-minute mode/playback resource soak',report.samples.at(-1));
  assert.deepEqual(report.errors,[]);pass('no JavaScript or WebGL console errors');
  report.buildSHA256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');report.date=new Date().toISOString();
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('RESULT',path.join(out,'report.json'));
 }finally{clearInterval(pump);await page?.close();await browser.close();server.close();}
})().catch(e=>{report.failure=e.stack;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);server.close();process.exitCode=1;});
