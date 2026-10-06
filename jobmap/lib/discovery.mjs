import {randomUUID} from 'node:crypto';
import {calendarDay} from './job-dates.mjs';

const limits={role:500,company:300,url:4000,location:1000,salary:3000,hours:500,deadline:10,advertisedOn:10,description:100000,employment:1000,stack:3000,watch:5000,reason:5000,checked:10,source:200,sourceDetail:1000,availability:20};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function canonicalUrl(raw){
 try{const u=new URL(raw);u.hash='';u.hostname=u.hostname.toLowerCase().replace(/^www\./,'');u.pathname=u.pathname.replace(/\/$/,'');
 for(const key of [...u.searchParams.keys()])if(/^(utm_.+|trk|trackingId|refId|gh_src)$/i.test(key))u.searchParams.delete(key);
 u.searchParams.sort();return u.toString().replace(/\/$/,'');}catch{return '';}
}
const norm=s=>(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const identity=j=>[norm(j.company),norm(j.role),norm(j.location)].join('|');
export function validateObservation(raw,validatePatch){
 if(!object(raw))throw new Error('Invalid vacancy evidence.');
 const clean={};for(const [key,value]of Object.entries(raw)){
  if(!Object.hasOwn(limits,key)||typeof value!=='string'||value.length>limits[key])throw new Error('Invalid evidence field: '+key);
  clean[key]=value;
 }
 validatePatch(Object.fromEntries(Object.entries(clean).filter(([k])=>['role','company','url','location','salary','hours','deadline','advertisedOn'].includes(k))));
 if(clean.checked&&!/^\d{4}-\d{2}-\d{2}$/.test(clean.checked))throw new Error('Use a checked date as YYYY-MM-DD.');
 if(clean.checked)validatePatch({deadline:clean.checked});
 if(clean.availability&&!['open','closed','uncertain'].includes(clean.availability))throw new Error('Invalid vacancy availability.');
 return clean;
}
export function planImport(state,base,raw,validatePatch){
 if(!object(raw)||typeof raw.runId!=='string'||!raw.runId.trim()||raw.runId.length>200||!Array.isArray(raw.jobs)||raw.jobs.length>100)throw new Error('Use a runId and up to 100 jobs.');
 if(state.importRuns?.some(r=>r.id===raw.runId))return {repeated:true,added:[],updated:[],skipped:[],state};
 const entries=raw.jobs.map(entry=>{
  if(!object(entry))throw new Error('Invalid job.');
  const {existingId,...fields}=entry;
  if(existingId!==undefined&&typeof existingId!=='string')throw new Error('Invalid existing job ID.');
  const value=validateObservation(fields,validatePatch);
  if(!value.role?.trim()||!value.company?.trim()||!value.url||!value.description?.trim()||!value.checked||!value.source?.trim())throw new Error('Each job needs role, company, URL, description, source and checked date.');
  return {existingId,value};
 });
 const next=structuredClone(state);next.observations??={};next.importRuns??=[];
 const records=[...base,...next.customJobs];const added=[],updated=[],skipped=[];
 for(const {existingId,value}of entries){
  const current=records.map(j=>({...j,...next.observations[j.id],...next.overrides[j.id]}));
  let matches=existingId?current.filter(j=>j.id===existingId):current.filter(j=>canonicalUrl(j.url)===canonicalUrl(value.url));
  if(existingId&&!matches.length)throw new Error('Unknown existing job ID: '+existingId);
  if(!matches.length&&value.location){const possible=current.filter(j=>identity(j)===identity(value));if(possible.length){skipped.push({role:value.role,ids:possible.map(j=>j.id),reason:'Possible duplicate with another link. Verify vacancy identity, then supply existingId if it is the same job.'});continue;}}
  if(matches.length>1){skipped.push({role:value.role,reason:'Multiple existing records match; review their IDs.'});continue;}
  if(matches.length){
   const job=matches[0],prior=next.observations[job.id];
   if((prior?.checked||job.checked||'').slice(0,10)>value.checked){skipped.push({id:job.id,reason:'Older evidence than the saved verification.'});continue;}
   const observation={...prior,...value};
   // Keep the original collection source and every personal override intact.
   delete observation.source;observation.sourceDetail=('Latest check: '+value.source+(value.sourceDetail?' — '+value.sourceDetail:'')).slice(0,1000);
   const evidence={...records.find(j=>j.id===job.id),...prior};
   const changed=Object.keys(value).some(k=>!['checked','source','sourceDetail'].includes(k)&&value[k]!==evidence[k]);
   next.observations[job.id]=observation;if(changed)updated.push(job.id);
  }else{
   if(value.availability==='closed'){skipped.push({role:value.role,reason:'Closed vacancy was not added.'});continue;}
   const job={id:'CUSTOM-'+randomUUID(),rank:base.length+next.customJobs.length+1,status:'To review',priority:'P2',salary:'',hours:'',location:'',deadline:'',employment:'',stack:'',watch:'',reason:'',notes:'',description:'',fields:{},links:[],coverage:'Scheduled search',track:'',...value};
   job.addedOn=calendarDay();
   next.customJobs.push(job);records.push(job);next.overrides[job.id]={saved:true};added.push(job.id);
  }
 }
 next.importRuns.push({id:raw.runId,at:new Date().toISOString(),added:added.length,updated:updated.length,skipped:skipped.length});next.importRuns=next.importRuns.slice(-200);
 return {state:next,repeated:false,added,updated,skipped};
}
