const {chromium}=require(process.env.IEUM_PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),file=path.join(root,'public/IEUM-Resonance.html');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.IEUM_CHROMIUM_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const checks=[],errors=[];const check=(name,ok)=>{assert.ok(ok,name);checks.push({name,pass:true});console.log('PASS',name);};
 try{
 const p=await b.newPage({viewport:{width:1100,height:1400},deviceScaleFactor:1});
 let reading=false;const pump=setInterval(async()=>{if(reading||p.isClosed())return;reading=true;try{await p.screenshot({clip:{x:0,y:0,width:1,height:1},timeout:5000});}catch{}finally{reading=false;}},500);p.on('close',()=>clearInterval(pump));p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto('file://'+file+'?contourStudy=1');await p.waitForFunction(()=>ieumDebug.view?.frames>3);
 check('study opens in planar mode',await p.evaluate(()=>ieumDebug.view.mode===0));
 await p.addStyleTag({content:'#stage{height:650px}'});await p.evaluate(()=>document.fonts.ready);
 const base=await p.evaluate(()=>ieumDebug.view.layers.map(l=>Array.from(l.line.geometry.attributes.aStart.array)));
 await p.click('#flat');await p.waitForFunction(()=>ieumDebug.view.morph<.001);
 check('planar interpolation reaches endpoint',await p.evaluate(()=>ieumDebug.view.layers.every(l=>l.uniforms.uMorph.value<.001)));
 check('planar geometry differs from flattened spatial geometry',await p.evaluate(()=>ieumDebug.view.layers.every(l=>{const a=l.line.geometry.attributes.aStart.array,b=l.line.geometry.attributes.aFlatStart.array;return a.some((v,i)=>i%3!==1&&Math.abs(v-b[i])>.1);}))); 
 const snap=async name=>{const data=await p.evaluate(()=>{const v=ieumDebug.view;v.update(0,false);const c=document.createElement('canvas');c.width=v.renderer.domElement.width;c.height=v.renderer.domElement.height;const ctx=c.getContext('2d');ctx.fillStyle='#101111';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(v.renderer.domElement,0,0);return c.toDataURL('image/jpeg',.95).split(',')[1];});fs.writeFileSync(path.join(__dirname,'renders',name+'.jpg'),Buffer.from(data,'base64'));};
 for(const n of [2,3,4]){await p.selectOption('#voice-count',String(n));await p.waitForFunction(n=>ieumDebug.view.layers.filter(l=>l.line.visible).length===n,n);await snap('contour-study-'+n);check(n+' planar layers finite',await p.evaluate(()=>ieumDebug.view.layers.every(l=>Array.from(l.pos).every(Number.isFinite))));}
 await p.selectOption('#voice-count','3');await p.click('#raised');await p.waitForFunction(()=>ieumDebug.view.morph>.999);
 check('spatial source coordinates unchanged by switching',await p.evaluate(base=>ieumDebug.view.layers.every((l,i)=>JSON.stringify(Array.from(l.line.geometry.attributes.aStart.array))===JSON.stringify(base[i])),base));
 await snap('contour-study-spatial');
 await p.click('#flat');await p.waitForFunction(()=>ieumDebug.view.morph<.001);await p.click('#play');await p.waitForFunction(()=>ieumDebug.voices[0].energy>.03);
 check('planar responds to real analyser',await p.evaluate(()=>ieumDebug.view.layers[0].uniforms.uEnergy.value>.03));
 await p.click('#play');await p.waitForFunction(()=>ieumDebug.voices.every(v=>v.energy<.01));check('pause settles planar motion energy',true);
 console.log(JSON.stringify(errors));check('no render or runtime errors',errors.length===0);
 fs.writeFileSync(path.join(__dirname,'contour-study-browser.json'),JSON.stringify({buildSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),date:new Date().toISOString(),checks,errors},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
