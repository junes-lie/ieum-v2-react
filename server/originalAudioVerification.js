import { ServiceError } from '../src/projectService.js'

const fail=code=>new ServiceError('녹음 원본 검증을 확정하지 못했어요. 원본은 유지됩니다.',{code,status:409})
const uuid=value=>typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)

// Shared decode receipt contract; it does not assign Profile or Project purpose.
export function exactDecodedAudioReceipt(receipt,expected) {
  if(receipt?.size!==expected.size || receipt.sha256!==expected.sha256 || receipt.contentType!==expected.contentType ||
    !Number.isSafeInteger(receipt.decodedFrames) || receipt.decodedFrames<=0 || receipt.sampleRate!==48000 ||
    receipt.duration!==receipt.decodedFrames/receipt.sampleRate || receipt.analysisVersion!=='decoded-pcm-v1' ||
    typeof receipt.decoderVersion!=='string' || !/^ffmpeg version [^\x00-\x1f]+$/.test(receipt.decoderVersion) ||
    typeof receipt.decoderSha256!=='string' || !/^[a-f0-9]{64}$/.test(receipt.decoderSha256))throw fail('INVALID_AUDIO_RECEIPT')
  return Object.fromEntries(['size','sha256','contentType','duration','decodedFrames','sampleRate','analysisVersion','decoderVersion','decoderSha256'].map(key=>[key,receipt[key]]))
}

// Internal worker boundary. context must come from an authenticated, owned DB
// intent lookup, not client JSON. persistReceipt uses the service-only RPC.
// It confirms verification only; submitting a Track is a separate transaction.
export async function verifyOwnedOriginalAudio({context,storage,decoderOptions,persistReceipt}) {
  if(!context || !['userId','uploadIntentId','objectId'].every(key=>uuid(context[key])) ||
    !['projectId','partId'].every(key=>typeof context[key]==='string' && context[key].trim()) ||
    !Number.isSafeInteger(context.size) || context.size<=0 || typeof context.sha256!=='string' || !/^[a-f0-9]{64}$/.test(context.sha256) ||
    typeof context.contentType!=='string' || !context.contentType.startsWith('audio/') ||
    typeof storage?.verifyOriginalAudio!=='function' || typeof persistReceipt!=='function')throw fail('INVALID_AUDIO_VERIFICATION')
  context=structuredClone(context)
  const expected={size:context.size,sha256:context.sha256,contentType:context.contentType}
  const receipt=await storage.verifyOriginalAudio(context.objectId,expected,decoderOptions)
  const exact=exactDecodedAudioReceipt(receipt,expected)
  const result=await persistReceipt({p_project_id:context.projectId,p_part_id:context.partId,p_user_id:context.userId,
    p_upload_intent_id:context.uploadIntentId,p_object_id:context.objectId,p_receipt:exact})
  if(result?.uploadIntentId!==context.uploadIntentId || result.verificationStatus!=='verified' ||
    Object.keys(result.receipt || {}).length!==9 || Object.keys(exact).some(key=>result.receipt[key]!==exact[key]))throw fail('INVALID_AUDIO_RECEIPT_RESPONSE')
  return {uploadIntentId:result.uploadIntentId,verificationStatus:'verified',receipt:exact}
}
