import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store,validatePatch} from './lib/store.mjs';
import {planImport} from './lib/discovery.mjs';
import {workspaceConnection} from './lib/workspace.mjs';
const args=process.argv.slice(2),file=args.find(a=>!a.startsWith('--'));
if(!file){console.error('Usage: node queue-jobs.mjs <batch.json> [--dry-run]');process.exit(1);}
const root=fileURLToPath(new URL('.',import.meta.url));
const batch=JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,''));
const connection=await workspaceConnection(root);
const base=JSON.parse(await readFile(path.join(connection.workspaceRoot,'data/jobs.json'),'utf8'));
const store=new Store(base,path.join(connection.workspaceRoot,'data/workspace'));
try{store.state=store.validateState(JSON.parse(await readFile(store.file,'utf8')));}catch(error){if(error.code!=='ENOENT')throw error;}
const {state,...preview}=planImport(store.state,base,batch,validatePatch);
if(args.includes('--dry-run')||preview.repeated){console.log(JSON.stringify({...preview,dryRun:args.includes('--dry-run')},null,2));}
else{
 const directory=path.join(root,'data/inbox');await mkdir(directory,{recursive:true});
 const fingerprint=createHash('sha256').update(batch.runId).digest('hex').slice(0,20);
 const target=path.join(directory,'search-'+fingerprint+'.json');
 await writeFile(target+'.tmp',JSON.stringify(batch,null,2),'utf8');await rename(target+'.tmp',target);
 console.log(JSON.stringify({queued:true,file:target,preview,notice:'JobMap imports this while running or when next opened.'},null,2));
}
