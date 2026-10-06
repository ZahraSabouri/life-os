export const DEFAULT_PROFILE={skills:'Python, Django, FastAPI, Flask, SQL, PostgreSQL, SQL Server, Oracle, MongoDB, Redis, C#, .NET, Angular, TypeScript, JavaScript, Docker, Linux, REST APIs, Git, Data pipelines, Machine learning, NLP',focus:'balanced',maxHours:20};
export function dayNow(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function daysUntil(date,today=dayNow()){if(!date)return null;return Math.round((Date.parse(date.slice(0,10)+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000);}
export function dateLabel(date){return date?new Date(date.slice(0,10)+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'Not stated';}
export function reviewDeadline(job){
 if(job.userEditedDeadline)return job.deadline;
 const m=(job.watch||'').match(/Advert text says apply by (\d{1,2}) (\w+) (\d{4}); board metadata says/i);
 if(!m)return job.deadline;
 const month=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m[2].slice(0,3).toLowerCase());
 if(month<0)return job.deadline;
 const earlier=`${m[3]}-${String(month+1).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
 return earlier<(job.deadline||'9999')?earlier:job.deadline;
}
const alias={postgresql:['postgresql','postgres'], 'sql server':['sql server','mssql'], 'rest apis':['rest api','restful','rest services','apis'], 'data pipelines':['data pipeline','etl','elt pipeline'], 'machine learning':['machine learning'], 'c#':['c#','c sharp'], '.net':['.net','dotnet'], nlp:['nlp','natural language processing']};
function hasWord(text,phrase){return new RegExp('(?:^|[^a-z0-9])'+phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:$|[^a-z0-9])','i').test(text);}
export function assess(job,profile=DEFAULT_PROFILE,today=dayNow()){
 const title=job.role||'',advert=[title,job.stack,job.description].filter(Boolean).join('\n').toLowerCase();
 const context=[job.employment,job.hours,job.description].filter(Boolean).join('\n').toLowerCase();
 const location=[job.location,job.region,job.fields?.['Additional location information']].filter(Boolean).join(' ').toLowerCase();
 const matched=profile.skills.split(',').map(s=>s.trim()).filter(Boolean).filter(s=>(alias[s.toLowerCase()]||[s]).some(a=>hasWord(advert,a)));
 const core=matched.filter(s=>!['machine learning','nlp'].includes(s.toLowerCase()));
 const software=/software|developer|backend|back.end|full.stack|platform engineer|devops|database|systems engineer|cloud engineer/i.test(title);
 const data=/data|machine learning|\bml\b|\bai\b|analytics|analyst|research (assistant|associate)/i.test(title);
 const early=/\bgraduate\b|\bgraduates\b|placement|year in industry|apprentice|apprenticeship|trainee programme|vacation scheme|training contract/i.test(title);
 const unpaid=/\bunpaid\b|volunteer role|voluntary position/i.test(((job.salary||'')+' '+context).replace(/unpaid (?:parental |sabbatical )?leave/g,''))||/volunteer/i.test(title);
 const contractor=/self[ -]employed|freelanc|independent contractor/i.test([title,job.employment,job.hours].join(' '));
 const missingCore=['C++','Java','Golang','Rust','Ruby','PHP','SAP','Salesforce'].filter(skill=>hasWord(title,skill)&&!profile.skills.split(',').some(s=>s.trim().toLowerCase()===skill.toLowerCase()));
 const parttime=/(?:part[ -]time|job[ -]share)/i.test([title,job.employment,job.hours].join(' '))||/working patterns[^\n]{0,160}part[ -]time|offer[^\n.]{0,100}part[ -]time|part[ -]time (?:hours|position|role|contract)|consider[^\n.]{0,100}part[ -]time/i.test(context);
 const numberHours=[...context.matchAll(/\b(\d{1,2}(?:\.\d)?)\s*(?:hours?|hrs?)\s*(?:per\s*week|a\s*week|weekly|\/\s*week)/g)].map(m=>Number(m[1])).filter(h=>h>0&&h<=60);
 const preferred=numberHours.length?Math.min(...numberHours):null;
 const overHours=preferred!==null&&preferred>profile.maxHours&&!parttime;
 const fulltime=/full[ -]time/i.test([job.employment,job.hours].join(' '))&&!parttime;
 const hours=preferred!==null&&preferred<=profile.maxHours?'Hours may fit':parttime?'Part-time mentioned':overHours||fulltime?'Hours need agreement':'Hours not confirmed';
 const remote=/\bremote\b|home[ -]based|work from home/i.test(location);
 const cardiff=/cardiff|caerdydd/.test(location),south=/newport|bridgend|south wales|caerphilly|pontypridd|barry|cwmbran|rhondda/.test(location),bristol=/bristol|bath/.test(location);
 const loc=cardiff?22:south?18:remote?17:bristol?9:/all uk|united kingdom|\buk\b|wales/.test(location)?5:1;
 const locLabel=cardiff?'Cardiff':south?'South Wales':remote?'Remote listed':bristol?'Bristol / Bath':'Location to check';
 const senior=/principal|staff engineer|head of|director|lead data scientist/i.test(title);
 let skillScore=Math.min(30,core.length*5+matched.filter(s=>['machine learning','nlp'].includes(s.toLowerCase())).length*2);
 const roleScore=software?(profile.focus==='data'?11:22):data?(profile.focus==='software'?10:18):3;
 const hoursScore=preferred!==null&&preferred<=profile.maxHours?18:parttime?15:fulltime||overHours?0:5;
 let score=roleScore+skillScore+loc+hoursScore+(senior?0:5);
 const closing=reviewDeadline(job);const closed=job.availability==='closed'||(daysUntil(closing,today)!==null&&daysUntil(closing,today)<0);
 if(unpaid)score=Math.min(score,12);if(early)score=Math.min(score,35);if(closed)score=Math.min(score,10);if(contractor)score=Math.min(score,30);if(missingCore.length)score=Math.min(score,40);if(!job.description)score=Math.min(score,69);
 const applicationText=(job.description||'').toLowerCase();
 const assessments=/assessment cent|online assessment|psychometric|coding (?:test|challenge)|technical (?:test|assessment)|numerical reasoning|situational judgement/.test(applicationText);
 const cover=/cover(?:ing)? letter|supporting statement|personal statement/.test(applicationText);
 const cvOnly=/(?:send|submit|email|attach|upload)[^\n.]{0,70}(?:\bcv\b|résumé|resume)/.test(applicationText)&&!cover&&!assessments;
 const effort=assessments?0:cover?1:cvOnly?3:2;
 const effortLabel=assessments?'Assessment mentioned':cover?'Written statement mentioned':cvOnly?'CV mentioned':'Steps not captured';
 const reasons=[matched.length?`${matched.slice(0,4).join(', ')}${matched.length>4?' +'+(matched.length-4):''}`:'Limited CV overlap in saved advert',locLabel,hours];
 const cautions=[];if(unpaid)cautions.push('Unpaid or voluntary work is mentioned.');if(early)cautions.push('Graduate, placement or training role; outside your main part-time search.');if(contractor)cautions.push('Freelance or self-employed work is advertised; check the employment arrangement before proceeding.');if(missingCore.length)cautions.push(`The job title requires ${missingCore.join(', ')}, which is not in your saved CV skills.`);if(closed)cautions.push(job.availability==='closed'?'The advert was confirmed closed at its last check.':'The saved closing date has passed.');if(overHours)cautions.push(`The advert mentions ${preferred} hours a week, above your ${profile.maxHours}-hour preference.`);if(fulltime)cautions.push('Full-time is advertised. A part-time arrangement would need agreement.');if(senior)cautions.push('Check the specialist experience and leadership requirements carefully.');if(!job.description)cautions.push('Full advert was not included in the imported workbook.');
 if(closing&&closing!==job.deadline)cautions.unshift(`Closing-date conflict: the advert says ${dateLabel(closing)}, while the board says ${dateLabel(job.deadline)}. The earlier date is used here.`);
 const label=score>=72?'Strong match':score>=52?'Promising':score>=32?'Worth checking':'Lower fit';
 return {score,label,matched,software,data,early,unpaid,contractor,closed,hours,parttime,loc,locLabel,effort,effortLabel,cvOnly,assessments,cover,cautions,reasons,preferred,coreCount:core.length};
}
export function selectJobs(jobs,{view='all',scope='parttime',source='',search='',sort='match',status=''},profile=DEFAULT_PROFILE,today=dayNow()){
 const q=search.toLowerCase().trim();
 let rows=jobs.map(job=>({job,match:assess(job,profile,today)})).filter(({job,match})=>{
  if(view==='archive'&&!['Archived','Rejected'].includes(job.status))return false;
  if(view!=='archive'&&['Archived','Rejected'].includes(job.status))return false;
  if(view==='shortlist'&&!job.saved)return false;
  if(view==='applications'&&!['Check details','Preparing','Applied','Interview','Offer'].includes(job.status))return false;
  if(view==='followups'&&!job.followUp)return false;
  if(view==='all'&&scope==='parttime'&&(!(match.parttime||(match.preferred!==null&&match.preferred<=profile.maxHours)||job.track?.startsWith('A -'))||match.early||match.unpaid||match.contractor||match.closed))return false;
  if(view==='all'&&scope==='tech'&&(!match.software&&!match.data))return false;
  if(source&&job.source!==source)return false;if(status&&job.status!==status)return false;
  if(q&&!q.split(/\s+/).every(word=>[job.role,job.company,job.location,job.stack,job.notes,job.nextStep].join(' ').toLowerCase().includes(word)))return false;
  return true;
 });
 rows.sort((a,b)=>{
  if(view==='followups'){const due=(a.job.followUp||'9999').localeCompare(b.job.followUp||'9999');if(due)return due;}
  if(sort==='location'&&a.match.loc!==b.match.loc)return b.match.loc-a.match.loc;
  if(sort==='effort'&&a.match.effort!==b.match.effort)return b.match.effort-a.match.effort;
  if(sort==='deadline'){const deadline=(reviewDeadline(a.job)||'9999').localeCompare(reviewDeadline(b.job)||'9999');if(deadline)return deadline;}
  if(sort==='priority'){const p=(a.job.priority||'P4').localeCompare(b.job.priority||'P4');if(p)return p;}
  if(sort==='added'||sort==='advertised'){const key=sort==='added'?'addedOn':'advertisedOn';const date=(b.job[key]||'').localeCompare(a.job[key]||'');if(date)return date;}
  return b.match.score-a.match.score||(a.job.rank||9999)-(b.job.rank||9999);
 });return rows;
}
