import { isAbsolute } from 'node:path'
import { ServiceError } from '../src/projectService.js'
import { createSupabaseAudioStorage } from './audioStorage.js'
import { verifyOwnedOriginalAudio } from './originalAudioVerification.js'

const fail=(code,status=503)=>new ServiceError('녹음 원본을 확인하지 못했어요. 원본은 유지됩니다.',{code,status})
const uuid=value=>typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)

export async function verifySubmissionAudio({request,user,route,uploadIntentId,configuration,env,fetchImpl}) {
  const storage=createSupabaseAudioStorage({env,fetchImpl})
  const rpc=async(name,body,privileged=false)=>{
    let response
    try {response=await fetchImpl(`${configuration.url}/rest/v1/rpc/${name}`,{method:'POST',redirect:'error',credentials:'omit',referrerPolicy:'no-referrer',
      signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json',Accept:'application/json',
        apikey:privileged?env.IEUM_SUPABASE_SECRET_KEY:configuration.publishableKey,
        ...(privileged?{}:{Authorization:request.headers.get('authorization')})},body:JSON.stringify(body)})}
    catch {throw fail('PROJECT_UNAVAILABLE')}
    if(!response.ok)throw fail(({400:'INVALID_AUDIO_RECEIPT',401:'AUTH_REQUIRED',403:'PART_NOT_ASSIGNED',404:'PROJECT_NOT_FOUND',409:'PROJECT_CONFLICT'})[response.status] || 'PROJECT_UNAVAILABLE',response.status)
    try {return await response.json()}catch {throw fail('INVALID_PROJECT_RESPONSE')}
  }
  const context=await rpc('ieum_get_owned_upload',{p_project_id:route.projectId,p_part_id:route.partId,p_upload_intent_id:uploadIntentId})
  if(context?.projectId!==route.projectId || context.partId!==route.partId || context.userId!==user.id || context.uploadIntentId!==uploadIntentId ||
    !uuid(context.objectId) || !Number.isSafeInteger(context.size) || context.size<=0 || typeof context.sha256!=='string' ||
    !/^[a-f0-9]{64}$/.test(context.sha256) || typeof context.contentType!=='string' || !context.contentType.startsWith('audio/'))throw fail('INVALID_PROJECT_RESPONSE')
  const expected={size:context.size,sha256:context.sha256,contentType:context.contentType}
  if(context.receipt!==null){
    const receipt=context.receipt
    if(!receipt || Array.isArray(receipt) || Object.keys(receipt).length!==9 ||
      Object.keys(expected).some(key=>receipt[key]!==expected[key]) || !Number.isSafeInteger(receipt.decodedFrames) || receipt.decodedFrames<=0 ||
      receipt.sampleRate!==48000 || receipt.duration!==receipt.decodedFrames/receipt.sampleRate || receipt.analysisVersion!=='decoded-pcm-v1' ||
      typeof receipt.decoderVersion!=='string' || !/^ffmpeg version [^\x00-\x1f]+$/.test(receipt.decoderVersion) ||
      typeof receipt.decoderSha256!=='string' || !/^[a-f0-9]{64}$/.test(receipt.decoderSha256))throw fail('INVALID_AUDIO_RECEIPT')
    // Revalidate persisted bytes on every submission retry. Keep the immutable
    // confirmed duration/version rather than regenerating it with another binary.
    await storage.verifyOriginal(context.objectId,expected)
    return {duration:receipt.duration}
  }
  const executable=env.IEUM_AUDIO_DECODER_PATH,maxDurationSeconds=Number(env.IEUM_AUDIO_MAX_DECODE_SECONDS)
  if(typeof executable!=='string' || !isAbsolute(executable) || !Number.isFinite(maxDurationSeconds) || maxDurationSeconds<=0)
    throw fail('AUDIO_DECODER_NOT_CONFIGURED')
  const verified=await verifyOwnedOriginalAudio({context,storage,decoderOptions:{executable,maxDurationSeconds},
    persistReceipt:body=>rpc('ieum_confirm_original_audio',body,true)})
  return {duration:verified.receipt.duration}
}
