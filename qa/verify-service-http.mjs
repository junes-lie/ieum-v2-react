import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { createRemoteProjectService } from '../src/projectService.js'
import { createSupabaseSignedAudioUploader } from '../src/signedAudioUpload.js'
import { transferAndSubmitTrack } from '../src/trackTransfer.js'
import { GET as getCapabilities, POST as postCapabilities } from '../api/capabilities.js'
import { GET as getSession } from '../api/me/session.js'

// One isolated loopback fixture; never writes the user's DB or external Storage.
let stage = 'prepare-failure', uploaded, expectedFile, submissions = 0, uploadRequests = 0, preparationRequests = 0
const blob = new Blob([new Uint8Array(5 * 1024 * 1024).fill(23)], { type: 'audio/wav' })
const sha256 = createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex')
let origin
const previousProvider = process.env.IEUM_AUTH_PROVIDER
delete process.env.IEUM_AUTH_PROVIDER // This fixture must never call a real Auth service.
const server = createServer(async (req, res) => {
  const reply = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)) }
  try {
    const url = new URL(req.url, origin)
    if (url.pathname === '/api/capabilities' || url.pathname === '/api/me/session') {
      const response = url.pathname === '/api/capabilities' ? (req.method === 'GET' ? getCapabilities() : postCapabilities()) : await getSession(new Request(url, { headers: req.headers }))
      res.writeHead(response.status, Object.fromEntries(response.headers))
      res.end(await response.text())
      return
    }
    const bytes = []
    for await (const chunk of req) bytes.push(chunk)
    const body = Buffer.concat(bytes)
    if (url.pathname.endsWith('/upload-intents')) {
      preparationRequests++
      assert.equal(req.headers.authorization, 'Bearer qa-api-token')
      assert.equal(req.headers['idempotency-key'], 'upload-key')
      assert.ok(body.length < 1000)
      expectedFile = JSON.parse(body)
      assert.equal(expectedFile.sha256, sha256)
      if (stage === 'prepare-failure') return reply(503, { diagnostic: 'must-not-echo' })
      return reply(200, { uploadIntentId: 'opaque-intent', ...(uploaded ? { uploadStatus: 'verified', verifiedFile: expectedFile } : { signedUploadUrl: `${origin}/storage/v1/object/upload/sign/private-audio/opaque-id?token=qa-signed` }) })
    }
    if (url.pathname.startsWith('/storage/')) {
      uploadRequests++
      assert.equal(req.method, 'PUT')
      assert.equal(req.headers.authorization, undefined)
      assert.equal(req.headers.cookie, undefined)
      assert.equal(req.headers['content-type'], 'audio/wav')
      assert.equal(body.length, blob.size)
      assert.equal(createHash('sha256').update(body).digest('hex'), sha256)
      if (stage === 'upload-failure') return reply(500, {})
      if (uploaded) return reply(409, {})
      uploaded = body
      return reply(200, { Key: 'private-audio/opaque-id' })
    }
    if (url.pathname.endsWith('/tracks')) {
      assert.equal(req.headers.authorization, 'Bearer qa-api-token')
      assert.equal(req.headers['idempotency-key'], 'submission-key')
      assert.ok(body.length < 1000)
      assert.equal(JSON.parse(body).uploadIntentId, 'opaque-intent')
      assert.equal(uploaded.length, blob.size)
      if (stage === 'submit-failure') return reply(409, {})
      submissions = 1 // Fixture idempotency result, not a production transaction.
      return reply(200, { status: 'submitted', trackId: 'p:tenor' })
    }
    reply(404, {})
  } catch { reply(500, { fixtureFailure: true }) }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
origin = `http://127.0.0.1:${server.address().port}`
try {
  const service = createRemoteProjectService({ baseUrl: origin + '/api/', getAccessToken: () => 'qa-api-token' })
  const capabilities = await service.discover()
  assert.equal(capabilities.sharedProjects, false)
  assert.equal(capabilities.authenticated, false)
  await assert.rejects(service.getSession(), error => error.status === 503)
  const unauthenticatedSession = await fetch(origin + '/api/me/session')
  assert.equal(unauthenticatedSession.status, 401)
  assert.equal(unauthenticatedSession.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(await unauthenticatedSession.json(), { error: { code: 'AUTH_REQUIRED' } })
  const unsupportedMethod = await fetch(origin + '/api/capabilities', { method: 'POST' })
  assert.equal(unsupportedMethod.status, 405)
  const uploadOriginal = createSupabaseSignedAudioUploader({ storageOrigin: origin })
  const options = { service, uploadOriginal, projectId: 'p', partId: 'tenor', take: { blob, duration: 19, syncOffsetMs: 0, features: { version: 'qa' }, projectSeed: 'qa-seed' }, uploadKey: 'upload-key', submissionKey: 'submission-key' }
  await assert.rejects(transferAndSubmitTrack(options), error => error.code === 'HTTP_ERROR')
  assert.equal(uploadRequests, 0); assert.equal(submissions, 0)
  stage = 'upload-failure'
  await assert.rejects(transferAndSubmitTrack(options), error => error.code === 'UPLOAD_FAILED')
  assert.equal(submissions, 0); assert.equal(uploaded, undefined)
  stage = 'submit-failure'
  await assert.rejects(transferAndSubmitTrack(options), error => error.code === 'CONFLICT')
  assert.equal(submissions, 0); assert.equal(uploaded.length, blob.size)
  const uploadedAttempts = uploadRequests
  stage = 'success'
  assert.deepEqual(await transferAndSubmitTrack(options), { status: 'submitted', trackId: 'p:tenor' })
  assert.equal(uploadRequests, uploadedAttempts, 'Verified retry must not overwrite the immutable object')
  await transferAndSubmitTrack(options)
  assert.equal(uploadRequests, uploadedAttempts); assert.equal(submissions, 1)
  assert.equal(createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex'), sha256)
  // A forged verified receipt cannot skip upload or proceed to submission.
  await assert.rejects(transferAndSubmitTrack({ ...options, service: { ...service, prepareTrackUpload: async () => ({ uploadIntentId: 'bad', uploadStatus: 'verified', verifiedFile: { ...expectedFile, sha256: '0'.repeat(64) } }) } }), error => error.code === 'INVALID_RESPONSE')
  console.log(JSON.stringify({ passed: true, originalBytes: blob.size, nativeHttpTransfer: true, apiPayloadUnder1000Bytes: true, preparationRequests, uploadFailureNoSubmission: true, submissionFailurePreservesOriginal: true, verifiedRetryNoOverwrite: true, noApiTokenAtStorage: true, limitations: 'Isolated loopback fixture, not Supabase/real-user/production DB evidence.' }))
} finally {
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve))
  if (previousProvider !== undefined) process.env.IEUM_AUTH_PROVIDER = previousProvider
}
