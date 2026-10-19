import assert from 'node:assert/strict'
import { savedObjectsRequest, savedObjectsErrorResponse } from '../server/savedObjectStore.js'
import { GET, POST } from '../api/me/saves.js'

const env = { IEUM_AUTH_PROVIDER:'supabase', IEUM_DB_PROVIDER:'supabase', IEUM_SUPABASE_URL:'https://example.supabase.co', IEUM_SUPABASE_PUBLISHABLE_KEY:'qa-public' }
let result = { saves:[] }, calls = []
const fetchImpl = async (url, init) => {
  assert.equal(init.headers.Authorization,'Bearer qa-token')
  assert.equal(init.headers.apikey,'qa-public')
  assert.equal(init.redirect,'error'); assert.equal(init.credentials,'omit')
  if (url.endsWith('/auth/v1/user')) return Response.json({ id:'11111111-1111-4111-8111-111111111111' })
  assert.match(url,/\/rest\/v1\/rpc\/ieum_(get_saved_objects|set_saved_object)$/)
  assert.equal(init.referrerPolicy,'no-referrer')
  calls.push(JSON.parse(init.body))
  return result instanceof Response ? result.clone() : Response.json(result)
}
const options = { env, fetchImpl }
const req = (value, auth = 'Bearer qa-token') => new Request('https://ieum.example/api/me/saves', {
  method:value === undefined ? 'GET':'PUT', headers:{ ...(auth ? { Authorization:auth }:{}), 'Content-Type':'application/json' },
  ...(value === undefined ? {} : { body:JSON.stringify(value) })
})
assert.deepEqual(await (await savedObjectsRequest(req(),options)).json(),{ saves:[] })
const date = '2026-10-13T00:00:00Z'
for (const type of ['project','vocal','song']) {
  result = { type, objectId:'same-id', saved:true, savedAt:date, user_id:'must-not-leak' }
  const response = await savedObjectsRequest(req({ type, objectId:'same-id', saved:true }),options)
  assert.deepEqual(await response.json(),{ type, objectId:'same-id', saved:true, savedAt:date })
  assert.equal(response.headers.get('cache-control'),'private, no-store')
  assert.deepEqual(calls.at(-1),{ p_type:type, p_object_id:'same-id', p_saved:true })
}
result = { type:'song', objectId:'same-id', saved:false, savedAt:null }
await savedObjectsRequest(req({ type:'song', objectId:'same-id', saved:false }),options)
result = { saves:[{ type:'song', objectId:'same-id', savedAt:date, user_id:'must-not-leak' }] }
assert.deepEqual(await (await savedObjectsRequest(req(),options)).json(),{ saves:[{ type:'song', objectId:'same-id', savedAt:date }] })
for (const value of [{}, { type:'track', objectId:'x', saved:true }, { type:'song', objectId:' ', saved:true },
  { type:'song', objectId:'x', saved:1 }, { type:'song', objectId:'x', saved:true, userId:'other' },
  { type:'song', objectId:'x', saved:true, preferredSongIds:[] }]) {
  const count = calls.length
  await assert.rejects(savedObjectsRequest(req(value),options),error => error.code === 'INVALID_SAVED_OBJECT')
  assert.equal(calls.length,count)
}
await assert.rejects(savedObjectsRequest(req(undefined,null),options),error => error.code === 'AUTH_REQUIRED')
await assert.rejects(savedObjectsRequest(req(),{ ...options,env:{ ...env,IEUM_DB_PROVIDER:'' } }),error => error.code === 'SERVICE_NOT_CONFIGURED')
await assert.rejects(savedObjectsRequest(req({ type:'song',objectId:'x'.repeat(65536),saved:true }),options),error => error.code === 'SAVED_PAYLOAD_TOO_LARGE')
for (const invalid of [{ saves:null }, { saves:[{ type:'song',objectId:'x',savedAt:'invalid' }] },
  { saves:[{ type:'song',objectId:'x',savedAt:date },{ type:'song',objectId:'x',savedAt:date }] }]) {
  result = invalid
  await assert.rejects(savedObjectsRequest(req(),options),error => error.code === 'INVALID_SAVES_RESPONSE')
}
result = { type:'song',objectId:'wrong',saved:true,savedAt:date }
await assert.rejects(savedObjectsRequest(req({ type:'song',objectId:'x',saved:true }),options),error => error.code === 'INVALID_SAVES_RESPONSE')
result = new Response('private upstream diagnostic',{ status:500 })
const failed = await savedObjectsRequest(req(),options).catch(savedObjectsErrorResponse)
assert.equal(failed.status,503); assert.deepEqual(await failed.json(),{ error:{ code:'SAVES_UNAVAILABLE' } })
assert.equal((await GET(req(undefined,null))).status,401)
assert.equal(POST().status,405); assert.equal(POST().headers.get('allow'),'GET, PUT')
console.log('PASS saved-object API: independent types, verified bearer, bounded strict input, no caller ID, private output, no false success, upstream failure isolation. Injected HTTP fixture, not live service.')
