import audio from './licensedDuetAudio.json' with {type:'json'}

// Existing permitted music, not generated participant performances.
// The extracted vocal stack is NOT registered as either person's Track or
// a Part-specific guide. No guessed range/key/lyric timestamps are supplied.
export const LICENSED_DUET_SONG_ID='slowly-coloring-us'
export const LICENSED_DUET_ARRANGEMENT=Object.freeze({
  ...audio,kind:'project-arrangement',songId:LICENSED_DUET_SONG_ID,
  key:'원키',keyStatus:'original-untransposed; tonal key unconfirmed',
  revision:'musebox-cc0-mdx-v1',
  listeningNote:'분리 반주에는 원곡 보컬이 일부 남을 수 있어요. Part별 음역과 가사는 확인 중이에요.'
})
export const LICENSED_DUET_PROJECT={
  id:'slowly-coloring-us-duet-v1',songId:LICENSED_DUET_SONG_ID,
  title:'천천히 물드는 우리',name:'원키 · 듀엣 연습',key:'원키',keyLocked:true,
  seed:'ieum:musebox:slowly-coloring-us:duet:v1',
  partCount:2,totalParts:2,partIds:['vocal-a','vocal-b'],
  parts:[
    {id:'vocal-a',name:'Vocal A',ko:'보컬 A',color:'#3b82f6',status:'open'},
    {id:'vocal-b',name:'Vocal B',ko:'보컬 B',color:'#d6b895',status:'open'}
  ],
  status:'RECRUITING',progress:0,lyrics:[],
  recordingDuration:audio.duration,audioSource:LICENSED_DUET_ARRANGEMENT
}
export const LICENSED_DUET_SONG={
  id:LICENSED_DUET_SONG_ID,title:'천천히 물드는 우리',artist:'MUSEBOX',
  genre:'Pop ballad',duration:'06:37',cover:'/artwork/cover-folk.webp',
  note:'기존 공개 듀엣 · 분리 반주 연습',lyrics:[],
  audioSource:LICENSED_DUET_ARRANGEMENT,projects:[LICENSED_DUET_PROJECT]
}
