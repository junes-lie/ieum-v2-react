import React, {useEffect,useLayoutEffect,useRef,useState} from 'react'
import Icon from './Icons.jsx'
import {songArtwork} from './songArtwork.js'
import {openProjectRangeAvailability} from './matching.js'
import figmaAssets from './figmaAssets.json' with { type: 'json' }
import {CURRENT_USER_ID} from './catalog.js'

// Figma display assets plus the requested presentation knot; never a measured Voice Identity.
const participantKnots = {
  yoonseul: '/artwork/identicon-blue.png',
  doyoon: '/artwork/identicon-coral.png',
  jisun: '/artwork/identicon-teal-presentation.png',
  min: '/artwork/identicon-cream.png'
}

// Participant colors stay attached to people when display order changes.
const colorKnots={'#3b82f6':'blue','#f16f61':'coral','#d6b895':'cream','#2eb6ad':'teal-presentation'}
const participantColors={yoonseul:'#3b82f6',doyoon:'#f16f61',min:'#d6b895',jisun:'#2eb6ad'}
export const participantColor=part=>participantColors[part.participantId]||part.color
export function recordPalettePart(part){
  return {'#3b82f6':'soprano','#f16f61':'alto','#d6b895':'tenor','#2eb6ad':'bass'}[participantColor(part)]||part.id
}
export function ParticipantKnot({participantId,name,color}) {
  const src=participantKnots[participantId] || (colorKnots[color]?`/artwork/identicon-${colorKnots[color]}.png`:null)
  return src?<img className="v2-participant-knot" data-artwork-kind={participantId==='jisun'?'presentation-generated-identicon':'supplied-identicon'} src={src} width="128" height="128" alt=""/>:<span className="v2-participant-placeholder" aria-label={name||'참여자'}><Icon name="user" size={16}/></span>
}

export function MyVoiceIcon({profile}) {
  return <span className="v2-profile-icon" data-profile-state={profile?'present':'absent'} aria-hidden="true">{profile?<img src="/artwork/identicon-teal-presentation.png" alt="" width="26" height="26"/>:<Icon name="user" size={20}/>}</span>
}

export function SongArtwork({song,className=''}) {
  const src=songArtwork(song)
  return <span className={`v2-song-artwork ${className}`} aria-hidden="true">{src?<img src={src} alt="" loading="lazy" decoding="async" width="256" height="256"/>:<span>{song.title}</span>}</span>
}

export function TurntableFrame({children,playing,onPlay,canPlay,control}) {
  return <div className="v2-turntable-frame"><img className="v2-turntable-housing" src="/artwork/turntable-housing.webp" width="900" height="900" alt="" decoding="async"/><div className="v2-turntable-live-record">{children}</div>{control}{onPlay&&<button className="v2-turntable-play" data-action="turntable-play" disabled={!canPlay} onClick={onPlay} aria-label={playing?'현재 듣기 일시정지':'현재 듣기 재생'}><img src={canPlay?'/artwork/figma-player-gold-current.svg':'/artwork/figma-player-play-surface.svg'} width="48" height="48" alt="" aria-hidden="true"/><Icon name={playing?'pause':'play'} size={14.4}/></button>}</div>
}

export function ProjectActionButton({onClick,label="프로젝트 보기 →",actionId="open-parts",disabled=false,icon,variant,className=""}) {
  return <button className={`primary v2-project-action ${className}`} data-action={actionId} data-figma-node="1583:54015" data-button-action={variant} disabled={disabled} onClick={onClick}><span className="v2-project-action-surface" aria-hidden="true"/>{icon&&<Icon name={icon} size={18}/>}<span className="v2-project-action-label">{label}</span></button>
}

function RecordSlide({projectId,slot,children}) {
  const ref=useRef(null)
  const animation=useRef(null)
  const positioned=useRef(false)
  useLayoutEffect(()=>{
    // The fixed 255px deck's platter is 74.8%, offset 8.2% / 10.6%.
    // Keep the 172px side records at their existing Figma positions.
    const target=slot===0?'translate(0px, 0px) scale(1)':`translate(${slot*230+11.22}px, 5.055px) scale(${172/(255*.748)})`
    const node=ref.current
    const from=positioned.current?window.getComputedStyle(node).transform:target
    animation.current?.cancel()
    node.style.transform=target
    if(positioned.current&&typeof node.animate==='function'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      animation.current=node.animate([{transform:from},{transform:target}],{duration:380,easing:'cubic-bezier(.22,.61,.36,1)'})
    }
    positioned.current=true
  },[slot])
  useEffect(()=>()=>animation.current?.cancel(),[])
  return <div className="v2-record-slide v2-carousel-record" data-project-id={projectId} data-slot={slot} ref={ref}>{children}</div>
}

// Catalogue art is illustrative, never a measured identity or a submitted Track.
// Stored graphics and actual submitted Tracks always take precedence at the callsite.
export function recruitmentPreviewLayers(project) {
  let hash=2166136261
  for(const char of String(project.seed||project.id))hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0
  return project.parts.map((part,index)=>{
    if((!part.participant&&!part.participantId)||part.participantId===CURRENT_USER_ID)return null
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

// One circular control for in-page scrolling and Home section navigation.
export function CircularScrollControl({direction='down',label,onClick}) {
  return <button className={`v2-scroll-control v2-scroll-control-${direction}`} type="button" aria-label={label} onClick={onClick}><span className="v2-scroll-art" aria-hidden="true"><img className="v2-scroll-ring" src="/artwork/first-visit-scroll-ring.svg" width="70" height="70" alt=""/><img className="v2-scroll-arrow" src="/artwork/first-visit-scroll-arrow.svg" width="26" height="26" alt=""/></span></button>
}

function HomeSectionHeading({title,note,onAction}) {
  return <div className="v2-section-heading v2-home-section-heading"><div className="v2-heading-copy"><h2>{title}</h2>{note&&<p className="v2-section-note">{note}</p>}</div>{onAction&&<CircularScrollControl direction="right" label={`${title} 전체 보기`} onClick={onAction}/>}</div>
}

export function PartModules({parts,projectTracks,included,onToggle,onPlay,onParticipant,partAction,recordPart,hasDraft,currentUserId}) {
  return <div className="v2-part-modules" style={{'--part-count':parts.length}} aria-label="파트별 참여 상태와 듣기">{parts.map((part,index)=>{
    const track=projectTracks[part.id],own=part.participantId===currentUserId
    const action=partAction?.(part)||{}
    const identity=<><span className={`v2-voice-slot ${part.participant?"":"v2-open-voice-slot"}`} style={{color:part.color}} aria-hidden="true">{part.participant?<ParticipantKnot participantId={part.participantId} name={part.participant} color={participantColor(part)}/>:<Icon name="plus" size={22}/>}</span><span className="v2-part-name-role"><strong>{own?'내 파트':part.participant||'OPEN'}</strong><span className="v2-part-role">{part.name}</span></span></>
    return <section className="v2-part-module" key={part.id} data-part={part.id}>
      {part.participantId&&!own?<button className="v2-part-identity v2-part-person" onClick={()=>onParticipant(part.participantId)} aria-label={part.participant+' 보컬 프로필'}>{identity}</button>:action.action?<button className="v2-part-identity v2-part-person" onClick={action.action} aria-label={part.name+' 보컬 찾기'}>{identity}</button>:<div className="v2-part-identity">{identity}</div>}
      <div className="v2-part-channel"><small>{track?'제출됨':own?(hasDraft?'임시 보관':'녹음 대기'):part.invitationStatus==='sent'?'초대 대기':part.participant?'Track 대기':'모집 중'}</small>
      <div className="v2-part-actions"><label className="v2-toggle"><input type="checkbox" aria-label={part.name+' 현재 Mix 포함'} checked={Boolean(track&&included[index])} disabled={!track} onChange={()=>onToggle(index)}/><i/></label></div></div>
    </section>
  })}</div>
}

export function MonitoringModule({title,participantId,role,checked,onChange,guide=false,color}) {
  return <label className="v2-monitor-module"><span className="v2-monitor-symbol" style={{color}} aria-hidden="true">{guide?<img src="/artwork/guide-keyboard.svg" alt="" width="46" height="32"/>:<ParticipantKnot participantId={participantId} name={title} color={color}/>}</span><span>{title}</span><small>{role}</small><span className="v2-toggle"><input type="checkbox" aria-label={guide?'Guide 반주':`${title} · ${role} 함께 듣기`} checked={checked} onChange={onChange}/><i/></span></label>
}

export function HomeView({header,profile,startVoiceSetup,entries,songs,renderRecord,renderPreview,openSong,openProject,openSearch,openCreateProject,formatDuration}) {
  const recruiting=entries.filter(entry=>!entry.complete&&entry.openParts.length).sort((a,b)=>Number(Boolean(b.project.presentationFinale))-Number(Boolean(a.project.presentationFinale)))
  const completed=entries.filter(entry=>entry.complete)
  const hasRange=Number.isFinite(profile?.rangeData?.lowMidi)&&Number.isFinite(profile?.rangeData?.highMidi)
  const songOptions=songs.map(song=>({song,projects:entries.filter(entry=>entry.song.id===song.id&&!entry.publicExample)}))
    .map(item=>({...item,matching:hasRange?openProjectRangeAvailability(profile.rangeData,item.projects.map(entry=>entry.project)).matchingProjects:0}))
  const rangeOptions=hasRange?songOptions.filter(item=>item.matching>0):[]
  const personalized=rangeOptions.length>0
  const recommended=personalized?rangeOptions:songOptions
  const [index,setIndex]=useState(0)
  const [direction,setDirection]=useState(0)
  const selectedIndex=recruiting.length?((index%recruiting.length)+recruiting.length)%recruiting.length:0
  const selected=recruiting[selectedIndex]
  const previous=recruiting[(selectedIndex-1+recruiting.length)%recruiting.length]
  const next=recruiting[(selectedIndex+1)%recruiting.length]
  const pointer=useRef(null)
  const swiped=useRef(false)
  const change=delta=>{setDirection(delta);setIndex(current=>current+delta)}
  // Stable virtual positions retain each live Canvas as it travels between slots.
  // The outer two records enter/leave beyond the clipped carousel viewport.
  const slides=selected?Array.from({length:recruiting.length>1?5:1},(_,offset)=>{
    const slot=recruiting.length>1?offset-2:0
    const position=index+slot
    return {slot,position,entry:recruiting[((position%recruiting.length)+recruiting.length)%recruiting.length]}
  }):[]
  const open=entry=>entry.complete?openProject(entry):openSong(entry.song.id,entry.project.id)
  return <div className="screen figma-v2 home-v2-screen" data-screen-id="01">
    <section className="v2-hero"><img className="v2-hero-artwork" src="/artwork/home-hero.webp" width="430" height="400" alt="" fetchPriority="high"/>{header}<div className="v2-hero-copy-scrim" aria-hidden="true"/><div className="v2-hero-copy"><h1>다른 목소리,<br/>하나의 노래.</h1><p>함께 부를 곡을 고르고,<br/>당신의 목소리를 더해보세요.</p></div></section>
    <main>
      {!profile&&<section className="v2-first-visit-guide" aria-label="처음 방문한 사용자를 위한 안내">
        <div className="v2-first-visit-row">
          <div className="v2-first-visit-copy"><h2>한 곡의 빈 Part를<br/>함께 채워요.</h2><p>마음에 드는 곡의 빈 파트를 골라 함께 불러요.<br/>각자의 녹음이 모이면 하나의 노래가 완성돼요.<br/>참여할 프로젝트를 탐색해 보세요.</p></div>
          <CircularScrollControl label="파트 모집 중으로 이동" onClick={()=>{
            const target=document.getElementById('recruiting-projects')
            target?.focus({preventScroll:true})
            target?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})
          }}/>
        </div>
      </section>}
      <section className="v2-recruitment" id="recruiting-projects" tabIndex={-1}>
        <div className="v2-recruitment-heading"><HomeSectionHeading title="파트 모집 중" note="함께할 파트를 찾아보세요." onAction={()=>openSearch('projects')}/></div>
        {selected?<div className="v2-recruitment-feature"><div className="v2-recruitment-media"><div className="v2-carousel-nav"><button aria-label="이전 모집 프로젝트" disabled={recruiting.length<2} onClick={()=>change(-1)}><img src={figmaAssets.imgFaFaChevronLeft} width="44" height="44" alt=""/></button><span aria-live="polite">{String(selectedIndex+1).padStart(2,'0')} / {String(recruiting.length).padStart(2,'0')}</span><button aria-label="다음 모집 프로젝트" disabled={recruiting.length<2} onClick={()=>change(1)}><img className="v2-carousel-next-arrow" src={figmaAssets.imgFaFaChevronLeft} width="44" height="44" alt=""/></button></div>
          <div className="v2-recruitment-player">
          <div className="v2-turntable-stage" role="group" aria-label="모집 프로젝트 레코드 탐색" data-direction={direction} onPointerDown={event=>{pointer.current={x:event.clientX,y:event.clientY};swiped.current=false}} onPointerUp={event=>{if(pointer.current){const dx=event.clientX-pointer.current.x,dy=event.clientY-pointer.current.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){swiped.current=true;change(dx<0?1:-1)}}pointer.current=null}} onPointerCancel={()=>{pointer.current=null;swiped.current=false}} onClickCapture={event=>{if(swiped.current){event.preventDefault();event.stopPropagation();swiped.current=false}}}>
            {recruiting.length>1&&<button className="v2-carousel-neighbor v2-carousel-neighbor-previous" aria-label={`이전 프로젝트 선택: ${previous.song.title}`} onClick={()=>change(-1)}/>}
            <div className="v2-recruit-record" data-project-id={selected.project.id}><TurntableFrame control={renderPreview?.(selected)}>{slides.map(({slot,position,entry})=><RecordSlide key={position} projectId={entry.project.id} slot={slot}>{renderRecord(entry,{recruitment:true})}</RecordSlide>)}</TurntableFrame></div>
            {recruiting.length>1&&<button className="v2-carousel-neighbor v2-carousel-neighbor-next" aria-label={`다음 프로젝트 선택: ${next.song.title}`} onClick={()=>change(1)}/>}
          </div><div className="v2-recruit-info"><SongArtwork song={selected.song} className="v2-recruit-jacket"/><div className="v2-recruit-copy"><h3 lang={/[가-힣]/.test(selected.song.title)?'ko':'en'}>{selected.song.title}</h3><p><span className="v2-recruit-open">OPEN · {selected.openParts.map(part=>part.name).join(' · ')}</span><span>{selected.participantCount}명 참여</span></p></div></div></div></div><ProjectActionButton onClick={()=>open(selected)}/></div>:<p className="empty-proof">현재 모집 중인 프로젝트가 없어요.</p>}
      </section>
      <section className="v2-recommended" data-recommendation-mode={personalized?'range':'general'}><div className="v2-recommended-heading"><HomeSectionHeading title="어떤 곡으로 시작할까요" onAction={()=>openSearch('songs')} note={!hasRange?'내 목소리를 등록하면 음역과 취향에 맞는 곡을 추천해요.':personalized?`${profile.demo?'시연 프로필의':'등록된'} 음역 안에 OPEN Part가 있는 곡이에요.`:'현재 확인된 내 음역 추천이 없어 전체 곡을 보여드려요.'}/>{!profile&&startVoiceSetup&&<button className="secondary v2-profile-register" data-action="home-voice-setup" onClick={startVoiceSetup}>보이스 프로필 등록하기</button>}</div><div className="v2-song-grid">{recommended.slice(0,3).map(({song,projects,matching})=><button className="v2-song-card" key={song.id} onClick={()=>openSong(song.id)}><SongArtwork song={song} className="v2-cover-slot"/><strong>{song.title}</strong><small>{song.artist}</small><small className="v2-song-count">{personalized?`내 음역 OPEN · 프로젝트 ${matching}`:`프로젝트 ${projects.length}`}</small></button>)}</div></section>
      <section className="v2-recent"><HomeSectionHeading title="최근 열린 프로젝트"/><div className="v2-project-rows">{[...entries.filter(entry=>entry.isCreated),...entries.filter(entry=>!entry.isCreated&&!entry.publicExample)].slice(0,3).map(entry=><button className="v2-project-row" data-project-id={entry.project.id} key={entry.project.id} onClick={()=>open(entry)}><div className="v2-project-thumbnail"><div className="v2-thumbnail-record">{renderRecord(entry)}</div><SongArtwork song={entry.song} className="v2-thumbnail-sleeve"/></div><span><strong lang={/[가-힣]/.test(entry.song.title)?'ko':'en'}>{entry.song.title}</strong><small>{entry.song.artist}</small><small className="v2-project-count" aria-label={`${entry.participantCount}명 참여 · ${entry.submitted}/${entry.partCount} 제출`}><span className="v2-recent-voices" aria-hidden="true">{entry.project.parts.filter(part=>part.participant||part.participantId).slice(0,4).map(part=><ParticipantKnot key={part.id} participantId={part.participantId} name={part.participant} color={participantColor(part)}/>)}</span>{entry.participantCount}명 참여</small></span><span className="v2-open-roles"><small>{entry.complete?'COMPLETE':'OPEN'}</small>{entry.complete?'완성곡':entry.openParts.map(part=>part.name).join(' · ')||'녹음 중'}</span></button>)}</div></section>
      <section className="v2-completed"><HomeSectionHeading title="완성곡 둘러보기" onAction={()=>openSearch('completed')}/><div className="v2-completed-carousel">{completed.length?completed.map(entry=>{
        const duration=Number.isFinite(entry.mix?.duration)&&entry.mix.duration>0?formatDuration(entry.mix.duration):'—'
        return <button className={`v2-completed-card${entry.publicExample?' v2-completed-public-example':''}`} key={entry.project.id} data-project-id={entry.project.id} onClick={()=>openProject(entry)}>
          <div className={entry.publicExample?'v2-completed-example-artwork':undefined}>{entry.publicExample?<img src="/artwork/home-completed-vinyl-3d.png" width="228" height="228" alt=""/>:renderRecord(entry)}</div>
          <span><small className="v2-completed-status">완성곡</small><strong lang={/[가-힣]/.test(entry.song.title)?'ko':'en'}>{entry.song.title}</strong>
            <small className="v2-completed-meta">{entry.publicExample?'시연 음원':`${entry.partCount}명의 목소리`}</small><small className="v2-completed-duration">{duration}</small>
            <span className="v2-listen"><span className="v2-listen-control" aria-hidden="true"><span className="v2-listen-surface"><img src="/artwork/figma-player-play-surface.svg" width="48" height="48" alt=""/><Icon name="play" size={14.4}/></span></span>완성곡 듣기</span>
          </span>
        </button>
      }):<p className="empty-proof">아직 완성한 곡이 없어요. 마지막 Track 제출 후 완성곡을 들을 수 있어요.</p>}</div></section>
    </main>
  </div>
}
