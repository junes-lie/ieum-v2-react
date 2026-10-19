import {isAbsolute} from 'node:path'
import {ServiceError} from '../src/projectService.js'
import {canonicalIdentityInput} from '../src/voiceIdentityContract.js'
import {createSupabaseAudioStorage} from './audioStorage.js'
import {exactDecodedAudioReceipt} from './originalAudioVerification.js'
import {analyzeVerifiedTrack,checkedStoredTrackAnalysis} from './sampleVoiceAnalysis.js'

const fail=code=>new ServiceError('제출 Track 분석을 완료하지 못했어요. 제출 원본과 Mix는 유지됩니다.',{code})
const uuid=value=>typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)

// Called after the existing handler verifies Auth. No client analysis, Profile
// sample, Review/Draft, Identity generation or submission mutation is accepted.
export async function submittedTrackAnalysis({request,user,route,configuration,env,fetchImpl}) {
  const rpc=async(name,body,privileged=false)=>{
    let response
    try{response=await fetchImpl(`${configuration.url}/rest/v1/rpc/${name}`,{method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',
      signal:AbortSignal.timeout(10000),headers:{apikey:privileged?env.IEUM_SUPABASE_SECRET_KEY:configuration.publishableKey,
        ...(privileged?{}:{Authorization:request.headers.get('authorization')}),'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)})}
    catch{throw fail('PROJECT_UNAVAILABLE')}
    if(!response.ok)throw fail(({400:'INVALID_TRACK_ANALYSIS',401:'AUTH_REQUIRED',403:'TRACK_ANALYSIS_FORBIDDEN',404:'SUBMITTED_TRACK_NOT_FOUND',409:'TRACK_ANALYSIS_CONFLICT'})[response.status] || 'PROJECT_UNAVAILABLE')
    try{return await response.json()}catch{throw fail('INVALID_TRACK_ANALYSIS')}
  }
  const context=await rpc('ieum_get_owned_submitted_track_analysis',{p_project_id:route.projectId,p_part_id:route.partId})
  if(context?.trackId!==`${route.projectId}:${route.partId}` || context.projectId!==route.projectId || context.partId!==route.partId ||
    context.userId!==user.id || context.submitted!==true || context.purpose!=='project-track' || context.audioVerified!==true ||
    !uuid(context.objectId) || !Number.isSafeInteger(context.size) || context.size<=0 || !/^[a-f0-9]{64}$/.test(context.sha256 || '') ||
    typeof context.contentType!=='string' || !context.contentType.startsWith('audio/'))throw fail('INVALID_TRACK_ANALYSIS')
  exactDecodedAudioReceipt(context.receipt,{size:context.size,sha256:context.sha256,contentType:context.contentType})
  if(Object.keys(context.receipt).length!==9)throw fail('INVALID_AUDIO_RECEIPT')
  const storage=createSupabaseAudioStorage({env,fetchImpl})
  let analysis=context.analysis
  if(analysis!==null){
    analysis=checkedStoredTrackAnalysis(context)
    await storage.verifyOriginal(context.objectId,{size:context.size,sha256:context.sha256,contentType:context.contentType})
  }else{
    const executable=env.IEUM_AUDIO_DECODER_PATH,maxDurationSeconds=Number(env.IEUM_AUDIO_MAX_DECODE_SECONDS),maxPcmBytes=Number(env.IEUM_TRACK_ANALYSIS_MAX_PCM_BYTES)
    if(typeof executable!=='string' || !isAbsolute(executable) || !Number.isFinite(maxDurationSeconds) || maxDurationSeconds<=0 ||
      !Number.isSafeInteger(maxPcmBytes) || maxPcmBytes<=0)throw fail('TRACK_ANALYSIS_NOT_CONFIGURED')
    analysis=await analyzeVerifiedTrack({context,storage,decoderOptions:{executable,maxDurationSeconds},maxPcmBytes})
    const saved=await rpc('ieum_confirm_submitted_track_analysis',{p_project_id:route.projectId,p_part_id:route.partId,p_user_id:user.id,
      p_object_id:context.objectId,p_analysis:analysis},true)
    if(saved?.trackId!==context.trackId || saved.analysisStatus!=='verified' ||
      canonicalIdentityInput(saved.analysis)!==canonicalIdentityInput(analysis))throw fail('INVALID_TRACK_ANALYSIS')
  }
  return Response.json({trackId:context.trackId,analysisStatus:'verified',analysis},
    {headers:{'Cache-Control':'private, no-store',Vary:'Authorization'}})
}
