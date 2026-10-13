import {ServiceError} from '../src/projectService.js'
import {canonicalIdentityInput,buildProjectRecordInput} from '../src/voiceIdentityContract.js'
import {checkedStoredTrackAnalysis} from './sampleVoiceAnalysis.js'
import {voiceGraphicsRpc,submittedVoiceSourceRevision,trackVoiceLayerErrorResponse} from './trackVoiceLayers.js'
import {verifyRequestUser} from './auth.js'
const fail=()=>new ServiceError('Record 입력을 확인하지 못했어요. 제출 원본과 Mix는 유지됩니다.',{code:'INVALID_VOICE_LAYER_RESPONSE'})
const text=value=>typeof value==='string' && value.trim() && value.length<=128 && !/[\x00-\x1f]/.test(value)
export async function checkedProjectVoiceRecordInput(result,{projectId,inputDigest}={}){
  if(!result || Object.keys(result).length!==3 || result.projectId!==projectId || !/^[a-f0-9]{64}$/.test(result.inputDigest || '') ||
    (inputDigest!==undefined && result.inputDigest!==inputDigest) || result.input?.projectId!==projectId ||
    result.input.inputDigest!==result.inputDigest || !Array.isArray(result.input.layers))throw fail()
  const input=result.input
  let rebuilt
  try{rebuilt=await buildProjectRecordInput({projectId,projectSeed:input.projectSeed,partIds:input.partIds,generatorVersion:input.generatorVersion,
    tracks:input.layers.map(layer=>({id:layer.trackId,revision:layer.trackRevision,projectId,partId:layer.partId,
      submissionStatus:'success',layerStatus:layer.layerRef?'success':'pending',layerRef:layer.layerRef}))})}
  catch{throw fail()}
  if(canonicalIdentityInput(rebuilt)!==canonicalIdentityInput(input))throw fail()
  return structuredClone(result)
}
// Trusted worker takes explicit layer revisions. Missing layers stay pending;
// neither a latest-result selector nor an artwork/Mix success is invented.
export async function persistRemoteProjectVoiceRecordInput({projectId,layerRefs={},generatorVersion},
  {env=process.env,fetchImpl=globalThis.fetch}={}){
  const refs=structuredClone(layerRefs),options={env,fetchImpl}
  if(![projectId,generatorVersion].every(text) || !refs || Array.isArray(refs) || typeof refs!=='object')throw fail()
  const context=await voiceGraphicsRpc('ieum_get_project_voice_record_context',{p_project_id:projectId,p_layer_refs:refs},options)
  if(context?.projectId!==projectId || Object.keys(context).length!==5 || !text(context.projectSeed) || !Array.isArray(context.tracks) ||
    !Number.isSafeInteger(context.projectRevision) || context.projectRevision<0)throw fail()
  const tracks=[],sources={}
  for(const entry of context.tracks){
    const wanted=refs[entry.partId]
    if(entry.trackId!==`${projectId}:${entry.partId}` || (wanted?
      ['id','revision','generatorVersion','outputSha256'].some(key=>entry.layerRef?.[key]!==wanted[key]) ||
        (wanted.inputDigest!==undefined && wanted.inputDigest!==entry.layerRef?.inputDigest):entry.layerRef!==null))throw fail()
    const analysis=checkedStoredTrackAnalysis(entry),sourceRevision=submittedVoiceSourceRevision(entry.trackId,analysis)
    sources[entry.trackId]={sourceRevision,sha256:analysis.sourceSha256,byteLength:analysis.byteLength,
      featuresSha256:analysis.featuresSha256,audioReceipt:analysis.audioReceipt}
    tracks.push({id:entry.trackId,revision:sourceRevision,projectId,partId:entry.partId,submissionStatus:'success',
      layerStatus:entry.layerRef?'success':'pending',layerRef:entry.layerRef})
  }
  const input=await buildProjectRecordInput({projectId,projectSeed:context.projectSeed,partIds:context.partIds,tracks,generatorVersion})
  const stored=await checkedProjectVoiceRecordInput(await voiceGraphicsRpc('ieum_store_project_voice_record_input',{
    p_project_id:projectId,p_expected_revision:context.projectRevision,p_input:input,p_sources:sources,p_layer_refs:refs},options),{projectId,inputDigest:input.inputDigest})
  if(canonicalIdentityInput(stored.input)!==canonicalIdentityInput(input))throw fail()
  return stored
}
export async function projectVoiceRecordInputRequest(request,{env=process.env,fetchImpl=globalThis.fetch}={}){
  await verifyRequestUser(request,{env,fetchImpl})
  if(request.method!=='GET')throw new ServiceError('조회만 지원합니다.',{code:'METHOD_NOT_ALLOWED'})
  const query=new URL(request.url).searchParams,projectId=query.get('projectId'),inputDigest=query.get('inputDigest')
  if(query.size!==2 || !text(projectId) || !/^[a-f0-9]{64}$/.test(inputDigest || ''))throw new ServiceError('Record 참조가 올바르지 않습니다.',{code:'INVALID_VOICE_LAYER'})
  const result=await checkedProjectVoiceRecordInput(await voiceGraphicsRpc('ieum_get_project_voice_record_input',{
    p_project_id:projectId,p_input_digest:inputDigest},{env,fetchImpl,authorization:request.headers.get('authorization')}),{projectId,inputDigest})
  return Response.json(result,{headers:{'Cache-Control':'private, no-store',Vary:'Authorization'}})
}
export const projectVoiceRecordInputErrorResponse=trackVoiceLayerErrorResponse
