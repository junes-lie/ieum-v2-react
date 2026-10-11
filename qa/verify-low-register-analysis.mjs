import assert from 'node:assert/strict'
import {analyzeAudioBuffer} from '../src/voiceAnalysis.js'
const cases=[]
for(const rate of [44100,48000])for(const hz of [65.41,73.42,82.41,110,146.83,220,440]){
 const samples=Float32Array.from({length:rate*2},(_,i)=>.03*(Math.sin(2*Math.PI*hz*i/rate)+.35*Math.sin(4*Math.PI*hz*i/rate)+.16*Math.sin(6*Math.PI*hz*i/rate)))
 const buffer={sampleRate:rate,duration:2,getChannelData:()=>samples},features=analyzeAudioBuffer(buffer)
 assert.ok(features.pitchFrameCount>=30,`${rate}Hz/${hz}Hz must retain actual periodic frames`)
 assert.ok(features.pitchVariation<.01,'Stable low-register tone must not invent pitch motion')
 assert.deepEqual(features,analyzeAudioBuffer(buffer),'Same input and version must remain reproducible')
 cases.push({rate,hz,pitchFrameCount:features.pitchFrameCount,pitchVariation:features.pitchVariation})
}
const rate=48000,changing=Float32Array.from({length:rate*2},(_,i)=>.03*Math.sin(2*Math.PI*(i<rate?82.41:110)*i/rate))
assert.ok(analyzeAudioBuffer({sampleRate:rate,duration:2,getChannelData:()=>changing}).pitchVariation>.02,'Measured low-register change must not collapse to a missing-pitch zero')
console.log(JSON.stringify({passed:true,cases,limits:'Bounded synthetic DSP regression; no human range, vibrato, perceptual timbre or Identicon approval.'}))
