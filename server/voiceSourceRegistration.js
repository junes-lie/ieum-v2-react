import {createHash} from 'node:crypto'
import {ServiceError} from '../src/projectService.js'
import {PITCH_ANALYSIS_VERSION} from '../src/pitch.js'
import {canonicalIdentityInput} from '../src/voiceIdentityContract.js'
import {voiceSourceRevision} from '../src/profileSource.js'
import {readAuthConfiguration,verifyRequestUser} from './auth.js'
import {createSupabaseAudioStorage} from './audioStorage.js'
import {readSampleMetadata} from './profileSampleUpload.js'
import {checkedStoredSampleAnalysis} from './sampleVoiceAnalysis.js'
const fail=code=>new ServiceError('목소리 원본을 등록하지 못했어요. 기존 Profile과 녹음은 유지됩니다.',{code})
const uuid=value=>typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)
const digest=value=>createHash('sha256').update(canonicalIdentityInput(value)).digest('hex')
const midiRange=value=>value && Number.isInteger(value.lowMidi) && Number.isInteger(value.highMidi) && value.lowMidi>=0 && value.highMidi<=127 && value.lowMidi<=value.highMidi

export async function voiceSourceRegistrationRequest(request,{env=process.env,fetchImpl=globalThis.fetch}={}) {
  const user=await verifyRequestUser(request,{env,fetchImpl})
  if(!['GET','POST'].includes(request.method))throw fail('METHOD_NOT_ALLOWED')
  if(env.IEUM_DB_PROVIDER!=='supabase')throw fail('SERVICE_NOT_CONFIGURED')
  const configuration=readAuthConfiguration(env)
  const rpc=async(name,body,privileged=false)=>{
    let response
    try{response=await fetchImpl(`${configuration.url}/rest/v1/rpc/${name}`,{method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000),
      headers:{apikey:privileged?env.IEUM_SUPABASE_SECRET_KEY:configuration.publishableKey,...(privileged?{}:{Authorization:request.headers.get('authorization')}),
        'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)})}catch{throw fail('PROFILE_SOURCE_UNAVAILABLE')}
    if(!response.ok)throw fail(({400:'INVALID_PROFILE_SOURCE',401:'AUTH_REQUIRED',403:'SAMPLE_UPLOAD_FORBIDDEN',404:'SAMPLE_UPLOAD_NOT_FOUND',409:'PROFILE_SOURCE_REVISION_CONFLICT'})[response.status] || 'PROFILE_SOURCE_UNAVAILABLE')
    try{return await response.json()}catch{throw fail('INVALID_PROFILE_SOURCE_RESPONSE')}
  }
  if(request.method==='GET'){
    const result=await rpc('ieum_get_voice_source',{})
    if(!result || !(result.source===null || (typeof result.source?.sourceRevision==='string' && midiRange(result.source.rangeData))))throw fail('INVALID_PROFILE_SOURCE_RESPONSE')
    return Response.json(result,{headers:{'Cache-Control':'private, no-store',Vary:'Authorization'}})
  }
  const value=await readSampleMetadata(request),key=request.headers.get('idempotency-key')
  const range=value.rangeData,rangeSource=value.rangeProvenance,sampleSource=value.sampleProvenance
  if(Object.keys(value).length!==5 || Object.keys(value).some(field=>!['expectedSourceRevision','rangeData','rangeProvenance','sampleUploadIntentId','sampleProvenance'].includes(field)) ||
    !(value.expectedSourceRevision===null || (typeof value.expectedSourceRevision==='string' && value.expectedSourceRevision.trim())) || !uuid(value.sampleUploadIntentId) ||
    !midiRange(range) || range.analysisVersion!==PITCH_ANALYSIS_VERSION || !Number.isInteger(range.sampleCount) || range.sampleCount<6 ||
    !Number.isFinite(range.confidence) || range.confidence<0 || range.confidence>1 ||
    (range.comfortableRange!==undefined && (!midiRange(range.comfortableRange) || range.comfortableRange.lowMidi<range.lowMidi || range.comfortableRange.highMidi>range.highMidi)) ||
    rangeSource?.version!=='ieum-profile-source-v1' || rangeSource.purpose!=='voice-range' || !uuid(rangeSource.revision) || rangeSource.analysisVersion!==PITCH_ANALYSIS_VERSION ||
    Object.keys(rangeSource).length!==5 || digest(range)!==rangeSource.measurementSha256 ||
    sampleSource?.version!=='ieum-profile-source-v1' || sampleSource.purpose!=='voice-sample' || !uuid(sampleSource.revision) ||
    Object.keys(sampleSource).length!==6 || sampleSource.analysisVersion!=='ieum-basic-voice-v5')throw fail('INVALID_PROFILE_SOURCE')
  if(typeof key!=='string' || !key.trim())throw fail('IDEMPOTENCY_KEY_REQUIRED')
  const storage=createSupabaseAudioStorage({env,fetchImpl})
  const context=await rpc('ieum_get_owned_profile_sample_upload',{p_upload_intent_id:value.sampleUploadIntentId})
  if(context?.userId!==user.id || context.uploadIntentId!==value.sampleUploadIntentId || context.purpose!=='voice-sample' || !uuid(context.objectId) ||
    !Number.isSafeInteger(context.size) || context.size<=0 || typeof context.sha256!=='string' || !/^[a-f0-9]{64}$/.test(context.sha256) ||
    typeof context.contentType!=='string' || !context.contentType.startsWith('audio/'))throw fail('INVALID_PROFILE_SOURCE_RESPONSE')
  if(context.audioVerified!==true || !context.receipt || !context.analysis)throw fail('SAMPLE_ANALYSIS_REQUIRED')
  const analysis=checkedStoredSampleAnalysis(context)
  if(sampleSource.byteLength!==context.size || sampleSource.audioSha256!==context.sha256)throw fail('INVALID_PROFILE_SOURCE')
  const sourceRevision=await voiceSourceRevision(rangeSource,sampleSource)
  await storage.verifyOriginal(context.objectId,{size:context.size,sha256:context.sha256,contentType:context.contentType})
  const result=await rpc('ieum_register_profile_source',{p_user_id:user.id,p_upload_intent_id:context.uploadIntentId,
    p_range_data:range,p_range_provenance:rangeSource,p_sample_provenance:sampleSource,p_source_revision:sourceRevision,
    p_expected_source_revision:value.expectedSourceRevision,p_request_key:key,p_request_sha256:digest(value)},true)
  if(result?.registrationStatus!=='success' || result.source?.sourceRevision!==sourceRevision ||
    canonicalIdentityInput(result.source.rangeData)!==canonicalIdentityInput(range) ||
    canonicalIdentityInput(result.source.rangeProvenance)!==canonicalIdentityInput(rangeSource) ||
    canonicalIdentityInput(result.source.sampleProvenance)!==canonicalIdentityInput(sampleSource) ||
    result.source.rangeOrigin!=='browser-pitch-analysis' || result.source.sampleOrigin!=='server-decoded-private-original' ||
    result.source.sampleDuration!==context.receipt.duration ||
    canonicalIdentityInput(result.source.sampleFeatures)!==canonicalIdentityInput(analysis.features) ||
    result.source.sampleAnalysisRef?.uploadIntentId!==context.uploadIntentId || result.source.sampleAnalysisRef.featuresSha256!==analysis.featuresSha256)throw fail('INVALID_PROFILE_SOURCE_RESPONSE')
  return Response.json(result,{headers:{'Cache-Control':'private, no-store',Vary:'Authorization'}})
}
