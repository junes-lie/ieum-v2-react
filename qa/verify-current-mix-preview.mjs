import assert from 'node:assert/strict'
import {readFile,writeFile,unlink} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {fork} from 'node:child_process'
import {pathToFileURL,fileURLToPath} from 'node:url'
import {join} from 'node:path'

// Reuse the explicitly approved TEMP audio runtime. Native audio stays in a
// disposable child process; this test installs nothing and starts no AI model.
if(process.argv.includes('--native')) {
  const require=createRequire(join(process.env.IEUM_WEB_AUDIO_ROOT,'package.json'))
  const {AudioContext,OfflineAudioContext}=await import(pathToFileURL(require.resolve('node-web-audio-api')).href)
  class SilentContext extends AudioContext {constructor(){super({sinkId:{type:'none'},sampleRate:44100})}}
  globalThis.window={AudioContext:SilentContext,OfflineAudioContext}
  const {createPreviewMix}=await import('../src/audio.js')
  const wav=(frequency)=>{
    const rate=44100,n=Math.round(rate*.6),bytes=Buffer.alloc(44+n*2)
    bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVE',8);bytes.write('fmt ',12)
    bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(rate,24)
    bytes.writeUInt32LE(rate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(n*2,40)
    for(let i=Math.round(rate*.2);i<n;i++)bytes.writeInt16LE(Math.round(.04*Math.sin(2*Math.PI*frequency*i/rate)*32767),44+i*2)
    return bytes
  }
  const inputs=[330,440,550,660].map((hz,i)=>({partId:`part-${i}`,blob:new Blob([wav(hz)],{type:'audio/wav'}),syncOffsetMs:200,duration:999}))
  const before=await Promise.all(inputs.map(async track=>Buffer.from(await track.blob.arrayBuffer())))
  for(const count of [1,2,3,4]) {
    const result=await createPreviewMix({tracks:inputs.slice(0,count),duration:0})
    try {
      assert.ok(Math.abs(result.duration-.6)<1/44100,'Trimmed 0.4s audio plus 0.2s tail; stale metadata cannot extend preview')
      const bytes=Buffer.from(await result.blob.arrayBuffer()),rms=(from,to)=>{
        let power=0,n=0
        for(let i=Math.round(from*44100);i<Math.round(to*44100);i++){const value=bytes.readInt16LE(44+i*4)/32768;power+=value*value;n++}
        return Math.sqrt(power/n)
      }
      assert.ok(rms(.02,.08)>.005,'Audio starts at Project time zero after trimming the encoded lead-in')
      assert.ok(rms(.5,.58)<.001,'Trimmed lead-in must not become a silent extension')
    }finally{URL.revokeObjectURL(result.url)}
  }
  await assert.rejects(createPreviewMix({tracks:[{...inputs[0],syncOffsetMs:600}],duration:0}),/정렬 시간이 올바르지/)
  for(let i=0;i<inputs.length;i++)assert.deepEqual(Buffer.from(await inputs[i].blob.arrayBuffer()),before[i])
  process.send({passed:true});process.exit(0)
} else {
  assert.ok(process.env.IEUM_WEB_AUDIO_ROOT,'Set IEUM_WEB_AUDIO_ROOT to the already approved TEMP runtime')
  await new Promise((resolve,reject)=>{
    const child=fork(fileURLToPath(import.meta.url),['--native'],{execArgv:['--max-old-space-size=128'],stdio:['ignore','inherit','inherit','ipc']})
    let passed=false
    const timer=setTimeout(()=>{child.kill();reject(new Error('Preview native trial timed out'))},30000)
    child.on('message',result=>{passed=result.passed===true})
    child.on('error',reject)
    child.on('exit',code=>{clearTimeout(timer);code===0&&passed?resolve():reject(new Error(`Native preview exited ${code}`))})
  })
  // Only this changed control: real React effects in Node DOM, DSP boundary
  // injected here because actual DSP was exercised above. No Computer Use.
  const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client')
  const {Window}=await import('happy-dom'),{transformWithOxc}=await import('vite')
  const dom=new Window({url:'http://localhost/'})
  for(const key of ['window','document','navigator','location','localStorage','sessionStorage','HTMLElement','Event','Image','ResizeObserver'])Object.defineProperty(globalThis,key,{value:key==='window'?dom:dom[key],configurable:true,writable:true})
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;dom.AudioContext=class{}
  dom.HTMLMediaElement.prototype.play=async function(){this.qaPlaying=true}
  dom.HTMLMediaElement.prototype.pause=function(){this.qaPlaying=false}
  const paths=['.qa-current-mix-app.mjs','.qa-current-mix-icons.mjs','.qa-current-mix-choices.mjs'].map(name=>new URL(`../src/${name}`,import.meta.url))
  let root
  try {
    for(const [index,name] of [[1,'Icons.jsx'],[2,'VoicePreferenceChoices.jsx']])await writeFile(paths[index],(await transformWithOxc(await readFile(new URL(`../src/${name}`,import.meta.url),'utf8'),name,{jsx:{runtime:'classic'}})).code.replace('./Icons.jsx','./.qa-current-mix-icons.mjs'))
    const source=(await readFile(new URL('../src/App.jsx',import.meta.url),'utf8')).replace('  createPreviewMix,','  createPreviewMix as unusedPreviewMix,')+'\nexport {CurrentMixPanel}; const createPreviewMix=async options=>{globalThis.qaPreviewCalls.push(options);return {url:"blob:aligned-preview",duration:.6}};'
    await writeFile(paths[0],(await transformWithOxc(source,'App.jsx',{jsx:{runtime:'classic'}})).code.replace('./Icons.jsx','./.qa-current-mix-icons.mjs').replace('./VoicePreferenceChoices.jsx','./.qa-current-mix-choices.mjs'))
    const {CurrentMixPanel}=await import(paths[0].href)
    globalThis.qaPreviewCalls=[]
    const parts=['lead','harmony'].map(id=>({id,name:id,status:'submitted'}))
    const tracks=Object.fromEntries(parts.map(part=>[part.id,{id:part.id,partId:part.id,participant:'QA',blob:new Blob(['original']),url:`blob:original-${part.id}`,syncOffsetMs:200,duration:999,kind:'project-track'}]))
    const before=structuredClone(tracks),mix={url:'blob:final-mix',duration:12},container=document.createElement('div')
    document.body.append(container);root=createRoot(container)
    const settle=()=>act(async()=>{await new Promise(resolve=>setTimeout(resolve,20))})
    const click=async selector=>{const button=container.querySelector(selector);assert.ok(button,selector);await act(async()=>button.click());await settle()}
    await act(async()=>root.render(React.createElement(CurrentMixPanel,{parts,project:{id:'qa-project'},projectTracks:tracks,mix,waveform:false,openVocalProfile:()=>{}})));await settle()
    assert.equal(qaPreviewCalls.at(-1).tracks.length,2)
    await click('[data-part="harmony"] .include-toggle')
    assert.deepEqual(qaPreviewCalls.at(-1).tracks.map(track=>track.partId),['lead'])
    assert.equal(qaPreviewCalls.at(-1).duration,0)
    assert.equal(container.querySelector('audio').getAttribute('src'),'blob:aligned-preview')
    await click('.play-btn');const audio=container.querySelector('audio');assert.equal(audio.qaPlaying,true)
    await click('[data-part="lead"] .include-toggle')
    assert.equal(audio.qaPlaying,false);assert.equal(container.querySelector('.play-btn').disabled,true)
    assert.ok(container.textContent.includes('들을 트랙을 하나 이상 선택해 주세요.'))
    await click('[data-part="lead"] .row-track-play')
    assert.equal(container.querySelector('audio').getAttribute('src'),'blob:original-lead','Individual Take remains available unchanged')
    assert.equal(container.querySelector('audio').qaPlaying,true)
    await click('.listening-context button');assert.equal(container.querySelector('.play-btn').disabled,true)
    for(const id of Object.keys(tracks))assert.deepEqual(await tracks[id].blob.text(),await before[id].blob.text())
    assert.deepEqual(mix,{url:'blob:final-mix',duration:12})
    console.log('PASS current Mix: native 1–4 Track lead-in alignment/duration/original preservation; React selection, play, zero selection, solo/back, unchanged final Mix. Physical listening remains unverified.')
  }finally{
    if(root)await act(async()=>root.unmount())
    await dom.happyDOM.close()
    await Promise.all(paths.map(path=>unlink(path).catch(()=>{})))
  }
}
