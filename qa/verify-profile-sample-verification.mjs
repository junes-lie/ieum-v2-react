import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdtemp,readFile,rm} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
import {tmpdir} from 'node:os'
import {join,resolve,sep} from 'node:path'
import {profileSampleVerificationRequest} from '../server/profileSampleVerification.js'
import {profileSampleUploadErrorResponse} from '../server/profileSampleUpload.js'
assert.ok(process.env.IEUM_QA_FFMPEG_PATH && process.env.IEUM_PGLITE_ROOT,'Existing isolated FFmpeg/PGlite runtimes required; no installation/models')
const require=createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json'))
const {PGlite}=require('@electric-sql/pglite'),db=new PGlite()
const directory=await mkdtemp(join(tmpdir(),'ieum-profile-sample-')),file=join(directory,'original.mp4')
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222'
const asUser=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated')}
try{
  await new Promise((resolve,reject)=>{
    const child=spawn(process.env.IEUM_QA_FFMPEG_PATH,['-nostdin','-loglevel','error','-threads','1','-filter_threads','1',
      '-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=0.5','-threads','1','-c:a','aac',file],
      {shell:false,windowsHide:true,stdio:['ignore','ignore','ignore']})
    child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('Fixture generation failed')))
  })
  const bytes=await readFile(file),sha=createHash('sha256').update(bytes).digest('hex')
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
    create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`)
  for(const name of ['voice_profiles','project_tracks','project_participation','profile_source_history','profile_sample_uploads','profile_sample_receipts'])
    await db.exec(await readFile(new URL(`../server/migrations/20261013_${name}.sql`,import.meta.url),'utf8'))
  const previousProfile={roles:['화음·코러스'],preferredSongIds:['qa-song'],identity:{status:'blocked'}}
  await db.query('insert into public.ieum_profiles(user_id,profile_data) values($1,$2)',[a,JSON.stringify(previousProfile)])
  await db.query(`insert into public.ieum_profile_voice_sources values($1,'keep-source',$2,$3,
    'normalized-difference-v1',gen_random_uuid(),$4,20,now())`,[a,JSON.stringify({lowMidi:48,highMidi:67}),'a'.repeat(64),'b'.repeat(64)])
  const sourceBefore=(await db.query('select to_jsonb(s) as data from public.ieum_profile_voice_sources s')).rows[0].data
  await asUser(a)
  const intent=(await db.query("select public.ieum_prepare_profile_sample_upload('sample-1',$1,$2,'audio/mp4') as result",[bytes.length,sha])).rows[0].result
  const env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_STORAGE_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',
    IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public',IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa_only',IEUM_AUDIO_BUCKET:'private-audio',
    IEUM_AUDIO_DECODER_PATH:process.env.IEUM_QA_FFMPEG_PATH,IEUM_AUDIO_MAX_DECODE_SECONDS:'2'}
  let caller=a,storageMode='present',confirmFails=false,calls=[],lastConfirmation
  const confirm=async body=>(await db.query('select public.ieum_confirm_profile_sample_audio($1,$2,$3,$4) as result',
    [body.p_user_id,body.p_upload_intent_id,body.p_object_id,JSON.stringify(body.p_receipt)])).rows[0].result
  const fetchImpl=async(url,init)=>{
    calls.push(url);assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit')
    if(url.endsWith('/auth/v1/user'))return Response.json({id:caller})
    if(url.endsWith('/ieum_get_owned_profile_sample_upload')){
      assert.equal(init.headers.apikey,'qa-public');assert.equal(init.headers.Authorization,'Bearer qa-token')
      await asUser(caller)
      try{return Response.json((await db.query('select public.ieum_get_owned_profile_sample_upload($1) as result',[JSON.parse(init.body).p_upload_intent_id])).rows[0].result)}
      catch(error){return Response.json({message:'private database detail'},{status:error.code==='PT404'?404:500})}
    }
    if(url.endsWith('/ieum_confirm_profile_sample_audio')){
      assert.equal(init.headers.apikey,'sb_secret_qa_only');assert.equal(init.headers.Authorization,undefined)
      if(confirmFails)return Response.json({message:'private server detail'},{status:500})
      lastConfirmation=JSON.parse(init.body);await db.exec('reset role;set role service_role')
      return Response.json(await confirm(lastConfirmation))
    }
    assert.ok(url.includes('/storage/v1/'))
    assert.equal(init.headers.apikey,'sb_secret_qa_only');assert.equal(init.headers.Authorization,undefined)
    if(url.includes('/bucket/'))return Response.json({id:'private-audio',public:false})
    if(storageMode==='missing')return new Response('private',{status:404})
    return new Response(storageMode==='mismatch'?Buffer.alloc(bytes.length):bytes,{headers:{'Content-Type':'audio/mp4'}})
  }
  const request=(id=intent.uploadIntentId,extra={})=>new Request('https://ieum.example/api/me/voice-sample-verify',{
    method:'POST',headers:{Authorization:'Bearer qa-token','Content-Type':'application/json'},body:JSON.stringify({uploadIntentId:id,...extra})})
  const run=(configuration=env,id=intent.uploadIntentId)=>profileSampleVerificationRequest(request(id),{env:configuration,fetchImpl})
  const result=await(await run()).json()
  assert.equal(result.duration,.512);assert.equal(result.audioVerification,'verified');assert.equal(result.sampleVerification,'pending')
  assert.equal(result.analysisVersion,'decoded-pcm-v1');assert.equal(result.objectId,undefined)
  assert.ok(calls.findIndex(url=>url.includes('/storage/'))>calls.findIndex(url=>url.endsWith('/ieum_get_owned_profile_sample_upload')))
  await db.exec('reset role;set role service_role')
  assert.equal((await confirm(lastConfirmation)).receipt.duration,.512)
  await assert.rejects(confirm({...lastConfirmation,p_receipt:{...lastConfirmation.p_receipt,decoderSha256:'0'.repeat(64)}}),error=>error.code==='PT409')
  for(const receipt of [{...lastConfirmation.p_receipt,duration:.5},{...lastConfirmation.p_receipt,extra:true},{...lastConfirmation.p_receipt,decoderVersion:null}])
    await assert.rejects(confirm({...lastConfirmation,p_receipt:receipt}),error=>error.code==='PT400')
  await assert.rejects(confirm({...lastConfirmation,p_user_id:b}),error=>error.code==='PT409')
  calls=[]
  assert.deepEqual(await(await run({...env,IEUM_AUDIO_DECODER_PATH:''})).json(),result)
  assert.ok(calls.some(url=>url.includes('/storage/')));assert.ok(!calls.some(url=>url.endsWith('/ieum_confirm_profile_sample_audio')))
  for(const mode of ['missing','mismatch']){
    storageMode=mode;calls=[]
    const failed=await run().catch(profileSampleUploadErrorResponse)
    assert.equal(failed.status,409);assert.ok(!calls.some(url=>url.endsWith('/ieum_confirm_profile_sample_audio')))
  }
  storageMode='present';caller=b;calls=[]
  assert.equal((await run().catch(profileSampleUploadErrorResponse)).status,404)
  assert.ok(!calls.some(url=>url.includes('/storage/')))
  caller=a;await asUser(a)
  await assert.rejects(confirm(lastConfirmation),error=>error.code==='42501')
  await assert.rejects(profileSampleVerificationRequest(request(intent.uploadIntentId,{duration:999,userId:b}),{env,fetchImpl}),error=>error.code==='INVALID_SAMPLE_REQUEST')
  const next=(await db.query("select public.ieum_prepare_profile_sample_upload('sample-2',$1,$2,'audio/mp4') as result",[bytes.length,sha])).rows[0].result
  calls=[]
  await assert.rejects(run({...env,IEUM_AUDIO_DECODER_PATH:''},next.uploadIntentId),error=>error.code==='AUDIO_DECODER_NOT_CONFIGURED')
  assert.ok(!calls.some(url=>url.includes('/storage/')))
  confirmFails=true
  const failed=await run(env,next.uploadIntentId).catch(profileSampleUploadErrorResponse)
  assert.equal(failed.status,503);assert.deepEqual(await failed.json(),{error:{code:'SAMPLE_UPLOAD_UNAVAILABLE'}})
  await db.exec('reset role')
  assert.equal((await db.query('select audio_receipt from public.ieum_profile_sample_upload_intents where id=$1',[next.uploadIntentId])).rows[0].audio_receipt,null)
  assert.deepEqual((await db.query('select profile_data from public.ieum_profiles where user_id=$1',[a])).rows[0].profile_data,previousProfile)
  assert.deepEqual((await db.query('select to_jsonb(s) as data from public.ieum_profile_voice_sources s')).rows[0].data,sourceBefore)
  for(const table of ['ieum_projects','ieum_submitted_tracks','ieum_mix_jobs'])
    assert.equal((await db.query(`select count(*)::int n from public.${table}`)).rows[0].n,0)
  assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),sha)
  console.log('PASS real AAC + PostgreSQL personal Sample verification: owned lookup before Storage, actual .512s receipt, service-only immutable confirmation, byte recheck/version retention, foreign/missing/mismatch/runtime/DB failures, original/Profile/Identity preservation, 0 Track/Mix. Injected remote HTTP, not live registration or vocal feature analysis.')
}finally{
  await db.close()
  const target=resolve(directory)
  assert.ok(target.startsWith(resolve(tmpdir())+sep) && target.split(sep).at(-1).startsWith('ieum-profile-sample-'))
  await rm(target,{recursive:true,force:true})
}
