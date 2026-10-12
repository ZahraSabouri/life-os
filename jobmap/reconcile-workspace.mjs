import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {planWorkspaceMerge} from './lib/workspace-merge.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const endpoints=process.argv.slice(2).filter(a=>!a.startsWith('--'));
if(endpoints.length!==2)throw new Error('Usage: node reconcile-workspace.mjs <authoritative API> <other API> [--apply]');
for(const endpoint of endpoints){const u=new URL(endpoint);if(u.protocol!=='http:'||!['localhost','127.0.0.1'].includes(u.hostname)||u.username||u.password)throw new Error('Only local JobMap APIs are supported.');}
async function read(endpoint){const r=await fetch(endpoint.replace(/\/$/,'')+'/backup');if(!r.ok)throw new Error('Could not back up JobMap: '+r.status);return r.json();}
const originals=await Promise.all(endpoints.map(read));
const plan=planWorkspaceMerge(...originals);
console.log(JSON.stringify({apply:process.argv.includes('--apply'),changes:plan.changes,conflicts:plan.conflicts},null,2));
if(plan.conflicts.length)throw new Error('Conflicting personal choices or evidence need review. No changes applied.');
if(!process.argv.includes('--apply'))process.exit(0);
if(JSON.stringify(plan.backup.progress)===JSON.stringify(originals[0].progress)){console.log(JSON.stringify({result:'UNCHANGED',revision:originals[0].progress.revision}));process.exit(0);}
const directory=path.join(root,'data/recovery','shared-workspace-'+new Date().toISOString().replace(/[:.]/g,'-'));
await fs.mkdir(directory,{recursive:true});
for(let i=0;i<originals.length;i++)await fs.writeFile(path.join(directory,'before-'+i+'.json'),JSON.stringify(originals[i],null,2));
await fs.writeFile(path.join(directory,'proposed.json'),JSON.stringify(plan.backup,null,2));
await fs.writeFile(path.join(directory,'review.json'),JSON.stringify({endpoints,changes:plan.changes,conflicts:plan.conflicts},null,2));
const response=await fetch(endpoints[0].replace(/\/$/,'')+'/restore',{method:'POST',headers:{'Content-Type':'application/json','X-JobMap-Client':'workspace-v1'},body:JSON.stringify({backup:plan.backup,revision:originals[0].progress.revision})});
const result=await response.json();if(!response.ok)throw new Error(result.error||'Workspace merge refused.');
const after=await read(endpoints[0]);
for(const field of ['overrides','customJobs','preferences','observations','importRuns'])if(JSON.stringify(after.progress[field])!==JSON.stringify(plan.backup.progress[field]))throw new Error('Merge verification failed: '+field+'. Recovery: '+directory);
const peer=await read(endpoints[1]);
if(peer.progress.revision!==originals[1].progress.revision)throw new Error('The second workspace changed during reconciliation. Review before connecting it. Recovery: '+directory);
console.log(JSON.stringify({result:'APPLIED',revision:after.progress.revision,records:after.sourceJobs.length+after.progress.customJobs.length,recovery:directory}));
