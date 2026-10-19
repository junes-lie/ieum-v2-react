const {chromium}=require(process.env.IEUM_PLAYWRIGHT_PATH||'playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.IEUM_CHROMIUM_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],checks=[],snaps=[];let pump;
 try{
 const p=await browser.newPage({viewport:{width:1100,height:1400}});
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 let busy=false;pump=setInterval(async()=>{if(busy)return;busy=true;try{await p.screenshot({clip:{x:0,y:0,width:1,height:1},timeout:5000})}catch{}finally{busy=false}},500);
 const url='file://'+path.join(root,'public/IEUM-Resonance.html');
 const signature=()=>p.evaluate(()=>ieumDebug.view.layers.map(l=>Array.from(l.line.geometry.attributes.aFlatStart.array)));
 await p.goto(url);await p.waitForFunction(()=>ieumDebug.view?.frames>3);const base=await signature();
 await p.goto(url+'?contourStudy=1');await p.waitForFunction(()=>ieumDebug.view?.frames>3);
 assert.equal(await p.evaluate(()=>ieumDebug.view.mode),1);checks.push('legacy study query no longer activates rejected geometry');
 assert.deepEqual(await signature(),base);checks.push('legacy query and default flat geometry identical');
 const snap=async(name)=>{const data=await p.evaluate(()=>{const v=ieumDebug.view;v.update(0,false);return v.renderer.domElement.toDataURL('image/png').split(',')[1]});fs.writeFileSync(path.join(__dirname,'renders',name+'.png'),Buffer.from(data,'base64'));snaps.push(name+'.png');};
 await p.click('#flat');await p.waitForFunction(()=>ieumDebug.view.morph<.001);await snap('restored-flat');
 // Observe the existing animation without assigning morph or replacing its update function.
 await p.click('#raised');await p.waitForFunction(()=>ieumDebug.view.morph>.2&&ieumDebug.view.morph<.9);
 const mid=await p.evaluate(()=>ieumDebug.view.morph);await snap('restored-transition');
 await p.waitForFunction(()=>ieumDebug.view.morph>.999);await snap('restored-spatial');
 checks.push('actual 2D-to-3D animation reaches both endpoints');
 assert.equal(errors.length,0);checks.push('no browser or shader errors');
 fs.writeFileSync(path.join(__dirname,'restored-runtime-verification.json'),JSON.stringify({buildSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public/IEUM-Resonance.html'))).digest('hex'),date:new Date().toISOString(),checks,observedMidMorph:mid,snaps,errors,scope:'Recovery of pre-study runtime, not reference visual acceptance'},null,2));
 console.log(JSON.stringify({checks,observedMidMorph:mid,errors}));
 }finally{clearInterval(pump);await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
