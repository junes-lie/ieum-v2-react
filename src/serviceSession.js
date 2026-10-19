import { createRemoteProjectService,ServiceError } from './projectService.js'

const fail=code=>new ServiceError('연결된 사용자를 다시 확인해 주세요. 녹음 원본은 유지됩니다.',{code})
const uuid=value=>typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)

// Explicit remote session boundary for the existing transport. No token is
// persisted, no local/demo state is imported, and disconnect never deletes data.
export function createServiceSession({baseUrl,fetchImpl=globalThis.fetch,now=()=>Date.now()}={}) {
  let revision=0,active=null,expiredUserId=null,renewal=0
  const expire=()=>{if(active && active.expiresAt!==null && now()>=active.expiresAt){expiredUserId=active.userId;revision++;active=null}}
  const deadline=options=>{
    const value=options?.expiresAt ?? null
    if(value!==null && (!Number.isSafeInteger(value) || value<=now()))throw fail('AUTH_TOKEN_EXPIRED')
    return value
  }
  const safeFetch=async(url,options)=>{
    try{return await fetchImpl(url,{...options,redirect:'error',credentials:'omit',referrerPolicy:'no-referrer'})}
    catch{throw fail('NETWORK_ERROR')}
  }
  const anonymous=createRemoteProjectService({baseUrl,fetchImpl:safeFetch,getAccessToken:()=>null})
  const assertCurrent=(version,userId)=>{
    expire()
    if(!active || revision!==version || active.userId!==userId)throw fail('SESSION_CHANGED')
  }
  return {
    snapshot:()=>{expire();return active?{mode:'remote',authenticated:true,userId:active.userId}:{mode:'disconnected',authenticated:false,userId:null}},
    disconnect(){revision++;active=null;expiredUserId=null;renewal++},
    async connect(accessToken,options){
      const version=++revision;active=null;expiredUserId=null;renewal++
      const expiresAt=deadline(options)
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
      if(expiresAt!==null && now()>=expiresAt)throw fail('AUTH_TOKEN_EXPIRED')
      active={userId:session.user.id,service:remote,expiresAt};expiredUserId=null
      return {mode:'remote',authenticated:true,userId:session.user.id}
    },
    async renew(accessToken,options){
      expire()
      const userId=active?.userId || expiredUserId
      if(!userId)throw fail('AUTH_REQUIRED')
      let version=revision,verifying=true
      const expiresAt=deadline(options),attempt=++renewal
      const assertRenewal=()=>{
        expire()
        // An expiry invalidates old scopes, but a newly verified token may open
        // a fresh scope for that same user. Explicit logout clears this context.
        if(revision===version+1 && !active && expiredUserId===userId)version=revision
        if(revision!==version || renewal!==attempt || (active?.userId || expiredUserId)!==userId)throw fail('SESSION_CHANGED')
      }
      if(expiresAt===null || typeof accessToken!=='string' || !accessToken || /[\s,]/.test(accessToken) || accessToken.length>16384)throw fail('AUTH_REQUIRED')
      const remote=createRemoteProjectService({baseUrl,fetchImpl:(...args)=>{
        if(verifying)assertRenewal();else assertCurrent(version,userId)
        return safeFetch(...args)
      },getAccessToken:()=>accessToken})
      let verified
      try{verified=await remote.getSession()}catch(error){assertRenewal();throw error}
      assertRenewal()
      if(verified?.authenticated!==true || !uuid(verified.user?.id))throw fail('INVALID_SESSION_RESPONSE')
      if(verified.user.id!==userId){revision++;active=null;expiredUserId=null;throw fail('SESSION_CHANGED')}
      if(now()>=expiresAt)throw fail('AUTH_TOKEN_EXPIRED')
      // Same verified user, same operation epoch. Requests already in flight keep
      // their identity, while the next request uses the freshly verified token.
      active={userId,service:remote,expiresAt};expiredUserId=null;verifying=false
      return {mode:'remote',authenticated:true,userId}
    },
    async run(operation){
      expire()
      if(!active)throw fail('AUTH_REQUIRED')
      if(typeof operation!=='function')throw fail('INVALID_SESSION_OPERATION')
      const version=revision,{userId,service}=active
      const check=()=>assertCurrent(version,userId)
      const scoped=Object.fromEntries(Object.entries(service).map(([key,value])=>[key,typeof value!=='function'?value:async(...args)=>{
        check()
        // Public calls always use the anonymous transport, independent of session.
        const target=['discover','getResult','getCatalog','discoverProjects'].includes(key)?anonymous:active.service
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
