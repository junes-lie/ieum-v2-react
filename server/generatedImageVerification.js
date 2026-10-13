import {spawn} from 'node:child_process'
import {mkdtemp,writeFile,unlink,rmdir} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join,isAbsolute,resolve,sep} from 'node:path'
import {createHash} from 'node:crypto'
import {ServiceError} from '../src/projectService.js'
import {decoderIdentity} from './audioDecoder.js'
const fail=code=>new ServiceError('생성 이미지의 실제 데이터를 확인하지 못했어요. 기존 원본은 유지됩니다.',{code})
// Verify the first static PNG frame with the existing configured decoder.
// No resize, image generation, model import, URL or accumulated pixel buffer.
export async function verifyGeneratedPng(blob,{executable,timeoutMs=5000}={}){
  if(!isAbsolute(executable || ''))throw fail('IMAGE_DECODER_NOT_CONFIGURED')
  if(!(blob instanceof Blob) || blob.type!=='image/png' || blob.size<33 || blob.size>8388608 ||
    !Number.isSafeInteger(timeoutMs) || timeoutMs<=0 || timeoutMs>60000)throw fail('INVALID_GENERATED_IMAGE')
  const bytes=Buffer.from(await blob.arrayBuffer()),header=bytes.subarray(0,24)
  if(header.subarray(0,8).toString('hex')!=='89504e470d0a1a0a' || header.readUInt32BE(8)!==13 ||
    header.toString('ascii',12,16)!=='IHDR' || header.readUInt32BE(16)!==512 || header.readUInt32BE(20)!==512)throw fail('INVALID_GENERATED_IMAGE')
  let identity
  try{identity=await decoderIdentity(executable)}catch{throw fail('IMAGE_DECODER_UNAVAILABLE')}
  const directory=await mkdtemp(join(tmpdir(),'ieum-png-verification-')),file=join(directory,'received.png')
  try{
    await writeFile(file,bytes,{flag:'wx',mode:0o600})
    const decodedBytes=await new Promise((resolveResult,reject)=>{
      const child=spawn(executable,['-nostdin','-hide_banner','-loglevel','error','-xerror','-err_detect','explode','-threads','1','-filter_threads','1',
        '-protocol_whitelist','file,pipe','-f','png_pipe','-i',file,'-map','0:v:0','-an','-sn','-dn','-threads','1',
        '-frames:v','1','-pix_fmt','rgba','-f','rawvideo','pipe:1'],{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']})
      let failure,count=0
      const stop=error=>{failure ||= error;child.kill('SIGKILL')}
      const timer=setTimeout(()=>stop(fail('IMAGE_DECODE_TIMEOUT')),timeoutMs)
      child.once('error',()=>{failure ||= fail('IMAGE_DECODER_UNAVAILABLE')})
      child.stderr.resume()
      child.stdout.on('data',chunk=>{count+=chunk.length;if(count>1048576)stop(fail('INVALID_GENERATED_IMAGE'))})
      child.once('close',code=>{
        clearTimeout(timer)
        if(failure)return reject(failure)
        if(code!==0 || count!==1048576)return reject(fail('IMAGE_DECODE_FAILED'))
        resolveResult(count)
      })
    })
    return {version:'ieum-png-first-frame-decode-v1',sha256:createHash('sha256').update(bytes).digest('hex'),size:blob.size,
      width:512,height:512,pixelFormat:'rgba',decodedBytes,...identity}
  }finally{
    // Only this freshly created staging file/directory; no recursive removal.
    if(resolve(directory).startsWith(resolve(tmpdir())+sep)){
      await unlink(file).catch(error=>{if(error.code!=='ENOENT')throw error})
      await rmdir(directory)
    }
  }
}
