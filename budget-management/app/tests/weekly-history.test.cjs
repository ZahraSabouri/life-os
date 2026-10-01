const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({React:{createElement:()=>null}});for(const f of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),ctx);
const api=vm.runInContext('({migrateV4,defaultState,stockRows,stockAction,useStock,eatMeal,weeklyUsage,weekStart,usageLog,withAmountAction,undoStockEvent,editStockEvent,uneatMeal})',ctx),fresh=()=>api.migrateV4(api.defaultState());
const ids=(s,name)=>api.stockRows(s).filter(r=>r.name===name).map(r=>r.id);
test('weeks span month, year and daylight-saving boundaries as seven local dates',()=>{
 for(const [date,start,end] of [['2026-10-01','2026-09-28','2026-10-04'],['2027-01-01','2026-12-28','2027-01-03'],['2026-10-25','2026-10-19','2026-10-25']]){const r=api.weeklyUsage(fresh(),date);assert.equal(r.start,start);assert.equal(r.end,end);assert.equal(r.days.length,7);}
 assert.throws(()=>api.weekStart('2026-02-30'));
});
test('same-name legacy and recorded portions on the same day are both retained',()=>{
 let s=fresh();const [a,b]=ids(s,'Chicken breast');s=api.stockAction(s,a,'use',1,'2026-09-22');s=api.withAmountAction(s,b,1,'use','2026-09-22');
 const log=api.usageLog(s).filter(x=>x.name==='Chicken breast');assert.equal(log.length,2);assert.equal(api.weeklyUsage(s,'2026-09-22').items[0].amount,2);
});
test('split portions are counted once and multiple uses aggregate accurately',()=>{
 let s=fresh();const id=ids(s,'Grated cheese')[0];s=api.stockAction(s,id,'use',30,'2026-09-21');s=api.stockAction(s,id,'use',20,'2026-09-21');
 const r=api.weeklyUsage(s,'2026-09-22');assert.equal(r.events.length,2);assert.equal(r.items[0].amount,50);assert.equal(r.itemCount,1);
});
test('meals and their ingredients stay linked, with no duplicate item consumption',()=>{
 let s=fresh();s=api.eatMeal(s,{name:'Pizza night',date:'2026-09-21',slot:'dinner',servings:1,stock:[{name:'Mini pizza',unit:'pizza',amount:1,ids:ids(s,'Mini pizza')}]});
 const before=JSON.stringify(s),r=api.weeklyUsage(s,'2026-09-22');assert.equal(r.meals.length,1);assert.equal(r.items.length,1);assert.equal(r.items[0].amount,1);assert.equal(r.items[0].events[0].mealId,r.meals[0].mealId);assert.equal(JSON.stringify(s),before);
 s=api.uneatMeal(s,s.mealEntries[0].id);assert.equal(api.weeklyUsage(s,'2026-09-22').events.length,0);
});
test('waste, returns, corrections and bottle levels are not counted as consumption',()=>{
 let s=fresh();const oil=ids(s,'Current sunflower oil')[0],chicken=ids(s,'Chicken breast');
 s=api.stockAction(s,oil,'open',null,'2026-09-21');s=api.stockAction(s,chicken[0],'waste',1,'2026-09-21');s=api.stockAction(s,chicken[1],'return',1,'2026-09-22');s.stockEvents.push({id:'correction',action:'correct',date:'2026-09-22',sourceId:oil});
 let r=api.weeklyUsage(s,'2026-09-22');assert.equal(r.itemCount,0);assert.equal(r.waste.length,1);assert.equal(r.events.length,3);
 s=api.stockAction(s,oil,'touch',null,'2026-09-22');s=api.stockAction(s,oil,'finish',null,'2026-09-23');r=api.weeklyUsage(s,'2026-09-22');assert.equal(r.items[0].amount,0);assert.equal(r.items[0].unmeasured,2);
});
test('dates and undo update weekly history without touching other weeks',()=>{
 let s=fresh();s=api.stockAction(s,ids(s,'Chicken breast')[0],'use',1,'2026-09-20');assert.equal(api.weeklyUsage(s,'2026-09-22').itemCount,0);
 s=api.editStockEvent(s,s.stockEvents.at(-1).id,{amount:1,date:'2026-09-21'});assert.equal(api.weeklyUsage(s,'2026-09-22').itemCount,1);s=api.undoStockEvent(s,s.stockEvents.at(-1).id);assert.equal(api.weeklyUsage(s,'2026-09-22').itemCount,0);
});
test('different units never combine into a misleading quantity',()=>{
 let s=fresh();s.stockEvents=[{id:'a',sourceId:'missing-a',name:'Rice',unit:'g',amount:100,action:'use',date:'2026-09-21'},{id:'b',sourceId:'missing-b',name:'Rice',unit:'portion',amount:1,action:'use',date:'2026-09-21'}];const r=api.weeklyUsage(s,'2026-09-22');assert.equal(r.items.length,2);assert.deepEqual(Array.from(r.items.map(x=>[x.unit,x.amount])).sort(),[['g',100],['portion',1]]);assert.equal(r.itemCount,1);
});
