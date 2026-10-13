import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {storeReceivedPersonalIdentity,personalIdentityRequest,personalIdentityErrorResponse} from '../server/personalIdentityResults.js'
import {buildIdentityInputManifest,canonicalIdentityInput,assessVoiceCandidates} from '../src/voiceIdentityContract.js'
import {analyzeAudioBuffer} from '../src/voiceAnalysis.js'
import {createServiceSession} from '../src/serviceSession.js'
import {loadRemoteSubmittedTrackIdentityInput,loadRemoteMeasuredProfileIdentityInput,loadRemoteSubmittedVoiceControls} from '../src/voiceIdentitySources.js'
import {voiceSourceRevision} from '../src/profileSource.js'
import {voiceSourceRegistrationRequest} from '../server/voiceSourceRegistration.js'
assert.ok(process.env.IEUM_PGLITE_ROOT,'Existing isolated SQL runtime required; no remote migration/install/model')
const require=createRequire(join(process.env.IEUM_PGLITE_ROOT,'package.json')),{PGlite}=require('@electric-sql/pglite'),db=new PGlite()
const users=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222']
const env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public',IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa'}
const hash=value=>createHash('sha256').update(value).digest('hex')
let caller=users[0],lookupCalls=0,analysisCalls=0,tamper=null,disconnectOnLookup=false,session
const role=async(name,user)=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||'']);await db.exec(`set role ${name}`)}
const fetchImpl=async(url,init)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:caller})
  const body=JSON.parse(init.body)
  try{
    if(url.endsWith('/ieum_store_personal_identity_result')){
      assert.equal(init.headers.apikey,env.IEUM_SUPABASE_SECRET_KEY);assert.equal(init.headers.Authorization,undefined)
      await role('service_role')
      return Response.json((await db.query('select public.ieum_store_personal_identity_result($1,$2,$3,$4) as result',
        [body.p_user_id,body.p_profile_revision,JSON.stringify(body.p_result),body.p_png])).rows[0].result)
    }
    assert.ok(url.endsWith('/ieum_get_owned_personal_identity_result') || url.endsWith('/ieum_get_owned_personal_identity_traits') || url.endsWith('/ieum_get_voice_source'))
    assert.equal(init.headers.apikey,'qa-public');assert.equal(init.headers.Authorization,'Bearer qa-token')
    await role('authenticated',caller)
    if(url.endsWith('/ieum_get_voice_source'))return Response.json((await db.query('select public.ieum_get_voice_source() as result')).rows[0].result)
    const functionName=url.endsWith('/ieum_get_owned_personal_identity_traits')?'ieum_get_owned_personal_identity_traits':'ieum_get_owned_personal_identity_result'
    return Response.json((await db.query(`select public.${functionName}($1,$2) as result`,[body.p_id,body.p_revision])).rows[0].result)
  }catch(error){return Response.json({message:'private DB diagnostic'},{status:Number(error.code?.slice(2))||500})}
}
try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`)
  for(const user of users)await db.query('insert into auth.users values($1)',[user])
  for(const name of ['voice_profiles','project_tracks','project_participation','profile_source_history','profile_sample_uploads','profile_sample_receipts','profile_sample_analysis','profile_source_registration','personal_identity_results','personal_identity_source_binding','personal_identity_traits'])
    await db.exec(await readFile(new URL(`../server/migrations/20261013_${name}.sql`,import.meta.url),'utf8'))
  const pcm=Float32Array.from({length:48000},(_,i)=>.1*Math.sin(2*Math.PI*220*i/48000))
  const features=analyzeAudioBuffer({sampleRate:48000,duration:1,getChannelData:()=>pcm})
  const range={analysisVersion:'normalized-difference-v1',lowMidi:48,highMidi:67,sampleCount:10,confidence:.8}
  const rangeProvenance={version:'ieum-profile-source-v1',purpose:'voice-range',revision:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    analysisVersion:range.analysisVersion,measurementSha256:hash(canonicalIdentityInput(range))}
  const sampleProvenance={version:'ieum-profile-source-v1',purpose:'voice-sample',revision:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    analysisVersion:features.version,audioSha256:'b'.repeat(64),byteLength:100}
  const revision=await voiceSourceRevision(rangeProvenance,sampleProvenance)
  await role('authenticated',caller)
  const upload=(await db.query('select public.ieum_prepare_profile_sample_upload($1,$2,$3,$4) as result',['sample-fixture',100,sampleProvenance.audioSha256,'audio/wav'])).rows[0].result
  await db.exec('reset role')
  // Controlled upstream decoded/analysis fixture; registration and subsequent
  // source consumption use the real SQL RPCs, not a fabricated GET response.
  await db.query('update public.ieum_profile_sample_upload_intents set audio_receipt=$1,verified_at=now(),voice_analysis=$2 where id=$3',
    [JSON.stringify({duration:1}),JSON.stringify({version:'ieum-sample-analysis-v1',features,featuresSha256:hash(canonicalIdentityInput(features))}),upload.uploadIntentId])
  await role('service_role')
  await db.query('select public.ieum_register_profile_source($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [caller,upload.uploadIntentId,JSON.stringify(range),JSON.stringify(rangeProvenance),JSON.stringify(sampleProvenance),revision,null,'register-fixture','c'.repeat(64)])
  const profileSession=createServiceSession({baseUrl:'https://ieum.example/api',fetchImpl:async(url,init)=>{
    if(url.endsWith('/capabilities'))return Response.json({contractVersion:'ieum-service-v1',mode:'remote',authenticated:true,sharedProjects:true})
    if(url.endsWith('/me/session'))return Response.json({authenticated:true,user:{id:caller}})
    assert.ok(url.endsWith('/me/voice-source'))
    return voiceSourceRegistrationRequest(new Request(url,init),{env,fetchImpl})
  }})
  await profileSession.connect('qa-token')
  const manifest=await loadRemoteMeasuredProfileIdentityInput({session:profileSession,generatorVersion:'fixture-generator'})
  assert.deepEqual(await loadRemoteMeasuredProfileIdentityInput({session:profileSession,generatorVersion:'fixture-generator'}),manifest)
  assert.equal(manifest.profileRevision,revision)
  // Minimal contract fixture, not a decoded PNG or actual generated graphic.
  const bytes=Buffer.alloc(24);Buffer.from('89504e470d0a1a0a','hex').copy(bytes);bytes.writeUInt32BE(512,16);bytes.writeUInt32BE(512,20)
  const artifact={id:'opaque-result',revision:'r1',inputDigest:manifest.inputDigest,generatorVersion:manifest.generatorVersion,
    model:'fixture',modelRevision:'c'.repeat(40),inferenceSeed:'1',outputSha256:hash(bytes),blob:new Blob([bytes],{type:'image/png'})}
  const options={env,fetchImpl},input={manifest,artifact}
  const saved=await storeReceivedPersonalIdentity(input,options)
  assert.deepEqual(await storeReceivedPersonalIdentity(input,options),saved)
  const request=(id=artifact.id,revision='r1')=>new Request(`https://ieum.example/api/me/voice-identity?id=${id}&revision=${revision}`,{headers:{Authorization:'Bearer qa-token'}})
  const response=await personalIdentityRequest(request(),options)
  assert.equal(response.headers.get('cache-control'),'private, no-store')
  assert.deepEqual(await response.json(),saved)
  assert.equal(JSON.stringify(saved).includes(caller),false)
  assert.deepEqual(Object.keys(saved.ref).sort(),['generatorVersion','id','inputDigest','outputSha256','revision'])
  const traitsRequest=()=>new Request(request().url+'&include=traits',{headers:{Authorization:'Bearer qa-token'}})
  const traitResult=await personalIdentityRequest(traitsRequest(),options).then(r=>r.json())
  assert.equal(traitResult.traits.personalInputDigest,manifest.inputDigest)
  assert.equal(JSON.stringify(traitResult).includes(caller),false)
  caller=users[1];await assert.rejects(personalIdentityRequest(traitsRequest(),options),e=>e.code==='IDENTITY_RESULT_NOT_FOUND');caller=users[0]
  await assert.rejects(personalIdentityRequest(new Request(request().url+'&include=manifest',{headers:{Authorization:'Bearer qa-token'}}),options),e=>e.code==='INVALID_IDENTITY_RESULT')
  caller=users[1];await assert.rejects(personalIdentityRequest(request(),options),e=>e.code==='IDENTITY_RESULT_NOT_FOUND');caller=users[0]
  await assert.rejects(personalIdentityRequest(request('missing'),options),e=>e.code==='IDENTITY_RESULT_NOT_FOUND')
  await assert.rejects(personalIdentityRequest(new Request('https://ieum.example/api/me/voice-identity'),options),e=>e.code==='AUTH_REQUIRED')
  await assert.rejects(personalIdentityRequest(new Request(request().url,{method:'POST',headers:{Authorization:'Bearer qa-token'}}),options),e=>e.code==='METHOD_NOT_ALLOWED')
  await assert.rejects(personalIdentityRequest(new Request(request().url+'&userId='+users[1],{headers:{Authorization:'Bearer qa-token'}}),options),e=>e.code==='INVALID_IDENTITY_RESULT')
  const changed={...artifact,inferenceSeed:'2'}
  await assert.rejects(storeReceivedPersonalIdentity({manifest,artifact:changed},options),e=>e.code==='IDENTITY_REVISION_CONFLICT')
  const concurrent=await Promise.allSettled([storeReceivedPersonalIdentity(input,options),storeReceivedPersonalIdentity({manifest,artifact:changed},options)])
  assert.equal(concurrent.filter(x=>x.status==='fulfilled').length,1)
  const wrong=await buildIdentityInputManifest({...manifest,sources:manifest.sources.map(source=>({...source,sha256:'d'.repeat(64)}))})
  await assert.rejects(storeReceivedPersonalIdentity({manifest:wrong,artifact:{...artifact,revision:'wrong',inputDigest:wrong.inputDigest}},options),e=>e.code==='IDENTITY_REVISION_CONFLICT')
  const differentRange=await buildIdentityInputManifest({...manifest,sources:manifest.sources.map(source=>source.purpose==='voice-range'?{...source,data:{lowMidi:40,highMidi:75}}:source)})
  await assert.rejects(storeReceivedPersonalIdentity({manifest:differentRange,artifact:{...artifact,revision:'changed-range',inputDigest:differentRange.inputDigest}},options),e=>e.code==='IDENTITY_REVISION_CONFLICT')
  const fabricatedFeatures=await buildIdentityInputManifest({...manifest,sources:manifest.sources.map(source=>source.purpose==='voice-sample'?{...source,data:{...source.data,brightness:.99}}:source)})
  await assert.rejects(storeReceivedPersonalIdentity({manifest:fabricatedFeatures,artifact:{...artifact,revision:'fabricated-features',inputDigest:fabricatedFeatures.inputDigest}},options),e=>e.code==='IDENTITY_REVISION_CONFLICT')
  const wrongSample=await buildIdentityInputManifest({...manifest,sources:manifest.sources.map(source=>source.purpose==='voice-sample'?{...source,recordId:'other-sample'}:source)})
  await assert.rejects(storeReceivedPersonalIdentity({manifest:wrongSample,artifact:{...artifact,revision:'wrong-sample',inputDigest:wrongSample.inputDigest}},options),e=>e.code==='IDENTITY_REVISION_CONFLICT')
  await role('service_role')
  await assert.rejects(db.exec('select * from public.ieum_personal_identity_results'),e=>e.code==='42501')
  for(const name of ['authenticated','anon']){
    await role(name,caller)
    await assert.rejects(db.query('select public.ieum_store_personal_identity_result($1,$2,$3,$4)',[caller,'source-r1','{}','AA==']),e=>e.code==='42501')
    await assert.rejects(db.exec('select * from public.ieum_personal_identity_results'),e=>e.code==='42501')
  }
  await role('authenticated',caller);await db.query("select public.ieum_patch_profile_preferences($1,$2)",['{"roles":[]}',0])
  await role('service_role')
  await db.query("update public.ieum_profile_voice_sources set source_revision='source-r2' where user_id=$1",[caller])
  assert.deepEqual(await personalIdentityRequest(request(),options).then(r=>r.json()),saved,'Old explicit results survive source/ preference changes without auto selection')
  await db.exec('reset role')
  await assert.rejects(db.exec("delete from public.ieum_personal_identity_results"),e=>e.code==='PT409')
  const storedBytes=(await db.query('select png from public.ieum_personal_identity_results')).rows[0].png
  assert.equal(hash(storedBytes),artifact.outputSha256)
  for(const table of ['ieum_projects','ieum_submitted_tracks','ieum_mix_jobs'])assert.equal((await db.query(`select count(*)::int as n from public.${table}`)).rows[0].n,0)
  // Actual existing client/session and owner RPC, with controlled Track analysis.
  const analysis={version:'ieum-track-analysis-v1',sourceSha256:'e'.repeat(64),byteLength:100,
    audioReceipt:{sha256:'e'.repeat(64),size:100,contentType:'audio/wav',decodedFrames:48000,sampleRate:48000,duration:1,
      analysisVersion:'decoded-pcm-v1',decoderVersion:'ffmpeg version fixture',decoderSha256:'f'.repeat(64)},
    features,featuresSha256:hash(canonicalIdentityInput(features)),assessment:assessVoiceCandidates(features,'project-track')}
  session=createServiceSession({baseUrl:'https://ieum.example/api',fetchImpl:async(url,init)=>{
    if(url.endsWith('/capabilities'))return Response.json({contractVersion:'ieum-service-v1',mode:'remote',authenticated:true,sharedProjects:true})
    if(url.endsWith('/me/session'))return Response.json({authenticated:true,user:{id:caller}})
    if(url.includes('/me/voice-identity?')){
      lookupCalls++
      try{const response=await personalIdentityRequest(new Request(url,init),options),data=await response.json();tamper?.(data);if(disconnectOnLookup)session.disconnect();return Response.json(data)}catch(e){return personalIdentityErrorResponse(e)}
    }
    analysisCalls++;return Response.json({trackId:'project:part',analysisStatus:'verified',analysis})
  }})
  await session.connect('qa-token')
  const trackInput={session,projectId:'project',partId:'part',identityOwnerId:caller,identityRef:saved.ref,generatorVersion:'fixture-flow'}
  const first=await loadRemoteSubmittedTrackIdentityInput(trackInput)
  assert.deepEqual(await loadRemoteSubmittedTrackIdentityInput(trackInput),first)
  const linked=await loadRemoteSubmittedVoiceControls(trackInput)
  assert.deepEqual(await loadRemoteSubmittedVoiceControls(trackInput),linked)
  const boundOptions={...trackInput,identityRef:structuredClone(trackInput.identityRef)}
  const pendingControls=loadRemoteSubmittedVoiceControls(boundOptions)
  boundOptions.partId='other-part';boundOptions.generatorVersion='changed-version';boundOptions.identityRef.outputSha256='0'.repeat(64)
  assert.deepEqual(await pendingControls,linked,'Async lookup preserves the original Project/Part/version/result reference')
  assert.equal(linked.controls.inputs.identity.traitDigest,linked.controls.inputs.resonance.traitDigest)
  assert.equal(linked.controls.inputs.identity.representation,'personal-form-input')
  assert.equal(linked.controls.inputs.resonance.representation,'vinyl-flow-input')
  assert.equal(linked.controls.inputs.identity.track,undefined)
  assert.equal(linked.controls.inputs.resonance.track.trackId,first.trackId)
  assert.deepEqual(linked.controls.inputs.resonance.track.assessment,analysis.assessment)
  assert.equal(JSON.stringify(linked.controls).includes(caller),false)
  const beforeTraitCalls=analysisCalls
  tamper=data=>{if(data.traits)data.traits.assessment.candidates.brightness.value=.99}
  await assert.rejects(loadRemoteSubmittedVoiceControls(trackInput));assert.equal(analysisCalls,beforeTraitCalls,'Tampered personal traits are refused before Track analysis')
  tamper=null
  const beforeCalls=analysisCalls
  await assert.rejects(loadRemoteSubmittedTrackIdentityInput({...trackInput,identityRef:{...saved.ref,id:'missing'}}))
  assert.equal(analysisCalls,beforeCalls,'Missing/foreign result is refused before Track analysis')
  tamper=data=>{data.ref.outputSha256='0'.repeat(64)}
  await assert.rejects(loadRemoteSubmittedTrackIdentityInput(trackInput),/ownership/);assert.equal(analysisCalls,beforeCalls)
  tamper=null;disconnectOnLookup=true
  await assert.rejects(loadRemoteSubmittedTrackIdentityInput(trackInput),e=>e.code==='SESSION_CHANGED')
  assert.ok(lookupCalls>=4)
  const error=personalIdentityErrorResponse(new Error('private token')).clone();assert.equal((await error.text()).includes('private token'),false)
  console.log('PASS real isolated SQL Profile registration→authenticated source→personal manifest→immutable received result→owned ref→Track input; exact stored Sample features/id binding, ownership, source history and state preservation. Controlled upstream audio/Auth/HTTP/PNG fixtures, not AI generation, PNG decode, remote service or visual acceptance.')
}finally{await db.close()}
