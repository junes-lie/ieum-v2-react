# Figma V2 integration checkpoint · 2026-10-21

## Current result

- Branch: `feature/figma-v2-integration`, based on `main` at `a20cf97`.
- Resumed from `e386dda`, preserving prior typography and Search/navigation work.
- Latest code: `9cd0a35` (Record above fixed turntable, no aperture clip), preserving
  `1378d69` distinct recruitment Record art/original Figma button, `6b43672`
  Recording, `24af29a` transport and `cf8a003` shared artwork.
- Prior functional integration `1902972` is preserved. GitHub connector saved
  reviewed files on the existing remote tree with expected-HEAD checks; no force updates.
- No main/Production changes, standalone Resonance merges or algorithm changes.
- This is a functional integration checkpoint, **not final visual acceptance**.

## Record above deck correction · 2026-10-21

- User corrected the previous hole/underlay model. The fixed turntable is a
  complete back layer (solid platter + retained hardware art, z=0); the live
  Record is a separate foreground layer (z=1), below transport controls (z=2).
- Removed circular overflow clipping from the live Record slot. During selection
  the Record slides over the deck, not through an aperture; only the carousel
  viewport clips at the screen edges. Housing remains the same stationary node.
- Shared Home/Workspace TurntableFrame uses the corrected DOM/stacking order.
  Existing artwork, graphic algorithm, record differences, button and transport
  behavior are preserved.
- Build and scoped Chromium checks passed at 390/430px: record z above deck,
  opaque platter, visible overflow/no hole clip, stable housing after selection,
  no page errors or horizontal overflow. Actual stage captures were inspected.
  This narrow correction did not rerun the full microphone suite; its preceding
  results remain recorded below. Preview verification passed below. This run's
  `interactive-record-over-deck-e6c6de6fbc91` lock is released with this checkpoint.

## User carousel / original button correction · 2026-10-21

- Resumed from remote `9d96b79`; acquired lock
  `interactive-carousel-button-e6c6de6fbc91`. Expected-HEAD updates only.
- Removed selection animation/key from the deck wrapper. The housing stays mounted
  and stationary. Only the inner Record and neighbour Record layers slide in the
  selected direction; their Canvas nodes are reused through repeated selection.
  Reduced-motion preference skips the slide. Horizontal swipe suppresses a second
  neighbour click and vertical movement does not select a Project.
- Catalogue Projects without saved Track graphics now receive distinct, deterministic
  illustrative resonance inputs for recruitment only. The existing renderer is
  reused with the catalogue Part colors; these graphics do not represent measured
  singers and never create/change submitted Tracks, Mixes or voice identities.
  Actual submitted Track graphics/stored Record resources take precedence.
  Created empty Projects keep their empty graphic.
- Re-read Figma Project/Secondary/Default `1488:33657` and instance `1488:33867`
  against the user's attached button reference. Exported its exact text-free surface
  `1492:33965` through the Plugin API after temporary URL download returned blocked
  HTML. Original rim/bevel/reflections/grain are preserved in local SVG. Fixed 24px
  end slices preserve the capsule at 350/382px; label remains editable Pretendard
  Regular 15/22, #F1E8D8. Button height 48px, radius 24px.
- Build, all 13 maintained Node suites, and Chromium 390/430px integration passed.
  Browser assertions verify distinct Record signatures, unchanged submitted count,
  same housing DOM node/no ancestor transforms or animations during selection,
  running inner Record slide, original SVG source and button geometry.
  Existing Search/Back, My Voice, Mix transport and synthetic-mic
  participation→Review→submit→Auto Mix→Completed all passed without page/console
  errors or horizontal body overflow.
- Compared actual button captures at both widths with original Figma and supplied
  reference; Home side Records visibly carry different colored/shaped flows.
  The base Resonance shader shape is still the existing renderer, not the separate
  approved standalone knot algorithm.
- Renderer blob remains `74d7559e8ca1c6ff2cd1aeb1c73b13fe2211ace6`.
  No standalone/main/Production changes. Code `1378d69` and Preview verified below.
  This run releases only its own lock atomically with this final checkpoint.

## Previously verified screen refinement · 2026-10-21

- Resumed from remote `0944b81`; acquired the existing shared lock atomically with
  owner `automation-figma-v2-20261020T195622Z-e6c6de6fbc91` and base SHA recorded.
  Rechecked remote HEAD/ownership before saving; expected-HEAD fast-forward only.
- Used a fresh temporary checkout subset verified against the remote Git blob
  hashes. Previous local files were not trusted as current source; only matching
  bytes were reused. No user files were deleted or overwritten.
- Re-read current Notion Design System/screen specification and Figma Home,
  Recording, carousel/monitoring/lyrics/instrument child contexts + screenshots.
- Home now shows the actual previous/next Project records beside the fixed deck,
  at Figma's 172px/255px sizes. Click, keyboard and existing swipe update the same
  selected Project/info/action. Empty project records remain empty; no fabricated
  submitted voices or catalogue identities were introduced.
- Recording places the existing live Record below the lyrics with a large lower
  crop. Actual input Canvas remains live and feeds toward that Record. Compact
  state/time/MIC/quality share one readout; duplicate input-meter graph removed.
  Stop now uses the existing Font Awesome icon in the correct cream color.
- Build, 13 maintained Node suites and 390/430px browser integration passed.
  Added checks for neighbour pointer/keyboard/swipe, unchanged submitted count,
  Ready/REC/Paused readouts, single live-input Canvas and lower Record crop.
  Existing full synthetic-mic Review/submit/Auto Mix/Completed and transport checks
  passed at both widths; no page/console errors or horizontal body overflow.
- Compared rendered Home/Recording/Review at both widths with Figma. Per-person
  initials, Guide headphones rather than the keyboard asset, the current renderer's
  shape/low-level stream brightness and missing real Song sources remain visible
  differences. No final visual or physical-device acceptance is claimed.
- Resonance renderer blob remains `74d7559e8ca1c6ff2cd1aeb1c73b13fe2211ace6`;
  no algorithm/standalone/main/Production changes. Only this run's lock is removed
  with the final checkpoint commit.

## Previously verified asset / transport checkpoint

- Acquired `docs/FIGMA_V2_INTEGRATION_LOCK.json` atomically before editing. Other
  executions must skip while this file exists; only its recorded owner releases it.
  This run releases its own lock atomically with the final checkpoint commit.
- Supplied text-free Hero is a promotional illustration; copy/header/fades remain
  editable React/CSS. The rounded, bordered My Voice icon uses the supplied blue
  knot as decorative entry art, not a claimed measured identity for the user.
- Six original genre artworks were made text-free with imagegen and exported to
  WebP. Four existing Song IDs map explicitly to four illustrative covers; real
  titles/artists/genres are unchanged. Rock/electronic variants remain available
  without creating fictitious songs. Home covers, recent sleeves and Search use
  the same mapping; an explicit `song.cover` takes precedence.
- Recent thumbnails contain a 54px sleeve + 56px live record within 72px bounds.
- Separated the supplied turntable into an alpha hardware overlay: its record
  opening is transparent. Home/Workspace retain the existing live renderer below.
  The Workspace turntable button controls the existing CurrentMixPanel/Player
  audio element, including individual-track listening and pause/resume. Timeline
  seeking remains in the same Player; a duplicate transport button is hidden.
- Build, all 13 maintained Node suites, and the updated browser suite passed.
  At both 390px and 430px, checked image decoding, thumbnail containment, live
  canvas under the housing, actual audio currentTime advance/pause, Search return,
  and full synthetic-microphone participation→Review→submit→Auto Mix→Completed.
  No page/console errors or horizontal overflow. Physical microphones/earphones
  and live multi-user collaboration are still unverified.
- No Resonance algorithm or standalone branch changes. The existing dynamic
  renderer still differs visually from the approved knots; it is not represented
  as final visual acceptance. Hardware separation preserves the supplied design
  but needs the user's final visual review.

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
| React/CSS | Five Home sections; carousel controls/swipe; three-column covers; sleeve/record rows; horizontal completed cards; scoped tokens/buttons; 4-tab navigation; Part playback/toggles/actions; monitoring; actual Workspace turntable transport | Final visual refinement, remaining carousel/monitoring graphic fidelity |
| Dynamic code graphics | Existing Resonance renderer, live recording input renderer, rotation/state changes, measured level callbacks, existing audio/preview/final mixing | Existing renderer differs from the approved knot design; independent renderer integration is a separate task |
| Static images | Supplied Hero/profile icon, six text-free covers, shared sleeves/Search art, alpha turntable housing; existing controls/fonts reused | Verified per-person identities and finished 3D imagery; final visual review |

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

## Static assets — current state

| Asset | Current state / remaining work |
| --- | --- |
| Home Hero | Supplied 1300×1209 artwork exported to 860×800 WebP; 430×400 full-bleed slot, editable top/bottom fades and copy. |
| Song covers | Six original 512×512 genre artworks. Four mapped by existing Song IDs in `src/songArtwork.js`; illustrative rather than official release covers. |
| Sleeves | Reuse mapped Song art in a 54×54 sleeve beside the live 56×56 record, inside 72×72. Both widths verified. |
| Turntable deck | Fixed hardware art + solid platter behind the live foreground Record. No circular hole mask; shared Home/Workspace layer order. |
| Personal knot images | Blue supplied knot used for decorative My Voice entry only. Other participants still use initials until verified person-owned identity resources are available. Never assign fixed art as a measured personal result. |
| Complete 3D imagery | Existing completed Projects use the existing dynamic renderer. Independent 3D integration remains separately authorized work; do not add synthetic completions. |

Original Figma asset URLs were blocked. Supplied local assets now cover Hero,
covers/sleeves/profile entry and hardware. This is not a reason to stop remaining
React integration. `public/artwork/README.md` records sources and use boundaries.

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
- Screenshots were compared with Figma and the supplied source artwork. Hero,
  covers/sleeves and hardware now render from local assets. Participant initials,
  the old renderer's shape and long real Song titles remain visible differences.
  Long content remains scrollable instead of clipped.
- Existing main demo has no registered actual Song lyrics/backing. Its honest
  missing-source notice is retained. Production-ready music/lyrics licensing,
  real-device microphone/earphone testing and final visual acceptance remain open.

## Preview verification — latest code

- URL: https://ieum-v2-react-gt3hp94sd-junes-lie.vercel.app
- Deployment: `dpl_CyMcZfbeQXPZstCT3ryDa7Mk1332`, READY, Git Integration,
  Preview (`target: null`), exact SHA `9cd0a3520e63bb9e972844633ba3a105639e7936`.
- Vercel Authentication remains enabled. Actual remote Chromium at 390/430px
  confirmed Record z above turntable, solid platter, no aperture overflow clip,
  same stationary housing after selection and no horizontal overflow.
- Served JS `index-JupQ3Ztx.js` matches the tested local production build.
- Prior full synthetic-microphone/Review/submit/Auto Mix and original button
  verification remain recorded in the preceding checkpoint; this layer-only
  change ran scoped local/deployed browser checks, not another full microphone run.

## Next checkpoint

1. Remaining visual differences: monitoring/Part identity slots need verified
   person-owned resources; Guide keyboard needs the actual local asset. Do not
   assign the decorative profile image as someone's measured voice result.
2. Existing Resonance shape, stream fidelity/brightness and completed 3D remain
   separate from this placement pass. Preserve algorithms; do not merge the
   standalone branch. Final visual review is still open.
3. Validate physical microphones/earphones and supply the actual Song backing/
   lyrics before declaring the presentation app fully complete. Keep missing-source
   notices and failed recording/submission recovery. Do not repeat completed
   carousel/readout integration without evidence of a regression.
