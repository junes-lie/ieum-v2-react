import {ServiceError} from '../src/projectService.js'
import {readAuthConfiguration} from './auth.js'
const fail=code=>new ServiceError('곡 정보를 불러오지 못했어요.',{code})
const text=value=>typeof value==='string' && Boolean(value.trim())
const range=value=>value && Number.isFinite(value.lowMidi) && Number.isFinite(value.highMidi) && value.lowMidi>=0 && value.highMidi<=127 && value.lowMidi<=value.highMidi
export function parsePublicCatalogPage(request,extraKeys=[]) {
  if(request.method!=='GET')throw fail('METHOD_NOT_ALLOWED')
  const query=new URL(request.url).searchParams
  const keys=['after','limit',...extraKeys]
  if([...query.keys()].some(key=>!keys.includes(key)) || keys.some(key=>query.getAll(key).length>1))throw fail('INVALID_CATALOG_REQUEST')
  const after=query.get('after'),limitText=query.get('limit'),limit=limitText===null?20:Number(limitText)
  if((after!==null && (!text(after) || after.length>2048)) || (limitText!==null && !/^[1-9][0-9]*$/.test(limitText)) || !Number.isInteger(limit) || limit<1 || limit>50)throw fail('INVALID_CATALOG_REQUEST')
  return {query,after,limit}
}
export async function readPublicCatalogRpc(name,body,{env=process.env,fetchImpl=globalThis.fetch}={}) {
  if(!['ieum_list_catalog_arrangements','ieum_list_discovery_projects'].includes(name))throw fail('INVALID_CATALOG_REQUEST')
  if(env.IEUM_DB_PROVIDER!=='supabase')throw fail('SERVICE_NOT_CONFIGURED')
  const configuration=readAuthConfiguration(env)
  let response
  try{response=await fetchImpl(`${configuration.url}/rest/v1/rpc/${name}`,{
    method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000),
    headers:{apikey:configuration.publishableKey,'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(body)})}catch{throw fail('CATALOG_UNAVAILABLE')}
  if(!response.ok)throw fail('CATALOG_UNAVAILABLE')
  let result
  try{result=await response.json()}catch{throw fail('INVALID_CATALOG_RESPONSE')}
  return result
}
export async function catalogReadRequest(request,options={}) {
  const {after,limit}=parsePublicCatalogPage(request)
  const result=await readPublicCatalogRpc('ieum_list_catalog_arrangements',{p_after_id:after,p_limit:limit},options)
  if(!Array.isArray(result?.items) || result.items.length>limit || !(result.nextCursor===null ||
    (result.items.length===limit && result.nextCursor===result.items.at(-1)?.id)) || new Set(result.items.map(item=>item?.id)).size!==result.items.length)throw fail('INVALID_CATALOG_RESPONSE')
  const items=result.items.map(item=>{
    const source=item?.audioSourceRef,parts=item?.parts
    if(!text(item?.id) || !text(item.songId) || !text(item.key) || source?.songId!==item.songId || source.key!==item.key ||
      !text(source.revision) || !Number.isFinite(source.duration) || source.duration<=0 || !/^[a-f0-9]{64}$/.test(source.sourceSha256 || '') ||
      !/^[a-f0-9]{64}$/.test(source.backingSha256 || '') || !Array.isArray(parts) || ![2,3,4].includes(parts.length) ||
      new Set(parts.map(part=>part?.id)).size!==parts.length || parts.some(part=>!text(part?.id) || !range(part.requiredRange) ||
        (part.requiredRange.tessitura!==undefined && !range(part.requiredRange.tessitura))))throw fail('INVALID_CATALOG_RESPONSE')
    const pickRange=value=>({lowMidi:value.lowMidi,highMidi:value.highMidi})
    return {id:item.id,songId:item.songId,key:item.key,
      audioSourceRef:Object.fromEntries(['songId','key','revision','duration','sourceSha256','backingSha256'].map(key=>[key,source[key]])),
      parts:parts.map(part=>({id:part.id,requiredRange:{...pickRange(part.requiredRange),...(part.requiredRange.tessitura?{tessitura:pickRange(part.requiredRange.tessitura)}:{})}}))}
  })
  return Response.json({items,nextCursor:result.nextCursor},{headers:{'Cache-Control':'public, max-age=0, must-revalidate'}})
}
export function catalogReadErrorResponse(error) {
  const statuses={INVALID_CATALOG_REQUEST:400,METHOD_NOT_ALLOWED:405,SERVICE_NOT_CONFIGURED:503,INVALID_SERVICE_CONFIGURATION:503,CATALOG_UNAVAILABLE:503,INVALID_CATALOG_RESPONSE:503}
  const code=Object.hasOwn(statuses,error?.code)?error.code:'CATALOG_UNAVAILABLE'
  return Response.json({error:{code}},{status:statuses[code],headers:{'Cache-Control':'no-store'}})
}
