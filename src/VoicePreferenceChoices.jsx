import React, {useState} from 'react'
import Icon from './Icons.jsx'

export const VOICE_ROLES = ['메인 멜로디', '화음·코러스']
export const VOICE_GENRES = ['발라드', '팝', 'R&B·소울', '록', '힙합', '재즈']
const roleAliases={Main:'메인 멜로디',Lead:'메인 멜로디','Upper harmony':'화음·코러스','Middle harmony':'화음·코러스','Lower harmony':'화음·코러스',Harmony:'화음·코러스',Support:'화음·코러스'}
const genreAliases={Ballad:'발라드',Pop:'팝','R&B':'R&B·소울',Soul:'R&B·소울',Rock:'록','Hip hop':'힙합',Jazz:'재즈'}
export const preferenceValues = profile => ({roles:[...new Set((profile?.roles || []).map(value=>roleAliases[value] || value))], genres:[...new Set((profile?.genres || []).map(value=>genreAliases[value] || value))], taste:[...(profile?.taste || [])], preferredSongIds:[...new Set(profile?.preferredSongIds || [])]})

export default function VoicePreferenceChoices({values, change, songs, songSaves=[], disabled=false}) {
  const [query,setQuery]=useState('')
  const [savedOnly,setSavedOnly]=useState(false)
  const selected=values.preferredSongIds || []
  const toggle=(key,value)=>change({...values,[key]:(values[key] || []).includes(value)?values[key].filter(item=>item!==value):[...new Set([...(values[key] || []),value])]})
  const matches=songs.filter(song=>(!savedOnly || songSaves.some(save=>save.songId===song.id)) && `${song.title} ${song.artist}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const circle=(key,value,index)=> <button type="button" key={value} className={`preference-circle ${key==='roles'?'role-circle':'genre-circle'} size-${index%3}`} aria-pressed={(values[key] || []).includes(value)} disabled={disabled} onClick={()=>toggle(key,value)}><span>{value}</span><span className="preference-check" aria-hidden="true">{(values[key] || []).includes(value)&&<Icon name="check" size={14}/>}</span></button>
  return <section className="voice-preference-choices" aria-label="보컬 성향 선택">
    <p>모두 선택 사항이에요. 함께 부르고 싶은 모습을 여러 개 골라 주세요.</p>
    <fieldset disabled={disabled}><legend>선호 역할</legend><p>어떤 역할로 함께 부르고 싶나요?</p><div className="preference-orbits role-orbits">{VOICE_ROLES.map((value,index)=>circle('roles',value,index))}</div>{(values.roles || []).filter(value=>!VOICE_ROLES.includes(value)).map(value=><button className="secondary" type="button" key={value} onClick={()=>toggle('roles',value)}>{value} 선택 해제</button>)}</fieldset>
    <fieldset disabled={disabled}><legend>선호 장르</legend><p>어떤 장르를 즐겨 부르나요?</p><div className="preference-orbits genre-orbits">{VOICE_GENRES.map((value,index)=>circle('genres',value,index))}</div>{(values.genres || []).filter(value=>!VOICE_GENRES.includes(value)).map(value=><button className="secondary" type="button" key={value} onClick={()=>toggle('genres',value)}>{value} 선택 해제</button>)}</fieldset>
    <fieldset disabled={disabled}><legend>음악 취향 · 함께 부르고 싶은 곡</legend>
      <p>함께 불러보고 싶은 곡이 있나요?</p><label className="preference-search">곡명 또는 아티스트 검색<input type="search" value={query} onChange={event=>setQuery(event.target.value)} /></label>
      <button type="button" className="secondary preference-saved-filter" aria-pressed={savedOnly} onClick={()=>setSavedOnly(value=>!value)}>저장곡에서 선택</button>
      <div className="preference-orbits song-orbits">{matches.map((song,index)=><div className="preference-song" key={song.id}><button type="button" className={`preference-circle song-circle size-${index%3}`} aria-label={`${song.title} · ${song.artist}`} aria-pressed={selected.includes(song.id)} onClick={()=>toggle('preferredSongIds',song.id)}>{song.albumImage?<img src={song.albumImage} alt="" onError={event=>{event.currentTarget.hidden=true}}/>:null}<span>{song.title}</span><span className="preference-check" aria-hidden="true">{selected.includes(song.id)&&<Icon name="check" size={14}/>}</span></button><small>{song.artist}</small></div>)}</div>
      {matches.length===0&&<p role="status">{savedOnly&&!songSaves.length?'저장한 곡이 아직 없어요. 검색해서 선택할 수 있어요.':'검색 결과가 없어요. 다른 곡명이나 아티스트를 입력해 보세요.'}</p>}
      {selected.length>0&&<div className="preference-selected" aria-label="선택한 곡">{songs.filter(song=>selected.includes(song.id)).map(song=><button type="button" key={song.id} aria-label={`${song.title} 선택 해제`} onClick={()=>toggle('preferredSongIds',song.id)}>{song.title} <Icon name="close" size={12}/></button>)}</div>}
      {(values.taste || []).length>0&&<div className="preference-selected"><p>이전에 저장한 취향</p>{values.taste.map(value=><button type="button" key={value} onClick={()=>toggle('taste',value)} aria-label={`${value} 이전 취향 해제`}>{value} <Icon name="close" size={12}/></button>)}</div>}
    </fieldset>
  </section>
}
