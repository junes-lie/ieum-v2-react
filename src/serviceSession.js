import { createRemoteProjectService,ServiceError } from './projectService.js'

const fail=code=>new ServiceError('연결된 사용자를 다시 확인해 주세요. 녹음 원본은 유지됩니다.',{code})
const uuid=value=>typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)

// Explicit remote session boundary for the existing transport. No token is
// persisted, no local/demo state is imported, and disconnect never deletes data.
export function createServiceSession({baseUrl,fetchImpl=globalThis.fetch}={}) {
  let revision=0,active=null
  const safeFetch=async(url,options)=>{
    try{return await fetchImpl(url,{...options,redirect:'error',credentials:'omit',referrerPolicy:'no-referrer'})}
    catch{throw fail('NETWORK_ERROR')}
  }
  const anonymous=createRemoteProjectService({baseUrl,fetchImpl:safeFetch,getAccessToken:()=>null})
  const assertCurrent=(version,userId)=>{
    if(!active || revision!==version || active.userId!==userId)throw fail('SESSION_CHANGED')
  }
  return {
    snapshot:()=>active?{mode:'remote',authenticated:true,userId:active.userId}:{mode:'disconnected',authenticated:false,userId:null},
    disconnect(){revision++;active=null},
    async connect(accessToken){
      const version=++revision;active=null
      if(typeof accessToken!=='string' || !accessToken || /[\s,]/.test(accessToken) || accessToken.length>16384)throw fail('AUTH_REQUIRED')
      const capabilities=await anonymous.discover()
      if(revision!==version)throw fail('SESSION_CHANGED')
      if(capabilities?.contractVersion!=='ieum-service-v1' || capabilities.mode!=='remote' ||
        capabilities.authenticated!==true || capabilities.sharedProjects!==true)throw fail('SERVICE_NOT_READY')
      const remote=createRemoteProjectService({baseUrl,fetchImpl:(...args)=>{
        if(revision!==version)throw fail('SESSION_CHANGED')
        return safeFetch(...args)
      },getAccessToken:()=>accessToken})
      const session=await remote.getSession()
      if(revision!==version)throw fail('SESSION_CHANGED')
      if(session?.authenticated!==true || !uuid(session.user?.id))throw fail('INVALID_SESSION_RESPONSE')
      active={userId:session.user.id,service:remote}
      return {mode:'remote',authenticated:true,userId:session.user.id}
    },
    async run(operation){
      if(!active)throw fail('AUTH_REQUIRED')
      if(typeof operation!=='function')throw fail('INVALID_SESSION_OPERATION')
      const version=revision,{userId,service}=active
      const check=()=>assertCurrent(version,userId)
      const scoped=Object.fromEntries(Object.entries(service).map(([key,value])=>[key,typeof value!=='function'?value:async(...args)=>{
        check()
        // Public calls always use the anonymous transport, independent of session.
        const target=['discover','getResult','getCatalog'].includes(key)?anonymous:service
        let result
        try{result=await target[key](...args)}catch(error){check();throw error}
        check()
        return result
      }]))
      const result=await operation({userId,service:scoped,assertCurrent:check,
        stateKey:base=>{check();if(typeof base!=='string' || !base.trim())throw fail('INVALID_LOCAL_STATE');return `${base}:remote:${userId}`}})
      check()
      return result
    }
  }
}
