import { ServiceError } from './projectService.js'

// Optional Supabase proposal adapter. Explicit construction/configuration only;
// this does not select a provider or connect the current local App automatically.
export function createSupabaseSignedAudioUploader({ storageOrigin, fetchImpl = globalThis.fetch } = {}) {
  let origin
  try { origin = new URL(storageOrigin) } catch { throw new ServiceError('파일 저장 서비스가 설정되지 않았어요.', { code: 'SERVICE_NOT_CONFIGURED' }) }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
  if ((origin.protocol !== 'https:' && !(loopback && origin.protocol === 'http:')) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password || typeof fetchImpl !== 'function') throw new ServiceError('파일 저장 서비스 주소를 확인해 주세요.', { code: 'INVALID_SERVICE_URL' })
  return async (intent, original, { signal } = {}) => {
    if (!(original instanceof Blob) || !original.size || !original.type.startsWith('audio/')) throw new ServiceError('원본 녹음이 필요해요.', { code: 'TAKE_REQUIRED' })
    let url
    try { url = new URL(intent?.signedUploadUrl) } catch { throw new ServiceError('업로드 준비 응답을 확인할 수 없어요.', { code: 'INVALID_RESPONSE' }) }
    if (url.origin !== origin.origin || url.username || url.password || url.hash || !url.pathname.startsWith('/storage/v1/object/upload/sign/') || url.searchParams.getAll('token').length !== 1 || !url.searchParams.get('token')) throw new ServiceError('업로드 준비 응답을 확인할 수 없어요.', { code: 'INVALID_RESPONSE' })
    let response
    try {
      response = await fetchImpl(url.href, {
        method: 'PUT', body: original, credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal,
        headers: { 'Content-Type': original.type.split(';')[0].trim().toLowerCase(), 'Cache-Control': 'max-age=0', 'x-upsert': 'false' }
      })
    } catch {
      // Native network errors can contain signed URLs/tokens. Never echo them.
      throw new ServiceError(signal?.aborted ? '파일 전송이 중단됐어요. 원본은 유지됩니다.' : '원본 파일을 전송하지 못했어요. 다시 시도해 주세요.', { code: signal?.aborted ? 'UPLOAD_ABORTED' : 'UPLOAD_NETWORK_ERROR' })
    }
    if (!response.ok) throw new ServiceError('원본 파일 업로드를 완료하지 못했어요.', { status: response.status, code: 'UPLOAD_FAILED' })
    return { uploaded: true }
  }
}
