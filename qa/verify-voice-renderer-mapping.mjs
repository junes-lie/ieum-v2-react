import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import { buildVoiceLayer } from '../src/voiceAnalysis.js'

// Exercise the existing particle builder without creating a second renderer.
// Controlled feature fixtures are not measured voices or perceptual evidence.
const source = await fs.readFile(new URL('../src/resonanceWebGL.js', import.meta.url), 'utf8')
const boundary = source.indexOf('const VERTEX_SHADER =')
assert.ok(boundary > 0, 'Renderer extraction boundary changed')
const context = vm.createContext({})
vm.runInContext(`${source.slice(0, boundary)}; globalThis.probe = buildParticles`, context)
const features = {
  fingerprint:'controlled-mapping-fixture', brightness:.3, low:.33,
  dynamicRange:.3, spectralFlux:.3, roughness:.3, energy:.3,
  activeRatio:.5, articulation:.3, pitchVariation:.3, envelope:[.2,.4]
}
const seed = 'mapping-research'
const layer = buildVoiceLayer(seed, 'soprano', features)
const render = value => context.probe({ slots:[value], projectSeed:seed, mobile:true })
// Hold placement randomness constant to isolate the actual control path.
const mapped = (field, value) => ({ ...buildVoiceLayer(seed, 'soprano', { ...features, [field]:value }), signature:layer.signature })
const changedChannel = (a,b,offset) => {
  const limit = Math.min(a.data.length,b.data.length)
  for(let i=offset;i<limit;i+=11) if(a.data[i]!==b.data[i]) return true
  return false
}
const rows = []
for(const [field,offset,label] of [
  ['dynamicRange',2,'lateral spread'], ['roughness',9,'micro motion'],
  ['spectralFlux',3,'travel speed'], ['energy',5,'grain size'],
  ['pitchVariation',9,'micro motion'], ['articulation',6,'filament opacity']
]) {
  const low=render(mapped(field,.1)), high=render(mapped(field,.8))
  assert.ok(changedChannel(low,high,offset), `${field} does not reach ${label}`)
  rows.push({input:field,observedControl:label,changed:true})
}
const dark=render(mapped('brightness',.1)), bright=render(mapped('brightness',.8))
assert.ok(bright.grainVertexCount>dark.grainVertexCount)
rows.push({input:'brightness',observedControl:'grain count',low:dark.grainVertexCount,high:bright.grainVertexCount})
const short=render(mapped('activeRatio',.1)), sustained=render(mapped('activeRatio',.8))
assert.ok(sustained.filamentVertexCount>short.filamentVertexCount)
rows.push({input:'activeRatio',observedControl:'filament vertex count',low:short.filamentVertexCount,high:sustained.filamentVertexCount})
const baseline=render(layer)
const disconnected=[]
for(const [field,value] of [['baseRadius',.9],['filamentCount',99],['envelope',[.9,.1,.8]]]) {
  const altered=render({...layer,[field]:value})
  assert.deepEqual(altered.data,baseline.data, `${field} is now connected; update research diagnosis`)
  disconnected.push(field)
}
assert.deepEqual(render(layer).data,baseline.data)
console.log(JSON.stringify({scope:'Controlled existing CPU builder; no GPU, human voice or recognition validation',rows,disconnected,reproducible:true},null,2))
