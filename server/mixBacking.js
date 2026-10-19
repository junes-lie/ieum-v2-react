import {ServiceError} from '../src/projectService.js'
import {readAuthConfiguration} from './auth.js'
import {createSupabaseAudioStorage} from './audioStorage.js'
import {exactDecodedAudioReceipt} from './originalAudioVerification.js'

const fail=code=>new ServiceError('곡·Key에 맞는 반주 원본을 확인하지 못했어요. 제출 Track은 유지됩니다.',{code})
const keys=['songId','key','revision','duration','sourceSha256','backingSha256']
export function createProjectMixBackingLoader({jobId,env=process.env,fetchImpl=globalThis.fetch}) {
  if(typeof jobId!=='string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(jobId) || env.IEUM_DB_PROVIDER!=='supabase')throw fail('MIX_BACKING_UNAVAILABLE')
  const configuration=readAuthConfiguration(env),storage=createSupabaseAudioStorage({env,fetchImpl})
  return async(source,{maxBytes})=>{
    if(!Number.isSafeInteger(maxBytes) || maxBytes<=0)throw fail('MIX_MEMORY_BUDGET_EXCEEDED')
    let response,result
    try{response=await fetchImpl(`${configuration.url}/rest/v1/rpc/ieum_get_mix_backing`,{
      method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000),
      headers:{apikey:env.IEUM_SUPABASE_SECRET_KEY,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({p_job_id:jobId})})}
    catch{throw fail('PROJECT_UNAVAILABLE')}
    if(!response.ok)throw fail(({403:'MIX_WORKER_FORBIDDEN',404:'MIX_JOB_NOT_FOUND',409:'MIX_BACKING_UNAVAILABLE'})[response.status] || 'PROJECT_UNAVAILABLE')
    try{result=await response.json()}catch{throw fail('INVALID_MIX_RESPONSE')}
    if(result?.jobId!==jobId || !result.audioSourceRef || keys.some(key=>result.audioSourceRef[key]!==source[key]) ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(result.objectId || ''))throw fail('INVALID_MIX_RESPONSE')
    const receipt=exactDecodedAudioReceipt(result.receipt,{size:result.receipt?.size,sha256:source.backingSha256,contentType:result.receipt?.contentType})
    if(!Number.isSafeInteger(receipt.size) || receipt.size<=0 || typeof receipt.contentType!=='string' || !receipt.contentType.startsWith('audio/'))throw fail('INVALID_MIX_RESPONSE')
    const blob=await storage.loadVerifiedOriginal(result.objectId,{size:receipt.size,sha256:receipt.sha256,contentType:receipt.contentType},maxBytes)
    return {blob,receipt}
  }
}
