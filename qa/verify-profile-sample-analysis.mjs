import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdtemp,readFile,rm} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
import {tmpdir} from 'node:os'
import {join,resolve,sep} from 'node:path'
import {profileSampleVerificationRequest} from '../server/profileSampleVerification.js'
import {profileSampleAnalysisRequest} from '../server/profileSampleAnalysis.js'
import {analyzeVerifiedSample} from '../server/sampleVoiceAnalysis.js'
import {canonicalIdentityInput} from '../src/voiceIdentityContract.js'
assert.ok(process.env.IEUM_QA_FFMPEG_PATH && process.env.IEUM_PGLITE_ROOT,'Existing isolated decoder/SQL runtime required; no AI models or installation')
const require=createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json'))
const {PGlite}=require('@electric-sql/pglite'),db=new PGlite()
const directory=await mkdtemp(join(tmpdir(),'ieum-sample-analysis-')),file=join(directory,'original.mp4')
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
  for(const name of ['voice_profiles','project_tracks','project_participation','profile_source_history','profile_sample_uploads','profile_sample_receipts','profile_sample_analysis'])
    await db.exec(await readFile(new URL(`../server/migrations/20261013_${name}.sql`,import.meta.url),'utf8'))
  const profile={roles:[],identity:{status:'blocked'}}
  await db.query('insert into public.ieum_profiles(user_id,profile_data) values($1,$2)',[a,JSON.stringify(profile)])
  await asUser(a)
  const intent=(await db.query("select public.ieum_prepare_profile_sample_upload('sample-1',$1,$2,'audio/mp4') as result",[bytes.length,sha])).rows[0].result
  const env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_STORAGE_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',
    IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public',IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa_only',IEUM_AUDIO_BUCKET:'private-audio',
    IEUM_AUDIO_DECODER_PATH:process.env.IEUM_QA_FFMPEG_PATH,IEUM_AUDIO_MAX_DECODE_SECONDS:'2',IEUM_SAMPLE_ANALYSIS_MAX_PCM_BYTES:'1000000'}
  let caller=a,calls=[],mismatch=false,lastBody,failConfirmation=false
  const confirm=async body=>(await db.query('select public.ieum_confirm_profile_sample_analysis($1,$2,$3,$4) as result',
    [body.p_user_id,body.p_upload_intent_id,body.p_object_id,JSON.stringify(body.p_analysis)])).rows[0].result
  const fetchImpl=async(url,init)=>{
    calls.push(url);assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit')
    if(url.endsWith('/auth/v1/user'))return Response.json({id:caller})
    if(url.endsWith('/ieum_get_owned_profile_sample_upload')){
      assert.equal(init.headers.apikey,'qa-public');assert.equal(init.headers.Authorization,'Bearer qa-token')
      await asUser(caller)
      try{return Response.json((await db.query('select public.ieum_get_owned_profile_sample_upload($1) as result',[JSON.parse(init.body).p_upload_intent_id])).rows[0].result)}
      catch{return Response.json({message:'private DB detail'},{status:404})}
    }
    if(url.includes('/ieum_confirm_')){
      assert.equal(init.headers.apikey,'sb_secret_qa_only');assert.equal(init.headers.Authorization,undefined)
      await db.exec('reset role;set role service_role')
      const body=JSON.parse(init.body)
      if(url.endsWith('/ieum_confirm_profile_sample_audio'))return Response.json((await db.query('select public.ieum_confirm_profile_sample_audio($1,$2,$3,$4) as result',
        [body.p_user_id,body.p_upload_intent_id,body.p_object_id,JSON.stringify(body.p_receipt)])).rows[0].result)
      assert.ok(url.endsWith('/ieum_confirm_profile_sample_analysis'))
      if(failConfirmation){assert.deepEqual(body.p_analysis,analysis,'Fresh analysis of the same original/version must reproduce the saved features');return new Response('private DB detail',{status:500})}
      lastBody=body;return Response.json(await confirm(body))
    }
    assert.ok(url.includes('/storage/'))
    assert.equal(init.headers.apikey,'sb_secret_qa_only');assert.equal(init.headers.Authorization,undefined)
    if(url.includes('/bucket/'))return Response.json({id:'private-audio',public:false})
    return new Response(mismatch?Buffer.alloc(bytes.length):bytes,{headers:{'Content-Type':'audio/mp4'}})
  }
  const request=(id=intent.uploadIntentId,extra={})=>new Request('https://ieum.example/api/me/voice-sample-analyze',{
    method:'POST',headers:{Authorization:'Bearer qa-token','Content-Type':'application/json'},body:JSON.stringify({uploadIntentId:id,...extra})})
  const run=(config=env,id=intent.uploadIntentId)=>profileSampleAnalysisRequest(request(id),{env:config,fetchImpl})
  await assert.rejects(run(),error=>error.code==='SAMPLE_AUDIO_NOT_VERIFIED')
  assert.ok(!calls.some(url=>url.includes('/storage/')))
  await profileSampleVerificationRequest(request(),{env,fetchImpl})
  calls=[]
  await assert.rejects(run({...env,IEUM_SAMPLE_ANALYSIS_MAX_PCM_BYTES:'1'}),error=>error.code==='SAMPLE_ANALYSIS_BUDGET_EXCEEDED')
  assert.ok(!calls.some(url=>url.includes('/storage/')))
  const first=await(await run()).json(),analysis=first.analysis
  assert.equal(first.analysisStatus,'verified');assert.equal(first.sampleVerification,'pending')
  assert.equal(analysis.features.version,'ieum-basic-voice-v5');assert.equal(analysis.sourceSha256,sha)
  assert.equal(analysis.featuresSha256,createHash('sha256').update(canonicalIdentityInput(analysis.features)).digest('hex'))
  assert.equal(analysis.features.pitchObservation.status,'estimated')
  assert.ok(Math.abs(analysis.features.pitchObservation.medianMidi-69)<.1)
  assert.equal(analysis.assessment.candidates.breathiness.value,null)
  assert.equal(analysis.assessment.candidates.vibrato.status,'unsupported')
  assert.equal(analysis.assessment.candidates.averageRange.status,'unsupported')
  assert.equal(analysis.assessment.candidates.brightness.status,'estimated')
  assert.equal(first.objectId,undefined)
  calls=[]
  assert.deepEqual(await(await run({...env,IEUM_AUDIO_DECODER_PATH:'',IEUM_SAMPLE_ANALYSIS_MAX_PCM_BYTES:''})).json(),first)
  assert.ok(!calls.some(url=>url.endsWith('/ieum_confirm_profile_sample_analysis')))
  mismatch=true
  await assert.rejects(run(),error=>error.code==='UPLOAD_OBJECT_MISMATCH');mismatch=false
  caller=b;calls=[]
  await assert.rejects(run(),error=>error.code==='SAMPLE_UPLOAD_NOT_FOUND')
  assert.ok(!calls.some(url=>url.includes('/storage/')));caller=a
  await asUser(a)
  await assert.rejects(confirm(lastBody),error=>error.code==='42501')
  await assert.rejects(profileSampleAnalysisRequest(request(intent.uploadIntentId,{features:{version:'forged'}}),{env,fetchImpl}),error=>error.code==='INVALID_SAMPLE_REQUEST')
  await db.exec('reset role;set role service_role')
  assert.deepEqual((await confirm(lastBody)).analysis,analysis)
  await assert.rejects(confirm({...lastBody,p_analysis:{...analysis,featuresSha256:'0'.repeat(64)}}),error=>error.code==='PT409')
  await assert.rejects(confirm({...lastBody,p_user_id:b}),error=>error.code==='PT409')
  await asUser(a)
  const next=(await db.query("select public.ieum_prepare_profile_sample_upload('sample-2',$1,$2,'audio/mp4') as result",[bytes.length,sha])).rows[0].result
  await profileSampleVerificationRequest(request(next.uploadIntentId),{env,fetchImpl})
  calls=[]
  await assert.rejects(run({...env,IEUM_SAMPLE_ANALYSIS_MAX_PCM_BYTES:''},next.uploadIntentId),error=>error.code==='SAMPLE_ANALYSIS_NOT_CONFIGURED')
  failConfirmation=true
  await assert.rejects(run(env,next.uploadIntentId),error=>error.code==='SAMPLE_UPLOAD_UNAVAILABLE')
  await db.exec('reset role')
  assert.equal((await db.query('select voice_analysis from public.ieum_profile_sample_upload_intents where id=$1',[next.uploadIntentId])).rows[0].voice_analysis,null)
  assert.deepEqual((await db.query('select profile_data from public.ieum_profiles where user_id=$1',[a])).rows[0].profile_data,profile)
  for(const table of ['ieum_profile_voice_sources','ieum_profile_voice_source_history','ieum_projects','ieum_submitted_tracks','ieum_mix_jobs'])
    assert.equal((await db.query(`select count(*)::int n from public.${table}`)).rows[0].n,0)
  // A stream split in the middle of a signed sample must retain exact PCM order.
  const pcm=Buffer.alloc(4096*2);for(let i=0;i<4096;i++)pcm.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*440/48000)*10000),i*2)
  const receipt={...analysis.audioReceipt,decodedFrames:4096,duration:4096/48000}
  const context={purpose:'voice-sample',audioVerified:true,receipt,objectId:intent.objectId,size:bytes.length,sha256:sha,contentType:'audio/mp4'}
  const stub=split=>({verifyOriginalAudio:async(_,__,options)=>{for(const chunk of split)options.onPcmChunk(chunk);return receipt}})
  const whole=await analyzeVerifiedSample({context,storage:stub([pcm]),decoderOptions:{},maxPcmBytes:4096*4})
  const split=await analyzeVerifiedSample({context,storage:stub([pcm.subarray(0,1),pcm.subarray(1,9),pcm.subarray(9)]),decoderOptions:{},maxPcmBytes:4096*4})
  assert.deepEqual(split,whole)
  assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),sha)
  console.log('PASS actual AAC→PCM v5 analysis→SQL immutable evidence: explicit RAM budget, actual sampled F0/proxy labels/unsupported values, owned source/hash/receipt, retry without decoder, foreign/forged/DB failures, odd-byte streaming, preserved Profile/0 Track/Mix. Fixtures, not physical singer/AI graphics or live Profile registration.')
}finally{
  await db.close()
  const target=resolve(directory)
  assert.ok(target.startsWith(resolve(tmpdir())+sep) && target.split(sep).at(-1).startsWith('ieum-sample-analysis-'))
  await rm(target,{recursive:true,force:true})
}
