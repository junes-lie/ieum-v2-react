import {ServiceError} from '../src/projectService.js'
import {parsePublicCatalogPage,readPublicCatalogRpc} from './catalogRead.js'
const fail=code=>new ServiceError('프로젝트 정보를 불러오지 못했어요.',{code})
const text=value=>typeof value==='string' && Boolean(value.trim())
const range=value=>value && Number.isFinite(value.lowMidi) && Number.isFinite(value.highMidi) && value.lowMidi>=0 && value.highMidi<=127 && value.lowMidi<=value.highMidi
export async function projectDiscoveryRequest(request,options={}) {
  const {query,after,limit}=parsePublicCatalogPage(request,['songId']),songId=query.get('songId')
  if(songId!==null && (!text(songId) || songId.length>2048))throw fail('INVALID_CATALOG_REQUEST')
  const result=await readPublicCatalogRpc('ieum_list_discovery_projects',{p_song_id:songId,p_after_id:after,p_limit:limit},options)
  if(!Array.isArray(result?.items) || result.items.length>limit || new Set(result.items.map(item=>item?.id)).size!==result.items.length ||
    !(result.nextCursor===null || (result.items.length===limit && result.nextCursor===result.items.at(-1)?.id)))throw fail('INVALID_CATALOG_RESPONSE')
  const items=result.items.map(item=>{
    if(!text(item?.id) || !text(item.seed) || !text(item.songId) || (songId!==null && item.songId!==songId) || !text(item.key) || !text(item.arrangementId) ||
      ![2,3,4].includes(item.partCount) || !Array.isArray(item.parts) || item.parts.length!==item.partCount || new Set(item.parts.map(part=>part?.id)).size!==item.partCount ||
      !Number.isInteger(item.revision) || item.revision<0 || !Number.isInteger(item.submittedTrackCount) || item.submittedTrackCount<0 || item.submittedTrackCount>item.partCount ||
      !['recruiting','mixing','completed'].includes(item.lifecycle) || (item.lifecycle!=='recruiting' && item.submittedTrackCount!==item.partCount) ||
      !text(item.createdAt) || !Number.isFinite(Date.parse(item.createdAt)) || !(item.keyLockedAt===null || (text(item.keyLockedAt) && Number.isFinite(Date.parse(item.keyLockedAt)))) ||
      item.parts.some(part=>!text(part?.id) || !['open','ready','submitted'].includes(part.status) || !range(part.requiredRange) ||
        (part.requiredRange.tessitura!==undefined && !range(part.requiredRange.tessitura))) ||
      item.parts.filter(part=>part.status==='submitted').length!==item.submittedTrackCount)throw fail('INVALID_CATALOG_RESPONSE')
    const pickRange=value=>({lowMidi:value.lowMidi,highMidi:value.highMidi})
    return {id:item.id,seed:item.seed,songId:item.songId,key:item.key,arrangementId:item.arrangementId,partCount:item.partCount,
      revision:item.revision,lifecycle:item.lifecycle,submittedTrackCount:item.submittedTrackCount,keyLockedAt:item.keyLockedAt,createdAt:item.createdAt,
      parts:item.parts.map(part=>({id:part.id,status:part.status,requiredRange:{...pickRange(part.requiredRange),
        ...(part.requiredRange.tessitura?{tessitura:pickRange(part.requiredRange.tessitura)}:{})}}))}
  })
  return Response.json({items,nextCursor:result.nextCursor},{headers:{'Cache-Control':'public, max-age=0, must-revalidate'}})
}
