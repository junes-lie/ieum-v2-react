import assert from 'node:assert/strict'
import { projectLifecycleRequest,projectLifecycleErrorResponse } from '../server/projectLifecycle.js'
import { GET } from '../api/project-lifecycle.js'
import { createHash } from 'node:crypto'
const env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public',
  IEUM_STORAGE_PROVIDER:'supabase',IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa_only',IEUM_AUDIO_BUCKET:'private-audio'}
const user='11111111-1111-4111-8111-111111111111', intent='33333333-3333-4333-8333-333333333333'
const original=new Uint8Array([1,2,3,4]),originalSha=createHash('sha256').update(original).digest('hex')
const project={id:'p',seed:'stable',songId:'song',key:'original',partCount:2,submittedTrackCount:0,revision:0,lifecycle:'recruiting',keyLockedAt:null,
  audioSourceRef:{songId:'song',key:'original',revision:'v1',duration:20,sourceSha256:'a'.repeat(64),backingSha256:'b'.repeat(64)},
  parts:[{id:'lead',participantId:user,requiredRange:{lowMidi:48,highMidi:67},status:'ready',trackId:null},
    {id:'harmony',participantId:null,requiredRange:{lowMidi:48,highMidi:67},status:'open',trackId:null}]}
let result=structuredClone(project), calls=[]
const fetchImpl=async(url,init)=>{
  if(url.includes('/storage/v1/')){
    assert.equal(init.headers.apikey,'sb_secret_qa_only');assert.equal(init.headers.Authorization,undefined)
    if(url.includes('/object/sign/'))return Response.json({signedURL:'/object/sign/private-audio/originals/22222222-2222-4222-8222-222222222222?token=qa-read'})
    return url.includes('/bucket/')?Response.json({id:'private-audio',public:false}):new Response(original,{headers:{'Content-Type':'audio/wav'}})
  }
  assert.equal(init.headers.Authorization,'Bearer qa-token');assert.equal(init.headers.apikey,'qa-public')
  assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error')
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  assert.equal(init.referrerPolicy,'no-referrer')
  calls.push({url,body:JSON.parse(init.body)})
  if(url.endsWith('/ieum_get_owned_upload'))return Response.json({projectId:'p',partId:'lead',userId:user,uploadIntentId:intent,
    objectId:'22222222-2222-4222-8222-222222222222',size:4,sha256:originalSha,contentType:'audio/wav',
    receipt:{size:4,sha256:originalSha,contentType:'audio/wav',duration:20,decodedFrames:960000,sampleRate:48000,
      analysisVersion:'decoded-pcm-v1',decoderVersion:'ffmpeg version qa-fixture',decoderSha256:'d'.repeat(64)}})
  return result instanceof Response?result.clone():Response.json(result)
}
const options={env,fetchImpl}
const req=(path='p',value,headers={})=>new Request(`https://ieum.example/api/projects/${path}`,{
  method:value===undefined?'GET':'POST',headers:{Authorization:'Bearer qa-token','Content-Type':'application/json',...headers},
  ...(value===undefined?{}:{body:JSON.stringify(value)})})
assert.deepEqual(await(await projectLifecycleRequest(req(),options)).json(),project)
assert.deepEqual(calls.at(-1).body,{p_project_id:'p'})
result={...project,keyLockedAt:'2026-10-13T00:00:00Z',revision:1,secret:'not-returned'}
const start=await projectLifecycleRequest(req('p/parts/lead/recording-start',{}),options)
assert.equal((await start.json()).secret,undefined)
assert.ok(calls.at(-1).url.endsWith('/ieum_start_project_recording'))
const take={uploadIntentId:intent,duration:20,syncOffsetMs:0,features:{version:'client-analysis'},projectSeed:'stable'}
result={trackId:'p:lead',submissionStatus:'success',project:{...result,submittedTrackCount:1,
  parts:[{...project.parts[0],status:'submitted',trackId:'p:lead'},project.parts[1]]}}
const submitted=await projectLifecycleRequest(req('p/parts/lead/tracks',take,{'Idempotency-Key':'request-1'}),options)
assert.equal((await submitted.json()).submissionStatus,'success')
assert.equal(submitted.headers.get('cache-control'),'private, no-store')
assert.deepEqual(calls.at(-1).body,{p_project_id:'p',p_part_id:'lead',p_upload_intent_id:intent,p_request_key:'request-1',p_duration:20,
  p_sync_offset_ms:0,p_features:{version:'client-analysis'},p_project_seed:'stable'})
const submittedProject=result.project
const readTrack={id:'p:lead',projectId:'p',partId:'lead',participantId:user,duration:20,syncOffsetMs:0,audioSourceRef:project.audioSourceRef,
  submittedAt:'2026-10-13T00:00:00Z',objectId:'22222222-2222-4222-8222-222222222222',size:4,sha256:originalSha,contentType:'audio/wav'}
result={project:submittedProject,tracks:[readTrack]}
const manifest=await projectLifecycleRequest(req('p/tracks'),options),read=await manifest.json()
assert.equal(read.tracks.length,1);assert.equal(read.tracks[0].objectId,undefined);assert.equal(read.tracks[0].submitted,true)
assert.ok(read.tracks[0].audioUrl.includes('/object/sign/'));assert.equal(manifest.headers.get('cache-control'),'private, no-store')
assert.ok(calls.at(-1).url.endsWith('/ieum_list_project_tracks'))
result={project:submittedProject,tracks:[{...readTrack,audioSourceRef:{...project.audioSourceRef,key:'wrong'}}]}
await assert.rejects(projectLifecycleRequest(req('p/tracks'),options),e=>e.code==='INVALID_PROJECT_RESPONSE')
result={trackId:'p:lead',submissionStatus:'success',project:submittedProject}
for(const value of [{...take,userId:user},{...take,verified:true},{...take,duration:0},{...take,syncOffsetMs:20000},{...take,features:[]}]) {
  const count=calls.length
  await assert.rejects(projectLifecycleRequest(req('p/parts/lead/tracks',value,{'Idempotency-Key':'request-1'}),options),error=>error.code==='INVALID_PROJECT_REQUEST')
  assert.equal(calls.length,count)
}
await assert.rejects(projectLifecycleRequest(req('p/parts/lead/tracks',take),options),error=>error.code==='IDEMPOTENCY_KEY_REQUIRED')
await assert.rejects(projectLifecycleRequest(req('p/parts/lead/recording-start',{userId:user}),options),error=>error.code==='INVALID_PROJECT_REQUEST')
await assert.rejects(projectLifecycleRequest(req('p/parts/lead/tracks',{...take,features:{payload:'x'.repeat(65536)}},{'Idempotency-Key':'r'}),options),error=>error.code==='PROJECT_PAYLOAD_TOO_LARGE')
for(const [status,code] of [[403,'PART_NOT_ASSIGNED'],[404,'PROJECT_NOT_FOUND'],[409,'PROJECT_CONFLICT'],[500,'PROJECT_UNAVAILABLE']]) {
  result=new Response('private upstream detail',{status})
  const response=await projectLifecycleRequest(req(),options).catch(projectLifecycleErrorResponse)
  assert.equal(response.status,status===500?503:status)
  assert.deepEqual(await response.json(),{error:{code}})
}
result={...project,submittedTrackCount:2,lifecycle:'completed'}
await assert.rejects(projectLifecycleRequest(req(),options),error=>error.code==='INVALID_PROJECT_RESPONSE')
result=structuredClone(project)
const rewritten=new Request('https://ieum.example/api/project-lifecycle?route=p',{headers:{Authorization:'Bearer qa-token'}})
assert.deepEqual(await(await projectLifecycleRequest(rewritten,options)).json(),project)
await assert.rejects(projectLifecycleRequest(new Request('https://ieum.example/api/project-lifecycle?route=p&route=other',{headers:{Authorization:'Bearer qa-token'}}),options),error=>error.code==='PROJECT_ROUTE_NOT_FOUND')
await assert.rejects(projectLifecycleRequest(req('p/parts/lead/unknown'),options),error=>error.code==='PROJECT_ROUTE_NOT_FOUND')
await assert.rejects(projectLifecycleRequest(req(),{...options,env:{...env,IEUM_DB_PROVIDER:''}}),error=>error.code==='SERVICE_NOT_CONFIGURED')
assert.equal((await GET(new Request('https://ieum.example/api/projects/p'))).status,401)
const createdId='44444444-4444-4444-8444-444444444444'
result={...structuredClone(project),id:createdId}
const createRequest=value=>new Request('https://ieum.example/api/projects',{
  method:'POST',headers:{Authorization:'Bearer qa-token','Content-Type':'application/json','Idempotency-Key':'create-1'},body:JSON.stringify(value)})
assert.equal((await(await projectLifecycleRequest(createRequest({arrangementId:'verified-arrangement',ownerPartId:'lead'}),options)).json()).id,createdId)
assert.deepEqual(calls.at(-1).body,{p_arrangement_id:'verified-arrangement',p_owner_part_id:'lead',p_request_key:'create-1'})
assert.ok(calls.at(-1).url.endsWith('/ieum_create_project'))
for(const value of [{arrangementId:'a',ownerPartId:'lead',userId:user},{arrangementId:'a',ownerPartId:'lead',parts:[]},
  {arrangementId:'a',ownerPartId:'lead',rangeData:{lowMidi:0,highMidi:127}},{}]) {
  const count=calls.length
  await assert.rejects(projectLifecycleRequest(createRequest(value),options),error=>error.code==='INVALID_PROJECT_REQUEST')
  assert.equal(calls.length,count)
}
const rewrittenCreate=new Request('https://ieum.example/api/project-lifecycle?route=',{
  method:'POST',headers:{Authorization:'Bearer qa-token','Content-Type':'application/json','Idempotency-Key':'create-1'},
  body:JSON.stringify({arrangementId:'verified-arrangement',ownerPartId:'lead'})})
assert.equal((await(await projectLifecycleRequest(rewrittenCreate,options)).json()).id,createdId)
result=structuredClone(project)
const joined=await projectLifecycleRequest(req('p/parts/lead/join',{}, {'Idempotency-Key':'join-1'}),options)
assert.equal((await joined.json()).parts[0].participantId,user)
assert.deepEqual(calls.at(-1).body,{p_project_id:'p',p_part_id:'lead',p_request_key:'join-1'})
await assert.rejects(projectLifecycleRequest(req('p/parts/lead/join',{eligible:true},{'Idempotency-Key':'join-1'}),options),error=>error.code==='INVALID_PROJECT_REQUEST')
for(const [message,status] of [['PROFILE_REQUIRED',403],['PART_FIT_FAILED',403],['PART_RANGE_UNAVAILABLE',409],['ARRANGEMENT_NOT_FOUND',404]]) {
  result=Response.json({message},{status})
  const error=await projectLifecycleRequest(req('p/parts/lead/join',{}, {'Idempotency-Key':'join-1'}),options).catch(projectLifecycleErrorResponse)
  assert.equal(error.status,status);assert.deepEqual(await error.json(),{error:{code:message}})
}
result=null
await assert.rejects(projectLifecycleRequest(createRequest({arrangementId:'a',ownerPartId:'lead'}),options),error=>error.code==='INVALID_PROJECT_RESPONSE')
console.log('PASS shared Project API: verified user, route/rewrite mapping, recording start, idempotent metadata submission contract, no forged receipts/user IDs, bounded JSON, conflict/failure privacy, inconsistent response denial. Injected HTTP; no live collaboration claim.')
