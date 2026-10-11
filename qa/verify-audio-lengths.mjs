import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/LEE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')
const {chromium}=require('playwright')
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--autoplay-policy=no-user-gesture-required','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']})
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message))
 await page.goto(process.env.IEUM_QA_URL||'http://127.0.0.1:4196/')
 const result=await page.evaluate(async()=>{
  const a=await import('/src/audio.js')
  const ctx=new AudioContext()
  const wav=async duration=>{
   const rate=22050,count=Math.round(duration*rate),data=new ArrayBuffer(44+count*2),view=new DataView(data)
   const text=(at,value)=>[...value].forEach((char,i)=>view.setUint8(at+i,char.charCodeAt(0)))
   text(0,'RIFF');view.setUint32(4,36+count*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,count*2,true)
   for(let i=0;i<count;i++)view.setInt16(44+i*2,Math.round((.04*Math.sin(i/rate*220*2*Math.PI)+.02*Math.sin(i/rate*440*2*Math.PI))*32767),true)
   return new Blob([data],{type:'audio/wav'})
  }
  const long=await wav(35),short=await wav(2),other=await wav(3)
  const longTrack={id:'qa-long',partId:'long',partIndex:0,blob:long,duration:2,syncOffsetMs:100}
  const shortTrack={id:'qa-short',partId:'short',partIndex:1,blob:short,duration:999,syncOffsetMs:0}
  const registry=await(await fetch('/src/providedSamples.json')).json()
  const song=registry.find(item=>item.duration===19)
  const backing=await a.loadProvidedAudio(song.backingFile,song.provenance.backingSha256)
  const digest=async blob=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),value=>value.toString(16).padStart(2,'0')).join('')
  const originals=await Promise.all([long,short,other,backing].map(digest))
  try {
   await a.startRecording({guideTracks:[{...shortTrack,syncOffsetMs:-1}],guides:{backing:false,parts:[false,true]},duration:2})
   throw new Error('Invalid recording Guide silently succeeded')
  }catch(error){if(!error.message.includes('정렬 시간이 올바르지'))throw error}
  const invalidGuideReleased=a.audioRuntime.stream===null && (!a.audioRuntime.recorder || a.audioRuntime.recorder.state==='inactive')
  const rejectedOffsets=[]
  for(const offset of [-1,NaN,Infinity,'100',2000,3000]) {
   const broken={...shortTrack,syncOffsetMs:offset}
   for(const kind of ['current','preview','auto']) {
    try {
     if(kind==='current')await a.playCurrentMix({included:{backing:false,parts:[false,true]},tracks:[broken]})
     else if(kind==='preview')await a.createPreviewMix({tracks:[broken],duration:2})
     else await a.createAutoMix({tracks:[broken,{id:'other',partId:'other',partIndex:2,blob:other}],duration:2})
     throw new Error('Invalid offset silently succeeded')
    }catch(error){if(!error.message.includes('정렬 시간이 올바르지'))throw error}
    rejectedOffsets.push(kind)
   }
  }
  const decoded=await ctx.decodeAudioData(await backing.arrayBuffer());await ctx.close()
  const delays=[],timer=window.setTimeout.bind(window)
  window.setTimeout=(callback,delay,...args)=>{delays.push(delay);return timer(callback,delay,...args)}
  const run=async options=>{const stop=await a.playCurrentMix(options);const ms=delays.at(-1);stop();return ms}
  let mix,preview
  try{
   const longPlaybackMs=await run({included:{backing:false,parts:[true,false]},tracks:[longTrack,shortTrack]})
   const shortPlaybackMs=await run({included:{backing:false,parts:[false,true]},tracks:[longTrack,shortTrack]})
   const backingPlaybackMs=await run({included:{backing:true,parts:[false,true]},tracks:[longTrack,shortTrack],backingBlob:backing})
   mix=await a.createAutoMix({tracks:[{...shortTrack,partIndex:0},{id:'qa-other',partId:'other',partIndex:1,blob:other,duration:3}],backingBlob:backing})
   const output=await a.analyzeBlob(mix.blob)
   const tail=output.decoded.getChannelData(0).slice(Math.floor(18.2*output.decoded.sampleRate),Math.floor(18.7*output.decoded.sampleRate))
   let square=0;for(const value of tail)square+=value*value
   preview=await a.createPreviewMix({tracks:[],backing:true,backingBlob:backing,duration:2})
   return{invalidGuideReleased,rejectedOffsetCases:rejectedOffsets.length,longPlaybackMs,shortPlaybackMs,backingPlaybackMs,actualBackingDuration:decoded.duration,autoMixDuration:mix.duration,autoMixTailRms:Math.sqrt(square/tail.length),explicitPreviewDuration:preview.duration,sourceBytesUnchanged:JSON.stringify(originals)===JSON.stringify(await Promise.all([long,short,other,backing].map(digest)))}
  }finally{window.setTimeout=timer;a.stopGuides();if(mix)URL.revokeObjectURL(mix.url);if(preview)URL.revokeObjectURL(preview.url)}
 })
 assert.ok(Math.abs(result.longPlaybackMs-(34.9*1000+80))<1,'Actual decoded 35-second Track must not be stopped at 18 seconds or use wrong metadata')
 assert.ok(Math.abs(result.shortPlaybackMs-2080)<1,'Unselected long Track and wrong duration metadata must not extend playback')
 assert.ok(Math.abs(result.backingPlaybackMs-(result.actualBackingDuration*1000+80))<1)
 assert.ok(Math.abs(result.autoMixDuration-result.actualBackingDuration)<.01,'Auto Mix must retain the actual longer backing')
 assert.ok(result.autoMixTailRms>1e-5,'Actual backing after 18 seconds must remain in final WAV')
 assert.equal(result.explicitPreviewDuration,2,'Explicit short preview must remain a short preview')
 assert.equal(result.sourceBytesUnchanged,true)
 assert.equal(result.rejectedOffsetCases,18,'Invalid offsets must fail all three playback/mix paths without changing source audio')
 assert.equal(result.invalidGuideReleased,true,'Invalid recording Guide must release the microphone before creating a Take')
 assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,...result,limits:'Native Web Audio; actual registered AI backing plus isolated synthetic Track PCM, no Project media binding or physical listening claim'}))
}finally{await browser.close()}
