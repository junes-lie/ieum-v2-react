import { estimatePitch, PITCH_ANALYSIS_VERSION } from './pitch.js'

export function isSupportedVoiceAnalysis(features) {
  return features?.version === 'ieum-basic-voice-v3' ||
    (features?.version === 'ieum-basic-voice-v4' && features.pitchAnalysisVersion === 'normalized-difference-v1')
}

const clamp01 = value => Math.max(0, Math.min(1, value))
const round = (value, places = 5) => Number(value.toFixed(places))

function percentile(values, ratio) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))]
}

function fftMagnitudes(input) {
  const length = input.length
  const real = new Float64Array(length)
  const imag = new Float64Array(length)
  for (let i = 0; i < length; i++) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (length - 1))
    real[i] = input[i] * window
  }
  for (let i = 1, j = 0; i < length; i++) {
    let bit = length >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[real[i], real[j]] = [real[j], real[i]]
      ;[imag[i], imag[j]] = [imag[j], imag[i]]
    }
  }
  for (let size = 2; size <= length; size <<= 1) {
    const angle = (-2 * Math.PI) / size
    const cosStep = Math.cos(angle)
    const sinStep = Math.sin(angle)
    for (let start = 0; start < length; start += size) {
      let wr = 1, wi = 0
      for (let offset = 0; offset < size / 2; offset++) {
        const even = start + offset
        const odd = even + size / 2
        const tr = wr * real[odd] - wi * imag[odd]
        const ti = wr * imag[odd] + wi * real[odd]
        real[odd] = real[even] - tr
        imag[odd] = imag[even] - ti
        real[even] += tr
        imag[even] += ti
        const nextWr = wr * cosStep - wi * sinStep
        wi = wr * sinStep + wi * cosStep
        wr = nextWr
      }
    }
  }
  const magnitudes = new Float64Array(length / 2)
  for (let i = 0; i < magnitudes.length; i++) magnitudes[i] = Math.hypot(real[i], imag[i])
  return magnitudes
}

function hashText(value) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function analyzeAudioBuffer(audioBuffer) {
  const source = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const fftSize = 1024
  const frameCount = Math.min(72, Math.max(12, Math.floor(source.length / fftSize)))
  const hop = Math.max(1, Math.floor((source.length - fftSize) / Math.max(1, frameCount - 1)))
  const frameRms = [], centroids = [], rolloffs = [], flatnesses = [], zcrs = [], fluxes = [], pitchMidis = []
  const bandEnergy = [0, 0, 0]
  let previous = null, globalPeak = 0

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
    const start = Math.min(Math.max(0, source.length - fftSize), frameIndex * hop)
    const frame = source.subarray(start, start + fftSize)
    let sumSquares = 0, crossings = 0
    for (let i = 0; i < frame.length; i++) {
      sumSquares += frame[i] * frame[i]
      globalPeak = Math.max(globalPeak, Math.abs(frame[i]))
      if (i && Math.sign(frame[i]) !== Math.sign(frame[i - 1])) crossings++
    }
    const currentRms = Math.sqrt(sumSquares / fftSize)
    frameRms.push(currentRms)
    if (frameIndex % 2 === 0) {
      const pitch = estimatePitch(frame, sampleRate, currentRms)
      if (pitch.hz >= 65 && pitch.hz <= 1050 && pitch.confidence >= .30) {
        pitchMidis.push(69 + 12 * Math.log2(pitch.hz / 440))
      }
    }
    zcrs.push(crossings / fftSize)
    const spectrum = fftMagnitudes(frame)
    let magnitudeSum = 0, weighted = 0, logSum = 0, cumulative = 0
    const power = new Float64Array(spectrum.length)
    for (let bin = 1; bin < spectrum.length; bin++) {
      const magnitude = spectrum[bin] + 1e-12
      const frequency = (bin * sampleRate) / fftSize
      const value = magnitude * magnitude
      power[bin] = value
      magnitudeSum += magnitude
      weighted += frequency * magnitude
      logSum += Math.log(magnitude)
      cumulative += value
      bandEnergy[frequency < 300 ? 0 : frequency < 2000 ? 1 : 2] += value
    }
    centroids.push(magnitudeSum ? weighted / magnitudeSum : 0)
    flatnesses.push(magnitudeSum ? Math.exp(logSum / (spectrum.length - 1)) / (magnitudeSum / (spectrum.length - 1)) : 0)
    let running = 0, rolloff = 0
    for (let bin = 1; bin < power.length; bin++) {
      running += power[bin]
      if (running >= cumulative * 0.85) { rolloff = (bin * sampleRate) / fftSize; break }
    }
    rolloffs.push(rolloff)
    if (previous) {
      let flux = 0
      for (let bin = 1; bin < spectrum.length; bin++) {
        const delta = spectrum[bin] / Math.max(1e-9, magnitudeSum) - previous[bin]
        if (delta > 0) flux += delta
      }
      fluxes.push(flux)
    }
    previous = Float64Array.from(spectrum, value => value / Math.max(1e-9, magnitudeSum))
  }

  const totalBand = bandEnergy.reduce((sum, value) => sum + value, 0) || 1
  const mean = values => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)
  const envelope = Array.from({ length: 24 }, (_, index) => {
    const from = Math.floor((index / 24) * frameRms.length)
    const to = Math.max(from + 1, Math.floor(((index + 1) / 24) * frameRms.length))
    return round(clamp01(mean(frameRms.slice(from, to)) * 9), 4)
  })
  const rms = mean(frameRms)
  const centroidHz = mean(centroids)
  const rolloffHz = mean(rolloffs)
  const flatness = clamp01(mean(flatnesses))
  const flux = clamp01(mean(fluxes) * 2.2)
  const zcr = clamp01(mean(zcrs) * 10)
  const activeThreshold = Math.max(.002, percentile(frameRms, .8) * .18)
  const activeFrames = frameRms.map(value => value >= activeThreshold)
  const activeRms = frameRms.filter((_, index) => activeFrames[index])
  const dynamicRange = clamp01((percentile(activeRms, .9) - percentile(activeRms, .1)) * 7)
  let onsetCount = 0
  for (let index = 0; index < activeFrames.length; index++) {
    if (activeFrames[index] && (index === 0 || !activeFrames[index - 1])) onsetCount++
  }
  const activeRatio = activeFrames.filter(Boolean).length / Math.max(1, activeFrames.length)
  const articulation = clamp01((onsetCount / Math.max(.5, audioBuffer.duration)) / 4)
  const pitchDiffs = pitchMidis.slice(1).map((value, index) => Math.abs(value - pitchMidis[index])).filter(value => value <= 7)
  const pitchMotion = pitchDiffs.length ? percentile(pitchDiffs, .6) : 0
  const pitchRange = pitchMidis.length > 2 ? percentile(pitchMidis, .85) - percentile(pitchMidis, .15) : 0
  const pitchVariation = clamp01(pitchMotion / 3.5 * .62 + pitchRange / 20 * .38)
  const features = {
    version: 'ieum-basic-voice-v4',
    pitchAnalysisVersion: PITCH_ANALYSIS_VERSION,
    durationSec: round(audioBuffer.duration, 3),
    sampleRate,
    rms: round(rms),
    peak: round(globalPeak),
    energy: round(clamp01(rms * 9)),
    low: round(bandEnergy[0] / totalBand),
    mid: round(bandEnergy[1] / totalBand),
    high: round(bandEnergy[2] / totalBand),
    centroidHz: round(centroidHz, 2),
    rolloffHz: round(rolloffHz, 2),
    brightness: round(clamp01(centroidHz / 4800)),
    roughness: round(clamp01(flatness * .65 + flux * .35)),
    spectralFlatness: round(flatness),
    spectralFlux: round(flux),
    zeroCrossing: round(zcr),
    dynamicRange: round(dynamicRange),
    activeRatio: round(activeRatio),
    articulation: round(articulation),
    pitchVariation: round(pitchVariation),
    pitchFrameCount: pitchMidis.length,
    envelope
  }
  features.fingerprint = hashText(JSON.stringify(features))
  return features
}

export function buildVoiceLayer(projectSeed, partId, features) {
  if (!features?.fingerprint) return null
  const key = `${projectSeed}:${partId}:${features.fingerprint}`
  const seedHex = hashText(key)
  const seed = Number.parseInt(seedHex, 16) >>> 0
  const partDepth = { soprano:.72, alto:.59, tenor:.48, bass:.36 }[partId] ?? .52
  const layer = {
    version: 'ieum-layer-v4-voice-grain',
    partId,
    sourceFingerprint: features.fingerprint,
    projectSeed,
    seed,
    baseRadius: round(partDepth + (features.brightness - .5) * .12 + (features.low - .33) * .045, 4),
    spread: round(.075 + features.dynamicRange * .14 + features.spectralFlux * .035, 4),
    turbulence: round(.35 + features.roughness * 1.55, 4),
    filamentCount: Math.round(10 + features.energy * 10 + features.spectralFlux * 6),
    particleCount: Math.round(42 + features.brightness * 45 + features.roughness * 38),
    opacity: round(.2 + features.energy * .24, 4),
    drift: round(.16 + features.spectralFlux * .45, 4),
    continuity: round(clamp01(features.activeRatio * .72 + (1 - features.articulation) * .28), 4),
    articulation: round(features.articulation, 4),
    pitchWobble: round(features.pitchVariation, 4),
    phase: round((seed % 6283) / 1000, 4),
    envelope: features.envelope
  }
  layer.signature = hashText(JSON.stringify(layer))
  return layer
}

export function projectRecordSignature(projectSeed, layers) {
  return hashText(`${projectSeed}:${layers.filter(Boolean).map(layer => layer.signature).join(':')}`)
}

export const analysisInternals = { hashText, fftMagnitudes }
