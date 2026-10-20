# Integration artwork

- `home-hero.webp`: user-supplied text-free line/particle illustration (`세 빛깔 실매듭의 비닐 궤적(2).png`). Promotional Home art only; never replaces live project/recording visuals.
- `profile-knot.webp`: user-supplied blue knot (`청록빛 유동 매듭 추출본-2(1).png`), used as the approved decorative My Voice entry icon. It does not claim to be the current user’s measured/generated identity.
- `cover-{pop,rnb,rock,electronic,folk,jazz}.webp`: original imagegen artwork, six separate genre treatments; existing composition retained and fictional titles removed with imagegen. WebP exports are resized for UI delivery. Not official recording artwork.

- `turntable-housing.webp`: imagegen separated the user-supplied housing into an alpha overlay. Disc/label/knots are removed; the circular opening and exterior are transparent. Home and Workspace render the existing live record underneath.

The current catalogue retains its real Song IDs/titles/artists/genres. `src/songArtwork.js` explicitly binds four illustrative covers by Song ID; supplied `song.cover` has priority. Rock/electronic variants are retained for later catalogue artwork selection without inventing songs. Home recommendation, recent sleeve and Search share this mapping.

Never export a whole UI screenshot as artwork. Turntable housing and the dynamic Record must remain separate; the uploaded combined image is a reference, not a replacement for functioning playback/recording layers.
