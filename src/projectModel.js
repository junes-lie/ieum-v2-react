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
