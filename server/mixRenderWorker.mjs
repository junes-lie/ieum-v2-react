process.once('message',async workerData=>{
try{
  const {AudioContext,OfflineAudioContext}=await import(workerData.runtimeUrl)
  let decodedBytes=0,index=0
  class HeadlessContext extends AudioContext {
    constructor(){super({sinkId:{type:'none'},sampleRate:44100})}
    async decodeAudioData(bytes){
      // Existing DSP decodes ordered Tracks, then backing, sequentially.
      const entry=workerData.entries[index++]
      const buffer=await super.decodeAudioData(bytes)
      decodedBytes+=buffer.length*buffer.numberOfChannels*4
      if(buffer.numberOfChannels>2 || buffer.duration>workerData.maxDurationSeconds || decodedBytes>workerData.maxPcmBytes)throw new Error('MIX_MEMORY_BUDGET_EXCEEDED')
      if(!entry || Math.abs(buffer.duration-entry.receipt.duration)>1/44100)throw new Error('MIX_DECODE_MISMATCH')
      return buffer
    }
  }
  globalThis.window={AudioContext:HeadlessContext,OfflineAudioContext}
  const {createAutoMix}=await import('../src/audio.js')
  const tracks=workerData.entries.slice(0,-1).map(entry=>({partId:entry.partId,blob:new Blob([entry.bytes],{type:entry.receipt.contentType}),syncOffsetMs:entry.syncOffsetMs}))
  const backing=workerData.entries.at(-1)
  const result=await createAutoMix({tracks,backingBlob:new Blob([backing.bytes],{type:backing.receipt.contentType}),duration:workerData.duration})
  if(result.blob.size>workerData.maxOutputBytes)throw new Error('MIX_MEMORY_BUDGET_EXCEEDED')
  const bytes=await result.blob.arrayBuffer()
  URL.revokeObjectURL(result.url)
  process.send({bytes,duration:result.duration,processing:result.processing,origin:result.origin})
}catch(error){process.send({error:['MIX_MEMORY_BUDGET_EXCEEDED','MIX_DECODE_MISMATCH'].includes(error?.message)?error.message:'MIX_RENDER_FAILED'})}
})
