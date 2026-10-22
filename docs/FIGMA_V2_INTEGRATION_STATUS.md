## Current four-screen Figma applied · 2026-10-22

- User explicitly authorizes the Remote Figma connector; old Desktop-only/Remote-ban statements are superseded for this work. Read current frame `1803:72333`, child structure, full high-fidelity contexts/screenshots for Home `1349:21126`, Detail `1713:43254`, Workspace `1571:41074`, Recording `1754:45723` and lead-in comparison `1795:70268`; retrieved authoritative 2s bar motion. Figma/Notion originals and independent branch were not changed.
- Runtime `6e21463964a4767d44ed8a5576ca41d69cfa8c4a`, final build `index-0T29lLF7.js` / `index-ClaRw0pJ.css`. Home uses exact Figma Hero bytes, 48px section rhythm and actual participant knot/count rows. The previously removed footer stays removed and navigation safe-area clearance stays. Detail's existing bound participation/Workspace action is in document flow between Project and Part Fit, with the shared gold action component. Workspace uses the 56/60 EN title role, responsive 2–4 seat grid, 144px module base and retained transport/record actions. Actual content can wrap; catalogue titles/IDs/keys were not replaced by the design's Gravity/sample values.
- Recording uses the source's separated participant cards, separate backing toggle, right-side vertical 0–100 vocal gain (24x160 native input, 48px scene slot, 16px right inset), compact instrument and editable fades. Added exact source thread image as decorative upper art while retaining the existing live Track-bound Record and WebGL microphone inflow. Lyric bars read real analyser samples and use all 33 exported 2s synchronized CSS keyframe tracks; reduced motion disables their animation. Existing 3s musical lead-in is displayed as the source's countdown readout, with no new audio delay or new Count-in control; bars appear with the first actual lyric.
- Kept existing Like, individual playback, Finder, draft/retry/submission controls and honest missing-source/analysis notices. Design example harmony percentages and personal-AI identity were not fabricated. Approved standalone knot/3D renderer integration is still separate: this pass preserves the existing dynamic Record rather than flattening the screen/Record into Figma screenshots. This is not a claim that the old live algorithm now matches the reference knot.
- Build/all 13 maintained Node suites passed. Updated only two stale Guide selectors to target participant monitoring cards, preserving the strict final-source count/ownership assertions after backing moved out of the participant row. Recent-row submitted-state proof remains in its accessible label. First visual pass exposed clipped 390px seats and old instrument CSS overriding placement; both were corrected. Both widths passed no body overflow, all seats within viewport, inline Detail action, removed Home footer and original Hero source; native vertical slider and instrument at y749. Both widths passed live first-lyric -> 33 running 2000ms bar tracks -> pause/removal -> Review, and existing lead-in digit -> lyric transition.
- Actual final-source music full A/B -> Review -> submit -> Auto Mix -> 22s Complete playback/reload passed 390px. Initial 430 B encoded duration 21.66s failed the unchanged >21.9s threshold; kept the failure, did not relax assertions or change audio code. An isolated 430 full rerun passed A22.26/B22.02 and final22.000s. Root cause of the intermittent synthetic encoded-duration shortfall remains unproven, as with the earlier pre-existing environment failure. One initial reference-play click was genuinely occluded when an empty monitoring row collapsed; reserving the source monitoring height corrected it. Final isolated 430 passed normal clicks and backing/volume/pause controls.
- Final gallery on `index-0T29lLF7.js`: 16 screens x 390/430, 32 captured/0 failed, 64 PNGs; versioned standalone HTML and validated ZIP. Earlier working captures are not the delivered final target. Screenshots are local production-build QA, not physical device approval. Physical mic/earphones, leakage/latency and actual listening remain unverified.
- Expected-HEAD owner `four-screens-remote-20261022`; only this lock is removed in this checkpoint. Next: verify original Git Integration READY/current assets and scoped deployed four-screen controls, then physical-device feedback and remaining explicitly authorized work. Do not repeat completed full audio QA without a regression or change.

## Home footer and bottom-navigation clearance · 2026-10-22

- Explicit user request: retry Desktop MCP for Figma 1803:72333, remove the home bottom button, reserve navigation obstruction plus end spacing. Desktop initialize POST to http://127.0.0.1:3845/mcp failed immediately with curl(7), connection refused. The four-screen source was not read or implemented; no Remote Figma/Computer Use fallback.
- Code `55df89ab66fd58463cc696d693c89e2d54acd7c4`: removed only HomeView's trailing “새 프로젝트 만들기” button; existing project-creation routes elsewhere remain. Base screen and Home end padding now use shared navigation-height 76px + env(safe-area-inset-bottom) + 24px gap; navigation consumes the same height variable. Detail's separate 156px action reserve and Recording's 28px/no-global-nav remain unchanged.
- Remote file blobs matched local files before editing. Build passed: `index-CaPiRN3O.js`, `index-Bstb-cOE.css`. All 13 maintained Node suites passed. Chromium current local production build at 390/430/1440px passed removed-footer presence check, 100px end padding with zero inset, no body overflow/page errors, and last Home card above navigation by 56.34/55.67/57.34px after end-scroll. Safe-area expression is implemented; physical iOS inset not verified. First separately launched local server was unreachable across command network namespaces; same-command server/browser rerun passed.
- Full local screenshot gallery 16 x two widths: 32 captured/0 failed, 64 PNGs, standalone HTML and validated ZIP. Functional audio E2E was not repeated for this footer/CSS-only change; preceding deployed full music acceptance remains recorded below.
- Expected-HEAD owner `home-bottom-clearance-20261022`; only this lock is released in this checkpoint. Next: Git Integration release of the verified runtime and targeted original-URL check; keep Figma four-screen and physical audio/real-backend/independent-renderer items open.

## Production music E2E verified · 2026-10-22

- Actual deployed runtime: `9b4f46a3910f2f43b8798eb2ceac92cbdca680ae`, original URL https://ieum-v2-react.vercel.app, Production `dpl_6HcjmmBdRdecSxstYFxXAm7goTFE` READY, served `index-ffM00cXa.js`. Main was safely fast-forwarded to this runtime earlier in this same conversation. No runtime/design/Notion/Figma/standalone changes or redeploy in this verification pass.
- This section supersedes old Oct23 07:20/07:50 quota waits and earlier “not deployed”/unverified-Production statements below. Do not infer a fresh 24-hour block by adding 24h to every failed request. Check actual deployment state/response; the same READY version must not be redeployed.
- Diagnosed prior Chromium `ERR_EMPTY_RESPONSE`: this runtime requires its provided HTTPS proxy. Proxy-enabled Chromium then reported `ERR_CERT_AUTHORITY_INVALID` for the environment proxy certificate. A temporary QA-only Playwright launch adapter supplied `proxy.server=process.env.HTTPS_PROXY` and `--ignore-certificate-errors` to the isolated synthetic-mic browser. This is an environment workaround, not a site TLS/app change or unproxied-network acceptance. Default executable was absent; used /tmp/ieum-browser-native-2103/chromium. A separate attempt to narrow trust to the proxy CA SPKI did not establish runtime within its timeout and is not a pass. Future QA must configure proxy and its certificate trust explicitly; temporary adapter paths are not durable dependencies.
- Ran the maintained remote-blob-matched `qa/verify-project-music-browser.mjs` against the actual Production origin, sequential 390/430px isolated browser contexts. Both passed: eight actual sample/backing/reference decodes (16/19/18/22s); empty A/B start; melody-reference playback stopping before mic capture; each 22s A/B recording; lyric cues 3/11.2/16.96s; pause/resume, backing toggle, Guide gain; Review playback; exact microphone-original SHA256 retained after submission; source-revision binding and 35ms sync; no Mix before the final Track; final 22.000s/nonempty Mix, peak ceiling, playback advance, reload, two-Track restoration and original-user sentinel. No page/console errors or body overflow. 390 Mix RMS/peak 0.08533/0.70678; 430 0.08258/0.70792. Synthetic microphone only.
- Ran `npm run qa:capture` on the same Production runtime: 16 screens x 390/430 = 32 captured, 0 failed; 64 PNGs, standalone embedded HTML and validated 66-entry ZIP. Temporary captures/results are not committed. Existing core suites/build were not rerun: no runtime code changed and the tested Production build is unchanged.
- Expected-HEAD lock owner `production-music-qa-20261022-current-thread`, acquired at `656ed87389331aa2ec4e396faeda2cb40b83f992`; only this owner's lock is removed in this checkpoint. All pre-existing implementation and unresolved items below remain preserved.
- Next: physical microphone/earphones, audible lyric entry/pronunciation, leakage and hardware latency remain unverified and require real-device feedback. Latest Figma four-screen request remains pending Desktop source access; do not improvise visuals. Real multi-user/backend sharing, actual AI generation/analysis/model mixing and independent renderer integration remain separate outstanding work. Do not repeat the completed deployed synthetic-mic E2E or redeploy without an actual regression/change.

## Eight consecutive stabilization passes · 2026-10-22

- User requested eight consecutive work passes after the unsubstantiated hourly progress reports. These are eight concrete work/verification passes in this interactive execution; they do not backfill or claim that the missed scheduled runs occurred. Source base `e66a0ee`; expected-HEAD lock `manual-eight-runs-20261022`, acquired at `fd8affc`. Runtime code `f9ac6cdad1d26d52983652746f644577e53b3ecd`, production bundle `index-B8b_f0M-.js`. Current Notion PRD read; no product policy, visual layout, Notion, Figma, main or standalone branch mutations.
1. Reconstructed the current application from matching remote Git blob hashes; read checkpoint/AGENTS/Git workflow. Revalidated the three originals' sample/backing hashes, registered 22s arrangement lineage, source-bound Song/Project contract and lyric timestamps. No new music generated.
2. Found and fixed live microphone retention in Review: finalized `stopRecording` now releases capture after final bytes are collected and before decoding. Exact Blob/URL and elapsed duration survive decoder failure. Added a regression to the maintained audio-foundation suite.
3. Added and ran portable real-music recovery QA at 390/430: entering Recording does not acquire mic; permission denial/retry, double Start/Stop, exact microphone-original restoration through Review/Back/reload, and released streams passed. Review accompaniment is a separate mixed preview and is not used as the microphone-original hash.
4. Both widths passed failed submission retention and double-click retry with one stored Track/no premature Mix; retake acquires a new session and rejects delayed chunks from the discarded recorder. Atomic submission and immutable 2/3/4-Part mix-input Node checks passed.
5. Both widths passed paused Stop, failed draft save preventing navigation/data loss, save retry/reload, failed Auto Mix with two exact originals preserved, no false completion/retry loop, and double retry creating one exact 22s Mix. New `qa:project-music-recovery` is maintained/documented.
6. Production-bundle 390px full A/B 22s microphone captures, all three lyric cues, pause/resume/backing toggle, Guide gain, Review, source/sync references, original hashes, last-Track Auto Mix, 22s Complete playback/reload and real-user sentinel passed.
7. Same full 430px production-bundle path passed. Normal Search/Song/Project/Part path at both widths also passed backing-503-before-microphone, source-changed Review preservation, joined Project deduplication and source-bound creation. Synthetic mic only; no physical latency or listening acceptance.
8. Found that offscreen Home records continued drawing GPU frames. Suspended frame drawing outside the viewport/hidden tab, preserving buffers, timeline, shader, particle data and graphic identity; disconnect observers/listeners on dispose. New `qa:record-visibility` passed normal-motion pause/resume in both widths. Full normal-motion integration now passed 390/430 (carousel/rapid direction changes/continuous no-fade canvas, Search/Back, individual listening, recording/Review/submit/Mix/Complete). Seven existing desktop demo scenarios, reset/storage isolation, Back and 390/430 wrappers passed. Full gallery: 16 screens x two widths, 32 successes/0 failures, 64 PNGs, versioned embedded HTML and validated 66-entry ZIP.
- Build and all 13 maintained Node suites passed on final runtime. Earlier individual Windows-path-only browser scripts could not start in this Linux environment; they are not reported as passes. Recovery coverage above uses a new environment-configurable suite. An initial parallel-browser music attempt failed the unchanged duration assertion (B encoded 21.84s); serial full rerun passed both widths without relaxing limits. An early recovery assertion incorrectly hashed the mixed Review source and was corrected to compare the actual microphone original. Initial normal-motion run was stopped while stalled; only the final completed normal-motion run is counted as passed.
- No explicit Vercel deployment/redeploy, empty commit or main update during the known quota period. Superseded by the Production verification section above; the inferred Oct23 07:50 KST wait no longer applies. Physical mic/earphones, audible lyric entry/pronunciation, acoustic leakage, hardware latency, real shared backend and standalone renderer/3D integration remain open. Do not rerun the completed passes without evidence of a regression.
- Next: after quota boundary, check current branch/main/lock and actual Vercel state, safely integrate the latest verified code to the original project, then verify deployed music sources/A/B/full 390/430 path. Continue only evidenced remaining work. This checkpoint releases only `manual-eight-runs-20261022`.

## P0 actual original-song Project recording · 2026-10-22

- Runtime code `c88ee8f4cfec765536eff58f98ef6206d93d44ac`; base `ea4bad9`, expected-HEAD lock owner `p0-real-music-recording-20261022-e6c6de6fbc91`. Read current Notion PRD/screen source; no Notion/Figma/standalone/renderer/CSS changes.
- Reused the existing AI originals, without generating music. All 3 actual sample/backing SHA256s and decoded 16/19/18s lengths verified. Selected 천천히 함께 (existing excerpt lyric alignment 1.0); concatenated its hash-verified preceding 3s backing with the existing 19s excerpt. Explicit Project arrangement/Song/Project, 22s untransposed 원키, shifted cues 3/11.2/16.96s and source lineage registered in src/projectMusic.js. Named tonal key and listening acceptance remain unconfirmed; full original WAV outside Git was not rehashed. docs/AI_PROVIDED_SAMPLES.md contains selection, derivation and exact hashes.
- Normal Search → Song → Project → selected Part participation now reaches the registered real backing. New projects retain source/key/lyrics/2-part unison; no invented SATB. Joined catalogue rows resolve to the stored local Project rather than duplicate IDs.
- Added isolated `?demo=music-a` and `?demo=music-b` roles sharing only their music demo DB. Both submitted Tracks start empty and are captured through the actual Recorder/Review/submit path. No AI or fake human Track is pre-submitted. This is same-device role simulation, not live multi-user/backend acceptance. Existing user/profile/Voice Setup samples and seven prior scenarios retained.
- Ready provides melody reference listening; recording uses the registered separated backing, actual lyric cues and microphone-only original. Playback stops before capture. Auto-stop at the registered musical end; Review plays an aligned microphone+backing preview without changing stored originals. Final submission alone triggers native Auto Mix and 22s Completed playback/restore.
- Fixed repeated scheduling lead-in on Guide resume/toggle; lyric clock excludes the initial captured 35ms lead-in and stored sync offset trims it in preview/final mix. Initial guide-vocal gain now honors the confirmed 50% volume. Registered outputs use the exact decoded backing duration; legacy output duration behavior remains unbounded by a Project reference.
- Build `index-CJsfH5WY.js` passed. All 13 maintained Node suites and project-music/source-contract checks passed. Chromium 390/430 actual 22s A/B captures passed 3 lyric cues, pause/resume, backing toggles/guide volume, reference/Review playback, immutable original hashes, source references, individual sync offsets, last-Track Auto Mix, exact 22s/nonempty WAV, peak ceiling, Complete playback, reload and original-user sentinel. 430 tested production bundle; 390 full path also passed. Normal catalogue at both widths passed 503-before-mic/retry, changed-source Review preservation, no duplicate Project, and source-bound new-project creation. Legacy reduced-motion Home/Search/profile/join/record/Review/submit/Auto Mix core passed both widths. Full normal-motion carousel replay was stopped after software Chromium became unresponsive; it is not a pass.
- qa:capture: 16 screens × 390/430, 32 successes/0 failures, 64 paired PNGs, plus 6 actual music E2E PNGs. Version-labelled standalone capture HTML and validated ZIP delivered; these are screenshot artifacts, not an executable app. One early QA timing assertion and an HTML-audio visibility wait were corrected; a development HMR-interrupted 430 run was rerun against the production build. No failed run is counted as passed.
- Git push automatically invoked original-project deployment, which returned “Deployment rate limited — retry in 24 hours” at `2026-10-21T22:43:40Z` (Oct22 07:43:40 KST). No explicit redeploy, empty commit, main update or repeated same-run retry. Conservative next retry boundary is `2026-10-22T22:50:00Z` (Oct23 07:50 KST); honor later returned limits. Original Production remains the prior release and does not yet contain this P0. The other linked preview failed; no standalone branch source was changed.
- Existing hourly integration automation updated to prioritize this P0 deployment/stability, preserve these sources, avoid regeneration/design detours, honor the latest retry boundary and verify the original URL after release. Main remains unchanged in this turn.
- Next: after quota boundary, safely integrate latest verified branch to original main/ieum-v2-react Git Integration and verify exact READY SHA/assets, music-a/B and deployed 390/430 core. Physical-device mic/earphones, actual vocal pronunciation/lyric entry listening, acoustic leakage and hardware latency remain unverified. Preserve all independent renderer/3D and real-backend outstanding items. This checkpoint releases only this lock owner.

## Original-main integration and Git build scope · 2026-10-22

- Resumed from remote `f7a95e82a8e8ace7f6c55e126b821ce0694be195`; read this
  full checkpoint, AGENTS and Git workflow. Reconstructed the fresh source using
  current remote Git blob hashes; existing app files were accepted only on exact
  hash matches. Expected-HEAD owner `automation-figma-v2-20261022T0702KST-e6c6de6fbc91`.
- Current Notion DS/IA/PRD/flow/screen specification read through the connector.
  Old Recording IDs `1732:43410` and `1459:31183` are no longer found. Atlas
  `530:46` is accessible and now lists `1803:72333` (4화면); rediscover current
  confirmed screen sources before further visual edits. No Figma/Notion mutation.
- Original main `caa0f30` was an ancestor (78 commits behind, no divergent user
  changes). Expected-HEAD fast-forward to verified `f7a95e8` succeeded after the
  recorded 07:07 KST boundary. That already-seen SHA produced no new Production.
- Actual deployment-config code `4b423ef5db871eb9d414fc94471d98d492d93611` adds
  `ignoreCommand` and `scripts/vercel-ignore-build.mjs`. Compare with
  VERCEL_GIT_PREVIOUS_SHA (last successful build), not HEAD^: pending runtime
  changes still build when followed by checkpoint commits. Docs/QA/standalone-only
  changes skip; missing history/first build/unknown paths continue conservatively.
  Integration/main are skipped on the separately linked Resonance preview project;
  its own feature/resonance-standalone branch remains unaffected.
- Real temporary-Git-history QA passed: lock/QA-only skips, pending app + later
  checkpoint builds, unknown config, deletion and rename into docs build, missing
  base builds, original-project and independent-branch scope preserved.
  Only vercel.json and the two maintained guard/QA scripts changed. No React,
  design, assets, renderer, audio, recording, storage or standalone source changed.
- Build passed with identical runtime `index-DoerSaPl.js` / `index-wDEeZvaL.css`;
  installed packages match the remote lockfile. All 13 Node suites passed.
  Chromium reduced-motion core passed 390/430: public play/save, Search/My Voice/
  Back, direct join, Workspace transport, synthetic mic pause/resume, Review/direct
  submit, final-Track Auto Mix and nonempty Complete; no final page/console errors.
  Normal-motion replay stopped after native Chromium library failure, not a pass.
- qa:capture: 14 screens × 390/430, 28 successes/0 failures, 56 PNGs, standalone
  HTML/manifest and validated 58-entry ZIP delivered. Captured revision f7a95e8;
  the later build-scope change produces byte-identical React bundles.
  Physical microphone, audible quality, native-device zoom and real backend unverified.
- Guard code saved to integration and main by expected-HEAD non-force updates.
  Original Git Integration returned “Deployment rate limited — retry in 24 hours”
  at `2026-10-21T22:14:11Z` (other linked project at :13). No same-run deploy retry,
  local/manual Production deployment or build-trigger-only commit was issued.
  Conservative next retry boundary: `2026-10-22T22:20:00Z` (Oct23 07:20 KST);
  honor any later returned limit. Guard execution on Vercel remains unverified.
- Original Production still READY `b57c1d4`, deployment
  `dpl_5YYHsXvR2f2SNj2C5k83z2iLC4Ge`; actual
  https://ieum-v2-react.vercel.app returns 200 and old
  `index-BmmlD67C.js` / `index-BqlZo9hY.css`. Latest READY Preview
  `bddbfc2` is not Production and is not presented as a live-main release.
- Next: prioritize stabilization and presentation freeze on Oct23. Preserve all
  prior unfinished source backing/lyrics, independent renderer/3D, real community
  data and physical-device acceptance. Continue only evidenced confirmed-screen
  differences; do not redesign unfinished pages. After the retry boundary, verify
  original-project Git deployment, exact READY SHA/assets/URL and deployed core
  flow; no repeated quota retries or docs-only build-trigger commits.
  This checkpoint removes only the owner above from integration/main.

## Supplied identicons and regenerated Home hero · 2026-10-22

- Runtime code `b3624d8845f921d74b1f2b67d5f3b15fa87accc1`, fresh remote base
  `c8f50b2`; expected-HEAD owner `manual-identicons-hero-20261022-e6c6de6fbc91`.
  The user explicitly requested the supplied knot images instead of 윤/도/J initials,
  then requested the Home hero be regenerated from the same identicons.
- Current Notion DS and Figma Recording/Workspace contexts + renders re-read.
  Read exact original 128×128 blue/coral/cream PNG image-fill bytes from the
  approved Workspace slots. No source mutations. Direct asset URL returned HTML;
  read-only Plugin API export succeeded. Shared participant-ID mapping now renders
  blue yoonseul, coral doyoon, cream jisun in Workspace, Recording and Detail.
  OPEN remains vacant plus; names, profile entry, Track and Mix controls stay real.
  No measured identity, source audio, Track/Mix or renderer data was replaced.
- Built-in imagegen edited the existing hero using all three identicons as shape
  references; regenerated distinct infinity / interwoven / folded-loop knots feed
  into the original vinyl composition. Existing copy, art placement and 430×400
  aspect ratio remain. Exact source/provenance and prompt are in artwork README.
- Build passed: `index-DoerSaPl.js` / `index-wDEeZvaL.css`; all 13 maintained
  Node suites passed. Focused Chromium 390/430px verified decoded exact images,
  stable participant mapping, 40px slots, OPEN plus, functional Mix/Guide toggles,
  Detail icons, Hero geometry, no page errors or body overflow. Actual renders read.
  Full core flow also passed both widths: Search/My Voice/Back, join, Workspace,
  synthetic mic pause/resume, Review/direct submit, final-Track Auto Mix/Complete.
  Physical microphone and audible quality remain unverified.
- `npm run qa:capture`: 14 screens × 390/430px, 28 succeeded / 0 failed; 56 PNGs,
  version-labelled standalone `index.html`, manifest and validated ZIP delivered.
  Temporary QA images/gallery are excluded from Git.
- Fresh original Vercel project remains Production READY `b57c1d4`, main `caa0f30`;
  actual original URL https://ieum-v2-react.vercel.app still serves that older code.
  Before recorded retry boundary `2026-10-21T22:07:09Z` (Oct22 07:07 KST), no
  deployment/main update or repeated limit retry attempted. This code is not live.
- Next: after retry boundary, preserve/recheck remote main and deploy the latest
  verified integration to the original project, verify READY SHA/assets/URL.
  Keep unfinished non-approved screens, real lyrics/backing, independent renderer/3D,
  backend/multi-user and physical-device acceptance open. Only this owner's lock
  is released by the checkpoint.

## Confirmed Recording guide-vocal volume · 2026-10-22

- Runtime code `a3e52f03d25250b652c4e3fafde4ceaf6f7d976f`, based on fresh remote
  `bb1ddf3f695a67463f73f9bde54381a23fa28a32`. Acquired and rechecked the
  expected-HEAD lock `automation-figma-v2-20261022T0601KST-e6c6de6fbc91`;
  this checkpoint releases only that owner.
- Re-read full checkpoint/AGENTS/Git workflow, current Notion DS/IA/PRD/flow/
  screen spec and fresh Figma Home `1349:21126`, Workspace `1571:41074`,
  Recording/Search sections. Implemented the current Recording revision
  `1732:43410` named `반주 기본 제공 / 가이드 보컬 볼륨`; comparison variants
  remain untouched. Figma/Notion sources were not edited.
- Added a real 0–100% guide-vocal volume control with the confirmed 50% default.
  It scales only submitted vocal guide Tracks in Web Audio; the existing backing
  default, toggles, timing, pause/resume and original recording Blob are preserved.
  Zero volume schedules no silent guide Track. Older stored Takes normalize to 50%.
- Matched the 350×237px elevated console, 259.2px status/slider/control grouping,
  y=674.8 at 390/430px, 16px vertical grouping and exact exported metal thumb
  `1732:43409`. At 390px the source console remains 350px and centered.
- Final build passed: `index-C61xiw3E.js` / `index-DdwbKhLn.css`; all 13 maintained
  Node suites passed, including actual gain scaling/default/mute/resume coverage.
  Recording browser QA passed 390/430px: source header/monitor/lyrics/console
  geometry, range interaction, long/2x text, synthetic mic pause/stop, Review/Back.
  Full reduced-motion Chromium flow passed both widths: Home/Search/My Voice/Back,
  join, Workspace playback, synthetic mic pause/resume, Review/direct submit,
  last-Track Auto Mix and nonempty Complete. No physical mic or audible-quality claim.
- `npm run qa:capture` produced a version-labelled standalone gallery for all 14
  maintained screens at 390/430px: 28 captures succeeded, 0 failed, with 56 PNGs,
  `manifest.json`, `index.html` and the review ZIP. Capture artifacts stay outside Git.
- Fresh main remains `caa0f30`; original Production remains READY `b57c1d4` at
  https://ieum-v2-react.vercel.app. This run is before the recorded retry boundary
  `2026-10-21T22:07:09Z` (Oct 22 07:07 KST), so no deploy/main update was attempted.
  Latest visible preview is older `4d08eba`; this code is not live.
- Next: after 07:07 KST, recheck main and atomically integrate this verified branch
  into main without force, then verify the original project READY commit/assets/URL.
  Keep comparison Recording variants and unfinished Finder/Match/Complete redesigns
  untouched until explicitly final. Real lyrics/backing, verified personal imagery,
  backend/multi-user, independent renderer/3D and physical-device checks remain open.

## Current Figma Project Detail and shared header · 2026-10-22

- Runtime code `0ac2bc4effe0fdff7b61b1b8cd150bcdcae60998`; resumed from remote `7e59ebce9a3d97ac216b35d5152650d6205e51a1`.
  User explicitly requested applying the current Figma edits including Detail.
  Current Notion DS and screen spec read; Figma Detail `1713:43254` full context/
  screenshot and current shared Header source read. Source documents were not edited.
- Detail now implements full-width Song cover/title, same-song project carousel,
  selected Project heading, 184px Record with compact live Mix/member/OPEN Part
  controls, actual MIDI ranges on a common axis, harmony illustration/reasons,
  and fixed participation action above the existing contextual navigation.
  Song/Project/Part IDs, final Track lineage, save/create/profile actions and
  explicit Workspace/Complete navigation remain real and unchanged.
- Individual listening and selected-track preview reuse CurrentMixPanel's existing
  audio state/DSP. Zero selected Tracks disables Mix; project change stops old
  audio. Real range values are displayed; unfinished matching formulas never
  produce fabricated 100/86/84/92/82%. Missing scores show preparation/information
  state. Source harmony art is explicitly labelled illustrative, not measured.
- Exported exact 382x130 `1713:43334` artwork with read-only Plugin API after
  temporary download returned HTML. No Figma mutations. Existing data-driven
  covers/Records and verified-person imagery restrictions remain.
- Shared TopBar owns Recording title/subtitle at 72px minimum; Back x=12.
  Recording title18/24 at y15, subtitle12/16 at y41; monitoring y104, lyrics
  y284.8, native instrument y752 at both widths. Long/2x content grows the header.
  Workspace EN36/40 and KR32/40 correction is preserved.
- Final build `index-Br26W4_f.js` / `index-MCF6SG0i.css` passed; 13 maintained
  Node suites passed, including actual Detail state/2–4 Part IDs and unchanged
  source Blobs, single/combined listening, zero-selection disabled and old-audio
  teardown. Updated only stale structural assertions for the new layout.
- Chromium 390/430 Detail project switching/OPEN selection/direct join passed.
  Full reduced-motion Search/My Voice/Back, synthetic mic pause/resume/Review/
  submit/last-Track Auto Mix/nonempty Complete passed both widths.
  Recording timed-text/missing-source, header/geometry, long/2x copy, pause/stop/
  Review/Back passed both widths. Actual Detail/Recording renders inspected.
  Browser font fallback was restored locally from the existing repository font;
  no font source changed. No physical microphone/listening claim.
- Production inspected: original project `prj_eowHNSo22vKNulK4a2LFYzQnAYj1`
  still serves READY `b57c1d4`; main is `caa0f30`. This run is before the recorded
  retry boundary `2026-10-21T22:07:09Z` (Oct22 07:07 KST). No deployment retry or
  main update; code is not live at https://ieum-v2-react.vercel.app.
- Next: apply remaining explicitly confirmed Figma screens (Finder implementation
  source `1725:42795` was discovered, not implemented in this Detail pass).
  Re-read current Recording comparison revisions before treating one as approved.
  At allowed retry time fast-forward validated integration while preserving main
  changes (current main is an ancestor); verify original-project deployment/URL.
  Keep matching formulas, verified personal identities, real Song backing/lyrics,
  separate Resonance/3D and physical-device acceptance open.
- Releases only owner `manual-detail-20261022`.

## Workspace full-body implementation · 2026-10-22

- Code `c12a9c773dee6ab16ef88a57ac3e5fb4020bbfa7`, fresh base `437948a`; current remote tree,
  full checkpoint, AGENTS (including new §7.1) and Git workflow read.
- Current Notion DS/screen spec and Figma `1571:41074` full-body implementation
  source/context/screenshot checked. Detail `1713:43254` remains a revision;
  no candidate screen was silently treated as final approval.
- Workspace now groups identity/name/role separately from status/actions. Existing
  individual Track playback, profile entry, Finder and Mix toggles stay available.
  Cards use 172px minimum to retain 44px controls; no fabricated personal imagery.
- Moved own-Part recording to the source bottom panel, with one real recording/
  draft-review action and exact 382×52 Gold surface `1596:53503` / 26px end caps.
  Preserved user's EN 36/40 / KR 32/40 title correction, real Song/Part identity,
  state-dependent availability and native navigation. Distinct 8/16/40px relations
  are controlled by their respective groups, not one global gap.
- Unified native Smoky 48px play/pause with seek/time below the unchanged fixed
  deck/live Record. Button and seek centers align independently of the clock.
  Transport is 92px including a 44px seek target and separate time row; empty Mix
  is disabled. No renderer, audio/storage, demo data, policy or standalone edits.
- Build `index-DqU9p3gq.js` / `index-DAqKpvWr.css` and all 13 Node suites passed.
  Workspace controls/timeline at 390/430 passed: exact asset bytes/geometry,
  no duplicate recording/transport, Track/Mix play/pause, native seek/toggle,
  disabled/re-enable, 2x CSS text and no mic on Recording entry. Native Tab focus
  clears fixed navigation at 390/430/1100, including the new recording panel.
- Final reduced-motion Chromium core passed 390/430: Search/My Voice/Back,
  public listening/save, join, synthetic mic pause/resume/Review/direct submit,
  last-Track Auto Mix and nonempty completion; no final page/console errors.
  Seven demo scenarios/reset/normal-data isolation/Back also passed with reduced
  motion. Normal-motion capture run was stopped; no complete normal-motion pass.
- Gallery: 14 entries × both widths, 28 successes/0 failures, 56 entry PNGs plus
  focused checks, labelled undeployed `c12a9c7`. Actual controls/Workspace renders
  inspected. HTML/PNG ZIP saved; captures/results not committed.
- Original Production remains READY `b57c1d4`; main `caa0f30`.
  No main/deploy retry before `2026-10-21T22:07:09Z` (07:07 KST).
  Not live at https://ieum-v2-react.vercel.app. Physical mic/listening unverified.
- Next: continue remaining per-screen design from newly confirmed sources; recheck
  Detail/current Recording approval while source editing continues. Do not repeat
  completed component polish or invent the unfinished matching-% formulas.
  Keep prior personal imagery, real lyrics/backing, renderer/3D/backend and final
  visual/device items open. At retry time preserve user's current main changes.
- Releases only owner `automation-figma-v2-20261021T1955Z-e6c6de6fbc91`.

## Current confirmed Gold surfaces · 2026-10-22

- Code `ff6525c53d2364b9ae6fe5ed93252d7ee3376c57`, resumed from fresh remote `674ab1f`.
  Full checkpoint/AGENTS/Git rules read; source snapshot bytes checked against
  the current remote Git tree. Expected-HEAD lock acquired/rechecked for
  `automation-figma-v2-20261021T1857Z-e6c6de6fbc91`; this checkpoint releases only that owner.
- Read current Notion DS/screen spec and high-fidelity Figma Gold Project
  `1596:53321` / Player `1596:53579` contexts/screenshots. Read-only inspection
  confirms Home `1488:33867` and Workspace `1432:40200` use these current variants.
- Connected exact text-free source surfaces `1596:53327` (382×48) and
  `1596:53584` (48×48): champagne palette, diagonal reflection, straight capsule
  hairlines and concentric player machining. Preserved native sizes/24px capsule
  caps, editable source-colored #3D3221 labels/icons, disabled Smoky controls,
  playback/seek and existing shared primary-button use. Older artwork retained.
  No Figma/Notion source, renderer, audio/storage/recording or standalone changes.
- Build passed (`index-BPSXjJMV.js` / `index-CRtSivHd.css`); all 13 Node suites
  passed. Project/Workspace browser QA passed 390/430px: original asset bytes,
  geometry, actual click/Back/play/pause/keyboard seek, individual/Mix state,
  disabled/re-enable and 2x CSS text. Shared-screen suite passed all 46 states.
- Final reduced-motion Chromium regression passed both widths: public play/save,
  Search/My Voice/Back, join, synthetic mic pause/resume/Review/direct submit,
  final-Track Auto Mix and nonempty completed Mix; no final page/console errors.
  Initial run logged one resource error; instrumented clean replay passed both.
  Normal-motion full replay timed out in software-rendered capture; no normal-
  motion pass claimed. Temporary capture workaround was not retained.
- `npm run qa:capture`: 14 entries × two widths, 28 successes/0 failures,
  56 entry PNGs. Actual Project button/Workspace stage renders inspected against
  source. Version-labelled undeployed HTML/PNG ZIP delivered; no capture/results
  committed. Physical mic, audible quality and device zoom remain unverified.
- Production freshly checked: original project READY `b57c1d4`, main `caa0f30`.
  No deployment/main advance before `2026-10-21T22:07:09Z` (07:07 KST).
  Code is not live at https://ieum-v2-react.vercel.app.
- Next priority remains per-screen design, not repeated common-style polish.
  Fresh Atlas inspection found new Detail revision `1713:43254`, fixed-action
  interaction frame `1707:42019`, Workspace revision `1555:39724` and full-body
  implementation frame `1571:41074`. Check their current confirmed status and
  latest user directions before implementing; do not treat old discovery IDs or
  revision candidates as final approval. Remaining pages are not visually complete.
  Preserve all prior unfinished verified personal imagery, real lyrics/backing,
  renderer/3D, backend and final visual/device checks. Latest Notion matching-%
  update explicitly says formulas/weights are unfinished: never invent scores.
  Recheck user main changes at the allowed deployment time.

## Current Home rhythm and selected Song jacket · 2026-10-22

- Code `2bf8c58c1d4a7210f4ef388974d4e4ec65f1c1e7`, resumed from fresh remote
  `cf8f36f`. Read full checkpoint/rules and current Notion DS; current Home
  Figma contexts/screenshots now specify 32px section starts and a 56px jacket.
- Matched recruitment/recommendation/recent/completed section padding to current
  source (32px starts, no stacked bottom padding; final section bottom 32px).
  Existing heading-to-list gaps remain 20/16/20px. Recommendation uses source canvas.
- Added the existing SongArtwork component beside recruitment identity, with
  original 56px cover / 12px gap / 16px CTA gap. Uses the selected actual Song ID,
  existing cover precedence and fallback; no sample Gravity identity or new artwork.
  Text remains intrinsic-height, wraps with longer content and uses EN/KR Title.1.
- Build passed (`index-BJPur86f.js` / `index-BcqKeXF-.css`); all 13 Node suites
  passed. New Home browser QA passed 390/430px: geometry, six Project/Song cover
  mappings, keyboard cycling, detail/Back, unchanged Tracks/participation and 2x CSS
  text without clipping/overlap. Existing Home/Workspace heading QA passed both.
- Core Chromium regression passed both widths with reduced motion and synthetic
  microphone: public listening/save, Search/My Voice/Back, join, pause/resume,
  Review/direct submit/final-Track Auto Mix/nonempty final Mix. Normal-motion
  full replay stalled in software rendering and was stopped; no pass claimed.
- `npm run qa:capture` captured 14 entries × both widths, 28 successes/0 failures,
  56 entry PNGs; inspected actual Home renders. Delivered version-labelled
  undeployed gallery/ZIP with six additional Home comparison/text PNGs. Artifacts
  excluded from Git. No physical mic, listening quality or device zoom pass.
- Original Production remains READY `b57c1d4`; main remains `caa0f30`.
  No deployment/main advance before `2026-10-21T22:07:09Z` (Oct 22 07:07 KST).
  These changes are not live at https://ieum-v2-react.vercel.app.
- Next: compare newly revised confirmed Gold component sources (e.g. `1596:53321`
  and `1596:53579`) with existing local surfaces before changing them. Follow newly
  confirmed screen sources; do not redesign unfinished pages. Preserve previous
  per-screen design, verified personal imagery, real lyrics/backing, independent
  renderer/3D, backend and final visual/device checks. Recheck main at retry time.
- This checkpoint releases only `automation-figma-v2-20261021T1802Z-e6c6de6fbc91`.

## Remove decorative dividers on all pages · 2026-10-22

- User explicitly requested removal of all unnecessary separators. Read current
  Notion DESIGN_SYSTEM.md: section/row decoration is prohibited; native input,
  selection, focus and control boundaries are retained. No source Notion/Figma edits.
- Code `ced2a49c4de42d0f09c101b378e1f0d94e5f6f51`, based on remote `3eb6ff0ec17b3258c0c0808208bca9cadb1cc81e`.
  Removed 75 legacy directional-border declarations across styles.css,
  design-system-v2.css and demo-stage.css; hid demo-note horizontal rules.
  Covers headers/navigation separators, sections, Part/list rows, Match analysis,
  metadata, Collection, My Voice/Voice Setup, searches and presentation menus.
  Existing spacing, content, actions, range endpoint markers, native player/seek
  tracks, button artwork, fields, active states and focus indicators are preserved.
- Build passed (`index-8jd78law.js` / `index-B2-fIgSN.css`); 13 Node suites passed.
  Existing shared-screen Chromium QA passed 46 states at 390/430px, including
  CSS text stress and navigation. Temporary computed-style audit confirmed no
  section/row separators across those states; actual Detail/Match/Workspace/
  Complete renders inspected. Source audit leaves only the functional range marker
  among nonzero directional borders. Three CSS files only; runtime JS unchanged.
- Synthetic-mic core regression passed 390/430px: playback/Search/Back,
  join → Workspace → recording/pause/resume → Review → submit → Auto Mix →
  nonempty completed Mix. This run used reduced motion and excluded unchanged
  carousel-motion assertions after the normal-motion run stalled in software
  rendering; no normal-motion or physical-device/audio-quality pass is claimed.
- Latest code remains undeployed to https://ieum-v2-react.vercel.app.
  Do not retry before recorded 2026-10-21T22:07:09Z (Oct 22 07:07 KST).
  Next: include this verified code in the next permitted integration deployment;
  do not restore decorative dividers or repeat unrelated polish. Prior remaining
  per-screen design, real assets/backend and physical-device checks remain open.
- This checkpoint releases only lock owner `interactive-remove-dividers-20261022`.

## Workspace title hierarchy correction · 2026-10-22

- Code `07a10296c087b5ccb40eb2841576296494f96efa`, resumed from fresh remote `d3b3cdd330ea60677a0d43ee88f43a825acc6422`.
  Acquired/rechecked expected-HEAD lock `automation-figma-v2-20261021T145845Z-e6c6de6fbc91`;
  this checkpoint releases only that owner.
- Read full checkpoint/AGENTS/Git workflow, current Notion DS/screen specification
  and fresh Figma Workspace identity context/screenshot. Original Figma still uses
  Display/EN 56/60. Applied the user's subsequent oversized-title correction in React:
  existing Title.1 EN 36/40 (Cormorant), KR 32/40 (Pretendard Medium, -1% tracking).
  Source Figma/Notion were not edited. Real Song identity and metadata remain intact.
- Existing heading Chromium QA passes 390/430: actual A Thousand Years now fits
  one readable line; metadata/Part spacing, Like, Back and no automatic microphone
  remain correct. Existing Workspace timeline QA passes both widths: actual audio,
  play/pause, keyboard seek, selection and enlarged-text containment.
- Build passed: `index-BAZRGY25.js` / `index-BM8vg5j2.css`; all 13 Node suites
  passed. Full normal-motion Chromium integration passed 390/430, including fixed
  deck/no-fade/Canvas continuity, public play/save, Search/My Voice/Back, synthetic
  mic pause/resume/Review/direct submit/final-Track Auto Mix/nonempty final Mix.
  Replaced two fixed 420ms QA waits with actual animation-completion waits after
  reproducing software-rendering timing failure; assertions remain unchanged.
- `npm run qa:capture`: 14 entries × both widths, 28 captured/0 failures,
  56 PNGs; actual Workspace renders inspected. Version-labelled undeployed HTML/ZIP
  delivered; captures/results excluded from Git. Physical mic/listening unverified.
- Fresh Production remains READY `b57c1d4` on original
  https://ieum-v2-react.vercel.app; main `caa0f30` unchanged. No deployment request
  before recorded retry `2026-10-21T22:07:09Z` (Oct 22 07:07 KST).
- Scope correction: remaining pages currently have shared styling only, not
  completed per-screen design. Preserve their functions and do not report them
  visually finished. Next: follow current confirmed screen sources and latest
  user per-screen design direction; do not keep repeating low-impact polish as
  whole-app design completion. Existing personal imagery, real lyrics/backing,
  independent renderer/3D, public backend and final visual/device checks remain open.
  After retry, recheck main changes and deploy only verified integration to the
  original project, then verify exact READY commit/assets/URL.

## Shared design system across remaining screens · 2026-10-21

- Code `287b2096c1b1c3f9063c7b553d65a0ea6f005d9e`, resumed from fresh remote
  `a4d0e1b`. Acquired/rechecked expected-HEAD lock
  `automation-figma-v2-20261021T140959Z-e6c6de6fbc91`; this checkpoint releases only that owner.
- User's latest priority: apply the confirmed system to all remaining screens
  while preserving their existing layout, content and functions. Read current
  Notion DS/screen specification and fresh Figma common component metadata,
  Gold Project / Like / Share high-fidelity contexts and screenshots.
- Added scoped shared styles to Detail, Finder, Match/Profile, Complete,
  My Projects, Collection, My Voice, Song Browser, Create Project and Voice Setup.
  Connected existing Pretendard/Montserrat/Cormorant roles, canvas/surface/state
  tokens, 20/24px insets, local native 48px Gold/Smoky capsule/player surfaces,
  fields, tabs/chips and focus/disabled states. Actual Song identities stay intact.
  Confirmed Home/Workspace/Recording/Search CSS and assets are unchanged.
- Corrected reproduced Finder sort-word splitting, candidate-image/name overlap,
  My Voice transport overflow and Korean empty-state fallback glyphs. Existing
  page composition, circle-credit interactions, routes, storage/audio/renderer
  and presentation-data isolation remain; no new layout or standalone merge.
- Final build passed: `index-dTKMa5oC.js` / `index-DHjb02Ev.css`.
  All 13 maintained Node suites passed. Full normal-motion Chromium integration
  passed 390/430px, including fixed-deck/no-fade continuity, public play/save,
  Search/My Voice/Back, participation, synthetic-mic pause/resume/Review/direct
  submit, final-Track Auto Mix and nonempty completed Mix. No page/console errors.
- New maintained `qa/verify-shared-system-browser.mjs` passed both widths:
  46 screen/state checks, filters/reset, Match/Profile/Finder return, vocal save,
  Collection tabs, My Voice preference cancel, Create stages/Back, no mic on entry,
  control containment and CSS-enlarged text. Final rendered screens were inspected.
  Optional legacy `qa:navigation` launcher is blocked by hard-coded Windows
  Playwright/Edge paths; `qa:profile` was not started. No pass is claimed for them.
- `npm run qa:capture`: `qa/captures/2026-10-21-shared-system-287b209/`,
  14 entries × 390/430px, 28 successes/0 failures; 56 PNGs and standalone HTML/ZIP,
  explicitly labelled undeployed code `287b209`. Captures/results excluded from Git.
- Original https://ieum-v2-react.vercel.app returns HTTP 200 with old
  `index-BmmlD67C.js` / `index-BqlZo9hY.css`; latest Production READY `b57c1d4`.
  Main `caa0f30` / standalone `3d82976` unchanged. No deployment/main advance
  before recorded retry `2026-10-21T22:07:09Z` (Oct 22 07:07 KST).
- Next: retain this broad shared-system application as the baseline; inspect only
  evidenced remaining source/state differences. After the retry window, recheck
  user main changes, integrate the latest verified branch without force and
  verify original-project READY commit/assets/URL. Preserve all prior unfinished
  verified personal imagery, actual lyrics/backing, independent renderer/3D,
  real community data and final visual/physical-device checks. Physical mic,
  audible quality, native keyboard/device zoom and live backend are unverified.

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
| Personal knot images | Supplied exact blue/coral/cream identicons connected by stable yoonseul/doyoon/jisun IDs in Workspace, Recording and Detail, per explicit user instruction. OPEN remains plus. Display art is separate from measured identity and Track/Record resources. |
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

1. Participant display artwork is now connected for the three supplied identicons.
   Keep display assets separate from measured personal identity resources; verify
   new actual identity results through their existing source/owner contract.
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
