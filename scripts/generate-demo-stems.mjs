import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'public', 'demo-stems')
fs.mkdirSync(output, { recursive: true })

const sampleRate = 44100
const tempo = 84
const beat = 60 / tempo
const vowels = [
  { f:[800,1150,2900], bw:[90,110,180] },
  { f:[420,1900,2700], bw:[70,120,180] },
  { f:[350,900,2200], bw:[65,100,170] },
  { f:[500,1500,2500], bw:[75,120,180] }
]
const parts = [
  { id:'soprano', participant:'윤슬', base:261.63, gain:.32, pan:-.22, notes:[0,4,7,9,7,4,5,2,0,4,7,12,11,9,7,4] },
  { id:'alto', participant:'도윤', base:196, gain:.34, pan:.04, notes:[0,3,4,5,4,3,0,-2,0,3,5,7,5,4,3,0] },
  { id:'bass', participant:'Luna', base:98, gain:.38, pan:.22, notes:[0,0,5,5,3,3,0,0,-2,-2,3,3,0,0,-5,-5] }
]

function formantGain(frequency, vowel) {
  let gain = .025
  for (let i=0;i<vowel.f.length;i++) {
    const distance = (frequency-vowel.f[i])/vowel.bw[i]
    gain += Math.exp(-.5*distance*distance) * [1,.72,.32][i]
  }
  return gain
}

function synth(part) {
  const duration = part.notes.length * beat + .35
  const samples = new Float32Array(Math.ceil(duration * sampleRate))
  let noiseState = 193 + part.id.length * 71
  const noise = () => { noiseState=(noiseState*16807)%2147483647; return noiseState/1073741823.5-1 }
  for (let noteIndex=0;noteIndex<part.notes.length;noteIndex++) {
    const start = Math.floor(noteIndex*beat*sampleRate)
    const frames = Math.floor((beat*.94)*sampleRate)
    const vowel = vowels[noteIndex%vowels.length]
    const target = part.base * 2 ** (part.notes[noteIndex]/12)
    for (let i=0;i<frames && start+i<samples.length;i++) {
      const t=i/sampleRate
      const local=i/frames
      const attack=Math.min(1,local/.11)
      const release=Math.min(1,(1-local)/.18)
      const phrase=.84+.16*Math.sin(Math.PI*local)
      const env=Math.max(0,Math.min(attack,release))*phrase
      const vibrato=1+Math.sin(2*Math.PI*(5.15+noteIndex*.012)*t)*(.0026+.0014*Math.min(1,t/.25))
      const fundamental=target*vibrato
      let value=0
      for(let harmonic=1;harmonic<=34;harmonic++) {
        const frequency=fundamental*harmonic
        if(frequency>sampleRate*.45) break
        const spectral=formantGain(frequency,vowel)/(harmonic**1.12)
        value += Math.sin(2*Math.PI*frequency*t + harmonic*.17) * spectral
      }
      const consonant = local<.035 ? noise()*(1-local/.035)*.11 : 0
      const breath = noise()*.012*(.35+.65*Math.sin(Math.PI*local))
      samples[start+i] += Math.tanh(value*1.9+consonant+breath)*env*part.gain
    }
  }
  return samples
}

function wav(samples) {
  const buffer=Buffer.alloc(44+samples.length*2)
  buffer.write('RIFF',0); buffer.writeUInt32LE(36+samples.length*2,4); buffer.write('WAVE',8)
  buffer.write('fmt ',12); buffer.writeUInt32LE(16,16); buffer.writeUInt16LE(1,20); buffer.writeUInt16LE(1,22)
  buffer.writeUInt32LE(sampleRate,24); buffer.writeUInt32LE(sampleRate*2,28); buffer.writeUInt16LE(2,32); buffer.writeUInt16LE(16,34)
  buffer.write('data',36); buffer.writeUInt32LE(samples.length*2,40)
  for(let i=0;i<samples.length;i++) buffer.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),44+i*2)
  return buffer
}

const manifest=[]
for(const part of parts){
  const filename=`${part.id}.wav`
  fs.writeFileSync(path.join(output,filename),wav(synth(part)))
  manifest.push({partId:part.id,participant:part.participant,file:`/demo-stems/${filename}`,source:'IEUM local formant singing synthesizer v2',disclosure:'합성 데모 보컬 · 실제 사람 녹음/협업 결과 아님',license:'Project-generated demo asset'})
}
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({version:2,tempo,generatedAt:new Date().toISOString(),tracks:manifest},null,2))
console.log(`Generated ${manifest.length} disclosed demo stems in ${output}`)
