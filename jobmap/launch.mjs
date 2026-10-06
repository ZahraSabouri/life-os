import {spawn} from 'node:child_process';
import {openSync,mkdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const url='http://127.0.0.1:47841/';
const expectedInbox=1; // data/inbox support; a service older than this is replaced on its own
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function health(){try{const r=await fetch(url+'api/health',{signal:AbortSignal.timeout(1000)});const d=await r.json();if(d.app!=='jobmap-local')throw new Error('Port 47841 is used by a different application.');return d;}catch(e){if(e.message.includes('different application'))throw e;return null;}}
async function stop(){await fetch(url+'api/stop',{method:'POST',headers:{'Content-Type':'application/json','X-JobMap-Client':'workspace-v1'},body:'{}'}).catch(()=>{});for(let i=0;i<40;i++){await wait(150);if(!await health())return true;}return false;}
try{
 if(process.argv.includes('--stop')){if(await health()){await stop();console.log('JobMap stopped. Your progress is saved.');}else console.log('JobMap is already stopped.');}
 else{
  if(!existsSync(path.join(root,'dist/client/index.html')))throw new Error('The app build is missing. Open the README in the JobMap App folder.');
  let running=await health();
  // A service started before data/inbox existed cannot see scheduled searches, so replace it.
  if(running&&((running.inboxVersion||0)<expectedInbox||(running.dateVersion||0)<1)){
   console.log('Updating the JobMap service for the current app...');
   if(!await stop())throw new Error('The running JobMap service did not stop. Run Stop JobMap.cmd, or restart the computer, then try again.');
   running=null;
  }
  if(!running){
   mkdirSync(path.join(root,'logs'),{recursive:true});
   const out=openSync(path.join(root,'logs/server.log'),'a');
   const env={...process.env};delete env.JOBMAP_DEV;delete env.JOBMAP_DATA_DIR;delete env.JOBMAP_PORT;delete env.JOBMAP_INBOX_DIR;
   const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,env,detached:true,windowsHide:true,stdio:['ignore',out,out]});child.unref();
   let ready=false;for(let i=0;i<40;i++){await wait(150);if(await health()){ready=true;break;}}
   if(!ready)throw new Error('JobMap did not start. See JobMap App/logs/server.log.');
  }
  console.log('JobMap is ready: '+url);
  if(!process.argv.includes('--no-browser')){spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{detached:true,windowsHide:true,stdio:'ignore'}).unref();}
 }
}catch(error){console.error(error.message);process.exitCode=1;}
