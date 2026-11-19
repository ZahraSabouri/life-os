// JobMap part 1 (19 November 2026): the Expired status, changing many jobs at once with Undo,
// the closing and added date filters, and a status filter that finds archived, rejected and
// expired jobs from any view.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {selectJobs,closesMatch,addedMatch,inView} from '../lib/matching.mjs';
import {Store,STATUSES,validatePatch} from '../lib/store.mjs';

const today='2026-11-19'; // a Thursday
const job=(id,fields={})=>({id,role:'Data analyst',company:'Fixture '+id,location:'Cardiff',source:'Test',status:'To review',saved:false,priority:'P2',notes:'',url:'',deadline:'',userEditedDeadline:true,applied:'',followUp:'',nextStep:'',description:'',...fields});

test('Expired is a status, kept with the archive and out of the live list',()=>{
 assert.ok(STATUSES.includes('Expired'));
 assert.deepEqual(validatePatch({status:'Expired'}),{status:'Expired'});
 assert.equal(inView('archive',job('a',{status:'Expired'}),today),true);
 assert.equal(inView('all',job('a',{status:'Expired'}),today),false);
});

test('closing-date filters: today, tomorrow, this week to Sunday, next 7 and 30 days, passed, none',()=>{
 const on=d=>job('x',{deadline:d});
 assert.equal(closesMatch(on('2026-11-19'),'today',today),true);
 assert.equal(closesMatch(on('2026-11-20'),'today',today),false);
 assert.equal(closesMatch(on('2026-11-20'),'tomorrow',today),true);
 assert.equal(closesMatch(on('2026-11-22'),'week',today),true,'Sunday is in this week');
 assert.equal(closesMatch(on('2026-11-23'),'week',today),false,'Monday is next week');
 assert.equal(closesMatch(on('2026-11-26'),'next7',today),true);
 assert.equal(closesMatch(on('2026-12-19'),'next30',today),true);
 assert.equal(closesMatch(on('2026-11-18'),'passed',today),true);
 assert.equal(closesMatch(on('2026-11-18'),'week',today),false,'a passed date is never "this week"');
 assert.equal(closesMatch(job('y'),'none',today),true);
 assert.equal(closesMatch(on('2026-11-19'),'',today),true);
});

test('added filters: today, this week from Monday, the last 7 and 30 days',()=>{
 const added=d=>job('x',{addedOn:d});
 assert.equal(addedMatch(added('2026-11-19'),'today',today),true);
 assert.equal(addedMatch(added('2026-11-16'),'week',today),true,'Monday is this week');
 assert.equal(addedMatch(added('2026-11-15'),'week',today),false);
 assert.equal(addedMatch(added('2026-11-13'),'last7',today),true);
 assert.equal(addedMatch(added('2026-11-12'),'last7',today),false);
 assert.equal(addedMatch(added('2026-10-21'),'last30',today),true);
 assert.equal(addedMatch(job('z'),'today',today),false,'no date added never matches a date');
});

test('a status filter finds every job with that status from any view; closed adverts when asked',()=>{
 const jobs=[job('sent',{status:'Applied',deadline:'2026-11-01'}),job('live',{deadline:'2026-11-25'}),job('gone',{status:'Expired',deadline:'2026-11-10'}),job('old',{status:'Archived'}),job('late',{deadline:'2026-11-12'})];
 const ids=options=>selectJobs(jobs,{scope:'all',...options},undefined,today).map(r=>r.job.id).sort();
 assert.deepEqual(ids({}),['live']);
 assert.deepEqual(ids({status:'Expired'}),['gone']);
 assert.deepEqual(ids({status:'Applied'}),['sent'],'an application whose advert has closed is still found');
 assert.deepEqual(ids({view:'shortlist',status:'Archived'}),['old']);
 assert.deepEqual(ids({closes:'passed'}),['late','sent'],'closed adverts (applied ones too) are found from All jobs when asked for');
 assert.deepEqual(ids({closes:'next7'}),['live']);
});

test('many jobs change in one save, with each job’s earlier values for Undo',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'jobmap-bulk-'));
 try{
  const store=await new Store([job('A'),job('B',{status:'Preparing',priority:'P1'}),job('C')],directory).init();
  const done=await store.patchMany([{id:'A',patch:{status:'Expired'}},{id:'B',patch:{status:'Expired'}}],0);
  assert.equal(done.revision,1,'one save for both');
  assert.deepEqual(done.jobs.map(j=>j.status),['Expired','Expired']);
  assert.deepEqual(done.previous,[{id:'A',patch:{status:'To review'}},{id:'B',patch:{status:'Preparing'}}]);
  assert.equal(store.jobs().find(j=>j.id==='B').history.at(-1).label,'Preparing → Expired');
  const undone=await store.patchMany(done.previous,1);
  assert.deepEqual(undone.jobs.map(j=>j.status),['To review','Preparing']);
  assert.equal(store.jobs().find(j=>j.id==='C').status,'To review','an untouched job stays as it was');
  await assert.rejects(store.patchMany([{id:'A',patch:{status:'Gone'}}],2),/Invalid status/);
  await assert.rejects(store.patchMany([{id:'A',patch:{status:'Expired'}},{id:'A',patch:{status:'Archived'}}],2),/Each job once/);
  await assert.rejects(store.patchMany([{id:'A',patch:{status:'Expired'}}],0),/changed in another window/);
  await assert.rejects(store.patchMany([],2),/between 1 and 500/);
  assert.equal(store.state.revision,2,'nothing saved by a refused change');
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});

// Part 2: when the job starts and ends.
import {jobPeriod,startMatch,endMatch,nextSeptember} from '../lib/job-period.mjs';
test('the job’s start and end come from her own dates, else a real date next to a start or end word',()=>{
 const p=(description,extra={})=>jobPeriod(job('p',{description,...extra}));
 assert.deepEqual([p('Start date: September 2027.').start.date,p('Start date: September 2027.').start.approx],['2027-09-01',true]);
 assert.equal(p('The role is commencing on 1 October 2026.').start.date,'2026-10-01');
 assert.equal(p('This is a 2027 Summer Internship in data.').start.date,'2027-06-01');
 assert.equal(p('Immediate start available.').start.asap,true);
 assert.equal(p('Please check the start date and eligibility before applying.').start.date,'','boilerplate is not a start date');
 assert.equal(p('Apply as soon as possible.').start.asap,false,'applying soon is not starting soon');
 assert.equal(p('Open until filled. Permanent, full time.').end.permanent,true);
 assert.equal(p('Fixed term until 31 March 2027.').end.date,'2027-03-31');
 const placement=p('A 10-week internship starting June 2027.');
 assert.deepEqual([placement.end.weeks,placement.end.date],[10,'2027-08-10']);
 const mine=jobPeriod(job('m',{description:'Start date: September 2027.',startsOn:'2027-10-04',endsOn:'2028-03-31'}));
 assert.deepEqual([mine.start.date,mine.start.source,mine.end.date,mine.end.source],['2027-10-04','mine','2028-03-31','mine']);
});
test('start and end filters: soon, next summer, after next September, permanent, fixed, before September, short',()=>{
 const t=today;assert.equal(nextSeptember(t),'2027-09-01');
 const on=(description)=>job('f',{description});
 assert.equal(startMatch(on('Immediate start.'),'asap',t),true);
 assert.equal(startMatch(on('Start date: 5 January 2027.'),'3m',t),true);
 assert.equal(startMatch(on('A 2027 summer internship programme.'),'summer',t),true);
 assert.equal(startMatch(on('Starting in September 2027.'),'after-sep',t),true);
 assert.equal(startMatch(on('Starting in September 2027.'),'3m',t),false);
 assert.equal(startMatch(on('No dates here.'),'none',t),true);
 assert.equal(endMatch(on('Permanent role.'),'permanent',t),true);
 assert.equal(endMatch(on('A 12-week placement starting June 2027.'),'fixed',t),true);
 assert.equal(endMatch(on('A 12-week placement starting June 2027.'),'before-sep',t),true);
 assert.equal(endMatch(on('A 12-week placement starting June 2027.'),'short',t),true);
 assert.equal(endMatch(on('Permanent role.'),'none',t),false);
 const ids=selectJobs([on('Starting in September 2027.'),{...on('Permanent.'),id:'g'}],{scope:'all',starts:'after-sep'},undefined,t).map(r=>r.job.id);
 assert.deepEqual(ids,['f']);
});
test('a start or end filter looks past the focus tabs',()=>{
 const future=job('future',{description:'Graduate scheme starting in September 2027.'});
 assert.deepEqual(selectJobs([future],{scope:'parttime',starts:'after-sep'},undefined,today).map(r=>r.job.id),['future']);
});
