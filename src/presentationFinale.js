import {analyzeBlob,loadProvidedAudio} from './audio.js'
import {projectAudioReference} from './projectAudio.js'
import {buildVoiceLayer} from './voiceAnalysis.js'
import {saveTracks} from './trackStore.js'

export const FINALE_DISCLOSURE='발표 시연 · 세 준비 Track은 동일한 제공 보컬을 재사용한 예시입니다. 내 마지막 Track만 직접 녹음하며, 완성 음원은 이 예시 Track들과 내 녹음의 브라우저 Mix입니다. 실제 세 사람의 독립 녹음이나 서버 AI 결과가 아닙니다.'
export const isFinaleFixture=track=>track?.origin==='presentation-provided-vocal-fixture'&&track.demo===true&&track.sourceProvenance?.version==='ieum-presentation-fixture-v1'

// Called only in the existing first-visit/profile-ready demos' separate IndexedDBs.
// Never overwrite a stored Part and never prefill the current user's Tenor.
export async function ensureFinaleTracks(project,stored){
  if(!project.presentationFinale)return stored
  const missing=project.parts.filter(part=>part.id!=='tenor'&&!stored.some(track=>track.id===`${project.id}:${part.id}`))
  if(!missing.length)return stored
  const source=project.audioSource
  const blob=await loadProvidedAudio(source.vocalGuideFile,source.vocalGuideSha256)
  const {features,duration}=await analyzeBlob(blob)
  const records=missing.map(part=>({
    id:`${project.id}:${part.id}`,projectId:project.id,partId:part.id,kind:'project-track',submissionStatus:'success',
    participantId:part.participantId,participant:part.participant,origin:'presentation-provided-vocal-fixture',demo:true,
    disclosure:'시연 준비 Track · 동일 제공 보컬 예시',blob,mimeType:blob.type,duration,syncOffsetMs:0,
    audioSourceRef:projectAudioReference(project),features,layer:buildVoiceLayer(project.seed,part.id,features),
    createdAt:new Date().toISOString(),sourceProvenance:{version:'ieum-presentation-fixture-v1',purpose:'provided-vocal-example',revision:source.revision,audioSha256:source.vocalGuideSha256,byteLength:blob.size}
  }))
  await saveTracks(records)
  return [...stored,...records]
}
