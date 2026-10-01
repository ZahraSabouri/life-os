const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({React:{createElement:()=>null}});for(const file of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file+'.js'),'utf8'),ctx);
const api=vm.runInContext('({migrateV4,defaultState,validateV4,stockRows,stockAction,useStock,pickStock,lastingInfo,setLasting,planMeal,cookMeal,eatMeal,usageLog,reservedAmount})',ctx);
const fresh=()=>api.migrateV4(api.defaultState());
const group=(s,name)=>api.stockRows(s).filter(r=>r.name===name);
const left=(s,name,month)=>group(s,name).filter(r=>!month||r.availableMonth===month).reduce((n,r)=>n+r.remaining,0);

test('using chicken takes this month first, then borrows from the next month',()=>{
  const s=fresh(),ids=group(s,'Chicken breast').map(r=>r.id),sep=left(s,'Chicken breast','2026-09'),oct=left(s,'Chicken breast','2026-10');
  assert(sep>=1&&oct>=1);
  const n=api.validateV4(api.useStock(s,ids,sep+1,'2026-09-22'));
  assert.equal(left(n,'Chicken breast','2026-09'),0);assert.equal(left(n,'Chicken breast','2026-10'),oct-1);
  const ev=n.stockEvents.slice(-(sep+1));assert.equal(ev.filter(e=>e.fromMonth==='2026-10').length,1);assert(ev.every(e=>e.name==='Chicken breast'));
});
test('the mini pizza set aside for October can be eaten in September',()=>{
  const s=fresh(),ids=group(s,'Mini pizza').map(r=>r.id),before=left(s,'Mini pizza');
  const n=api.validateV4(api.useStock(s,ids,1,'2026-09-22'));
  assert.equal(left(n,'Mini pizza'),before-1);assert.equal(left(n,'Mini pizza','2026-10'),0);
  assert.equal(n.stockEvents.at(-1).fromMonth,'2026-10');
});
test('using more than is at home, or half a counted item, is refused',()=>{
  const s=fresh(),ids=group(s,'Mini pizza').map(r=>r.id);
  assert.throws(()=>api.useStock(s,ids,99,'2026-09-22'),/only have/);
  assert.throws(()=>api.useStock(s,ids,0.5,'2026-09-22'),/whole number/);
  const oil=group(s,'Frylight olive-oil spray').map(r=>r.id);assert.throws(()=>api.useStock(s,oil,1,'2026-09-22'),/own card/);
});
test('stock kept for a planned meal is not used by accident',()=>{
  let s=fresh();const ids=group(s,'Mini pizza').map(r=>r.id);
  s=api.planMeal(s,{id:'m1',name:'Pizza night',date:'2026-09-26',slot:'dinner',servings:1,stock:[{name:'Mini pizza',unit:'pizza',amount:2,ids}]});
  assert.equal(s.mealEntries[0].reservations.length,2);
  assert.throws(()=>api.useStock(s,ids,1,'2026-09-22'),/planned meal/);
});
test('a long-lasting bottle is estimated from when it was opened',()=>{
  let s=fresh();const oil=group(s,'Current sunflower oil')[0];
  assert.equal(api.lastingInfo(oil).state,'unopened');
  s=api.stockAction(s,oil.id,'open',null,'2026-09-01');
  s=api.setLasting(s,oil.id,{lastsMonths:6});
  let row=group(s,'Current sunflower oil')[0],info=api.lastingInfo(row,'2026-12-01');
  assert.equal(info.state,'in-use');assert(Math.abs(info.left-0.5)<0.03,'about half after three months');
  s=api.stockAction(s,oil.id,'half',null,'2026-10-01');row=group(s,'Current sunflower oil')[0];info=api.lastingInfo(row,'2026-10-01');
  assert.equal(info.state,'half');assert.equal(info.runOut,'2026-10-31');assert(info.left<=0.5);
  s=api.stockAction(s,oil.id,'finish',null,'2026-11-20');api.validateV4(s);
  assert.equal(api.lastingInfo(group(s,'Current sunflower oil')[0]).state,'finished');
  assert.throws(()=>api.setLasting(s,oil.id,{lastsMonths:0}),/months/);
});
test('the months in a note set the starting estimate',()=>{
  const s=fresh(),spray=group(s,'Frylight olive-oil spray')[0];
  assert.equal(api.lastingInfo(spray).lasts,10);
});
test('a meal can use things straight from the cupboard, and eating it uses them',()=>{
  let s=fresh();const pizza=group(s,'Mini pizza').map(r=>r.id),oil=group(s,'Frylight olive-oil spray').map(r=>r.id);
  s=api.validateV4(api.eatMeal(s,{name:'Pizza',date:'2026-09-21',slot:'dinner',servings:1,stock:[{name:'Mini pizza',unit:'pizza',amount:1,ids:pizza},{name:'Frylight olive-oil spray',unit:'bottle',ids:oil}]}));
  const meal=s.mealEntries[0];assert.equal(meal.status,'cooked');assert.equal(meal.touches.length,1);assert.equal(meal.reservations[0].fromMonth,'2026-10');
  assert.equal(left(s,'Mini pizza'),left(fresh(),'Mini pizza')-1);
  assert.equal(api.lastingInfo(group(s,'Frylight olive-oil spray')[0],'2026-09-21').state,'in-use');
  const log=api.usageLog(s).filter(x=>x.date==='2026-09-21');
  assert(log.some(x=>x.kind==='meal'&&x.name==='Pizza'));
  assert(log.some(x=>x.name==='Mini pizza'&&x.meal==='Pizza'&&x.fromMonth==='2026-10'));
  assert(log.some(x=>x.name==='Frylight olive-oil spray'&&x.action==='touch'));
});
test('a meal asking for more than is at home lists the rest as still needed',()=>{
  let s=fresh();const pizza=group(s,'Mini pizza').map(r=>r.id),have=left(s,'Mini pizza');
  s=api.planMeal(s,{id:'m',name:'Party',date:'2026-09-26',servings:1,stock:[{name:'Mini pizza',unit:'pizza',amount:have+1,ids:pizza}]});
  assert.equal(s.mealEntries[0].missing[0].quantity,1);assert.throws(()=>api.cookMeal(s,'m'),/missing/);
});
test('editing a planned meal keeps its own reservation available to itself',()=>{
  let s=fresh();const pizza=group(s,'Mini pizza').map(r=>r.id),have=left(s,'Mini pizza');
  const d={id:'m',name:'Pizza',date:'2026-09-26',servings:1,stock:[{name:'Mini pizza',unit:'pizza',amount:have,ids:pizza}]};
  s=api.planMeal(s,d);s=api.planMeal(s,{...d,name:'Pizza night'});
  assert.equal(s.mealEntries.length,1);assert.equal(s.mealEntries[0].missing.length,0);api.validateV4(s);
});
test('the usage log does not count one use twice',()=>{
  let s=fresh();const tp=group(s,'Toilet paper');s=api.useStock(s,tp.map(r=>r.id),1,'2026-09-21');
  const log=api.usageLog(s).filter(x=>x.name==='Toilet paper');assert.equal(log.length,1);assert.equal(log[0].amount,1);
});
