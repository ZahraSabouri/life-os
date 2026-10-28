// Ideas from Dossier (https://github.com/AienTech/dossier, AGPL-3.0), written again for JobMap's
// stages and data; no Dossier code is copied. How far her applications got, what is worth a look
// now, the tech an advert names that her skills do not list, and a prompt that hands a job to a
// Claude chat. Everything here reads her jobs; nothing saves.
import {DEFAULT_PROFILE,WAITING_DAYS,dayNow,daysUntil,dateLabel,reviewDeadline} from './matching.mjs';

const londonDay=at=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
const shift=(day,days)=>new Date(Date.parse(day+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
const monday=day=>shift(day,-((new Date(day+'T12:00:00Z').getUTCDay()+6)%7));

// How far a job got: 0 not sent, 1 applied, 2 interview, 3 offer. Its stage now, every stage in its
// history ("Applied → Interview"), a date applied and the employer's outcome all count, so a rejection
// keeps where it got to. Any outcome but a missed deadline means it was sent.
export const FUNNEL=['Applied','Interview','Offer'];
const RANK={Applied:1,Interview:2,Offer:3},OUTCOME_RANK={'Interview invited':2,Offer:3};
const moves=job=>(job.history||[]).map(h=>({at:h.at,stages:/^(.+) → (.+)$/.exec(h.label)?.slice(1)||[]}));
export function furthest(job){
 let rank=job.applied||job.outcome&&job.outcome!=='Missed deadline'?1:0;
 for(const stage of [job.status,...moves(job).flatMap(m=>m.stages)])rank=Math.max(rank,RANK[stage]||0);
 return Math.max(rank,OUTCOME_RANK[job.outcome]||0);
}
const rejected=job=>job.status==='Rejected'||job.outcome==='Rejected';
// The day it was sent: the date she gave, or else the day it first moved into a sent stage. A move from
// Applied to Interview says it was sent earlier, on a day not recorded.
export function sentOn(job){
 if(job.applied)return job.applied.slice(0,10);
 const move=moves(job).find(m=>RANK[m.stages[1]]&&!RANK[m.stages[0]]);
 return move?londonDay(move.at):'';
}
function closing(job,today){
 const day=reviewDeadline(job),days=daysUntil(day,today);
 return days===null?'':days<0?'its closing date ('+dateLabel(day)+') has passed':days===0?'it closes today':days===1?'it closes tomorrow':'it closes '+dateLabel(day);
}

export const STANDING=['Check details','Preparing','Applied','Interview','Offer','Rejected'];
// A sent application with no news is worth a follow-up after as many days as "Waiting on a reply" waits.
export function progress(jobs,today=dayNow(),{quietDays=WAITING_DAYS,weeks=12}={}){
 // A listing joined to another job is that job, so it is counted once.
 const listed=jobs.filter(j=>!j.sameAs);
 const reached=rank=>listed.filter(j=>furthest(j)>=rank).length;
 const sent=reached(1),heard=listed.filter(j=>furthest(j)>=2||furthest(j)===1&&rejected(j)).length;
 const funnel=FUNNEL.map((stage,i)=>{
  const stopped=listed.filter(j=>furthest(j)===i+1);
  return {stage,count:reached(i+1),conversion:i>0&&reached(i)>0?Math.round(reached(i+1)/reached(i)*100):null,rejected:stopped.filter(rejected).length,withdrawn:stopped.filter(j=>j.outcome==='Withdrawn').length,archived:stopped.filter(j=>j.status==='Archived'&&!rejected(j)&&j.outcome!=='Withdrawn').length};
 });
 const byStatus=STANDING.map(status=>({status,count:listed.filter(j=>j.status===status).length}));

 // Week by week, Monday to Sunday in London: jobs added, jobs moved on from To review, and applications sent.
 const first=monday(today),starts=Array.from({length:weeks},(_,i)=>shift(first,(i-weeks+1)*7));
 const activity=starts.map(start=>({start,added:0,sorted:0,applied:0}));
 const week=day=>day?starts.indexOf(monday(day.slice(0,10))):-1;
 for(const job of listed){
  const added=week(job.addedOn);if(added>=0)activity[added].added++;
  const applied=week(sentOn(job));if(applied>=0)activity[applied].applied++;
  const moved=moves(job).find(m=>m.stages[0]==='To review');const sorted=moved?week(londonDay(moved.at)):-1;if(sorted>=0)activity[sorted].sorted++;
 }

 // Worth a look, in this order: offers, interviews, follow-ups due, applications being prepared
 // (soonest closing first), sent ones gone quiet, then starred jobs closing within a week that
 // are not started. Each job once, under the first reason that fits.
 const attention=[],seen=new Set();
 const add=(job,reason,action,soon=false)=>{if(!seen.has(job.id)){seen.add(job.id);attention.push({id:job.id,role:job.role,company:job.company,status:job.status,reason,action,soon});}};
 // Still in play: not archived or rejected, and not withdrawn.
 const open=listed.filter(j=>!['Archived','Rejected'].includes(j.status)&&!['Rejected','Withdrawn'].includes(j.outcome||''));
 const days=job=>daysUntil(reviewDeadline(job),today);
 const byClosing=(a,b)=>(reviewDeadline(a)||'9999').localeCompare(reviewDeadline(b)||'9999');
 for(const job of open.filter(j=>j.status==='Offer'||j.outcome==='Offer'))add(job,'An offer is waiting on your decision.','Review');
 for(const job of open.filter(j=>j.status==='Interview'||j.outcome==='Interview invited'))add(job,'At interview. Interview prep is under Write it with Claude; keep the date in Next step.','Prepare');
 for(const job of open.filter(j=>j.followUp&&j.followUp<=today).sort((a,b)=>a.followUp.localeCompare(b.followUp)))add(job,'Follow-up due '+dateLabel(job.followUp)+(job.nextStep?': '+job.nextStep:'.'),'Follow up',job.followUp===today);
 for(const job of open.filter(j=>['Check details','Preparing'].includes(j.status)).sort(byClosing)){
  const when=closing(job,today),d=days(job);
  add(job,(job.status==='Preparing'?'Still preparing':'Details still to check')+(when?', and '+when:'. No closing date saved')+'.','Finish',d!==null&&d>=0&&d<=1);
 }
 for(const job of open.filter(j=>j.status==='Applied'&&['','Awaiting reply'].includes(j.outcome||''))){
  const sentDay=sentOn(job),quiet=sentDay?-daysUntil(sentDay,today):null;
  if(quiet!==null&&quiet>=quietDays&&!(job.followUp&&job.followUp>today))add(job,'Applied '+quiet+' days ago with no reply yet. Worth a follow-up.','Follow up');
 }
 for(const job of open.filter(j=>j.saved&&j.status==='To review'&&j.availability!=='closed').sort(byClosing)){
  const d=days(job);if(d!==null&&d>=0&&d<=7)add(job,'Starred, and '+closing(job,today)+'. Not started yet.','Start',d<=1);
 }
 return {sent,heard,heardPercent:sent?Math.round(heard/sent*100):null,interviews:reached(2),funnel,byStatus,starred:listed.filter(j=>j.saved&&j.status==='To review').length,toReview:listed.filter(j=>j.status==='To review').length,activity,attention,quietDays};
}

// Tech an advert can name: [shown as, the words that mean it, whether case matters]. Case matters
// where the lower-case word is ordinary English ("excel at", "react to") or another field's term (DBT).
const TERMS=[
 ['Python'],['Java'],['JavaScript'],['TypeScript'],['C#',['c#','c sharp']],['C++'],['Golang'],['Rust'],['Ruby'],['PHP'],['Kotlin'],['Swift',['Swift'],true],['Scala'],['MATLAB'],
 ['SQL'],['PostgreSQL',['postgresql','postgres']],['MySQL'],['SQL Server',['sql server','mssql','t-sql']],['Oracle'],['MongoDB'],['Redis'],['Elasticsearch'],['Snowflake'],['BigQuery'],['Databricks'],
 ['Spark',['Spark','PySpark'],true],['Hadoop'],['Kafka'],['Airflow'],['dbt',['dbt'],true],['Power BI',['power bi','powerbi']],['Tableau'],['Looker'],['Excel',['Excel'],true],
 ['Pandas'],['NumPy'],['scikit-learn',['scikit-learn','sklearn']],['TensorFlow'],['PyTorch'],['Machine learning'],['Deep learning'],['NLP',['nlp','natural language processing']],['Computer vision'],
 ['LLMs',['llm','llms','large language model','large language models','generative ai']],['Statistics',['statistics','statistical']],['Data pipelines',['data pipeline','data pipelines','etl','elt']],['Data modelling',['data modelling','data modeling']],['Data warehousing',['data warehouse','data warehousing']],
 ['AWS',['aws','amazon web services']],['Azure'],['Google Cloud',['gcp','google cloud']],['Docker'],['Kubernetes',['kubernetes','k8s']],['Terraform'],['Ansible'],['Jenkins'],['GitHub Actions'],['CI/CD',['ci/cd','continuous integration']],['Linux'],['Git'],['PowerShell'],['Bash'],
 ['REST APIs',['rest api','rest apis','restful']],['GraphQL'],['Microservices',['microservice','microservices']],['React',['React','React.js','ReactJS'],true],['Angular'],['Vue',['vue','vue.js']],['Node.js',['node.js','nodejs']],['Next.js'],['Django'],['Flask'],['FastAPI'],['Spring Boot'],['.NET',['.net','dotnet']],['ASP.NET'],['HTML',['html','html5']],['CSS',['css','css3']],
 ['Unit testing',['unit test','unit tests','unit testing']],['Test automation',['test automation','automated testing']],['Selenium'],['Cypress'],['Playwright'],
 ['Agile'],['Scrum'],['Jira'],['SAP',['SAP'],true],['Salesforce'],['Dynamics 365',['dynamics 365','dynamics crm']],['SharePoint'],['HL7'],['FHIR'],
];
const escape=word=>word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const names=(text,word,cased)=>new RegExp('(?:^|[^A-Za-z0-9])'+escape(word)+'(?:$|[^A-Za-z0-9])',cased?'':'i').test(text);
// What the saved advert names, split into what her skills list and what they do not; the job title's
// own words first. A word count, not a reading of the requirements: "desirable" and "essential" look alike.
export function skillGaps(job,profile=DEFAULT_PROFILE){
 // The employer's own name is not a skill: Office for National Statistics, Oracle, Salesforce.
 const employer=String(job.company||'').trim(),text=[job.role,job.stack,job.description].filter(Boolean).join('\n').replace(employer.length>2?new RegExp(escape(employer),'gi'):/$^/,' '),mine=new Set(String(profile.skills||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean));
 const found=[];
 for(const [name,words=[name.toLowerCase()],cased=false] of TERMS){
  if(!words.some(w=>names(text,w,cased)))continue;
  found.push({name,title:words.some(w=>names(job.role||'',w,cased)),mine:mine.has(name.toLowerCase())||words.some(w=>mine.has(w.toLowerCase()))});
 }
 found.sort((a,b)=>Number(b.title)-Number(a.title));
 return {have:found.filter(f=>f.mine).map(f=>f.name),missing:found.filter(f=>!f.mine).map(f=>f.name)};
}

// Handing a job to a new Claude chat: the advert, what she saved about it, and rules that keep the
// writing to her real CV. Dossier's links carry the prompt; a link over about 2,000 characters breaks,
// so JobMap copies it instead and she pastes it.
export const CLAUDE_KINDS=[['cv','Tailored CV'],['letter','Cover letter'],['email','Email to send'],['interview','Interview prep']];
const ASKS={
 cv:'a CV tailored to this job. Reorder and reword my real experience so what matters most for this advert comes first, use the advert\'s own words where they are true of me, and keep it to two pages. After the CV, list what you changed and why.',
 letter:'a cover letter for this job, 300 to 400 words: why this role and this employer, two or three pieces of my real experience that answer the advert\'s main duties, and a short close. Address the person the advert names, if it names one.',
 email:'a short email to send with my application, with my CV and cover letter attached, to the contact the advert gives (or to the hiring team if it gives none). Under 150 words, with a clear subject line.',
 interview:'preparing for an interview for this job: the ten questions I am most likely to be asked given the advert\'s duties, an answer outline for each built from my real CV (STAR where it fits), five good questions for me to ask them, and what to read about the employer first.',
};
const FOCUS={balanced:'software and data',software:'software',data:'data'};
export const ADVERT_LIMIT=12000;
/** @param {{cvName?:string,missing?:string[]}} [options] */
export function claudePrompt(kind,job,profile=DEFAULT_PROFILE,options={}){
 const {cvName='',missing=[]}=options,advert=String(job.description||'').trim();
 const facts=[['Job',[job.role,job.company].filter(Boolean).join(' at ')],['Where',job.location],['Hours',[job.hours,job.employment].filter(Boolean).join('; ')],['Pay',job.salary],['Closing date',reviewDeadline(job)?dateLabel(reviewDeadline(job)):''],['Advert',job.url]].filter(([,value])=>value).map(([label,value])=>label+': '+value);
 return [
  'I am applying for this job. Please help me with '+(ASKS[kind]||ASKS.cv),'',
  ...facts,'',
  advert?'The advert, as I saved it:\n"""\n'+(advert.length>ADVERT_LIMIT?advert.slice(0,ADVERT_LIMIT)+'\n[Cut here. The full advert is at the link above.]':advert)+'\n"""':'I did not save the advert text. Read it at the link above, or ask me to paste it.','',
  'About me: my CV is attached'+(cvName?' ('+cvName+')':'')+'. The skills I list are: '+(profile.skills||'not saved')+'. I am looking for '+(FOCUS[profile.focus]||FOCUS.balanced)+' roles, ideally up to '+profile.maxHours+' hours a week.',
  ...(missing.length?['The advert names these, which are not in my skills list: '+missing.join(', ')+'. Treat them as gaps unless my CV shows them.']:[]),'',
  'Rules:',
  '- Use only facts from my CV. Never invent experience, employers, dates, grades, skills or numbers.',
  '- Where the advert asks for something my CV does not show, do not write it in. List it under "Gaps" at the end, with an honest way I could answer it.',
  '- UK English, plain and specific, without clichés.',
  '- If you need something you do not have, ask me instead of guessing.',
 ].join('\n');
}

// Grouping a list three ways: the kind of job its title names, the tech its advert names most, and the years of
// experience it asks for. Each is read from the saved advert only; what it does not say is grouped as not stated.
const FAMILIES=[['Data science and ML',/data scien|machine learning|\bml\b|\bai\b|artificial intelligence|deep learning|\bnlp\b/i],['Data engineering',/data engineer|\betl\b|data platform|data architect|database|\bdba\b/i],['Data and BI analysis',/analyst|analytics|insight|business intelligence|\bbi\b|reporting/i],['Testing and QA',/\btest|\bqa\b|quality assurance/i],['DevOps, cloud and platform',/devops|cloud|platform|site reliability|\bsre\b|infrastructure/i],['Software development',/software|developer|engineer|programmer|full[ -]?stack|back[ -]?end|front[ -]?end|\bweb\b/i],['Support and systems',/support|systems|technician|administrator|\bit\b/i],['Research',/research/i]];
const YEARS=['Entry level or under 2 years','2 to 3 years','4 to 5 years','6 years or more','Years not stated'];
export function titleFamily(job){return FAMILIES.find(([,rule])=>rule.test(job.role||''))?.[0]||'Other roles';}
export function yearsAsked(job){
 const text=[job.role,job.description].filter(Boolean).join('\n');
 const found=[...text.matchAll(/(\d{1,2})\s*\+?\s*(?:(?:-|–|to)\s*\d{1,2}\s*)?\+?\s*years?['’]?\s+(?:of\s+)?(?:[\w-]+\s+){0,4}?experience/gi)].map(m=>Number(m[1])).filter(n=>n<=20);
 if(found.length){const least=Math.min(...found);return YEARS[least<2?0:least<=3?1:least<=5?2:3];}
 return /\bgraduate\b|entry[ -]level|\bjunior\b|no (?:previous |prior )?experience (?:is )?(?:needed|required|necessary)/i.test(text)?YEARS[0]:YEARS[4];
}
export function mainSkill(job){
 const employer=String(job.company||'').trim(),text=[job.role,job.stack,job.description].filter(Boolean).join('\n').replace(employer.length>2?new RegExp(escape(employer),'gi'):/$^/,' ');
 let best='',most=0;
 for(const [name,words=[name.toLowerCase()],cased=false] of TERMS){const count=words.reduce((n,w)=>n+(text.match(new RegExp('(?:^|[^A-Za-z0-9])'+escape(w)+'(?=$|[^A-Za-z0-9])',cased?'g':'gi'))||[]).length,0);if(count>most){best=name;most=count;}}
 return best||'No tech named';
}
export const GROUPS=[['','No grouping'],['title','Kind of job'],['skill','Main skill'],['years','Years of experience']];
// The rows in groups, keeping their order inside each group: title kinds and years in a fixed order, skills by size.
export function groupRows(rows,by){
 const label=by==='title'?r=>titleFamily(r.job):by==='skill'?r=>mainSkill(r.job):r=>yearsAsked(r.job);
 const labelled=rows.map(r=>({...r,group:label(r)})),size=new Map();for(const r of labelled)size.set(r.group,(size.get(r.group)||0)+1);
 const fixed=by==='title'?[...FAMILIES.map(f=>f[0]),'Other roles']:by==='years'?YEARS:null;
 const rank=g=>fixed?fixed.indexOf(g):g==='No tech named'?1e6:-size.get(g);
 return {rows:labelled.map((r,i)=>({r,i})).sort((a,b)=>rank(a.r.group)-rank(b.r.group)||a.r.group.localeCompare(b.r.group)||a.i-b.i).map(x=>x.r),size};
}
