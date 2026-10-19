import {ServiceError} from '../src/projectService.js'
import {readAuthConfiguration} from './auth.js'
import {executeProjectMix} from './mixExecution.js'
import {validateMixRuntime} from './mixRenderer.js'
import {createSupabaseAudioStorage} from './audioStorage.js'

const fail=code=>new ServiceError('Mix job을 실행하지 못했어요. 제출 원본은 유지됩니다.',{code})
const uuid=value=>typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)
// One host-scheduled iteration. No timer/cron is started at import time. The
// host chooses its cadence/resource limits. Failed jobs require an explicit
// service-side retry ID; this does not invent an unbounded retry policy or UI.
export async function runNextProjectMix({env=process.env,fetchImpl=globalThis.fetch,rendererOptions,leaseSeconds,retryJobId}={}) {
  if(env.IEUM_DB_PROVIDER!=='supabase' || !Number.isInteger(leaseSeconds) || leaseSeconds<30 || leaseSeconds>3600 ||
    (retryJobId!==undefined && !uuid(retryJobId)))throw fail('MIX_RUNTIME_NOT_CONFIGURED')
  const configuration=readAuthConfiguration(env)
  createSupabaseAudioStorage({env,fetchImpl}) // Validate private config before claiming.
  await validateMixRuntime(rendererOptions)
  const rpc=async(name,body)=>{
    let response
    try{response=await fetchImpl(`${configuration.url}/rest/v1/rpc/${name}`,{
      method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000),
      headers:{apikey:env.IEUM_SUPABASE_SECRET_KEY,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)})}
    catch{throw fail('PROJECT_UNAVAILABLE')}
    if(!response.ok)throw fail('MIX_JOB_UNAVAILABLE')
    try{return await response.json()}catch{throw fail('INVALID_MIX_RESPONSE')}
  }
  const claim=await rpc('ieum_claim_mix_job',{p_lease_seconds:leaseSeconds,p_job_id:retryJobId || null})
  if(claim===null)return {status:'idle'}
  if(!uuid(claim?.jobId) || !uuid(claim.leaseToken))throw fail('INVALID_MIX_RESPONSE')
  const identity={p_job_id:claim.jobId,p_lease_token:claim.leaseToken}
  let renewing=false
  const timer=setInterval(async()=>{
    if(renewing)return;renewing=true
    try{await rpc('ieum_renew_mix_job',{...identity,p_lease_seconds:leaseSeconds})}catch{/* Completion is fenced by the actual DB lease. */}
    finally{renewing=false}
  },Math.floor(leaseSeconds*1000/3))
  try{
    const result=await executeProjectMix({jobId:claim.jobId},{env,fetchImpl,rendererOptions,leaseToken:claim.leaseToken})
    return {status:'completed',...result}
  }catch(error){
    // Conditional failure cannot downgrade a newer claim or actual success.
    await rpc('ieum_fail_mix_job',identity).catch(()=>{})
    throw error
  }finally{clearInterval(timer)}
}
