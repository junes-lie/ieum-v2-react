// This validates received model output; it does not run or impersonate inference.
import {submittedProjectTracks} from './projectModel.js'
const SHA256 = /^[a-f0-9]{64}$/

async function digest(blob) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))]
    .map(value => value.toString(16).padStart(2, '0')).join('')
}

export async function validateAiVoiceLayer(track, projectSeed) {
  const artifact = track.aiVoiceLayer
  if (!artifact) return null
  if (artifact.version !== 'ieum-ai-voice-layer-v1' ||
      typeof track.projectId !== 'string' || !track.projectId ||
      typeof track.partId !== 'string' || !track.partId ||
      typeof track.participantId !== 'string' || !track.participantId ||
      artifact.projectId !== track.projectId || artifact.partId !== track.partId ||
      artifact.participantId !== track.participantId ||
      artifact.projectSeed !== String(projectSeed) ||
      !Number.isSafeInteger(artifact.inferenceSeed) || artifact.inferenceSeed < 0 ||
      typeof artifact.model !== 'string' || !artifact.model ||
      typeof artifact.revision !== 'string' || !/^[a-f0-9]{40}$/.test(artifact.revision) ||
      !SHA256.test(artifact.sourceSha256) || !SHA256.test(artifact.outputSha256) ||
      !(track.blob instanceof Blob) || !(artifact.blob instanceof Blob) ||
      artifact.blob.type !== 'image/png' || artifact.blob.size > 8 * 1024 * 1024) {
    throw new Error('AI Voice Layer의 프로젝트·Part·모델·파일 계약이 올바르지 않습니다.')
  }
  const [sourceHash, outputHash] = await Promise.all([digest(track.blob), digest(artifact.blob)])
  if (sourceHash !== artifact.sourceSha256 || outputHash !== artifact.outputSha256) {
    throw new Error('AI Voice Layer의 원본 음성 또는 생성 파일 해시가 일치하지 않습니다.')
  }
  const header = new Uint8Array(await artifact.blob.slice(0, 8).arrayBuffer())
  if ([...header].map(value => value.toString(16).padStart(2, '0')).join('') !== '89504e470d0a1a0a') {
    throw new Error('AI Voice Layer의 PNG 파일 형식이 올바르지 않습니다.')
  }
  return artifact
}

export async function loadAiVoiceFields(tracks, projectSeed, partIds, projectId) {
  const snapshot=structuredClone(tracks || {}),parts=[...partIds]
  const submitted=new Set(submittedProjectTracks({id:projectId,partIds:parts},snapshot))
  const candidates = Object.values(snapshot).filter(track => track.aiVoiceLayer)
  const fields = []
  for (const track of candidates) {
    if (track.projectId !== projectId || !parts.includes(track.partId) || fields.some(field => field.partId === track.partId)) {
      throw new Error('AI Voice Layer가 현재 프로젝트의 고유 Part와 일치하지 않습니다.')
    }
    if(!submitted.has(track))continue
    const artifact = await validateAiVoiceLayer(track, projectSeed)
    const url = URL.createObjectURL(artifact.blob)
    try {
      const image = new Image()
      image.src = url
      await image.decode()
      if (image.naturalWidth !== 512 || image.naturalHeight !== 512) {
        throw new Error('AI Voice Layer의 생성 크기는 512×512여야 합니다.')
      }
      fields.push({projectId,projectSeed:String(projectSeed),partId:track.partId, image,sourceSha256:artifact.sourceSha256,outputSha256:artifact.outputSha256})
    } finally { URL.revokeObjectURL(url) }
  }
  return fields
}
