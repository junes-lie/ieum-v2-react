import {ServiceError} from '../src/projectService.js'
import {readAuthConfiguration} from './auth.js'
import {createSupabaseAudioStorage} from './audioStorage.js'
import {exactDecodedAudioReceipt} from './originalAudioVerification.js'
import {renderProjectMix} from './mixRenderer.js'
import {persistProjectMix} from './mixCompletion.js'
import {createProjectMixBackingLoader} from './mixBacking.js'

const fail=code=>new ServiceError('Mix 실행을 완료하지 못했어요. 제출 원본은 유지됩니다.',{code})
const uuid=value=>typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)
const referenceKeys=['songId','key','revision','duration','sourceSha256','backingSha256']

// Internal job entry, not an HTTP handler. loadBacking is a trusted server
// catalog adapter, never a URL/Blob/receipt supplied by a browser. No runtime
// installation, scheduler activation or synthetic backing fallback here.
export async function executeProjectMix(input,{env=process.env,fetchImpl=globalThis.fetch,rendererOptions,loadBacking,leaseToken}={}) {
  if(!input || Object.keys(input).length!==1 || !uuid(input.jobId))throw fail('INVALID_MIX_INPUT')
  if(env.IEUM_DB_PROVIDER!=='supabase' || (loadBacking!==undefined && typeof loadBacking!=='function') ||
    !Number.isSafeInteger(rendererOptions?.maxInputBytes) || rendererOptions.maxInputBytes<=0)throw fail('MIX_RUNTIME_NOT_CONFIGURED')
  const jobId=input.jobId,configuration=readAuthConfiguration(env),storage=createSupabaseAudioStorage({env,fetchImpl})
  let response,context
  try{response=await fetchImpl(`${configuration.url}/rest/v1/rpc/ieum_get_mix_render_context`,{
    method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000),
    headers:{apikey:env.IEUM_SUPABASE_SECRET_KEY,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({p_job_id:jobId})})}
  catch{throw fail('PROJECT_UNAVAILABLE')}
  if(!response.ok)throw fail(({403:'MIX_WORKER_FORBIDDEN',404:'MIX_JOB_NOT_FOUND',409:'MIX_INPUT_CONFLICT'})[response.status] || 'PROJECT_UNAVAILABLE')
  try{context=await response.json()}catch{throw fail('INVALID_MIX_RESPONSE')}
  const source=context?.audioSourceRef,partIds=context?.partIds,tracks=context?.tracks
  if(context?.jobId!==jobId || typeof context.projectId!=='string' || !context.projectId || typeof context.projectSeed!=='string' || !context.projectSeed ||
    !['queued','processing','failed','succeeded'].includes(context.status) || !source ||
    ['songId','key','revision'].some(key=>typeof source[key]!=='string'||!source[key]) ||
    !Number.isFinite(source.duration) || source.duration<=0 ||
    ['sourceSha256','backingSha256'].some(key=>!(/^[a-f0-9]{64}$/.test(source[key] || ''))) ||
    !Array.isArray(partIds) || ![2,3,4].includes(partIds.length) || context.partCount!==partIds.length || new Set(partIds).size!==partIds.length || partIds.some(id=>typeof id!=='string'||!id) ||
    !Array.isArray(tracks) || tracks.length!==partIds.length || !Array.isArray(context.trackIds) || context.trackIds.length!==tracks.length ||
    tracks.some((track,i)=>track?.id!==context.trackIds[i] || track.id!==`${context.projectId}:${partIds[i]}` || track.partId!==partIds[i] ||
      track.projectId!==context.projectId || track.kind!=='submitted-track' || track.submitted!==true || !uuid(track.objectId) ||
      !track.audioSourceRef || referenceKeys.some(key=>track.audioSourceRef[key]!==source[key])))throw fail('INVALID_MIX_RESPONSE')
  let bytes=0
  for(const track of tracks){
    exactDecodedAudioReceipt(track.receipt,{size:track.size,sha256:track.sha256,contentType:track.contentType})
    if(!Number.isSafeInteger(track.size) || track.size<=0)throw fail('INVALID_MIX_RESPONSE')
    bytes+=track.size
  }
  if(bytes>rendererOptions.maxInputBytes)throw fail('MIX_MEMORY_BUDGET_EXCEEDED')
  const resolveBacking=loadBacking || createProjectMixBackingLoader({jobId,env,fetchImpl})
  const backing=await resolveBacking(Object.freeze(structuredClone(source)),{maxBytes:rendererOptions.maxInputBytes-bytes})
  if(!(backing?.blob instanceof Blob) || backing.blob.size+bytes>rendererOptions.maxInputBytes)throw fail('MIX_MEMORY_BUDGET_EXCEEDED')
  exactDecodedAudioReceipt(backing.receipt,{size:backing.blob.size,sha256:source.backingSha256,contentType:backing.blob.type})
  // Download sequentially, validating the actual private Storage stream once.
  const originals=[]
  for(const track of tracks)originals.push({...track,blob:await storage.loadVerifiedOriginal(track.objectId,
    {size:track.size,sha256:track.sha256,contentType:track.contentType},rendererOptions.maxInputBytes)})
  const rendered=await renderProjectMix({project:{id:context.projectId,seed:context.projectSeed,partIds,audioSourceRef:source},tracks:originals,backing},rendererOptions)
  // Upload/decode/current job snapshot revalidation must succeed before SQL
  // changes Project lifecycle to completed. A generated Blob alone is not success.
  return persistProjectMix({jobId,blob:rendered.blob},{env,fetchImpl,leaseToken})
}
