import { ServiceError } from '../src/projectService.js'
import { readAuthConfiguration, verifyRequestUser } from './auth.js'
import { createSupabaseAudioStorage } from './audioStorage.js'
import { verifySubmissionAudio } from './submissionAudio.js'
import { isAbsolute } from 'node:path'

const fail = code => new ServiceError('프로젝트 요청을 완료하지 못했어요. 녹음 원본은 유지됩니다.',{ code })
const text = value => typeof value==='string' && Boolean(value.trim())
const uuid = value => typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)

function routeOf(request) {
  const url = new URL(request.url)
  let path
  if (url.pathname==='/api/projects') path=''
  else if (url.pathname.startsWith('/api/projects/')) path = url.pathname.slice('/api/projects/'.length)
  else if (url.pathname==='/api/project-lifecycle' && url.searchParams.getAll('route').length===1) path=url.searchParams.get('route')
  else throw fail('PROJECT_ROUTE_NOT_FOUND')
  if (path==='') {
    if (request.method!=='POST') throw fail('METHOD_NOT_ALLOWED')
    return {operation:'create'}
  }
  let segments
  try { segments=path.split('/').map(decodeURIComponent) } catch { throw fail('INVALID_PROJECT_REQUEST') }
  if (segments.some(value=>!text(value) || value.includes('/') || ['.','..'].includes(value))) throw fail('INVALID_PROJECT_REQUEST')
  if (segments.length===1 && request.method==='GET') return { projectId:segments[0],operation:'get' }
  if (segments.length===2 && ['tracks','mix'].includes(segments[1])) {
    if(request.method!=='GET')throw fail('METHOD_NOT_ALLOWED')
    return {projectId:segments[0],operation:segments[1]}
  }
  if (segments.length===4 && segments[1]==='parts' && ['recording-start','tracks','join','upload-intents'].includes(segments[3])) {
    if (request.method!=='POST') throw fail('METHOD_NOT_ALLOWED')
    return { projectId:segments[0],partId:segments[2],operation:segments[3]==='tracks'?'submit':segments[3]==='join'?'join':segments[3]==='upload-intents'?'upload':'start' }
  }
  if (segments.length===1) throw fail('METHOD_NOT_ALLOWED')
  throw fail('PROJECT_ROUTE_NOT_FOUND')
}

async function readMetadata(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) throw fail('INVALID_PROJECT_REQUEST')
  const reader=request.body?.getReader()
  if (!reader) throw fail('INVALID_PROJECT_REQUEST')
  const chunks=[]; let size=0
  try {
    while (true) {
      const { done,value }=await reader.read()
      if (done) break
      size+=value.byteLength
      if (size>65536) { await reader.cancel(); throw fail('PROJECT_PAYLOAD_TOO_LARGE') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes=new Uint8Array(size); let offset=0
  for (const chunk of chunks) { bytes.set(chunk,offset);offset+=chunk.length }
  let result
  try { result=JSON.parse(new TextDecoder('utf-8',{ fatal:true }).decode(bytes)) } catch { throw fail('INVALID_PROJECT_REQUEST') }
  if (!result || Array.isArray(result) || typeof result!=='object') throw fail('INVALID_PROJECT_REQUEST')
  return result
}

function projectSnapshot(value,projectId) {
  const source=value?.audioSourceRef
  if (!value || typeof value!=='object' || value.id!==projectId || !text(value.seed) || !text(value.songId) || !text(value.key) ||
    ![2,3,4].includes(value.partCount) || !Array.isArray(value.parts) || value.parts.length!==value.partCount ||
    !Number.isInteger(value.submittedTrackCount) || value.submittedTrackCount<0 || value.submittedTrackCount>value.partCount ||
    !Number.isInteger(value.revision) || value.revision<0 || !['recruiting','mixing','completed'].includes(value.lifecycle) ||
    !source || Array.isArray(source) || typeof source!=='object' || source.songId!==value.songId || source.key!==value.key ||
    !text(source.revision) || !Number.isFinite(source.duration) || source.duration<=0 ||
    !/^[a-f0-9]{64}$/.test(source.sourceSha256 || '') || !/^[a-f0-9]{64}$/.test(source.backingSha256 || '') ||
    !(value.keyLockedAt===null || (typeof value.keyLockedAt==='string' && Number.isFinite(Date.parse(value.keyLockedAt)))) ||
    value.parts.some(part=>!text(part?.id) || !['open','ready','submitted'].includes(part.status) ||
      (part.participantId!==null && !uuid(part.participantId)) || (part.status==='open' && part.participantId!==null) ||
      (part.status!=='open' && !uuid(part.participantId)) ||
      (part.status==='submitted' && part.trackId!==`${projectId}:${part.id}`) || (part.status!=='submitted' && part.trackId!==null)) ||
    new Set(value.parts.map(part=>part.id)).size!==value.partCount ||
    value.parts.filter(part=>part.status==='submitted').length!==value.submittedTrackCount ||
    (value.lifecycle!=='recruiting' && value.submittedTrackCount!==value.partCount)) throw fail('INVALID_PROJECT_RESPONSE')
  return { id:value.id,seed:value.seed,songId:value.songId,key:value.key,
    audioSourceRef:Object.fromEntries(['songId','key','revision','duration','sourceSha256','backingSha256'].map(key=>[key,source[key]])),
    partCount:value.partCount,parts:value.parts.map(({id,participantId,requiredRange,status,trackId})=>({id,participantId,requiredRange,status,trackId})),
    submittedTrackCount:value.submittedTrackCount,revision:value.revision,lifecycle:value.lifecycle,keyLockedAt:value.keyLockedAt }
}

export async function projectLifecycleRequest(request,{ env=process.env,fetchImpl=globalThis.fetch }={}) {
  const user=await verifyRequestUser(request,{ env,fetchImpl })
  if (env.IEUM_DB_PROVIDER!=='supabase') throw fail('SERVICE_NOT_CONFIGURED')
  const route=routeOf(request), configuration=readAuthConfiguration(env)
  let rpc=route.operation==='tracks'?'ieum_list_project_tracks':route.operation==='mix'?'ieum_get_project_mix':'ieum_get_project', body=route.operation==='create'?{}:{ p_project_id:route.projectId }, requestedOwnerPart, storage
  if (!['get','tracks','mix'].includes(route.operation)) {
    const value=await readMetadata(request)
    if (route.operation!=='create') body.p_part_id=route.partId
    if (route.operation==='upload') {
      const key=request.headers.get('idempotency-key')
      if (!text(key)) throw fail('IDEMPOTENCY_KEY_REQUIRED')
      const contentType=typeof value.contentType==='string'?value.contentType.split(';')[0].trim().toLowerCase():''
      if (Object.keys(value).length!==3 || Object.keys(value).some(field=>!['size','sha256','contentType'].includes(field)) ||
        !Number.isSafeInteger(value.size) || value.size<=0 || typeof value.sha256!=='string' || !/^[a-f0-9]{64}$/i.test(value.sha256) ||
        !/^audio\/[a-z0-9][a-z0-9!#$&^_.+-]*$/.test(contentType)) throw fail('INVALID_UPLOAD_FILE')
      // Check provider configuration before allocating an intent. Signing follows the ownership RPC.
      storage=createSupabaseAudioStorage({env,fetchImpl})
      rpc='ieum_prepare_track_upload'
      Object.assign(body,{p_request_key:key,p_size:value.size,p_sha256:value.sha256.toLowerCase(),p_content_type:contentType})
    } else if (route.operation==='create' || route.operation==='join') {
      const key=request.headers.get('idempotency-key')
      if (!text(key)) throw fail('IDEMPOTENCY_KEY_REQUIRED')
      body.p_request_key=key
      if (route.operation==='create') {
        if (Object.keys(value).length!==2 || Object.keys(value).some(field=>!['arrangementId','ownerPartId'].includes(field)) ||
          !text(value.arrangementId) || !text(value.ownerPartId)) throw fail('INVALID_PROJECT_REQUEST')
        rpc='ieum_create_project'
        body.p_arrangement_id=value.arrangementId;body.p_owner_part_id=value.ownerPartId
        requestedOwnerPart=value.ownerPartId
      } else {
        if (Object.keys(value).length) throw fail('INVALID_PROJECT_REQUEST')
        rpc='ieum_join_project_part'
      }
    } else if (route.operation==='start') {
      if (Object.keys(value).length) throw fail('INVALID_PROJECT_REQUEST')
      rpc='ieum_start_project_recording'
    } else {
      const key=request.headers.get('idempotency-key')
      if (!text(key)) throw fail('IDEMPOTENCY_KEY_REQUIRED')
      if (Object.keys(value).some(field=>!['uploadIntentId','duration','syncOffsetMs','features','projectSeed'].includes(field)) ||
        !uuid(value.uploadIntentId) || !Number.isFinite(value.duration) || value.duration<=0 ||
        !Number.isFinite(value.syncOffsetMs) || value.syncOffsetMs<0 || value.syncOffsetMs>=value.duration*1000 ||
        (value.features!==undefined && value.features!==null && (!value.features || Array.isArray(value.features) || typeof value.features!=='object')) ||
        (value.projectSeed!==undefined && !text(value.projectSeed))) throw fail('INVALID_PROJECT_REQUEST')
      rpc='ieum_submit_verified_track'
      Object.assign(body,{ p_upload_intent_id:value.uploadIntentId,p_request_key:key,p_duration:value.duration,p_sync_offset_ms:value.syncOffsetMs,
        p_features:value.features ?? null,p_project_seed:value.projectSeed ?? null })
      const verified=await verifySubmissionAudio({request,user,route,uploadIntentId:value.uploadIntentId,configuration,env,fetchImpl})
      if(value.syncOffsetMs>=verified.duration*1000)throw fail('INVALID_PROJECT_REQUEST')
      body.p_duration=verified.duration
    }
  }
  let response
  try {
    response=await fetchImpl(`${configuration.url}/rest/v1/rpc/${rpc}`,{
      method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000),
      headers:{ Authorization:request.headers.get('authorization'),apikey:configuration.publishableKey,'Content-Type':'application/json',Accept:'application/json' },
      body:JSON.stringify(body)
    })
  } catch { throw fail('PROJECT_UNAVAILABLE') }
  const codes={ 400:'INVALID_PROJECT_REQUEST',401:'AUTH_REQUIRED',403:'PART_NOT_ASSIGNED',404:'PROJECT_NOT_FOUND',409:'PROJECT_CONFLICT' }
  if (!response.ok) {
    // Only known RPC error identifiers; never echo arbitrary upstream diagnostics.
    let detail
    try {detail=await response.json()} catch {}
    const specific={PROFILE_REQUIRED:403,PART_FIT_FAILED:403,PART_RANGE_UNAVAILABLE:409,ARRANGEMENT_NOT_FOUND:404}
    if (specific[detail?.message]===response.status) throw fail(detail.message)
    throw fail(codes[response.status] || 'PROJECT_UNAVAILABLE')
  }
  let result
  try { result=await response.json() } catch { throw fail('INVALID_PROJECT_RESPONSE') }
  if(route.operation==='mix') {
    const project=projectSnapshot(result?.project,route.projectId),mix=result?.mix
    if(mix===null){
      if(project.lifecycle!=='recruiting')throw fail('INVALID_PROJECT_RESPONSE')
      result={project,mix:null}
    }else{
      if(!uuid(mix?.jobId) || !['queued','processing','failed','succeeded'].includes(mix.status) ||
        project.submittedTrackCount!==project.partCount ||
        (mix.status==='succeeded'?project.lifecycle!=='completed':project.lifecycle!=='mixing' || mix.result!==null))throw fail('INVALID_PROJECT_RESPONSE')
      let available=null
      if(mix.status==='succeeded'){
        const saved=mix.result
        if(!uuid(saved?.objectId) || !/^[a-f0-9]{64}$/.test(saved.sha256 || '') || !Number.isFinite(saved.duration) || saved.duration<=0 ||
          typeof saved.completedAt!=='string' || !Number.isFinite(Date.parse(saved.completedAt)))throw fail('INVALID_PROJECT_RESPONSE')
        const executable=env.IEUM_AUDIO_DECODER_PATH,maxDurationSeconds=Number(env.IEUM_AUDIO_MAX_DECODE_SECONDS),maxBytes=Number(env.IEUM_MIX_MAX_BYTES)
        if(typeof executable!=='string' || !isAbsolute(executable) || !Number.isFinite(maxDurationSeconds) || maxDurationSeconds<=0 ||
          !Number.isSafeInteger(maxBytes) || maxBytes<=0)throw fail('AUDIO_DECODER_NOT_CONFIGURED')
        storage=createSupabaseAudioStorage({env,fetchImpl})
        const verified=await storage.verifyOriginalAudio(saved.objectId,{sha256:saved.sha256,maxBytes},{executable,maxDurationSeconds})
        if(Math.abs(verified.duration-saved.duration)>1/verified.sampleRate)throw fail('UPLOAD_OBJECT_MISMATCH')
        const access=await storage.createSignedRead(saved.objectId)
        available={size:verified.size,sha256:verified.sha256,contentType:verified.contentType,duration:saved.duration,completedAt:saved.completedAt,...access}
      }
      result={project,mix:{jobId:mix.jobId,status:mix.status,result:available}}
    }
  }else if(route.operation==='tracks') {
    const project=projectSnapshot(result?.project,route.projectId),tracks=result?.tracks
    if(!Array.isArray(tracks) || tracks.length!==project.submittedTrackCount || new Set(tracks.map(track=>track?.partId)).size!==tracks.length ||
      tracks.some(track=>track?.id!==`${route.projectId}:${track.partId}` || track.projectId!==route.projectId || !uuid(track.participantId) ||
        !uuid(track.objectId) || !Number.isSafeInteger(track.size) || track.size<=0 || typeof track.sha256!=='string' || !/^[a-f0-9]{64}$/.test(track.sha256) ||
        typeof track.contentType!=='string' || !track.contentType.startsWith('audio/') || !Number.isFinite(track.duration) || track.duration<=0 ||
        !Number.isFinite(track.syncOffsetMs) || track.syncOffsetMs<0 || track.syncOffsetMs>=track.duration*1000 ||
        typeof track.submittedAt!=='string' || !Number.isFinite(Date.parse(track.submittedAt)) ||
        !track.audioSourceRef || Object.keys(project.audioSourceRef).some(key=>track.audioSourceRef[key]!==project.audioSourceRef[key]) ||
        !project.parts.some(part=>part.id===track.partId && part.trackId===track.id && part.status==='submitted' && part.participantId===track.participantId)))
      throw fail('INVALID_PROJECT_RESPONSE')
    const available=[]
    if(tracks.length)storage=createSupabaseAudioStorage({env,fetchImpl})
    for(const track of tracks){
      await storage.verifyOriginal(track.objectId,{size:track.size,sha256:track.sha256,contentType:track.contentType})
      const access=await storage.createSignedRead(track.objectId)
      available.push({...Object.fromEntries(['id','projectId','partId','participantId','duration','syncOffsetMs','submittedAt','size','sha256','contentType'].map(key=>[key,track[key]])),
        audioSourceRef:project.audioSourceRef,...access,submitted:true,kind:'submitted-track'})
    }
    result={project,tracks:available}
  }else if (route.operation==='upload') {
    if (!uuid(result?.uploadIntentId) || !uuid(result?.objectId) || result.size!==body.p_size || result.sha256!==body.p_sha256 ||
      result.contentType!==body.p_content_type || typeof result.submissionVerified!=='boolean') throw fail('INVALID_PROJECT_RESPONSE')
    const expected={size:body.p_size,sha256:body.p_sha256,contentType:body.p_content_type}
    let verified
    try {verified=await storage.verifyOriginal(result.objectId,expected)}
    catch(error) {if(error?.code!=='UPLOAD_OBJECT_MISSING')throw error}
    if (verified) result={uploadIntentId:result.uploadIntentId,uploadStatus:'verified',verifiedFile:verified,
      submissionVerification:result.submissionVerified?'verified':'pending'}
    else {
      if(result.submissionVerified)throw fail('UPLOAD_OBJECT_MISSING')
      const signed=await storage.createSignedUpload(result.objectId)
      result={uploadIntentId:result.uploadIntentId,uploadStatus:'pending',signedUploadUrl:signed.signedUploadUrl,submissionVerification:'pending'}
    }
  } else if (route.operation==='submit') {
    if (result?.submissionStatus!=='success' || result.trackId!==`${route.projectId}:${route.partId}`) throw fail('INVALID_PROJECT_RESPONSE')
    const project=projectSnapshot(result.project,route.projectId)
    if (!project.parts.some(part=>part.id===route.partId && part.status==='submitted' && part.participantId===user.id)) throw fail('INVALID_PROJECT_RESPONSE')
    result={trackId:result.trackId,submissionStatus:'success',duration:body.p_duration,project}
  } else {
    result=projectSnapshot(result,route.operation==='create'?result?.id:route.projectId)
    if (route.operation==='start' && (!result.keyLockedAt || result.lifecycle!=='recruiting' ||
      !result.parts.some(part=>part.id===route.partId && part.status==='ready' && part.participantId===user.id))) throw fail('INVALID_PROJECT_RESPONSE')
    if (route.operation==='create' && (!uuid(result.id) || result.keyLockedAt!==null || result.lifecycle!=='recruiting' || result.submittedTrackCount!==0 ||
      result.parts.filter(part=>part.status==='ready').length!==1 || !result.parts.some(part=>part.id===requestedOwnerPart && part.participantId===user.id))) throw fail('INVALID_PROJECT_RESPONSE')
    if (route.operation==='join' && !result.parts.some(part=>part.id===route.partId && part.participantId===user.id && part.status!=='open')) throw fail('INVALID_PROJECT_RESPONSE')
  }
  return Response.json(result,{ headers:{ 'Cache-Control':'private, no-store',Vary:'Authorization' } })
}

export function projectLifecycleErrorResponse(error) {
  const statuses={ AUTH_REQUIRED:401,SERVICE_NOT_CONFIGURED:503,INVALID_SERVICE_CONFIGURATION:503,AUTH_UNAVAILABLE:503,
    INVALID_AUTH_RESPONSE:503,INVALID_PROJECT_REQUEST:400,PROJECT_PAYLOAD_TOO_LARGE:413,IDEMPOTENCY_KEY_REQUIRED:400,
    PROJECT_ROUTE_NOT_FOUND:404,PROJECT_NOT_FOUND:404,ARRANGEMENT_NOT_FOUND:404,PROFILE_REQUIRED:403,PART_FIT_FAILED:403,PART_RANGE_UNAVAILABLE:409,
    PART_NOT_ASSIGNED:403,PROJECT_CONFLICT:409,METHOD_NOT_ALLOWED:405,
    PROJECT_UNAVAILABLE:503,INVALID_PROJECT_RESPONSE:503,INVALID_UPLOAD_FILE:400,INVALID_UPLOAD_OBJECT:503,
    STORAGE_UNAVAILABLE:503,PRIVATE_STORAGE_REQUIRED:503,INVALID_STORAGE_RESPONSE:503,UPLOAD_OBJECT_MISSING:409,UPLOAD_OBJECT_MISMATCH:409,
    INVALID_AUDIO_RECEIPT:409,INVALID_AUDIO_RECEIPT_RESPONSE:503,INVALID_AUDIO_VERIFICATION:400,AUDIO_DECODER_NOT_CONFIGURED:503,
    AUDIO_DECODER_UNAVAILABLE:503,AUDIO_SOURCE_UNAVAILABLE:503,AUDIO_DECODE_TIMEOUT:503,AUDIO_DECODE_FAILED:409,
    AUDIO_FORMAT_UNSUPPORTED:409,AUDIO_FORMAT_MISMATCH:409,AUDIO_DURATION_EXCEEDED:409 }
  const code=Object.hasOwn(statuses,error?.code)?error.code:'PROJECT_UNAVAILABLE'
  return Response.json({ error:{ code } },{ status:statuses[code],headers:{ 'Cache-Control':'private, no-store',Vary:'Authorization' } })
}
