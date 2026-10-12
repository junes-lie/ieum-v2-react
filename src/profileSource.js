// Private source provenance only; this does not generate or update an Identity.
import {canonicalIdentityInput} from './voiceIdentityContract.js'

export async function prepareVoiceRangeRecord(record) {
  if(record?.kind!=='voice-range' || !record.id || !record.projectId || !record.rangeData ||
    !Number.isFinite(record.rangeData.lowMidi) || !Number.isFinite(record.rangeData.highMidi) || record.rangeData.lowMidi>record.rangeData.highMidi) {
    throw new Error('음역 측정 결과와 저장 정보를 확인하지 못했어요.')
  }
  const snapshot=structuredClone(record)
  const bytes=new TextEncoder().encode(canonicalIdentityInput(snapshot.rangeData))
  const digest=await crypto.subtle.digest('SHA-256',bytes)
  return {...snapshot,sourceProvenance:{
    version:'ieum-profile-source-v1',purpose:'voice-range',revision:crypto.randomUUID(),
    measurementSha256:[...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join(''),
    analysisVersion:snapshot.rangeData.analysisVersion || null
  }}
}

export async function prepareVoiceSampleRecord(record) {
  if (record?.kind !== 'voice-sample' || !record.id || !record.projectId || !(record.blob instanceof Blob) || !record.blob.size) {
    throw new Error('대표 Sample의 원본과 저장 정보를 확인하지 못했어요.')
  }
  const snapshot = structuredClone(record)
  const digest = await crypto.subtle.digest('SHA-256',await snapshot.blob.arrayBuffer())
  return {...snapshot,sourceProvenance:{
    version:'ieum-profile-source-v1',purpose:'voice-sample',
    revision:crypto.randomUUID(),
    audioSha256:[...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join(''),
    byteLength:snapshot.blob.size,
    analysisVersion:snapshot.features?.version || null
  }}
}

// Revision of measured voice sources, not preferences or a generated Identity.
// Legacy sources stay unknown; never fabricate their analysis or revisions.
export async function voiceSourceRevision(rangeSource, sampleSource) {
  const valid=(source,purpose,field)=>source?.version==='ieum-profile-source-v1' && source.purpose===purpose &&
    typeof source.revision==='string' && source.revision.length>0 && /^[a-f0-9]{64}$/.test(source[field] || '')
  if(!valid(rangeSource,'voice-range','measurementSha256') || !valid(sampleSource,'voice-sample','audioSha256')) return null
  const input={version:'ieum-voice-source-set-v1',sources:[
    {purpose:'voice-range',revision:rangeSource.revision,sha256:rangeSource.measurementSha256,analysisVersion:rangeSource.analysisVersion || null},
    {purpose:'voice-sample',revision:sampleSource.revision,sha256:sampleSource.audioSha256,analysisVersion:sampleSource.analysisVersion || null}
  ]}
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalIdentityInput(input)))
  return 'ieum-voice-source-set-v1:'+ [...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('')
}
