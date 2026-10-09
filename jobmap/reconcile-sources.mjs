// One-shot, reviewed source reconciliation. Default is preview; never merges personal choices.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalUrl} from './lib/discovery.mjs';
import {Store} from './lib/store.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const endpoints=process.argv.slice(2).filter(a=>!a.startsWith('--'));
if(endpoints.length!==2)throw new Error('Usage: node reconcile-sources.mjs <first API base URL> <second API base URL> [--apply]');
const apply=process.argv.includes('--apply');
for(const endpoint of endpoints){const u=new URL(endpoint);if(u.hostname!=='127.0.0.1'&&u.hostname!=='localhost')throw new Error('Only local JobMap APIs are supported.');}
async function read(endpoint){const r=await fetch(endpoint.replace(/\/$/,'')+'/backup');if(!r.ok)throw new Error('Backup request failed: '+r.status);const backup=await r.json();if(backup.format!=='jobmap-backup')throw new Error('Not a JobMap API.');return backup;}
const originals=await Promise.all(endpoints.map(read));
if(originals[0].sourceFingerprint!==originals[1].sourceFingerprint)throw new Error('Original source collections differ; review required.');
const next=structuredClone(originals);
const keys=['role','company','url','source','sourceDetail','location','region','salary','hours','deadline','advertisedOn','employment','stack','description','watch','reason','checked','availability','fields','links','coverage','track'];
const observationKeys=new Set(['role','company','url','source','sourceDetail','location','salary','hours','deadline','advertisedOn','employment','stack','description','watch','reason','checked','availability']);
const baseIds=new Set(originals[0].sourceJobs.map(j=>j.id));
const identity=j=>baseIds.has(j.id)?'base:'+j.id:canonicalUrl(j.url)||j.id;
function records(backup){return new Map([...backup.sourceJobs,...backup.progress.customJobs].map(raw=>{const evidence={...raw,...backup.progress.observations?.[raw.id]};return [identity(evidence),{raw,evidence}];}));}
const maps=originals.map(records),plans=endpoints.map(endpoint=>({endpoint,added:[],updated:[]}));const conflicts=[];
for(const key of new Set([...maps[0].keys(),...maps[1].keys()])){
 const held=maps.map(m=>m.get(key));
 for(let i=0;i<2;i++){
  const mine=held[i],other=held[1-i];if(!other)continue;
  if(!mine){
   const raw=structuredClone(other.evidence);if([...next[i].sourceJobs,...next[i].progress.customJobs].some(j=>j.id===raw.id))throw new Error('ID collision needs review: '+raw.id);
   Object.assign(raw,{status:'To review',priority:'P2',saved:false,notes:'',nextStep:'',followUp:'',applied:'',cv:'',coverLetter:''});delete raw.history;
   next[i].progress.customJobs.push(raw);plans[i].added.push({id:raw.id,role:raw.role,closed:raw.availability==='closed'});continue;
  }
  const different=keys.filter(k=>JSON.stringify(mine.evidence[k]??'')!==JSON.stringify(other.evidence[k]??''));if(!different.length)continue;
  const myDay=(mine.evidence.checked||'').slice(0,10),theirDay=(other.evidence.checked||'').slice(0,10);
  if(myDay===theirDay){if(i===0)conflicts.push({key,fields:different,checked:myDay});continue;}
  if(myDay>theirDay)continue;
  if(baseIds.has(mine.raw.id)){
   if(different.some(k=>!observationKeys.has(k)))throw new Error('Base source difference requires review: '+key);
   const observation={...next[i].progress.observations?.[mine.raw.id]};for(const k of keys)if(observationKeys.has(k)&&other.evidence[k]!==undefined)observation[k]=other.evidence[k];next[i].progress.observations??={};next[i].progress.observations[mine.raw.id]=observation;
  }else{
   const raw=next[i].progress.customJobs.find(j=>j.id===mine.raw.id);for(const k of keys){if(other.evidence[k]===undefined)delete raw[k];else raw[k]=structuredClone(other.evidence[k]);}delete next[i].progress.observations?.[mine.raw.id];
  }
  plans[i].updated.push({id:mine.raw.id,role:mine.evidence.role,fields:different});
 }
}
 new Store(next[0].sourceJobs,'unused').validateState(next[0].progress);new Store(next[1].sourceJobs,'unused').validateState(next[1].progress);
console.log(JSON.stringify({apply,plans,conflicts},null,2));
if(conflicts.length)throw new Error('Equally dated source evidence disagrees. No changes applied.');
if(!apply)process.exit(0);
const stamp=new Date().toISOString().replace(/[:.]/g,'-'),directory=path.join(root,'data/recovery','source-parity-'+stamp);await fs.mkdir(directory,{recursive:true});
await fs.writeFile(path.join(directory,'review.json'),JSON.stringify({plans,conflicts},null,2));
for(let i=0;i<2;i++){await fs.writeFile(path.join(directory,'before-'+i+'.json'),JSON.stringify(originals[i]));await fs.writeFile(path.join(directory,'proposed-'+i+'.json'),JSON.stringify(next[i]));}
// Each server enforces its own revision and takes its own before-restore backup.
for(let i=0;i<2;i++){
 if(!plans[i].added.length&&!plans[i].updated.length)continue;
 const r=await fetch(endpoints[i].replace(/\/$/,'')+'/restore',{method:'POST',headers:{'Content-Type':'application/json','X-JobMap-Client':'workspace-v1'},body:JSON.stringify({backup:next[i],revision:originals[i].progress.revision})});const result=await r.json();if(!r.ok)throw new Error(result.error||'Reconciliation refused: '+r.status);
 const after=await read(endpoints[i]);
 if(JSON.stringify(after.progress.overrides)!==JSON.stringify(originals[i].progress.overrides)||JSON.stringify(after.progress.preferences)!==JSON.stringify(originals[i].progress.preferences))throw new Error('Personal preservation verification failed. Recovery copies: '+directory);
 for(const raw of originals[i].progress.customJobs){const current=after.progress.customJobs.find(j=>j.id===raw.id);for(const k of ['status','priority','saved','notes','nextStep','followUp','applied','cv','coverLetter','history','addedOn'])if(JSON.stringify(current[k])!==JSON.stringify(raw[k]))throw new Error('Personal field changed: '+raw.id+' '+k);}
 console.log(JSON.stringify({endpoint:endpoints[i],result:'APPLIED',count:after.sourceJobs.length+after.progress.customJobs.length,revision:after.progress.revision,recovery:directory,personalFields:'unchanged'}));
}
