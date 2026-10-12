import {isAbsolute} from 'node:path'
import {ServiceError} from '../src/projectService.js'
import {canonicalIdentityInput} from '../src/voiceIdentityContract.js'
import {readAuthConfiguration,verifyRequestUser} from './auth.js'
import {createSupabaseAudioStorage} from './audioStorage.js'
import {readSampleMetadata} from './profileSampleUpload.js'
import {analyzeVerifiedSample,checkedStoredSampleAnalysis} from './sampleVoiceAnalysis.js'
import {exactDecodedAudioReceipt} from './originalAudioVerification.js'
const fail=code=>new ServiceError('대표 Sample 분석을 완료하지 못했어요. 기존 Profile은 유지됩니다.',{code})
const uuid=value=>typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)
export async function profileSampleAnalysisRequest(request,{env=process.env,fetchImpl=globalThis.fetch}={}) {
  const user=await verifyRequestUser(request,{env,fetchImpl})
  if(request.method!=='POST')throw fail('METHOD_NOT_ALLOWED')
  if(env.IEUM_DB_PROVIDER!=='supabase')throw fail('SERVICE_NOT_CONFIGURED')
  const value=await readSampleMetadata(request)
  if(Object.keys(value).length!==1 || !uuid(value.uploadIntentId))throw fail('INVALID_SAMPLE_REQUEST')
  const configuration=readAuthConfiguration(env),storage=createSupabaseAudioStorage({env,fetchImpl})
  const rpc=async(name,body,privileged=false)=>{
    let response
    try{response=await fetchImpl(`${configuration.url}/rest/v1/rpc/${name}`,{method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000),
      headers:{apikey:privileged?env.IEUM_SUPABASE_SECRET_KEY:configuration.publishableKey,...(privileged?{}:{Authorization:request.headers.get('authorization')}),
        'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)})}catch{throw fail('SAMPLE_UPLOAD_UNAVAILABLE')}
    if(!response.ok)throw fail(({400:'INVALID_SAMPLE_ANALYSIS',401:'AUTH_REQUIRED',403:'SAMPLE_UPLOAD_FORBIDDEN',404:'SAMPLE_UPLOAD_NOT_FOUND',409:'SAMPLE_ANALYSIS_CONFLICT'})[response.status] || 'SAMPLE_UPLOAD_UNAVAILABLE')
    try{return await response.json()}catch{throw fail('INVALID_SAMPLE_UPLOAD_RESPONSE')}
  }
  const context=await rpc('ieum_get_owned_profile_sample_upload',{p_upload_intent_id:value.uploadIntentId})
  if(context?.userId!==user.id || context.uploadIntentId!==value.uploadIntentId || context.purpose!=='voice-sample' || !uuid(context.objectId) ||
    !Number.isSafeInteger(context.size) || context.size<=0 || typeof context.sha256!=='string' || !/^[a-f0-9]{64}$/.test(context.sha256) ||
    typeof context.contentType!=='string' || !context.contentType.startsWith('audio/'))throw fail('INVALID_SAMPLE_UPLOAD_RESPONSE')
  if(context.audioVerified!==true || !context.receipt)throw fail('SAMPLE_AUDIO_NOT_VERIFIED')
  exactDecodedAudioReceipt(context.receipt,{size:context.size,sha256:context.sha256,contentType:context.contentType})
  if(Object.keys(context.receipt).length!==9)throw fail('INVALID_AUDIO_RECEIPT')
  let analysis=context.analysis
  if(analysis!==null){
    analysis=checkedStoredSampleAnalysis(context)
    await storage.verifyOriginal(context.objectId,{size:context.size,sha256:context.sha256,contentType:context.contentType})
  }else{
    const executable=env.IEUM_AUDIO_DECODER_PATH,maxDurationSeconds=Number(env.IEUM_AUDIO_MAX_DECODE_SECONDS),maxPcmBytes=Number(env.IEUM_SAMPLE_ANALYSIS_MAX_PCM_BYTES)
    if(typeof executable!=='string' || !isAbsolute(executable) || !Number.isFinite(maxDurationSeconds) || maxDurationSeconds<=0 ||
      !Number.isSafeInteger(maxPcmBytes) || maxPcmBytes<=0)throw fail('SAMPLE_ANALYSIS_NOT_CONFIGURED')
    analysis=await analyzeVerifiedSample({context,storage,decoderOptions:{executable,maxDurationSeconds},maxPcmBytes})
    const result=await rpc('ieum_confirm_profile_sample_analysis',{p_user_id:user.id,p_upload_intent_id:context.uploadIntentId,p_object_id:context.objectId,p_analysis:analysis},true)
    if(result?.uploadIntentId!==context.uploadIntentId || result.analysisStatus!=='verified' ||
      canonicalIdentityInput(result.analysis)!==canonicalIdentityInput(analysis))throw fail('INVALID_SAMPLE_ANALYSIS')
  }
  return Response.json({uploadIntentId:context.uploadIntentId,analysisStatus:'verified',analysis,sampleVerification:'pending'},
    {headers:{'Cache-Control':'private, no-store',Vary:'Authorization'}})
}
