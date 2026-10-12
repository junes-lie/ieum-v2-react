import assert from 'node:assert/strict'
import { projectLifecycleRequest,projectLifecycleErrorResponse } from '../server/projectLifecycle.js'
import { GET } from '../api/project-lifecycle.js'
const env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public'}
const user='11111111-1111-4111-8111-111111111111', intent='33333333-3333-4333-8333-333333333333'
const project={id:'p',seed:'stable',songId:'song',key:'original',partCount:2,submittedTrackCount:0,revision:0,lifecycle:'recruiting',keyLockedAt:null,
  audioSourceRef:{songId:'song',key:'original',revision:'v1',duration:20,sourceSha256:'a'.repeat(64),backingSha256:'b'.repeat(64)},
  parts:[{id:'lead',participantId:user,requiredRange:{lowMidi:48,highMidi:67},status:'ready',trackId:null},
    {id:'harmony',participantId:null,requiredRange:{lowMidi:48,highMidi:67},status:'open',trackId:null}]}
let result=structuredClone(project), calls=[]
const fetchImpl=async(url,init)=>{
  assert.equal(init.headers.Authorization,'Bearer qa-token');assert.equal(init.headers.apikey,'qa-public')
  assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error')
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  assert.equal(init.referrerPolicy,'no-referrer')
  calls.push({url,body:JSON.parse(init.body)})
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
console.log('PASS shared Project API: verified user, route/rewrite mapping, recording start, idempotent metadata submission contract, no forged receipts/user IDs, bounded JSON, conflict/failure privacy, inconsistent response denial. Injected HTTP; no live collaboration claim.')
