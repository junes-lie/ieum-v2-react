import samples from './providedSamples.json' with {type:'json'}

// Independent listening catalogue, never the current browser's submitted Tracks.
// Existing original audio excerpts are explicitly labelled as presentation examples.
const palette=[['soprano','#3b82f6'],['alto','#f16f61'],['tenor','#d6b895']]
const covers=['/artwork/cover-pop.webp','/artwork/cover-folk.webp','/artwork/cover-rnb.webp']
export const PUBLIC_COMPLETIONS=samples.map((sample,index)=>({
  publicExample:true,complete:true,isCreated:false,submitted:0,openParts:[],partCount:3,tracks:{},
  song:{id:sample.id,title:sample.title,artist:'IEUM Originals',genre:sample.mood,cover:covers[index]},
  project:{id:`showcase:${sample.id}`,name:'완성곡 시연',seed:`ieum:showcase:${sample.id}`,key:sample.key,
    resultUrl:`https://ieum-v2-react.vercel.app/#complete?result=${encodeURIComponent('showcase:'+sample.id)}`,
    parts:palette.map(([id,color])=>({id,name:id,color,participant:'시연 그래픽'}))},
  mix:{url:sample.audioFile,duration:sample.duration},
  disclosure:'IEUM에서 제작한 시연 음원이에요. 실제 사용자 협업 결과는 아니에요.'
}))

export function publicResultIdFromNavigation(state,hash) {
  const id=state?.publicResultId||new URLSearchParams(String(hash||'').split('?')[1]).get('result')
  return PUBLIC_COMPLETIONS.some(entry=>entry.project.id===id)?id:null
}
