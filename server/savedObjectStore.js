import { ServiceError } from '../src/projectService.js'
import { readAuthConfiguration, verifyRequestUser } from './auth.js'

const types = ['project', 'vocal', 'song']
const fail = code => new ServiceError('저장 목록을 변경하지 못했어요.', { code })
const validId = value => typeof value === 'string' && Boolean(value.trim())
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value))

export function validateSavedObject(value) {
  if (!value || Array.isArray(value) || typeof value !== 'object' ||
      Object.keys(value).length !== 3 || Object.keys(value).some(key => !['type','objectId','saved'].includes(key)) ||
      !types.includes(value.type) || !validId(value.objectId) || typeof value.saved !== 'boolean') throw fail('INVALID_SAVED_OBJECT')
  return { type: value.type, objectId: value.objectId, saved: value.saved }
}

export async function savedObjectsRequest(request, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  await verifyRequestUser(request, { env, fetchImpl })
  if (env.IEUM_DB_PROVIDER !== 'supabase') throw fail('SERVICE_NOT_CONFIGURED')
  const configuration = readAuthConfiguration(env)
  let change, rpc = 'ieum_get_saved_objects', body = {}
  if (request.method === 'PUT') {
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) throw fail('INVALID_SAVED_OBJECT')
    const reader = request.body?.getReader()
    if (!reader) throw fail('INVALID_SAVED_OBJECT')
    const chunks = []; let size = 0
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 65536) { await reader.cancel(); throw fail('SAVED_PAYLOAD_TOO_LARGE') }
        chunks.push(value)
      }
    } finally { reader.releaseLock() }
    const bytes = new Uint8Array(size); let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    let value
    try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) }
    catch { throw fail('INVALID_SAVED_OBJECT') }
    change = validateSavedObject(value)
    rpc = 'ieum_set_saved_object'
    body = { p_type: change.type, p_object_id: change.objectId, p_saved: change.saved }
  } else if (request.method !== 'GET') throw fail('METHOD_NOT_ALLOWED')
  let response
  try {
    response = await fetchImpl(`${configuration.url}/rest/v1/rpc/${rpc}`, {
      method: 'POST', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(10000),
      headers: { Authorization: request.headers.get('authorization'), apikey: configuration.publishableKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    })
  } catch { throw fail('SAVES_UNAVAILABLE') }
  if ([401,403].includes(response.status)) throw fail('AUTH_REQUIRED')
  if (response.status === 400) throw fail('INVALID_SAVED_OBJECT')
  if (!response.ok) throw fail('SAVES_UNAVAILABLE')
  let result
  try { result = await response.json() } catch { throw fail('INVALID_SAVES_RESPONSE') }
  if (change) {
    if (result?.type !== change.type || result?.objectId !== change.objectId || result?.saved !== change.saved ||
        (change.saved ? !validDate(result.savedAt) : result.savedAt !== null)) throw fail('INVALID_SAVES_RESPONSE')
    result = { ...change, savedAt: result.savedAt }
  } else {
    if (!Array.isArray(result?.saves) || result.saves.some(item => !types.includes(item?.type) || !validId(item?.objectId) || !validDate(item?.savedAt))) throw fail('INVALID_SAVES_RESPONSE')
    const ids = result.saves.map(item => JSON.stringify([item.type,item.objectId]))
    if (new Set(ids).size !== ids.length) throw fail('INVALID_SAVES_RESPONSE')
    result = { saves: result.saves.map(({ type, objectId, savedAt }) => ({ type, objectId, savedAt })) }
  }
  return Response.json(result, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } })
}

export function savedObjectsErrorResponse(error) {
  const statuses = { AUTH_REQUIRED:401, SERVICE_NOT_CONFIGURED:503, INVALID_SERVICE_CONFIGURATION:503, AUTH_UNAVAILABLE:503,
    INVALID_AUTH_RESPONSE:503, INVALID_SAVED_OBJECT:400, SAVED_PAYLOAD_TOO_LARGE:413, SAVES_UNAVAILABLE:503, INVALID_SAVES_RESPONSE:503, METHOD_NOT_ALLOWED:405 }
  const code = Object.hasOwn(statuses,error?.code) ? error.code : 'SAVES_UNAVAILABLE'
  return Response.json({ error: { code } }, { status: statuses[code], headers: { 'Cache-Control':'private, no-store', Vary:'Authorization' } })
}
