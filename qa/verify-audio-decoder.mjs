import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp,writeFile,readFile,rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join,resolve,sep } from 'node:path'
import { createHash } from 'node:crypto'
import { decodeOriginalAudio } from '../server/audioDecoder.js'
import { createSupabaseAudioStorage } from '../server/audioStorage.js'
import { projectLifecycleRequest } from '../server/projectLifecycle.js'

const executable=process.env.IEUM_QA_FFMPEG_PATH
assert.ok(executable,'IEUM_QA_FFMPEG_PATH must identify an existing decoder; no installation or AI model is started')
const directory=await mkdtemp(join(tmpdir(),'ieum-audio-decoder-'))
const generate=args=>new Promise((resolve,reject)=>{
  const child=spawn(executable,['-nostdin','-hide_banner','-loglevel','error','-threads','1','-filter_threads','1',
    '-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=0.5','-threads','1',...args],
  {shell:false,windowsHide:true,stdio:['ignore','ignore','pipe']})
  let diagnostic='';child.stderr.on('data',chunk=>{diagnostic+=chunk})
  child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error(diagnostic)))
})
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
try {
  const fixtures=[['webm','audio/webm',['-c:a','libopus']],
    ['mp4','audio/mp4',['-c:a','aac']],
    ['fragmented.mp4','audio/mp4',['-c:a','aac','-movflags','frag_keyframe+empty_moov']],
    ['wav','audio/wav',['-c:a','pcm_s16le']]]
  for (const [extension,contentType,options] of fixtures) {
    const file=join(directory,'original.'+extension)
    await generate([...options,file])
    const before=hash(await readFile(file))
    let consumedBytes=0
    const result=await decodeOriginalAudio(file,{executable,contentType,maxDurationSeconds:2,onPcmChunk:chunk=>{consumedBytes+=chunk.length}})
    assert.ok(result.duration>=0.49 && result.duration<=0.55,JSON.stringify(result))
    assert.equal(result.decodedFrames,result.duration*result.sampleRate)
    assert.equal(result.analysisVersion,'decoded-pcm-v1')
    assert.equal(consumedBytes,result.decodedFrames*2)
    assert.equal(hash(await readFile(file)),before,'Decoder must preserve the original')
    const bytes=await readFile(file),objectId='12345678-1234-4234-8234-123456789abc'
    const storage=createSupabaseAudioStorage({env:{IEUM_STORAGE_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',
      IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa_only',IEUM_AUDIO_BUCKET:'private-audio'},fetchImpl:async url=>{
      if(url.endsWith('/bucket/private-audio'))return Response.json({id:'private-audio',public:false})
      return new Response(new ReadableStream({start(controller){
        for(let offset=0;offset<bytes.length;offset+=137)controller.enqueue(bytes.subarray(offset,offset+137))
        controller.close()
      }}),{headers:{'Content-Type':contentType,'Content-Length':String(bytes.length)}})
    }})
    const expected={size:bytes.length,sha256:before,contentType}
    const verified=await storage.verifyOriginalAudio(objectId,expected,{executable,maxDurationSeconds:2})
    assert.deepEqual(verified,{...expected,...result},'Private Storage byte proof and real decoded media must refer to the same original')
    const bounded=await storage.verifyOriginalAudio(objectId,{sha256:before,maxBytes:bytes.length},{executable,maxDurationSeconds:2})
    assert.deepEqual(bounded,verified,'Mix result inspection derives size/MIME from hash-matched bounded actual audio')
    await assert.rejects(storage.verifyOriginalAudio(objectId,{sha256:before,maxBytes:bytes.length-1},{executable,maxDurationSeconds:2}),e=>e.code==='UPLOAD_OBJECT_MISMATCH')
    if(contentType==='audio/wav'){
      const user='11111111-1111-4111-8111-111111111111',jobId='22222222-2222-4222-8222-222222222222'
      const project={id:'p',seed:'seed',songId:'song',key:'original',partCount:2,submittedTrackCount:2,revision:3,lifecycle:'completed',keyLockedAt:'2026-10-13T00:00:00Z',
        audioSourceRef:{songId:'song',key:'original',revision:'v1',duration:20,sourceSha256:'a'.repeat(64),backingSha256:'b'.repeat(64)},
        parts:['lead','harmony'].map(id=>({id,participantId:user,status:'submitted',trackId:`p:${id}`}))}
      let savedDuration=result.duration,stored=bytes,signed=0
      const env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_STORAGE_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',
        IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public',IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa_only',IEUM_AUDIO_BUCKET:'private-audio',
        IEUM_AUDIO_DECODER_PATH:executable,IEUM_AUDIO_MAX_DECODE_SECONDS:'2',IEUM_MIX_MAX_BYTES:String(bytes.length)}
      const fetchImpl=async(url,options)=>{
        if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
        if(url.endsWith('/ieum_get_project_mix')){
          assert.equal(options.headers.Authorization,'Bearer qa-token')
          return Response.json({project,mix:{jobId,status:'succeeded',result:{objectId,sha256:before,duration:savedDuration,completedAt:'2026-10-13T00:00:00Z'}}})
        }
        assert.equal(options.headers.apikey,'sb_secret_qa_only');assert.equal(options.headers.Authorization,undefined)
        if(url.endsWith('/bucket/private-audio'))return Response.json({id:'private-audio',public:false})
        if(url.includes('/object/sign/')){signed++;return Response.json({signedURL:`/object/sign/private-audio/originals/${objectId}?token=qa-read`})}
        return new Response(stored,{headers:{'Content-Type':contentType}})
      }
      const request=()=>new Request('https://ieum.example/api/projects/p/mix',{headers:{Authorization:'Bearer qa-token'}})
      const response=await projectLifecycleRequest(request(),{env,fetchImpl}),manifest=await response.json()
      assert.equal(response.headers.get('cache-control'),'private, no-store')
      assert.equal(manifest.mix.result.size,bytes.length);assert.equal(manifest.mix.result.duration,result.duration)
      assert.equal(manifest.mix.result.objectId,undefined);assert.equal(signed,1)
      savedDuration=result.duration+1
      await assert.rejects(projectLifecycleRequest(request(),{env,fetchImpl}),e=>e.code==='UPLOAD_OBJECT_MISMATCH');assert.equal(signed,1)
      savedDuration=result.duration;stored=new Uint8Array(bytes.length+1)
      await assert.rejects(projectLifecycleRequest(request(),{env,fetchImpl}),e=>e.code==='UPLOAD_OBJECT_MISMATCH');assert.equal(signed,1)
      console.log('PASS real WAV Mix read: actual decoded duration/hash/stream bound before private read URL; mismatched saved length and excessive bytes never signed. Synthetic audio, not generated music/worker.')
    }
    await assert.rejects(storage.verifyOriginalAudio(objectId,{...expected,sha256:'0'.repeat(64)},
      {executable:join(directory,'missing.exe'),maxDurationSeconds:2}),e=>e.code==='UPLOAD_OBJECT_MISMATCH','Hash failure must precede decoding')
    await assert.rejects(decodeOriginalAudio(file,{executable,contentType,maxDurationSeconds:0.1}),e=>e.code==='AUDIO_DURATION_EXCEEDED')
    await assert.rejects(decodeOriginalAudio(file,{executable,contentType:contentType==='audio/wav'?'audio/webm':'audio/wav',maxDurationSeconds:2}),e=>e.code==='AUDIO_FORMAT_MISMATCH')
    if(contentType==='audio/wav')await assert.rejects(decodeOriginalAudio(file,{executable,contentType,maxDurationSeconds:2,
      onPcmChunk:()=>{throw new Error('private consumer detail')}}),e=>e.code==='AUDIO_ANALYSIS_FAILED' && !e.message.includes('private consumer'))
    console.log(`${extension}: real decoder ${result.decodedFrames} frames/${result.duration}s; original preserved`)
  }
  const invalid=join(directory,'invalid.webm')
  await writeFile(invalid,Buffer.concat([Buffer.from([0x1a,0x45,0xdf,0xa3,0x87,0x42,0x82,0x84]),Buffer.from('webm not an audio stream')]))
  await assert.rejects(decodeOriginalAudio(invalid,{executable,contentType:'audio/webm',maxDurationSeconds:2}),e=>e.code==='AUDIO_DECODE_FAILED')
  await assert.rejects(decodeOriginalAudio(invalid,{executable:join(directory,'missing.exe'),contentType:'audio/webm',maxDurationSeconds:2}),e=>e.code==='AUDIO_DECODER_UNAVAILABLE')
  await assert.rejects(decodeOriginalAudio(invalid,{contentType:'audio/webm',maxDurationSeconds:2}),e=>e.code==='AUDIO_DECODER_NOT_CONFIGURED')
  await assert.rejects(decodeOriginalAudio(invalid,{executable,contentType:'audio/mpeg',maxDurationSeconds:2}),e=>e.code==='AUDIO_FORMAT_UNSUPPORTED')
  console.log('Real WebM/Opus, AAC MP4, fragmented MP4 and PCM WAV decode passed; invalid/mismatched/overlong audio denied. Synthetic fixtures, not microphone/listening or hosted-runtime acceptance.')
} finally {
  const target=resolve(directory),parent=resolve(tmpdir())+sep
  assert.ok(target.startsWith(parent) && target.split(sep).at(-1).startsWith('ieum-audio-decoder-'))
  await rm(target,{recursive:true,force:true}) // Only this test's newly created temporary directory.
}
