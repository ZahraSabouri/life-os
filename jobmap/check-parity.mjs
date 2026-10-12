import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {canonicalUrl} from './lib/discovery.mjs';
import {workspaceConnection} from './lib/workspace.mjs';
import {Store} from './lib/store.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),peer=process.argv[2];
if(!peer)throw new Error('Usage: node check-parity.mjs "<other JobMap folder>"');
const features=['app','lib','local','tests','public'];
async function files(folder,prefix=''){const out=[];for(const entry of await fs.readdir(folder,{withFileTypes:true})){const relative=path.join(prefix,entry.name);if(entry.isDirectory())out.push(...await files(path.join(folder,entry.name),relative));else out.push(relative);}return out;}
const shared=['launch.mjs','vite.config.ts','next.config.ts','eslint.config.mjs','next-env.d.ts','package-lock.json','.gitignore','tsconfig.json','package.json','index.html','server.mjs','queue-jobs.mjs','import-jobs.mjs','vite.local.config.ts','check-parity.mjs','reconcile-sources.mjs','reconcile-workspace.mjs'];
for(const folder of features)for(const relative of new Set([...(await files(path.join(root,folder))),...(await files(path.join(peer,folder)))]))shared.push(path.join(folder,relative));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');const differences=[];
for(const file of shared){try{if(hash(await fs.readFile(path.join(root,file)))!==hash(await fs.readFile(path.join(peer,file))))differences.push({file});}catch(error){differences.push({file,error:error.code});}}
const evidenceKeys=['role','company','url','source','sourceDetail','location','region','salary','hours','deadline','advertisedOn','employment','stack','description','watch','reason','checked','availability','fields','links','coverage','track','status','saved','priority','notes','nextStep','followUp','applied','cv','coverLetter','tags','folder','attachments','addedOn','history','userEditedDeadline'];
async function collection(folder){const connection=await workspaceConnection(folder);const base=JSON.parse(await fs.readFile(path.join(folder,'data/jobs.json'),'utf8'));const state=JSON.parse(await fs.readFile(path.join(connection.workspaceRoot,'data/workspace/progress.json'),'utf8'));const store=new Store(base,'unused');store.state=store.validateState(state);return {base,connection,preferences:state.preferences,jobs:store.jobs()};}
const [mine,other]=await Promise.all([collection(root),collection(peer)]);
if(hash(JSON.stringify(mine.base))!==hash(JSON.stringify(other.base)))differences.push({file:'data/jobs.json'});
if(JSON.stringify(mine.preferences)!==JSON.stringify(other.preferences))differences.push({field:'preferences'});
if(mine.connection.shared!==other.connection.shared||mine.connection.shared&&(mine.connection.workspaceRoot!==other.connection.workspaceRoot||mine.connection.apiOrigin!==other.connection.apiOrigin||JSON.stringify(mine.connection.inboxRoots)!==JSON.stringify(other.connection.inboxRoots)))differences.push({file:'data/workspace-connection.json'});
// Preserve original duplicate/related base records; compare added vacancies by canonical advert identity.
const identity=j=>canonicalUrl(j.url)||j.id;
const a=new Map(mine.jobs.map(j=>[identity(j),j])),b=new Map(other.jobs.map(j=>[identity(j),j]));
for(const key of new Set([...a.keys(),...b.keys()])){const x=a.get(key),y=b.get(key);if(!x||!y){differences.push({vacancy:key,missingFrom:x?'peer':'this app'});continue;}const fields=evidenceKeys.filter(k=>JSON.stringify(x[k]??'')!==JSON.stringify(y[k]??''));if(fields.length)differences.push({vacancy:key,fields});}
console.log(JSON.stringify({result:differences.length?'FAIL':'PASS',featureFiles:shared.length,records:[mine.jobs.length,other.jobs.length],sharedWorkspace:mine.connection.shared&&other.connection.shared,differences},null,2));
if(differences.length)process.exitCode=1;
