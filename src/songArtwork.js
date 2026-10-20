// Original, text-free discovery artwork; song/artist metadata stays in the catalogue.
// These are illustrative covers for this prototype, not official release artwork.
const ARTWORK = Object.freeze({
  'a-thousand-years': '/artwork/cover-folk.webp',
  'ocean-eyes': '/artwork/cover-pop.webp',
  'love-poem': '/artwork/cover-rnb.webp',
  'city-of-stars': '/artwork/cover-jazz.webp'
})

export function songArtwork(song) {
  return song?.cover || ARTWORK[song?.id] || null
}
