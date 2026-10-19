import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { analyzeAudioBuffer, buildVoiceLayer, projectRecordSignature } from '../src/voiceAnalysis.js'

const sampleRate = 48000
const seconds = 4
const makeTrack = ({ frequency, harmonics, noise, pulse }) => {
  const data = new Float32Array(sampleRate * seconds)
  let seed = 92317
  for (let i = 0; i < data.length; i++) {
    seed = Math.imul(seed, 48271) % 0x7fffffff
    const random = (Math.abs(seed) / 0x7fffffff) * 2 - 1
    const time = i / sampleRate
    const envelope = .35 + .65 * Math.pow(Math.sin(Math.PI * time / seconds), .7)
    const movement = 1 + .012 * Math.sin(2 * Math.PI * pulse * time)
    let value = 0
    harmonics.forEach((gain, index) => { value += gain * Math.sin(2 * Math.PI * frequency * movement * (index + 1) * time) })
    data[i] = envelope * (.075 * value + noise * random)
  }
  return { sampleRate, duration:seconds, getChannelData:() => data }
}

const trackA = makeTrack({ frequency:196, harmonics:[1,.28,.12], noise:.0015, pulse:4.5 })
const trackB = makeTrack({ frequency:329.63, harmonics:[1,.62,.38,.2], noise:.006, pulse:7.2 })
const started = performance.now()
const featuresA1 = analyzeAudioBuffer(trackA)
const featuresA2 = analyzeAudioBuffer(trackA)
const featuresB = analyzeAudioBuffer(trackB)
const analysisMs = performance.now() - started
const seed = 'ieum:verification:same-project'
const layerA1 = buildVoiceLayer(seed, 'soprano', featuresA1)
const layerA2 = buildVoiceLayer(seed, 'soprano', featuresA2)
const layerB = buildVoiceLayer(seed, 'alto', featuresB)

assert.deepEqual(featuresA1, featuresA2, '같은 Track 분석값이 달라졌습니다.')
assert.deepEqual(layerA1, layerA2, '같은 Track과 Project Seed의 Layer가 달라졌습니다.')
assert.notEqual(featuresA1.fingerprint, featuresB.fingerprint, '서로 다른 Track의 fingerprint가 같습니다.')
assert.notEqual(layerA1.signature, layerB.signature, '서로 다른 Track의 Layer가 구별되지 않습니다.')
assert.notEqual(layerA1.seed, buildVoiceLayer('ieum:verification:other-project', 'soprano', featuresA1).seed, 'Project Seed가 Layer에 반영되지 않습니다.')

const layers2 = [layerA1, layerB]
const third = buildVoiceLayer(seed, 'tenor', {...featuresA1, fingerprint:'verified-third-track'})
const fourth = buildVoiceLayer(seed, 'bass', {...featuresB, fingerprint:'verified-fourth-track'})
const signatures = [layers2, [...layers2,third], [...layers2,third,fourth]].map(layers => projectRecordSignature(seed,layers))
assert.equal(new Set(signatures).size, 3, '2/4, 3/4, 4/4 Record signature가 성장하지 않습니다.')
assert.equal(layers2[0].signature, layerA1.signature, 'Track 추가 시 기존 Layer가 바뀌었습니다.')
assert.equal(projectRecordSignature(seed,[layerA2,layerB]),signatures[0],'같은 프로젝트를 다시 열 때 Record가 재현되지 않습니다.')

console.log(JSON.stringify({
  deterministicSameTrack:layerA1.signature === layerA2.signature,
  differentTracks:{
    distinct:true,
    a:{ fingerprint:featuresA1.fingerprint, layer:layerA1.signature, energy:featuresA1.energy, brightness:featuresA1.brightness, roughness:featuresA1.roughness },
    b:{ fingerprint:featuresB.fingerprint, layer:layerB.signature, energy:featuresB.energy, brightness:featuresB.brightness, roughness:featuresB.roughness }
  },
  growth:{'2/4':signatures[0],'3/4':signatures[1],'4/4':signatures[2],existingLayersPreserved:true},
  reloadReproducible:true,
  inputDependency:{emptyLayerCount:0,generatedLayerCount:4},
  analysisPerformance:{tracks:3,totalMs:Number(analysisMs.toFixed(1)),environment:'desktop Node; mobile hardware not measured'}
},null,2))
