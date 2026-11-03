import {TERMS} from './insights.mjs';
const norm=value=>String(value||'').trim().toLowerCase();
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const has=(text,word,cased=false)=>new RegExp('(?:^|[^a-z0-9])'+escape(word)+'(?:$|[^a-z0-9])',cased?'':'i').test(text);
const names=term=>[term[0],...(term[1]||[])];
const skillMatches=(skills,term)=>skills.some(skill=>names(term).some(name=>norm(skill)===norm(name)));
export const IMPORTANCE={essential:'Essential',desirable:'Desirable',mentioned:'Mentioned',optional:'Not required',review:'Review wording'};
export const COVERAGE={evidence:'Evidence linked',declared:'Listed skill; add evidence',partial:'Some evidence; review',learning:'Learning',gap:'Gap you recorded',unknown:'Not evidenced',optional:'Not required'};

/** @param {{description?:string}} job
 * @param {{evidence:import('./types').ProfileEvidence[],version?:number}} [career]
 * @param {{skills:string}} [preferences] */
export function reviewRequirements(job,career={evidence:[]},preferences={skills:''}){
 const advert=String(job.description||'').trim();
 if(!advert)return {rows:[],truncated:false,missingAdvert:true,profileVersion:career.version||0};
 // Headings establish context; a new unrelated section ends it. No inference from role titles.
 let context='mentioned',truncatedText=false;const rows=[],seen=new Set();
 const blocks=advert.replace(/<[^>]*>/g,' ').replace(/\r/g,'').split(/\n|;|(?<=[.!?])\s+(?=[A-Z])/);
 for(let raw of blocks){
  raw=raw.replace(/^\s*(?:[-*•]|\d+[.)])\s*/,'').trim();if(!raw)continue;
  if(raw.length>1200){raw=raw.slice(0,1200);truncatedText=true;}
  const heading=raw.replace(/^#+\s*/,'').replace(/[:.]$/,'').trim();
  if(/^(?:essential(?: criteria| requirements| skills| qualifications)?|required(?: skills| qualifications| experience)?|must[- ]haves?|what you(?:'ll| will) need)$/i.test(heading)){context='essential';continue;}
  if(/^(?:desirable(?: criteria| requirements| skills| qualifications)?|preferred(?: skills| qualifications)?|nice[- ]to[- ]haves?|bonus(?: points)?)$/i.test(heading)){context='desirable';continue;}
  if(/^(?:#{1,4}\s|about (?:us|you|the role)|benefits|responsibilities|what we offer|how to apply|salary)/i.test(raw)||(/^\w[^.!?]{0,65}:$/.test(raw)&&!TERMS.some(term=>names(term).some(name=>has(raw,name,term[2])))))context='mentioned';
  const found=TERMS.filter(term=>names(term).some(name=>has(raw,name,term[2])));
  const other=/\b(?:years?|degree|qualification|clearance|citizenship|fluent|welsh|english|licen[cs]e)\b/i.test(raw)&&(context!=='mentioned'||/\b(?:must|required|essential|need|minimum|desirable|preferred)\b/i.test(raw));
  if(!found.length&&!other)continue;
  const text=raw.slice(0,1200),dedupe=norm(text);if(seen.has(dedupe))continue;seen.add(dedupe);
  const optional=/\b(?:not (?:essential|required|necessary)|no (?:prior |previous )?(?:experience|knowledge)[^.]*required|need not|not expected)\b/i.test(text);
  const desirable=/\b(?:desirable|preferred|nice[- ]to[- ]have|bonus|advantageous)\b/i.test(text),required=/\b(?:must|required|essential|minimum|need to|you(?:'ll| will) need)\b/i.test(text);
  const mixedWording=found.length>1&&(optional||desirable&&required);
  const importance=mixedWording?'review':optional?'optional':desirable?'desirable':required?'essential':context;
  const alternatives=found.length>1&&/\bor\b|and\/or/i.test(text);
  const evidence=[...new Map(found.flatMap(term=>(career.evidence||[]).filter(item=>skillMatches(item.skills,term))).map(item=>[item.id,item])).values()];
  const supported=found.filter(term=>evidence.some(item=>['document','self'].includes(item.basis)&&skillMatches(item.skills,term))).length;
  const listed=found.filter(term=>skillMatches(String(preferences.skills||'').split(','),term)).length;
  const gap=evidence.some(item=>item.basis==='gap'),learning=evidence.some(item=>item.basis==='learning');
  // A skill example cannot prove a degree, a duration, a language level or clearance.
  const extraCondition=/\b(?:years?|degree|qualification|clearance|citizenship|fluent|native|certifi(?:ed|cation)|licen[cs]e)\b/i.test(text);
  const coverage=optional&&!mixedWording?'optional':supported?(!extraCondition&&!alternatives&&!mixedWording&&supported===found.length?'evidence':'partial'):learning?'learning':gap?'gap':listed?'declared':'unknown';
  rows.push({id:'requirement-'+rows.length,text,importance,coverage,skills:found.map(term=>term[0]),evidence,alternatives,extraCondition,mixedWording});
 }
 return {rows:rows.slice(0,40),truncated:rows.length>40||truncatedText,missingAdvert:false,profileVersion:career.version||0};
}
