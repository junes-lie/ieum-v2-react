import assert from 'node:assert/strict'
import {canonicalIdentityInput, assessVoiceCandidates, buildIdentityInputManifest, buildTrackIdentityInput, buildProjectRecordInput, validatePersonalIdentityResult} from '../src/voiceIdentityContract.js'
import {analyzeAudioBuffer} from '../src/voiceAnalysis.js'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import path from 'node:path'

const sha = 'a'.repeat(64)
const sample = {recordId:'sample-record', purpose:'voice-sample', sha256:sha, analysisVersion:'ieum-basic-voice-v3', data:{brightness:.4, rms:.08}}
const range = {recordId:'range-record', purpose:'voice-range', sha256:'b'.repeat(64), analysisVersion:'pitch-test-v1', data:{lowMidi:48, highMidi:67}}
const input = {userId:'private-user-a', profileRevision:'profile-1', generatorVersion:'generator-1', sources:[sample,range]}
const before = structuredClone(input)
const first = await buildIdentityInputManifest(input)
assert.deepEqual(input,before,'Manifest generation mutates Profile source')
assert.deepEqual(first,await buildIdentityInputManifest(JSON.parse(JSON.stringify(input))))
assert.equal(first.inputDigest,(await buildIdentityInputManifest({...input,sources:[range,{...sample,data:{rms:.08,brightness:.4}}]})).inputDigest)
for (const change of [{userId:'private-user-b'},{profileRevision:'profile-2'},{generatorVersion:'generator-2'},{sources:[{...sample,sha256:'c'.repeat(64)},range]}]) {
  assert.notEqual(first.inputDigest,(await buildIdentityInputManifest({...input,...change})).inputDigest)
}
await assert.rejects(buildIdentityInputManifest({...input,sources:[]}),/ID-only/)
await assert.rejects(buildIdentityInputManifest({...input,sources:[{...sample,purpose:'project-track'}]}),/Project Track/)
await assert.rejects(buildIdentityInputManifest({...input,sources:[sample,sample]}),/unique/)
for (const bad of [NaN,Infinity,undefined,new Date(),{x:undefined},new Array(1)]) assert.throws(()=>canonicalIdentityInput(bad),/finite JSON/)

const silence = analyzeAudioBuffer({sampleRate:44100,duration:2,getChannelData:()=>new Float32Array(88200)})
assert.ok(Object.values(assessVoiceCandidates(silence,'voice-sample').candidates).every(value=>value.value===null))
const pcm = Float32Array.from({length:88200},(_,i)=>.1*Math.sin(2*Math.PI*220*i/44100))
const tone = analyzeAudioBuffer({sampleRate:44100,duration:2,getChannelData:()=>pcm})
assert.equal(tone.version,'ieum-basic-voice-v5','Changed pitch window must not reuse the old feature analysis version')
assert.equal(tone.pitchAnalysisVersion,'normalized-difference-v1')
assert.equal(tone.pitchFrameLength,4096)
assert.deepEqual(tone,analyzeAudioBuffer({sampleRate:44100,duration:2,getChannelData:()=>pcm}),'Same input/version must reproduce features and fingerprint')
const assessment = assessVoiceCandidates(tone,'project-track')
assert.equal(assessment.candidates.brightness.status,'estimated')
assert.equal(assessVoiceCandidates({...tone,version:'ieum-basic-voice-v3'},'project-track').candidates.brightness.status,'estimated','Legacy source analysis remains readable')
assert.equal(assessVoiceCandidates({...tone,version:'ieum-basic-voice-v4'},'project-track').candidates.brightness.status,'estimated','Stored v4 remains readable')
assert.equal(assessVoiceCandidates({...tone,pitchFrameLength:1024},'project-track').candidates.brightness.status,'unsupported','Wrong v5 pitch window must not masquerade as supported')
assert.equal(assessVoiceCandidates({...tone,pitchAnalysisVersion:'unknown'},'project-track').candidates.brightness.status,'unsupported','Unrecognized extractor must not masquerade as supported v4')
assert.equal(assessment.candidates.brightness.confidence,null)
for (const name of ['averageRange','actualRange','bpm','breathiness','vibrato','rhythmComplexity']) assert.equal(assessment.candidates[name].value,null)
assert.equal(assessVoiceCandidates({...tone,roughness:NaN},'project-track').candidates.roughness.value,null)

const trackInput = {trackId:'track-1',identityRef:{id:'opaque-identity-1',revision:'identity-1',outputSha256:sha},generatorVersion:'layer-1',source:{...sample,purpose:'project-track'}}
const track = await buildTrackIdentityInput(trackInput)
assert.deepEqual(track,await buildTrackIdentityInput(JSON.parse(JSON.stringify(trackInput))))
assert.ok(!JSON.stringify(track).includes(input.userId))
assert.equal(track.identityRef.revision,'identity-1')
assert.notEqual(track.inputDigest,(await buildTrackIdentityInput({...trackInput,source:{...trackInput.source,sha256:'c'.repeat(64)}})).inputDigest)
await assert.rejects(buildTrackIdentityInput({...trackInput,source:sample}),/purpose/)
await assert.rejects(buildTrackIdentityInput({...trackInput,identityRef:{...trackInput.identityRef,outputSha256:null}}),/confirmed/)
console.log('PASS: canonical private Profile/Track inputs, revision/source/version invalidation, purpose isolation, silence/unsupported handling; no generated shape or perceptual reliability claim')

for (const count of [2,3,4]) {
  const partIds = Array.from({length:count},(_,index)=>`part-${index}`)
  const tracks = partIds.map((partId,index)=>({id:`track-${index}`,revision:'track-v1',partId,projectId:'project-1',submissionStatus:'success',layerStatus:'success',layerRef:{id:`layer-${index}`,revision:'layer-v1',generatorVersion:'layer-generator-v1',outputSha256:sha}}))
  const projectInput = {projectId:'project-1',projectSeed:'unchanged-existing-seed',partIds,tracks,generatorVersion:'record-generator-v1'}
  const record = await buildProjectRecordInput(projectInput)
  assert.deepEqual(record,await buildProjectRecordInput({...projectInput,tracks:[...tracks].reverse()}))
  assert.equal(record.submittedCount,count)
  assert.equal(record.allRequiredTracksSubmitted,true)
  assert.equal(record.allSubmittedLayersReady,true)
  const pendingLayer = await buildProjectRecordInput({...projectInput,tracks:tracks.map((track,index)=>index===0?{...track,layerStatus:'error',layerRef:null}:track)})
  assert.equal(pendingLayer.allRequiredTracksSubmitted,true,'Graphics failure incorrectly removes a submitted Track')
  assert.equal(pendingLayer.allSubmittedLayersReady,false)
  const pendingSubmit = await buildProjectRecordInput({...projectInput,tracks:tracks.map((track,index)=>index===0?{...track,submissionStatus:'pending'}:track)})
  assert.equal(pendingSubmit.submittedCount,count-1,'Successful graphics incorrectly confirms submission')
  assert.equal(pendingSubmit.allRequiredTracksSubmitted,false)
  await assert.rejects(buildProjectRecordInput({...projectInput,tracks:[...tracks,tracks[0]]}),/unique/)
}
console.log('PASS: 2–4 Project canonical lineage and independent submission/graphics readiness; no Auto Mix success claim')

// Optional real, preserved P0 recordings; synthetic checks above remain separate.
if (process.argv[2]) {
  const report = JSON.parse(await readFile(process.argv[2],'utf8'))
  assert.equal(report.sources.length,4)
  const manifests = []
  for (const [index, source] of report.sources.entries()) {
    const sourceHash = createHash('sha256').update(await readFile(source.path)).digest('hex')
    assert.equal(sourceHash,report.results.find(result=>result.sourceIndex===index).sourceSha256)
    const features = source.analysis.features
    const sourceInput = {recordId:`evaluation-source-${index}`,purpose:'voice-sample',sha256:sourceHash,analysisVersion:features.version,data:features}
    const evaluationInput = {userId:`evaluation-user-${index}`,profileRevision:'evaluation-1',generatorVersion:'input-contract-evaluation-1',sources:[sourceInput]}
    const manifest = await buildIdentityInputManifest(evaluationInput)
    assert.equal(manifest.inputDigest,(await buildIdentityInputManifest(JSON.parse(JSON.stringify(evaluationInput)))).inputDigest)
    const assessed = assessVoiceCandidates(features,'voice-sample')
    assert.equal(assessed.candidates.vibrato.value,null)
    assert.equal(assessed.candidates.breathiness.value,null)
    manifests.push({sourceSha256:sourceHash,inputDigest:manifest.inputDigest,estimated:Object.entries(assessed.candidates).filter(([,candidate])=>candidate.status==='estimated').map(([name])=>name)})
  }
  assert.equal(new Set(manifests.map(manifest=>manifest.inputDigest)).size,4)
  console.log(JSON.stringify({realSourceCount:4,manifests,scope:'Existing recording hashes and canonical manifests only; no new AI inference, shape distinction, identity recognition, or confidence validation'},null,2))
}

if (process.argv[3]) {
  const reportPath = process.argv[3]
  const report = JSON.parse(await readFile(reportPath,'utf8'))
  const manifests = JSON.parse(await readFile(path.join(path.dirname(reportPath),'private-inputs.json'),'utf8'))
  const native = report.results[0]
  const manifest = manifests[0]
  const artifact = {id:'opaque-probe-identity',revision:'probe-result-1',inputDigest:manifest.inputDigest,
    generatorVersion:report.generatorVersion,model:report.model,modelRevision:report.revision,
    inferenceSeed:BigInt(`0x${manifest.inputDigest.slice(0,16)}`).toString(),outputSha256:native.outputSha256,
    blob:new Blob([await readFile(native.path)],{type:'image/png'})}
  artifact.inferenceSeed=(BigInt(artifact.inferenceSeed)%(2n**63n-1n)).toString()
  const validated = await validatePersonalIdentityResult(manifest,artifact)
  assert.equal(validated.outputSha256,native.outputSha256)
  assert.ok(!JSON.stringify(validated).includes(manifest.userId))
  await assert.rejects(validatePersonalIdentityResult({...manifest,profileRevision:'changed'},artifact),/changed/)
  await assert.rejects(validatePersonalIdentityResult(manifest,{...artifact,generatorVersion:'wrong'}),/provenance/)
  await assert.rejects(validatePersonalIdentityResult(manifest,{...artifact,outputSha256:'f'.repeat(64)}),/hash/)
  await assert.rejects(validatePersonalIdentityResult(manifest,{...artifact,inferenceSeed:Number(artifact.inferenceSeed)}),/provenance/)
  console.log('PASS actual generated personal PNG, private input provenance, exact decimal seed and tamper rejection; no Profile save/Track submit success inferred')
}
