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
 let app=await fs.readFile(path.join(dir,'src/app.js'),'utf8');
 app=app.replace("v.p.id==='B'","v.p.id==='A'").replace('CORAL · 전체 폐곡선 비교 · 가려진 연결은 추정','BLUE · 바깥·안쪽 전체 경로 · 가려진 연결은 추정');
 app=app.replace('view.layers.forEach(l=>l.uniforms.uContourView.value=value);','view.layers.forEach(l=>{l.uniforms.uContourView.value=value;l.uniforms.uLineScale.value=value?1.6:1.05;});');
 app=app.replace("[['한 겹',1],['두 겹',2],['여러 겹',0]]","[['바깥 한 경로',1],['바깥·안쪽 두 경로',2],['각 경로의 여러 선',0]]");
 await fs.writeFile(path.join(dir,'src/app.js'),app);
 let visual=await fs.readFile(path.join(dir,'src/visuals.js'),'utf8');
 visual=visual.replace('if(uContourView>.5&&vLane>.001&&(uContourView<1.5||vLane<.999))discard;','if(uContourView>.5&&abs(vLane-6./23.)>.001&&(uContourView<1.5||abs(vLane-18./23.)>.001))discard;');
 visual=visual.replace('CircleGeometry(.72,80)','CircleGeometry(.60,80)');
 await fs.writeFile(path.join(dir,'src/visuals.js'),visual);
 const result=await build({entryPoints:[path.join(dir,'src/app.js')],nodePaths:[path.join(root,'node_modules')],bundle:true,format:'iife',minify:true,write:false,legalComments:'inline'});
 let html=await fs.readFile(path.join(root,'src/index.html'),'utf8');
 const font=await fs.readFile(path.join(root,'public/PretendardVariable.woff2'));
 html=html.replace('<style>',`<style>@font-face{font-family:Pretendard;src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');font-weight:100 900;font-display:swap;}`);
 html=html.replace('<script type="module" src="./app.js"></script>',()=>'<script>'+result.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script>');
 html=html.replace('<body>','<body><aside style="padding:12px;background:#392b22;color:#eee;font:14px sans-serif">파랑 두 전체 경로 비교 · 원본 가림 구간 추정 · 시각 검증 중 · <a style="color:inherit" href="./review.html">비교 목록</a></aside>');
 const licenses=['licenses/THREE-LICENSE.txt','licenses/Pitchy-MIT.txt','licenses/FFT-MIT.txt','licenses/Pretendard-OFL.txt'];
 let notices='';for(const name of licenses)notices+='\n'+name+'\n'+await fs.readFile(path.join(root,name),'utf8');
 html=html.replace('</body>',()=>`<!-- Third-party notices\n${notices.replaceAll('--','—')}\n--></body>`);
 await fs.writeFile(path.join(root,'public/repetition-candidate.html'),html);
 await fs.copyFile(path.join(root,'qa/renders/approved-repetition-reference.png'),path.join(root,'public/repetition-reference.png'));
 console.log('Built public/repetition-candidate.html; restored default unchanged');
} finally { await fs.rm(tmp,{recursive:true,force:true}); }
