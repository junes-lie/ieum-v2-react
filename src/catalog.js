import providedSamples from './providedSamples.json' with { type: 'json' }

export const CURRENT_USER_ID = 'jisun'

export const PEOPLE = [
  {
    id: 'jisun', name: 'JISUN', range: 'C3–G4', minMidi: 48, maxMidi: 67,
    voiceType: 'Warm middle', role: 'Tenor · Middle harmony', roles: ['Middle harmony', 'Support'],
    genres: ['Indie', 'Ballad'], taste: ['Acoustic', 'Film soundtrack'], isSelf: true
  },
  {
    id: 'yoonseul', name: '윤슬', range: 'C4–F5', minMidi: 60, maxMidi: 77,
    voiceType: 'Clear upper', role: 'Soprano · Upper harmony', roles: ['Upper harmony', 'Main'],
    genres: ['Pop', 'Ballad'], taste: ['Cinematic', 'Acoustic'],
    compatibility: ['높은 음역이 내 중음 위에 자연스럽게 쌓여요.', '선명한 결이 따뜻한 중음을 가리지 않아요.', 'Upper와 Middle 역할이 분리돼요.', 'Ballad와 영화 음악 취향이 겹쳐요.']
  },
  {
    id: 'doyoon', name: '도윤', range: 'G3–C5', minMidi: 55, maxMidi: 72,
    voiceType: 'Soft middle', role: 'Alto · Support', roles: ['Support', 'Middle harmony'],
    genres: ['R&B', 'Ballad'], taste: ['Acoustic', 'Soul'],
    compatibility: ['서로 겹치는 중음은 화음의 중심을 만들기 좋아요.', '부드러운 결이 내 목소리의 직선적인 어택을 완화해요.', '두 사람이 Main과 Support를 번갈아 맡기 좋아요.', '잔잔한 편곡 취향이 겹쳐요.']
  },
  {
    id: 'luna', name: 'Luna', range: 'D2–E4', minMidi: 38, maxMidi: 64,
    voiceType: 'Deep velvet', role: 'Bass · Low harmony', roles: ['Low harmony', 'Bass foundation'],
    genres: ['Indie', 'Ballad'], taste: ['Acoustic', 'Dream pop'], seed: 337,
    matchReason: '낮은 배음이 안정적이고 현재 두 Track의 밝은 결을 보완해요.',
    compatibility: ['내 중음 아래를 충분히 받쳐 주는 음역이에요.', '어두운 배음과 따뜻한 중음이 대비돼요.', 'Middle과 Bass 역할이 겹치지 않아요.', 'Indie와 Ballad 취향이 겹쳐요.'],
    metrics: { range: 96, timbre: 91, role: 95, taste: 88 }
  },
  {
    id: 'min', name: 'Min', range: 'E2–F4', minMidi: 40, maxMidi: 65,
    voiceType: 'Firm low', role: 'Bass · Foundation', roles: ['Bass foundation', 'Support'],
    genres: ['R&B', 'Acoustic'], taste: ['Soul', 'Pop'], seed: 709,
    matchReason: 'Bass 요구 음역을 모두 포함하고 긴 프레이즈에서 중심이 안정적이에요.',
    compatibility: ['내 중음과 맞닿는 구간이 있어 유니즌을 만들기 좋아요.', '단단한 저음이 내 부드러운 결을 보완해요.', 'Foundation과 Middle 역할을 나누기 좋아요.', 'Acoustic 취향이 겹쳐요.'],
    metrics: { range: 93, timbre: 86, role: 97, taste: 79 }
  },
  { id:'mina', name:'Mina', range:'A3–E5', minMidi:57, maxMidi:76, voiceType:'Warm lead', role:'Vocal A · Main', roles:['Main'], genres:['Pop'], taste:['Ballad'] },
  { id:'sena', name:'Sena', range:'B3–F5', minMidi:59, maxMidi:77, voiceType:'Airy lead', role:'Lead', roles:['Main'], genres:['Dream pop'], taste:['Ambient'] },
  { id:'noa', name:'Noa', range:'D3–A4', minMidi:50, maxMidi:69, voiceType:'Low breath', role:'Vocal A', roles:['Main'], genres:['Indie'], taste:['Dream pop'] },
  { id:'haru', name:'Haru', range:'C4–G5', minMidi:60, maxMidi:79, voiceType:'Bright lead', role:'Lead', roles:['Main'], genres:['K-pop'], taste:['Ballad'] },
  { id:'yun', name:'Yun', range:'G3–D5', minMidi:55, maxMidi:74, voiceType:'Round middle', role:'Alto', roles:['Support'], genres:['K-pop'], taste:['Ballad'] },
  { id:'joon', name:'Joon', range:'C3–G4', minMidi:48, maxMidi:67, voiceType:'Dry middle', role:'Vocal A', roles:['Main'], genres:['Film soundtrack'], taste:['Jazz'] }
]

export const PERSON_BY_ID = Object.fromEntries(PEOPLE.map(person => [person.id, person]))

export function personFromName(name) {
  if (!name) return null
  return PEOPLE.find(person => person.name.toLocaleLowerCase() === String(name).toLocaleLowerCase()) || null
}

export const FINDER_CANDIDATES = ['luna', 'min'].map(id => PERSON_BY_ID[id])

export const SAMPLE_SONGS = providedSamples
