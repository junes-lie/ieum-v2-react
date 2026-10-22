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
  if (!measured) return {status:'profile-required',eligible:false,reasons:['편한 음역을 먼저 측정해 주세요.']}
  const base = readRange(part)
  if (!base || !Number.isFinite(transposeSemitones)) return {status:'unavailable',eligible:false,reasons:['이 Part의 실제 요구 음역이 아직 준비되지 않았어요.']}
  const requiredRange = {lowMidi:base.lowMidi+transposeSemitones,highMidi:base.highMidi+transposeSemitones}
  const lowMargin = requiredRange.lowMidi-measured.lowMidi
  const highMargin = measured.highMidi-requiredRange.highMidi
  const eligible = lowMargin>=0 && highMargin>=0
  const reasons = eligible ? ['현재 Key의 요구 음역이 측정된 편한 음역 안에 있어요.'] : [lowMargin<0?'이 Part의 낮은 음이 측정된 음역보다 낮아요.':null,highMargin<0?'이 Part의 높은 음이 측정된 음역보다 높아요.':null].filter(Boolean)
  const tessitura = readRange(part.tessitura || (Number.isFinite(part.tessituraLowMidi)&&Number.isFinite(part.tessituraHighMidi)?{lowMidi:part.tessituraLowMidi,highMidi:part.tessituraHighMidi}:null))
  const comfortableRange = readRange(rangeData.comfortableRange) || measured
  const tessituraFit = tessitura ? comfortableRange.lowMidi<=tessitura.lowMidi+transposeSemitones && comfortableRange.highMidi>=tessitura.highMidi+transposeSemitones : null
  if (tessituraFit!==null) reasons.push(tessituraFit?'주로 부르는 구간도 측정된 편한 음역 안에 있어요.':'주로 부르는 구간은 측정된 편한 음역과 일부 겹치지 않아요.')
  const feasible = eligible && tessituraFit !== false
  return {status:feasible?'eligible':'ineligible',eligible:feasible,lowMargin,highMargin,requiredRange,tessituraFit,reasons}
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

// Report observable comparisons only; normalized descriptors are not a harmony score.
export function evaluateProjectHarmony({profile,parts,tracks,selectedPart,currentUserId}) {
  const own=profile?.sampleFeatures
  const valid=features=>isSupportedVoiceAnalysis(features)&&['brightness','roughness'].every(key=>Number.isFinite(features[key])&&features[key]>=0&&features[key]<=1)
  const members=parts.filter(part=>part.participantId||part.participant).filter(part=>part.participantId!==currentUserId)
  const measured=members.flatMap(part=>valid(tracks[part.id]?.features)?[{part,features:tracks[part.id].features}]:[])
  const missing=members.filter(part=>!measured.some(row=>row.part.id===part.id))
  const timbre=!valid(own)
    ?(profile?.demo?'시연 프로필에는 실제 녹음 분석값이 없어요. Voice Profile 샘플을 직접 등록해 주세요.':'내 Voice Sample의 음색 분석값이 없어요. 샘플을 등록하거나 다시 녹음해 주세요.')
    :!measured.length?'기존 참여자의 제출 Track 음색 분석값이 없어 비교할 수 없어요.'
    :measured.map(({part,features})=>`${part.participant||part.name}와 밝기 차이 ${Math.round(Math.abs(own.brightness-features.brightness)*100)}, 거칠기 차이 ${Math.round(Math.abs(own.roughness-features.roughness)*100)}`).join(' · ')+' (0–100 분석 척도 차이 · 적합도 점수 아님)'
  const preferences=members.flatMap(part=>{const other=tracks[part.id]?.preferences||part.preferences;return other?[{part,shared:sharedVoicePreferences(profile,other)}]:[]})
  const taste=!preferences.length?'기존 참여자의 선호 장르·음악 취향이 등록되지 않아 비교할 수 없어요.':preferences.map(({part,shared})=>`${part.participant||part.name}: ${[...shared.genres,...shared.taste,...shared.songIds].join(' · ')||'공통으로 등록한 취향 없음'}`).join(' / ')
  return {status:valid(own)&&measured.length?'compared':'insufficient',compared:measured.length,missing:missing.map(part=>part.participant||part.name),reasons:[['음색',timbre],['역할',selectedPart?`기존 ${members.map(part=>part.name).join(' · ')||'참여자 없음'} 구성에 ${selectedPart.name} 역할을 더해요.`:'OPEN Part를 선택하면 역할 구성을 비교해요.'],['취향',taste]]}
}
