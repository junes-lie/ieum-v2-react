import assert from 'node:assert/strict'
import { createLocalProjectService, createRemoteProjectService, readLocalUserState, writeLocalUserState } from '../src/projectService.js'

const values = new Map()
const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
assert.equal(readLocalUserState(storage, 'state'), null)
writeLocalUserState(storage, 'state', { projectId: 'p', joined: true })
assert.deepEqual(readLocalUserState(storage, 'state'), { projectId: 'p', joined: true })
assert.throws(() => writeLocalUserState({ setItem() { throw new Error('quota') } }, 'state', {}), /quota/)
storage.setItem('bad', '[]')
assert.throws(() => readLocalUserState(storage, 'bad'), /저장된/)
assert.equal(createLocalProjectService({ storage, stateKey: 'state', trackStore: {} }).capabilities.sharedProjects, false)
assert.throws(() => createRemoteProjectService(), error => error.code === 'SERVICE_NOT_CONFIGURED')
assert.throws(() => createRemoteProjectService({ baseUrl: 'http://example.com' }), error => error.code === 'INVALID_SERVICE_URL')
assert.throws(() => createRemoteProjectService({ baseUrl: 'https://user:password@example.com' }), error => error.code === 'INVALID_SERVICE_URL')
const calls = []
const remote = createRemoteProjectService({ baseUrl: 'https://example.invalid/api/', getAccessToken: () => 'test-token', fetchImpl: async (url, options) => {
  calls.push({ url, options })
  return { ok: true, status: 200, json: async () => ({ status: 'pending' }) }
} })
assert.deepEqual(await remote.invite('project/a', 'part-b', 'recipient', 'request-1'), { status: 'pending' })
assert.equal(calls[0].url, 'https://example.invalid/api/projects/project%2Fa/invitations')
assert.equal(calls[0].options.headers['Idempotency-Key'], 'request-1')
assert.deepEqual(JSON.parse(calls[0].options.body), { partId: 'part-b', recipientId: 'recipient' })
assert.throws(() => remote.respondToInvitation('inv', 'auto-accept', 'request-2'), error => error.code === 'INVALID_DECISION')
assert.throws(() => remote.joinPart('p', 'a', ''), error => error.code === 'IDEMPOTENCY_KEY_REQUIRED')
assert.throws(() => remote.getProject('..'), error => error.code === 'INVALID_ID')
let sent = false
const unauthenticated = createRemoteProjectService({ baseUrl: 'http://127.0.0.1:9999/', fetchImpl: async () => { sent = true; return { ok: true, status: 200, json: async () => ({}) } } })
await assert.rejects(unauthenticated.getProject('p'), error => error.code === 'AUTH_REQUIRED')
assert.equal(sent, false)
await unauthenticated.discover()
assert.equal(sent, true)
const conflict = createRemoteProjectService({ baseUrl: 'https://example.invalid', getAccessToken: () => 'test-token', fetchImpl: async () => ({ ok: false, status: 409 }) })
await assert.rejects(conflict.respondToInvitation('inv', 'accept', 'request-3'), error => error.code === 'CONFLICT' && error.status === 409)
console.log('Project service contract checks passed (stub HTTP; no server connection claimed).')
