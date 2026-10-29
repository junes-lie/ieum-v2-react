import {isSupportedVoiceAnalysis} from './voiceAnalysis.js'
const NOTES = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}

export function noteToMidi(note) {
  const match = String(note || '').trim().match(/^([A-G])([#♯b♭]?)(-?\d+)$/i)
  if (!match) return null
  return (Number(match[3])+1)*12+NOTES[match[1].toUpperCase()]+(['#','♯'].includes(match[2])?1:['b','♭'].includes(match[2])?-1:0)
}

function readRange(value) {
  if (!value) return null
  const pair = String(typeof value==='string'?value:value.range || '').split(/[–—~]/).map(noteToMidi)
  const low = value.requiredLowMidi ?? value.lowMidi ?? value.minMidi ?? pair[0]
  const high = value.requiredHighMidi ?? value.highMidi ?? value.maxMidi ?? pair[1]
  return Number.isFinite(low) && Number.isFinite(high) && low<=high ? {lowMidi:low,highMidi:high} : null
}

// Range is a feasibility gate, never a singer's ability score.
export function evaluatePartFit({rangeData,part,transposeSemitones=0}) {
  const measured = readRange(rangeData)
  if (!measured) return {status:'profile-required',eligible:false,coveragePercent:null,reasons:['편한 음역을 먼저 측정해 주세요.']}
  const base = readRange(part)
  if (!base || !Number.isFinite(transposeSemitones)) return {status:'unavailable',eligible:false,coveragePercent:null,reasons:['이 Part의 실제 요구 음역이 아직 준비되지 않았어요.']}
  const requiredRange = {lowMidi:base.lowMidi+transposeSemitones,highMidi:base.highMidi+transposeSemitones}
  const requiredSpan=requiredRange.highMidi-requiredRange.lowMidi+1
  if (!Number.isFinite(requiredRange.lowMidi) || !Number.isFinite(requiredRange.highMidi) || !Number.isFinite(requiredSpan)) return {status:'unavailable',eligible:false,coveragePercent:null,reasons:['이 Part의 실제 요구 음역이 아직 준비되지 않았어요.']}
  // Inclusive semitone coverage of the Part requirement, not singing ability,
  // correctness or an AI probability. Preserve measured/shifted endpoints.
  const coveredSpan=Math.max(0,Math.min(measured.highMidi,requiredRange.highMidi)-Math.max(measured.lowMidi,requiredRange.lowMidi)+1)
  const coveragePercent=Math.round(Math.max(0,Math.min(100,coveredSpan/requiredSpan*100)))
  const lowMargin = requiredRange.lowMidi-measured.lowMidi
  const highMargin = measured.highMidi-requiredRange.highMidi
  const eligible = lowMargin>=0 && highMargin>=0
  const reasons = eligible ? ['현재 Key의 요구 음역이 측정된 편한 음역 안에 있어요.'] : [lowMargin<0?'이 Part의 낮은 음이 측정된 음역보다 낮아요.':null,highMargin<0?'이 Part의 높은 음이 측정된 음역보다 높아요.':null].filter(Boolean)
  const tessitura = readRange(part.tessitura || (Number.isFinite(part.tessituraLowMidi)&&Number.isFinite(part.tessituraHighMidi)?{lowMidi:part.tessituraLowMidi,highMidi:part.tessituraHighMidi}:null))
  const comfortableRange = readRange(rangeData.comfortableRange) || measured
  const tessituraFit = tessitura ? comfortableRange.lowMidi<=tessitura.lowMidi+transposeSemitones && comfortableRange.highMidi>=tessitura.highMidi+transposeSemitones : null
  if (tessituraFit!==null) reasons.push(tessituraFit?'주로 부르는 구간도 측정된 편한 음역 안에 있어요.':'주로 부르는 구간은 측정된 편한 음역과 일부 겹치지 않아요.')
  const feasible = eligible && tessituraFit !== false
  return {status:feasible?'eligible':'ineligible',eligible:feasible,coveragePercent,lowMargin,highMargin,requiredRange,tessituraFit,reasons}
}

export const rangeGate = evaluatePartFit

// Compare declared preferences, not prototype metrics or inferred vocal ability.
export function sharedVoicePreferences(profile, candidate) {
  const genreAliases={'발라드':'ballad','팝':'pop','r&b·소울':'r&b','록':'rock','힙합':'hip hop','재즈':'jazz'}
  const canonical=(key,value)=>{const text=String(value).trim().toLocaleLowerCase();return key==='genres'?(genreAliases[text] || text):text}
  const shared = key => {
    const own = new Set((profile?.[key] || []).map(value=>canonical(key,value)))
    return [...new Set(candidate?.[key] || [])].filter(value=>own.has(canonical(key,value)))
  }
  const genres = shared('genres')
  const taste = shared('taste')
  const songIds=shared('preferredSongIds')
  const configured=Boolean(profile?.genres?.length || profile?.taste?.length || profile?.preferredSongIds?.length)
  return {genres,taste,songIds,configured,count:genres.length+taste.length+songIds.length}
}

export function recommendSampleSongs(rangeData, songs) {
  return songs.map(song=>({song,fit:evaluatePartFit({rangeData,part:song})}))
    .sort((a,b)=>Number(b.fit.eligible)-Number(a.fit.eligible))
}

export function recommendOpenParts(rangeData, projects) {
  return projects.flatMap(project=>(project.parts || [])
    .filter(part=>!part.participantId && !part.participant && ['open','recruiting'].includes(part.status))
    // Part ranges are registered in the Project's current key, not the solo Song range.
    .map(part=>({projectId:project.id,partId:part.id,partName:part.name,key:project.key,
      fit:evaluatePartFit({rangeData,part})}))
    .filter(row=>row.fit.eligible))
}

export function openProjectRangeAvailability(rangeData, projects) {
  let matchingProjects=0,unverifiedProjects=0
  for(const project of projects){
    const openParts=(project.parts || []).filter(part=>!part.participantId && !part.participant && ['open','recruiting'].includes(part.status))
    const fits=openParts.map(part=>evaluatePartFit({rangeData,part}))
    if(fits.some(fit=>fit.eligible))matchingProjects++
    else if(fits.some(fit=>['unavailable','profile-required'].includes(fit.status)) || !project.parts)unverifiedProjects++
  }
  return {matchingProjects,unverifiedProjects}
}

// Similarity to a centroid does not predict a balanced ensemble. Keep measured
// descriptors as evidence; do not turn closeness OR difference into harmony %.
// Preference overlap remains separate from arrangement coverage and vocal quality.
export const PROJECT_HARMONY_METHOD = 'ensemble-evidence-v2'
const unit = value => Number.isFinite(value) && value >= 0 && value <= 1
const measuredVoice = features => isSupportedVoiceAnalysis(features) &&
  ['brightness','roughness'].every(key=>unit(features[key])) && !String(features.fingerprint || '').startsWith('demo-') &&
  // Older supported analyses omitted level fields. Keep them compatible, but
  // never treat explicitly measured silence as a meaningful voice descriptor.
  (features.rms===undefined || (Number.isFinite(features.rms) && features.rms>=.001)) &&
  (features.peak===undefined || (Number.isFinite(features.peak) && features.peak>.001))
const unique = values => [...new Set(values)]
const list = value => Array.isArray(value) ? value : typeof value === 'string' && value.trim() ? [value] : []
const normalized = value => String(value).trim().toLocaleLowerCase()
const sha256 = value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value)
const roundedIndex = value => Math.round(Math.max(0,Math.min(100,value)))
const absentMetric = (reason,status='unavailable') => ({score:null,status,reason})
const availableMetric = (score,reason,details={}) => ({score:roundedIndex(score),status:'available',reason,...details})

function roleKinds(values) {
  return unique(values.flatMap(value=>{
    const text=normalized(value)
    // Pitch-register names such as Soprano/Tenor are NOT musical roles.
    if (/^(메인 멜로디|main|main melody|lead|lead vocal|melody)$/.test(text)) return ['melody']
    if (/^(화음·코러스|화음|코러스|harmony|chorus|support|upper harmony|middle harmony|lower harmony|low harmony|bass foundation)$/.test(text)) return ['harmony']
    return []
  }))
}

function projectGenreTags(values) {
  const aliases={'발라드':'ballad','팝':'pop','r&b·소울':'r&b','소울':'r&b','soul':'r&b','록':'rock','힙합':'hip hop','hip-hop':'hip hop','재즈':'jazz'}
  return unique(values.flatMap(value=>{
    const text=normalized(value)
    if (aliases[text]) return [aliases[text]]
    // Match catalogue compound genres to the actual selectable categories;
    // do not invent styles from a singer's measured timbre.
    const categories=[]
    if (/(^|[^a-z])pop($|[^a-z])/.test(text)) categories.push('pop')
    if (/(^|[^a-z])ballad($|[^a-z])/.test(text)) categories.push('ballad')
    if (/(^|[^a-z])(r&b|soul)($|[^a-z])/.test(text)) categories.push('r&b')
    if (/(^|[^a-z])rock($|[^a-z])/.test(text)) categories.push('rock')
    if (/(^|[^a-z])hip[ -]hop($|[^a-z])/.test(text)) categories.push('hip hop')
    if (/(^|[^a-z])jazz($|[^a-z])/.test(text)) categories.push('jazz')
    return categories.length ? categories : text ? [text] : []
  }))
}

function arrangementMatchesProject(project,song) {
  const source=project?.audioSource
  return source?.kind==='project-arrangement' && source.songId===(project.songId || song?.id) && source.key===project.key
}

function trackMatchesArrangement(project,song,track) {
  const source=project?.audioSource
  if (!source) return true // Actual legacy project Tracks can have no registered backing.
  if (!arrangementMatchesProject(project,song)) return false
  const keys=['songId','key','revision','duration','sourceSha256','backingSha256']
  return Boolean(track.audioSourceRef) && keys.every(key=>source[key]===undefined || track.audioSourceRef[key]===source[key])
}

function registeredVocalReference(project,song,reference) {
  const source=project?.audioSource
  const file=source?.harmonyVocalFile || source?.vocalGuideFile
  const hash=source?.harmonyVocalSha256 || source?.vocalGuideSha256
  const songId=project?.songId || song?.id
  return arrangementMatchesProject(project,song) && reference?.kind==='project-vocal-reference' && measuredVoice(reference.features) &&
    Boolean(project?.id && songId && source?.revision && file && sha256(hash)) &&
    reference.projectId===project.id && reference.songId===songId &&
    (!song?.id || song.id===songId) && reference.key===(project.key || source.key) &&
    reference.revision===source.revision && reference.audioSha256===hash &&
    reference.sourceFile===file
}

export function evaluateProjectHarmony({profile,parts=[],tracks={},selectedPart,currentUserId,project={},song={},projectReference=null}) {
  const members=parts.filter(part=>part.participantId || part.participant).filter(part=>
    part.participantId!==currentUserId && (!selectedPart || part.id!==selectedPart.id))
  const seen=new Set()
  const measured=members.flatMap(part=>{
    const track=tracks[part.id]
    const hash=track?.sourceProvenance?.audioSha256
    if (!project.id || !track || track.demo || track.origin!=='live-microphone-recording' ||
      track.projectId!==project.id || track.partId!==part.id || track.id!==`${project.id}:${part.id}` ||
      (track.kind && track.kind!=='project-track') || (track.submissionStatus && track.submissionStatus!=='success') ||
      (track.participantId && part.participantId && track.participantId!==part.participantId) ||
      track.participantId===currentUserId || !sha256(hash) || !measuredVoice(track.features) || !trackMatchesArrangement(project,song,track)) return []
    if (seen.has(hash)) return [] // The same bytes copied to Parts are one voice source.
    seen.add(hash)
    return [{part,features:track.features,audioSha256:hash}]
  })
  const missing=members.filter(part=>!measured.some(row=>row.part.id===part.id)).map(part=>part.participant || part.name)
  const ownDuration=profile?.sampleFeatures?.durationSec
  const sampleLongEnough=ownDuration===undefined || (Number.isFinite(ownDuration) && ownDuration>=3)
  const validOwn=Boolean(!profile?.demo && measuredVoice(profile?.sampleFeatures) && sampleLongEnough)
  const unavailableOwn=profile?.demo
    ? '시연 프로필의 고정 예시와 실제 분석은 분리해요. 샘플을 직접 등록하면 계산할 수 있어요.'
    : !sampleLongEnough ? '샘플이 3초보다 짧아 조화를 계산할 수 없어요. 3초 이상 다시 녹음해 주세요.'
    : profile?.sampleFeatures && (profile.sampleFeatures.rms<.001 || profile.sampleFeatures.peak<=.001)
      ? '샘플의 소리가 너무 작거나 무음이에요. 마이크 입력을 확인하고 다시 녹음해 주세요.'
      : '내 Voice Sample의 실제 음색 분석값이 필요해요. 샘플을 등록하거나 다시 녹음해 주세요.'
  let metrics={timbre:absentMetric(unavailableOwn),role:absentMetric(unavailableOwn),taste:absentMetric(unavailableOwn)}
  let source=null
  if (validOwn) {
    const referenceValid=registeredVocalReference(project,song,projectReference)
    const target=measured.length
      ? {brightness:measured.reduce((sum,row)=>sum+row.features.brightness,0)/measured.length,roughness:measured.reduce((sum,row)=>sum+row.features.roughness,0)/measured.length}
      : referenceValid ? projectReference.features : null
    if (target) {
      const brightnessDistance=Math.abs(profile.sampleFeatures.brightness-target.brightness)
      const roughnessDistance=Math.abs(profile.sampleFeatures.roughness-target.roughness)
      source=measured.length
        ? {kind:'submitted-track-aggregate',count:measured.length,expectedCount:members.length,audioSha256:measured.map(row=>row.audioSha256)}
        : {kind:'project-vocal-reference',count:1,projectId:project.id,songId:projectReference.songId,key:projectReference.key,revision:projectReference.revision,audioSha256:[projectReference.audioSha256],sourceFile:projectReference.sourceFile}
      const label=measured.length ? `프로젝트 제출 음성 ${measured.length}개를 합산한 평균` : '이 프로젝트에 등록된 보컬 가이드'
      metrics.timbre={...absentMetric(`${label}과 밝기·질감 차이를 확인했어요. 비슷하거나 다르다는 사실만으로 합주 균형을 판단하지 않아요.`,'evidence-only'),brightnessDistance,roughnessDistance,target:{brightness:target.brightness,roughness:target.roughness},source}
    } else metrics.timbre=absentMetric('이 프로젝트의 실제 제출 음성이나 확인된 보컬 가이드 분석값이 아직 없어요.')

    const ownRoles=roleKinds(list(profile.roles))
    const partRoles=selectedPart ? roleKinds([
      ...list(selectedPart.collaborationRoles),...list(selectedPart.musicalRoles),...list(selectedPart.musicalRole),
      ...list(selectedPart.role),...list(selectedPart.name)
    ]) : []
    const arrangementRoles=arrangementMatchesProject(project,song) ? roleKinds([
      ...list(project.audioSource.musicalRoles),...list(project.audioSource.musicalRole)
    ]) : []
    const declaredRoles=selectedPart ? (partRoles.length?partRoles:arrangementRoles) : []
    metrics.role=!ownRoles.length
      ? absentMetric('선호 역할을 선택하지 않아 역할 지수는 계산에서 제외해요.','unconfigured')
      : !selectedPart ? absentMetric('함께 부를 Part를 선택하면 프로젝트가 필요한 역할과 비교해요.')
      : !declaredRoles.length ? absentMetric('이 Part의 멜로디·화음 역할이 등록되지 않았어요. 음역 이름만으로 추정하지 않아요.')
      : availableMetric(ownRoles.some(role=>declaredRoles.includes(role))?100:0,
        ownRoles.some(role=>declaredRoles.includes(role))?`${selectedPart.name}에 등록된 역할이 내가 선택한 선호 역할과 겹쳐요.`:`${selectedPart.name}에 등록된 역할과 내가 선택한 선호 역할의 공통 항목이 없어요. 참여에는 제한이 없어요.`,
        {declaredRoles,ownRoles})

    const songId=project.songId || song.id
    const sourceMatchesSong=!project.songId || !song.id || project.songId===song.id
    const ownGenres=projectGenreTags(list(profile.genres))
    const targetGenres=projectGenreTags([...list(project.genres),...list(project.genre),...(sourceMatchesSong?[...list(song.genres),...list(song.genre)]:[])])
    const ownTaste=unique(list(profile.taste).map(normalized))
    const targetTaste=unique([...list(project.taste),...(sourceMatchesSong?list(song.taste):[])].map(normalized))
    const explicitlySelected=Boolean(songId && list(profile.preferredSongIds).includes(songId))
    const comparisons=[]
    if (ownGenres.length && targetGenres.length) comparisons.push(...targetGenres.map(tag=>({kind:'genre',tag,match:ownGenres.includes(tag)})))
    if (ownTaste.length && targetTaste.length) comparisons.push(...targetTaste.map(tag=>({kind:'taste',tag,match:ownTaste.includes(tag)})))
    metrics.taste=explicitlySelected
      ? availableMetric(100,'이 프로젝트의 곡을 내가 함께 부르고 싶은 곡으로 직접 선택했어요.',{songId,explicitlySelected:true})
      : comparisons.length ? availableMetric(100*comparisons.filter(item=>item.match).length/comparisons.length,
        `이 프로젝트 곡의 장르·취향 ${comparisons.length}개 중 내가 등록한 선호와 ${comparisons.filter(item=>item.match).length}개가 겹쳐요.`,{comparisons,explicitlySelected:false})
      : absentMetric(!ownGenres.length && !ownTaste.length
        ? '이 곡에 비교할 선호 장르·취향을 아직 선택하지 않아 취향 지수는 제외해요.'
        : '프로젝트 곡의 비교 가능한 장르·취향 정보가 없어 취향 지수는 제외해요.',!ownGenres.length && !ownTaste.length?'unconfigured':'unavailable')
  }
  const selected=selectedPart && parts.find(part=>part.id===selectedPart.id)
  const canFill=Boolean(selected && !selected.participantId && !selected.participant && ['open','recruiting'].includes(selected.status))
  const rolesFor=part=>roleKinds([...list(part.musicalRoles),...list(part.musicalRole),...list(part.collaborationRoles),...list(part.role),...list(part.name)])
  const occupied=parts.filter(part=>part.participantId || part.participant)
  const coveredRoles=unique(occupied.flatMap(rolesFor))
  const addedRoles=canFill?rolesFor(selected).filter(role=>!coveredRoles.includes(role)):[]
  const ensemble={
    filledParts:occupied.length,totalParts:parts.length,
    projectedFilledParts:occupied.length+Number(canFill),
    addedRoles,selectedPartId:selected?.id || null,
    partFit:selected?evaluatePartFit({rangeData:profile?.rangeData,part:selected}):null,
    // Occupancy describes arrangement coverage, never audible mix quality.
    reason:canFill?`${selected.name}에 참여하면 ${occupied.length}/${parts.length}에서 ${occupied.length+1}/${parts.length} Part를 채워요.${addedRoles.length?' 아직 없는 '+addedRoles.map(role=>role==='melody'?'멜로디':'화음') .join('·')+' 역할을 더해요.':''}`:'참여할 OPEN Part를 선택하면 기존 구성에 더해지는 역할을 확인해요.'
  }
  const available=Object.values(metrics).filter(metric=>Number.isFinite(metric.score))
  const score=null // Requires validated arrangement-aware listening evidence, not an invented weighted mean.
  return {
    method:PROJECT_HARMONY_METHOD,methodLabel:'Part·역할 보완 근거',
    status:source?'evidence-only':'insufficient',score,metrics,ensemble,
    coverage:{available:available.length,total:3,keys:Object.keys(metrics).filter(key=>metrics[key].score!==null)},
    compared:measured.length,missing,
    provenance:{projectId:project.id || null,songId:project.songId || song.id || null,ownFingerprint:validOwn?profile.sampleFeatures.fingerprint || null:null,target:source},
    reasons:[['음색',metrics.timbre.reason],['역할',ensemble.reason+' '+metrics.role.reason],['취향',metrics.taste.reason]]
  }
}
