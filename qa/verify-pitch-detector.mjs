import assert from 'node:assert/strict'
import { estimatePitch } from '../src/pitch.js'

const size = 4096
const makeVoiceLike = (frequency, amplitude = .03, noise = .003, sampleRate = 48000) => {
  const data = new Float32Array(size)
  let seed = 17
  for (let i = 0; i < size; i++) {
    seed = (seed * 16807) % 2147483647
    const random = (seed / 2147483647) * 2 - 1
    const phase = 2 * Math.PI * frequency * i / sampleRate
    data[i] = amplitude * (Math.sin(phase) + .35 * Math.sin(2 * phase) + .16 * Math.sin(3 * phase)) + noise * random
  }
  return data
}

for (const sampleRate of [44100,48000]) for (const expected of [82.41, 110, 146.83, 196, 261.63, 329.63, 440, 659.25]) {
  const result = estimatePitch(makeVoiceLike(expected,.03,.003,sampleRate), sampleRate)
  assert.ok(result.hz, `${expected} Hz was rejected: ${JSON.stringify(result)}`)
  assert.ok(Math.abs(1200 * Math.log2(result.hz / expected)) < 35, `${expected} Hz detected as ${result.hz}`)
}

const quiet = estimatePitch(makeVoiceLike(220, .0002, .00005), 48000)
assert.equal(quiet.reason, 'low-signal')
const noise = new Float32Array(size)
let seed = 71
for (let i=0;i<size;i++) {seed=seed*16807%2147483647;noise[i]=.04*(seed/2147483647*2-1)}
assert.equal(estimatePitch(noise,48000).reason,'no-periodicity','Loud aperiodic noise must not be an accepted pitch')
assert.equal(estimatePitch(new Float32Array(size).fill(.03),48000).hz,0,'DC offset must not create pitch')
const offsetVoice=makeVoiceLike(220);for(let i=0;i<size;i++)offsetVoice[i]+=.02
assert.ok(Math.abs(1200*Math.log2(estimatePitch(offsetVoice,48000).hz/220))<35,'DC offset must not shift voiced pitch')
console.log('Pitch detector: 16/16 voice-like pitches at 44.1/48kHz within 35 cents; quiet/noise/DC rejection and voiced DC offset passed.')
