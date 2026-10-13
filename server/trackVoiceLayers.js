import {createHash} from 'node:crypto'
import {ServiceError} from '../src/projectService.js'
import {canonicalIdentityInput,buildTrackIdentityInput} from '../src/voiceIdentityContract.js'
import {prepareVoiceVisualControls} from '../src/voiceVisualMapping.js'
import {validateAiVoiceLayer} from '../src/aiVoiceLayer.js'
import {checkedStoredTrackAnalysis} from './sampleVoiceAnalysis.js'
import {createSupabaseAudioStorage} from './audioStorage.js'
import {readAuthConfiguration,verifyRequestUser} from './auth.js'
const fail=code=>new ServiceError('Voice Layer를 확인하지 못했어요. 제출 원본과 Mix는 유지됩니다.',{code})
const text=value=>typeof value==='string' && value.trim() && value.length<=128 && !/[\x00-\x1f]/.test(value)
const sha=value=>typeof value==='string' && /^[a-f0-9]{64}$/.test(value)
const hash=value=>createHash('sha256').update(canonicalIdentityInput(value)).digest('hex')
const headers={'Cache-Control':'private, no-store',Vary:'Authorization'}
export async function voiceGraphicsRpc(name,body,{env,fetchImpl,authorization}){
  if(env.IEUM_DB_PROVIDER!=='supabase')throw fail('SERVICE_NOT_CONFIGURED')
  const config=readAuthConfiguration(env),privileged=!authorization
  if(privileged && !env.IEUM_SUPABASE_SECRET_KEY)throw fail('SERVICE_NOT_CONFIGURED')
  let response
  try{response=await fetchImpl(`${config.url}/rest/v1/rpc/${name}`,{method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',
    signal:AbortSignal.timeout(10000),headers:{apikey:privileged?env.IEUM_SUPABASE_SECRET_KEY:config.publishableKey,
      ...(!privileged?{Authorization:authorization}:{}),'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)})}
  catch{throw fail('VOICE_LAYER_UNAVAILABLE')}
  if(!response.ok)throw fail(({400:'INVALID_VOICE_LAYER',401:'AUTH_REQUIRED',403:'VOICE_LAYER_FORBIDDEN',404:'VOICE_LAYER_NOT_FOUND',409:'VOICE_LAYER_CONFLICT'})[response.status] || 'VOICE_LAYER_UNAVAILABLE')
  try{return await response.json()}catch{throw fail('INVALID_VOICE_LAYER_RESPONSE')}
}
const rpc=voiceGraphicsRpc
export const submittedVoiceSourceRevision=(trackId,analysis)=>hash({trackId,version:analysis.version,sourceSha256:analysis.sourceSha256,
  byteLength:analysis.byteLength,audioReceipt:analysis.audioReceipt,featuresSha256:analysis.featuresSha256})
export function checkedTrackLayerReference(result,{projectId,partId,id,revision}={}){
  const ref=result?.ref,personal=result?.personalRef
  if(!result || Object.keys(result).length!==6 || result.resultStatus!=='stored' ||
    ![result.projectId,result.partId,result.projectSeed].every(text) || result.projectId!==projectId || result.partId!==partId ||
    !ref || Object.keys(ref).length!==5 || ![ref.id,ref.revision,ref.generatorVersion].every(text) || !sha(ref.inputDigest) || !sha(ref.outputSha256) ||
    !personal || Object.keys(personal).length!==5 || ![personal.id,personal.revision,personal.generatorVersion].every(text) || !sha(personal.inputDigest) || !sha(personal.outputSha256) ||
    (id!==undefined && ref.id!==id) || (revision!==undefined && ref.revision!==revision))throw fail('INVALID_VOICE_LAYER_RESPONSE')
  return structuredClone(result)
}
// Trusted generation worker only. Original bytes come from verified private
// Storage; the caller cannot submit client analysis or change Track/Mix state.
export async function storeReceivedTrackVoiceLayer({projectId,partId,userId,personalRef,generatorVersion,result},
  {env=process.env,fetchImpl=globalThis.fetch,maxOriginalBytes}={}){
  const personal=structuredClone(personalRef),received=structuredClone(result)
  if(![projectId,partId,generatorVersion,personal?.id,personal?.revision,received?.id,received?.revision].every(text) ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(userId || '') ||
    received.id.includes(userId) || !Number.isSafeInteger(maxOriginalBytes) || maxOriginalBytes<=0)throw fail('INVALID_VOICE_LAYER')
  const context=await rpc('ieum_get_track_voice_layer_context',{p_project_id:projectId,p_part_id:partId,p_user_id:userId,
    p_personal_id:personal.id,p_personal_revision:personal.revision},{env,fetchImpl})
  if(context?.projectId!==projectId || context.partId!==partId || context.trackId!==`${projectId}:${partId}` || context.userId!==userId ||
    !text(context.projectSeed) || canonicalIdentityInput(context.personalRef)!==canonicalIdentityInput(personal))throw fail('INVALID_VOICE_LAYER_RESPONSE')
  const analysis=checkedStoredTrackAnalysis(context)
  const sourceRevision=submittedVoiceSourceRevision(context.trackId,analysis)
  const trackInput=await buildTrackIdentityInput({trackId:context.trackId,identityRef:personal,generatorVersion,
    source:{recordId:context.trackId,purpose:'project-track',sha256:analysis.sourceSha256,analysisVersion:analysis.features.version,
      data:{projectId,partId,sourceRevision,verificationVersion:analysis.version,audioReceipt:analysis.audioReceipt,analysis:analysis.features,assessment:analysis.assessment}}})
  const controls=await prepareVoiceVisualControls(context.traits,{trackInput,personalResultRef:personal})
  if(received.inputDigest!==trackInput.inputDigest)throw fail('INVALID_VOICE_LAYER')
  const image=received.artifact?.blob
  if(!(image instanceof Blob) || image.type!=='image/png' || image.size<24 || image.size>8388608)throw fail('INVALID_VOICE_LAYER')
  const header=Buffer.from(await image.slice(0,24).arrayBuffer())
  if(header.subarray(0,8).toString('hex')!=='89504e470d0a1a0a' || header.readUInt32BE(16)!==512 || header.readUInt32BE(20)!==512)throw fail('INVALID_VOICE_LAYER')
  if(context.size>maxOriginalBytes)throw fail('VOICE_LAYER_MEMORY_BUDGET_EXCEEDED')
  const original=await createSupabaseAudioStorage({env,fetchImpl}).loadVerifiedOriginal(context.objectId,
    {size:context.size,sha256:context.sha256,contentType:context.contentType},maxOriginalBytes)
  const artifact=await validateAiVoiceLayer({projectId,partId,participantId:userId,blob:original,aiVoiceLayer:received.artifact},context.projectSeed)
  if(!artifact)throw fail('INVALID_VOICE_LAYER')
  const {blob,...metadata}=artifact,ref={id:received.id,revision:received.revision,generatorVersion,inputDigest:trackInput.inputDigest,outputSha256:artifact.outputSha256}
  const stored=checkedTrackLayerReference(await rpc('ieum_store_track_voice_layer',{p_project_id:projectId,p_part_id:partId,p_user_id:userId,
    p_result:{personalRef:personal,trackInput,controls,ref,artifact:metadata},p_png:Buffer.from(await blob.arrayBuffer()).toString('base64')},
    {env,fetchImpl}),{projectId,partId,id:ref.id,revision:ref.revision})
  if(canonicalIdentityInput(stored.ref)!==canonicalIdentityInput(ref) || canonicalIdentityInput(stored.personalRef)!==canonicalIdentityInput(personal) ||
    stored.projectSeed!==context.projectSeed)throw fail('INVALID_VOICE_LAYER_RESPONSE')
  return stored
}
export async function trackVoiceLayerRequest(request,{env=process.env,fetchImpl=globalThis.fetch}={}){
  await verifyRequestUser(request,{env,fetchImpl})
  const url=new URL(request.url)
  if(request.method!=='GET')throw fail('METHOD_NOT_ALLOWED')
  if(url.searchParams.size!==4)throw fail('INVALID_VOICE_LAYER')
  const projectId=url.searchParams.get('projectId'),partId=url.searchParams.get('partId')
  const id=url.searchParams.get('id'),revision=url.searchParams.get('revision')
  if(![projectId,partId,id,revision].every(text))throw fail('INVALID_VOICE_LAYER')
  const result=checkedTrackLayerReference(await rpc('ieum_get_owned_track_voice_layer',{p_project_id:projectId,p_part_id:partId,p_id:id,p_revision:revision},
    {env,fetchImpl,authorization:request.headers.get('authorization')}),{projectId,partId,id,revision})
  return Response.json(result,{headers})
}
export function trackVoiceLayerErrorResponse(error){
  const statuses={AUTH_REQUIRED:401,METHOD_NOT_ALLOWED:405,INVALID_VOICE_LAYER:400,VOICE_LAYER_FORBIDDEN:403,VOICE_LAYER_NOT_FOUND:404,
    VOICE_LAYER_CONFLICT:409,SERVICE_NOT_CONFIGURED:503,INVALID_SERVICE_CONFIGURATION:503,AUTH_UNAVAILABLE:503,INVALID_AUTH_RESPONSE:503,
    VOICE_LAYER_UNAVAILABLE:503,INVALID_VOICE_LAYER_RESPONSE:503,VOICE_LAYER_MEMORY_BUDGET_EXCEEDED:409}
  const code=Object.hasOwn(statuses,error?.code)?error.code:'VOICE_LAYER_UNAVAILABLE'
  return Response.json({error:{code}},{status:statuses[code],headers})
}
