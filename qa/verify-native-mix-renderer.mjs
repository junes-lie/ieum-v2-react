import assert from 'node:assert/strict'
import {mkdtemp,writeFile,readFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {renderProjectMix} from '../server/mixRenderer.js'
import {decodeOriginalAudio} from '../server/audioDecoder.js'
import {createRequire} from 'node:module'
import {executeProjectMix} from '../server/mixExecution.js'

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

// Real isolated SQL submission -> private bytes -> existing native DSP ->
// immutable output upload -> actual FFmpeg decode -> completion transaction.
assert.ok(process.env.IEUM_PGLITE_ROOT,'Set IEUM_PGLITE_ROOT to the existing isolated SQL runtime')
const require=createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json')),{PGlite}=require('@electric-sql/pglite'),db=new PGlite()
const users=[1,2,3,4].map(n=>`${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`)
const env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_STORAGE_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',
  IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public',IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa_only',IEUM_AUDIO_BUCKET:'private-audio',
  IEUM_AUDIO_DECODER_PATH:process.env.IEUM_QA_FFMPEG_PATH,IEUM_AUDIO_MAX_DECODE_SECONDS:'2',IEUM_MIX_MAX_BYTES:'1048576'}
const files=new Map();let mode='normal',uploads=0
const fetchImpl=async(url,request)=>{
  if(url.includes('/rest/v1/rpc/')){
    assert.equal(request.headers.apikey,'sb_secret_qa_only');assert.equal(request.headers.Authorization,undefined)
    const name=url.split('/').at(-1),body=JSON.parse(request.body)
    if(mode==='completion-failure' && name==='ieum_complete_verified_mix')throw Error('Simulated DB outage')
    await db.exec('reset role;set role service_role')
    const params={ieum_get_mix_render_context:[body.p_job_id],ieum_get_mix_completion_context:[body.p_job_id],ieum_get_mix_backing:[body.p_job_id],
      ieum_prepare_mix_output:[body.p_job_id,body.p_sha256,body.p_size],ieum_complete_verified_mix:[body.p_job_id,body.p_object_id,body.p_sha256,body.p_duration]}[name]
    assert.ok(params)
    try{return Response.json((await db.query(`select public.${name}(${params.map((_,i)=>`$${i+1}`).join(',')}) as result`,params)).rows[0].result)}
    catch(error){if(error.code==='PT409')return new Response(null,{status:409});throw error}
  }
  if(url.endsWith('/bucket/private-audio'))return Response.json({id:'private-audio',public:false})
  const objectId=url.match(/originals\/([a-f0-9-]{36})/)?.[1];assert.ok(objectId)
  if(url.includes('/object/upload/sign/') && request.method==='POST')return Response.json({url:`/object/upload/sign/private-audio/originals/${objectId}?token=qa`})
  if(request.method==='PUT'){
    assert.equal(request.headers['x-upsert'],'false');assert.equal(request.headers.apikey,undefined)
    assert.ok(!files.has(objectId));files.set(objectId,Buffer.from(await request.body.arrayBuffer()));uploads++
    return Response.json({Key:'private-audio/originals/'+objectId})
  }
  assert.equal(request.method,'GET')
  if(!files.has(objectId))return new Response(null,{status:404})
  const bytes=mode==='source-mismatch'?Buffer.from(files.get(objectId)).fill(0,44):files.get(objectId)
  return new Response(bytes,{headers:{'Content-Type':'audio/wav'}})
}
try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`)
  for(const user of users)await db.query('insert into auth.users values($1)',[user])
  for(const name of ['project_tracks','project_participation','verified_audio_receipts','mix_completion_context','mix_output_intents','mix_render_context','arrangement_audio'])
    await db.exec(await readFile(new URL(`../server/migrations/20261013_${name}.sql`,import.meta.url),'utf8'))
  for(const count of [2,3,4]){
    await db.exec('reset role')
    const fixture=input(count),projectId=`native-${count}`,intents=[]
    await db.query('insert into public.ieum_projects(id,seed,song_id,project_key,audio_source_ref,part_count) values($1,$2,$3,$4,$5,$6)',
      [projectId,'same-seed','native-qa','original',JSON.stringify(fixture.project.audioSourceRef),count])
    const arrangementId=`arrangement-${count}`,backingObject=`aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa${count}`
    await db.query('insert into public.ieum_catalog_arrangements(id,song_id,project_key,audio_source_ref,parts) values($1,$2,$3,$4,$5)',
      [arrangementId,'native-qa','original',JSON.stringify(fixture.project.audioSourceRef),JSON.stringify(fixture.project.partIds.map(id=>({id,requiredRange:{lowMidi:60,highMidi:72}})))])
    await db.query('update public.ieum_projects set arrangement_id=$1 where id=$2',[arrangementId,projectId])
    for(let i=0;i<count;i++){
      const partId=`part-${i}`,receipt=voices[i].receipt
      await db.query('insert into public.ieum_project_parts(project_id,part_id,assigned_user_id,required_range) values($1,$2,$3,$4)',[projectId,partId,users[i],'{}'])
      const intent=(await db.query(`insert into public.ieum_upload_intents(project_id,part_id,user_id,object_id,byte_length,sha256,content_type,verified_at,verified_duration,audio_receipt)
        values($1,$2,$3,gen_random_uuid(),$4,$5,'audio/wav',now(),$6,$7) returning id,object_id`,
        [projectId,partId,users[i],receipt.size,receipt.sha256,receipt.duration,JSON.stringify(receipt)])).rows[0]
      intents.push(intent);files.set(intent.object_id,Buffer.from(await voices[i].blob.arrayBuffer()))
    }
    for(let i=0;i<count;i++){
      await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[users[i]]);await db.exec('set role authenticated')
      await db.query('select public.ieum_start_project_recording($1,$2)',[projectId,`part-${i}`])
      await db.query('select public.ieum_submit_verified_track($1,$2,$3,$4,$5,$6,null,$7)',[projectId,`part-${i}`,intents[i].id,`${projectId}-${i}`,voices[i].receipt.duration,i*5,'same-seed'])
    }
    await db.exec('reset role');const job=(await db.query('select * from public.ieum_mix_jobs where project_id=$1',[projectId])).rows[0]
    await db.exec('set role authenticated');await assert.rejects(db.query('select public.ieum_get_mix_render_context($1)',[job.id]),e=>e.code==='42501')
    await assert.rejects(db.query('select public.ieum_get_mix_backing($1)',[job.id]),e=>e.code==='42501')
    await assert.rejects(db.query('select * from public.ieum_arrangement_audio'),e=>e.code==='42501')
    const pipelineOptions={env,fetchImpl,rendererOptions:options}
    await assert.rejects(executeProjectMix({jobId:job.id},pipelineOptions),e=>e.code==='MIX_BACKING_UNAVAILABLE')
    await db.exec('reset role')
    await db.exec('begin')
    await db.query('insert into public.ieum_arrangement_audio(arrangement_id,object_id,audio_source_ref,receipt) values($1,$2,$3,$4)',
      [arrangementId,backingObject,JSON.stringify(fixture.project.audioSourceRef),JSON.stringify({...backing.receipt,sha256:'d'.repeat(64)})])
    await assert.rejects(executeProjectMix({jobId:job.id},pipelineOptions),e=>e.code==='MIX_BACKING_UNAVAILABLE')
    await db.exec('rollback;reset role')
    await db.query('insert into public.ieum_arrangement_audio(arrangement_id,object_id,audio_source_ref,receipt) values($1,$2,$3,$4)',
      [arrangementId,backingObject,JSON.stringify(fixture.project.audioSourceRef),JSON.stringify(backing.receipt)])
    files.set(backingObject,Buffer.from(await backing.blob.arrayBuffer()))
    await assert.rejects(db.query('update public.ieum_arrangement_audio set object_id=gen_random_uuid() where arrangement_id=$1',[arrangementId]),e=>e.code==='PT409')
    mode='source-mismatch';const before=uploads
    await assert.rejects(executeProjectMix({jobId:job.id},pipelineOptions),e=>e.code==='UPLOAD_OBJECT_MISMATCH');assert.equal(uploads,before)
    mode='completion-failure';await assert.rejects(executeProjectMix({jobId:job.id},pipelineOptions),e=>e.code==='PROJECT_UNAVAILABLE')
    await db.exec('reset role');assert.equal((await db.query('select lifecycle from public.ieum_projects where id=$1',[projectId])).rows[0].lifecycle,'mixing')
    mode='normal';const uploaded=uploads,result=await executeProjectMix({jobId:job.id},pipelineOptions)
    assert.equal(result.lifecycle,'completed');assert.equal(result.uploadStatus,'verified');assert.equal(uploads,uploaded,'Reuse the uploaded output after completion failure')
    await db.exec('reset role');const finished=(await db.query('select * from public.ieum_mix_jobs where id=$1',[job.id])).rows[0]
    assert.equal(finished.status,'succeeded');assert.equal(finished.result_sha256,results.find(r=>r.parts===count).sha256)
    for(let i=0;i<count;i++)assert.equal(sha(files.get(intents[i].object_id)),voices[i].receipt.sha256)
  }
  console.log('Native job pipeline: real isolated SQL + private byte verification + existing DSP + upload + decode + successful-only completion passed for 2/3/4 Parts')
}finally{await db.close()}
