import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { open } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import { ServiceError } from '../src/projectService.js'

const error = (code,status=409) => new ServiceError('녹음 파일의 실제 오디오를 확인하지 못했어요. 원본은 유지됩니다.',{code,status})

async function decoderIdentity(executable) {
  const hash=createHash('sha256')
  try {for await(const chunk of createReadStream(executable))hash.update(chunk)}
  catch {throw error('AUDIO_DECODER_UNAVAILABLE',503)}
  const decoderSha256=hash.digest('hex')
  const decoderVersion=await new Promise((resolve,reject)=>{
    const child=spawn(executable,['-version'],{shell:false,windowsHide:true,stdio:['ignore','pipe','ignore']})
    let firstLine='',failure
    const timer=setTimeout(()=>{failure=error('AUDIO_DECODE_TIMEOUT',503);child.kill()},5000)
    child.on('error',()=>{failure=error('AUDIO_DECODER_UNAVAILABLE',503)})
    child.stdout.on('data',chunk=>{if(!firstLine.includes('\n') && firstLine.length<1024)firstLine+=chunk.toString().slice(0,1024-firstLine.length)})
    child.on('close',code=>{
      clearTimeout(timer)
      const value=firstLine.split(/\r?\n/)[0]
      if(failure)return reject(failure)
      if(code!==0 || !/^ffmpeg version [^\x00-\x1f]+$/.test(value))return reject(error('AUDIO_DECODER_UNAVAILABLE',503))
      resolve(value)
    })
  })
  return {decoderVersion,decoderSha256}
}

function webmHeader(bytes) {
  if(!bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])))return false
  const vint=(offset,isId=false)=>{
    const first=bytes[offset];if(!first)return null
    let length=1,mask=0x80
    while(!(first&mask)){mask>>=1;length++}
    if(length>(isId?4:8) || offset+length>bytes.length)return null
    let value=isId?first:first&(mask-1)
    for(let i=1;i<length;i++)value=value*256+bytes[offset+i]
    return Number.isSafeInteger(value)?{value,length}:null
  }
  const size=vint(4);if(!size)return false
  let offset=4+size.length,end=offset+size.value
  if(end>bytes.length)return false
  while(offset<end){
    const id=vint(offset,true);if(!id)return false
    offset+=id.length
    const length=vint(offset);if(!length)return false
    offset+=length.length
    if(offset+length.value>end)return false
    if(id.value===0x4282)return bytes.toString('ascii',offset,offset+length.value)==='webm'
    offset+=length.value
  }
  return false
}

// Server worker only. Both paths are trusted server configuration/staging paths,
// never URLs or executable arguments supplied by a client. PCM is counted and
// discarded by default. A trusted synchronous consumer may use an explicitly
// bounded buffer for analysis; the decoder itself never accumulates PCM.
export async function decodeOriginalAudio(filePath,{ executable,contentType,maxDurationSeconds,timeoutMs=60000,onPcmChunk }={}) {
  if (!isAbsolute(executable || '')) throw error('AUDIO_DECODER_NOT_CONFIGURED',503)
  if (!isAbsolute(filePath || '') || !Number.isFinite(maxDurationSeconds) || maxDurationSeconds<=0 ||
      !Number.isInteger(timeoutMs) || timeoutMs<=0 ||
      (onPcmChunk!==undefined && typeof onPcmChunk!=='function')) throw error('INVALID_AUDIO_VERIFICATION',400)
  const mime=typeof contentType==='string'?contentType.split(';')[0].trim().toLowerCase():''
  const formats={'audio/webm':'matroska','audio/mp4':'mov','audio/wav':'wav','audio/x-wav':'wav'}
  if (!Object.hasOwn(formats,mime)) throw error('AUDIO_FORMAT_UNSUPPORTED')
  let handle,header
  try {
    handle=await open(filePath,'r')
    const buffer=Buffer.alloc(4096)
    const {bytesRead}=await handle.read(buffer,0,buffer.length,0)
    header=buffer.subarray(0,bytesRead)
  } catch {throw error('AUDIO_SOURCE_UNAVAILABLE',503)}
  finally {await handle?.close()}
  const validHeader=mime==='audio/webm'
    ? webmHeader(header)
    : mime==='audio/mp4'
      ? header.length>=12 && header.toString('ascii',4,8)==='ftyp'
      : header.length>=12 && header.toString('ascii',0,4)==='RIFF' && header.toString('ascii',8,12)==='WAVE'
  if (!validHeader) throw error('AUDIO_FORMAT_MISMATCH')
  const identity=await decoderIdentity(executable)
  const sampleRate=48000,bytesPerFrame=2
  return new Promise((resolve,reject)=>{
    let failure,pcmBytes=0
    const args=['-nostdin','-hide_banner','-loglevel','error','-xerror','-threads','1','-filter_threads','1',
      '-protocol_whitelist','file,pipe','-f',formats[mime],
      ...(mime==='audio/mp4'?['-enable_drefs','0']:[]),
      '-i',filePath,'-map','0:a:0','-vn','-sn','-dn','-threads','1',
      '-ac','1','-ar',String(sampleRate),'-c:a','pcm_s16le','-f','s16le','pipe:1']
    const child=spawn(executable,args,{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']})
    const stop=reason=>{failure ||= reason;child.kill()}
    const timer=setTimeout(()=>stop(error('AUDIO_DECODE_TIMEOUT',503)),timeoutMs)
    child.on('error',()=>{failure ||= error('AUDIO_DECODER_UNAVAILABLE',503)})
    // Never expose decoder diagnostics: they can include private local paths.
    child.stderr.resume()
    child.stdout.on('data',chunk=>{
      if(failure)return
      pcmBytes+=chunk.length
      if (pcmBytes>maxDurationSeconds*sampleRate*bytesPerFrame) {stop(error('AUDIO_DURATION_EXCEEDED'));return}
      if(onPcmChunk){try{onPcmChunk(chunk)}catch{stop(error('AUDIO_ANALYSIS_FAILED'))}}
    })
    child.on('close',code=>{
      clearTimeout(timer)
      if (failure) return reject(failure)
      if (code!==0 || pcmBytes===0 || pcmBytes%bytesPerFrame!==0) return reject(error('AUDIO_DECODE_FAILED'))
      resolve({duration:pcmBytes/(sampleRate*bytesPerFrame),decodedFrames:pcmBytes/bytesPerFrame,
        sampleRate,contentType:mime,analysisVersion:'decoded-pcm-v1',...identity})
    })
  })
}
