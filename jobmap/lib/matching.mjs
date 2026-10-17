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
 // "No job-share wording" is not an offer of part-time.
 const stated=[title,job.employment,job.hours].join('; ').replace(/\b(?:no|not|without)\b[^.;,]{0,60}?(?:part[ -]time|job[ -]share)/gi,'');
 const parttime=/(?:part[ -]time|job[ -]share)/i.test(stated)||/working patterns[^\n]{0,160}part[ -]time|offer[^\n.]{0,100}part[ -]time|part[ -]time (?:hours|position|role|contract)|consider[^\n.]{0,100}part[ -]time/i.test(context);
 const numberHours=[...context.matchAll(/\b(\d{1,2}(?:\.\d)?)\s*(?:hours?|hrs?)\s*(?:per\s*week|a\s*week|weekly|\/\s*week)/g)].map(m=>Number(m[1])).filter(h=>h>0&&h<=60);
 const preferred=numberHours.length?Math.min(...numberHours):null;
 const overHours=preferred!==null&&preferred>profile.maxHours;
 // A single paid shift fits any week.
 const oneOff=/\bone[ -]off\b|\bone (?:paid )?(?:\d{1,2}[ -]hour )?shift\b|\bone[ -]day\b/i.test([job.employment,job.hours].join('; '));
 const hoursFit=preferred!==null?preferred<=profile.maxHours:oneOff;
 const fulltime=/full[ -]time/i.test([job.employment,job.hours].join(' '))&&!parttime;
 const hours=hoursFit?(preferred===null?'One-off shift':'Hours may fit'):parttime?'Part-time mentioned':overHours||fulltime?'Hours need agreement':'Hours not confirmed';
 const remote=/\bremote\b|home[ -]based|work from home/i.test(location);
 const cardiff=/cardiff|caerdydd/.test(location),south=/newport|bridgend|south wales|caerphilly|pontypridd|barry|cwmbran|rhondda/.test(location),bristol=/bristol|bath/.test(location);
 const loc=cardiff?22:south?18:remote?17:bristol?9:/all uk|united kingdom|\buk\b|wales/.test(location)?5:1;
 const locLabel=cardiff?'Cardiff':south?'South Wales':remote?'Remote listed':bristol?'Bristol / Bath':'Location to check';
 const senior=/principal|staff engineer|head of|director|lead data scientist/i.test(title);
 let skillScore=Math.min(30,core.length*5+matched.filter(s=>['machine learning','nlp'].includes(s.toLowerCase())).length*2);
 const roleScore=software?(profile.focus==='data'?11:22):data?(profile.focus==='software'?10:18):3;
 const hoursScore=hoursFit?18:parttime?15:fulltime||overHours?0:5;
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
 return {score,label,matched,software,data,early,unpaid,contractor,closed,hours,hoursFit,parttime,overHours,fulltime,loc,locLabel,effort,effortLabel,cvOnly,assessments,cover,cautions,reasons,preferred,coreCount:core.length};
}
// Priority is an order of actions, independent of the match score.
// First what can be applied for today, then what needs a question about hours, then what needs
// another look at the advert. Inside each, exact imminent dates lead and personal priority breaks ties.
// An "open" result is only true on the day of the check, so an old one asks for another look.
export const OPEN_CHECK_DAYS=14;
// What the page opens on. Life OS reads the same list for its day (hosting/career/first-screen.mjs), so the two always agree.
export const FIRST_SCREEN={view:'all',scope:'apply',sort:'priority'};
export const PRIORITY_SECTIONS=['Apply now','Ask about hours first','Full-time or over your hours','Check it is still open','Not checked since saved','Outside current search','Application sent','Closed'];
/** @param {ReturnType<typeof assess> | undefined} [match] */
export function assessPriority(job,match=undefined,today=dayNow()){
 match??=assess(job,DEFAULT_PROFILE,today);
 const days=daysUntil(reviewDeadline(job),today);
 const personal={P1:0,P2:1,P3:2,P4:3}[job.priority]??1;
 const personalLabel=['High','Normal','Low','Later'][personal];
 const submitted=['Applied','Interview','Offer'].includes(job.status)||!!job.applied;
 const outside=match.early||match.unpaid||match.contractor;
 const agreement=match.overHours||match.fulltime;
 const group=match.closed?4:submitted?3:outside?2:agreement?1:0;
 const urgency=days!==null&&Number.isFinite(days)&&days>=0&&days<=7?days:8;
 const sinceCheck=job.checked?-daysUntil(job.checked,today):null;
 const checked=!job.checked||!Number.isFinite(sinceCheck)?'':job.checked.slice(0,4)===today.slice(0,4)?dateLabel(job.checked).slice(0,-5):dateLabel(job.checked);
 const on=checked?' on '+checked:'';
 const fresh=sinceCheck!==null&&sinceCheck<=OPEN_CHECK_DAYS;
 // 0 confirmed open, 1 needs a check, 2 never checked. Sent and closed jobs are not ordered by it.
 const availability=group>2?0:job.availability==='open'&&fresh?0:job.availability==='open'||job.availability==='uncertain'?1:2;
 const section=group===4?7:group===3?6:group===2?5:availability===2?4:availability===1?3:group===1?2:match.hoursFit?0:1;
 const soon=urgency===0?'closes today':urgency===1?'closes tomorrow':urgency<8?'closes in '+days+' days':'';
 const label=PRIORITY_SECTIONS[section]+(section<5&&soon?' · '+soon:'');
 // The row only says what its heading and dates do not.
 const note=section===3?(job.availability==='uncertain'?'The last check could not confirm it is open':'Open at the last check, more than '+OPEN_CHECK_DAYS+' days ago'):section===5?(match.early?'Graduate, placement or training role':match.unpaid?'Unpaid or voluntary work':'Freelance or self-employed work'):'';
 let reason=['The advert was open when last checked'+on+', and the stated hours fit your preference.',
  'The advert was open when last checked'+on+'. '+(match.parttime?'Part-time is mentioned, but no weekly hours are stated':'The weekly hours are not stated')+'; ask before applying.',
  'The advert was open when last checked'+on+', but '+(match.overHours?'it states '+match.preferred+' hours a week, above your preference':'it is advertised full-time')+'. Ask whether a part-time arrangement is possible.',
  (job.availability==='uncertain'?'The last check'+on+' could not confirm the advert is open.':'The advert was open'+on+', more than '+OPEN_CHECK_DAYS+' days ago.')+' Availability needs checking on the original advert.',
  'This advert has not been checked since it was saved'+on+'. Availability needs checking on the original advert.',
  'Graduate, unpaid or freelance evidence puts this below current paid employee leads, even with a near deadline.',
  'An application is recorded as sent; it stays below unsent applications. Use Follow-ups for your next action.',
  'The advert is closed or its saved deadline has passed; it is below jobs you can still pursue.'][section];
 if(section>2&&section<5&&group===1)reason+=' Advertised hours exceed your preference or are full-time.';
 if(section<5)reason+=urgency<8?' Its saved deadline is within 7 days, so it leads its group ahead of the priority setting.':days===null?' No saved deadline; ordered by the priority setting and match.':' No deadline in the next 7 days; ordered by the priority setting and match.';
 return {group,availability,section,urgency,days,personal,personalLabel,label,note,reason};
}
function comparePriority(a,b){
 return a.priority.section-b.priority.section||a.priority.group-b.priority.group||a.priority.availability-b.priority.availability||a.priority.urgency-b.priority.urgency||a.priority.personal-b.priority.personal||b.match.score-a.match.score||Number(!!b.job.saved)-Number(!!a.job.saved)||(reviewDeadline(a.job)||'9999').localeCompare(reviewDeadline(b.job)||'9999');
}
// Her own categories on a job: written with commas between, read as a list without repeats.
export function tagsOf(job){const seen=new Set(),out=[];for(const raw of String(job?.tags||'').split(/[,;\n]/)){const tag=raw.trim().replace(/\s+/g,' ');if(tag&&!seen.has(tag.toLowerCase())){seen.add(tag.toLowerCase());out.push(tag);}}return out;}
// One vacancy advertised twice: an employer's own site and a board, or a board that posted it again.
// The same employer and job title, places that can be the same, and closing dates that agree.
const fold=s=>String(s||'').normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
// A reference number in a title ("Software Developer (ref 2526600)") is not part of the job's name.
export const roleKey=role=>fold(String(role||'').replace(/[([]?\b(?:job\s*)?(?:ref(?:erence)?|req|vacancy)\b\.?\s*(?:no\.?|number)?\s*:?\s*[\w/-]*\d[\w/-]*[)\]]?/gi,' '));
// "Cardiff University - Centre for Trials Research" and "Cardiff University" are one employer.
export function employerKey(company){const head=fold(String(company||'').split(/\s[-–—|:]\s|[(,]|\bvia\b/i)[0]).replace(/\b(ltd|limited|plc|llp|inc|group|uk|the)\b/g,' ').replace(/\s+/g,' ').trim();return !head||/^(undisclosed|confidential|anonymous|unnamed|not stated)\b/.test(head)?fold(company):head;}
// A region stands for the towns in it; a town does not stand for its region, so Cardiff and Newport stay two places.
const REGIONS=[['southwales',['south wales','de cymru'],['cardiff','newport','swansea','bridgend','caerphilly','pontypridd','barry','cwmbran','llantrisant','rhondda','merthyr','neath','penarth','cathays','llandaff','treforest','nantgarw','caerdydd','casnewydd']],['swengland',['sw england','south west england','south west'],['bristol','bath','almondsbury','swindon','gloucester','cheltenham','exeter','plymouth','taunton']],['nwengland',['nw england','north west england'],[]],['neengland',['ne england','north east england'],[]],['seengland',['se england','south east england'],[]],['eastmidlands',['east midlands'],[]],['westmidlands',['west midlands'],[]],['yorkshire',['yorkshire and humberside','yorkshire'],[]],['eastengland',['east of england'],[]],['northernireland',['northern ireland'],[]],['northwales',['north wales'],[]],['midwales',['mid wales'],[]],['westwales',['west wales'],[]]];
const ANYWHERE=new Set('uk united kingdom all wide remote hybrid home based national not stated blended on campus and or the of in at with office working flexible site visits visit area greater region location locations various multiple travel required require requires confirmation day days week weekly monthly one per person meetings meeting city centre center england wales britain great gb anywhere any within near across to plus some may be other outside road street floor building house tbc'.split(' '));
export function placesOf(location){let text=' '+fold(location)+' ';const places=new Set();for(const [name,aliases,towns]of REGIONS)for(const alias of aliases)if(text.includes(' '+alias+' ')){text=text.replaceAll(' '+alias+' ',' ');places.add(name);towns.forEach(t=>places.add(t));}for(const word of text.split(' '))if(word&&!ANYWHERE.has(word)&&!/\d/.test(word))places.add(word);return places;}
function samePlace(a,b){const x=placesOf(a),y=placesOf(b);return !x.size||!y.size||[...x].some(p=>y.has(p));}
function sameClosing(a,b){const x=reviewDeadline(a),y=reviewDeadline(b);return !x||!y||Math.abs(daysUntil(x,y.slice(0,10)))<=3;}
export function sameVacancy(a,b){return !!a&&!!b&&a.id!==b.id&&!!roleKey(a.role)&&roleKey(a.role)===roleKey(b.role)&&!!employerKey(a.company)&&employerKey(a.company)===employerKey(b.company)&&samePlace(a.location,b.location)&&sameClosing(a,b);}
// For each job still listed more than once, the other listings that look like it, unless she said they differ.
export function repeatsOf(jobs){
 const buckets=new Map(),out=new Map();
 for(const job of jobs){if(job.sameAs||['Archived','Rejected'].includes(job.status))continue;const key=employerKey(job.company)+'|'+roleKey(job.role);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(job);}
 const told=(a,b)=>(a.notSame||[]).includes(b.id)||(b.notSame||[]).includes(a.id);
 for(const list of buckets.values())if(list.length>1)for(const a of list)for(const b of list)if(sameVacancy(a,b)&&!told(a,b)){if(!out.has(a.id))out.set(a.id,[]);out.get(a.id).push(b.id);}
 return out;
}
const OVER=['Archived','Rejected'],SENT=['Applied','Interview','Offer'];
// The quick views in the menu. Each is a plain rule on dates and her own choices, cheap enough to count on every change.
export function inView(view,job,today=dayNow()){
 if(view==='archive')return OVER.includes(job.status);
 if(OVER.includes(job.status))return false;
 const days=daysUntil(reviewDeadline(job),today),closed=job.availability==='closed'||(days!==null&&days<0);
 if(view==='shortlist')return !!job.saved;
 if(view==='applications')return ['Check details','Preparing',...SENT].includes(job.status);
 if(view==='followups')return !!job.followUp;
 if(view==='closing')return !closed&&days!==null&&days<=7&&!SENT.includes(job.status)&&!job.applied;
 if(view==='new')return !!job.addedOn&&daysUntil(job.addedOn,today)>=-6;
 if(view==='high')return job.priority==='P1';
 if(view==='closed')return closed;
 return true;
}
export function selectJobs(jobs,{view='all',scope='parttime',source='',search='',sort='priority',status='',tag=''},profile=DEFAULT_PROFILE,today=dayNow()){
 const q=search.toLowerCase().trim();
 // A listing joined to another job is shown once, as that job.
 const repeats=view==='repeats'?repeatsOf(jobs):null;
 let rows=jobs.filter(job=>!job.sameAs&&inView(view,job,today)&&(!repeats||repeats.has(job.id))).map(job=>{const match=assess(job,profile,today);return {job,match,priority:assessPriority(job,match,today)};}).filter(({job,match,priority})=>{
  if(view==='all'&&scope==='parttime'&&(!(match.parttime||match.hoursFit||job.track?.startsWith('A -'))||match.early||match.unpaid||match.contractor||match.closed))return false;
  // Everything a check has seen open or possibly open, whatever its hours.
  if(view==='all'&&scope==='apply'&&priority.section>3)return false;
  if(view==='all'&&scope==='tech'&&(!match.software&&!match.data))return false;
  if(source&&job.source!==source)return false;if(status&&job.status!==status)return false;
  if(tag&&!tagsOf(job).some(t=>t.toLowerCase()===tag.toLowerCase()))return false;
  if(q&&!q.split(/\s+/).every(word=>[job.role,job.company,job.location,job.stack,job.notes,job.nextStep,job.tags].join(' ').toLowerCase().includes(word)))return false;
  return true;
 });
 rows.sort((a,b)=>{
  if(view==='followups'){const due=(a.job.followUp||'9999').localeCompare(b.job.followUp||'9999');if(due)return due;}
  if(view==='closing'){const due=(reviewDeadline(a.job)||'9999').localeCompare(reviewDeadline(b.job)||'9999');if(due)return due;}
  if(view==='new'){const added=(b.job.addedOn||'').localeCompare(a.job.addedOn||'');if(added)return added;}
  // The listings of one job side by side.
  if(view==='repeats'){const key=j=>employerKey(j.company)+'|'+roleKey(j.role);const pair=key(a.job).localeCompare(key(b.job));if(pair)return pair;}
  if(sort==='location'&&a.match.loc!==b.match.loc)return b.match.loc-a.match.loc;
  if(sort==='effort'&&a.match.effort!==b.match.effort)return b.match.effort-a.match.effort;
  if(sort==='deadline'){if(a.match.closed!==b.match.closed)return Number(a.match.closed)-Number(b.match.closed);const deadline=(reviewDeadline(a.job)||'9999').localeCompare(reviewDeadline(b.job)||'9999');if(deadline)return deadline;}
  if(sort==='priority'){const priority=comparePriority(a,b);if(priority)return priority;}
  if(sort==='added'||sort==='advertised'){const key=sort==='added'?'addedOn':'advertisedOn';const date=(b.job[key]||'').localeCompare(a.job[key]||'');if(date)return date;}
  return b.match.score-a.match.score||(a.job.rank||9999)-(b.job.rank||9999)||a.job.id.localeCompare(b.job.id);
 });return rows;
}
