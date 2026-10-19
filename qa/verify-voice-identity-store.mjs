import assert from 'node:assert/strict'
import {indexedDB} from 'fake-indexeddb'
import {buildIdentityInputManifest} from '../src/voiceIdentityContract.js'
import {persistPersonalIdentityResult,loadPersonalIdentityResult,prepareStoredSubmittedVoiceControls,persistStoredTrackVoiceLayer,
  loadStoredTrackVoiceLayer,prepareStoredProjectRecord,persistStoredProjectRecordInput,loadStoredProjectRecordInput} from '../src/voiceIdentityStore.js'
import {analyzeAudioBuffer} from '../src/voiceAnalysis.js'
import {saveTrack,loadProjectTracks,saveSubmittedTrack,loadTrack} from '../src/trackStore.js'
import {prepareSubmittedTrackRecord} from '../src/trackSource.js'

globalThis.indexedDB=indexedDB
const pcm=Float32Array.from({length:32000},(_,i)=>.1*Math.sin(2*Math.PI*220*i/16000))
const features=analyzeAudioBuffer({sampleRate:16000,duration:2,getChannelData:()=>pcm})
const manifest=await buildIdentityInputManifest({userId:'private-owner',profileRevision:'profile-revision-1',generatorVersion:'fixture-generator',
  sources:[{recordId:'profile:sample',purpose:'voice-sample',sha256:'a'.repeat(64),analysisVersion:features.version,data:features}]})
// Contract fixture, not a decoded PNG or evidence of actual model execution.
const image=new Uint8Array(32)
image.set([137,80,78,71,13,10,26,10])
new DataView(image.buffer).setUint32(16,512)
new DataView(image.buffer).setUint32(20,512)
const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('')
const artifact={id:'opaque-personal-result',revision:'result-1',inputDigest:manifest.inputDigest,generatorVersion:manifest.generatorVersion,
  model:'fixture-model',modelRevision:'b'.repeat(40),inferenceSeed:'1',outputSha256:await sha(image),blob:new Blob([image],{type:'image/png'})}
const input={profileProjectId:'profile',manifest,artifact}
const selector={profileProjectId:'profile',userId:manifest.userId,id:artifact.id,revision:artifact.revision}
const saved=await persistPersonalIdentityResult(input)
assert.deepEqual(await loadPersonalIdentityResult(selector),saved)
assert.deepEqual(await persistPersonalIdentityResult(input),saved)
assert.deepEqual(await Promise.all([persistPersonalIdentityResult(input),persistPersonalIdentityResult(input)]),[saved,saved])
assert.equal((await loadProjectTracks('profile')).length,1)
assert.equal(await loadPersonalIdentityResult({...selector,userId:'other-owner'}),null)
assert.equal(await loadPersonalIdentityResult({...selector,revision:'missing'}),null)
saved.manifest.userId='mutated-by-consumer'
assert.equal((await loadPersonalIdentityResult(selector)).manifest.userId,manifest.userId)

const changedImage=image.slice();changedImage[31]=1
const changedArtifact={...artifact,blob:new Blob([changedImage],{type:'image/png'}),outputSha256:await sha(changedImage)}
await assert.rejects(persistPersonalIdentityResult({...input,artifact:changedArtifact}),/immutable/)
assert.equal((await loadPersonalIdentityResult(selector)).ref.outputSha256,artifact.outputSha256)
const next=await persistPersonalIdentityResult({...input,artifact:{...changedArtifact,revision:'result-2'}})
assert.equal(next.ref.revision,'result-2')
assert.equal((await loadPersonalIdentityResult(selector)).ref.revision,'result-1','No implicit latest selection')
const raced=await Promise.allSettled([artifact,changedArtifact].map(item=>persistPersonalIdentityResult({...input,artifact:{...item,revision:'concurrent-result'}})))
assert.equal(raced.filter(item=>item.status==='fulfilled').length,1)
assert.equal(raced.filter(item=>item.status==='rejected').length,1)
assert.equal((await loadPersonalIdentityResult({...selector,revision:'concurrent-result'})).ref.outputSha256,raced.find(item=>item.status==='fulfilled').value.ref.outputSha256)

const submitted=await prepareSubmittedTrackRecord({id:'project:part',projectId:'project',partId:'part',participantId:manifest.userId,
  origin:'live-microphone-recording',blob:new Blob([pcm]),features,duration:2})
await saveSubmittedTrack(submitted)
const bridge={profileProjectId:'profile',userId:manifest.userId,identityRef:artifact,projectId:'project',partId:'part',generatorVersion:'fixture-flow'}
const prepared=await prepareStoredSubmittedVoiceControls(bridge)
assert.equal(prepared.personalRef.outputSha256,artifact.outputSha256)
assert.equal(prepared.controls.identityCondition.detailScale,prepared.controls.flowStyle.brightness)
assert.equal(prepared.trackInput.source.purpose,'project-track')
assert.equal(prepared.controls.inputs.resonance.track.layerGeneratorVersion,'fixture-flow')
assert.deepEqual(await loadTrack(submitted.id),submitted,'Preparation cannot submit, mix or replace the audio')
await assert.rejects(prepareStoredSubmittedVoiceControls({...bridge,userId:'other-owner'}))
await assert.rejects(prepareStoredSubmittedVoiceControls({...bridge,identityRef:{...artifact,outputSha256:'c'.repeat(64)}}))
await saveTrack({...submitted,kind:'temporary-recording'})
await assert.rejects(prepareStoredSubmittedVoiceControls(bridge),/submitted Track/)
await saveTrack(submitted)

const before=await loadProjectTracks('profile')
globalThis.indexedDB={open(){throw new Error('Injected storage unavailable')}}
await assert.rejects(persistPersonalIdentityResult({...input,artifact:{...artifact,revision:'never-saved'}}),/storage unavailable/)
globalThis.indexedDB=indexedDB
assert.deepEqual(await loadProjectTracks('profile'),before)
const raw=before.find(record=>record.artifact.revision==='result-1')
await saveTrack({...raw,artifact:{...raw.artifact,blob:new Blob([changedImage],{type:'image/png'})}})
await assert.rejects(loadPersonalIdentityResult(selector),/PNG\/hash/)
await saveTrack(raw)
await saveTrack({...raw,traits:{...raw.traits,profileRevision:'tampered'}})
await assert.rejects(loadPersonalIdentityResult(selector),/lineage/)
await saveTrack(raw)
assert.deepEqual(await loadTrack(submitted.id),submitted)
// Received model-output contract fixtures; no new inference or PNG decode.
const storedLayers={}
for(let count=2;count<=4;count++){
  const project={id:`project-${count}`,seed:`seed-${count}`,partIds:Array.from({length:count},(_,i)=>`part-${i}`)}
  const originals=[]
  const refs={}
  for(const partId of project.partIds){
    const track=await prepareSubmittedTrackRecord({...submitted,id:`${project.id}:${partId}`,projectId:project.id,partId})
    await saveSubmittedTrack(track);originals.push(track)
    const args={...bridge,projectId:project.id,partId,projectSeed:project.seed}
    const pending=await prepareStoredSubmittedVoiceControls(args)
    const received={id:`opaque-layer-${partId}`,revision:'layer-1',inputDigest:pending.trackInput.inputDigest,
      artifact:{version:'ieum-ai-voice-layer-v1',projectId:project.id,partId,participantId:manifest.userId,projectSeed:project.seed,
        inferenceSeed:1,model:'fixture-model',revision:'b'.repeat(40),sourceSha256:track.sourceProvenance.audioSha256,
        outputSha256:artifact.outputSha256,blob:artifact.blob}}
    const layer=await persistStoredTrackVoiceLayer({...args,result:received})
    assert.deepEqual(await persistStoredTrackVoiceLayer({...args,result:received}),layer)
    assert.deepEqual(await loadStoredTrackVoiceLayer({projectId:project.id,partId,id:layer.ref.id,revision:layer.ref.revision}),layer)
    refs[partId]=layer.ref
    storedLayers[`${project.id}:${partId}`]=layer
    await assert.rejects(persistStoredTrackVoiceLayer({...args,result:{...received,inputDigest:'c'.repeat(64)}}),/submitted Track input/)
    await assert.rejects(persistStoredTrackVoiceLayer({...args,result:{...received,artifact:{...received.artifact,projectSeed:'other-project-seed'}}}))
  }
  const waiting=await prepareStoredProjectRecord({project,layerRefs:{},generatorVersion:'fixture-record'})
  const savedWaiting=await persistStoredProjectRecordInput({project,layerRefs:{},generatorVersion:'fixture-record'})
  assert.equal(waiting.submittedCount,count)
  assert.equal(waiting.allRequiredTracksSubmitted,true)
  assert.equal(waiting.allSubmittedLayersReady,false)
  const ready=await prepareStoredProjectRecord({project,layerRefs:refs,generatorVersion:'fixture-record'})
  assert.equal(ready.submittedCount,count)
  assert.equal(ready.allSubmittedLayersReady,true)
  assert.deepEqual(await prepareStoredProjectRecord({project,layerRefs:structuredClone(refs),generatorVersion:'fixture-record'}),ready)
  const savedRecord=await persistStoredProjectRecordInput({project,layerRefs:refs,generatorVersion:'fixture-record'})
  assert.deepEqual(await loadStoredProjectRecordInput(savedRecord.ref),savedRecord)
  assert.deepEqual(await persistStoredProjectRecordInput({project,layerRefs:refs,generatorVersion:'fixture-record'}),savedRecord)
  assert.equal((await loadStoredProjectRecordInput(savedWaiting.ref)).input.allSubmittedLayersReady,false)
  const rawProject=(await loadProjectTracks(project.id)).find(record=>record.kind==='voice-project-record-input' && record.input.inputDigest===ready.inputDigest)
  await saveTrack({...rawProject,input:{...rawProject.input,submittedCount:99}})
  await assert.rejects(loadStoredProjectRecordInput(savedRecord.ref),/lineage/)
  await saveTrack(rawProject)
  assert.equal('mixStatus' in ready,false)
  assert.equal(JSON.stringify(ready).includes(manifest.userId),false)
  await assert.rejects(prepareStoredProjectRecord({project,layerRefs:{...refs,[project.partIds[0]]:{...refs[project.partIds[0]],outputSha256:'c'.repeat(64)}},generatorVersion:'fixture-record'}))
  await saveTrack({...originals[0],submissionStatus:'pending'})
  const unsubmitted=await prepareStoredProjectRecord({project,layerRefs:refs,generatorVersion:'fixture-record'})
  assert.equal(unsubmitted.submittedCount,count-1)
  assert.equal(unsubmitted.allRequiredTracksSubmitted,false)
  await assert.rejects(loadStoredTrackVoiceLayer({projectId:project.id,partId:project.partIds[0],id:refs[project.partIds[0]].id,revision:'layer-1'}))
  await saveTrack(originals[0])
  for(const original of originals)assert.deepEqual(await loadTrack(original.id),original,'Layer/Project graphics cannot replace the submitted audio')
}
console.log('PASS private Identity persistence: explicit revision/owner, immutable idempotent concurrent saves, byte/trait tamper rejection, failed-write preservation, confirmed submitted Track bridge; no AI generation, PNG decode, design approval or remote-service claim')
console.log('PASS received Track Layer persistence + 2/3/4-Part Project lineage: exact input/personal/model output references, pending graphics separate from submission, replay digest, no raw owner or Mix success in Project input; fixtures only')
