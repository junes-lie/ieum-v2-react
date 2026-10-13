import {ServiceError} from '../src/projectService.js'
import {verifyRequestUser} from './auth.js'
import {voiceGraphicsRpc,checkedTrackLayerReference} from './trackVoiceLayers.js'

const fail=code=>new ServiceError('저장된 이미지를 확인하지 못했어요. 원본은 유지됩니다.',{code})
const text=value=>typeof value==='string' && value.trim() && value.length<=128 && !/[\x00-\x1f]/.test(value)
const sha=value=>typeof value==='string' && /^[a-f0-9]{64}$/.test(value)
export async function ownedVoiceImageChunkRequest(request,{env=process.env,fetchImpl=globalThis.fetch,kind}={}){
  await verifyRequestUser(request,{env,fetchImpl})
  if(request.method!=='GET')throw fail('METHOD_NOT_ALLOWED')
  const q=new URL(request.url).searchParams,id=q.get('id'),revision=q.get('revision'),projectId=q.get('projectId'),partId=q.get('partId')
  const offset=q.get('offset'),length=q.get('length'),track=kind==='track-image'
  if(!['personal-image','track-image'].includes(kind) || q.size!==(track?6:4) ||
    ![id,revision,...(track?[projectId,partId]:[])].every(text) || !/^(0|[1-9]\d*)$/.test(offset || '') ||
    !/^[1-9]\d*$/.test(length || '') || Number(offset)>8388607 || Number(length)>262144)throw fail('INVALID_VOICE_LAYER')
  const result=await voiceGraphicsRpc(track?'ieum_get_owned_track_voice_image_chunk':'ieum_get_owned_personal_identity_image_chunk',
    {p_id:id,p_revision:revision,p_offset:Number(offset),p_length:Number(length),...(track?{p_project_id:projectId,p_part_id:partId}:{})},
    {env,fetchImpl,authorization:request.headers.get('authorization')})
  const metadata=result?.metadata,ref=metadata?.ref,receipt=result?.receipt
  if(track)checkedTrackLayerReference(metadata,{projectId,partId,id,revision})
  else if(!metadata || Object.keys(metadata).length!==3 || metadata.resultStatus!=='stored' || !text(metadata.profileRevision) ||
    !ref || Object.keys(ref).length!==5 || ref.id!==id || ref.revision!==revision || !text(ref.generatorVersion) ||
    !sha(ref.inputDigest) || !sha(ref.outputSha256))throw fail('INVALID_VOICE_LAYER_RESPONSE')
  if(!result || Object.keys(result).length!==5 || !Number.isSafeInteger(result.size) || result.size<33 || result.size>8388608 ||
    result.offset!==Number(offset) || Number(offset)>=result.size || typeof result.png!=='string' || result.png.length>360000 ||
    receipt?.version!=='ieum-png-first-frame-decode-v1' || receipt.sha256!==ref.outputSha256 || receipt.size!==result.size ||
    receipt.width!==512 || receipt.height!==512 || receipt.decodedBytes!==1048576 || receipt.pixelFormat!=='rgba')throw fail('INVALID_VOICE_LAYER_RESPONSE')
  const encoded=result.png.replace(/\s/g,''),bytes=Buffer.from(encoded,'base64')
  if(bytes.toString('base64')!==encoded || bytes.length!==Math.min(Number(length),result.size-Number(offset)))throw fail('INVALID_VOICE_LAYER_RESPONSE')
  return new Response(bytes,{status:206,headers:{'Content-Type':'application/octet-stream','Content-Length':String(bytes.length),
    'Content-Range':`bytes ${offset}-${Number(offset)+bytes.length-1}/${result.size}`,'X-Content-SHA256':ref.outputSha256,
    'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store',Vary:'Authorization'}})
}
