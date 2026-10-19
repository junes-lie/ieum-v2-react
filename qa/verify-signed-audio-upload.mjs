import assert from 'node:assert/strict'
import { createSupabaseSignedAudioUploader } from '../src/signedAudioUpload.js'

const signedUploadUrl = 'https://example.supabase.co/storage/v1/object/upload/sign/private-audio/opaque-id?token=qa-signed'
const blob = new Blob(['original'], { type: 'audio/wav' })
let sent = 0
const upload = createSupabaseSignedAudioUploader({ storageOrigin: 'https://example.supabase.co', fetchImpl: async (url, options) => {
  sent++
  assert.equal(url, signedUploadUrl)
  assert.equal(options.body, blob)
  assert.equal(options.method, 'PUT')
  assert.equal(options.credentials, 'omit')
  assert.equal(options.redirect, 'error')
  assert.equal(options.referrerPolicy, 'no-referrer')
  assert.equal(options.headers.Authorization, undefined)
  assert.equal(options.headers.apikey, undefined)
  assert.equal(options.headers['Content-Type'], 'audio/wav')
  assert.equal(options.headers['x-upsert'], 'false')
  return new Response('{}', { status: 200 })
} })
assert.deepEqual(await upload({ signedUploadUrl }, blob), { uploaded: true })
for (const url of [signedUploadUrl.replace('example.supabase.co', 'other.example'), signedUploadUrl.replace('/storage/v1/object/upload/sign/', '/public/'), signedUploadUrl.replace('https:', 'http:'), signedUploadUrl.replace('?token=qa-signed', ''), signedUploadUrl + '&token=second', 'https://secret@example.supabase.co/storage/v1/object/upload/sign/b/o?token=secret']) await assert.rejects(upload({ signedUploadUrl: url }, blob), error => error.code === 'INVALID_RESPONSE')
assert.equal(sent, 1)
await assert.rejects(upload({ signedUploadUrl }, new Blob([])), error => error.code === 'TAKE_REQUIRED')
assert.throws(() => createSupabaseSignedAudioUploader({ storageOrigin: 'http://example.invalid' }), error => error.code === 'INVALID_SERVICE_URL')
assert.throws(() => createSupabaseSignedAudioUploader(), error => error.code === 'SERVICE_NOT_CONFIGURED')
for (const status of [403, 409, 500]) {
  const fail = createSupabaseSignedAudioUploader({ storageOrigin: 'https://example.supabase.co', fetchImpl: async () => new Response('secret diagnostics', { status }) })
  await assert.rejects(fail({ signedUploadUrl }, blob), error => error.code === 'UPLOAD_FAILED' && error.status === status && !error.message.includes('secret'))
}
const fail = createSupabaseSignedAudioUploader({ storageOrigin: 'https://example.supabase.co', fetchImpl: async () => { throw new Error('https://secret/?token=private') } })
await assert.rejects(fail({ signedUploadUrl }, blob), error => error.code === 'UPLOAD_NETWORK_ERROR' && !error.message.includes('private'))
await assert.rejects(fail({ signedUploadUrl }, blob, { signal: AbortSignal.abort() }), error => error.code === 'UPLOAD_ABORTED')
console.log('Signed audio upload: exact Blob PUT, explicit Storage origin, no API bearer/cookies/referrer, redirect refusal, failed/aborted upload and private errors passed. Injected HTTP; no provider connection claim.')
