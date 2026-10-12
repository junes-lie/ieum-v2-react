import assert from 'node:assert/strict'
import { verifyRequestUser, readAuthConfiguration, sessionResponse, serviceErrorResponse } from '../server/auth.js'
import { GET as getCapabilities } from '../api/capabilities.js'
import { GET as getSession, POST as postSession } from '../api/me/session.js'
import {createGoogleLogin} from '../src/googleLogin.js'
import {createServiceSession} from '../src/serviceSession.js'

const env = { IEUM_AUTH_PROVIDER: 'supabase', IEUM_SUPABASE_URL: 'https://example.supabase.co', IEUM_SUPABASE_PUBLISHABLE_KEY: 'qa-publishable' }
const request = authorization => new Request('https://ieum.example/api/me/session', { headers: authorization ? { Authorization: authorization } : {} })
const userId = '12345678-1234-1234-1234-123456789abc'
let requests = 0
const fetchImpl = async (url, init) => {
  requests++
  assert.equal(url, 'https://example.supabase.co/auth/v1/user')
  assert.equal(init.headers.Authorization, 'Bearer qa-token')
  assert.equal(init.headers.apikey, 'qa-publishable')
  assert.equal(init.redirect, 'error')
  assert.ok(init.signal)
  return Response.json({ id: userId, email: 'must-not-be-returned@example.invalid', user_metadata: { id: 'forged' } })
}
assert.deepEqual(await verifyRequestUser(request('Bearer qa-token'), { env, fetchImpl }), { id: userId })
for (const value of [undefined, 'Basic token', 'Bearer one two', 'Bearer token,token', 'Bearer ' + 'x'.repeat(16385)]) await assert.rejects(verifyRequestUser(request(value), { env, fetchImpl }), error => error.code === 'AUTH_REQUIRED')
assert.equal(requests, 1, 'Malformed auth must not reach the upstream')
for (const configuration of [{}, { ...env, IEUM_AUTH_PROVIDER: 'unapproved-provider' }, { ...env, IEUM_SUPABASE_URL: 'http://example.invalid' }, { ...env, IEUM_SUPABASE_URL: 'https://user:secret@example.invalid' }, { ...env, IEUM_SUPABASE_URL: 'https://example.invalid/?key=secret' }]) assert.throws(() => readAuthConfiguration(configuration))
for (const status of [401, 403]) await assert.rejects(verifyRequestUser(request('Bearer qa-token'), { env, fetchImpl: async () => new Response('secret diagnostic', { status }) }), error => error.code === 'AUTH_REQUIRED' && error.status === 401)
await assert.rejects(verifyRequestUser(request('Bearer qa-token'), { env, fetchImpl: async () => new Response('secret', { status: 500 }) }), error => error.code === 'AUTH_UNAVAILABLE')
await assert.rejects(verifyRequestUser(request('Bearer qa-token'), { env, fetchImpl: async () => { throw new Error('token=secret') } }), error => error.code === 'AUTH_UNAVAILABLE' && !error.message.includes('secret'))
for (const invalid of [{ id: 'jisun' }, {}]) await assert.rejects(verifyRequestUser(request('Bearer qa-token'), { env, fetchImpl: async () => Response.json(invalid) }), error => error.code === 'INVALID_AUTH_RESPONSE')
await assert.rejects(verifyRequestUser(request('Bearer qa-token'), { env, fetchImpl: async () => new Response('not json') }), error => error.code === 'INVALID_AUTH_RESPONSE')
const session = sessionResponse({ id: userId, email: 'private' })
assert.deepEqual(await session.json(), { authenticated: true, user: { id: userId } })
assert.equal(session.headers.get('cache-control'), 'private, no-store')
assert.equal(session.headers.get('vary'), 'Authorization')
const unauthenticated = await getSession(request())
assert.equal(unauthenticated.status, 401)
assert.deepEqual(await unauthenticated.json(), { error: { code: 'AUTH_REQUIRED' } })
const beforeProvider = process.env.IEUM_AUTH_PROVIDER
try {
  delete process.env.IEUM_AUTH_PROVIDER
  const response = await getSession(request('Bearer qa-token'))
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: { code: 'SERVICE_NOT_CONFIGURED' } })
} finally { if (beforeProvider !== undefined) process.env.IEUM_AUTH_PROVIDER = beforeProvider }
assert.equal(postSession().status, 405)
const capabilities = await getCapabilities().json()
for (const key of ['sharedProjects', 'authenticated', 'publicResults', 'push', 'aiVoiceLayers']) assert.equal(capabilities[key], false)
assert.equal(getCapabilities().headers.get('cache-control'), 'no-store')
assert.equal(serviceErrorResponse({ code: 'AUTH_UNAVAILABLE', message: 'token-secret' }).status, 503)
console.log('Server Auth: configured provider only, verified upstream identity, missing/invalid token denial, no secret echo/cache, unconfigured 503 and false capabilities passed. Injected Auth responses; no real account login claim.')

const memory=new Map(),storage={getItem:key=>memory.get(key) ?? null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)}
let ready=false,oauthCalls=[],clock=1000000,cleaned=null,tokenResult={access_token:'qa-token',refresh_token:'never-store',token_type:'bearer',expires_in:3600,user:{id:'forged-id'}},gate=null,refreshInputs=[],changedUser=false,logoutFails=false
const oauthFetch=async(url,init)=>{
  oauthCalls.push(url)
  assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error');assert.equal(init.referrerPolicy,'no-referrer')
  if(url.endsWith('/capabilities'))return Response.json({contractVersion:'ieum-service-v1',mode:ready?'remote':'preparation',authenticated:ready,sharedProjects:ready})
  if(url.endsWith('/auth/v1/token?grant_type=pkce')){
    assert.ok(cleaned && !cleaned.includes('code='),'Callback URL must be cleaned before exchanging the code')
    assert.equal(init.headers.apikey,'sb_publishable_qa');assert.equal(init.headers.Authorization,undefined)
    assert.equal(init.cache,'no-store');assert.ok(init.signal)
    const body=JSON.parse(init.body);assert.equal(body.auth_code,'one-time-code');assert.match(body.code_verifier,/^[A-Za-z0-9_-]{43}$/)
    if(gate)await gate.promise
    if(tokenResult instanceof Error)throw tokenResult
    return Response.json(tokenResult)
  }
  if(url.endsWith('/auth/v1/token?grant_type=refresh_token')){
    assert.equal(init.headers.apikey,'sb_publishable_qa');assert.equal(init.headers.Authorization,undefined)
    refreshInputs.push(JSON.parse(init.body));assert.equal(memory.size,0)
    return Response.json({access_token:'qa-token',refresh_token:'rotated-'+refreshInputs.length,token_type:'bearer',expires_in:3600})
  }
  if(url.endsWith('/auth/v1/logout?scope=local')){
    assert.equal(init.headers.Authorization,'Bearer qa-token');assert.equal(init.headers.apikey,'sb_publishable_qa')
    if(logoutFails)throw Error('private token diagnostic')
    return new Response(null,{status:204})
  }
  if(url.endsWith('/me/session')){
    const identity=await verifyRequestUser(new Request(url,init),{env,fetchImpl:changedUser?async()=>Response.json({id:'22222222-2222-4222-8222-222222222222'}):fetchImpl})
    return sessionResponse(identity)
  }
  throw Error('Unexpected OAuth route')
}
const oauthSession=createServiceSession({baseUrl:'https://ieum.example/api',fetchImpl:oauthFetch})
const settings={session:oauthSession,authUrl:env.IEUM_SUPABASE_URL,publishableKey:'sb_publishable_qa',appUrl:'https://ieum.example/',storage,fetchImpl:oauthFetch,now:()=>clock}
const login=createGoogleLogin(settings)
await assert.rejects(login.begin(),error=>error.code==='SERVICE_NOT_READY');assert.equal(memory.size,0)
ready=true
const callback=async()=>{
  cleaned=null
  const {authorizeUrl}=await login.begin('#workspace'),authorize=new URL(authorizeUrl)
  assert.equal(authorize.origin,env.IEUM_SUPABASE_URL);assert.equal(authorize.pathname,'/auth/v1/authorize')
  assert.equal(authorize.searchParams.get('provider'),'google');assert.equal(authorize.searchParams.get('code_challenge_method'),'s256')
  assert.ok(!authorizeUrl.includes('sb_publishable') && !authorizeUrl.includes('verifier'))
  const record=JSON.parse([...memory.values()][0]),challenge=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(record.verifier)))
  assert.equal(authorize.searchParams.get('code_challenge'),Buffer.from(challenge).toString('base64url'))
  assert.equal(record.returnHash,'#workspace');assert.ok(!JSON.stringify(record).includes('never-store'))
  const url=new URL(authorize.searchParams.get('redirect_to'));url.searchParams.set('code','one-time-code')
  return url
}
let url=await callback()
// New module instance represents return navigation with only a verifier/context persisted.
const returned=createGoogleLogin(settings)
const connected=await returned.finish(url.href,value=>{cleaned=value})
assert.equal(connected.session.userId,userId);assert.equal(connected.returnHash,'#workspace')
assert.equal(cleaned,'https://ieum.example/#workspace');assert.equal(memory.size,0)
assert.ok(!JSON.stringify(connected).includes('qa-token') && !JSON.stringify(connected).includes('never-store'))
const callsAfter=oauthCalls.length
await assert.rejects(returned.finish(url.href,value=>{cleaned=value}),error=>error.code==='INVALID_AUTH_CALLBACK')
assert.equal(oauthCalls.length,callsAfter)
assert.equal((await returned.refresh()).session.userId,userId)
assert.equal((await returned.refresh()).session.userId,userId)
assert.deepEqual(refreshInputs,[{refresh_token:'never-store'},{refresh_token:'rotated-1'}]);assert.equal(memory.size,0)
changedUser=true
await assert.rejects(returned.refresh(),error=>error.code==='SESSION_CHANGED')
assert.equal(oauthSession.snapshot().authenticated,false);changedUser=false
for(const change of [value=>value.searchParams.set('ieum_auth_state','wrong'),value=>value.searchParams.append('code','duplicate'),
  value=>value.searchParams.set('userId','forged'),value=>value.searchParams.set('access_token','must-not-accept')]){
  url=await callback();change(url);const before=oauthCalls.length
  await assert.rejects(login.finish(url.href,value=>{cleaned=value}),error=>error.code==='INVALID_AUTH_CALLBACK')
  assert.equal(oauthCalls.length,before);assert.equal(memory.size,0)
}
url=await callback();clock+=31*60*1000
await assert.rejects(login.finish(url.href,value=>{cleaned=value}),error=>error.code==='INVALID_AUTH_CALLBACK')
url=await callback();url.searchParams.set('error','access_denied');url.searchParams.set('error_description','private diagnostic')
await assert.rejects(login.finish(url.href,value=>{cleaned=value}),error=>error.code==='AUTH_CANCELLED' && !error.message.includes('diagnostic'))
assert.equal(memory.size,0)
url=await callback();tokenResult=new Error('private verifier/token url')
await assert.rejects(login.finish(url.href,value=>{cleaned=value}),error=>error.code==='AUTH_UNAVAILABLE' && !error.message.includes('verifier'))
assert.equal(memory.size,0)
url=await callback();tokenResult={access_token:'wrong token',token_type:'bearer',expires_in:3600}
await assert.rejects(login.finish(url.href,value=>{cleaned=value}),error=>error.code==='INVALID_AUTH_RESPONSE')
url=await callback();tokenResult={access_token:'qa-token',refresh_token:'never-store',token_type:'bearer',expires_in:3600}
let releaseToken;gate={promise:new Promise(resolve=>{releaseToken=resolve})}
const inFlight=login.finish(url.href,value=>{cleaned=value})
await new Promise(resolve=>setTimeout(resolve,0))
await assert.rejects(login.finish(url.href,value=>{cleaned=value}),error=>error.code==='AUTH_IN_PROGRESS')
await assert.rejects(login.begin(),error=>error.code==='AUTH_IN_PROGRESS')
login.disconnect();releaseToken()
await assert.rejects(inFlight,error=>error.code==='SESSION_CHANGED');gate=null
assert.equal(oauthSession.snapshot().authenticated,false);assert.equal(memory.size,0)
url=await callback();await login.finish(url.href,value=>{cleaned=value})
await login.logout();assert.equal(oauthSession.snapshot().authenticated,false);assert.equal(memory.size,0)
url=await callback();await login.finish(url.href,value=>{cleaned=value});logoutFails=true
await assert.rejects(login.logout(),error=>error.code==='AUTH_UNAVAILABLE' && !error.message.includes('diagnostic'))
assert.equal(oauthSession.snapshot().authenticated,false);assert.equal(memory.size,0)
for(const configuration of [{...settings,publishableKey:'sb_secret_do_not_expose'},{...settings,authUrl:'http://unsafe.invalid'},
  {...settings,appUrl:'https://ieum.example/?redirect=https://external.invalid'},
  {...settings,publishableKey:`a.${Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')}.c`}])assert.throws(()=>createGoogleLogin(configuration),error=>error.code==='INVALID_AUTH_CONFIGURATION')
console.log('PASS Google PKCE bridge: real SHA256/random challenge, same-tab verifier/context only, readiness gate, one-time callback/state/origin/expiry and URL cleanup, existing server-verified user/session, refresh rotation/user-change denial, local logout on server failure, cancellation/replay/secret config/logout concurrency denial. Injected OAuth, not actual Google/project/App activation or automatic refresh/reload persistence.')
