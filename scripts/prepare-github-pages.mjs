import { readdir, readFile, writeFile, rename } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, extname } from 'node:path'

// GitHub Pages serves this repository under /ieum-v2-react/, not at /.
// Vite --base handles bundled JS/CSS. These are literal URLs to public/ assets.
// Keep /api/ untouched: GitHub Pages cannot host Vercel server functions.
const prefix = '/ieum-v2-react/'
const paths = ['audio/', 'artwork/', 'demo-stems/', 'figma/', 'resonance-reference-v1.png', 'resonance-reference-v2.png', 'manifest.webmanifest']
const re = new RegExp('(["\\x27\\x60(=])\\/(' + paths.map(p => p.replaceAll('.', '\\.')).join('|') + ')', 'g')
let files = 0
let replacements = 0
const renamedScripts = []

async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name)
    if (item.isDirectory()) { await walk(path); continue }
    if (!['.js', '.css', '.html', '.json'].includes(extname(item.name))) continue
    const before = await readFile(path, 'utf8')
    const after = before.replace(re, (_match, lead, suffix) => {
      replacements++
      return lead + prefix + suffix
    })
    if (after !== before) {
      await writeFile(path, after)
      files++
      // Vite's original content hash is invalid after rewriting its output.
      // Rename the rewritten JS so browsers cannot reuse an older cached bundle.
      if (extname(item.name) === '.js') {
        const digest = createHash('sha256').update(after).digest('hex').slice(0,12)
        const next = item.name.replace(/\.js$/, `-pages-${digest}.js`)
        await rename(path, join(dir, next))
        renamedScripts.push([item.name, next])
      }
    }
  }
}
await walk('dist')
if (renamedScripts.length) {
  let html = await readFile('dist/index.html', 'utf8')
  for (const [before, after] of renamedScripts) {
    if (!html.includes(before)) throw new Error(`Rewritten JS not referenced in index.html: ${before}`)
    html = html.replaceAll(before, after)
  }
  await writeFile('dist/index.html', html)
}
if (!renamedScripts.length) throw new Error('No rewritten JavaScript bundle; Pages URL check required')
console.log('Pages public asset paths rewritten:', replacements, 'in', files, 'files')
if (replacements === 0) {
  throw new Error('No public asset paths found; review the build before publishing')
}

// JSON manifests contain runtime audio URLs and must be rewritten too.
const manifest = await readFile('dist/demo-stems/manifest.json', 'utf8')
if (!manifest.includes(prefix + 'demo-stems/soprano.wav') || manifest.includes('"/demo-stems/')) {
  throw new Error('GitHub Pages demo Track manifest still contains root-relative URLs')
}
