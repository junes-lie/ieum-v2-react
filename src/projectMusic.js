// Explicit Project arrangement registration. Voice Setup samples stay independent.
export const WARM_SONG_ID = 'ieum-original-warm-unison-v1'
export const WARM_PROJECT_ID = 'ieum-project-warm-unison-v1'
export const WARM_ARRANGEMENT = Object.freeze({
  kind:'project-arrangement',songId:WARM_SONG_ID,key:'원키',revision:'warm-unison-intro3-v1',duration:22,
  sourceSha256:'7ef11d5e7d574134154c7fddc3022654feec474ac5cba70ed24c606232ca0eb9',
  backingFile:'/audio/project-warm-unison-v1/backing.mp3',
  backingSha256:'8120a09591a030c6e04019e6aa7bd5c44c29eac36df20617da489932c311c5e1',
  referenceFile:'/audio/project-warm-unison-v1/reference.mp3',
  referenceSha256:'b1c604ebffb9acb51ed385a0fbbdc2646db4cc7381c74211fef7d50caf5c73a3',
  keyStatus:'original-untransposed; tonal key unconfirmed',
  sourceStart:28.7,sourceEnd:50.7,lyricOffset:3,
  lineage:{sampleId:'ieum-ai-warm-direct-v1-sample',
    sampleSha256:'6db2b97aae5a644e2fe46d7aeef097e7e665d924be6f3efbe5c22e3b5dd15a47',
    excerptBackingSha256:'6bc86dc622c9dcc25f2496f59986009531389c07e01760339c6e3c315afbd736',
    leadInSha256:'6edc7bf845a4b43b5abf6c500c4ae4c108a47ef9a936459adb74b4aea81d798b'},
  lyricTimingStatus:'existing automatic word alignment; listening acceptance pending'
})
export const WARM_LYRICS = [{time:3,text:'오늘도 함께해요'},{time:11.2,text:'우리 함께 걸어요'},{time:16.96,text:'작은 노래 모아서'}]
const parts = [
  {id:'voice-a',name:'Voice A',ko:'보컬 A',color:'#3b82f6',range:'F♯3–E♭4',minMidi:54,maxMidi:63,participantId:null,participant:null,status:'open'},
  {id:'voice-b',name:'Voice B',ko:'보컬 B',color:'#d6b895',range:'F♯3–E♭4',minMidi:54,maxMidi:63,participantId:null,participant:null,status:'open'}
]
export const WARM_PROJECT = {id:WARM_PROJECT_ID,songId:WARM_SONG_ID,name:'원키 · 22초 유니즌',title:'천천히 함께',key:'원키',keyLocked:true,
  seed:'ieum:original:warm:unison:intro3:v1',partCount:2,totalParts:2,partIds:parts.map(p=>p.id),parts,
  status:'RECRUITING',progress:0,recordingDuration:22,lyrics:WARM_LYRICS,audioSource:WARM_ARRANGEMENT}
export const WARM_SONG = {id:WARM_SONG_ID,title:'천천히 함께',artist:'IEUM Originals',genre:'Acoustic pop',duration:'00:22',
  cover:'/artwork/cover-folk.webp',note:'같은 멜로디를 두 목소리로 부르는 22초 시연곡 · 원키 유지',
  audioSource:WARM_ARRANGEMENT,lyrics:WARM_LYRICS,projects:[WARM_PROJECT]}

// No prefilled audio Tracks: both roles must record and submit through Recorder.
export function musicDemoProject(scenario) {
  if(!scenario?.music)return null
  return {...WARM_PROJECT,demo:true,id:'demo:'+WARM_PROJECT_ID,ownerPartId:scenario.musicPartId,
    name:'실제 음악 녹음 · A/B 시연',parts:parts.map((p,i)=>({...p,participantId:i?'demo-music-b':'jisun',participant:i?'시연 B':'시연 A',status:'ready'}))}
}
