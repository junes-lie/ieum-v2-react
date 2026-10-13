import assert from 'node:assert/strict'
import {buildIdentityInputManifest,buildVoiceTraitSnapshot} from '../src/voiceIdentityContract.js'
import {prepareVoiceVisualControls} from '../src/voiceVisualMapping.js'
import {analyzeAudioBuffer} from '../src/voiceAnalysis.js'

const pcm=Float32Array.from({length:24000},(_,i)=>.1*Math.sin(i*2*Math.PI*220/24000))
const features=analyzeAudioBuffer({sampleRate:24000,duration:1,getChannelData:()=>pcm})
const make=async data=>buildVoiceTraitSnapshot(await buildIdentityInputManifest({userId:'private-mapping-owner',profileRevision:'revision-1',generatorVersion:'generator-test',
  sources:[{recordId:'sample',purpose:'voice-sample',sha256:'a'.repeat(64),analysisVersion:data.version,data}]}))
const snapshot=await make(features),before=structuredClone(snapshot)
const controls=await prepareVoiceVisualControls(snapshot)
assert.deepEqual(snapshot,before)
assert.deepEqual(controls,await prepareVoiceVisualControls(JSON.parse(JSON.stringify(snapshot))))
assert.equal(controls.identityCondition.detailScale,controls.flowStyle.brightness)
assert.equal(controls.identityCondition.surfaceVariation,controls.flowStyle.roughness)
assert.equal(controls.identityCondition.expansionContrast,controls.flowStyle.dynamics)
assert.ok(!JSON.stringify(controls.flowStyle).includes(snapshot.variationSeed))
assert.ok(!JSON.stringify(controls.flowStyle).includes('private-mapping-owner'))
assert.ok(!('shape' in controls.flowStyle))
for(const [field,condition,flow] of [['brightness','detailScale','brightness'],['roughness','surfaceVariation','roughness'],['dynamicRange','expansionContrast','dynamics']]){
  const value=features[field]>.5?.1:.8
  const changed=await prepareVoiceVisualControls(await make({...features,[field]:value}))
  assert.equal(changed.identityCondition[condition],value)
  assert.equal(changed.flowStyle[flow],value)
  assert.equal(changed.flowStyle.variation,controls.flowStyle.variation)
}
for(const field of ['brightness','roughness','dynamicRange']){
  await assert.rejects(prepareVoiceVisualControls(await make({...features,[field]:null})),/requires measured/)
}
console.log('PASS: shared proxies → separate Identity condition/flow style; reproducible, private IDs absent, unknown mapping rejected; no artwork or AI success claim')
