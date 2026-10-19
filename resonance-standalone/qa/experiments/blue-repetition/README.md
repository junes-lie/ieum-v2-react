# Blue — one voice, inward repetitions

The runtime candidate uses one `blueVoiceShape(profile, t, strand)` for both outer and inner repetitions. The same parent, fold count/phase, spread and local strand index drive both. The inner repetition only changes radial placement by 190 source pixels; this is not an independent voice or a source-fidelity approval. The original independent `paths.json` extraction is retained as source observation/history; its inner curves no longer drive runtime shape.

`build-candidate.mjs` also uses the paired local strand index for 3D height, line width and flow. The default restored standalone is unchanged. Particles remain off in this candidate.

Run `node qa/experiments/blue-repetition/same-voice.mjs` for shared morphology/closure/determinism checks. Run `verify.cjs` with Playwright/Chromium paths for actual one/two/all line captures, 2D/intermediate/3D, paired geometry height checks and a fresh mobile viewport with PNG size assertion. Build with `node build-candidate.mjs`.

Remaining: source-like wide return folds and natural weave, mobile crowding, particles and synthesis/audio/long-run verification. Shared morphology tests do not prove image reconstruction or user acceptance.
