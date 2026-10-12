import {createHash} from 'node:crypto'
import {ServiceError} from '../src/projectService.js'
import {analyzeAudioBuffer} from '../src/voiceAnalysis.js'
import {canonicalIdentityInput,assessVoiceCandidates} from '../src/voiceIdentityContract.js'
import {exactDecodedAudioReceipt} from './originalAudioVerification.js'
const fail=code=>new ServiceError('대표 Sample 분석을 완료하지 못했어요. 저장 원본은 유지됩니다.',{code,status:409})

export function checkedStoredSampleAnalysis(context) {
  const analysis=context.analysis
  exactDecodedAudioReceipt(context.receipt,{size:context.size,sha256:context.sha256,contentType:context.contentType})
  if(Object.keys(context.receipt).length!==9 || analysis?.version!=='ieum-sample-analysis-v1' || Object.keys(analysis).length!==7 ||
    analysis.sourceSha256!==context.sha256 || analysis.byteLength!==context.size ||
    canonicalIdentityInput(analysis.audioReceipt)!==canonicalIdentityInput(context.receipt) ||
    analysis.features?.version!=='ieum-basic-voice-v5' || analysis.features.pitchAnalysisVersion!=='normalized-difference-v1' || analysis.features.pitchFrameLength!==4096 ||
    createHash('sha256').update(canonicalIdentityInput(analysis.features)).digest('hex')!==analysis.featuresSha256 ||
    canonicalIdentityInput(assessVoiceCandidates(analysis.features,'voice-sample'))!==canonicalIdentityInput(analysis.assessment))throw fail('INVALID_SAMPLE_ANALYSIS')
  return structuredClone(analysis)
}

// Analyze only an owned, already decoded Sample. No client feature JSON is an
// input. A caller-supplied RAM budget bounds the actual mono Float32 allocation.
export async function analyzeVerifiedSample({context,storage,decoderOptions,maxPcmBytes}) {
  context=structuredClone(context)
  if(context?.purpose!=='voice-sample' || context.audioVerified!==true || typeof storage?.verifyOriginalAudio!=='function')throw fail('SAMPLE_AUDIO_NOT_VERIFIED')
  const expected={size:context.size,sha256:context.sha256,contentType:context.contentType}
  const prior=exactDecodedAudioReceipt(context.receipt,expected)
  if(Object.keys(context.receipt).length!==9)throw fail('INVALID_AUDIO_RECEIPT')
  if(!Number.isSafeInteger(maxPcmBytes) || maxPcmBytes<=0)throw fail('SAMPLE_ANALYSIS_NOT_CONFIGURED')
  if(prior.decodedFrames*Float32Array.BYTES_PER_ELEMENT>maxPcmBytes)throw fail('SAMPLE_ANALYSIS_BUDGET_EXCEEDED')
  if(prior.decodedFrames<4096)throw fail('SAMPLE_ANALYSIS_INSUFFICIENT_DATA')
  let samples=new Float32Array(prior.decodedFrames),offset=0,carry=null
  const append=sample=>{
    if(offset>=samples.length)throw fail('SAMPLE_ANALYSIS_FRAME_MISMATCH')
    samples[offset++]=sample/32768
  }
  try{
    const decoded=exactDecodedAudioReceipt(await storage.verifyOriginalAudio(context.objectId,expected,{
      ...decoderOptions,onPcmChunk:chunk=>{
        let index=0
        if(carry!==null && chunk.length){const signed=carry|(chunk[0]<<8);append(signed>=32768?signed-65536:signed);index=1;carry=null}
        for(;index+1<chunk.length;index+=2)append(chunk.readInt16LE(index))
        if(index<chunk.length)carry=chunk[index]
      }
    }),expected)
    if(Object.keys(prior).some(key=>decoded[key]!==prior[key]) || offset!==samples.length || carry!==null)throw fail('SAMPLE_ANALYSIS_FRAME_MISMATCH')
    const features=analyzeAudioBuffer({sampleRate:decoded.sampleRate,duration:decoded.duration,getChannelData:()=>samples})
    const featuresSha256=createHash('sha256').update(canonicalIdentityInput(features)).digest('hex')
    return {version:'ieum-sample-analysis-v1',sourceSha256:expected.sha256,byteLength:expected.size,audioReceipt:decoded,
      features,featuresSha256,assessment:assessVoiceCandidates(features,'voice-sample')}
  }finally{samples=null}
}
