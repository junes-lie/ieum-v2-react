# Blue reference repetition comparison

The user corrected the experiment target: blue and ivory show whole-form inward repetition; coral is not the criterion for that two-part structure. This candidate starts with blue only. The earlier coral work is historical, not a validated model.

`extract.py` validates the exact committed source hash, isolates blue pixels, and independently samples outer (350–560 px) and inner (165–335 px) components about source center (625,615). Twelve radial quantiles per component are periodically smoothed. The space between components is not filled with interpolated strands. Missing directions are inferred; observed flags are stored in `paths.json`. This is a representative path approximation, not recovery of individual source-thread identities.

The source overlay shows one representative path from each component. Green/yellow solid = source direction has blue pixels; magenta dashed = inferred direction. Even a solid segment is a smoothed estimate and may not coincide with an exact source filament.

Run `python qa/experiments/blue-repetition/extract.py`, then `npm run build` within standalone. Existing source/patch is applied in a temporary directory; the default runtime stays byte-identical. The candidate switches visibility to BLUE, uses separate outer/inner paths, keeps matching XZ positions during lift, and adjusts only its label radius to .60 for the source's proportion. Particles are disabled.

Run `verify.cjs` with installed Playwright/Chromium paths in IEUM_PLAYWRIGHT_PATH/IEUM_CHROMIUM_PATH. Actual Chromium captures cover one outer path, outer+inner pair, 24 strands, transition midpoint, spatial and 390px view. Captures and verification are evidence, not visual acceptance.

Current limitation: two source components are visible, but quantile paths mostly run alongside one another. Reference-like cross-weaving, loops, fold texture and hidden source connections are not reproduced. Ivory, audio, synthesis, particle correspondence and long-run stability are not newly validated. Do not claim completed visual reconstruction.
