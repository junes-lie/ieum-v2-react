import {buildVoiceRepresentationInputs} from './voiceIdentityContract.js'

// Provisional engineering mapping, not an approved shape or AI generation.
export const VOICE_VISUAL_MAPPING_VERSION='ieum-voice-visual-mapping-probe-v1'
export async function prepareVoiceVisualControls(snapshot,options={}) {
  const inputs=await buildVoiceRepresentationInputs(snapshot,options)
  const candidates=inputs.identity.personalTraits.candidates
  const values={}
  for(const name of ['brightness','roughness','dynamics']){
    const item=candidates[name]
    if(item?.status!=='estimated' || !Number.isFinite(item.value) || item.value<0 || item.value>1) {
      throw new Error('This mapping requires measured brightness, roughness and dynamics proxies')
    }
    values[name]=item.value
  }
  // A bounded variation, not a measured trait or raw/private identifier. The
  // complete seed/digest remains in the private representation input only.
  const variation=Number.parseInt(inputs.identity.variationSeed.slice(0,8),16)/0xffffffff
  return {
    version:VOICE_VISUAL_MAPPING_VERSION,
    inputs,
    identityCondition:{version:VOICE_VISUAL_MAPPING_VERSION,
      detailScale:values.brightness,surfaceVariation:values.roughness,
      expansionContrast:values.dynamics,variation},
    // No silhouette/Identity bitmap is supplied to the flow renderer.
    flowStyle:{version:VOICE_VISUAL_MAPPING_VERSION,...values,variation}
  }
}
