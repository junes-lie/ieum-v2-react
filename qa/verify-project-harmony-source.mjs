import assert from 'node:assert/strict'
// No audio or network in this ownership test; native decoding is tested by the
// registration browser flow with the real, SHA-verified project vocal file.
globalThis.window={}
const {loadProjectHarmonyReference,projectHarmonyReferenceKey}=await import('../src/projectHarmonySource.js')
const hash='a'.repeat(64)
const project={id:'ownership-project',songId:'song',key:'C',audioSource:{kind:'project-arrangement',songId:'song',key:'C',revision:'one',vocalGuideFile:'/audio/voice.mp3',vocalGuideSha256:hash}}
const before=structuredClone(project),calls=[]
let finish
const deps={load:async(file,sha)=>{calls.push([file,sha]);return new Blob(['verified'])},analyze:()=>new Promise(resolve=>{finish=resolve})}
const request=loadProjectHarmonyReference(project,deps)
await Promise.resolve()
project.id='selection-changed';project.audioSource.revision='two'
finish({features:{brightness:.4,roughness:.2}})
const reference=await request
assert.equal(reference.projectId,before.id);assert.equal(reference.revision,'one');assert.equal(reference.audioSha256,hash)
assert.deepEqual(calls,[[before.audioSource.vocalGuideFile,hash]])
assert.deepEqual(await loadProjectHarmonyReference(before,{load:()=>{throw Error('should reuse cached verified result')}}),reference)
assert.equal(projectHarmonyReferenceKey({...before,songId:'another-song'}),null)
assert.equal(projectHarmonyReferenceKey({...before,key:'D'}),null)
assert.equal(projectHarmonyReferenceKey({...before,audioSource:{...before.audioSource,vocalGuideFile:'/audio/../voice.mp3'}}),null)
assert.equal(projectHarmonyReferenceKey({...before,audioSource:{...before.audioSource,vocalGuideSha256:'unknown'}}),null)
assert.equal(await loadProjectHarmonyReference({id:'no-guide'}),null)
const retry={...before,id:'retry-project'}
await assert.rejects(loadProjectHarmonyReference(retry,{load:async()=>{throw Error('temporary fetch failure')}}),/temporary fetch failure/)
const recovered=await loadProjectHarmonyReference(retry,{load:async()=>new Blob(['verified']),analyze:async()=>({features:{brightness:.2,roughness:.3}})})
assert.equal(recovered.projectId,retry.id)
assert.deepEqual(before,{id:'ownership-project',songId:'song',key:'C',audioSource:{kind:'project-arrangement',songId:'song',key:'C',revision:'one',vocalGuideFile:'/audio/voice.mp3',vocalGuideSha256:hash}})
console.log('PASS project reference ownership snapshot, cache reuse, song/key/path/hash validation, missing-guide safety and retry recovery')
