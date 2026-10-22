import { readdir, readFile, writeFile, rename } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, extname } from 'node:path'

// GitHub Pages serves this repository under /ieum-v2-react/, not at /.
// Vite --base handles bundled JS/CSS. These are literal URLs to public/ assets.
// Keep /api/ untouched: GitHub Pages cannot host Vercel server functions.
const prefix = '/ieum-v2-react/'
const paths = ['audio/', 'artwork/', 'figma/', 'resonance-reference-v1.png', 'resonance-reference-v2.png', 'manifest.webmanifest']
const re = new RegExp('(["\\x27\\x60(=])\\/(' + paths.map(p => p.replaceAll('.', '\\.')).join('|') + ')', 'g')
let files = 0
let replacements = 0
let audioValidators = 0
const renamedScripts = []

async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name)
    if (item.isDirectory()) { await walk(path); continue }
    if (!['.js', '.css', '.html', '.json'].includes(extname(item.name))) continue
    const before = await readFile(path, 'utf8')
    let after = before.replace(re, (_match, lead, suffix) => {
      replacements++
      return lead + prefix + suffix
    })
    // The Project contract validates the backing URL before fetching it. Its
    // anchored regex must follow the same Pages prefix as the rewritten URL.
    // Keep the exact path/traversal guard; change only this build's base path.
    if (extname(item.name) === '.js') {
      const validator = String.raw`/^\/audio\/[\w./-]+$/`
      if (after.includes(validator)) {
        after = after.replaceAll(validator, String.raw`/^\/ieum-v2-react\/audio\/[\w./-]+$/`)
        audioValidators++
      }
    }
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
if (audioValidators !== 1) throw new Error('Project backing URL validator was not adapted exactly once for Pages')
// Bind the served preview to the exact Actions source, without adding UI or
// relying on the workflow status alone as proof of what Pages currently serves.
const commitSha = process.env.GITHUB_SHA
if (commitSha) {
  if (!/^[a-f0-9]{40}$/.test(commitSha)) throw new Error('Invalid Pages source commit')
  await writeFile('dist/build-info.json', JSON.stringify({
    commitSha,
    scripts: renamedScripts.map(([, name]) => 'assets/' + name)
  }, null, 2) + '\n')
}
console.log('Pages public asset paths rewritten:', replacements, 'in', files, 'files')
if (replacements === 0) {
  throw new Error('No public asset paths found; review the build before publishing')
}

