// Private bridge from persisted Profile sources to the existing generation contract.
// No model invocation, graphic update policy, URL, or submission side effect.
import {loadProjectTracks,loadTrack} from './trackStore.js'
import {voiceSourceRevision} from './profileSource.js'
import {canonicalIdentityInput,buildIdentityInputManifest,buildTrackIdentityInput,assessVoiceCandidates} from './voiceIdentityContract.js'
import {isSupportedVoiceAnalysis} from './voiceAnalysis.js'
import {PITCH_ANALYSIS_VERSION} from './pitch.js'

const hex=bytes=>[...new Uint8Array(bytes)].map(value=>value.toString(16).padStart(2,'0')).join('')
const digest=async bytes=>hex(await crypto.subtle.digest('SHA-256',bytes))

export async function measuredProfileIdentityInput({userId,generatorVersion,rangeRecord,sampleRecord}) {
  // Bind all metadata before awaiting either immutable original's digest.
  const range=structuredClone(rangeRecord),sample=structuredClone(sampleRecord)
  if(range?.kind!=='voice-range' || sample?.kind!=='voice-sample' || !range.id || !sample.id ||
    !range.projectId || range.projectId!==sample.projectId || !(sample.blob instanceof Blob) || !sample.blob.size) {
    throw new Error('Measured Profile range and representative Sample are required')
  }
  const revision=await voiceSourceRevision(range.sourceProvenance,sample.sourceProvenance)
  if(!revision)throw new Error('Measured Profile source provenance is unavailable')
  const measurement=range.rangeData,features=sample.features
  if(measurement?.analysisVersion!==PITCH_ANALYSIS_VERSION || range.sourceProvenance.analysisVersion!==measurement.analysisVersion ||
    !Number.isFinite(measurement.lowMidi) || !Number.isFinite(measurement.highMidi) || measurement.lowMidi>measurement.highMidi ||
    !isSupportedVoiceAnalysis(features) || sample.sourceProvenance.analysisVersion!==features.version) {
    throw new Error('Measured Profile analysis is unsupported or inconsistent')
  }
  if(await digest(new TextEncoder().encode(canonicalIdentityInput(measurement)))!==range.sourceProvenance.measurementSha256 ||
    sample.sourceProvenance.byteLength!==sample.blob.size || await digest(await sample.blob.arrayBuffer())!==sample.sourceProvenance.audioSha256) {
    throw new Error('Measured Profile original does not match its saved provenance')
  }
  return buildIdentityInputManifest({userId,profileRevision:revision,generatorVersion,sources:[
    {recordId:range.id,purpose:'voice-range',sha256:range.sourceProvenance.measurementSha256,analysisVersion:measurement.analysisVersion,data:measurement},
    {recordId:sample.id,purpose:'voice-sample',sha256:sample.sourceProvenance.audioSha256,analysisVersion:features.version,data:features}
  ]})
}

export async function loadMeasuredProfileIdentityInput({userId,profileProjectId,generatorVersion}) {
  const records=await loadProjectTracks(profileProjectId)
  const rangeRecords=records.filter(record=>record.kind==='voice-range')
  const sampleRecords=records.filter(record=>record.kind==='voice-sample')
  if(rangeRecords.length!==1 || sampleRecords.length!==1)throw new Error('One measured range and one representative Sample are required')
  return measuredProfileIdentityInput({userId,generatorVersion,rangeRecord:rangeRecords[0],sampleRecord:sampleRecords[0]})
}

// Prepare a private input from an already persisted submission, never Review.
// The caller must supply an existing personal result reference and its owner;
// this bridge does not create or approve a personal shape or generated layer.
export async function loadSubmittedTrackIdentityInput({projectId,partId,identityOwnerId,identityRef,generatorVersion}) {
  const personalRef=structuredClone(identityRef)
  if(typeof projectId!=='string'||!projectId||typeof partId!=='string'||!partId)throw new Error('Submitted Project and Part are required')
  const record=await loadTrack(`${projectId}:${partId}`)
  const track=structuredClone(record),source=track?.sourceProvenance
  if(track?.id!==`${projectId}:${partId}`||track.projectId!==projectId||track.partId!==partId||
    track.origin!=='live-microphone-recording'||(track.kind&&track.kind!=='project-track')||
    !(track.blob instanceof Blob)||!track.blob.size||typeof identityOwnerId!=='string'||!identityOwnerId||track.participantId!==identityOwnerId) {
    throw new Error('Persisted submitted Track and personal result owner must match')
  }
  if(source?.version!=='ieum-track-source-v1'||source.purpose!=='project-track'||typeof source.revision!=='string'||!source.revision.trim()||
    !isSupportedVoiceAnalysis(track.features)||source.analysisVersion!==track.features.version||
    source.byteLength!==track.blob.size||await digest(await track.blob.arrayBuffer())!==source.audioSha256) {
    throw new Error('Submitted Track original or analysis provenance is unavailable or inconsistent')
  }
  return buildTrackIdentityInput({trackId:track.id,identityRef:personalRef,generatorVersion,
    source:{recordId:track.id,purpose:'project-track',sha256:source.audioSha256,analysisVersion:source.analysisVersion,
      data:{projectId,partId,sourceRevision:source.revision,analysis:track.features,
        assessment:assessVoiceCandidates(track.features,'project-track')}}})
}
