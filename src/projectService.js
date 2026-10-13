// One UI, explicit transports. A configured URL is not proof of a connection.
export class ServiceError extends Error {
  constructor(message, { status = 0, code = 'SERVICE_ERROR' } = {}) {
    super(message)
    this.name = 'ServiceError'
    this.status = status
    this.code = code
  }
}

export function readLocalUserState(storage, key) {
  const raw = storage.getItem(key)
  if (!raw) return null
  const value = JSON.parse(raw)
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new ServiceError('저장된 사용자 상태를 읽을 수 없어요.', { code: 'INVALID_LOCAL_STATE' })
  return value
}

export function writeLocalUserState(storage, key, value) {
  storage.setItem(key, JSON.stringify(value))
  return value
}

export function createLocalProjectService({ storage, stateKey, trackStore }) {
  return {
    mode: 'local',
    capabilities: Object.freeze({ sharedProjects: false, authenticated: false, publicResults: false, push: false, aiVoiceLayers: false }),
    readUserState: () => readLocalUserState(storage, stateKey),
    writeUserState: value => writeLocalUserState(storage, stateKey, value),
    loadProjectTracks: projectId => trackStore.loadProjectTracks(projectId),
    saveTrack: track => trackStore.saveTrack(track),
    loadTrack: id => trackStore.loadTrack(id),
    deleteTrack: id => trackStore.deleteTrack(id)
  }
}

export function createRemoteProjectService({ baseUrl, getAccessToken, fetchImpl = globalThis.fetch } = {}) {
  if (!baseUrl) throw new ServiceError('서비스 주소가 설정되지 않았어요.', { code: 'SERVICE_NOT_CONFIGURED' })
  const endpoint = new URL(baseUrl)
  const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname)
  if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && localHost)) throw new ServiceError('서비스 주소는 HTTPS여야 해요.', { code: 'INVALID_SERVICE_URL' })
  if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new ServiceError('서비스 주소에는 인증 정보나 쿼리를 넣을 수 없어요.', { code: 'INVALID_SERVICE_URL' })
  if (typeof fetchImpl !== 'function') throw new ServiceError('HTTP 요청을 사용할 수 없어요.', { code: 'FETCH_UNAVAILABLE' })
  endpoint.pathname = endpoint.pathname.replace(/\/$/, '') + '/'

  async function request(path, { method = 'GET', data, publicRead = false, idempotencyKey } = {}) {
    const token = publicRead ? null : await getAccessToken?.()
    if (!publicRead && !token) throw new ServiceError('로그인이 필요해요.', { code: 'AUTH_REQUIRED' })
    const headers = { Accept: 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
    const isForm = typeof FormData !== 'undefined' && data instanceof FormData
    if (data !== undefined && !isForm) headers['Content-Type'] = 'application/json'
    const response = await fetchImpl(new URL(path, endpoint).href, { method, headers, credentials: 'omit', ...(data === undefined ? {} : { body: isForm ? data : JSON.stringify(data) }) })
    if (!response.ok) {
      // Do not echo response bodies: upstream diagnostics may contain credentials.
      throw new ServiceError(response.status === 409 ? 'Part 상태가 변경됐어요. 다시 확인해 주세요.' : '서비스 요청을 완료하지 못했어요.', { status: response.status, code: response.status === 409 ? 'CONFLICT' : 'HTTP_ERROR' })
    }
    if (response.status === 204) return null
    try { return await response.json() }
    catch { throw new ServiceError('서비스 응답을 읽을 수 없어요.', { code: 'INVALID_RESPONSE' }) }
  }
  const id = value => {
    if (typeof value !== 'string' || !value.trim() || ['.', '..'].includes(value)) throw new ServiceError('대상 ID를 확인해 주세요.', { code: 'INVALID_ID' })
    return encodeURIComponent(value)
  }
  const requireKey = value => {
    if (typeof value !== 'string' || !value.trim()) throw new ServiceError('중복 방지 키가 필요해요.', { code: 'IDEMPOTENCY_KEY_REQUIRED' })
    return value
  }
  return {
    mode: 'remote',
    // Server response supplies capability evidence; construction does not imply availability.
    discover: () => request('capabilities', { publicRead: true }),
    getCatalog: ({after,limit}={}) => {
      const query=new URLSearchParams()
      if(after!==undefined && after!==null)query.set('after',after)
      if(limit!==undefined)query.set('limit',String(limit))
      return request(`catalog-arrangements${query.size?'?'+query:''}`,{publicRead:true})
    },
    getSession: () => request('me/session'),
    getPersonalIdentity: ({id:resultId,revision,includeTraits=false}) => request(`me/voice-identity?id=${id(resultId)}&revision=${id(revision)}${includeTraits?'&include=traits':''}`),
    discoverProjects: ({songId,after,limit}={}) => {
      const query=new URLSearchParams()
      if(songId!==undefined && songId!==null)query.set('songId',songId)
      if(after!==undefined && after!==null)query.set('after',after)
      if(limit!==undefined)query.set('limit',String(limit))
      return request(`project-discovery${query.size?'?'+query:''}`,{publicRead:true})
    },
    getProfile: () => request('me/profile'),
    saveProfile: profile => request('me/profile', { method: 'PATCH', data: profile }),
    getVoiceSource: () => request('me/voice-source'),
    prepareVoiceSampleUpload: (file, key) => request('me/voice-sample-upload', { method: 'POST', data: { size: file?.size, contentType: file?.contentType, sha256: file?.sha256 }, idempotencyKey: requireKey(key) }),
    verifyVoiceSample: uploadIntentId => request('me/voice-sample-verify', { method: 'POST', data: { uploadIntentId } }),
    analyzeVoiceSample: uploadIntentId => request('me/voice-sample-analyze', { method: 'POST', data: { uploadIntentId } }),
    registerVoiceSource: (source, key) => request('me/voice-source', { method: 'POST', data: { expectedSourceRevision: source?.expectedSourceRevision, rangeData: source?.rangeData, rangeProvenance: source?.rangeProvenance, sampleUploadIntentId: source?.sampleUploadIntentId, sampleProvenance: source?.sampleProvenance }, idempotencyKey: requireKey(key) }),
    getProject: projectId => request(`projects/${id(projectId)}`),
    setProjectKey: (projectId, selection, key) => request(`projects/${id(projectId)}/key`, { method: 'POST', data: { arrangementId: selection?.arrangementId, expectedRevision: selection?.expectedRevision }, idempotencyKey: requireKey(key) }),
    createProject: (project, key) => request('projects', { method: 'POST', data: project, idempotencyKey: requireKey(key) }),
    joinPart: (projectId, partId, key) => request(`projects/${id(projectId)}/parts/${id(partId)}/join`, { method: 'POST', data: {}, idempotencyKey: requireKey(key) }),
    loadProjectTracks: projectId => request(`projects/${id(projectId)}/tracks`),
    analyzeSubmittedTrack: (projectId, partId) => request(`projects/${id(projectId)}/parts/${id(partId)}/analysis`, { method: 'POST', data: {} }),
    getProjectMix: projectId => request(`projects/${id(projectId)}/mix`),
    prepareTrackUpload: (projectId, partId, file, key) => {
      if (!file || !Number.isSafeInteger(file.size) || file.size <= 0 || typeof file.contentType !== 'string' || !file.contentType.startsWith('audio/') || !/^[a-f0-9]{64}$/i.test(file.sha256 || '')) throw new ServiceError('업로드할 원본 파일 정보를 확인해 주세요.', { code: 'INVALID_UPLOAD_FILE' })
      return request(`projects/${id(projectId)}/parts/${id(partId)}/upload-intents`, { method: 'POST', data: { size: file.size, contentType: file.contentType, sha256: file.sha256.toLowerCase() }, idempotencyKey: requireKey(key) })
    },
    submitUploadedTrack: (projectId, partId, take, key) => {
      if (!take || typeof take.uploadIntentId !== 'string' || !take.uploadIntentId.trim()) throw new ServiceError('원본 업로드 확인이 필요해요.', { code: 'UPLOAD_INTENT_REQUIRED' })
      if (!Number.isFinite(take.duration) || take.duration <= 0 || !Number.isFinite(take.syncOffsetMs ?? 0) || (take.syncOffsetMs ?? 0) < 0 || (take.syncOffsetMs ?? 0) >= take.duration * 1000) throw new ServiceError('녹음 길이와 정렬 정보를 확인해 주세요.', { code: 'INVALID_TAKE_METADATA' })
      return request(`projects/${id(projectId)}/parts/${id(partId)}/tracks`, { method: 'POST', data: { uploadIntentId: take.uploadIntentId, duration: take.duration, syncOffsetMs: take.syncOffsetMs ?? 0, features: take.features, projectSeed: take.projectSeed }, idempotencyKey: requireKey(key) })
    },
    submitTrack: (projectId, partId, take, key) => {
      if (!(take.blob instanceof Blob)) throw new ServiceError('원본 녹음이 필요해요.', { code: 'TAKE_REQUIRED' })
      const data = new FormData()
      data.append('audio', take.blob, 'take')
      data.append('metadata', JSON.stringify({ duration: take.duration, syncOffsetMs: take.syncOffsetMs, features: take.features, projectSeed: take.projectSeed }))
      return request(`projects/${id(projectId)}/parts/${id(partId)}/tracks`, { method: 'POST', data, idempotencyKey: requireKey(key) })
    },
    listInvitations: () => request('me/invitations'),
    invite: (projectId, partId, recipientId, key) => request(`projects/${id(projectId)}/invitations`, { method: 'POST', data: { partId, recipientId }, idempotencyKey: requireKey(key) }),
    respondToInvitation: (invitationId, decision, key) => {
      if (!['accept', 'decline'].includes(decision)) throw new ServiceError('초대 응답을 확인해 주세요.', { code: 'INVALID_DECISION' })
      return request(`invitations/${id(invitationId)}/response`, { method: 'POST', data: { decision }, idempotencyKey: requireKey(key) })
    },
    getResult: resultId => request(`results/${id(resultId)}`, { publicRead: true }),
    listSavedObjects: () => request('me/saves'),
    saveObject: (type, objectId, saved) => request('me/saves', { method: 'PUT', data: { type, objectId, saved } }),
    savePushSubscription: subscription => request('me/push-subscriptions', { method: 'POST', data: subscription })
  }
}
