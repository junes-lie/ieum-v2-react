import { analyzeAudioBuffer } from './voiceAnalysis.js'
import { estimatePitch } from './pitch.js'

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
  microphoneGeneration: 0,
  recordingGuideState: null,
  preparationRecorder: null,
  activeElapsedSec: 0,
  activeStartedAt: 0,
  playbackGeneration: 0
}

export function getRecordingTimeline() {
  const state = runtime.recorder?.state || 'inactive'
  const active = state === 'recording' ? Math.max(0, context().currentTime - runtime.activeStartedAt) : 0
  return { elapsedSec: runtime.activeElapsedSec + active, state, syncOffsetSec: runtime.syncOffsetSec }
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
  if (!track?.applyConstraints || typeof voiceProcessing !== 'boolean') return
  try {
    const supported = navigator.mediaDevices.getSupportedConstraints?.() || {}
    const constraints = {}
    if (supported.echoCancellation) constraints.echoCancellation = voiceProcessing
    if (supported.noiseSuppression) constraints.noiseSuppression = voiceProcessing
    if (supported.autoGainControl) constraints.autoGainControl = voiceProcessing
    if (Object.keys(constraints).length) await track.applyConstraints(constraints)
  } catch { /* Mobile browsers may keep their own input processing. */ }
}

function assertMicrophoneSession(generation,stream) {
  if(generation===runtime.microphoneGeneration)return
  stream.getTracks().forEach(track=>track.stop())
  throw new DOMException('이전 마이크 시작 요청이 취소됐어요.','AbortError')
}

export async function requestMicrophone({ voiceProcessing = null } = {}) {
  const generation=runtime.microphoneGeneration
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
    const stream=runtime.stream
    await configureMicrophoneTrack(stream.getAudioTracks()[0],voiceProcessing)
    assertMicrophoneSession(generation,stream)
    return stream
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
  let stream
  pending.then(stream => { if (timedOut) stream.getTracks().forEach(track=>track.stop()) }).catch(()=>{})
  try { stream = await Promise.race([pending,timeout]) }
  finally { if (!timedOut) window.clearTimeout(timeoutId) }
  assertMicrophoneSession(generation,stream)
  runtime.stream=stream
  const track = stream.getAudioTracks()[0]
  // Range/profile sampling prefers an unprocessed signal. Project recording
  // enables voice processing when speaker-played guides could leak back in.
  await configureMicrophoneTrack(track,voiceProcessing)
  assertMicrophoneSession(generation,stream)
  runtime.microphoneInfo = {
    label: track?.label || '권한이 허용된 마이크',
    settings: track?.getSettings?.() || {},
    secureContext: window.isSecureContext,
    mediaRecorder: Boolean(window.MediaRecorder),
    measuredAt: new Date().toISOString()
  }
  const ctx = context()
  await ctx.resume()
  assertMicrophoneSession(generation,stream)
  runtime.source = ctx.createMediaStreamSource(stream)
  runtime.analyser = ctx.createAnalyser()
  runtime.analyser.fftSize = 4096
  runtime.analyser.smoothingTimeConstant = 0.55
  runtime.source.connect(runtime.analyser)
  return stream
}

export function monitorInput(onFrame, { detectPitch = false } = {}) {
  cancelAnimationFrame(runtime.raf)
  const buffer = new Float32Array(runtime.analyser?.fftSize || 4096)
  let pitchFrame = 0, lastPitch = 0, lastConfidence = 0, lastDetectedAt = 0, pitchReason = 'waiting'
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
    const pitchFresh = detectPitch && pitchFrame++ % 3 === 0
    if (pitchFresh) {
      const estimate = estimatePitch(buffer, context().sampleRate, rms)
      if (estimate.hz) {
        lastPitch = estimate.hz
        lastDetectedAt = performance.now()
      } else if (performance.now() - lastDetectedAt > 350 || rms < 0.0015) {
        lastPitch = 0
      }
      lastConfidence = estimate.confidence
      pitchReason = estimate.hz ? 'detected' : lastPitch ? 'tracked' : estimate.reason
    }
    const pitchHz = lastPitch
    onFrame?.({
      level: Math.min(1, rms * 8),
      peak: Math.min(1, peak),
      crossings: crossings / buffer.length,
      pitchHz,
      pitchConfidence: lastConfidence,
      pitchReason,
      rms,
      pitchFresh,
      midi: pitchHz ? 69 + 12 * Math.log2(pitchHz / 440) : null,
      waveform: new Float32Array(buffer),
      elapsedSec: getRecordingTimeline().elapsedSec
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

const providedAudioCache = new Map()
export async function loadProvidedAudio(file, sha256) {
  if (!file || !/^[a-f0-9]{64}$/.test(sha256 || '')) throw new Error('제공 음원의 파일 정보가 준비되지 않았어요.')
  const key = `${file}:${sha256}`
  if (!providedAudioCache.has(key)) {
    const pending = (async () => {
      const response = await fetch(file)
      if (!response.ok) throw new Error('제공 음원을 불러오지 못했어요. 다시 시도해 주세요.')
      const blob = await response.blob()
      const digest = await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())
      const actual = Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('')
      if (actual !== sha256) throw new Error('제공 음원 파일을 확인하지 못했어요. 다시 시도해 주세요.')
      return blob
    })()
    providedAudioCache.set(key,pending)
    pending.catch(()=>providedAudioCache.delete(key))
  }
  return providedAudioCache.get(key)
}

const backingGainCache = new WeakMap()
export function backingPlaybackGain(buffer) {
  if (backingGainCache.has(buffer)) return backingGainCache.get(buffer)
  let square = 0, count = 0, peak = 0
  for (let channel=0;channel<buffer.numberOfChannels;channel++) {
    for (const sample of buffer.getChannelData(channel)) {
      if (!Number.isFinite(sample)) throw new Error('반주 오디오에 유효하지 않은 값이 있어요.')
      square += sample*sample;count++;peak=Math.max(peak,Math.abs(sample))
    }
  }
  const rms = count ? Math.sqrt(square/count) : 0
  // One fixed gain preserves musical dynamics and stays identical on resume.
  // -26 dBFS RMS target, no boost, with headroom before the mix limiter.
  const gain = rms < .0015 || !peak ? 1 : Math.min(1,.05/rms,.6/peak)
  backingGainCache.set(buffer,gain)
  return gain
}

function scheduleBuffer(ctx, destination, buffer, start, sourceOffsetSec = 0, gainValue = .72, panValue = 0, registerPlayback = true) {
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
  if (registerPlayback) runtime.playback.push(source)
  return source
}

export function stopGuides() {
  runtime.playbackGeneration++
  runtime.guideNodes.splice(0).forEach(node => { try { node.stop() } catch {} })
  runtime.playback.splice(0).forEach(node => { try { node.stop() } catch {} })
}

function scheduleRecordingGuides(offsetSec = 0) {
  const state = runtime.recordingGuideState
  if (!state) return
  const ctx = context()
  const start = ctx.currentTime + .035
  const remaining = Math.max(.1, state.duration - offsetSec)
  if (state.guides.backing) {
    if (state.decodedBacking) {
      if (offsetSec < state.decodedBacking.duration) scheduleBuffer(ctx, ctx.destination, state.decodedBacking, start, offsetSec, backingPlaybackGain(state.decodedBacking))
    } else scheduleBacking(ctx, ctx.destination, start, remaining, .07, offsetSec)
  }
  state.decodedGuides.forEach(({track,buffer}) => {
    const index = Number(track.partIndex)
    const sourceOffset = offsetSec + (track.syncOffsetMs || 0) / 1000
    if (state.guides.parts[index] && sourceOffset < buffer.duration) scheduleBuffer(ctx, ctx.destination, buffer, start, sourceOffset, .58, (index - 1.5) * .12)
  })
}

export async function startRecording({ onFrame, guides = {backing:false,parts:[]}, guideTracks = [], backingBlob = null, preparationBlob = null, preparationDuration = 0, onPreparation, duration = 35 }) {
  if (runtime.preparationRecorder || (runtime.recorder && runtime.recorder.state !== 'inactive')) throw new Error('이미 녹음 중이에요.')
  const generation=runtime.microphoneGeneration
  const hasSpeakerGuides = Boolean(guides?.backing || guides?.parts?.some(Boolean))
  const stream = await requestMicrophone({ voiceProcessing:hasSpeakerGuides ? true : null })
  if (!window.MediaRecorder) {
    stopMicrophone()
    const error = new Error('이 브라우저는 마이크 입력은 지원하지만 오디오 녹음 저장은 지원하지 않아요. 최신 Safari 또는 Chrome에서 열어 주세요.')
    error.name = 'NotSupportedError'
    throw error
  }
  const ctx = context()
  let decodedGuides, decodedBacking, decodedPreparation
  try {
    await ctx.resume()
    decodedGuides = await Promise.all(guideTracks.filter(track => track?.blob).map(async track => ({ track, buffer: await decodeBlob(ctx, track.blob) })))
    decodedBacking = backingBlob ? await decodeBlob(ctx, backingBlob) : null
    decodedPreparation = preparationBlob ? await decodeBlob(ctx, preparationBlob) : null
    if(decodedPreparation && (!decodedBacking || preparationDuration!==3 || Math.abs(decodedPreparation.duration-preparationDuration)>.02))throw new Error('준비 반주 구간이 올바르지 않아요.')
  } catch (error) {
    if(runtime.stream===stream)stopMicrophone()
    else stream.getTracks().forEach(track=>track.stop())
    throw error
  }
  assertMicrophoneSession(generation,stream)
  if(runtime.preparationRecorder || (runtime.recorder&&runtime.recorder.state!=='inactive'))throw new Error('이미 녹음 중이에요.')
  runtime.chunks = []
  const mime = ['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(type => MediaRecorder.isTypeSupported(type)) || ''
  runtime.recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  runtime.recorder.ondataavailable = event => { if (event.data.size) runtime.chunks.push(event.data) }
  const recorder=runtime.recorder
  const prepareSeconds=decodedPreparation ? preparationDuration : 0
  const beginCapture=()=>{
    recorder.start(180)
    runtime.startedAt = performance.now()
    runtime.activeElapsedSec = 0
    runtime.activeStartedAt = ctx.currentTime
    monitorInput(onFrame)
  }
  if(!prepareSeconds)beginCapture()
  const preparationStart=ctx.currentTime+.035
  const start = preparationStart + prepareSeconds
  runtime.syncOffsetSec = prepareSeconds ? 0 : Math.max(0, start - ctx.currentTime)
  runtime.recordingGuideState = { guides:{...guides,parts:[...guides.parts]}, decodedGuides, decodedBacking, duration:Math.max(.1,duration) }
  if (guides.backing) {
    if (decodedBacking) scheduleBuffer(ctx, ctx.destination, decodedBacking, start, 0, backingPlaybackGain(decodedBacking))
    else scheduleBacking(ctx, ctx.destination, start, duration)
  }
  decodedGuides.forEach(({track,buffer}) => {
    const index = Number(track.partIndex)
    if (guides.parts[index]) scheduleBuffer(ctx, ctx.destination, buffer, start, (track.syncOffsetMs || 0) / 1000, .58, (index - 1.5) * .12)
  })
  if(prepareSeconds){
    runtime.preparationRecorder=recorder
    const playbackGeneration=runtime.playbackGeneration
    if(guides.backing)scheduleBuffer(ctx,ctx.destination,decodedPreparation,preparationStart,0,backingPlaybackGain(decodedBacking))
    try {
      let lastCount
      while(ctx.currentTime<start){
        if(runtime.preparationRecorder!==recorder || generation!==runtime.microphoneGeneration || playbackGeneration!==runtime.playbackGeneration)throw new DOMException('녹음 준비가 취소됐어요.','AbortError')
        const remaining=Math.min(prepareSeconds,Math.ceil(start-ctx.currentTime))
        if(remaining!==lastCount){onPreparation?.(remaining);lastCount=remaining}
        await new Promise(resolve=>window.setTimeout(resolve,16))
      }
      assertMicrophoneSession(generation,stream)
      if(runtime.preparationRecorder!==recorder || playbackGeneration!==runtime.playbackGeneration)throw new DOMException('녹음 준비가 취소됐어요.','AbortError')
      beginCapture()
    } catch(error) {
      if(runtime.preparationRecorder===recorder && playbackGeneration===runtime.playbackGeneration)stopGuides()
      if(runtime.recorder===recorder && runtime.stream===stream)stopMicrophone()
      throw error
    } finally {if(runtime.preparationRecorder===recorder)runtime.preparationRecorder=null}
  }
  return { mimeType: recorder.mimeType, scheduledAt: start }
}

export function pauseRecording() {
  if (runtime.recorder?.state === 'recording') {
    runtime.recorder.pause()
    runtime.activeElapsedSec += Math.max(0, context().currentTime - runtime.activeStartedAt)
    stopGuides()
  }
}

export function resumeRecording() {
  if (runtime.recorder?.state === 'paused') {
    runtime.recorder.resume()
    runtime.activeStartedAt = context().currentTime
    scheduleRecordingGuides(runtime.activeElapsedSec)
  }
}

export function updateRecordingGuides(guides) {
  if (!runtime.recordingGuideState) return
  runtime.recordingGuideState.guides = {...guides,parts:[...guides.parts]}
  const timeline = getRecordingTimeline()
  stopGuides()
  if (timeline.state === 'recording') scheduleRecordingGuides(timeline.elapsedSec)
}

export async function stopRecording() {
  if (!runtime.recorder || runtime.recorder.state === 'inactive') return null
  const recorder = runtime.recorder
  if (recorder.state === 'recording') runtime.activeElapsedSec += Math.max(0, context().currentTime - runtime.activeStartedAt)
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
  runtime.preparationRecorder=null
  cancelAnimationFrame(runtime.raf)
  stopGuides()
  if (runtime.recorder && runtime.recorder.state !== 'inactive') runtime.recorder.stop()
  runtime.chunks = []
  runtime.recordingGuideState = null
  runtime.activeElapsedSec = 0
}

export async function playCurrentMix({ included, tracks = [], backingBlob = null, duration = 18, onEnded }) {
  stopGuides()
  const generation = runtime.playbackGeneration
  const ctx = context()
  await ctx.resume()
  const selected = await Promise.all(tracks.filter(track=>included.parts[Number(track.partIndex)] && track.blob).map(async track=>({track,buffer:await decodeBlob(ctx,track.blob)})))
  const decodedBacking = included.backing && backingBlob ? await decodeBlob(ctx, backingBlob) : null
  if (generation !== runtime.playbackGeneration) return () => {}
  if (!included.backing && !selected.length) throw new Error('들을 Track을 선택해 주세요.')
  const start = ctx.currentTime + 0.08
  if (included.backing) {
    if (decodedBacking) scheduleBuffer(ctx, ctx.destination, decodedBacking, start, 0, backingPlaybackGain(decodedBacking))
    else scheduleBacking(ctx, ctx.destination, start, duration)
  }
  for (const {track,buffer} of selected) {
    const index = Number(track.partIndex)
    if (!included.parts[index] || !track.blob) continue
    scheduleBuffer(ctx, ctx.destination, buffer, start, (track.syncOffsetMs || 0) / 1000, .68, (index - 1.5) * .12)
  }
  const timer = window.setTimeout(() => { if (generation === runtime.playbackGeneration) { stopGuides(); onEnded?.() } }, duration * 1000 + 80)
  return () => { window.clearTimeout(timer); if (generation === runtime.playbackGeneration) stopGuides() }
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
    // Smooth an RMS envelope rather than shaping every waveform zero crossing.
    // This suppresses quiet gaps without claiming broadband speech denoising.
    const attack = Math.exp(-1 / (.005 * buffer.sampleRate))
    const release = Math.exp(-1 / (.09 * buffer.sampleRate))
    let envelope = 0, gate = 0
    for (let index = 0; index < data.length; index++) {
      const centered = data[index] - dc
      const power = centered * centered
      envelope = envelope * .99 + power * .01
      const target = Math.sqrt(envelope) >= threshold ? 1 : .08
      const smoothing = target > gate ? attack : release
      gate = target + smoothing * (gate-target)
      const cleaned = centered * gate
      data[index] = cleaned
      energy += cleaned * cleaned
      samples++
    }
  }
  const rms = Math.sqrt(energy / Math.max(1,samples))
  return { rms, gain:Math.min(2.4,Math.max(.55,.12 / Math.max(.0001,rms))), threshold }
}

export async function createAutoMix({ tracks = [], backingBlob = null, duration = 18, onProgress }) {
  return renderTrackMix({tracks,duration,onProgress,backing:true,backingBlob,minTracks:2})
}

export async function createPreviewMix({tracks=[],duration=18,backing=false,backingBlob=null,onProgress}={}) {
  if (!tracks.length && !backing) throw new Error('들을 Track을 선택해 주세요.')
  return renderTrackMix({tracks,duration,onProgress,backing,backingBlob,minTracks:0})
}

async function renderTrackMix({tracks,duration,onProgress,backing,backingBlob,minTracks}) {
  if (!OfflineAudioContextClass) throw new Error('이 브라우저는 오프라인 믹싱을 지원하지 않아요.')
  if (tracks.length < minTracks || tracks.length > 4 || tracks.some(track=>!track?.blob)) throw new Error('선택한 Part의 실제 녹음이 필요해요.')
  if (new Set(tracks.map(track=>track.partId)).size !== tracks.length) throw new Error('Part별 녹음은 하나씩 필요해요.')
  const rate = 44100
  const decodeContext = new AudioContextClass()
  const decodedTracks = []
  let decodedBacking = null
  try { for (const track of tracks) {
    const buffer = await decodeContext.decodeAudioData(await track.blob.arrayBuffer())
    decodedTracks.push({ track, buffer, cleanup:cleanAndMeasureBuffer(buffer,track.noiseFloor) })
  }
    if (backing && backingBlob) decodedBacking = await decodeBlob(decodeContext,backingBlob)
  } finally { await decodeContext.close() }
  const actualDuration = Math.max(duration, ...decodedTracks.map(({buffer}) => buffer.duration + .2))
  const offline = new OfflineAudioContextClass(2, Math.ceil(actualDuration * rate), rate)
  const master = offline.createDynamicsCompressor()
  master.threshold.value = -3; master.knee.value = 0; master.ratio.value = 20
  master.attack.value = .001; master.release.value = .12
  master.connect(offline.destination)
  onProgress?.(18)
  if (backing) {
    if (decodedBacking) scheduleBuffer(offline, master, decodedBacking, 0, 0, backingPlaybackGain(decodedBacking), 0, false)
    else scheduleBacking(offline, master, 0, actualDuration, 0.075)
  }
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
    source.connect(highpass).connect(presence).connect(compressor).connect(gain).connect(limiter).connect(master)
    source.start(0, Math.min((track.syncOffsetMs || 0) / 1000, Math.max(0, decoded.duration - 0.01)))
  }
  onProgress?.(54)
  const rendered = await offline.startRendering()
  const peakProcessing = limitBufferPeak(rendered)
  onProgress?.(88)
  const blob = bufferToWav(rendered)
  const url = URL.createObjectURL(blob)
  onProgress?.(100)
  return {
    blob, url, bytes: blob.size, duration: rendered.duration,
    origin:'offline-audio-context:offset+noise-gate+rms-normalize+eq+compressor+limiter',
    processing:{ alignment:'recording-guide-offset', noiseGate:true, noiseReduction:'amplitude gate; not broadband denoising', normalization:'RMS -18.4 dBFS target', eq:'85 Hz HPF + 2.8 kHz presence', compressor:true, limiter:'master -3 dBFS peak ceiling', ...peakProcessing }
  }
}

export function limitBufferPeak(buffer, ceiling = 10 ** (-3 / 20)) {
  let peakBefore = 0
  for (let channel=0;channel<buffer.numberOfChannels;channel++) {
    const data=buffer.getChannelData(channel)
    for (let index=0;index<data.length;index++) {
      if (!Number.isFinite(data[index])) throw new Error('Mix에 유효하지 않은 오디오 값이 있어요.')
      peakBefore=Math.max(peakBefore,Math.abs(data[index]))
    }
  }
  const masterGain=peakBefore>ceiling?ceiling/peakBefore:1
  if (masterGain<1) for (let channel=0;channel<buffer.numberOfChannels;channel++) {
    const data=buffer.getChannelData(channel)
    for (let index=0;index<data.length;index++) data[index]*=masterGain
  }
  return {peakBefore,peakAfter:peakBefore*masterGain,masterGain}
}

export function stopMicrophone() {
  runtime.microphoneGeneration++
  cancelAnimationFrame(runtime.raf)
  runtime.stream?.getTracks().forEach(track => track.stop())
  runtime.stream = null
  runtime.source = null
  runtime.analyser = null
  runtime.recordingGuideState = null
}

export const audioRuntime = runtime
export { analyzeAudioBuffer }
