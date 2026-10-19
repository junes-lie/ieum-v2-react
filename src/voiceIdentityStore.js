// Private durable results, with explicit revision selection. No generation,
// visual approval, Profile update policy, Track submission or Mix side effect.
import {saveImmutableIdentityRecord,loadTrack} from './trackStore.js'
import {canonicalIdentityInput,validatePersonalIdentityResult,buildVoiceTraitSnapshot,buildProjectRecordInput} from './voiceIdentityContract.js'
import {validateAiVoiceLayer} from './aiVoiceLayer.js'
import {submittedProjectTracks} from './projectModel.js'
import {loadSubmittedTrackIdentityInput} from './voiceIdentitySources.js'
import {prepareVoiceVisualControls} from './voiceVisualMapping.js'

const text=value=>typeof value==='string' && !!value.trim()
const key=({profileProjectId,userId,id,revision})=>{
  if(![profileProjectId,userId,id,revision].every(text))throw new Error('Explicit Identity owner, Profile and revision are required')
  return `identity-result:${JSON.stringify([profileProjectId,userId,id,revision])}`
}
const digest=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(canonicalIdentityInput(value))))].map(byte=>byte.toString(16).padStart(2,'0')).join('')
const payload=record=>{
  const {blob,...artifact}=record.artifact
  return {id:record.id,projectId:record.projectId,kind:record.kind,manifest:record.manifest,
    traits:record.traits,artifact}
}
async function verified(record,selector){
  if(record.kind!=='voice-identity-result' || record.projectId!==selector.profileProjectId ||
    record.manifest?.userId!==selector.userId || record.artifact?.id!==selector.id ||
    record.artifact.revision!==selector.revision || record.id!==key(selector) ||
    await digest(payload(record))!==record.integrityDigest)throw new Error('Stored Identity lineage is invalid')
  const artifact=await validatePersonalIdentityResult(record.manifest,record.artifact)
  const traits=await buildVoiceTraitSnapshot(record.manifest)
  if(canonicalIdentityInput(traits)!==canonicalIdentityInput(record.traits))throw new Error('Stored Identity traits were changed')
  return {manifest:structuredClone(record.manifest),traits,artifact,
    ref:{id:artifact.id,revision:artifact.revision,inputDigest:artifact.inputDigest,
      generatorVersion:artifact.generatorVersion,outputSha256:artifact.outputSha256}}
}

export async function persistPersonalIdentityResult({profileProjectId,manifest,artifact}){
  // Bind caller-owned objects before the first asynchronous operation.
  const input=structuredClone(manifest),result=structuredClone(artifact)
  const selector={profileProjectId,userId:input?.userId,id:result?.id,revision:result?.revision}
  const id=key(selector)
  const checked=await validatePersonalIdentityResult(input,result)
  const traits=await buildVoiceTraitSnapshot(input)
  const record={id,projectId:profileProjectId,kind:'voice-identity-result',manifest:input,traits,artifact:checked}
  record.integrityDigest=await digest(payload(record))
  return verified(await saveImmutableIdentityRecord(record),selector)
}

export async function loadPersonalIdentityResult(selector){
  const bound=structuredClone(selector)
  const record=await loadTrack(key(bound))
  return record?verified(record,bound):null
}

export async function prepareStoredSubmittedVoiceControls({profileProjectId,userId,identityRef,projectId,partId,generatorVersion}){
  const ref=structuredClone(identityRef)
  const personal=await loadPersonalIdentityResult({profileProjectId,userId,id:ref?.id,revision:ref?.revision})
  if(!personal || ['id','revision','outputSha256'].some(field=>personal.ref[field]!==ref[field]))throw new Error('Confirmed stored personal result is required')
  const trackInput=await loadSubmittedTrackIdentityInput({projectId,partId,identityOwnerId:userId,identityRef:personal.ref,generatorVersion})
  const controls=await prepareVoiceVisualControls(personal.traits,{trackInput,personalResultRef:personal.ref})
  // Private inputs only. This does not mark a generated layer as ready.
  return {personalRef:personal.ref,trackInput,controls}
}

const layerKey=({projectId,partId,id,revision})=>{
  if(![projectId,partId,id,revision].every(text))throw new Error('Explicit Project, Part and Layer revision are required')
  return `voice-layer-result:${JSON.stringify([projectId,partId,id,revision])}`
}
const layerPayload=record=>{
  const {blob,...artifact}=record.artifact
  return {id:record.id,kind:record.kind,projectId:record.projectId,partId:record.partId,projectSeed:record.projectSeed,
    profileProjectId:record.profileProjectId,userId:record.userId,personalRef:record.personalRef,
    trackInput:record.trackInput,controls:record.controls,ref:record.ref,artifact}
}
async function verifiedLayer(record,selector){
  if(record.kind!=='voice-track-layer-result' || record.id!==layerKey(selector) ||
    record.projectId!==selector.projectId || record.partId!==selector.partId ||
    record.ref?.id!==selector.id || record.ref.revision!==selector.revision ||
    await digest(layerPayload(record))!==record.integrityDigest)throw new Error('Stored Track Layer lineage is invalid')
  const prepared=await prepareStoredSubmittedVoiceControls({profileProjectId:record.profileProjectId,userId:record.userId,
    identityRef:record.personalRef,projectId:record.projectId,partId:record.partId,generatorVersion:record.ref.generatorVersion})
  if(canonicalIdentityInput(prepared.trackInput)!==canonicalIdentityInput(record.trackInput) ||
    canonicalIdentityInput(prepared.controls)!==canonicalIdentityInput(record.controls) ||
    record.ref.inputDigest!==prepared.trackInput.inputDigest || record.ref.outputSha256!==record.artifact.outputSha256)throw new Error('Stored Track Layer source snapshot no longer matches')
  const track=await loadTrack(prepared.trackInput.trackId)
  await validateAiVoiceLayer({...track,aiVoiceLayer:record.artifact},record.projectSeed)
  return {ref:structuredClone(record.ref),personalRef:prepared.personalRef,trackInput:prepared.trackInput,
    controls:prepared.controls,artifact:structuredClone(record.artifact),projectSeed:record.projectSeed}
}

export async function persistStoredTrackVoiceLayer(options){
  const bound=structuredClone(options)
  const {projectId,partId,projectSeed,result}=bound
  if(!text(projectSeed) || !text(result?.id) || !text(result.revision))throw new Error('Explicit Layer result and Project seed are required')
  const selector={projectId,partId,id:result.id,revision:result.revision}
  const prepared=await prepareStoredSubmittedVoiceControls(bound)
  if(result.inputDigest!==prepared.trackInput.inputDigest)throw new Error('Layer result does not match the submitted Track input')
  const track=await loadTrack(prepared.trackInput.trackId)
  const artifact=await validateAiVoiceLayer({...track,aiVoiceLayer:result.artifact},projectSeed)
  if(!artifact)throw new Error('Received model Layer output is required')
  const ref={id:result.id,revision:result.revision,generatorVersion:bound.generatorVersion,
    inputDigest:prepared.trackInput.inputDigest,outputSha256:artifact.outputSha256}
  const record={id:layerKey(selector),kind:'voice-track-layer-result',projectId,partId,projectSeed,
    profileProjectId:bound.profileProjectId,userId:bound.userId,personalRef:prepared.personalRef,
    trackInput:prepared.trackInput,controls:prepared.controls,ref,artifact}
  record.integrityDigest=await digest(layerPayload(record))
  return verifiedLayer(await saveImmutableIdentityRecord(record),selector)
}

export async function loadStoredTrackVoiceLayer(selector){
  const bound=structuredClone(selector),record=await loadTrack(layerKey(bound))
  return record?verifiedLayer(record,bound):null
}

export async function prepareStoredProjectRecord({project,layerRefs={},generatorVersion}){
  const bound=structuredClone(project),refs=structuredClone(layerRefs)
  const partIds=bound?.partIds || bound?.parts?.map(part=>part.id)
  // Validate the existing 2–4 Part contract before reading any records.
  await buildProjectRecordInput({projectId:bound?.id,projectSeed:bound?.seed,partIds,tracks:[],generatorVersion})
  const records=await Promise.all(partIds.map(partId=>loadTrack(`${bound.id}:${partId}`)))
  const submitted=submittedProjectTracks(bound,Object.fromEntries(records.filter(Boolean).map(track=>[track.partId,track])))
  const tracks=[]
  for(const track of submitted){
    const source=track.sourceProvenance
    if(source?.version!=='ieum-track-source-v1' || source.purpose!=='project-track' || !text(source.revision) ||
      await digestBytes(track.blob)!==source.audioSha256)throw new Error('Project submitted source provenance is unavailable or changed')
    const ref=refs[track.partId]
    let layer=null
    if(ref){
      layer=await loadStoredTrackVoiceLayer({projectId:bound.id,partId:track.partId,id:ref.id,revision:ref.revision})
      if(!layer || layer.projectSeed!==bound.seed || ['id','revision','generatorVersion','outputSha256'].some(field=>layer.ref[field]!==ref[field]))throw new Error('Project Layer reference is missing or mismatched')
    }
    tracks.push({id:track.id,revision:source.revision,projectId:bound.id,partId:track.partId,
      submissionStatus:'success',layerStatus:layer?'success':'pending',layerRef:layer?.ref || null})
  }
  // Never trigger Auto Mix or mark a completed song: this is graphics lineage.
  return buildProjectRecordInput({projectId:bound.id,projectSeed:bound.seed,partIds,tracks,generatorVersion})
}
const digestBytes=async blob=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(byte=>byte.toString(16).padStart(2,'0')).join('')

const projectKey=({projectId,inputDigest})=>{
  if(!text(projectId)||!/^[a-f0-9]{64}$/.test(inputDigest || ''))throw new Error('Explicit Project input reference is required')
  return `project-record-input:${JSON.stringify([projectId,inputDigest])}`
}
async function verifiedProjectInput(record,selector){
  if(record.kind!=='voice-project-record-input' || record.projectId!==selector.projectId ||
    record.id!==projectKey(selector) || record.input?.inputDigest!==selector.inputDigest ||
    await digest(record.input)!==record.integrityDigest)throw new Error('Stored Project input lineage is invalid')
  // Rebuild the historical snapshot, not a latest-result selection. Subsequent
  // submissions must not silently rewrite an earlier partial input snapshot.
  const input=record.input,tracks=[]
  for(const entry of input.layers){
    const original=await loadTrack(entry.trackId)
    if(!original || submittedProjectTracks({id:input.projectId,partIds:input.partIds},{[entry.partId]:original}).length!==1 ||
      original.sourceProvenance?.version!=='ieum-track-source-v1' || original.sourceProvenance.purpose!=='project-track' ||
      original.sourceProvenance.revision!==entry.trackRevision || await digestBytes(original.blob)!==original.sourceProvenance.audioSha256)throw new Error('Stored Project submitted source was changed')
    if(entry.layerRef){
      const layer=await loadStoredTrackVoiceLayer({projectId:input.projectId,partId:entry.partId,id:entry.layerRef.id,revision:entry.layerRef.revision})
      if(!layer || layer.projectSeed!==input.projectSeed || ['id','revision','generatorVersion','outputSha256'].some(field=>layer.ref[field]!==entry.layerRef[field]))throw new Error('Stored Project Layer was changed')
    }
    tracks.push({id:entry.trackId,revision:entry.trackRevision,projectId:input.projectId,partId:entry.partId,
      submissionStatus:'success',layerStatus:entry.layerRef?'success':'pending',layerRef:entry.layerRef})
  }
  const rebuilt=await buildProjectRecordInput({projectId:input.projectId,projectSeed:input.projectSeed,partIds:input.partIds,tracks,generatorVersion:input.generatorVersion})
  if(canonicalIdentityInput(rebuilt)!==canonicalIdentityInput(input))throw new Error('Stored Project input was changed')
  return {ref:{projectId:input.projectId,inputDigest:input.inputDigest},input:structuredClone(input)}
}
export async function persistStoredProjectRecordInput(options){
  const input=await prepareStoredProjectRecord(options)
  const selector={projectId:input.projectId,inputDigest:input.inputDigest}
  const record={id:projectKey(selector),projectId:input.projectId,kind:'voice-project-record-input',input,integrityDigest:await digest(input)}
  return verifiedProjectInput(await saveImmutableIdentityRecord(record),selector)
}
export async function loadStoredProjectRecordInput(selector){
  const bound=structuredClone(selector),record=await loadTrack(projectKey(bound))
  return record?verifiedProjectInput(record,bound):null
}
