import React, { useEffect, useRef, useState } from 'react'
import {
  analyzeBlob,
  audioRuntime,
  cancelRecording,
  createAutoMix,
  getMicrophoneDiagnostics,
  isMicrophonePermissionError,
  microphoneErrorMessage,
  monitorInput,
  pauseRecording,
  playCurrentMix,
  requestMicrophone,
  resumeRecording,
  startRecording,
  stopGuides,
  stopMicrophone,
  stopRecording
} from './audio.js'
import { buildVoiceLayer, projectRecordSignature } from './voiceAnalysis.js'
import { clearProjectTracks, loadProjectTracks, saveTrack } from './trackStore.js'
import { createProjectModel, SUPPORTED_PART_COUNTS } from './projectModel.js'
import { CURRENT_USER_ID, PEOPLE, PERSON_BY_ID, SAMPLE_SONGS, personFromName } from './catalog.js'

const PART_CATALOG = [
  { id: 'soprano', name: 'Soprano', ko: '소프라노', color: '#3b82f6', range: 'C4–F5', participantId:'yoonseul', participant: '윤슬', status: 'accepted', duration: null },
  { id: 'alto', name: 'Alto', ko: '알토', color: '#f16f61', range: 'G3–C5', participantId:'doyoon', participant: '도윤', status: 'accepted', duration: null },
  { id: 'tenor', name: 'Tenor', ko: '테너', color: '#d6b895', range: 'C3–G4', participant: null, status: 'open', duration: null },
  { id: 'bass', name: 'Bass', ko: '베이스', color: '#2eb6ad', range: 'E2–C4', participant: null, status: 'recruiting', duration: null }
]
const PROJECT = createProjectModel({
  id:'ieum-thousand-years-v7',
  seed:'ieum:thousand-years:original-c:0048',
  partIds:['soprano','alto','tenor','bass'],
  catalog:PART_CATALOG
})
const PROJECT_ID = PROJECT.id
const PROJECT_SEED = PROJECT.seed
const SONG_ID = 'a-thousand-years'
const PARTS = PROJECT.parts
const USER_PART_ID = 'tenor'

const SONGS = [
  { id:SONG_ID, title:'A Thousand Years', artist:'Christina Perri', year:'2011', genre:'Pop ballad', duration:'04:45', note:'긴 호흡과 겹겹이 쌓이는 화음이 어울리는 곡이에요.', projects:[
    { id:PROJECT_ID, name:'Original C · Quartet', key:'C major', status:'RECORDING', progress:2, partCount:4, seed:PROJECT_SEED },
    { id:'a-thousand-warm-duet', name:'Warm Duet', key:'B♭ major', status:'RECRUITING', progress:1, partCount:2, seed:'ieum:a-thousand:warm-duet', parts:[{id:'vocal-a',name:'Vocal A',color:'#f16f61',participantId:'mina',participant:'Mina',status:'submitted',duration:'03:58'},{id:'vocal-b',name:'Vocal B',color:'#2eb6ad',participant:null,status:'open'}] }
  ]},
  { id:'ocean-eyes', title:'Ocean Eyes', artist:'Billie Eilish', year:'2016', genre:'Dream pop', duration:'03:20', note:'가벼운 호흡과 섬세한 다이내믹을 살펴볼 수 있어요.', projects:[
    { id:'ocean-eyes-airy-trio', name:'Airy Trio', key:'E minor', status:'RECRUITING', progress:1, partCount:3, seed:'ieum:ocean:airy-trio', parts:[{id:'lead',name:'Lead',color:'#3b82f6',participantId:'sena',participant:'Sena',status:'submitted',duration:'03:18'},{id:'upper',name:'Upper Harmony',color:'#f16f61',participant:null,status:'open'},{id:'lower',name:'Lower Harmony',color:'#2eb6ad',participant:null,status:'recruiting'}]},
    { id:'ocean-eyes-duet', name:'Low-key Duet', key:'D minor', status:'RECRUITING', progress:1, partCount:2, seed:'ieum:ocean:duet', parts:[{id:'vocal-a',name:'Vocal A',color:'#d6b895',participantId:'noa',participant:'Noa',status:'submitted',duration:'03:21'},{id:'vocal-b',name:'Vocal B',color:'#2eb6ad',participant:null,status:'open'}] }
  ]},
  { id:'love-poem', title:'Love Poem', artist:'IU', year:'2019', genre:'K-pop ballad', duration:'04:18', note:'넓은 음역과 후반부의 힘 있는 레이어가 특징이에요.', projects:[
    { id:'love-poem-four-voices', name:'Four Voices', key:'E major', status:'RECRUITING', progress:2, partCount:4, seed:'ieum:love-poem:four', parts:[{id:'lead',name:'Lead',color:'#3b82f6',participantId:'haru',participant:'Haru',status:'submitted',duration:'04:15'},{id:'alto',name:'Alto',color:'#f16f61',participantId:'yun',participant:'Yun',status:'submitted',duration:'04:16'},{id:'tenor',name:'Tenor',color:'#d6b895',participant:null,status:'open'},{id:'bass',name:'Bass',color:'#2eb6ad',participant:null,status:'recruiting'}] }
  ]},
  { id:'city-of-stars', title:'City of Stars', artist:'La La Land Cast', year:'2016', genre:'Film soundtrack', duration:'02:29', note:'두 음색의 여백과 낮은 다이내믹이 잘 드러나는 곡이에요.', projects:[
    { id:'city-of-stars-duet', name:'Night Duet', key:'D minor', status:'RECRUITING', progress:1, partCount:2, seed:'ieum:city-stars:duet', parts:[{id:'vocal-a',name:'Vocal A',color:'#d6b895',participantId:'joon',participant:'Joon',status:'submitted',duration:'02:27'},{id:'vocal-b',name:'Vocal B',color:'#3b82f6',participant:null,status:'open'}] }
  ]}
]
const TOTAL_PARTS = PARTS.length
const INITIAL_DEMO_PARTS = new Set(['soprano','alto'])
const APP_STATE_KEY = 'ieum-v2:user-state:v7'
const PROFILE_PROJECT_ID = 'ieum-v2:voice-profile:v7'
const RANGE_RECORD_ID = `${PROFILE_PROJECT_ID}:range`
const SAMPLE_RECORD_ID = `${PROFILE_PROJECT_ID}:sample`
const MIX_RECORD_ID = `${PROJECT_ID}:auto-mix`
const COMPLETION_DELAY_MS = 7 * 24 * 60 * 60 * 1000

const loadUserState = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(APP_STATE_KEY) || '{}')
    const legacyCollection = Array.isArray(parsed.collection)
      ? parsed.collection
      : parsed.saved ? [{ projectId:PROJECT_ID, savedAt:parsed.savedAt || new Date().toISOString() }] : []
    const songSaves = Array.isArray(parsed.songSaves)
      ? parsed.songSaves
      : legacyCollection.length ? [{ songId:SONG_ID, savedAt:legacyCollection[0].savedAt || new Date().toISOString() }] : []
    return {
      joined:false, joinedPart:USER_PART_ID, invited:false, invitedVocalId:null, candidateAccepted:false,
      projectLikes:[], vocalSaves:[], songSaves, createdProjects:[], projectActivity:{}, delayNotified:{}, ...parsed,
      projectLikes:Array.isArray(parsed.projectLikes) ? parsed.projectLikes : [],
      vocalSaves:Array.isArray(parsed.vocalSaves) ? parsed.vocalSaves : [],
      createdProjects:Array.isArray(parsed.createdProjects) ? parsed.createdProjects : [],
      projectActivity:parsed.projectActivity && typeof parsed.projectActivity==='object' ? parsed.projectActivity : {},
      delayNotified:parsed.delayNotified && typeof parsed.delayNotified==='object' ? parsed.delayNotified : {}, songSaves
    }
  }
  catch { return { joined:false, joinedPart:USER_PART_ID, invited:false, invitedVocalId:null, candidateAccepted:false, projectLikes:[], vocalSaves:[], songSaves:[], createdProjects:[], projectActivity:{}, delayNotified:{} } }
}
const saveUserState = value => localStorage.setItem(APP_STATE_KEY, JSON.stringify(value))
const midiToNote = midi => {
  const value = Math.round(midi)
  const names = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B']
  return `${names[((value % 12) + 12) % 12]}${Math.floor(value / 12) - 1}`
}
const fmt = seconds => {
  const value = Math.max(0, Number(seconds) || 0)
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`
}

async function loadDisclosedDemoTrack(entry) {
  const response = await fetch(entry.file)
  if (!response.ok) throw new Error(`데모 Track을 불러오지 못했습니다: ${entry.partId}`)
  const blob = await response.blob()
  const analyzed = await analyzeBlob(blob)
  return {
    id:`${PROJECT_ID}:${entry.partId}`,
    projectId:PROJECT_ID,
    projectSeed:PROJECT_SEED,
    partId:entry.partId,
    partIndex:PARTS.findIndex(part=>part.id===entry.partId),
    participantId:entry.participantId || personFromName(entry.participant)?.id || null,
    participant:entry.participant,
    blob,
    mimeType:blob.type || 'audio/wav',
    duration:analyzed.duration,
    syncOffsetMs:0,
    features:analyzed.features,
    layer:buildVoiceLayer(PROJECT_SEED,entry.partId,analyzed.features),
    origin:'local-formant-singing-demo',
    demo:true,
    source:entry.source,
    disclosure:entry.disclosure,
    createdAt:new Date().toISOString()
  }
}

async function loadDemoTrackByPart(partId) {
  const response = await fetch('/demo-stems/manifest.json')
  if (!response.ok) throw new Error('데모 Track manifest 없음')
  const manifest = await response.json()
  const entry = manifest.tracks.find(track=>track.partId===partId)
  if (!entry) throw new Error(`${partId} 데모 Track 없음`)
  return loadDisclosedDemoTrack(entry)
}

function Icon({ name, size = 20 }) {
  const paths = {
    back: <path d="m15 18-6-6 6-6" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    play: <path d="m9 7 8 5-8 5Z" fill="currentColor" stroke="none" />,
    pause: <><path d="M9 7v10M15 7v10" /></>,
    stop: <rect x="8" y="8" width="8" height="8" fill="currentColor" stroke="none" />,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    share: <><path d="M12 16V4m0 0L8 8m4-4 4 4" /><path d="M5 13v6h14v-6" /></>,
    heart: <path d="M20 8.5C20 14 12 19 12 19S4 14 4 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 2.5Z" />,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />,
    home: <><path d="m4 11 8-7 8 7" /><path d="M6 10v10h12V10M10 20v-6h4v6" /></>,
    folder: <path d="M3 7h7l2 2h9v10H3Z" />,
    bookmark: <path d="M6 4h12v17l-6-4-6 4Z" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 4-7 8-7s7 2 8 7" /></>,
    sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
    headphones: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v6H4ZM17 14h3v6h-3Z" /></>
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function TopBar({ title, meta, back, action, onAction }) {
  return <header className="topbar">
    {back ? <button className="icon-btn" aria-label="뒤로" data-action="back" onClick={back}><Icon name="back" /></button> : <div className="wordmark">IEUM</div>}
    <div className="topbar-center">{title}</div>
    {action ? <button className="text-action" onClick={onAction}>{action}</button> : <span className="top-meta">{meta}</span>}
  </header>
}

function VoiceIdentity({ identity }) {
  if (!identity?.image) return <figure className="voice-identity pending" aria-label="Voice Identity 생성 대기">
    <div><span>VOICE IDENTITY</span><strong>생성형 AI 미검증</strong><small>대표 Voice Sample은 저장됐지만 무료·로컬 생성 모델이 연결되지 않았습니다.</small></div>
  </figure>
  return <figure className="voice-identity" data-identity-model={identity.model || ''}>
    <img src={identity.image} alt="대표 Voice Sample로 생성한 Voice Identity" />
    <figcaption>{identity.model} · {identity.sourceFingerprint}</figcaption>
  </figure>
}

function ResonanceRecord({ active = [true, false, true, false], layers = [], activePartIndex = 1, state = 'rest', level = 0, seed = PROJECT_SEED, label, compact = false }) {
  const canvasRef = useRef(null)
  const levelRef = useRef(level)
  useEffect(() => { levelRef.current = level }, [level])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    let frame = 0, raf = 0, lastPaint = 0
    const resize = () => {
      const size = canvas.clientWidth
      if (size < 8) return false
      canvas.width = size * ratio
      canvas.height = size * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      return true
    }
    resize()
    const numericSeed = typeof seed === 'number' ? seed : [...String(seed)].reduce((sum,char,index)=>sum+char.charCodeAt(0)*(index+17),0)
    const random = value => {
      const x = Math.sin(value * 12.9898 + numericSeed * 0.0147) * 43758.5453
      return x - Math.floor(x)
    }
    const colors = ['59,130,246','241,111,97','214,184,149','46,182,173']
    const draw = (now = 0) => {
      if (now && now - lastPaint < 32) { raf = requestAnimationFrame(draw); return }
      if (now) lastPaint = now
      const size = canvas.clientWidth
      if (size < 8) return
      const center = size / 2
      const radius = center - 4
      ctx.clearRect(0, 0, size, size)
      const base = ctx.createRadialGradient(center * .82, center * .72, 0, center, center, radius)
      base.addColorStop(0, '#312923'); base.addColorStop(.18, '#1a1512'); base.addColorStop(.58, '#0f0c0a'); base.addColorStop(.9, '#080706'); base.addColorStop(1, '#030302')
      ctx.beginPath(); ctx.arc(center, center, radius, 0, Math.PI * 2); ctx.fillStyle = base; ctx.fill()
      ctx.save(); ctx.beginPath(); ctx.arc(center, center, radius - 1, 0, Math.PI * 2); ctx.clip()
      for (let r = radius * .22; r < radius * .97; r += 3.2) {
        ctx.beginPath(); ctx.arc(center, center, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(236,230,220,${.025 + (r % 9) * .0015})`; ctx.lineWidth = .65; ctx.stroke()
      }
      const layerSlots = layers.length ? PARTS.map((part,voice) => layers.find(layer => layer?.partId === part.id) || { inactive:true, partId:part.id, seed:numericSeed+voice*97, baseRadius:[.72,.59,.48,.35][voice], spread:.035, turbulence:.28, filamentCount:5, particleCount:22, opacity:.035, phase:voice }) : active.map((enabled,voice) => ({ inactive:!enabled, partId: PARTS[voice]?.id, seed: numericSeed + voice * 97, baseRadius: [.72,.59,.48,.35][voice], spread:enabled?.08:.035, turbulence:enabled?.7:.28, filamentCount:enabled?15:5, particleCount:enabled?90:22, opacity:enabled?.32:.035, phase:voice }))
      layerSlots.forEach((storedLayer, voice) => {
        const isLive = state === 'recording' && voice === activePartIndex
        const enabled = Boolean(storedLayer) || isLive
        if (!enabled) return
        const layer = storedLayer || { seed:numericSeed + voice * 997, baseRadius:[.72,.59,.48,.35][voice], spread:.08, turbulence:1, filamentCount:12, particleCount:58, opacity:.28, phase:voice }
        const inactive = Boolean(layer.inactive) && !isLive
        const liveLevel = levelRef.current
        const energy = inactive ? .12 : isLive ? .72 + liveLevel * .9 : state === 'playing' ? .78 : .64
        const baseRadius = radius * (.25 + (layer.baseRadius || .5) * .72)
        const lineCount = inactive ? 4 : Math.max(9, Math.min(17, (layer.filamentCount || 12) + 2))
        ctx.save()
        ctx.globalCompositeOperation = 'screen'
        for (let ribbon = 0; ribbon < 3; ribbon++) {
          const points = 86
          ctx.beginPath()
          for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2 + frame * (voice % 2 ? -.00028 : .00022)
            const crest = Math.pow((Math.sin(angle * 2 + layer.phase + voice * .7) + 1) / 2, 2.1)
            const wave = Math.sin(angle * (5 + layer.turbulence) + ribbon * 1.7 + layer.phase) * (5 + layer.turbulence * 3)
            const envelope = layer.envelope?.[Math.floor((i / points) * layer.envelope.length)] || .35
            const rr = baseRadius + (ribbon - 1) * 7 + wave + crest * radius * (.055 + layer.spread * .45) + envelope * 8
            const x = center + Math.cos(angle) * rr
            const y = center + Math.sin(angle) * rr
            if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y)
          }
          ctx.strokeStyle = `rgba(${colors[voice]},${.018 + (layer.opacity || .3) * .04 + energy * .012})`
          ctx.lineWidth = .8 + ribbon * .45
          ctx.stroke()
        }
        for (let line = 0; line < lineCount; line++) {
          const points = 104
          ctx.beginPath()
          for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2 + frame * (voice % 2 ? -.00028 : .00022)
            const noise = Math.sin(angle * (5 + layer.turbulence) + line * .57 + layer.phase) * (2.6 + layer.turbulence * 2.8)
              + Math.sin(angle * (13 + voice) + layer.seed * .0003) * (1.8 + layer.spread * 12)
              + (random(i + line * 211 + voice * 79 + layer.seed) - .5) * (2.4 + layer.turbulence)
            const pulse = isLive ? Math.sin(angle * 9 + frame * .05) * liveLevel * 12 : 0
            const envelope = layer.envelope?.[Math.floor((i / points) * layer.envelope.length)] || .35
            const spiral = ((i / points) - .5) * radius * .075
            const rr = baseRadius + spiral + (line - lineCount/2) * (1.05 + layer.spread * 8) + (noise + pulse + envelope * 5) * energy
            const x = center + Math.cos(angle) * rr * (1 + .028 * Math.sin(angle * 3 + voice))
            const y = center + Math.sin(angle) * rr
            if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y)
          }
          ctx.strokeStyle = `rgba(${colors[voice]},${.075 + (layer.opacity || .3) * .2 + energy * .045 + (line % 5) * .009})`
          ctx.lineWidth = .45 + (line % 4) * .22
          ctx.stroke()
        }
        const density = compact ? .62 : 1
        const particles = Math.round((inactive ? 38 : Math.min(300, Math.max(140, (layer.particleCount || 58) * 3.15))) * density)
        for (let p = 0; p < particles; p++) {
          const angle = random(p + voice * 401 + layer.seed) * Math.PI * 2 + frame * (voice%2?-.00032:.00028)
          const arm = Math.pow((Math.sin(angle * 2 + layer.phase + voice * .7) + 1) / 2, 2.2)
          const rr = baseRadius + (random(p * 7 + voice + layer.seed) - .5) * radius * (.18 + arm * .34) + Math.sin(angle*5+p)*6
          const alpha = (.08 + random(p + numericSeed + layer.seed) * .42) * (.18 + arm * .82)
          const dot = .38 + random(p * 13) * 1.32
          ctx.fillStyle = `rgba(${colors[voice]},${alpha * energy})`
          ctx.fillRect(center + Math.cos(angle) * rr, center + Math.sin(angle) * rr, dot, dot)
          if (p % 17 === 0) {
            ctx.beginPath(); ctx.arc(center + Math.cos(angle) * rr, center + Math.sin(angle) * rr, 1.1 + random(p * 19) * 1.4, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${colors[voice]},${Math.min(.72,alpha * energy * 1.7)})`; ctx.fill()
          }
        }
        ctx.restore()
      })
      if (state === 'recording') {
        const voice = Math.max(0,activePartIndex), liveColor = colors[voice]
        const liveLevel = levelRef.current
        ctx.save(); ctx.globalCompositeOperation='source-over'
        for(let stream=0;stream<9;stream++){
          const drift=(stream-4)*2.2
          ctx.beginPath();ctx.moveTo(center+drift,size+8)
          ctx.bezierCurveTo(center+drift*3,size*.82,center+Math.sin(stream)*18,size*.68,center+Math.cos(stream)*10,center+radius*.56)
          ctx.strokeStyle=`rgba(${liveColor},${.045+liveLevel*.14})`;ctx.lineWidth=.6+(stream%3)*.25;ctx.stroke()
        }
        ctx.restore()
      }
      const sheen = ctx.createLinearGradient(0, 0, size, size)
      sheen.addColorStop(.2, 'rgba(236,230,220,0)'); sheen.addColorStop(.48, 'rgba(236,230,220,.055)'); sheen.addColorStop(.56, 'rgba(236,230,220,0)')
      ctx.fillStyle = sheen; ctx.fillRect(0, 0, size, size)
      ctx.restore()
      const hub = ctx.createRadialGradient(center * .93, center * .91, 2, center, center, radius * .2)
      hub.addColorStop(0, '#3a312b'); hub.addColorStop(.35, '#171310'); hub.addColorStop(1, '#080706')
      ctx.beginPath(); ctx.arc(center, center, radius * .2, 0, Math.PI * 2); ctx.fillStyle = hub; ctx.fill(); ctx.strokeStyle = 'rgba(236,230,220,.12)'; ctx.stroke()
      ctx.beginPath(); ctx.arc(center, center, radius * .035, 0, Math.PI * 2); ctx.fillStyle = '#050403'; ctx.fill()
      frame++
      if (state === 'playing' || state === 'recording' || state === 'processing') raf = requestAnimationFrame(draw)
    }
    draw()
    const observer = new ResizeObserver(() => { cancelAnimationFrame(raf); if (resize()) draw() })
    observer.observe(canvas)
    return () => { observer.disconnect(); cancelAnimationFrame(raf) }
  }, [active.join(','), layers.map(layer=>layer?.signature||'').join(','), activePartIndex, state, seed])
  const layerCount = layers.length ? layers.filter(Boolean).length : active.filter(Boolean).length
  return <figure className={`record ${compact ? 'record-compact' : ''}`} data-state={state} data-record-signature={projectRecordSignature(String(seed),layers)} aria-label={label || `공명 레코드, ${layerCount}개 Track 활성`}>
    <canvas ref={canvasRef} />
    {state === 'processing' && <div className="record-processing">MIX</div>}
  </figure>
}

function PartRow({ part, action, actionLabel, included, onToggle, onPlay, onParticipant, urgent = false }) {
  const participantLabel = part.participant ? `${part.participant}${part.demo ? ' · LOCAL DEMO' : ''}` : (part.status === 'open' ? 'Open part' : part.status === 'recruiting' ? 'Vocal finder' : 'Unassigned')
  const stateLabel = part.duration || (part.status === 'submitted' ? 'SUBMITTED' : part.status === 'accepted' ? 'TRACK WAIT' : part.status === 'ready' ? 'MY PART' : part.status === 'open' ? 'OPEN' : part.status === 'recruiting' ? 'FIND' : 'WAIT')
  return <div className={`part-row ${urgent?'part-row-urgent':''}`} data-part={part.id}>
    <span className="voice-dot" style={{ '--voice': part.color }} />
    <div className="row-main">
      {onPlay ? <button className="row-track-play" onClick={onPlay}>{part.name} <Icon name="play" size={12}/></button> : <strong>{part.name}</strong>}
      {onParticipant ? <button className="row-participant" onClick={onParticipant}>{participantLabel} ↗</button> : <span>{participantLabel}</span>}
    </div>
    <span className="row-state">{stateLabel}</span>
    {typeof included === 'boolean' ? <button className={`include-toggle ${included ? 'on' : ''}`} aria-pressed={included} aria-label={`${part.name} 현재 믹스 ${included ? '제외' : '포함'}`} onClick={onToggle}><span /></button>
      : actionLabel ? <button className="row-action" onClick={action}>{actionLabel}</button> : <span className="row-check" aria-hidden="true">{part.status === 'submitted' && <Icon name="check" size={18} />}</span>}
  </div>
}

function BottomNav({ current, go }) {
  const items = [['home','홈'],['folder','프로젝트'],['bookmark','컬렉션'],['user','MY']]
  return <nav className="bottom-nav" aria-label="주요 메뉴">
    {items.map(([icon,label]) => <button key={icon} data-nav={icon} className={current === icon ? 'active' : ''} onClick={() => go(icon)}><Icon name={icon} size={19}/><span>{label}</span></button>)}
  </nav>
}

function Home({ openSong, layers, projectTracks, profile, mix, openCreateProject, openComplete }) {
  const [query,setQuery] = useState('')
  const submitted = layers.filter(Boolean).length
  const demoCount = Object.values(projectTracks).filter(track=>track.demo).length
  const openCount = TOTAL_PARTS - submitted
  const searchResults = query.trim() ? SONGS.filter(song=>`${song.title} ${song.artist} ${song.genre}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) : []
  return <div className="screen home-screen">
    <TopBar meta="VINYL V2" />
    <main>
      <section className="compact-search"><Icon name="search" size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="곡, 아티스트, 장르 검색" aria-label="곡, 아티스트, 장르 검색"/></section>
      {query && <section className="search-results" aria-label="검색 결과">{searchResults.length?searchResults.map(song=><button key={song.id} onClick={()=>openSong(song.id)}><span>{song.title}</span><small>{song.artist} · {song.genre}</small></button>):<p>일치하는 곡이 없어요.</p>}</section>}
      <section className="home-intro">
        <div>
          <p className="kicker">Different voices, one song</p>
          <h1>한 곡에 필요한<br/>목소리를 함께 채워요.</h1>
          <p>빈 Part에 참여하면 내 녹음이 독립 Track으로 더해집니다.</p>
          <div className="home-actions"><button className="primary" data-action="open-parts" onClick={() => openSong(SONG_ID)}>OPEN Part 찾기 <Icon name="search"/></button><button className="secondary" data-action="create-project" onClick={openCreateProject}>새 프로젝트 만들기</button></div>
        </div>
        <div className="demo-record">
          <ResonanceRecord layers={layers} compact seed={PROJECT_SEED} label={`A Thousand Years, 네 파트 중 ${submitted}개 제출 Track 분석 완료`}/>
          <span className="demo-count">{String(submitted).padStart(2,'0')}/04 <small>TRACKS</small></span>
        </div>
      </section>
      <section className="content-section">
        <div className="section-head"><h2>파트 모집 중</h2><span>3 projects</span></div>
        <button className="project-feature" onClick={() => openSong(SONG_ID)}>
          <ResonanceRecord layers={layers} compact seed={PROJECT_SEED} />
          <span><small>{String(submitted).padStart(2,'0')}/04 · OPEN</small><strong>A Thousand Years</strong><em>{demoCount}개 출처 표시 시연 Track · {openCount} Parts OPEN</em></span>
        </button>
        <button className="project-line" onClick={() => openSong('city-of-stars')}><span>City of Stars · Night Duet</span><small>01/02 · Vocal B OPEN</small></button>
        <button className="project-line" onClick={() => openSong('love-poem')}><span>Love Poem · Four Voices</span><small>02/04 · Tenor OPEN</small></button>
      </section>
      <section className="content-section for-you">
        <div className="section-head"><h2>For you</h2><span>{profile?'내 편한 음역 기준':'Voice Profile을 만들면 음역 기준 추천'}</span></div>
        <button className="song-row" onClick={()=>openSong('ocean-eyes')}><span className="song-index">01</span><span><strong>Ocean Eyes</strong><small>{profile?'참여 가능한 OPEN Part · 2':'관련 프로젝트 · 2'}</small></span><span>↗</span></button>
        <button className="song-row" onClick={()=>openSong('love-poem')}><span className="song-index">02</span><span><strong>Love Poem</strong><small>{profile?'참여 가능한 OPEN Part · 1':'관련 프로젝트 · 1'}</small></span><span>↗</span></button>
      </section>
      <section className="content-section"><div className="section-head"><h2>최근 열린 프로젝트</h2><span>New sessions</span></div><button className="project-line" onClick={()=>openSong('ocean-eyes')}><span>Ocean Eyes · Airy Trio</span><small>Lead Track 도착</small></button><button className="project-line" onClick={()=>openSong('city-of-stars')}><span>City of Stars · Night Duet</span><small>Vocal B 모집 중</small></button></section>
      <section className="content-section"><div className="section-head"><h2>완성된 곡</h2><span>Listening proof</span></div>{mix?<button className="project-line" onClick={openComplete}><span>A Thousand Years · Original C</span><small>04/04 · COMPLETE · 완성곡 듣기</small></button>:<p className="empty-proof">아직 이 브라우저에서 완성한 곡이 없어요. 마지막 Track이 제출되면 여기에 완성곡이 나타납니다.</p>}</section>
    </main>
  </div>
}

function Detail({ go, back, song, profile, join, layers, projectTracks, songSaved, toggleSongSave, openVocalProfile, createdProjects, onCreateProject, onOpenCreatedProject, initialProjectId }) {
  const [selectedProjectId,setSelectedProjectId] = useState(initialProjectId || song.projects[0].id)
  const [selectedPartId,setSelectedPartId] = useState(USER_PART_ID)
  useEffect(() => { setSelectedProjectId(initialProjectId || song.projects[0].id); setSelectedPartId(initialProjectId ? '' : USER_PART_ID) }, [song.id,initialProjectId])
  const allProjects = [...song.projects,...createdProjects.filter(project=>project.songId===song.id)]
  const selectedProject = allProjects.find(project=>project.id===selectedProjectId) || allProjects[0]
  const isLiveProject = selectedProject.id === PROJECT_ID
  const liveSubmitted = Object.keys(projectTracks).length
  const submitted = isLiveProject ? liveSubmitted : selectedProject.progress
  const projectLayers = isLiveProject ? layers : []
  const staticActive = Array.from({length:selectedProject.partCount},(_,index)=>index<submitted)
  const emptyProjectParts = PART_CATALOG.slice(0,selectedProject.partCount).map(part=>({...part,participantId:null,participant:null,status:'open',duration:null}))
  const displayParts = isLiveProject
    ? PARTS.map(part => projectTracks[part.id] ? {...part,participantId:projectTracks[part.id].participantId || personFromName(projectTracks[part.id].participant)?.id,participant:projectTracks[part.id].participant,status:'submitted',duration:fmt(projectTracks[part.id].duration),demo:projectTracks[part.id].demo,disclosure:projectTracks[part.id].disclosure} : part)
    : (selectedProject.parts || emptyProjectParts)
  const chosen = isLiveProject ? displayParts.find(part=>part.id===selectedPartId) : null
  const demoNames = displayParts.filter(part=>part.demo).map(part=>part.name).join('·')
  return <div className="screen detail-screen">
    <TopBar back={back} meta={`${String(submitted).padStart(2,'0')}/${String(selectedProject.partCount).padStart(2,'0')} · ${selectedProject.status}`} />
    <main>
      <div className="song-identity"><div><p className="kicker">{song.artist} · {song.year}</p><h1>{song.title}</h1><p>{song.genre} · {song.duration}</p></div><button className={`icon-btn ${songSaved?'active':''}`} aria-label={songSaved?'저장한 곡에서 제거':'곡 저장'} aria-pressed={songSaved} data-action="toggle-song-save" onClick={()=>toggleSongSave(song.id)}><Icon name="bookmark"/></button></div>
      <section className="project-picker"><div className="section-head"><h2>이 곡의 프로젝트</h2><span>{allProjects.length} projects</span></div><div className="project-carousel">{allProjects.map(project=>{const created=createdProjects.some(item=>item.id===project.id);return <button key={project.id} className={selectedProject.id===project.id?'active':''} aria-pressed={selectedProject.id===project.id} onClick={()=>created?onOpenCreatedProject(project.id):(()=>{setSelectedProjectId(project.id);setSelectedPartId(project.id===PROJECT_ID?USER_PART_ID:'')})()}><span>{String(project.progress).padStart(2,'0')}/{String(project.partCount).padStart(2,'0')} · {project.status}</span><strong>{project.name}</strong><small>{created?'내 프로젝트 · 작업실 열기':project.key}</small></button>})}</div><button className="create-from-song" data-action="create-project-for-song" onClick={()=>onCreateProject(song.id)}><Icon name="plus" size={17}/><span><strong>이 곡으로 새 프로젝트 만들기</strong><small>2–4 Part와 Key를 설정합니다</small></span></button></section>
      <div className="detail-record"><ResonanceRecord layers={projectLayers} active={staticActive} seed={selectedProject.seed} /><div className="film-note"><span>PROJECT KEY</span><strong>{selectedProject.key}</strong><small>{submitted?'첫 Track 이후 Key 고정':'첫 Track 전 조정 가능'}</small></div></div>
      <section className="part-list"><div className="section-head"><h2>Part 구성</h2><span>{selectedProject.name}</span></div>{displayParts.map(part => <PartRow key={part.id} part={part} action={isLiveProject&&part.status==='open'?()=>setSelectedPartId(part.id):undefined} actionLabel={isLiveProject&&part.status==='open'?(selectedPartId===part.id?'선택됨':'확인'):undefined} onParticipant={part.participantId&&part.participantId!==CURRENT_USER_ID?()=>openVocalProfile(part.participantId):undefined}/>)}</section>
      {isLiveProject ? <p className="demo-disclosure">{demoNames || '현재 없음'}: 흐름 검증용 로컬 합성 Stem입니다. 실제 사람의 보컬 Track이나 실제 협업 결과가 아니며, 배포 가능한 동일 곡의 사람 보컬 원본은 아직 제공되지 않았습니다.</p> : <p className="demo-disclosure">탐색용 Project 데이터입니다. 선택한 Project에 따라 Part 구성이 교체되며 Track 녹음 시연은 Original C · Quartet에서 제공합니다.</p>}
      {chosen?.status === 'open' && <section className="fit-panel" data-testid="part-fit"><p className="kicker">Part fit · {chosen.name}</p><h2>{profile?'현재 Key에서 부를 수 있는 Part예요.':'참여 전에 내 목소리를 준비해요.'}</h2>{profile?<><div className="range-line"><span>내 편한 음역 <b>{profile.range}</b></span><span>Part 요구 음역 <b>{chosen.range}</b></span></div><ul><li>요구 최고음보다 2반음 여유가 있어요.</li><li>Indie·Ballad 취향이 이 프로젝트와 겹쳐요.</li><li>음색·역할은 참고 정보이며 실력 평가가 아니에요.</li></ul><button className="primary" data-action="join-part" onClick={()=>join(selectedPartId)}>{chosen.name} 참여 확정</button></>:<><p>먼저 실제 마이크로 편한 음역을 측정합니다. 대표 Voice Sample은 다음 단계에서 별도 Sample Song으로 등록하며 측정 음성과 섞지 않습니다.</p><button className="primary" data-action="voice-setup" onClick={()=>go('voice')}>내 목소리 알아보기</button></>}</section>}
    </main>
  </div>
}

function SongBrowser({ back, openSong, songSaves, toggleSongSave, createdProjects, onCreateProject }) {
  return <div className="screen song-browser-screen"><TopBar title="SONG DISCOVERY" back={back} meta={`${SONGS.length} SONGS`}/><main><p className="kicker">Song first</p><h1>곡 둘러보기</h1><p>곡을 선택하면 같은 곡으로 열린 프로젝트들과 각 프로젝트의 Part 구성을 확인할 수 있어요.</p><section className="song-browser-list">{SONGS.map((song,index)=>{const saved=songSaves.some(item=>item.songId===song.id);const projectCount=song.projects.length+createdProjects.filter(project=>project.songId===song.id).length;return <article key={song.id}><button className="song-browser-open" data-action="browse-song" onClick={()=>openSong(song.id)}><span className="song-index">{String(index+1).padStart(2,'0')}</span><span><strong>{song.title}</strong><small>{song.artist} · 프로젝트 {projectCount}개</small><em>{song.genre} · {song.duration}</em></span><b>↗</b></button><div className="song-row-actions"><button aria-label={`${song.title} 새 프로젝트 만들기`} onClick={()=>onCreateProject(song.id)}><Icon name="plus" size={17}/></button><button className={saved?'active':''} aria-label={saved?`${song.title} 저장 취소`:`${song.title} 곡 저장`} aria-pressed={saved} onClick={()=>toggleSongSave(song.id)}><Icon name="bookmark" size={17}/></button></div></article>})}</section></main></div>
}

function CreateProject({ back, complete, initialSongId }) {
  const [step,setStep] = useState(initialSongId ? 2 : 1)
  const [songId,setSongId] = useState(initialSongId || SONG_ID)
  const [partCount,setPartCount] = useState(4)
  const [projectKey,setProjectKey] = useState('C major')
  const [ownerPartId,setOwnerPartId] = useState(USER_PART_ID)
  const song = SONGS.find(item=>item.id===songId) || SONGS[0]
  const availableParts = PART_CATALOG.slice(0,partCount)
  useEffect(()=>{
    if (!availableParts.some(part=>part.id===ownerPartId)) setOwnerPartId(availableParts[0]?.id || '')
  },[partCount,ownerPartId])
  const ownerPart = availableParts.find(part=>part.id===ownerPartId) || availableParts[0]
  const create = () => complete({
    id:`created-${Date.now()}`,
    songId,
    title:song.title,
    artist:song.artist,
    name:`${projectKey} · ${partCount} Parts`,
    key:projectKey,
    partCount,
    progress:0,
    status:'RECRUITING',
    seed:`ieum:${songId}:${Date.now()}`,
    ownerPartId:ownerPart.id,
    parts:availableParts.map(part=>({...part,participantId:part.id===ownerPart.id?CURRENT_USER_ID:null,participant:part.id===ownerPart.id?'JISUN':null,status:part.id===ownerPart.id?'ready':'open',duration:null})),
    createdAt:new Date().toISOString()
  })
  return <div className="screen create-project-screen"><TopBar title="NEW PROJECT" back={back} meta={`0${step}/03`}/><main>
    {step===1&&<section className="setup-copy"><p className="kicker">01C · Song</p><h1>함께 부를 곡을<br/>선택해요.</h1><div className="sample-song-list">{SONGS.map(item=><button key={item.id} className={songId===item.id?'active':''} aria-pressed={songId===item.id} onClick={()=>setSongId(item.id)}><span>{item.title}</span><strong>{item.artist}</strong><small>{item.genre} · 기존 프로젝트 {item.projects.length}</small></button>)}</div><button className="primary" onClick={()=>setStep(2)}>Part 구성하기</button></section>}
    {step===2&&<section className="setup-copy"><p className="kicker">01D · Structure</p><h1>내 Part와 구성을<br/>정해요.</h1><div className="choice-grid">{SUPPORTED_PART_COUNTS.map(value=><button key={value} className={partCount===value?'active':''} onClick={()=>setPartCount(value)}>{value}<small>PARTS</small></button>)}</div><fieldset className="owner-part-field"><legend>내가 맡을 Part</legend><div className="part-choice-grid">{availableParts.map(part=><button type="button" key={part.id} className={ownerPartId===part.id?'active':''} aria-pressed={ownerPartId===part.id} onClick={()=>setOwnerPartId(part.id)}><i style={{background:part.color}}/><span>{part.name}</span><small>{part.range}</small></button>)}</div></fieldset><label className="field-label">PROJECT KEY<select value={projectKey} onChange={event=>setProjectKey(event.target.value)}><option>C major</option><option>B♭ major</option><option>D major</option><option>E minor</option></select></label><p>첫 Track이 제출되기 전까지만 Key와 Part 구성을 바꿀 수 있습니다.</p><button className="primary" onClick={()=>setStep(3)}>프로젝트 확인</button></section>}
    {step===3&&<section className="result-block"><p className="kicker">03A · Ready to recruit</p><h1>{song.title}<br/><span>{partCount} Parts</span></h1><dl className="measurement-proof"><div><dt>Artist</dt><dd>{song.artist}</dd></div><div><dt>내 Part</dt><dd>{ownerPart.name}</dd></div><div><dt>Project key</dt><dd>{projectKey}</dd></div><div><dt>Initial progress</dt><dd>0/{partCount}</dd></div></dl><p>내 Part 참여는 프로젝트 생성과 함께 확정됩니다. 진행률은 녹음을 Review에서 제출하기 전까지 0/{partCount}입니다.</p><button className="primary" data-action="confirm-project-create" onClick={create}>프로젝트 만들기</button></section>}
  </main></div>
}

function microphoneRecoveryGuide() {
  const ua = navigator.userAgent || ''
  const ios = /iPhone|iPad|iPod/i.test(ua)
  if (ios && /CriOS/i.test(ua)) return {
    title:'Chrome의 마이크 권한을 켜주세요.',
    steps:['iPhone 설정 앱을 엽니다.','앱 → Chrome → 마이크를 켭니다.','Chrome으로 돌아와 이 페이지를 새로고침합니다.']
  }
  if (ios) return {
    title:'브라우저의 마이크 권한을 켜주세요.',
    steps:['iPhone 설정 앱을 엽니다.','사용 중인 브라우저의 마이크 권한을 켭니다.','이 페이지로 돌아와 다시 요청합니다.']
  }
  if (/Android/i.test(ua)) return {
    title:'Chrome의 마이크 권한을 켜주세요.',
    steps:['주소창 왼쪽 사이트 아이콘을 누릅니다.','권한 → 마이크 → 허용을 선택합니다.','이 페이지로 돌아와 다시 요청합니다.']
  }
  return {
    title:'브라우저의 마이크 권한을 확인해 주세요.',
    steps:['주소창의 사이트 설정을 엽니다.','마이크를 허용합니다.','이 페이지로 돌아와 다시 요청합니다.']
  }
}

function MicrophonePermissionNotice({ error, onRetry, permissionDenied = true }) {
  const guide = microphoneRecoveryGuide()
  return <div className="permission-error" role="alert">
    <strong>{permissionDenied ? guide.title : '마이크를 시작하지 못했어요.'}</strong>
    <span>{error}</span>
    {permissionDenied && <ol>{guide.steps.map(step=><li key={step}>{step}</li>)}</ol>}
    <button className="secondary" onClick={onRetry}>{permissionDenied ? '설정 확인 후 다시 요청' : '다시 시도'}</button>
  </div>
}

function VoiceSetup({ complete, go }) {
  const [step, setStep] = useState('intro')
  const [permission, setPermission] = useState('idle')
  const [level, setLevel] = useState(0)
  const [pitch, setPitch] = useState(null)
  const [seconds, setSeconds] = useState(0)
  const [range, setRange] = useState(null)
  const [sampleDraft, setSampleDraft] = useState(null)
  const [sampleSong,setSampleSong] = useState(SAMPLE_SONGS[0])
  const [sampleStatus, setSampleStatus] = useState('ready')
  const [samplePlaying, setSamplePlaying] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef(null)
  const pitchSamples = useRef([])
  const confidenceSamples = useRef([])

  const startRange = async () => {
    try {
      setError(''); await requestMicrophone(); setPermission('granted'); setStep('range-running')
      pitchSamples.current = []; confidenceSamples.current = []; setSeconds(0); setPitch(null)
      monitorInput(frame => {
        setLevel(frame.level)
        if (frame.pitchFresh && Number.isFinite(frame.midi) && frame.midi >= 36 && frame.midi <= 84) {
          pitchSamples.current.push(frame.midi)
          confidenceSamples.current.push(frame.pitchConfidence || 0)
          setPitch(frame.midi)
        }
      }, { detectPitch:true })
      timer.current = window.setInterval(() => setSeconds(value => value + 1), 1000)
    } catch (e) { setPermission(isMicrophonePermissionError(e) ? 'denied' : 'error'); setError(microphoneErrorMessage(e)) }
  }
  const finishRange = () => {
    const values = [...pitchSamples.current].sort((a,b)=>a-b)
    if (values.length < 6) { setError('음정을 충분히 감지하지 못했어요. 3초 이상 편하게 낮은 음과 높은 음을 내주세요.'); return }
    clearInterval(timer.current); stopMicrophone()
    const low = values[Math.floor(values.length * .08)]
    const high = values[Math.min(values.length - 1, Math.floor(values.length * .92))]
    const confidence = confidenceSamples.current.reduce((sum,value)=>sum+value,0) / Math.max(1,confidenceSamples.current.length)
    const microphone = getMicrophoneDiagnostics()
    const measured = { lowMidi:Math.round(low), highMidi:Math.round(high), label:`${midiToNote(low)}–${midiToNote(high)}`, sampleCount:values.length, confidence:Number(confidence.toFixed(3)), microphone }
    setRange(measured); setError(''); setStep('range-result')
  }
  const startSample = async () => {
    try {
      setError(''); setPermission('granted'); setSampleStatus('recording'); setSeconds(0)
      await startRecording({ onFrame:frame=>setLevel(frame.level), guides:{backing:false,parts:[false,false,false,false]}, guideTracks:[], countIn:0 })
      timer.current = window.setInterval(() => setSeconds(value => value + 1), 1000)
    } catch (e) { setPermission(isMicrophonePermissionError(e) ? 'denied' : 'error'); setSampleStatus('ready'); setError(microphoneErrorMessage(e)) }
  }
  const stopSample = async () => {
    clearInterval(timer.current)
    const draft = await stopRecording()
    if (!draft?.blob || draft.duration < 3) { setError('대표 Voice Sample은 최소 3초 이상 녹음해 주세요.'); setSampleStatus('ready'); return }
    setSampleDraft(draft); setSampleStatus('review'); setSamplePlaying(false)
  }
  const retrySample = () => { cancelRecording(); setSampleDraft(null); setSampleStatus('ready'); setSeconds(0); setError('') }
  useEffect(() => () => { clearInterval(timer.current); cancelRecording(); stopMicrophone() }, [])
  return <div className="screen voice-screen">
    <TopBar title={['sample-select','sample','complete'].includes(step) ? 'VOICE PROFILE' : 'VOICE RANGE'} back={() => step === 'sample' ? setStep('sample-select') : step === 'sample-select' ? setStep('range-result') : step === 'complete' ? setStep('sample') : go('detail')} meta={step === 'complete' ? 'READY' : ['sample-select','sample'].includes(step) ? 'PROFILE AUDIO' : 'RANGE CHECK'} />
    <main className="voice-main">
      {step === 'intro' && <section className="setup-copy"><p className="kicker">About 30 seconds</p><h1>편한 음역을<br/>측정해요.</h1><p>별도 곡을 녹음하지 않습니다. 낮은 음부터 높은 음까지 편하게 소리 내면 음정 표본만 측정합니다.</p><p className="permission-primer">처음 한 번만 브라우저의 마이크 권한 창이 열립니다. 허용하면 바로 측정을 시작합니다.</p><button className="primary" data-action="range-start" onClick={startRange}>마이크 허용하고 음역 측정 시작</button></section>}
      {step === 'range-running' && <section className="measurement"><p className="kicker">RANGE · {fmt(seconds)}</p><h1>낮은 음부터 높은 음까지<br/>편하게 소리 내보세요.</h1><div className="level-orbit" style={{ '--level': level }}><span /></div><p className="pitch-readout">{pitch ? `${midiToNote(pitch)} · ${Math.round(440*Math.pow(2,(pitch-69)/12))}Hz` : '음정을 듣고 있어요…'}</p><p>자동으로 넘어가지 않습니다. 낮은 음과 높은 음을 충분히 낸 뒤 직접 마치세요.</p><button className="secondary" data-action="range-finish" onClick={finishRange}>측정 마치기 · {pitchSamples.current.length} samples</button></section>}
      {step === 'range-result' && <section className="result-block"><p className="kicker">실제 마이크 음정 분석</p><h1>측정된 음역<br/><span>{range?.label}</span></h1><p>{range?.sampleCount}개의 유효 음정 표본으로 계산했습니다. 이 데이터는 Part Fit에만 사용하며 Voice Identity나 프로젝트 Record를 만들지 않습니다.</p><dl className="measurement-proof"><div><dt>Pitch confidence</dt><dd>{Math.round((range?.confidence||0)*100)}%</dd></div><div><dt>Microphone</dt><dd>{range?.microphone?.label || 'Unavailable'}</dd></div><div><dt>Sample rate</dt><dd>{range?.microphone?.settings?.sampleRate || 'Browser default'} Hz</dd></div></dl><div className="range-rail"><i/><b style={{left:`${Math.max(0,((range?.lowMidi||48)-36)/48*100)}%`,width:`${Math.max(8,((range?.highMidi||60)-(range?.lowMidi||48))/48*100)}%`}}/></div><div className="review-actions"><button className="secondary" onClick={()=>setStep('intro')}>다시 측정</button><button className="primary" data-action="sample-next" onClick={() => setStep('sample-select')}>Sample Song 고르기</button></div></section>}
      {step === 'sample-select' && <section className="sample-select-stage"><p className="kicker">VP03 · 내 음역에 맞는 세 곡</p><h1>대표 Sample로 부를<br/>한 곡을 골라요.</h1><p>세 곡은 제공곡 확정 전 Placeholder입니다. 선택한 곡의 같은 구간을 15–20초 녹음합니다.</p><div className="sample-song-list">{SAMPLE_SONGS.map(song=><button key={song.id} className={sampleSong.id===song.id?'active':''} aria-pressed={sampleSong.id===song.id} onClick={()=>setSampleSong(song)}><span>{song.title}</span><strong>{song.range}</strong><small>{song.key} · {song.mood}</small></button>)}</div><button className="primary" onClick={()=>setStep('sample')}>{sampleSong.title} 녹음하기</button></section>}
      {step === 'sample' && <section className="sample-stage"><p className="kicker">Separate profile audio · {sampleSong.title}</p><h1>대표 Voice Sample을<br/>별도로 녹음해요.</h1><p>음역 측정과 다른 목적·저장 데이터입니다. 실제 제공 음원은 아직 확정되지 않아 지정 가사 구간을 무반주로 녹음합니다.</p><blockquote>“{sampleSong.lyric}”</blockquote>{sampleStatus === 'review' ? <><Player source={sampleDraft?.url} durationHint={sampleDraft?.duration} playing={samplePlaying} setPlaying={setSamplePlaying}/><div className="sample-proof"><span>VOICE SAMPLE · {fmt(sampleDraft?.duration)}</span><span>{sampleDraft?.features?.fingerprint || '분석 없음'}</span></div><VoiceIdentity/><div className="review-actions"><button className="secondary" data-action="sample-retry" onClick={retrySample}>다시 부르기</button><button className="primary" data-action="voice-complete" onClick={() => setStep('complete')}>이 샘플 사용하기</button></div></> : <><div className="level-orbit sample-meter" style={{ '--level': level }}><span /></div><p className="record-status">{sampleStatus === 'recording' ? `RECORDING · ${fmt(seconds)}` : '15–20초 권장'}</p><button className={`record-btn ${sampleStatus === 'recording' ? 'stop' : ''}`} data-action={sampleStatus === 'recording' ? 'sample-stop' : 'sample-start'} onClick={sampleStatus === 'recording' ? stopSample : startSample}><Icon name={sampleStatus === 'recording' ? 'stop' : 'mic'} size={27}/></button></>}</section>}
      {step === 'complete' && <section className="voice-complete-stage"><p className="kicker">VP06 · Voice profile ready</p><h1>목소리 준비를<br/>마쳤어요.</h1><VoiceIdentity/><dl className="profile-ready-summary"><div><dt>편한 음역</dt><dd>{range?.label}</dd></div><div><dt>대표 Sample</dt><dd>{sampleSong.title} · {fmt(sampleDraft?.duration)}</dd></div><div><dt>Voice Identity</dt><dd>로컬 생성형 AI 미연결</dd></div></dl><p>Voice Identity는 실제 생성 모델이 연결되기 전까지 완료로 표시하지 않습니다.</p><button className="primary" data-action="profile-finish" onClick={() => complete({ range:range?.label, rangeData:range, sample:sampleDraft, sampleSong, identity:{status:'blocked',reason:'free-local-generative-model-not-connected'} })}>선택한 Part Fit으로 돌아가기</button></section>}
      {error && <MicrophonePermissionNotice error={error} permissionDenied={permission==='denied'} onRetry={step==='sample'?startSample:startRange}/>} 
    </main>
  </div>
}

function Workspace({ go, project = PROJECT, song, isCreated = false, ownerPartId, findVocal, joined, invited, invitedPerson, candidateAccepted, candidateArrivalStatus, projectTracks, layers, recordPart, projectLiked, toggleProjectLike, openVocalProfile, mix, mixStatus = 'idle', mixProgress = 0, completionDelayed = false }) {
  const baseParts = project.parts || PART_CATALOG.slice(0,project.partCount)
  const projectParts = baseParts.map(part => {
    const track = projectTracks[part.id]
    if (track) return {...part, participantId:track.participantId || personFromName(track.participant)?.id, participant:track.participant, status:'submitted', duration:fmt(track.duration), demo:track.demo, disclosure:track.disclosure}
    const pendingInvites = (part.invitations||[]).filter(invitation=>invitation.status==='sent')
    if (pendingInvites.length && !part.participantId) return {...part,participant:`${pendingInvites.length}명 초대`,status:'invited',invitationStatus:'sent'}
    if (isCreated && part.id === ownerPartId) return {...part,participantId:CURRENT_USER_ID,participant:'JISUN',status:'ready'}
    if (!isCreated && part.id === USER_PART_ID && joined) return {...part,participantId:CURRENT_USER_ID,participant:'JISUN',status:'ready'}
    if (part.id === 'bass' && candidateAccepted) return {...part,participantId:invitedPerson.id,participant:invitedPerson.name,status:'accepted'}
    return part
  })
  const submitted = projectParts.filter(p => p.status === 'submitted').length
  const invitedParts = isCreated ? projectParts.filter(part=>part.invitationStatus) : []
  const myPart = projectParts.find(part=>part.participantId===CURRENT_USER_ID)
  const canRecordMyPart = myPart?.status === 'ready'
  return <div className="screen workspace-screen">
    <TopBar back={() => isCreated ? go('projects') : go('detail')} meta={`${String(submitted).padStart(2,'0')}/${String(projectParts.length).padStart(2,'0')} · PARTS`} />
    <main>
      <div className="title-row"><div><p className="kicker">{song?.title || 'A Thousand Years'}</p><h1>Voices in progress</h1></div><button className={`icon-btn ${projectLiked?'active':''}`} aria-label={projectLiked?'프로젝트 Like 취소':'프로젝트 Like'} aria-pressed={projectLiked} data-action="toggle-project-like" onClick={toggleProjectLike}><Icon name="heart"/></button></div>
      {completionDelayed&&<section className="completion-delay-banner" role="status" data-state="completion-delayed"><strong>내 녹음을 이어갈 차례예요.</strong><p>마지막 유효 활동 후 7일이 지났습니다. 미완료된 내 Part를 제출하면 프로젝트가 다시 진행돼요.</p></section>}
      <ResonanceRecord layers={layers} state="rest" seed={project.seed}/>
      <section className="part-list">
        {projectParts.map(part => {
          let action
          let actionLabel
          if (isCreated && part.invitationStatus==='sent') { action=()=>findVocal(part.id); actionLabel='다른 보컬 찾기' }
          else if (isCreated && ownerPartId && !part.participantId && !part.invitationStatus) { action=()=>findVocal(part.id); actionLabel='보컬 찾기' }
          else if (!isCreated && part.id === 'bass' && !projectTracks.bass && !candidateAccepted) { action=()=>findVocal(part.id); actionLabel=invited?'다른 보컬 찾기':'보컬 찾기' }
          return <PartRow key={part.id} part={part} action={action} actionLabel={actionLabel} urgent={completionDelayed&&part.participantId===CURRENT_USER_ID&&part.status==='ready'} onParticipant={part.participantId&&part.participantId!==CURRENT_USER_ID?()=>openVocalProfile(part.participantId):undefined}/>
        })}
      </section>
      <p className="demo-disclosure">초대 수락과 Track 제출은 다른 상태입니다. 진행률과 Record는 실제 Track이 제출될 때만 증가합니다.</p>
      {isCreated && invitedParts.map(part=><section className="invite-status" data-invite-state={part.invitationStatus} key={part.id}><span>{part.invitationStatus==='accepted'?`${part.participant} · ${part.name} 참여 확정`:`${part.name} · ${(part.invitations||[]).filter(item=>item.status==='sent').length}명 수락 대기`}</span><b>{part.invitationStatus==='accepted'?'TRACK WAIT':'ACCEPT WAIT'}</b></section>)}
      {!isCreated && invited && !candidateAccepted && <section className="invite-status" data-invite-state="sent"><span>{invitedPerson.name}에게 Bass 초대 보냄</span><b>ACCEPT WAIT</b></section>}
      {!isCreated && candidateAccepted && !projectTracks.bass && <section className="invite-status" data-invite-state="accepted"><span>{invitedPerson.name} · Bass 초대 수락</span><b>{candidateArrivalStatus==='loading'?'TRACK ARRIVING':'TRACK WAIT'}</b></section>}
      {!isCreated && invited && projectTracks.bass && <section className="invite-status" data-invite-state="submitted"><span>{invitedPerson.name}의 Bass 데모 Track 도착</span><b>SUBMITTED · 4/4</b></section>}
      <dl className="workspace-meta"><div><dt>현재 키</dt><dd>{project.key || 'C major'}</dd></div><div><dt>제출 진행률</dt><dd>{submitted}/{projectParts.length} Tracks</dd></div></dl>
      <div className="workspace-actions">
        {submitted > 0 && <button className={canRecordMyPart?'secondary':'primary'} data-action={mix?'open-complete':'open-multitrack'} onClick={() => go(mix?'complete':'multitrack')}><Icon name="headphones"/> {mix?'완성곡 듣기':mixStatus==='processing'?`Auto Mix 확인 · ${mixProgress}%`:`현재 Multitrack 듣기 · ${submitted}/${projectParts.length}`}</button>}
        {canRecordMyPart && <button className="primary" data-action="record-part" onClick={() => recordPart(myPart.id)}>{myPart.name} 녹음 시작</button>}
      </div>
    </main>
  </div>
}

function MatchDetail({ vocal, back, openProfile, invite, invitedVocalIds, part }) {
  const partName = part?.name || 'Bass'
  const invited = invitedVocalIds.includes(vocal.id)
  const metrics = vocal.metrics || {range:72,timbre:72,role:72,taste:72}
  const reason = vocal.matchReason || `${vocal.range} 음역과 ${vocal.roles?.join(' · ')} 역할 정보를 기준으로 ${partName} 후보에 포함됐어요.`
  return <div className="screen candidate-screen">
    <TopBar title="MATCH DETAIL" back={back} meta={`${partName.toUpperCase()} · CURRENT TEAM`}/>
    <main>
      <button className="candidate-identity identity-link" onClick={()=>openProfile(vocal.id)} aria-label={`${vocal.name} 전체 보컬 프로필 보기`}><VoiceIdentity identity={vocal.identity}/><span><p className="kicker">Candidate · sample data</p><h1>{vocal.name}</h1><p>{vocal.role}<br/>{vocal.range}</p><small>전체 보컬 프로필 보기 ↗</small></span></button>
      <section className="reason-block"><h2>현재 프로젝트에 맞는 이유</h2><p>{reason}</p><div className="reason-row"><span>Range</span><b>{metrics.range}% · {partName} 기준</b></div><div className="reason-row"><span>Timbre</span><b>{metrics.timbre}% · 현재 Track과 대비</b></div><div className="reason-row"><span>Role</span><b>{metrics.role}% · 역할 보완</b></div><div className="reason-row"><span>Taste</span><b>{metrics.taste}% · {(vocal.genres||[]).join(' · ')}</b></div><small>표시된 수치는 시연용 샘플 데이터입니다. 실제 측정 결과나 실력 평가가 아닙니다.</small></section>
      <section className="compatibility compact"><h2>사람 간 궁합은 프로필에서 확인</h2><p>프로젝트 적합성과 `나 ↔ {vocal.name}`의 궁합은 서로 다른 입력과 화면을 사용합니다.</p><button className="secondary" onClick={()=>openProfile(vocal.id)}>나와의 보컬 궁합 보기</button></section>
      {invite && <button className="primary sticky-cta" data-action="invite" disabled={invited} onClick={() => invite(vocal)}>{invited?`${partName} 초대 보냄 · 수락 대기`:`${partName} Part 초대`}</button>}
    </main>
  </div>
}

function OtherVocalProfile({ vocal, back, saved, toggleSave, sampleUrl, sampleDuration }) {
  const [playing,setPlaying] = useState(false)
  const compatibility = vocal.compatibility || ['서로의 편한 음역을 함께 확인할 수 있어요.', '음색 분석 데이터가 준비되면 조화 이유를 보여줘요.', '선호 역할을 나누어 확인할 수 있어요.', '저장곡과 선호 장르를 비교해요.']
  return <div className="screen candidate-screen other-vocal-screen">
    <TopBar title="VOCAL PROFILE" back={back} meta="ME ↔ VOCAL"/>
    <main>
      <div className="candidate-profile-head"><div className="candidate-identity"><VoiceIdentity identity={vocal.identity}/><div><p className="kicker">Other vocal</p><div className="vocal-name-line"><h1>{vocal.name}</h1><button className={`name-star ${saved?'active':''}`} data-action="toggle-vocal-save" aria-label={saved?`${vocal.name} 보컬 저장 취소`:`${vocal.name} 보컬 저장`} aria-pressed={saved} onClick={()=>toggleSave(vocal.id)}><Icon name="star" size={18}/></button></div><p>{vocal.voiceType}<br/>{vocal.range}</p></div></div></div>
      <section className="profile-facts"><div><span>선호 역할</span><b>{(vocal.roles||[vocal.role]).join(' · ')}</b></div><div><span>선호 장르</span><b>{(vocal.genres||[]).join(' · ')}</b></div><div><span>음악 취향</span><b>{(vocal.taste||[]).join(' · ')}</b></div></section>
      <section className="voice-sample-block"><div className="section-head"><h2>대표 Voice Sample</h2><span>{sampleUrl?'재생 가능':'아직 등록되지 않음'}</span></div>{sampleUrl?<Player source={sampleUrl} durationHint={sampleDuration} playing={playing} setPlaying={setPlaying}/>:<p>이 시연 데이터에는 실제 대표 Voice Sample이 없습니다. 프로젝트 Track을 프로필 Sample로 대신 표시하지 않습니다.</p>}</section>
      <section className="compatibility"><h2>나와의 보컬 궁합</h2><div className="dual-fields" aria-label="JISUN과 상대 보컬의 두 Voice Field가 중앙에서 겹치는 정성적 시각화"><i/><i/></div>{['음역 조합','음색 조화','역할 보완','음악 취향'].map((label,index)=><div className="reason-row" key={label}><span>{label}</span><b>{compatibility[index]}</b></div>)}<small>현재 Project, Part, Key와 무관한 두 Vocal Profile 간 정성적 비교이며 사람의 우열이나 실력 점수가 아닙니다.</small></section>
    </main>
  </div>
}

function Finder({ go, invite, invitedVocalIds = [], part, vocalSaves, toggleVocalSave, openVocalProfile, selectedVocalId, setSelectedVocalId }) {
  const [sort, setSort] = useState('종합 추천순')
  const [filterOpen,setFilterOpen] = useState(false)
  const [roleOnly,setRoleOnly] = useState(false)
  const keyBySort = {'종합 추천순':'range','음역 적합순':'range','음색 조화순':'timbre','역할 보완순':'role','곡 취향 유사순':'taste'}
  const partName = part?.name || 'Bass'
  const roleHints = {Soprano:['Upper harmony','Main'],Alto:['Support','Middle harmony'],Tenor:['Middle harmony','Support'],Bass:['Bass foundation','Low harmony']}
  const preferredRoles = roleHints[partName] || []
  const score = (candidate,key) => {
    const preferred = candidate.roles?.some(role=>preferredRoles.includes(role))
    const base = candidate.metrics?.[key] ?? 72
    return (preferred ? 100 : 0) + base
  }
  const candidates = PEOPLE.filter(candidate=>!candidate.isSelf)
    .filter(candidate=>!roleOnly || candidate.roles?.some(role=>preferredRoles.includes(role)))
    .sort((a,b)=>score(b,keyBySort[sort])-score(a,keyBySort[sort]))
  const selected = selectedVocalId ? PERSON_BY_ID[selectedVocalId] : null
  if (selected) return <MatchDetail vocal={selected} back={() => setSelectedVocalId(null)} openProfile={openVocalProfile} invite={invite} invitedVocalIds={invitedVocalIds} part={part}/>
  return <div className="screen finder-screen">
    <TopBar title={`${partName.toUpperCase()} · VOCAL FINDER`} back={() => go('workspace')} action={filterOpen?'닫기':'필터'} onAction={()=>setFilterOpen(value=>!value)}/>
    <main>
      <p className="kicker">현재 Key Complete Gate 통과 · {candidates.length} vocals</p><h1>{partName}를 끝까지<br/>부를 수 있는 보컬</h1>
      {filterOpen && <section className="finder-filters"><label><input type="checkbox" checked={roleOnly} onChange={event=>setRoleOnly(event.target.checked)}/><span>{partName} 선호 역할</span></label><p>전체 보컬 중 현재 Part의 역할을 선호하는 후보만 좁혀 봅니다.</p></section>}
      <div className="sort-row">{Object.keys(keyBySort).map(item => <button key={item} className={sort === item ? 'active' : ''} onClick={() => setSort(item)}>{item}</button>)}</div>
      <div className="candidate-list">{candidates.map(candidate => <div key={candidate.id} className="candidate-row"><button className="candidate-open" data-action="candidate" onClick={() => setSelectedVocalId(candidate.id)}><VoiceIdentity identity={candidate.identity}/><span><strong>{candidate.name}</strong><small>{candidate.range} · {candidate.role}</small><em>{candidate.matchReason || `${partName} 후보 · ${candidate.roles?.join(' · ')}`}</em></span><b>↗</b></button><button className={`candidate-save ${vocalSaves.some(item=>item.vocalId===candidate.id)?'active':''}`} aria-label={`${candidate.name} 보컬 저장`} aria-pressed={vocalSaves.some(item=>item.vocalId===candidate.id)} onClick={()=>toggleVocalSave(candidate.id)}><Icon name="star" size={17}/></button></div>)}</div>
    </main>
  </div>
}

function Recorder({ go, submit, partId, projectTracks, layers, project = PROJECT, parts = PARTS }) {
  const recordingWindow = 35
  const currentPart = parts.find(part => part.id === partId) || parts[0]
  const currentIndex = parts.findIndex(part => part.id === currentPart.id)
  const guideTracks = Object.values(projectTracks).filter(track => track.partId !== currentPart.id)
  const [guides, setGuides] = useState({ backing:true, parts:[true,false,true,true] })
  const [status, setStatus] = useState('ready')
  const [countIn, setCountIn] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)
  const [peak, setPeak] = useState(0)
  const [noiseFloor,setNoiseFloor] = useState(0)
  const [draft, setDraft] = useState(null)
  const [reviewPlaying, setReviewPlaying] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef(null)
  const lyricIndex = Math.min(3, Math.floor(seconds / 4))
  const lyrics = ['Heart beats fast', 'Colors and promises', 'How to be brave', 'I have loved you']
  const begin = async () => {
    try {
      setError(''); await requestMicrophone()
      const ambient = []
      monitorInput(frame=>{setLevel(frame.level);setPeak(frame.peak);ambient.push(frame.level)})
      for (const n of [3,2,1]) { setCountIn(n); await new Promise(resolve=>window.setTimeout(resolve,650)) }
      setCountIn(0)
      const sorted=[...ambient].sort((a,b)=>a-b)
      setNoiseFloor(sorted[Math.floor(sorted.length*.65)]||0)
      await startRecording({ onFrame: frame => { setLevel(frame.level); setPeak(frame.peak) }, guides, guideTracks })
      setStatus('recording'); setSeconds(0); timer.current = window.setInterval(() => setSeconds(s => s + .1), 100)
    } catch (e) { setError(microphoneErrorMessage(e)); setStatus('ready'); setCountIn(0) }
  }
  const pause = () => { pauseRecording(); setStatus('paused'); clearInterval(timer.current) }
  const resume = () => { resumeRecording(); setStatus('recording'); timer.current = window.setInterval(() => setSeconds(s => s + .1), 100) }
  const stop = async () => { clearInterval(timer.current); const value = await stopRecording(); setDraft(value); setStatus('review') }
  const retry = () => { cancelRecording(); setDraft(null); setReviewPlaying(false); setStatus('ready'); setSeconds(0); setLevel(0) }
  useEffect(() => () => { clearInterval(timer.current); cancelRecording(); stopMicrophone() }, [])
  return <div className="screen recording-screen">
    <TopBar title={`${currentPart.name.toUpperCase()} · RECORDING`} back={() => go('workspace')} meta={status === 'recording' ? `REC ${fmt(seconds)}` : 'ORIGINAL KEY'}/>
    <main>
      <div className="recording-visual"><ResonanceRecord layers={layers} activePartIndex={currentIndex} state={status === 'recording' ? 'recording' : status==='paused'?'paused':'rest'} level={level} seed={project.seed} compact /></div>
      <div className="lyrics" aria-live="polite">{lyrics.map((line,index)=><span key={line} className={index===lyricIndex?'active':''}>{line}</span>)}</div>
      <div className="recording-timeline" aria-label="녹음 시간"><div><span>RECORD TIME</span><b>{fmt(seconds)} / {fmt(recordingWindow)}</b></div><div className="time-progress"><span style={{width:`${Math.min(100,seconds/recordingWindow*100)}%`}}/></div></div>
      <div className="meter-row"><span>MIC</span><div className={`input-meter ${peak>.9?'clip':''}`} aria-label="마이크 입력 볼륨"><span style={{width:`${Math.max(2,level*100)}%`}}/><i style={{left:`${Math.min(98,peak*100)}%`}}/></div><b>{peak>.9?'CLIP':level>.08?'GOOD':'LOW'}</b></div>{noiseFloor>0&&<p className={`noise-status ${noiseFloor>.08?'warning':''}`}>주변 소음 · {noiseFloor>.08?'높음 — Review에서 다시 녹음을 선택할 수 있어요.':'양호'} ({Math.round(noiseFloor*100)}%)</p>}
      <section className="guide-panel"><div className="section-head"><h2>Guide audio</h2><span>녹음 파일과 분리</span></div><label><span>Backing track</span><input type="checkbox" checked={guides.backing} onChange={e=>setGuides({...guides,backing:e.target.checked})}/><i/></label>{guideTracks.map(track=>{const part=parts.find(item=>item.id===track.partId);const actualIndex=parts.findIndex(item=>item.id===track.partId);return <label key={track.id}><span><b style={{color:part?.color}}>{part?.name}</b> · {track.participant}</span><input type="checkbox" checked={Boolean(guides.parts[actualIndex])} onChange={e=>{const nextParts=[...guides.parts];nextParts[actualIndex]=e.target.checked;setGuides({...guides,parts:nextParts})}}/><i/></label>})}</section>
      {error && <MicrophonePermissionNotice error={error} onRetry={begin}/>} 
      {status === 'review' ? <section className="record-review"><p className="kicker">Review · {fmt(draft?.duration)}</p><h2>{draft?.features?.peak > .92 ? '일부 구간이 너무 크게 녹음됐어요.' : noiseFloor>.08?'주변 소음이 함께 녹음됐을 수 있어요.':'제출할 Track을 확인해 주세요.'}</h2><p>{noiseFloor>.08?'다시 녹음을 권하지만 제출을 막지는 않습니다. 제출 후 기본 노이즈 정리를 적용합니다. ':''}{draft?.features ? `에너지 ${Math.round(draft.features.energy*100)} · 밝기 ${Math.round(draft.features.brightness*100)} · 거칠기 ${Math.round(draft.features.roughness*100)} · 특징 ${draft.features.fingerprint}` : '오디오 분석을 완료하지 못했지만 재생 후 제출할 수 있어요.'}</p><Player source={draft?.url} durationHint={draft?.duration} playing={reviewPlaying} setPlaying={setReviewPlaying}/><div className="review-actions"><button className="secondary" data-action="record-retry" onClick={retry}>다시 녹음</button><button className="primary" data-action="record-submit" onClick={() => submit({...draft,noiseFloor},currentPart)}>녹음 제출</button></div></section>
      : <div className="recorder-controls">
          {status === 'ready' && <button className="record-btn" data-action="record-start" aria-label="녹음 시작" onClick={begin}><Icon name="mic" size={28}/></button>}
          {status === 'recording' && <><button className="round-secondary" onClick={retry}>다시</button><button className="record-btn" data-action="record-pause" aria-label="녹음 일시정지" onClick={pause}><Icon name="pause" size={30}/></button><button className="round-secondary" data-action="record-stop" onClick={stop}>정지</button></>}
          {status === 'paused' && <><button className="round-secondary" onClick={retry}>다시</button><button className="record-btn" data-action="record-resume" aria-label="녹음 이어서" onClick={resume}><Icon name="mic" size={28}/></button><button className="round-secondary" data-action="record-stop" onClick={stop}>정지</button></>}
          {countIn > 0 && <div className="count-in" aria-live="assertive">{countIn}</div>}
        </div>}
    </main>
  </div>
}

function Player({ source, playing, setPlaying, duration: durationProp = 18, durationHint }) {
  const [time, setTime] = useState(0)
  const [mediaDuration, setMediaDuration] = useState(durationHint || durationProp)
  const audioRef = useRef(null)
  const duration = Number.isFinite(mediaDuration) && mediaDuration > 0 ? mediaDuration : durationProp
  useEffect(() => {
    const audio = audioRef.current
    if (source && audio) {
      if (playing) audio.play().catch(() => setPlaying(false))
      else audio.pause()
      return
    }
    if (!playing) return
    const timer = window.setInterval(() => setTime(t => t >= duration ? 0 : t + .2), 200)
    return () => clearInterval(timer)
  }, [playing,duration,source,setPlaying])
  const seek = value => {
    setTime(value)
    if (audioRef.current) audioRef.current.currentTime = value
  }
  return <div className="audio-player"><div className="time-row"><span>{fmt(time)}</span><input aria-label="재생 위치" type="range" min="0" max={duration} step=".1" value={Math.min(time,duration)} onChange={e=>seek(Number(e.target.value))}/><span>{fmt(duration)}</span></div><button className="play-btn" aria-label={playing?'일시정지':'재생'} onClick={()=>setPlaying(!playing)}><Icon name={playing?'pause':'play'} size={26}/></button>{source && <audio ref={audioRef} src={source} onLoadedMetadata={e=>Number.isFinite(e.currentTarget.duration)&&setMediaDuration(e.currentTarget.duration)} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onEnded={()=>setPlaying(false)} />}</div>
}

function Multitrack({ go, project = PROJECT, parts = PARTS, ownerPartId = USER_PART_ID, projectTracks, layers, complete, readyForMix, recordOwnPart, projectLiked, toggleProjectLike, openVocalProfile, mix, mixStatus = 'idle', progress = 0 }) {
  const [included, setIncluded] = useState({ backing:true, parts:parts.map(()=>true) })
  const [playing, setPlaying] = useState(false)
  const [selectedTrackId,setSelectedTrackId] = useState(null)
  const stopRef = useRef(null)
  const trackArray = Object.values(projectTracks)
  const tracks = parts.map(part => {
    const track = projectTracks[part.id]
    return track ? {...part,participantId:track.participantId || personFromName(track.participant)?.id,participant:track.participant,status:'submitted',duration:fmt(track.duration),demo:track.demo,disclosure:track.disclosure} : part
  })
  const submitted = tracks.filter(p=>p.status==='submitted').length
  const nextPart = parts.find(part => !projectTracks[part.id])
  useEffect(() => {
    if (!playing) { stopRef.current?.(); stopGuides(); return }
    if (mix?.url) return
    playCurrentMix({ included, tracks:trackArray, duration:18, onEnded:()=>setPlaying(false) }).then(stop=>{stopRef.current=stop})
    return () => stopRef.current?.()
  }, [playing,mix])
  const selectedTrack = selectedTrackId ? projectTracks[selectedTrackId] : null
  return <div className="screen multitrack-screen">
    <TopBar title="MULTITRACK" back={() => go('workspace')} action={projectLiked?'♥ LIKED':'♡ LIKE'} onAction={toggleProjectLike}/>
    <main>
      <div className="multitrack-hero"><ResonanceRecord layers={layers} seed={project.seed} state={mixStatus==='processing'?'processing':playing?'playing':'rest'} compact/><div><p className="kicker">Current mix</p><h1>{mixStatus==='processing'?'Auto Mix 중…':mixStatus==='complete'?'모든 목소리가 연결됐어요.':'지금까지의 목소리'}</h1><p>{mixStatus==='processing'?`정렬 · 밸런스 · EQ · Compressor · Limiter ${progress}%`:'포함된 실제 Track을 함께 들을 수 있어요.'}</p><small>실제 오디오 특징 기반 Layer · 생성형 AI 미적용</small></div></div>
      {selectedTrack && <div className="listening-context"><span>개별 Track</span><b>{selectedTrack.participant} · {parts.find(part=>part.id===selectedTrack.partId)?.name}</b><button onClick={()=>{setPlaying(false);setSelectedTrackId(null)}}>현재 믹스로</button></div>}
      <Player source={selectedTrack?.url || mix?.url} durationHint={selectedTrack?.duration} playing={playing} setPlaying={setPlaying}/>
      <section className="track-list"><div className="section-head"><h2>Tracks</h2><span>Tap name to listen · Toggle include</span></div><div className="backing-row"><span>Backing track</span><button className={`include-toggle ${included.backing?'on':''}`} onClick={()=>setIncluded({...included,backing:!included.backing})}><span/></button></div>{tracks.map((part,index)=><PartRow key={part.id} part={part} included={part.status==='submitted'&&included.parts[index]} onPlay={part.status==='submitted'?()=>{setPlaying(false);setSelectedTrackId(part.id);window.setTimeout(()=>setPlaying(true),0)}:undefined} onParticipant={part.participantId&&part.participantId!==CURRENT_USER_ID?()=>openVocalProfile(part.participantId):undefined} onToggle={part.status==='submitted'?()=>{const parts=[...included.parts];parts[index]=!parts[index];setIncluded({...included,parts})}:undefined}/>)}</section>
      <p className="demo-disclosure">각 Track은 독립 오디오로 유지됩니다. 초대 수락만으로 Track이 추가되거나 진행률이 오르지 않습니다.</p>
      {mixStatus==='complete' && <button className="primary sticky-cta" data-action="open-complete" data-mix-bytes={mix?.bytes || 0} data-mix-origin={mix?.origin || ''} onClick={()=>complete(mix)}>완성곡 듣기</button>}
      {!readyForMix && <><p className="waiting-note">다른 참여자의 Part는 대신 녹음할 수 없습니다. 초대 수락이 아니라 마지막 필수 Track이 실제 도착할 때 Auto Mix가 자동 시작됩니다.</p>{nextPart?.id===ownerPartId?<button className="primary sticky-cta" data-action="record-own-track" onClick={recordOwnPart}>내 Track 녹음</button>:<button className="secondary sticky-cta" data-action="back-to-workspace" onClick={()=>go('workspace')}>작업실에서 다음 Part 모집하기</button>}</>}
    </main>
  </div>
}

function Complete({ go, mix, layers, projectTracks, projectLiked, toggleProjectLike, openVocalProfile }) {
  const [playing,setPlaying] = useState(false)
  const share = async () => {
    const data = { title:'A Thousand Years · IEUM', text:'네 개의 목소리가 하나의 곡으로 연결됐어요.', url:location.href }
    if (navigator.share) await navigator.share(data).catch(()=>{})
    else await navigator.clipboard?.writeText(location.href)
  }
  return <div className="screen complete-screen">
    <TopBar back={() => go('workspace')} meta={`${String(TOTAL_PARTS).padStart(2,'0')}/${String(TOTAL_PARTS).padStart(2,'0')} · COMPLETE`} />
    <main>
      <div className="complete-title"><p>All four parts are connected.</p><h1>A Thousand Years</h1></div>
      <div className="complete-record"><ResonanceRecord layers={layers} state={playing?'playing':'complete'} seed={PROJECT_SEED}/><div className="sleeve"><span>IEUM RECORD 0048</span><strong>Four voices<br/>one song</strong></div></div>
      <Player source={mix?.url} playing={playing} setPlaying={setPlaying}/>
      <section className="credits"><div className="section-head"><h2>Credits</h2><button className="heart-text" aria-pressed={projectLiked} data-action="toggle-project-like" onClick={toggleProjectLike}>{projectLiked?'♥':'♡'} 프로젝트 Like</button></div>{PARTS.map(part=>{const track=projectTracks[part.id];const participant=track?.participant||part.participant;const participantId=track?.participantId||part.participantId||personFromName(participant)?.id;return <PartRow key={part.id} part={{...part,participantId,participant,status:'submitted',duration:fmt(track?.duration||mix?.duration||18),demo:track?.demo,disclosure:track?.disclosure}} onParticipant={participantId&&participantId!==CURRENT_USER_ID?()=>openVocalProfile(participantId):undefined}/>})}</section>
      <p className="demo-disclosure">Credits의 LOCAL DEMO 표시는 흐름 검증용 합성 Stem이며 실제 참여자의 사람 녹음이 아님을 뜻합니다.</p>
      <dl className="metadata"><div><dt>Final key</dt><dd>Original · C major</dd></div><div><dt>Completed</dt><dd>{new Date(mix?.createdAt||Date.now()).toLocaleDateString('ko-KR')}</dd></div><div><dt>Alignment</dt><dd>{mix?.processing?.alignment || 'recording guide offset'}</dd></div><div><dt>Mix chain</dt><dd>Gate · RMS · EQ · Comp · Limiter</dd></div><div><dt>Mix</dt><dd>IEUM Auto Mix · local</dd></div></dl>
      <section className="ai-boundary"><strong>Resonance Record 생성 상태</strong><p>현재 화면의 Record는 실제 제출 Track 특징 기반 절차 시각화입니다. 무료·로컬 생성형 AI 모델 검증 전에는 AI 생성 완료로 표시하지 않습니다.</p></section>
      <button className="primary" data-action="share" onClick={share}>완성곡 공유 <Icon name="share"/></button>
    </main>
  </div>
}

function ProfileSamplePlayer({ source, duration }) {
  const [playing,setPlaying] = useState(false)
  return <Player source={source} durationHint={duration} playing={playing} setPlaying={setPlaying}/>
}

function CollectionArea({ go, openSong, projectLikes, vocalSaves, songSaves, toggleProjectLike, toggleVocalSave, toggleSongSave, openVocalProfile, layers, trackCount, mix, joined }) {
  const [tab,setTab] = useState('projects')
  const projectLiked = projectLikes.some(item=>item.projectId===PROJECT_ID)
  const savedVocals = PEOPLE.filter(vocal=>!vocal.isSelf&&vocalSaves.some(item=>item.vocalId===vocal.id))
  const savedSongs = SONGS.filter(song=>songSaves.some(item=>item.songId===song.id))
  const counts = {projects:projectLikes.length,vocals:vocalSaves.length,songs:songSaves.length}
  const emptyCopy = {
    projects:['Like한 프로젝트가 없어요.','프로젝트 작업실·Multitrack·완성 화면의 하트를 누르면 이곳에 모입니다.'],
    vocals:['저장한 보컬이 없어요.','Vocal Finder나 다른 보컬 프로필의 별을 누르면 이곳에 모입니다.'],
    songs:['저장한 곡이 없어요.','곡·프로젝트 상세의 북마크를 누르면 관련 프로젝트와 함께 모입니다.']
  }
  return <>
    <div className="collection-summary"><span><b>{counts.projects+counts.vocals+counts.songs}</b> saved</span><p>서로 다른 저장 객체를 한 화면에서 분리해 관리합니다.</p></div>
    <div className="object-tabs" role="tablist" aria-label="컬렉션 종류">
      {[['projects','프로젝트'],['vocals','보컬'],['songs','곡']].map(([value,label])=><button key={value} role="tab" aria-selected={tab===value} className={tab===value?'active':''} data-action={`collection-tab-${value}`} onClick={()=>setTab(value)}>{label}<small>{counts[value]}</small></button>)}
    </div>
    {tab==='projects' && projectLiked && <article className="collection-card" data-project-id={PROJECT_ID}><button className="collection-cover" aria-label="A Thousand Years 프로젝트 열기" onClick={()=>mix?go('complete'):joined?go('workspace'):openSong(SONG_ID)}><ResonanceRecord layers={layers} compact/></button><div className="collection-copy"><div className="collection-card-head"><span>{mix?'COMPLETE':joined?'RECORDING':'RECRUITING'} · {String(trackCount).padStart(2,'0')}/04</span><button className="collection-remove active" aria-label="프로젝트 Like 취소" onClick={toggleProjectLike}><Icon name="heart" size={17}/></button></div><h2>A Thousand Years</h2><p>{mix?'완성곡과 Credits 보기':joined?'참여 중인 프로젝트':'관심 프로젝트'}</p><button className="primary" data-action="open-project-like" onClick={()=>mix?go('complete'):joined?go('workspace'):openSong(SONG_ID)}>프로젝트 열기</button></div></article>}
    {tab==='vocals' && savedVocals.map(vocal=><article className="vocal-collection-row" key={vocal.id}><button className="vocal-collection-open" onClick={()=>openVocalProfile(vocal.id)}><VoiceIdentity identity={vocal.identity}/><span><strong>{vocal.name}</strong><small>{vocal.range} · {vocal.role}</small><em>{(vocal.genres||[]).join(' · ')}</em></span></button><button className="collection-remove active" aria-label={`${vocal.name} 보컬 저장 취소`} onClick={()=>toggleVocalSave(vocal.id)}><Icon name="star" size={17}/></button></article>)}
    {tab==='songs' && savedSongs.map((song,index)=><article className="song-collection-row" key={song.id}><button data-action="open-song-save" onClick={()=>openSong(song.id)}><span className="song-index">{String(index+1).padStart(2,'0')}</span><span><strong>{song.title}</strong><small>{song.artist} · 프로젝트 {song.projects.length}개</small></span></button><button className="collection-remove active" aria-label={`${song.title} 곡 저장 취소`} onClick={()=>toggleSongSave(song.id)}><Icon name="bookmark" size={17}/></button></article>)}
    {((tab==='projects'&&!projectLiked)||(tab==='vocals'&&!savedVocals.length)||(tab==='songs'&&!savedSongs.length)) && <section className="empty-state collection-empty"><strong>{emptyCopy[tab][0]}</strong><p>{emptyCopy[tab][1]}</p><button className="primary" data-action="browse-collection" onClick={()=>go(tab==='vocals'?'finder':tab==='songs'?'song-browser':'detail')}>{tab==='vocals'?'Vocal Finder 열기':tab==='songs'?'곡 둘러보기':'OPEN Part 둘러보기'}</button></section>}
  </>
}

function PersonalArea({ type, go, openMainWorkspace, openSong, openCreatedProject, joined, createdProjects, projectLikes, vocalSaves, songSaves, toggleProjectLike, toggleVocalSave, toggleSongSave, openVocalProfile, profile, layers, trackCount, mix, readyForMix, resetDemo, delayedProjectIds = [] }) {
  const titles = {projects:'My projects',collection:'Collection',my:'My voice'}
  const [projectFilter,setProjectFilter] = useState('all')
  const hasProject = joined || createdProjects.length > 0
  const lifecycle = mix ? 'complete' : readyForMix ? 'mixing' : 'recording'
  const projectVisible = projectFilter==='all' || projectFilter===lifecycle
  const projectLiked = projectLikes.some(item=>item.projectId===PROJECT_ID)
  return <div className="screen simple-screen"><TopBar meta="IEUM"/><main><p className="kicker">Personal area</p><h1>{titles[type]}</h1>
    {type==='projects' && <><div className="object-tabs project-tabs" aria-label="프로젝트 상태 필터">{[['all','전체'],['recruiting','모집'],['recording','녹음'],['mixing','믹싱'],['complete','완성']].map(([value,label])=><button key={value} className={projectFilter===value?'active':''} aria-pressed={projectFilter===value} onClick={()=>setProjectFilter(value)}>{label}</button>)}</div>{joined && projectVisible && <section className="saved-card"><ResonanceRecord layers={layers} compact/><div>{delayedProjectIds.includes(PROJECT_ID)&&<span className="completion-delay-badge">녹음 필요 · 7일</span>}<div className="saved-card-title"><strong>A Thousand Years</strong><button className={projectLiked?'active':''} aria-label={projectLiked?'프로젝트 Like 취소':'프로젝트 Like'} onClick={toggleProjectLike}><Icon name="heart" size={18}/></button></div><p>{trackCount}/4 Tracks · {lifecycle.toUpperCase()}</p><button className="secondary" data-action="resume-project" onClick={()=>openMainWorkspace(mix?'complete':readyForMix?'multitrack':'workspace')}>{mix?'완성곡 열기':readyForMix?'믹싱 확인':'작업실 계속하기'}</button></div></section>}{createdProjects.filter(project=>projectFilter==='all'||projectFilter===project.status.toLowerCase()).map(project=><section className="saved-card created-project-card" key={project.id}><div className="empty-record-mark"><span>{String(project.progress||0).padStart(2,'0')}</span><small>/{String(project.partCount).padStart(2,'0')}</small></div><div>{delayedProjectIds.includes(project.id)&&<span className="completion-delay-badge">녹음 필요 · 7일</span>}<div className="saved-card-title"><strong>{project.title}</strong></div><p>{project.name} · {project.status}</p><button className="secondary" data-action="open-created-project" onClick={()=>openCreatedProject(project.id)}>작업실 열기</button></div></section>)}{!hasProject && <section className="empty-state"><p>참여하거나 만든 프로젝트가 아직 없어요.</p><button className="primary" onClick={()=>go('detail')}>OPEN Part 찾기</button><button className="secondary" onClick={()=>go('create-project')}>새 프로젝트 만들기</button></section>}</>}
    {type==='collection' && <CollectionArea go={go} openSong={openSong} projectLikes={projectLikes} vocalSaves={vocalSaves} songSaves={songSaves} toggleProjectLike={toggleProjectLike} toggleVocalSave={toggleVocalSave} toggleSongSave={toggleSongSave} openVocalProfile={openVocalProfile} layers={layers} trackCount={trackCount} mix={mix} joined={joined}/>} 
    {type==='my' && <>{profile ? <><section className="profile-card"><VoiceIdentity identity={profile.identity}/><div><p className="kicker">Voice profile</p><h2>{profile.name} · {profile.range}</h2><p>{profile.voiceType}<br/>Voice Identity 생성형 AI는 미검증</p>{profile.sampleUrl && <ProfileSamplePlayer source={profile.sampleUrl} duration={profile.sampleDuration}/>}</div></section><section className="my-voice-details"><div><span>Voice Range</span><b>{profile.range}</b><button onClick={()=>go('voice')}>다시 측정</button></div><div><span>Voice Sample</span><b>{profile.sampleSong}</b><button onClick={()=>go('voice')}>다시 등록</button></div><div><span>선호 역할</span><b>{profile.roles?.join(' · ')}</b><button onClick={()=>go('voice')}>수정</button></div><div><span>장르</span><b>{profile.genres?.join(' · ')}</b><button onClick={()=>go('voice')}>수정</button></div><div><span>음악 취향</span><b>{profile.taste?.join(' · ')}</b><button onClick={()=>go('voice')}>수정</button></div><div><span>Voice Identity</span><b>무료·로컬 생성 모델 미연결</b><button disabled>대기</button></div></section></> : <section className="empty-state"><p>등록된 Voice Profile이 없어요.</p><button className="primary" onClick={()=>go('voice')}>내 목소리 알아보기</button></section>}{import.meta.env.DEV&&<section className="demo-reset"><div><strong>처음부터 다시 검증하기</strong><p>내 Voice Profile, 참여·초대 상태와 녹음을 초기화합니다. 출처가 표시된 Soprano·Alto 시연 Track 2개만 다시 준비되어 2/4에서 시작합니다.</p></div><button className="secondary" data-action="reset-demo" onClick={resetDemo}>시연 상태 초기화</button></section>}</>}
  </main></div>
}

export default function App() {
  const persisted = useRef(loadUserState()).current
  const [screen,setScreen] = useState('home')
  const [history,setHistory] = useState([])
  const [profile,setProfile] = useState(null)
  const [joined,setJoined] = useState(Boolean(persisted.joined))
  const [invited,setInvited] = useState(Boolean(persisted.invited))
  const [invitedVocalId,setInvitedVocalId] = useState(persisted.invitedVocalId || 'luna')
  const [candidateAccepted,setCandidateAccepted] = useState(Boolean(persisted.candidateAccepted))
  const [candidateArrivalStatus,setCandidateArrivalStatus] = useState('idle')
  const [projectLikes,setProjectLikes] = useState(persisted.projectLikes)
  const [vocalSaves,setVocalSaves] = useState(persisted.vocalSaves)
  const [songSaves,setSongSaves] = useState(persisted.songSaves)
  const [createdProjects,setCreatedProjects] = useState(()=>persisted.createdProjects.map(project=>{
    if (project.ownerPartId) return project
    const parts = project.parts || PART_CATALOG.slice(0,project.partCount).map(part=>({...part,participantId:null,participant:null,status:'open',duration:null}))
    const owner = parts.find(part=>part.id===USER_PART_ID) || parts[0]
    return {...project,ownerPartId:owner.id,parts:parts.map(part=>part.id===owner.id?{...part,participantId:CURRENT_USER_ID,participant:'JISUN',status:'ready'}:part)}
  }))
  const [createdProjectTracks,setCreatedProjectTracks] = useState({})
  const [projectTracks,setProjectTracks] = useState({})
  const [tracksReady,setTracksReady] = useState(false)
  const [recordingPart,setRecordingPart] = useState(USER_PART_ID)
  const [selectedVocalId,setSelectedVocalId] = useState('luna')
  const [selectedMatchVocalId,setSelectedMatchVocalId] = useState(null)
  const [selectedSongId,setSelectedSongId] = useState(SONG_ID)
  const [selectedProjectId,setSelectedProjectId] = useState(null)
  const [activeCreatedProjectId,setActiveCreatedProjectId] = useState(persisted.activeCreatedProjectId || null)
  const [finderPartId,setFinderPartId] = useState('bass')
  const [createProjectSongId,setCreateProjectSongId] = useState(null)
  const [mix,setMix] = useState(null)
  const [mixStatus,setMixStatus] = useState('idle')
  const [mixProgress,setMixProgress] = useState(0)
  const [projectActivity,setProjectActivity] = useState(()=>({[PROJECT_ID]:new Date().toISOString(),...persisted.projectActivity}))
  const [delayNotified,setDelayNotified] = useState(persisted.delayNotified)
  const [activityClock,setActivityClock] = useState(Date.now())
  const projectLiked = projectLikes.some(entry=>entry.projectId===PROJECT_ID)
  const selectedSong = SONGS.find(song=>song.id===selectedSongId) || SONGS[0]
  const songSaved = songSaves.some(entry=>entry.songId===selectedSong.id)
  const layers = PARTS.map(part => projectTracks[part.id]?.layer || null)
  const selectedVocal = PERSON_BY_ID[selectedVocalId] || PERSON_BY_ID.luna
  const invitedPerson = PERSON_BY_ID[invitedVocalId] || PERSON_BY_ID.luna
  const selectedVocalTrack = Object.values(projectTracks).find(track => (track.participantId || personFromName(track.participant)?.id) === selectedVocalId)
  const activeCreatedProject = createdProjects.find(project=>project.id===activeCreatedProjectId) || null
  const activeProject = activeCreatedProject || PROJECT
  const activeSong = SONGS.find(song=>song.id===(activeCreatedProject?.songId || SONG_ID)) || SONGS[0]
  const activeParts = activeProject.parts || PARTS
  const activeTracks = activeCreatedProject ? (createdProjectTracks[activeCreatedProject.id] || {}) : projectTracks
  const activeLayers = activeParts.map(part=>activeTracks[part.id]?.layer || null)
  const activeProjectLiked = projectLikes.some(entry=>entry.projectId===activeProject.id)
  const activeFinderPart = activeParts.find(part=>part.id===finderPartId) || activeParts.find(part=>!part.participantId) || activeParts[0]
  const touchProjectActivity = projectId => {
    setProjectActivity(current=>({...current,[projectId]:new Date().toISOString()}))
    setDelayNotified(current=>{const next={...current};delete next[projectId];return next})
  }
  const delayedProjectIds = [
    ...(joined && !projectTracks[USER_PART_ID] && activityClock-Date.parse(projectActivity[PROJECT_ID]||new Date().toISOString())>=COMPLETION_DELAY_MS ? [PROJECT_ID] : []),
    ...createdProjects.filter(project=>{
      const ownerPartId=project.ownerPartId
      const tracks=createdProjectTracks[project.id]||{}
      return ownerPartId&&!tracks[ownerPartId]&&activityClock-Date.parse(projectActivity[project.id]||project.createdAt||new Date().toISOString())>=COMPLETION_DELAY_MS
    }).map(project=>project.id)
  ]
  const go = target => {
    const map = { home:'home', folder:'projects', bookmark:'collection', user:'my' }
    const next = map[target] || target
    setHistory(h => [...h,screen])
    window.history.pushState({ieumScreen:next},'',`#${next}`)
    setScreen(next); window.scrollTo(0,0)
  }
  const back = fallback => {
    if (history.length) {
      setHistory(current=>current.slice(0,-1))
      window.history.back()
    } else {
      window.history.replaceState({ieumScreen:fallback},'',`#${fallback}`)
      setScreen(fallback)
    }
    window.scrollTo(0,0)
  }
  const openSong = (songId,projectId = null) => { setSelectedSongId(songId); setSelectedProjectId(projectId); go('detail') }
  const openMainWorkspace = (target='workspace') => { setActiveCreatedProjectId(null); go(target) }
  const openCreatedProject = projectId => { setActiveCreatedProjectId(projectId); go('workspace') }
  const startCreateProject = (songId = null) => { setCreateProjectSongId(songId); go('create-project') }
  const createProject = project => {
    setCreatedProjects(current=>[project,...current])
    touchProjectActivity(project.id)
    setActiveCreatedProjectId(project.id)
    setCreatedProjectTracks(current=>({...current,[project.id]:{}}))
    setScreen('workspace')
    setHistory([])
    window.scrollTo(0,0)
  }
  const completeProfile = async value => {
    if (!value?.rangeData || !value?.sample?.blob) return
    const createdAt = new Date().toISOString()
    const rangeRecord = { id:RANGE_RECORD_ID, projectId:PROFILE_PROJECT_ID, kind:'voice-range', range:value.range, rangeData:value.rangeData, createdAt, origin:'measured-pitch-range' }
    const sampleRecord = { id:SAMPLE_RECORD_ID, projectId:PROFILE_PROJECT_ID, kind:'voice-sample', songId:value.sampleSong?.id || 'sample-a', songLabel:value.sampleSong?.title || 'Sample Song A', blob:value.sample.blob, mimeType:value.sample.mimeType, duration:value.sample.duration, features:value.sample.features, createdAt, origin:'live-microphone-voice-sample' }
    await Promise.all([saveTrack(rangeRecord),saveTrack(sampleRecord)])
    setProfile({name:'JISUN',voiceType:'Warm middle',range:value.range,rangeData:value.rangeData,sampleSong:sampleRecord.songLabel,sampleUrl:value.sample.url,sampleDuration:value.sample.duration,sampleFeatures:value.sample.features,roles:['Middle harmony','Support'],genres:['Indie','Ballad'],taste:['Acoustic','Film soundtrack'],identity:value.identity})
    setScreen('detail'); setHistory([]); stopMicrophone()
  }
  const join = partId => { if (partId !== USER_PART_ID) return; setActiveCreatedProjectId(null); setJoined(true); touchProjectActivity(PROJECT_ID); setScreen('workspace'); setHistory([]) }
  const openFinder = partId => { if (!partId) return; setFinderPartId(partId); setSelectedMatchVocalId(null); go('finder') }
  const invite = vocal => {
    touchProjectActivity(activeCreatedProject?.id || PROJECT_ID)
    if (activeCreatedProject) {
      const projectId=activeCreatedProject.id
      const partId=finderPartId
      setCreatedProjects(current=>current.map(project=>project.id===projectId?{...project,parts:(project.parts||[]).map(part=>{
        if(part.id!==partId) return part
        const invitations=part.invitations||[]
        if(invitations.some(item=>item.vocalId===vocal.id)) return part
        return {...part,status:'invited',invitationStatus:'sent',invitations:[...invitations,{vocalId:vocal.id,vocalName:vocal.name,status:'sent',sentAt:new Date().toISOString()}]}
      })}:project))
      window.setTimeout(()=>setCreatedProjects(current=>current.map(project=>project.id===projectId?{...project,parts:(project.parts||[]).map(part=>{
        if(part.id!==partId || part.participantId) return part
        const invitations=(part.invitations||[]).map(item=>item.vocalId===vocal.id?{...item,status:'accepted'}:{...item,status:item.status==='sent'?'closed':item.status})
        return {...part,participantId:vocal.id,participant:vocal.name,status:'accepted',invitationStatus:'accepted',invitations}
      })}:project)),2200)
    } else {
      setInvitedVocalId(vocal?.id || 'luna'); setInvited(true)
    }
    setSelectedMatchVocalId(null); setScreen('workspace'); setHistory([])
  }
  const recordPart = partId => {
    if (activeCreatedProject) {
      if (partId !== activeCreatedProject.ownerPartId) return
    } else if (!joined || partId !== (persisted.joinedPart || USER_PART_ID) || partId !== USER_PART_ID) return
    touchProjectActivity(activeCreatedProject?.id || PROJECT_ID)
    setRecordingPart(partId); setScreen('record'); setHistory([]); window.scrollTo(0,0)
  }
  const submit = async (draft,part) => {
    const targetProject = activeCreatedProject || PROJECT
    const targetParts = targetProject.parts || PARTS
    if (!draft?.blob || part?.id !== recordingPart) return
    if (activeCreatedProject ? part.id!==activeCreatedProject.ownerPartId : (!joined || part.id!==USER_PART_ID)) return
    const track = {
      id:`${targetProject.id}:${part.id}`,
      projectId:targetProject.id,
      projectSeed:targetProject.seed,
      partId:part.id,
      partIndex:targetParts.findIndex(item=>item.id===part.id),
      participantId:CURRENT_USER_ID,
      participant:'JISUN',
      blob:draft.blob,
      mimeType:draft.mimeType,
      duration:draft.duration,
      syncOffsetMs:draft.syncOffsetMs,
      noiseFloor:draft.noiseFloor,
      features:draft.features,
      layer:buildVoiceLayer(targetProject.seed,part.id,draft.features),
      origin:'live-microphone-recording',
      createdAt:new Date().toISOString()
    }
    await saveTrack(track)
    touchProjectActivity(targetProject.id)
    if (activeCreatedProject) {
      setCreatedProjectTracks(current=>({...current,[targetProject.id]:{...(current[targetProject.id]||{}),[part.id]:{...track,url:draft.url}}}))
      setCreatedProjects(current=>current.map(project=>project.id===targetProject.id?{...project,progress:Object.keys({...activeTracks,[part.id]:track}).length,status:'RECORDING',parts:project.parts.map(item=>item.id===part.id?{...item,status:'submitted'}:item)}:project))
    } else setProjectTracks(current=>({...current,[part.id]:{...track,url:draft.url}}))
    setScreen('workspace'); setHistory([]); window.scrollTo(0,0)
  }
  const toggleProjectLike = () => setProjectLikes(current => current.some(entry=>entry.projectId===PROJECT_ID)
    ? current.filter(entry=>entry.projectId!==PROJECT_ID)
    : [...current,{projectId:PROJECT_ID,savedAt:new Date().toISOString()}])
  const toggleActiveProjectLike = () => setProjectLikes(current => current.some(entry=>entry.projectId===activeProject.id)
    ? current.filter(entry=>entry.projectId!==activeProject.id)
    : [...current,{projectId:activeProject.id,savedAt:new Date().toISOString()}])
  const toggleSongSave = songId => setSongSaves(current => current.some(entry=>entry.songId===songId)
    ? current.filter(entry=>entry.songId!==songId)
    : [...current,{songId,savedAt:new Date().toISOString()}])
  const toggleVocalSave = vocalId => setVocalSaves(current => current.some(entry=>entry.vocalId===vocalId)
    ? current.filter(entry=>entry.vocalId!==vocalId)
    : [...current,{vocalId,savedAt:new Date().toISOString()}])
  const openVocalProfile = vocalId => { setSelectedVocalId(vocalId); go('vocal-profile') }
  const completeMix = value => {
    if (!(value || mix)?.blob) return
    setScreen('complete'); setHistory([])
  }
  const resetDemo = async () => {
    if (!window.confirm('내 Voice Profile과 Tenor 녹음, 참여·컬렉션 상태를 초기화할까요? 출처가 표시된 시연 Track 2개만 다시 준비되어 2/4에서 시작합니다.')) return
    stopGuides(); stopMicrophone()
    await Promise.all([clearProjectTracks(PROJECT_ID),clearProjectTracks(PROFILE_PROJECT_ID)])
    localStorage.removeItem(APP_STATE_KEY)
    window.location.reload()
  }
  const readyForMix = layers.filter(Boolean).length === PARTS.length
  const activeReadyForMix = activeLayers.filter(Boolean).length === activeParts.length

  useEffect(() => {
    const onPopState = event => {
      const next = event.state?.ieumScreen || window.location.hash.slice(1) || 'home'
      setScreen(next)
      window.scrollTo(0,0)
    }
    if (!window.history.state?.ieumScreen) window.history.replaceState({ieumScreen:screen},'',`#${screen}`)
    window.addEventListener('popstate',onPopState)
    return () => window.removeEventListener('popstate',onPopState)
  }, [])

  useEffect(() => {
    window.history.replaceState({ieumScreen:screen},'',`#${screen}`)
  }, [screen])

  useEffect(() => {
    saveUserState({joined,joinedPart:USER_PART_ID,invited,invitedVocalId,candidateAccepted,projectLikes,vocalSaves,songSaves,createdProjects,activeCreatedProjectId,projectActivity,delayNotified})
  }, [joined,invited,invitedVocalId,candidateAccepted,projectLikes,vocalSaves,songSaves,createdProjects,activeCreatedProjectId,projectActivity,delayNotified])

  useEffect(() => {
    const timer=window.setInterval(()=>setActivityClock(Date.now()),60000)
    return ()=>window.clearInterval(timer)
  },[])

  useEffect(() => {
    if (!tracksReady || !delayedProjectIds.length || typeof Notification==='undefined' || Notification.permission!=='granted') return
    const pending=delayedProjectIds.filter(projectId=>!delayNotified[projectId])
    if (!pending.length) return
    pending.forEach(projectId=>new Notification('IEUM · 녹음을 이어갈 차례예요',{body:'미완료된 내 Part를 제출하면 프로젝트가 다시 진행됩니다.',tag:`ieum-delay-${projectId}`}))
    setDelayNotified(current=>({...current,...Object.fromEntries(pending.map(projectId=>[projectId,new Date().toISOString()]))}))
  },[tracksReady,delayedProjectIds.join(','),delayNotified])

  useEffect(() => {
    if (!tracksReady || !invited || candidateAccepted || projectTracks.bass) return
    setCandidateArrivalStatus('accept-wait')
    const timer = window.setTimeout(() => setCandidateAccepted(true), 2200)
    return () => window.clearTimeout(timer)
  }, [tracksReady,invited,candidateAccepted,projectTracks.bass])

  useEffect(() => {
    if (!tracksReady || !candidateAccepted || projectTracks.bass) return
    setCandidateArrivalStatus('track-wait')
    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        setCandidateArrivalStatus('loading')
        const loaded = await loadDemoTrackByPart('bass')
        const track = {...loaded,participantId:invitedPerson.id,participant:invitedPerson.name}
        if (cancelled) return
        await saveTrack(track)
        if (cancelled) return
        setProjectTracks(current=>({...current,bass:{...track,url:URL.createObjectURL(track.blob)}}))
        setCandidateArrivalStatus('submitted')
      } catch (error) {
        console.error(error)
        setCandidateArrivalStatus('error')
      }
    }, 3200)
    return () => { cancelled=true; window.clearTimeout(timer) }
  }, [tracksReady,candidateAccepted,projectTracks.bass,invitedPerson.id,invitedPerson.name])

  useEffect(() => {
    if (!tracksReady || !readyForMix || mix) return
    let cancelled = false
    setMixStatus('processing'); setMixProgress(0)
    const run = async () => {
      try {
        const value = await createAutoMix({ tracks:Object.values(projectTracks), duration:18, onProgress:value=>!cancelled&&setMixProgress(value) })
        if (cancelled) return
        const record = { id:MIX_RECORD_ID, projectId:PROJECT_ID, kind:'auto-mix', blob:value.blob, mimeType:value.blob.type || 'audio/wav', duration:value.duration, bytes:value.bytes, origin:value.origin, processing:value.processing, createdAt:new Date().toISOString() }
        await saveTrack(record)
        if (cancelled) return
        setMix({...record,url:value.url}); setMixStatus('complete'); setMixProgress(100)
      } catch (error) {
        if (!cancelled) { console.error(error); setMixStatus('error') }
      }
    }
    const timer = window.setTimeout(run,500)
    return () => { cancelled=true; window.clearTimeout(timer) }
  }, [tracksReady,readyForMix,mix,projectTracks])

  useEffect(() => {
    let active = true
    const bootstrap = async () => {
      const [projectStored, profileStored, demoManifest] = await Promise.all([
        loadProjectTracks(PROJECT_ID),
        loadProjectTracks(PROFILE_PROJECT_ID),
        fetch('/demo-stems/manifest.json').then(response=>response.ok?response.json():Promise.reject(new Error('데모 Track manifest 없음')))
      ])
      const stored = projectStored
        .filter(track => ['live-microphone-recording','local-formant-singing-demo'].includes(track.origin) && track.blob && track.features)
        .map(track => ({...track,participantId:track.participantId || personFromName(track.participant)?.id || null,layer:buildVoiceLayer(PROJECT_SEED,track.partId,track.features)}))
      for (const entry of demoManifest.tracks.filter(item=>INITIAL_DEMO_PARTS.has(item.partId))) {
        if (stored.some(track=>track.partId===entry.partId && track.origin==='local-formant-singing-demo')) continue
        const demoTrack = await loadDisclosedDemoTrack(entry)
        await saveTrack(demoTrack)
        stored.push(demoTrack)
      }
      if (!active) return
      setProjectTracks(Object.fromEntries(stored.map(track=>[track.partId,{...track,url:URL.createObjectURL(track.blob)}])))
      const rangeRecord = profileStored.find(item=>item.kind==='voice-range')
      const sampleRecord = profileStored.find(item=>item.kind==='voice-sample' && item.blob)
      const mixRecord = projectStored.find(item=>item.kind==='auto-mix' && item.blob)
      if (rangeRecord && sampleRecord) setProfile({name:'JISUN',voiceType:'Warm middle',range:rangeRecord.range,rangeData:rangeRecord.rangeData,sampleSong:sampleRecord.songLabel,roles:['Middle harmony','Support'],genres:['Indie','Ballad'],taste:['Acoustic','Film soundtrack'],sampleUrl:URL.createObjectURL(sampleRecord.blob),sampleDuration:sampleRecord.duration,sampleFeatures:sampleRecord.features,identity:{status:'blocked',reason:'free-local-generative-model-not-connected'}})
      if (mixRecord) { setMix({...mixRecord,url:URL.createObjectURL(mixRecord.blob)}); setMixStatus('complete'); setMixProgress(100) }
      const createdTrackEntries = await Promise.all(createdProjects.map(async project=>{
        const records = await loadProjectTracks(project.id)
        const tracks = records.filter(track=>track.kind!=='auto-mix'&&track.blob&&track.features).map(track=>({...track,layer:buildVoiceLayer(project.seed,track.partId,track.features),url:URL.createObjectURL(track.blob)}))
        return [project.id,Object.fromEntries(tracks.map(track=>[track.partId,track]))]
      }))
      if (!active) return
      setCreatedProjectTracks(Object.fromEntries(createdTrackEntries))
      setTracksReady(true)
    }
    bootstrap().catch(error=>{ console.error(error); setTracksReady(true) })
    return () => { active=false }
  },[])

  useEffect(() => {
    window.__IEUM_V2__ = {
      get state(){return {screen,profile,joined,invited,candidateAccepted,projectLiked,projectLikes,vocalSaves,songSaved,songSaves,projectTracks,mix,mixStatus,mixProgress,readyForMix,projectActivity,delayedProjectIds,recordSignature:projectRecordSignature(PROJECT_SEED,layers)}},
      audioRuntime,
      projectSeed:PROJECT_SEED,
      supportedPartCounts:SUPPORTED_PART_COUNTS
    }
  }, [screen,profile,joined,invited,candidateAccepted,projectLiked,projectLikes,vocalSaves,songSaved,songSaves,projectTracks,mix,mixStatus,mixProgress,readyForMix,recordingPart,projectActivity,delayedProjectIds.join(',')])

  if (!tracksReady) return <div className="screen"><TopBar meta="TRACKS LOADING"/><main className="loading-state"><p>실제 Track 분석값을 불러오는 중…</p></main></div>

  let content
  if (screen==='home') content=<Home openSong={openSong} layers={layers} projectTracks={projectTracks} profile={profile} mix={mix} openCreateProject={()=>startCreateProject(null)} openComplete={()=>go('complete')}/>
  else if (screen==='detail') content=<Detail go={go} back={()=>back('home')} song={selectedSong} profile={profile} join={join} layers={layers} projectTracks={projectTracks} songSaved={songSaved} toggleSongSave={toggleSongSave} openVocalProfile={openVocalProfile} createdProjects={createdProjects} onCreateProject={startCreateProject} onOpenCreatedProject={openCreatedProject} initialProjectId={selectedProjectId}/>
  else if (screen==='song-browser') content=<SongBrowser back={()=>back('collection')} openSong={openSong} songSaves={songSaves} toggleSongSave={toggleSongSave} createdProjects={createdProjects} onCreateProject={startCreateProject}/>
  else if (screen==='create-project') content=<CreateProject back={()=>back(createProjectSongId?'detail':'home')} complete={createProject} initialSongId={createProjectSongId}/>
  else if (screen==='voice') content=<VoiceSetup go={go} complete={completeProfile}/>
  else if (screen==='workspace') content=<Workspace go={go} project={activeProject} song={activeSong} isCreated={Boolean(activeCreatedProject)} ownerPartId={activeCreatedProject?.ownerPartId} findVocal={openFinder} joined={joined} invited={invited} invitedPerson={invitedPerson} candidateAccepted={candidateAccepted} candidateArrivalStatus={candidateArrivalStatus} projectTracks={activeTracks} layers={activeLayers} recordPart={recordPart} projectLiked={activeProjectLiked} toggleProjectLike={toggleActiveProjectLike} openVocalProfile={openVocalProfile} mix={activeCreatedProject?null:mix} mixStatus={activeCreatedProject?'idle':mixStatus} mixProgress={activeCreatedProject?0:mixProgress} completionDelayed={delayedProjectIds.includes(activeProject.id)}/>
  else if (screen==='finder') content=<Finder go={go} invite={activeTracks[finderPartId]||activeFinderPart?.status==='accepted'?null:invite} invitedVocalIds={activeCreatedProject?(activeFinderPart?.invitations||[]).map(item=>item.vocalId):(invited?[invitedVocalId]:[])} part={activeFinderPart} vocalSaves={vocalSaves} toggleVocalSave={toggleVocalSave} openVocalProfile={openVocalProfile} selectedVocalId={selectedMatchVocalId} setSelectedVocalId={setSelectedMatchVocalId}/>
  else if (screen==='vocal-profile') content=<OtherVocalProfile vocal={selectedVocal} back={()=>back('collection')} saved={vocalSaves.some(item=>item.vocalId===selectedVocalId)} toggleSave={toggleVocalSave} sampleUrl={selectedVocalTrack?.url} sampleDuration={selectedVocalTrack?.duration}/>
  else if (screen==='record') content=<Recorder go={go} submit={submit} partId={recordingPart} projectTracks={activeTracks} layers={activeLayers} project={activeProject} parts={activeParts}/>
  else if (screen==='multitrack') content=<Multitrack go={go} project={activeProject} parts={activeParts} ownerPartId={activeCreatedProject?.ownerPartId || USER_PART_ID} projectTracks={activeTracks} layers={activeLayers} readyForMix={activeReadyForMix} recordOwnPart={()=>recordPart(activeCreatedProject?.ownerPartId || USER_PART_ID)} complete={completeMix} projectLiked={activeProjectLiked} toggleProjectLike={toggleActiveProjectLike} openVocalProfile={openVocalProfile} mix={activeCreatedProject?null:mix} mixStatus={activeCreatedProject?'idle':mixStatus} progress={activeCreatedProject?0:mixProgress}/>
  else if (screen==='complete') content=<Complete go={go} mix={mix} layers={layers} projectTracks={projectTracks} projectLiked={projectLiked} toggleProjectLike={toggleProjectLike} openVocalProfile={openVocalProfile}/>
  else if (['projects','collection','my'].includes(screen)) content=<PersonalArea type={screen} go={go} openMainWorkspace={openMainWorkspace} openSong={openSong} openCreatedProject={openCreatedProject} joined={joined} createdProjects={createdProjects} projectLikes={projectLikes} vocalSaves={vocalSaves} songSaves={songSaves} toggleProjectLike={toggleProjectLike} toggleVocalSave={toggleVocalSave} toggleSongSave={toggleSongSave} openVocalProfile={openVocalProfile} profile={profile} layers={layers} trackCount={Object.keys(projectTracks).length} mix={mix} readyForMix={readyForMix} resetDemo={resetDemo} delayedProjectIds={delayedProjectIds}/>
  else content=<Home openSong={openSong} layers={layers} projectTracks={projectTracks} profile={profile} mix={mix} openCreateProject={()=>startCreateProject(null)} openComplete={()=>go('complete')}/>
  const navCurrent = screen==='home'?'home':screen==='collection'?'bookmark':screen==='my'?'user':'folder'
  const showBottomNav = !['record','multitrack'].includes(screen)
  return <>{content}{showBottomNav && <BottomNav current={navCurrent} go={go}/>}</>
}
