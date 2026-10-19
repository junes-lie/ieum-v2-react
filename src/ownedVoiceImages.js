import {ServiceError} from './projectService.js'
const fail=code=>new ServiceError('저장된 이미지를 확인하지 못했어요. 원본은 유지됩니다.',{code})
const text=value=>typeof value==='string' && value.trim() && value.length<=128 && !/[\x00-\x1f]/.test(value)
export async function requestOwnedVoiceImageChunk({baseUrl,getAccessToken,fetchImpl,selector,offset,length}){
  const selected=structuredClone(selector),track=selected?.kind==='track-image'
  if(!['personal-image','track-image'].includes(selected?.kind) ||
    ![selected.id,selected.revision,...(track?[selected.projectId,selected.partId]:[])].every(text) ||
    !Number.isSafeInteger(offset) || offset<0 || offset>8388607 || !Number.isSafeInteger(length) || length<1 || length>262144)throw fail('INVALID_VOICE_IMAGE')
  const query=new URLSearchParams({kind:selected.kind,id:selected.id,revision:selected.revision,offset:String(offset),length:String(length),
    ...(track?{projectId:selected.projectId,partId:selected.partId}:{})})
  const token=await getAccessToken?.()
  if(!token)throw fail('AUTH_REQUIRED')
  let response
  try{response=await fetchImpl(new URL(`me/voice-identity?${query}`,baseUrl).href,{method:'GET',headers:{Accept:'application/octet-stream',Authorization:`Bearer ${token}`},
    signal:AbortSignal.timeout(10000),credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'})}
  catch{throw fail('NETWORK_ERROR')}
  const range=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get('Content-Range') || ''),sha256=response.headers.get('X-Content-SHA256')
  if(response.status!==206 || !range || Number(range[1])!==offset || Number(range[3])<33 || Number(range[3])>8388608 || offset>=Number(range[3]) ||
    Number(range[2])!==Math.min(offset+length,Number(range[3]))-1 || !/^[a-f0-9]{64}$/.test(sha256 || '') ||
    response.headers.get('Content-Type')!=='application/octet-stream' || !response.body ||
    response.headers.get('Content-Length')!==String(Number(range[2])-offset+1)){
    await response.body?.cancel().catch(()=>{})
    throw fail('INVALID_VOICE_IMAGE_RESPONSE')
  }
  const expected=Number(range[2])-offset+1,bytes=new Uint8Array(expected),reader=response.body.getReader()
  let written=0
  try{
    for(;;){const {value,done}=await reader.read();if(done)break
      if(written+value.byteLength>expected)throw fail('INVALID_VOICE_IMAGE_RESPONSE')
      bytes.set(value,written);written+=value.byteLength
    }
    if(written!==expected)throw fail('INVALID_VOICE_IMAGE_RESPONSE')
  }catch{await reader.cancel().catch(()=>{});throw fail('INVALID_VOICE_IMAGE_RESPONSE')}
  finally{reader.releaseLock()}
  return {bytes,total:Number(range[3]),sha256,offset}
}

// Explicit owned image read only; no URL/cache/selection/Profile/Track write.
export async function loadRemoteOwnedVoiceImage({session,kind,ref,projectId,partId,maxBytes}){
  const reference=structuredClone(ref),selector={kind,id:reference?.id,revision:reference?.revision,...(kind==='track-image'?{projectId,partId}:{})}
  if(typeof session?.run!=='function' || !['personal-image','track-image'].includes(kind) ||
    ![selector.id,selector.revision,...(kind==='track-image'?[projectId,partId]:[])].every(text) || !/^[a-f0-9]{64}$/.test(reference?.outputSha256 || '') ||
    !Number.isSafeInteger(maxBytes) || maxBytes<33 || maxBytes>8388608)throw fail('INVALID_VOICE_IMAGE')
  return session.run(async({service,assertCurrent})=>{
    const chunks=[];let offset=0,total=null
    do{
      const chunk=await service.getVoiceImageChunk(selector,offset,Math.min(262144,maxBytes-offset))
      assertCurrent()
      if(!(chunk.bytes instanceof Uint8Array) || !chunk.bytes.length || !Number.isSafeInteger(chunk.total) || chunk.total<33 ||
        chunk.bytes.length!==Math.min(262144,maxBytes-offset,chunk.total-offset) ||
        chunk.sha256!==reference.outputSha256 || chunk.offset!==offset || chunk.total>maxBytes ||
        (total!==null && total!==chunk.total))throw fail('INVALID_VOICE_IMAGE_RESPONSE')
      total=chunk.total;chunks.push(chunk.bytes);offset+=chunk.bytes.length
    }while(offset<total)
    const blob=new Blob(chunks,{type:'image/png'})
    const sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(byte=>byte.toString(16).padStart(2,'0')).join('')
    assertCurrent()
    const header=new DataView(await blob.slice(0,24).arrayBuffer())
    if(sha256!==reference.outputSha256 || header.getBigUint64(0)!==0x89504e470d0a1a0an || header.getUint32(16)!==512 || header.getUint32(20)!==512)throw fail('INVALID_VOICE_IMAGE_RESPONSE')
    return {ref:reference,blob}
  })
}
