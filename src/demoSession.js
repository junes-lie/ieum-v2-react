// Presentation fixtures use separate storage. Never seed the real user's profile.
export const DEMO_SCENARIOS = [
  {id:'music-a',label:'음악 녹음 A',detail:'천천히 함께 · 첫 목소리 직접 녹음',screen:'workspace',profile:true,music:true,musicPartId:'voice-a',actorId:'jisun',actorName:'시연 A'},
  {id:'music-b',label:'음악 녹음 B',detail:'두 번째 목소리 제출 → 자동 완성',screen:'workspace',profile:true,music:true,musicPartId:'voice-b',actorId:'demo-music-b',actorName:'시연 B'},
  {id:'first-visit',label:'첫 방문',detail:'프로필 없음 · 홈에서 탐색',screen:'home',profile:false},
  {id:'profile-ready',label:'프로필 등록 완료',detail:'프로필 있음 · 홈 추천 확인',screen:'home',profile:true},
  {id:'participate',label:'참여 직전',detail:'프로필 있음 · OPEN Part 선택',screen:'detail',profile:true},
  {id:'workspace',label:'작업실',detail:'내 Part 배정 · 2/4 Track',screen:'workspace',profile:true,joined:true},
  {id:'recording',label:'녹음 준비',detail:'Guide·가사·녹음 조작 확인',screen:'record',profile:true,joined:true},
  {id:'search',label:'검색',detail:'곡·프로젝트·완성곡 탐색',screen:'search',profile:true},
  {id:'complete',label:'완성곡 감상',detail:'시연 음원 재생·저장',screen:'complete',profile:true}
]
const scene = typeof location==='undefined' ? null : new URLSearchParams(location.search).get('scene')
export const demoScenario = DEMO_SCENARIOS.find(item=>item.id===scene) || null
export const demoStorageKey = key => demoScenario ? `ieum-demo:${demoScenario.id}:${key}` : key
export const demoTrackDatabaseName = id => `ieum-v2-demo-records:${id?.startsWith('music-')?'music':id}`
export const trackDatabaseName = demoScenario ? demoTrackDatabaseName(demoScenario.id) : 'ieum-v2-records'
export const demoProfile = () => ({
  name:'시연 프로필',range:'C3–F5 · 시연값',rangeData:{lowMidi:48,highMidi:77},
  roles:['Tenor'],genres:['Pop ballad'],taste:[],preferredSongIds:['a-thousand-years'],
  voiceType:'화면 시연용 예시 · 실제 측정값 아님',sampleSong:'시연용 합성 Stem',
  sampleUrl:'/demo-stems/soprano.wav',sampleDuration:10,
  identity:{status:'blocked',reason:'presentation-fixture'},demo:true
})
