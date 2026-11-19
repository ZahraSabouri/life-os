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
