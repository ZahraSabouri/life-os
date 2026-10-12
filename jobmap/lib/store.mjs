import { readFile, writeFile, mkdir, rename, copyFile, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { DEFAULT_PROFILE } from './matching.mjs';
import {planImport,validateObservation} from './discovery.mjs';
import {calendarDay,isDate} from './job-dates.mjs';
import legacyDates from './legacy-dates.json' with {type:'json'};

export const STATUSES = ['To review','Check details','Preparing','Applied','Interview','Offer','Rejected','Archived'];
const strings = {notes:30000,nextStep:1000,followUp:10,applied:10,cv:2000,coverLetter:2000,tags:500,folder:1000,attachments:6000,hours:500,role:500,company:300,location:1000,salary:3000,url:4000,deadline:10,advertisedOn:10};
const dateKeys = new Set(['followUp','applied','deadline','advertisedOn']);
const empty = () => ({schemaVersion:1,revision:0,updatedAt:null,overrides:{},customJobs:[],preferences:{...DEFAULT_PROFILE}});
function validateProfile(p){if(!object(p)||typeof p.skills!=='string'||p.skills.length>3000||!['balanced','software','data'].includes(p.focus)||!Number.isInteger(p.maxHours)||p.maxHours<1||p.maxHours>40)throw new Error('Check the matching preferences.');return {skills:p.skills,focus:p.focus,maxHours:p.maxHours};}
export const localDay=calendarDay;
export const validDate=isDate;
export function safeUrl(s){if(!s)return true;try{return ['https:','http:'].includes(new URL(s).protocol)}catch{return false}}
function object(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
export function validatePatch(patch){
 if(!object(patch))throw new Error('Changes must be an object.');
 const clean={};
 for(const [key,value] of Object.entries(patch)){
  if(Object.hasOwn(strings,key)){if(typeof value!=='string'||value.length>strings[key])throw new Error('Invalid '+key+'.');if(dateKeys.has(key)&&value&&!validDate(value))throw new Error('Use a valid date.');if(key==='url'&&!safeUrl(value))throw new Error('Use an http or https job link.');if(['role','company'].includes(key)&&!value.trim())throw new Error('Role and company are required.');clean[key]=value;}
  else if(key==='status'){if(!STATUSES.includes(value))throw new Error('Invalid status.');clean[key]=value;}
  else if(key==='saved'){if(typeof value!=='boolean')throw new Error('Invalid shortlist value.');clean[key]=value;}
  else if(key==='priority'){if(!['P1','P2','P3','P4'].includes(value))throw new Error('Invalid priority.');clean[key]=value;}
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
  for(const [id,override] of Object.entries(state.overrides)){if(!ids.has(id)||!object(override))throw new Error('Unknown job in backup.');const {history,...fields}=override;validatePatch(fields);if(history!==undefined&&(!Array.isArray(history)||history.length>100||history.some(e=>!object(e)||typeof e.at!=='string'||typeof e.label!=='string'||e.label.length>200)))throw new Error('Invalid activity history.');}
  if(state.observations!==undefined){if(!object(state.observations))throw new Error('Invalid vacancy observations.');for(const [id,entry]of Object.entries(state.observations)){if(!ids.has(id))throw new Error('Unknown observed job.');validateObservation(entry,validatePatch);}}
  if(state.importRuns!==undefined&&(!Array.isArray(state.importRuns)||state.importRuns.length>200||state.importRuns.some(r=>!object(r)||typeof r.id!=='string'||typeof r.at!=='string'||!['added','updated','skipped'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0))))throw new Error('Invalid search history.');
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
 jobs(){const baseIds=new Set(this.base.map(j=>j.id));return [...this.base,...this.state.customJobs].map(j=>({...j,addedOn:j.addedOn||(baseIds.has(j.id)&&this.fingerprint===legacyDates.sourceFingerprint?legacyDates.sourceAddedOn:''),advertisedOn:j.advertisedOn||'',status:j.status==='Open'?'To review':j.status,saved:false,nextStep:'',followUp:'',cv:'',coverLetter:'',tags:'',folder:'',attachments:'',hours:j.hours||'',notes:j.notes||'',applied:j.applied?.slice(0,10)||'',deadline:j.deadline?.slice(0,10)||'',...this.state.observations?.[j.id],...this.state.overrides[j.id],userEditedDeadline:Object.hasOwn(this.state.overrides[j.id]||{},'deadline')}));}
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
  this.check(revision);const current=this.jobs().find(j=>j.id===id);if(!current)throw new Error('Job not found.');const patch=validatePatch(raw);const next=structuredClone(this.state);
  if(patch.status==='Applied'&&!current.applied&&!Object.hasOwn(patch,'applied'))patch.applied=localDay();
  const previous={};for(const key of Object.keys(patch))previous[key]=current[key]??'';
  const existing=next.overrides[id]||{};const history=[...(existing.history||[])];
  if(patch.status&&patch.status!==current.status)history.push({at:new Date().toISOString(),label:`${current.status} → ${patch.status}`});
  next.overrides[id]={...existing,...patch,history:history.slice(-100)};
  await this.persist(next);return {job:this.jobs().find(j=>j.id===id),revision:this.state.revision,previous};
 });}
 add(raw,revision){return this.run(async()=>{
  this.check(revision);if(!object(raw))throw new Error('Invalid job.');const {description='',...values}=raw;const p=validatePatch(values);if(!p.role?.trim()||!p.company?.trim())throw new Error('Role and company are required.');if(typeof description!=='string'||description.length>100000)throw new Error('Description is too long.');
  const duplicate=p.url&&this.jobs().find(j=>j.url&&j.url.replace(/\/$/,'')===p.url.replace(/\/$/,''));if(duplicate){const e=new Error(`That link is already saved: ${duplicate.role} at ${duplicate.company}.`);e.status=409;throw e;}
  const job={id:'CUSTOM-'+randomUUID(),source:'Added by you',sourceDetail:'Manual entry',role:p.role.trim(),company:p.company.trim(),location:p.location||'',salary:p.salary||'',url:p.url||'',deadline:p.deadline||'',hours:p.hours||'',description,employment:'',stack:'',watch:'',notes:'',status:'To review',priority:'P2',rank:this.base.length+this.state.customJobs.length+1,checked:new Date().toISOString(),coverage:'Added by you',fields:{},links:[],track:'',reason:'Added by you.'};
  job.addedOn=localDay();job.advertisedOn=p.advertisedOn||'';
  const next=structuredClone(this.state);next.customJobs.push(job);next.overrides[job.id]={saved:true};await this.persist(next);return {job:this.jobs().find(j=>j.id===job.id),revision:this.state.revision};
 });}
 export(){return {format:'jobmap-backup',version:1,exportedAt:new Date().toISOString(),sourceFingerprint:this.fingerprint,sourceJobs:this.base,progress:this.state};}
 restore(raw,revision){return this.run(async()=>{this.check(revision);if(!object(raw)||raw.format!=='jobmap-backup'||raw.version!==1||raw.sourceFingerprint!==this.fingerprint)throw new Error('This backup does not match this JobMap collection.');const next=this.validateState(raw.progress);await this.persist(next,'before-restore');return {revision:this.state.revision,jobs:this.jobs()};});}
}
