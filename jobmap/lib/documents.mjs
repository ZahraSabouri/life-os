import {readdir,stat,readFile} from 'node:fs/promises';
import path from 'node:path';

// The documents folder she connects to JobMap: where her CVs and earlier applications are kept
// on this computer. JobMap reads it (names, sizes, dates) and can copy a file from it onto a job;
// it never writes into it, and never reads outside it.
const refuse=(status,message)=>Object.assign(new Error(message),{status});
export function validDocuments(value){
 return value===undefined||(value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(key=>['root','mainCv'].includes(key))&&['root','mainCv'].every(key=>typeof value[key]==='string'&&value[key].length<=1000)&&(value.root===''||path.isAbsolute(value.root)));
}
export function inside(root,relative=''){
 if(!root)throw refuse(400,'Connect your documents folder first.');
 const top=path.resolve(root),target=path.resolve(top,String(relative||'')),step=path.relative(top,target);
 if(step.startsWith('..')||path.isAbsolute(step))throw refuse(400,'That is outside your documents folder.');
 return target;
}
const kindOf=name=>/(^|[^a-z])(cv|resume|résumé)([^a-z]|$)/i.test(name)?'cv':/cover|letter/i.test(name)?'letter':'';
export async function listDocuments(root,relative=''){
 const folder=inside(root,relative);let entries;
 try{entries=await readdir(folder,{withFileTypes:true});}catch{throw refuse(404,'That folder was not found on this computer.');}
 const folders=[],files=[];
 for(const entry of entries){
  if(entry.name.startsWith('.')||entry.name.startsWith('~$'))continue;
  if(entry.isDirectory()){if(folders.length<500)folders.push({name:entry.name});continue;}
  if(!entry.isFile()||files.length>=500)continue;
  let info=null;try{info=await stat(path.join(folder,entry.name));}catch{}
  files.push({name:entry.name,size:info?.size??0,modified:info?info.mtime.toISOString().slice(0,10):'',kind:kindOf(entry.name)});
 }
 const byName=(a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'});
 const parts=path.relative(path.resolve(root),folder).split(path.sep).filter(Boolean);
 return {path:parts.join('/'),parts,folders:folders.sort(byName),files:files.sort(byName)};
}
export async function readDocument(root,relative,maxBytes){
 const file=inside(root,relative);let info;
 try{info=await stat(file);}catch{throw refuse(404,'That file was not found.');}
 if(!info.isFile())throw refuse(400,'Choose a file.');
 if(info.size>maxBytes)throw refuse(413,'A file can be up to 10 MB.');
 return {name:path.basename(file),data:(await readFile(file)).toString('base64')};
}
