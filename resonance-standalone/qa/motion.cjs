// Record the actual WebGL canvas and actual Web Audio demo output, not interpolated stills.
const {chromium}=require(process.env.IEUM_PLAYWRIGHT_PATH||'playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.IEUM_CHROMIUM_PATH||undefined,args:JSON.parse(process.env.IEUM_CHROMIUM_ARGS||'["--no-sandbox"]')});
 try{const p=await b.newPage({viewport:{width:1280,height:1300},deviceScaleFactor:1});
 await p.goto('file://'+path.resolve(__dirname,'../public/IEUM-Resonance.html'));await p.waitForFunction(()=>ieumDebug.view.frames>3);
 // Prepare browser audio with a real user gesture, then return to idle.
 await p.click('#play');await p.click('#play');await p.locator('#seek').evaluate(e=>{e.value=0;e.dispatchEvent(new Event('input'));});
 await p.evaluate(async()=>{const d=ieumDebug,stream=document.querySelector('#stage canvas').captureStream(30);const dest=d.transport.ctx.createMediaStreamDestination();d.transport.master.connect(dest);stream.addTrack(dest.stream.getAudioTracks()[0]);window.captureChunks=[];window.captureRecorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8,opus',videoBitsPerSecond:3000000});captureRecorder.ondataavailable=e=>captureChunks.push(e.data);captureRecorder.start(1000);window.captureStart=performance.now();window.captureEvents=[{state:'idle',seconds:0}];});
 async function advance(ms){const until=Date.now()+ms;while(Date.now()<until){await p.screenshot({clip:{x:0,y:0,width:1,height:1}});await p.waitForTimeout(150);}}
 await advance(4000);await p.click('#play');await p.evaluate(()=>captureEvents.push({state:'playing',seconds:(performance.now()-captureStart)/1000}));await advance(12000);
 await p.click('#play');await p.evaluate(()=>captureEvents.push({state:'paused',seconds:(performance.now()-captureStart)/1000}));await advance(6000);
 const result=await p.evaluate(()=>new Promise(resolve=>{captureRecorder.onstop=async()=>{const blob=new Blob(captureChunks,{type:'video/webm'}),buf=new Uint8Array(await blob.arrayBuffer());let s='';for(const c of buf)s+=String.fromCharCode(c);resolve({base64:btoa(s),events:captureEvents,duration:(performance.now()-captureStart)/1000});};captureRecorder.stop();}));
 fs.mkdirSync(path.join(__dirname,'renders'),{recursive:true});fs.writeFileSync(path.join(__dirname,'renders/motion.webm'),Buffer.from(result.base64,'base64'));delete result.base64;fs.writeFileSync(path.join(__dirname,'motion-verification.json'),JSON.stringify(result,null,2));console.log(result);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
