// Explicit result consumption only. Object URLs are temporary and never carry
// private owner IDs. No result selection, inference or submission side effect.
import {loadPersonalIdentityResult,loadStoredProjectRecordInput,loadStoredTrackVoiceLayer} from './voiceIdentityStore.js'

async function decoded(blob){
  const url=URL.createObjectURL(blob)
  try{
    const image=new Image();image.src=url
    await image.decode()
    if(image.naturalWidth!==512 || image.naturalHeight!==512)throw new Error('Stored voice graphic must decode to 512×512')
    let disposed=false
    return {url,image,get disposed(){return disposed},dispose:()=>{if(!disposed){disposed=true;URL.revokeObjectURL(url)}}}
  }catch(error){URL.revokeObjectURL(url);throw error}
}
export async function loadStoredPersonalGraphic(selector){
  const result=await loadPersonalIdentityResult(selector)
  if(!result)return null
  const resource=await decoded(result.artifact.blob)
  return {image:resource.url,model:result.artifact.model,
    ref:{id:result.ref.id,revision:result.ref.revision,outputSha256:result.ref.outputSha256},
    get disposed(){return resource.disposed},dispose:resource.dispose}
}
export async function loadStoredProjectRenderResources(ref){
  const graph=await loadStoredProjectRecordInput(ref)
  if(!graph)throw new Error('Explicit stored Project input was not found')
  const resources=[],fields=[],styles=[]
  try{
    for(const entry of graph.input.layers){
      if(!entry.layerRef)continue
      const layer=await loadStoredTrackVoiceLayer({projectId:graph.input.projectId,partId:entry.partId,
        id:entry.layerRef.id,revision:entry.layerRef.revision})
      if(!layer)throw new Error('Stored Track Layer was removed during loading')
      const resource=await decoded(layer.artifact.blob);resources.push(resource)
      fields.push({projectId:graph.input.projectId,projectSeed:graph.input.projectSeed,partId:entry.partId,
        image:resource.image,outputSha256:layer.ref.outputSha256})
      styles.push({partId:entry.partId,style:structuredClone(layer.controls.flowStyle)})
    }
    let disposed=false
    return {input:graph.input,fields,styles,get disposed(){return disposed},
      dispose:()=>{if(!disposed){disposed=true;resources.forEach(resource=>resource.dispose())}}}
  }catch(error){resources.forEach(resource=>resource.dispose());throw error}
}
