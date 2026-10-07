const DB_NAME = 'ieum-v2-records'
const DB_VERSION = 1
const STORE = 'tracks'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveTrack(track) {
  if (!track?.id || !track.projectId) throw new Error('저장할 녹음의 ID와 프로젝트가 필요해요.')
  const db = await openDatabase()
  try { await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(track)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error || new Error('녹음 저장이 취소됐어요. 원본을 유지하고 다시 시도해 주세요.'))
  }) } finally { db.close() }
  return track
}

export async function loadProjectTracks(projectId) {
  const db = await openDatabase()
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const request = tx.objectStore(STORE).getAll()
    tx.oncomplete = () => resolve(request.result.filter(track => track.projectId === projectId))
    tx.onerror = () => reject(tx.error || request.error)
    tx.onabort = () => reject(tx.error || request.error || new Error('녹음 목록을 불러오지 못했어요.'))
    request.onerror = () => reject(request.error)
  }) } finally { db.close() }
}

export async function loadTrack(id) {
  const db = await openDatabase()
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const request = tx.objectStore(STORE).get(id)
    tx.oncomplete = () => resolve(request.result || null)
    tx.onerror = () => reject(tx.error || request.error)
    tx.onabort = () => reject(tx.error || request.error || new Error('녹음을 불러오지 못했어요.'))
    request.onerror = () => reject(request.error)
  }) } finally { db.close() }
}

export async function deleteTrack(id) {
  const db = await openDatabase()
  try { await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error || new Error('녹음 정리를 완료하지 못했어요.'))
  }) } finally { db.close() }
}

export async function clearProjectTracks(projectId) {
  const tracks = await loadProjectTracks(projectId)
  const db = await openDatabase()
  try { await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tracks.forEach(track => tx.objectStore(STORE).delete(track.id))
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error || new Error('프로젝트 녹음 정리를 완료하지 못했어요.'))
  }) } finally { db.close() }
}

// Remove both current and legacy keys atomically, without touching another owner's Take.
export async function deleteRecordingDraft({userId, projectId, partId}) {
  if (!userId || !projectId || !partId) throw new Error('정리할 임시 녹음의 사용자·프로젝트·Part가 필요해요.')
  const legacyId = `${projectId}:${partId}:temporary-recording`
  const db = await openDatabase()
  try { await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    let failure
    tx.oncomplete = resolve
    tx.onerror = () => reject(failure || tx.error)
    tx.onabort = () => reject(failure || tx.error || new Error('임시 녹음 정리를 완료하지 못했어요.'))
    for (const id of [`${userId}:${legacyId}`, legacyId]) {
      const request = store.get(id)
      request.onsuccess = () => {
        const draft = request.result
        if (draft && (draft.kind !== 'temporary-recording' || draft.projectId !== projectId || draft.partId !== partId || (draft.userId && draft.userId !== userId))) return
        try { store.delete(id) }
        catch (error) { failure = error; tx.abort() }
      }
    }
  }) } finally { db.close() }
}
