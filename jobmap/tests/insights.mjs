import assert from 'node:assert/strict';
import {furthest,sentOn,progress,skillGaps,claudePrompt,ADVERT_LIMIT} from '../lib/insights.mjs';
import {DEFAULT_PROFILE} from '../lib/matching.mjs';

const today='2026-10-27';// a Tuesday
const job=(id,extra={})=>({id,role:'Software Developer',company:'Acme',location:'Cardiff',status:'To review',saved:false,deadline:'',applied:'',followUp:'',nextStep:'',history:[],...extra});
const moved=(at,from,to)=>({at,label:`${from} → ${to}`});

// How far a job got: its stage now, every stage in its history, and a date applied.
assert.equal(furthest(job('a')),0);
assert.equal(furthest(job('a',{applied:'2026-10-01'})),1);
assert.equal(furthest(job('a',{status:'Rejected',history:[moved('2026-10-02T09:00:00Z','Applied','Interview'),moved('2026-10-09T09:00:00Z','Interview','Rejected')]})),2);
assert.equal(furthest(job('a',{status:'Offer'})),3);
// The day it was sent: the date given first, else the London day of the first move to a sent stage.
assert.equal(sentOn(job('a',{applied:'2026-10-01'})),'2026-10-01');
assert.equal(sentOn(job('a',{history:[moved('2026-10-04T23:30:00Z','Preparing','Applied')]})),'2026-10-05');
assert.equal(sentOn(job('a',{status:'Interview'})),'');
assert.equal(sentOn(job('a',{history:[moved('2026-10-06T10:00:00Z','Applied','Interview')]})),'','sent before the history starts');

const jobs=[
 job('offer',{status:'Offer',applied:'2026-09-20'}),
 job('interview',{status:'Interview',history:[moved('2026-10-06T10:00:00Z','Applied','Interview')]}),
 job('rejected-after-interview',{status:'Rejected',applied:'2026-09-29',history:[moved('2026-10-07T10:00:00Z','Applied','Interview'),moved('2026-10-14T10:00:00Z','Interview','Rejected')]}),
 job('rejected',{status:'Rejected',applied:'2026-10-13'}),
 job('quiet',{status:'Applied',applied:'2026-10-13'}),
 job('quiet-but-booked',{status:'Applied',applied:'2026-10-13',followUp:'2026-10-30'}),
 job('fresh',{status:'Applied',applied:'2026-10-25'}),
 job('preparing-late',{status:'Preparing',deadline:'2026-11-20'}),
 job('preparing-soon',{status:'Preparing',deadline:'2026-10-28'}),
 job('due',{status:'Applied',applied:'2026-10-26',followUp:'2026-10-27',nextStep:'Email the recruiter'}),
 job('starred-soon',{saved:true,deadline:'2026-10-29',addedOn:'2026-10-26',history:[]}),
 job('starred-later',{saved:true,deadline:'2026-11-30'}),
 job('starred-closed',{saved:true,deadline:'2026-10-29',availability:'closed'}),
 job('archived',{status:'Archived',addedOn:'2026-10-20',history:[moved('2026-10-21T10:00:00Z','To review','Archived')]}),
 job('joined',{status:'Interview',sameAs:'interview'}),
];
const p=progress(jobs,today);
// The joined listing is the job it was joined to, so it is not counted again.
assert.equal(p.sent,8);
assert.deepEqual(p.funnel.map(s=>s.count),[8,3,1]);
assert.equal(p.funnel[1].conversion,38);assert.equal(p.funnel[0].conversion,null);
assert.equal(p.funnel[0].rejected,1);assert.equal(p.funnel[1].rejected,1);
// Heard back: an interview, an offer, or a rejection after applying.
assert.equal(p.heard,4);assert.equal(p.heardPercent,50);assert.equal(p.interviews,3);
assert.deepEqual(Object.fromEntries(p.byStatus.map(s=>[s.status,s.count])),{'Check details':0,Preparing:2,Applied:4,Interview:1,Offer:1,Rejected:2});
assert.equal(p.starred,3);
// Twelve weeks, Monday to Sunday, this week last.
assert.equal(p.activity.length,12);assert.equal(p.activity.at(-1).start,'2026-10-26');assert.equal(p.activity[0].start,'2026-08-10');
const weekOf=start=>p.activity.find(w=>w.start===start);
assert.equal(weekOf('2026-10-26').added,1);assert.equal(weekOf('2026-10-19').added,1);assert.equal(weekOf('2026-10-19').sorted,1);
assert.equal(weekOf('2026-10-12').applied,3);assert.equal(weekOf('2026-10-05').applied,0);assert.equal(weekOf('2026-10-19').applied,1);assert.equal(weekOf('2026-10-26').applied,1);
// Worth a look, in its order, each job once.
assert.deepEqual(p.attention.map(a=>a.id),['offer','interview','due','preparing-soon','preparing-late','quiet','starred-soon']);
assert.match(p.attention.find(a=>a.id==='quiet').reason,/Applied 14 days ago/);
assert.match(p.attention.find(a=>a.id==='due').reason,/Email the recruiter/);
assert(p.attention.find(a=>a.id==='preparing-soon').soon);assert(!p.attention.find(a=>a.id==='preparing-late').soon);
assert.match(p.attention.find(a=>a.id==='starred-soon').reason,/closes 29 Oct 2026/);
assert.deepEqual(progress([],today).attention,[]);
// The employer's outcome, kept apart from the stage, counts too: Applied and Rejected heard back.
assert.equal(furthest(job('o',{status:'Applied',outcome:'Interview invited'})),2);assert.equal(furthest(job('o',{outcome:'Awaiting reply'})),1);
const told=progress([job('no',{status:'Applied',applied:'2026-09-01',outcome:'Rejected'}),job('gone',{status:'Applied',applied:'2026-09-01',outcome:'Withdrawn'}),job('asked',{status:'Applied',applied:'2026-10-20',outcome:'Interview invited'}),job('waiting',{status:'Applied',applied:'2026-09-01',outcome:'Awaiting reply'})],today);
assert.equal(told.heard,2);assert.equal(told.interviews,1);assert.equal(told.funnel[0].rejected,1);assert.equal(told.funnel[0].withdrawn,1);
assert.deepEqual(told.attention.map(a=>[a.id,a.action]),[['asked','Prepare'],['waiting','Follow up']]);
// Quiet means as long as "Waiting on a reply" waits: 14 days.
assert.equal(progress([job('q',{status:'Applied',applied:'2026-10-14'})],today).attention.length,0);assert.equal(progress([],today).heardPercent,null);

// The advert's tech, against the skills she listed. Case matters where the word is ordinary English.
const advert=job('g',{role:'Data Engineer (Python, Spark)',company:'Office for National Statistics',description:'Office for National Statistics needs Python, SQL, Kubernetes and AWS. JavaScript a plus. You will excel at teamwork and react to change. Excel and Power BI. Our DBT therapists are not engineers.'});
const g=skillGaps(advert,DEFAULT_PROFILE);
assert.deepEqual(g.have,['Python','JavaScript','SQL']);
assert.deepEqual(g.missing,['Spark','Power BI','Excel','AWS','Kubernetes']);
assert(!g.missing.includes('Statistics'),'the employer name is not a skill');
assert(!g.missing.includes('React')&&!g.missing.includes('dbt')&&!g.missing.includes('Java'));
assert.deepEqual(skillGaps(job('none'),DEFAULT_PROFILE),{have:[],missing:[]});
assert.deepEqual(skillGaps(job('r',{description:'Kubernetes'}),{...DEFAULT_PROFILE,skills:'k8s'}).have,['Kubernetes']);

// The prompt for Claude: the advert, her preferences, and rules that keep to her CV.
const long=job('l',{description:'x'.repeat(ADVERT_LIMIT+50),salary:'£30,000',url:'https://example.org/job',notes:'my private note'});
const prompt=claudePrompt('letter',long,DEFAULT_PROFILE,{cvName:'CV 2026.pdf',missing:['AWS']});
assert.match(prompt,/cover letter/);assert.match(prompt,/Job: Software Developer at Acme/);assert.match(prompt,/Pay: £30,000/);assert.match(prompt,/\(CV 2026\.pdf\)/);
assert.match(prompt,/not in my skills list: AWS/);assert.match(prompt,/Never invent experience/);assert.match(prompt,/\[Cut here/);
assert(!prompt.includes('my private note'),'her notes stay out of the prompt');assert(!/Closing date:/.test(prompt),'unknown facts are left out');
assert.match(claudePrompt('nonsense',job('n'),DEFAULT_PROFILE),/CV tailored/);
assert.match(claudePrompt('interview',job('n'),DEFAULT_PROFILE),/I did not save the advert text/);

console.log('PASS: furthest stage and sent day, the funnel, heard back, where things stand, twelve weeks, worth a look in order, advert skills and gaps, the Claude prompt.');
