import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {createSupabaseAudioStorage} from '../server/audioStorage.js'
import {analyzeVerifiedTrack} from '../server/sampleVoiceAnalysis.js'
import {storeReceivedPersonalIdentity,voiceIdentityRouteRequest,personalIdentityErrorResponse} from '../server/personalIdentityResults.js'
import {storeReceivedTrackVoiceLayer,trackVoiceLayerRequest,trackVoiceLayerErrorResponse} from '../server/trackVoiceLayers.js'
import {persistRemoteProjectVoiceRecordInput,projectVoiceRecordInputRequest,projectVoiceRecordInputErrorResponse} from '../server/projectVoiceRecordInputs.js'
import {voiceSourceRegistrationRequest} from '../server/voiceSourceRegistration.js'
import {projectLifecycleRequest,projectLifecycleErrorResponse} from '../server/projectLifecycle.js'
import {createServiceSession} from '../src/serviceSession.js'
import {loadRemoteMeasuredProfileIdentityInput,loadRemoteSubmittedVoiceControls,loadRemoteProjectRecordInput} from '../src/voiceIdentitySources.js'
import {canonicalIdentityInput,assessVoiceCandidates} from '../src/voiceIdentityContract.js'
import {voiceSourceRevision} from '../src/profileSource.js'
import {fixturePng} from './png-fixture.mjs'
import {loadRemoteOwnedVoiceImage} from '../src/ownedVoiceImages.js'
assert.ok(process.env.IEUM_PGLITE_ROOT && process.env.IEUM_QA_FFMPEG_PATH,'Existing isolated SQL/decoder required; no runtime install/model')
const require=createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json')),{PGlite}=require('@electric-sql/pglite'),db=new PGlite()
const users=[1,2,3,4,5].map(n=>`${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`)
const hash=value=>createHash('sha256').update(value).digest('hex')
const wav=Buffer.alloc(44+24000*2)
wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16)
wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(48000,24);wav.writeUInt32LE(96000,28)
wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40)
for(let i=0;i<24000;i++)wav.writeInt16LE(Math.round(3000*Math.sin(2*Math.PI*220*i/48000)),44+i*2)
const sha=hash(wav),env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_STORAGE_PROVIDER:'supabase',
  IEUM_SUPABASE_URL:'https://example.supabase.co',IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public',IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa',IEUM_AUDIO_BUCKET:'private-audio',IEUM_IMAGE_DECODER_PATH:process.env.IEUM_QA_FFMPEG_PATH}
let caller=users[0],storageMode='normal',storageCalls=0,staleWrite=false,disconnectOnRead=false,activeSession
const role=async(name,user)=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user || '']);await db.exec(`set role ${name}`)}
const calls={
  ieum_store_personal_identity_result:b=>[b.p_user_id,b.p_profile_revision,JSON.stringify(b.p_result),b.p_png],
  ieum_get_owned_personal_identity_result:b=>[b.p_id,b.p_revision],ieum_get_owned_personal_identity_traits:b=>[b.p_id,b.p_revision],ieum_get_voice_source:()=>[],
  ieum_get_owned_personal_identity_image_chunk:b=>[b.p_id,b.p_revision,b.p_offset,b.p_length],
  ieum_get_owned_track_voice_image_chunk:b=>[b.p_project_id,b.p_part_id,b.p_id,b.p_revision,b.p_offset,b.p_length],
  ieum_get_owned_submitted_track_analysis:b=>[b.p_project_id,b.p_part_id],
  ieum_get_track_voice_layer_context:b=>[b.p_project_id,b.p_part_id,b.p_user_id,b.p_personal_id,b.p_personal_revision],
  ieum_store_track_voice_layer:b=>[b.p_project_id,b.p_part_id,b.p_user_id,JSON.stringify(b.p_result),b.p_png],
  ieum_get_owned_track_voice_layer:b=>[b.p_project_id,b.p_part_id,b.p_id,b.p_revision],
  ieum_get_project_voice_record_context:b=>[b.p_project_id,JSON.stringify(b.p_layer_refs)],
  ieum_store_project_voice_record_input:b=>[b.p_project_id,b.p_expected_revision,JSON.stringify(b.p_input),JSON.stringify(b.p_sources),JSON.stringify(b.p_layer_refs)],
  ieum_get_project_voice_record_input:b=>[b.p_project_id,b.p_input_digest]
}
const fetchImpl=async(url,init)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:caller})
  if(url.includes('/storage/')){
    storageCalls++;assert.equal(init.headers.apikey,env.IEUM_SUPABASE_SECRET_KEY)
    if(url.includes('/bucket/'))return Response.json({id:'private-audio',public:false})
    return new Response(storageMode==='normal'?wav:Buffer.alloc(wav.length),{headers:{'Content-Type':'audio/wav'}})
  }
  const name=url.split('/').at(-1),body=JSON.parse(init.body),args=calls[name]?.(body)
  assert.ok(args,`Recognized real SQL RPC: ${name}`)
  const privileged=init.headers.apikey===env.IEUM_SUPABASE_SECRET_KEY
  assert.equal(init.headers.Authorization,privileged?undefined:'Bearer qa-token')
  await role(privileged?'service_role':'authenticated',privileged?null:caller)
  if(staleWrite && name==='ieum_store_project_voice_record_input'){
    await db.exec('reset role') // Isolated concurrent-writer probe, not an RLS-denied client update.
    const changed=await db.query('update public.ieum_projects set revision=revision+1 where id=$1 returning revision',[body.p_project_id]);staleWrite=false
    assert.equal(changed.rows[0].revision,body.p_expected_revision+1)
    await role('service_role')
  }
  try{return Response.json((await db.query(`select public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) as result`,args)).rows[0].result)}
  catch(error){return Response.json({message:'private SQL detail'},{status:Number(error.code?.slice(2)) || 500})}
}
const options={env,fetchImpl,maxOriginalBytes:100000}
async function connect(){
  const session=createServiceSession({baseUrl:'https://ieum.example/api',fetchImpl:async(url,init)=>{
    if(url.endsWith('/capabilities'))return Response.json({contractVersion:'ieum-service-v1',mode:'remote',authenticated:true,sharedProjects:true})
    if(url.endsWith('/me/session'))return Response.json({authenticated:true,user:{id:caller}})
    const request=new Request(url,init)
    let response
    try{
      if(url.includes('/me/voice-source'))response=await voiceSourceRegistrationRequest(request,options)
      else if(url.includes('/me/voice-identity'))response=await voiceIdentityRouteRequest(request,options)
      else response=await projectLifecycleRequest(request,options)
    }catch(error){return url.includes('/voice-identity')?personalIdentityErrorResponse(error):url.includes('/voice-layer')?trackVoiceLayerErrorResponse(error):url.includes('/voice-record')?projectVoiceRecordInputErrorResponse(error):projectLifecycleErrorResponse(error)}
    if(disconnectOnRead)session.disconnect()
    return response
  }})
  await session.connect('qa-token');activeSession=session;return session
}
const json=value=>JSON.stringify(value)
const snapshot=async project=>{
  await db.exec('reset role')
  return (await db.query(`select (select to_jsonb(p) from public.ieum_projects p where id=$1) as project,
    (select jsonb_agg(to_jsonb(t) order by part_id) from public.ieum_submitted_tracks t where project_id=$1) as tracks,
    (select to_jsonb(j) from public.ieum_mix_jobs j where project_id=$1) as mix`,[project])).rows[0]
}
// Decoded test raster only: not actual generated/approved Identity/Flow art.
const png=fixturePng()
const image=new Blob([png],{type:'image/png'}),personalRefs=[]
try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`)
  for(const user of users)await db.query('insert into auth.users values($1)',[user])
  for(const name of ['voice_profiles','project_tracks','project_participation','profile_source_history','profile_sample_uploads','profile_sample_receipts','profile_sample_analysis',
    'profile_source_registration','personal_identity_results','personal_identity_source_binding','personal_identity_traits','verified_audio_receipts','submitted_track_analysis','track_voice_layers','project_voice_record_inputs','owned_voice_image_chunks'])
    await db.exec(await readFile(new URL(`../server/migrations/20261013_${name}.sql`,import.meta.url),'utf8'))
  const storage=createSupabaseAudioStorage(options),decoderOptions={executable:process.env.IEUM_QA_FFMPEG_PATH,maxDurationSeconds:1}
  const receipt=await storage.verifyOriginalAudio('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',{size:wav.length,sha256:sha,contentType:'audio/wav'},decoderOptions)
  const analysis=await analyzeVerifiedTrack({context:{purpose:'project-track',submitted:true,audioVerified:true,objectId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    size:wav.length,sha256:sha,contentType:'audio/wav',receipt},storage,decoderOptions,maxPcmBytes:96000})
  for(let n=0;n<4;n++){
    caller=users[n];await role('authenticated',caller)
    const upload=(await db.query('select public.ieum_prepare_profile_sample_upload($1,$2,$3,$4) as result',['sample',wav.length,sha,'audio/wav'])).rows[0].result
    const sampleAnalysis={...analysis,version:'ieum-sample-analysis-v1',assessment:assessVoiceCandidates(analysis.features,'voice-sample')}
    await role('service_role')
    await db.query('select public.ieum_confirm_profile_sample_audio($1,$2,$3,$4)',[caller,upload.uploadIntentId,upload.objectId,json(receipt)])
    await db.query('select public.ieum_confirm_profile_sample_analysis($1,$2,$3,$4)',[caller,upload.uploadIntentId,upload.objectId,json(sampleAnalysis)])
    const range={analysisVersion:'normalized-difference-v1',lowMidi:48,highMidi:67,sampleCount:10,confidence:.8}
    const rangeSource={version:'ieum-profile-source-v1',purpose:'voice-range',revision:crypto.randomUUID(),analysisVersion:range.analysisVersion,measurementSha256:hash(canonicalIdentityInput(range))}
    const sampleSource={version:'ieum-profile-source-v1',purpose:'voice-sample',revision:crypto.randomUUID(),analysisVersion:analysis.features.version,audioSha256:sha,byteLength:wav.length}
    const revision=await voiceSourceRevision(rangeSource,sampleSource)
    await db.query('select public.ieum_register_profile_source($1,$2,$3,$4,$5,$6,$7,$8,$9)',[caller,upload.uploadIntentId,json(range),json(rangeSource),json(sampleSource),revision,null,'register',hash(json(range))])
    const session=await connect(),manifest=await loadRemoteMeasuredProfileIdentityInput({session,generatorVersion:'fixture-personal-v1'})
    personalRefs.push((await storeReceivedPersonalIdentity({manifest,artifact:{id:`personal-${n}`,revision:'r1',inputDigest:manifest.inputDigest,generatorVersion:manifest.generatorVersion,
      model:'fixture',modelRevision:'a'.repeat(40),inferenceSeed:'1',outputSha256:hash(png),blob:image}},options)).ref)
    session.disconnect()
  }
  for(const count of [2,3,4]){
    const project=`lineage-${count}`,seed=`seed-${count}`,refs={},inputs=[],source={songId:'fixture',key:'original',revision:'v1',duration:.5,sourceSha256:'a'.repeat(64),backingSha256:'b'.repeat(64)}
    await db.exec('reset role')
    await db.query('insert into public.ieum_projects(id,seed,song_id,project_key,audio_source_ref,part_count,owner_user_id) values($1,$2,$3,$4,$5,$6,$7)',[project,seed,'fixture','original',json(source),count,users[0]])
    const intents=[]
    for(let n=0;n<count;n++){
      await db.query('insert into public.ieum_project_parts(project_id,part_id,assigned_user_id,required_range) values($1,$2,$3,$4)',[project,`part-${n}`,users[n],'{}'])
      intents.push((await db.query(`insert into public.ieum_upload_intents(project_id,part_id,user_id,object_id,byte_length,sha256,content_type,verified_at,verified_duration,audio_receipt)
        values($1,$2,$3,gen_random_uuid(),$4,$5,'audio/wav',now(),.5,$6) returning id,object_id`,[project,`part-${n}`,users[n],wav.length,sha,json(receipt)])).rows[0])
    }
    // Assignment/upload alone cannot create a layer or increase submission.
    await assert.rejects(storeReceivedTrackVoiceLayer({projectId:project,partId:'part-0',userId:users[0],personalRef:personalRefs[0],generatorVersion:'fixture-flow',result:{id:'draft',revision:'r1'}},options),e=>e.code==='VOICE_LAYER_NOT_FOUND')
    let partial
    for(let n=0;n<count;n++){
      caller=users[n];await role('authenticated',caller)
      await db.query('select public.ieum_start_project_recording($1,$2)',[project,`part-${n}`])
      await db.query('select public.ieum_submit_verified_track($1,$2,$3,$4,.5,0,$5,$6)',[project,`part-${n}`,intents[n].id,`${project}-submit-${n}`,'{}',seed])
      await role('service_role')
      await db.query('select public.ieum_confirm_submitted_track_analysis($1,$2,$3,$4,$5)',[project,`part-${n}`,caller,intents[n].object_id,json(analysis)])
      if(n===0){partial=await persistRemoteProjectVoiceRecordInput({projectId:project,generatorVersion:'record-v1'},options);assert.equal(partial.input.submittedCount,1);assert.equal(partial.input.allRequiredTracksSubmitted,false)}
    }
    const before=await snapshot(project)
    const pending=await persistRemoteProjectVoiceRecordInput({projectId:project,generatorVersion:'record-v1'},options)
    assert.equal(pending.input.submittedCount,count);assert.equal(pending.input.allSubmittedLayersReady,false)
    staleWrite=true
    await assert.rejects(persistRemoteProjectVoiceRecordInput({projectId:project,generatorVersion:'stale-write-probe'},options),e=>e.code==='VOICE_LAYER_CONFLICT')
    await db.exec('reset role');await db.query('update public.ieum_projects set revision=revision-1 where id=$1',[project]) // Undo only the explicit QA revision probe inside isolated DB.
    for(let n=0;n<count;n++){
      caller=users[n];const session=await connect(),partId=`part-${n}`
      const prepared=await loadRemoteSubmittedVoiceControls({session,projectId:project,partId,identityOwnerId:caller,identityRef:personalRefs[n],generatorVersion:'fixture-flow'})
      const result={id:`layer-${n}`,revision:'r1',inputDigest:prepared.trackInput.inputDigest,artifact:{version:'ieum-ai-voice-layer-v1',projectId:project,partId,participantId:caller,
        projectSeed:seed,inferenceSeed:n,model:'fixture',revision:'a'.repeat(40),sourceSha256:sha,outputSha256:hash(png),blob:image}}
      const input={projectId:project,partId,userId:caller,personalRef:personalRefs[n],generatorVersion:'fixture-flow',result}
      const readsBefore=storageCalls,badHeader=Buffer.from(png);badHeader.writeUInt32BE(256,16)
      await assert.rejects(storeReceivedTrackVoiceLayer({...input,result:{...result,artifact:{...result.artifact,blob:new Blob([badHeader],{type:'image/png'})}}},options),e=>e.code==='INVALID_VOICE_LAYER')
      await assert.rejects(storeReceivedTrackVoiceLayer(input,{...options,maxOriginalBytes:1}),e=>e.code==='VOICE_LAYER_MEMORY_BUDGET_EXCEEDED')
      assert.equal(storageCalls,readsBefore,'Invalid image/budget is refused before original download')
      const saved=await storeReceivedTrackVoiceLayer(input,options);inputs.push(input);refs[partId]=saved.ref
      assert.deepEqual(await storeReceivedTrackVoiceLayer(input,options),saved)
      assert.deepEqual(await session.run(({service})=>service.getTrackVoiceLayer(project,partId,saved.ref)),saved)
      for(const [kind,ref] of [['personal-image',personalRefs[n]],['track-image',saved.ref]]){
        const retrieved=await loadRemoteOwnedVoiceImage({session,kind,ref,projectId:project,partId,maxBytes:8388608})
        assert.equal(hash(Buffer.from(await retrieved.blob.arrayBuffer())),hash(png))
        await assert.rejects(loadRemoteOwnedVoiceImage({session,kind,ref,projectId:project,partId,maxBytes:33}))
        await assert.rejects(loadRemoteOwnedVoiceImage({session,kind,ref:{...ref,outputSha256:'f'.repeat(64)},projectId:project,partId,maxBytes:8388608}))
      }
      assert.equal(json(saved).includes(caller),false)
      await assert.rejects(storeReceivedTrackVoiceLayer({...input,userId:users[4]},options),e=>e.code==='VOICE_LAYER_FORBIDDEN')
      await assert.rejects(storeReceivedTrackVoiceLayer({...input,personalRef:personalRefs[(n+1)%4]},options))
      await assert.rejects(storeReceivedTrackVoiceLayer({...input,result:{...result,artifact:{...result.artifact,inferenceSeed:n+10}}},options),e=>e.code==='VOICE_LAYER_CONFLICT')
      session.disconnect()
    }
    const full=await persistRemoteProjectVoiceRecordInput({projectId:project,layerRefs:refs,generatorVersion:'record-v1'},options)
    assert.equal(full.input.submittedCount,count);assert.equal(full.input.allRequiredTracksSubmitted,true);assert.equal(full.input.allSubmittedLayersReady,true)
    assert.deepEqual(await persistRemoteProjectVoiceRecordInput({projectId:project,layerRefs:refs,generatorVersion:'record-v1'},options),full)
    const publishedRefs=Object.fromEntries(full.input.layers.map(entry=>[entry.partId,entry.layerRef]))
    assert.deepEqual(await persistRemoteProjectVoiceRecordInput({projectId:project,layerRefs:publishedRefs,generatorVersion:'record-v1'},options),full,'Existing four-field Project layer references remain reusable')
    assert.notEqual(full.inputDigest,pending.inputDigest)
    await assert.rejects(persistRemoteProjectVoiceRecordInput({projectId:project,layerRefs:{...refs,'part-0':refs['part-1']},generatorVersion:'record-v1'},options))
    await assert.rejects(persistRemoteProjectVoiceRecordInput({projectId:project,layerRefs:{...refs,extra:refs['part-0']},generatorVersion:'record-v1'},options))
    caller=users[0];const session=await connect()
    assert.deepEqual(await session.run(({service})=>service.getProjectVoiceRecord(full)),full)
    assert.deepEqual(await session.run(({service})=>service.getProjectVoiceRecord(partial)),partial,'New submissions/layers never overwrite a historical snapshot')
    for(const record of [full,partial])assert.deepEqual(await loadRemoteProjectRecordInput({session,
      ref:{projectId:project,inputDigest:record.inputDigest},projectSeed:seed,partIds:record.input.partIds,generatorVersion:'record-v1'}),
      {ref:{projectId:project,inputDigest:record.inputDigest},input:record.input})
    caller=users[4]
    const recordRequest=new Request(`https://ieum.example/api/me/voice-record?projectId=${project}&inputDigest=${full.inputDigest}`,{headers:{Authorization:'Bearer qa-token'}})
    await assert.rejects(projectVoiceRecordInputRequest(recordRequest,options),e=>e.code==='VOICE_LAYER_NOT_FOUND')
    const layerRequest=new Request(`https://ieum.example/api/me/voice-layer?projectId=${project}&partId=part-0&id=layer-0&revision=r1`,{headers:{Authorization:'Bearer qa-token'}})
    await assert.rejects(trackVoiceLayerRequest(layerRequest,options),e=>e.code==='VOICE_LAYER_NOT_FOUND')
    const protectedApi=new Request(`https://ieum.example/api/me/voice-identity?kind=project-record&projectId=${project}&inputDigest=${full.inputDigest}`,{headers:{Authorization:'Bearer qa-token'}})
    assert.equal((await voiceIdentityRouteRequest(protectedApi,options)).status,404)
    for(const kind of ['personal-image','track-image']){
      const query=new URLSearchParams({kind,id:kind==='personal-image'?personalRefs[0].id:'layer-0',revision:'r1',offset:'0',length:'262144',
        ...(kind==='track-image'?{projectId:project,partId:'part-0'}:{})})
      assert.equal((await voiceIdentityRouteRequest(new Request(`https://ieum.example/api/me/voice-identity?${query}`,{headers:{Authorization:'Bearer qa-token'}}),options)).status,404)
    }
    caller=users[0];storageMode='tamper'
    await assert.rejects(storeReceivedTrackVoiceLayer(inputs[0],options),e=>e.code==='UPLOAD_OBJECT_MISMATCH');storageMode='normal'
    disconnectOnRead=true;await assert.rejects(session.run(({service})=>service.getProjectVoiceRecord(full)),e=>e.code==='SESSION_CHANGED');disconnectOnRead=false
    assert.deepEqual(await snapshot(project),before,'Graphic persistence/failure cannot change Seed, submissions, uploaded originals, or queued Mix')
    assert.equal(before.mix.status,'queued','All graphics ready is not actual Auto Mix success')
  }
  for(const table of ['ieum_track_voice_layers','ieum_project_voice_record_inputs']){
    for(const name of ['anon','authenticated','service_role']){await role(name,users[0]);await assert.rejects(db.exec(`select * from public.${table}`),e=>e.code==='42501')}
    await db.exec('reset role');await assert.rejects(db.exec(`delete from public.${table}`),e=>e.code==='PT409')
  }
  await db.exec('reset role')
  const stored=(await db.query("select png,result_data->'imageReceipt' as receipt from public.ieum_track_voice_layers")).rows
  assert.equal(stored.length,9);for(const row of stored){assert.equal(hash(row.png),hash(png));assert.equal(row.receipt.sha256,hash(png));assert.equal(row.receipt.decodedBytes,1048576)}
  await assert.rejects(trackVoiceLayerRequest(new Request('https://ieum.example/api/me/voice-layer'),options),e=>e.code==='AUTH_REQUIRED')
  assert.equal((await trackVoiceLayerErrorResponse(new Error('private token')).text()).includes('private token'),false)
  console.log('PASS real existing audio/PNG decoder→Profile/Track analyses→isolated SQL registration/submission→stored personal traits→received layer→2/3/4 Part historical Record inputs→authenticated session reads; explicit revisions, conflict/CAS/owner/tamper/logout, original and queued Mix preservation. Decoded test PNG, not actual AI/art approval, remote users or natural visual blending.')
}catch(error){console.error(JSON.stringify({code:error.code,message:error.message,position:error.position,stack:error.stack?.split('\n').slice(0,4)}));process.exitCode=1}
finally{activeSession?.disconnect();await db.close()}
