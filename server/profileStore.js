import { ServiceError } from '../src/projectService.js'
import { readAuthConfiguration, verifyRequestUser } from './auth.js'

const fields = ['roles', 'genres', 'taste', 'preferredSongIds']
const fail = (code, status) => new ServiceError('프로필을 저장하지 못했어요. 기존 정보는 그대로 유지됩니다.', { code, status })

export function validateProfilePatch(value) {
  if (!value || Array.isArray(value) || typeof value !== 'object' ||
      !Number.isInteger(value.expectedRevision) || value.expectedRevision < 0 || value.expectedRevision >= 2147483647 ||
      Object.keys(value).some(key => key !== 'expectedRevision' && !fields.includes(key))) throw fail('INVALID_PROFILE_PATCH', 400)
  const patch = {}
  for (const key of fields) {
    if (!(key in value)) continue
    if (!Array.isArray(value[key]) || value[key].some(item => typeof item !== 'string' || !item.trim())) throw fail('INVALID_PROFILE_PATCH', 400)
    patch[key] = [...new Set(value[key])]
  }
  if (!Object.keys(patch).length) throw fail('INVALID_PROFILE_PATCH', 400)
  return { patch, expectedRevision: value.expectedRevision }
}

// The user's bearer, not a service-role key, is passed to the ownership-checked RPC.
export async function profileRequest(request, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  await verifyRequestUser(request, { env, fetchImpl })
  if (env.IEUM_DB_PROVIDER !== 'supabase') throw fail('SERVICE_NOT_CONFIGURED', 503)
  const configuration = readAuthConfiguration(env)
  const authorization = request.headers.get('authorization')
  let rpc = 'ieum_get_profile', body = {}
  if (request.method === 'PATCH') {
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) throw fail('INVALID_PROFILE_PATCH', 400)
    // Bounded JSON metadata; this is not a minimum/maximum selection policy.
    const reader = request.body?.getReader()
    if (!reader) throw fail('INVALID_PROFILE_PATCH', 400)
    const chunks = []; let size = 0
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 65536) { await reader.cancel(); throw fail('PROFILE_PAYLOAD_TOO_LARGE', 413) }
        chunks.push(value)
      }
    } finally { reader.releaseLock() }
    const bytes = new Uint8Array(size); let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    let value
    try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) }
    catch { throw fail('INVALID_PROFILE_PATCH', 400) }
    const { patch, expectedRevision } = validateProfilePatch(value)
    rpc = 'ieum_patch_profile_preferences'
    body = { p_patch: patch, p_expected_revision: expectedRevision }
  } else if (request.method !== 'GET') throw fail('METHOD_NOT_ALLOWED', 405)

  let response
  try {
    response = await fetchImpl(`${configuration.url}/rest/v1/rpc/${rpc}`, {
      method: 'POST', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(10000),
      headers: { Authorization: authorization, apikey: configuration.publishableKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    })
  } catch { throw fail('PROFILE_UNAVAILABLE', 503) }
  if ([401, 403].includes(response.status)) throw fail('AUTH_REQUIRED', 401)
  if (response.status === 409) throw fail('PROFILE_REVISION_CONFLICT', 409)
  if (response.status === 400) throw fail('INVALID_PROFILE_PATCH', 400)
  if (!response.ok) throw fail('PROFILE_UNAVAILABLE', 503)
  let result
  try { result = await response.json() } catch { throw fail('INVALID_PROFILE_RESPONSE', 503) }
  if (!Number.isInteger(result?.revision) || result.revision < 0 || result.revision > 2147483647 ||
      (result.profile === null && result.revision !== 0) ||
      !(result.profile === null || (result.profile && !Array.isArray(result.profile) && typeof result.profile === 'object'))) throw fail('INVALID_PROFILE_RESPONSE', 503)
  if (request.method === 'PATCH') {
    if (!result.profile || result.revision !== body.p_expected_revision + 1 ||
        Object.entries(body.p_patch).some(([key, values]) => JSON.stringify(result.profile[key]) !== JSON.stringify(values))) throw fail('INVALID_PROFILE_RESPONSE', 503)
  }
  return Response.json({ profile: result.profile, revision: result.revision }, {
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' }
  })
}

export function profileErrorResponse(error) {
  const statuses = { AUTH_REQUIRED: 401, SERVICE_NOT_CONFIGURED: 503, INVALID_SERVICE_CONFIGURATION: 503, AUTH_UNAVAILABLE: 503,
    INVALID_AUTH_RESPONSE: 503, INVALID_PROFILE_PATCH: 400, PROFILE_PAYLOAD_TOO_LARGE: 413, PROFILE_REVISION_CONFLICT: 409,
    PROFILE_UNAVAILABLE: 503, INVALID_PROFILE_RESPONSE: 503, METHOD_NOT_ALLOWED: 405 }
  const code = Object.hasOwn(statuses, error?.code) ? error.code : 'PROFILE_UNAVAILABLE'
  return Response.json({ error: { code } }, { status: statuses[code], headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } })
}
