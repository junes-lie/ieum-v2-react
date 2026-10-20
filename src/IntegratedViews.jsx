import React, {useEffect,useRef,useState} from 'react'
import Icon from './Icons.jsx'
import {songArtwork} from './songArtwork.js'

export function MyVoiceIcon() {
  return <span className="v2-profile-icon" aria-hidden="true"><img src="/artwork/profile-knot.webp" alt="" width="26" height="26"/></span>
}

export function SongArtwork({song,className=''}) {
  const src=songArtwork(song)
  return <span className={`v2-song-artwork ${className}`} aria-hidden="true">{src?<img src={src} alt="" loading="lazy" decoding="async" width="256" height="256"/>:<span>{song.title}</span>}</span>
}

export function TurntableFrame({children,playing,onPlay,canPlay}) {
  return <div className="v2-turntable-frame"><img className="v2-turntable-housing" src="/artwork/turntable-housing.webp" width="900" height="900" alt="" decoding="async"/><div className="v2-turntable-live-record">{children}</div>{onPlay&&<button className="v2-turntable-play" data-action="turntable-play" disabled={!canPlay} onClick={onPlay} aria-label={playing?'현재 듣기 일시정지':'현재 듣기 재생'}><Icon name={playing?'pause':'play'} size={18}/></button>}</div>
}

export function ProjectActionButton({onClick}) {
  return <button className="primary v2-project-action" data-action="open-parts" data-figma-node="1488:33657" onClick={onClick}><span className="v2-project-action-surface" aria-hidden="true"/><span className="v2-project-action-label">프로젝트 보기 →</span></button>
}

function RecordSlide({projectId,direction,children}) {
  const ref=useRef(null)
  const mounted=useRef(false)
  useEffect(()=>{
    if(!mounted.current){mounted.current=true;return}
    if(!direction||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
    const animation=ref.current.animate([{transform:`translateX(${direction*172}px)`,opacity:.25},{transform:'translateX(0)',opacity:1}],{duration:380,easing:'cubic-bezier(.22,.61,.36,1)'})
    return()=>animation.cancel()
  },[projectId,direction])
  return <div className="v2-record-slide" ref={ref}>{children}</div>
}

// Catalogue art is illustrative, never a measured identity or a submitted Track.
// Stored graphics and actual submitted Tracks always take precedence at the callsite.
export function recruitmentPreviewLayers(project) {
  let hash=2166136261
  for(const char of String(project.seed||project.id))hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0
  return project.parts.map((part,index)=>{
    if(!part.participant&&!part.participantId)return null
    const seed=(hash+Math.imul(index+1,2654435761))>>>0
    return {partId:part.id,seed,spread:.08+(seed%130)/1000,turbulence:.35+(seed%95)/100,
      opacity:.34,drift:.18+(seed%30)/100,continuity:.35+(seed%60)/100,
      articulation:(seed%70)/100,pitchWobble:(seed%55)/100,phase:(seed%6283)/1000,
      signature:`catalogue-art:${project.id}:${part.id}:${seed}`}
  })
}

export function SectionHeading({title,action,onAction}) {
  return <div className="v2-section-heading"><h2>{title}</h2>{onAction&&<button onClick={onAction}>{action||'전체 보기'} <span aria-hidden="true">→</span></button>}</div>
}

export function PartModules({parts,projectTracks,included,onToggle,onPlay,onParticipant,partAction,recordPart,hasDraft,currentUserId}) {
  return <div className="v2-part-modules" aria-label="파트별 참여 상태와 듣기">{parts.map((part,index)=>{
    const track=projectTracks[part.id],own=part.participantId===currentUserId
    const action=partAction?.(part)||{}
    return <section className="v2-part-module" key={part.id} data-part={part.id}>
      <div className="v2-voice-slot" style={{color:part.color}} aria-hidden="true">{part.participant?part.participant.slice(0,1):<Icon name="plus" size={22}/>}</div>
      {part.participantId&&!own?<button className="v2-part-person" onClick={()=>onParticipant(part.participantId)}>{part.participant}</button>:<strong>{part.participant||'OPEN'}</strong>}
      <span className="v2-part-role">{part.name}</span>
      <small>{track?'제출됨':own?(hasDraft?'임시 보관':'녹음 대기'):part.invitationStatus==='sent'?'초대 대기':part.participant?'Track 대기':'모집 중'}</small>
      <div className="v2-part-actions">{track?<><button className="v2-metal-play" aria-label={part.name+' Track 재생'} onClick={()=>onPlay(part.id)}><Icon name="play" size={12}/></button><label className="v2-toggle"><input type="checkbox" aria-label={part.name+' 현재 Mix 포함'} checked={Boolean(included[index])} onChange={()=>onToggle(index)}/><i/></label></>:own?<button className="v2-compact-action" data-action="record-part" aria-label={hasDraft?'녹음 이어서 확인하기':'내 Part 녹음하기'} onClick={()=>recordPart(part.id)}><Icon name="mic" size={12}/>{hasDraft?'확인':'녹음'}</button>:<button className="v2-compact-action secondary" disabled={!action.action} onClick={action.action}>보컬 찾기</button>}</div>
    </section>
  })}</div>
}

export function MonitoringModule({title,role,checked,onChange,guide=false,color}) {
  return <label className="v2-monitor-module"><span className="v2-monitor-symbol" style={{color}} aria-hidden="true">{guide?<Icon name="headphones" size={28}/>:title.slice(0,1)}</span><span>{title}</span><small>{role}</small><span className="v2-toggle"><input type="checkbox" aria-label={guide?'Guide 반주':`${title} · ${role} 함께 듣기`} checked={checked} onChange={onChange}/><i/></span></label>
}

export function HomeView({header,entries,songs,renderRecord,openSong,openProject,openSearch,openCreateProject}) {
  const recruiting=entries.filter(entry=>!entry.complete&&entry.openParts.length)
  const completed=entries.filter(entry=>entry.complete)
  const [index,setIndex]=useState(0)
  const [direction,setDirection]=useState(0)
  const selectedIndex=Math.min(index,Math.max(0,recruiting.length-1))
  const selected=recruiting[selectedIndex]
  const previous=recruiting[(selectedIndex-1+recruiting.length)%recruiting.length]
  const next=recruiting[(selectedIndex+1)%recruiting.length]
  const pointer=useRef(null)
  const swiped=useRef(false)
  const change=delta=>{setDirection(delta);setIndex(current=>(Math.min(current,Math.max(0,recruiting.length-1))+delta+recruiting.length)%Math.max(1,recruiting.length))}
  const open=entry=>entry.complete?openProject(entry):openSong(entry.song.id,entry.project.id)
  return <div className="screen figma-v2 home-v2-screen" data-screen-id="01">
    <section className="v2-hero"><img className="v2-hero-artwork" src="/artwork/home-hero.webp" width="1300" height="1209" alt="" fetchPriority="high"/>{header}<div className="v2-hero-copy"><h1>다른 목소리,<br/>하나의 노래.</h1><p>함께 부를 곡을 고르고,<br/>당신의 목소리를 더해보세요.</p></div></section>
    <main>
      <section className="v2-recruitment" id="recruiting-projects" tabIndex={-1}>
        <SectionHeading title="파트 모집 중" onAction={()=>openSearch('projects')}/><p className="v2-section-note">내 음역과 취향에 맞는 프로젝트</p>
        {selected?<><div className="v2-carousel-nav"><button aria-label="이전 모집 프로젝트" disabled={recruiting.length<2} onClick={()=>change(-1)}>‹</button><span aria-live="polite">{String(Math.min(index,recruiting.length-1)+1).padStart(2,'0')} / {String(recruiting.length).padStart(2,'0')}</span><button aria-label="다음 모집 프로젝트" disabled={recruiting.length<2} onClick={()=>change(1)}>›</button></div>
          <div className="v2-turntable-stage" role="group" aria-label="모집 프로젝트 레코드 탐색" data-direction={direction} onPointerDown={event=>{pointer.current={x:event.clientX,y:event.clientY};swiped.current=false}} onPointerUp={event=>{if(pointer.current){const dx=event.clientX-pointer.current.x,dy=event.clientY-pointer.current.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){swiped.current=true;change(dx<0?1:-1)}}pointer.current=null}} onPointerCancel={()=>{pointer.current=null;swiped.current=false}} onClickCapture={event=>{if(swiped.current){event.preventDefault();event.stopPropagation();swiped.current=false}}}>
            {recruiting.length>1&&<button className="v2-carousel-neighbor v2-carousel-neighbor-previous" aria-label={`이전 프로젝트 선택: ${previous.song.title}`} onClick={()=>change(-1)}><RecordSlide projectId={previous.project.id} direction={direction}>{renderRecord(previous,{recruitment:true})}</RecordSlide></button>}
            <div className="v2-recruit-record" data-project-id={selected.project.id}><TurntableFrame><RecordSlide projectId={selected.project.id} direction={direction}>{renderRecord(selected,{recruitment:true})}</RecordSlide></TurntableFrame></div>
            {recruiting.length>1&&<button className="v2-carousel-neighbor v2-carousel-neighbor-next" aria-label={`다음 프로젝트 선택: ${next.song.title}`} onClick={()=>change(1)}><RecordSlide projectId={next.project.id} direction={direction}>{renderRecord(next,{recruitment:true})}</RecordSlide></button>}
          </div><div className="v2-recruit-info"><h3>{selected.song.title}</h3><p>OPEN · {selected.openParts.map(part=>part.name).join(' · ')} <span>{selected.partCount-selected.openParts.length}명 참여</span></p></div><ProjectActionButton onClick={()=>open(selected)}/></>:<p className="empty-proof">현재 모집 중인 프로젝트가 없어요.</p>}
      </section>
      <section className="v2-recommended"><SectionHeading title="어떤 곡으로 시작할까요" onAction={()=>openSearch('songs')}/><div className="v2-song-grid">{songs.slice(0,3).map(song=><button className="v2-song-card" key={song.id} onClick={()=>openSong(song.id)}><SongArtwork song={song} className="v2-cover-slot"/><strong>{song.title}</strong><small>{song.artist}</small><small>프로젝트 {entries.filter(entry=>entry.song.id===song.id).length}</small></button>)}</div></section>
      <section className="v2-recent"><SectionHeading title="최근 열린 프로젝트"/><div className="v2-project-rows">{[...entries.filter(entry=>entry.isCreated),...entries.filter(entry=>!entry.isCreated&&!entry.publicExample)].slice(0,3).map(entry=><button className="v2-project-row" data-project-id={entry.project.id} key={entry.project.id} onClick={()=>open(entry)}><div className="v2-project-thumbnail"><div className="v2-thumbnail-record">{renderRecord(entry)}</div><SongArtwork song={entry.song} className="v2-thumbnail-sleeve"/></div><span><strong>{entry.song.title}</strong><small>{entry.song.artist}</small><small>{entry.partCount-entry.openParts.length}명 참여 · {entry.submitted}/{entry.partCount} 제출</small></span><span className="v2-open-roles"><small>{entry.complete?'COMPLETE':'OPEN'}</small>{entry.complete?'완성곡':entry.openParts.map(part=>part.name).join(' · ')||'녹음 중'}</span></button>)}</div></section>
      <section className="v2-completed"><SectionHeading title="완성곡 둘러보기" onAction={()=>openSearch('completed')}/><div className="v2-completed-carousel">{completed.length?completed.map(entry=><button className="v2-completed-card" key={entry.project.id} onClick={()=>openProject(entry)}><div>{renderRecord(entry)}</div><span><small>완성곡</small><strong>{entry.song.title}</strong><small>{entry.publicExample?`시연 음원 · 00:${String(entry.mix.duration).padStart(2,'0')}`:`${entry.partCount}명의 목소리`}</small><span className="v2-listen"><Icon name="play" size={14}/> 완성곡 듣기</span></span></button>):<p className="empty-proof">아직 완성한 곡이 없어요. 마지막 Track 제출 후 완성곡을 들을 수 있어요.</p>}</div></section>
      <button className="secondary v2-create-project" data-action="create-project" onClick={openCreateProject}><Icon name="plus" size={16}/>새 프로젝트 만들기</button>
    </main>
  </div>
}
