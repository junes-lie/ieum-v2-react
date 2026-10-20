# Figma V2 integration checkpoint · 2026-10-21

## Current result

- Branch: `feature/figma-v2-integration`, based on `main` at `a20cf97`.
- Resumed from `e386dda`, preserving prior typography and Search/navigation work.
- Latest code: `24af29a` (transparent hardware + real Current Mix transport),
  following `cf8a003` (Hero, profile button, six genre covers and shared Song artwork).
- Prior functional integration `1902972` is preserved. GitHub connector saved
  reviewed files on the existing remote tree with expected-HEAD checks; no force updates.
- No main/Production changes, standalone Resonance merges or algorithm changes.
- This is a functional integration checkpoint, **not final visual acceptance**.

## Latest verified asset / transport checkpoint

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
| Turntable housing | 900×900 alpha overlay separated with imagegen from the supplied combined artwork. Empty circular opening; existing live Record remains below. Home + Workspace integrated. |
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

- URL: https://ieum-v2-react-fv2vbksiy-junes-lie.vercel.app
- Deployment: `dpl_CQj5PBuKb8EF4p927FCgzChEYXKQ`, READY, Preview (`target: null`),
  exact code SHA `24af29a37810c45b4b8a6d2a9d52445eec39009f` confirmed.
- No deployment appeared for the Git-data ref update after checking deployments
  and commit statuses. Created a Preview from the saved Git branch through the
  Vercel connector; no local-only or Production deployment was performed.
- Vercel Authentication protection remains enabled. Existing connector access was
  used privately for testing; ordinary URL requires authorized Vercel access.
- Authenticated HTTP 200; deployed JS `index-D9aq7jma.js` and CSS
  `index-Dwz_qnsu.css` match the locally tested build.
- Actual deployed browser smoke passed at 430px and 390px: all visible artwork
  decoded, no horizontal overflow. All nine deployed WebP files returned 200 and
  matched local SHA-256 byte hashes, including the two retained genre variants.
- Remote Search→Ocean result→Detail→Back restored query; My Voice→Back restored
  Search. No page errors. Initial direct browser access returned EMPTY_RESPONSE;
  the existing environment proxy enabled the authenticated browser checks.
- Full microphone/Auto Mix and new turntable audio advance/pause were tested
  locally at both widths with Chromium synthetic microphone/isolated demo Tracks.
  Remote smoke does not claim a second full microphone/Auto Mix run.

## Next checkpoint

1. Compare remaining Home carousel neighbour records, Part/monitoring identity
   slots and Recording graphic alignment with current Figma; preserve working
   interactions and use only valid person-owned identities for participant art.
2. Review the new static/dynamic composite visually. Existing Resonance shape and
   completed 3D fidelity remain separate; do not merge/change standalone algorithms.
3. Validate physical microphone/earphones and obtain required music/lyric sources
   before declaring the presentation app fully complete. Keep honest missing-source
   messages and preserve failed recording/submission recovery.
