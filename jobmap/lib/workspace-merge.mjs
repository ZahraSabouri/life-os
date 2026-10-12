import {canonicalUrl} from './discovery.mjs';
import {Store} from './store.mjs';

const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const evidenceKeys=['role','company','url','source','sourceDetail','location','region','salary','hours','deadline','advertisedOn','employment','stack','description','watch','reason','checked','availability','fields','links','coverage','track'];
const personalKeys=['status','priority','notes','nextStep','followUp','applied','cv','coverLetter'];

// Merge explicit choices field by field. Absence of a choice is not an unsave or
// an unarchive. Contradictory explicit choices require review, never a guess.
export function planWorkspaceMerge(first,second){
 if(first.format!=='jobmap-backup'||second.format!=='jobmap-backup'||first.sourceFingerprint!==second.sourceFingerprint||!equal(first.sourceJobs,second.sourceJobs))throw new Error('The original JobMap collections differ.');
 const next=structuredClone(first),conflicts=[],changes=[];
 const baseIds=new Set(first.sourceJobs.map(j=>j.id));
 const key=j=>baseIds.has(j.id)?'base:'+j.id:canonicalUrl(j.url)||j.id;
 function records(backup){const map=new Map();for(const raw of [...backup.sourceJobs,...backup.progress.customJobs]){const identity=key(raw);if(map.has(identity))throw new Error('Duplicate custom vacancy needs review: '+identity);map.set(identity,{raw,evidence:{...raw,...backup.progress.observations?.[raw.id]}});}return map;}
 const maps=[records(first),records(second)];
 for(const[identity,other]of maps[1]){
  let mine=maps[0].get(identity);
  if(!mine){
   if([...next.sourceJobs,...next.progress.customJobs].some(j=>j.id===other.raw.id))throw new Error('Vacancy ID collision needs review.');
   const raw=structuredClone(other.raw);next.progress.customJobs.push(raw);mine={raw,evidence:other.evidence};maps[0].set(identity,mine);
   if(second.progress.observations?.[raw.id]){next.progress.observations??={};next.progress.observations[raw.id]=structuredClone(second.progress.observations[raw.id]);}
   changes.push({id:raw.id,role:raw.role,field:'new record'});
  }
  const different=evidenceKeys.filter(k=>!equal(mine.evidence[k]??'',other.evidence[k]??''));
  if(different.length)conflicts.push({id:mine.raw.id,role:mine.raw.role,fields:different,type:'vacancy evidence'});
  for(const field of personalKeys)if(!equal(mine.raw[field]??'',other.raw[field]??''))conflicts.push({id:mine.raw.id,role:mine.raw.role,field,type:'original personal value'});
  const targetId=mine.raw.id;
  const a=next.progress.overrides[targetId]||{},b=second.progress.overrides[other.raw.id]||{},merged=structuredClone(a);
  for(const[field,value]of Object.entries(b)){
   if(field==='history')continue;
   if(Object.hasOwn(a,field)&&!equal(a[field],value))conflicts.push({id:targetId,role:mine.raw.role,field,type:'personal choice',values:[a[field],value]});
   else if(!Object.hasOwn(a,field)){merged[field]=structuredClone(value);changes.push({id:targetId,role:mine.raw.role,field});}
  }
  const history=[...new Map([...(a.history||[]),...(b.history||[])].map(e=>[JSON.stringify(e),e])).values()].sort((x,y)=>x.at.localeCompare(y.at));
  if(history.length>100)conflicts.push({id:targetId,field:'history',type:'combined history exceeds storage limit'});
  if(history.length)merged.history=history;
  if(Object.keys(merged).length)next.progress.overrides[targetId]=merged;
  // Added means first saved in JobMap, across both interfaces. Keep both original
  // per-copy dates in the migration snapshots, and use the earliest known date.
  if(!baseIds.has(targetId)){
   const target=next.progress.customJobs.find(j=>j.id===targetId);
   const dates=[target.addedOn,other.raw.addedOn].filter(Boolean).sort();
   if(dates.length&&target.addedOn!==dates[0]){target.addedOn=dates[0];changes.push({id:targetId,role:target.role,field:'addedOn'});}
  }
 }
 if(!equal(first.progress.preferences,second.progress.preferences))conflicts.push({field:'preferences',type:'personal preferences'});
 next.progress.importRuns=[...new Map([...(second.progress.importRuns||[]),...(first.progress.importRuns||[])].map(r=>[r.id,r])).values()].sort((a,b)=>a.at.localeCompare(b.at)).slice(-200);
 new Store(next.sourceJobs,'unused').validateState(next.progress);
 return {backup:next,changes,conflicts};
}
