import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';

const samePath=(a,b)=>process.platform==='win32'?path.resolve(a).toLowerCase()===path.resolve(b).toLowerCase():path.resolve(a)===path.resolve(b);

// The connection file is installation data. No machine-specific path is in app code.
export async function workspaceConnection(root,{isolated=false}={}){
 root=path.resolve(root);
 if(isolated)return {shared:false,root,workspaceRoot:root,apiOrigin:null,inboxRoots:[root],proxy:false};
 let config;
 try{config=JSON.parse(await fs.readFile(path.join(root,'data/workspace-connection.json'),'utf8'));}
 catch(error){if(error.code==='ENOENT')return {shared:false,root,workspaceRoot:root,apiOrigin:null,inboxRoots:[root],proxy:false};throw error;}
 const origin=new URL(config.apiOrigin);
 if(config.version!==1||origin.protocol!=='http:'||!['127.0.0.1','localhost'].includes(origin.hostname)||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw new Error('Invalid shared JobMap connection.');
 if(!path.isAbsolute(config.workspaceRoot)||!Array.isArray(config.inboxRoots)||!config.inboxRoots.every(p=>typeof p==='string'&&path.isAbsolute(p))||!config.inboxRoots.some(p=>samePath(p,root))||!config.inboxRoots.some(p=>samePath(p,config.workspaceRoot)))throw new Error('Invalid shared JobMap folders.');
 return {shared:true,root,workspaceRoot:path.resolve(config.workspaceRoot),apiOrigin:origin.origin,inboxRoots:[...new Set(config.inboxRoots.map(p=>path.resolve(p)))],proxy:!samePath(root,config.workspaceRoot)};
}

export async function workspaceHealth(connection){
 let response;
 try{response=await fetch(connection.apiOrigin+'/api/health',{signal:AbortSignal.timeout(1200)});}
 catch(error){if(['ECONNREFUSED','ECONNRESET'].includes(error.cause?.code)||error.name==='TimeoutError')return null;throw error;}
 if(!response.ok)throw new Error('The shared JobMap service did not return its health.');
 const result=await response.json();
 if(result.app!=='jobmap-local')throw new Error('The shared JobMap port belongs to another application.');
 if(result.workspaceVersion!==1||!result.workspaceRoot||!samePath(result.workspaceRoot,connection.workspaceRoot))throw new Error('Restart JobMap to load the shared workspace connection.');
 return result;
}

// A single server owns the saved workspace; the Life OS server forwards its APIs.
// Starting Life OS alone also starts this service, without opening another window.
export async function ensureWorkspaceService(connection){
 if(await workspaceHealth(connection))return;
 const directory=path.join(connection.workspaceRoot,'logs');await fs.mkdir(directory,{recursive:true});
 const log=await fs.open(path.join(directory,'server.log'),'a');
 const env={...process.env,JOBMAP_PORT:new URL(connection.apiOrigin).port||'80'};
 for(const key of ['JOBMAP_DEV','JOBMAP_DATA_DIR','JOBMAP_INBOX_DIR'])delete env[key];
 const child=spawn(process.execPath,[path.join(connection.workspaceRoot,'server.mjs')],{cwd:connection.workspaceRoot,env,detached:true,windowsHide:true,stdio:['ignore',log.fd,log.fd]});
 let spawnError;child.on('error',error=>{spawnError=error;});child.unref();await log.close();
 for(let i=0;i<50;i++){
  if(spawnError)throw spawnError;
  if(await workspaceHealth(connection))return;
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 throw new Error('Shared JobMap did not start. See its logs/server.log.');
}
