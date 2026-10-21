import {spawnSync} from 'node:child_process'
import {pathToFileURL} from 'node:url'

// Vercel: exit 0 skips a build; exit 1 continues it.
// Compare against the LAST SUCCESSFUL build, not HEAD^: checkpoints can follow
// pending app changes that have not reached Production yet.
export function deploymentDecision(env=process.env,cwd=process.cwd()) {
  if (env.VERCEL_PROJECT_ID==='prj_pnjQh8vGC6lBamfOlLlXlfXz8AzS' &&
      ['main','feature/figma-v2-integration'].includes(env.VERCEL_GIT_COMMIT_REF)) {
    return {skip:true,reason:'React integration belongs to the original ieum-v2-react project'}
  }
  const base=env.VERCEL_GIT_PREVIOUS_SHA
  const head=env.VERCEL_GIT_COMMIT_SHA || 'HEAD'
  if (!/^[a-f0-9]{40}$/i.test(base || '') ||
      (head!=='HEAD' && !/^[a-f0-9]{40}$/i.test(head))) {
    return {skip:false,reason:'No reliable previous successful Git revision; continue safely'}
  }
  const result=spawnSync('git',['diff','--no-renames','--name-only','-z',base,head,'--'],{cwd,encoding:'utf8'})
  if (result.error || result.status!==0) {
    return {skip:false,reason:'Git comparison unavailable; continue safely'}
  }
  const paths=result.stdout.split('\0').filter(Boolean)
  const nonRuntime=path=>path.startsWith('docs/') || path.startsWith('qa/') ||
    path.startsWith('resonance-standalone/') ||
    ['AGENTS.md','README.md','CURRENT_IMPLEMENTATION_STATUS.md',
      'REQUIREMENTS_LEDGER_ATOMIC.csv','REQUIREMENTS_TRACEABILITY.md'].includes(path)
  const skip=paths.every(nonRuntime)
  return {skip,reason:skip ? 'Only documentation, QA or independent standalone files changed' :
    'Application, assets or deployment configuration changed since the last successful build'}
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const result=deploymentDecision()
  console.log(`IEUM ignored build step: ${result.skip?'skip':'continue'} — ${result.reason}`)
  process.exitCode=result.skip?0:1
}
