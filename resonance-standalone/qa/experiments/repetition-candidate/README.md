# Rejected single-color candidate — not runtime

Visual result: **FAIL / not adopted**. The actual WebGL many-line image still reads as a thin gathered band. It does not establish the large whole closed form repeating inward as in the user’s 2D source. Source-guided polar extraction and a phase-shifted Fourier family are retained for diagnosis only. Hidden portions are inferred. Do not ship this patch or cite geometric checks as visual success.

`render-1.jpg`, `render-2.jpg`, `render-0.jpg` are actual Chromium canvas captures (one, boundary pair, all 24). `checks.json` confirms zero XZ endpoint drift for this candidate; that is a limited correspondence check, not complete visual transition, audio, mobile, or particle approval. Particles were disabled.

To reproduce in an isolated checkout from this commit (never apply over another execution’s work): from repository root apply `git apply resonance-standalone/qa/experiments/repetition-candidate/runtime.patch`; copy this directory’s `referenceContours.js` to `resonance-standalone/src/referenceContours.js`; copy `qa/renders/approved-repetition-reference.png` to `public/repetition-reference.png` within standalone; run `node build.mjs` there. Run `capture.cjs` with `IEUM_PLAYWRIGHT_PATH` and `IEUM_CHROMIUM_PATH` pointing to the installed tools. Outputs go to `/tmp/ieum-reference-contours`. These edits are exclusively for reproducing the rejected candidate.

Next: follow the actual source’s large bend sequence on separately identifiable inward full curves, compare them over the original, and reject local convergence that makes the entire family one band. Preserve the restored default until the visual requirement passes.

## Low-frequency correspondence diagnostic — 2026-10-20 KST

Changed only the k=1..3 terms to use the same lane-dependent phase as higher terms. Actual Chromium capture remains a single wavy band: **FAIL**, not an accepted source reconstruction. JS/console errors: zero. XZ endpoint drift remains zero across four generated layers; only coral was visible. No transition visual pass is claimed. This disproves the narrow hypothesis that fixing the shared low-frequency phase alone is sufficient. Do not continue fitting this family as the success model.

The build now regenerates the published candidate from its patch and contour source, preventing stale prebuilt HTML after source changes. Restored default HTML hash is unchanged. See `public/review/low-frequency-diagnostic.jpg` for this run’s actual canvas capture.
