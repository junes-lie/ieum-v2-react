import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {analyzeAudioBuffer} from '../src/voiceAnalysis.js'
import {buildIdentityInputManifest,buildVoiceTraitSnapshot,buildVoiceRepresentationInputs,buildTrackIdentityInput} from '../src/voiceIdentityContract.js'

// Synthetic signal proves the input contract, not human timbre or graphic quality.
const rate=24000,pcm=Float32Array.from({length:rate},(_,i)=>.1*Math.sin(2*Math.PI*220*i/rate))
const features=analyzeAudioBuffer({sampleRate:rate,duration:1,getChannelData:()=>pcm})
const sample={recordId:'sample',purpose:'voice-sample',sha256:createHash('sha256').update(Buffer.from(pcm.buffer)).digest('hex'),analysisVersion:features.version,data:features}
const args={userId:'private-test-user',profileRevision:'profile-1',generatorVersion:'generator-test',sources:[sample]}
const manifest=await buildIdentityInputManifest(args),before=structuredClone(manifest)
const traits=await buildVoiceTraitSnapshot(manifest)
assert.deepEqual(manifest,before)
assert.deepEqual(traits,await buildVoiceTraitSnapshot(JSON.parse(JSON.stringify(manifest))))
const inputs=await buildVoiceRepresentationInputs(traits)
assert.notEqual(inputs.identity.representation,inputs.resonance.representation)
assert.deepEqual(inputs.identity.personalTraits,inputs.resonance.personalTraits)
assert.equal(inputs.identity.traitDigest,inputs.resonance.traitDigest)
assert.equal(inputs.resonance.track,null)
for(const name of ['breathiness','vibrato','bpm','rhythmComplexity'])assert.equal(inputs.identity.personalTraits.candidates[name].value,null)
assert.equal(inputs.identity.personalTraits.candidates.brightness.status,'estimated')
assert.equal(inputs.identity.personalTraits.candidates.brightness.confidence,null)
assert.ok(!JSON.stringify(inputs).includes(args.userId),'Raw private user ID must not enter representation inputs')
assert.ok(!('shape' in inputs.resonance),'Personal shape must not be copied into vinyl input')
inputs.identity.personalTraits.candidates.brightness.value=.999
assert.notEqual(inputs.resonance.personalTraits.candidates.brightness.value,.999,'Representation inputs must not share mutable data')
assert.deepEqual(traits,await buildVoiceTraitSnapshot(manifest))

const other=await buildVoiceTraitSnapshot(await buildIdentityInputManifest({...args,userId:'other-private-user'}))
assert.deepEqual(other.assessment,traits.assessment,'User ID must not fabricate measured traits')
assert.notEqual(other.variationSeed,traits.variationSeed)
const changedFeatures={...features,brightness:.8}
const changed=await buildVoiceTraitSnapshot(await buildIdentityInputManifest({...args,sources:[{...sample,data:changedFeatures}]}))
assert.notEqual(changed.snapshotDigest,traits.snapshotDigest)
assert.equal(changed.variationSeed,traits.variationSeed,'One-trait perturbation must not hide behind reseeding')
assert.equal(changed.assessment.candidates.brightness.value,.8)
assert.equal(changed.assessment.candidates.roughness.value,traits.assessment.candidates.roughness.value)
const unknown=await buildVoiceTraitSnapshot(await buildIdentityInputManifest({...args,sources:[{...sample,analysisVersion:'unsupported',data:{version:'unsupported'}}]}))
assert.ok(Object.values(unknown.assessment.candidates).every(field=>field.value===null))

const trackArgs={trackId:'submitted-track',identityRef:{id:'opaque-personal-result',revision:'result-1',outputSha256:'a'.repeat(64)},
  generatorVersion:'layer-test',source:{...sample,recordId:'submitted-track',purpose:'project-track',data:{analysis:features}}}
const track=await buildTrackIdentityInput(trackArgs),trackBefore=structuredClone(track)
const personalResultRef={...trackArgs.identityRef,inputDigest:manifest.inputDigest,generatorVersion:args.generatorVersion}
const combined=await buildVoiceRepresentationInputs(traits,{trackInput:track,personalResultRef})
assert.deepEqual(combined.identity,(await buildVoiceRepresentationInputs(traits)).identity,'Track must not regenerate Identity input')
assert.equal(combined.resonance.track.trackId,trackArgs.trackId)
assert.equal(combined.resonance.track.layerGeneratorVersion,trackArgs.generatorVersion)
assert.equal(combined.resonance.track.assessment.purpose,'project-track')
assert.equal(combined.identity.personalTraits.purpose,'voice-sample')
assert.deepEqual(track,trackBefore)
await assert.rejects(buildVoiceTraitSnapshot({...manifest,profileRevision:'tampered'}),/changed/)
await assert.rejects(buildVoiceRepresentationInputs({...traits,profileRevision:'tampered'}),/changed/)
await assert.rejects(buildVoiceRepresentationInputs(traits,{trackInput:{...track,trackId:'tampered'}}),/changed/)
await assert.rejects(buildVoiceRepresentationInputs(traits,{trackInput:track}),/does not match/)
await assert.rejects(buildVoiceRepresentationInputs(traits,{trackInput:track,personalResultRef:{...personalResultRef,inputDigest:other.personalInputDigest}}),/does not match/)
await assert.rejects(buildVoiceRepresentationInputs(traits,{trackInput:track,personalResultRef:{...personalResultRef,id:'another-result'}}),/does not match/)
console.log(JSON.stringify({sharedMeasuredTraits:true,separateRepresentationInputs:true,unknownValuesPreserved:true,
  trackDoesNotReplaceProfile:true,noSharedSilhouette:true,noRawUserId:true,
  scope:'Input contracts only; no graphic generation, submission, Mix or perceptual acceptance'},null,2))
