import { ServiceError } from '../src/projectService.js'
import { readAuthConfiguration,verifyRequestUser } from './auth.js'
import { createSupabaseAudioStorage } from './audioStorage.js'
const fail=code=>new ServiceError('대표 Sample 업로드를 준비하지 못했어요. 기존 음역과 Sample은 유지됩니다.',{code})
const uuid=value=>typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)

export async function readSampleMetadata(request) {
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || ''))throw fail('INVALID_UPLOAD_FILE')
  const reader=request.body?.getReader()
  if(!reader)throw fail('INVALID_UPLOAD_FILE')
  const chunks=[];let size=0
  try{
    while(true){
      const {value,done}=await reader.read();if(done)break
      size+=value.byteLength
      if(size>65536){await reader.cancel();throw fail('SAMPLE_PAYLOAD_TOO_LARGE')}
      chunks.push(value)
    }
  }finally{reader.releaseLock()}
  const bytes=new Uint8Array(size);let offset=0
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
  let value
  try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch{throw fail('INVALID_UPLOAD_FILE')}
  if(!value || Array.isArray(value) || typeof value!=='object')throw fail('INVALID_UPLOAD_FILE')
  return value
}
async function readFileMetadata(request) {
  const value=await readSampleMetadata(request)
  const contentType=typeof value?.contentType==='string'?value.contentType.split(';')[0].trim().toLowerCase():''
  if(!value || Array.isArray(value) || typeof value!=='object' || Object.keys(value).length!==3 ||
    Object.keys(value).some(key=>!['size','sha256','contentType'].includes(key)) ||
    !Number.isSafeInteger(value.size) || value.size<=0 || typeof value.sha256!=='string' || !/^[a-f0-9]{64}$/i.test(value.sha256) ||
    !/^audio\/[a-z0-9][a-z0-9!#$&^_.+-]*$/.test(contentType))throw fail('INVALID_UPLOAD_FILE')
  return {size:value.size,sha256:value.sha256.toLowerCase(),contentType}
}

export async function profileSampleUploadRequest(request,{env=process.env,fetchImpl=globalThis.fetch}={}) {
  const user=await verifyRequestUser(request,{env,fetchImpl})
  if(request.method!=='POST')throw fail('METHOD_NOT_ALLOWED')
  if(env.IEUM_DB_PROVIDER!=='supabase')throw fail('SERVICE_NOT_CONFIGURED')
  const key=request.headers.get('idempotency-key')
  if(typeof key!=='string' || !key.trim())throw fail('IDEMPOTENCY_KEY_REQUIRED')
  const file=await readFileMetadata(request)
  const configuration=readAuthConfiguration(env)
  const storage=createSupabaseAudioStorage({env,fetchImpl})
  let response
  try{
    response=await fetchImpl(`${configuration.url}/rest/v1/rpc/ieum_prepare_profile_sample_upload`,{
      method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000),
      headers:{Authorization:request.headers.get('authorization'),apikey:configuration.publishableKey,'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({p_request_key:key,p_size:file.size,p_sha256:file.sha256,p_content_type:file.contentType})
    })
  }catch{throw fail('SAMPLE_UPLOAD_UNAVAILABLE')}
  if(!response.ok)throw fail(({400:'INVALID_UPLOAD_FILE',401:'AUTH_REQUIRED',403:'SAMPLE_UPLOAD_FORBIDDEN',409:'SAMPLE_UPLOAD_CONFLICT'})[response.status] || 'SAMPLE_UPLOAD_UNAVAILABLE')
  let intent
  try{intent=await response.json()}catch{throw fail('INVALID_SAMPLE_UPLOAD_RESPONSE')}
  if(!uuid(intent?.uploadIntentId) || !uuid(intent?.objectId) || intent.userId!==user.id || intent.purpose!=='voice-sample' ||
    intent.size!==file.size || intent.sha256!==file.sha256 || intent.contentType!==file.contentType || typeof intent.audioVerified!=='boolean')throw fail('INVALID_SAMPLE_UPLOAD_RESPONSE')
  let verified
  try{verified=await storage.verifyOriginal(intent.objectId,file)}
  catch(error){if(error?.code!=='UPLOAD_OBJECT_MISSING' || intent.audioVerified)throw error}
  const result=verified?{uploadIntentId:intent.uploadIntentId,purpose:'voice-sample',uploadStatus:'verified',verifiedFile:verified,audioVerification:intent.audioVerified?'verified':'pending',sampleVerification:'pending'}:
    {uploadIntentId:intent.uploadIntentId,purpose:'voice-sample',uploadStatus:'pending',...(await storage.createSignedUpload(intent.objectId)),audioVerification:'pending',sampleVerification:'pending'}
  // Byte receipt/signing never changes the representative Sample or its analysis.
  return Response.json(result,{headers:{'Cache-Control':'private, no-store',Vary:'Authorization'}})
}
export function profileSampleUploadErrorResponse(error) {
  const statuses={AUTH_REQUIRED:401,SERVICE_NOT_CONFIGURED:503,INVALID_SERVICE_CONFIGURATION:503,AUTH_UNAVAILABLE:503,INVALID_AUTH_RESPONSE:503,
    INVALID_UPLOAD_FILE:400,IDEMPOTENCY_KEY_REQUIRED:400,SAMPLE_PAYLOAD_TOO_LARGE:413,METHOD_NOT_ALLOWED:405,
    SAMPLE_UPLOAD_FORBIDDEN:403,SAMPLE_UPLOAD_CONFLICT:409,SAMPLE_UPLOAD_UNAVAILABLE:503,INVALID_SAMPLE_UPLOAD_RESPONSE:503,
    UPLOAD_OBJECT_MISSING:409,UPLOAD_OBJECT_MISMATCH:409,STORAGE_UNAVAILABLE:503,PRIVATE_STORAGE_REQUIRED:503,INVALID_STORAGE_RESPONSE:503,
    INVALID_SAMPLE_REQUEST:400,SAMPLE_UPLOAD_NOT_FOUND:404,INVALID_AUDIO_RECEIPT:409,AUDIO_RECEIPT_CONFLICT:409,
    AUDIO_DECODER_NOT_CONFIGURED:503,AUDIO_DECODER_UNAVAILABLE:503,AUDIO_DECODE_TIMEOUT:503,AUDIO_DECODE_FAILED:409,
    AUDIO_DURATION_EXCEEDED:409,AUDIO_FORMAT_MISMATCH:409,AUDIO_FORMAT_UNSUPPORTED:409,AUDIO_SOURCE_UNAVAILABLE:503,INVALID_AUDIO_VERIFICATION:409,
    AUDIO_ANALYSIS_FAILED:409,SAMPLE_AUDIO_NOT_VERIFIED:409,SAMPLE_ANALYSIS_NOT_CONFIGURED:503,SAMPLE_ANALYSIS_BUDGET_EXCEEDED:413,
    SAMPLE_ANALYSIS_INSUFFICIENT_DATA:409,SAMPLE_ANALYSIS_FRAME_MISMATCH:409,SAMPLE_ANALYSIS_CONFLICT:409,INVALID_SAMPLE_ANALYSIS:409,
    INVALID_PROFILE_SOURCE:400,SAMPLE_ANALYSIS_REQUIRED:409,PROFILE_SOURCE_REVISION_CONFLICT:409,PROFILE_SOURCE_UNAVAILABLE:503,INVALID_PROFILE_SOURCE_RESPONSE:503}
  const code=Object.hasOwn(statuses,error?.code)?error.code:'SAMPLE_UPLOAD_UNAVAILABLE'
  return Response.json({error:{code}},{status:statuses[code],headers:{'Cache-Control':'private, no-store',Vary:'Authorization'}})
}
