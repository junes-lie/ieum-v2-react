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
  const db = await openDatabase()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(track)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
  db.close()
  return track
}

export async function loadProjectTracks(projectId) {
  const db = await openDatabase()
  const tracks = await new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
    request.onsuccess = () => resolve(request.result.filter(track => track.projectId === projectId))
    request.onerror = () => reject(request.error)
  })
  db.close()
  return tracks
}

export async function loadTrack(id) {
  const db = await openDatabase()
  const track = await new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(id)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return track
}

export async function clearProjectTracks(projectId) {
  const tracks = await loadProjectTracks(projectId)
  const db = await openDatabase()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tracks.forEach(track => tx.objectStore(STORE).delete(track.id))
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
