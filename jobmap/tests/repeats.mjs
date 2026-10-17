import assert from 'node:assert/strict';
import {readFile,mkdtemp} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from '../lib/store.mjs';
import {JobFiles} from '../lib/files.mjs';
import {sameVacancy,employerKey,roleKey,repeatsOf,selectJobs,inView,reviewDeadline} from '../lib/matching.mjs';
const base=JSON.parse(await readFile(new URL('../data/jobs.json',import.meta.url),'utf8'));

// One vacancy on the employer's own site and on a board.
const ctr={id:'a',role:'Professional Specialist in Technical Innovation and Development',company:'Cardiff University - Centre for Trials Research',location:'Cardiff (blended, on campus and remote)',deadline:'2026-10-18'};
const board={id:'b',role:'Professional Specialist in Technical Innovation and Development',company:'Cardiff University',location:'Cardiff',deadline:'2026-10-18'};
assert.equal(employerKey(ctr.company),'cardiff university');assert.equal(employerKey('Admiral Money (Admiral Group)'),'admiral money');assert.equal(employerKey('Stantec UK Ltd'),'stantec');
assert.notEqual(employerKey('Undisclosed employer (via Ernest Gordon Recruitment)'),employerKey('Undisclosed employer (via Another Recruiter)'));
assert(sameVacancy(ctr,board));assert(!sameVacancy(board,board));
assert.equal(roleKey('Software Developer (ref 2526600)'),roleKey('Software Developer'));assert.equal(roleKey('Data Analyst - Job Ref: CMT-45'),'data analyst');assert.equal(roleKey('Reference Data Analyst'),'reference data analyst');
assert(!sameVacancy(ctr,{...board,company:'Cardiff Metropolitan University'}));
assert(!sameVacancy(ctr,{...board,role:'Professional Specialist'}));
assert(!sameVacancy(ctr,{...board,deadline:'2026-12-31'}));assert(sameVacancy(ctr,{...board,deadline:''}));
// A region holds its towns; two towns are two places; an advert for anywhere in the UK can be either.
assert(sameVacancy({...board,location:'South Wales'},{...board,id:'c',location:'Newport'}));
assert(!sameVacancy({...board,location:'Cardiff'},{...board,id:'c',location:'Swansea'}));
assert(!sameVacancy({...board,location:'NW England'},{...board,id:'c',location:'Scotland'}));
assert(!sameVacancy({...board,location:'East Midlands'},{...board,id:'c',location:'West Midlands'}));
assert(sameVacancy({...board,location:'All UK'},{...board,id:'c',location:'Scotland'}));

const dir=await mkdtemp(fileURLToPath(new URL('../data/test-workspace-',import.meta.url)));
const store=await new Store(base,dir).init();const rev=()=>store.state.revision;
const first=(await store.add({role:ctr.role,company:ctr.company,location:ctr.location,deadline:ctr.deadline,url:'https://cardiffuniweb.eploy.net/vacancies/655'},rev())).job;
await store.patch(first.id,{status:'Preparing',notes:'Mine'},rev());
const shown=store.jobs().length;
// Added again from the board: kept with the job she has, which stays shown once.
const again=await store.add({role:board.role,company:board.company,location:board.location,deadline:board.deadline,url:'https://www.jobs.ac.uk/job/DTD308'},rev());
assert.equal(again.joined,true);assert.equal(again.job.id,first.id);assert.equal(store.jobs().length,shown);assert.equal(store.all().length,shown+1);
assert.deepEqual(again.job.alsoListed.map(a=>a.url),['https://www.jobs.ac.uk/job/DTD308']);
assert.equal(selectJobs(store.jobs(),{view:'shortlist',scope:'all'}).filter(r=>r.job.role===ctr.role).length,1);
await assert.rejects(store.add({role:'Anything',company:'Else',url:'https://www.jobs.ac.uk/job/DTD308'},rev()),/already saved: Professional Specialist/);
// Shown on its own again, and not offered for joining again.
const other=again.job.alsoListed[0].id;
const apart=await store.separate(other,rev());assert.equal(store.jobs().length,shown+1);assert.deepEqual(apart.job.notSame,[first.id]);assert(!repeatsOf(store.jobs()).has(first.id));
await assert.rejects(store.separate(other,rev()),/not joined/);
// Joined by hand: her work on both listings comes together on the one shown.
await store.patch(other,{saved:true,notes:'From the board',priority:'P1',followUp:'2026-10-20',tags:'University'},rev());
const joined=await store.join(first.id,other,rev());
assert.equal(joined.job.status,'Preparing');assert.equal(joined.job.priority,'P1');assert.equal(joined.job.followUp,'2026-10-20');assert.equal(joined.job.notes,'Mine\n\nFrom the board');assert.equal(joined.job.tags,'University');
assert.equal(store.jobs().length,shown);assert.match(joined.job.history.at(-1).label,/Joined with the listing on Added by you/);
await assert.rejects(store.join(first.id,other,rev()),/already shown/);await assert.rejects(store.join(first.id,first.id,rev()),/another listing/);
await assert.rejects(store.patch(first.id,{sameAs:other},rev()),/Unsupported/);
// Kept over a restart; a backup that points a listing at itself is refused.
const reopened=await new Store(base,dir).init();assert.equal(reopened.jobs().length,shown);assert.equal(reopened.jobs().find(j=>j.id===first.id).alsoListed.length,1);
const bad=structuredClone(reopened.export());bad.progress.overrides[first.id]={...bad.progress.overrides[first.id],sameAs:first.id};await assert.rejects(reopened.restore(bad,reopened.state.revision),/Invalid joined/);
// An archived job stays archived when the other listing was never worked on; one she had started on brings it back.
{const own=await new Store(base,await mkdtemp(fileURLToPath(new URL('../data/test-workspace-',import.meta.url)))).init();
 await own.patch('SF-W9QOK',{status:'Archived'},0);let j=await own.join('SF-W9QOK','SF-XV9JQ',1);assert.equal(j.job.status,'Archived');
 await own.separate('SF-XV9JQ',2);await own.patch('SF-XV9JQ',{status:'Applied'},3);j=await own.join('SF-W9QOK','SF-XV9JQ',4);assert.equal(j.job.status,'Applied');}
// The job shown keeps its own copy of a file from the other listing.
const files=new JobFiles(path.join(dir,'files'));const meta=await files.save('X-1',{name:'cv.pdf',data:Buffer.from('pdf').toString('base64')});
await files.copy('X-1','X-2',meta.id);assert.equal((await files.read('X-2',meta.id)).toString(),'pdf');await assert.rejects(files.copy('X-1','X-2',meta.id));

// The quick views in the menu.
const today='2026-10-17';
assert(inView('closing',{deadline:'2026-10-20',status:'To review'},today));assert(!inView('closing',{deadline:'2026-10-20',status:'Applied'},today));
assert(!inView('closing',{deadline:'2026-10-30',status:'To review'},today));assert(!inView('closing',{deadline:'2026-10-10',status:'To review'},today));assert(!inView('closing',{deadline:'2026-10-20',availability:'closed'},today));
assert(inView('new',{addedOn:'2026-10-11'},today));assert(!inView('new',{addedOn:'2026-10-10'},today));assert(!inView('new',{addedOn:'2026-10-16',status:'Archived'},today));
assert(inView('high',{priority:'P1'},today));assert(!inView('high',{priority:'P2'},today));
assert(inView('closed',{availability:'closed'},today));assert(inView('closed',{deadline:'2026-10-01'},today));assert(!inView('closed',{availability:'closed',status:'Archived'},today));assert(inView('archive',{status:'Rejected'},today));
const closing=selectJobs(base,{view:'closing'},undefined,'2026-09-25').map(r=>reviewDeadline(r.job));assert(closing.length>0);assert.deepEqual(closing,[...closing].sort());
console.log('PASS: one job listed twice is shown once, carries her work from both, separates again; the quick views.');
