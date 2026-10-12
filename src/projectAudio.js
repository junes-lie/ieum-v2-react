import { loadProvidedAudio } from './audio.js'

// Lyric timestamps describe entry, not beats or a measured BPM.
export function recordingEntryPrompt(project, elapsedSec, state) {
  if (!['ready','recording','paused'].includes(state) || !Number.isFinite(elapsedSec) || elapsedSec < 0) return ''
  const first = project?.lyrics?.[0]?.time
  if (!Number.isFinite(first) || first < 0) return ''
  if (state === 'ready') return first > 0 ? `첫 가사 · 시작 후 ${first.toFixed(1)}초` : '녹음 시작과 함께 첫 가사'
  const remaining = first - elapsedSec
  if (remaining > 0) return `첫 가사까지 ${remaining.toFixed(1)}초${state === 'paused' ? ' · 일시정지' : ''}`
  return state === 'recording' && elapsedSec - first < 1 ? '지금 첫 가사를 부르세요' : ''
}

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
