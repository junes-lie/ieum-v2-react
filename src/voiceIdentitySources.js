// Private bridge from persisted Profile sources to the existing generation contract.
// No model invocation, graphic update policy, URL, or submission side effect.
import {loadProjectTracks,loadTrack} from './trackStore.js'
import {voiceSourceRevision} from './profileSource.js'
import {canonicalIdentityInput,buildIdentityInputManifest,buildTrackIdentityInput,buildProjectRecordInput,assessVoiceCandidates} from './voiceIdentityContract.js'
import {isSupportedVoiceAnalysis} from './voiceAnalysis.js'
import {PITCH_ANALYSIS_VERSION} from './pitch.js'
import {prepareVoiceVisualControls} from './voiceVisualMapping.js'

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

// Consume only the connected user's already registered remote Profile source.
// No local migration, new measurement, artwork selection or model invocation.
export async function loadRemoteMeasuredProfileIdentityInput({session,generatorVersion}){
  if(typeof session?.run!=='function' || typeof generatorVersion!=='string' || !generatorVersion.trim())throw new Error('Connected Profile and explicit generator version are required')
  return session.run(async({userId,service,assertCurrent})=>{
    const result=await service.getVoiceSource(),source=structuredClone(result?.source)
    const range=source?.rangeData,rangeSource=source?.rangeProvenance,sampleSource=source?.sampleProvenance,
      features=source?.sampleFeatures,analysisRef=source?.sampleAnalysisRef
    if(!result || Object.keys(result).length!==1 || !source || Object.keys(source).length!==9 ||
      !/^ieum-voice-source-set-v1:[a-f0-9]{64}$/.test(source.sourceRevision || '') ||
      source.rangeOrigin!=='browser-pitch-analysis' || source.sampleOrigin!=='server-decoded-private-original' ||
      range?.analysisVersion!==PITCH_ANALYSIS_VERSION || rangeSource?.analysisVersion!==PITCH_ANALYSIS_VERSION ||
      !Number.isFinite(range.lowMidi) || !Number.isFinite(range.highMidi) || range.lowMidi>range.highMidi ||
      !isSupportedVoiceAnalysis(features) || features.sampleRate!==48000 || sampleSource?.analysisVersion!==features.version ||
      features.pitchAnalysisVersion!==PITCH_ANALYSIS_VERSION || features.pitchFrameLength!==4096 || !Number.isFinite(features.durationSec) ||
      !Number.isSafeInteger(sampleSource.byteLength) || sampleSource.byteLength<=0 ||
      !Number.isFinite(source.sampleDuration) || source.sampleDuration<=0 ||
      Math.abs(features.durationSec-source.sampleDuration)>.000501 ||
      !analysisRef || Object.keys(analysisRef).length!==3 || analysisRef.version!=='ieum-sample-analysis-v1' ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(analysisRef.uploadIntentId || '') ||
      await voiceSourceRevision(rangeSource,sampleSource)!==source.sourceRevision ||
      await digest(new TextEncoder().encode(canonicalIdentityInput(range)))!==rangeSource.measurementSha256 ||
      await digest(new TextEncoder().encode(canonicalIdentityInput(features)))!==analysisRef.featuresSha256){
      throw new Error('Registered Profile source provenance is unavailable or inconsistent')
    }
    assertCurrent()
    const manifest=await buildIdentityInputManifest({userId,profileRevision:source.sourceRevision,generatorVersion,sources:[
      {recordId:`voice-range:${rangeSource.revision}`,purpose:'voice-range',sha256:rangeSource.measurementSha256,analysisVersion:range.analysisVersion,data:range},
      {recordId:analysisRef.uploadIntentId,purpose:'voice-sample',sha256:sampleSource.audioSha256,analysisVersion:features.version,data:features}
    ]})
    assertCurrent()
    return manifest
  })
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
    (track.submissionStatus&&track.submissionStatus!=='success')||
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

// Remote counterpart of the persisted Track bridge above. This prepares a
// private input only; the personal result reference must already exist. It does
// not generate a shape, import local/demo data, or change submission/Mix state.
export async function loadRemoteSubmittedTrackIdentityInput({session,projectId,partId,identityOwnerId,identityRef,generatorVersion}) {
  const personalRef=structuredClone(identityRef)
  if(typeof session?.run!=='function' || ![projectId,partId,identityOwnerId,generatorVersion].every(value=>typeof value==='string' && value.trim()) ||
    ![personalRef?.id,personalRef?.revision].every(value=>typeof value==='string' && value.trim()) ||
    !/^[a-f0-9]{64}$/.test(personalRef.outputSha256 || ''))throw new Error('Existing personal result and submitted Track are required')
  return session.run(async({userId,service,assertCurrent})=>{
    if(userId!==identityOwnerId)throw new Error('Personal result owner and connected Track owner must match')
    // Owner lookup must precede Track analysis; a caller-supplied opaque ID or
    // matching hash is not evidence that this connected user owns the result.
    const stored=await service.getPersonalIdentity({id:personalRef.id,revision:personalRef.revision})
    const owned=structuredClone(stored?.ref)
    if(stored?.resultStatus!=='stored' || Object.keys(stored).length!==3 || typeof stored.profileRevision!=='string' || !stored.profileRevision.trim() ||
      !owned || Object.keys(owned).length!==5 || owned.id!==personalRef.id || owned.revision!==personalRef.revision ||
      owned.outputSha256!==personalRef.outputSha256 || !/^[a-f0-9]{64}$/.test(owned.inputDigest || '') ||
      typeof owned.generatorVersion!=='string' || !owned.generatorVersion.trim() ||
      ['inputDigest','generatorVersion'].some(key=>personalRef[key]!==undefined && personalRef[key]!==owned[key]))throw new Error('Stored personal result ownership or provenance is invalid')
    assertCurrent()
    const result=await service.analyzeSubmittedTrack(projectId,partId)
    const analysis=structuredClone(result?.analysis),receipt=analysis?.audioReceipt,features=analysis?.features
    if(result?.trackId!==`${projectId}:${partId}` || result.analysisStatus!=='verified' || Object.keys(result).length!==3 ||
      analysis?.version!=='ieum-track-analysis-v1' || Object.keys(analysis).length!==7 ||
      !/^[a-f0-9]{64}$/.test(analysis.sourceSha256 || '') || !Number.isSafeInteger(analysis.byteLength) || analysis.byteLength<=0 ||
      !receipt || Object.keys(receipt).length!==9 || receipt.sha256!==analysis.sourceSha256 || receipt.size!==analysis.byteLength ||
      !['audio/wav','audio/x-wav','audio/mp4','audio/webm'].includes(receipt.contentType) ||
      !Number.isSafeInteger(receipt.decodedFrames) || receipt.decodedFrames<=0 || receipt.sampleRate!==48000 ||
      receipt.duration!==receipt.decodedFrames/receipt.sampleRate || receipt.analysisVersion!=='decoded-pcm-v1' ||
      !/^ffmpeg version [^\x00-\x1f]+$/.test(receipt.decoderVersion || '') || !/^[a-f0-9]{64}$/.test(receipt.decoderSha256 || '') ||
      !isSupportedVoiceAnalysis(features) || features.sampleRate!==receipt.sampleRate ||
      features.pitchAnalysisVersion!=='normalized-difference-v1' || features.pitchFrameLength!==4096 ||
      canonicalIdentityInput(analysis.assessment)!==canonicalIdentityInput(assessVoiceCandidates(features,'project-track')) ||
      await digest(new TextEncoder().encode(canonicalIdentityInput(features)))!==analysis.featuresSha256) {
      throw new Error('Verified submitted Track analysis provenance is unavailable or inconsistent')
    }
    assertCurrent()
    const sourceRevision=await digest(new TextEncoder().encode(canonicalIdentityInput({trackId:result.trackId,
      version:analysis.version,sourceSha256:analysis.sourceSha256,byteLength:analysis.byteLength,
      audioReceipt:receipt,featuresSha256:analysis.featuresSha256})))
    assertCurrent()
    const manifest=await buildTrackIdentityInput({trackId:result.trackId,identityRef:owned,generatorVersion,
      source:{recordId:result.trackId,purpose:'project-track',sha256:analysis.sourceSha256,analysisVersion:features.version,
        data:{projectId,partId,sourceRevision,verificationVersion:analysis.version,audioReceipt:receipt,
          analysis:features,assessment:analysis.assessment}}})
    assertCurrent()
    return manifest
  })
}

// The same saved personal traits feed two representations; actual Track
// features affect only the vinyl input. No inference/approval/selection write.
export async function loadRemoteSubmittedVoiceControls(options){
  const {session,identityOwnerId,projectId,partId,generatorVersion}=options,ref=structuredClone(options.identityRef)
  if(typeof session?.run!=='function')throw new Error('Connected identity owner is required')
  return session.run(async({userId,service,assertCurrent})=>{
    if(userId!==identityOwnerId)throw new Error('Personal result owner must match the connected user')
    const received=await service.getPersonalIdentity({id:ref?.id,revision:ref?.revision,includeTraits:true})
    const {traits,...metadata}=received || {}
    if(!received || Object.keys(received).length!==4 || metadata.resultStatus!=='stored' ||
      ['id','revision','outputSha256'].some(key=>metadata.ref?.[key]!==ref?.[key]) ||
      traits?.profileRevision!==metadata.profileRevision || traits.personalInputDigest!==metadata.ref?.inputDigest ||
      traits.generatorVersion!==metadata.ref?.generatorVersion)throw new Error('Stored personal traits and result must match')
    await prepareVoiceVisualControls(traits)
    assertCurrent()
    const trackInput=await loadRemoteSubmittedTrackIdentityInput({session,identityOwnerId,projectId,partId,generatorVersion,identityRef:metadata.ref})
    assertCurrent()
    const controls=await prepareVoiceVisualControls(traits,{trackInput,personalResultRef:metadata.ref})
    assertCurrent()
    return {personalRef:structuredClone(metadata.ref),trackInput,controls}
  })
}

// Read an explicit historical Project input, never select the latest artwork.
// This is a generation input, not a completed image or successful Auto Mix.
export async function loadRemoteProjectRecordInput({session,ref,projectSeed,partIds,generatorVersion}){
  const selector=structuredClone(ref),parts=structuredClone(partIds)
  if(typeof session?.run!=='function' || !selector || Object.keys(selector).length!==2 ||
    typeof selector.projectId!=='string' || !selector.projectId.trim() ||
    !/^[a-f0-9]{64}$/.test(selector.inputDigest || ''))throw new Error('Explicit stored Project input reference is required')
  // Validate caller context before fetching; keep it fixed across await/session changes.
  return session.run(async({service,assertCurrent})=>{
    await buildProjectRecordInput({projectId:selector.projectId,projectSeed,partIds:parts,tracks:[],generatorVersion})
    assertCurrent()
    const received=structuredClone(await service.getProjectVoiceRecord(selector)),input=received?.input
    assertCurrent()
    if(!received || Object.keys(received).length!==3 || received.projectId!==selector.projectId ||
      received.inputDigest!==selector.inputDigest || input?.projectId!==selector.projectId ||
      input.inputDigest!==selector.inputDigest || input.projectSeed!==projectSeed ||
      input.generatorVersion!==generatorVersion || canonicalIdentityInput(input.partIds)!==canonicalIdentityInput(parts) ||
      !Array.isArray(input.layers))throw new Error('Stored Project input does not match its explicit context')
    const rebuilt=await buildProjectRecordInput({projectId:selector.projectId,projectSeed,partIds:parts,generatorVersion,
      tracks:input.layers.map(layer=>({id:layer.trackId,revision:layer.trackRevision,projectId:selector.projectId,
        partId:layer.partId,submissionStatus:'success',layerStatus:layer.layerRef?'success':'pending',layerRef:layer.layerRef}))})
    assertCurrent()
    if(canonicalIdentityInput(rebuilt)!==canonicalIdentityInput(input))throw new Error('Stored Project input provenance or state was changed')
    return {ref:selector,input:rebuilt}
  })
}
