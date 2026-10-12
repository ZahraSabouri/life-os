import {stat} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';

// "Open folder" beside a job: shows a folder of hers in the file manager of this computer.
// Only a folder that exists is opened, and nothing in it is run. A file's path opens the folder it is in.
export async function openFolder(value,{run=spawn,platform=process.platform}={}){
 const refuse=(status,message)=>Object.assign(new Error(message),{status});
 if(typeof value!=='string'||!value.trim()||value.length>1000)throw refuse(400,'Give the full path of a folder on this computer.');
 const typed=value.trim().replace(/^"(.*)"$/,'$1');
 if(!path.isAbsolute(typed))throw refuse(400,'Give the full path, starting from the drive, for example C:\\Users\\…');
 const target=path.resolve(typed);let info;
 try{info=await stat(target);}catch{throw refuse(404,'That folder was not found on this computer.');}
 const folder=info.isDirectory()?target:path.dirname(target);
 const [command,args]=platform==='win32'?['explorer.exe',[folder]]:platform==='darwin'?['open',[folder]]:['xdg-open',[folder]];
 const child=run(command,args,{detached:true,stdio:'ignore'});child?.on?.('error',()=>{});child?.unref?.();
 return {opened:folder};
}
