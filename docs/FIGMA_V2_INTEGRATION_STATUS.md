# Figma V2 integration checkpoint · 2026-10-21

## Recording Guide refinement · 2026-10-21

- Resumed from integration `4c87db5`, main `f8a92df`; acquired shared lock
  `automation-figma-integration-20261020T2157Z-e6c6de6fbc91` by expected-HEAD update.
- Re-read current Notion Recording specification and Remote Figma Recording source,
  full screenshot and Guide module. Temporary asset URL returned HTML; exact keyboard
  and both original Toggle surfaces were exported through the Figma Plugin API.
- Replaced the Guide headphones with the original 46×32 keyboard. Monitoring uses
  original On/Off artwork at 33.12×18.72 and original card spacing/border. Native
  controlled checkboxes, full-card pointer activation and keyboard operation remain.
- Build and all 13 maintained Node suites passed. Chromium 390/430px verified
  artwork decoding/geometry, both toggle states, artwork click, Space and no automatic
  microphone activation. Inspected both actual renders against the original module.
- Full maintained Chromium integration passed at 390/430px: opaque carousel/Canvas
  continuity and fixed deck; public playback/save/reload; Search/Back; participation
  → Workspace → synthetic-mic pause/resume → Review → submit → Auto Mix → Completed.
  No page/console errors or body overflow. Physical mic/audio quality remains unverified.
- This checkpoint releases only its recorded Guide-refinement lock.
- Existing Resonance renderer blob remains `74d7559e8ca1c6ff2cd1aeb1c73b13fe2211ace6`.
  No standalone branch, voice identities, lyrics/audio sources or product policy edits.
- Expected runtime assets: `index-V2qVcNXp.js`, `index-D2p9E-Gp.css`.
- Original URL: https://ieum-v2-react.vercel.app. Git Integration rate limit remains
  recorded on main `f8a92df`; no new Production deployment exists as of this check.
  Source changes must not be described as live until exact commit/served assets match.
- Remaining: verified per-person artwork, source lyrics/backing, independent 3D work,
  final visual review and physical microphone/earphone verification. Existing missing-source
  notices stay. Next resume: check current Production status, then unresolved source assets.

## Presentation entrypoints · 2026-10-21

- User asked to inspect implemented Workspace/Recording immediately and requested
  a presentation menu outside the mobile frame, including profile-present/absent states.
- Added `?demo=workspace`, `?demo=recording` and seven selectable scenarios:
  first-visit, profile-ready, participate, workspace, recording, search, complete.
  Desktop normal-app margin links open the menu; `?scene=<id>` opens only the app.
- Reuses the same App/Workspace/Recorder, existing transport, recording and graphics.
  No duplicate app, new product screens, join policy changes or standalone algorithm edits.
- Demo data uses a separate IndexedDB name and scoped local/session storage keys.
  Example profile is visibly labelled as a fixture, never saved as measured evidence.
  Workspace/Recording seed assigned Tenor state; recording entry does not request mic.
  Per-scene reset deletes only that scene's demo data. Normal data remains untouched.
- Build and existing 13 Node suites passed. New Chromium QA passed all seven entries,
  direct participation, actual fake-mic pause/resume/Review/submit, reset from 3 to 2
  Tracks, Back, normal storage isolation, desktop rendering and 390/430px shell bounds.
  Inspected actual Home/Workspace/Recording renders. Physical mic/audio quality is unverified.
- Remote Figma connector successfully returned Workspace source structure; screenshot
  download still returned HTML. No fresh pixel-fidelity acceptance is claimed. User's
  Remote-connector authorization applies; Computer Use remains forbidden.
- Recording's missing real song lyrics/backing remains an existing incomplete asset state.
  Demo shortcuts address inspection/presentation; product onboarding remains unchanged.
- Expected build assets: `index-ks1GZzzh.js`, `index-DHOX_ESZ.css`.
  Runtime commit: `f8a92dfaf2d77c66b740b38b19859e240b99227f`, saved to main and integration.
  Git Integration rejected this commit for both connected projects with
  `Deployment rate limited — retry in 24 hours.` No deployment was created.
  Original URL still serves READY deployment `dpl_5YYHsXvR2f2SNj2C5k83z2iLC4Ge`
  at `b57c1d4`. These new entrypoints are NOT live. Existing `?design=figma`
  still opens Workspace in the previous runtime. Retry current verified main only
  after the rate limit clears; do not create repeated deploy commits while limited.
- This commit releases only `interactive-demo-entrypoints-e6c6de6fbc91`.

## Previous checkpoint result

- User authorized main integration and immediate verified Production deployments.
  This checkpoint adds continuous opaque Record motion to the previously deployed
  `b3069a3` runtime and `b57c1d4` Production verification checkpoint.
  Runtime correction commit: `80c723bfa7d091931154316d359deac28c95f4ba`.
  **Production deployment blocked by Vercel rate limit; original URL still serves
  the previous runtime. Do not report this correction as deployed.**
- Original application: https://ieum-v2-react.vercel.app.
- Includes the previously verified carousel/Figma button, foreground Record over
  fixed turntable, range-independent direct participation and independent
  completed-song listening catalogue.
- Expected-HEAD fast-forward updates only. No standalone Resonance branch or
  renderer algorithm changes. This is not final visual/physical-device acceptance.
- This checkpoint releases only the continuous-record-slide-e6c6de6fbc91 lock.

## Continuous Record slide and navigation verification · 2026-10-21

- User rejected the added fade. Removed opacity animation completely. The same
  previous/next Record DOM and live Canvas now travel into the center while the
  outgoing center travels to the opposite side; graphics are not replaced before
  animating. The fixed housing/platter remain mounted behind the moving records.
- Five stable virtual positions include two offscreen entries for a seamless
  bounded carousel. First/last wrap uses the same continuous motion. Interrupted
  animation reads its current rendered transform before retargeting.
- Retained the existing 255px deck, 172px neighbour records, platter geometry,
  original Figma button, pointer/keyboard/swipe selection and graphic sources.
  Reduced motion updates directly without a slide.
- Verified existing in-app routes: Home Project button → Detail → OPEN Tenor →
  participation → Workspace; bottom Projects → resume → Workspace; own Part
  recording button → Recording. No manual URL entry is required.
- Build, all 13 maintained Node suites and updated Chromium integration at
  390/430px passed. Checks cover Canvas/DOM continuity, no opacity keyframes,
  stationary housing, settled sizes, wrap, rapid reversal, reduced motion,
  unchanged submitted Track count and actual navigation.
- Existing public playback/save/reload, Search/Back and synthetic-mic
  recording/pause/resume/Review/submit/Auto Mix/Completed regression passed.
  These tests do not claim physical microphone/audio quality or real collaboration.
- Desktop Figma MCP on 127.0.0.1:3845 was unavailable. No new design source or
  acceptance is claimed; this correction follows the user's explicit no-fade
  request and preserves the previously verified design geometry.
- Main update succeeded, but Vercel's Git Integration rejected both project
  checks with `Deployment rate limited — retry in 24 hours.` at
  2026-10-20T21:12:02Z. No new deployment was created. Source/build/browser QA are
  complete; the original URL remains on `index-BmmlD67C.js`.
- Expected new runtime asset: `index-DM_WfwEP.js`, CSS `index-DgFztpDg.css`.
  Resume by checking the rate limit and deploying the current verified main SHA
  through Git Integration after it clears, then verify the original stable URL,
  continuous no-fade Record motion and Workspace/Recording navigation. Do not
  repeatedly trigger builds while limited or upgrade the account without approval.
- Prepared isolated Production QA remains temporary; it was not run against the
  new runtime because no new Production deployment exists.

## Independent completed-song catalogue · 2026-10-21

- Corrected Home/Search completed discovery to accept an independent listening
  catalogue instead of requiring this browser to finish a Project first.
- Added three labelled IEUM Originals showcase entries using the existing,
  hash-verified original audio excerpts already in Git/Production: 서로의 빛,
  천천히 함께, 비가 그친 뒤 (16/19/18 seconds). These are explicitly examples,
  not fabricated community members, submitted Tracks or completed user Mixes.
- Home cards and Search open the exact existing 07 Complete view with native
  audio playback. Save/reopen through Collection, Back context, reload and direct
  share links retain the selected public result. These entries never join a
  Project or change the current user's Tracks/Mix/My Projects.
- Public examples have illustrative renderer input, and source/credits disclose
  that they are presentation audio rather than actual user collaboration.
  Original Production /api/project-discovery returned HTTP 503 with
  SERVICE_NOT_CONFIGURED. Real community result ingestion is not configured;
  the three playable entries are explicitly disclosed examples.
- Build and all 13 maintained Node suites passed. Chromium 390/430px passed
  public card→detail→audio currentTime advance→pause→save→Collection→reopen→reload,
  Search 3 public results and 4 after the user's own Mix, and the full existing
  synthetic-mic participation→Review→submit→Auto Mix→Completed path.
  No page/console errors or horizontal body overflow.
- The out-of-range participation correction was separately deployed to original
  Production as `03018cd` before completing this catalogue work.
- Updated the existing hourly integration automation's deployment destination and
  direct-participation instructions; cadence/expiry and standalone protection stay.

## Direct participation and deployment decision · 2026-10-21

- User explicitly authorized integrating the verified design into main and serving
  all subsequent verified corrections from https://ieum-v2-react.vercel.app.
  This supersedes the earlier Preview-only/main-protection instruction for this task.
- User explicitly requires direct participation even outside the registered Part
  range. Removed the range-based disabled attribute AND the action-handler range
  rejection. Keep the registered profile, actual seat/Track ownership and repeated
  request protections. Multiple-project participation is not a prohibited policy.
- Range comparison remains advisory. Current Notion PRD and Screen Spec were
  updated accordingly; candidate ranking is not changed by this direct-entry fix.
- Existing range gate dates to 2026-10-07 23:40 KST, commit 48f8aaf; it was not
  introduced by the design integration.
- Build and real Chromium 390/430px passed with registered C4-D4 against Tenor
  C3-G4: button enabled, action reaches Workspace and no submitted Track is added.
- Public completion discovery is deployed and verified below.
- Repeated-request protection means preventing a repeated click from saving the
  same operation twice; it is not a new restriction on joining multiple Projects.

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

- Read AGENTS.md and docs/GIT_WORKFLOW.md. Earlier branch/Preview-only scope was
  superseded by the user's explicit original-Production integration decision.
  Figma image downloads are not a global prerequisite.
- Requested Notion DESIGN_SYSTEM, IA, PRD, flow and screen specification were read
  through the Notion connector. Current PRD and Screen Spec were updated for the
  user's direct-participation decision and clarified repeated-request wording.
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
Completed results open the matching public example, main or created Project;
unavailable real community results are not fabricated. My Voice opens from the primary headers and Back restores
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

## Original Production verification — previous runtime

- URL: https://ieum-v2-react.vercel.app.
- Deployment: `dpl_Et9Ra7VpMuyGi3RK6hrt7yh9Xm4R`, READY, Git Integration,
  Production, exact runtime SHA `b3069a31fe929ead330e0b9b4fcf98a5308c93b5`.
- Actual remote Chromium at 390/430px confirmed three independent public examples,
  exact Complete detail, actual audio currentTime advance/pause and reload.
- Registered C4-D4 against Tenor C3-G4: enabled button and actual join to Workspace.
  No page errors or horizontal overflow. Isolated test contexts only.
- Served JS `index-BmmlD67C.js` matches the tested local production build.
- Local build, all 13 maintained Node suites and full 390/430px browser integration
  passed, including synthetic-mic recording/Review/submit/Auto Mix/Completed.
- Public discovery endpoint is not configured (503 SERVICE_NOT_CONFIGURED).
  Physical microphone, audible quality and real multi-user operation are unverified.

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

4. Connect real public completed-result data and playable Mix resources when the
   backend is configured. Keep IEUM Originals examples clearly labelled and
   independent from personal participation, submitted Tracks and actual user Mixes.
