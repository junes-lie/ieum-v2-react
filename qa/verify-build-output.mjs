import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { resolve, relative, basename } from 'node:path'
import { createHash } from 'node:crypto'
import { archivedPublicOutput } from '../scripts/build-output-policy.mjs'

const root = resolve(import.meta.dirname, '..')
async function files(dir, base = dir) {
  const result = new Map()
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      for (const [key, value] of await files(path, base)) result.set(key, value)
    } else {
      const bytes = await readFile(path)
      result.set(relative(base, path).replaceAll('\\', '/'), {
        size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')
      })
    }
  }
  return result
}
const source = await files(resolve(root, 'public'))
const output = await files(resolve(root, 'dist'))
for (const path of archivedPublicOutput) {
  assert.ok(source.has(path), `Preserve original: public/${path}`)
  assert.ok(!output.has(path), `Archive must not be deployed: ${path}`)
}
for (const [path, value] of source) {
  if (!archivedPublicOutput.includes(path)) {
    assert.deepEqual(output.get(path), value, `Active public asset stays byte-identical: ${path}`)
  }
}
assert.equal([...output.keys()].filter(p => /\.(ttf|woff2?)$/.test(p)).length, 6)
assert.ok([...output.keys()].every(p => !/(^|\/)(qa|captures|tmp)\/|\.(zip|psd|fig)$/i.test(p)))
// These two historical mappings are retained as source documentation, never
// consumed by the app. Reject new static or dynamic usage before excluding them.
const unusedKeys = ['imgArtworkRecordTransparent', 'imgArtworkRecordingIngressTransparent']
for (const path of (await files(resolve(root, 'src'))).keys()) {
  if (!/\.(jsx?|css|json)$/.test(path) || path === 'figmaAssets.json') continue
  const text = await readFile(resolve(root, 'src', path), 'utf8')
  assert.ok(unusedKeys.every(key => !text.includes(key)), `Archived mapping used in ${path}`)
  assert.ok(!/figmaAssets\s*\[|Object\.(?:keys|values|entries)\(figmaAssets/.test(text), `Review dynamic asset usage in ${path}`)
  for (const asset of archivedPublicOutput.slice(0, 3)) {
    assert.ok(!text.includes(basename(asset)), `Archived path used in ${path}`)
  }
}
const total = map => [...map.values()].reduce((n, file) => n + file.size, 0)
const summary = { outputFiles: output.size, outputBytes: total(output), omittedBytes: archivedPublicOutput.reduce((n, path) => n + source.get(path).size, 0) }
if (process.argv[2]) {
  const before = await files(resolve(process.argv[2]))
  assert.deepEqual([...before.keys()].filter(p => !output.has(p)).sort(), [...archivedPublicOutput].sort())
  assert.ok([...output.keys()].every(p => before.has(p)), 'No new runtime output')
  for (const [path, value] of output) assert.deepEqual(value, before.get(path), `Runtime output changed: ${path}`)
  summary.baselineBytes = total(before)
  assert.equal(summary.baselineBytes - summary.outputBytes, summary.omittedBytes)
  summary.allRetainedFilesByteIdentical = true
}
console.log('PASS production output preservation', JSON.stringify(summary))
