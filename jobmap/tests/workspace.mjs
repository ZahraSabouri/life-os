import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Store} from '../lib/store.mjs';
import {planWorkspaceMerge} from '../lib/workspace-merge.mjs';
import {workspaceConnection} from '../lib/workspace.mjs';

const base=[{id:'BASE-1',role:'Software Developer',company:'Test only',url:'https://example.org/original',status:'To review',priority:'P2',notes:'Original note',description:'Python and SQL, paid part-time work.',hours:'16 hours per week',location:'Cardiff'}];
const initial=new Store(base,'unused').export();
const a=structuredClone(initial),b=structuredClone(initial);
a.progress.overrides['BASE-1']={notes:'Preserve this note',priority:'P1',history:[{at:'2026-10-01T00:00:00Z',label:'Reviewed'}]};
b.progress.overrides['BASE-1']={saved:true,status:'Archived',history:[{at:'2026-10-02T00:00:00Z',label:'Archived'}]};
const custom={id:'CUSTOM-first',role:'Data Engineer',company:'Test only',url:'https://example.org/custom',description:'Python, SQL and pipelines.',notes:'Custom note',status:'To review',priority:'P2',addedOn:'2026-10-06'};
a.progress.customJobs=[custom];b.progress.customJobs=[{...custom,id:'CUSTOM-second',addedOn:'2026-10-01'}];
b.progress.overrides['CUSTOM-second']={saved:true,followUp:'2026-10-13'};
const plan=planWorkspaceMerge(a,b);
assert.deepEqual(plan.conflicts,[]);
assert.equal(plan.backup.progress.overrides['BASE-1'].notes,'Preserve this note');
assert.equal(plan.backup.progress.overrides['BASE-1'].priority,'P1');
assert.equal(plan.backup.progress.overrides['BASE-1'].saved,true);
assert.equal(plan.backup.progress.overrides['BASE-1'].status,'Archived');
assert.equal(plan.backup.progress.overrides['BASE-1'].history.length,2);
assert.equal(plan.backup.progress.customJobs.length,1);
assert.equal(plan.backup.progress.customJobs[0].addedOn,'2026-10-01');
assert.equal(plan.backup.progress.overrides['CUSTOM-first'].followUp,'2026-10-13');
assert.equal(a.progress.customJobs[0].addedOn,'2026-10-06');
const clash=structuredClone(b);clash.progress.overrides['BASE-1'].notes='Opposing note';
assert(planWorkspaceMerge(a,clash).conflicts.some(c=>c.field==='notes'));
const unsave=structuredClone(a);unsave.progress.overrides['BASE-1'].saved=false;
assert(planWorkspaceMerge(unsave,b).conflicts.some(c=>c.field==='saved'));
const settings=structuredClone(b);settings.progress.preferences.maxHours=15;
assert(planWorkspaceMerge(a,settings).conflicts.some(c=>c.field==='preferences'));
assert.deepEqual(planWorkspaceMerge(plan.backup,plan.backup).changes,[]);

async function unusedPort(){const server=net.createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'jobmap-shared-test-'));
assert(path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep));
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const folders=[path.join(directory,'main'),path.join(directory,'life')];
const ports=[await unusedPort(),await unusedPort()];
const urls=ports.map(port=>'http://127.0.0.1:'+port);
const connection={version:1,workspaceRoot:folders[0],apiOrigin:urls[0],inboxRoots:folders};
const headers={'Content-Type':'application/json','X-JobMap-Client':'workspace-v1'};
async function api(index,route,method='GET',body){const response=await fetch(urls[index]+'/api/'+route,{method,headers,...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});return {status:response.status,data:await response.json()};}
let peer;
try{
 for(const folder of folders){
  await fs.mkdir(path.join(folder,'data/workspace'),{recursive:true});
  await fs.mkdir(path.join(folder,'dist/client'),{recursive:true});
  await fs.cp(path.join(root,'lib'),path.join(folder,'lib'),{recursive:true});
  await fs.copyFile(path.join(root,'server.mjs'),path.join(folder,'server.mjs'));
  await fs.writeFile(path.join(folder,'data/jobs.json'),JSON.stringify(base));
  await fs.writeFile(path.join(folder,'data/workspace/progress.json'),JSON.stringify(initial.progress));
  await fs.writeFile(path.join(folder,'data/workspace-connection.json'),JSON.stringify(connection));
  await fs.writeFile(path.join(folder,'dist/client/index.html'),'<html><body>Test interface only</body></html>');
 }
 assert.equal((await workspaceConnection(folders[1])).proxy,true);
 assert.equal((await workspaceConnection(folders[1],{isolated:true})).shared,false);
 // Opening the Life OS interface alone must start the owner, without a second store.
 const env={...process.env,JOBMAP_PORT:String(ports[1])};for(const key of ['JOBMAP_DATA_DIR','JOBMAP_INBOX_DIR','JOBMAP_DEV'])delete env[key];
 peer=spawn(process.execPath,[path.join(folders[1],'server.mjs')],{cwd:folders[1],env,windowsHide:true,stdio:'pipe'});
 let output='';peer.stderr.on('data',c=>{output+=c;});peer.stdout.on('data',c=>{output+=c;});
 let ready=false;for(let i=0;i<80;i++){try{if((await api(1,'health')).status===200){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
 assert(ready,'Proxy did not start: '+output);
 for(const url of urls){const page=await fetch(url+'/',{headers:{Accept:'text/html'}});assert.equal(page.headers.get('transfer-encoding'),null);const html=await page.text();assert.equal(Number(page.headers.get('content-length')),Buffer.byteLength(html));}
 assert.equal((await api(0,'health')).data.workspaceRoot,folders[0]);
 const rival=spawn(process.execPath,[path.join(folders[0],'server.mjs')],{cwd:folders[0],env:{...env,JOBMAP_PORT:String(ports[0])},windowsHide:true,stdio:'ignore'});
 const rivalExit=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{rival.kill();reject(new Error('A second workspace writer did not exit.'));},5000);rival.once('exit',code=>{clearTimeout(timeout);resolve(code);});rival.once('error',reject);});
 assert.equal(rivalExit,1);
 const before=(await api(0,'jobs')).data;
 const edited=await api(1,'jobs/BASE-1','PATCH',{revision:before.revision,patch:{saved:true,notes:'From Life OS',status:'Preparing'}});
 assert.equal(edited.status,200);
 assert.deepEqual((await api(0,'jobs')).data,(await api(1,'jobs')).data);
 // A save in another tab may not overwrite a later edit with an old revision.
 const concurrent=await Promise.all([api(0,'jobs/BASE-1','PATCH',{revision:edited.data.revision,patch:{nextStep:'Review advert'}}),api(1,'jobs/BASE-1','PATCH',{revision:edited.data.revision,patch:{notes:'Concurrent edit'}})]);
 assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
 assert.deepEqual((await api(0,'jobs')).data,(await api(1,'jobs')).data);
 const revision=(await api(0,'health')).data.revision;
 assert.equal((await api(1,'preferences','PUT',{revision,preferences:{...initial.progress.preferences,maxHours:16}})).status,200);
 assert.equal((await api(0,'jobs')).data.preferences.maxHours,16);
 const batch={runId:'shared-fixture-only',jobs:[{role:'Fixture Developer',company:'Test only',url:'https://example.org/fixture',source:'Test fixture',description:'Paid part-time Python and SQL development.',checked:'2026-10-12'}]};
 for(const folder of folders){const file=path.join(folder,'data/inbox/batch.json');await fs.writeFile(file,JSON.stringify(batch));const earlier=new Date(Date.now()-10000);await fs.utimes(file,earlier,earlier);}
 const scanned=await api(1,'inbox/scan','POST',{});assert.equal(scanned.status,200);assert.equal(scanned.data.results.length,2);assert(scanned.data.results.every(r=>r.ok));
 const after=(await api(0,'jobs')).data;assert.equal(after.jobs.length,2);assert.equal(after.jobs[0].saved,true);assert.equal(after.jobs[0].status,'Preparing');
 assert.deepEqual(after,(await api(1,'jobs')).data);
 for(const folder of folders){assert.equal((await fs.readdir(path.join(folder,'data/inbox/processed'))).length,1);assert((await fs.readFile(path.join(folder,'data/workspace/import-log.md'),'utf8')).includes('batch.json'));}
 assert.equal((await api(1,'backup')).data.progress.importRuns.filter(r=>r.id===batch.runId).length,1);
 assert.equal((await fs.readFile(path.join(folders[1],'data/workspace/progress.json'),'utf8')),JSON.stringify(initial.progress));
 // Restart the owner while Life OS remains open: the proxy must reconnect and keep progress.
 await api(0,'stop','POST',{});await new Promise(r=>setTimeout(r,300));
 assert.deepEqual((await api(1,'jobs')).data,after);
 await api(1,'stop','POST',{});await new Promise(r=>setTimeout(r,200));
 assert.equal((await api(0,'jobs')).data.jobs.length,2);
 console.log(JSON.stringify({result:'PASS',workspace:'conflict-aware merge, ID mapping, earliest dates, preserved notes, shared edits/preferences, concurrent revision protection, both inboxes, owner restart, Life OS-only startup'}));
}finally{
 await api(1,'stop','POST',{}).catch(()=>{});await api(0,'stop','POST',{}).catch(()=>{});peer?.kill();
 await new Promise(r=>setTimeout(r,300));await fs.rm(directory,{recursive:true,force:true});
}
