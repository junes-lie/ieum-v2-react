import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,renameSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'
import {deploymentDecision} from '../scripts/vercel-ignore-build.mjs'

const cwd=mkdtempSync(join(tmpdir(),'ieum-deployment-scope-'))
const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim()
const put=(path,text)=>{mkdirSync(join(cwd,path,'..'),{recursive:true});writeFileSync(join(cwd,path),text)}
const commit=message=>{git('add','--all');git('commit','-qm',message);return git('rev-parse','HEAD')}
const decision=(base,head,extra={})=>deploymentDecision({VERCEL_GIT_PREVIOUS_SHA:base,VERCEL_GIT_COMMIT_SHA:head,...extra},cwd)
try {
  git('init','-q');git('config','user.name','IEUM QA');git('config','user.email','qa@example.invalid')
  put('src/app.js','export const version=1\n')
  const deployed=commit('deployed app')
  put('docs/FIGMA_V2_INTEGRATION_LOCK.json','{"owner":"test"}\n')
  const lock=commit('lock only')
  assert.equal(decision(deployed,lock).skip,true)
  put('qa/check.mjs','// maintained QA\n')
  const qa=commit('QA only')
  assert.equal(decision(deployed,qa).skip,true)
  put('src/app.js','export const version=2\n')
  const pendingApp=commit('pending app')
  put('docs/FIGMA_V2_INTEGRATION_STATUS.md','verified\n')
  const checkpoint=commit('checkpoint after pending app')
  assert.equal(decision(deployed,checkpoint).skip,false,'Pending runtime must build even when HEAD itself only changes docs')
  assert.equal(decision(pendingApp,checkpoint).skip,true,'Already-deployed runtime plus docs skips')
  put('resonance-standalone/index.html','independent renderer\n')
  const standalone=commit('standalone only')
  assert.equal(decision(checkpoint,standalone).skip,true)
  put('new-build-config.json','{}\n')
  const config=commit('unknown config')
  assert.equal(decision(standalone,config).skip,false,'Unknown paths are conservative')
  rmSync(join(cwd,'src/app.js'))
  const deleted=commit('app deletion')
  assert.equal(decision(config,deleted).skip,false)
  put('src/another.js','export const active=true\n')
  const restored=commit('another runtime file')
  renameSync(join(cwd,'src/another.js'),join(cwd,'docs/another.js'))
  const moved=commit('runtime moved out of app')
  assert.equal(decision(restored,moved).skip,false,'A rename into docs still removes deployed runtime')
  assert.equal(decision('',deleted).skip,false,'First deployment continues')
  assert.equal(decision('f'.repeat(40),deleted).skip,false,'Shallow/unavailable base continues')
  assert.equal(decision(deployed,deleted,{VERCEL_PROJECT_ID:'prj_pnjQh8vGC6lBamfOlLlXlfXz8AzS',VERCEL_GIT_COMMIT_REF:'feature/figma-v2-integration'}).skip,true)
  assert.equal(decision(deployed,deleted,{VERCEL_PROJECT_ID:'prj_eowHNSo22vKNulK4a2LFYzQnAYj1',VERCEL_GIT_COMMIT_REF:'main'}).skip,false)
  assert.equal(decision(deployed,deleted,{VERCEL_PROJECT_ID:'prj_pnjQh8vGC6lBamfOlLlXlfXz8AzS',VERCEL_GIT_COMMIT_REF:'feature/resonance-standalone'}).skip,false,'Standalone branch is not suppressed')
  console.log('PASS deployment scope: real Git histories, lock/QA-only skip, pending app survives checkpoint, config/deletion/unknown base build, original project and independent branch preserved')
} finally {rmSync(cwd,{recursive:true,force:true})}
