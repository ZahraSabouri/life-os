import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from './lib/store.mjs';
import { createInbox } from './lib/inbox.mjs';
import { workspaceConnection, ensureWorkspaceService } from './lib/workspace.mjs';
import { openFolder } from './lib/folders.mjs';
import { JobFiles, MAX_FILE_BYTES } from './lib/files.mjs';
import { listDocuments, readDocument } from './lib/documents.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.JOBMAP_PORT||47841);
const origin=`http://127.0.0.1:${port}`;
const base=JSON.parse((await readFile(path.join(root,'data/jobs.json'),'utf8')).replace(/^\uFEFF/,''));
const connection=await workspaceConnection(root,{isolated:!!(process.env.JOBMAP_DATA_DIR||process.env.JOBMAP_INBOX_DIR)});
if(connection.shared&&!connection.proxy&&port!==Number(new URL(connection.apiOrigin).port||80))throw new Error('The shared workspace owner must use its configured port.');
const dataDirectory=process.env.JOBMAP_DATA_DIR||path.join(root,'data/workspace');
let store=null,files=null,inboxes=[],ready;
// Scheduled searches drop batch files here; they cannot reach this loopback API themselves.
let connecting=null;
async function connected(){connecting??=ensureWorkspaceService(connection).finally(()=>{connecting=null;});await connecting;}
const publicRoot=path.join(root,'dist/client');
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'};
function json(res,data,status=200){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...headers});res.end(JSON.stringify(data));}
async function body(req,limit=15*1024*1024){let data='';for await(const c of req){data+=c;if(Buffer.byteLength(data)>limit){const e=new Error('File is too large.');e.status=413;throw e;}}try{return JSON.parse(data)}catch{throw new Error('Invalid JSON.');}}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.json':'application/json','.txt':'text/plain; charset=utf-8','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 try{
  await ready;
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)){json(res,{error:'Local requests only.'},403);return;}
  const url=new URL(req.url,origin);
  if(!['GET','HEAD'].includes(req.method)){
   const allowed=new Set([origin,`http://localhost:${port}`,...(process.env.JOBMAP_DEV==='1'?['http://localhost:3000','http://127.0.0.1:3000']:[])]);
   if(req.headers.origin&&!allowed.has(req.headers.origin)){json(res,{error:'Origin not allowed.'},403);return;}
   if(req.headers['x-jobmap-client']!=='workspace-v1'||!req.headers['content-type']?.startsWith('application/json')){json(res,{error:'Invalid workspace request.'},403);return;}
  }
  // Stop this interface only. The other interface can still use its workspace.
  if(url.pathname==='/api/stop'&&req.method==='POST'){await body(req);json(res,{stopped:true});server.close(()=>process.exit(0));return;}
  if(connection.proxy&&url.pathname.startsWith('/api/')){
   await connected();
   const forwarded=await fetch(connection.apiOrigin+url.pathname+url.search,{method:req.method,headers:{'Content-Type':'application/json','X-JobMap-Client':'workspace-v1','Origin':connection.apiOrigin},...(!['GET','HEAD'].includes(req.method)?{body:JSON.stringify(await body(req,url.pathname==='/api/restore'?90*1024*1024:15*1024*1024))}:{}),signal:AbortSignal.timeout(url.pathname==='/api/restore'||url.pathname==='/api/backup'?120000:15000)});
   const content=Buffer.from(await forwarded.arrayBuffer());
   res.writeHead(forwarded.status,{...headers,'Content-Type':forwarded.headers.get('content-type')||'application/json',...(forwarded.headers.has('content-disposition')?{'Content-Disposition':forwarded.headers.get('content-disposition')}:{})});
   res.end(req.method==='HEAD'?undefined:content);return;
  }
  if(url.pathname==='/api/health'){json(res,{app:'jobmap-local',version:1,count:store.jobs().length,revision:store.state.revision,discoveryVersion:1,inboxVersion:1,dateVersion:1,workspaceVersion:1,workspaceRoot:root,sharedWorkspace:connection.shared});return;}
  if(url.pathname==='/api/discoveries'&&req.method==='POST'){const b=await body(req);json(res,await store.ingest(b.batch,b.revision,b.dryRun===true));return;}
  if(url.pathname==='/api/inbox'&&req.method==='GET'){const folders=await Promise.all(inboxes.map(inbox=>inbox.status()));json(res,{...folders[0],folders,waiting:folders.flatMap(f=>f.waiting)});return;}
  if(url.pathname==='/api/inbox/scan'&&req.method==='POST'){await body(req);const scans=await Promise.all(inboxes.map(inbox=>inbox.scan()));json(res,{busy:scans.some(s=>s.busy),results:scans.flatMap(s=>s.results)});return;}
  // Two listings of one job: join them (the job shown keeps a copy of the other's files), or show one on its own again.
  const pair=/^\/api\/jobs\/([^/]+)\/(join|separate)$/.exec(url.pathname);
  if(pair&&req.method==='POST'){
   const id=decodeURIComponent(pair[1]),b=await body(req);
   if(pair[2]==='separate'){json(res,await store.separate(id,b.revision));return;}
   store.check(b.revision);const all=store.all(),keep=all.find(j=>j.id===id),other=all.find(j=>j.id===b.other);const copied=[];
   try{for(const f of other&&keep&&!other.sameAs&&!keep.sameAs?other.files||[]:[])if(!(keep.files||[]).some(k=>k.id===f.id)){await files.copy(other.id,keep.id,f.id);copied.push(f.id);}json(res,await store.join(id,b.other,b.revision));}
   catch(error){for(const f of copied)await files.remove(id,f).catch(()=>{});throw error;}
   return;
  }
  // Files kept with a job: add one, open one, remove one.
  const kept=/^\/api\/jobs\/([^/]+)\/files(?:\/([\w-]+))?$/.exec(url.pathname);
  if(kept){
   const jobId=decodeURIComponent(kept[1]),fileId=kept[2];
   if(req.method==='POST'&&!fileId){const b=await body(req);store.check(b.revision);if(!store.jobs().some(j=>j.id===jobId)){json(res,{error:'Job not found.'},404);return;}const meta=await files.save(jobId,typeof b.from==='string'?await readDocument(store.state.documents?.root,b.from,MAX_FILE_BYTES):b.file);try{json(res,{...await store.attach(jobId,meta,b.revision),file:meta},201);}catch(error){await files.remove(jobId,meta.id).catch(()=>{});throw error;}return;}
   if(req.method==='GET'&&fileId){const meta=store.jobs().find(j=>j.id===jobId)?.files?.find(f=>f.id===fileId);if(!meta){json(res,{error:'File not found.'},404);return;}const content=await files.read(jobId,meta.id);res.writeHead(200,{...headers,'Content-Type':files.typeOf(meta.name),'Content-Length':content.byteLength,'Content-Disposition':`${files.inline(meta.name)?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(meta.name)}`});res.end(content);return;}
   if(req.method==='DELETE'&&fileId){const b=await body(req);const result=await store.detach(jobId,fileId,b.revision);await files.remove(jobId,fileId).catch(()=>{});json(res,result);return;}
  }
  if(url.pathname==='/api/jobs'&&req.method==='GET'){json(res,{jobs:store.jobs(),revision:store.state.revision,updatedAt:store.state.updatedAt,preferences:store.state.preferences});return;}
  if(url.pathname==='/api/preferences'&&req.method==='PUT'){const b=await body(req);json(res,await store.preferences(b.preferences,b.revision));return;}
  if(url.pathname==='/api/jobs'&&req.method==='POST'){const b=await body(req);json(res,await store.add(b.job,b.revision),201);return;}
  if(url.pathname.startsWith('/api/jobs/')&&req.method==='PATCH'){const b=await body(req);json(res,await store.patch(decodeURIComponent(url.pathname.slice(10)),b.patch,b.revision));return;}
  if(url.pathname==='/api/backup'&&req.method==='GET'){res.setHeader('Content-Disposition',`attachment; filename="JobMap-backup-${new Date().toISOString().slice(0,10)}.json"`);json(res,await files.withFiles(store.export(),store.all()));return;}
  if(url.pathname==='/api/restore'&&req.method==='POST'){const b=await body(req,90*1024*1024);const result=await store.restore(b.backup,b.revision);await files.putBack(b.backup,store.all());json(res,result);return;}
  // Her documents folder: what is in it, and which folder and main CV she chose.
  if(url.pathname==='/api/documents'&&req.method==='GET'){const documents=store.state.documents||{root:'',mainCv:''};let listing=null,problem='';if(documents.root){try{listing=await listDocuments(documents.root,url.searchParams.get('dir')||'');}catch(error){problem=error.message;}}json(res,{documents,listing,problem,revision:store.state.revision});return;}
  if(url.pathname==='/api/documents'&&req.method==='PUT'){const b=await body(req);json(res,await store.documents(b.documents,b.revision));return;}
  if(url.pathname==='/api/open-folder'&&req.method==='POST'){const b=await body(req);json(res,await openFolder(b.path));return;}
  if(url.pathname.startsWith('/api/')){json(res,{error:'Not found.'},404);return;}
  if(!['GET','HEAD'].includes(req.method)){json(res,{error:'Method not allowed.'},405);return;}
  let decoded;try{decoded=decodeURIComponent(url.pathname)}catch{json(res,{error:'Invalid path.'},400);return;}
  let file=path.resolve(publicRoot,'.'+(decoded==='/'?'/index.html':decoded));
  if(!file.startsWith(publicRoot+path.sep)){json(res,{error:'Not found.'},404);return;}
  try{if((await stat(file)).isDirectory())file=path.join(file,'index.html');const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':content.byteLength,...headers,'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:content);}catch{json(res,{error:'The app build is missing. See the local README.'},404);}
 }catch(error){console.error(error.message);json(res,{error:error.message||'Could not save. Your existing progress is unchanged.'},error.status||400);}
});
// Bind before loading or importing data. Concurrent launches cannot create a
// second writer: the losing process exits before touching the workspace.
ready=(async()=>{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 if(connection.proxy)await connected();
 else{
  store=await new Store(base,dataDirectory).init();
  files=new JobFiles(path.join(dataDirectory,'files'));
  inboxes=await Promise.all(connection.inboxRoots.map(folder=>createInbox(store,process.env.JOBMAP_INBOX_DIR||path.join(folder,'data/inbox'),folder===root?path.join(dataDirectory,'import-log.md'):path.join(folder,'data/workspace/import-log.md'))));
 }
 console.log(`JobMap Local: ${origin}/`);
})();
ready.catch(error=>{console.error(error.message);server.close();process.exit(1);});
