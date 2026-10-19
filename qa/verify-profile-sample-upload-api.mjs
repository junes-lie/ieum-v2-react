import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {profileSampleUploadRequest,profileSampleUploadErrorResponse} from '../server/profileSampleUpload.js'
import {POST} from '../api/me/voice-sample-upload.js'
assert.equal(typeof POST,'function')
const user='11111111-1111-4111-8111-111111111111',other='44444444-4444-4444-8444-444444444444'
const object='22222222-2222-4222-8222-222222222222',intent='33333333-3333-4333-8333-333333333333'
const bytes=new Uint8Array([1,2,3,4]),sha=createHash('sha256').update(bytes).digest('hex')
const env={IEUM_AUTH_PROVIDER:'supabase',IEUM_DB_PROVIDER:'supabase',IEUM_STORAGE_PROVIDER:'supabase',IEUM_SUPABASE_URL:'https://example.supabase.co',IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public',IEUM_SUPABASE_SECRET_KEY:'sb_secret_qa_only',IEUM_AUDIO_BUCKET:'private-audio'}
let present=false,mismatch=false,forged=false,publicBucket=false,audioVerified=false,rpcStatus=200,calls=[]
const fetchImpl=async(url,init)=>{
  calls.push({url,init});assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit')
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user})
  if(url.includes('/rest/v1/rpc/')){
    assert.equal(init.headers.Authorization,'Bearer qa-token');assert.equal(init.headers.apikey,'qa-public')
    assert.ok(url.endsWith('/ieum_prepare_profile_sample_upload'))
    assert.deepEqual(JSON.parse(init.body),{p_request_key:'sample-1',p_size:4,p_sha256:sha,p_content_type:'audio/webm'})
    if(rpcStatus!==200)return Response.json({message:'secret upstream diagnostic'},{status:rpcStatus})
    return Response.json({uploadIntentId:intent,userId:forged?other:user,objectId:object,purpose:'voice-sample',size:4,sha256:sha,contentType:'audio/webm',audioVerified})
  }
  assert.equal(init.headers.apikey,'sb_secret_qa_only');assert.equal(init.headers.Authorization,undefined)
  if(url.endsWith('/bucket/private-audio'))return Response.json({id:'private-audio',public:publicBucket})
  if(url.includes('/object/upload/sign/')){
    assert.equal(init.headers['x-upsert'],'false')
    return Response.json({url:`/object/upload/sign/private-audio/originals/${object}?token=qa-signed`})
  }
  if(!present)return new Response('not found',{status:404})
  return new Response(mismatch?new Uint8Array([9,2,3,4]):bytes,{headers:{'Content-Type':'audio/webm','Content-Length':'4'}})
}
const options={env,fetchImpl}
const req=(extra={},headers={})=>new Request('https://ieum.example/api/me/voice-sample-upload',{
  method:'POST',headers:{Authorization:'Bearer qa-token','Content-Type':'application/json','Idempotency-Key':'sample-1',...headers},
  body:JSON.stringify({size:4,sha256:sha.toUpperCase(),contentType:'audio/webm;codecs=opus',...extra})})
let response=await profileSampleUploadRequest(req(),options),result=await response.json()
assert.equal(result.uploadStatus,'pending');assert.equal(result.sampleVerification,'pending');assert.equal(result.purpose,'voice-sample')
assert.equal(result.objectId,undefined);assert.equal(result.userId,undefined)
assert.ok(result.signedUploadUrl.includes(object));assert.ok(!result.signedUploadUrl.includes(user))
assert.equal(response.headers.get('cache-control'),'private, no-store')
assert.ok(calls.findIndex(call=>call.url.includes('/rest/'))<calls.findIndex(call=>call.url.includes('/object/upload/sign/')))
present=true;calls=[]
result=await(await profileSampleUploadRequest(req(),options)).json()
assert.equal(result.uploadStatus,'verified');assert.equal(result.sampleVerification,'pending')
assert.deepEqual(result.verifiedFile,{size:4,sha256:sha,contentType:'audio/webm'})
assert.ok(!calls.some(call=>call.url.includes('/object/upload/sign/')))
audioVerified=true
assert.equal((await(await profileSampleUploadRequest(req(),options)).json()).audioVerification,'verified')
present=false;calls=[]
await assert.rejects(profileSampleUploadRequest(req(),options),error=>error.code==='UPLOAD_OBJECT_MISSING')
assert.ok(!calls.some(call=>call.url.includes('/object/upload/sign/')))
present=true;audioVerified=false
forged=true;calls=[]
await assert.rejects(profileSampleUploadRequest(req(),options),error=>error.code==='INVALID_SAMPLE_UPLOAD_RESPONSE')
assert.ok(!calls.some(call=>call.url.includes('/storage/')));forged=false
mismatch=true
response=await profileSampleUploadRequest(req(),options).catch(profileSampleUploadErrorResponse)
assert.equal(response.status,409);assert.deepEqual(await response.json(),{error:{code:'UPLOAD_OBJECT_MISMATCH'}});mismatch=false
publicBucket=true
await assert.rejects(profileSampleUploadRequest(req(),options),error=>error.code==='PRIVATE_STORAGE_REQUIRED');publicBucket=false
for(const extra of [{size:0},{sha256:'bad'},{userId:user},{purpose:'project-track'},{rangeData:{}},{features:{}},{sampleVerification:'verified'},{contentType:'image/png'}]){
  calls=[];await assert.rejects(profileSampleUploadRequest(req(extra),options),error=>error.code==='INVALID_UPLOAD_FILE')
  assert.ok(!calls.some(call=>call.url.includes('/rest/') || call.url.includes('/storage/')))
}
for(const [status,code] of [[403,'SAMPLE_UPLOAD_FORBIDDEN'],[409,'SAMPLE_UPLOAD_CONFLICT'],[500,'SAMPLE_UPLOAD_UNAVAILABLE']]){
  rpcStatus=status;calls=[]
  response=await profileSampleUploadRequest(req(),options).catch(profileSampleUploadErrorResponse)
  assert.deepEqual(await response.json(),{error:{code}})
  assert.ok(!calls.some(call=>call.url.includes('/storage/')))
}
rpcStatus=200;calls=[]
await assert.rejects(profileSampleUploadRequest(req(),{...options,env:{...env,IEUM_STORAGE_PROVIDER:''}}),error=>error.code==='SERVICE_NOT_CONFIGURED')
assert.ok(!calls.some(call=>call.url.includes('/rest/')))
await assert.rejects(profileSampleUploadRequest(req({}, {'Idempotency-Key':''}),options),error=>error.code==='IDEMPOTENCY_KEY_REQUIRED')
await assert.rejects(profileSampleUploadRequest(new Request('https://ieum.example/api/me/voice-sample-upload',{
  method:'POST',headers:{Authorization:'Bearer qa-token','Content-Type':'application/json','Idempotency-Key':'sample-1'},
  body:JSON.stringify({padding:'x'.repeat(65536)})}),options),error=>error.code==='SAMPLE_PAYLOAD_TOO_LARGE')
await assert.rejects(profileSampleUploadRequest(req({}, {Authorization:''}),options),error=>error.code==='AUTH_REQUIRED')
await assert.rejects(profileSampleUploadRequest(new Request('https://ieum.example/api/me/voice-sample-upload',{headers:{Authorization:'Bearer qa-token'}}),options),error=>error.code==='METHOD_NOT_ALLOWED')
console.log('PASS Sample upload API: authenticated own purpose RPC before private no-upsert signing, exact byte/hash retry, byte verification separate from Sample registration, forged owner/input denial, safe errors, existing originals preserved. Injected HTTP, not live upload/decoding/Profile registration.')
