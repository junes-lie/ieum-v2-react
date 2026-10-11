import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { transferAndSubmitTrack } from '../src/trackTransfer.js'
import { createRemoteProjectService } from '../src/projectService.js'
import { indexedDB } from 'fake-indexeddb'
import { saveTrack, loadTrack } from '../src/trackStore.js'

const blob = new Blob(['preserved original recording'], { type: 'audio/wav' })
const originalHash = createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex')
const take = { blob, duration: 19, syncOffsetMs: 200, features: { version: 'qa', energy: .3 }, projectSeed: 'seed' }
const calls = []
const service = {
  async prepareTrackUpload(projectId, partId, file, key) {
    calls.push(['prepare', projectId, partId, file, key])
    return { uploadIntentId: 'intent-1' }
  },
  async submitUploadedTrack(projectId, partId, metadata, key) {
    calls.push(['submit', projectId, partId, metadata, key])
    return { status: 'submitted', trackId: 'track-1' }
  }
}
const options = { service, projectId: 'p', partId: 'tenor', take, uploadKey: 'upload-1', submissionKey: 'submit-1', uploadOriginal: async (intent, original) => {
  calls.push(['upload', intent.uploadIntentId, original])
  assert.equal(original, blob)
  return { uploaded: true }
} }
assert.deepEqual(await transferAndSubmitTrack(options), { status: 'submitted', trackId: 'track-1' })
assert.deepEqual(calls.map(call => call[0]), ['prepare', 'upload', 'submit'])
assert.equal(calls[0][3].sha256, originalHash)
assert.equal(calls[2][3].blob, undefined)
assert.equal(calls[2][4], 'submit-1')
for (const uploadOriginal of [async () => { throw new Error('upload network failure') }, async () => ({}), async () => ({ uploaded: false })]) {
  calls.length = 0
  await assert.rejects(transferAndSubmitTrack({ ...options, uploadOriginal }))
  assert.deepEqual(calls.map(call => call[0]), ['prepare'])
}
calls.length = 0
await assert.rejects(transferAndSubmitTrack({ ...options, service: { ...service, prepareTrackUpload: async () => ({}) } }), error => error.code === 'INVALID_RESPONSE')
assert.equal(calls.length, 0)
calls.length = 0
await assert.rejects(transferAndSubmitTrack({ ...options, service: { ...service, submitUploadedTrack: async () => { throw new Error('submit conflict') } } }), /submit conflict/)
assert.deepEqual(calls.map(call => call[0]), ['prepare', 'upload'])
assert.equal(createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex'), originalHash)
calls.length = 0
await transferAndSubmitTrack(options)
assert.equal(calls[0][4], 'upload-1')
assert.equal(calls[2][4], 'submit-1')
calls.length = 0
for (const bad of [{ submissionKey: 'upload-1' }, { take: { ...take, syncOffsetMs: -1 } }, { take: { ...take, duration: NaN } }, { partId: '..' }, { uploadOriginal: undefined }]) await assert.rejects(transferAndSubmitTrack({ ...options, ...bad }))
assert.equal(calls.length, 0)
calls.length = 0
await transferAndSubmitTrack({ ...options, uploadOriginal: async () => {
  take.duration = 99; take.features.energy = .9
  return { uploaded: true }
} })
assert.equal(calls.find(call => call[0] === 'submit')[3].duration, 19)
assert.equal(calls.find(call => call[0] === 'submit')[3].features.energy, .3)
assert.equal(createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex'), originalHash)
// Exercise the orchestration through the existing transport, while preserving
// a real local Draft in isolated in-memory IndexedDB across a remote conflict.
globalThis.indexedDB = indexedDB
const draftId = 'qa:p:tenor:temporary-recording'
await saveTrack({ id: draftId, projectId: 'p', partId: 'tenor', kind: 'temporary-recording', blob })
const network = []
let rejectSubmission = true
const remote = createRemoteProjectService({ baseUrl: 'https://example.invalid/api/', getAccessToken: () => 'qa-token', fetchImpl: async (url, init) => {
  network.push({ url, init })
  if (url.endsWith('/upload-intents')) return { ok: true, status: 200, json: async () => ({ uploadIntentId: 'network-intent' }) }
  return rejectSubmission ? { ok: false, status: 409 } : { ok: true, status: 200, json: async () => ({ status: 'submitted' }) }
} })
const networkOptions = { ...options, service: remote, take: { ...take, duration: 19 }, uploadOriginal: async (intent, original) => {
  assert.equal(intent.uploadIntentId, 'network-intent')
  assert.equal(original, blob)
  return { uploaded: true }
} }
await assert.rejects(transferAndSubmitTrack(networkOptions), error => error.code === 'CONFLICT')
assert.equal(await (await loadTrack(draftId)).blob.text(), await blob.text())
assert.equal(network.length, 2)
assert.equal(JSON.parse(network[0].init.body).sha256, originalHash)
assert.equal(JSON.parse(network[1].init.body).uploadIntentId, 'network-intent')
assert.equal(JSON.parse(network[1].init.body).blob, undefined)
rejectSubmission = false
assert.deepEqual(await transferAndSubmitTrack(networkOptions), { status: 'submitted' })
assert.equal(network[0].init.headers['Idempotency-Key'], network[2].init.headers['Idempotency-Key'])
assert.equal(network[1].init.headers['Idempotency-Key'], network[3].init.headers['Idempotency-Key'])
assert.equal(await (await loadTrack(draftId)).blob.text(), await blob.text(), 'Transfer success alone must not remove local Draft')
console.log('Track transfer order, exact Blob hash, failure preservation, stable retry keys and metadata snapshot passed. Injected service/uploader; no live Storage or server claim.')
