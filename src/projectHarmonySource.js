import {analyzeBlob,loadProvidedAudio} from './audio.js'

// Only an explicitly registered vocal guide can stand in for the project's
// voice reference. Backing tracks, completed songs and Profile samples cannot.
export function projectHarmonyReferenceKey(project) {
  const source=project?.audioSource
  const file=source?.harmonyVocalFile || source?.vocalGuideFile
  const hash=source?.harmonyVocalSha256 || source?.vocalGuideSha256
  if(!project?.id || !project.songId || source?.kind!=='project-arrangement' ||
      source.songId!==project.songId || source.key!==project.key || !source.revision ||
      !/^\/audio\/[\w./-]+$/.test(file || '') || file.includes('..') ||
      !/^[a-f0-9]{64}$/.test(hash || '')) return null
  return JSON.stringify([project.id,project.songId,project.key,source.revision,file,hash])
}

const references=new Map()
export async function loadProjectHarmonyReference(project,{load=loadProvidedAudio,analyze=analyzeBlob}={}) {
  const key=projectHarmonyReferenceKey(project)
  if(!key)return null
  // Snapshot ownership before any asynchronous work or selection changes.
  const [projectId,songId,projectKey,revision,sourceFile,audioSha256]=JSON.parse(key)
  if(!references.has(key)) {
    const pending=(async()=>{
      const blob=await load(sourceFile,audioSha256)
      const {features}=await analyze(blob)
      return {kind:'project-vocal-reference',projectId,songId,key:projectKey,revision,sourceFile,audioSha256,features}
    })()
    references.set(key,pending)
    pending.catch(()=>{if(references.get(key)===pending)references.delete(key)})
  }
  return references.get(key)
}
