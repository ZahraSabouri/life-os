import assert from 'node:assert/strict';
import {assess,assessPriority,selectJobs,dateLabel,DEFAULT_PROFILE,dayNow} from '../lib/matching.mjs';
const today='2026-10-09';
const base={role:'Python Developer',company:'Test employer',location:'Cardiff',employment:'Part-time',hours:'16 hours per week',description:'Paid employee role using Python, SQL and Django. Send your CV.',stack:'Python, SQL, Django',source:'Employer careers',fields:{},priority:'P2',status:'To review',saved:false,deadline:'',rank:1};
const job=(id,patch={})=>({...base,id,...patch});
const ids=(jobs,options={})=>selectJobs(jobs,{scope:'all',sort:'priority',...options},DEFAULT_PROFILE,today).map(r=>r.job.id);
// Today's weaker but viable job must beat a high-priority strong match next month.
const urgent=job('today',{deadline:today,role:'Shop Assistant',description:'Paid part-time employee, 16 hours per week.',stack:'',priority:'P3'});
assert.deepEqual(ids([job('high-later',{priority:'P1',deadline:'2026-11-01'}),urgent]),['today','high-later']);
const tomorrow=job('tomorrow',{deadline:'2026-10-10',priority:'P1'}),week=job('week',{deadline:'2026-10-16',priority:'P1'});
assert.deepEqual(ids([week,tomorrow,urgent]),['today','tomorrow','week']);
assert.deepEqual(ids([job('normal',{deadline:today}),job('high',{priority:'P1',deadline:today})]),['high','normal']);
assert.deepEqual(ids([job('low',{priority:'P3'}),job('high',{priority:'P1'})]),['high','low']);
// Closed, already sent, out-of-scope and hours needing agreement do not claim apply-today urgency.
const excluded=[job('closed',{availability:'closed',deadline:today,priority:'P1'}),job('expired',{deadline:'2026-10-08'}),job('applied',{status:'Applied',deadline:today}),job('interview',{status:'Interview',deadline:today}),job('offer',{status:'Offer',deadline:today}),job('graduate',{role:'Graduate Python Developer',deadline:today}),job('unpaid',{description:'Unpaid voluntary position, 16 hours per week.',deadline:today}),job('freelance',{employment:'Self-employed freelancer',deadline:today}),job('fulltime',{employment:'Full-time',hours:'40 hours per week',description:'Full-time employee role, 40 hours per week.',deadline:today}),job('overhours',{hours:'25 hours per week',description:'Paid part-time employee, 25 hours per week.',deadline:today})];
for(const lower of excluded)assert.equal(ids([lower,job('viable')])[0],'viable',lower.id);
assert(assess(excluded.at(-1),DEFAULT_PROFILE,today).overHours);
assert.equal(assessPriority(urgent,assess(urgent,DEFAULT_PROFILE,today),today).urgency,0);
assert.equal(assessPriority(job('unknown'),assess(job('unknown'),DEFAULT_PROFILE,today),today).urgency,8);
assert.equal(selectJobs([urgent],{scope:'all'},DEFAULT_PROFILE,'2026-10-10')[0].priority.group,4);
const conflict=job('conflict',{deadline:'2026-10-12',watch:'Advert text says apply by 9 October 2026; board metadata says 12 October 2026'});
assert.equal(selectJobs([conflict],{scope:'all'},DEFAULT_PROFILE,today)[0].priority.urgency,0);
assert.equal(selectJobs([{...conflict,userEditedDeadline:true}],{scope:'all'},DEFAULT_PROFILE,today)[0].priority.urgency,3);
// Unknown availability remains urgent but the explanation asks for source verification.
const uncertain=job('uncertain',{availability:'uncertain',deadline:today});assert.match(selectJobs([uncertain],{scope:'all'},DEFAULT_PROFILE,today)[0].priority.reason,/Availability needs checking/);
// Roles confirmed open come before ones to check and ones never checked, whatever their dates and settings.
const open=job('open',{availability:'open',checked:'2026-10-07'}),unsure=job('unsure',{availability:'uncertain',checked:'2026-10-07',priority:'P1'}),stale=job('stale',{availability:'open',checked:'2026-09-16'}),unchecked=job('unchecked',{checked:'2026-09-13',deadline:today,priority:'P1'});
assert.deepEqual(ids([unchecked,stale,unsure,open]),['open','unsure','stale','unchecked']);
// Among confirmed-open roles the imminent deadline still leads.
assert.deepEqual(ids([job('open-later',{availability:'open',checked:today,priority:'P1'}),job('open-soon',{availability:'open',checked:today,deadline:'2026-10-10',priority:'P3'})]),['open-soon','open-later']);
// Hours needing agreement stay below part-time possibilities even when confirmed open; among themselves open leads.
const fulltime={employment:'Full-time',hours:'40 hours per week',description:'Full-time employee role, 40 hours per week.'};
assert.deepEqual(ids([job('fulltime-unchecked',fulltime),job('fulltime-open',{...fulltime,availability:'open',checked:today}),unchecked]),['unchecked','fulltime-open','fulltime-unchecked']);
const rated=j=>assessPriority(j,assess(j,DEFAULT_PROFILE,today),today),short=d=>dateLabel(d).slice(0,-5);
assert.equal(rated(open).label,'Apply now');assert.equal(rated(open).availability,0);
assert.equal(rated(job('open-today',{availability:'open',checked:today,deadline:today})).label,'Apply now · closes today');
assert.equal(rated(stale).availability,1);assert.equal(rated(stale).label,'Open on '+short('2026-09-16')+'; check again');
assert.equal(rated(unsure).label,'Check it is still open');
assert.equal(rated(unchecked).availability,2);assert.equal(rated(unchecked).label,'Not checked since '+short('2026-09-13')+' · closes today');
assert.equal(rated(job('never')).label,'Not checked yet');
assert.match(rated(job('fulltime-open',{...fulltime,availability:'open',checked:today})).label,/^Hours need agreement · open when checked on /);
// Sent and closed jobs are not reordered by availability.
assert.equal(rated(job('sent',{status:'Applied',checked:'2026-09-13'})).availability,0);assert.equal(rated(job('shut',{availability:'closed'})).availability,0);
// The follow-up view retains its own calendar order. Filters remain intact.
assert.deepEqual(ids([job('later-due',{followUp:'2026-10-11',deadline:today}),job('overdue',{followUp:'2026-10-08'})],{view:'followups'}),['overdue','later-due']);
assert.deepEqual(ids([job('starred',{saved:true}),job('not-starred')],{view:'shortlist'}),['starred']);
assert.equal(selectJobs(excluded,{scope:'parttime'},DEFAULT_PROFILE,today).some(r=>r.match.closed||r.match.early||r.match.unpaid||r.match.contractor),false);
assert.deepEqual(ids([job('unknown'),job('expired',{deadline:'2026-10-08'}),job('open',{deadline:'2026-10-10'})],{sort:'deadline'}),['open','unknown','expired']);
assert.deepEqual(ids([job('strong',{stack:'Python, SQL, Django'}),urgent],{sort:'match'}),['strong','today']);
const localToday=dayNow();assert.equal(ids([job('a'),job('b')])[0],'a');
const original=structuredClone([urgent,tomorrow]);ids(original);assert.deepEqual(original,[urgent,tomorrow]);
console.log('PASS: confirmed-open first, then deadline-first priority, personal ties, fit/shortlist ties, sent/closed/out-of-scope demotion, hours conflicts, source/user deadline handling, day rollover, filters and follow-up order. London today: '+localToday);
