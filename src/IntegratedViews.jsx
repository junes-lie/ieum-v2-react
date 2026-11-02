import React, {useEffect,useLayoutEffect,useRef,useState} from 'react'
import Icon from './Icons.jsx'
import {songArtwork} from './songArtwork.js'
import {recommendOpenParts} from './matching.js'
import figmaAssets from './figmaAssets.json' with { type: 'json' }
import {CURRENT_USER_ID} from './catalog.js'

// Figma display assets plus the requested presentation knot; never a measured Voice Identity.
const participantKnots = {
  yoonseul: '/artwork/identicon-blue.png',
  doyoon: '/artwork/identicon-coral.png',
  jisun: '/artwork/identicon-green-user-v2.webp',
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
  return <span className="v2-profile-icon" data-profile-state={profile?'present':'absent'} aria-hidden="true">{profile?<img src="/artwork/identicon-green-user-v2.webp" alt="" width="26" height="26"/>:<Icon name="user" size={20}/>}</span>
}

export function SongArtwork({song,className=''}) {
  const src=songArtwork(song)
  return <span className={`v2-song-artwork ${className}`} aria-hidden="true">{src?<img src={src} alt="" loading="lazy" decoding="async" width="256" height="256"/>:<span>{song.title}</span>}</span>
}

export function TurntableFrame({children,playing,onPlay,canPlay,control,housing="/artwork/turntable-housing.webp"}) {
  return <div className="v2-turntable-frame"><img className="v2-turntable-housing" src={housing} width="900" height="900" alt="" decoding="async"/><div className="v2-turntable-live-record">{children}</div>{control}{onPlay&&<button className="v2-turntable-play" data-action="turntable-play" disabled={!canPlay} onClick={onPlay} aria-label={playing?'현재 듣기 일시정지':'현재 듣기 재생'}><img src={canPlay?'/artwork/figma-player-gold-current.svg':'/artwork/figma-player-play-surface.svg'} width="48" height="48" alt="" aria-hidden="true"/><Icon name={playing?'pause':'play'} size={14.4}/></button>}</div>
}

export function ProjectActionButton({onClick,label="프로젝트 보기 →",actionId="open-parts",disabled=false,icon,variant,className=""}) {
  return <button className={`primary v2-project-action ${className}`} data-action={actionId} data-figma-node="1583:54015" data-button-action={variant} disabled={disabled} onClick={onClick}><span className="v2-project-action-surface" aria-hidden="true"/>{icon&&<Icon name={icon} size={18}/>}<span className="v2-project-action-label">{label}</span></button>
}

function RecordSlide({projectId,slot,children}) {
  const ref=useRef(null)
  const animation=useRef(null)
  const positioned=useRef(false)
  useLayoutEffect(()=>{
    // Approved 255px housing: 185px record at (23, 32.2); neighbors remain 172px.
    const target=slot===0?'translate(0px, 0px) scale(1)':`translate(${slot*230+21.066}px, 6.503px) scale(${172/185})`
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
  const ringSrc=direction==='right'?'/artwork/view-all-ring.svg':'/artwork/first-visit-scroll-ring.svg'
  return <button className={`v2-scroll-control v2-scroll-control-${direction}`} type="button" aria-label={label} onClick={onClick}><span className="v2-scroll-art" aria-hidden="true"><img className="v2-scroll-ring" src={ringSrc} width="70" height="70" alt=""/><img className="v2-scroll-arrow" src="/artwork/first-visit-scroll-arrow.svg" width="26" height="26" alt=""/></span></button>
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

export function RecentProjectRow({entry,renderRecord,onOpen}) {
  const roleLabels={'Upper Harmony':'높은 화음','Lower Harmony':'낮은 화음',Tenor:'테너','Vocal B':'보컬 B'}
  const roles=entry.complete?['완성곡']:entry.openParts.map(part=>part.ko||roleLabels[part.name]||part.name)
  return <button className={`v2-project-row${roles.length>2?' v2-project-row-tall':''}`} data-project-id={entry.project.id} data-figma-node="4226:68837" onClick={onOpen}>
    <span className="v2-project-thumbnail"><span className="v2-thumbnail-record">{renderRecord(entry)}</span><SongArtwork song={entry.song} className="v2-thumbnail-sleeve"/></span>
    <span className="v2-project-row-content">
      <span className="v2-project-song-info"><span className="v2-project-title-artist"><strong lang={/[가-힣]/.test(entry.song.title)?'ko':'en'}>{entry.song.title}</strong><small>{entry.song.artist}</small></span><small className="v2-project-count" aria-label={`${entry.participantCount}명 참여 · ${entry.submitted}/${entry.partCount} 제출`}><span className="v2-recent-voices" aria-hidden="true">{entry.project.parts.filter(part=>part.participant||part.participantId).slice(0,4).map(part=><ParticipantKnot key={part.id} participantId={part.participantId} name={part.participant} color={participantColor(part)}/>)}</span>{entry.participantCount}명 참여</small></span>
      <span className="v2-open-roles"><small>{entry.complete?'완성':'모집 중'}</small><span className="v2-role-tags">{(roles.length?roles:['녹음 중']).map(role=><span className="v2-role-tag" key={role}>{role}</span>)}</span></span>
    </span>
  </button>
}

// Touch scroll stays native; mouse/pen dragging must not select text or drag images.
function useCarouselDrag({onSwipe,scroll=false,cardSelector='.v2-completed-card'}) {
  const gesture=useRef(null)
  const moved=useRef(false)
  const finish=(event,cancelled=false)=>{
    const state=gesture.current
    if(!state||state.id!==event.pointerId)return
    const node=event.currentTarget
    gesture.current=null
    delete node.dataset.dragging
    if(node.hasPointerCapture(event.pointerId))node.releasePointerCapture(event.pointerId)
    if(cancelled){moved.current=false;return}
    const dx=event.clientX-state.x,dy=event.clientY-state.y
    if(!scroll&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))onSwipe?.(dx<0?1:-1)
    if(scroll&&moved.current){
      const cards=[...node.querySelectorAll(cardSelector)]
      const max=node.scrollWidth-node.clientWidth
      const stops=cards.map(card=>Math.min(max,Math.max(0,card.getBoundingClientRect().left-node.getBoundingClientRect().left+node.scrollLeft)))
      const left=stops.reduce((best,stop)=>Math.abs(stop-node.scrollLeft)<Math.abs(best-node.scrollLeft)?stop:best,node.scrollLeft===0?0:stops[0]||0)
      node.scrollTo({left,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})
    }
  }
  return {
    onKeyDown:scroll?event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const node=event.currentTarget;node.scrollBy({left:(event.key==='ArrowRight'?1:-1)*((node.querySelector(cardSelector)?.offsetWidth||node.clientWidth)+12),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}}:undefined,
    onDragStart:event=>event.preventDefault(),
    onPointerDown:event=>{
      if(!event.isPrimary||event.button!==0)return
      moved.current=false
      if(scroll&&event.pointerType==='touch')return
      gesture.current={id:event.pointerId,x:event.clientX,y:event.clientY,left:event.currentTarget.scrollLeft}
    },
    onPointerMove:event=>{
      const state=gesture.current
      if(!state||state.id!==event.pointerId)return
      const dx=event.clientX-state.x,dy=event.clientY-state.y
      if(!moved.current&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){
        moved.current=true
        event.currentTarget.setPointerCapture(event.pointerId)
        event.currentTarget.dataset.dragging='true'
      }
      if(moved.current){
        event.preventDefault()
        if(scroll)event.currentTarget.scrollLeft=state.left-dx
      }
    },
    onPointerUp:event=>finish(event),
    onPointerCancel:event=>finish(event,true),
    onLostPointerCapture:()=>{gesture.current=null},
    onClickCapture:event=>{if(moved.current){event.preventDefault();event.stopPropagation();moved.current=false}},
  }
}

export function HomeView({header,profile,startVoiceSetup,entries,songs,renderRecord,renderPreview,openSong,openProject,openSearch,openCreateProject,formatDuration}) {
  const recruiting=entries.filter(entry=>!entry.complete&&entry.openParts.length).sort((a,b)=>Number(Boolean(b.project.presentationFinale))-Number(Boolean(a.project.presentationFinale)))
  const completed=entries.filter(entry=>entry.complete)
  const hasRange=Number.isFinite(profile?.rangeData?.lowMidi)&&Number.isFinite(profile?.rangeData?.highMidi)
  const songOptions=songs.map(song=>({song,projects:entries.filter(entry=>entry.song.id===song.id&&!entry.publicExample)}))
    .map(item=>({...item,matchingParts:hasRange?recommendOpenParts(profile.rangeData,item.projects.map(entry=>entry.project)):[]}))
  const rangeOptions=hasRange?songOptions.filter(item=>item.matchingParts.length>0):[]
  const personalized=rangeOptions.length>0
  const recommended=personalized?rangeOptions:songOptions
  const [index,setIndex]=useState(0)
  const [direction,setDirection]=useState(0)
  const selectedIndex=recruiting.length?((index%recruiting.length)+recruiting.length)%recruiting.length:0
  const selected=recruiting[selectedIndex]
  const previous=recruiting[(selectedIndex-1+recruiting.length)%recruiting.length]
  const next=recruiting[(selectedIndex+1)%recruiting.length]
  const change=delta=>{setDirection(delta);setIndex(current=>current+delta)}
  const recruitmentDrag=useCarouselDrag({onSwipe:change})
  const completedDrag=useCarouselDrag({scroll:true})
  const recommendedDrag=useCarouselDrag({scroll:true,cardSelector:'.v2-song-card'})
  // Stable virtual positions retain each live Canvas as it travels between slots.
  // The outer two records enter/leave beyond the clipped carousel viewport.
  const slides=selected?Array.from({length:recruiting.length>1?5:1},(_,offset)=>{
    const slot=recruiting.length>1?offset-2:0
    const position=index+slot
    return {slot,position,entry:recruiting[((position%recruiting.length)+recruiting.length)%recruiting.length]}
  }):[]
  const open=entry=>entry.complete?openProject(entry):openSong(entry.song.id,entry.project.id)
  return <div className="screen figma-v2 home-v2-screen" data-screen-id="01">
    <section className="v2-hero"><img className="v2-hero-artwork" src="/artwork/home-hero-current.png" width="430" height="556" alt="" fetchPriority="high"/>{header}<div className="v2-hero-copy"><h1>다른 목소리,<br/>하나의 노래.</h1><p>함께 부를 곡을 고르고,<br/>당신의 목소리를 더해보세요.</p></div>
      <section className="v2-first-visit-guide v2-intro-guide" aria-label="함께 노래를 완성하는 방법">
        <div className="v2-first-visit-row">
          <div className="v2-first-visit-copy"><h2>한 곡을 나눠 부르고,<br/>함께 완성해요.</h2><p>마음에 드는 곡에서 내가 부를 파트를 골라요.<br/>각자의 목소리를 녹음해 한 곡을 완성해요.</p></div>
          <CircularScrollControl label="함께 부를 곡 목록으로 이동" onClick={()=>{
            const target=document.getElementById('recruiting-projects')
            target?.focus({preventScroll:true})
            target?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})
          }}/>
        </div>
      </section>
    </section>
    <main>
      <section className="v2-recruitment" id="recruiting-projects" tabIndex={-1}>
        <div className="v2-recruitment-heading"><HomeSectionHeading title="함께 부를 사람을 찾고 있어요" note="마음에 드는 곡에 목소리를 더해보세요." onAction={()=>openSearch('projects')}/></div>
        {selected?<div className="v2-recruitment-feature"><div className="v2-recruitment-media">
          <div className="v2-recruitment-player">
          <div className="v2-turntable-stage" role="group" aria-label="모집 프로젝트 레코드 탐색" data-direction={direction} {...recruitmentDrag}>
            {recruiting.length>1&&<button className="v2-carousel-neighbor v2-carousel-neighbor-previous" aria-label={`이전 프로젝트 선택: ${previous.song.title}`} onClick={()=>change(-1)}/>}
            <div className="v2-recruit-record" data-project-id={selected.project.id}><TurntableFrame housing="/artwork/turntable-housing-current.png" control={renderPreview?.(selected)}>{slides.map(({slot,position,entry})=><RecordSlide key={position} projectId={entry.project.id} slot={slot}>{renderRecord(entry,{recruitment:true})}</RecordSlide>)}</TurntableFrame></div>
            {recruiting.length>1&&<button className="v2-carousel-neighbor v2-carousel-neighbor-next" aria-label={`다음 프로젝트 선택: ${next.song.title}`} onClick={()=>change(1)}/>}
          </div><div className="v2-recruit-info"><SongArtwork song={selected.song} className="v2-recruit-jacket"/><div className="v2-recruit-copy"><h3 lang={/[가-힣]/.test(selected.song.title)?'ko':'en'}>{selected.song.title}</h3><p><span className="v2-recruit-open">OPEN · {selected.openParts.map(part=>part.name).join(' · ')}</span><span>{selected.participantCount}명 참여</span></p></div></div></div></div><div className="v2-carousel-nav" role="group" aria-label="모집 프로젝트 선택">{recruiting.map((entry,position)=><button key={entry.project.id} type="button" aria-label={`${position+1}번째 프로젝트: ${entry.song.title}`} aria-current={position===selectedIndex?'true':undefined} onClick={()=>change(position-selectedIndex)}><span/></button>)}</div><ProjectActionButton label="프로젝트 보기" onClick={()=>open(selected)}/></div>:<p className="empty-proof">현재 모집 중인 프로젝트가 없어요.</p>}
      </section>
      <section className="v2-recommended" data-recommendation-mode={personalized?'range':'general'}>
        <div className="v2-recommended-heading">
          <HomeSectionHeading title={personalized?"내 음역에 맞는 Part":"어떤 곡으로 시작할까요"} onAction={()=>openSearch('songs')} note={profile?(!hasRange?'내 목소리를 등록하면 음역에 맞는 파트를 추천해요.':personalized?`${profile.demo?'시연 프로필의':'등록된'} 음역 안에 OPEN Part가 있는 곡이에요.`:'음역이 확인된 OPEN Part가 없어 전체 곡을 보여드려요.'):undefined}/>
          {!profile&&<div className="v2-recommended-registration">
            {startVoiceSetup&&<button className="secondary v2-profile-register" data-action="home-voice-setup" onClick={startVoiceSetup}>보이스 프로필 등록하기</button>}
            <p className="v2-section-note">내 목소리를 등록하면 음역과 취향에 맞는 곡을 추천해요.</p>
          </div>}
        </div>
        <div className="v2-song-grid" role="region" aria-label="추천곡 목록" tabIndex={0} {...recommendedDrag}>
          {recommended.map(({song,matchingParts})=><button className="v2-song-card" key={song.id} onClick={()=>openSong(song.id,matchingParts[0]?.projectId,matchingParts[0]?.partId)}><SongArtwork song={song} className="v2-cover-slot"/><strong>{song.title}</strong><small>{song.artist}</small>{personalized&&<small className="v2-song-count">{`${matchingParts.map(part=>part.partName).filter(Boolean).filter((name,index,names)=>names.indexOf(name)===index).join(" · ")} · OPEN ${matchingParts.length}`}</small>}</button>)}
        </div>
      </section>
      <section className="v2-recent"><HomeSectionHeading title="최근 열린 프로젝트" onAction={()=>openSearch('projects')}/><div className="v2-project-rows">{[...entries.filter(entry=>entry.isCreated),...entries.filter(entry=>!entry.isCreated&&!entry.publicExample)].slice(0,3).map(entry=><RecentProjectRow key={entry.project.id} entry={entry} renderRecord={renderRecord} onOpen={()=>open(entry)}/>)}</div></section>
      <section className="v2-completed"><HomeSectionHeading title="완성곡 둘러보기" onAction={()=>openSearch('completed')}/><div className="v2-completed-carousel" role="region" aria-label="완성곡 목록" tabIndex={0} {...completedDrag} onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const node=event.currentTarget;node.scrollBy({left:(event.key==='ArrowRight'?1:-1)*(node.querySelector('.v2-completed-card')?.offsetWidth+12||node.clientWidth),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}}}>{completed.length?completed.map(entry=>{
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
