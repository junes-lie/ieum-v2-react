import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {estimatePitch} from '../src/pitch.js'
import {parseArgs} from 'node:util'
import {resolve,sep} from 'node:path'
import {pathToFileURL} from 'node:url'
const {values}=parseArgs({options:{'runtime-dir':{type:'string'},output:{type:'string'}}})
if(!values['runtime-dir']||!values.output)throw new Error('Required: --runtime-dir <retained CSD runtime> --output <new JSON>')
const root=pathToFileURL(resolve(values['runtime-dir'])+sep),output=pathToFileURL(resolve(values.output))
try {await readFile(output);throw new Error('Preserve existing observations')}catch(error){if(error.code!=='ENOENT')throw error}
const manifest=JSON.parse(await readFile(new URL('csd-app-pitch-input/manifest.json',root),'utf8'))
const bytes=await readFile(new URL('csd-app-pitch-input/mono.f32le',root))
if(createHash('sha256').update(bytes).digest('hex')!==manifest.pcmSha256)throw new Error('PCM mismatch')
if(bytes.length!==manifest.samples*4||manifest.duration>10||manifest.sampleRate!==44100||manifest.sourceSha256!=='ff301c73beb65da32a623a5c9628567c001e862f4ff954f821182a61d685254a'||manifest.pcmSha256!=='1f787f4781ffa4ad31739f25b57761bdf1385e4aa8a2b78dd02103eb019741bb')throw new Error('Pinned bounded CSD PCM input required')
const samples=Float32Array.from({length:bytes.length/4},(_,index)=>bytes.readFloatLE(index*4))
const annotationBytes=await readFile(new URL('csd-research-kr001a/first-eight-annotation.json',root))
const annotationSha256=createHash('sha256').update(annotationBytes).digest('hex')
if(annotationSha256!=='8064227cd1b597ca9081c36cc5bd068948e8f432ef635ad09eb13a94c596e4a5')throw new Error('Pinned manual annotation changed')
const annotations=JSON.parse(annotationBytes.toString('utf8'))
if(annotations.sourceAudioSha256!==manifest.sourceSha256||!Array.isArray(annotations.rows)||annotations.rows.length!==8)throw new Error('Original annotation source required')
const frames=[];const start=performance.now()
for(let offset=0;offset+4096<=samples.length;offset+=1024){
 const frame=samples.subarray(offset,offset+4096),estimate=estimatePitch(frame,manifest.sampleRate)
 frames.push({centerSeconds:(offset+2048)/manifest.sampleRate,windowStart:offset/manifest.sampleRate,
              measuredMidi:estimate.hz?69+12*Math.log2(estimate.hz/440):null,...estimate})
}
const median=values=>{if(!values.length)return null;values.sort((a,b)=>a-b);const n=values.length;return n%2?values[(n-1)/2]:(values[n/2-1]+values[n/2])/2}
const rows=annotations.rows.map((annotation,index)=>{
 const selected=frames.filter(frame=>frame.centerSeconds>=annotation.start+.08&&frame.centerSeconds<annotation.end-.08)
 const supported=selected.filter(frame=>frame.measuredMidi!==null&&frame.confidence>=.30)
 return {annotationIndex:index,annotatedMidi:annotation.midi,selectedFrames:selected.length,confidentFrames:supported.length,
         measuredMedianMidi:median(supported.map(frame=>frame.measuredMidi)),
         observedMinMidi:supported.length?Math.min(...supported.map(frame=>frame.measuredMidi)):null,
         observedMaxMidi:supported.length?Math.max(...supported.map(frame=>frame.measuredMidi)):null}
})
const result={source:manifest,annotationSha256,dataLicense:annotations.license,extractorSha256:createHash('sha256').update(await readFile(new URL('../src/pitch.js',import.meta.url))).digest('hex'),
              frameLength:4096,hopLength:1024,diagnosticConfidenceThreshold:.30,edgeExclusionSeconds:.08,rows,frames,
              elapsedSeconds:(performance.now()-start)/1000,measurementApproved:false,profileEnrolled:false,liveProfilePipelineVerified:false,
              limits:['Direct estimatePitch only; no monitorInput throttling/350ms tracking or live range collection test','One manually annotated singer; not real microphone/device calibration','Score target differs from acoustic glides/vibrato','Null and sparse frames retained; no confidence interpreted as scientific accuracy']}
await writeFile(output,JSON.stringify(result,null,2),{encoding:'utf8',flag:'wx'})
console.log(JSON.stringify({rows,elapsedSeconds:result.elapsedSeconds}))
