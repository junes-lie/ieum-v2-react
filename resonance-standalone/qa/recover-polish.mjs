// Apply only to the exact recorded baseline; preserve unrelated user changes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'..');
const recipe=JSON.parse(fs.readFileSync(path.join(here,'recovery-polish.json'),'utf8'));
const hash=s=>{const b=Buffer.from(s);return crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');};
const planned=[];
for(const file of recipe.files){
 const target=path.resolve(root,file.path);if(!target.startsWith(root+path.sep))throw Error('Invalid path');
 let content=fs.readFileSync(target,'utf8'),current=hash(content);
 if(current===file.targetBlobSha){console.log('Already applied:',file.path);continue;}
 if(current!==file.baseBlobSha)throw Error('Unrecognized changes: '+file.path+'; merge manually without overwriting.');
 for(const [before,after] of file.replacements){if(content.split(before).length!==2)throw Error('Ambiguous patch: '+file.path);content=content.replace(before,after);}
 if(hash(content)!==file.targetBlobSha)throw Error('Result hash mismatch: '+file.path);
 planned.push([target,content,file.path]);
}
for(const [target,content,name] of planned){fs.writeFileSync(target,content);console.log('Applied:',name);}
console.log('Next: npm ci && npm run build && npm test; then run browser QA and regenerate captures.');
console.log('Expected HTML SHA-256 with the pinned toolchain:',recipe.expectedBuiltHtmlSha256);
