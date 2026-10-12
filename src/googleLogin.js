import {ServiceError} from './projectService.js'

const storageKey='ieum:google-pkce:v1'
const fail=code=>new ServiceError('로그인을 완료하지 못했어요. 기존 녹음과 프로필은 유지됩니다.',{code})
const base64url=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
const token=value=>typeof value==='string' && value.length>0 && value.length<=16384 && !/[\s,]/.test(value)
function originURL(value,local=false){
  let url
  try{url=new URL(value)}catch{throw fail('INVALID_AUTH_CONFIGURATION')}
  if((url.protocol!=='https:' && !(local && url.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname))) ||
    url.username || url.password || url.search || url.hash)throw fail('INVALID_AUTH_CONFIGURATION')
  return url
}
function publicKey(value){
  if(typeof value!=='string' || value.length>16384)throw fail('INVALID_AUTH_CONFIGURATION')
  if(/^sb_publishable_[A-Za-z0-9_-]+$/.test(value))return value
  try{
    const parts=value.split('.')
    if(parts.length===3 && JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon')return value
  }catch{}
  throw fail('INVALID_AUTH_CONFIGURATION')
}

// Preparation for the existing App/session, not a second login UI. Credentials
// are explicitly supplied; nothing is enabled from the existence of code/env.
// Only the temporary PKCE verifier/context crosses a redirect in sessionStorage.
export function createGoogleLogin({session,authUrl,publishableKey,appUrl,storage,fetchImpl=globalThis.fetch,
  cryptoImpl=globalThis.crypto,now=()=>Date.now(),setTimer=globalThis.setTimeout,clearTimer=globalThis.clearTimeout,onError=()=>{}}={}){
  const auth=originURL(authUrl),app=originURL(appUrl,true),key=publicKey(publishableKey)
  if(auth.pathname!=='/' || app.pathname!=='/' || typeof session?.connect!=='function' || typeof session?.disconnect!=='function' ||
    typeof storage?.getItem!=='function' || typeof storage?.setItem!=='function' || typeof storage?.removeItem!=='function' ||
    typeof cryptoImpl?.getRandomValues!=='function' || !cryptoImpl.subtle || typeof fetchImpl!=='function' ||
    typeof setTimer!=='function' || typeof clearTimer!=='function' || typeof onError!=='function')throw fail('INVALID_AUTH_CONFIGURATION')
  let generation=0,busy=false,active=null,timer=null
  const cancelTimer=()=>{if(timer!==null){clearTimer(timer);timer=null}}
  const check=version=>{if(version!==generation)throw fail('SESSION_CHANGED')}
  const clear=()=>{try{storage.removeItem(storageKey)}catch{throw fail('AUTH_STORAGE_UNAVAILABLE')}}
  const json=async(url,options={})=>{
    let response
    try{response=await fetchImpl(url,{...options,credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',cache:'no-store',signal:AbortSignal.timeout(10000)})}
    catch{throw fail('AUTH_UNAVAILABLE')}
    if(!response.ok)throw fail('AUTH_UNAVAILABLE')
    try{return await response.json()}catch{throw fail('INVALID_AUTH_RESPONSE')}
  }
  const ready=async()=>{
    const caps=await json(`${app.origin}/api/capabilities`)
    if(caps?.contractVersion!=='ieum-service-v1' || caps.mode!=='remote' || caps.authenticated!==true || caps.sharedProjects!==true)throw fail('SERVICE_NOT_READY')
  }
  const validTokens=result=>{
    if(!token(result?.access_token) || !token(result?.refresh_token) || result.token_type?.toLowerCase()!=='bearer' ||
      !Number.isSafeInteger(result.expires_in) || result.expires_in<=0 || !Number.isSafeInteger(now()+result.expires_in*1000))throw fail('INVALID_AUTH_RESPONSE')
  }
  const schedule=()=>{
    cancelTimer()
    if(!active)return
    const version=generation,remaining=active.expiresAt-now()
    if(remaining<=0){generation++;active=null;session.disconnect();try{onError({code:'AUTH_TOKEN_EXPIRED'})}catch{};return}
    const delay=Math.max(1,remaining-Math.min(30000,remaining/2))
    timer=setTimer(async()=>{
      timer=null
      if(version!==generation || !active)return
      if(busy){schedule();return}
      let attemptVersion=version
      try{const attempt=login.refresh();attemptVersion=generation;await attempt}
      catch(error){
        if(attemptVersion!==generation)return
        generation++;active=null;session.disconnect();cancelTimer()
        try{onError({code:error instanceof ServiceError?error.code:'AUTH_UNAVAILABLE'})}catch{}
      }
    },delay)
    timer?.unref?.()
  }
  const login={
    async begin(returnHash='#my'){
      if(busy)throw fail('AUTH_IN_PROGRESS')
      if(!/^#[a-z-]+$/.test(returnHash))throw fail('INVALID_AUTH_RETURN')
      busy=true
      const version=++generation
      try{
        await ready();check(version)
        const verifier=base64url(cryptoImpl.getRandomValues(new Uint8Array(32))),state=base64url(cryptoImpl.getRandomValues(new Uint8Array(32)))
        const challenge=base64url(new Uint8Array(await cryptoImpl.subtle.digest('SHA-256',new TextEncoder().encode(verifier))))
        check(version)
        const callback=new URL(app);callback.searchParams.set('ieum_auth_state',state)
        const pending={verifier,state,authOrigin:auth.origin,appOrigin:app.origin,returnHash,createdAt:now()}
        try{storage.setItem(storageKey,JSON.stringify(pending))}catch{throw fail('AUTH_STORAGE_UNAVAILABLE')}
        const authorize=new URL('/auth/v1/authorize',auth)
        authorize.searchParams.set('provider','google');authorize.searchParams.set('redirect_to',callback.href)
        authorize.searchParams.set('code_challenge',challenge);authorize.searchParams.set('code_challenge_method','s256')
        return {authorizeUrl:authorize.href}
      }finally{busy=false;if(active)schedule()}
    },
    async finish(callbackUrl,replaceURL){
      if(busy)throw fail('AUTH_IN_PROGRESS')
      busy=true;const version=++generation
      try{
        const callback=new URL(callbackUrl)
        if(callback.origin!==app.origin || callback.pathname!=='/' || callback.username || callback.password || callback.hash ||
          typeof replaceURL!=='function')throw fail('INVALID_AUTH_CALLBACK')
        let pending
        try{pending=JSON.parse(storage.getItem(storageKey))}catch{throw fail('AUTH_STORAGE_UNAVAILABLE')}
        // Clean the one-time code/error URL before any network request or UI work.
        replaceURL(new URL(pending?.returnHash && /^#[a-z-]+$/.test(pending.returnHash)?pending.returnHash:'#my',app).href)
        if(callback.searchParams.has('error')){clear();throw fail('AUTH_CANCELLED')}
        if(callback.searchParams.getAll('code').length!==1 || callback.searchParams.getAll('ieum_auth_state').length!==1 ||
          [...callback.searchParams.keys()].some(name=>!['code','ieum_auth_state','sb_flow_id'].includes(name)) ||
          !pending || pending.authOrigin!==auth.origin || pending.appOrigin!==app.origin ||
          !/^[A-Za-z0-9_-]{43}$/.test(pending.verifier || '') || callback.searchParams.get('ieum_auth_state')!==pending.state ||
          !Number.isFinite(pending.createdAt) || now()<pending.createdAt || now()-pending.createdAt>30*60*1000){clear();throw fail('INVALID_AUTH_CALLBACK')}
        const code=callback.searchParams.get('code')
        if(!token(code)){clear();throw fail('INVALID_AUTH_CALLBACK')}
        await ready();check(version)
        clear()
        const result=await json(`${auth.origin}/auth/v1/token?grant_type=pkce`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json',Accept:'application/json'},
          body:JSON.stringify({auth_code:code,code_verifier:pending.verifier})})
        check(version)
        validTokens(result)
        // Auth verifies the real user again. Never use OAuth response metadata as identity.
        const expiresAt=now()+result.expires_in*1000
        const connected=await session.connect(result.access_token,{expiresAt});check(version)
        active={accessToken:result.access_token,refreshToken:result.refresh_token,userId:connected.userId,expiresAt}
        schedule()
        return {session:connected,returnHash:pending.returnHash}
      }catch(error){
        if(error instanceof ServiceError)throw error
        throw fail('INVALID_AUTH_CALLBACK')
      }finally{busy=false;if(active)schedule()}
    },
    async refresh(){
      if(busy)throw fail('AUTH_IN_PROGRESS')
      if(!active)throw fail('AUTH_REQUIRED')
      busy=true;const version=++generation,previous=active
      cancelTimer()
      try{
        await ready();check(version)
        const result=await json(`${auth.origin}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({refresh_token:previous.refreshToken})})
        check(version);validTokens(result)
        if(typeof session.renew!=='function')throw fail('INVALID_AUTH_CONFIGURATION')
        const expiresAt=now()+result.expires_in*1000
        const connected=await session.renew(result.access_token,{expiresAt});check(version)
        if(connected.userId!==previous.userId){active=null;session.disconnect();throw fail('SESSION_CHANGED')}
        active={accessToken:result.access_token,refreshToken:result.refresh_token,userId:connected.userId,expiresAt}
        schedule()
        return {session:connected}
      }catch(error){
        if(version===generation){active=null;session.disconnect();cancelTimer()}
        throw error
      }finally{busy=false}
    },
    async logout(){
      const previous=active;generation++;active=null;cancelTimer();session.disconnect();clear()
      if(!previous)return
      // Revoke only this login. Local data never depends on the network result.
      let response
      try{response=await fetchImpl(`${auth.origin}/auth/v1/logout?scope=local`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${previous.accessToken}`},
        credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',cache:'no-store',signal:AbortSignal.timeout(10000)})}
      catch{throw fail('AUTH_UNAVAILABLE')}
      if(!response.ok && response.status!==401)throw fail('AUTH_UNAVAILABLE')
    },
    disconnect(){generation++;active=null;cancelTimer();session.disconnect();clear()}
  }
  return login
}
