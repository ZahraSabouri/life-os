import { readFile, writeFile, mkdir, rename, copyFile, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { DEFAULT_PROFILE, tagsOf, sameVacancy } from './matching.mjs';
import {planImport,validateObservation} from './discovery.mjs';
import {calendarDay,isDate} from './job-dates.mjs';
import {validFiles,MAX_FILES_PER_JOB} from './files.mjs';
import {validDocuments} from './documents.mjs';
import legacyDates from './legacy-dates.json' with {type:'json'};

export const STATUSES = ['To review','Check details','Preparing','Applied','Interview','Offer','Rejected','Archived'];
const strings = {notes:30000,feedback:20000,nextStep:1000,decidedOn:10,followUp:10,applied:10,cv:2000,coverLetter:2000,tags:500,folder:1000,attachments:6000,hours:500,role:500,company:300,location:1000,salary:3000,url:4000,deadline:10,advertisedOn:10};
const dateKeys = new Set(['followUp','applied','decidedOn','deadline','advertisedOn']);
// What the employer came back with, kept apart from the stage the job sits at.
export const OUTCOMES = ['','Awaiting reply','Interview invited','Rejected','Offer','Withdrawn'];
const empty = () => ({schemaVersion:1,revision:0,updatedAt:null,overrides:{},customJobs:[],preferences:{...DEFAULT_PROFILE}});
function validateProfile(p){if(!object(p)||typeof p.skills!=='string'||p.skills.length>3000||!['balanced','software','data'].includes(p.focus)||!Number.isInteger(p.maxHours)||p.maxHours<1||p.maxHours>40)throw new Error('Check the matching preferences.');return {skills:p.skills,focus:p.focus,maxHours:p.maxHours};}
export const localDay=calendarDay;
export const validDate=isDate;
export function safeUrl(s){if(!s)return true;try{return ['https:','http:'].includes(new URL(s).protocol)}catch{return false}}
function object(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
const isId=value=>typeof value==='string'&&/^[\w-]{1,80}$/.test(value);
// Her own work on two listings of one job, put together on the one that stays shown.
// Nothing she wrote is dropped: notes are joined, the further status and higher priority win, dates keep the earliest.
const STAGE=['To review','Check details','Preparing','Applied','Interview','Offer'];
function combine(keep,other){
 const out={},earliest=(a,b)=>[a,b].filter(Boolean).sort()[0]||'';
 if(other.saved&&!keep.saved)out.saved=true;
 const over=s=>['Archived','Rejected'].includes(s);
 // An archived job stays archived unless she had already started on the other listing.
 if(!over(other.status)&&STAGE.indexOf(other.status)>(over(keep.status)?0:STAGE.indexOf(keep.status)))out.status=other.status;
 if(other.priority&&(other.priority<keep.priority||!keep.priority))out.priority=other.priority;
 for(const key of ['applied','followUp']){const date=earliest(keep[key],other[key]);if(date!==(keep[key]||''))out[key]=date;}
 const mine=(keep.notes||'').trim(),theirs=(other.notes||'').trim();
 if(theirs&&!mine.includes(theirs))out.notes=(mine?mine+'\n\n'+theirs:theirs).slice(0,30000);
 for(const key of ['nextStep','cv','coverLetter','folder','hours'])if(!(keep[key]||'').trim()&&(other[key]||'').trim())out[key]=other[key];
 const tags=[...new Set([...tagsOf(keep),...tagsOf(other)])].join(', ');if(tags!==tagsOf(keep).join(', ')&&tags.length<=500)out.tags=tags;
 const lines=[...new Set([...(keep.attachments||'').split('\n'),...(other.attachments||'').split('\n')].map(s=>s.trim()).filter(Boolean))].join('\n');if(lines!==(keep.attachments||'').split('\n').map(s=>s.trim()).filter(Boolean).join('\n')&&lines.length<=6000)out.attachments=lines;
 return out;
}
export function validatePatch(patch){
 if(!object(patch))throw new Error('Changes must be an object.');
 const clean={};
 for(const [key,value] of Object.entries(patch)){
  if(Object.hasOwn(strings,key)){if(typeof value!=='string'||value.length>strings[key])throw new Error('Invalid '+key+'.');if(dateKeys.has(key)&&value&&!validDate(value))throw new Error('Use a valid date.');if(key==='url'&&!safeUrl(value))throw new Error('Use an http or https job link.');if(['role','company'].includes(key)&&!value.trim())throw new Error('Role and company are required.');clean[key]=value;}
  else if(key==='outcome'){if(!OUTCOMES.includes(value))throw new Error('Invalid outcome.');clean[key]=value;}
  else if(key==='status'){if(!STATUSES.includes(value))throw new Error('Invalid status.');clean[key]=value;}
  else if(key==='saved'){if(typeof value!=='boolean')throw new Error('Invalid shortlist value.');clean[key]=value;}
  else if(key==='priority'){if(!['P1','P2','P3','P4'].includes(value))throw new Error('Invalid priority.');clean[key]=value;}
  // The job a listing is shown as (set by join), and listings she said are different jobs.
  else if(key==='sameAs'){if(!isId(value))throw new Error('Invalid joined job.');clean[key]=value;}
  else if(key==='notSame'){if(!Array.isArray(value)||value.length>50||!value.every(isId))throw new Error('Invalid list of different jobs.');clean[key]=[...new Set(value)];}
  else throw new Error('Unsupported field: '+key);
 }
 return clean;
}
export class Store {
 constructor(base,directory){this.base=base;this.directory=directory;this.file=path.join(directory,'progress.json');this.fingerprint=createHash('sha256').update(JSON.stringify(base)).digest('hex');this.queue=Promise.resolve();this.state=empty();}
 async init(){await mkdir(this.directory,{recursive:true});try{this.state=this.validateState(JSON.parse(await readFile(this.file,'utf8')))}catch(error){if(error.code!=='ENOENT')throw new Error('Saved progress could not be read. It has been left untouched. '+error.message);}return this;}
 validateState(state){
  if(!object(state)||state.schemaVersion!==1||!Number.isSafeInteger(state.revision)||state.revision<0||!object(state.overrides)||!Array.isArray(state.customJobs)||state.customJobs.length>20000)throw new Error('This is not a valid JobMap backup.');
  const ids=new Set(this.base.map(j=>j.id));
  for(const j of state.customJobs){if(!object(j)||typeof j.id!=='string'||!/^CUSTOM-[\w-]+$/.test(j.id)||ids.has(j.id))throw new Error('Invalid added job.');ids.add(j.id);validatePatch({role:j.role,company:j.company,url:j.url||'',location:j.location||'',salary:j.salary||'',deadline:j.deadline||'',hours:j.hours||''});if(typeof j.description!=='string'||j.description.length>100000)throw new Error('Invalid job description.');}
  for(const [id,override] of Object.entries(state.overrides)){if(!ids.has(id)||!object(override))throw new Error('Unknown job in backup.');const {history,files,...fields}=override;validatePatch(fields);if(!validFiles(files))throw new Error('Invalid kept files.');if(history!==undefined&&(!Array.isArray(history)||history.length>100||history.some(e=>!object(e)||typeof e.at!=='string'||typeof e.label!=='string'||e.label.length>200)))throw new Error('Invalid activity history.');}
  if(!validDocuments(state.documents))throw new Error('Invalid documents folder.');
  if(state.observations!==undefined){if(!object(state.observations))throw new Error('Invalid vacancy observations.');for(const [id,entry]of Object.entries(state.observations)){if(!ids.has(id))throw new Error('Unknown observed job.');validateObservation(entry,validatePatch);}}
  if(state.importRuns!==undefined&&(!Array.isArray(state.importRuns)||state.importRuns.length>200||state.importRuns.some(r=>!object(r)||typeof r.id!=='string'||typeof r.at!=='string'||!['added','updated','skipped'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0))))throw new Error('Invalid search history.');
  // A joined listing points at a job that is itself shown, never at itself or along a chain.
  for(const [id,override] of Object.entries(state.overrides))if(override.sameAs!==undefined&&(override.sameAs===id||!ids.has(override.sameAs)||state.overrides[override.sameAs]?.sameAs))throw new Error('Invalid joined listing.');
  for(const j of state.customJobs){
   if(j.addedOn!==undefined&&!validDate(j.addedOn))throw new Error('Invalid date added.');
   if(j.advertisedOn!==undefined)validatePatch({advertisedOn:j.advertisedOn});
  }
  const result={...structuredClone(state),preferences:validateProfile(state.preferences||DEFAULT_PROFILE)};
  // Recovered from consecutive saved revisions and their completed import runs.
  // Never substitute a verification date or today's date for missing history.
  for(const j of result.customJobs)if(!j.addedOn&&legacyDates.customJobs[j.id])j.addedOn=legacyDates.customJobs[j.id].addedOn;
  return result;
 }
 // Every listing, the joined ones too. Files, backups and joining read these.
 all(){const baseIds=new Set(this.base.map(j=>j.id));return [...this.base,...this.state.customJobs].map(j=>({...j,addedOn:j.addedOn||(baseIds.has(j.id)&&this.fingerprint===legacyDates.sourceFingerprint?legacyDates.sourceAddedOn:''),advertisedOn:j.advertisedOn||'',status:j.status==='Open'?'To review':j.status,saved:false,nextStep:'',followUp:'',cv:'',coverLetter:'',tags:'',folder:'',attachments:'',files:[],hours:j.hours||'',notes:j.notes||'',applied:j.applied?.slice(0,10)||'',deadline:j.deadline?.slice(0,10)||'',...this.state.observations?.[j.id],...this.state.overrides[j.id],userEditedDeadline:Object.hasOwn(this.state.overrides[j.id]||{},'deadline')}));}
 // The jobs as she sees them: one record for each job, carrying where else it is advertised.
 jobs(){
  const all=this.all(),also=new Map();
  for(const j of all)if(j.sameAs){if(!also.has(j.sameAs))also.set(j.sameAs,[]);also.get(j.sameAs).push({id:j.id,source:j.source,url:j.url,role:j.role,company:j.company,location:j.location,deadline:j.deadline,checked:j.checked||'',availability:j.availability||''});}
  return all.filter(j=>!j.sameAs).map(j=>also.has(j.id)?{...j,alsoListed:also.get(j.id)}:j);
 }
 ingest(raw,revision,dryRun=false){return this.run(async()=>{this.check(revision);const {state,...result}=planImport(this.state,this.base,raw,validatePatch);if(!dryRun&&!result.repeated)await this.persist(state,'search');return {...result,dryRun,revision:this.state.revision};});}
 run(action){const next=this.queue.then(action);this.queue=next.catch(()=>{});return next;}
 preferences(raw,revision){return this.run(async()=>{this.check(revision);const preferences=validateProfile(raw);const next=structuredClone(this.state);next.preferences=preferences;await this.persist(next);return {preferences,revision:this.state.revision};});}
 check(revision){if(revision!==this.state.revision){const e=new Error('This workspace changed in another window. Reload and try again.');e.status=409;throw e;}}
 async persist(next,label='auto'){
  await mkdir(path.join(this.directory,'backups'),{recursive:true});
  if(this.state.revision>0){const stamp=new Date().toISOString().replace(/[:.]/g,'-');await writeFile(path.join(this.directory,'backups',`${stamp}-${this.state.revision}-${label}.json`),JSON.stringify(this.state),'utf8');}
  next.revision=this.state.revision+1;next.updatedAt=new Date().toISOString();
  const temporary=this.file+'.tmp';await writeFile(temporary,JSON.stringify(next,null,2),'utf8');await rename(temporary,this.file);this.state=next;
  // Keep recent snapshots plus the separate original source file.
  const files=(await readdir(path.join(this.directory,'backups'))).filter(n=>n.endsWith('.json')).sort();
  for(const f of files.slice(0,-40))await unlink(path.join(this.directory,'backups',f)).catch(()=>{});
 }
 patch(id,raw,revision){return this.run(async()=>{
  this.check(revision);const current=this.jobs().find(j=>j.id===id);if(!current)throw new Error('Job not found.');const patch=validatePatch(raw);if(Object.hasOwn(patch,'sameAs'))throw new Error('Unsupported field: sameAs');const next=structuredClone(this.state);
  if(patch.status==='Applied'&&!current.applied&&!Object.hasOwn(patch,'applied'))patch.applied=localDay();
  const previous={};for(const key of Object.keys(patch))previous[key]=current[key]??'';
  const existing=next.overrides[id]||{};const history=[...(existing.history||[])];
  if(patch.status&&patch.status!==current.status)history.push({at:new Date().toISOString(),label:`${current.status} → ${patch.status}`});
  next.overrides[id]={...existing,...patch,history:history.slice(-100)};
  await this.persist(next);return {job:this.jobs().find(j=>j.id===id),revision:this.state.revision,previous};
 });}
 // Two listings of one job: the other is kept, shown under this one, and her work on it comes along.
 // Files kept with the other listing are copied by the server before this runs (lib/files.mjs).
 join(keepId,otherId,revision){return this.run(async()=>{
  this.check(revision);
  const all=this.all(),keep=all.find(j=>j.id===keepId),other=all.find(j=>j.id===otherId);
  if(!keep||!other){const e=new Error('Job not found.');e.status=404;throw e;}
  if(keepId===otherId)throw new Error('Choose another listing to join.');
  if(keep.sameAs)throw new Error('This listing is already shown as part of another job.');
  if(other.sameAs)throw new Error('That listing is already shown as part of another job.');
  const next=structuredClone(this.state),at=new Date().toISOString(),where=(j)=>(j.source||'another listing').slice(0,80);
  const files=[...(keep.files||[]),...(other.files||[]).filter(f=>!(keep.files||[]).some(k=>k.id===f.id))];
  if(files.length>MAX_FILES_PER_JOB)throw new Error(`Together the two listings keep more than ${MAX_FILES_PER_JOB} files. Remove some first.`);
  const mine=next.overrides[keepId]||{},theirs=next.overrides[otherId]||{};
  next.overrides[keepId]={...mine,...validatePatch(combine(keep,other)),...(files.length>(keep.files||[]).length?{files}:{}),history:[...(mine.history||[]),{at,label:'Joined with the listing on '+where(other)}].slice(-100)};
  next.overrides[otherId]={...theirs,sameAs:keepId,history:[...(theirs.history||[]),{at,label:'Shown as the listing on '+where(keep)}].slice(-100)};
  // Listings already shown under the other one now show under this one.
  for(const [id,override] of Object.entries(next.overrides))if(override.sameAs===otherId)next.overrides[id]={...override,sameAs:keepId};
  await this.persist(next);return {job:this.jobs().find(j=>j.id===keepId),revision:this.state.revision};
 });}
 // Shown on its own again. It is remembered as a different job, so it is not offered for joining again.
 separate(id,revision){return this.run(async()=>{
  this.check(revision);const next=structuredClone(this.state),override=next.overrides[id];
  if(!override?.sameAs){const e=new Error('That listing is not joined to another job.');e.status=404;throw e;}
  const {sameAs,...rest}=override,at=new Date().toISOString();
  next.overrides[id]={...rest,notSame:[...new Set([...(rest.notSame||[]),sameAs])].slice(-50),history:[...(rest.history||[]),{at,label:'Shown on its own again'}].slice(-100)};
  await this.persist(next);const jobs=this.jobs();return {job:jobs.find(j=>j.id===id),kept:jobs.find(j=>j.id===sameAs),revision:this.state.revision};
 });}
 // The documents folder she connected, and the file in it that is her main CV.
 documents(raw,revision){return this.run(async()=>{this.check(revision);const documents={root:String(raw?.root??'').trim().replace(/^"(.*)"$/,'$1'),mainCv:String(raw?.mainCv??'')};if(!validDocuments(documents))throw new Error('Give the full path of a folder on this computer, starting from the drive.');const next=structuredClone(this.state);next.documents=documents;await this.persist(next);return {documents,revision:this.state.revision};});}
 // A file kept with a job: the store keeps its name, size and date; lib/files.mjs keeps the file.
 attach(id,file,revision){return this.run(async()=>{
  this.check(revision);if(!this.jobs().some(j=>j.id===id))throw new Error('Job not found.');if(!validFiles([file]))throw new Error('Invalid kept file.');
  const next=structuredClone(this.state);const existing=next.overrides[id]||{};const files=[...(existing.files||[])];
  if(files.length>=MAX_FILES_PER_JOB)throw new Error(`A job keeps up to ${MAX_FILES_PER_JOB} files. Remove one first.`);
  next.overrides[id]={...existing,files:[...files,file]};await this.persist(next);return {job:this.jobs().find(j=>j.id===id),revision:this.state.revision};
 });}
 detach(id,fileId,revision){return this.run(async()=>{
  this.check(revision);const next=structuredClone(this.state);const existing=next.overrides[id];
  if(!existing?.files?.some(f=>f.id===fileId)){const e=new Error('File not found.');e.status=404;throw e;}
  next.overrides[id]={...existing,files:existing.files.filter(f=>f.id!==fileId)};await this.persist(next);return {job:this.jobs().find(j=>j.id===id),revision:this.state.revision};
 });}
 add(raw,revision){return this.run(async()=>{
  this.check(revision);if(!object(raw))throw new Error('Invalid job.');const {description='',...values}=raw;const p=validatePatch(values);if(!p.role?.trim()||!p.company?.trim())throw new Error('Role and company are required.');if(typeof description!=='string'||description.length>100000)throw new Error('Description is too long.');
  const duplicate=p.url&&this.all().find(j=>j.url&&j.url.replace(/\/$/,'')===p.url.replace(/\/$/,''));if(duplicate){const shown=duplicate.sameAs?this.jobs().find(j=>j.id===duplicate.sameAs)||duplicate:duplicate;const e=new Error(`That link is already saved: ${shown.role} at ${shown.company}.`);e.status=409;throw e;}
  // The same job saved from another site: this link is kept with it, and the job is shown once.
  const same=this.jobs().filter(j=>sameVacancy(j,{id:'',...p}));
  const job={id:'CUSTOM-'+randomUUID(),source:'Added by you',sourceDetail:'Manual entry',role:p.role.trim(),company:p.company.trim(),location:p.location||'',salary:p.salary||'',url:p.url||'',deadline:p.deadline||'',hours:p.hours||'',description,employment:'',stack:'',watch:'',notes:'',status:'To review',priority:'P2',rank:this.base.length+this.state.customJobs.length+1,checked:new Date().toISOString(),coverage:'Added by you',fields:{},links:[],track:'',reason:'Added by you.'};
  job.addedOn=localDay();job.advertisedOn=p.advertisedOn||'';
  const next=structuredClone(this.state);next.customJobs.push(job);
  if(same.length===1){next.overrides[same[0].id]={...next.overrides[same[0].id],saved:true};next.overrides[job.id]={sameAs:same[0].id,history:[{at:new Date().toISOString(),label:'Shown as the listing on '+(same[0].source||'another site').slice(0,80)}]};await this.persist(next);return {job:this.jobs().find(j=>j.id===same[0].id),joined:true,revision:this.state.revision};}
  next.overrides[job.id]={saved:true};await this.persist(next);return {job:this.jobs().find(j=>j.id===job.id),revision:this.state.revision};
 });}
 export(){return {format:'jobmap-backup',version:1,exportedAt:new Date().toISOString(),sourceFingerprint:this.fingerprint,sourceJobs:this.base,progress:this.state};}
 restore(raw,revision){return this.run(async()=>{this.check(revision);if(!object(raw)||raw.format!=='jobmap-backup'||raw.version!==1||raw.sourceFingerprint!==this.fingerprint)throw new Error('This backup does not match this JobMap collection.');const next=this.validateState(raw.progress);await this.persist(next,'before-restore');return {revision:this.state.revision,jobs:this.jobs()};});}
}
