import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createServiceSession} from '../src/serviceSession.js'
import {transferAndSubmitTrack} from '../src/trackTransfer.js'
import {prepareVoiceRangeRecord,prepareVoiceSampleRecord,voiceSourceRevision,registerOwnedVoiceSource} from '../src/profileSource.js'
import {canonicalIdentityInput} from '../src/voiceIdentityContract.js'
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222'
let mode='remote',calls=[],hold=null,invalidUser=false
const fetchImpl=async(url,options)=>{
  assert.equal(options.redirect,'error');assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer')
  calls.push({url,token:options.headers.Authorization})
  if(url.endsWith('/capabilities')){assert.equal(options.headers.Authorization,undefined);return Response.json({contractVersion:'ieum-service-v1',mode,authenticated:mode==='remote',sharedProjects:mode==='remote'})}
  if(url.endsWith('/me/session'))return Response.json({authenticated:true,user:{id:invalidUser?'demo-user':options.headers.Authorization==='Bearer token-a'?a:b}})
  if(url.includes('/catalog-arrangements')){assert.equal(options.headers.Authorization,undefined);return Response.json({items:[],nextCursor:null})}
  if(url.includes('/project-discovery')){assert.equal(options.headers.Authorization,undefined);return Response.json({items:[],nextCursor:null})}
  if(url.endsWith('/me/profile')){if(hold)await hold.promise;return Response.json({roles:[],revision:0})}
  if(url.endsWith('/upload-intents'))return Response.json({uploadIntentId:'intent-a'})
  if(url.endsWith('/tracks'))return Response.json({submissionStatus:'success',trackId:'p:lead',duration:0.512})
  if(url.endsWith('/mix'))return Response.json({project:{id:'p'},mix:null})
  if(url.endsWith('/key')){
    assert.equal(options.method,'POST');assert.equal(options.headers['Idempotency-Key'],'key-adjust')
    assert.deepEqual(JSON.parse(options.body),{arrangementId:'verified-arrangement',expectedRevision:3})
    if(hold)await hold.promise
    return Response.json({id:'p',key:'+1',revision:4})
  }
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
assert.deepEqual(await session.run(({service})=>service.getProjectMix('p')),{project:{id:'p'},mix:null})
assert.equal(calls.at(-1).token,'Bearer token-a')
const keySelection={arrangementId:'verified-arrangement',expectedRevision:3,userId:b,key:'guessed-key',audioSourceRef:{url:'private'}}
assert.deepEqual(await session.run(({service})=>service.setProjectKey('p',keySelection,'key-adjust')),{id:'p',key:'+1',revision:4})
assert.equal(calls.at(-1).token,'Bearer token-a')
const beforeMissingKey=calls.length
await assert.rejects(session.run(({service})=>service.setProjectKey('p',keySelection,'')),error=>error.code==='IDEMPOTENCY_KEY_REQUIRED')
assert.equal(calls.length,beforeMissingKey)
assert.deepEqual(await session.run(({service})=>service.getCatalog()),{items:[],nextCursor:null})
assert.deepEqual(await session.run(({service})=>service.discoverProjects({songId:'song'})),{items:[],nextCursor:null})
const scopeA=await session.run(scope=>scope.stateKey('user-state'))
await session.connect('token-b')
const scopeB=await session.run(scope=>scope.stateKey('user-state'))
assert.notEqual(scopeA,scopeB);assert.notEqual(scopeA,'user-state')
let escaped
await session.run(scope=>{escaped=scope.service})
session.disconnect();await assert.rejects(escaped.getProfile(),e=>e.code==='SESSION_CHANGED')
await assert.rejects(escaped.getProjectMix('p'),e=>e.code==='SESSION_CHANGED')
await assert.rejects(escaped.setProjectKey('p',keySelection,'key-adjust'),e=>e.code==='SESSION_CHANGED')
await assert.rejects(escaped.getCatalog(),e=>e.code==='SESSION_CHANGED')
await assert.rejects(escaped.discoverProjects(),e=>e.code==='SESSION_CHANGED')
await session.connect('token-a')
let release;hold={promise:new Promise(resolve=>{release=resolve})}
const reading=session.run(scope=>scope.service.getProfile())
await new Promise(resolve=>setTimeout(resolve,0));session.disconnect();release()
await assert.rejects(reading,e=>e.code==='SESSION_CHANGED');hold=null
await session.connect('token-a')
hold={promise:new Promise(resolve=>{release=resolve})}
const changingKey=session.run(({service})=>service.setProjectKey('p',keySelection,'key-adjust'))
await new Promise(resolve=>setTimeout(resolve,0));await session.connect('token-b');release()
await assert.rejects(changingKey,error=>error.code==='SESSION_CHANGED');hold=null
assert.equal(session.snapshot().userId,b)
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

const rangeRecord=await prepareVoiceRangeRecord({id:'range',projectId:'profile',userId:a,kind:'voice-range',rangeData:{lowMidi:48,highMidi:67,analysisVersion:'normalized-difference-v1',sampleCount:10,confidence:0.9}})
const sampleRecord=await prepareVoiceSampleRecord({id:'sample',projectId:'profile',userId:a,kind:'voice-sample',blob,features:{version:'ieum-basic-voice-v5'}})
const sourceRevision=await voiceSourceRevision(rangeRecord.sourceProvenance,sampleRecord.sourceProvenance)
const intentId='33333333-3333-4333-8333-333333333333'
const features={version:'ieum-basic-voice-v5',brightness:null,roughness:null}
const featuresSha256=createHash('sha256').update(canonicalIdentityInput(features)).digest('hex')
const analysis={version:'ieum-sample-analysis-v1',sourceSha256:before,byteLength:blob.size,features,featuresSha256,audioReceipt:{duration:0.512}}
const source={sourceRevision,rangeData:rangeRecord.rangeData,rangeProvenance:rangeRecord.sourceProvenance,sampleProvenance:sampleRecord.sourceProvenance,
  rangeOrigin:'browser-pitch-analysis',sampleOrigin:'server-decoded-private-original',sampleDuration:0.512,sampleFeatures:features,sampleAnalysisRef:{uploadIntentId:intentId,featuresSha256}}
let profileCalls=[],failure=null,uploaded=false,malformed=false,stored=null,delayed=null
const profileSession=createServiceSession({baseUrl:'https://ieum.example/api',fetchImpl:async(url,options)=>{
  if(url.endsWith('/capabilities'))return Response.json({contractVersion:'ieum-service-v1',mode:'remote',authenticated:true,sharedProjects:true})
  if(url.endsWith('/me/session'))return Response.json({authenticated:true,user:{id:options.headers.Authorization==='Bearer token-a'?a:b}})
  assert.equal(options.headers.Authorization,'Bearer token-a');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error')
  const route=url.split('/').at(-1);profileCalls.push(route)
  if(failure===route)return Response.json({error:{code:'INJECTED_FAILURE'}},{status:409})
  if(delayed?.route===route)await delayed.promise
  if(route==='voice-sample-upload'){
    assert.deepEqual(JSON.parse(options.body),{size:blob.size,contentType:'audio/webm',sha256:before})
    assert.equal(options.headers['Idempotency-Key'],'sample-key')
    return Response.json({uploadIntentId:intentId,purpose:'voice-sample',sampleVerification:'pending',uploadStatus:uploaded?'verified':'pending',verifiedFile:{size:blob.size,contentType:'audio/webm',sha256:before}})
  }
  if(route==='voice-sample-verify')return Response.json({uploadIntentId:intentId,purpose:'voice-sample',audioVerification:'verified',sampleVerification:'pending',duration:0.512})
  if(route==='voice-sample-analyze')return Response.json({uploadIntentId:intentId,analysisStatus:'verified',sampleVerification:'pending',analysis:{...analysis,...(malformed?{sourceSha256:'0'.repeat(64)}:{})}})
  if(route==='voice-source'){
    if(options.method==='GET')return Response.json({source:stored})
    assert.equal(options.headers['Idempotency-Key'],'source-key')
    assert.deepEqual(JSON.parse(options.body),{expectedSourceRevision:null,rangeData:rangeRecord.rangeData,rangeProvenance:rangeRecord.sourceProvenance,sampleProvenance:sampleRecord.sourceProvenance,sampleUploadIntentId:intentId})
    stored=structuredClone(source)
    return Response.json({registrationStatus:'success',source:stored})
  }
  throw new Error('Unexpected Profile route')
}})
await profileSession.connect('token-a')
let uploads=0
const registerOptions={session:profileSession,rangeRecord,sampleRecord,expectedSourceRevision:null,uploadKey:'sample-key',registrationKey:'source-key',uploadOriginal:async()=>{uploads++;uploaded=true;return{uploaded:true}}}
const originalRange=structuredClone(rangeRecord),originalSample=sampleRecord.sourceProvenance
assert.equal((await profileSession.run(({service})=>service.getVoiceSource())).source,null)
assert.deepEqual(await registerOwnedVoiceSource(registerOptions),{registrationStatus:'success',source})
assert.deepEqual(profileCalls.slice(-4),['voice-sample-upload','voice-sample-verify','voice-sample-analyze','voice-source'])
assert.equal(uploads,1)
assert.deepEqual(await registerOwnedVoiceSource(registerOptions),{registrationStatus:'success',source});assert.equal(uploads,1,'Verified exact bytes retry must not overwrite the original')
assert.deepEqual((await profileSession.run(({service})=>service.getVoiceSource())).source,source)
for(const stage of ['voice-sample-upload','voice-sample-verify','voice-sample-analyze','voice-source']){
  profileCalls=[];failure=stage
  await assert.rejects(registerOwnedVoiceSource(registerOptions),e=>e.code==='CONFLICT')
  assert.equal(profileCalls.at(-1),stage);assert.deepEqual(stored,source)
}
failure=null;malformed=true;profileCalls=[]
await assert.rejects(registerOwnedVoiceSource(registerOptions),e=>e.code==='INVALID_RESPONSE')
assert.ok(!profileCalls.includes('voice-source'));malformed=false
await profileSession.connect('token-b');profileCalls=[]
await assert.rejects(registerOwnedVoiceSource(registerOptions),e=>e.code==='TAKE_OWNER_MISMATCH');assert.equal(profileCalls.length,0)
await profileSession.connect('token-a')
await assert.rejects(registerOwnedVoiceSource({...registerOptions,sampleRecord:{...sampleRecord,userId:'jisun'}}),e=>e.code==='TAKE_OWNER_MISMATCH')
await assert.rejects(registerOwnedVoiceSource({...registerOptions,rangeRecord:{...rangeRecord,rangeData:{...rangeRecord.rangeData,lowMidi:49}}}),e=>e.code==='INVALID_PROFILE_SOURCE')
profileCalls=[];uploaded=false
await assert.rejects(registerOwnedVoiceSource({...registerOptions,uploadOriginal:async()=>{profileSession.disconnect();return{uploaded:true}}}),e=>e.code==='SESSION_CHANGED')
assert.deepEqual(profileCalls,['voice-sample-upload'])
await profileSession.connect('token-a');uploaded=true;profileCalls=[]
let releaseProfile;delayed={route:'voice-sample-analyze',promise:new Promise(resolve=>{releaseProfile=resolve})}
const pendingSource=registerOwnedVoiceSource(registerOptions)
const deadline=Date.now()+2000
while(!profileCalls.includes('voice-sample-analyze') && Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,0))
assert.ok(profileCalls.includes('voice-sample-analyze'),'Analysis request must start within the bounded fixture wait')
profileSession.disconnect();releaseProfile()
await assert.rejects(pendingSource,e=>e.code==='SESSION_CHANGED');assert.ok(!profileCalls.includes('voice-source'));delayed=null
assert.deepEqual(rangeRecord,originalRange);assert.deepEqual(sampleRecord.sourceProvenance,originalSample)
assert.equal(createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex'),before)
console.log('PASS session-scoped Profile source pipeline: owned immutable snapshots, exact-byte retry, separate upload/decode/analysis/registration, GET source, stable keys, failures and logout/user-change block registration, original preservation. Injected HTTP fixtures, not real Auth/Storage/physical analysis/App activation.')
