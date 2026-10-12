// Private source provenance only; this does not generate or update an Identity.
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
