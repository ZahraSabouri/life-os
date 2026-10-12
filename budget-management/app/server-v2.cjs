'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const host='127.0.0.1',port=Number(process.env.BUDGET_PORT||47831),origin=`http://${host}:${port}`;
const project=path.resolve(__dirname,'..'),dataDir=path.resolve(process.env.BUDGET_DATA_DIR||path.join(project,'data'));
const imageDir=path.resolve(process.env.BUDGET_ASSET_DIR||path.join(project,'assets/images/generated'));
// Pictures you have approved yourself are served too, under the prefix approved/.
const approvedDir=path.resolve(process.env.BUDGET_APPROVED_DIR||path.join(project,'assets/images/approved'));
const statePath=path.join(dataDir,'state.json'),backupDir=path.join(dataDir,'backups');
const context=vm.createContext({React:{createElement:()=>null}});
for(const name of ['core','seed','domain'])vm.runInContext(fs.readFileSync(path.join(__dirname,'src',name+'.js'),'utf8'),context);
const validate=vm.runInContext('validateV4',context);let queue=Promise.resolve();
function readState(){if(!fs.existsSync(statePath))return {revision:0,state:null};const value=JSON.parse(fs.readFileSync(statePath,'utf8'));if(!Number.isSafeInteger(value.revision)||value.revision<1)throw Error('Invalid revision');validate(value.state);return value;}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}
function body(req){return new Promise((resolve,reject)=>{let text='',bytes=0;req.on('data',chunk=>{bytes+=chunk.length;if(bytes>8*1024*1024){reject(Error('Backup exceeds 8 MB.'));req.destroy();}else text+=chunk;});req.on('end',()=>{try{resolve(JSON.parse(text));}catch{reject(Error('Invalid JSON.'));}});req.on('error',reject);});}
function writeState(state,revision){
  validate(state);const previous=readState();if(previous.revision!==revision){const err=Error('Another tab saved changes. Reload the local copy before editing.');err.status=409;throw err;}
  fs.mkdirSync(backupDir,{recursive:true});
  if(previous.state)fs.copyFileSync(statePath,path.join(backupDir,`state-r${previous.revision}-${Date.now()}.json`));
  const next={revision:revision+1,savedAt:new Date().toISOString(),state},temp=statePath+'.'+crypto.randomUUID()+'.tmp';
  const fd=fs.openSync(temp,'wx');try{fs.writeFileSync(fd,JSON.stringify(next,null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  try{fs.renameSync(temp,statePath);}catch(err){fs.unlinkSync(temp);throw err;}
  return {revision:next.revision,savedAt:next.savedAt};
}
const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(req.headers.host!==`${host}:${port}`||req.headers.origin&&req.headers.origin!==origin){res.writeHead(403).end('Use the local planner address.');return;}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,origin).pathname);}catch{res.writeHead(400).end();return;}
  if(pathname==='/__planner/health'&&req.method==='GET'){send(res,200,{app:'zahra-budget-planner-local-v1',directory:__dirname,version:'2.0',storage:'disk'});return;}
  if(pathname==='/__planner/stop'&&req.method==='POST'){
    if(req.headers['x-planner-action']!=='stop'){res.writeHead(403).end();return;}
    await queue;res.writeHead(200).end('Planner stopped.');server.close();server.closeIdleConnections();return;
  }
  if(pathname==='/api/state'){
    if(req.method==='GET'){try{send(res,200,readState());}catch{send(res,500,{error:'The saved file could not be read. It has been left untouched. Restore an exported backup after repairing or moving data/state.json; automatic snapshots are in data/backups.'});}return;}
    if(req.method==='PUT'){
      if(req.headers['x-planner-action']!=='save'||!req.headers['content-type']?.startsWith('application/json')){res.writeHead(403).end();return;}
      try{const input=await body(req);const op=queue.then(()=>writeState(input.state,input.revision));queue=op.catch(()=>{});send(res,200,await op);}catch(err){send(res,err.status||400,{error:err.message});}return;
    }
  }
  if(pathname==='/api/migration-candidate'&&req.method==='GET'){
    const folder=path.join(path.dirname(dataDir),'backups');try{const files=fs.existsSync(folder)?fs.readdirSync(folder).filter(x=>x.endsWith('.json')).sort().reverse():[];const file=files[0];send(res,200,file?{filename:file,state:JSON.parse(fs.readFileSync(path.join(folder,file),'utf8'))}:{state:null});}catch{send(res,200,{state:null});}return;
  }
  if(pathname==='/api/art'&&req.method==='GET'){
    function scan(dir,prefix=''){if(!fs.existsSync(dir))return [];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?scan(path.join(dir,e.name),prefix+e.name+'/'):/\.(png|jpe?g|webp)$/i.test(e.name)?[prefix+e.name]:[]);}
    send(res,200,[...scan(imageDir),...scan(approvedDir,'approved/')]);return;
  }
  if(pathname==='/api/photo'&&req.method==='POST'){
    if(req.headers['x-planner-action']!=='photo'||!req.headers['content-type']?.startsWith('application/json')){res.writeHead(403).end();return;}
    try{const input=await body(req),m=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(input.data||'');if(!m)throw Error('Choose a JPEG, PNG or WebP picture.');
      const buf=Buffer.from(m[2],'base64');if(!buf.length||buf.length>6*1024*1024)throw Error('That picture is too large.');
      const slug=String(input.name||'photo').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'photo',dir=path.join(imageDir,'photos'),file=slug+'-'+Date.now()+'.'+(m[1]==='jpeg'?'jpg':m[1]);
      fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,file),buf);send(res,200,{file:'photos/'+file});}catch(err){send(res,400,{error:err.message});}return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  let target,mime;
  if(['/','/index.html'].includes(pathname)){target=path.join(__dirname,'dist/index.html');mime='text/html; charset=utf-8';}
  else if(pathname==='/guide.html'){target=path.join(__dirname,'guide.html');mime='text/html; charset=utf-8';}
  else if(pathname.startsWith('/art/')){
    const rel=pathname.slice(5),root=rel.startsWith('approved/')?approvedDir:imageDir;
    target=path.resolve(root,rel.startsWith('approved/')?rel.slice(9):rel);if(!target.startsWith(root+path.sep)||! /\.(png|jpe?g|webp)$/i.test(target)){res.writeHead(403).end();return;}
    mime=target.endsWith('.webp')?'image/webp':/\.jpe?g$/i.test(target)?'image/jpeg':'image/png';res.setHeader('Cache-Control','private, max-age=3600');
  }else{res.writeHead(404).end('Not found.');return;}
  fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end('File not found.');return;}res.writeHead(200,{'Content-Type':mime});res.end(req.method==='HEAD'?undefined:data);});
});
server.on('error',err=>{console.error(err.message);process.exitCode=1;});
server.listen(port,host,()=>console.log(`Budget Management 2 · ${origin}`));
