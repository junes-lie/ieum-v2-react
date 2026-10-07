# Project workflow

- Preserve current local work. Never use reset, destructive checkout/restore, clean, force push, or overwrite local code from origin/main or Vercel.
- GitHub `main` is the source of truth after the initial synchronization. Local files are the workspace; Vercel is the deployment result.
- Follow this order: edit → local tests/build → Git status/diff review → commit → normal push to GitHub main → verify Vercel Git Integration automatic deployment → production QA.
- Never update Vercel production directly before pushing. Do not use manual production deployment to bypass a failed Git Integration deployment; investigate the integration.
- Stage verified code, required assets/configuration, maintained QA and project documents explicitly. Review staged diff; never begin with blind `git add .`.
- Keep ignored screenshots/results and obsolete local QA scripts on disk. Untracking generated outputs must preserve their local files.
- Do not revert current implementation to satisfy obsolete QA expectations. Assess/update tests against current requirements first.
- Computer Use is prohibited. Read Figma only through figma-desktop MCP and Notion only through its dedicated connector. Do not enable Remote Figma or use browser UI as a fallback.
- Continue implementation in the documented stage order; satisfy and report each stage's completion criteria before moving to the next stage.
- Report only observed validation/deployment results. Do not report full completion if any required check remains unverified.

See [Git workflow](docs/GIT_WORKFLOW.md) for the verification checklist.
