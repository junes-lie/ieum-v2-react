import assert from 'node:assert/strict'
import { estimatePitch } from '../src/pitch.js'

const sampleRate = 48000
const size = 4096
const makeVoiceLike = (frequency, amplitude = .03, noise = .003) => {
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

for (const expected of [82.41, 110, 146.83, 196, 261.63, 329.63, 440, 659.25]) {
  const result = estimatePitch(makeVoiceLike(expected), sampleRate)
  assert.ok(result.hz, `${expected} Hz was rejected: ${JSON.stringify(result)}`)
  assert.ok(Math.abs(1200 * Math.log2(result.hz / expected)) < 35, `${expected} Hz detected as ${result.hz}`)
}

const quiet = estimatePitch(makeVoiceLike(220, .0002, .00005), sampleRate)
assert.equal(quiet.reason, 'low-signal')
console.log('Pitch detector: 8/8 voice-like pitches detected within 35 cents; quiet input rejected.')
