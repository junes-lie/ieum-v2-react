const {chromium}=require(process.env.IEUM_PLAYWRIGHT_PATH||'playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'renders');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.IEUM_CHROMIUM_PATH||undefined,args:process.env.IEUM_CHROMIUM_ARGS?JSON.parse(process.env.IEUM_CHROMIUM_ARGS):['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const checks=[],errors=[],samples=[];const check=(name,ok,detail)=>{assert.ok(ok,name+': '+JSON.stringify(detail));checks.push({name,pass:true,detail});console.log('PASS',name);};
 try{
 const page=await browser.newPage({viewport:{width:1280,height:1800},deviceScaleFactor:1});page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 let busy=false,capturingFull=false;const pump=setInterval(async()=>{if(busy||capturingFull||page.isClosed())return;busy=true;try{await page.screenshot({clip:{x:0,y:0,width:1,height:1},timeout:5000});}catch{}finally{busy=false;}},600);page.on('close',()=>clearInterval(pump));
 const snap=async name=>{if(process.env.IEUM_CAPTURE!=='1')return;capturingFull=true;while(busy)await page.waitForTimeout(50);busy=true;try{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(out,name+'.jpg'),type:'jpeg',quality:88,fullPage:true,animations:'disabled',timeout:60000});}finally{busy=false;capturingFull=false;}};
 await page.goto('file://'+path.join(root,'public/IEUM-Resonance.html'));await page.waitForFunction(()=>ieumDebug.state.frames>3);
 await page.selectOption('#voice-count','4');await page.click('#play');await page.waitForFunction(()=>ieumDebug.voices.every(v=>v.analyser&&v.energy>.02));check('four participants before first play',true);
 check('real FFT bands populated',await page.evaluate(()=>ieumDebug.voices.every(v=>v.bands.low+v.bands.mid+v.bands.high>.05)));
 await page.click('#play');await page.waitForFunction(()=>ieumDebug.voices.every(v=>v.energy<.01&&v.bands.low<.02&&v.bands.mid<.02));check('pause settles energy and bands',await page.evaluate(()=>ieumDebug.voices.every(v=>v.bands.low<.02&&v.bands.mid<.02)));
 await page.locator('summary').click();await page.locator('#motion').uncheck();
 const base=await page.evaluate(()=>ieumDebug.voices.map(v=>JSON.stringify(v.p)));
 const phases=await page.evaluate(()=>Array.from(ieumDebug.view.layers[0].phases));
 await page.selectOption('#voice-count','2');await page.waitForFunction(()=>ieumDebug.view.layers.filter(l=>l.line.visible).length===2);
 check('two participants render',await page.locator('.voice:visible').count()===2);
 check('addition removal preserves identity',await page.evaluate(()=>ieumDebug.voices.map(v=>JSON.stringify(v.p))).then(x=>JSON.stringify(x)===JSON.stringify(base)));
 check('existing particle phase preserved',await page.evaluate(()=>Array.from(ieumDebug.view.layers[0].phases)).then(x=>JSON.stringify(x)===JSON.stringify(phases)));
 await snap('two-voices');await page.selectOption('#voice-count','4');await page.waitForFunction(()=>ieumDebug.view.layers.filter(l=>l.line.visible).length===4);await snap('four-voices');
 check('crossing field changes composition',await page.evaluate(()=>ieumDebug.view.layers.every(l=>Math.max(...l.contacts)>.1)));
 const svg=await page.evaluate(()=>ieumDebug.voices.map(v=>ieumDebug.bloomSVG(v.p,320)));check('four different silhouettes',new Set(svg.map(s=>s.replace(/#[a-f0-9]{6}/g,'COLOR').replace(/[ABCD] 목소리/g,'VOICE'))).size===4);
 check('same profile exact SVG reproduction',await page.evaluate(()=>ieumDebug.bloomSVG(ieumDebug.profiles[0])===ieumDebug.bloomSVG(structuredClone(ieumDebug.profiles[0]))));
 for(let i=0;i<4;i++){await page.locator('.bloom').nth(i).click();await snap('personal-'+String.fromCharCode(65+i));await page.keyboard.press('Escape');}
 await page.selectOption('#voice-count','3');await page.locator('summary').click();await snap('desktop-idle');
 await page.click('#flat');await page.waitForFunction(()=>ieumDebug.view.morph<.01);await snap('planar');await page.click('#raised');await page.waitForFunction(()=>ieumDebug.view.morph>.99);
 await page.locator('summary').click();await page.locator('#motion').check();await page.locator('summary').click();await page.click('#play');await page.waitForFunction(()=>ieumDebug.voices[0].energy>.1);await snap('playing');await page.click('#play');await page.waitForFunction(()=>ieumDebug.voices[0].energy<.01);await snap('paused');
 // Repeated user operations, then a sustained real-time rendering soak.
 await page.locator('summary').click();await page.click('#repeat');
 for(let i=0;i<6;i++){await page.selectOption('#voice-count',String(2+i%3));await page.click('#play');await page.waitForFunction(()=>ieumDebug.state.playing);await page.click('#play');}
 check('repeated playback stable',await page.evaluate(()=>!ieumDebug.transport.sources.length));
 await page.selectOption('#voice-count','4');await page.click('#play');await page.waitForFunction(()=>ieumDebug.state.playing);
 const soakMs=Number(process.env.IEUM_SOAK_MS||180000),start=Date.now();
 while(Date.now()-start<soakMs){await page.waitForTimeout(5000);const sample=await page.evaluate(()=>({frames:ieumDebug.view.frames,fps:ieumDebug.view.fps,geometries:ieumDebug.view.renderer.info.memory.geometries,textures:ieumDebug.view.renderer.info.memory.textures,heap:performance.memory?.usedJSHeapSize||null,sources:ieumDebug.transport.sources.length}));samples.push({elapsed:Date.now()-start,...sample});if(samples.length%6===0)console.log('SOAK',samples.at(-1));}
 check('soak rendered continuously',samples.at(-1).frames>samples[0].frames+30);
 check('soak GPU resources bounded',samples.every(s=>s.geometries<=12&&s.textures===1&&s.sources<=4),{geometries:samples.map(s=>s.geometries),textures:samples.map(s=>s.textures)});
 check('no runtime errors',errors.length===0,errors);
 await page.click('#play');await page.setViewportSize({width:390,height:950});await snap('mobile-four');check('four-person mobile fits',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 fs.writeFileSync(path.join(__dirname,'extended-verification.json'),JSON.stringify({date:new Date().toISOString(),environment:'Linux headless Chromium / SwiftShader; software rendering, not target device performance or listening verification',soakMs,checks,samples,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
