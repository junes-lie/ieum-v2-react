import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createServiceSession} from '../src/serviceSession.js'
import {transferAndSubmitTrack} from '../src/trackTransfer.js'
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222'
let mode='remote',calls=[],hold=null,invalidUser=false
const fetchImpl=async(url,options)=>{
  assert.equal(options.redirect,'error');assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer')
  calls.push({url,token:options.headers.Authorization})
  if(url.endsWith('/capabilities')){assert.equal(options.headers.Authorization,undefined);return Response.json({contractVersion:'ieum-service-v1',mode,authenticated:mode==='remote',sharedProjects:mode==='remote'})}
  if(url.endsWith('/me/session'))return Response.json({authenticated:true,user:{id:invalidUser?'demo-user':options.headers.Authorization==='Bearer token-a'?a:b}})
  if(url.endsWith('/me/profile')){if(hold)await hold.promise;return Response.json({roles:[],revision:0})}
  if(url.endsWith('/upload-intents'))return Response.json({uploadIntentId:'intent-a'})
  if(url.endsWith('/tracks'))return Response.json({submissionStatus:'success',trackId:'p:lead',duration:0.512})
  throw new Error('Unexpected route')
}
const session=createServiceSession({baseUrl:'https://ieum.example/api',fetchImpl})
assert.equal(session.snapshot().authenticated,false)
await assert.rejects(session.run(()=>{}),e=>e.code==='AUTH_REQUIRED')
mode='preparation';await assert.rejects(session.connect('token-a'),e=>e.code==='SERVICE_NOT_READY')
assert.ok(!calls.some(call=>call.url.endsWith('/me/session')))
mode='remote';invalidUser=true;await assert.rejects(session.connect('token-a'),e=>e.code==='INVALID_SESSION_RESPONSE')
invalidUser=false;await session.connect('token-a')
assert.equal(session.snapshot().userId,a);assert.ok(!JSON.stringify(session.snapshot()).includes('token-a'))
const scopeA=await session.run(scope=>scope.stateKey('user-state'))
await session.connect('token-b')
const scopeB=await session.run(scope=>scope.stateKey('user-state'))
assert.notEqual(scopeA,scopeB);assert.notEqual(scopeA,'user-state')
let escaped
await session.run(scope=>{escaped=scope.service})
session.disconnect();await assert.rejects(escaped.getProfile(),e=>e.code==='SESSION_CHANGED')
await session.connect('token-a')
let release;hold={promise:new Promise(resolve=>{release=resolve})}
const reading=session.run(scope=>scope.service.getProfile())
await new Promise(resolve=>setTimeout(resolve,0));session.disconnect();release()
await assert.rejects(reading,e=>e.code==='SESSION_CHANGED');hold=null
const blob=new Blob(['original'],{type:'audio/webm'}),before=createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex')
const take={blob,userId:a,duration:0.5,syncOffsetMs:0,projectSeed:'seed'},base={session,projectId:'p',partId:'lead',take,uploadKey:'upload-a',submissionKey:'submit-a'}
await session.connect('token-b');calls=[]
await assert.rejects(transferAndSubmitTrack({...base,uploadOriginal:async()=>({uploaded:true})}),e=>e.code==='TAKE_OWNER_MISMATCH')
assert.equal(calls.length,0,'Another user must not transfer this original')
await session.connect('token-a');calls=[]
await assert.rejects(transferAndSubmitTrack({...base,take:{...take,userId:'jisun'},uploadOriginal:async()=>({uploaded:true})}),e=>e.code==='TAKE_OWNER_MISMATCH')
assert.equal(calls.length,0,'Local demo originals must never be migrated automatically')
await assert.rejects(transferAndSubmitTrack({...base,uploadOriginal:async()=>{session.disconnect();return{uploaded:true}}}),e=>e.code==='SESSION_CHANGED')
assert.ok(!calls.some(call=>call.url.endsWith('/tracks')),'Logout during upload must prevent submission under another user')
await session.connect('token-a');calls=[]
const result=await transferAndSubmitTrack({...base,uploadOriginal:async()=>({uploaded:true})})
assert.equal(result.duration,0.512);assert.ok(calls.every(call=>call.token==='Bearer token-a'))
assert.equal(createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex'),before)
session.disconnect();assert.equal(session.snapshot().userId,null)
console.log('PASS session boundary: verified capability/user, no preparation activation, in-memory token, isolated user keys, stale/escaped response denial, logout-during-upload blocks submit, original/key preservation and canonical result. Injected Auth/HTTP; no actual login/App activation.')
