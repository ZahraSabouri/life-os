import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';

// Files she keeps with a job: a copy inside JobMap's own data folder, so it stays with the job
// when the original moves. A file is stored under an id JobMap makes up; the name she gave is
// only ever shown and sent back, never used as a path.
export const MAX_FILE_BYTES=10*1024*1024;
export const MAX_FILES_PER_JOB=30;
// Kinds a browser can show safely in a tab. Everything else is handed over as a download.
const TYPES={'.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
const refuse=(status,message)=>Object.assign(new Error(message),{status});
const isId=id=>typeof id==='string'&&/^[\w-]{8,64}$/.test(id);
export function cleanName(value){
 const name=String(value??'').replace(/[\u0000-\u001f\u007f]/g,'').split(/[\\/]/).pop().trim().slice(0,180);
 if(!name||name==='.'||name==='..')throw refuse(400,'The file needs a name.');
 return name;
}
export function validFiles(files){
 return files===undefined||(Array.isArray(files)&&files.length<=MAX_FILES_PER_JOB&&files.every(f=>f!==null&&typeof f==='object'&&isId(f.id)&&typeof f.name==='string'&&f.name.length>0&&f.name.length<=180&&Number.isSafeInteger(f.size)&&f.size>=0&&typeof f.type==='string'&&f.type.length<=100&&typeof f.addedAt==='string'));
}
export class JobFiles{
 constructor(directory){this.directory=directory;}
 folder(jobId){return path.join(this.directory,createHash('sha256').update(String(jobId)).digest('hex').slice(0,24));}
 typeOf(name){return TYPES[path.extname(name).toLowerCase()]||'application/octet-stream';}
 inline(name){return Object.hasOwn(TYPES,path.extname(name).toLowerCase());}
 async save(jobId,file){
  if(file===null||typeof file!=='object'||typeof file.data!=='string')throw refuse(400,'Choose a file to keep.');
  const name=cleanName(file.name);
  if(!/^[A-Za-z0-9+/]*={0,2}$/.test(file.data))throw refuse(400,'The file did not arrive whole. Try again.');
  const content=Buffer.from(file.data,'base64');
  if(!content.byteLength)throw refuse(400,'That file is empty.');
  if(content.byteLength>MAX_FILE_BYTES)throw refuse(413,'A file can be up to 10 MB.');
  const id=randomUUID();
  await mkdir(this.folder(jobId),{recursive:true});
  await writeFile(path.join(this.folder(jobId),id),content,{flag:'wx'});
  return {id,name,size:content.byteLength,type:this.typeOf(name),addedAt:new Date().toISOString()};
 }
 // The backup carries the files kept with jobs, up to `limit` bytes in all; any left out are named.
 async withFiles(exported,jobs,limit=60*1024*1024){
  const copies=[],leftOut=[];let total=0;
  for(const job of jobs)for(const file of job.files||[]){
   if(total+file.size>limit){leftOut.push(`${job.role} · ${file.name}`);continue;}
   try{copies.push({jobId:job.id,id:file.id,data:(await this.read(job.id,file.id)).toString('base64')});total+=file.size;}catch{leftOut.push(`${job.role} · ${file.name} (missing)`);}
  }
  return {...exported,files:copies,...(leftOut.length?{filesLeftOut:leftOut}:{})};
 }
 // After a restore: each file the restored jobs name, written back from the backup.
 async putBack(backup,jobs){
  const named=new Set(jobs.flatMap(job=>(job.files||[]).map(file=>`${job.id}\0${file.id}`)));let written=0;
  for(const copy of Array.isArray(backup?.files)?backup.files:[]){
   if(!copy||typeof copy.jobId!=='string'||!isId(copy.id)||typeof copy.data!=='string'||!named.has(`${copy.jobId}\0${copy.id}`)||!/^[A-Za-z0-9+/]*={0,2}$/.test(copy.data))continue;
   await mkdir(this.folder(copy.jobId),{recursive:true});await writeFile(path.join(this.folder(copy.jobId),copy.id),Buffer.from(copy.data,'base64'));written+=1;
  }
  return written;
 }
 read(jobId,id){if(!isId(id))throw refuse(404,'File not found.');return readFile(path.join(this.folder(jobId),id));}
 async remove(jobId,id){if(!isId(id))return;await unlink(path.join(this.folder(jobId),id)).catch(error=>{if(error.code!=='ENOENT')throw error;});}
}
