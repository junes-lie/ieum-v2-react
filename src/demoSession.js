import samples from './providedSamples.json' with {type:'json'}
// Presentation fixtures use separate storage. Never seed the real user's profile.
export const DEMO_SCENARIOS = [
  {id:'first-visit',label:'프로필 미등록',detail:'첫 방문 · 프로필과 참여 프로젝트 없음',flow:'Flow 1 · UF01 / UF03',screen:'home',profile:false,entry:true},
  {id:'profile-ready',label:'프로필 등록 완료',detail:'목소리 준비됨 · OPEN Part 직접 참여',flow:'Flow 2A · UF01',screen:'home',profile:true,entry:true},
  {id:'invitation',label:'프로젝트 초대받음',detail:'받은 초대 확인 · 지정 Part 수락 또는 거절',flow:'Flow 2B · UF02',screen:'projects',profile:true,receivedInvitation:true,entry:true},
  {id:'workspace',label:'프로젝트 참여 중',detail:'내 Part 배정됨 · 아직 내 녹음 미제출',flow:'Flow 2C / 2D · UF05 / UF09',screen:'workspace',profile:true,joined:true,entry:true},
  {id:'music-a',label:'음악 녹음 A',detail:'오늘 같은 날 · 첫 목소리 직접 녹음',screen:'workspace',profile:true,music:true,musicPartId:'voice-a',actorId:'jisun',actorName:'시연 A'},
  {id:'music-b',label:'음악 녹음 B',detail:'두 번째 목소리 제출 → 자동 완성',screen:'workspace',profile:true,music:true,musicPartId:'voice-b',actorId:'demo-music-b',actorName:'시연 B'},
  // Keep existing deep links for QA/bookmarks; these are not user-flow entry choices.
  {id:'participate',label:'참여 직전',detail:'프로필 있음 · OPEN Part 선택',screen:'detail',profile:true},
  {id:'recording',label:'녹음 준비',detail:'Guide·가사·녹음 조작 확인',screen:'record',profile:true,joined:true},
  {id:'search',label:'검색',detail:'곡·프로젝트·완성곡 탐색',screen:'search',profile:true},
  {id:'complete',label:'완성곡 감상',detail:'시연 음원 재생·저장',screen:'complete',profile:true}
]
const scene = typeof location==='undefined' ? null : new URLSearchParams(location.search).get('scene')
const requestedRun = typeof location==='undefined' ? null : new URLSearchParams(location.search).get('run')
export const demoRun = /^[a-zA-Z0-9-]{1,80}$/.test(requestedRun || '') ? requestedRun : null
export const demoScenario = DEMO_SCENARIOS.find(item=>item.id===scene) || null
export const demoStorageKey = key => demoScenario ? `ieum-demo:${demoScenario.id}:${demoRun&&!demoScenario.music?`run:${demoRun}:`:''}${key}` : key
export const demoTrackDatabaseName = (id,run=null) => `ieum-v2-demo-records:${id?.startsWith('music-')?'music':`${id}${run?':run:'+run:''}`}`
export const trackDatabaseName = demoScenario ? demoTrackDatabaseName(demoScenario.id,demoRun) : 'ieum-v2-records'
export const demoReceivedInvitation = () => ({id:'presentation-invitation-tenor',recipientId:'jisun',projectId:'ieum-thousand-years-v7',songId:'a-thousand-years',projectName:'Original C · Quartet',songTitle:'오늘 같은 날',partId:'tenor',partName:'Tenor',senderId:'yoonseul',senderName:'윤슬',status:'pending',demo:true})
export const demoProfile = () => ({
  name:'시연 프로필',range:'C3–F5 · 시연값',rangeData:{lowMidi:48,highMidi:77},
  roles:['Tenor'],genres:['Pop ballad'],taste:[],preferredSongIds:['a-thousand-years'],
  voiceType:'화면 시연용 예시 · 실제 측정값 아님',sampleSong:'오늘 같은 날 · 제공곡 예시',
  sampleUrl:samples[1].audioFile,sampleDuration:samples[1].duration,
  identity:{status:'blocked',reason:'presentation-fixture'},demo:true
})
