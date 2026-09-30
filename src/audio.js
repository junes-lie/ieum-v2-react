import { analyzeAudioBuffer } from './voiceAnalysis.js'

const AudioContextClass = window.AudioContext || window.webkitAudioContext
const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext

const runtime = {
  context: null,
  stream: null,
  source: null,
  analyser: null,
  recorder: null,
  chunks: [],
  raf: 0,
  startedAt: 0,
  guideNodes: [],
  recordingUrl: '',
  recordingBlob: null,
  decoded: null,
  lastAnalysis: null,
  syncOffsetSec: 0,
  playback: [],
  microphoneInfo: null,
  recordingGuideState: null,
  activeElapsedSec: 0,
  activeStartedAt: 0
}

function context() {
  if (!AudioContextClass) throw new Error('이 브라우저는 Web Audio API를 지원하지 않아요.')
  if (!runtime.context || runtime.context.state === 'closed') runtime.context = new AudioContextClass()
  return runtime.context
}

export function isMicrophonePermissionError(error) {
  return ['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(error?.name)
}

export function microphoneErrorMessage(error) {
  if (!window.isSecureContext || error?.name === 'SecurityError') {
    return '보안 연결(HTTPS)이 아니어서 마이크를 열 수 없어요. Safari 또는 Chrome에서 https://ieum-v2-react.vercel.app 을 직접 열어 주세요.'
  }
  if (isMicrophonePermissionError(error)) {
    return '마이크 접근이 차단됐어요. 메신저·SNS·앱 내부 브라우저가 아니라 Safari 또는 Chrome에서 열고, 주소창의 사이트 설정에서 마이크를 허용한 뒤 다시 시도해 주세요.'
  }
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
    return '사용 가능한 마이크를 찾지 못했어요. 블루투스·이어폰 연결을 확인하고 다시 시도해 주세요.'
  }
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
    return '다른 앱이 마이크를 사용 중이거나 운영체제가 마이크를 열지 못했어요. 통화·녹음 앱을 닫고 다시 시도해 주세요.'
  }
  if (error?.name === 'PermissionTimeoutError') return error.message
  return error?.message || '마이크를 시작하지 못했어요. Safari 또는 Chrome에서 다시 시도해 주세요.'
}

async function configureMicrophoneTrack(track, voiceProcessing) {
  if (!track?.applyConstraints) return
  try {
    const supported = navigator.mediaDevices.getSupportedConstraints?.() || {}
    const constraints = {}
    if (supported.echoCancellation) constraints.echoCancellation = voiceProcessing
    if (supported.noiseSuppression) constraints.noiseSuppression = voiceProcessing
    if (supported.autoGainControl) constraints.autoGainControl = voiceProcessing
    if (Object.keys(constraints).length) await track.applyConstraints(constraints)
  } catch { /* Mobile browsers may keep their own input processing. */ }
}

export async function requestMicrophone({ voiceProcessing = false } = {}) {
  if (!window.isSecureContext) {
    const error = new Error('HTTPS가 아닌 환경에서는 마이크를 사용할 수 없어요.')
    error.name = 'SecurityError'
    throw error
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    const error = new Error('이 브라우저는 마이크 입력을 지원하지 않아요. Safari 또는 Chrome에서 열어 주세요.')
    error.name = 'NotSupportedError'
    throw error
  }
  if (runtime.stream?.active) {
    await configureMicrophoneTrack(runtime.stream.getAudioTracks()[0],voiceProcessing)
    return runtime.stream
  }
  let timedOut = false
  // `audio: true` is intentionally used for the first permission request.
  // Some mobile WebViews reject optional desktop-oriented audio constraints
  // before they even show the operating-system permission prompt.
  const pending = navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  let timeoutId = 0
  const timeout = new Promise((_,reject) => { timeoutId = window.setTimeout(() => {
    timedOut = true
    const error = new Error('마이크 권한 응답이 없습니다. 주소창의 마이크 권한을 직접 허용하거나 Safari·Chrome에서 다시 열어 주세요.')
    error.name = 'PermissionTimeoutError'
    reject(error)
  }, 8000) })
  try { runtime.stream = await Promise.race([pending,timeout]) }
  finally { if (!timedOut) window.clearTimeout(timeoutId) }
  pending.then(stream => { if (timedOut) stream.getTracks().forEach(track=>track.stop()) }).catch(()=>{})
  const track = runtime.stream.getAudioTracks()[0]
  // Range/profile sampling prefers an unprocessed signal. Project recording
  // enables voice processing when speaker-played guides could leak back in.
  await configureMicrophoneTrack(track,voiceProcessing)
  runtime.microphoneInfo = {
    label: track?.label || '권한이 허용된 마이크',
    settings: track?.getSettings?.() || {},
    secureContext: window.isSecureContext,
    mediaRecorder: Boolean(window.MediaRecorder),
    measuredAt: new Date().toISOString()
  }
  const ctx = context()
  await ctx.resume()
  runtime.source = ctx.createMediaStreamSource(runtime.stream)
  runtime.analyser = ctx.createAnalyser()
  runtime.analyser.fftSize = 2048
  runtime.analyser.smoothingTimeConstant = 0.68
  runtime.source.connect(runtime.analyser)
  return runtime.stream
}

export function monitorInput(onFrame, { detectPitch = false } = {}) {
  cancelAnimationFrame(runtime.raf)
  const buffer = new Float32Array(runtime.analyser?.fftSize || 2048)
  const estimatePitch = (samples, sampleRate, rms) => {
    // Keep the proven normalized-autocorrelation path for live phone voices.
    // The fake device was much more periodic than a human voice, so the YIN
    // threshold used in the previous build rejected almost every phone frame.
    if (rms < 0.004) return { hz:0, confidence:0 }
    const minLag = Math.floor(sampleRate / 1000)
    const maxLag = Math.min(Math.floor(sampleRate / 70), samples.length / 2)
    let mean = 0
    for (let i = 0; i < samples.length; i += 4) mean += samples[i]
    mean /= Math.ceil(samples.length / 4)
    let bestLag = 0, bestScore = 0
    const scores = new Float32Array(maxLag + 1)
    for (let lag = minLag; lag <= maxLag; lag += 2) {
      let correlation = 0, energyA = 0, energyB = 0
      for (let i = 0; i < samples.length - lag; i += 4) {
        const a = samples[i] - mean
        const b = samples[i + lag] - mean
        correlation += a * b
        energyA += a * a
        energyB += b * b
      }
      const score = correlation / Math.sqrt(Math.max(1e-12,energyA * energyB))
      scores[lag] = score
      if (score > bestScore) { bestScore = score; bestLag = lag }
    }
    if (!bestLag || bestScore < 0.48) return { hz:0, confidence:Math.max(0,bestScore) }
    const left = scores[Math.max(minLag,bestLag-2)] || bestScore
    const right = scores[Math.min(maxLag,bestLag+2)] || bestScore
    const denominator = left - 2 * bestScore + right
    const refinedLag = bestLag + (Math.abs(denominator) > 1e-8 ? (left-right) / denominator : 0)
    return { hz:sampleRate / Math.max(1,refinedLag), confidence:bestScore }
  }
  let pitchFrame = 0, lastPitch = 0, lastConfidence = 0
  const tick = () => {
    if (!runtime.analyser) return
    runtime.analyser.getFloatTimeDomainData(buffer)
    let sum = 0, peak = 0, crossings = 0
    for (let i = 0; i < buffer.length; i++) {
      const value = buffer[i]
      sum += value * value
      peak = Math.max(peak, Math.abs(value))
      if (i && Math.sign(value) !== Math.sign(buffer[i - 1])) crossings++
    }
    const rms = Math.sqrt(sum / buffer.length)
    const pitchFresh = detectPitch && pitchFrame++ % 4 === 0
    if (pitchFresh) {
      const estimate = estimatePitch(buffer, context().sampleRate, rms)
      lastPitch = estimate.hz
      lastConfidence = estimate.confidence
    }
    const pitchHz = lastPitch
    onFrame?.({
      level: Math.min(1, rms * 8),
      peak: Math.min(1, peak),
      crossings: crossings / buffer.length,
      pitchHz,
      pitchConfidence: lastConfidence,
      pitchFresh,
      midi: pitchHz ? 69 + 12 * Math.log2(pitchHz / 440) : null,
      waveform: new Float32Array(buffer)
    })
    runtime.raf = requestAnimationFrame(tick)
  }
  runtime.raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(runtime.raf)
}

function createTone(ctx, destination, start, duration, frequency, gainValue, type = 'sine') {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.025)
  gain.gain.setValueAtTime(gainValue, start + Math.max(0.03, duration - 0.05))
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
  runtime.guideNodes.push(osc)
}

export function scheduleSyntheticTrack(ctx, destination, start, duration, partIndex, gain = 0.055) {
  const roots = [261.63, 220, 174.61, 130.81]
  const notes = [0, 4, 7, 4, 2, 5, 9, 7]
  for (let t = 0, n = 0; t < duration; t += 0.5, n++) {
    const semitone = notes[(n + partIndex * 2) % notes.length]
    const f = roots[partIndex] * Math.pow(2, semitone / 12)
    createTone(ctx, destination, start + t, Math.min(0.43, duration - t), f, gain, partIndex === 3 ? 'triangle' : 'sine')
  }
}

export function scheduleBacking(ctx, destination, start, duration, gain = 0.07, timelineOffset = 0) {
  const chords = [[130.81,164.81,196],[146.83,174.61,220],[110,138.59,164.81],[130.81,164.81,196]]
  const firstBeat = Math.floor(timelineOffset / 2) * 2
  for (let absolute = firstBeat, c = firstBeat / 2; absolute < timelineOffset + duration; absolute += 2, c++) {
    const localStart = Math.max(0, absolute - timelineOffset)
    const skipped = Math.max(0, timelineOffset - absolute)
    const noteDuration = Math.min(1.9 - skipped, duration - localStart)
    if (noteDuration <= .02) continue
    chords[c % chords.length].forEach(f => createTone(ctx, destination, start + localStart, noteDuration, f, gain / 3, 'triangle'))
  }
}

async function decodeBlob(ctx, blob) {
  return ctx.decodeAudioData(await blob.arrayBuffer())
}

function scheduleBuffer(ctx, destination, buffer, start, sourceOffsetSec = 0, gainValue = .72, panValue = 0) {
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  const pan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null
  source.buffer = buffer
  gain.gain.value = gainValue
  if (pan) {
    pan.pan.value = panValue
    source.connect(gain).connect(pan).connect(destination)
  } else source.connect(gain).connect(destination)
  source.start(start, Math.min(Math.max(0, sourceOffsetSec), Math.max(0, buffer.duration - .01)))
  runtime.playback.push(source)
  return source
}

export function stopGuides() {
  runtime.guideNodes.splice(0).forEach(node => { try { node.stop() } catch {} })
  runtime.playback.splice(0).forEach(node => { try { node.stop() } catch {} })
}

function scheduleRecordingGuides(offsetSec = 0) {
  const state = runtime.recordingGuideState
  if (!state) return
  const ctx = context()
  const start = ctx.currentTime + .035
  const remaining = Math.max(.1, state.duration - offsetSec)
  if (state.guides.backing) scheduleBacking(ctx, ctx.destination, start, remaining, .07, offsetSec)
  state.decodedGuides.forEach(({track,buffer}) => {
    const index = Number(track.partIndex)
    if (state.guides.parts[index]) scheduleBuffer(ctx, ctx.destination, buffer, start, offsetSec + (track.syncOffsetMs || 0) / 1000, .58, (index - 1.5) * .12)
  })
}

export async function startRecording({ onFrame, guides, guideTracks = [], countIn = 0 }) {
  const hasSpeakerGuides = Boolean(guides?.backing || guides?.parts?.some(Boolean))
  const stream = await requestMicrophone({ voiceProcessing:hasSpeakerGuides })
  if (!window.MediaRecorder) {
    stopMicrophone()
    const error = new Error('이 브라우저는 마이크 입력은 지원하지만 오디오 녹음 저장은 지원하지 않아요. 최신 Safari 또는 Chrome에서 열어 주세요.')
    error.name = 'NotSupportedError'
    throw error
  }
  const ctx = context()
  await ctx.resume()
  const decodedGuides = await Promise.all(guideTracks.filter(track => track?.blob).map(async track => ({ track, buffer: await decodeBlob(ctx, track.blob) })))
  runtime.chunks = []
  const mime = ['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(type => MediaRecorder.isTypeSupported(type)) || ''
  runtime.recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  runtime.recorder.ondataavailable = event => { if (event.data.size) runtime.chunks.push(event.data) }
  runtime.recorder.start(180)
  runtime.startedAt = performance.now()
  runtime.activeElapsedSec = 0
  runtime.activeStartedAt = performance.now()
  monitorInput(onFrame)
  const start = ctx.currentTime + Math.max(0.05, countIn)
  runtime.syncOffsetSec = Math.max(0, start - ctx.currentTime)
  const duration = 35
  runtime.recordingGuideState = { guides, decodedGuides, duration }
  if (guides.backing) scheduleBacking(ctx, ctx.destination, start, duration)
  decodedGuides.forEach(({track,buffer}) => {
    const index = Number(track.partIndex)
    if (guides.parts[index]) scheduleBuffer(ctx, ctx.destination, buffer, start, (track.syncOffsetMs || 0) / 1000, .58, (index - 1.5) * .12)
  })
  return { mimeType: runtime.recorder.mimeType, scheduledAt: start }
}

export function pauseRecording() {
  if (runtime.recorder?.state === 'recording') {
    runtime.recorder.pause()
    runtime.activeElapsedSec += Math.max(0, (performance.now() - runtime.activeStartedAt) / 1000)
    stopGuides()
  }
}

export function resumeRecording() {
  if (runtime.recorder?.state === 'paused') {
    runtime.recorder.resume()
    runtime.activeStartedAt = performance.now()
    scheduleRecordingGuides(runtime.activeElapsedSec)
  }
}

export async function stopRecording() {
  if (!runtime.recorder || runtime.recorder.state === 'inactive') return null
  const recorder = runtime.recorder
  if (recorder.state === 'recording') runtime.activeElapsedSec += Math.max(0, (performance.now() - runtime.activeStartedAt) / 1000)
  await new Promise(resolve => {
    recorder.addEventListener('stop', resolve, { once: true })
    recorder.stop()
  })
  cancelAnimationFrame(runtime.raf)
  stopGuides()
  runtime.recordingGuideState = null
  const blob = new Blob(runtime.chunks, { type: recorder.mimeType || 'audio/webm' })
  // A prior recording URL may still be used by the Voice Profile player.
  // Blob URLs are page-scoped and are released on navigation; revoking here
  // makes that independently stored recording unplayable.
  runtime.recordingUrl = URL.createObjectURL(blob)
  runtime.recordingBlob = blob
  let decoded = null, features = null
  try {
    decoded = await context().decodeAudioData(await blob.arrayBuffer())
    features = analyzeAudioBuffer(decoded)
  } catch {}
  runtime.decoded = decoded
  runtime.lastAnalysis = features ? { features, duration: decoded?.duration || 0 } : null
  return {
    blob,
    url: runtime.recordingUrl,
    duration: decoded?.duration || runtime.activeElapsedSec,
    features,
    bytes: blob.size,
    mimeType: blob.type,
    syncOffsetMs: Math.round(runtime.syncOffsetSec * 1000)
  }
}

export async function analyzeBlob(blob) {
  const ctx = context()
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer())
  return { decoded, features: analyzeAudioBuffer(decoded), duration: decoded.duration }
}

export function cancelRecording() {
  cancelAnimationFrame(runtime.raf)
  stopGuides()
  if (runtime.recorder && runtime.recorder.state !== 'inactive') runtime.recorder.stop()
  runtime.chunks = []
  runtime.recordingGuideState = null
  runtime.activeElapsedSec = 0
}

export async function playCurrentMix({ included, tracks = [], duration = 18, onEnded }) {
  stopGuides()
  const ctx = context()
  await ctx.resume()
  const start = ctx.currentTime + 0.08
  if (included.backing) scheduleBacking(ctx, ctx.destination, start, duration)
  for (const track of tracks) {
    const index = Number(track.partIndex)
    if (!included.parts[index] || !track.blob) continue
    const buffer = await decodeBlob(ctx, track.blob)
    scheduleBuffer(ctx, ctx.destination, buffer, start, (track.syncOffsetMs || 0) / 1000, .68, (index - 1.5) * .12)
  }
  const timer = window.setTimeout(() => onEnded?.(), duration * 1000)
  return () => { window.clearTimeout(timer); stopGuides() }
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i))
}

function bufferToWav(buffer) {
  const channels = buffer.numberOfChannels
  const length = buffer.length * channels * 2 + 44
  const array = new ArrayBuffer(length)
  const view = new DataView(array)
  writeString(view, 0, 'RIFF'); view.setUint32(4, length - 8, true); writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, channels, true); view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * channels * 2, true); view.setUint16(32, channels * 2, true)
  view.setUint16(34, 16, true); writeString(view, 36, 'data'); view.setUint32(40, length - 44, true)
  const data = Array.from({ length: channels }, (_, i) => buffer.getChannelData(i))
  let pos = 44
  for (let frame = 0; frame < buffer.length; frame++) {
    for (let channel = 0; channel < channels; channel++) {
      const sample = Math.max(-1, Math.min(1, data[channel][frame] || 0))
      view.setInt16(pos, sample < 0 ? sample * 32768 : sample * 32767, true)
      pos += 2
    }
  }
  return new Blob([array], { type: 'audio/wav' })
}

export function getMicrophoneDiagnostics() {
  return runtime.microphoneInfo ? { ...runtime.microphoneInfo, settings:{...runtime.microphoneInfo.settings} } : null
}

function cleanAndMeasureBuffer(buffer, reportedNoiseFloor = 0) {
  const threshold = Math.min(.045, Math.max(.0025, Number(reportedNoiseFloor || 0) / 8 * 1.35))
  let energy = 0, samples = 0
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel)
    let dc = 0
    for (let index = 0; index < data.length; index += 16) dc += data[index]
    dc /= Math.max(1,Math.ceil(data.length / 16))
    for (let index = 0; index < data.length; index++) {
      const centered = data[index] - dc
      const magnitude = Math.abs(centered)
      const gate = magnitude >= threshold ? 1 : Math.pow(magnitude / threshold,2)
      const cleaned = centered * gate
      data[index] = cleaned
      energy += cleaned * cleaned
      samples++
    }
  }
  const rms = Math.sqrt(energy / Math.max(1,samples))
  return { rms, gain:Math.min(2.4,Math.max(.55,.12 / Math.max(.0001,rms))), threshold }
}

export async function createAutoMix({ tracks = [], duration = 18, onProgress }) {
  if (!OfflineAudioContextClass) throw new Error('이 브라우저는 오프라인 믹싱을 지원하지 않아요.')
  const rate = 44100
  const decodeContext = new AudioContextClass()
  const decodedTracks = []
  for (const track of tracks) {
    if (!track?.blob) continue
    const buffer = await decodeContext.decodeAudioData(await track.blob.arrayBuffer())
    decodedTracks.push({ track, buffer, cleanup:cleanAndMeasureBuffer(buffer,track.noiseFloor) })
  }
  await decodeContext.close()
  const actualDuration = Math.max(duration, ...decodedTracks.map(({buffer}) => buffer.duration + .2))
  const offline = new OfflineAudioContextClass(2, Math.ceil(actualDuration * rate), rate)
  onProgress?.(18)
  scheduleBacking(offline, offline.destination, 0, actualDuration, 0.075)
  for (const {track,buffer:decoded,cleanup} of decodedTracks) {
    const source = offline.createBufferSource()
    const highpass = offline.createBiquadFilter()
    const presence = offline.createBiquadFilter()
    const compressor = offline.createDynamicsCompressor()
    const limiter = offline.createDynamicsCompressor()
    const gain = offline.createGain()
    source.buffer = decoded
    highpass.type = 'highpass'; highpass.frequency.value = 85
    presence.type = 'peaking'; presence.frequency.value = 2800; presence.Q.value = 0.8; presence.gain.value = 1.8
    compressor.threshold.value = -22; compressor.knee.value = 18; compressor.ratio.value = 3.2
    limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 16; limiter.attack.value = 0.003
    gain.gain.value = cleanup.gain
    source.connect(highpass).connect(presence).connect(compressor).connect(gain).connect(limiter).connect(offline.destination)
    source.start(0, Math.min((track.syncOffsetMs || 0) / 1000, Math.max(0, decoded.duration - 0.01)))
  }
  onProgress?.(54)
  const rendered = await offline.startRendering()
  onProgress?.(88)
  const blob = bufferToWav(rendered)
  const url = URL.createObjectURL(blob)
  onProgress?.(100)
  return {
    blob, url, bytes: blob.size, duration: rendered.duration,
    origin:'offline-audio-context:offset+noise-gate+rms-normalize+eq+compressor+limiter',
    processing:{ alignment:'recording-guide-offset', noiseGate:true, normalization:'RMS -18.4 dBFS target', eq:'85 Hz HPF + 2.8 kHz presence', compressor:true, limiter:'-3 dB' }
  }
}

export function stopMicrophone() {
  cancelAnimationFrame(runtime.raf)
  runtime.stream?.getTracks().forEach(track => track.stop())
  runtime.stream = null
  runtime.source = null
  runtime.analyser = null
  runtime.recordingGuideState = null
}

export const audioRuntime = runtime
export { analyzeAudioBuffer }
