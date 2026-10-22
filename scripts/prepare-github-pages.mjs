import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'

// GitHub Pages serves this repository under /ieum-v2-react/, not at /.
// Vite --base handles bundled JS/CSS. These are literal URLs to public/ assets.
// Keep /api/ untouched: GitHub Pages cannot host Vercel server functions.
const prefix = '/ieum-v2-react/'
const paths = ['audio/', 'artwork/', 'demo-stems/', 'figma/', 'resonance-reference-v1.png', 'resonance-reference-v2.png', 'manifest.webmanifest']
const re = new RegExp('(["\\x27\\x60(=])\\/(' + paths.map(p => p.replaceAll('.', '\\.')).join('|') + ')', 'g')
let files = 0
let replacements = 0

async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name)
    if (item.isDirectory()) { await walk(path); continue }
    if (!['.js', '.css', '.html'].includes(extname(item.name))) continue
    const before = await readFile(path, 'utf8')
    const after = before.replace(re, (_match, lead, suffix) => {
      replacements++
      return lead + prefix + suffix
    })
    if (after !== before) { await writeFile(path, after); files++ }
  }
}
await walk('dist')
console.log('Pages public asset paths rewritten:', replacements, 'in', files, 'files')
if (replacements === 0) {
  throw new Error('No public asset paths found; review the build before publishing')
}
