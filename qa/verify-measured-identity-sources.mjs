import assert from 'node:assert/strict'
import {indexedDB} from 'fake-indexeddb'
import {prepareVoiceRangeRecord,prepareVoiceSampleRecord,voiceSourceRevision} from '../src/profileSource.js'
import {saveTracks,loadTrack} from '../src/trackStore.js'
import {analyzeAudioBuffer} from '../src/voiceAnalysis.js'
import {measuredProfileIdentityInput,loadMeasuredProfileIdentityInput,loadRemoteMeasuredProfileIdentityInput} from '../src/voiceIdentitySources.js'
import {canonicalIdentityInput} from '../src/voiceIdentityContract.js'
import {createServiceSession} from '../src/serviceSession.js'
globalThis.indexedDB=indexedDB
const pcm=Float32Array.from({length:32000},(_,index)=>.1*Math.sin(2*Math.PI*220*index/16000))
const features=analyzeAudioBuffer({sampleRate:16000,duration:2,getChannelData:()=>pcm})
const rangeRecord=await prepareVoiceRangeRecord({id:'profile:range',projectId:'profile',kind:'voice-range',rangeData:{analysisVersion:'normalized-difference-v1',lowMidi:48,highMidi:67,sampleCount:10,confidence:.8}})
const sampleRecord=await prepareVoiceSampleRecord({id:'profile:sample',projectId:'profile',kind:'voice-sample',blob:new Blob(['isolated immutable original']),features})
await saveTracks([rangeRecord,sampleRecord])
const input={userId:'private-user',generatorVersion:'explicit-test-generator',rangeRecord,sampleRecord}
const first=await measuredProfileIdentityInput(input)
assert.deepEqual(first,await loadMeasuredProfileIdentityInput({userId:input.userId,generatorVersion:input.generatorVersion,profileProjectId:'profile'}))
assert.deepEqual(first,await measuredProfileIdentityInput(structuredClone(input)))
assert.deepEqual(first.sources.map(source=>source.purpose),['voice-range','voice-sample'])
assert.equal(first.sources[1].data.pitchFrameLength,4096)
assert.equal(JSON.stringify(first).includes('blob:'),false)
assert.notEqual(first.inputDigest,(await measuredProfileIdentityInput({...input,userId:'other-private-user'})).inputDigest)
assert.notEqual(first.inputDigest,(await measuredProfileIdentityInput({...input,generatorVersion:'next-generator'})).inputDigest)
for(const bad of [
 {...input,rangeRecord:{...rangeRecord,rangeData:{...rangeRecord.rangeData,lowMidi:36}}},
 {...input,sampleRecord:{...sampleRecord,blob:new Blob(['changed immutable original'])}},
 {...input,sampleRecord:{...sampleRecord,features:{...features,version:'unsupported'}}},
 {...input,rangeRecord:{...rangeRecord,sourceProvenance:null}},
 {...input,sampleRecord:{...sampleRecord,kind:'project-track'}},
 {...input,sampleRecord:{...sampleRecord,projectId:'other-profile'}},
 {...input,generatorVersion:''}
]) await assert.rejects(measuredProfileIdentityInput(bad))
const pending=measuredProfileIdentityInput(input)
input.rangeRecord.rangeData.lowMidi=36
input.sampleRecord.features.brightness=.99
assert.deepEqual(await pending,first,'Hash await must not allow replacement of bound measurements')
assert.equal((await loadTrack(rangeRecord.id)).rangeData.lowMidi,48,'Input preparation never writes Profile data')
console.log('Persisted measured Profile → private generation input: actual source hash/size/version checks, deterministic input, source isolation, immutable snapshot, unsupported/legacy rejection passed. No graphic/model completion claim.')

const storedRange=await loadTrack(rangeRecord.id),storedSample=await loadTrack(sampleRecord.id)
const remotePCM=Float32Array.from({length:96000},(_,i)=>.1*Math.sin(2*Math.PI*220*i/48000))
const remoteFeatures=analyzeAudioBuffer({sampleRate:48000,duration:2,getChannelData:()=>remotePCM})
const hex=buffer=>[...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,'0')).join('')
const remoteSource={sourceRevision:await voiceSourceRevision(storedRange.sourceProvenance,storedSample.sourceProvenance),
  rangeData:storedRange.rangeData,rangeProvenance:storedRange.sourceProvenance,rangeOrigin:'browser-pitch-analysis',
  sampleProvenance:storedSample.sourceProvenance,sampleDuration:2,sampleFeatures:remoteFeatures,
  sampleAnalysisRef:{uploadIntentId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',version:'ieum-sample-analysis-v1',
    featuresSha256:hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalIdentityInput(remoteFeatures))))},sampleOrigin:'server-decoded-private-original'}
let change=null,disconnect=false,remoteCalls=0
const remoteUser='11111111-1111-4111-8111-111111111111'
const session=createServiceSession({baseUrl:'https://ieum.example/api',fetchImpl:async(url,init)=>{
  if(url.endsWith('/capabilities'))return Response.json({contractVersion:'ieum-service-v1',mode:'remote',authenticated:true,sharedProjects:true})
  assert.equal(init.headers.Authorization,'Bearer qa-token')
  if(url.endsWith('/me/session'))return Response.json({authenticated:true,user:{id:remoteUser}})
  assert.ok(url.endsWith('/me/voice-source'));remoteCalls++
  const response={source:structuredClone(remoteSource)};change?.(response)
  if(disconnect)session.disconnect()
  return Response.json(response)
}})
await session.connect('qa-token')
const remoteArgs={session,generatorVersion:'remote-fixture-generator'}
const remoteManifest=await loadRemoteMeasuredProfileIdentityInput(remoteArgs)
assert.deepEqual(await loadRemoteMeasuredProfileIdentityInput(remoteArgs),remoteManifest)
assert.equal(remoteManifest.userId,remoteUser)
assert.equal(remoteManifest.profileRevision,remoteSource.sourceRevision)
assert.deepEqual(remoteManifest.sources.map(x=>x.purpose),['voice-range','voice-sample'])
assert.deepEqual(remoteManifest.sources[1].data,remoteFeatures)
assert.notEqual((await loadRemoteMeasuredProfileIdentityInput({...remoteArgs,generatorVersion:'next-explicit-version'})).inputDigest,remoteManifest.inputDigest)
for(const mutate of [
  value=>{value.source=null},value=>{value.source={sourceRevision:'legacy',rangeData:{lowMidi:48,highMidi:67},provenanceStatus:'unavailable'}},
  value=>{value.source.rangeData.lowMidi=40},value=>{value.source.sampleFeatures.brightness=.99},
  value=>{value.source.sourceRevision='changed'},value=>{value.source.sampleAnalysisRef.version='ieum-track-analysis-v1'},
  value=>{value.source.sampleDuration=3},value=>{value.source.sampleOrigin='local-demo'},value=>{value.sampleUrl='private URL'},
  value=>{value.source.sourceRevision=null},value=>{value.source.sampleFeatures.durationSec=null}
]){change=mutate;await assert.rejects(loadRemoteMeasuredProfileIdentityInput(remoteArgs),/provenance/)}
change=null;disconnect=true
await assert.rejects(loadRemoteMeasuredProfileIdentityInput(remoteArgs),e=>e.code==='SESSION_CHANGED')
assert.ok(remoteCalls>10)
assert.deepEqual(await loadTrack(rangeRecord.id),storedRange)
assert.deepEqual(await loadTrack(sampleRecord.id),storedSample)
console.log('PASS remote registered Profile→private generation manifest: exact source/features hashes, revision/version/purpose, unknown/legacy refusal, deterministic replay and logout; injected source/Auth, not remote registration, AI or artwork approval.')
