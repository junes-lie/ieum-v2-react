// Publish the current comparison candidate without changing restored src/public HTML.
import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ieum-candidate-'));
try {
 const dir=path.join(tmp,'resonance-standalone');
 await fs.mkdir(dir,{recursive:true});
 await fs.cp(path.join(root,'src'),path.join(dir,'src'),{recursive:true});
 execFileSync('git',['apply',path.join(root,'qa/experiments/repetition-candidate/runtime.patch')],{cwd:tmp});
 await fs.copyFile(path.join(root,'qa/experiments/blue-repetition/referenceContours.js'),path.join(dir,'src/referenceContours.js'));
 await fs.copyFile(path.join(root,'qa/experiments/blue-repetition/ordered-path.js'),path.join(dir,'src/ordered-path.js'));
 await fs.copyFile(path.join(root,'qa/experiments/music-box/motion.mjs'),path.join(dir,'src/music-box.mjs'));
 await fs.copyFile(path.join(root,'qa/experiments/music-box/spatial.js'),path.join(dir,'src/spatial.js'));
 // Composite uses one parent per voice in both planar and raised modes.
 let profiles=await fs.readFile(path.join(dir,'src/profiles.js'),'utf8');
 profiles=profiles.replace("export {referenceContourCount,referenceThetaStart} from './referenceContours.js';", "export {referenceThetaStart} from './referenceContours.js';export const referenceContourCount=24;");
 profiles=profiles.replace('export const planar=repetitionMode?referenceContour:baselinePlanar;', `
const compositeMode=typeof location!=='undefined'&&new URLSearchParams(location.search).get('composite')==='1';
export function planar(p,t,lane,out=[0,0,0]){
 if(!repetitionMode)return baselinePlanar(p,t,lane,out);
 if(!compositeMode)return referenceContour(p,t,lane,out);
 // Restore the source version's nonuniform folds and fan convergence.
 // Voice pitch shifts mean diameter; phase/brightness/air retain different bends.
 baselinePlanar(p,t,lane,out);
 const radius=Math.hypot(out[0],out[2]);
 const r=Math.max(.66,radius+.40*(.5-p.pitch));
 out[0]*=r/radius;out[2]*=r/radius;
 return out;
}`);
 // Optional comparison only: keep each voice's phase and distinct height character.
 profiles=profiles.replace('export function record(p,t,lane,energy=0,time=0,lift=1,out=[0,0,0]){', "const softHeight=typeof location!=='undefined'&&new URLSearchParams(location.search).get('composite')==='1'&&new URLSearchParams(location.search).get('heightStudy')!=='original';\nexport function record(p,t,lane,energy=0,time=0,lift=1,out=[0,0,0]){");
 profiles=profiles.replace('2.5+p.pitch*3.5', '(softHeight?1.9+p.pitch*2.5:2.5+p.pitch*3.5)');
 profiles=profiles.replace('const y=.025+.5*(clearance+Math.sqrt(clearance*clearance+.004));', 'const originalY=.025+.5*(clearance+Math.sqrt(clearance*clearance+.004));const y=softHeight?originalY/(1+.18*Math.max(0,originalY-.45)):originalY;');
 await fs.writeFile(path.join(dir,'src/profiles.js'),profiles);
 if(process.env.IEUM_VALIDATE_GEOMETRY==='1'){
  const bundled=await build({entryPoints:[path.join(dir,'src/profiles.js')],bundle:true,format:'esm',platform:'node',write:false});
  const previousLocation=globalThis.location;
  try{
   globalThis.location=new URL('https://ieum.invalid/?repetition=1&composite=1');
   const model=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
   if(model.referenceContourCount!==24)throw Error('Expected one 24-strand layer');
   const results=[];
   for(const p of model.defaults.slice(0,3)){
    let minRadius=Infinity,maxRadius=0,sumRadius=0;
    for(let strand=0;strand<24;strand++)for(let i=0;i<=720;i++){
     const q=model.planar(p,i/720*Math.PI*2,strand/23),again=model.planar(p,i/720*Math.PI*2,strand/23);
     if(!q.every((x,k)=>Number.isFinite(x)&&x===again[k]))throw Error('Non-deterministic or invalid path');
     const r=Math.hypot(q[0],q[2]);minRadius=Math.min(minRadius,r);maxRadius=Math.max(maxRadius,r);sumRadius+=r;
     if(i===720&&q.some((x,k)=>Math.abs(x-model.planar(p,0,strand/23)[k])>1e-9))throw Error('Open path');
    }
    results.push({voice:p.id,strands:24,minRadius,maxRadius,meanRadius:sumRadius/(24*721)});
   }
   if(results[0].meanRadius-results[2].meanRadius<.25)throw Error('Voice diameters too similar');
   if(process.env.IEUM_QA_GEOMETRY_JSON){const curves=model.defaults.slice(0,3).map(p=>({id:p.id,color:p.color,lines:Array.from({length:24},(_,s)=>Array.from({length:721},(_,i)=>model.planar(p,i/720*Math.PI*2,s/23)))}));await fs.writeFile(process.env.IEUM_QA_GEOMETRY_JSON,JSON.stringify(curves));}
   console.log(JSON.stringify({singleLayerGeometry:results,closed:true,deterministic:true}));
  }finally{if(previousLocation===undefined)delete globalThis.location;else globalThis.location=previousLocation;}
 }
 let app=await fs.readFile(path.join(dir,'src/app.js'),'utf8');
 app=app.replace("v.p.id==='B'","v.p.id==='A'").replace('CORAL · 전체 폐곡선 비교 · 가려진 연결은 추정','BLUE · 한 사람의 공통 형태 · 안팎 반복 비교');
 app=app.replace('view.layers.forEach(l=>l.uniforms.uContourView.value=value);','view.layers.forEach(l=>{l.uniforms.uContourView.value=value;l.uniforms.uLineScale.value=value?1.6:1.05;});');
 app=app.replace("[['한 겹',1],['두 겹',2],['여러 겹',0]]","[['바깥 한 경로',1],['바깥·안쪽 두 경로',2],['각 경로의 여러 선',0]]");
 app += `
if(new URLSearchParams(location.search).get('composite')==='1'&&view){
 voices.forEach(v=>v.visible=true);view.selected=null;
 $('#particles').disabled=false;$('#particles').checked=true;view.particles=true;
 const bar=$('#repetition-controls');
 bar.querySelector('[data-contours="1"]').textContent='대표 곡선';
 bar.querySelector('[data-contours="2"]').remove();
 bar.querySelector('[data-contours="0"]').textContent='선과 입자';
 bar.querySelector('[data-contours="0"]').click();
 for(const [label,id] of [['세 색 합성','all'],['파랑','A'],['빨강 · 코랄','B'],['노랑 · 크림','C']]){
  const b=document.createElement('button');b.textContent=label;b.dataset.color=id;
  b.onclick=()=>{voices.forEach(v=>{v.visible=id==='all'||v.p.id===id;v.card.querySelector('.hide').setAttribute('aria-pressed',String(!v.visible));});view.selected=null;bar.querySelectorAll('[data-color]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});};bar.append(b);
 }
 bar.querySelector('[data-color="all"]').click();
 $('#view-hint').textContent='세 색 · 한 겹의 선과 입자';
 document.querySelector('aside').textContent='파랑·빨강·노랑 · 2D와 3D가 같은 한 겹';
}
`;
 app += `\nif(new URLSearchParams(location.search).get('sourceFold')==='1'){document.querySelector('aside')?.insertAdjacentHTML('afterbegin','<strong>기각 비교: 세 묶음의 규칙성이 원본과 다름 · </strong>');}\n`;
 app += `\nif(new URLSearchParams(location.search).get('wideFold')==='1'){document.querySelector('aside')?.insertAdjacentHTML('afterbegin','<strong>기각 후보: 큰 굴곡 약화·작은 고리 발생 · </strong>');}\n`;
 app += `\nif(new URLSearchParams(location.search).get('orderedPath')==='1'){document.querySelector('aside')?.insertAdjacentHTML('afterbegin','<strong>기각: 추정 연결의 윤곽 단순화·선 밀집 · </strong>');}\n`;
 app += `\nif(new URLSearchParams(location.search).get('compare3d')==='1'&&new URLSearchParams(location.search).get('compareMotion')!=='1'&&view){
 setMode(1);
 const bar=document.createElement('nav');bar.setAttribute('aria-label','3D 높이 비교');bar.style.cssText='display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:12px 0;color:#ece6dc';
 for(const [label,value] of [['A · 기존 3D','original'],['B · 최고점·능선 조정','soft']]){const a=document.createElement('a'),url=new URL(location.href);url.searchParams.set('heightStudy',value);a.href=url.href;a.textContent=label;a.style.cssText='color:inherit;padding:10px 14px;border:1px solid #6c655b;border-radius:6px;text-decoration:none';if((new URLSearchParams(location.search).get('heightStudy')||'original')===value){a.style.background='#ece6dc';a.style.color='#15110e';a.setAttribute('aria-current','page');}bar.append(a);}
 $('#stage').before(bar);
}\n`;
 app += `\nif(new URLSearchParams(location.search).get('compareMotion')==='1'&&view){setMode(1);const bar=document.createElement('nav');bar.setAttribute('aria-label','3D 모션 비교');bar.style.cssText='display:flex;gap:12px;flex-wrap:wrap;margin:12px 0';for(const [label,value] of [['이전 모션','legacy'],['오르골 모션','box']]){const a=document.createElement('a'),url=new URL(location.href);url.searchParams.set('motionStudy',value);url.searchParams.set('heightStudy','soft');a.href=url.href;a.textContent=label;a.style.cssText='padding:10px 14px;border:1px solid #6c655b;border-radius:6px;color:#ece6dc';if((new URLSearchParams(location.search).get('motionStudy')||'box')===value){a.style.background='#ece6dc';a.style.color='#15110e';a.setAttribute('aria-current','page');}bar.append(a);}$('#stage').before(bar);}\n`;
 app += `\nif(new URLSearchParams(location.search).get('compareSpatial')==='1'&&view){setMode(1);const bar=document.createElement('nav');bar.setAttribute('aria-label','3D 구조 비교');bar.style.cssText='display:flex;gap:12px;flex-wrap:wrap;margin:12px 0';for(const [label,value] of [['이전 B 구조','previous'],['3D 기준 반영','reference']]){const a=document.createElement('a'),url=new URL(location.href);url.searchParams.set('spatialStudy',value);url.searchParams.set('heightStudy','soft');a.href=url.href;a.textContent=label;a.style.cssText='padding:10px 14px;border:1px solid #6c655b;border-radius:6px;color:#ece6dc';if((new URLSearchParams(location.search).get('spatialStudy')||'reference')===value){a.style.background='#ece6dc';a.style.color='#15110e';a.setAttribute('aria-current','page');}bar.append(a);}$('#stage').before(bar);}\n`;
 await fs.writeFile(path.join(dir,'src/app.js'),app);
 let visual=await fs.readFile(path.join(dir,'src/visuals.js'),'utf8');
 visual="import {spatialPose} from './spatial.js';\nconst spatialQuery=new URLSearchParams(location.search);const spatialEnabled=spatialQuery.get('composite')==='1'&&spatialQuery.get('spatialStudy')!=='previous'&&(spatialQuery.get('compare3d')!=='1'||spatialQuery.get('spatialStudy')==='reference');\n"+visual;
 visual=visual.replace('if(repetitionMode){const h=xyz[1];planar(v.p,planarParticleT(v.p,t),rand(i+239),flat);xyz[0]=flat[0];xyz[2]=flat[2];xyz[1]=h;}', 'if(repetitionMode){if(spatialEnabled){const pt=planarParticleT(v.p,t),pl=rand(i+239);planar(v.p,pt,pl,flat);spatialPose(v.p,pt,pl,xyz);xyz[0]=flat[0]+(xyz[0]-flat[0])*this.morph;xyz[2]=flat[2]+(xyz[2]-flat[2])*this.morph;xyz[1]=.018+(xyz[1]-.018)*this.morph*this.height+(1-this.morph)*(flat[1]+.016);}else{const h=xyz[1];planar(v.p,planarParticleT(v.p,t),rand(i+239),flat);xyz[0]=flat[0];xyz[2]=flat[2];xyz[1]=h;}}');
 visual="import {motionParams,motionPulse,motionLift,motionGLSL} from './music-box.mjs';\nconst danceEnabled=new URLSearchParams(location.search).get('composite')==='1'&&new URLSearchParams(location.search).get('motionStudy')!=='legacy';\n"+visual;
 visual=visual.replace('vec3 deform(vec3 p,vec3 planarPoint){', '${motionGLSL}\nvec3 deform(vec3 p,vec3 planarPoint,float motionT){');
 visual=visual.replace('deform(aStart,aFlatStart)', 'deform(aStart,aFlatStart,aT)').replace('deform(aEnd,aFlatEnd)', 'deform(aEnd,aFlatEnd,aT+6.28318530718/360.)');
 visual=visual.replace('return p;}','p.y+=uDanceOn*uLift*motionLift(motionT,aLane,uTime);return p;}');
 visual=visual.replace('const uniforms={uLineScale:', 'const uniforms={uDance:{value:new THREE.Vector4(...motionParams(v.p))},uDanceOn:{value:danceEnabled?1:0},uPlay:{value:0},uLineScale:');
 visual=visual.replace('this.time+=dt*this.speed;', 'this.time+=dt*this.speed;this.playMotion=(this.playMotion||0)+((playing&&!this.reduced&&this.speed?1:0)-(this.playMotion||0))*(1-Math.exp(-dt*5));');
 visual=visual.replace('uniforms.uTime.value=this.time;', 'uniforms.uTime.value=this.time;uniforms.uPlay.value=this.playMotion||0;uniforms.uDanceOn.value=danceEnabled&&!this.reduced&&this.speed?1:0;');
 visual=visual.replace('if(v.active===false)continue;', 'if(v.active===false)continue;const dance=motionParams(v.p);');
 visual=visual.replace('const halo=Math.pow(rand(i+941),5);', 'const danceT=planarParticleT(v.p,t),danceLane=rand(i+239);if(uniforms.uDanceOn.value){xyz[1]+=this.morph*this.height*motionLift(danceT,danceLane,this.time,dance,uniforms.uPlay.value,e,b.w);}layer.glints[i]=uniforms.uDanceOn.value?this.morph*motionPulse(danceT,danceLane,this.time,dance)*uniforms.uPlay.value:0;const halo=Math.pow(rand(i+941),5);');
 visual=visual.replace("const pg=new THREE.BufferGeometry();", "const glints=new Float32Array(count);const pg=new THREE.BufferGeometry();pg.setAttribute('aGlint',new THREE.BufferAttribute(glints,1).setUsage(THREE.DynamicDrawUsage));");
 visual=visual.replace('return {v,line,points,uniforms,pos,count,', 'return {v,line,points,uniforms,pos,count,glints,');
 visual=visual.replace('layer.points.geometry.attributes.position.needsUpdate=true;', 'layer.points.geometry.attributes.position.needsUpdate=true;layer.points.geometry.attributes.aGlint.needsUpdate=true;');
 // Composite grains must remain discrete at mobile DPR, without the old 2D light boost.
 visual=visual.replace('const count=Math.round(1100+v.p.air*700)', "const fineComposite=new URLSearchParams(location.search).get('composite')==='1';const count=Math.round(fineComposite?1000-v.p.air*180:1100+v.p.air*700)");
 visual=visual.replace('flatSizes[i]=grain.size;flatAlpha[i]=grain.alpha;', 'flatSizes[i]=fineComposite?1.25+.65*rand(i+22)+.65*v.p.brightness*Math.pow(rand(i+22),4):grain.size;flatAlpha[i]=fineComposite?.55+.30*rand(i+73):grain.alpha;if(fineComposite){sizes[i]=flatSizes[i];alpha[i]=flatAlpha[i];}');
 // Local light sprites: a narrow luminous core, faint falloff and asynchronous glints.
 // Normal alpha blending bounds overlap; no bloom pass or global line brightening.
 visual=visual.replace('uniforms:{uColor:uniforms.uColor,uOpacity:', 'uniforms:{uSparkle:{value:fineComposite?1:0},uTime:uniforms.uTime,uColor:uniforms.uColor,uOpacity:');
 visual=visual.replaceAll('varying float vAlpha;', 'varying float vAlpha,vSpark;');
 visual=visual.replace('uniform float uDpr,uMorph;', 'uniform float uDpr,uMorph,uTime,uSparkle;');
 visual=visual.replace('attribute float aAlpha,aSize,aFlatSize,aFlatAlpha;', 'attribute float aAlpha,aSize,aFlatSize,aFlatAlpha,aGlint;');
 visual=visual.replace('gl_PointSize=mix(size,aSize,uMorph)*uDpr;', 'float seed=fract(aFlatAlpha*19.17+aFlatSize*7.13);vSpark=max(pow(.5+.5*sin(uTime*(.75+seed*.65)+seed*63.),14.),aGlint*.90);gl_PointSize=mix(size,aSize,uMorph)*uDpr*mix(1.,2.3+.45*vSpark,uSparkle);');
 visual=visual.replace('uniform float uOpacity,uMorph;', 'uniform float uOpacity,uMorph,uSparkle;');
 visual=visual.replace('gl_FragColor=vec4(uColor*mix(1.7,1.,uMorph),vAlpha*uOpacity*smoothstep(.5,.15,d));', `if(uSparkle>.5){float core=exp(-d*d*105.);float halo=exp(-d*d*23.)*(1.-smoothstep(.35,.5,d));float light=core*(.55+.9*vSpark)+halo*(.035+.15*vSpark);vec3 tint=mix(uColor,vec3(1.),core*(.18+.72*vSpark));gl_FragColor=vec4(tint*(1.+.35*vSpark),min(.92,vAlpha*uOpacity*light));}else{gl_FragColor=vec4(uColor*mix(1.7,1.,uMorph),vAlpha*uOpacity*smoothstep(.5,.15,d));}`);
 // Select a GLSL literal when the shader template is evaluated.
 visual=visual.replaceAll('uColor*mix(1.7,1.,uMorph)', "uColor*mix(${new URLSearchParams(location.search).get('composite')==='1'?'1.0':'1.7'},1.,uMorph)");
 visual=visual.replace('smoothstep(.5,.15,d)', '(1.-smoothstep(.23,.5,d))');
 visual=visual.replace('layer.points.material.uniforms.uOpacity.value=focused?1:.1;', 'layer.points.material.uniforms.uOpacity.value=focused?1:.1;layer.points.material.uniforms.uDpr.value=this.renderer.getPixelRatio()*(uniforms.uSingleLayer.value>.5&&this.stage.clientWidth>=600?1.35:1);');
 visual=visual.replace('(1-v.p.air*.05)*(focused?1:.12)', '(uniforms.uSingleLayer.value>.5?.70:1-v.p.air*.05)*(focused?1:.12)');
 // Narrow canvases need more camera clearance for the raised outer blue fold.
 visual=visual.replace('this.mode?3.4:8.4,this.mode?6.0:.001', 'this.mode?3.4*(this.stage.clientWidth<600?1.18:1):8.4,this.mode?6.0*(this.stage.clientWidth<600?1.18:1):.001');
 visual=visual.replace('if(uContourView>.5&&vLane>.001&&(uContourView<1.5||vLane<.999))discard;', "if(uContourView>.5){if(uSingleLayer>.5){if(abs(vLane-12./23.)>.001)discard;}else if(abs(vLane-6./23.)>.001&&(uContourView<1.5||abs(vLane-18./23.)>.001))discard;}");
 visual=visual.replace('uMorph,uContourView;', 'uMorph,uContourView,uSingleLayer;');
 visual=visual.replace('const uniforms={', "const uniforms={uSingleLayer:{value:new URLSearchParams(location.search).get('composite')==='1'?1:0},");
 visual=visual.replace('const h=xyz[1];planar(v.p,t,traceLane,xyz);xyz[1]=h;', "const localLane=new URLSearchParams(location.search).get('composite')==='1'?traceLane:(l%12)/11;if(spatialEnabled){spatialPose(v.p,t,localLane,xyz);}else{record(v.p,t,localLane,0,0,1,xyz);const h=xyz[1];planar(v.p,t,traceLane,xyz);xyz[1]=h;}");
 visual=visual.replace('uDpr,uLineScale;', 'uDpr,uLineScale,uSingleLayer;');
 const localStrand='(uSingleLayer>.5?aLane:(mod(floor(aLane*23.+.5),12.)/11.))';
 visual=visual.replace('aLane*91.', 'VOICE_LOCAL*91.').replace('aLane*23.', 'VOICE_LOCAL*23.').replace('(aLane-.5)*4.', '(VOICE_LOCAL-.5)*4.').replaceAll('VOICE_LOCAL',localStrand);
 visual=visual.replace('vLane*3.', '(uSingleLayer>.5?vLane:(mod(floor(vLane*23.+.5),12.)/11.))*3.').replace('vLane*123.', '(uSingleLayer>.5?vLane:(mod(floor(vLane*23.+.5),12.)/11.))*123.');
 visual=visual.replace('CircleGeometry(.72,80)','CircleGeometry(.60,80)');
 await fs.writeFile(path.join(dir,'src/visuals.js'),visual);
 const result=await build({entryPoints:[path.join(dir,'src/app.js')],nodePaths:[path.join(root,'node_modules')],bundle:true,format:'iife',minify:true,write:false,legalComments:'inline'});
 let html=await fs.readFile(path.join(root,'src/index.html'),'utf8');
 const font=await fs.readFile(path.join(root,'public/PretendardVariable.woff2'));
 html=html.replace('<style>',`<style>@font-face{font-family:Pretendard;src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');font-weight:100 900;font-display:swap;}`);
 html=html.replace('<script type="module" src="./app.js"></script>',()=>'<script>'+result.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script>');
 html=html.replace('<body>','<body><aside style="padding:12px;background:#392b22;color:#eee;font:14px sans-serif">파랑 동일 인물 안팎 반복 · 공통 형태 구현 후보 · 원본 비교 중 · <a style="color:inherit" href="./review.html">비교 목록</a></aside>');
 const licenses=['licenses/THREE-LICENSE.txt','licenses/Pitchy-MIT.txt','licenses/FFT-MIT.txt','licenses/Pretendard-OFL.txt'];
 let notices='';for(const name of licenses)notices+='\n'+name+'\n'+await fs.readFile(path.join(root,name),'utf8');
 html=html.replace('</body>',()=>`<!-- Third-party notices\n${notices.replaceAll('--','—')}\n--></body>`);
 await fs.writeFile(path.join(root,'public/repetition-candidate.html'),html);
 await fs.copyFile(path.join(root,'qa/renders/approved-repetition-reference.png'),path.join(root,'public/repetition-reference.png'));
 console.log('Built public/repetition-candidate.html; restored default unchanged');
} finally { await fs.rm(tmp,{recursive:true,force:true}); }

