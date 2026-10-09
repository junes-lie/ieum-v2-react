import { loadProvidedAudio } from './audio.js'

// A Profile excerpt is not a Project backing. Bind the verified arrangement
// to both the song and its recorded key before requesting any audio bytes.
export async function loadProjectBacking(project, load = loadProvidedAudio) {
  const source = project?.audioSource
  if (!source) return null
  if (source.kind !== 'project-arrangement' || source.songId !== project.songId ||
      source.key !== project.key || !source.revision ||
      !Number.isFinite(source.duration) || source.duration<=0 ||
      !/^[a-f0-9]{64}$/.test(source.sourceSha256 || '') ||
      !/^[a-f0-9]{64}$/.test(source.backingSha256 || '') ||
      !/^\/audio\/[\w./-]+$/.test(source.backingFile || '') ||
      source.backingFile.includes('..')) {
    throw new Error('프로젝트 곡·Key에 맞는 반주 정보를 확인하지 못했어요.')
  }
  return load(source.backingFile, source.backingSha256)
}

export function projectAudioReference(project) {
  const source=project?.audioSource
  return source ? {songId:source.songId,key:source.key,revision:source.revision,duration:source.duration,sourceSha256:source.sourceSha256,backingSha256:source.backingSha256} : null
}

export function assertProjectTrackAudio(project, tracks) {
  const reference=projectAudioReference(project)
  if(!reference)return
  if(tracks.some(track=>!track?.audioSourceRef || Object.entries(reference).some(([key,value])=>track.audioSourceRef[key]!==value))) {
    throw new Error('녹음 당시 곡·Key·반주 버전이 현재 프로젝트와 다릅니다. 원본 Track은 보존됩니다.')
  }
}
