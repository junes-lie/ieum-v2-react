import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createSupabaseAudioStorage } from '../server/audioStorage.js'

const env = { IEUM_STORAGE_PROVIDER: 'supabase', IEUM_SUPABASE_URL: 'https://example.supabase.co', IEUM_SUPABASE_SECRET_KEY: 'sb_secret_qa_only', IEUM_AUDIO_BUCKET: 'private-audio' }
const objectId = '12345678-1234-1234-1234-123456789abc'
const bytes = new TextEncoder().encode('exact server-verified original')
const expected = { size: bytes.length, contentType: 'audio/wav', sha256: createHash('sha256').update(bytes).digest('hex') }
let requests = 0, cancellations = 0
const streamed = (chunks, headers = { 'Content-Type': 'audio/wav' }) => new Response(new ReadableStream({
  start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close() },
  cancel() { cancellations++ }
}), { headers })
const privateBucket = (fetchImpl) => async (url, options) => url.endsWith('/bucket/private-audio') ? Response.json({ id: 'private-audio', public: false }) : fetchImpl(url, options)
const storage = createSupabaseAudioStorage({ env, fetchImpl: async (url, init) => {
  requests++
  assert.equal(init.headers.apikey, env.IEUM_SUPABASE_SECRET_KEY)
  assert.equal(init.headers.Authorization, undefined, 'Modern secret keys belong on apikey, not Bearer')
  assert.equal(init.redirect, 'error')
  assert.equal(init.credentials, 'omit')
  if (url.endsWith('/bucket/private-audio')) return Response.json({ id: 'private-audio', public: false })
  if (init.method === 'POST') {
    assert.equal(url, `https://example.supabase.co/storage/v1/object/upload/sign/private-audio/originals/${objectId}`)
    assert.equal(init.headers['x-upsert'], 'false')
    return Response.json({ url: `/object/upload/sign/private-audio/originals/${objectId}?token=qa-signed` })
  }
  assert.equal(url, `https://example.supabase.co/storage/v1/object/private-audio/originals/${objectId}`)
  return streamed([bytes.slice(0, 5), bytes.slice(5, 13), bytes.slice(13)])
} })
assert.deepEqual(await storage.createSignedUpload(objectId), { signedUploadUrl: `https://example.supabase.co/storage/v1/object/upload/sign/private-audio/originals/${objectId}?token=qa-signed` })
assert.deepEqual(await storage.verifyOriginal(objectId, expected), expected)
await assert.rejects(storage.verifyOriginal(objectId, { ...expected, sha256: '0'.repeat(64) }), error => error.code === 'UPLOAD_OBJECT_MISMATCH')
await assert.rejects(storage.verifyOriginal(objectId, { ...expected, size: bytes.length - 1 }), error => error.code === 'UPLOAD_OBJECT_MISMATCH')
await assert.rejects(storage.verifyOriginal(objectId, { ...expected, size: bytes.length + 1 }), error => error.code === 'UPLOAD_OBJECT_MISMATCH')
const beforeInvalid = requests
for (const id of ['jisun', '../secret', objectId + '?token=secret']) await assert.rejects(storage.createSignedUpload(id), error => error.code === 'INVALID_UPLOAD_OBJECT')
await assert.rejects(storage.verifyOriginal(objectId, { ...expected, size: NaN }), error => error.code === 'INVALID_UPLOAD_FILE')
assert.equal(requests, beforeInvalid)
for (const configuration of [{}, { ...env, IEUM_STORAGE_PROVIDER: '' }, { ...env, IEUM_SUPABASE_URL: 'http://example.invalid' }, { ...env, IEUM_SUPABASE_SECRET_KEY: 'sb_publishable_wrong' }, { ...env, IEUM_AUDIO_BUCKET: '../public' }]) assert.throws(() => createSupabaseAudioStorage({ env: configuration }))
for (const url of ['https://attacker.invalid/?token=secret', `/object/upload/sign/other/${objectId}?token=secret`, `/object/upload/sign/private-audio/originals/${objectId}`]) {
  const bad = createSupabaseAudioStorage({ env, fetchImpl: privateBucket(async () => Response.json({ url })) })
  await assert.rejects(bad.createSignedUpload(objectId), error => error.code === 'INVALID_STORAGE_RESPONSE')
}
for (const headers of [{ 'Content-Type': 'text/plain' }, { 'Content-Type': 'audio/wav', 'Content-Length': String(bytes.length + 1) }]) {
  const bad = createSupabaseAudioStorage({ env, fetchImpl: privateBucket(async () => streamed([bytes], headers)) })
  await assert.rejects(bad.verifyOriginal(objectId, expected), error => error.code === 'UPLOAD_OBJECT_MISMATCH')
}
const interrupted = createSupabaseAudioStorage({ env, fetchImpl: privateBucket(async () => new Response(new ReadableStream({ start(controller) { controller.error(new Error('token=private')) } }), { headers: { 'Content-Type': 'audio/wav' } })) })
await assert.rejects(interrupted.verifyOriginal(objectId, expected), error => error.code === 'STORAGE_UNAVAILABLE' && !error.message.includes('private'))
const missing = createSupabaseAudioStorage({ env, fetchImpl: privateBucket(async () => new Response('secret', { status: 404 })) })
await assert.rejects(missing.verifyOriginal(objectId, expected), error => error.code === 'UPLOAD_OBJECT_MISSING')
const unavailable = createSupabaseAudioStorage({ env, fetchImpl: async () => { throw new Error('server-key-secret') } })
await assert.rejects(unavailable.createSignedUpload(objectId), error => error.code === 'STORAGE_UNAVAILABLE' && !error.message.includes('secret'))
for (const bucket of [{ id: 'private-audio', public: true }, { id: 'other', public: false }, { id: 'private-audio' }]) {
  const unsafe = createSupabaseAudioStorage({ env, fetchImpl: async () => Response.json(bucket) })
  await assert.rejects(unsafe.createSignedUpload(objectId), error => error.code === 'PRIVATE_STORAGE_REQUIRED')
  await assert.rejects(unsafe.verifyOriginal(objectId, expected), error => error.code === 'PRIVATE_STORAGE_REQUIRED')
}
console.log('Server Storage: opaque object path, no overwrite, modern secret header, streamed exact size/MIME/SHA256, missing/mismatched/interrupted object rejection passed. Injected Storage responses; no bucket/RLS/live service claim.')
