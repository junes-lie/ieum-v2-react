import {fork} from 'node:child_process'
import {readFile} from 'node:fs/promises'
import {isAbsolute,join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
import {ServiceError} from '../src/projectService.js'
import {exactDecodedAudioReceipt} from './originalAudioVerification.js'

const fail=code=>new ServiceError('Mix를 생성하지 못했어요. 제출 원본은 유지됩니다.',{code})
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const validHash=value=>typeof value==='string' && /^[a-f0-9]{64}$/.test(value)
const referenceKeys=['songId','key','revision','duration','sourceSha256','backingSha256']
const equalReference=(left,right)=>left && referenceKeys.every(key=>left[key]===right[key])

// Internal renderer only. Inputs/receipts must come from the trusted job/Storage
// boundary. This does not authenticate, submit, persist or mark a job successful.
// Native allocations are not capped by V8: PCM limits are admission checks, not
// an OS RSS guarantee. The host still needs its own resource limit.
export async function validateMixRuntime(options={}) {
  const {runtimeRoot,maxInputBytes,maxPcmBytes,maxOutputBytes,maxDurationSeconds,timeoutMs}=options
  if(!isAbsolute(runtimeRoot || '') || [maxInputBytes,maxPcmBytes,maxOutputBytes,timeoutMs].some(n=>!Number.isSafeInteger(n)||n<=0) ||
    !Number.isFinite(maxDurationSeconds) || maxDurationSeconds<=0 || timeoutMs>600000)throw fail('MIX_RUNTIME_NOT_CONFIGURED')
  let metadata
  try{metadata=JSON.parse(await readFile(join(runtimeRoot,'node_modules/node-web-audio-api/package.json'),'utf8'))}
  catch{throw fail('MIX_RUNTIME_UNAVAILABLE')}
  if(metadata.name!=='node-web-audio-api' || metadata.version!=='2.2.0')throw fail('MIX_RUNTIME_VERSION_MISMATCH')
}
export async function renderProjectMix(input,options={}) {
  await validateMixRuntime(options)
  const {runtimeRoot,maxInputBytes,maxPcmBytes,maxOutputBytes,maxDurationSeconds,timeoutMs}=options
  const project=structuredClone(input?.project),tracks=input?.tracks,backing=input?.backing
  const source=project?.audioSourceRef,partIds=project?.partIds
  if(typeof project?.id!=='string' || !project.id || typeof project.seed!=='string' || !project.seed ||
    !Array.isArray(partIds) || ![2,3,4].includes(partIds.length) || new Set(partIds).size!==partIds.length ||
    partIds.some(id=>typeof id!=='string'||!id) || !Array.isArray(tracks) || tracks.length!==partIds.length ||
    !source || ['songId','key','revision'].some(key=>typeof source[key]!=='string'||!source[key]) || !validHash(source.sourceSha256) || !validHash(source.backingSha256) ||
    !Number.isFinite(source.duration) || source.duration<=0 || source.duration>maxDurationSeconds)throw fail('INVALID_MIX_INPUT')
  const ordered=partIds.map(partId=>tracks.find(track=>track.partId===partId))
  if(new Set(tracks.map(track=>track.partId)).size!==partIds.length || ordered.some(track=>!track ||
    track.id!==`${project.id}:${track.partId}` || track.projectId!==project.id || track.kind!=='submitted-track' || track.submitted!==true ||
    !equalReference(track.audioSourceRef,source) || !Number.isFinite(track.syncOffsetMs) || track.syncOffsetMs<0))throw fail('INVALID_MIX_INPUT')
  // Snapshot references/receipts before awaits; never send owner IDs or secrets
  // to the isolated worker and never mutate the caller's Blob/Track objects.
  const entries=[...ordered.map(track=>({partId:track.partId,blob:track.blob,receipt:structuredClone(track.receipt),syncOffsetMs:track.syncOffsetMs})),
    {blob:backing?.blob,receipt:structuredClone(backing?.receipt)}]
  let inputBytes=0,pcmBytes=0,duration=source.duration
  for(const entry of entries){
    if(!(entry.blob instanceof Blob) || !entry.blob.size)throw fail('INVALID_MIX_INPUT')
    try{entry.receipt=exactDecodedAudioReceipt(entry.receipt,{size:entry.blob.size,sha256:entry.receipt?.sha256,contentType:entry.blob.type})}
    catch{throw fail('INVALID_MIX_RECEIPT')}
    if(!validHash(entry.receipt.sha256) || entry.receipt.duration>maxDurationSeconds ||
      (entry.syncOffsetMs!==undefined && entry.syncOffsetMs>=entry.receipt.duration*1000))throw fail('INVALID_MIX_INPUT')
    inputBytes+=entry.blob.size
    pcmBytes+=Math.ceil(entry.receipt.duration*44100)*2*4
    if(entry.partId)duration=Math.max(duration,entry.receipt.duration+.2)
  }
  if(entries.at(-1).receipt.sha256!==source.backingSha256)throw fail('MIX_SOURCE_MISMATCH')
  duration=Math.max(duration,entries.at(-1).receipt.duration)
  const frames=Math.ceil(duration*44100),outputBytes=44+frames*4
  if(inputBytes>maxInputBytes || pcmBytes+frames*2*4>maxPcmBytes || outputBytes>maxOutputBytes || duration>maxDurationSeconds)throw fail('MIX_MEMORY_BUDGET_EXCEEDED')
  for(const entry of entries){
    entry.bytes=await entry.blob.arrayBuffer()
    if(hash(Buffer.from(entry.bytes))!==entry.receipt.sha256)throw fail('MIX_SOURCE_MISMATCH')
    delete entry.blob
  }
  const data={runtimeUrl:pathToFileURL(join(runtimeRoot,'node_modules/node-web-audio-api/index.js')).href,entries,duration,maxPcmBytes,maxOutputBytes,maxDurationSeconds}
  const result=await new Promise((resolve,reject)=>{
    // A native crash must not terminate the API/job parent process. Use a
    // separate process rather than worker_threads for this native runtime.
    const worker=fork(new URL('./mixRenderWorker.mjs',import.meta.url),[],{serialization:'advanced',windowsHide:true,
      execArgv:['--max-old-space-size=128'],env:process.env.SystemRoot?{SystemRoot:process.env.SystemRoot}:{},stdio:['ignore','ignore','ignore','ipc']})
    let finished=false
    const finish=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);worker.kill();error?reject(error):resolve(value)}
    const timer=setTimeout(()=>finish(fail('MIX_RENDER_TIMEOUT')),timeoutMs)
    worker.once('error',()=>finish(fail('MIX_RENDER_FAILED')))
    worker.once('exit',()=>{if(!finished)finish(fail('MIX_RENDER_FAILED'))})
    worker.once('message',message=>{
      if(message?.error)return finish(fail(['MIX_MEMORY_BUDGET_EXCEEDED','MIX_DECODE_MISMATCH'].includes(message.error)?message.error:'MIX_RENDER_FAILED'))
      if(!(message?.bytes instanceof ArrayBuffer) || message.bytes.byteLength!==outputBytes || message.duration!==frames/44100)return finish(fail('INVALID_MIX_RESULT'))
      finish(null,message)
    })
    worker.send(data,error=>{if(error)finish(fail('MIX_RENDER_FAILED'))})
  })
  return {blob:new Blob([result.bytes],{type:'audio/wav'}),duration:result.duration,sha256:hash(Buffer.from(result.bytes)),processing:result.processing,origin:result.origin}
}
