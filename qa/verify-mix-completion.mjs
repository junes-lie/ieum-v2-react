import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {completeStoredProjectMix} from '../server/mixCompletion.js'

assert.ok(process.env.IEUM_PGLITE_ROOT,'An existing isolated PostgreSQL runtime is required; no remote migration or installation')
assert.ok(process.env.IEUM_QA_FFMPEG_PATH,'An existing decoder is required; no AI model is started')
const require=createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json')),{PGlite}=require('@electric-sql/pglite'),db=new PGlite()
const users=[1,2,3,4].map(n=>`${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`)
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
// A real short PCM WAV, not a rendered Track mix or approved music candidate.
const bytes=Buffer.alloc(44+12000*2)
bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVE',8);bytes.write('fmt ',12);bytes.writeUInt32LE(16,16)
bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(48000,24);bytes.writeUInt32LE(96000,28)
bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(bytes.length-44,40)
for(let n=0;n<12000;n++)bytes.writeInt16LE(Math.round(Math.sin(n*2*Math.PI*440/48000)*2000),44+n*2)
const originalHash=sha(bytes),objectId='55555555-5555-4555-8555-555555555555'
const env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_STORAGE_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',
  IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public',IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa_only',IEUM_AUDIO_BUCKET:'private-audio',
  IEUM_AUDIO_DECODER_PATH:process.env.IEUM_QA_FFMPEG_PATH,IEUM_AUDIO_MAX_DECODE_SECONDS:'1',IEUM_MIX_MAX_BYTES:String(bytes.length)}
let mode='normal',storageCalls=0,completionCalls=0
const asUser=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated')}
const fetchImpl=async(url,options)=>{
  assert.equal(options.headers.apikey,'sb_secret_qa_only');assert.equal(options.headers.Authorization,undefined)
  assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error')
  if(url.includes('/storage/v1/')){
    storageCalls++
    if(url.endsWith('/bucket/private-audio'))return Response.json({id:'private-audio',public:false})
    if(mode==='missing')return new Response(null,{status:404})
    const value=mode==='mismatch'?Buffer.from(bytes).fill(0,44):mode==='oversize'?Buffer.concat([bytes,Buffer.from([0])]):bytes
    return new Response(value,{headers:{'Content-Type':'audio/wav'}})
  }
  assert.equal(options.referrerPolicy,'no-referrer')
  const body=JSON.parse(options.body)
  if(url.endsWith('/ieum_get_mix_completion_context')){
    if(mode==='forbidden')return Response.json({message:'secret diagnostic'},{status:403})
    await db.exec('reset role;set role service_role')
    return Response.json((await db.query('select public.ieum_get_mix_completion_context($1) as result',[body.p_job_id])).rows[0].result)
  }
  assert.ok(url.endsWith('/ieum_complete_verified_mix'));completionCalls++
  assert.equal(body.p_duration,.25,'Only the actual decoded file duration reaches SQL')
  if(mode==='db-failure')throw new Error('private URL/token diagnostic')
  if(mode==='input-conflict'){
    await db.exec('reset role')
    await db.query("update public.ieum_mix_jobs set track_ids='[\"wrong:lead\",\"wrong:harmony\"]' where id=$1",[body.p_job_id])
  }
  await db.exec('reset role;set role service_role')
  try{return Response.json((await db.query('select public.ieum_complete_verified_mix($1,$2,$3,$4) as result',
    [body.p_job_id,body.p_object_id,body.p_sha256,body.p_duration])).rows[0].result)}
  catch(error){if(error.code==='PT409')return Response.json({message:'internal conflict'},{status:409});throw error}
}
try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`)
  for(const user of users)await db.query('insert into auth.users values($1)',[user])
  for(const name of ['project_tracks','project_mix_reads','mix_completion_context'])await db.exec(await readFile(new URL(`../server/migrations/20261013_${name}.sql`,import.meta.url),'utf8'))
  const source={songId:'fixture',key:'original',revision:'v1',duration:.25,sourceSha256:'a'.repeat(64),backingSha256:'b'.repeat(64)}
  for(const count of [2,3,4]){
    await db.exec('reset role');const projectId=`p-${count}`,intents=[]
    await db.query('insert into public.ieum_projects(id,seed,song_id,project_key,audio_source_ref,part_count) values($1,$2,$3,$4,$5,$6)',
      [projectId,`seed-${count}`,'fixture','original',JSON.stringify(source),count])
    for(let n=0;n<count;n++){
      await db.exec('reset role')
      await db.query('insert into public.ieum_project_parts(project_id,part_id,assigned_user_id,required_range) values($1,$2,$3,$4)',[projectId,`part-${n}`,users[n],'{}'])
      const intent=(await db.query(`insert into public.ieum_upload_intents(project_id,part_id,user_id,object_id,byte_length,sha256,content_type,verified_at,verified_duration)
        values($1,$2,$3,gen_random_uuid(),4000,$4,'audio/wav',now(),.25) returning id`,[projectId,`part-${n}`,users[n],'c'.repeat(64)])).rows[0].id
      intents.push(intent)
    }
    for(let n=0;n<count;n++){
      await asUser(users[n]);await db.query('select public.ieum_start_project_recording($1,$2)',[projectId,`part-${n}`])
      await db.query('select public.ieum_submit_verified_track($1,$2,$3,$4,.25,0,$5,$6)',[projectId,`part-${n}`,intents[n],`${projectId}-submit-${n}`,'{}',`seed-${count}`])
    }
    await db.exec('reset role')
    const job=(await db.query('select * from public.ieum_mix_jobs where project_id=$1',[projectId])).rows[0]
    const input={jobId:job.id,objectId,sha256:originalHash},options={env,fetchImpl}
    await asUser(users[0]);await assert.rejects(db.query('select public.ieum_get_mix_completion_context($1)',[job.id]),e=>e.code==='42501')
    for(const [next,code] of [['forbidden','MIX_WORKER_FORBIDDEN'],['missing','UPLOAD_OBJECT_MISSING'],['mismatch','UPLOAD_OBJECT_MISMATCH'],['oversize','UPLOAD_OBJECT_MISMATCH'],['db-failure','PROJECT_UNAVAILABLE']]){
      mode=next;const beforeStorage=storageCalls,beforeCompletion=completionCalls
      await assert.rejects(completeStoredProjectMix(input,options),e=>e.code===code && !e.message.includes('diagnostic'))
      if(next==='forbidden')assert.equal(storageCalls,beforeStorage)
      if(next!=='db-failure')assert.equal(completionCalls,beforeCompletion)
      await db.exec('reset role');assert.equal((await db.query('select lifecycle from public.ieum_projects where id=$1',[projectId])).rows[0].lifecycle,'mixing')
    }
    mode='normal'
    await assert.rejects(completeStoredProjectMix({...input,duration:30},options),e=>e.code==='INVALID_MIX_RESULT')
    await assert.rejects(completeStoredProjectMix(input,{...options,env:{...env,IEUM_MIX_MAX_BYTES:''}}),e=>e.code==='AUDIO_DECODER_NOT_CONFIGURED')
    if(count===2){
      mode='input-conflict';await assert.rejects(completeStoredProjectMix(input,options),e=>e.code==='MIX_RESULT_CONFLICT')
      await db.exec('reset role');assert.equal((await db.query('select lifecycle from public.ieum_projects where id=$1',[projectId])).rows[0].lifecycle,'mixing')
      await db.query('update public.ieum_mix_jobs set track_ids=$1 where id=$2',[JSON.stringify(job.track_ids),job.id]);mode='normal'
    }
    const done=await completeStoredProjectMix(input,options)
    assert.equal(done.lifecycle,'completed');assert.equal(done.receipt.duration,.25);assert.equal(done.receipt.sha256,originalHash)
    assert.equal(done.receipt.size,bytes.length);assert.equal(done.receipt.analysisVersion,'decoded-pcm-v1')
    await db.exec('reset role');const revision=(await db.query('select revision from public.ieum_projects where id=$1',[projectId])).rows[0].revision
    assert.deepEqual(await completeStoredProjectMix(input,options),done)
    await db.exec('reset role');assert.equal((await db.query('select revision from public.ieum_projects where id=$1',[projectId])).rows[0].revision,revision)
    assert.equal((await db.query('select count(*)::int as count from public.ieum_submitted_tracks where project_id=$1',[projectId])).rows[0].count,count)
    const before=storageCalls;await assert.rejects(completeStoredProjectMix({...input,sha256:'0'.repeat(64)},options),e=>e.code==='MIX_RESULT_CONFLICT');assert.equal(storageCalls,before)
    mode='missing';await assert.rejects(completeStoredProjectMix(input,options),e=>e.code==='UPLOAD_OBJECT_MISSING');mode='normal'
    assert.equal(sha(bytes),originalHash,'Input audio remains unchanged')
  }
  await db.exec('reset role;set role anon');await assert.rejects(db.query('select public.ieum_get_mix_completion_context(gen_random_uuid())'),e=>e.code==='42501')
  console.log('PASS real WAV Storage bytes → actual decoder → isolated PostgreSQL completion for 2/3/4 Parts; missing/hash/size/config/auth/DB/input conflict failures stay incomplete; exact retry and original/Track preservation. Synthetic stored result and injected Storage; no renderer/upload/hosted worker or listening claim.')
}finally{await db.close()}
