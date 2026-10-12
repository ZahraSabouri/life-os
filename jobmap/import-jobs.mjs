import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {workspaceConnection,ensureWorkspaceService} from './lib/workspace.mjs';

const args=process.argv.slice(2),file=args.find(a=>!a.startsWith('--'));
if(!file){console.error('Usage: node import-jobs.mjs <batch.json> [--dry-run]');process.exit(1);}
const root=fileURLToPath(new URL('.',import.meta.url));
const batch=JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,''));
const connection=await workspaceConnection(root);
if(connection.shared)await ensureWorkspaceService(connection);
else{const started=spawnSync(process.execPath,['launch.mjs','--no-browser'],{cwd:root,encoding:'utf8',windowsHide:true});if(started.status!==0)throw new Error(started.stderr||started.stdout||'JobMap did not start.');}
const origin=connection.apiOrigin||'http://127.0.0.1:47841';
let done=false;
for(let attempt=0;attempt<3;attempt++){
 const health=await(await fetch(origin+'/api/health')).json();
 if(health.app!=='jobmap-local'||health.discoveryVersion!==1)throw new Error('Restart JobMap to load the scheduled-search importer.');
 const response=await fetch(origin+'/api/discoveries',{method:'POST',headers:{'Content-Type':'application/json','X-JobMap-Client':'workspace-v1'},body:JSON.stringify({batch,revision:health.revision,dryRun:args.includes('--dry-run')})});
 const result=await response.json();if(response.status===409)continue;if(!response.ok)throw new Error(result.error||'Import failed.');
 console.log(JSON.stringify(result,null,2));done=true;break;
}
if(!done)throw new Error('Workspace remained busy. The saved batch can be retried.');
