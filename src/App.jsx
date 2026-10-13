import React, { useEffect, useMemo, useRef, useState } from 'react'
import VoicePreferenceChoices, {preferenceValues} from './VoicePreferenceChoices.jsx'
import Icon from './Icons.jsx'
import { PITCH_ANALYSIS_VERSION } from './pitch.js'
import { prepareVoiceRangeRecord, prepareVoiceSampleRecord, voiceSourceRevision } from './profileSource.js'
import { loadMeasuredProfileIdentityInput } from './voiceIdentitySources.js'
import { persistPersonalIdentityResult, loadPersonalIdentityResult, prepareStoredSubmittedVoiceControls,
  persistStoredTrackVoiceLayer, loadStoredTrackVoiceLayer, persistStoredProjectRecordInput, loadStoredProjectRecordInput } from './voiceIdentityStore.js'
import {loadStoredPersonalGraphic,loadStoredProjectRenderResources} from './voiceIdentityResources.js'
import { prepareSubmittedTrackRecord } from './trackSource.js'
import { prepareProjectMix } from './mixSource.js'
import figmaAssets from './figmaAssets.json' with { type: 'json' }
import {
  analyzeBlob,
  audioRuntime,
  cancelRecording,
  createAutoMix,
  createPreviewMix,
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
  stopRecording,
  getRecordingTimeline,
  loadProvidedAudio,
  updateRecordingGuides
} from './audio.js'
import { loadProjectBacking, projectAudioReference, assertProjectTrackAudio, recordingEntryPrompt } from './projectAudio.js'
import { readLocalUserState, writeLocalUserState } from './projectService.js'
import { evaluatePartFit, sharedVoicePreferences, recommendSampleSongs, openProjectRangeAvailability } from './matching.js'
import { buildVoiceLayer, projectRecordSignature, isSupportedVoiceAnalysis } from './voiceAnalysis.js'
import { clearProjectTracks, deleteTrack, deleteRecordingDraft, loadProjectTracks, loadTrack, saveTrack, saveTracks, saveSubmittedTrack } from './trackStore.js'
import { createProjectModel, resolveRecordPartSlots, SUPPORTED_PART_COUNTS, submittedProjectTracks, allProjectTracksSubmitted, localProjectLifecycle } from './projectModel.js'
import { CURRENT_USER_ID, PEOPLE, PERSON_BY_ID, SAMPLE_SONGS, personFromName } from './catalog.js'
import { createRecordingInflowRenderer, createResonanceRenderer } from './resonanceWebGL.js'
import { loadAiVoiceFields } from './aiVoiceLayer.js'

// Navigation hints are optional; a blocked cache must not block the app.
function readNavigationHint(key, fallback, allowed) {
  try {
    const value=sessionStorage.getItem(key)
    return value && (!allowed || allowed.includes(value)) ? value : fallback
  } catch { return fallback }
}
function writeNavigationHint(key, value) {
  try { sessionStorage.setItem(key,value) } catch { /* React keeps this session's selection. */ }
}

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
    const parsed = readLocalUserState(localStorage,APP_STATE_KEY) || {}
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
      delayNotified:parsed.delayNotified && typeof parsed.delayNotified==='object' ? parsed.delayNotified : {}, songSaves, storageReadFailed:false
    }
  }
  catch { return { joined:false, joinedPart:USER_PART_ID, invited:false, invitedVocalId:null, candidateAccepted:false, projectLikes:[], vocalSaves:[], songSaves:[], createdProjects:[], projectActivity:{}, delayNotified:{}, storageReadFailed:true } }
}
const saveUserState = value => writeLocalUserState(localStorage,APP_STATE_KEY,value)
const midiToNote = midi => {
  const value = Math.round(midi)
  const names = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B']
  return `${names[((value % 12) + 12) % 12]}${Math.floor(value / 12) - 1}`
}
const scrollToTop = () => {
  window.scrollTo(0,0)
  requestAnimationFrame(()=>document.querySelector('.screen')?.scrollTo({top:0,left:0}))
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

async function refreshTrackAnalysis(track, projectSeed) {
  let features = track.features
  if (!isSupportedVoiceAnalysis(features)) {
    const analyzed = await analyzeBlob(track.blob)
    features = analyzed.features
  }
  const refreshed = {
    ...track,
    features,
    layer:buildVoiceLayer(projectSeed,track.partId,features)
  }
  if (features !== track.features || refreshed.layer?.signature !== track.layer?.signature) await saveTrack(refreshed)
  return refreshed
}

function TopBar({ title, meta, back, action, onAction, actionLabel, actionPressed, actionId, figmaHeader = false }) {
  return <header className="topbar">
    {back ? <button className="icon-btn" aria-label="뒤로" data-action="back" onClick={back}>{figmaHeader?<img className="figma-header-icon" src={figmaAssets.imgFaFaChevronLeft} alt=""/>:<Icon name="back" />}</button> : <div className="wordmark">IEUM</div>}
    <div className="topbar-center">{title}</div>
    {action ? <button className="text-action" aria-label={actionLabel} aria-pressed={actionPressed} data-action={actionId} onClick={onAction}>{action}</button> : <span className="top-meta">{meta}</span>}
  </header>
}

function VoiceIdentity({ identity }) {
  const [stored,setStored]=useState(null)
  const selectorKey=identity?.selector?JSON.stringify(identity.selector):''
  useEffect(()=>{
    let current=true,resource
    if(selectorKey)loadStoredPersonalGraphic(JSON.parse(selectorKey)).then(result=>{
      if(!current){result?.dispose();return}
      resource=result;setStored({key:selectorKey,result})
    }).catch(()=>{if(current)setStored({key:selectorKey,result:null})})
    return()=>{current=false;resource?.dispose()}
  },[selectorKey])
  const displayed=selectorKey?(stored?.key===selectorKey && !stored.result?.disposed?stored.result:null):identity
  if (!displayed?.image) return <figure className="voice-identity pending" aria-label="Voice Identity 생성 대기">
    <div><span>VOICE IDENTITY</span><strong>{selectorKey?'저장 결과 확인':'생성형 AI 미검증'}</strong><small>{selectorKey?(stored?.key===selectorKey?'지정된 생성 결과를 확인하지 못했어요.':'지정된 생성 결과를 불러오고 있어요.'):'대표 Voice Sample은 저장됐지만 무료·로컬 생성 모델이 연결되지 않았습니다.'}</small></div>
  </figure>
  return <figure className="voice-identity" data-identity-model={displayed.model || ''}>
    <img src={displayed.image} alt="대표 Voice Sample로 생성한 Voice Identity" />
    <figcaption>{displayed.model}{displayed.sourceFingerprint?` · ${displayed.sourceFingerprint}`:''}</figcaption>
  </figure>
}

function LegacyResonanceRecord({ active = [true, false, true, false], layers = [], activePartIndex = 1, state = 'rest', level = 0, seed = PROJECT_SEED, label, compact = false }) {
  const canvasRef = useRef(null)
  const levelRef = useRef(level)
  useEffect(() => { levelRef.current = level }, [level])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const numericSeed = typeof seed === 'number' ? seed : [...String(seed)].reduce((sum,char,index)=>sum+char.charCodeAt(0)*(index+17),0)
    const slots=Array(4).fill(null)
    if(layers.length)layers.forEach((layer,index)=>{const partIndex=PARTS.findIndex(part=>part.id===layer?.partId);slots[partIndex>=0?partIndex:index]=layer})
    else active.forEach((enabled,index)=>{if(enabled)slots[index]={partId:PARTS[index]?.id,seed:numericSeed+index*97,baseRadius:[.72,.59,.48,.36][index],spread:.1,turbulence:.72,opacity:.34,phase:index*1.47}})
    if(state==='recording'&&!slots[activePartIndex])slots[activePartIndex]={partId:PARTS[activePartIndex]?.id,seed:numericSeed+activePartIndex*997,baseRadius:[.72,.59,.48,.36][activePartIndex],spread:.09,turbulence:1,opacity:.3,phase:activePartIndex}
    const particleContext=canvas.getContext('2d',{alpha:true})
    if(particleContext){
      const palette=[[62,137,255],[255,121,103],[232,197,153],[67,199,190]]
      const seededRandom=(seedValue)=>{let value=(Math.abs(Math.floor(seedValue))||1)>>>0;return()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
      const referenceLayers=[]
      const referenceImage=new Image()
      referenceImage.decoding='async'
      const prepareReferenceLayers=()=>{
        const textureSize=620,source=document.createElement('canvas'),sourceContext=source.getContext('2d',{willReadFrequently:true})
        source.width=textureSize;source.height=textureSize;sourceContext.drawImage(referenceImage,0,0,textureSize,textureSize)
        const sourcePixels=sourceContext.getImageData(0,0,textureSize,textureSize)
        for(let layerIndex=0;layerIndex<4;layerIndex++){
          const layerCanvas=document.createElement('canvas'),layerContext=layerCanvas.getContext('2d')
          layerCanvas.width=textureSize;layerCanvas.height=textureSize
          const layerPixels=layerContext.createImageData(textureSize,textureSize)
          for(let pixel=0;pixel<sourcePixels.data.length;pixel+=4){
            const r=sourcePixels.data[pixel]/255,g=sourcePixels.data[pixel+1]/255,b=sourcePixels.data[pixel+2]/255,a=sourcePixels.data[pixel+3]
            const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,saturation=max?delta/max:0
            let hue=0
            if(delta){if(max===r)hue=60*(((g-b)/delta)%6);else if(max===g)hue=60*((b-r)/delta+2);else hue=60*((r-g)/delta+4);if(hue<0)hue+=360}
            const visible=max>.16&&a>0
            const matches=layerIndex===0?visible&&hue>=205&&hue<265&&saturation>.3:layerIndex===1?visible&&(hue<18||hue>=342)&&saturation>.32:layerIndex===2?visible&&hue>=28&&hue<72&&saturation>.16&&max>.28:visible&&hue>=145&&hue<205&&saturation>.25
            if(matches){layerPixels.data[pixel]=sourcePixels.data[pixel];layerPixels.data[pixel+1]=sourcePixels.data[pixel+1];layerPixels.data[pixel+2]=sourcePixels.data[pixel+2];layerPixels.data[pixel+3]=Math.round(a*Math.min(1,.84+max*.34))}
          }
          layerContext.putImageData(layerPixels,0,0);referenceLayers[layerIndex]=layerCanvas
        }
        drawParticleRecord(performance.now())
      }
      referenceImage.onload=prepareReferenceLayers
      referenceImage.src='/resonance-reference-v2.png'
      let animationFrame=0,lastFrame=0
      const drawParticleRecord=(now=0)=>{
        const size=canvas.clientWidth
        if(size<8)return
        const ratio=Math.min(window.devicePixelRatio||1,2),pixels=Math.round(size*ratio)
        if(canvas.width!==pixels||canvas.height!==pixels){canvas.width=pixels;canvas.height=pixels}
        const ctx=particleContext,c=pixels/2,discRadius=c*.965
        ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,pixels,pixels);ctx.save();ctx.beginPath();ctx.arc(c,c,discRadius,0,Math.PI*2);ctx.clip()
        const vinyl=ctx.createRadialGradient(c*.82,c*.76,c*.04,c,c,discRadius)
        vinyl.addColorStop(0,'#211a15');vinyl.addColorStop(.22,'#100c0a');vinyl.addColorStop(.72,'#090706');vinyl.addColorStop(1,'#030303');ctx.fillStyle=vinyl;ctx.fillRect(0,0,pixels,pixels)
        ctx.globalCompositeOperation='screen'
        for(let groove=0;groove<96;groove++){
          const radius=discRadius*(.22+groove*.00765)
          ctx.beginPath();ctx.arc(c,c,radius,0,Math.PI*2);ctx.strokeStyle=`rgba(188,164,136,${groove%7===0?.032:.012})`;ctx.lineWidth=Math.max(1,ratio*.32);ctx.stroke()
        }
        const completeTexture=state==='complete'&&referenceImage.complete&&referenceLayers.length===4
        if(completeTexture){ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.92;ctx.drawImage(referenceImage,c-discRadius,c-discRadius,discRadius*2,discRadius*2);ctx.restore()}
        const liveAmount=state==='recording'?Math.min(1,Math.max(0,levelRef.current))*1.4:0
        slots.forEach((layer,layerIndex)=>{
          if(!layer)return
          const layerSeed=Number(layer.seed??numericSeed+layerIndex*97)+numericSeed*.071
          const random=seededRandom(layerSeed),color=palette[layerIndex]
          const energy=Math.max(.12,Math.min(1,Number(layer.opacity??.34)*1.85))
          const baseRadius=Math.max(.3,Math.min(.82,Number(layer.baseRadius??.55)))
          const spread=Math.max(.055,Math.min(.24,Number(layer.spread??.1)))
          const turbulence=Math.max(.2,Math.min(1.4,Number(layer.turbulence??.72)))
          const live=layerIndex===activePartIndex?liveAmount:0
          const textureLayer=referenceLayers[layerIndex]
          if(textureLayer&&!completeTexture){
            const phase=Number(layer.phase??0),featureScale=.985+(baseRadius-.55)*.045+live*.012
            ctx.save();ctx.translate(c,c);ctx.rotate((phase%1-.5)*.035+(state==='recording'&&layerIndex===activePartIndex?now*.000025*live:0));ctx.scale(featureScale,featureScale)
            ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,.7+energy*.28+live*.18);ctx.drawImage(textureLayer,-discRadius,-discRadius,discRadius*2,discRadius*2);ctx.restore()
          }
          const flowPaths=[
            [
              [[.94,-.62],[-.42,-1.04],[-1.04,.18],[.56,.88]],
              [[-.9,.58],[-.28,1.05],[.92,.82],[.98,-.18]]
            ],
            [
              [[-.94,-.5],[.3,-1.06],[1.05,.02],[-.08,.92]],
              [[.88,.72],[1.04,-.2],[.16,-.94],[-.74,-.58]]
            ],
            [
              [[-.9,.56],[-.4,1.05],[.8,.96],[.94,-.3]],
              [[.8,-.84],[-.16,-1.04],[-.98,-.2],[-.34,.82]]
            ],
            [
              [[.7,.94],[1.08,.18],[.46,-.96],[-.66,-.8]],
              [[-.9,-.12],[-.72,.92],[.58,1.02],[.94,.16]]
            ]
          ]
          const projectRotation=((numericSeed%37)/37-.5)*.14,rotationCos=Math.cos(projectRotation),rotationSin=Math.sin(projectRotation)
          const strandCount=textureLayer?Math.round(10+energy*8+live*8):Math.round(50+energy*34+live*14)
          const pointOnFlow=(t,offset,wobble=0,branch=0)=>{
            const controls=flowPaths[layerIndex][branch%2]
            const u=1-t,u2=u*u,t2=t*t
            let x=u2*u*controls[0][0]+3*u2*t*controls[1][0]+3*u*t2*controls[2][0]+t2*t*controls[3][0]
            let y=u2*u*controls[0][1]+3*u2*t*controls[1][1]+3*u*t2*controls[2][1]+t2*t*controls[3][1]
            const dx=3*u2*(controls[1][0]-controls[0][0])+6*u*t*(controls[2][0]-controls[1][0])+3*t2*(controls[3][0]-controls[2][0])
            const dy=3*u2*(controls[1][1]-controls[0][1])+6*u*t*(controls[2][1]-controls[1][1])+3*t2*(controls[3][1]-controls[2][1])
            const length=Math.max(.001,Math.hypot(dx,dy)),normalX=-dy/length,normalY=dx/length
            const featureScale=.88+(baseRadius-.55)*.16
            const noiseOffset=(Math.sin(t*12.7+wobble+layerSeed*.011)*.018+Math.sin(t*31.1-wobble)*.006)*turbulence
            x=x*featureScale+normalX*(offset*.5+noiseOffset)
            y=y*featureScale+normalY*(offset*.5+noiseOffset)
            const rotatedX=x*rotationCos-y*rotationSin,rotatedY=x*rotationSin+y*rotationCos
            const livePull=state==='recording'&&layerIndex===activePartIndex?Math.sin(Math.PI*t)*live*.018*Math.sin(now*.004+t*8):0
            return [c+rotatedX*discRadius,c+(rotatedY+livePull)*discRadius]
          }
          ctx.globalCompositeOperation='lighter'
          for(let strand=0;strand<strandCount;strand++){
            const normalized=(strand/(strandCount-1)-.5)
            const offset=normalized*spread*3.2+(random()-.5)*spread*.5
            const start=.02+random()*.13,end=.82+random()*.17,wobble=random()*Math.PI*2
            const branch=strand%5<2?1:0
            ctx.beginPath()
            for(let step=0;step<=54;step++){
              const t=start+(end-start)*(step/54),point=pointOnFlow(t,offset,wobble,branch)
              if(step===0)ctx.moveTo(point[0],point[1]);else ctx.lineTo(point[0],point[1])
            }
            const prominence=.018+Math.pow(1-Math.abs(normalized),2)*(.045+energy*.045)+random()*.018
            ctx.strokeStyle=`rgba(${color[0]},${color[1]},${color[2]},${prominence*(1+live*.65)})`
            ctx.lineWidth=ratio*(.28+random()*.62+energy*.22);ctx.stroke()
          }
          const particleCount=textureLayer?Math.round(55+energy*55+live*60):Math.round(360+energy*360+live*120)
          for(let particle=0;particle<particleCount;particle++){
            const t=Math.pow(random(),.92)*.92+.025
            const clustered=((random()+random()+random())/3-.5)*spread*3.9
            const point=pointOnFlow(t,clustered,random()*6.283,random()<.38?1:0)
            const flicker=.22+random()*.78,sizeDot=ratio*(.32+random()*(.72+energy*.64+live*.25))
            ctx.beginPath();ctx.arc(point[0],point[1],sizeDot,0,Math.PI*2)
            ctx.fillStyle=`rgba(${color[0]},${color[1]},${color[2]},${(.08+flicker*.5)*(1+live*.55)})`;ctx.fill()
            if(random()>.9){ctx.beginPath();ctx.moveTo(point[0]-sizeDot*2.8,point[1]);ctx.lineTo(point[0]+sizeDot*2.8,point[1]);ctx.strokeStyle=`rgba(${color[0]},${color[1]},${color[2]},${.12+flicker*.28})`;ctx.lineWidth=Math.max(.45,ratio*.34);ctx.stroke()}
          }
        })
        ctx.globalCompositeOperation='source-over'
        const sheen=ctx.createLinearGradient(c*.28,c*.2,c*1.62,c*1.74);sheen.addColorStop(0,'rgba(255,236,206,.045)');sheen.addColorStop(.46,'rgba(255,236,206,0)');sheen.addColorStop(.53,'rgba(255,236,206,.025)');sheen.addColorStop(1,'rgba(255,236,206,0)');ctx.fillStyle=sheen;ctx.fillRect(0,0,pixels,pixels)
        const hubRadius=discRadius*.205,hub=ctx.createRadialGradient(c-hubRadius*.28,c-hubRadius*.3,0,c,c,hubRadius);hub.addColorStop(0,'#5b4431');hub.addColorStop(.36,'#35281e');hub.addColorStop(1,'#0d0a08');ctx.beginPath();ctx.arc(c,c,hubRadius,0,Math.PI*2);ctx.fillStyle=hub;ctx.fill();ctx.strokeStyle='rgba(193,151,105,.34)';ctx.lineWidth=ratio;ctx.stroke()
        for(let ring=1;ring<9;ring++){ctx.beginPath();ctx.arc(c,c,hubRadius*(ring/9),0,Math.PI*2);ctx.strokeStyle='rgba(204,166,122,.035)';ctx.lineWidth=Math.max(.5,ratio*.3);ctx.stroke()}
        ctx.beginPath();ctx.arc(c,c,discRadius*.033,0,Math.PI*2);ctx.fillStyle='#020202';ctx.fill();ctx.restore()
      }
      const draw=(now=0)=>{if(now&&now-lastFrame<50){animationFrame=requestAnimationFrame(draw);return}lastFrame=now;drawParticleRecord(now);if(state==='recording'||state==='processing')animationFrame=requestAnimationFrame(draw)}
      draw();const particleObserver=new ResizeObserver(()=>drawParticleRecord(performance.now()));particleObserver.observe(canvas)
      return()=>{particleObserver.disconnect();cancelAnimationFrame(animationFrame);referenceImage.onload=null}
    }
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true})
    let raf=0,lastPaint=0
    if(!gl){
      const ctx=canvas.getContext('2d'),ratio=Math.min(window.devicePixelRatio||1,2)
      const drawFallback=()=>{const size=canvas.clientWidth;if(size<8)return;canvas.width=size*ratio;canvas.height=size*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);const c=size/2,r=c-3;ctx.clearRect(0,0,size,size);ctx.beginPath();ctx.arc(c,c,r,0,Math.PI*2);ctx.fillStyle='#090706';ctx.fill();slots.forEach((layer,index)=>{if(!layer)return;ctx.beginPath();ctx.arc(c,c,r*(.48+index*.06),0,Math.PI*2);ctx.strokeStyle=['#3e89ff','#ff7967','#e8c599','#43c7be'][index];ctx.globalAlpha=.45;ctx.lineWidth=3;ctx.stroke()});ctx.globalAlpha=1;ctx.beginPath();ctx.arc(c,c,r*.2,0,Math.PI*2);ctx.fillStyle='#0b0908';ctx.fill()}
      drawFallback();const observer=new ResizeObserver(drawFallback);observer.observe(canvas);return()=>observer.disconnect()
    }
    const vertex=`attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`
    const fragment=`precision highp float;
varying vec2 vUv;uniform vec2 uResolution;uniform float uTime;uniform float uLiveLevel;uniform float uLiveIndex;uniform vec4 uLayerA[4];uniform vec4 uLayerB[4];
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int j=0;j<4;j++){v+=a*noise(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return v;}
vec3 voiceColor(int i){if(i==0)return vec3(.2,.62,1.22);if(i==1)return vec3(1.12,.39,.3);if(i==2)return vec3(.96,.79,.58);return vec3(.18,.82,.76);}
void main(){
 vec2 p=(vUv-.5)*2.;float r=length(p),ang=atan(p.y,p.x);float disc=1.-smoothstep(.965,.997,r);
 float warmFalloff=max(0.,1.-r);float materialNoise=(noise(p*vec2(92.,77.))-.5)*.008;
 vec3 col=mix(vec3(.016,.012,.01),vec3(.105,.081,.064),warmFalloff*.58)+materialNoise;
 float groovesA=(.5+.5*sin(r*430.+sin(ang*3.)*1.7))*(.009+.012*smoothstep(.2,.95,r));
 float groovesB=(.5+.5*sin(r*267.-sin(ang*2.)*1.2))*.006;col+=vec3(groovesA+groovesB);
 float outerRim=smoothstep(.947,.973,r)*(1.-smoothstep(.985,.998,r));col+=vec3(.18,.145,.11)*outerRim*.22;
 for(int i=0;i<4;i++){
  vec4 a=uLayerA[i],b=uLayerB[i];if(a.x<.5)continue;
  float live=1.-step(.45,abs(float(i)-uLiveIndex));float seed=b.z*37.13;
  vec2 polar=vec2(cos(ang),sin(ang));
  float warp=(fbm(polar*1.65+vec2(r*2.7+seed,-r*2.1+seed*.7))-.5)*(.2+a.w*.085);
  float theta=ang+warp+sin(ang*2.+b.x)*.035;
  float center=.54+(a.y-.54)*.31+sin(theta+b.x)*(.12+a.w*.014)+sin(theta*3.+seed)*(.045+a.w*.009);
  center+=live*sin(theta*8.+uTime*3.2)*uLiveLevel*.028;
  float width=.07+a.z*.84;float d=abs(r-center);float ribbon=exp(-1.82*d*d/(width*width));
  float lobeA=pow(.5+.5*cos(theta-b.x*.73-seed*.11),3.4);float lobeB=.78*pow(.5+.5*cos(theta-b.x*.41+2.35+seed*.07),5.2);float presence=.055+max(lobeA,lobeB);
  float flowNoise=fbm(polar*2.45+vec2((r-center)*12.+seed,-(r-center)*10.+seed*.4));
  float fibers=pow(.5+.5*cos((r-center)*132.+flowNoise*5.5+sin(theta*3.+seed)*1.1),22.);
  float hair=pow(.5+.5*cos((r-center)*248.+flowNoise*8.5+sin(theta*5.-seed)*.8),28.);
  float flowAngle=.68+b.x*.12+seed*.035+r*.95;float cs=cos(flowAngle),sn=sin(flowAngle);vec2 flowP=mat2(cs,-sn,sn,cs)*p;
  vec2 organicP=flowP*vec2(4.2,6.8);float domain=fbm(organicP*.31+vec2(seed,-seed*.37));
  float ridge=pow(1.-abs(noise(organicP+vec2(domain*3.1,-domain*2.4))*2.-1.),4.6);
  float ridgeFine=pow(1.-abs(noise(organicP*1.72+vec2(-domain*2.2,domain*2.8))*2.-1.),8.5);
  float bend=sin(flowP.x*2.15+seed*1.7)*(.2+a.w*.025)+sin(flowP.x*4.7-seed)*.035;
  float plumeCurve=flowP.y-flowP.x*.16-bend;
  float plumeCurve2=flowP.y+.32+flowP.x*.08-sin(flowP.x*1.72+seed*1.3+1.8)*(.13+a.w*.016);
  float plumeWidth=.12+a.z*.68;float plumeEnvelope=smoothstep(1.08,.2,abs(flowP.x));
  float plume=exp(-1.62*plumeCurve*plumeCurve/(plumeWidth*plumeWidth))*plumeEnvelope;
  float plume2=exp(-2.15*plumeCurve2*plumeCurve2/(plumeWidth*plumeWidth*.72))*plumeEnvelope;
  float strandNoise=noise(vec2(flowP.x*1.8+domain*1.7,plumeCurve*33.+seed*4.1));
  float strandNoiseFine=noise(vec2(flowP.x*3.2-domain*1.2,plumeCurve*61.-seed*2.7));
  float strandNoise2=noise(vec2(flowP.x*1.55-domain*1.9,plumeCurve2*38.+seed*3.3));
  float plumeFibers=pow(1.-abs(strandNoise*2.-1.),10.)*.76+pow(1.-abs(strandNoiseFine*2.-1.),15.)*.42;
  float plumeFibers2=pow(1.-abs(strandNoise2*2.-1.),11.);
  float brokenCadence=.28+.72*smoothstep(.24,.78,noise(vec2(flowP.x*7.2+seed*5.1,plumeCurve*5.3-domain*2.1)));
  vec2 sparkGrid=(p+vec2(seed*.01))*uResolution.x*.18;vec2 sparkCell=floor(sparkGrid);vec2 sparkUv=fract(sparkGrid)-.5;
  float sparkShape=smoothstep(.34,.035,length(sparkUv));float spark=sparkShape*step(.9,hash21(sparkCell+seed))*ribbon*presence;
  vec2 pinGrid=(p+vec2(seed*.013))*uResolution.x*.31;vec2 pinCell=floor(pinGrid);vec2 pinUv=fract(pinGrid)-.5;
  float pinShape=smoothstep(.22,.018,length(pinUv));float pin=pinShape*step(.94,hash21(pinCell-seed))*ribbon*presence;
  float colorHaze=ribbon*presence*(.009+flowNoise*.007)+(plume+plume2)*(.008+domain*.005);
  float ringFlow=ribbon*presence*(.005+fibers*.045+hair*.018+ridge*.17+ridgeFine*.11);
  float streamWindow=.025+.975*pow(presence,1.42);
  float crossingFlow=(plume*(.01+plumeFibers*brokenCadence*1.34+ridge*.18+ridgeFine*.12)+plume2*(.006+plumeFibers2*.86+ridgeFine*.13))*streamWindow;
  float intensity=colorHaze+ringFlow+crossingFlow+spark*3.1+pin*3.4;
  intensity*=.72+b.y*.78+live*uLiveLevel*.55;col+=voiceColor(i)*intensity;
 }
 float sheen=smoothstep(.2,0.,abs(p.x+p.y*.58-.12))*(1.-smoothstep(.12,.91,r))*.038;col+=vec3(.72,.63,.51)*sheen;
 float hub=1.-smoothstep(.185,.205,r);float hubDepth=max(0.,1.-r/.205);
 vec3 hubCol=mix(vec3(.027,.02,.016),vec3(.2,.155,.112),hubDepth*.78);
 float hubGroove=(.5+.5*sin(r*185.))*smoothstep(.035,.19,r)*.025;hubCol+=vec3(.32,.245,.18)*hubGroove;
 float hubSpec=smoothstep(.09,0.,length(p-vec2(-.055,.065)))*.13;hubCol+=vec3(.7,.56,.4)*hubSpec;
 col=mix(col,hubCol,hub);float hubRim=smoothstep(.21,.198,r)*(1.-smoothstep(.185,.194,r));col+=vec3(.28,.215,.16)*hubRim*.32;
 float hole=1.-smoothstep(.026,.038,r);col=mix(col,vec3(.005,.004,.003),hole);
 col=1.-exp(-col*1.18);col=pow(col,vec3(.9));gl_FragColor=vec4(col*disc,disc);
}`
    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader}
    let program
    try{program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program))}catch(error){console.error('Resonance shader unavailable',error);return}
    gl.useProgram(program)
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW)
    const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0)
    const layerA=new Float32Array(16),layerB=new Float32Array(16)
    slots.forEach((layer,index)=>{if(!layer)return;layerA.set([1,layer.baseRadius??.52,layer.spread??.09,layer.turbulence??.7],index*4);layerB.set([layer.phase??index,layer.opacity??.3,((layer.seed??numericSeed+index*97)%100000)/100000,0],index*4)})
    gl.uniform4fv(gl.getUniformLocation(program,'uLayerA[0]'),layerA);gl.uniform4fv(gl.getUniformLocation(program,'uLayerB[0]'),layerB)
    gl.uniform1f(gl.getUniformLocation(program,'uLiveIndex'),state==='recording'?activePartIndex:-10)
    const timeLocation=gl.getUniformLocation(program,'uTime'),levelLocation=gl.getUniformLocation(program,'uLiveLevel'),resolutionLocation=gl.getUniformLocation(program,'uResolution')
    const ratio=Math.min(window.devicePixelRatio||1,2)
    const resize=()=>{const size=canvas.clientWidth;if(size<8)return false;const pixels=Math.round(size*ratio);if(canvas.width!==pixels||canvas.height!==pixels){canvas.width=pixels;canvas.height=pixels;gl.viewport(0,0,pixels,pixels)}gl.uniform2f(resolutionLocation,pixels,pixels);return true}
    const draw=(now=0)=>{if(now&&now-lastPaint<48){raf=requestAnimationFrame(draw);return}if(now)lastPaint=now;if(!resize())return;gl.uniform1f(timeLocation,now*.001);gl.uniform1f(levelLocation,levelRef.current);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);if(state==='recording'||state==='processing')raf=requestAnimationFrame(draw)}
    draw();const observer=new ResizeObserver(()=>{cancelAnimationFrame(raf);draw()})
    observer.observe(canvas)
    return () => { observer.disconnect(); cancelAnimationFrame(raf);gl.deleteBuffer(buffer);gl.deleteProgram(program) }
  }, [active.join(','), layers.map(layer=>layer?.signature||'').join(','), activePartIndex, state, seed])
  const layerCount = layers.length ? layers.filter(Boolean).length : active.filter(Boolean).length
  return <figure className={`record ${compact ? 'record-compact' : ''}`} data-state={state} data-record-signature={projectRecordSignature(String(seed),layers)} aria-label={label || `공명 레코드, ${layerCount}개 Track 활성`}>
    <canvas ref={canvasRef} />
    {state === 'processing' && <div className="record-processing">MIX</div>}
  </figure>
}

function ResonanceRecord({ active = [true, false, true, false], layers = [], parts = PARTS, tracks, projectId = PROJECT_ID, activePartIndex = 1, state = 'rest', level = 0, seed = PROJECT_SEED, label, compact = false, recordRef }) {
  const materialRef = useRef(null)
  const particleRef = useRef(null)
  const recordTimelineRef = useRef({})
  const levelRef = useRef(level)
  const [rendererError, setRendererError] = useState('')
  const [aiFields,setAiFields]=useState([])
  const [aiError,setAiError]=useState('')
  const [storedRender,setStoredRender]=useState(null)
  const recordKey=recordRef?JSON.stringify(recordRef):''
  const partIds=parts.map(part=>part.id).join(':')
  useEffect(()=>{
    let current=true,resource
    setAiFields([]);setAiError('')
    if(recordKey){
      loadStoredProjectRenderResources(JSON.parse(recordKey)).then(result=>{
        if(!current){result.dispose();return}
        if(result.input.projectId!==projectId || result.input.projectSeed!==String(seed) || result.input.partIds.join(':')!==partIds){result.dispose();throw new Error('Stored graphic does not match this Project')}
        resource=result;setStoredRender({key:recordKey,result})
      }).catch(error=>{if(current){setStoredRender(null);setAiError(error.message)}})
    }else if(Object.values(tracks || {}).some(track=>track.aiVoiceLayer)){
      loadAiVoiceFields(tracks,String(seed),parts.map(part=>part.id),projectId)
        .then(fields=>{if(current)setAiFields(fields)})
        .catch(error=>{if(current)setAiError(error.message)})
    }
    return()=>{current=false;resource?.dispose()}
  },[tracks,seed,projectId,partIds,recordKey])
  const candidateRender=recordKey && storedRender?.key===recordKey && !storedRender.result?.disposed?storedRender.result:null
  const selectedRender=candidateRender?.input.projectId===projectId && candidateRender.input.projectSeed===String(seed) &&
    candidateRender.input.partIds.join(':')===partIds?candidateRender:null
  const renderFields=recordKey?(selectedRender?.fields || []):aiFields
  useEffect(() => { levelRef.current = level }, [level])

  const numericSeed = typeof seed === 'number' ? seed : [...String(seed)].reduce((sum,char,index)=>sum+char.charCodeAt(0)*(index+17),0)
  const partSlots = resolveRecordPartSlots(parts.map(part=>part.id),PARTS.map(part=>part.id))
  const recordingSlot = partSlots[activePartIndex] ?? partSlots[0]
  const slots = Array(4).fill(null)
  if (layers.length) layers.forEach((layer,index) => {
    if (!layer) return
    const partIndex = parts.findIndex(part => part.id === layer.partId)
    const slot = partSlots[partIndex >= 0 ? partIndex : index]
    if (slot !== undefined) slots[slot] = layer
  })
  else active.forEach((enabled,index) => {
    if (enabled) slots[index] = {
      partId:PARTS[index]?.id,
      seed:numericSeed+index*97,
      spread:.1,
      turbulence:.72,
      opacity:.34,
      drift:.24,
      signature:`preview-${numericSeed}-${index}`
    }
  })
  if (state === 'recording' && !slots[recordingSlot]) slots[recordingSlot] = {
    partId:parts[activePartIndex]?.id,
    seed:numericSeed+recordingSlot*997,
    spread:.09,
    turbulence:1,
    opacity:.3,
    drift:.32,
    signature:`recording-${numericSeed}-${recordingSlot}`
  }
  const slotSignature = slots.map(layer => layer?.signature || layer?.seed || '-').join(':')

  useEffect(() => {
    const canvas = particleRef.current
    const materialCanvas = materialRef.current
    if (!canvas || !materialCanvas) return
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    let renderer
    try {
      const timelineKey=`${projectId}:${seed}`
      if(recordTimelineRef.current.key!==timelineKey)recordTimelineRef.current={key:timelineKey}
      renderer = createResonanceRenderer({
        canvas,
        materialCanvas,
        slots,
        projectSeed:String(seed),
        state,
        activePartIndex:recordingSlot,
        levelRef,
        reducedMotion,
        timeline:recordTimelineRef.current,
        aiFields:partSlots.reduce((fields,slot,index)=>{fields[slot]=renderFields.find(field=>field.projectId===projectId && field.projectSeed===String(seed) && field.partId===parts[index].id);return fields},[]),
        voiceStyles:partSlots.reduce((styles,slot,index)=>{styles[slot]=selectedRender?.styles.find(item=>item.partId===parts[index].id)?.style || null;return styles},[])
      })
      setRendererError('')
    } catch (error) {
      console.error('Resonance WebGL unavailable', error)
      setRendererError('WEBGL UNAVAILABLE')
    }
    return () => renderer?.dispose()
  }, [slotSignature, recordingSlot, state, seed, projectId, partIds, aiFields, selectedRender])

  const layerCount = layers.length ? layers.filter(Boolean).length : active.filter(Boolean).length
  return <figure className={`record ${compact ? 'record-compact' : ''}`} data-state={state} data-record-signature={projectRecordSignature(String(seed),layers)} data-resonance-engine="webgl-particles" aria-label={label || `공명 레코드, ${layerCount}개 Track 활성`}>
    <canvas ref={materialRef} className="record-material" aria-hidden="true" />
    <canvas ref={particleRef} className="record-particles" aria-hidden="true" />
    {state === 'processing' && <div className="record-processing">MIX</div>}
    {rendererError && <div className="record-error" role="status">{rendererError}</div>}
    {aiError && <div className="record-error" role="status">{aiError}</div>}
  </figure>
}

function RecordingInflow({ active, partIndex, level, seed, waveformRef }) {
  const canvasRef = useRef(null)
  const levelRef = useRef(level)
  useEffect(() => { levelRef.current = level }, [level])
  useEffect(() => {
    if (!active || !canvasRef.current) return
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    try {
      return createRecordingInflowRenderer({ canvas:canvasRef.current, partIndex, seed, levelRef, waveformRef, reducedMotion })
    } catch (error) {
      console.error('Recording inflow WebGL unavailable', error)
    }
  }, [active, partIndex, seed, waveformRef])
  if (!active) return null
  return <canvas ref={canvasRef} className="record-inflow" data-live-input="microphone" aria-hidden="true" />
}

function PartRow({ part, order = 0, waveform = false, action, actionLabel, included, onToggle, onPlay, onParticipant, urgent = false }) {
  const participantLabel = part.participant ? `${part.participant}${part.demo ? ' · LOCAL DEMO' : ''}` : (part.status === 'open' ? 'Open part' : part.status === 'recruiting' ? 'Vocal finder' : 'Unassigned')
  const stateLabel = part.duration || (part.status === 'submitted' ? 'SUBMITTED' : part.status === 'accepted' ? 'TRACK WAIT' : part.status === 'ready' ? 'MY PART' : part.status === 'open' ? 'OPEN' : part.status === 'recruiting' ? 'FIND' : 'WAIT')
  if(waveform)return <div className="workspace-track-row" data-part={part.id}>
    <label className="track-checkbox"><input type="checkbox" checked={Boolean(included)} disabled={!onToggle} onChange={onToggle} aria-label={part.name+' 현재 Mix 포함'}/></label>
    <div className="track-person"><strong>{String(order+1).padStart(2,'0')} {part.name}</strong>{onParticipant?<button onClick={onParticipant}>{part.participant}</button>:<span>{part.participant || 'OPEN'}</span>}</div>
    <svg className="track-envelope" viewBox="0 0 96 24" aria-label={part.name+' 녹음 에너지'}>{part.features?.envelope?.map((value,index)=><line key={index} x1={index*4} x2={index*4} y1={12-Math.max(1,value*11)} y2={12+Math.max(1,value*11)} stroke={part.color} strokeWidth="2"/>)}{!part.features?.envelope&&<line x1="0" x2="96" y1="12" y2="12" stroke="#69635d"/>}</svg>
    <span className="track-status">{onPlay?'제출됨':part.status==='ready'?'녹음 대기':'OPEN'}</span>
    {actionLabel?<button className="row-action" onClick={action}>{actionLabel}</button>:<button className="track-play" disabled={!onPlay} onClick={onPlay} aria-label={part.name+' Track 재생'}><img src={figmaAssets.imgFaFaPlay1} alt="" aria-hidden="true"/></button>}
  </div>
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
  const items = [
    ['home','HOME',current==='home'?figmaAssets.imgIconOpenPart1:figmaAssets.imgIconOpenPart],
    ['folder','PROJECTS',current==='folder'?figmaAssets.imgIconTrackStack:figmaAssets.imgIconTrackStack1],
    ['bookmark','COLLECTION',figmaAssets.imgIconRecordCollection],
    ['user','MY',figmaAssets.imgIconVoiceProfile]
  ]
  return <nav className="bottom-nav" aria-label="주요 메뉴">
    {items.map(([key,label,asset]) => <button key={key} data-nav={key} aria-current={current===key?'page':undefined} className={current===key?'active':''} onClick={()=>go(key)}><img src={asset} alt="" width="20" height="20" aria-hidden="true"/><span>{label}</span></button>)}
  </nav>
}

function Home({ mainProject = PROJECT, openSong, layers, projectTracks, profile, mix, openCreateProject, openComplete, createdProjects = [], createdProjectTracks = {}, createdMixes = {}, openCreatedProject, joined = false, joinedPart = USER_PART_ID, candidateAccepted = false }) {
  const [query,setQuery] = useState('')
  const submitted = submittedProjectTracks(PROJECT,projectTracks).length
  const demoCount = Object.values(projectTracks).filter(track=>track.demo).length
  const submittedIds = new Set(submittedProjectTracks(PROJECT,projectTracks).map(track=>track.partId))
  const openCount = PARTS.filter(part=>!submittedIds.has(part.id) && !part.participantId && !part.participant &&
    ['open','recruiting'].includes(part.status) && !(joined && part.id===joinedPart) && !(candidateAccepted && part.id==='bass')).length
  const createdSummaries = createdProjects.map(project=>{
    const tracks=createdProjectTracks[project.id] || {},submittedTracks=submittedProjectTracks(project,tracks)
    const submittedParts=new Set(submittedTracks.map(track=>track.partId))
    const openParts=(project.parts || []).filter(part=>!submittedParts.has(part.id) && !part.participantId && !part.participant && ['open','recruiting'].includes(part.status))
    return {project,submitted:submittedTracks.length,submittedParts,openCount:openParts.length,mix:submittedTracks.length===project.partCount?createdMixes[project.id]:null}
  })
  const createdRecruiting=createdSummaries.filter(item=>!item.mix && item.openCount>0)
  const createdCompleted=createdSummaries.filter(item=>item.mix)
  const completedMain=Boolean(mix && submitted===TOTAL_PARTS)
  const mainRecruiting=!completedMain && openCount>0
  const searchResults = query.trim() ? SONGS.filter(song=>`${song.title} ${song.artist} ${song.genre}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) : []
  const forYouSongs=['ocean-eyes','love-poem'].map(id=>{
    const song=SONGS.find(item=>item.id===id)
    const projects=[...song.projects,...createdSummaries.filter(item=>item.project.songId===id).map(({project,submittedParts})=>({...project,parts:project.parts.map(part=>submittedParts.has(part.id)?{...part,status:'submitted'}:part)}))]
    return {song,projects,availability:openProjectRangeAvailability(profile?.rangeData,projects)}
  })
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
          <div className="home-actions"><button className="primary" data-action="open-parts" onClick={() => {const target=document.getElementById("recruiting-projects");target?.scrollIntoView({behavior:"smooth",block:"start"});target?.focus({preventScroll:true})}}>OPEN Part 찾기 <Icon name="search"/></button><button className="secondary" data-action="create-project" onClick={openCreateProject}>새 프로젝트 만들기</button></div>
        </div>
        <div className="demo-record">
          <ResonanceRecord recordRef={mainProject.voiceRecordRef} projectId={mainProject.id} parts={mainProject.parts} layers={layers} compact seed={mainProject.seed} label={`A Thousand Years, 네 파트 중 ${submitted}개 Track 제출 완료`}/>
          <span className="demo-count">{String(submitted).padStart(2,'0')}/04 <small>TRACKS</small></span>
        </div>
      </section>
      <section className="content-section for-you">
        <div className="section-head"><h2>For you</h2><span>{profile?'Part 음역 정보 기준 확인':'Voice Profile을 만들면 음역 기준 추천'}</span></div>
        {forYouSongs.map(({song,projects,availability},index)=><button className="song-row" key={song.id} onClick={()=>openSong(song.id)}><span className="song-index">{String(index+1).padStart(2,'0')}</span><span><strong>{song.title}</strong><small>{profile?`음역 확인된 OPEN Project · ${availability.matchingProjects}${availability.unverifiedProjects?` · 음역 미확인 ${availability.unverifiedProjects}`:''}`:`관련 프로젝트 · ${projects.length}`}</small></span><span>↗</span></button>)}
      </section>
      <section className="content-section" id="recruiting-projects" tabIndex={-1}>
        <div className="section-head"><h2>파트 모집 중</h2><span>{2+Number(mainRecruiting)+createdRecruiting.length} projects</span></div>
        {mainRecruiting && <button className="project-feature" onClick={() => openSong(SONG_ID)}>
          <ResonanceRecord recordRef={mainProject.voiceRecordRef} projectId={mainProject.id} parts={mainProject.parts} layers={layers} compact seed={mainProject.seed} />
          <span><small>{String(submitted).padStart(2,'0')}/04 · OPEN</small><strong>A Thousand Years</strong><em>{demoCount}개 출처 표시 시연 Track · {openCount} Parts OPEN</em></span>
        </button>}
        <button className="project-line" onClick={() => openSong('city-of-stars')}><span>City of Stars · Night Duet</span><small>01/02 · Vocal B OPEN</small></button>
        <button className="project-line" onClick={() => openSong('love-poem')}><span>Love Poem · Four Voices</span><small>02/04 · Tenor OPEN</small></button>
        {createdRecruiting.map(({project,submitted,openCount})=><button className="project-line" key={project.id} data-project-id={project.id} onClick={()=>openSong(project.songId,project.id)}><span>{project.title} · {project.name}</span><small>{String(submitted).padStart(2,'0')}/{String(project.partCount).padStart(2,'0')} · {openCount} Parts OPEN</small></button>)}
      </section>
      <section className="content-section"><div className="section-head"><h2>최근 열린 프로젝트</h2><span>New sessions</span></div>{createdSummaries.map(({project,submitted,mix})=><button className="project-line" key={project.id} data-project-id={project.id} onClick={()=>mix?openCreatedProject(project.id):openSong(project.songId,project.id)}><span>{project.title} · {project.name}</span><small>{String(submitted).padStart(2,'0')}/{String(project.partCount).padStart(2,'0')} · {localProjectLifecycle(project,createdProjectTracks[project.id] || {},createdMixes[project.id])}</small></button>)}<button className="project-line" onClick={()=>openSong('ocean-eyes')}><span>Ocean Eyes · Airy Trio</span><small>Lead Track 도착</small></button><button className="project-line" onClick={()=>openSong('city-of-stars')}><span>City of Stars · Night Duet</span><small>Vocal B 모집 중</small></button></section>
      <section className="content-section"><div className="section-head"><h2>완성된 곡</h2><span>Listening proof</span></div>{completedMain&&<button className="project-line" onClick={openComplete}><span>A Thousand Years · Original C</span><small>04/04 · COMPLETE · 완성곡 듣기</small></button>}{createdCompleted.map(({project})=><button className="project-line" key={project.id} data-project-id={project.id} onClick={()=>openCreatedProject(project.id)}><span>{project.title} · {project.name}</span><small>{String(project.partCount).padStart(2,'0')}/{String(project.partCount).padStart(2,'0')} · COMPLETE · 완성곡 듣기</small></button>)}{!completedMain&&!createdCompleted.length&&<p className="empty-proof">아직 이 브라우저에서 완성한 곡이 없어요. 마지막 Track 제출 후 Mix 저장이 성공하면 여기에 완성곡이 나타납니다.</p>}</section>
    </main>
  </div>
}

function Detail({ go, back, song, profile, join, layers, projectTracks, songSaved, toggleSongSave, openVocalProfile, createdProjects, createdProjectTracks = {}, createdMixes = {}, onCreateProject, onOpenCreatedProject, openMainWorkspace, mainMix, mainKeyLocked = false, joined = false, joinedPart = USER_PART_ID, candidateAccepted = false, invitedPerson, initialProjectId, onSelectProject, detailContext }) {
  const readSelectedPart=projectId=>detailContext?.current[projectId] ?? (projectId===PROJECT_ID?readNavigationHint(`ieum:detail:${song.id}:part`,USER_PART_ID):'')
  const [selectedProjectId,setSelectedProjectId] = useState(initialProjectId || song.projects[0].id)
  const [selectedPartId,setSelectedPartId] = useState(()=>readSelectedPart(initialProjectId || song.projects[0].id))
  useEffect(()=>{
    if(detailContext)detailContext.current[selectedProjectId]=selectedPartId
    if(selectedProjectId===PROJECT_ID)writeNavigationHint(`ieum:detail:${song.id}:part`,selectedPartId)
  },[song.id,selectedProjectId,selectedPartId,detailContext])
  useEffect(() => { const projectId=initialProjectId || song.projects[0].id;setSelectedProjectId(projectId);setSelectedPartId(readSelectedPart(projectId)) }, [song.id,initialProjectId])
  const mainTracks=Object.fromEntries(submittedProjectTracks(PROJECT,projectTracks).map(track=>[track.partId,track]))
  const mainComplete=allProjectTracksSubmitted(PROJECT,mainTracks) && Boolean(mainMix)
  const allProjects = [...song.projects.map(project=>project.id===PROJECT_ID?{...project,progress:Object.keys(mainTracks).length,status:localProjectLifecycle({...PROJECT,...project},mainTracks,mainMix)}:project),...createdProjects.filter(project=>project.songId===song.id).map(project=>{
    const progress=submittedProjectTracks(project,createdProjectTracks[project.id] || {}).length
    return {...project,progress,status:localProjectLifecycle(project,createdProjectTracks[project.id] || {},createdMixes[project.id])}
  })]
  const selectedProject = allProjects.find(project=>project.id===selectedProjectId) || allProjects[0]
  const isLiveProject = selectedProject.id === PROJECT_ID
  const isCreatedProject = createdProjects.some(project=>project.id===selectedProject.id)
  const createdTracks = isCreatedProject ? Object.fromEntries(submittedProjectTracks(selectedProject,createdProjectTracks[selectedProject.id] || {}).map(track=>[track.partId,track])) : {}
  const listenTracks = isLiveProject ? mainTracks : createdTracks
  const liveSubmitted = Object.keys(mainTracks).length
  const submitted = isLiveProject ? liveSubmitted : selectedProject.progress
  const keyLocked = submitted > 0 || (isLiveProject ? mainKeyLocked : Boolean(selectedProject.keyLocked))
  const projectLayers = isLiveProject ? layers : isCreatedProject ? selectedProject.parts.map(part=>createdTracks[part.id]?.layer || null) : []
  const staticActive = Array.from({length:selectedProject.partCount},(_,index)=>index<submitted)
  const emptyProjectParts = PART_CATALOG.slice(0,selectedProject.partCount).map(part=>({...part,participantId:null,participant:null,status:'open',duration:null}))
  const displayParts = isLiveProject
    ? PARTS.map(part => {
      const track=mainTracks[part.id]
      if(track)return {...part,participantId:track.participantId || personFromName(track.participant)?.id,participant:track.participant,status:'submitted',duration:fmt(track.duration),demo:track.demo,disclosure:track.disclosure}
      if(joined && part.id===joinedPart)return {...part,participantId:CURRENT_USER_ID,participant:'JISUN',status:'ready'}
      if(candidateAccepted && part.id==='bass' && invitedPerson)return {...part,participantId:invitedPerson.id,participant:invitedPerson.name,status:'accepted'}
      return part
    })
    : (selectedProject.parts || emptyProjectParts).map(part=>createdTracks[part.id]?{...part,participantId:createdTracks[part.id].participantId || part.participantId,participant:createdTracks[part.id].participant || part.participant,status:'submitted',duration:fmt(createdTracks[part.id].duration)}:part)
  const chosen = isLiveProject ? displayParts.find(part=>part.id===selectedPartId) : null
  const fit = evaluatePartFit({rangeData:profile?.rangeData,part:chosen})
  const demoNames = displayParts.filter(part=>part.demo).map(part=>part.name).join('·')
  const selectProject=projectId=>{
    setSelectedProjectId(projectId)
    setSelectedPartId(readSelectedPart(projectId))
    onSelectProject?.(projectId)
  }
  return <div className="screen detail-screen">
    <TopBar back={back} meta={`${String(submitted).padStart(2,'0')}/${String(selectedProject.partCount).padStart(2,'0')} · ${selectedProject.status}`} />
    <main>
      <div className="song-identity"><div><p className="kicker">{song.artist} · {song.year}</p><h1>{song.title}</h1><p>{song.genre} · {song.duration}</p></div><button className={`icon-btn ${songSaved?'active':''}`} aria-label={songSaved?'저장한 곡에서 제거':'곡 저장'} aria-pressed={songSaved} data-action="toggle-song-save" onClick={()=>toggleSongSave(song.id)}><Icon name="bookmark"/></button></div>
      <section className="project-picker"><div className="section-head"><h2>이 곡의 프로젝트</h2><span>{allProjects.length} projects</span></div><div className="project-carousel">{allProjects.map(project=>{const created=createdProjects.some(item=>item.id===project.id);return <button key={project.id} data-project-id={project.id} className={selectedProject.id===project.id?'active':''} aria-pressed={selectedProject.id===project.id} onClick={()=>selectProject(project.id)}><span>{String(project.progress).padStart(2,'0')}/{String(project.partCount).padStart(2,'0')} · {project.status}</span><strong>{project.name}</strong><small>{created?'내 프로젝트 · ':''}{project.key}</small></button>})}</div><button className="create-from-song" data-action="create-project-for-song" onClick={()=>onCreateProject(song.id)}><Icon name="plus" size={17}/><span><strong>이 곡으로 새 프로젝트 만들기</strong><small>2–4 Part와 Key를 설정합니다</small></span></button></section>
      <div className="detail-record"><ResonanceRecord recordRef={selectedProject.voiceRecordRef} parts={displayParts} projectId={selectedProject.id} layers={projectLayers} active={staticActive} seed={selectedProject.seed} /><div className="film-note"><span>PROJECT KEY</span><strong>{selectedProject.key}</strong><small>{keyLocked?'첫 녹음 시작 후 Key 고정':'첫 녹음 시작 전 조정 가능'}</small></div></div>
      {isLiveProject || isCreatedProject ? <CurrentMixPanel key={selectedProject.id} project={selectedProject} parts={displayParts} projectTracks={listenTracks} openVocalProfile={openVocalProfile} waveform={false} title="Part 구성" emptyMessage="아직 제출된 녹음이 없어요." partAction={part=>isLiveProject&&['open','recruiting'].includes(part.status)?{action:()=>setSelectedPartId(part.id),label:selectedPartId===part.id?'선택됨':'확인'}:{}}/> : <section className="part-list"><div className="section-head"><h2>Part 구성</h2><span>{selectedProject.name}</span></div>{displayParts.map(part => <PartRow key={part.id} part={part} onParticipant={part.participantId&&part.participantId!==CURRENT_USER_ID?()=>openVocalProfile(part.participantId):undefined}/>)}</section>}
      {isCreatedProject && <button className="primary" data-action="open-selected-created-project" onClick={()=>onOpenCreatedProject(selectedProject.id)}>{selectedProject.status==='COMPLETE'?'완성곡 듣기':'작업실로 이동'}</button>}
      {isLiveProject && (joined || mainComplete) && <button className="primary" data-action="open-selected-main-project" onClick={()=>openMainWorkspace(mainComplete?'complete':'workspace')}>{mainComplete?'완성곡 듣기':'작업실로 이동'}</button>}
      {isLiveProject ? <p className="demo-disclosure">{demoNames || '현재 없음'}: 흐름 검증용 로컬 합성 Stem입니다. 실제 사람의 보컬 Track이나 실제 협업 결과가 아니며, 배포 가능한 동일 곡의 사람 보컬 원본은 아직 제공되지 않았습니다.</p> : isCreatedProject ? <p className="demo-disclosure">이 브라우저에 저장된 내 프로젝트입니다. 제출된 원본 Track과 Part 배정 상태를 표시합니다. 실제 서버 협업 연결은 아직 완료되지 않았습니다.</p> : <p className="demo-disclosure">탐색용 Project 데이터입니다. 선택한 Project에 따라 Part 구성이 교체되며 Track 녹음 시연은 Original C · Quartet에서 제공합니다.</p>}
      {chosen && ['open','recruiting'].includes(chosen.status) && <section className="fit-panel" data-testid="part-fit"><p className="kicker">Part fit · {chosen.name}</p><h2>{profile?(fit.eligible?'현재 Key의 요구 음역을 충족해요.':'현재 Key의 요구 음역을 확인해 주세요.'):'참여 전에 내 목소리를 준비해요.'}</h2>{profile?<><div className="range-line"><span>내 편한 음역 <b>{profile.range}</b></span><span>Part 요구 음역 <b>{chosen.range}</b></span></div><ul>{fit.reasons.map(reason=><li key={reason}>{reason}</li>)}<li>음색·역할은 참고 정보이며 실력 평가가 아니에요.</li></ul><button className="primary" data-action="join-part" disabled={!fit.eligible} onClick={()=>join(selectedPartId)}>{chosen.name} 참여 확정</button></>:<><p>먼저 실제 마이크로 편한 음역을 측정합니다. 대표 Voice Sample은 다음 단계에서 별도 Sample Song으로 등록하며 측정 음성과 섞지 않습니다.</p><button className="primary" data-action="voice-setup" onClick={()=>go('voice')}>내 목소리 알아보기</button></>}</section>}
    </main>
  </div>
}

function SongBrowser({ back, openSong, songSaves, toggleSongSave, createdProjects, onCreateProject }) {
  return <div className="screen song-browser-screen"><TopBar title="SONG DISCOVERY" back={back} meta={`${SONGS.length} SONGS`}/><main><p className="kicker">Song first</p><h1>곡 둘러보기</h1><p>곡을 선택하면 같은 곡으로 열린 프로젝트들과 각 프로젝트의 Part 구성을 확인할 수 있어요.</p><section className="song-browser-list">{SONGS.map((song,index)=>{const saved=songSaves.some(item=>item.songId===song.id);const projectCount=song.projects.length+createdProjects.filter(project=>project.songId===song.id).length;return <article key={song.id}><button className="song-browser-open" data-action="browse-song" onClick={()=>openSong(song.id)}><span className="song-index">{String(index+1).padStart(2,'0')}</span><span><strong>{song.title}</strong><small>{song.artist} · 프로젝트 {projectCount}개</small><em>{song.genre} · {song.duration}</em></span><b>↗</b></button><div className="song-row-actions"><button aria-label={`${song.title} 새 프로젝트 만들기`} onClick={()=>onCreateProject(song.id)}><Icon name="plus" size={17}/></button><button className={saved?'active':''} aria-label={saved?`${song.title} 저장 취소`:`${song.title} 곡 저장`} aria-pressed={saved} onClick={()=>toggleSongSave(song.id)}><Icon name="bookmark" size={17}/></button></div></article>})}</section></main></div>
}

function CreateProject({ back, complete, initialSongId, draft, rememberDraft, profile, setupVoice }) {
  const [step,setStep] = useState(draft?.step || (initialSongId ? 2 : 1))
  const [songId,setSongId] = useState(draft?.songId || initialSongId || SONG_ID)
  const [partCount,setPartCount] = useState(draft?.partCount || 4)
  const [projectKey,setProjectKey] = useState(draft?.projectKey || 'C major')
  const [ownerPartId,setOwnerPartId] = useState(draft?.ownerPartId || USER_PART_ID)
  const [creating,setCreating]=useState(false)
  const creatingRef=useRef(Boolean(draft?.createdProjectId))
  const song = SONGS.find(item=>item.id===songId) || SONGS[0]
  const availableParts = PART_CATALOG.slice(0,partCount)
  useEffect(()=>{
    if (!availableParts.some(part=>part.id===ownerPartId)) setOwnerPartId(availableParts[0]?.id || '')
  },[partCount,ownerPartId])
  const ownerPart = availableParts.find(part=>part.id===ownerPartId) || availableParts[0]
  const fit=evaluatePartFit({rangeData:profile?.rangeData,part:ownerPart})
  useEffect(()=>rememberDraft({step,songId,partCount,projectKey,ownerPartId}),[step,songId,partCount,projectKey,ownerPartId,rememberDraft])
  const create = () => {
    if(creatingRef.current || draft?.createdProjectId || !profile || !fit.eligible)return
    creatingRef.current=true;setCreating(true)
    complete({
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
  }
  return <div className="screen create-project-screen"><TopBar title="NEW PROJECT" back={()=>{if(creating)return;if(step===3)setStep(2);else if(step===2&&!initialSongId)setStep(1);else back()}} meta={`0${step}/03`}/><main>
    {step===1&&<section className="setup-copy"><p className="kicker">01C · Song</p><h1>함께 부를 곡을<br/>선택해요.</h1><div className="sample-song-list">{SONGS.map(item=><button key={item.id} className={songId===item.id?'active':''} aria-pressed={songId===item.id} onClick={()=>setSongId(item.id)}><span>{item.title}</span><strong>{item.artist}</strong><small>{item.genre} · 기존 프로젝트 {item.projects.length}</small></button>)}</div><button className="primary" onClick={()=>setStep(2)}>Part 구성하기</button></section>}
    {step===2&&<section className="setup-copy"><p className="kicker">01D · Structure</p><h1>내 Part와 구성을<br/>정해요.</h1><div className="choice-grid">{SUPPORTED_PART_COUNTS.map(value=><button disabled={!profile} key={value} className={partCount===value?'active':''} onClick={()=>setPartCount(value)}>{value}<small>PARTS</small></button>)}</div><fieldset className="owner-part-field"><legend>내가 맡을 Part</legend><div className="part-choice-grid">{availableParts.map(part=><button type="button" disabled={!profile} key={part.id} className={ownerPartId===part.id?'active':''} aria-pressed={ownerPartId===part.id} onClick={()=>setOwnerPartId(part.id)}><i style={{background:part.color}}/><span>{part.name}</span><small>{part.range}</small></button>)}</div></fieldset><label className="field-label">PROJECT KEY<select disabled={!profile} value={projectKey} onChange={event=>setProjectKey(event.target.value)}><option>C major</option><option>B♭ major</option><option>D major</option><option>E minor</option></select></label><p>첫 녹음을 시작하면 프로젝트 Key가 확정됩니다.</p>{!profile&&<section role="status"><p>Part와 Key를 정하기 전에 내 목소리를 준비해 주세요.</p><button className="secondary" data-action="create-voice-setup" onClick={setupVoice}>내 목소리 알아보기</button></section>}<button className="primary" disabled={!profile} onClick={()=>setStep(3)}>프로젝트 확인</button></section>}
    {step===3&&<section className="result-block"><p className="kicker">03A · Ready to recruit</p><h1>{song.title}<br/><span>{partCount} Parts</span></h1><dl className="measurement-proof"><div><dt>Artist</dt><dd>{song.artist}</dd></div><div><dt>내 Part</dt><dd>{ownerPart.name}</dd></div><div><dt>Project key</dt><dd>{projectKey}</dd></div><div><dt>Initial progress</dt><dd>0/{partCount}</dd></div></dl><p>내 Part 참여는 프로젝트 생성과 함께 확정됩니다. 진행률은 녹음을 Review에서 제출하기 전까지 0/{partCount}입니다.</p><section data-create-fit role="status"><p>{!profile?"프로젝트를 열기 전에 내 목소리를 준비해 주세요.":fit.eligible?"선택 Part의 등록 음역이 내 측정 음역 안에 있어요.":fit.reasons.join(" ")}</p><small>등록된 Part 음역을 비교한 결과예요. 곡·Key별 실제 요구 음역 검증은 준비 중이에요.</small>{!profile&&<button className="secondary" data-action="create-voice-setup" onClick={setupVoice}>내 목소리 알아보기</button>}</section><button className="primary" data-action="confirm-project-create" disabled={creating || Boolean(draft?.createdProjectId) || !profile || !fit.eligible} onClick={create}>{draft?.createdProjectId?"이미 개설한 프로젝트예요.":creating?"프로젝트를 열고 있어요.":"프로젝트 만들기"}</button></section>}
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

function VoiceSetup({ complete, go, back, existing, editMode, songSaves }) {
  const [step, setStep] = useState(editMode==='sample'?'sample-select':'intro')
  const [permission, setPermission] = useState('idle')
  const [level, setLevel] = useState(0)
  const [pitch, setPitch] = useState(null)
  const [seconds, setSeconds] = useState(0)
  const [range, setRange] = useState(existing?.rangeData || null)
  const [sampleDraft, setSampleDraft] = useState(null)
  const [preferences,setPreferences]=useState(()=>preferenceValues(existing))
  const [sampleSong,setSampleSong] = useState(()=>recommendSampleSongs(existing?.rangeData,SAMPLE_SONGS).find(item=>item.fit.eligible)?.song || SAMPLE_SONGS[0])
  const sampleRecommendations=recommendSampleSongs(range,SAMPLE_SONGS)
  const [sampleStatus, setSampleStatus] = useState('ready')
  const [samplePlaying, setSamplePlaying] = useState(false)
  const [sampleGuidePlaying,setSampleGuidePlaying]=useState(false)
  const [sampleGuideEnabled,setSampleGuideEnabled]=useState(true)
  const [sampleAudioFailure,setSampleAudioFailure]=useState(false)
  const [sampleAction,setSampleAction]=useState(null)
  const [sampleBusy,setSampleBusy]=useState(false)
  const [sampleCountdown,setSampleCountdown]=useState(null)
  const sampleStartingRef=useRef(false)
  const rangeStartingRef=useRef(false)
  const sampleStoppingRef=useRef(false)
  const sampleLifecycleRef=useRef(0)
  const pendingSampleSong=useRef(null)
  const [error, setError] = useState('')
  const [saving,setSaving]=useState(false)
  const [saveFailure,setSaveFailure]=useState(false)
  const savingRef=useRef(false)
  const sampleProfileHandoffRef=useRef(false)
  const savedSampleUrlsRef=useRef(new Set())
  const changeSampleGuide = enabled => {
    setSampleGuideEnabled(enabled)
    if(sampleStatus!=='recording')return
    try { updateRecordingGuides({backing:enabled,parts:[]}); setError('') }
    catch(reason) { setSampleAudioFailure(true); setError(reason?.message || 'Guide를 재생하지 못했어요. 다시 선택해 주세요.') }
  }
  const finish=async value=>{
    if(savingRef.current)return
    const lifecycle=sampleLifecycleRef.current
    if(value.sample?.url)sampleProfileHandoffRef.current=true
    savingRef.current=true;setSaving(true);setError('');setSaveFailure(false)
    try{const result=await complete(value);if(value.sample?.url)savedSampleUrlsRef.current.add(value.sample.url);return result || true}catch(reason){
      if(value.sample?.url)sampleProfileHandoffRef.current=false
      if(lifecycle!==sampleLifecycleRef.current){if(value.sample?.url)URL.revokeObjectURL(value.sample.url);return}
      setSaveFailure(true);setError(reason?.message || '프로필 저장 실패: 기존 프로필을 유지합니다.')
      return false
    }
    finally{savingRef.current=false;if(lifecycle===sampleLifecycleRef.current)setSaving(false)}
  }
  const confirmSample=async()=>{
    if(editMode){setStep('complete');return}
    if(savedSampleUrlsRef.current.has(sampleDraft?.url)){setStep('preferences');return}
    const result=await finish({phase:'sample-save',range:range?.label,rangeData:range,sample:sampleDraft,sampleSong,identity:{status:'blocked',reason:'free-local-generative-model-not-connected'}})
    if(result){setPreferences(preferenceValues(result===true?existing:result));setStep('preferences')}
  }
  const savePreferences=async()=>{
    if(await finish({phase:'preferences-save',preferences}))setStep('complete')
  }
  const [pitchDiagnostics, setPitchDiagnostics] = useState({ checked:0, accepted:0, rms:0, confidence:0, reason:'waiting' })
  const timer = useRef(null)
  const pitchSamples = useRef([])
  const confidenceSamples = useRef([])

  const startRange = async () => {
    if(rangeStartingRef.current)return
    rangeStartingRef.current=true
    try {
      setError(''); setSaveFailure(false); await requestMicrophone(); setPermission('granted'); setStep('range-running')
      pitchSamples.current = []; confidenceSamples.current = []; setSeconds(0); setPitch(null)
      setPitchDiagnostics({ checked:0, accepted:0, rms:0, confidence:0, reason:'waiting' })
      monitorInput(frame => {
        setLevel(frame.level)
        if (frame.pitchFresh) setPitchDiagnostics(previous => {
          const inRange = Number.isFinite(frame.midi) && frame.midi >= 36 && frame.midi <= 84
          const valid = inRange && frame.pitchReason === 'detected'
          return {
            checked:previous.checked + 1,
            accepted:previous.accepted + (valid ? 1 : 0),
            rms:frame.rms || 0,
            confidence:frame.pitchConfidence || 0,
            reason:Number.isFinite(frame.midi) && !inRange ? 'out-of-range' : frame.pitchReason
          }
        })
        if (frame.pitchFresh && frame.pitchReason === 'detected' && Number.isFinite(frame.midi) && frame.midi >= 36 && frame.midi <= 84) {
          pitchSamples.current.push(frame.midi)
          confidenceSamples.current.push(frame.pitchConfidence || 0)
          setPitch(frame.midi)
        }
      }, { detectPitch:true })
      timer.current = window.setInterval(() => setSeconds(value => value + 1), 1000)
    } catch (e) { setPermission(isMicrophonePermissionError(e) ? 'denied' : 'error'); setError(microphoneErrorMessage(e)) }
    finally {rangeStartingRef.current=false}
  }
  const finishRange = () => {
    const values = [...pitchSamples.current].sort((a,b)=>a-b)
    if (values.length < 6) { setError('음정을 충분히 감지하지 못했어요. 3초 이상 편하게 낮은 음과 높은 음을 내주세요.'); return }
    clearInterval(timer.current); stopMicrophone()
    const low = values[Math.floor(values.length * .08)]
    const high = values[Math.min(values.length - 1, Math.floor(values.length * .92))]
    const confidence = confidenceSamples.current.reduce((sum,value)=>sum+value,0) / Math.max(1,confidenceSamples.current.length)
    const microphone = getMicrophoneDiagnostics()
    const measured = { analysisVersion:PITCH_ANALYSIS_VERSION, lowMidi:Math.round(low), highMidi:Math.round(high), label:`${midiToNote(low)}–${midiToNote(high)}`, sampleCount:values.length, confidence:Number(confidence.toFixed(3)), microphone }
    setRange(measured); setError(''); setStep('range-result')
    if(!sampleDraft){setSampleGuidePlaying(false);setSampleSong(recommendSampleSongs(measured,SAMPLE_SONGS).find(item=>item.fit.eligible)?.song || SAMPLE_SONGS[0])}
  }
  const startSample = async () => {
    if(sampleStartingRef.current)return
    sampleStartingRef.current=true;setSampleBusy(true)
    const lifecycle=sampleLifecycleRef.current
    let loadingAudio=true
    try {
      setError('');setSaveFailure(false);setSampleAudioFailure(false);setSampleGuidePlaying(false)
      const [backingBlob,preparationBlob]=await Promise.all([loadProvidedAudio(sampleSong.backingFile,sampleSong.provenance.backingSha256),loadProvidedAudio(sampleSong.leadInFile,sampleSong.provenance.leadIn.sha256)])
      if(lifecycle!==sampleLifecycleRef.current)return
      loadingAudio=false
      await requestMicrophone({voiceProcessing:sampleGuideEnabled ? true : null})
      if(lifecycle!==sampleLifecycleRef.current)return
      setPermission('granted');setSampleStatus('preparing');setSeconds(0)
      setSampleCountdown(3)
      await startRecording({onFrame:frame=>{setLevel(frame.level);setSeconds(frame.elapsedSec || 0)},guides:{backing:sampleGuideEnabled,parts:[]},guideTracks:[],backingBlob,preparationBlob,preparationDuration:sampleSong.leadInDuration,onPreparation:remaining=>{if(lifecycle===sampleLifecycleRef.current)setSampleCountdown(remaining)},duration:sampleSong.duration})
      if(lifecycle!==sampleLifecycleRef.current){cancelRecording();stopMicrophone();return}
      setPermission('granted');setSampleStatus('recording');setSeconds(0)
      timer.current = window.setInterval(() => setSeconds(getRecordingTimeline().elapsedSec),1000)
    } catch (e) {if(lifecycle!==sampleLifecycleRef.current)return;setSampleStatus('ready');if(loadingAudio){setSampleAudioFailure(true);setError(e.message)}else{setPermission(isMicrophonePermissionError(e)?'denied':'error');setError(microphoneErrorMessage(e))}}
    finally {sampleStartingRef.current=false;setSampleBusy(false);setSampleCountdown(null)}
  }
  const stopSample = async () => {
    if(sampleStoppingRef.current)return
    sampleStoppingRef.current=true;setSampleBusy(true)
    const lifecycle=sampleLifecycleRef.current
    try {
    setError('');setSaveFailure(false)
    clearInterval(timer.current)
    const draft = await stopRecording()
    if(lifecycle!==sampleLifecycleRef.current){if(draft?.url)URL.revokeObjectURL(draft.url);return}
    if (!draft?.blob || draft.duration < 3) {
      if(draft?.url)URL.revokeObjectURL(draft.url)
      cancelRecording()
      setError('대표 Voice Sample은 최소 3초 이상 녹음해 주세요.'); setSampleStatus('ready'); return
    }
    sampleProfileHandoffRef.current=false;setSampleDraft(draft); setSampleStatus('review'); setSamplePlaying(false)
    } catch(reason) {
      if(lifecycle!==sampleLifecycleRef.current)return
      setSaveFailure(true);setError(reason?.message || '녹음을 끝내지 못했어요. 다시 정지를 눌러 주세요.')
      if(getRecordingTimeline().state==='recording')timer.current=window.setInterval(()=>setSeconds(getRecordingTimeline().elapsedSec),1000)
    } finally {sampleStoppingRef.current=false;setSampleBusy(false);setSampleAction(null)}
  }
  const chooseSampleSong = song => {setSampleGuidePlaying(false);if(sampleDraft&&song.id!==sampleSong.id){pendingSampleSong.current=song;setSampleAction('discard-song');return}setSampleSong(song)}
  const retrySample = () => { cancelRecording(); if(sampleDraft?.url&&!savedSampleUrlsRef.current.has(sampleDraft.url))URL.revokeObjectURL(sampleDraft.url); setSampleDraft(null); setSampleStatus('ready'); setSeconds(0); setError('') }
  useEffect(() => () => { sampleLifecycleRef.current++;clearInterval(timer.current); cancelRecording(); stopMicrophone() }, [])
  useEffect(() => {
    const url=sampleDraft?.url
    return () => { if(url && !sampleProfileHandoffRef.current&&!savedSampleUrlsRef.current.has(url))URL.revokeObjectURL(url) }
  },[sampleDraft?.url])
  return <div className="screen voice-screen">
    <TopBar title={['sample-select','sample','preferences','complete'].includes(step) ? 'VOICE PROFILE' : 'VOICE RANGE'} back={() => {if(saving||sampleBusy)return;if(step==='sample'&&sampleStatus==='recording'){setSampleAction('stop');return}if(step==='sample')setStep('sample-select');else if(step==='sample-select'&&!editMode)setStep('range-result');else if(step==='complete')setStep(editMode?'sample':'preferences');else if(step==='preferences')setStep('sample');else back()}} meta={step === 'preferences' ? 'VP05A' : step === 'complete' ? 'READY' : ['sample-select','sample'].includes(step) ? 'PROFILE AUDIO' : 'RANGE CHECK'} />
    <main className="voice-main">
      {step === 'intro' && <section className="setup-copy"><p className="kicker">About 30 seconds</p><h1>편한 음역을<br/>측정해요.</h1><p>별도 곡을 녹음하지 않습니다. 낮은 음부터 높은 음까지 편하게 소리 내면 음정 표본만 측정합니다.</p><p className="permission-primer">처음 한 번만 브라우저의 마이크 권한 창이 열립니다. 허용하면 바로 측정을 시작합니다.</p><button className="primary" data-action="range-start" onClick={startRange}>마이크 허용하고 음역 측정 시작</button></section>}
      {step === 'range-running' && <section className="measurement"><p className="kicker">RANGE · {fmt(seconds)}</p><h1>낮은 음부터 높은 음까지<br/>편하게 소리 내보세요.</h1><div className="level-orbit" style={{ '--level': level }}><span /></div><p className="pitch-readout">{pitch ? `${midiToNote(pitch)} · ${Math.round(440*Math.pow(2,(pitch-69)/12))}Hz` : '음정을 듣고 있어요…'}</p><p>자동으로 넘어가지 않습니다. 낮은 음과 높은 음을 충분히 낸 뒤 직접 마치세요.</p><div className="pitch-diagnostics" aria-live="polite"><span>입력 {Math.round(20*Math.log10(Math.max(1e-6,pitchDiagnostics.rms)))} dBFS</span><span>신뢰도 {Math.round(pitchDiagnostics.confidence*100)}%</span><span>수집 {pitchDiagnostics.accepted}/{pitchDiagnostics.checked}</span><span>{pitchDiagnostics.reason}</span></div><button className="secondary" data-action="range-finish" onClick={finishRange}>측정 마치기 · {pitchSamples.current.length} samples</button></section>}
      {step === 'range-result' && <section className="result-block"><p className="kicker">실제 마이크 음정 분석</p><h1>측정된 음역<br/><span>{range?.label}</span></h1><p>{range?.sampleCount}개의 유효 음정 표본으로 계산했습니다. 이 데이터는 Part Fit에만 사용하며 Voice Identity나 프로젝트 Record를 만들지 않습니다.</p><dl className="measurement-proof"><div><dt>Pitch confidence</dt><dd>{Math.round((range?.confidence||0)*100)}%</dd></div><div><dt>Microphone</dt><dd>{range?.microphone?.label || 'Unavailable'}</dd></div><div><dt>Sample rate</dt><dd>{range?.microphone?.settings?.sampleRate || 'Browser default'} Hz</dd></div></dl><div className="range-rail"><i/><b style={{left:`${Math.max(0,((range?.lowMidi||48)-36)/48*100)}%`,width:`${Math.max(8,((range?.highMidi||60)-(range?.lowMidi||48))/48*100)}%`}}/></div><div className="review-actions"><button className="secondary" onClick={()=>setStep('intro')}>다시 측정</button><button className="primary" data-action="sample-next" disabled={saving} onClick={() => editMode==="range"?finish({range:range?.label,rangeData:range,editMode}):setStep("sample-select")}>{editMode==="range"?"음역 변경 저장":"Sample Song 고르기"}</button></div></section>}
      {step === 'sample-select' && <section className="sample-select-stage"><p className="kicker">VP03 · 제공 샘플 곡</p><h1>대표 Sample로 부를<br/>한 곡을 골라요.</h1><p>선택한 곡의 지정 구간을 15–20초 녹음합니다.</p><p>{sampleRecommendations.some(item=>item.fit.eligible)?"측정 음역 안에 들어오는 구간을 먼저 보여드려요.":"현재 측정 음역 안에 들어오는 제공 구간이 없어요. 먼저 듣고 고르거나 음역을 다시 측정해 주세요."} 제공곡 음역은 음원에서 추정한 참고값이며 가창 성공을 보장하지 않아요.</p><div className="sample-song-list">{sampleRecommendations.map(({song,fit})=><button data-sample-fit={fit.status} key={song.id} className={sampleSong.id===song.id?'active':''} aria-pressed={sampleSong.id===song.id} onClick={()=>chooseSampleSong(song)}><span>{song.title}</span><strong>{song.range}</strong><small>{song.key} · {song.mood} · {fit.eligible?"측정 음역 내 구간":"측정 음역 밖 구간"}</small></button>)}</div><Player source={sampleSong.audioFile} durationHint={sampleSong.duration} playing={sampleGuidePlaying} setPlaying={setSampleGuidePlaying} caption="제공곡 구간 듣기"/><button className="primary" onClick={()=>{setSampleGuidePlaying(false);setStep('sample')}}>{sampleSong.title} 녹음하기</button></section>}
      {step === 'sample' && <section className="sample-stage"><p className="kicker">Separate profile audio · {sampleSong.title}</p><h1>대표 Voice Sample을<br/>별도로 녹음해요.</h1><p>먼저 원곡을 듣고 첫 가사의 진입을 익혀 주세요. 녹음 버튼을 누르면 마이크 준비 후 Guide를 켜면 원곡의 앞 반주 3초를 듣습니다. 3·2·1 준비 표시가 끝나고 녹음 시작 안내가 나오면 첫 가사를 부르세요. 지정 {sampleSong.duration}초 구간을 부르고 정지를 눌러 주세요.</p>{sampleStatus==='ready'&&<Player source={sampleSong.audioFile} durationHint={sampleSong.duration} playing={sampleGuidePlaying} setPlaying={setSampleGuidePlaying} caption="첫 가사 진입 미리 듣기"/>}<blockquote data-sample-lyric>“{sampleSong.lyrics?.[Math.max(0,sampleSong.lyrics.findLastIndex(line=>seconds>=line.time))]?.text || sampleSong.lyric}”</blockquote>{sampleStatus === 'review' ? <><Player source={sampleDraft?.url} durationHint={sampleDraft?.duration} playing={samplePlaying} setPlaying={setSamplePlaying}/><div className="sample-proof"><span>VOICE SAMPLE · {fmt(sampleDraft?.duration)}</span><span>{sampleDraft?.features?.fingerprint || '분석 없음'}</span></div><VoiceIdentity/><div className="review-actions"><button className="secondary" data-action="sample-retry" onClick={()=>setSampleAction("discard")}>다시 부르기</button><button className="primary" data-action="voice-complete" disabled={saving} onClick={confirmSample}>{saving?'샘플을 저장하고 있어요.':'이 샘플 사용하기'}</button></div></> : <><div className="level-orbit sample-meter" style={{ '--level': level }}><span /></div><label className="backing-guide"><span>Guide · 반주</span><input aria-label="Sample Guide 반주" type="checkbox" checked={sampleGuideEnabled} disabled={sampleBusy} onChange={event=>changeSampleGuide(event.target.checked)}/><i/></label><p className="record-status" role="status" aria-live="polite" data-sample-entry>{sampleStatus === 'preparing' ? `녹음 준비 · ${sampleCountdown ?? 3}` : sampleStatus === 'recording' ? `${seconds < 1 ? '지금 첫 가사를 부르세요 · ' : ''}RECORDING · ${fmt(seconds)} / ${fmt(sampleSong.duration)}` : `${sampleSong.duration}초 지정 구간 · 3초 준비 후 시작`}</p><button className={`record-btn ${sampleStatus === 'recording' ? 'stop' : ''}`} data-action={sampleStatus === 'recording' ? 'sample-stop' : 'sample-start'} disabled={sampleBusy} onClick={sampleStatus === 'recording' ? stopSample : startSample}><Icon name={sampleStatus === 'recording' ? 'stop' : 'mic'} size={27}/></button></>}</section>}
      {step === 'preferences' && <section className="voice-preferences-stage"><p className="kicker">VP05A · 내 보컬 성향</p><h1>함께 부를<br/>내 보컬 성향</h1><VoicePreferenceChoices values={preferences} change={setPreferences} songs={SONGS} songSaves={songSaves} disabled={saving}/><div className="review-actions"><button className="secondary" data-action="preferences-skip" disabled={saving} onClick={()=>{setPreferences(preferenceValues(existing));setError('');setSaveFailure(false);setStep('complete')}}>건너뛰기</button><button className="primary" data-action="preferences-continue" disabled={saving} onClick={savePreferences}>{saving?'저장 중…':'저장하고 계속'}</button></div></section>}
      {step === 'complete' && <section className="voice-complete-stage"><p className="kicker">VP06 · Voice profile ready</p><h1>목소리 준비를<br/>마쳤어요.</h1><VoiceIdentity/><dl className="profile-ready-summary"><div><dt>편한 음역</dt><dd>{range?.label}</dd></div><div><dt>대표 Sample</dt><dd>{sampleSong.title} · {fmt(sampleDraft?.duration)}</dd></div><div><dt>Voice Identity</dt><dd>로컬 생성형 AI 미연결</dd></div></dl><p>Voice Identity는 실제 생성 모델이 연결되기 전까지 완료로 표시하지 않습니다.</p><button className="primary" data-action="profile-finish" disabled={saving} onClick={() => finish({ phase:editMode?undefined:'return-only', editMode, range:range?.label, rangeData:range, sample:sampleDraft, sampleSong, identity:{status:'blocked',reason:'free-local-generative-model-not-connected'} })}>{saving?"프로필을 저장하고 있어요.":editMode?"내 프로필로 돌아가기":"저장하고 원래 화면으로 돌아가기"}</button></section>}
      {error && (saveFailure||sampleAudioFailure?<div className="permission-error" role="alert"><span>{error}</span></div>:<MicrophonePermissionNotice error={error} permissionDenied={permission==='denied'} onRetry={step==='sample'?startSample:startRange}/>)}
      {sampleAction && <RecordingConfirmation onCancel={()=>{pendingSampleSong.current=null;setSampleAction(null)}}><p className="kicker">VOICE SAMPLE</p><h2 id="record-confirm-title">{sampleAction.startsWith('discard')?'지금 샘플을 지우고 다시 부를까요?':'녹음을 끝내고 확인할까요?'}</h2><p>기존 프로필의 샘플과 프로젝트 Track은 그대로 유지됩니다.</p><div className="review-actions"><button className="primary" disabled={sampleBusy} onClick={()=>{pendingSampleSong.current=null;setSampleAction(null)}}>{sampleAction.startsWith('discard')?'지금 샘플 유지':'계속 녹음'}</button><button className="secondary" disabled={sampleBusy} data-action={`confirm-sample-${sampleAction.startsWith('discard')?'discard':'stop'}`} onClick={sampleAction.startsWith('discard')?()=>{retrySample();if(pendingSampleSong.current){setSampleSong(pendingSampleSong.current);pendingSampleSong.current=null}setSampleAction(null)}:stopSample}>{sampleAction.startsWith('discard')?'지우고 다시 부르기':'녹음 끝내고 확인하기'}</button></div></RecordingConfirmation>}

    </main>
  </div>
}

function Workspace({ go, project = PROJECT, song, isCreated = false, ownerPartId, findVocal, joined, invited, invitedPerson, candidateAccepted, candidateArrivalStatus, projectTracks, layers, recordPart, projectLiked, toggleProjectLike, openVocalProfile, mix, mixStatus = 'idle', retryAutoMix, completionDelayed = false, hasDraft = false }) {
  const [mixPlaying,setMixPlaying]=useState(false)
  const finalTracks=useMemo(()=>Object.fromEntries(submittedProjectTracks(project,projectTracks).map(track=>[track.partId,track])),
    [project.id,project.partIds?.join(':') || project.parts?.map(part=>part.id).join(':'),projectTracks])
  const allSubmitted=allProjectTracksSubmitted(project,finalTracks)
  const completedMix=allSubmitted ? mix : null
  const currentMixStatus=allSubmitted ? mixStatus : 'idle'
  const baseParts = project.parts || PART_CATALOG.slice(0,project.partCount)
  const projectParts = baseParts.map(part => {
    const track = finalTracks[part.id]
    if (track) return {...part, participantId:track.participantId || personFromName(track.participant)?.id, participant:track.participant, status:'submitted', duration:fmt(track.duration), demo:track.demo, disclosure:track.disclosure}
    const pendingInvites = (part.invitations||[]).filter(invitation=>invitation.status==='sent')
    if (pendingInvites.length && !part.participantId) return {...part,participant:null,status:'open',invitationStatus:'sent'}
    if (isCreated && part.id === ownerPartId) return {...part,participantId:CURRENT_USER_ID,participant:'JISUN',status:'ready'}
    if (!isCreated && part.id === ownerPartId && joined) return {...part,participantId:CURRENT_USER_ID,participant:'JISUN',status:'ready'}
    if (part.id === 'bass' && candidateAccepted) return {...part,participantId:invitedPerson.id,participant:invitedPerson.name,status:'accepted'}
    return part.status==='submitted' ? {...part,status:part.participantId?'ready':'open',duration:null} : part
  })
  const submitted = projectParts.filter(p => p.status === 'submitted').length
  const invitedParts = isCreated ? projectParts.filter(part=>part.invitationStatus) : []
  const myPart = projectParts.find(part=>part.participantId===CURRENT_USER_ID)
  const canRecordMyPart = myPart?.status === 'ready'
  const partAction = part => {
    if (isCreated && part.invitationStatus==='sent') return {action:()=>findVocal(part.id),label:'다른 보컬 찾기'}
    if (isCreated && ownerPartId && !part.participantId && !part.invitationStatus) return {action:()=>findVocal(part.id),label:'보컬 찾기'}
    if (!isCreated && !part.participantId && part.id==='bass' && !finalTracks.bass && !candidateAccepted) return {action:()=>findVocal(part.id),label:invited?'다른 보컬 찾기':'보컬 찾기'}
    return {}
  }
  return <div className="screen workspace-screen">
    <TopBar figmaHeader title="프로젝트 작업실" back={() => isCreated ? go('projects') : go('detail')} action={<img src={figmaAssets.imgFaFaHeart1} alt="" aria-hidden="true"/>} actionLabel={projectLiked?'프로젝트 Like 취소':'프로젝트 Like'} actionPressed={projectLiked} actionId="toggle-project-like" onAction={toggleProjectLike} />
    <main>
      <div className="title-row"><div><h1>{song?.title || project.name}</h1><p className="workspace-project-name">{project.name}</p></div></div>
      {completionDelayed&&<section className="completion-delay-banner" role="status" data-state="completion-delayed"><strong>내 녹음을 이어갈 차례예요.</strong><p>마지막 유효 활동 후 7일이 지났습니다. 미완료된 내 Part를 제출하면 프로젝트가 다시 진행돼요.</p></section>}
      <ResonanceRecord recordRef={project.voiceRecordRef} parts={projectParts} tracks={finalTracks} projectId={project.id} layers={projectParts.map(part=>finalTracks[part.id]?.layer || null)} state={currentMixStatus==='processing'?'processing':mixPlaying?'playing':'rest'} seed={project.seed}/>

      {isCreated && invitedParts.map(part=><section className="invite-status" data-invite-state={part.invitationStatus} key={part.id}><span>{part.invitationStatus==='accepted'?`${part.participant} · ${part.name} 참여 확정`:`${part.name} · ${(part.invitations||[]).filter(item=>item.status==='sent').length}명 수락 대기`}</span><b>{part.invitationStatus==='accepted'?'TRACK WAIT':'ACCEPT WAIT'}</b></section>)}
      {!isCreated && invited && !candidateAccepted && <section className="invite-status" data-invite-state="sent"><span>{invitedPerson.name}에게 Bass 초대 보냄</span><b>ACCEPT WAIT</b></section>}
      {!isCreated && candidateAccepted && !finalTracks.bass && <section className="invite-status" data-invite-state="accepted"><span>{invitedPerson.name} · Bass 초대 수락</span><b>{candidateArrivalStatus==='loading'?'TRACK ARRIVING':'TRACK WAIT'}</b></section>}
      {!isCreated && invited && finalTracks.bass && <section className="invite-status" data-invite-state="submitted"><span>{invitedPerson.name}의 Bass 데모 Track 도착</span><b>SUBMITTED · {submitted}/{projectParts.length}</b></section>}
      <dl className="workspace-meta"><div className="workspace-key"><dt>현재 키</dt><dd>{project.key || 'C major'}</dd></div><div className="workspace-progress"><dt>제출 진행률</dt><dd>{submitted}/{projectParts.length} Tracks</dd></div></dl>
      {canRecordMyPart&&<p className="workspace-record-note">{hasDraft?'임시 저장한 녹음을 확인해 주세요.':`내 ${myPart.name} 녹음이 남았어요.`}</p>}
      <div className="workspace-actions">
        {submitted > 0 && <button className={canRecordMyPart?'secondary':'primary'} data-action={completedMix?'open-complete':'focus-current-mix'} onClick={() => completedMix ? go('complete') : document.getElementById('current-mix')?.scrollIntoView({behavior:'smooth',block:'start'})}><Icon name="headphones"/> {completedMix?'완성곡 듣기':currentMixStatus==='processing'?'Auto Mix 확인':'현재 Mix 듣기'}</button>}
        {canRecordMyPart && <button className="primary" data-action="record-part" onClick={() => recordPart(myPart.id)}><img src={figmaAssets.imgFaFaMicrophone} alt="" aria-hidden="true"/>{hasDraft?'녹음 이어서 확인하기':'내 Part 녹음하기'}</button>}
      </div>
      <CurrentMixPanel parts={projectParts} projectTracks={finalTracks} project={project} mix={completedMix} mixStatus={currentMixStatus} retryAutoMix={retryAutoMix} openVocalProfile={openVocalProfile} onPlayingChange={setMixPlaying} partAction={partAction} completionDelayed={completionDelayed}/>
    </main>
  </div>
}

function MatchDetail({ vocal, back, openProfile, invite, invitedVocalIds, part, project, song, tracks, profile }) {
  const [playing,setPlaying]=useState(false)
  const partName = part?.name || 'Bass'
  const invited = invitedVocalIds.includes(vocal.id)
  const fit = evaluatePartFit({rangeData:vocal,part})
  const reason = fit.reasons.join(' ')
  const team=(project?.parts || []).map(teamPart=>({...teamPart,...(tracks?.[teamPart.id] || {})})).filter(teamPart=>teamPart.participantId)
  return <div className="screen candidate-screen">
    <TopBar title="MATCH DETAIL" back={back} meta={`${partName.toUpperCase()} · CURRENT TEAM`}/>
    <main>
      <button className="candidate-identity identity-link" onClick={()=>openProfile(vocal.id)} aria-label={`${vocal.name} 전체 보컬 프로필 보기`}><VoiceIdentity identity={vocal.identity}/><span><p className="kicker">Candidate · sample data</p><h1>{vocal.name}</h1><p>{vocal.role}<br/>{vocal.range}</p><small>전체 보컬 프로필 보기 ↗</small></span></button>
      <section className="profile-facts" data-match-target><div><span>곡 · 프로젝트</span><b>{song?.title || project?.name} · {project?.name}</b></div><div><span>초대할 파트 · 현재 Key</span><b>{partName} · {project?.key || '미등록'}</b></div><div><span>요구 음역</span><b>{part?.range || '미등록'}</b></div></section>
      <section className="voice-sample-block"><h2>대표 Voice Sample</h2>{vocal.sampleUrl?<Player source={vocal.sampleUrl} durationHint={vocal.sampleDuration} playing={playing} setPlaying={setPlaying}/>:<p>등록된 목소리 샘플이 없어요.</p>}</section>
      <section className="reason-block"><h2>현재 프로젝트에 맞는 이유</h2><p>{reason}</p><div className="reason-row"><span>Range</span><b>{fit.eligible?"요구 음역 충족":"요구 음역 확인 필요"} · {partName} 기준</b></div><div className="reason-row"><span>Timbre</span><b>실제 음색 비교 데이터 대기</b></div><div className="reason-row"><span>Role</span><b>{(vocal.roles||[]).join(" · ")}</b></div><div className="reason-row"><span>Taste</span><b>{(vocal.genres||[]).join(' · ')}</b></div><small>후보 프로필은 시연용 샘플 데이터입니다. 실제 사용자 측정 결과나 실력 평가가 아닙니다.</small></section>
      <section className="compatibility compact"><h2>사람 간 궁합은 프로필에서 확인</h2><p>프로젝트 적합성과 `나 ↔ {vocal.name}`의 궁합은 서로 다른 입력과 화면을 사용합니다.</p><button className="secondary" onClick={()=>openProfile(vocal.id)}>나와의 보컬 궁합 보기</button></section>
      <section className="reason-block" data-match-team><h2>현재 참여자와의 조합</h2>{team.map(member=>{const person=member.participantId===CURRENT_USER_ID?profile:PERSON_BY_ID[member.participantId];return <div className="reason-row" key={member.id}><span>{member.name} · {member.participant || PERSON_BY_ID[member.participantId]?.name || '참여자'}</span><b>{person?.range || '음역 미등록'} · {(person?.roles || []).join(' · ') || '역할 미등록'}</b></div>})}<p>후보 {vocal.name} · {vocal.range} · {(vocal.roles || []).join(' · ')}</p><small>등록된 음역·역할을 함께 확인합니다. 실제 Team 음색 비교 데이터는 아직 준비되지 않았어요.</small></section>
      {invite && <button className="primary sticky-cta" data-action="invite" disabled={invited || !fit.eligible} onClick={() => invite(vocal)}>{invited?`${partName} 초대 보냄 · 수락 대기`:`${partName} Part 초대`}</button>}
    </main>
  </div>
}

function OtherVocalProfile({ vocal, back, saved, toggleSave, sampleUrl, sampleDuration, profile, setupVoice }) {
  const [playing,setPlaying] = useState(false)
  const shared = sharedVoicePreferences(profile,vocal)
  const compatibility = [
    `나 ${profile?.range || '미등록'} · ${vocal.name} ${vocal.range || '미등록'}`,
    '실제 두 목소리의 음색 비교 데이터가 아직 준비되지 않았어요.',
    `나 ${(profile?.roles || []).join(' · ') || '미등록'} / ${vocal.name} ${(vocal.roles || []).join(' · ') || '미등록'}`,
    !shared.configured ? '보컬 성향은 선택 사항이에요. 아직 비교할 저장값이 없어요.' : shared.count ? `공통 장르: ${shared.genres.join(' · ') || '없음'} / 공통 취향: ${shared.taste.join(' · ') || '없음'} / 함께 부르고 싶은 곡 ${shared.songIds.length}개` : '저장된 성향의 공통 항목이 아직 확인되지 않았어요. 참여 조건에는 영향을 주지 않아요.'
  ]
  return <div className="screen candidate-screen other-vocal-screen">
    <TopBar title="VOCAL PROFILE" back={back} meta="ME ↔ VOCAL"/>
    <main>
      <div className="candidate-profile-head"><div className="candidate-identity"><VoiceIdentity identity={vocal.identity}/><div><p className="kicker">Other vocal</p><div className="vocal-name-line"><h1>{vocal.name}</h1><button className={`name-star ${saved?'active':''}`} data-action="toggle-vocal-save" aria-label={saved?`${vocal.name} 보컬 저장 취소`:`${vocal.name} 보컬 저장`} aria-pressed={saved} onClick={()=>toggleSave(vocal.id)}><Icon name="star" size={18}/></button></div><p>{vocal.voiceType}<br/>{vocal.range}</p></div></div></div>
      <section className="profile-facts"><div><span>선호 역할</span><b>{(vocal.roles||[vocal.role]).join(' · ')}</b></div><div><span>선호 장르</span><b>{(vocal.genres||[]).join(' · ')}</b></div><div><span>음악 취향</span><b>{(vocal.taste||[]).join(' · ')}</b></div></section>
      <section className="voice-sample-block"><div className="section-head"><h2>대표 Voice Sample</h2><span>{sampleUrl?'재생 가능':'아직 등록되지 않음'}</span></div>{sampleUrl?<Player source={sampleUrl} durationHint={sampleDuration} playing={playing} setPlaying={setPlaying}/>:<p>이 시연 데이터에는 실제 대표 Voice Sample이 없습니다. 프로젝트 Track을 프로필 Sample로 대신 표시하지 않습니다.</p>}</section>
      <section className="compatibility"><h2>나와의 보컬 궁합</h2>{profile ? <>{['음역 조합','음색 조화','역할 보완','음악 취향'].map((label,index)=><div className="reason-row" key={label}><span>{label}</span><b>{compatibility[index]}</b></div>)}<small>내 저장된 Profile과 상대의 시연용 프로필 정보를 비교합니다. 실제 음색 분석이나 실력 점수가 아닙니다.</small></> : <><p>내 목소리를 등록하면 두 목소리의 조합을 볼 수 있어요.</p><button className="secondary" data-action="profile-setup-from-vocal" onClick={setupVoice}>내 목소리 알아보기</button></>}</section>
    </main>
  </div>
}

function Finder({ back, preferences, updatePreferences, invite, invitedVocalIds = [], part, vocalSaves, toggleVocalSave, openVocalProfile, selectedVocalId, setSelectedVocalId, profile, project, song, tracks }) {
  const {sort:storedSort='종합 추천순',filterOpen=false,roleOnly=false,rangeFilter='',voiceTypeFilter='',genreFilter='',tasteFilter='',scrollTop=0}=preferences || {}
  const tasteReady=Boolean(profile?.genres?.length || profile?.taste?.length || profile?.preferredSongIds?.length)
  const sort=storedSort==='음색 조화순'||(storedSort==='곡 취향 유사순'&&!tasteReady)?'종합 추천순':storedSort
  const setSort=value=>updatePreferences({sort:value})
  const setRoleOnly=value=>updatePreferences({roleOnly:value})
  const returnToList=()=>{
    setSelectedVocalId(null)
    requestAnimationFrame(()=>{const surface=document.querySelector('.finder-screen');if(surface)surface.scrollTop=scrollTop;window.scrollTo(0,scrollTop)})
  }
  const keyBySort = {'종합 추천순':'overall','음역 적합순':'range','음색 조화순':'timbre','역할 보완순':'role','곡 취향 유사순':'taste'}
  const partName = part?.name || 'Bass'
  const roleHints = {Soprano:['Upper harmony','Main'],Alto:['Support','Middle harmony'],Tenor:['Middle harmony','Support'],Bass:['Bass foundation','Low harmony']}
  const preferredRoles = roleHints[partName] || []
  const score = (candidate,key) => {
    const preferred = candidate.roles?.some(role=>preferredRoles.includes(role))
    const fit=evaluatePartFit({rangeData:candidate,part})
    const margin=Math.min(fit.lowMargin||0,fit.highMargin||0)
    if(key==="range")return margin
    if(key==="taste")return sharedVoicePreferences(profile,candidate).count
    const base=key==="overall"?margin:key==="role"?(preferred?1:0):0
    return (preferred ? 100 : 0) + base
  }
  const eligibleCandidates = PEOPLE.filter(candidate=>!candidate.isSelf)
    .filter(candidate=>evaluatePartFit({rangeData:candidate,part}).eligible)
  const candidates = eligibleCandidates
    .filter(candidate=>!roleOnly || candidate.roles?.some(role=>preferredRoles.includes(role)))
    .filter(candidate=>!rangeFilter || candidate.range===rangeFilter)
    .filter(candidate=>!voiceTypeFilter || candidate.voiceType===voiceTypeFilter)
    .filter(candidate=>!genreFilter || candidate.genres?.includes(genreFilter))
    .filter(candidate=>!tasteFilter || candidate.taste?.includes(tasteFilter))
    .sort((a,b)=>score(b,keyBySort[sort])-score(a,keyBySort[sort]))
  const selected = selectedVocalId ? PERSON_BY_ID[selectedVocalId] : null
  if (selected) return <MatchDetail vocal={selected} back={returnToList} openProfile={openVocalProfile} invite={invite} invitedVocalIds={invitedVocalIds} part={part} project={project} song={song} tracks={tracks} profile={profile}/>
  return <div className="screen finder-screen">
    <TopBar title={`${partName.toUpperCase()} · VOCAL FINDER`} back={back} action={filterOpen?'닫기':'필터'} onAction={()=>updatePreferences({filterOpen:!filterOpen})}/>
    <main>
      <p className="kicker">등록된 샘플 음역 기준 · {candidates.length} vocals</p><h1>{partName}를 끝까지<br/>부를 수 있는 보컬</h1>
      {filterOpen && <section className="finder-filters"><label><input type="checkbox" checked={roleOnly} onChange={event=>setRoleOnly(event.target.checked)}/><span>{partName} 선호 역할</span></label>{[['rangeFilter','등록 음역','range',rangeFilter],['voiceTypeFilter','프로필 음색 설명','voiceType',voiceTypeFilter],['genreFilter','선호 장르','genres',genreFilter],['tasteFilter','음악 취향','taste',tasteFilter]].map(([key,label,field,value])=><label key={key}>{label}<select aria-label={label} value={value} onChange={event=>updatePreferences({[key]:event.target.value})}><option value="">전체</option>{[...new Set(eligibleCandidates.flatMap(candidate=>candidate[field] || []))].map(option=><option key={option} value={option}>{option}</option>)}</select></label>)}<p>현재 Part의 음역 조건을 통과한 후보 안에서 좁혀 봅니다. 후보의 음역·음색 설명·취향은 시연용 프로필 데이터이며 실제 음색 분석값이 아닙니다.</p><button className="secondary" data-action="clear-finder-filters" onClick={()=>updatePreferences({roleOnly:false,rangeFilter:'',voiceTypeFilter:'',genreFilter:'',tasteFilter:''})}>조건 초기화</button></section>}
      <div className="sort-row">{Object.keys(keyBySort).map(item => <button key={item} disabled={item==='음색 조화순'||(item==='곡 취향 유사순'&&!tasteReady)} className={sort === item ? 'active' : ''} onClick={() => setSort(item)}>{item}</button>)}</div>
      <p>음색 조화순은 실제 비교 데이터가 준비된 뒤 사용할 수 있어요.{!tasteReady&&(profile?' 곡 취향 유사순은 내 프로필에서 장르나 음악 취향을 선택한 뒤 사용할 수 있어요.':' 곡 취향 유사순은 내 프로필 등록 후 사용할 수 있어요.')}</p>
      {candidates.length===0 && <section className="empty-state"><p>이 조건에 맞는 보컬이 없어요. 필터를 바꿔 다시 찾아보세요.</p><button className="secondary" data-action="reset-finder" onClick={()=>updatePreferences({roleOnly:false,rangeFilter:'',voiceTypeFilter:'',genreFilter:'',tasteFilter:'',sort:'종합 추천순'})}>조건 초기화</button></section>}
      <div className="candidate-list">{candidates.map(candidate => <div key={candidate.id} className="candidate-row"><button className="candidate-open" data-action="candidate" onClick={() => {updatePreferences({scrollTop:document.querySelector('.screen')?.scrollTop || window.scrollY});setSelectedVocalId(candidate.id);scrollToTop()}}><VoiceIdentity identity={candidate.identity}/><span><strong>{candidate.name}</strong><small>{candidate.range} · {candidate.role}</small><em>{candidate.matchReason || `${partName} 후보 · ${candidate.roles?.join(' · ')}`}</em></span><b>↗</b></button><button className={`candidate-save ${vocalSaves.some(item=>item.vocalId===candidate.id)?'active':''}`} aria-label={`${candidate.name} 보컬 저장`} aria-pressed={vocalSaves.some(item=>item.vocalId===candidate.id)} onClick={()=>toggleVocalSave(candidate.id)}><Icon name="star" size={17}/></button></div>)}</div>
    </main>
  </div>
}

function RecordingConfirmation({ children, onCancel }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog=dialogRef.current
    const opener=document.activeElement
    dialog.showModal()
    return()=>{if(dialog.open)dialog.close();if(opener?.isConnected)opener.focus()}
  },[])
  const trapFocus=event=>{
    if(event.key!=='Tab')return
    const buttons=Array.from(event.currentTarget.querySelectorAll('button:not(:disabled)'))
    const first=buttons[0],last=buttons.at(-1)
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
  return <dialog ref={dialogRef} className="confirm-modal" aria-labelledby="record-confirm-title" onKeyDown={trapFocus} onCancel={event=>{event.preventDefault();onCancel()}}>{children}</dialog>
}

function Recorder({ go, submit, onRecordingStart, partId, projectTracks, layers, project = PROJECT, parts = PARTS, onDraftChange }) {
  const finalTracks=useMemo(()=>Object.fromEntries(submittedProjectTracks(project,projectTracks).map(track=>[track.partId,track])),[project,projectTracks])
  const finalLayers=parts.map((part,index)=>finalTracks[part.id]?.layer || (finalTracks[part.id]?layers[index]:null))
  const recordingWindow = Math.max(18,...Object.values(finalTracks).map(track=>track.duration || 0),project.recordingDuration || 0)
  const currentPart = parts.find(part => part.id === partId) || parts[0]
  const currentIndex = parts.findIndex(part => part.id === currentPart.id)
  const guideTracks = parts.flatMap((part,partIndex)=>part.id!==currentPart.id && finalTracks[part.id]?[{...finalTracks[part.id],partIndex}]:[])
  const [guides, setGuides] = useState({ backing:true, parts:parts.map(part=>part.id!==partId) })
  const [status, setStatus] = useState('ready')
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)
  const [peak, setPeak] = useState(0)
  const [noiseFloor,setNoiseFloor] = useState(0)
  const [draft, setDraft] = useState(null)
  const [reviewPlaying, setReviewPlaying] = useState(false)
  const [error, setError] = useState('')
  const [permissionDenied,setPermissionDenied] = useState(false)
  const [microphoneFailure,setMicrophoneFailure] = useState(false)
  const [submitting,setSubmitting] = useState(false)
  const submittingRef=useRef(false)
  const startingRef=useRef(false)
  const stoppingRef=useRef(false)
  const discardingRef=useRef(false)
  const leavingRef=useRef(false)
  const recorderActiveRef=useRef(true)
  const [recordingBusy,setRecordingBusy]=useState(false)
  const [restoreState,setRestoreState]=useState('loading')
  const [restoreAttempt,setRestoreAttempt]=useState(0)
  const [confirmAction,setConfirmAction] = useState(null)
  const timer = useRef(null)
  const inputLevels=useRef([])
  const waveformRef=useRef(null)
  const recordingSourceRef=useRef(null)
  const [inputRms,setInputRms]=useState(0)
  const legacyDraftId = `${project.id}:${currentPart.id}:temporary-recording`
  const draftId = `${CURRENT_USER_ID}:${legacyDraftId}`
  const lyricIndex = project.lyrics?.length ? project.lyrics.findLastIndex(line=>seconds>=line.time) : 0
  const lyrics = project.lyrics?.length ? project.lyrics.map(line=>line.text) : ['가사 없음']
  const entryPrompt = recordingEntryPrompt(project,seconds,status)
  const begin = async () => {
    if(startingRef.current || restoreState!=='ready')return
    startingRef.current=true;setRecordingBusy(true)
    let audioReady=false
    try {
      setError(''); setMicrophoneFailure(false); setPermissionDenied(false)
      const backingBlob=await loadProjectBacking(project)
      if(!startingRef.current)return
      recordingSourceRef.current=projectAudioReference(project)
      audioReady=true
      await requestMicrophone({ voiceProcessing:(guides.backing || guides.parts.some(Boolean)) ? true : null })
      if(!startingRef.current)return
      inputLevels.current=[]
      await startRecording({ onFrame: frame => { waveformRef.current=frame.waveform;setInputRms(frame.rms || 0);setLevel(frame.level); setPeak(frame.peak); setSeconds(frame.elapsedSec || 0);inputLevels.current.push(frame.level) }, guides, guideTracks, backingBlob, duration:recordingWindow })
      onRecordingStart?.(); setStatus('recording'); setSeconds(0); timer.current = window.setInterval(() => setSeconds(getRecordingTimeline().elapsedSec), 100)
    } catch (e) { if(!startingRef.current)return;setMicrophoneFailure(audioReady); setPermissionDenied(audioReady&&isMicrophonePermissionError(e)); setError(audioReady?microphoneErrorMessage(e):e.message); setStatus('ready') }
    finally {startingRef.current=false;setRecordingBusy(false)}
  }
  const pause = () => {
    if(getRecordingTimeline().state!=='recording')return
    try { pauseRecording(); setError(''); setStatus('paused'); clearInterval(timer.current) }
    catch(reason) { setError(reason?.message || '일시정지하지 못했어요. 다시 눌러 주세요.') }
  }
  const resume = () => {
    if(getRecordingTimeline().state!=='paused')return
    try { resumeRecording(); setError(''); setStatus('recording'); timer.current = window.setInterval(() => setSeconds(getRecordingTimeline().elapsedSec), 100) }
    catch(reason) { setError(reason?.message || '녹음을 이어가지 못했어요. 다시 눌러 주세요.') }
  }
  const stop = async () => {
    if(stoppingRef.current)return false
    stoppingRef.current=true;setRecordingBusy(true)
    try {
    setError('')
    clearInterval(timer.current)
    const value = await stopRecording()
    if (!value?.blob) { setError('녹음을 저장하지 못했어요. 다시 시도해 주세요.'); setStatus('paused'); return }
    const sortedLevels=[...inputLevels.current].sort((a,b)=>a-b)
    const measuredNoise=sortedLevels[Math.floor(sortedLevels.length*.1)] || noiseFloor
    setNoiseFloor(measuredNoise)
    const stored = {...value,id:draftId,projectId:project.id,partId:currentPart.id,kind:'temporary-recording',userId:CURRENT_USER_ID,audioSourceRef:recordingSourceRef.current,guides,timelineSec:seconds,submitted:false,noiseFloor:measuredNoise,createdAt:new Date().toISOString()}
    setDraft(stored); setStatus('review')
    try { await saveTrack(stored); onDraftChange?.(true); return true }
    catch { setError('임시 저장하지 못했어요. 녹음 원본은 이 화면에 유지됩니다. 저장을 다시 시도해 주세요.'); return false }
    } catch(reason) {
      setError(reason?.message || '녹음을 끝내지 못했어요. 다시 정지를 눌러 주세요.')
      if(getRecordingTimeline().state==='recording')timer.current=window.setInterval(()=>setSeconds(getRecordingTimeline().elapsedSec),100)
      return false
    } finally {stoppingRef.current=false;setRecordingBusy(false)}
  }
  const retry = async () => {
    if(discardingRef.current)return
    discardingRef.current=true;setRecordingBusy(true)
    setError(''); setMicrophoneFailure(false)
    try {
      await deleteRecordingDraft({userId:CURRENT_USER_ID,projectId:project.id,partId:currentPart.id})
      if(!recorderActiveRef.current)return
      clearInterval(timer.current); cancelRecording()
      if(draft?.url)URL.revokeObjectURL(draft.url)
      onDraftChange?.(false); setDraft(null); setReviewPlaying(false); setStatus('ready'); setSeconds(0); setLevel(0); setConfirmAction(null)
    } catch {
      if(!recorderActiveRef.current)return
      setConfirmAction(null); setError('녹음을 지우지 못했어요. 현재 녹음은 유지됩니다. 다시 시도해 주세요.')
    } finally {discardingRef.current=false;if(recorderActiveRef.current)setRecordingBusy(false)}
  }
  const leave = async () => {
    if(recordingBusy||startingRef.current||stoppingRef.current||discardingRef.current||leavingRef.current||submittingRef.current)return
    if (status==='recording'||status==='paused') { setConfirmAction('leave'); return }
    leavingRef.current=true;setRecordingBusy(true)
    try {
      if(draft)await saveTrack(draft)
      if(recorderActiveRef.current)go('workspace')
    } catch {
      if(recorderActiveRef.current)setError('임시 저장하지 못했어요. 원본을 유지하고 다시 시도해 주세요.')
    } finally {leavingRef.current=false;if(recorderActiveRef.current)setRecordingBusy(false)}
  }
  const confirmLeave = async () => {
    if(leavingRef.current||stoppingRef.current||discardingRef.current||submittingRef.current)return
    leavingRef.current=true;setRecordingBusy(true)
    try {
      if(status==='recording'||status==='paused') { if(!await stop()) {if(recorderActiveRef.current)setConfirmAction(null);return} }
      else if(draft)await saveTrack(draft)
      if(recorderActiveRef.current){setConfirmAction(null);go('workspace')}
    } catch {
      if(recorderActiveRef.current){setConfirmAction(null);setError('저장하지 못했어요. 원본을 유지합니다.')}
    } finally {leavingRef.current=false;if(recorderActiveRef.current)setRecordingBusy(false)}
  }
  const send = async () => {
    if (submittingRef.current||leavingRef.current) return
    submittingRef.current=true;setSubmitting(true); setError('')
    try {
      await submit({...draft,noiseFloor},currentPart)
      // Submission is committed independently of optional local draft cleanup.
      try {
        await deleteRecordingDraft({userId:CURRENT_USER_ID,projectId:project.id,partId:currentPart.id})
        onDraftChange?.(false)
      } catch (error) { console.error('Submitted Track preserved; draft cleanup pending',error) }
    }
    catch (reason) { setError(reason?.message || '제출하지 못했어요. 원본 녹음은 이 기기에 보관했어요. 다시 시도해 주세요.'); submittingRef.current=false;setSubmitting(false) }
  }
  useEffect(() => {
    let active=true
    setRestoreState('loading')
    setError('')
    loadTrack(`${project.id}:${currentPart.id}`).then(submitted=>submitted?.origin==='live-microphone-recording' && submittedProjectTracks(project,{[currentPart.id]:submitted}).length?null:loadTrack(draftId).then(async stored=>stored || await loadTrack(legacyDraftId))).then(stored=>{
      if (!active || stored?.kind!=='temporary-recording' || !stored.blob) return
      if(stored.userId && stored.userId!==CURRENT_USER_ID)return
      const restored={...stored,url:URL.createObjectURL(stored.blob)}
      if(stored.guides)setGuides(stored.guides)
      setDraft({...restored,id:draftId,userId:CURRENT_USER_ID}); setSeconds(restored.duration||0); setNoiseFloor(restored.noiseFloor||0); setStatus('review'); onDraftChange?.(true)
    }).then(()=>{if(active)setRestoreState('ready')}).catch(()=>{
      if(active){setRestoreState('error');setError('저장한 녹음을 불러오지 못했어요. 원본을 확인한 뒤 다시 녹음할 수 있어요.')}
    })
    return ()=>{active=false}
  },[draftId,restoreAttempt])
  useEffect(() => {recorderActiveRef.current=true;return () => { recorderActiveRef.current=false;startingRef.current=false; clearInterval(timer.current); cancelRecording(); stopMicrophone() }}, [])
  useEffect(() => {
    const url=draft?.url
    return () => {
      // Successful submission transfers this URL to the Project Track player.
      if(url && !submittingRef.current)URL.revokeObjectURL(url)
    }
  },[draft?.url])
  useEffect(()=>{
    if(status!=='recording'&&status!=='paused')return
    try { updateRecordingGuides(guides); setError('') }
    catch(reason) { setError(reason?.message || 'Guide를 재생하지 못했어요. 다시 선택해 주세요.') }
  },[guides])
  const provisionalLayer = draft?.features ? buildVoiceLayer(project.seed,currentPart.id,draft.features) : null
  const reviewLayers = finalLayers.map((layer,index)=>index===currentIndex&&provisionalLayer?provisionalLayer:layer)
  return <div className="screen recording-screen" data-recording-status={status}>
    <TopBar figmaHeader title={status==='review'?'녹음 확인':`${currentPart.name} 녹음`} back={leave} meta={status === 'review' ? project.key || 'C major' : undefined}/>
    <main>
      <div className="recording-heading"><h1>{project.songTitle || project.name || "내 Part 녹음"}</h1><p>{project.name} · {currentPart.name} · {project.key || "C major"}</p><span className="recording-clock" data-state={status} data-recording-entry>{status === "recording" ? "REC" : status === "paused" ? "PAUSED" : status === "review" ? "REVIEW" : "READY"} · {fmt(seconds)}{entryPrompt && ` · ${entryPrompt}`}</span></div>
      <section className="guide-panel" aria-label="듣기 전용 Guide">
        <label className="backing-guide"><span>Guide · 반주</span><input aria-label="Guide 반주" type="checkbox" checked={guides.backing} onChange={e=>setGuides({...guides,backing:e.target.checked})}/><i/></label>
        <div className="section-head"><h2>함께 듣는 Track</h2><span>{guideTracks.filter(track=>guides.parts[parts.findIndex(part=>part.id===track.partId)]).length}개 선택</span></div>
        <div className="guide-track-chips">{guideTracks.map(track=>{const part=parts.find(item=>item.id===track.partId);const actualIndex=parts.findIndex(item=>item.id===track.partId);return <label className={guides.parts[actualIndex]?'selected':''} key={track.id}><input aria-label={`${track.participant} · ${part?.name} 함께 듣기`} type="checkbox" checked={Boolean(guides.parts[actualIndex])} onChange={e=>{const nextParts=[...guides.parts];nextParts[actualIndex]=e.target.checked;setGuides({...guides,parts:nextParts})}}/><span>{track.participant} · {part?.name}</span></label>})}</div>
        <p className="guide-device-note">Guide는 듣기용이며 녹음에는 내 입력만 저장합니다. 이어폰 없이 녹음하면 스피커 소리가 마이크에 들어갈 수 있어요.</p>
      </section>
      <div className="recording-visual"><ResonanceRecord recordRef={project.voiceRecordRef} parts={parts} tracks={finalTracks} projectId={project.id} layers={status==='review'?reviewLayers:finalLayers} activePartIndex={currentIndex} state={status === 'recording' ? 'recording' : status==='paused'?'paused':'rest'} level={level} seed={project.seed} compact /><RecordingInflow active={status==='recording'} partIndex={0} level={level} seed={project.seed} waveformRef={waveformRef}/></div>
      {!project.lyrics?.length&&<p className="lyric-source-note">실제 곡 가사와 반주가 아직 등록되지 않았어요.</p>}
      <div className="lyrics" aria-live="polite">{[lyricIndex-1,lyricIndex,lyricIndex+1].map(index=><span key={index} className={index===lyricIndex?'active':''} aria-hidden={!lyrics[index]||undefined}>{lyrics[index] || ''}</span>)}</div>
      <div className="recording-timeline" aria-label="녹음 시간"><div><span>RECORD TIME</span><b>{fmt(seconds)} / {fmt(recordingWindow)}</b></div><div className="time-progress"><span style={{width:`${Math.min(100,seconds/recordingWindow*100)}%`}}/></div></div>
      <div className="meter-row"><span>MIC {inputRms>0?`${Math.max(-96,Math.round(20*Math.log10(inputRms)))} dBFS`:"— dBFS"}</span><div className={`input-meter ${peak>.9?'clip':''}`} aria-label="마이크 입력 볼륨"><span style={{width:`${Math.max(2,level*100)}%`}}/><i style={{left:`${Math.min(98,peak*100)}%`}}/></div><b>{peak>.9?'CLIP':level>.08?'GOOD':'LOW'}</b></div>{noiseFloor>0&&<p className={`noise-status ${noiseFloor>.08?'warning':''}`}>주변 소음 · {noiseFloor>.08?'높음 — Review에서 다시 녹음을 선택할 수 있어요.':'양호'} ({Math.round(noiseFloor*100)}%)</p>}

      {error && (microphoneFailure&&status!=='review'?<MicrophonePermissionNotice error={error} onRetry={begin} permissionDenied={permissionDenied}/>:<div className="permission-error" role="alert"><span>{error}</span>{restoreState==='error'&&<button className="secondary" data-action="draft-restore-retry" onClick={()=>{setRestoreState('loading');setRestoreAttempt(value=>value+1)}}>저장한 녹음 다시 불러오기</button>}</div>)}
      {status === 'review' ? <section className="record-review"><p className="kicker">녹음 확인 · {fmt(draft?.duration)}</p><h2>{draft?.features?.peak > .92 ? '일부 구간이 너무 크게 녹음됐어요.' : noiseFloor>.08?'주변 소음이 함께 녹음됐을 수 있어요.':'제출할 Track을 확인해 주세요.'}</h2><p>{noiseFloor>.08?'다시 녹음을 권하지만 제출을 막지는 않습니다. 제출 후 기본 노이즈 정리를 적용합니다. ':''}{draft?.features ? `에너지 ${Math.round(draft.features.energy*100)} · 밝기 ${Math.round(draft.features.brightness*100)} · 거칠기 ${Math.round(draft.features.roughness*100)} · 특징 ${draft.features.fingerprint}` : '오디오 분석을 완료하지 못했지만 재생 후 제출할 수 있어요.'}</p><Player source={draft?.url} durationHint={draft?.duration} playing={reviewPlaying} setPlaying={setReviewPlaying}/><div className="review-actions"><button className="secondary" data-action="record-retry" disabled={submitting||recordingBusy} onClick={()=>setConfirmAction('retry')}>다시 녹음</button><button className="primary" data-action="record-submit" disabled={submitting||recordingBusy} onClick={send}>{submitting?'제출 중…':'녹음 제출'}</button></div></section>
      : <div className="recorder-controls">
          {status === 'ready' && <button className="record-btn" data-action="record-start" disabled={recordingBusy||restoreState!=='ready'} aria-label="녹음 시작" onClick={begin}><Icon name="mic" size={28}/></button>}
          {status === 'recording' && <><div className="record-control"><button className="round-secondary" aria-label="다시 녹음" disabled={recordingBusy} onClick={()=>setConfirmAction("retry")}><img src={figmaAssets.imgFaFaRotateRight} alt="" aria-hidden="true"/></button><span>다시 녹음</span></div><div className="record-control"><button className="record-btn stop" data-action="record-stop" disabled={recordingBusy} aria-label="녹음 정지" onClick={stop}><img src={figmaAssets.imgFaFaStop} alt="" aria-hidden="true"/></button><span>정지</span></div><div className="record-control"><button className="round-secondary" data-action="record-pause" aria-label="녹음 일시정지" onClick={pause}><img src={figmaAssets.imgFaFaPause} alt="" aria-hidden="true"/></button><span>일시정지</span></div></>}
          {status === 'paused' && <><div className="record-control"><button className="round-secondary" aria-label="다시 녹음" disabled={recordingBusy} onClick={()=>setConfirmAction("retry")}><img src={figmaAssets.imgFaFaRotateRight} alt="" aria-hidden="true"/></button><span>다시 녹음</span></div><div className="record-control"><button className="record-btn stop" data-action="record-stop" disabled={recordingBusy} aria-label="녹음 정지" onClick={stop}><img src={figmaAssets.imgFaFaStop} alt="" aria-hidden="true"/></button><span>정지</span></div><div className="record-control"><button className="round-secondary" data-action="record-resume" aria-label="녹음 이어서" onClick={resume}><img src={figmaAssets.imgFaFaPlay} alt="" aria-hidden="true"/></button><span>이어서 녹음</span></div></>}
            </div>}
      {confirmAction && <RecordingConfirmation onCancel={()=>{if(!discardingRef.current)setConfirmAction(null)}}><p className="kicker">CURRENT TAKE</p><h2 id="record-confirm-title">{confirmAction==='retry'?'지금 녹음을 지우고 다시 부를까요?':'녹음을 끝내고 보관할까요?'}</h2><p>{confirmAction==='retry'?'다른 참여자의 Track과 Record Layer는 그대로 유지됩니다.':'작업실에서 ‘녹음 이어서 확인하기’로 돌아올 수 있어요.'}</p><div className="review-actions"><button className="primary" disabled={recordingBusy} onClick={()=>setConfirmAction(null)}>{confirmAction==='retry'?'지금 녹음 유지':'계속 녹음'}</button><button className="secondary" disabled={recordingBusy} data-action={`confirm-${confirmAction}`} onClick={confirmAction==='retry'?retry:confirmLeave}>{confirmAction==='retry'?'지우고 다시 녹음':'녹음 끝내고 나가기'}</button></div></RecordingConfirmation>}
    </main>
  </div>
}

function Player({ source, playing, setPlaying, duration: durationProp = 18, durationHint, figma = false, caption }) {
  const [time, setTime] = useState(0)
  const [mediaDuration, setMediaDuration] = useState(durationHint || durationProp)
  const audioRef = useRef(null)
  const duration = Number.isFinite(mediaDuration) && mediaDuration > 0 ? mediaDuration : durationProp
  useEffect(() => {
    setTime(0)
    setMediaDuration(durationHint || durationProp)
  }, [source,durationHint,durationProp])
  useEffect(() => {
    const audio = audioRef.current
    let active = true
    if (source && audio) {
      if (playing) audio.play().catch(() => { if (active) setPlaying(false) })
      else audio.pause()
      return () => { active = false;audio.pause() }
    }
    if(playing)setPlaying(false)
  }, [playing,duration,source,setPlaying])
  const seek = value => {
    setTime(value)
    if (audioRef.current) audioRef.current.currentTime = value
  }
  return <div className={`audio-player${figma?' figma-player':''}`}><div className="time-row">{figma?caption?<span className="player-summary"><span className="player-caption">{caption}</span><span className="player-clock">{fmt(time)} / {fmt(duration)}</span></span>:<span className="player-clock">{fmt(time)} / {fmt(duration)}</span>:<span>{fmt(time)}</span>}<input aria-label="재생 위치" type="range" min="0" max={duration} step=".1" disabled={!source} value={Math.min(time,duration)} onChange={e=>seek(Number(e.target.value))}/>{!figma&&<span>{fmt(duration)}</span>}</div><button className="play-btn" disabled={!source} aria-label={playing?'일시정지':'재생'} onClick={()=>setPlaying(!playing)}>{figma&&!playing?<img src={figmaAssets.imgFaFaPlay} alt="" aria-hidden="true"/>:<Icon name={playing?'pause':'play'} size={figma?20:26}/>}</button>{source && <audio ref={audioRef} src={source} onLoadedMetadata={e=>Number.isFinite(e.currentTarget.duration)&&setMediaDuration(e.currentTarget.duration)} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onEnded={()=>setPlaying(false)} />}</div>
}

function CurrentMixPanel({ parts, projectTracks, project, mix, mixStatus, retryAutoMix, openVocalProfile, onPlayingChange, partAction, completionDelayed, waveform = true, title = 'Parts · Tracks', emptyMessage }) {
  const [included,setIncluded]=useState({backing:true,parts:parts.map(()=>true)})
  const [playing,setPlaying]=useState(false)
  const [selectedTrackId,setSelectedTrackId]=useState(null)
  const stopRef=useRef(null)
  const trackArray=Object.values(projectTracks).filter(track=>track.kind!=='temporary-recording')
  const selectedTrack=selectedTrackId?projectTracks[selectedTrackId]:null
  const rows=parts.map(part=>projectTracks[part.id]?{...part,...projectTracks[part.id],id:part.id,status:'submitted',duration:fmt(projectTracks[part.id].duration)}:part)
  useEffect(()=>onPlayingChange?.(playing),[playing,onPlayingChange])
  const [preview,setPreview]=useState(null)
  const [previewError,setPreviewError]=useState('')
  const selectedTracks=parts.flatMap((part,index)=>included.parts[index]&&projectTracks[part.id]?[projectTracks[part.id]]:[])
  useEffect(()=>{
    let active=true
    let generatedUrl
    setPlaying(false);setPreview(null);setPreviewError('')
    if(selectedTracks.length>0){
      loadProjectBacking(project).then(backingBlob=>{
        if(!active)return null
        assertProjectTrackAudio(project,selectedTracks)
        // A one-Track combination still needs its encoded recording lead-in
        // trimmed. The original URL remains available for individual listening.
        return createPreviewMix({tracks:selectedTracks,backing:Boolean(backingBlob),backingBlob,duration:Math.max(project?.audioSource?.duration||0,project?.recordingDuration||0)})
      }).then(value=>{
        if(!value)return
        generatedUrl=value.url
        if(active)setPreview(value);else URL.revokeObjectURL(value.url)
      }).catch(error=>{if(active)setPreviewError(error.message);console.error('Current Mix preview unavailable',error)})
    }
    return()=>{active=false;if(generatedUrl)URL.revokeObjectURL(generatedUrl)}
  },[project?.id,project?.key,project?.audioSource,included.parts.join(','),trackArray.map(track=>track.id+':'+track.createdAt).join(',')])
  useEffect(()=>()=>{stopRef.current?.();stopGuides()},[])
  const chooseTrack=id=>{setPlaying(false);setSelectedTrackId(id);window.setTimeout(()=>setPlaying(true),0)}
  return <section id="current-mix" className="current-mix" aria-label="현재 Mix와 Track">
    {!trackArray.length&&emptyMessage&&<p className="empty-proof">{emptyMessage}</p>}
    {trackArray.length>0&&!selectedTracks.length&&!selectedTrack&&<p className="empty-proof">들을 트랙을 하나 이상 선택해 주세요.</p>}
    {trackArray.length>0&&<><div className="current-mix-head"><p className="kicker"><strong>현재 Mix</strong><span>{selectedTracks.length}개 선택</span></p>{mixStatus==='processing'&&<h2 role="status">곡을 완성하고 있어요.</h2>}<p>{mixStatus==='processing'?'Track 정렬과 밸런스를 적용하는 중이에요. 이 화면을 나가도 계속됩니다.':'제출된 Track을 하나씩 또는 함께 들을 수 있어요.'}</p></div>{selectedTrack&&<div className="listening-context"><span>개별 Track</span><b>{selectedTrack.participant} · {parts.find(part=>part.id===selectedTrack.partId)?.name}</b><button onClick={()=>{setPlaying(false);setSelectedTrackId(null)}}>현재 Mix로</button></div>}<Player figma caption={selectedTrack?'개별 Track 듣기':'선택 트랙 함께 듣기'} source={selectedTrack?.url||preview?.url} durationHint={selectedTrack?.duration||preview?.duration} playing={playing} setPlaying={setPlaying}/></>}
    <div className="track-list part-list"><div className="section-head"><h2>{title}</h2><span>상태 · 재생 · Mix</span></div>{false&&<div className="backing-row"><span>Backing Track</span><button className={`include-toggle ${included.backing?'on':''}`} aria-pressed={included.backing} onClick={()=>setIncluded(value=>({...value,backing:!value.backing}))}><span/></button></div>}{rows.map((part,index)=>{const partCta=partAction?.(part)||{};return <PartRow waveform={waveform} order={index} key={part.id} part={part} action={partCta.action} actionLabel={partCta.label} urgent={completionDelayed&&part.participantId===CURRENT_USER_ID&&part.status==='ready'} included={projectTracks[part.id]?included.parts[index]:undefined} onPlay={projectTracks[part.id]?()=>chooseTrack(part.id):undefined} onParticipant={part.participantId&&part.participantId!==CURRENT_USER_ID?()=>openVocalProfile(part.participantId):undefined} onToggle={projectTracks[part.id]?()=>setIncluded(value=>{const next=[...value.parts];next[index]=!next[index];return {...value,parts:next}}):undefined}/>})}</div>
    {previewError&&<p className="mix-error" role="alert">{previewError}</p>}
    {mixStatus==='error'&&<p className="mix-error" role="alert">Auto Mix를 완료하지 못했어요. 제출된 원본 Track은 그대로 보관되어 있어요.</p>}
    {mixStatus==='error'&&retryAutoMix&&<button className="secondary" data-action="retry-auto-mix" onClick={retryAutoMix}>Auto Mix 다시 시도</button>}
  </section>
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
      <div className="multitrack-hero"><ResonanceRecord recordRef={project.voiceRecordRef} parts={project.parts} tracks={projectTracks} projectId={project.id} layers={layers} seed={project.seed} state={mixStatus==='processing'?'processing':playing?'playing':'rest'} compact/><div><p className="kicker">Current mix</p><h1>{mixStatus==='processing'?'Auto Mix 중…':mixStatus==='complete'?'모든 목소리가 연결됐어요.':'지금까지의 목소리'}</h1><p>{mixStatus==='processing'?`정렬 · 밸런스 · EQ · Compressor · Limiter ${progress}%`:'포함된 실제 Track을 함께 들을 수 있어요.'}</p><small>실제 오디오 특징 기반 Layer · 생성형 AI 미적용</small></div></div>
      {selectedTrack && <div className="listening-context"><span>개별 Track</span><b>{selectedTrack.participant} · {parts.find(part=>part.id===selectedTrack.partId)?.name}</b><button onClick={()=>{setPlaying(false);setSelectedTrackId(null)}}>현재 믹스로</button></div>}
      <Player source={selectedTrack?.url || mix?.url} durationHint={selectedTrack?.duration} playing={playing} setPlaying={setPlaying}/>
      <section className="track-list"><div className="section-head"><h2>Tracks</h2><span>Tap name to listen · Toggle include</span></div><div className="backing-row"><span>Backing track</span><button className={`include-toggle ${included.backing?'on':''}`} onClick={()=>setIncluded({...included,backing:!included.backing})}><span/></button></div>{tracks.map((part,index)=><PartRow key={part.id} part={part} included={part.status==='submitted'&&included.parts[index]} onPlay={part.status==='submitted'?()=>{setPlaying(false);setSelectedTrackId(part.id);window.setTimeout(()=>setPlaying(true),0)}:undefined} onParticipant={part.participantId&&part.participantId!==CURRENT_USER_ID?()=>openVocalProfile(part.participantId):undefined} onToggle={part.status==='submitted'?()=>{const parts=[...included.parts];parts[index]=!parts[index];setIncluded({...included,parts})}:undefined}/>)}</section>
      <p className="demo-disclosure">각 Track은 독립 오디오로 유지됩니다. 초대 수락만으로 Track이 추가되거나 진행률이 오르지 않습니다.</p>
      {mixStatus==='complete' && <button className="primary sticky-cta" data-action="open-complete" data-mix-bytes={mix?.bytes || 0} data-mix-origin={mix?.origin || ''} onClick={()=>complete(mix)}>완성곡 듣기</button>}
      {!readyForMix && <><p className="waiting-note">다른 참여자의 Part는 대신 녹음할 수 없습니다. 초대 수락이 아니라 마지막 필수 Track이 실제 도착할 때 Auto Mix가 자동 시작됩니다.</p>{nextPart?.id===ownerPartId?<button className="primary sticky-cta" data-action="record-own-track" onClick={recordOwnPart}>내 Track 녹음</button>:<button className="secondary sticky-cta" data-action="back-to-workspace" onClick={()=>go('workspace')}>작업실에서 다음 Part 모집하기</button>}</>}
    </main>
  </div>
}

function Complete({ go, mix, layers, projectTracks, project = PROJECT, song, projectLiked, toggleProjectLike, openVocalProfile }) {
  const [playing,setPlaying] = useState(false)
  const [hasPlayed,setHasPlayed] = useState(false)
  const [shareState,setShareState] = useState('idle')
  const completedAt = mix?.createdAt ? new Date(mix.createdAt) : null
  const validCompletionDate = completedAt && Number.isFinite(completedAt.getTime())
  const completionDate = validCompletionDate ? `${completedAt.getFullYear()}.${String(completedAt.getMonth()+1).padStart(2,'0')}.${String(completedAt.getDate()).padStart(2,'0')}` : '—'
  useEffect(()=>{if(playing)setHasPlayed(true)},[playing])
  const share = async () => {
    if(!project.resultUrl){setShareState('unavailable');return}
    const data = { title:`${song?.title || '완성곡'} · IEUM`, text:`${project.parts.length}개의 목소리가 하나의 곡으로 연결됐어요.`, url:project.resultUrl }
    try {
      if (navigator.share) await navigator.share(data)
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(project.resultUrl)
      else throw new Error('share-unavailable')
      setShareState('done')
    } catch (error) { if(error?.name!=='AbortError')setShareState('error') }
  }
  return <div className="screen complete-screen">
    <TopBar figmaHeader title="완성곡" back={() => go('workspace')} meta={`${String(project.parts.length).padStart(2,'0')}/${String(project.parts.length).padStart(2,'0')} · COMPLETE`} />
    <main>
      <div className="complete-title"><h1>{song?.title || '함께 완성한 곡'}</h1><p>{project.name}</p><span className="complete-badge">완성</span></div>
      <div className="complete-record"><ResonanceRecord recordRef={project.voiceRecordRef} parts={project.parts} tracks={projectTracks} projectId={project.id} layers={layers} state={playing?'playing':'complete'} seed={project.seed}/><div className="record-center-credits" style={{backgroundImage:`url("${figmaAssets.imgArtworkCenterLabelCleanCrop}")`}} aria-label="함께한 목소리"><span>CREDITS</span><div>{project.parts.map(part=>{const track=projectTracks[part.id];const personId=track?.participantId;return <button key={part.id} disabled={!personId||personId===CURRENT_USER_ID} onClick={()=>openVocalProfile(personId)}><small style={{color:part.color}}>{part.name}</small><strong>{track?.participant || '—'}</strong></button>})}</div><small>{project.key || 'C major'}</small><time dateTime={validCompletionDate?completedAt.toISOString():undefined}>{completionDate}</time></div></div>
      <Player figma source={mix?.url} durationHint={mix?.duration} playing={playing} setPlaying={setPlaying}/>
      <p className="final-player-label">{hasPlayed?'다시 재생':'완성곡 재생'}</p>

      <p className="demo-disclosure">Credits의 LOCAL DEMO 표시는 흐름 검증용 합성 Stem이며 실제 참여자의 사람 녹음이 아님을 뜻합니다.</p>
      <p className="ai-boundary">현재 Record는 제출 Track 특징 기반 시각화이며, 생성형 AI 서비스는 아직 연결되지 않았어요.</p>
      <div className="complete-actions"><button className="secondary" aria-pressed={projectLiked} data-action="toggle-project-like" onClick={toggleProjectLike}><img src={figmaAssets.imgFaFaHeart} alt="" aria-hidden="true"/>{projectLiked?'마음에 들어요 · 저장됨':'마음에 들어요'}</button><button className="secondary" data-action="share" onClick={share}><img src={figmaAssets.imgFaFaLink} alt="" aria-hidden="true"/>링크 공유</button><button className="primary" onClick={()=>go('projects')}>내 프로젝트</button></div>
      {shareState==='unavailable'&&<p className="share-result" role="status">이 완성곡은 현재 기기에 저장되어 있어요. 서버 연결 후 결과 링크를 공유할 수 있습니다.</p>}{shareState==='done'&&<p className="share-result" role="status">공유 또는 링크 복사를 완료했어요.</p>}{shareState==='error'&&<p className="share-result error" role="alert">이 브라우저에서는 공유를 열 수 없어요.</p>}
    </main>
  </div>
}

function ProfileSamplePlayer({ source, duration }) {
  const [playing,setPlaying] = useState(false)
  return <Player source={source} durationHint={duration} playing={playing} setPlaying={setPlaying}/>
}

function CollectionArea({ mainProject = PROJECT, collectionContext, go, openMainWorkspace, openSong, createdProjects = [], createdProjectTracks = {}, createdMixes = {}, openCreatedProject, toggleProjectById, projectLikes, vocalSaves, songSaves, toggleProjectLike, toggleVocalSave, toggleSongSave, openVocalProfile, layers, trackCount, mix, joined, readyForMix = false }) {
  const [tab,setTab] = useState(()=>readNavigationHint('ieum:collection-tab','projects',['projects','vocals','songs']))
  useEffect(()=>{
    writeNavigationHint('ieum:collection-tab',tab)
    if(!collectionContext)return
    collectionContext.current.tab=tab
    const frame=requestAnimationFrame(()=>{
      const surface=document.querySelector('.screen')
      const position=collectionContext.current.scrollByTab[tab] || 0
      if(surface)surface.scrollTop=position
      window.scrollTo(0,position)
    })
    return ()=>cancelAnimationFrame(frame)
  },[tab,collectionContext])
  const selectTab=value=>{
    if(value===tab)return
    if(collectionContext)collectionContext.current.scrollByTab[tab]=document.querySelector('.screen')?.scrollTop || window.scrollY
    setTab(value)
  }
  const projectLiked = projectLikes.some(item=>item.projectId===PROJECT_ID)
  const savedProjects=createdProjects.filter(project=>projectLikes.some(item=>item.projectId===project.id))
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
      {[['projects','프로젝트'],['vocals','보컬'],['songs','곡']].map(([value,label])=><button key={value} role="tab" aria-selected={tab===value} className={tab===value?'active':''} data-action={`collection-tab-${value}`} onClick={()=>selectTab(value)}>{label}<small>{counts[value]}</small></button>)}
    </div>
    {tab==='projects' && projectLiked && <article className="collection-card" data-project-id={PROJECT_ID}><button className="collection-cover" aria-label="A Thousand Years 프로젝트 열기" onClick={()=>mix||joined?openMainWorkspace(mix?'complete':'workspace'):openSong(SONG_ID)}><ResonanceRecord recordRef={mainProject.voiceRecordRef} projectId={mainProject.id} parts={mainProject.parts} seed={mainProject.seed} layers={layers} compact/></button><div className="collection-copy"><div className="collection-card-head"><span>{mix?'COMPLETE':readyForMix?'MIXING':joined?'RECORDING':'RECRUITING'} · {String(trackCount).padStart(2,'0')}/04</span><button className="collection-remove active" aria-label="프로젝트 Like 취소" onClick={toggleProjectLike}><Icon name="heart" size={17}/></button></div><h2>A Thousand Years</h2><p>{mix?'완성곡과 Credits 보기':joined?'참여 중인 프로젝트':'관심 프로젝트'}</p><button className="primary" data-action="open-project-like" onClick={()=>mix||joined?openMainWorkspace(mix?'complete':'workspace'):openSong(SONG_ID)}>프로젝트 열기</button></div></article>}
    {tab==='projects'&&savedProjects.map(project=><article className="collection-card" key={project.id}><button className="collection-cover" onClick={()=>openCreatedProject(project.id)} aria-label={project.title+' 프로젝트 열기'}><ResonanceRecord recordRef={project.voiceRecordRef} projectId={project.id} parts={project.parts} layers={project.parts.map(part=>submittedProjectTracks(project,createdProjectTracks[project.id] || {}).find(track=>track.partId===part.id)?.layer || null)} seed={project.seed} compact/></button><div className="collection-copy"><div className="collection-card-head"><span>{localProjectLifecycle(project,createdProjectTracks[project.id] || {},createdMixes[project.id])} · {submittedProjectTracks(project,createdProjectTracks[project.id] || {}).length}/{project.partCount}</span><button className="collection-remove active" aria-label={project.title+' Like 취소'} onClick={()=>toggleProjectById(project.id)}><Icon name="heart" size={17}/></button></div><h2>{project.title}</h2><p>{project.name}</p><button className="primary" onClick={()=>openCreatedProject(project.id)}>프로젝트 열기</button></div></article>)}
    {tab==='vocals' && savedVocals.map(vocal=><article className="vocal-collection-row" key={vocal.id}><button className="vocal-collection-open" onClick={()=>openVocalProfile(vocal.id)}><VoiceIdentity identity={vocal.identity}/><span><strong>{vocal.name}</strong><small>{vocal.range} · {vocal.role}</small><em>{(vocal.genres||[]).join(' · ')}</em></span></button><button className="collection-remove active" aria-label={`${vocal.name} 보컬 저장 취소`} onClick={()=>toggleVocalSave(vocal.id)}><Icon name="star" size={17}/></button></article>)}
    {tab==='songs' && savedSongs.map((song,index)=><article className="song-collection-row" key={song.id}><button data-action="open-song-save" onClick={()=>openSong(song.id)}><span className="song-index">{String(index+1).padStart(2,'0')}</span><span><strong>{song.title}</strong><small>{song.artist} · 프로젝트 {song.projects.length+createdProjects.filter(project=>project.songId===song.id).length}개</small></span></button><button className="collection-remove active" aria-label={`${song.title} 곡 저장 취소`} onClick={()=>toggleSongSave(song.id)}><Icon name="bookmark" size={17}/></button></article>)}
    {((tab==='projects'&&!projectLiked&&!savedProjects.length)||(tab==='vocals'&&!savedVocals.length)||(tab==='songs'&&!savedSongs.length)) && <section className="empty-state collection-empty"><strong>{emptyCopy[tab][0]}</strong><p>{emptyCopy[tab][1]}</p><button className="primary" data-action="browse-collection" onClick={()=>go(tab==='vocals'?'finder':tab==='songs'?'song-browser':'detail')}>{tab==='vocals'?'Vocal Finder 열기':tab==='songs'?'곡 둘러보기':'OPEN Part 둘러보기'}</button></section>}
  </>
}

function ProfilePreferences({profile,save,songSaves}) {
  const [editing,setEditing]=useState(false)
  const [values,setValues]=useState(()=>preferenceValues(profile))
  const [error,setError]=useState('')
  const [saving,setSaving]=useState(false)
  const savingRef=useRef(false)
  if(!editing)return <button className="secondary" onClick={()=>{setValues(preferenceValues(profile));setError('');setEditing(true)}}>선호 역할 · 장르 · 취향 수정</button>
  const submit=async()=>{
    if(savingRef.current)return
    savingRef.current=true;setSaving(true);setError('')
    try{await save(values);setEditing(false)}catch{setError('저장하지 못했어요. 선택값과 기존 프로필은 유지됩니다.')}
    finally{savingRef.current=false;setSaving(false)}
  }
  return <section className="profile-preferences"><VoicePreferenceChoices values={values} change={setValues} songs={SONGS} songSaves={songSaves} disabled={saving}/><div className="review-actions"><button className="secondary" disabled={saving} onClick={()=>setEditing(false)}>취소</button><button className="primary" disabled={saving} onClick={submit}>{saving?"저장 중…":"변경 저장"}</button></div>{error&&<p role="alert">{error}</p>}</section>
}

function PersonalArea({ mainProject = PROJECT, collectionContext, type, go, editVoice, updatePreferences, createdProjectTracks, createdMixes, toggleProjectById, openMainWorkspace, openSong, openCreatedProject, joined, createdProjects, projectLikes, vocalSaves, songSaves, toggleProjectLike, toggleVocalSave, toggleSongSave, openVocalProfile, profile, layers, trackCount, mix, readyForMix, resetDemo, delayedProjectIds = [] }) {
  const titles = {projects:'My projects',collection:'Collection',my:'My voice'}
  const [projectFilter,setProjectFilter] = useState(()=>readNavigationHint('ieum:project-filter','all',['all','recruiting','recording','mixing','complete']))
  useEffect(()=>writeNavigationHint('ieum:project-filter',projectFilter),[projectFilter])
  const hasProject = joined || createdProjects.length > 0
  const lifecycle = mix ? 'complete' : readyForMix ? 'mixing' : 'recording'
  const projectVisible = projectFilter==='all' || projectFilter===lifecycle
  const createdLifecycle=project=>localProjectLifecycle(project,createdProjectTracks[project.id] || {},createdMixes[project.id]).toLowerCase()
  const filteredCreatedProjects=createdProjects.filter(project=>projectFilter==='all'||projectFilter===createdLifecycle(project))
  const projectFilterEmpty=hasProject&&!(joined&&projectVisible)&&filteredCreatedProjects.length===0
  const projectLiked = projectLikes.some(item=>item.projectId===PROJECT_ID)
  return <div className="screen simple-screen"><TopBar meta="IEUM"/><main><p className="kicker">Personal area</p><h1>{titles[type]}</h1>
    {type==='projects' && <><div className="object-tabs project-tabs" aria-label="프로젝트 상태 필터">{[['all','전체'],['recruiting','모집'],['recording','녹음'],['mixing','믹싱'],['complete','완성']].map(([value,label])=><button key={value} className={projectFilter===value?'active':''} aria-pressed={projectFilter===value} onClick={()=>setProjectFilter(value)}>{label}</button>)}</div>{joined && projectVisible && <section className="saved-card"><ResonanceRecord recordRef={mainProject.voiceRecordRef} projectId={mainProject.id} parts={mainProject.parts} seed={mainProject.seed} layers={layers} compact/><div>{delayedProjectIds.includes(PROJECT_ID)&&<span className="completion-delay-badge">녹음 필요 · 7일</span>}<div className="saved-card-title"><strong>A Thousand Years</strong><button className={projectLiked?'active':''} aria-label={projectLiked?'프로젝트 Like 취소':'프로젝트 Like'} onClick={toggleProjectLike}><Icon name="heart" size={18}/></button></div><p>{trackCount}/4 Tracks · {lifecycle.toUpperCase()}</p><button className="secondary" data-action="resume-project" onClick={()=>openMainWorkspace(mix?'complete':readyForMix?'multitrack':'workspace')}>{mix?'완성곡 열기':readyForMix?'믹싱 확인':'작업실 계속하기'}</button></div></section>}{filteredCreatedProjects.map(project=><section className="saved-card created-project-card" key={project.id}><div className="empty-record-mark"><span>{String(submittedProjectTracks(project,createdProjectTracks[project.id] || {}).length).padStart(2,'0')}</span><small>/{String(project.partCount).padStart(2,'0')}</small></div><div>{delayedProjectIds.includes(project.id)&&<span className="completion-delay-badge">녹음 필요 · 7일</span>}<div className="saved-card-title"><strong>{project.title}</strong></div><p>{project.name} · {createdLifecycle(project).toUpperCase()}</p><button className="secondary" data-action="open-created-project" onClick={()=>openCreatedProject(project.id)}>{createdLifecycle(project)==='complete'?'완성곡 열기':'작업실 열기'}</button></div></section>)}{!hasProject && <section className="empty-state"><p>참여하거나 만든 프로젝트가 아직 없어요.</p><button className="primary" data-action="browse-open-projects" onClick={()=>go('home')}>OPEN Part 찾기</button><button className="secondary" onClick={()=>go('create-project')}>새 프로젝트 만들기</button></section>}</>}
    {type==='projects'&&projectFilterEmpty&&<section className="empty-state"><p>이 상태의 프로젝트가 없어요.</p><button className="secondary" data-action="reset-project-filter" onClick={()=>setProjectFilter('all')}>필터 초기화</button></section>}
    {type==='collection' && <CollectionArea mainProject={mainProject} collectionContext={collectionContext} go={go} openMainWorkspace={openMainWorkspace} openSong={openSong} createdProjects={createdProjects} createdProjectTracks={createdProjectTracks} createdMixes={createdMixes} openCreatedProject={openCreatedProject} toggleProjectById={toggleProjectById} projectLikes={projectLikes} vocalSaves={vocalSaves} songSaves={songSaves} toggleProjectLike={toggleProjectLike} toggleVocalSave={toggleVocalSave} toggleSongSave={toggleSongSave} openVocalProfile={openVocalProfile} layers={layers} trackCount={trackCount} mix={mix} joined={joined} readyForMix={readyForMix}/>}
    {type==='my' && <>{profile ? <><section className="profile-card"><VoiceIdentity identity={profile.identity}/><div><p className="kicker">Voice profile</p><h2>{profile.name} · {profile.range}</h2><p>{profile.voiceType || "음색 분석 대기"}<br/>Voice Identity 생성형 AI는 미검증</p>{profile.sampleUrl && <ProfileSamplePlayer source={profile.sampleUrl} duration={profile.sampleDuration}/>}</div></section><ProfilePreferences profile={profile} save={updatePreferences} songSaves={songSaves}/><section className="my-voice-details"><div><span>Voice Range</span><b>{profile.range}</b><button onClick={()=>editVoice("range")}>다시 측정</button></div><div><span>Voice Sample</span><b>{profile.sampleSong}</b><button onClick={()=>editVoice("sample")}>다시 등록</button></div><div><span>선호 역할</span><b>{profile.roles?.join(' · ') || '아직 선택하지 않았어요.'}</b></div><div><span>장르</span><b>{profile.genres?.join(' · ') || '아직 선택하지 않았어요.'}</b></div><div><span>음악 취향</span><b>{SONGS.filter(song=>profile.preferredSongIds?.includes(song.id)).map(song=>song.title).join(' · ') || profile.taste?.join(' · ') || '아직 선택하지 않았어요.'}</b></div><div><span>Voice Identity</span><b>무료·로컬 생성 모델 미연결</b><button disabled>대기</button></div></section></> : <section className="empty-state"><p>등록된 Voice Profile이 없어요.</p><button className="primary" onClick={()=>go('voice')}>내 목소리 알아보기</button></section>}<section className="demo-reset"><div><strong>처음부터 다시 검증하기</strong><p>내 Voice Profile, 참여·초대 상태와 녹음을 초기화합니다. 출처가 표시된 Soprano·Alto 시연 Track 2개만 다시 준비되어 2/4에서 시작합니다.</p></div><button className="secondary" data-action="reset-demo" onClick={resetDemo}>시연 상태 초기화</button></section></>}
  </main></div>
}

export default function App() {
  const persisted = useRef(loadUserState()).current
  const [screen,setScreen] = useState(() => new URLSearchParams(location.search).get('design')==='figma' ? 'workspace' : 'home')
  const [history,setHistory] = useState([])
  const [voiceEditMode,setVoiceEditMode]=useState(null)
  const [voiceReturnScreen,setVoiceReturnScreen]=useState('detail')
  const [profile,setProfile] = useState(null)
  useEffect(() => {
    const url=profile?.sampleUrl
    return () => { if(url)URL.revokeObjectURL(url) }
  },[profile?.sampleUrl])
  const [joined,setJoined] = useState(Boolean(persisted.joined))
  const [invited,setInvited] = useState(Boolean(persisted.invited))
  const [invitedVocalId,setInvitedVocalId] = useState(persisted.invitedVocalId || 'luna')
  const [candidateAccepted,setCandidateAccepted] = useState(Boolean(persisted.candidateAccepted))
  const [candidateArrivalStatus,setCandidateArrivalStatus] = useState('idle')
  const [projectLikes,setProjectLikes] = useState(persisted.projectLikes)
  const [vocalSaves,setVocalSaves] = useState(persisted.vocalSaves)
  const [songSaves,setSongSaves] = useState(persisted.songSaves)
  const [createdProjects,setCreatedProjects] = useState(()=>persisted.createdProjects.map(project=>{
    if (project.ownerPartId) return {...project,parts:project.parts?.map(part=>
      part.status==='invited'&&!part.participantId&&!part.participant&&(part.invitations || []).some(item=>item.status==='sent')
        ? {...part,status:'open'} : part)}
    const parts = project.parts || PART_CATALOG.slice(0,project.partCount).map(part=>({...part,participantId:null,participant:null,status:'open',duration:null}))
    const owner = parts.find(part=>part.id===USER_PART_ID) || parts[0]
    return {...project,ownerPartId:owner.id,parts:parts.map(part=>part.id===owner.id?{...part,participantId:CURRENT_USER_ID,participant:'JISUN',status:'ready'}:part)}
  }))
  const [createdProjectTracks,setCreatedProjectTracks] = useState({})
  const [createdMixes,setCreatedMixes] = useState({})
  const [createdMixStates,setCreatedMixStates] = useState({})
  const createdMixJobs = useRef(new Set())
  const mixRetryPending = useRef(new Set())
  const [createdMixRetryAttempt,setCreatedMixRetryAttempt] = useState(0)
  const screenRef = useRef(screen)
  const activeProjectRef = useRef(persisted.activeCreatedProjectId || PROJECT_ID)
  const [projectTracks,setProjectTracks] = useState({})
  const [tracksReady,setTracksReady] = useState(false)
  const [tracksLoadError,setTracksLoadError] = useState(persisted.storageReadFailed ? '저장한 사용자 상태를 읽지 못했어요. 원본을 유지하고 다시 시도해 주세요.' : '')
  const [tracksLoadAttempt,setTracksLoadAttempt] = useState(0)
  const [stateSaveError,setStateSaveError] = useState(false)
  const [stateSaveAttempt,setStateSaveAttempt] = useState(0)
  const [mainKeyLocked,setMainKeyLocked]=useState(Boolean(persisted.mainKeyLocked))
  const [joinedPart,setJoinedPart]=useState(persisted.joinedPart || USER_PART_ID)
  const [recordingPart,setRecordingPart] = useState(USER_PART_ID)
  const [selectedVocalId,setSelectedVocalId] = useState('luna')
  const [selectedMatchVocalId,setSelectedMatchVocalId] = useState(null)
  const [selectedSongId,setSelectedSongId] = useState(SONG_ID)
  const [selectedProjectId,setSelectedProjectId] = useState(null)
  const [activeCreatedProjectId,setActiveCreatedProjectId] = useState(persisted.activeCreatedProjectId || null)
  const [finderPartId,setFinderPartId] = useState('bass')
  const [finderPreferences,setFinderPreferences] = useState({})
  const collectionContext=useRef({tab:'projects',scrollByTab:{}})
  const detailContext=useRef({})
  const [createProjectSongId,setCreateProjectSongId] = useState(null)
  const createProjectDrafts=useRef({})
  const [createDraftKey,setCreateDraftKey]=useState('initial')
  const rememberCreateProjectDraft=useMemo(()=>value=>{
    createProjectDrafts.current[createDraftKey]={...createProjectDrafts.current[createDraftKey],...value}
  },[createDraftKey])
  const [mix,setMix] = useState(null)
  const [mixStatus,setMixStatus] = useState('idle')
  const [mixProgress,setMixProgress] = useState(0)
  const [mixRetryAttempt,setMixRetryAttempt] = useState(0)
  const [draftKeys,setDraftKeys] = useState({})
  const previousMixStatus=useRef('idle')
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
  const mainProject = {...PROJECT,...SONGS[0].projects.find(project=>project.id===PROJECT_ID)}
  const activeProject = activeCreatedProject || mainProject
  const activeSong = SONGS.find(song=>song.id===(activeCreatedProject?.songId || SONG_ID)) || SONGS[0]
  const activeParts = activeProject.parts || PARTS
  const activeTracks = activeCreatedProject ? (createdProjectTracks[activeCreatedProject.id] || {}) : projectTracks
  const activeLayers = activeParts.map(part=>activeTracks[part.id]?.layer || null)
  screenRef.current=screen
  activeProjectRef.current=activeProject.id
  const activeMix=activeCreatedProject?createdMixes[activeProject.id]:mix
  const activeMixStatus=activeCreatedProject?(createdMixStates[activeProject.id] || 'idle'):mixStatus
  const activeProjectLiked = projectLikes.some(entry=>entry.projectId===activeProject.id)
  const activeFinderPart = activeParts.find(part=>part.id===finderPartId) || activeParts.find(part=>!part.participantId) || activeParts[0]
  const canSendInvite=Boolean(activeCreatedProject?activeParts.some(part=>part.participantId===CURRENT_USER_ID):joined) &&
    Boolean(activeFinderPart) && !activeFinderPart.participantId && !activeTracks[activeFinderPart.id] &&
    ['open','recruiting','invited'].includes(activeFinderPart.status) &&
    Boolean(activeCreatedProject || (activeFinderPart.id!==joinedPart && !candidateAccepted))
  const finderContextKey=JSON.stringify([activeProject.id,activeFinderPart?.id])
  const touchProjectActivity = projectId => {
    setProjectActivity(current=>({...current,[projectId]:new Date().toISOString()}))
    setDelayNotified(current=>{const next={...current};delete next[projectId];return next})
  }
  const delayedProjectIds = [
    ...(joined && !projectTracks[joinedPart] && activityClock-Date.parse(projectActivity[PROJECT_ID]||new Date().toISOString())>=COMPLETION_DELAY_MS ? [PROJECT_ID] : []),
    ...createdProjects.filter(project=>{
      const ownerPartId=project.ownerPartId
      const tracks=createdProjectTracks[project.id]||{}
      return ownerPartId&&!tracks[ownerPartId]&&activityClock-Date.parse(projectActivity[project.id]||project.createdAt||new Date().toISOString())>=COMPLETION_DELAY_MS
    }).map(project=>project.id)
  ]
  const go = target => {
    const map = { home:'home', folder:'projects', bookmark:'collection', user:'my' }
    const next = map[target] || target
    if(next==='voice'){setVoiceReturnScreen(screen);if(screen!=='my')setVoiceEditMode(null)}
    setHistory(h => [...h,screen])
    const scrollTop=document.querySelector('.screen')?.scrollTop || window.scrollY
    if(screen==='collection')collectionContext.current.scrollByTab[collectionContext.current.tab]=scrollTop
    window.history.replaceState({ieumScreen:screen,selectedSongId,selectedProjectId,activeCreatedProjectId,finderPartId,selectedVocalId,selectedMatchVocalId,voiceEditMode,voiceReturnScreen,createProjectSongId,createDraftKey,scrollTop},'',`#${screen}`)
    window.history.pushState({ieumScreen:next},'',`#${next}`)
    setScreen(next); scrollToTop()
  }
  const back = fallback => {
    if (history.length) {
      setHistory(current=>current.slice(0,-1))
      window.history.back()
    } else {
      window.history.replaceState({ieumScreen:fallback},'',`#${fallback}`)
      setScreen(fallback)
    }
    scrollToTop()
  }
  const openSong = (songId,projectId = null) => { setSelectedSongId(songId); setSelectedProjectId(projectId); go('detail') }
  const openMainWorkspace = (target='workspace') => { setActiveCreatedProjectId(null); go(target==='multitrack'?'workspace':target) }
  const openCreatedProject = projectId => { const project=createdProjects.find(item=>item.id===projectId);setActiveCreatedProjectId(projectId);go(project && allProjectTracksSubmitted(project,createdProjectTracks[projectId] || {}) && createdMixes[projectId]?'complete':'workspace') }
  const startCreateProject = (songId = null) => { setCreateDraftKey(crypto.randomUUID());setCreateProjectSongId(songId); go('create-project') }
  const createProject = project => {
    createProjectDrafts.current[createDraftKey]={...createProjectDrafts.current[createDraftKey],createdProjectId:project.id}
    setCreatedProjects(current=>[project,...current])
    touchProjectActivity(project.id)
    setActiveCreatedProjectId(project.id)
    setCreatedProjectTracks(current=>({...current,[project.id]:{}}))
    setScreen('workspace')
    setHistory([])
    scrollToTop()
  }
  const completeProfile = async value => {
    if(value.phase==='return-only'){back(voiceReturnScreen);stopMicrophone();return}
    if(value.phase==='preferences-save'){
      await saveTrack({id:PROFILE_PROJECT_ID+':preferences',projectId:PROFILE_PROJECT_ID,kind:'voice-preferences',preferences:value.preferences})
      setProfile(current=>({...current,...value.preferences}));return true
    }
    if(value.editMode==='range'&&profile&&value.rangeData){const record=await prepareVoiceRangeRecord({id:RANGE_RECORD_ID,projectId:PROFILE_PROJECT_ID,kind:'voice-range',range:value.range,rangeData:value.rangeData,createdAt:new Date().toISOString(),origin:'measured-pitch-range'});const sourceRevision=await voiceSourceRevision(record.sourceProvenance,profile.sampleProvenance);await saveTrack(record);setProfile(current=>({...current,voiceSourceRevision:sourceRevision,range:record.range,rangeData:record.rangeData,rangeProvenance:record.sourceProvenance}));setVoiceEditMode(null);back(voiceReturnScreen);stopMicrophone();return}
    if(value.editMode==='sample'&&profile&&value.sample?.blob){const record=await prepareVoiceSampleRecord({id:SAMPLE_RECORD_ID,projectId:PROFILE_PROJECT_ID,kind:'voice-sample',songId:value.sampleSong.id,songLabel:value.sampleSong.title,blob:value.sample.blob,duration:value.sample.duration,features:value.sample.features,origin:'live-microphone-voice-sample',createdAt:new Date().toISOString()});const sourceRevision=await voiceSourceRevision(profile.rangeProvenance,record.sourceProvenance);await saveTrack(record);setProfile(current=>({...current,voiceSourceRevision:sourceRevision,sampleSong:record.songLabel,sampleUrl:value.sample.url,sampleDuration:record.duration,sampleFeatures:record.features,sampleProvenance:record.sourceProvenance}));setVoiceEditMode(null);back(voiceReturnScreen);stopMicrophone();return}
    if (!value?.rangeData || !value?.sample?.blob) return
    const createdAt = new Date().toISOString()
    const rangeRecord = await prepareVoiceRangeRecord({ id:RANGE_RECORD_ID, projectId:PROFILE_PROJECT_ID, kind:'voice-range', range:value.range, rangeData:value.rangeData, createdAt, origin:'measured-pitch-range' })
    const sampleRecord = await prepareVoiceSampleRecord({ id:SAMPLE_RECORD_ID, projectId:PROFILE_PROJECT_ID, kind:'voice-sample', songId:value.sampleSong?.id || 'sample-a', songLabel:value.sampleSong?.title || 'Sample Song A', blob:value.sample.blob, mimeType:value.sample.mimeType, duration:value.sample.duration, features:value.sample.features, createdAt, origin:'live-microphone-voice-sample' })
    const sourceRevision=await voiceSourceRevision(rangeRecord.sourceProvenance,sampleRecord.sourceProvenance)
    const storedPreferences=await loadTrack(PROFILE_PROJECT_ID+':preferences')
    const preferences=value.preferences || storedPreferences?.preferences || {roles:[],genres:[],taste:[],preferredSongIds:[]}
    await saveTracks([rangeRecord,sampleRecord])
    setProfile({name:'JISUN',voiceSourceRevision:sourceRevision,voiceType:null,range:value.range,rangeData:rangeRecord.rangeData,rangeProvenance:rangeRecord.sourceProvenance,sampleSong:sampleRecord.songLabel,sampleUrl:value.sample.url,sampleDuration:value.sample.duration,sampleFeatures:sampleRecord.features,sampleProvenance:sampleRecord.sourceProvenance,...preferences,identity:value.identity})
    if(value.phase==='sample-save'){stopMicrophone();return preferences}
    back(voiceReturnScreen); stopMicrophone()
  }
  const join = partId => { const part=PARTS.find(item=>item.id===partId);if(!part || projectTracks[partId] || part.participantId || (joined && joinedPart===partId) || (candidateAccepted && partId==='bass') || !evaluatePartFit({rangeData:profile?.rangeData,part}).eligible)return; setJoinedPart(partId);setActiveCreatedProjectId(null); setJoined(true); touchProjectActivity(PROJECT_ID); setScreen('workspace'); setHistory([]) }
  const openFinder = partId => { if (!partId) return; setFinderPartId(partId); setSelectedMatchVocalId(null); go('finder') }
  const invite = vocal => {
    const candidate=PERSON_BY_ID[vocal?.id]
    if(!canSendInvite || !candidate || candidate.isSelf || !evaluatePartFit({rangeData:candidate,part:activeFinderPart}).eligible)return
    if(activeCreatedProject?(activeFinderPart.invitations || []).some(item=>item.vocalId===candidate.id&&item.status==='sent'):(invited&&invitedVocalId===candidate.id))return
    touchProjectActivity(activeCreatedProject?.id || PROJECT_ID)
    if (activeCreatedProject) {
      const projectId=activeCreatedProject.id
      const partId=finderPartId
      setCreatedProjects(current=>current.map(project=>project.id===projectId?{...project,parts:(project.parts||[]).map(part=>{
        if(part.id!==partId || part.participantId || !['open','recruiting','invited'].includes(part.status)) return part
        const invitations=part.invitations||[]
        if(invitations.some(item=>item.vocalId===vocal.id)) return part
        return {...part,status:'open',invitationStatus:'sent',invitations:[...invitations,{vocalId:vocal.id,vocalName:vocal.name,status:'sent',sentAt:new Date().toISOString()}]}
      })}:project))
    } else {
      setInvitedVocalId(vocal?.id || 'luna'); setInvited(true)
    }
    setSelectedMatchVocalId(null); setScreen('workspace'); setHistory([])
  }
  const recordPart = partId => {
    if (activeCreatedProject) {
      if (partId !== activeCreatedProject.ownerPartId) return
    } else if (!joined || partId !== joinedPart) return
    touchProjectActivity(activeCreatedProject?.id || PROJECT_ID)
    setRecordingPart(partId); setScreen('record'); setHistory([]); scrollToTop()
  }
  const submit = async (draft,part) => {
    const targetProject = activeCreatedProject || PROJECT
    const targetParts = targetProject.parts || PARTS
    if (!draft?.blob || part?.id !== recordingPart) throw new Error('제출할 녹음 원본을 찾지 못했어요.')
    if (activeCreatedProject ? part.id!==activeCreatedProject.ownerPartId : (!joined || part.id!==joinedPart)) throw new Error('내가 맡은 Part만 제출할 수 있어요.')
    assertProjectTrackAudio(targetProject,[draft])
    const candidate = await prepareSubmittedTrackRecord({
      id:`${targetProject.id}:${part.id}`,
      projectId:targetProject.id,
      projectSeed:targetProject.seed,
      partId:part.id,
      partIndex:targetParts.findIndex(item=>item.id===part.id),
      participantId:CURRENT_USER_ID,
      participant:'JISUN',
      blob:draft.blob,
      audioSourceRef:draft.audioSourceRef || null,
      mimeType:draft.mimeType,
      duration:draft.duration,
      syncOffsetMs:draft.syncOffsetMs,
      noiseFloor:draft.noiseFloor,
      features:draft.features,
      layer:buildVoiceLayer(targetProject.seed,part.id,draft.features),
      origin:'live-microphone-recording',
      createdAt:new Date().toISOString()
    })
    const track = await saveSubmittedTrack(candidate)
    const trackUrl = track === candidate ? draft.url : URL.createObjectURL(track.blob)
    touchProjectActivity(targetProject.id)
    if (activeCreatedProject) {
      setCreatedProjectTracks(current=>({...current,[targetProject.id]:{...(current[targetProject.id]||{}),[part.id]:{...track,url:trackUrl}}}))
      setCreatedProjects(current=>current.map(project=>project.id===targetProject.id?{...project,progress:Object.keys({...activeTracks,[part.id]:track}).length,status:'RECORDING',parts:project.parts.map(item=>item.id===part.id?{...item,status:'submitted'}:item)}:project))
    } else setProjectTracks(current=>({...current,[part.id]:{...track,url:trackUrl}}))
    setScreen('workspace'); setHistory([]); scrollToTop()
    return track
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
    if (!(value || activeMix)?.blob) return
    setScreen('complete'); setHistory([])
  }
  const resetDemo = async () => {
    if (!window.confirm('내 Voice Profile과 Tenor 녹음, 참여·컬렉션 상태를 초기화할까요? 출처가 표시된 시연 Track 2개만 다시 준비되어 2/4에서 시작합니다.')) return
    stopGuides(); stopMicrophone()
    await Promise.all([clearProjectTracks(PROJECT_ID),clearProjectTracks(PROFILE_PROJECT_ID),...createdProjects.map(project=>clearProjectTracks(project.id))])
    localStorage.removeItem(APP_STATE_KEY)
    window.location.reload()
  }
  const readyForMix = allProjectTracksSubmitted(PROJECT,projectTracks)
  const activeReadyForMix = allProjectTracksSubmitted(activeProject,activeTracks)
  const activeComplete=activeReadyForMix && Boolean(activeMix)
  useEffect(()=>{
    if(!tracksReady || screen!=='complete' || activeComplete)return
    window.history.replaceState({...window.history.state,ieumScreen:'workspace'},'','#workspace')
    setScreen('workspace')
  },[tracksReady,screen,activeComplete])
  const retryAutoMix = () => {
    if(!tracksReady||!activeReadyForMix||activeMix||activeMixStatus!=='error'||mixRetryPending.current.has(activeProject.id))return
    mixRetryPending.current.add(activeProject.id)
    if(activeCreatedProject){
      createdMixJobs.current.delete(activeProject.id)
      setCreatedMixStates(current=>({...current,[activeProject.id]:'processing'}))
      setCreatedMixRetryAttempt(value=>value+1)
    } else {setMixStatus('processing');setMixRetryAttempt(value=>value+1)}
  }

  useEffect(() => {
    const onPopState = event => {
      const next = event.state?.ieumScreen || window.location.hash.slice(1) || 'home'
      if(event.state?.selectedSongId)setSelectedSongId(event.state.selectedSongId)
      if(event.state?.selectedProjectId!==undefined)setSelectedProjectId(event.state.selectedProjectId)
      if(event.state?.activeCreatedProjectId!==undefined)setActiveCreatedProjectId(event.state.activeCreatedProjectId)
      if(event.state?.finderPartId)setFinderPartId(event.state.finderPartId)
      if(PERSON_BY_ID[event.state?.selectedVocalId])setSelectedVocalId(event.state.selectedVocalId)
      if(event.state?.selectedMatchVocalId===null || PERSON_BY_ID[event.state?.selectedMatchVocalId])setSelectedMatchVocalId(event.state.selectedMatchVocalId)
      if(typeof event.state?.createDraftKey==='string')setCreateDraftKey(event.state.createDraftKey)
      if(event.state?.createProjectSongId===null || SONGS.some(song=>song.id===event.state?.createProjectSongId))setCreateProjectSongId(event.state.createProjectSongId)
      if([null,'range','sample'].includes(event.state?.voiceEditMode))setVoiceEditMode(event.state.voiceEditMode)
      if(['my','detail','vocal-profile','create-project'].includes(event.state?.voiceReturnScreen))setVoiceReturnScreen(event.state.voiceReturnScreen)
      setScreen(next)
      requestAnimationFrame(()=>{window.scrollTo(0,event.state?.scrollTop || 0);const surface=document.querySelector('.screen');if(surface)surface.scrollTop=event.state?.scrollTop || 0})
    }
    if (!window.history.state?.ieumScreen) window.history.replaceState({ieumScreen:screen},'',`#${screen}`)
    window.addEventListener('popstate',onPopState)
    return () => window.removeEventListener('popstate',onPopState)
  }, [])

  useEffect(() => {
    window.history.replaceState({...window.history.state,ieumScreen:screen,selectedVocalId,selectedMatchVocalId,finderPartId,activeCreatedProjectId,selectedSongId,selectedProjectId,voiceEditMode,voiceReturnScreen,createProjectSongId,createDraftKey},'',`#${screen}`)
  }, [screen,selectedVocalId,selectedMatchVocalId,finderPartId,activeCreatedProjectId,selectedSongId,selectedProjectId,voiceEditMode,voiceReturnScreen,createProjectSongId,createDraftKey])

  useEffect(() => {
    if(persisted.storageReadFailed)return
    try {
      saveUserState({joined,joinedPart,mainKeyLocked,invited,invitedVocalId,candidateAccepted,projectLikes,vocalSaves,songSaves,createdProjects,activeCreatedProjectId,projectActivity,delayNotified})
      setStateSaveError(false)
    } catch { setStateSaveError(true) }
  }, [joined,joinedPart,mainKeyLocked,invited,invitedVocalId,candidateAccepted,projectLikes,vocalSaves,songSaves,createdProjects,activeCreatedProjectId,projectActivity,delayNotified,stateSaveAttempt])

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
    if (!tracksReady || !readyForMix || mix) return
    let cancelled = false
    setMixStatus('processing'); setMixProgress(0)
    const run = async () => {
      let unpublishedUrl = null
      try {
        const prepared = await prepareProjectMix(PROJECT,projectTracks)
        if(cancelled)return
        const value = await createAutoMix({ tracks:prepared.tracks, duration:Math.max(...prepared.tracks.map(track=>track.duration||0)), onProgress:value=>!cancelled&&setMixProgress(value) })
        unpublishedUrl = value.url
        if (cancelled) return
        const record = { id:MIX_RECORD_ID, projectId:PROJECT_ID, kind:'auto-mix', inputManifest:prepared.inputManifest, blob:value.blob, mimeType:value.blob.type || 'audio/wav', duration:value.duration, bytes:value.bytes, origin:value.origin, processing:value.processing, createdAt:new Date().toISOString() }
        await saveTrack(record)
        if (cancelled) return
        setMix({...record,url:value.url}); setMixStatus('complete'); setMixProgress(100)
        unpublishedUrl = null
      } catch (error) {
        if (!cancelled) { console.error(error); setMixStatus('error') }
      } finally {
        if (unpublishedUrl) URL.revokeObjectURL(unpublishedUrl)
        mixRetryPending.current.delete(PROJECT_ID)
      }
    }
    const timer = window.setTimeout(run,500)
    return () => { cancelled=true; window.clearTimeout(timer) }
  }, [tracksReady,readyForMix,mix,projectTracks,mixRetryAttempt])

  // All required submitted Tracks trigger one job, independent of navigation.
  useEffect(() => {
    if (!tracksReady) return
    createdProjects.forEach(project=>{
      const tracks=createdProjectTracks[project.id] || {}
      const required=project.parts || []
      if (!allProjectTracksSubmitted(project,tracks) || createdMixes[project.id] || createdMixJobs.current.has(project.id)) return
      createdMixJobs.current.add(project.id)
      setCreatedMixStates(current=>({...current,[project.id]:'processing'}))
      ;(async()=>{
        let unpublishedUrl = null
        try {
          assertProjectTrackAudio(project,required.map(part=>tracks[part.id]))
          const prepared=await prepareProjectMix(project,tracks)
          const backingBlob=await loadProjectBacking(project)
          const value=await createAutoMix({tracks:prepared.tracks,backingBlob,duration:Math.max(project.recordingDuration||0,...prepared.tracks.map(track=>track.duration || 0))})
          unpublishedUrl = value.url
          const record={id:project.id+':auto-mix',projectId:project.id,kind:'auto-mix',inputManifest:prepared.inputManifest,audioSourceRef:projectAudioReference(project),blob:value.blob,mimeType:'audio/wav',duration:value.duration,bytes:value.bytes,origin:value.origin,processing:value.processing,createdAt:new Date().toISOString()}
          await saveTrack(record)
          setCreatedMixes(current=>({...current,[project.id]:{...record,url:value.url}}))
          unpublishedUrl = null
          setCreatedMixStates(current=>({...current,[project.id]:'complete'}))
          setCreatedProjects(current=>current.map(item=>item.id===project.id?{...item,status:'COMPLETE',progress:required.length}:item))
          if(screenRef.current==='workspace'&&activeProjectRef.current===project.id){setScreen('complete');setHistory([])}
        } catch(error){console.error(error);setCreatedMixStates(current=>({...current,[project.id]:'error'}))}
        finally {if(unpublishedUrl)URL.revokeObjectURL(unpublishedUrl);mixRetryPending.current.delete(project.id)}
      })()
    })
  },[tracksReady,createdProjects,createdProjectTracks,createdMixes,createdMixRetryAttempt])

  useEffect(() => {
    const transitioned=previousMixStatus.current==='processing'&&mixStatus==='complete'
    previousMixStatus.current=mixStatus
    if (!transitioned || screen!=='workspace' || !mix || activeCreatedProject) return
    const timer=window.setTimeout(()=>{setScreen('complete');setHistory([]);scrollToTop()},1200)
    return()=>window.clearTimeout(timer)
  },[screen,mixStatus,mix,activeCreatedProject])

  useEffect(() => {
    if(persisted.storageReadFailed)return
    let active = true
    const restoredUrls=new Set()
    const releaseRestoredUrls=()=>{for(const url of restoredUrls)URL.revokeObjectURL(url);restoredUrls.clear()}
    const restoredUrl=blob=>{
      if(!active)throw new Error('Data recovery cancelled')
      const url=URL.createObjectURL(blob);restoredUrls.add(url);return url
    }
    const bootstrap = async () => {
      setTracksLoadError('')
      const [projectStored, profileStored, demoManifest] = await Promise.all([
        loadProjectTracks(PROJECT_ID),
        loadProjectTracks(PROFILE_PROJECT_ID),
        fetch('/demo-stems/manifest.json').then(response=>response.ok?response.json():Promise.reject(new Error('데모 Track manifest 없음')))
      ])
      const stored = await Promise.all(projectStored
        .filter(track => ['live-microphone-recording','local-formant-singing-demo'].includes(track.origin) && submittedProjectTracks(PROJECT,{[track.partId]:track}).length)
        .map(async track => ({
          ...await refreshTrackAnalysis(track,PROJECT_SEED),
          participantId:track.participantId || personFromName(track.participant)?.id || null
        })))
      for (const entry of demoManifest.tracks.filter(item=>INITIAL_DEMO_PARTS.has(item.partId))) {
        if (projectStored.some(track=>track.id===`${PROJECT_ID}:${entry.partId}` && track.blob)) continue
        const demoTrack = await loadDisclosedDemoTrack(entry)
        await saveTrack(demoTrack)
        stored.push(demoTrack)
      }
      if (!active) return
      setProjectTracks(Object.fromEntries(stored.map(track=>[track.partId,{...track,url:restoredUrl(track.blob)}])))
      const mainDrafts=projectStored.filter(item=>item.kind==='temporary-recording'&&item.blob)
      setDraftKeys(current=>({...current,...Object.fromEntries(mainDrafts.map(item=>[`${item.projectId}:${item.partId}`,true]))}))
      const rangeRecord = profileStored.find(item=>item.kind==='voice-range')
      const sampleRecord = profileStored.find(item=>item.kind==='voice-sample' && item.blob)
      const preferenceRecord=profileStored.find(item=>item.kind==='voice-preferences')
      const mixRecord = projectStored.find(item=>item.kind==='auto-mix' && item.blob)
      const restoredSourceRevision=rangeRecord && sampleRecord ? await voiceSourceRevision(rangeRecord.sourceProvenance,sampleRecord.sourceProvenance) : null
      if(!active)return
      if (rangeRecord && sampleRecord) setProfile({name:'JISUN',voiceSourceRevision:restoredSourceRevision,voiceType:null,range:rangeRecord.range,rangeData:rangeRecord.rangeData,rangeProvenance:rangeRecord.sourceProvenance || null,sampleSong:sampleRecord.songLabel,roles:[],genres:[],taste:[],sampleUrl:restoredUrl(sampleRecord.blob),sampleDuration:sampleRecord.duration,sampleFeatures:sampleRecord.features,sampleProvenance:sampleRecord.sourceProvenance || null,identity:{status:'blocked',reason:'free-local-generative-model-not-connected'},...preferenceRecord?.preferences})
      if (mixRecord) { setMix({...mixRecord,url:restoredUrl(mixRecord.blob)}); setMixStatus('complete'); setMixProgress(100) }
      const createdTrackEntries = await Promise.all(createdProjects.map(async project=>{
        const records = await loadProjectTracks(project.id)
        const tracks = await Promise.all(records
          .filter(track=>submittedProjectTracks(project,{[track.partId]:track}).length)
          .map(async track=>{const refreshed=await refreshTrackAnalysis(track,project.seed);return {...refreshed,url:restoredUrl(refreshed.blob)}}))
        const storedMix=records.find(track=>track.kind==='auto-mix'&&track.blob)
        if(storedMix){setCreatedMixes(current=>({...current,[project.id]:{...storedMix,url:restoredUrl(storedMix.blob)}}));setCreatedMixStates(current=>({...current,[project.id]:'complete'}))}
        const drafts=records.filter(track=>track.kind==='temporary-recording'&&track.blob)
        if(drafts.length)setDraftKeys(current=>({...current,...Object.fromEntries(drafts.map(item=>[`${item.projectId}:${item.partId}`,true]))}))
        return [project.id,Object.fromEntries(tracks.map(track=>[track.partId,track]))]
      }))
      if (!active) return
      setCreatedProjectTracks(Object.fromEntries(createdTrackEntries))
      setTracksReady(true)
    }
    bootstrap().catch(error=>{ const wasActive=active;active=false;releaseRestoredUrls(); console.error(error); if(wasActive)setTracksLoadError('저장한 데이터를 불러오지 못했어요. 원본을 유지하고 다시 시도해 주세요.') })
    return () => { active=false;releaseRestoredUrls() }
  },[tracksLoadAttempt])

  useEffect(() => {
    window.__IEUM_V2__ = {
      get state(){return {activeProject,activeTracks,activeMix,activeMixStatus,createdProjects,createdProjectTracks,createdMixes,screen,profile,joined,invited,candidateAccepted,projectLiked,projectLikes,vocalSaves,songSaved,songSaves,projectTracks,mix,mixStatus,mixProgress,readyForMix,projectActivity,delayedProjectIds,recordSignature:projectRecordSignature(PROJECT_SEED,layers)}},
      audioRuntime,
      projectSeed:PROJECT_SEED,
      supportedPartCounts:SUPPORTED_PART_COUNTS,
      prepareIdentityInput:generatorVersion=>loadMeasuredProfileIdentityInput({userId:CURRENT_USER_ID,profileProjectId:PROFILE_PROJECT_ID,generatorVersion}),
      // Producer bridge only: preserve exact results without automatically
      // selecting a new graphic or treating generation as submission success.
      storeIdentityResult:async artifact=>{
        const snapshot=structuredClone(artifact)
        const manifest=await loadMeasuredProfileIdentityInput({userId:CURRENT_USER_ID,profileProjectId:PROFILE_PROJECT_ID,generatorVersion:snapshot?.generatorVersion})
        return persistPersonalIdentityResult({profileProjectId:PROFILE_PROJECT_ID,manifest,artifact:snapshot})
      },
      loadIdentityResult:ref=>loadPersonalIdentityResult({profileProjectId:PROFILE_PROJECT_ID,userId:CURRENT_USER_ID,id:ref?.id,revision:ref?.revision}),
      prepareStoredTrackIdentity:input=>prepareStoredSubmittedVoiceControls({...input,profileProjectId:PROFILE_PROJECT_ID,userId:CURRENT_USER_ID}),
      storeTrackVoiceLayer:input=>persistStoredTrackVoiceLayer({...input,profileProjectId:PROFILE_PROJECT_ID,userId:CURRENT_USER_ID}),
      loadTrackVoiceLayer:ref=>loadStoredTrackVoiceLayer(ref),
      storeProjectIdentityInput:({layerRefs,generatorVersion})=>persistStoredProjectRecordInput({project:activeProject,layerRefs,generatorVersion}),
      loadProjectIdentityInput:ref=>loadStoredProjectRecordInput(ref)
    }
  }, [screen,profile,joined,invited,candidateAccepted,projectLiked,projectLikes,vocalSaves,songSaved,songSaves,projectTracks,mix,mixStatus,mixProgress,readyForMix,recordingPart,projectActivity,delayedProjectIds.join(',')])

  if (!tracksReady) return <div className="screen"><TopBar meta="TRACKS LOADING"/><main className="loading-state"><p>{tracksLoadError || '실제 Track 분석값을 불러오는 중…'}</p>{tracksLoadError&&<div role="alert"><button className="secondary" data-action="tracks-load-retry" onClick={()=>{if(persisted.storageReadFailed)window.location.reload();else setTracksLoadAttempt(value=>value+1)}}>저장한 데이터 다시 불러오기</button></div>}</main></div>

  let content
  if (screen==='home') content=<Home mainProject={mainProject} createdProjects={createdProjects} createdProjectTracks={createdProjectTracks} createdMixes={createdMixes} openCreatedProject={openCreatedProject} joined={joined} joinedPart={joinedPart} candidateAccepted={candidateAccepted} openSong={openSong} layers={layers} projectTracks={projectTracks} profile={profile} mix={mix} openCreateProject={()=>startCreateProject(null)} openComplete={()=>go('complete')}/>
  else if (screen==='detail') content=<Detail go={go} back={()=>back('home')} song={selectedSong} profile={profile} join={join} layers={layers} projectTracks={projectTracks} songSaved={songSaved} toggleSongSave={toggleSongSave} openVocalProfile={openVocalProfile} createdProjects={createdProjects} createdProjectTracks={createdProjectTracks} createdMixes={createdMixes} onCreateProject={startCreateProject} onOpenCreatedProject={openCreatedProject} openMainWorkspace={openMainWorkspace} mainMix={mix} mainKeyLocked={mainKeyLocked} joined={joined} joinedPart={joinedPart} candidateAccepted={candidateAccepted} invitedPerson={invitedPerson} initialProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} detailContext={detailContext}/>
  else if (screen==='song-browser') content=<SongBrowser back={()=>back('collection')} openSong={openSong} songSaves={songSaves} toggleSongSave={toggleSongSave} createdProjects={createdProjects} onCreateProject={startCreateProject}/>
  else if (screen==='create-project') content=<CreateProject profile={profile} draft={createProjectDrafts.current[createDraftKey]} rememberDraft={rememberCreateProjectDraft} setupVoice={()=>go('voice')} key={createDraftKey} back={()=>back(createProjectSongId?'detail':'home')} complete={createProject} initialSongId={createProjectSongId}/>
  else if (screen==='voice') content=<VoiceSetup key={voiceEditMode || "setup"} existing={profile} editMode={voiceEditMode} songSaves={songSaves} go={go} back={()=>{setVoiceEditMode(null);back(voiceReturnScreen)}} complete={completeProfile}/>
  else if (screen==='workspace' || (screen==='complete' && !activeComplete)) content=<Workspace go={go} project={activeProject} song={activeSong} isCreated={Boolean(activeCreatedProject)} ownerPartId={activeCreatedProject?.ownerPartId || joinedPart} findVocal={openFinder} joined={joined} invited={invited} invitedPerson={invitedPerson} candidateAccepted={candidateAccepted} candidateArrivalStatus={candidateArrivalStatus} projectTracks={activeTracks} layers={activeLayers} recordPart={recordPart} projectLiked={activeProjectLiked} toggleProjectLike={toggleActiveProjectLike} openVocalProfile={openVocalProfile} mix={activeMix} mixStatus={activeMixStatus} retryAutoMix={retryAutoMix} completionDelayed={delayedProjectIds.includes(activeProject.id)} hasDraft={Boolean(draftKeys[`${activeProject.id}:${activeCreatedProject?.ownerPartId||joinedPart}`])}/>
  else if (screen==='finder') content=<Finder project={activeProject} song={activeSong} tracks={activeTracks} profile={profile} back={()=>back('workspace')} preferences={finderPreferences[finderContextKey]} updatePreferences={patch=>setFinderPreferences(current=>({...current,[finderContextKey]:{...current[finderContextKey],...patch}}))} invite={canSendInvite?invite:null} invitedVocalIds={activeCreatedProject?(activeFinderPart?.invitations||[]).map(item=>item.vocalId):(invited?[invitedVocalId]:[])} part={activeFinderPart} vocalSaves={vocalSaves} toggleVocalSave={toggleVocalSave} openVocalProfile={openVocalProfile} selectedVocalId={selectedMatchVocalId} setSelectedVocalId={setSelectedMatchVocalId}/>
  else if (screen==='vocal-profile') content=<OtherVocalProfile profile={profile} setupVoice={()=>go('voice')} vocal={selectedVocal} back={()=>back('collection')} saved={vocalSaves.some(item=>item.vocalId===selectedVocalId)} toggleSave={toggleVocalSave} sampleUrl={selectedVocal.sampleUrl} sampleDuration={selectedVocal.sampleDuration}/>
  else if (screen==='record') content=<Recorder go={go} submit={submit} onRecordingStart={()=>{touchProjectActivity(activeProject.id);if(!activeCreatedProject)setMainKeyLocked(true);if(activeCreatedProject)setCreatedProjects(current=>current.map(project=>project.id===activeProject.id?{...project,keyLocked:true}:project))}} partId={recordingPart} projectTracks={activeTracks} layers={activeLayers} project={{...activeProject,songTitle:activeSong.title,recordingDuration:activeProject.audioSource?.duration || activeSong.duration.split(":").reduce((total,value)=>total*60+Number(value),0)}} parts={activeParts} onDraftChange={present=>setDraftKeys(current=>({...current,[`${activeProject.id}:${recordingPart}`]:present}))}/>
  else if (screen==='complete') content=<Complete go={go} project={activeProject} song={activeSong} mix={activeMix} layers={activeLayers} projectTracks={activeTracks} projectLiked={activeProjectLiked} toggleProjectLike={toggleActiveProjectLike} openVocalProfile={openVocalProfile}/>
  else if (['projects','collection','my'].includes(screen)) content=<PersonalArea mainProject={mainProject} collectionContext={collectionContext} type={screen} go={target=>target==='create-project'?startCreateProject():go(target)} createdProjectTracks={createdProjectTracks} createdMixes={createdMixes} toggleProjectById={id=>setProjectLikes(current=>current.some(item=>item.projectId===id)?current.filter(item=>item.projectId!==id):[...current,{projectId:id,savedAt:new Date().toISOString()}])} editVoice={mode=>{setVoiceEditMode(mode);go("voice")}} updatePreferences={async preferences=>{await saveTrack({id:PROFILE_PROJECT_ID+":preferences",projectId:PROFILE_PROJECT_ID,kind:"voice-preferences",preferences});setProfile(current=>({...current,...preferences}))}} openMainWorkspace={openMainWorkspace} openSong={openSong} openCreatedProject={openCreatedProject} joined={joined} createdProjects={createdProjects} projectLikes={projectLikes} vocalSaves={vocalSaves} songSaves={songSaves} toggleProjectLike={toggleProjectLike} toggleVocalSave={toggleVocalSave} toggleSongSave={toggleSongSave} openVocalProfile={openVocalProfile} profile={profile} layers={layers} trackCount={Object.keys(projectTracks).length} mix={mix} readyForMix={readyForMix} resetDemo={resetDemo} delayedProjectIds={delayedProjectIds}/>
  else content=<Home mainProject={mainProject} createdProjects={createdProjects} createdProjectTracks={createdProjectTracks} createdMixes={createdMixes} openCreatedProject={openCreatedProject} joined={joined} joinedPart={joinedPart} candidateAccepted={candidateAccepted} openSong={openSong} layers={layers} projectTracks={projectTracks} profile={profile} mix={mix} openCreateProject={()=>startCreateProject(null)} openComplete={()=>go('complete')}/>
  const navCurrent = screen==='home'?'home':screen==='collection'?'bookmark':screen==='my'?'user':'folder'
  const showBottomNav = screen!=='record'
  return <>{stateSaveError&&<div className="permission-error" role="alert" data-state="user-state-save-error" style={{position:'fixed',top:0,left:'50%',transform:'translateX(-50%)',width:'min(430px,100%)',zIndex:100}}><span>참여·저장 상태를 저장하지 못했어요. 이 화면의 변경은 유지됩니다. 저장하기 전에는 새로고침하지 마세요.</span><button className="secondary" data-action="user-state-save-retry" onClick={()=>setStateSaveAttempt(value=>value+1)}>저장 다시 시도</button></div>}{content}{showBottomNav && <BottomNav current={navCurrent} go={go}/>}</>
}

export { Workspace, Recorder, Complete, Detail, PersonalArea, Home }
