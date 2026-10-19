// Captured before submission; persistence success alone confirms the Track.
export async function prepareSubmittedTrackRecord(record) {
  if (!record?.projectId || !record.partId || record.id !== `${record.projectId}:${record.partId}` ||
      record.origin !== 'live-microphone-recording' || (record.kind && record.kind !== 'project-track') ||
      !(record.blob instanceof Blob) || !record.blob.size) {
    throw new Error('제출 Track의 원본과 프로젝트·Part를 확인하지 못했어요.')
  }
  const snapshot = structuredClone(record)
  const digest = await crypto.subtle.digest('SHA-256',await snapshot.blob.arrayBuffer())
  return {...snapshot,sourceProvenance:{
    version:'ieum-track-source-v1',purpose:'project-track',revision:crypto.randomUUID(),
    audioSha256:[...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join(''),
    byteLength:snapshot.blob.size,analysisVersion:snapshot.features?.version || null,
    layerGeneratorVersion:snapshot.layer?.version || null
  }}
}
