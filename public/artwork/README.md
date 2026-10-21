# Integration artwork

- `figma-recording-surface-72.svg` / `figma-recording-surface-96.svg`: exact text-free original RecordingControl surfaces `1303:2929` (72×72) / `1303:3085` (96×96), exported through the read-only Figma Plugin API. Native dimensions are retained and uniformly scaled by 0.88 to 63.36 / 84.48px. Separate native controls keep the real start/restart/stop/pause/resume actions; labels and Font Awesome icons stay editable. No original Figma nodes were created or modified.

- `figma-player-play-surface.svg`: exact text-free 48×48 Player surface `1317:3486`, exported read-only from Figma. Home completed cards scale the full native surface and separate 14.4px icon uniformly by 0.75 to the original 36px visual size. The existing whole-card button owns navigation and the accessible hit area; this artwork adds no simulated playback.

- `figma-compact-button.svg`: exact text-free 84×40 surface export `1492:34269` from RecordCompact/Primary/Default `1488:33761`; circular ends, rim, grain and reflection are retained. Editable native button content stays separate inside an 84×44 target.
- `figma-vocal-finder-disabled.svg`: exact 84×40 surface export `1495:34586`, including its original 0.32 surface opacity. The native button keeps the existing availability condition and full-opacity secondary label; the asset is not darkened a second time.
- `figma-track-play-surface.svg`: exact text-free 32×32 surface `1317:3642` from Track PlayControl. Native 44×44 play target and Font Awesome icon keep the existing individual-listening action. Workspace inclusion controls reuse the already-connected original toggle artwork.
- These three exports used the read-only Figma Plugin API because temporary asset download returned HTML. No original Figma nodes were created or modified.

- `guide-keyboard.svg`: exact 46×32 export of Figma `1448:32057` in Recording Monitoring / Guide `1466:32188`. Decorative keyboard for the real backing toggle; no audio or profile data is substituted.
- `figma-toggle-{on,off}.svg`: exact 46×26 exports of IEUM/Current/Toggle variants `1238:2667` / `1238:2668`. Recording monitoring displays them at the original instance scale (33.12×18.72); native controlled checkboxes and full-card click targets remain functional. Plugin API exports were used because the temporary asset URL returned HTML.

- `home-hero.webp`: user-supplied text-free line/particle illustration (`세 빛깔 실매듭의 비닐 궤적(2).png`). Promotional Home art only; never replaces live project/recording visuals.
- `profile-knot.webp`: user-supplied blue knot (`청록빛 유동 매듭 추출본-2(1).png`), used as the approved decorative My Voice entry icon. It does not claim to be the current user’s measured/generated identity.
- `cover-{pop,rnb,rock,electronic,folk,jazz}.webp`: original imagegen artwork, six separate genre treatments; existing composition retained and fictional titles removed with imagegen. WebP exports are resized for UI delivery. Not official recording artwork.

- `turntable-housing.webp`: separated user-supplied hardware artwork. It is composited with a solid platter behind it, below the live Record. Its old alpha cutout is not used as a hole or mask: the live Record sits above the complete deck and slides freely over it. Only the carousel viewport clips at the screen edges.
- `figma-project-button.svg`: exact SVG export of Figma surface `1492:33965` within Project/Secondary/Default `1488:33657` (382×48). Contains the original rim, bevel, directional reflections and grain, without text. CSS slices preserve the 24px circular ends at 350/382px; the label remains editable React text. Exported through the Figma Plugin API because the temporary asset download returned blocked HTML.

The current catalogue retains its real Song IDs/titles/artists/genres. `src/songArtwork.js` explicitly binds four illustrative covers by Song ID; supplied `song.cover` has priority. Rock/electronic variants are retained for later catalogue artwork selection without inventing songs. Home recommendation, recent sleeve and Search share this mapping.

Never export a whole UI screenshot as artwork. Turntable housing and the dynamic Record must remain separate; the uploaded combined image is a reference, not a replacement for functioning playback/recording layers.
