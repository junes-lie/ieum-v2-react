import { ServiceError } from './projectService.js'

// The provider adapter uploads the Blob. This module never deletes a Draft or
// treats an uploaded object as a submitted Track, generated Layer or final Mix.
export async function transferAndSubmitTrack({ service, projectId, partId, take, uploadKey, submissionKey, uploadOriginal }) {
  if (!(take?.blob instanceof Blob) || !take.blob.size || !take.blob.type.startsWith('audio/')) throw new ServiceError('원본 녹음이 필요해요.', { code: 'TAKE_REQUIRED' })
  if (!Number.isFinite(take.duration) || take.duration <= 0 || !Number.isFinite(take.syncOffsetMs ?? 0) || (take.syncOffsetMs ?? 0) < 0 || (take.syncOffsetMs ?? 0) >= take.duration * 1000) throw new ServiceError('녹음 길이와 정렬 정보를 확인해 주세요.', { code: 'INVALID_TAKE_METADATA' })
  if (![projectId, partId].every(value => typeof value === 'string' && value.trim() && !['.', '..'].includes(value))) throw new ServiceError('대상 ID를 확인해 주세요.', { code: 'INVALID_ID' })
  if (![uploadKey, submissionKey].every(value => typeof value === 'string' && value.trim()) || uploadKey === submissionKey) throw new ServiceError('업로드와 제출의 중복 방지 키가 필요해요.', { code: 'IDEMPOTENCY_KEY_REQUIRED' })
  if (typeof service?.prepareTrackUpload !== 'function' || typeof service?.submitUploadedTrack !== 'function' || typeof uploadOriginal !== 'function') throw new ServiceError('업로드 서비스가 설정되지 않았어요.', { code: 'SERVICE_NOT_CONFIGURED' })
  // Capture submission metadata before awaiting; edits cannot change what the
  // original upload is submitted as while the network operation is in flight.
  const original = take.blob
  const metadata = structuredClone({ duration: take.duration, syncOffsetMs: take.syncOffsetMs ?? 0, features: take.features, projectSeed: take.projectSeed })
  const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await original.arrayBuffer()))].map(value => value.toString(16).padStart(2, '0')).join('')
  const intent = await service.prepareTrackUpload(projectId, partId, { size: original.size, contentType: original.type, sha256 }, uploadKey)
  if (typeof intent?.uploadIntentId !== 'string' || !intent.uploadIntentId.trim()) throw new ServiceError('업로드 준비 응답을 확인할 수 없어요.', { code: 'INVALID_RESPONSE' })
  const uploadIntentId = intent.uploadIntentId
  const receipt = await uploadOriginal(intent, original)
  if (receipt?.uploaded !== true) throw new ServiceError('원본 파일 업로드를 완료하지 못했어요.', { code: 'UPLOAD_FAILED' })
  // The server must independently verify the intent, ownership and object hash.
  // Return its response unchanged; only the caller's verified submission path
  // may update counts or remove a Draft.
  return service.submitUploadedTrack(projectId, partId, { ...metadata, uploadIntentId }, submissionKey)
}
