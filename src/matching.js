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
  const shared = key => {
    const own = new Set((profile?.[key] || []).map(value=>String(value).trim().toLocaleLowerCase()))
    return [...new Set(candidate?.[key] || [])].filter(value=>own.has(String(value).trim().toLocaleLowerCase()))
  }
  const genres = shared('genres')
  const taste = shared('taste')
  return {genres,taste,count:genres.length+taste.length}
}
