const {chromium}=require(process.env.IEUM_PLAYWRIGHT_PATH||'playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const output=process.env.IEUM_BLUE_OUTPUT||'/tmp/ieum-blue-verification';fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.IEUM_CHROMIUM_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const page=await browser.newPage({viewport:{width:1100,height:1400}}),errors=[];let busy=false;
const pump=setInterval(async()=>{if(busy)return;busy=true;try{await page.screenshot({clip:{x:0,y:0,width:1,height:1},timeout:5000})}catch{}finally{busy=false}},300);
try{page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(process.env.IEUM_BLUE_URL||('file://'+path.resolve(__dirname,'../../../public/repetition-candidate.html')+'?repetition=1'));
await page.waitForFunction(()=>ieumDebug.view?.morph===0);await page.evaluate(()=>{ieumDebug.view.speed=0;ieumDebug.view.time=0});
async function capture(name){const data=await page.evaluate(()=>{const v=ieumDebug.view;v.update(0,false);return v.renderer.domElement.toDataURL('image/png').split(',')[1]});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(data,'base64'))}
for(const n of [1,2,0]){await page.click('[data-contours="'+n+'"]');await capture('paths-'+n)}
const geometry=await page.evaluate(()=>{const view=ieumDebug.view;return {visible:ieumDebug.voices.filter(v=>v.visible).map(v=>v.p.id),layers:view.layers.map(l=>{const a=l.line.geometry.attributes.aStart.array,b=l.line.geometry.attributes.aFlatStart.array;let drift=0,minR=Infinity;for(let i=0;i<a.length;i+=3){drift=Math.max(drift,Math.hypot(a[i]-b[i],a[i+2]-b[i+2]));minR=Math.min(minR,Math.hypot(a[i],a[i+2]));}return{drift,minR}}),particles:view.particles}});
assert.deepEqual(geometry.visible,['A']);assert.equal(geometry.particles,false);assert.ok(geometry.layers.every(l=>l.drift===0&&l.minR>.60));
await page.click('#raised');await page.evaluate(()=>{const v=ieumDebug.view;v.transitionAt=performance.now()-450;v.update(0,false);v.transition=false});await capture('transition-half');
await page.click('#raised');await page.waitForFunction(()=>ieumDebug.view.morph>.999);await capture('spatial');
await page.click('#flat');await page.waitForFunction(()=>ieumDebug.view.morph<.001);
await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>ieumDebug.view.renderer.domElement.width<800&&document.querySelector('#stage').clientWidth<500);await page.screenshot({clip:{x:0,y:0,width:1,height:1}});await capture('mobile-flat');
assert.equal(errors.length,0);const report={geometry,errors,sourceFidelityApproved:false,scope:'Blue two-component structural comparison. Captures require visual source comparison; no audio, particles, synthesis or long-run approval.'};fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{clearInterval(pump);await page.close()}}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
