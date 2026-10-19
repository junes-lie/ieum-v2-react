import {allProjectTracksSubmitted,submittedProjectTracks} from './projectModel.js'
import {canonicalIdentityInput} from './voiceIdentityContract.js'

const digest=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('')

// Private input snapshot, not a completed graphic or successful Mix receipt.
export async function prepareProjectMix(project,records) {
  if (!allProjectTracksSubmitted(project,records) || typeof project.seed!=='string' || !project.seed) throw new Error('모든 Part의 제출 원본과 Project Seed가 필요해요.')
  const tracks=structuredClone(submittedProjectTracks(project,records))
  const projectId=project.id,projectSeed=project.seed
  const partIds=tracks.map(track=>track.partId)
  const snapshots=await Promise.all(tracks.map(async track=>{
    let layerSnapshot=null,layerCaptureStatus=track.layer?'invalid':'missing'
    if(track.layer) {
      try { canonicalIdentityInput(track.layer);layerSnapshot=structuredClone(track.layer);layerCaptureStatus='captured' }
      catch { /* An invalid graphic must not block the submitted audio Mix. */ }
    }
    return {
      trackId:track.id,partId:track.partId,origin:track.origin || null,
      sourceRevision:track.sourceProvenance?.revision || null,
      audioSha256:await digest(await track.blob.arrayBuffer()),byteLength:track.blob.size,
      syncOffsetMs:track.syncOffsetMs ?? 0,duration:track.duration ?? null,
      analysisVersion:track.features?.version || null,
      layerCaptureStatus,layerSnapshot
    }
  }))
  const input={version:'ieum-project-mix-input-v1',projectId,projectSeed,partIds,tracks:snapshots}
  return {tracks,inputManifest:{...input,inputDigest:await digest(new TextEncoder().encode(canonicalIdentityInput(input)))}}
}
