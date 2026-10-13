import assert from 'node:assert/strict'
import {createServiceSession} from '../src/serviceSession.js'
import {loadRemoteProjectRecordInput} from '../src/voiceIdentitySources.js'
import {buildProjectRecordInput} from '../src/voiceIdentityContract.js'

// Transport/consumer QA only; no AI generation, real account or image approval.
const user='11111111-1111-4111-8111-111111111111'
let reply,reads=0,hold=null,release=null
const session=createServiceSession({baseUrl:'https://ieum.example/api',fetchImpl:async(url,init)=>{
  if(url.endsWith('/capabilities'))return Response.json({contractVersion:'ieum-service-v1',mode:'remote',authenticated:true,sharedProjects:true})
  if(url.endsWith('/me/session'))return Response.json({authenticated:true,user:{id:user}})
  const parsed=new URL(url)
  assert.equal(parsed.pathname,'/api/me/voice-identity')
  assert.equal(parsed.searchParams.get('kind'),'project-record')
  assert.equal(init.headers.Authorization,'Bearer test-token')
  reads++
  if(hold)await hold
  return Response.json(reply)
}})
await session.connect('test-token')
for(const count of [2,3,4]){
  const projectId=`project-${count}`,projectSeed=`seed-${count}`,partIds=Array.from({length:count},(_,n)=>`part-${n}`),generatorVersion='test-record-v1'
  const tracks=partIds.map((partId,n)=>({id:`${projectId}:${partId}`,revision:`source-${n}`,projectId,partId,submissionStatus:'success',layerStatus:'success',
    layerRef:{id:`layer-${n}`,revision:'r1',generatorVersion:'test-layer-v1',outputSha256:String(n+1).repeat(64)}}))
  const full=await buildProjectRecordInput({projectId,projectSeed,partIds,generatorVersion,tracks})
  const partial=await buildProjectRecordInput({projectId,projectSeed,partIds,generatorVersion,tracks:tracks.slice(0,1).map(track=>({...track,layerStatus:'pending'}))})
  const options=input=>({session,ref:{projectId,inputDigest:input.inputDigest},projectSeed,partIds,generatorVersion})
  const response=input=>({projectId,inputDigest:input.inputDigest,input})
  reply=response(full)
  assert.deepEqual(await loadRemoteProjectRecordInput(options(full)),{ref:options(full).ref,input:full})
  reply=response(partial)
  const historical=await loadRemoteProjectRecordInput(options(partial))
  assert.equal(historical.input.submittedCount,1)
  assert.equal(historical.input.allRequiredTracksSubmitted,false)
  assert.equal(historical.input.allSubmittedLayersReady,false)
  for(const mutate of [r=>r.input.submittedCount++,r=>r.input.allRequiredTracksSubmitted=false,
    r=>r.input.layers[0].layerRef.outputSha256='f'.repeat(64),r=>r.input.layers[0].trackRevision='changed',
    r=>r.input.layers.reverse(),r=>r.input.layers[0].partId='unknown',r=>r.input.extra='untrusted',r=>r.extra='untrusted']){
    reply=response(structuredClone(full));mutate(reply)
    await assert.rejects(loadRemoteProjectRecordInput(options(full)))
  }
  reply=response(full)
  await assert.rejects(loadRemoteProjectRecordInput({...options(full),projectSeed:'another-seed'}))
  await assert.rejects(loadRemoteProjectRecordInput({...options(full),partIds:[...partIds].reverse()}))
  await assert.rejects(loadRemoteProjectRecordInput({...options(full),generatorVersion:'another-version'}))
  const before=reads
  await assert.rejects(loadRemoteProjectRecordInput({...options(full),partIds:['only-one']}))
  assert.equal(reads,before)
  // Caller mutation while awaiting a response cannot redirect the selected revision.
  const fixed=options(full);hold=new Promise(resolve=>{release=resolve})
  const waiting=loadRemoteProjectRecordInput(fixed)
  while(reads===before)await new Promise(resolve=>setImmediate(resolve))
  fixed.ref.inputDigest='a'.repeat(64);fixed.partIds[0]='changed'
  release();hold=null
  assert.deepEqual((await waiting).input,full)
}
hold=new Promise(resolve=>{release=resolve})
const before=reads,last=reply.input
const waiting=loadRemoteProjectRecordInput({session,ref:{projectId:last.projectId,inputDigest:last.inputDigest},projectSeed:last.projectSeed,partIds:last.partIds,generatorVersion:last.generatorVersion})
while(reads===before)await new Promise(resolve=>setImmediate(resolve))
session.disconnect();release();hold=null
await assert.rejects(waiting,error=>error.code==='SESSION_CHANGED')
console.log('PASS explicit historical 2–4 Part input consumer: digest/Seed/Parts/version/state validation, pending state, tamper rejection, caller snapshot and logout. Transport fixture only; no image, AI, real service or Mix success.')
