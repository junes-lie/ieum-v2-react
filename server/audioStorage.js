import { createHash } from 'node:crypto'
import { mkdtemp,open,rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join,resolve,sep } from 'node:path'
import { ServiceError } from '../src/projectService.js'
import { decodeOriginalAudio } from './audioDecoder.js'

// Optional proposal adapter. Never imported by the browser or exposed as an
// unrestricted signing endpoint. The caller must verify user/Part/intent first.
export function createSupabaseAudioStorage({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  if (env.IEUM_STORAGE_PROVIDER !== 'supabase' || !env.IEUM_SUPABASE_URL || !env.IEUM_SUPABASE_SECRET_KEY || !env.IEUM_AUDIO_BUCKET) throw new ServiceError('파일 저장 서비스가 아직 연결되지 않았어요.', { status: 503, code: 'SERVICE_NOT_CONFIGURED' })
  let origin
  try { origin = new URL(env.IEUM_SUPABASE_URL) } catch { throw new ServiceError('파일 저장 설정을 확인해야 해요.', { status: 503, code: 'INVALID_SERVICE_CONFIGURATION' }) }
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.username || origin.password || origin.search || origin.hash || !env.IEUM_SUPABASE_SECRET_KEY.startsWith('sb_secret_') || !/^[a-zA-Z0-9_-]{1,100}$/.test(env.IEUM_AUDIO_BUCKET) || typeof fetchImpl !== 'function') throw new ServiceError('파일 저장 설정을 확인해야 해요.', { status: 503, code: 'INVALID_SERVICE_CONFIGURATION' })
  const secretKey = env.IEUM_SUPABASE_SECRET_KEY
  const bucket = env.IEUM_AUDIO_BUCKET
  const path = objectId => {
    // Opaque object IDs: never put original user IDs into signed URL paths.
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(objectId || '')) throw new ServiceError('원본 파일 식별자를 확인해야 해요.', { code: 'INVALID_UPLOAD_OBJECT' })
    return `${bucket}/originals/${objectId}`
  }
  const request = async (endpoint, options) => {
    let response
    try { response = await fetchImpl(`${origin.origin}/storage/v1/${endpoint}`, { redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(60000), ...options, headers: { apikey: secretKey, ...options.headers } }) }
    catch { throw new ServiceError('파일 저장 서버에 연결하지 못했어요.', { status: 503, code: 'STORAGE_UNAVAILABLE' }) }
    const objectMissing = response.status === 404 && options.method === 'GET' && endpoint.startsWith('object/')
    if (!response.ok) throw new ServiceError('원본 파일을 확인하지 못했어요.', { status: objectMissing ? 409 : 503, code: objectMissing ? 'UPLOAD_OBJECT_MISSING' : 'STORAGE_UNAVAILABLE' })
    return response
  }
  const assertPrivateBucket = async () => {
    const response = await request(`bucket/${bucket}`, { method: 'GET' })
    let result
    try { result = await response.json() } catch { throw new ServiceError('파일 저장 응답을 확인할 수 없어요.', { code: 'INVALID_STORAGE_RESPONSE' }) }
    if (result.id !== bucket || result.public !== false) throw new ServiceError('원본 파일용 비공개 저장소를 확인해야 해요.', { status: 503, code: 'PRIVATE_STORAGE_REQUIRED' })
  }
  const verifyOriginal = async (objectId, expected, writeChunk) => {
      const objectPath = path(objectId)
      const boundedResult=expected?.size===undefined && Number.isSafeInteger(expected?.maxBytes) && expected.maxBytes>0
      if (!expected || (!boundedResult && (!Number.isSafeInteger(expected.size) || expected.size <= 0 || typeof expected.contentType !== 'string' || !expected.contentType.startsWith('audio/'))) || typeof expected.sha256!=='string' || !/^[a-f0-9]{64}$/i.test(expected.sha256)) throw new ServiceError('원본 파일 검증 정보를 확인해야 해요.', { code: 'INVALID_UPLOAD_FILE' })
      await assertPrivateBucket()
      const response = await request(`object/${objectPath}`, { method: 'GET' })
      const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
      const length = response.headers.get('content-length')
      if ((boundedResult ? !['audio/wav','audio/x-wav','audio/webm','audio/mp4'].includes(contentType) || (length!==null && (!Number.isSafeInteger(Number(length)) || Number(length)<=0 || Number(length)>expected.maxBytes)) :
        contentType !== expected.contentType.split(';')[0].trim().toLowerCase() || (length !== null && Number(length) !== expected.size)) || !response.body) {
        await response.body?.cancel().catch(() => {})
        throw new ServiceError('업로드한 원본 파일이 일치하지 않아요.', { status: 409, code: 'UPLOAD_OBJECT_MISMATCH' })
      }
      const reader = response.body.getReader()
      const hash = createHash('sha256')
      let size = 0
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.byteLength
          if (size > (boundedResult?expected.maxBytes:expected.size)) throw new ServiceError('업로드한 원본 파일이 일치하지 않아요.', { status: 409, code: 'UPLOAD_OBJECT_MISMATCH' })
          hash.update(value)
          if(writeChunk)await writeChunk(value)
        }
        const sha256 = hash.digest('hex')
        if (size<=0 || (!boundedResult && size !== expected.size) || (boundedResult && length!==null && size!==Number(length)) || sha256 !== expected.sha256.toLowerCase()) throw new ServiceError('업로드한 원본 파일이 일치하지 않아요.', { status: 409, code: 'UPLOAD_OBJECT_MISMATCH' })
        return { size, sha256, contentType }
      } catch (error) {
        await reader.cancel().catch(() => {})
        if (error?.code === 'UPLOAD_OBJECT_MISMATCH') throw error
        throw new ServiceError('원본 파일 검증을 완료하지 못했어요.', { status: 503, code: 'STORAGE_UNAVAILABLE' })
      } finally { reader.releaseLock() }
  }
  return {
    async createSignedRead(objectId,expiresIn=600) {
      const objectPath=path(objectId)
      if(!Number.isInteger(expiresIn) || expiresIn<=0 || expiresIn>3600)throw new ServiceError('원본 접근 기간을 확인해야 해요.',{code:'INVALID_UPLOAD_FILE'})
      await assertPrivateBucket()
      const response=await request(`object/sign/${objectPath}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn})})
      let result,url
      try{
        result=await response.json()
        if(typeof result.signedURL!=='string' || !result.signedURL.startsWith(`/object/sign/${objectPath}?`))throw new Error('invalid path')
        url=new URL(`${origin.origin}/storage/v1${result.signedURL}`)
        if(url.pathname!==`/storage/v1/object/sign/${objectPath}` || url.hash || url.searchParams.getAll('token').length!==1 || !url.searchParams.get('token'))throw new Error('invalid token')
      }catch{throw new ServiceError('파일 저장 응답을 확인할 수 없어요.',{code:'INVALID_STORAGE_RESPONSE'})}
      return {audioUrl:url.href,expiresIn}
    },
    async createSignedUpload(objectId) {
      const objectPath = path(objectId)
      await assertPrivateBucket()
      const response = await request(`object/upload/sign/${objectPath}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-upsert': 'false' }, body: '{}' })
      let result
      try { result = await response.json() } catch { throw new ServiceError('파일 저장 응답을 확인할 수 없어요.', { code: 'INVALID_STORAGE_RESPONSE' }) }
      let url
      try {
        if (typeof result.url !== 'string' || !result.url.startsWith(`/object/upload/sign/${objectPath}?`)) throw new Error('invalid path')
        url = new URL(`${origin.origin}/storage/v1${result.url}`)
        if (url.pathname !== `/storage/v1/object/upload/sign/${objectPath}` || url.hash || url.searchParams.getAll('token').length !== 1 || !url.searchParams.get('token')) throw new Error('invalid token')
      } catch { throw new ServiceError('파일 저장 응답을 확인할 수 없어요.', { code: 'INVALID_STORAGE_RESPONSE' }) }
      return { signedUploadUrl: url.href }
    },
    verifyOriginal: (objectId,expected) => verifyOriginal(objectId,expected),
    async verifyOriginalAudio(objectId,expected,decoderOptions) {
      // A private staging copy allows seeking MP4 without retaining an entire
      // recording in RAM. Only hash-matched bytes are passed to the decoder.
      const directory=await mkdtemp(join(tmpdir(),'ieum-original-verification-'))
      const filePath=join(directory,'original'),parent=resolve(tmpdir())+sep
      let file
      try {
        file=await open(filePath,'wx',0o600)
        const verified=await verifyOriginal(objectId,expected,chunk=>file.writeFile(chunk))
        await file.close();file=null
        const media=await decodeOriginalAudio(filePath,{...decoderOptions,contentType:verified.contentType})
        return {...verified,...media}
      } finally {
        await file?.close()
        const target=resolve(directory)
        if(target.startsWith(parent) && target.split(sep).at(-1).startsWith('ieum-original-verification-'))
          await rm(target,{recursive:true,force:true}) // Only the staging copy created by this invocation.
      }
    }
  }
}
