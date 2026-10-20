# Figma V2 integration checkpoint · 2026-10-21

## Current result

- Branch: `feature/figma-v2-integration`, based on `main` at `a20cf97`.
- Resumed from `e386dda`, preserving prior typography and Search/navigation work.
- Code commit: `1902972` — Home/Workspace/Recording React structures, scoped V2
  styles, Search data/history fixes and maintained QA. GitHub connector saved the
  exact reviewed files on top of the existing remote tree, without force updates.
- No main/Production changes, standalone Resonance merges or algorithm changes.
- This is a functional integration checkpoint, **not final visual acceptance**.

## Sources and scope

- Read AGENTS.md and docs/GIT_WORKFLOW.md. User explicitly directs branch/Preview
  work, and forbids making Figma image downloads a global prerequisite.
- Requested Notion DESIGN_SYSTEM, IA, PRD, flow and screen specification were read
  through the Notion connector; no product documents were modified.
- Figma full/child design contexts and screenshots: Home `1349:21126`, Workspace
  `1412:29502`, Recording `1459:31183`, Search section `1396:30802` and their
  relevant headings, cards, Part modules, monitoring, controls and navigation.
- Desktop port 3845 is unreachable. Existing recorded authorization for the
  connected Figma app was retained; no Computer Use was used.

## Implementation classification

| Category | Implemented/preserved | Remaining |
| --- | --- | --- |
| React/CSS | Five Home sections; recruiting carousel controls/swipe; three-column songs; project rows; horizontal completed cards; scoped typography/surfaces/buttons; 4-tab illuminated navigation; Part playback/toggles/actions; monitoring modules; instrument controls | Final visual refinement after static artwork; exact hardware surface rendering |
| Dynamic code graphics | Existing Resonance renderer, live recording input renderer, rotation/state changes, measured level callbacks, existing audio/preview/final mixing | Existing renderer differs from the approved knot design; independent renderer integration is a separate task |
| Static images | Existing repository navigation/control assets and locally bundled fonts reused; no temporary Figma URLs shipped | Hero, actual Song covers/sleeves, original turntable housing and personal knot artwork listed below |

Search now uses actual saved Track/Mix state rather than a stale COMPLETE label.
Assigned seats are excluded from recruitment. Korean genre filters match stored
English metadata. Search query/tab/genre/Part/range/sort survive detail Back.
Completed results open the matching main or created Project; unavailable completed
results remain empty. My Voice opens from the primary headers and Back restores
the previous context. A recent-date sort uses actual available date metadata;
undated catalogue entries keep stable order rather than fabricated timestamps.

Workspace shares CurrentMixPanel's existing individual/combination playback state
with the horizontal Part modules. Recording retains microphone acquisition,
pause/resume, Review, draft restoration, submission, failure preservation and
final-Track-triggered Auto Mix. No static waveform substitutes for live input.

## Static asset work — independent of code progress

| Asset | Intended slot and production conditions |
| --- | --- |
| Home hero | 430×400 composition, export at 2×; warm #15110E edges; separate blue/coral/ivory line/particle voices feeding the vinyl; no baked text, buttons or bottom fade. Existing dynamic Record is shown until supplied; it is not claimed to match this composition. |
| Song covers | One square cover per actual catalogue Song; recommended slots 119×119 at 430px, 3 columns; source at least 2×. Bind by Song ID and verify usage rights. Current catalogue has A Thousand Years/Ocean Eyes/Love Poem/City of Stars, not Figma's sample titles. Title-based slots remain until covers exist; don't invent completion/artist data. |
| Sleeves | Use the same Song cover; 54×54 sleeve plus 56×56 project Record inside the 72×72 thumbnail, with no clipping. Do not confuse Song cover identity with Project Record. |
| Turntable housing | Home 255×255 stage and Workspace 370×388 stage. Supply dark charcoal base/platter/arm as separable artwork with transparent Record opening. Keep live Record, Play, seek and actions as React/Canvas layers. Current stage uses the existing live Record without a fabricated housing. |
| Personal knot images | Transparent per-person images in 48×48 Workspace / 53×40 monitoring slots. Use verified personal results when available. Until supplied, initials/names identify people; these are not claimed to be generated voice knots. |
| Complete 3D imagery | 212×196 artwork inside 368×196 Home card; dynamic standalone 3D integration remains separate. Current saved completed Projects use the existing renderer. No synthetic completed songs are added. |

Original Figma asset downloads returned Site Unavailable HTML in this environment.
This blocks exact static artwork matching only. It does not block React structure,
interaction, existing dynamic graphics or QA. No fake SVG/CSS knot replacement.

## Verification

- `npm run build`: passed. Existing >500 kB bundle warning remains.
- `npm run qa`: all 13 maintained suites passed after adapting old MY-tab and
  vertical/fully-expanded Home assumptions to the current design. Track/Mix,
  draft failure/retry, profile, source ownership and 2–4 Part checks retained.
- `qa/verify-v2-integration-browser.mjs`: passed on Chromium at 390×932 and
  430×932; no page/console errors and no horizontal body overflow.
- Actual browser path: Home → Detail Part Fit → join → Workspace → MediaRecorder
  start → pause/resume → stop → Review → direct submit → Auto Mix → Completed.
  Asserted 4 submitted Tracks and non-empty final Mix Blob.
- Also checked Search tabs, Korean Pop filtering, empty results, exact-detail Back
  query/filter restoration, My Voice Back, Track inclusion/individual listening,
  hidden Recording navigation and completed-search result selection.
- Browser QA used isolated broad-range profile and received demo-Track fixtures
  plus Chromium synthetic microphone. It does not prove physical microphone,
  audible quality, actual singer cooperation or a live multi-user backend.
- Screenshots were compared with the Figma layout references. Static artwork,
  individual knots, the old renderer's shape and long real Song titles remain
  visible differences. Long content remains scrollable instead of clipped.
- Existing main demo has no registered actual Song lyrics/backing. Its honest
  missing-source notice is retained. Production-ready music/lyrics licensing,
  real-device microphone/earphone testing and final visual acceptance remain open.

## Preview verification

- URL: https://ieum-v2-react-h2wpl2173-junes-lie.vercel.app
- Vercel deployment: `dpl_81qMMYkNNFFg6ErWSUrHvrbNGLqZ`, Git Integration,
  Preview (`target: null`), READY; exact code SHA
  `1902972965ca91606a30c08aae952f653d8b11f9` confirmed.
- Protected by Vercel Authentication. Used the Vercel connector's existing
  temporary access link for testing; no protection setting was disabled.
- Authenticated HTTP 200. Deployed JS `index-CzOSuM59.js` and CSS
  `index-BZbUx0bh.css` match the locally built filenames.
- Actual Preview Chromium smoke passed: Home/3 recommended Song cards → Search
  query/results → exact Detail → Back restores query → My Voice → Back restores
  Search. No page errors. Normal URL requires access to the Vercel project.
- The full synthetic-microphone flow above was tested locally at both widths;
  Preview smoke does not claim a second full microphone/Auto Mix run remotely.

## Next checkpoint

1. Produce/deliver the static assets above without stopping code work.
2. Refine remaining visual differences against Figma, then repeat relevant visual
   checks; integrate the separate Resonance result only in a separately authorized task.
3. Validate actual microphone/earphones and obtain the needed music/lyric sources
   before calling the presentation app fully complete.
