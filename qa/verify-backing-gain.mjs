import assert from 'node:assert/strict'
globalThis.window={}
const {backingPlaybackGain}=await import('../src/audio.js')
const buffer=channels=>({numberOfChannels:channels.length,getChannelData:index=>Float32Array.from(channels[index])})
assert.equal(backingPlaybackGain(buffer([[0,0]])),1)
assert.equal(backingPlaybackGain(buffer([[.00001,-.00001]])),1,'Silence/noise floor must not be amplified')
assert.equal(backingPlaybackGain(buffer([[.02,-.02]])),1,'Quiet backing must not be boosted')
const stereo=buffer([[.8,0,0,0],[-.8,0,0,0]])
assert.ok(Math.abs(backingPlaybackGain(stereo)-.125)<1e-6)
const transient=buffer([[.9,...Array(9999).fill(.03)]])
assert.ok(backingPlaybackGain(transient)*.9<=.6+1e-7,'Transient headroom must survive gain correction')
assert.throws(()=>backingPlaybackGain(buffer([[NaN]])),/유효하지/)
assert.equal(backingPlaybackGain(transient),backingPlaybackGain(transient),'Same decoded source must keep fixed gain')
console.log('PASS backing gain: fixed RMS/peak-aware scaling, no amplification, quiet-source protection, stereo and invalid samples')
