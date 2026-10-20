# Figma V2 integration checkpoint · 2026-10-21

- Branch: `feature/figma-v2-integration`, created from freshly fetched
  `origin/main` at `a20cf97`. Initial working tree was clean.
- User authorized the connected Figma app for this task despite the
  desktop-only rule in AGENTS.md. Local Desktop MCP port 3845 was unreachable.
- Notion DESIGN_SYSTEM.md, IA, PRD, user flow and screen specification were
  fetched through the connector. Their October 21 navigation and typography
  changes are present. No Notion document was edited.
- Baseline `npm run build` and all 13 suites in `npm run qa` passed.
  These are build/Node checks, not browser, microphone or visual acceptance.

## Implemented preparation

Phase 1 is **partial**: self-hosted Montserrat and Cormorant Garamond plus
upstream licenses and a scoped `design-system-v2.css` containing the current
Notion tokens. CSS is imported, but no screen opts in yet. Existing screen
styles, data, audio, recording and Resonance renderer remain unchanged.
Post-change build and whitespace checks passed.

## Blocker and next starting point

Figma design-context and screenshot reads succeeded for Home `1349:21126`,
Workspace `1412:29502`, Recording `1459:31183` and Search `1396:30802`.
The full screens returned sparse context; detailed child contexts were then
retrieved for Home sections, navigation, Workspace parts/timeline/artwork,
Recording monitoring/controls/artwork and Search input/tabs/result/filter.

Downloading the required original assets from `www.figma.com/api/mcp/asset/…`
fails at the environment proxy with `CONNECT tunnel failed, response 403`.
The enforced environment allowlist does not include www.figma.com. The user
has been asked to enable this domain through environment configuration.
Do not bypass the proxy or replace the originals with fabricated assets.

Next: once network access is configured, refresh/download original Figma assets,
finish Phase 1 common components and activate the scoped styles during Home
integration. Detailed temporary source reads are in `/tmp/ieum-figma-context/`
in this environment; refresh through the connector if absent or expired.
Then continue Home, Workspace, Recording, Search/navigation, regression and
Vercel Preview. None of these phases is complete.

## Source discrepancy

The user-flow document's Flow 2C recording row still says “Count-in 없이”.
DESIGN_SYSTEM.md section 13.2 explicitly says the latest input-before-recording
2/1 visual supersedes the old count-in removal rule. Use the latest explicit
design-system precedence; do not create a separate countdown screen.

## Remaining acceptance

No integrated screen visual comparison, new navigation/search behavior,
390/430px browser acceptance, actual microphone acceptance or Vercel Preview
has been completed. No Production action or standalone Resonance branch merge
was performed. The existing >500 kB bundle warning remains.
