import {trackDatabaseName} from './demoSession.js'
const DB_NAME = trackDatabaseName
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

// A submitted original is immutable, including two tabs submitting together.
export async function saveSubmittedTrack(track) {
  if (!track?.projectId || !track.partId || track.id !== `${track.projectId}:${track.partId}` ||
      track.origin !== 'live-microphone-recording' || !track.blob?.size) {
    throw new Error('제출할 원본 녹음과 프로젝트·Part가 필요해요.')
  }
  const db = await openDatabase()
  try { return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite'), store=tx.objectStore(STORE)
    let saved, failure
    tx.oncomplete=()=>resolve(saved)
    tx.onerror=()=>reject(failure || tx.error)
    tx.onabort=()=>reject(failure || tx.error || new Error('제출 저장이 취소됐어요. 원본을 유지합니다.'))
    const request=store.get(track.id)
    request.onsuccess=()=>{
      try {
        const existing=request.result
        if(existing?.origin==='live-microphone-recording') {
          if(existing.projectId!==track.projectId || existing.partId!==track.partId || !existing.blob?.size) throw new Error('기존 제출 원본을 확인하지 못했어요. 원본을 유지합니다.')
          saved=existing
        } else {store.put(track);saved=track}
      } catch(error){failure=error;tx.abort()}
    }
  }) } finally {db.close()}
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

// Identity revisions coexist with recordings, but never overwrite them or
// each other. Validation/hash verification belongs to voiceIdentityStore.
export async function saveImmutableIdentityRecord(record) {
  const prefix={'voice-identity-result':'identity-result:','voice-track-layer-result':'voice-layer-result:',
    'voice-project-record-input':'project-record-input:'}[record?.kind]
  if(!prefix || !record.projectId ||
    !record.id?.startsWith(prefix) || !/^[a-f0-9]{64}$/.test(record.integrityDigest || '') ||
    (record.kind!=='voice-project-record-input' && !(record.artifact?.blob instanceof Blob))) throw new Error('Invalid private Identity record')
  const db=await openDatabase()
  try {return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE)
    let saved,failure
    tx.oncomplete=()=>resolve(saved)
    tx.onerror=()=>reject(failure || tx.error)
    tx.onabort=()=>reject(failure || tx.error || new Error('Identity result was not saved'))
    const request=store.get(record.id)
    request.onsuccess=()=>{
      try {
        const existing=request.result
        if(existing){
          if(existing.kind!==record.kind || existing.projectId!==record.projectId ||
            existing.integrityDigest!==record.integrityDigest) throw new Error('Identity revision is immutable')
          saved=existing
        }else{store.add(record);saved=record}
      }catch(error){failure=error;tx.abort()}
    }
  })}finally{db.close()}
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

// Profile range and sample must commit together before the UI accepts registration.
export async function saveTracks(tracks) {
  if (!Array.isArray(tracks) || !tracks.length || tracks.some(track=>!track?.id || !track.projectId)) throw new Error('저장할 녹음의 ID와 프로젝트가 필요해요.')
  const db = await openDatabase()
  try { await new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE,'readwrite')
    let failure
    tx.oncomplete = resolve
    tx.onerror = () => reject(failure || tx.error)
    tx.onabort = () => reject(failure || tx.error || new Error('프로필 저장이 취소됐어요. 원본을 유지하고 다시 시도해 주세요.'))
    try { const store=tx.objectStore(STORE); tracks.forEach(track=>store.put(track)) }
    catch(error) { failure=error;tx.abort() }
  }) } finally { db.close() }
  return tracks
}

