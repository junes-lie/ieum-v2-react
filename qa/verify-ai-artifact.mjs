import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {validateAiVoiceLayer} from '../src/aiVoiceLayer.js'

const report=JSON.parse(await readFile(process.argv[2],'utf8'))
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const tracks=[]
for(const [index,source] of report.sources.entries()){
 const result=report.results.find(result=>result.sourceIndex===index)
 const audio=await readFile(source.path),image=await readFile(result.path)
 assert.equal(hash(audio),result.sourceSha256)
 const track={projectId:'qa-real-ai',partId:`voice-${index}`,participantId:`public-singer-${index}`,blob:new Blob([audio],{type:'audio/wav'})}
 track.aiVoiceLayer={version:'ieum-ai-voice-layer-v1',projectId:track.projectId,partId:track.partId,participantId:track.participantId,projectSeed:'qa-real-ai-seed',inferenceSeed:report.seed,model:report.model,revision:report.revision,sourceSha256:hash(audio),outputSha256:hash(image),blob:new Blob([image],{type:'image/png'})}
 assert.equal(await validateAiVoiceLayer(track,'qa-real-ai-seed'),track.aiVoiceLayer)
 tracks.push(track)
}
const original=tracks[0]
for(const changed of [{projectSeed:'other'},{partId:'other'},{participantId:'other'},{sourceSha256:'0'.repeat(64)},{outputSha256:'0'.repeat(64)},{blob:new Blob(['broken'],{type:'image/png'})}]){
 await assert.rejects(()=>validateAiVoiceLayer({...original,aiVoiceLayer:{...original.aiVoiceLayer,...changed}},'qa-real-ai-seed'))
}
assert.equal(await validateAiVoiceLayer({...original,aiVoiceLayer:undefined},'qa-real-ai-seed'),null)
assert.equal(new Set(tracks.map(track=>track.aiVoiceLayer.outputSha256)).size,4)
console.log('PASS four actual model outputs: source/output integrity, project/part/user/seed ownership, invalid artifact rejection; no inference service claim.')
