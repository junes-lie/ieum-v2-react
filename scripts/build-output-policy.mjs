import { rm } from 'node:fs/promises'
import { resolve, relative, isAbsolute } from 'node:path'

// Archive originals stay in public/ and Git. Only these reviewed, unused copies
// are omitted from a successful production build; dev/reference access remains.
export const archivedPublicOutput = Object.freeze([
  'resonance-reference-v1.png',
  'figma/653-46/8146a3edc45c466ef64600dfe89a698343a94faa.png',
  'figma/653-46/8249c9503bdd49481d0a5290f6c90ca4b1efbced.png',
  'artwork/README.md'
])

export function omitArchivedPublicOutput() {
  let outDir
  let publicDir
  return {
    name: 'ieum-omit-archived-public-output',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
      publicDir = resolve(config.publicDir)
      const relation = relative(publicDir, outDir)
      if (!relation || (!relation.startsWith('..') && !isAbsolute(relation))) {
        throw new Error('Build output must not contain or replace public originals')
      }
      const reverse = relative(outDir, publicDir)
      if (!reverse || (!reverse.startsWith('..') && !isAbsolute(reverse))) {
        throw new Error('Build output must not contain public originals')
      }
    },
    async writeBundle() {
      await Promise.all(archivedPublicOutput.map(path => rm(resolve(outDir, path), { force: true })))
    }
  }
}
