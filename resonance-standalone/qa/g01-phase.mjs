import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSiriPartial} from './experiments/music-box/motion.mjs';

const label=process.env.IEUM_G01_LABEL||'after';
const inputs=[
 {bend:0,part:0,generation:0,voicePhase:.35},
 {bend:0,part:1,generation:0,voicePhase:.35},
 {bend:1,part:0,generation:0,voicePhase:.35},
 {bend:1,part:1,generation:0,voicePhase:2.65},
 {bend:2,part:0,generation:1,voicePhase:5.25},
 {bend:2,part:1,generation:1,voicePhase:5.25},
];
const phases=inputs.map(input=>spawnSiriPartial(input.bend,input.part,input.generation,input.voicePhase).phase);
const repeat=inputs.map(input=>spawnSiriPartial(input.bend,input.part,input.generation,input.voicePhase).phase);
assert.deepEqual(phases,repeat,'The seeded phase must be deterministic for the same input.');
if(label==='before')assert.ok(phases.every(phase=>phase===0),'The baseline is expected to start every partial at phase 0.');
else {
 assert.ok(phases.every(phase=>phase>0&&phase<Math.PI*2),'Each partial should start inside the cycle.');
 assert.ok(new Set(phases.map(phase=>phase.toFixed(9))).size===phases.length,'Each partial should start at a distinct phase.');
}
const report={label,input:'same six bend/part/generation/voicePhase tuples',phases,distinctPhases:new Set(phases.map(phase=>phase.toFixed(9))).size,deterministic:true};
const qaDir=path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(qaDir,`g01-phase-${label}-verification.json`),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
