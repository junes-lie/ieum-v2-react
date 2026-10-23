import { submittedProjectTracks } from './projectModel.js'
import {CURRENT_USER_ID} from './catalog.js'

// Discovery reflects committed tracks and seats; inviting or saving is not submission.
export function discoveryProjects({songs,mainProject,mainTracks={},mainMix,createdProjects=[],createdTracks={},createdMixes={},joined=false,joinedPart,candidateAccepted=false,invitedPerson,publicResults=[]}) {
  const entries=[...songs.flatMap(song=>song.projects.filter(project=>!createdProjects.some(local=>local.id===project.id)).map(project=>({song,project,isCreated:false}))),
    ...createdProjects.map(project=>({song:songs.find(song=>song.id===project.songId)||{id:project.songId,title:project.songTitle||project.name,artist:'IEUM',genre:project.genre||''},project,isCreated:true}))]
    .map(entry=>{
      const isMain=entry.project.id===mainProject.id
      const project=isMain?{...entry.project,...mainProject}:entry.project
      const tracks=isMain?mainTracks:createdTracks[project.id]||{}
      const submitted=submittedProjectTracks(project,tracks)
      const submittedIds=new Set(submitted.map(track=>track.partId))
      const parts=(project.parts||[]).map(part=>{
        if(submittedIds.has(part.id)){const track=tracks[part.id];return {...part,participantId:track.participantId||part.participantId,participant:track.participant||part.participant,status:'submitted'}}
        if(isMain&&joined&&part.id===joinedPart)return {...part,status:'ready',participantId:CURRENT_USER_ID,participant:'JISUN'}
        if(isMain&&candidateAccepted&&part.id==='bass')return {...part,status:'accepted',participantId:invitedPerson?.id||part.participantId,participant:invitedPerson?.name||part.participant}
        return part
      }).sort((a,b)=>project.presentationFinale?Number(a.participantId===CURRENT_USER_ID)-Number(b.participantId===CURRENT_USER_ID):0)
      const openParts=parts.filter(part=>['open','recruiting'].includes(part.status)&&!part.participantId&&!part.participant)
      const partCount=project.partCount||parts.length
      const mix=isMain?mainMix:createdMixes[project.id]
      const complete=partCount>0&&submitted.length===partCount&&Boolean(mix)
      return {...entry,project:{...project,parts},tracks,submitted:submitted.length,partCount,participantCount:parts.filter(part=>part.participant||part.participantId).length,openParts,mix:complete?mix:null,complete}
    })
  return [...publicResults,...entries]
}

export function matchesGenre(song,genre) {
  if(genre==='전체')return true
  const value=String(song.genre||'').toLowerCase()
  const patterns={'발라드':/ballad|발라드/,'팝':/pop|팝/,'R&B':/r&b|rnb|알앤비/}
  return patterns[genre]?.test(value)??value.includes(genre.toLowerCase())
}
