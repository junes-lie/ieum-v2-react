import assert from 'node:assert/strict'
import { profileRequest, profileErrorResponse } from '../server/profileStore.js'
import { GET, POST } from '../api/me/profile.js'

const env = { IEUM_AUTH_PROVIDER: 'supabase', IEUM_DB_PROVIDER: 'supabase', IEUM_SUPABASE_URL: 'https://example.supabase.co', IEUM_SUPABASE_PUBLISHABLE_KEY: 'qa-publishable' }
const userId = '11111111-1111-4111-8111-111111111111'
const calls = []
let rpcResponse = { profile: null, revision: 0 }
const fetchImpl = async (url, init) => {
  calls.push({ url, init })
  assert.equal(init.headers.Authorization, 'Bearer qa-user-token')
  assert.equal(init.headers.apikey, 'qa-publishable')
  assert.equal(init.redirect, 'error')
  if (url.endsWith('/auth/v1/user')) return Response.json({ id: userId })
  assert.match(url, /^https:\/\/example.supabase.co\/rest\/v1\/rpc\/ieum_(get_profile|patch_profile_preferences)$/)
  assert.equal(init.credentials, 'omit'); assert.equal(init.referrerPolicy, 'no-referrer')
  return typeof rpcResponse === 'function' ? rpcResponse(init) : Response.json(rpcResponse)
}
const request = (value, authorization = 'Bearer qa-user-token') => new Request('https://ieum.example/api/me/profile', {
  method: value === undefined ? 'GET' : 'PATCH', headers: { ...(authorization ? { Authorization: authorization } : {}), 'Content-Type': 'application/json' },
  ...(value === undefined ? {} : { body: JSON.stringify(value) })
})
const options = { env, fetchImpl }
const initial = await profileRequest(request(), options)
assert.deepEqual(await initial.json(), { profile: null, revision: 0 })
assert.equal(initial.headers.get('cache-control'), 'private, no-store')
await assert.rejects(profileRequest(request(undefined, null), options), error => error.code === 'AUTH_REQUIRED')
await assert.rejects(profileRequest(request(), { ...options, env: { ...env, IEUM_DB_PROVIDER: '' } }), error => error.code === 'SERVICE_NOT_CONFIGURED')

rpcResponse = { profile: { roles: [], genres: ['재즈'], preferredSongIds: ['city-of-stars'], rangeData: { lowMidi: 48 }, identity: { revision: 'keep' } }, revision: 1 }
await profileRequest(request({ expectedRevision: 0, roles: [], genres: ['재즈', '재즈'], preferredSongIds: ['city-of-stars'] }), options)
assert.deepEqual(JSON.parse(calls.at(-1).init.body), { p_expected_revision: 0, p_patch: { roles: [], genres: ['재즈'], preferredSongIds: ['city-of-stars'] } })
assert.ok(!JSON.parse(calls.at(-1).init.body).userId)
const beforeInvalid = calls.filter(call => call.url.includes('/rest/')).length
for (const value of [{}, { expectedRevision: -1, roles: [] }, { expectedRevision: 0, roles: 'main' },
  { expectedRevision: 0, roles: [null] }, { expectedRevision: 0, roles: [' '] },
  { expectedRevision: 0, userId, roles: [] }, { expectedRevision: 0, rangeData: {} }, { expectedRevision: 0, identity: {} }]) {
  await assert.rejects(profileRequest(request(value), options), error => error.code === 'INVALID_PROFILE_PATCH')
}
assert.equal(calls.filter(call => call.url.includes('/rest/')).length, beforeInvalid)
await assert.rejects(profileRequest(request({ expectedRevision: 0, taste: ['x'.repeat(65536)] }), options), error => error.code === 'PROFILE_PAYLOAD_TOO_LARGE')
rpcResponse = () => new Response('private diagnostic', { status: 409 })
await assert.rejects(profileRequest(request({ expectedRevision: 0, roles: [] }), options), error => error.code === 'PROFILE_REVISION_CONFLICT')
rpcResponse = { profile: { roles: [] }, revision: 0 }
await assert.rejects(profileRequest(request({ expectedRevision: 0, roles: [] }), options), error => error.code === 'INVALID_PROFILE_RESPONSE')
rpcResponse = { profile: { roles: ['unconfirmed'] }, revision: 1 }
await assert.rejects(profileRequest(request({ expectedRevision: 0, roles: [] }), options), error => error.code === 'INVALID_PROFILE_RESPONSE')
rpcResponse = () => { throw new Error('private qa-user-token signed-url') }
await assert.rejects(profileRequest(request(), options), error => error.code === 'PROFILE_UNAVAILABLE' && !error.message.includes('qa-user-token'))
assert.deepEqual(await profileErrorResponse(new Error('private')).json(), { error: { code: 'PROFILE_UNAVAILABLE' } })
assert.equal((await GET(request(undefined, null))).status, 401)
assert.equal(POST().status, 405)
console.log('PASS Profile API: verified bearer, own-user RPC, revision conflict, preference-only patch, optional empty selections, dedupe, bounded JSON, safe failures/no-store. Injected HTTP; no real Supabase login claim.')
