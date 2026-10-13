import assert from 'node:assert/strict'
import {mkdtemp,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {renderProjectMix} from '../server/mixRenderer.js'
import {decodeOriginalAudio} from '../server/audioDecoder.js'

// Explicit approved TEMP runtime; this QA never installs a dependency.
const options={runtimeRoot:process.env.IEUM_WEB_AUDIO_ROOT,maxInputBytes:1048576,maxPcmBytes:4194304,maxOutputBytes:1048576,maxDurationSeconds:2,timeoutMs:15000}
assert.ok(options.runtimeRoot,'Set IEUM_WEB_AUDIO_ROOT to the approved TEMP runtime')
assert.ok(process.env.IEUM_QA_FFMPEG_PATH,'Set IEUM_QA_FFMPEG_PATH to the existing decoder')
const directory=await mkdtemp(join(tmpdir(),'ieum-native-mix-qa-'))
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
function wav(frequency,gain=.06){
  const rate=44100,n=19845,bytes=Buffer.alloc(44+n*2)
  bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVE',8);bytes.write('fmt ',12)
  bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(rate,24)
  bytes.writeUInt32LE(rate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(n*2,40)
  for(let i=0;i<n;i++)bytes.writeInt16LE(Math.round(gain*Math.min(1,i/440,(n-i)/440)*Math.sin(2*Math.PI*frequency*i/rate)*32767),44+i*2)
  return bytes
}
async function source(frequency,gain){
  const bytes=wav(frequency,gain),file=join(directory,`${frequency}.wav`)
  await writeFile(file,bytes)
  const receipt={size:bytes.length,sha256:sha(bytes),...await decodeOriginalAudio(file,{executable:process.env.IEUM_QA_FFMPEG_PATH,contentType:'audio/wav',maxDurationSeconds:2})}
  return {blob:new Blob([bytes],{type:'audio/wav'}),receipt}
}
const backing=await source(120,.025),voices=[]
for(const frequency of [330,440,550,660])voices.push(await source(frequency))
function input(count){
  const partIds=Array.from({length:count},(_,i)=>`part-${i}`)
  const audioSourceRef={songId:'native-qa',key:'original',revision:'v1',duration:.65,sourceSha256:'a'.repeat(64),backingSha256:backing.receipt.sha256}
  return {project:{id:'qa-project',seed:'preserved-seed',partIds,audioSourceRef},backing,
    tracks:partIds.map((partId,i)=>({id:`qa-project:${partId}`,projectId:'qa-project',partId,kind:'submitted-track',submitted:true,audioSourceRef,syncOffsetMs:i*5,...voices[i]}))}
}
function inspect(bytes,count){
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.readUInt16LE(22),2)
  assert.equal(bytes.readUInt32LE(24),44100);assert.equal(bytes.readUInt16LE(34),16)
  let peak=0,power=0
  for(let i=44;i<bytes.length;i+=2){const value=bytes.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(value));power+=value*value}
  assert.ok(peak<=Math.pow(10,-3/20)+1/32768);assert.ok(Math.sqrt(power/((bytes.length-44)/2))>.005)
  for(const frequency of [120,...[330,440,550,660].slice(0,count)]){
    let sin=0,cos=0,n=0
    for(let i=Math.ceil(.08*44100);i<Math.floor(.32*44100);i++){
      const value=bytes.readInt16LE(44+i*4)/32768,angle=2*Math.PI*frequency*i/44100
      sin+=value*Math.sin(angle);cos+=value*Math.cos(angle);n++
    }
    assert.ok(2*Math.hypot(sin,cos)/n>.002,`Actual ${frequency}Hz input remains in Mix`)
  }
}
const results=[]
for(const count of [2,3,4]){
  const request=input(count),before=JSON.stringify(request),hashes=await Promise.all(request.tracks.map(async t=>sha(Buffer.from(await t.blob.arrayBuffer()))))
  const start=performance.now(),mix=await renderProjectMix(request,options),replay=await renderProjectMix(request,options)
  const bytes=Buffer.from(await mix.blob.arrayBuffer())
  inspect(bytes,count);assert.equal(mix.sha256,sha(bytes));assert.equal(replay.sha256,mix.sha256)
  assert.equal(mix.duration,(bytes.length-44)/4/44100)
  assert.equal(mix.origin,'offline-audio-context:offset+noise-gate+rms-normalize+eq+compressor+limiter')
  assert.equal(JSON.stringify(request),before)
  assert.deepEqual(await Promise.all(request.tracks.map(async t=>sha(Buffer.from(await t.blob.arrayBuffer())))),hashes)
  results.push({parts:count,bytes:bytes.length,sha256:mix.sha256,twoRunsMs:Math.round(performance.now()-start)})
}
const reject=(request,code,override={})=>assert.rejects(()=>renderProjectMix(request,{...options,...override}),error=>error.code===code)
await reject(input(2),'MIX_MEMORY_BUDGET_EXCEEDED',{maxPcmBytes:1})
await reject(input(2),'MIX_MEMORY_BUDGET_EXCEEDED',{maxOutputBytes:1})
await reject(input(2),'MIX_MEMORY_BUDGET_EXCEEDED',{maxInputBytes:1})
await reject(input(2),'MIX_RENDER_TIMEOUT',{timeoutMs:1})
await reject(input(2),'MIX_RUNTIME_UNAVAILABLE',{runtimeRoot:directory})
const review=input(2);review.tracks[0].submitted=false;await reject(review,'INVALID_MIX_INPUT')
const foreign=input(2);foreign.tracks[0].projectId='other';await reject(foreign,'INVALID_MIX_INPUT')
const changed=input(2);changed.tracks[0].blob=new Blob([wav(880)],{type:'audio/wav'});await reject(changed,'MIX_SOURCE_MISMATCH')
const wrongReceipt=input(2);wrongReceipt.tracks[0].receipt={...wrongReceipt.tracks[0].receipt,decodedFrames:24000,duration:.5};await reject(wrongReceipt,'MIX_DECODE_MISMATCH')
const wrongBacking=input(2);wrongBacking.project.audioSourceRef.backingSha256='b'.repeat(64);await reject(wrongBacking,'MIX_SOURCE_MISMATCH')
console.log(JSON.stringify({runtime:'node-web-audio-api 2.2.0 (approved TEMP)',engine:'existing src/audio.js',results,receiptSource:'actual FFmpeg decode',originalsPreserved:true,budgetAndInvalidInputRejected:true,parentRssMiB:Math.round(process.memoryUsage().rss/1048576)}))
