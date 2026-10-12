import {isAbsolute} from 'node:path'
import {ServiceError} from '../src/projectService.js'
import {readAuthConfiguration} from './auth.js'
import {createSupabaseAudioStorage} from './audioStorage.js'

const fail=(code,status=409)=>new ServiceError('Mix 결과를 확정하지 못했어요. 제출 원본과 저장 결과는 유지됩니다.',{code,status})
const uuid=value=>typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)
const hash=value=>typeof value==='string' && /^[a-f0-9]{64}$/.test(value)
const text=value=>typeof value==='string' && Boolean(value.trim())

// Server-only post-render boundary. This does not render/upload a Mix, accept
// browser completion claims, or activate an unconfigured background worker.
export async function completeStoredProjectMix(input,{env=process.env,fetchImpl=globalThis.fetch}={}) {
  if(!input || Array.isArray(input) || Object.keys(input).length!==3 ||
    Object.keys(input).some(key=>!['jobId','objectId','sha256'].includes(key)) || !uuid(input.jobId) || !uuid(input.objectId) || !hash(input.sha256))
    throw fail('INVALID_MIX_RESULT',400)
  if(env.IEUM_DB_PROVIDER!=='supabase')throw fail('SERVICE_NOT_CONFIGURED',503)
  const configuration=readAuthConfiguration(env),storage=createSupabaseAudioStorage({env,fetchImpl})
  const executable=env.IEUM_AUDIO_DECODER_PATH,maxDurationSeconds=Number(env.IEUM_AUDIO_MAX_DECODE_SECONDS),maxBytes=Number(env.IEUM_MIX_MAX_BYTES)
  if(typeof executable!=='string' || !isAbsolute(executable) || !Number.isFinite(maxDurationSeconds) || maxDurationSeconds<=0 ||
    !Number.isSafeInteger(maxBytes) || maxBytes<=0)throw fail('AUDIO_DECODER_NOT_CONFIGURED',503)
  const rpc=async(name,body)=>{
    let response
    try{response=await fetchImpl(`${configuration.url}/rest/v1/rpc/${name}`,{method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',
      signal:AbortSignal.timeout(10000),headers:{apikey:env.IEUM_SUPABASE_SECRET_KEY,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)})}
    catch{throw fail('PROJECT_UNAVAILABLE',503)}
    if(!response.ok)throw fail(({400:'INVALID_MIX_RESULT',403:'MIX_WORKER_FORBIDDEN',404:'MIX_JOB_NOT_FOUND',409:'MIX_RESULT_CONFLICT'})[response.status] || 'PROJECT_UNAVAILABLE',response.status)
    try{return await response.json()}catch{throw fail('INVALID_MIX_RESPONSE',503)}
  }
  const context=await rpc('ieum_get_mix_completion_context',{p_job_id:input.jobId}),source=context?.audioSourceRef
  if(context?.jobId!==input.jobId || !text(context.projectId) || !text(context.projectSeed) || ![2,3,4].includes(context.partCount) ||
    !Array.isArray(context.trackIds) || context.trackIds.length!==context.partCount || new Set(context.trackIds).size!==context.partCount ||
    context.trackIds.some(id=>!text(id) || !id.startsWith(`${context.projectId}:`) || id.length<=context.projectId.length+1) ||
    !source || Array.isArray(source) || !text(source.songId) || !text(source.key) || !text(source.revision) ||
    !Number.isFinite(source.duration) || source.duration<=0 || !hash(source.sourceSha256) || !hash(source.backingSha256) ||
    !['queued','processing','failed','succeeded'].includes(context.status) || (context.status!=='succeeded' && context.result!==null))
    throw fail('INVALID_MIX_RESPONSE',503)
  if(context.status==='succeeded' && (context.result?.objectId!==input.objectId || context.result.sha256!==input.sha256 ||
    !Number.isFinite(context.result.duration) || context.result.duration<=0))throw fail('MIX_RESULT_CONFLICT')
  // Ownership/current job lookup precedes private Storage access. Never trust a
  // worker's claimed duration, file size, MIME, or browser-selected decoder path.
  const receipt=await storage.verifyOriginalAudio(input.objectId,{sha256:input.sha256,maxBytes},{executable,maxDurationSeconds})
  if(context.status==='succeeded' && Math.abs(context.result.duration-receipt.duration)>1/receipt.sampleRate)throw fail('MIX_RESULT_CONFLICT')
  const duration=context.status==='succeeded'?context.result.duration:receipt.duration
  const completed=await rpc('ieum_complete_verified_mix',{p_job_id:input.jobId,p_object_id:input.objectId,p_sha256:receipt.sha256,p_duration:duration})
  if(completed?.jobId!==input.jobId || completed.projectId!==context.projectId || completed.lifecycle!=='completed')throw fail('INVALID_MIX_RESPONSE',503)
  return {projectId:context.projectId,jobId:input.jobId,lifecycle:'completed',receipt}
}
