import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { projectLifecycleRequest,projectLifecycleErrorResponse } from '../server/projectLifecycle.js'
const user='11111111-1111-4111-8111-111111111111',object='22222222-2222-4222-8222-222222222222',intent='33333333-3333-4333-8333-333333333333'
const bytes=new Uint8Array([1,2,3,4]),sha=createHash('sha256').update(bytes).digest('hex')
const env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_STORAGE_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public',IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa_only',IEUM_AUDIO_BUCKET:'private-audio'}
let present=false,mismatch=false,submissionVerified=false,calls=[]
const fetchImpl=async(url,init)=>{
  calls.push({url,init})
  assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit')
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  if(url.includes('/rest/v1/rpc/')) {
    assert.equal(init.headers.Authorization,'Bearer qa-token');assert.equal(init.headers.apikey,'qa-public')
    assert.ok(url.endsWith('/ieum_prepare_track_upload'))
    assert.deepEqual(JSON.parse(init.body),{p_project_id:'p',p_part_id:'lead',p_request_key:'upload-1',p_size:4,p_sha256:sha,p_content_type:'audio/webm'})
    return Response.json({uploadIntentId:intent,objectId:object,size:4,sha256:sha,contentType:'audio/webm',submissionVerified})
  }
  assert.equal(init.headers.apikey,'sb_secret_qa_only');assert.equal(init.headers.Authorization,undefined)
  if(url.endsWith('/bucket/private-audio'))return Response.json({id:'private-audio',public:false})
  if(url.includes('/object/upload/sign/')) {
    assert.equal(init.headers['x-upsert'],'false')
    return Response.json({url:`/object/upload/sign/private-audio/originals/${object}?token=qa-signed`})
  }
  if(!present)return new Response('not found',{status:404})
  return new Response(mismatch?new Uint8Array([9,2,3,4]):bytes,{headers:{'Content-Type':'audio/webm','Content-Length':'4'}})
}
const options={env,fetchImpl}
const req=(extra={})=>new Request('https://ieum.example/api/projects/p/parts/lead/upload-intents',{
  method:'POST',headers:{Authorization:'Bearer qa-token','Content-Type':'application/json','Idempotency-Key':'upload-1'},
  body:JSON.stringify({size:4,sha256:sha.toUpperCase(),contentType:'audio/webm;codecs=opus',...extra})})
let response=await projectLifecycleRequest(req(),options),result=await response.json()
assert.equal(result.uploadStatus,'pending');assert.equal(result.uploadIntentId,intent);assert.equal(result.submissionVerification,'pending')
assert.ok(result.signedUploadUrl.includes(object));assert.equal(result.objectId,undefined)
assert.ok(calls.findIndex(call=>call.url.includes('/rest/'))<calls.findIndex(call=>call.url.includes('/object/upload/sign/')))
assert.equal(response.headers.get('cache-control'),'private, no-store')
present=true;calls=[]
result=await(await projectLifecycleRequest(req(),options)).json()
assert.equal(result.uploadStatus,'verified');assert.equal(result.submissionVerification,'pending')
assert.deepEqual(result.verifiedFile,{size:4,sha256:sha,contentType:'audio/webm'})
assert.ok(!calls.some(call=>call.url.includes('/object/upload/sign/')))
submissionVerified=true
assert.equal((await(await projectLifecycleRequest(req(),options)).json()).submissionVerification,'verified')
present=false
await assert.rejects(projectLifecycleRequest(req(),options),error=>error.code==='UPLOAD_OBJECT_MISSING')
present=true;mismatch=true
const failed=await projectLifecycleRequest(req(),options).catch(projectLifecycleErrorResponse)
assert.equal(failed.status,409);assert.deepEqual(await failed.json(),{error:{code:'UPLOAD_OBJECT_MISMATCH'}})
for(const extra of [{size:0},{sha256:'bad'},{sha256:[sha]},{userId:user},{verified:true},{contentType:'image/png'}]) {
  calls=[];await assert.rejects(projectLifecycleRequest(req(extra),options),error=>error.code==='INVALID_UPLOAD_FILE')
  assert.ok(!calls.some(call=>call.url.includes('/rest/') || call.url.includes('/storage/')))
}
calls=[]
await assert.rejects(projectLifecycleRequest(req(),{...options,env:{...env,IEUM_STORAGE_PROVIDER:''}}),error=>error.code==='SERVICE_NOT_CONFIGURED')
assert.ok(!calls.some(call=>call.url.includes('/rest/')))
console.log('PASS upload API: ownership RPC before signing, opaque no-upsert URL, byte/hash revalidation, reusable byte receipt distinct from duration/submission verification, missing/mismatched source rejection, provider/forged input denial, no API bearer at Storage. Injected HTTP; no live upload claim.')
