// Product-level safeguards beyond the transport regression and long-running soak.
const {chromium}=require(process.env.IEUM_PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),file=path.join(root,'public/IEUM-Resonance.html');
const checks=[],errors=[];
const check=(name,condition,detail)=>{assert.ok(condition,name);checks.push({name,pass:true,detail});console.log('PASS',name);};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.IEUM_CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:900,height:1000},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+file);await page.waitForFunction(()=>ieumDebug.view?.frames>3);
  check('reduced motion defaults to stationary geometry',await page.evaluate(()=>ieumDebug.view.speed===0&&!document.querySelector('#motion').checked));
  await page.selectOption('#voice-count','4');
  await page.click('#play');await page.waitForFunction(()=>ieumDebug.voices[0].energy>.02);
  check('first playback after participant change repairs timeline duration',await page.evaluate(()=>document.querySelector('#duration').textContent==='0:24'&&Number(document.querySelector('#seek').max)===ieumDebug.transport.duration));
  const frozen=await page.evaluate(()=>({time:ieumDebug.view.time,phases:Array.from(ieumDebug.view.layers[0].phases)}));
  await page.waitForTimeout(800);
  check('audio remains functional without animated deformation',await page.evaluate(()=>ieumDebug.transport.playing&&ieumDebug.view.layers.every(l=>l.uniforms.uEnergy.value===0)));
  check('reduced motion holds particle phase',await page.evaluate(base=>ieumDebug.view.time===base.time&&JSON.stringify(Array.from(ieumDebug.view.layers[0].phases))===JSON.stringify(base.phases),frozen));
  await page.click('#play');
  for(const count of [2,3,4]){
   await page.selectOption('#voice-count',String(count));
   await page.waitForFunction(n=>ieumDebug.view.layers.filter(l=>l.line.visible).length===n,count);
   check(count+' participants use line-only colored materials',await page.evaluate(()=>ieumDebug.view.layers.filter(l=>l.line.visible).every(l=>l.line.material.isShaderMaterial&&l.line.geometry.attributes.aStart&&l.points.isPoints)));
  }
  check('same descriptor ignores participant slot in SVG geometry',await page.evaluate(()=>{const p=ieumDebug.profiles[0];const normalize=s=>s.replaceAll(p.color,'COLOR').replaceAll('#abcdef','COLOR').replaceAll('A 목소리','VOICE').replaceAll('Z 목소리','VOICE');return normalize(ieumDebug.bloomSVG(p))===normalize(ieumDebug.bloomSVG({...p,id:'Z',color:'#abcdef'}));}));
  const count=await page.evaluate(()=>{let n=0;ieumDebug.view.scene.traverse(o=>{if(o.geometry)n++;});return n;});
  check('render scene resource inventory',count===12,{count});
  await page.evaluate(()=>ieumDebug.view.renderer.domElement.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  check('context-loss failure message visible',await page.locator('#render-failure').isVisible());
  await page.locator('.bloom').first().click();
  check('personal signature remains available after renderer failure',await page.locator('#dialog-bloom svg').count()===1);
  await page.keyboard.press('Escape');
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  await page.waitForFunction(()=>ieumDebug.transport.ctx.state==='closed');
  check('page teardown releases audio sources',await page.evaluate(()=>ieumDebug.transport.sources.length===0));
  check('no JavaScript exceptions',errors.length===0,errors);
  fs.writeFileSync(path.join(__dirname,'final-verification.json'),JSON.stringify({date:new Date().toISOString(),buildSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),environment:'Chromium / SwiftShader; reduced-motion and failure-path checks, not physical device certification',checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
