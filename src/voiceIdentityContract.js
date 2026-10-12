// Input manifests only: no inferred identity, generated image, or fallback policy.
import { isSupportedVoiceAnalysis, PITCH_OBSERVATION_VERSION } from './voiceAnalysis.js'
export const IDENTITY_CONTRACT_VERSION = 'ieum-identity-input-v1'
const SHA256 = /^[a-f0-9]{64}$/
const CANDIDATES = ['averageRange', 'brightness', 'roughness', 'breathiness', 'vibrato', 'dynamics', 'bpm', 'actualRange', 'rhythmComplexity']

function requiredText(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required`)
  return value
}

// Reject ambiguous/non-JSON input instead of silently dropping it from a digest.
export function canonicalIdentityInput(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value)
  if (Array.isArray(value)) return `[${Array.from(value, canonicalIdentityInput).join(',')}]`
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalIdentityInput(value[key])}`).join(',')}}`
  }
  throw new Error('Identity input must contain finite JSON values only')
}

async function hash(value) {
  const bytes = new TextEncoder().encode(canonicalIdentityInput(value))
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function sourceManifest(source, purpose) {
  requiredText(source?.recordId, 'source recordId')
  if (source.purpose !== purpose || !SHA256.test(source.sha256 || '')) throw new Error('Source purpose or audio hash is invalid')
  requiredText(source.analysisVersion, 'analysisVersion')
  canonicalIdentityInput(source.data)
  return {recordId:source.recordId, purpose, sha256:source.sha256, analysisVersion:source.analysisVersion, data:structuredClone(source.data)}
}

export function assessVoiceCandidates(features, purpose) {
  if (!['voice-sample', 'project-track'].includes(purpose)) throw new Error('Audio purpose is required')
  const unavailable = reason => ({status:'unsupported', value:null, confidence:null, reason})
  const result = Object.fromEntries(CANDIDATES.map(name => [name, unavailable('No validated extractor connected')]))
  // Current spectral features are proxies, not validated perceptual judgements.
  if (isSupportedVoiceAnalysis(features) && Number.isFinite(features.rms) && features.rms >= .0015) {
    for (const [name, field] of [['brightness','brightness'], ['roughness','roughness'], ['dynamics','dynamicRange']]) {
      const value = features[field]
      if (Number.isFinite(value) && value >= 0 && value <= 1) result[name] = {
        status:'estimated', value, confidence:null,
        method:`${features.version}:${field}`, reason:'Signal proxy; perceptual reliability not validated'
      }
    }
  }
  const pitch=features?.pitchObservation
  if(purpose==='project-track' && isSupportedVoiceAnalysis(features) && features.rms>=.0015 &&
    pitch?.version===PITCH_OBSERVATION_VERSION && pitch.analysisVersion==='normalized-difference-v1' &&
    pitch.status==='estimated' && pitch.frameLength===4096 && Number.isInteger(pitch.validFrames) && pitch.validFrames>=3 &&
    Number.isInteger(pitch.attemptedFrames) && pitch.attemptedFrames>=pitch.validFrames && pitch.attemptedFrames<=36 &&
    Number.isFinite(pitch.minimumMidi) && Number.isFinite(pitch.maximumMidi) && pitch.minimumMidi>0 && pitch.maximumMidi<128 && pitch.minimumMidi<=pitch.maximumMidi) {
    result.actualRange={status:'estimated',value:{lowMidi:pitch.minimumMidi,highMidi:pitch.maximumMidi},confidence:null,
      method:`${pitch.version}:${pitch.analysisVersion}:sampled-f0`,
      reason:'Observed sampled monophonic F0 range; full Track coverage and perceptual reliability not validated'}
  }
  return {purpose, analysisVersion:features?.version || null, candidates:result}
}

export async function buildIdentityInputManifest({userId, profileRevision, generatorVersion, sources}) {
  requiredText(userId, 'userId')
  requiredText(profileRevision, 'profileRevision')
  requiredText(generatorVersion, 'generatorVersion')
  if (!Array.isArray(sources) || !sources.length) throw new Error('Measured Profile sources are required; ID-only policy is undecided')
  const normalized = sources.map(source => {
    if (!['voice-range', 'voice-sample'].includes(source?.purpose)) throw new Error('Project Track cannot replace a Profile source')
    return sourceManifest(source, source.purpose)
  }).sort((a,b) => a.purpose < b.purpose ? -1 : a.purpose > b.purpose ? 1 : 0)
  if (new Set(normalized.map(source=>source.purpose)).size !== normalized.length) throw new Error('Profile source purposes must be unique')
  const input = {contractVersion:IDENTITY_CONTRACT_VERSION, userId, profileRevision, generatorVersion, sources:normalized}
  // Private manifest: never publish userId or its digest as a graphic URL.
  return {...input, inputDigest:await hash(input)}
}

export async function buildTrackIdentityInput({trackId, source, identityRef, generatorVersion}) {
  requiredText(trackId, 'trackId')
  requiredText(identityRef?.id, 'opaque identity id')
  requiredText(identityRef.revision, 'identity revision')
  requiredText(generatorVersion, 'generatorVersion')
  if (!SHA256.test(identityRef.outputSha256 || '')) throw new Error('A confirmed personal result is required')
  const input = {contractVersion:IDENTITY_CONTRACT_VERSION, trackId,
    identityRef:{id:identityRef.id, revision:identityRef.revision, outputSha256:identityRef.outputSha256},
    generatorVersion, source:sourceManifest(source,'project-track')}
  return {...input, inputDigest:await hash(input)}
}

export async function buildProjectRecordInput({projectId, projectSeed, partIds, tracks, generatorVersion}) {
  requiredText(projectId, 'projectId')
  requiredText(projectSeed, 'projectSeed')
  requiredText(generatorVersion, 'generatorVersion')
  if (!Array.isArray(partIds) || partIds.length < 2 || partIds.length > 4 || new Set(partIds).size !== partIds.length) throw new Error('Unique 2–4 Project Parts are required')
  partIds.forEach(id=>requiredText(id,'partId'))
  if (!Array.isArray(tracks)) throw new Error('Track states are required')
  const submitted = tracks.filter(track=>track.submissionStatus==='success')
  if (submitted.some(track=>track.projectId!==projectId || !partIds.includes(track.partId)) || new Set(submitted.map(track=>track.partId)).size !== submitted.length || new Set(submitted.map(track=>track.id)).size !== submitted.length) throw new Error('Submitted Tracks must belong to unique Project Parts')
  const layers = partIds.flatMap(partId=> {
    const track = submitted.find(track=>track.partId===partId)
    if (!track) return []
    requiredText(track.id,'trackId')
    requiredText(track.revision,'Track revision')
    if (track.layerStatus!=='success') return [{trackId:track.id,trackRevision:track.revision,partId,layerRef:null}]
    const layer = track.layerRef
    requiredText(layer?.id,'layerId')
    requiredText(layer.revision,'Layer revision')
    requiredText(layer.generatorVersion,'Layer generatorVersion')
    if (!SHA256.test(layer.outputSha256 || '')) throw new Error('Confirmed Layer hash is required')
    return [{trackId:track.id,trackRevision:track.revision,partId,layerRef:{id:layer.id,revision:layer.revision,generatorVersion:layer.generatorVersion,outputSha256:layer.outputSha256}}]
  })
  const input = {contractVersion:IDENTITY_CONTRACT_VERSION,projectId,projectSeed,partIds:[...partIds],generatorVersion,layers}
  // This is eligibility, never a successful Mix result or completed artwork.
  return {...input,inputDigest:await hash(input),submittedCount:submitted.length,
    allRequiredTracksSubmitted:submitted.length===partIds.length,
    allSubmittedLayersReady:layers.length>0 && layers.every(layer=>layer.layerRef!==null)}
}

// Validates a private result snapshot, not proof of model execution or a Mix.
export async function validatePersonalIdentityResult(manifest, artifact) {
  const {inputDigest,...input} = manifest || {}
  if (input.contractVersion!==IDENTITY_CONTRACT_VERSION || !SHA256.test(inputDigest || '') || await hash(input)!==inputDigest) throw new Error('Personal input manifest was changed')
  requiredText(artifact?.id,'opaque identity id')
  requiredText(artifact.revision,'identity revision')
  requiredText(artifact.model,'model')
  if (artifact.generatorVersion!==input.generatorVersion || artifact.inputDigest!==inputDigest ||
      !/^[a-f0-9]{40}$/.test(artifact.modelRevision || '') || !SHA256.test(artifact.outputSha256 || '') ||
      !(artifact.blob instanceof Blob) || artifact.blob.type!=='image/png' || artifact.blob.size<24 || artifact.blob.size>8*1024*1024 ||
      typeof artifact.inferenceSeed!=='string' || !/^\d+$/.test(artifact.inferenceSeed)) throw new Error('Personal result provenance is invalid')
  // Decimal string keeps 64-bit model seeds exact in JSON/JavaScript.
  if (BigInt(artifact.inferenceSeed)>=2n**63n) throw new Error('Personal inference seed is invalid')
  const bytes = await artifact.blob.arrayBuffer()
  const actual = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(byte=>byte.toString(16).padStart(2,'0')).join('')
  const header = new Uint8Array(bytes,0,8)
  if ([...header].map(byte=>byte.toString(16).padStart(2,'0')).join('')!=='89504e470d0a1a0a' || actual!==artifact.outputSha256) throw new Error('Personal result PNG/hash does not match')
  const view = new DataView(bytes)
  if (view.getUint32(16)!==512 || view.getUint32(20)!==512) throw new Error('Personal probe result must be 512×512')
  return {id:artifact.id,revision:artifact.revision,inputDigest,generatorVersion:artifact.generatorVersion,
    model:artifact.model,modelRevision:artifact.modelRevision,inferenceSeed:artifact.inferenceSeed,
    outputSha256:artifact.outputSha256,blob:artifact.blob}
}
