export function createProjectModel({ id, seed, partIds, catalog }) {
  if (!Array.isArray(partIds) || partIds.length < 2 || partIds.length > 4) {
    throw new RangeError('IEUM 프로젝트는 2~4개 Part여야 합니다.')
  }
  if (new Set(partIds).size !== partIds.length) throw new Error('Part ID는 중복될 수 없습니다.')
  const parts = partIds.map(partId => {
    const part = catalog.find(item => item.id === partId)
    if (!part) throw new Error(`알 수 없는 Part: ${partId}`)
    return { ...part }
  })
  return { id, seed, partIds:[...partIds], parts, totalParts:parts.length }
}

export const SUPPORTED_PART_COUNTS = Object.freeze([2, 3, 4])

// Only persisted final Track records count; graphics and invitation states do not.
// Legacy final records have no submissionStatus/kind, so retain that contract.
export function submittedProjectTracks(project, tracks = {}) {
  const partIds = project.partIds || project.parts?.map(part=>part.id) || []
  return partIds.flatMap(partId=>{
    const track = tracks[partId]
    if (!track || track.id!==`${project.id}:${partId}` || track.projectId!==project.id || track.partId!==partId ||
        !(track.blob instanceof Blob) || !track.blob.size ||
        (track.kind && track.kind!=='project-track') ||
        (track.submissionStatus && track.submissionStatus!=='success')) return []
    return [track]
  })
}

export function allProjectTracksSubmitted(project, tracks) {
  const count = (project.partIds || project.parts?.map(part=>part.id) || []).length
  return SUPPORTED_PART_COUNTS.includes(count) && submittedProjectTracks(project,tracks).length===count
}

// Display state must follow saved final Tracks and Mix, never a stale COMPLETE
// label or an unfinished graphics/Review operation. Recording can start before
// the first submission, so retain that existing non-final state.
export function localProjectLifecycle(project, tracks = {}, mix) {
  if (allProjectTracksSubmitted(project,tracks)) return mix ? 'COMPLETE' : 'MIXING'
  return submittedProjectTracks(project,tracks).length || project.status==='RECORDING' ? 'RECORDING' : 'RECRUITING'
}

// Preserve known Part colors while allocating free Part IDs to unused slots.
export function resolveRecordPartSlots(partIds, palettePartIds) {
  const reserved = new Set(partIds.map(id => palettePartIds.indexOf(id)).filter(index => index >= 0))
  return partIds.map(id => {
    const known = palettePartIds.indexOf(id)
    if (known >= 0) return known
    const available = palettePartIds.findIndex((_, index) => !reserved.has(index))
    if (available < 0) throw new RangeError('Record에 사용 가능한 Part 슬롯이 없어요.')
    reserved.add(available)
    return available
  })
}
