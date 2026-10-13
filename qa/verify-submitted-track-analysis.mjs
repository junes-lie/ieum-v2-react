import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {createSupabaseAudioStorage} from '../server/audioStorage.js'
import {projectLifecycleRequest,projectLifecycleErrorResponse} from '../server/projectLifecycle.js'
import {createServiceSession} from '../src/serviceSession.js'
import {loadRemoteSubmittedTrackIdentityInput} from '../src/voiceIdentitySources.js'
import {checkedStoredTrackAnalysis} from '../server/sampleVoiceAnalysis.js'

assert.ok(process.env.IEUM_PGLITE_ROOT && process.env.IEUM_QA_FFMPEG_PATH,'Existing isolated SQL/decoder required; no installation/model')
const require=createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json')),{PGlite}=require('@electric-sql/pglite'),db=new PGlite()
const users=[1,2,3,4].map(n=>`${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`)
// Real short test WAV; this is neither approved music nor a physical microphone.
const bytes=Buffer.alloc(44+24000*2)
bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVE',8);bytes.write('fmt ',12);bytes.writeUInt32LE(16,16)
bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(48000,24);bytes.writeUInt32LE(96000,28)
bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(bytes.length-44,40)
for(let n=0;n<24000;n++)bytes.writeInt16LE(Math.round(Math.sin(n*2*Math.PI*440/48000)*3000),44+n*2)
const sha256=createHash('sha256').update(bytes).digest('hex')
const env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_STORAGE_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',
  IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public',IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa_only',IEUM_AUDIO_BUCKET:'private-audio',
  IEUM_AUDIO_DECODER_PATH:process.env.IEUM_QA_FFMPEG_PATH,IEUM_AUDIO_MAX_DECODE_SECONDS:'1',IEUM_TRACK_ANALYSIS_MAX_PCM_BYTES:'96000'}
const asUser=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id || '']);await db.exec('set role authenticated')}
let caller=users[0],storageCalls=0,confirmCalls=0,failConfirmation=false,mode='normal',lastAnalysis
const confirm=async body=>(await db.query('select public.ieum_confirm_submitted_track_analysis($1,$2,$3,$4,$5) as result',
  [body.p_project_id,body.p_part_id,body.p_user_id,body.p_object_id,JSON.stringify(body.p_analysis)])).rows[0].result
const fetchImpl=async(url,init)=>{
  assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error')
  if(url.endsWith('/auth/v1/user'))return Response.json({id:caller})
  if(url.endsWith('/ieum_get_owned_submitted_track_analysis')){
    assert.equal(init.headers.apikey,'qa-public');assert.equal(init.headers.Authorization,'Bearer qa-token')
    const body=JSON.parse(init.body);await asUser(caller)
    try{return Response.json((await db.query('select public.ieum_get_owned_submitted_track_analysis($1,$2) as result',[body.p_project_id,body.p_part_id])).rows[0].result)}
    catch(error){return Response.json({message:'private lookup detail'},{status:Number(error.code?.slice(2)) || 500})}
  }
  if(url.endsWith('/ieum_confirm_submitted_track_analysis')){
    confirmCalls++;assert.equal(init.headers.apikey,'sb_secret_qa_only');assert.equal(init.headers.Authorization,undefined)
    const body=JSON.parse(init.body);lastAnalysis=body
    if(failConfirmation)return new Response('private DB detail',{status:500})
    await db.exec('reset role;set role service_role')
    return Response.json(await confirm(body))
  }
  assert.ok(url.includes('/storage/'));storageCalls++
  assert.equal(init.headers.apikey,'sb_secret_qa_only');assert.equal(init.headers.Authorization,undefined)
  if(url.includes('/bucket/'))return Response.json({id:'private-audio',public:false})
  if(mode==='missing')return new Response('private',{status:404})
  return new Response(mode==='mismatch'?Buffer.alloc(bytes.length):bytes,{headers:{'Content-Type':'audio/wav'}})
}
const request=(project,part='part-0',extra={})=>new Request(`https://ieum.example/api/projects/${project}/parts/${part}/analysis`,{
  method:'POST',headers:{Authorization:'Bearer qa-token','Content-Type':'application/json'},body:JSON.stringify(extra)})
const run=(project,config=env,part='part-0',extra={})=>projectLifecycleRequest(request(project,part,extra),{env:config,fetchImpl})
const snapshot=async project=>{await db.exec('reset role');return (await db.query(`select
  (select row_to_json(p) from public.ieum_projects p where id=$1) as project,
  (select jsonb_agg(to_jsonb(t) order by t.part_id) from public.ieum_submitted_tracks t where project_id=$1) as tracks,
  (select row_to_json(j) from public.ieum_mix_jobs j where project_id=$1) as mix`,[project])).rows[0]}
try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`)
  for(const user of users)await db.query('insert into auth.users values($1)',[user])
  for(const name of ['project_tracks','verified_audio_receipts','submitted_track_analysis'])await db.exec(await readFile(new URL(`../server/migrations/20261013_${name}.sql`,import.meta.url),'utf8'))
  const storage=createSupabaseAudioStorage({env,fetchImpl})
  const receipt=await storage.verifyOriginalAudio('55555555-5555-4555-8555-555555555555',{size:bytes.length,sha256,contentType:'audio/wav'},
    {executable:env.IEUM_AUDIO_DECODER_PATH,maxDurationSeconds:1})
  assert.equal(receipt.duration,.5);assert.equal(receipt.decodedFrames,24000)
  let reference
  for(const count of [2,3,4]){
    const project=`track-analysis-${count}`,intents=[]
    await db.exec('reset role')
    const source={songId:'fixture',key:'original',revision:'v1',duration:.5,sourceSha256:'a'.repeat(64),backingSha256:'b'.repeat(64)}
    await db.query('insert into public.ieum_projects(id,seed,song_id,project_key,audio_source_ref,part_count) values($1,$2,$3,$4,$5,$6)',
      [project,`seed-${count}`,'fixture','original',JSON.stringify(source),count])
    for(let n=0;n<count;n++){
      await db.query('insert into public.ieum_project_parts(project_id,part_id,assigned_user_id,required_range) values($1,$2,$3,$4)',[project,`part-${n}`,users[n],'{}'])
      intents.push((await db.query(`insert into public.ieum_upload_intents(project_id,part_id,user_id,object_id,byte_length,sha256,content_type,verified_at,verified_duration,audio_receipt)
        values($1,$2,$3,gen_random_uuid(),$4,$5,'audio/wav',now(),.5,$6) returning id`,[project,`part-${n}`,users[n],bytes.length,sha256,JSON.stringify(receipt)])).rows[0].id)
    }
    caller=users[0];storageCalls=0
    await assert.rejects(run(project),e=>e.code==='SUBMITTED_TRACK_NOT_FOUND')
    assert.equal(storageCalls,0,'Assigned Part/Draft without direct submission cannot be analyzed')
    for(let n=0;n<count;n++){
      await asUser(users[n]);await db.query('select public.ieum_start_project_recording($1,$2)',[project,`part-${n}`])
      await db.query('select public.ieum_submit_verified_track($1,$2,$3,$4,.5,0,$5,$6)',[project,`part-${n}`,intents[n],`${project}-submit-${n}`,
        JSON.stringify({version:'forged-client',brightness:1}),`seed-${count}`])
    }
    const before=await snapshot(project)
    caller=users[1];storageCalls=0
    await assert.rejects(run(project),e=>e.code==='TRACK_ANALYSIS_FORBIDDEN');assert.equal(storageCalls,0)
    caller=users[0]
    await assert.rejects(run(project,{...env,IEUM_TRACK_ANALYSIS_MAX_PCM_BYTES:'1'}),e=>e.code==='TRACK_ANALYSIS_BUDGET_EXCEEDED')
    assert.equal(storageCalls,0,'RAM budget rejected before any Storage download/allocation')
    await assert.rejects(run(project,env,'part-0',{features:{brightness:1}}),e=>e.code==='INVALID_PROJECT_REQUEST')
    failConfirmation=true
    await assert.rejects(run(project),e=>e.code==='PROJECT_UNAVAILABLE')
    const computed=structuredClone(lastAnalysis.p_analysis)
    assert.deepEqual(await snapshot(project),before,'Analysis failure preserves submitted originals/Project/Mix job')
    failConfirmation=false
    const response=await run(project),result=await response.json()
    assert.equal(response.headers.get('cache-control'),'private, no-store')
    assert.equal(result.trackId,`${project}:part-0`);assert.equal(result.analysisStatus,'verified')
    assert.deepEqual(result.analysis,computed,'Retry reproduces actual decoded features, not client JSON')
    assert.equal(result.analysis.version,'ieum-track-analysis-v1');assert.equal(result.analysis.assessment.purpose,'project-track')
    assert.equal(result.analysis.features.version,'ieum-basic-voice-v5')
    assert.equal(result.analysis.sourceSha256,sha256);assert.equal(result.analysis.features.sampleRate,48000)
    assert.equal(result.analysis.assessment.candidates.actualRange.status,'estimated')
    assert.equal(result.analysis.assessment.candidates.bpm.status,'unsupported')
    if(reference)assert.deepEqual(result.analysis,reference,'Same source/version independent of Project/Part count reproduces')
    reference=result.analysis
    confirmCalls=0
    assert.deepEqual((await(await run(project,{...env,IEUM_AUDIO_DECODER_PATH:''})).json()).analysis,result.analysis)
    assert.equal(confirmCalls,0,'Saved analysis is retained, not regenerated with a different decoder')
    const context={receipt,size:bytes.length,sha256,contentType:'audio/wav',analysis:result.analysis}
    assert.deepEqual(checkedStoredTrackAnalysis(context),result.analysis)
    assert.throws(()=>checkedStoredTrackAnalysis({...context,analysis:{...result.analysis,featuresSha256:'0'.repeat(64)}}),e=>e.code==='INVALID_TRACK_ANALYSIS')
    let tamper=null,mutateRef=null,disconnectAfterResponse=false
    const session=createServiceSession({baseUrl:'https://ieum.example/api',fetchImpl:async(url,init)=>{
      if(url.endsWith('/capabilities'))return Response.json({contractVersion:'ieum-service-v1',mode:'remote',authenticated:true,sharedProjects:true})
      if(url.endsWith('/me/session'))return Response.json({authenticated:true,user:{id:caller}})
      // Registry SQL/owner isolation is covered by verify-personal-identity-registry.
      // This fixture keeps the existing real decoder/Track analysis scope.
      if(url.includes('/me/voice-identity?'))return Response.json({resultStatus:'stored',profileRevision:'fixture-profile-r1',
        ref:{id:'opaque-fixture-personal-result',revision:'fixture-r1',outputSha256:'a'.repeat(64),inputDigest:'b'.repeat(64),generatorVersion:'fixture-personal-v1'}})
      try{
        mutateRef?.();mutateRef=null
        const response=await projectLifecycleRequest(new Request(url,init),{env,fetchImpl})
        if(disconnectAfterResponse)session.disconnect()
        if(tamper){const data=await response.json();tamper(data);return Response.json(data)}
        return response
      }catch(e){return projectLifecycleErrorResponse(e)}
    }})
    await session.connect('qa-token')
    let escaped
    const client=await session.run(async({service})=>{escaped=service.analyzeSubmittedTrack;return service.analyzeSubmittedTrack(project,'part-0')})
    assert.deepEqual(client,result,'Existing client/session routes to actual HTTP/SQL analysis')

    // Opaque fixture reference only: no personal graphic generation/approval is claimed.
    const identityRef={id:'opaque-fixture-personal-result',revision:'fixture-r1',outputSha256:'a'.repeat(64)}
    const input={session,projectId:project,partId:'part-0',identityOwnerId:caller,identityRef,generatorVersion:'fixture-layer-v1'}
    const manifest=await loadRemoteSubmittedTrackIdentityInput(input)
    assert.deepEqual(await loadRemoteSubmittedTrackIdentityInput(input),manifest)
    assert.equal(manifest.source.purpose,'project-track');assert.equal(manifest.source.sha256,sha256)
    assert.equal(manifest.source.data.verificationVersion,'ieum-track-analysis-v1')
    assert.deepEqual(manifest.source.data.audioReceipt,receipt)
    assert.deepEqual(manifest.source.data.analysis,result.analysis.features)
    assert.equal(manifest.source.data.assessment.candidates.bpm.status,'unsupported')
    assert.ok(!('userId' in manifest) && !('url' in manifest) && !('layerStatus' in manifest))
    await assert.rejects(loadRemoteSubmittedTrackIdentityInput({...input,identityOwnerId:users[1]}),/owner/)
    await assert.rejects(loadRemoteSubmittedTrackIdentityInput({...input,identityRef:null}),/personal result/)
    assert.notEqual((await loadRemoteSubmittedTrackIdentityInput({...input,generatorVersion:'fixture-layer-v2'})).inputDigest,manifest.inputDigest)
    const mutableRef=structuredClone(identityRef)
    mutateRef=()=>{mutableRef.revision='changed-during-request'}
    assert.deepEqual(await loadRemoteSubmittedTrackIdentityInput({...input,identityRef:mutableRef}),manifest,'Capture existing personal ref before awaiting analysis')
    for(const change of [
      data=>{data.analysis.version='ieum-sample-analysis-v1'},
      data=>{data.trackId='other:part'},
      data=>{data.analysis.features.brightness=.987},
      data=>{data.analysis.assessment.candidates.bpm={status:'estimated',value:120,confidence:1}},
      data=>{data.analysis.audioReceipt.sha256='0'.repeat(64)},
      data=>{data.audioUrl='https://private.example/token'}
    ]){
      tamper=change
      await assert.rejects(loadRemoteSubmittedTrackIdentityInput(input),/provenance/)
    }
    tamper=null;disconnectAfterResponse=true
    await assert.rejects(loadRemoteSubmittedTrackIdentityInput(input),e=>e.code==='SESSION_CHANGED')
    assert.equal(session.snapshot().authenticated,false)
    await assert.rejects(escaped(project,'part-0'),e=>e.code==='SESSION_CHANGED')

    assert.deepEqual(await snapshot(project),before,'Analysis success cannot change submission count, original, Seed or Mix')
    for(const value of ['missing','mismatch']){mode=value;await assert.rejects(run(project),e=>e.code===`UPLOAD_OBJECT_${value==='missing'?'MISSING':'MISMATCH'}`)}
    mode='normal'
    await db.exec('reset role;set role service_role')
    await assert.rejects(confirm({...lastAnalysis,p_analysis:{...result.analysis,featuresSha256:'0'.repeat(64)}}),e=>e.code==='PT409')
    await assert.rejects(confirm({...lastAnalysis,p_analysis:{...result.analysis,version:'ieum-sample-analysis-v1'}}),e=>e.code==='PT400')
    await asUser(users[0])
    await assert.rejects(confirm(lastAnalysis),e=>e.code==='42501','User cannot claim trusted analysis')
    assert.equal(projectLifecycleErrorResponse(Object.assign(new Error('secret'),{code:'TRACK_ANALYSIS_CONFLICT'})).status,409)
    assert.deepEqual(await snapshot(project),before)
  }
  console.log('PASS submitted Track analysis: real short WAV decoder→existing v5 extractor→HTTP→isolated SQL; 2/3/4 Part owner/submit gate, replay/reproducibility, source/purpose/version and private Identity-input bridge, tamper/logout denial, RAM bound, failures and unchanged Track/Mix. No remote service, music/graphic or physical mic claim.')
}finally{await db.close()}
