import assert from 'node:assert/strict'
import { verifyRequestUser, readAuthConfiguration, sessionResponse, serviceErrorResponse } from '../server/auth.js'
import { GET as getCapabilities } from '../api/capabilities.js'
import { GET as getSession, POST as postSession } from '../api/me/session.js'

const env = { IEUM_AUTH_PROVIDER: 'supabase', IEUM_SUPABASE_URL: 'https://example.supabase.co', IEUM_SUPABASE_PUBLISHABLE_KEY: 'qa-publishable' }
const request = authorization => new Request('https://ieum.example/api/me/session', { headers: authorization ? { Authorization: authorization } : {} })
const userId = '12345678-1234-1234-1234-123456789abc'
let requests = 0
const fetchImpl = async (url, init) => {
  requests++
  assert.equal(url, 'https://example.supabase.co/auth/v1/user')
  assert.equal(init.headers.Authorization, 'Bearer qa-token')
  assert.equal(init.headers.apikey, 'qa-publishable')
  assert.equal(init.redirect, 'error')
  assert.ok(init.signal)
  return Response.json({ id: userId, email: 'must-not-be-returned@example.invalid', user_metadata: { id: 'forged' } })
}
assert.deepEqual(await verifyRequestUser(request('Bearer qa-token'), { env, fetchImpl }), { id: userId })
for (const value of [undefined, 'Basic token', 'Bearer one two', 'Bearer token,token', 'Bearer ' + 'x'.repeat(16385)]) await assert.rejects(verifyRequestUser(request(value), { env, fetchImpl }), error => error.code === 'AUTH_REQUIRED')
assert.equal(requests, 1, 'Malformed auth must not reach the upstream')
for (const configuration of [{}, { ...env, IEUM_AUTH_PROVIDER: 'unapproved-provider' }, { ...env, IEUM_SUPABASE_URL: 'http://example.invalid' }, { ...env, IEUM_SUPABASE_URL: 'https://user:secret@example.invalid' }, { ...env, IEUM_SUPABASE_URL: 'https://example.invalid/?key=secret' }]) assert.throws(() => readAuthConfiguration(configuration))
for (const status of [401, 403]) await assert.rejects(verifyRequestUser(request('Bearer qa-token'), { env, fetchImpl: async () => new Response('secret diagnostic', { status }) }), error => error.code === 'AUTH_REQUIRED' && error.status === 401)
await assert.rejects(verifyRequestUser(request('Bearer qa-token'), { env, fetchImpl: async () => new Response('secret', { status: 500 }) }), error => error.code === 'AUTH_UNAVAILABLE')
await assert.rejects(verifyRequestUser(request('Bearer qa-token'), { env, fetchImpl: async () => { throw new Error('token=secret') } }), error => error.code === 'AUTH_UNAVAILABLE' && !error.message.includes('secret'))
for (const invalid of [{ id: 'jisun' }, {}]) await assert.rejects(verifyRequestUser(request('Bearer qa-token'), { env, fetchImpl: async () => Response.json(invalid) }), error => error.code === 'INVALID_AUTH_RESPONSE')
await assert.rejects(verifyRequestUser(request('Bearer qa-token'), { env, fetchImpl: async () => new Response('not json') }), error => error.code === 'INVALID_AUTH_RESPONSE')
const session = sessionResponse({ id: userId, email: 'private' })
assert.deepEqual(await session.json(), { authenticated: true, user: { id: userId } })
assert.equal(session.headers.get('cache-control'), 'private, no-store')
assert.equal(session.headers.get('vary'), 'Authorization')
const unauthenticated = await getSession(request())
assert.equal(unauthenticated.status, 401)
assert.deepEqual(await unauthenticated.json(), { error: { code: 'AUTH_REQUIRED' } })
const beforeProvider = process.env.IEUM_AUTH_PROVIDER
try {
  delete process.env.IEUM_AUTH_PROVIDER
  const response = await getSession(request('Bearer qa-token'))
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: { code: 'SERVICE_NOT_CONFIGURED' } })
} finally { if (beforeProvider !== undefined) process.env.IEUM_AUTH_PROVIDER = beforeProvider }
assert.equal(postSession().status, 405)
const capabilities = await getCapabilities().json()
for (const key of ['sharedProjects', 'authenticated', 'publicResults', 'push', 'aiVoiceLayers']) assert.equal(capabilities[key], false)
assert.equal(getCapabilities().headers.get('cache-control'), 'no-store')
assert.equal(serviceErrorResponse({ code: 'AUTH_UNAVAILABLE', message: 'token-secret' }).status, 503)
console.log('Server Auth: configured provider only, verified upstream identity, missing/invalid token denial, no secret echo/cache, unconfigured 503 and false capabilities passed. Injected Auth responses; no real account login claim.')
