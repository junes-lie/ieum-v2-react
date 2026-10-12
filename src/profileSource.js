// Private source provenance only; this does not generate or update an Identity.
import {canonicalIdentityInput} from './voiceIdentityContract.js'
import {ServiceError} from './projectService.js'

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

// Explicit remote registration of already saved, owned measurements. The caller
// keeps the original records and both keys across retries; no local/demo migration.
export async function registerOwnedVoiceSource({session,rangeRecord,sampleRecord,expectedSourceRevision,uploadKey,registrationKey,uploadOriginal}) {
  const fail=code=>new ServiceError('목소리 원본 등록을 완료하지 못했어요. 기존 음역과 Sample은 유지됩니다.',{code})
  if(typeof session?.run!=='function')throw fail('AUTH_REQUIRED')
  if(typeof uploadOriginal!=='function')throw fail('SERVICE_NOT_CONFIGURED')
  if(![uploadKey,registrationKey].every(key=>typeof key==='string' && key.trim()) || uploadKey===registrationKey)throw fail('IDEMPOTENCY_KEY_REQUIRED')
  if(!(expectedSourceRevision===null || (typeof expectedSourceRevision==='string' && expectedSourceRevision.trim())))throw fail('INVALID_PROFILE_SOURCE')
  // Snapshot before any asynchronous work; a UI edit must not alter this request.
  const range=structuredClone(rangeRecord),sample=structuredClone(sampleRecord)
  return session.run(async({userId,service,assertCurrent})=>{
    if(range?.userId!==userId || sample?.userId!==userId)throw fail('TAKE_OWNER_MISMATCH')
    if(range.kind!=='voice-range' || sample.kind!=='voice-sample' || !(sample.blob instanceof Blob) || !sample.blob.size || !sample.blob.type.startsWith('audio/'))throw fail('INVALID_PROFILE_SOURCE')
    const rangeProvenance=range.sourceProvenance,sampleProvenance=sample.sourceProvenance
    const sourceRevision=await voiceSourceRevision(rangeProvenance,sampleProvenance)
    if(!sourceRevision || rangeProvenance.analysisVersion!==range.rangeData?.analysisVersion || sampleProvenance.analysisVersion!=='ieum-basic-voice-v5')throw fail('INVALID_PROFILE_SOURCE')
    const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(value=>value.toString(16).padStart(2,'0')).join('')
    const rangeHash=await sha(new TextEncoder().encode(canonicalIdentityInput(range.rangeData)))
    const sampleHash=await sha(await sample.blob.arrayBuffer())
    assertCurrent()
    if(rangeHash!==rangeProvenance.measurementSha256 || sampleHash!==sampleProvenance.audioSha256 || sample.blob.size!==sampleProvenance.byteLength)throw fail('INVALID_PROFILE_SOURCE')
    const file={size:sample.blob.size,contentType:sample.blob.type.split(';')[0].trim().toLowerCase(),sha256:sampleHash}
    const intent=await service.prepareVoiceSampleUpload(file,uploadKey)
    if(typeof intent?.uploadIntentId!=='string' || !intent.uploadIntentId.trim() || intent.purpose!=='voice-sample' || intent.sampleVerification!=='pending')throw fail('INVALID_RESPONSE')
    if(intent.uploadStatus==='verified'){
      if(Object.keys(file).some(field=>intent.verifiedFile?.[field]!==file[field]))throw fail('INVALID_RESPONSE')
    }else if(intent.uploadStatus==='pending'){
      assertCurrent()
      const receipt=await uploadOriginal(intent,sample.blob)
      assertCurrent()
      if(receipt?.uploaded!==true)throw fail('UPLOAD_FAILED')
    }else throw fail('INVALID_RESPONSE')
    const verification=await service.verifyVoiceSample(intent.uploadIntentId)
    if(verification?.uploadIntentId!==intent.uploadIntentId || verification.purpose!=='voice-sample' || verification.audioVerification!=='verified' || verification.sampleVerification!=='pending' || !Number.isFinite(verification.duration) || verification.duration<=0)throw fail('INVALID_RESPONSE')
    const result=await service.analyzeVoiceSample(intent.uploadIntentId),analysis=result?.analysis
    if(result?.uploadIntentId!==intent.uploadIntentId || result.analysisStatus!=='verified' || result.sampleVerification!=='pending' ||
      analysis?.version!=='ieum-sample-analysis-v1' || analysis.sourceSha256!==sampleHash || analysis.byteLength!==file.size || analysis.features?.version!==sampleProvenance.analysisVersion ||
      analysis.audioReceipt?.duration!==verification.duration || await sha(new TextEncoder().encode(canonicalIdentityInput(analysis.features)))!==analysis.featuresSha256)throw fail('INVALID_RESPONSE')
    assertCurrent()
    const registered=await service.registerVoiceSource({expectedSourceRevision,rangeData:range.rangeData,rangeProvenance,sampleUploadIntentId:intent.uploadIntentId,sampleProvenance},registrationKey)
    if(registered?.registrationStatus!=='success' || registered.source?.sourceRevision!==sourceRevision ||
      canonicalIdentityInput(registered.source.rangeData)!==canonicalIdentityInput(range.rangeData) ||
      canonicalIdentityInput(registered.source.rangeProvenance)!==canonicalIdentityInput(rangeProvenance) ||
      canonicalIdentityInput(registered.source.sampleProvenance)!==canonicalIdentityInput(sampleProvenance) ||
      registered.source.sampleDuration!==verification.duration || registered.source.sampleAnalysisRef?.uploadIntentId!==intent.uploadIntentId ||
      registered.source.sampleAnalysisRef.featuresSha256!==analysis.featuresSha256 ||
      canonicalIdentityInput(registered.source.sampleFeatures)!==canonicalIdentityInput(analysis.features) ||
      registered.source.rangeOrigin!=='browser-pitch-analysis' || registered.source.sampleOrigin!=='server-decoded-private-original')throw fail('INVALID_RESPONSE')
    return registered
  })
}
