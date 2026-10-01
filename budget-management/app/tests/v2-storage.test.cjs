const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{spawn}=require('node:child_process');
test('local persistence: reload, stale writers, backups, restore and corrupt-file protection',async()=>{
 const data=fs.mkdtempSync(path.join(__dirname,'storage-test-')),port=47833,base=`http://127.0.0.1:${port}`;
 const server=spawn(process.execPath,[path.join(__dirname,'../server-v2.cjs')],{env:{...process.env,BUDGET_PORT:String(port),BUDGET_DATA_DIR:data},windowsHide:true,stdio:'pipe'});
 const ctx=vm.createContext({React:{createElement:()=>null}});for(const file of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file+'.js'),'utf8'),ctx);const state=vm.runInContext('migrateV4(defaultState())',ctx);
 const put=(revision,state,headers={})=>fetch(base+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json','X-Planner-Action':'save',...headers},body:JSON.stringify({revision,state})});
 try{
   let ready=false;for(let i=0;i<50;i++){try{if((await fetch(base+'/__planner/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,40));}assert(ready,'server starts');
   assert.deepEqual(await (await fetch(base+'/api/state')).json(),{revision:0,state:null});
   let response=await put(0,state);assert.equal(response.status,200);assert.equal((await response.json()).revision,1);
   const current=await (await fetch(base+'/api/state')).json();assert.equal(current.revision,1);assert.equal(current.state.resources.length,state.resources.length);
   const outcomes=await Promise.all([put(1,state),put(1,state)]);assert.deepEqual(outcomes.map(x=>x.status).sort(),[200,409]);
   assert.equal((await (await fetch(base+'/api/state')).json()).revision,2);assert.equal(fs.readdirSync(path.join(data,'backups')).length,1);
   const backup=JSON.parse(fs.readFileSync(path.join(data,'backups',fs.readdirSync(path.join(data,'backups'))[0])));assert.equal(backup.revision,1);assert.equal(JSON.stringify(backup.state.resources),JSON.stringify(state.resources));
   response=await put(2,backup.state);assert.equal(response.status,200);assert.equal((await response.json()).revision,3);
   assert.equal((await put(3,state,{Origin:'https://untrusted.example'})).status,403);
   assert.equal((await fetch(base+'/api/state',{method:'PUT',body:JSON.stringify({revision:3,state})})).status,403);
   assert.equal((await fetch(base+'/data/state.json')).status,404);
   assert.equal((await fetch(base+'/art/..%2f..%2fdata/state.json')).status,403);
   const bad=JSON.parse(JSON.stringify(state));bad.lots=[{id:'bad',name:'Invalid',quantity:1,remaining:-1}];assert.equal((await put(3,bad)).status,400);assert.equal((await (await fetch(base+'/api/state')).json()).revision,3);
   fs.writeFileSync(path.join(data,'state.json'),'{broken');assert.equal((await fetch(base+'/api/state')).status,500);assert.equal((await put(3,state)).status,400);assert.equal(fs.readFileSync(path.join(data,'state.json'),'utf8'),'{broken');
 }finally{try{await fetch(base+'/__planner/stop',{method:'POST',headers:{'X-Planner-Action':'stop'}});}catch{}server.kill();}
});
