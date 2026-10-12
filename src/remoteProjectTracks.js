import {ServiceError} from './projectService.js'

const fail=code=>new ServiceError('제출된 원본 Track을 불러오지 못했어요. 기존 녹음은 유지됩니다.',{code})

async function downloadAudio(file,fetchImpl,assertCurrent) {
  assertCurrent()
  let response
  try{response=await fetchImpl(file.audioUrl,{credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(60000)})}
  catch{assertCurrent();throw fail('TRACK_DOWNLOAD_FAILED')}
  assertCurrent()
  const mime=response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
  if(!response.ok || mime!==file.contentType || !response.body){await response.body?.cancel().catch(()=>{});throw fail('TRACK_DOWNLOAD_FAILED')}
  const reader=response.body.getReader(),chunks=[];let size=0
  try{
    while(true){const {value,done}=await reader.read();assertCurrent();if(done)break;size+=value.byteLength;
      if(size>file.size)throw fail('TRACK_SOURCE_MISMATCH');chunks.push(value)}
  }catch(error){await reader.cancel().catch(()=>{});throw error}finally{reader.releaseLock()}
  if(size!==file.size)throw fail('TRACK_SOURCE_MISMATCH')
  const blob=new Blob(chunks,{type:mime})
  const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(value=>value.toString(16).padStart(2,'0')).join('')
  assertCurrent()
  if(sha!==file.sha256)throw fail('TRACK_SOURCE_MISMATCH')
  return blob
}

// Existing audio/Mix engines consume Blobs. Download into this session only;
// never replace the local IndexedDB originals or copy demo recordings remotely.
export async function loadRemoteProjectTracks({session,projectId,storageOrigin,maxTotalBytes,fetchImpl=globalThis.fetch}) {
  let origin
  try{origin=new URL(storageOrigin)}catch{throw fail('INVALID_STORAGE_ORIGIN')}
  if(origin.protocol!=='https:' || origin.pathname!=='/' || origin.username || origin.password || origin.search || origin.hash ||
    typeof projectId!=='string' || !projectId.trim() || typeof session?.run!=='function')throw fail('INVALID_STORAGE_ORIGIN')
  if(!Number.isSafeInteger(maxTotalBytes) || maxTotalBytes<=0)throw fail('TRACK_MEMORY_BUDGET_REQUIRED')
  return session.run(async({service,assertCurrent})=>{
    const manifest=await service.loadProjectTracks(projectId),project=manifest?.project
    const source=project?.audioSourceRef
    if(project?.id!==projectId || ![2,3,4].includes(project.partCount) || !Array.isArray(project.parts) || project.parts.length!==project.partCount ||
      new Set(project.parts.map(part=>part?.id)).size!==project.partCount ||
      !source || Array.isArray(source) || typeof source!=='object' || source.songId!==project.songId || source.key!==project.key ||
      typeof source.revision!=='string' || !source.revision.trim() || !Number.isFinite(source.duration) || source.duration<=0 ||
      !/^[a-f0-9]{64}$/.test(source.sourceSha256 || '') || !/^[a-f0-9]{64}$/.test(source.backingSha256 || '') ||
      !Number.isInteger(project.submittedTrackCount) || project.submittedTrackCount<0 || project.submittedTrackCount>project.partCount ||
      !Array.isArray(manifest.tracks) || manifest.tracks.length!==project.submittedTrackCount ||
      new Set(manifest.tracks.map(track=>track?.partId)).size!==manifest.tracks.length)throw fail('INVALID_TRACK_MANIFEST')
    let total=0
    for(const track of manifest.tracks){
      if(!Number.isSafeInteger(track?.size) || track.size<=0)throw fail('INVALID_TRACK_MANIFEST')
      total+=track.size
      if(!Number.isSafeInteger(total) || total>maxTotalBytes)throw fail('TRACK_MEMORY_BUDGET_EXCEEDED')
    }
    const tracks={}
    for(const track of manifest.tracks){
      let url
      try{url=new URL(track.audioUrl)}catch{throw fail('INVALID_TRACK_MANIFEST')}
      if(track.id!==`${projectId}:${track.partId}` || track.projectId!==projectId || track.submitted!==true || track.kind!=='submitted-track' ||
        !Number.isSafeInteger(track.size) || track.size<=0 || typeof track.sha256!=='string' || !/^[a-f0-9]{64}$/.test(track.sha256) ||
        typeof track.contentType!=='string' || !track.contentType.startsWith('audio/') || !Number.isFinite(track.duration) || track.duration<=0 ||
        !Number.isFinite(track.syncOffsetMs) || track.syncOffsetMs<0 || track.syncOffsetMs>=track.duration*1000 ||
        !track.audioSourceRef || !project.audioSourceRef || Object.keys(project.audioSourceRef).some(key=>track.audioSourceRef[key]!==project.audioSourceRef[key]) ||
        !project.parts.some(part=>part.id===track.partId && part.status==='submitted' && part.trackId===track.id && part.participantId===track.participantId) ||
        url.origin!==origin.origin || url.username || url.password || url.hash ||
        !/^\/storage\/v1\/object\/sign\/[a-zA-Z0-9_-]+\/originals\/[a-f0-9-]{36}$/.test(url.pathname) ||
        url.searchParams.getAll('token').length!==1 || !url.searchParams.get('token'))throw fail('INVALID_TRACK_MANIFEST')
      const blob=await downloadAudio({...track,audioUrl:url.href},fetchImpl,assertCurrent)
      const metadata=Object.fromEntries(['id','projectId','partId','participantId','duration','syncOffsetMs','submittedAt','size','sha256','contentType','audioSourceRef','submitted','kind'].map(key=>[key,track[key]]))
      tracks[track.partId]={...metadata,blob}
    }
    return {project,tracks}
  })
}

export async function loadRemoteProjectMix({session,projectId,storageOrigin,maxTotalBytes,fetchImpl=globalThis.fetch}) {
  let origin
  try{origin=new URL(storageOrigin)}catch{throw fail('INVALID_STORAGE_ORIGIN')}
  if(origin.protocol!=='https:' || origin.pathname!=='/' || origin.username || origin.password || origin.search || origin.hash ||
    typeof projectId!=='string' || !projectId.trim() || typeof session?.run!=='function')throw fail('INVALID_STORAGE_ORIGIN')
  if(!Number.isSafeInteger(maxTotalBytes) || maxTotalBytes<=0)throw fail('TRACK_MEMORY_BUDGET_REQUIRED')
  return session.run(async({service,assertCurrent})=>{
    const manifest=await service.getProjectMix(projectId),{project,mix}=manifest || {}
    if(project?.id!==projectId || ![2,3,4].includes(project.partCount) || !Array.isArray(project.parts) || project.parts.length!==project.partCount ||
      new Set(project.parts.map(part=>part?.id)).size!==project.partCount ||
      !project.audioSourceRef || project.audioSourceRef.songId!==project.songId || project.audioSourceRef.key!==project.key ||
      typeof project.audioSourceRef.revision!=='string' || !project.audioSourceRef.revision.trim() ||
      !/^[a-f0-9]{64}$/.test(project.audioSourceRef.sourceSha256 || '') || !/^[a-f0-9]{64}$/.test(project.audioSourceRef.backingSha256 || '') ||
      !Number.isInteger(project.submittedTrackCount) || project.submittedTrackCount<0 || project.submittedTrackCount>project.partCount)
      throw fail('INVALID_MIX_MANIFEST')
    if(mix===null){if(project.lifecycle!=='recruiting')throw fail('INVALID_MIX_MANIFEST');return {project,mix:null}}
    if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(mix?.jobId || '') ||
      !['queued','processing','failed','succeeded'].includes(mix.status) || project.submittedTrackCount!==project.partCount ||
      project.parts.some(part=>part.status!=='submitted' || part.trackId!==`${projectId}:${part.id}`))throw fail('INVALID_MIX_MANIFEST')
    if(mix.status!=='succeeded'){
      if(project.lifecycle!=='mixing' || mix.result!==null)throw fail('INVALID_MIX_MANIFEST')
      return {project,mix:{jobId:mix.jobId,status:mix.status,result:null}}
    }
    const file=mix.result;let url
    try{url=new URL(file?.audioUrl)}catch{throw fail('INVALID_MIX_MANIFEST')}
    if(project.lifecycle!=='completed' || !Number.isSafeInteger(file.size) || file.size<=0 ||
      !/^[a-f0-9]{64}$/.test(file.sha256 || '') || !['audio/wav','audio/x-wav','audio/webm','audio/mp4'].includes(file.contentType) ||
      !Number.isFinite(file.duration) || file.duration<=0 || typeof file.completedAt!=='string' || !Number.isFinite(Date.parse(file.completedAt)) ||
      url.origin!==origin.origin || url.username || url.password || url.hash ||
      !/^\/storage\/v1\/object\/sign\/[a-zA-Z0-9_-]+\/originals\/[a-f0-9-]{36}$/.test(url.pathname) ||
      url.searchParams.getAll('token').length!==1 || !url.searchParams.get('token'))throw fail('INVALID_MIX_MANIFEST')
    if(file.size>maxTotalBytes)throw fail('TRACK_MEMORY_BUDGET_EXCEEDED')
    const blob=await downloadAudio(file,fetchImpl,assertCurrent)
    const metadata=Object.fromEntries(['size','sha256','contentType','duration','completedAt'].map(key=>[key,file[key]]))
    return {project,mix:{jobId:mix.jobId,status:mix.status,result:{...metadata,blob}}}
  })
}
