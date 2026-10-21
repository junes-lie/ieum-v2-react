## Search input focus / short viewport · 2026-10-21

- Code `ef4f953717bbb460587cd7dfe6d7f9de288c3584`, resumed from fresh `abe12ee`.
  Acquired/rechecked expected-HEAD shared lock
  `automation-figma-v2-20261021T125800Z-e6c6de6fbc91`; this checkpoint releases only that owner.
- Read full checkpoint/rules, current Notion DS/Search spec and fresh Figma
  Search Input `1375:21551` high-fidelity context/screenshot. Fresh snapshot
  reused only bytes matching current remote Git blob hashes.
- Reproduced no input focus indicator and a 30×44px clear target at both widths.
  Added scoped 2px field focus, 44×44px clear target, existing Font Awesome
  close icon and input focus restoration after clearing. Default 48px field,
  source surface/spacing, query/filter/tab/scroll logic and Song identities remain.
- Build + all 13 Node suites passed. New maintained input browser QA passed
  390/430px resized from 932px to 568/360px: actual typing, keyboard clear/focus
  return, filters/Apply, native sort, result/detail Back and My Voice return.
  Focused controls remain above fixed navigation; Tracks/join/saves stay unchanged.
  Inspected actual field/filter renders. Viewport resizing is not native IME proof.
- Existing Search geometry/2x CSS text QA passed 390/430px; independent tab
  query/filter/sort/scroll and history/Home shortcut QA passed 390/430/1100px.
  Full core reduced-motion Chromium replay passed 390/430px: playback/save,
  Search/My Voice/Back, participation, synthetic mic pause/resume/Review/direct
  submit, final-Track Auto Mix and nonempty completed Mix; no page/console errors.
  Audio/storage/renderer/assets unchanged; physical mic/listening/device zoom unverified.
- `npm run qa:capture`: `qa/captures/2026-10-21T13-06-57-163Z/`,
  14 entries × both widths, 28 captured/0 failures. Undeployed-code HTML/ZIP
  includes 56 entry PNGs plus 14 before/short-viewport input/filter/return captures.
  Images/results excluded from Git. Build `index-D3TvKu1O.js` / `index-CrdW9p2N.css`.
- Original https://ieum-v2-react.vercel.app returns 200 with old
  `index-BmmlD67C.js` / `index-BqlZo9hY.css`; Production remains READY `b57c1d4`.
  Main `caa0f30` / standalone `3d82976` unchanged. No deployment/main advance
  before recorded retry time `2026-10-21T22:07:09Z` (Oct 22 07:07 KST).
- Next: verify short-height Workspace/Recording/Review controls and recovery
  against current confirmed source; preserve existing recording/Guide/storage.
  All earlier unfinished verified personal imagery/lyrics/backing, independent
  renderer/3D, community data and final physical/visual checks remain open.
  After the retry window, recheck user's main changes before original-project
  integration/deployment and verify exact READY commit, deployed assets and URL.

## Search text enlargement · 2026-10-21

- Code `c011ccebfa5123a491cc7fdb8ef6b56fabe6ff82`, resumed from fresh `3f3e173`.
  Acquired/rechecked expected-HEAD lock `automation-figma-v2-20261021T120259Z-e6c6de6fbc91`;
  this checkpoint releases only that owner.
- Read current Notion DS/Search specification and fresh Figma section `1396:30802`,
  Result row `1375:21370`, Filters `1375:21566` and Tabs `1375:21556`
  high-fidelity child contexts/screenshots. Reconstructed the fresh source snapshot
  using remote Git blob hashes after workspace maintenance; no old folder was trusted.
- Reproduced 2x CSS text causing 480/484px body widths in 390/430px viewports,
  clipped project-tab labels and truncated selected sort text. Four scoped CSS
  changes let tabs grow, filters wrap and native sort use its intrinsic width.
  Normal 44px tabs, 48px input, summary y=260, result y=296 and 92px artwork remain.
  Actual Song IDs/titles/artists and all existing static artwork are unchanged.
- Build + all 13 maintained Node suites passed. New maintained Search text QA
  passes all three tabs at 390/430px: complete labels, controls inside the frame,
  actual long Song titles/metadata inside rows, filter application, keyboard result
  entry/Back and unchanged Tracks/participation/saves. Actual renders inspected.
  Existing Search geometry QA passes both widths; independent query/filter/sort/
  scroll, detail/public-result/My Voice Back and Home shortcut QA passes 390/430/1100px.
- Full core reduced-motion Chromium replay passed 390/430px through playback/save,
  Search/My Voice/Back, participation, synthetic mic pause/resume/Review/direct submit,
  final-Track Auto Mix and nonempty completed Mix; no page/console errors.
  App/audio/storage/renderer/capture-helper files remain hash-identical.
  Physical mic/listening and native-device text zoom remain unverified.
- `npm run qa:capture`: 14 entries × both widths, 28 successes/0 failures, output
  `qa/captures/2026-10-21T12-16-54-630Z/`. Standalone HTML/ZIP labelled undeployed
  `c011cce` contains 56 entry PNGs plus 12 before/after Search text captures.
  Captures/results are not committed. Build `index-B2wSvfLx.js` / `index-zEUWBWI4.css`.
- Original https://ieum-v2-react.vercel.app still returns 200 with old
  `index-BmmlD67C.js` / `index-BqlZo9hY.css`; original-project Production remains
  READY `b57c1d4`. Main `caa0f30` / standalone `3d82976` unchanged. No deployment
  request/main advance before recorded `2026-10-21T22:07:09Z` (Oct 22 07:07 KST).
- Next: verify Search input/filter/Back in shorter 390/430px viewports (keyboard-size
  emulation, not a native IME claim). Preserve all earlier unfinished real personal
  imagery/lyrics/backing, independent renderer/3D, community data and final physical/
  visual checks. After the retry window, recheck user's main changes before original-
  project integration/deployment and verify exact READY commit, assets and URL.

## Review/Submitting text reflow · 2026-10-21

- Code `e96f41918466f9544d9ae0ee6bb6f0fc212e6645`, resumed from fresh `cd2c84b`.
  Expected-HEAD lock `automation-figma-v2-20261021T105512Z-e6c6de6fbc91`
  was acquired/rechecked; this checkpoint releases only that owner.
- Read current Notion DS/06 specification and fresh Figma Review `1610:41661` /
  Submitting `1610:41923` full contexts, screenshots and component descriptions.
  Reproduced caption/time spilling outside the player and capsule-label clipping
  with long copy and scoped 2x CSS text before changing code.
- Scoped CSS now wraps caption/time and status, grows the player/panel naturally,
  and stacks enlarged actions while keeping original 48px capsules/end caps,
  static artwork and 44px native seek target. Normal 190px panel/58.429px player,
  button dimensions and source positions are preserved (text rounding ≈0.016px).
  App/audio/storage/renderer/demo/capture-helper sources are hash-identical.
- Final build and 13 maintained Node suites passed. New maintained Review QA and
  existing five-state Recorder QA passed Chromium 390/430px: containment/no text
  overlap, seek below copy, readable labels, actual seek/play, retake cancellation,
  Submitting disabled controls, failure/same-Take preservation, reload and retry.
  Actual normal/enlarged renders inspected. Test-only long copy is not app data.
- Full core reduced-motion Chromium replay passed both widths through playback/
  saves/Search/My Voice/Back/participation/synthetic recording/direct submission/
  final-Track Auto Mix/nonempty completed Mix, with no page/console errors.
  Physical microphone/listening and native-device text zoom remain unverified.
- `npm run qa:capture`: 14 entries × 390/430px, 28 successes/0 failures, output
  `qa/captures/2026-10-21T11-03-26-935Z/`. Standalone HTML/ZIP labelled undeployed
  `e96f419` includes 56 entry PNGs plus 10 normal/enlarged comparison PNGs.
  Captures/results are excluded from Git. Build `index-D6J6PtKL.js` /
  `index-Dw29milG.css`.
- Original https://ieum-v2-react.vercel.app remains HTTP 200, old
  `index-BmmlD67C.js` / `index-BqlZo9hY.css`, latest original-project READY
  Production `b57c1d4`. Main `caa0f30` and standalone `3d82976` unchanged.
  No deployment request/main advance before recorded `2026-10-21T22:07:09Z`
  (Oct 22 07:07 KST); these changes are not live.
- Next: verify Search result titles/summary/filter controls with long content and
  2x text, preserving per-tab query/filter/scroll and exact-detail/My Voice Back.
  Keep all earlier unresolved personal resources, real lyrics/backing, independent
  renderer/3D, real community data and final/physical-device checks. After the retry
  window, recheck user's main changes before original-project integration/deployment.

## Current five-state Recording instrument and focus clearance · 2026-10-21

- Code `d92c8914e33cff91bc8a8dfdd6132479b75ce1b9`, resumed from fresh `ed14639`.
  Acquired/rechecked the expected-HEAD shared lock; this checkpoint releases only
  `automation-figma-v2-20261021T100037Z-e6c6de6fbc91`.
- Re-read current Notion DS/screen specification and confirmed Figma Instrument set
  `1478:33671`, Ready `1478:32684`, Recording `1478:32190`, Paused
  `1478:33178`, Review `1610:41661` and Submitting `1610:41923`, with source
  screenshots and current component descriptions. Applied the current five-state
  design while preserving existing recording/submission policy and data.
- Ready now shows the original red circle and grooved Gold Start. Recording/Paused
  use left Smoky Restart, central Gold Pause/Resume and right Smoky Stop. Connected
  the exact native 96px PNG face (Start/Pause/Resume exports are byte-identical),
  original red icon, 149×48 Retake/Submit surfaces, 310×48 loading surface and Upload
  icon; .88 scale, rims/reflections and existing side surfaces are preserved.
- Review uses the approved compact 190px panel and original player surface with
  actual Take duration/playback/44px seek target. Existing analysis warnings remain
  below it. Submitting pauses playback, disables seek/play/submit and hides Retake.
  Failure preserves the same Take and restores retry; existing submit ownership,
  draft cleanup, Track storage and Auto Mix contracts remain intact.
- Reproduced native Tab focus hiding the Home project CTA behind fixed navigation
  (390px bottom 915 vs footer top 856). Added scroll-padding only; normal layout
  dimensions are unchanged. Maintained focus QA passes Home/Search/Workspace at
  390/430px and 1100px desktop frame, including the ready native Workspace slider.
- Final build + all 13 maintained Node suites passed. Updated Recording Chromium
  QA passes 390/430px: original asset/geometry/typography, no mic on entry, synthetic
  start/pause/frozen time/resume/retake cancellation/stop, Review reload/playback,
  Submitting disabled state, controlled submit failure/same-Take preservation/retry,
  unchanged pre-submit Tracks and scoped 2x control text stress.
- Core reduced-motion Chromium replay passed both widths through public playback/
  save, Search/My Voice/Back, participation, synthetic recording/Review/direct submit,
  final-Track Auto Mix and a nonempty completed Mix; no page/console errors.
  Physical microphone/listening and native-device zoom remain unverified.
- `npm run qa:capture`: all 14 entries × 390/430px (28 successes, 0 failures), at
  `qa/captures/2026-10-21T10-20-30-813Z/`. Delivered standalone HTML/ZIP labelled
  undeployed `d92c891`, with 56 entry PNGs/manifest plus 10 Recording-state PNGs.
  Generated images/results are not committed. Actual renders were inspected.
- Build: `index-TNy5QXBe.js` / `index-BAoZ7zk8.css`. Renderer/audio/storage
  source files and standalone are unchanged; no original Notion/Figma source edits.
- Original https://ieum-v2-react.vercel.app still returns 200 with old
  `index-BmmlD67C.js` / `index-BqlZo9hY.css`; latest original-project Production
  remains READY `b57c1d4`. Main `caa0f30`, standalone `3d82976` unchanged.
  No deployment request/main advance before `2026-10-21T22:07:09Z`
  (Oct 22 07:07 KST). This code is not live.
- Next: verify Review/Submitting long-copy and enlarged-text reflow without changing
  native state/save contracts, then compare any remaining confirmed Home/Workspace/
  Recording/Search differences. Preserve unresolved verified personal imagery,
  actual lyrics/backing, independent renderer/3D, real community results, final
  visual acceptance and physical-device checks. After the retry window, recheck
  user's main changes before original-project integration/deployment and verify
  exact READY commit, assets and original URL.

## Current Gold First screen controls · 2026-10-21

- Code `cc09abe108659d477f114c8dc2f51a266cc055b6`, resumed from fresh `289aadd`.
  Expected-HEAD lock `automation-figma-v2-20261021T090020Z-e6c6de6fbc91`
  was acquired/rechecked; this checkpoint releases only that owner.
- Re-read current Notion DS/screen spec and Figma screen instances
  `1488:33867` / `1432:40200`, screenshots and Default/Playing/Disabled variants.
  Current confirmed instances now use Gold First Project `1583:54015` and Player
  `1583:54325` / `1583:54487`; the older Notion DS still describes Smoky.
  Applied this screen-specific visual change without editing either original source.
- Connected exact text-free 382×48 / 48×48 original gold surfaces, preserving their
  light, double rim and native dimensions. Project uses original Pretendard Medium
  15/22 and black label; Player uses black Play/Pause. Existing native actions remain.
  The 350px Project retains fixed 24px end caps. Home 36px completion controls stay
  Smoky; zero-selection Player retains original Smoky Disabled with .38 opacity.
  Previously connected assets remain available; no global button recoloring.
- Build + all 13 maintained Node suites passed. Project-button and updated Workspace
  timeline Chromium QA passed 390/430px: exact assets, native geometry/uncut edges,
  label weight, actual click/Back, playback/pause, keyboard seek, disabled/re-enable,
  unchanged Tracks and 2x text stress. Actual Project/Player renders match source.
- Core reduced-motion Chromium replay passed 390/430px through public playback/save,
  Search/My Voice/Back, participation, synthetic-mic pause/resume, Review, direct
  submit, final-Track Auto Mix and nonempty completed Mix; no page/console errors.
  Physical microphone/listening and native-device zoom remain unverified.
- `npm run qa:capture`: all 14 entries × 390/430px captured (28 successes, 0 failures).
  Standalone `index.html` and ZIP contain 56 PNGs/manifest and the explicit undeployed
  revision `cc09abe108659d477f114c8dc2f51a266cc055b6`. Output:
  `qa/captures/2026-10-21T09-07-50-813Z/`. Generated images are not committed.
- App orchestration/renderer/audio/storage remain hash-identical; no standalone edit.
  Build `index-DONnJNGC.js` / `index-CyMBskLg.css`.
- Original https://ieum-v2-react.vercel.app still returns 200 with old
  `index-BmmlD67C.js` / `index-BqlZo9hY.css`, READY Production `b57c1d4`.
  Main remains `caa0f30`, standalone `3d82976`. No deployment request/main advance
  before recorded retry `2026-10-21T22:07:09Z` (Oct 22 07:07 KST). Code is not live.
- Next: check actual keyboard-focus scroll clearance above BottomNavigation on
  Home/Search/Workspace at both widths, addressing only reproduced failures.
  Preserve unresolved verified personal imagery, real lyrics/backing, independent
  renderer/3D, real community results, final visual and physical-device verification.
  After the retry window, recheck user's main changes before original-project
  integration/deployment and verify exact READY commit, assets and original URL.

## Shared BottomNavigation refinement · 2026-10-21

- Runtime code `4b0242d80052eaefd8674a12130cba160e19c2b0`; latest code/QA `92b492286d131248856d6b0f0cd07aa5e5b9cb59`.
  Resumed from fresh `283f20e`, preserving the user's capture helper and AGENTS rules.
  Acquired/rechecked the existing expected-HEAD shared lock; this checkpoint releases
  only `automation-figma-v2-20261021T080458Z-e6c6de6fbc91`.
- Read current Notion Design System/screen specification and confirmed Figma
  BottomNavigation `1241:3080` / Workspace instance `1471:32163`, including its
  screenshot and four variants. Connected original 20px Home/Search/Projects/Collection
  active/inactive icons; fixed the old inherited label font/tracking, 52px targets,
  80×76 radial lighting and 40×1.5 top indicator. Existing four routes are unchanged.
- Build and all 13 maintained Node suites passed. New maintained
  `qa/verify-bottom-navigation-browser.mjs` passed 390/430px and 1100px frame:
  four active states, asset decoding, exact geometry/typography, keyboard navigation,
  My Voice Back, last Home CTA clearance and unchanged participation/Tracks.
- Core Chromium replay passed 390/430px with reduced motion and synthetic mic:
  public playback/save/reload, Search/Back, participation, Workspace playback,
  pause/resume, Review, direct submit, final-Track Auto Mix and nonempty final Mix.
  Seven-scene demo menu/reset/storage-isolation/Back regression also passed.
  Physical microphone/listening remain unverified.
- Fixed capture-only Chromium failure between viewport contexts by removing
  `--single-process`. `npm run qa:capture` then captured all 14 entries at both
  widths (28 successes, 0 failures; 56 full-content/viewport PNGs). Standalone
  `index.html` and ZIP include actual revision `92b492286d131248856d6b0f0cd07aa5e5b9cb59`,
  explicit undeployed label and manifest. Output:
  `qa/captures/2026-10-21T08-18-27-603Z/`; generated images are not committed.
  Inspected actual Home/Workspace/Recording/Search viewport renders.
- Renderer/audio/storage and user's package/AGENTS changes remain hash-identical.
  Build assets: `index-Dr9JzQ2z.js` / `index-BjEK6ONX.css`.
- Original https://ieum-v2-react.vercel.app returns HTTP 200 with old
  `index-BmmlD67C.js` / `index-BqlZo9hY.css`; original Production remains
  READY `b57c1d4`. Main stays `caa0f30`; standalone stays `3d82976`.
  No deployment request/main advance: retry after `2026-10-21T22:07:09Z`
  (2026-10-22 07:07 KST). These changes are integration-only.
- Next: use the current confirmed screens and captured renders to address any
  evidenced long-content, focus/text-enlargement or safe-area mismatch without
  repeating completed layout work or redesigning unconfirmed screens. Preserve
  unresolved verified person-owned imagery, actual lyrics/backing, independent
  renderer/3D, real community results, final visual and physical-device checks.
  After the recorded retry time, recheck user's main changes and deploy only the
  verified latest integration to the original project, then verify commit/assets/URL.

# Figma V2 integration checkpoint · 2026-10-21

## User-visible screen capture delivery · 2026-10-21

- Added `npm run qa:capture`: 14 screen entries, paired full-content/unaltered viewport PNGs, self-contained HTML gallery, version-labelled manifest and visible failures.
- Outputs persist under `qa/captures/<timestamp>/`; screenshots remain untracked. See `qa/README.md` for delivery and environment settings.
- Verified 430px current Production b57c1d4: all 14 entries captured; pre-design a20cf97: 12 captured, Search and completed result unavailable in that version/context and reported as failures. These are deployed-build captures, not integration-HEAD fidelity evidence.
- No app, audio, renderer, product policy or deployment changes. This capture helper does not cover every substate or replace functional QA.


## Recording heading/lyrics rhythm · 2026-10-21

- Code `6bd205db1ed27c2b6b2065f7e5a0bab4c44e4bfc`, based on `f6040bd`; this checkpoint releases only
  `automation-figma-v2-20261021T065546Z-e6c6de6fbc91` after expected-HEAD/owner checks.
- Read current Notion DS/screen spec, fresh Figma identity `1459:31223`,
  lyrics `1459:31266` contexts/screenshots and full Recording screenshot.
- Corrected EN heading to Montserrat 18/24, KR fallback to Pretendard, metadata
  to Pretendard 12/16 and centered max-280px identity. Removed Grid auto-stretch:
  title y=26, monitoring y=104, lyrics y≈284.8 (browser border rounding), panel y=752.
  Background no longer contributes to grid row sizing. Existing 24/32px lyric
  hierarchy, graphics engine, real Song/Project/Part/Key and all actions remain.
- Build + 13 Node suites passed. New Chromium copy-layout QA and existing
  instrument QA passed 390/430px: source geometry, isolated timed-text fixture,
  missing-source notice, long mixed-language/2x text reflow, actual synthetic
  recording/pause/stop, Review/Back/re-entry persistence. Actual renders inspected.
  Core reduced-motion replay also passed both widths through direct submission,
  final-Track Auto Mix and nonempty completed Mix, Search/My Voice/Back/play/save.
- No new lyrics/backing supplied: QA text is test-only and never added to catalogue.
  Renderer/audio/storage/Guide/assets unchanged. Physical mic/listening, native-device
  zoom, verified personal artwork, separate 3D/community integration and final visual
  acceptance remain open. Build `index-BNFpUN1H.js` / `index-BSCNX0Q8.css`.
- Production remains READY `b57c1d4`; https://ieum-v2-react.vercel.app returns 200,
  old `index-BmmlD67C.js` / `index-BqlZo9hY.css`. Main `caa0f30` unchanged.
  No deploy request during recorded wait through 2026-10-21T22:07:09Z; code is not live.
- Next: compare shared BottomNavigation active/inactive surface, label typography
  and geometry with its current Figma component at 390/430px; preserve all routes
  and previously verified controls. Recheck main/Production after the retry window.

## Recording instrument/control alignment · 2026-10-21

- Code `fa3e32a7cba690ca8ac8f8349907819794d41435`, based on `dd53a46`; expected-HEAD lock
  `automation-figma-v2-20261021T060443Z-e6c6de6fbc91` is released by this checkpoint.
- Read current Notion DS/screen spec, fresh Recording `1459:31183` screenshot,
  Instrument `1478:32685` full context/screenshot and exact child bounds.
- Connected original text-free 72/96px RecordingControl surfaces exported read-only
  from `1303:2929` / `1303:3085`; native dimensions retained with uniform .88
  scale to 63.36/84.48px. Original rims/reflections, 24px gaps, side 10.56px
  vertical offset, icon sizes, scaled labels and right-rotate restart icon match.
  Existing Ready start, restart confirmation, stop, pause/resume handlers remain.
- Baseline panel is 160px with 10px radius and centered max-310px readout/controls.
  Removed inherited time-row bottom margin; readout uses Montserrat 11/16 Meta.
  Real elapsed/recording limit, measured dBFS and quality warnings remain truthful.
  Panel grows for warnings/enlarged text. Entry still never requests microphone.
- Build + all 13 Node suites passed. Maintained new Chromium QA passed 390/430px:
  decoded exact local surfaces, control/label geometry, actual synthetic recording,
  frozen paused time, keyboard resume, retake cancellation, stop without submission,
  Review reload persistence, no automatic mic and scoped 2x text/line-height stress.
  Inspected actual Ready/REC/Paused/full Recording renders against source.
- Core reduced-motion replay passed both widths: public playback/save/Search/
  My Voice/Back, participation, synthetic-mic pause/resume/Review/direct submit,
  last-Track Auto Mix and nonempty completed Mix, no page/console errors.
  Existing 7-scene presentation suite also passed: desktop/390/430, direct entries,
  recording/submission, reset/storage isolation and Back.
- No renderer/audio/storage/Guide/lyrics or standalone changes; renderer remains
  `74d7559e8ca1c6ff2cd1aeb1c73b13fe2211ace6`.
  Build `index-Dx00IG1O.js` / `index-DlFn1Z5d.css`.
- Production remains READY `b57c1d4`; https://ieum-v2-react.vercel.app returns 200
  with old `index-BmmlD67C.js` / `index-BqlZo9hY.css`. Main remains `caa0f30`.
  No deployment request/main advance during recorded wait through
  2026-10-21T22:07:09Z. New code is integration-only, not deployed.
- Next: compare Recording heading/lyrics effective typography and vertical rhythm
  with current child contexts; preserve actual content/Guide/Review and no count-in.
  Verified personal artwork, real lyrics/backing, separate 3D/community integration,
  physical mic/listening/native-device text zoom and final visual acceptance remain
  open. Recheck main/Production after the recorded retry window.

## Workspace Player and Current Mix timeline · 2026-10-21

- Code `ba7525de96781de0b9dd0772ff597ef8dbd35646`, based on `c900f49`; expected-HEAD lock
  `automation-figma-v2-20261021T050504Z-e6c6de6fbc91` is released by this checkpoint.
- Read current Notion DS/screen spec and fresh Figma Player `1432:40200`,
  Disabled `1480:33659`, timeline `1476:32202` contexts/screenshots and bounds.
- Reused the existing original 48px Player SVG; native 48px button, 14.4px icon,
  original .38 disabled opacity and source placement replace the CSS-gradient
  44px control. Fixed housing/foreground live Record and actual transport remain.
- Workspace stage/timeline share max 370px (350px at 390); stage ratio 370:388,
  11px timeline gap. Removed legacy Player borders/padding/caption in Workspace.
  Current Mix now matches the 72px source: heading/count, 2px live progress,
  split current/total time below the seek bar, Montserrat 11/16 Meta.
  Native seek hit area stays 44px and exposes actual elapsed/total to assistive
  technology. Empty selection disables playback/seek and shows 0:00 duration.
- Build + all 13 Node suites passed. New maintained Chromium QA passed 390/430px:
  exact geometry/local asset bytes, actual audio advance/pause, keyboard Home/
  End/arrows, individual Track/Mix return, zero-selection disable/re-enable,
  unchanged submitted count, no automatic mic, full timeline exposed above nav.
  Inspected actual stage/timeline captures. Scoped 2x text/line-height stress
  reflows without clock clipping/heading overlap; this is not native-device zoom.
- Core reduced-motion replay passed both widths: public save/playback/Search/
  My Voice/Back, participation, synthetic-mic pause/resume/Review/direct submit,
  last-Track Auto Mix and nonempty completed Mix. No page/console errors.
  Physical microphone, audible listening and final visual acceptance remain open.
- Renderer remains `74d7559e8ca1c6ff2cd1aeb1c73b13fe2211ace6`; no standalone,
  Song identity, storage, recording engine or mixing algorithm changes.
  Build `index-C6oZPXEy.js` / `index-C6eKzezb.css`.
- Production still READY `b57c1d4`; https://ieum-v2-react.vercel.app returns 200
  with old `index-BmmlD67C.js` / `index-BqlZo9hY.css`. Main remains `caa0f30`.
  No deployment request/main advance during the recorded wait through
  2026-10-21T22:07:09Z. This change is pushed to integration, not deployed.
- Next: compare Recording Instrument panel/readout/control spacing and typography
  against its latest confirmed child contexts. Preserve live input/Guide/Review.
  Keep verified personal artwork, real lyrics/backing, separate 3D/community
  integration and physical/final checks open. Recheck main/Production after wait.

## Home recommendation/completion cards · 2026-10-21

- Code `32b2a5981ef44c80a36393bb2a7bba565d412dcf`, based on `0c5ce63`; expected-HEAD lock
  `automation-figma-v2-20261021T040013Z-e6c6de6fbc91` is released by this checkpoint.
- Read current Notion DS and fresh Figma Home/recommendation/completion card
  contexts and screenshot. Reproduced 44px heading rows instead of 30px,
  14px excess card offsets, reduced mobile headings and missing Player surface.
- Matched 24/30 headings, 74px recommendation and 78px completion-list offsets;
  44px heading action targets remain. Recommendation count uses Meta 11/16;
  existing three-column covers, real Song IDs/titles/artists are unchanged.
- Completed cards use proportional artwork/detail columns, source gaps, status
  capsule, EN/KR 18/24 titles and separate truthful byline/actual Mix duration.
  Reuses existing fmt; unavailable duration is shown as —. Exported original
  text-free 48px Player surface read-only and uniformly scales it/icon to 36px.
  Existing whole-card native button owns detail navigation; no nested controls.
- Build + all 13 Node suites passed. New maintained Chromium QA passed 390/430px:
  geometry, decoded 36px surface/10.8px icon, exact labels/time, native click and
  keyboard result selection, actual audio playback/pause, detail Back, completed
  Search shortcut, unchanged Tracks and scoped 2x text-size stress. This is not
  native-device text zoom. Actual recommendation/completion renders inspected.
- Core reduced-motion replay passed both widths: public save/playback/Search/
  My Voice/Back, participation, synthetic-mic pause/resume/Review/direct submit,
  final-Track Auto Mix and nonempty Mix; no page/console errors.
- Existing dynamic completed Record renderer remains, not final Figma 3D artwork;
  no standalone/algorithm/data changes. Renderer `74d7559e8ca1c6ff2cd1aeb1c73b13fe2211ace6`.
  Build `index-Iv76UDwX.js` / `index-BCp3EbB-.css`.
- Production still READY `b57c1d4`; https://ieum-v2-react.vercel.app returns 200,
  old `index-BmmlD67C.js` / `index-BqlZo9hY.css`. Main stays `caa0f30`.
  No deploy request/main advance during recorded 24h wait from
  2026-10-20T22:07:09Z; this change is integration-only.
- Next: compare Workspace original Player and 370×72 Current Mix timeline,
  reusing the now-local Player surface where appropriate. Keep verified personal
  artwork, real lyrics/backing, separate 3D/community integration, physical mic/
  listening and final visual acceptance open. Recheck main/Production after retry window.

## Home artwork and recent cards · 2026-10-21

- Code `c99704111e533f210dd6ca2a4679a3fac12fc959`, based on `83601e5`; expected-HEAD lock
  `automation-figma-v2-20261021T025912Z-e6c6de6fbc91` is released by this checkpoint.
- Read current Notion DS and fresh Figma Home/Hero/recent-card EN/KR contexts
  and screenshot. Reproduced 40px of extra horizontal Hero cropping at 390px,
  and recent-title reduction to 14px (390) / 16px (430), versus source 18/24.
- Reused the unchanged Hero at its original aspect ratio; 430px retains 430×400,
  390px fits the complete width. Native bottom fade follows the scaled artwork;
  copy remains editable and can wrap without clipping. Hero slot stays 400px.
- Recent cards use original 18/24 EN/KR roles, 24/30 heading, 12px gaps,
  secondary Meta sizing, 76px role column and natural height for long content.
  Sleeve 54px border/radius and 56px live Record x=14 now match source.
  Actual Song titles/IDs/artists/covers, Track graphics and actions are unchanged.
- Build and all 13 Node suites passed. New maintained browser QA passed 390/430px
  no extra Hero crop, artwork containment, card text geometry, exact detail/Back
  and scoped 2x text-size stress without overlap/body overflow. This stress is
  not native device text zoom. Existing heading/navigation QA also passed both.
- Core reduced-motion Chromium replay passed both widths: public playback/save,
  Search/My Voice/Back, participation, synthetic-mic pause/resume/Review/direct
  submit/final-Track Auto Mix/nonempty completed Mix; no page/console errors.
  Physical microphone/listening and complete visual acceptance remain open.
- Hero blob unchanged `0b5ee388ac65c4f7b0ba99d75c02f986ad84c7e4`;
  renderer unchanged `74d7559e8ca1c6ff2cd1aeb1c73b13fe2211ace6`.
  Build: `index-BV-kh_3J.js` / `index-B4ckuCpt.css`.
- Production still READY `b57c1d4`; https://ieum-v2-react.vercel.app returns 200
  with old `index-BmmlD67C.js` / `index-BqlZo9hY.css`. Main remains `caa0f30`.
  No deployment request/main advance during recorded 24h wait from
  2026-10-20T22:07:09Z. This change is integration-only.
- Next: compare remaining Home recommendation/completion-card typography and
  spacing against current source. Preserve unresolved person-owned artwork,
  real lyrics/backing, separate 3D/community integration and physical/final checks.
  Recheck main/Production after the recorded retry window before integrating.

## Home/Workspace heading rhythm · 2026-10-21

- Code `6694335b0e4a03ae844f5abc79fb55666354962c`, based on `d798702`; shared expected-HEAD lock
  `automation-figma-v2-20261021T020010Z-e6c6de6fbc91` is released by this checkpoint.
- Read current Notion DS/screen specification and fresh Figma Home/Workspace,
  header/copy/recruitment/Song identity child contexts and full screenshots.
- Removed the legacy 88px/padded Workspace header override: current header is
  60px, centered IEUM 15/22, Back 44px at y=8, identity begins y=61.
  Metadata uses original secondary color and 16px line-height. Real long Song
  titles wrap; actual Key/submitted count, Like and Back actions are preserved.
- Home uses 32/40 Hero title and 15/22 copy within both widths. Recruitment
  heading/description/navigation/stage now follow original vertical positions;
  30px heading and 35px navigation retain separate 44px button targets.
  Selected project title uses original 36/40. Existing image assets are reused.
- Build + all 13 Node suites passed. Maintained new heading QA passed 390/430px
  exact geometry, unclipped copy/two-line actual Song title, Like and navigation.
  Inspected actual Home/Workspace renders. Core reduced-motion Chromium replay
  passed both widths: playback/save/Search/My Voice/Back, participation,
  synthetic-mic pause/resume/Review/direct submit/final-Track Auto Mix/nonempty Mix.
  No console/page errors. Physical microphone/listening remains unverified.
- Renderer unchanged `74d7559e8ca1c6ff2cd1aeb1c73b13fe2211ace6`.
  Build: `index-BMTkIH10.js` / `index-CLBRgAIa.css`.
- Production still READY `b57c1d4`; https://ieum-v2-react.vercel.app returns 200,
  old `index-BmmlD67C.js` / `index-BqlZo9hY.css`. Main remains `caa0f30`.
  No deploy request/main advance during the recorded 24h wait from
  2026-10-20T22:07:09Z; these changes are not live.
- Next: inspect existing 390px Hero artwork crop and remaining Home recent-card
  typography against current source. Preserve unresolved person-owned artwork,
  actual lyrics/backing, independent 3D/community integration and physical/final
  visual checks. Recheck main/Production after the recorded retry window.

## Workspace original control surfaces · 2026-10-21

- Code `832bad9bc01320c3e4eb207bc3c4431b062dc46b`; resumed from `5c91769`.
  Acquired/rechecked the shared expected-HEAD lock; this checkpoint releases only
  `automation-figma-v2-20261021T010246Z-e6c6de6fbc91`.
- Read current Notion Design System and Figma Workspace/Part child contexts and
  screenshots. Exported only original text-free RecordCompact, disabled VocalFinder
  and Track PlayControl surfaces through the read-only Plugin API; source unchanged.
- Connected exact 84×40 compact and 32×32 Track surfaces, original 14px icons,
  12/16 compact labels, and already-connected Toggle artwork at 33.12×18.72.
  Disabled labels remain full-opacity secondary text; only the original surface
  carries 0.32 opacity. Existing availability/actions and native 44px targets remain.
  Cards retain 99px minimum width: the Part row scrolls at 390px without body overflow.
- Build and all 13 Node suites passed. New maintained Workspace browser QA passed
  390/430px: decoded exact asset bytes, surface/control geometry, nonoverlapping
  targets, disabled state, Space/click inclusion, actual Track playback and Record
  entry with no automatic microphone activation. Actual renders inspected.
- Core Chromium replay passed 390/430px with reduced motion and synthetic mic:
  public playback/save/reload, Search filters/Back/My Voice, participation,
  Workspace transport, pause/resume, Review, direct submit, final-Track Auto Mix
  and nonempty completed Mix; no page/console errors. Physical mic/listening remain unverified.
- Renderer remains `74d7559e8ca1c6ff2cd1aeb1c73b13fe2211ace6`.
  Build assets: `index-jCmHpfwb.js` / `index-C4ZNvdEa.css`.
- Original https://ieum-v2-react.vercel.app returns HTTP 200 with old
  `index-BmmlD67C.js` / `index-BqlZo9hY.css`; Production remains READY `b57c1d4`.
  Main stays `caa0f30`. No deployment request/main advance: recorded 24h wait
  from 2026-10-20T22:07:09Z remains in effect; this code is integration-only.
- Next: compare current confirmed Home/Workspace header, title and vertical spacing
  against fresh Figma and fix remaining evidenced differences. Preserve unresolved
  verified person-owned artwork, actual lyrics/backing, independent 3D, real community
  results and physical-device/final visual checks. Recheck main and original-project
  deployment after the recorded retry window before integrating the verified result.

## Search tab context repair · 2026-10-21

- Code `b8e362ba07bb3c275339424b5e895283a6d5b0a8`; resumed from `175808e`.
  Acquired/rechecked the shared expected-HEAD lock; this checkpoint releases only
  `automation-figma-v2-20261020T235508Z-e6c6de6fbc91`.
- Current Notion 01S requires per-tab query/filter/scroll retention. Reproduced
  the previous shared-query/reset-on-switch failure before editing. Read current
  Figma Search tab source/screenshot; existing visual geometry is unchanged.
- Each tab now retains its own query, genre, Part/range filter, sort and scroll.
  Search snapshots survive detail/completed-result/My Voice Back and browser
  history. Global Search resumes its tab; explicit Home shortcuts select the
  requested tab without overwriting its preferences. Repeated active-tab taps
  preserve the list position. No participation/Track/save changes.
- Build and all 13 Node suites passed. Maintained Search geometry QA passed
  390/430px. New `qa/verify-search-context-browser.mjs` passed 390/430px
  window scrolling and 1100px desktop frame scrolling, independent settings,
  Back/Forward, Home shortcuts and unchanged Tracks/participation/saves.
- Core Chromium replay passed 390/430px with reduced motion and synthetic mic:
  public playback/save/reload, Search filters/Back, participation, Workspace
  playback, pause/resume, Review, submit, Auto Mix and nonempty final Mix.
  Actual Search render inspected; physical microphone/listening remain unverified.
- Renderer still `74d7559e8ca1c6ff2cd1aeb1c73b13fe2211ace6`.
  Build assets: `index-nqWNKXIK.js` / `index-BowQL69Z.css`.
- Original https://ieum-v2-react.vercel.app returns HTTP 200 and old
  `index-BmmlD67C.js` / `index-BqlZo9hY.css`; latest Production remains READY
  `b57c1d4`. Main stays `caa0f30`. No deployment request/main advance:
  recorded 24h wait from 2026-10-20T22:07:09Z is respected.
- Next: compare current Figma Workspace compact Record/VocalFinder/Track controls
  with their runtime surfaces and fix verified differences. Keep unresolved
  verified person-owned artwork, actual lyrics/backing, independent 3D, real
  community results and physical-device/final visual checks open. Recheck main
  and original-project deployment after the recorded retry window; never claim
  these integration-only changes are live.

## Search layout refinement · 2026-10-21

- Code `eaef0ef0fab18b235223cbfa55076ece3f3ff411` is saved to integration; resumed from `d71c000`.
  Expected-HEAD shared lock owner: `automation-figma-v2-20261020T2302Z-e6c6de6fbc91`.
- Read current Notion Design System / Search screen specification and Remote Figma
  Search source + screenshot, header/input/tabs/filters/result child contexts.
- Matched Search header/input/tab/filter/summary spacing, 92px artwork, 18/24 titles,
  129px borderless rows and 34px pill surfaces with 44px real control targets.
  Tab order follows current Figma (Song / recruitment / completion). Existing
  Song IDs/covers/routes remain; rows use actual assigned seats and labelled
  presentation audio, with explicit existing detail/listening actions.
- Build + all 13 maintained Node suites passed. New maintained
  `qa/verify-v2-search-browser.mjs` passed Chromium 390/430px geometry, decoded
  artwork, touch targets, exact detail Back, public-example labels and My Voice Back.
  Actual renders inspected. Seven-scenario presentation/storage/reset suite passed.
- Core Chromium replay passed 390/430px: public playback/save/reload, Search
  filters/Back, participation, Workspace transport, fake-mic pause/resume, Review,
  direct submit, final-Track Auto Mix and nonempty final Mix. Used reduced motion
  for this replay. Normal-motion 390 carousel assertions passed before the slow
  software-rendered full replay was stopped; no new complete 430 motion-suite
  acceptance is claimed. No physical microphone or audible-quality claim.
- Renderer remains `74d7559e8ca1c6ff2cd1aeb1c73b13fe2211ace6`.
  Expected build: `index-CiMZyT6E.js` / `index-BowQL69Z.css`.
- Production remains https://ieum-v2-react.vercel.app, HTTP 200, old
  `index-BmmlD67C.js` / `index-BqlZo9hY.css`, READY `dpl_5YYHsXvR2f2SNj2C5k83z2iLC4Ge`
  at `b57c1d4`. Recorded 22:07:09Z rate-limit failure / 24h retry window is
  respected: no new deployment request or main update in this run.
- Next: reproduce Search tab-specific filter/scroll retention against the latest
  screen specification (current tab switches reset filters), then unresolved
  verified personal artwork / lyrics / backing and physical-device preparation.
  Preserve earlier unfinished visual/3D/backend items and existing demo isolation.
  After the recorded retry window, recheck main, integrate verified branch without
  force, and verify the original project/commit/assets before reporting deployed.
- This checkpoint releases only this run's recorded lock.

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
- Code commit: `caa0f30deadf30c66f516576fca0e14615e67427`, saved to integration and main
  by expected-HEAD fast-forward. Own lock was released in that commit.
- Original URL: https://ieum-v2-react.vercel.app returned HTTP 200 but still serves
  `index-BmmlD67C.js` / `index-BqlZo9hY.css`, READY deployment
  `dpl_5YYHsXvR2f2SNj2C5k83z2iLC4Ge` at `b57c1d4`.
- Git Integration rejected `caa0f30` for original Production at 2026-10-20T22:07:09Z
  with `Deployment rate limited — retry in 24 hours.` No new deployment was created.
  The second connected project also failed at 22:07:13Z. Do not retrigger builds
  with empty commits or present the Guide/continuous slide/demo menu as live.
  Retry current verified main through Git Integration after the transient limit clears.
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
   person-owned resources. Guide keyboard and toggle assets are connected. Do not
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
