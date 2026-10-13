import {ServiceError} from '../src/projectService.js'
import {validatePersonalIdentityResult,buildVoiceTraitSnapshot,buildVoiceRepresentationInputs} from '../src/voiceIdentityContract.js'
import {readAuthConfiguration,verifyRequestUser} from './auth.js'
import {trackVoiceLayerRequest,trackVoiceLayerErrorResponse} from './trackVoiceLayers.js'
import {projectVoiceRecordInputRequest,projectVoiceRecordInputErrorResponse} from './projectVoiceRecordInputs.js'
import {verifyGeneratedPng} from './generatedImageVerification.js'
const fail=code=>new ServiceError('Voice Identity 결과를 확인하지 못했어요. 기존 원본은 유지됩니다.',{code})
const text=value=>typeof value==='string' && value.trim() && value.length<=128 && !/[\x00-\x1f]/.test(value)
const sha=value=>typeof value==='string' && /^[a-f0-9]{64}$/.test(value)
const headers={'Cache-Control':'private, no-store',Vary:'Authorization'}
export function checkedIdentityReference(result,{id,revision}={}){
  const ref=result?.ref
  if(!result || Object.keys(result).length!==3 || result.resultStatus!=='stored' || !text(result.profileRevision) ||
    !ref || Object.keys(ref).length!==5 || ![ref.id,ref.revision,ref.generatorVersion].every(text) ||
    !sha(ref.inputDigest) || !sha(ref.outputSha256) || (id!==undefined && ref.id!==id) ||
    (revision!==undefined && ref.revision!==revision))throw fail('INVALID_IDENTITY_RESPONSE')
  return structuredClone(result)
}
async function rpc(name,body,{env,fetchImpl,authorization,privileged=false}){
  if(env.IEUM_DB_PROVIDER!=='supabase')throw fail('SERVICE_NOT_CONFIGURED')
  const config=readAuthConfiguration(env)
  if(privileged && !env.IEUM_SUPABASE_SECRET_KEY)throw fail('SERVICE_NOT_CONFIGURED')
  let response
  try{response=await fetchImpl(`${config.url}/rest/v1/rpc/${name}`,{
    method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000),
    headers:{apikey:privileged?env.IEUM_SUPABASE_SECRET_KEY:config.publishableKey,
      ...(!privileged?{Authorization:authorization}:{}),'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)})}
  catch{throw fail('IDENTITY_UNAVAILABLE')}
  if(!response.ok)throw fail(({400:'INVALID_IDENTITY_RESULT',401:'AUTH_REQUIRED',403:'AUTH_REQUIRED',404:'IDENTITY_RESULT_NOT_FOUND',409:'IDENTITY_REVISION_CONFLICT'})[response.status] || 'IDENTITY_UNAVAILABLE')
  try{return await response.json()}catch{throw fail('INVALID_IDENTITY_RESPONSE')}
}
// Trusted worker entry only. Never an upload/approval/selection API for clients.
export async function storeReceivedPersonalIdentity({manifest,artifact},{env=process.env,fetchImpl=globalThis.fetch}={}){
  const input=structuredClone(manifest),received=structuredClone(artifact)
  if(!text(received?.id) || !text(received.revision) || !text(input?.profileRevision) ||
    !text(input?.generatorVersion) || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(input?.userId || '') || received.id.includes(input.userId))throw fail('INVALID_IDENTITY_RESULT')
  const checked=await validatePersonalIdentityResult(input,received),traits=await buildVoiceTraitSnapshot(input)
  const {blob,...metadata}=checked
  const imageReceipt=await verifyGeneratedPng(blob,{executable:env.IEUM_IMAGE_DECODER_PATH || env.IEUM_AUDIO_DECODER_PATH})
  const result=await rpc('ieum_store_personal_identity_result',{p_user_id:input.userId,p_profile_revision:input.profileRevision,
    p_result:{manifest:input,artifact:metadata,traits,imageReceipt},p_png:Buffer.from(await blob.arrayBuffer()).toString('base64')},
    {env,fetchImpl,privileged:true})
  const saved=checkedIdentityReference(result,metadata)
  if(saved.profileRevision!==input.profileRevision || ['inputDigest','generatorVersion','outputSha256'].some(key=>saved.ref[key]!==metadata[key]))throw fail('INVALID_IDENTITY_RESPONSE')
  return saved
}
export async function personalIdentityRequest(request,{env=process.env,fetchImpl=globalThis.fetch}={}){
  await verifyRequestUser(request,{env,fetchImpl})
  if(request.method!=='GET')throw fail('METHOD_NOT_ALLOWED')
  const query=new URL(request.url).searchParams,id=query.get('id'),revision=query.get('revision')
  const includeTraits=query.get('include')==='traits'
  if(query.size!==(includeTraits?3:2) || (!includeTraits && query.has('include')) || !text(id) || !text(revision))throw fail('INVALID_IDENTITY_RESULT')
  const response=await rpc(includeTraits?'ieum_get_owned_personal_identity_traits':'ieum_get_owned_personal_identity_result',{p_id:id,p_revision:revision},
    {env,fetchImpl,authorization:request.headers.get('authorization')})
  const {traits,...metadata}=response || {},result=checkedIdentityReference(includeTraits?metadata:response,{id,revision})
  if(includeTraits){
    if(Object.keys(response).length!==4 || traits?.profileRevision!==result.profileRevision ||
      traits.personalInputDigest!==result.ref.inputDigest || traits.generatorVersion!==result.ref.generatorVersion)throw fail('INVALID_IDENTITY_RESPONSE')
    try{await buildVoiceRepresentationInputs(traits)}catch{throw fail('INVALID_IDENTITY_RESPONSE')}
    result.traits=structuredClone(traits)
  }
  return Response.json(result,{headers})
}
export function personalIdentityErrorResponse(error){
  const statuses={AUTH_REQUIRED:401,SERVICE_NOT_CONFIGURED:503,INVALID_SERVICE_CONFIGURATION:503,AUTH_UNAVAILABLE:503,INVALID_AUTH_RESPONSE:503,
    INVALID_IDENTITY_RESULT:400,IDENTITY_RESULT_NOT_FOUND:404,IDENTITY_REVISION_CONFLICT:409,IDENTITY_UNAVAILABLE:503,INVALID_IDENTITY_RESPONSE:503,METHOD_NOT_ALLOWED:405}
  const code=Object.hasOwn(statuses,error?.code)?error.code:'IDENTITY_UNAVAILABLE'
  return Response.json({error:{code}},{status:statuses[code],headers})
}
// Reuse the existing deployed function instead of adding serverless functions.
// The original personal-result request/response contract remains the default.
export async function voiceIdentityRouteRequest(request,options={}){
  const url=new URL(request.url),kinds=url.searchParams.getAll('kind'),kind=kinds[0]
  if(kinds.length===1 && ['track-layer','project-record'].includes(kind)){
    url.searchParams.delete('kind')
    const scoped=new Request(url,request)
    try{return kind==='track-layer'?await trackVoiceLayerRequest(scoped,options):await projectVoiceRecordInputRequest(scoped,options)}
    catch(error){return kind==='track-layer'?trackVoiceLayerErrorResponse(error):projectVoiceRecordInputErrorResponse(error)}
  }
  return personalIdentityRequest(request,options)
}
