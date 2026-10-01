const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const path=require('node:path');const ctx=vm.createContext({React:{createElement:()=>null}});for(const file of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file+'.js'),'utf8'),ctx);
const api=vm.runInContext('({migrateV4,defaultState,validateV4,stockRows,stockAction,useStock,catalogueEntries,entryFacts,entryHistory,planMeal,cookMeal,eatMeal,lastingInfo,makeLot,undoStockEvent,editStockEvent,editStockRow,monthlyPlan,setMonthlyPlan,uneatMeal,putBack,editUsedDate,usageLog})',ctx);
const fresh=()=>api.migrateV4(api.defaultState());
const entry=(s,name)=>api.catalogueEntries(s).find(g=>g.rows.some(r=>r.name===name));
const facts=(s,name)=>api.entryFacts(entry(s,name));
test('undoing a use puts the roll back and removes it from history',()=>{
  let s=fresh();const ids=entry(s,'Toilet paper').rows.map(r=>r.id);s=api.useStock(s,ids,1,'2026-09-21');
  assert.equal(facts(s,'Toilet paper').left,17);const ev=s.stockEvents.at(-1);
  const n=api.validateV4(api.undoStockEvent(s,ev.id));assert.equal(facts(n,'Toilet paper').left,18);assert.equal(facts(n,'Toilet paper').total,18);
  assert.equal(n.resources.filter(r=>r.name==='Toilet paper').length,1,'split share merged back');assert.equal(api.entryHistory(n,entry(n,'Toilet paper')).length,0);
});
test('changing how many were used and when',()=>{
  let s=fresh();const ids=entry(s,'Toilet paper').rows.map(r=>r.id);s=api.useStock(s,ids,1,'2026-09-21');
  s=api.validateV4(api.editStockEvent(s,s.stockEvents.at(-1).id,{amount:2,date:'2026-09-20'}));
  assert.equal(facts(s,'Toilet paper').left,16);const h=api.entryHistory(s,entry(s,'Toilet paper'));assert.equal(h.length,1);assert.equal(h[0].amount,2);assert.equal(h[0].date,'2026-09-20');
});
test('undoing a pizza borrowed from October returns it to October',()=>{
  let s=fresh();const ids=entry(s,'Mini pizza').rows.map(r=>r.id);s=api.useStock(s,ids,1,'2026-09-22');
  s=api.validateV4(api.undoStockEvent(s,s.stockEvents.at(-1).id));
  assert(api.stockRows(s).some(r=>r.name==='Mini pizza'&&r.availableMonth==='2026-10'&&r.remaining===1));
});
test('bottle history can be undone: finished, then opened',()=>{
  let s=fresh();const oil=api.stockRows(s).find(r=>r.name==='Current sunflower oil');
  s=api.stockAction(s,oil.id,'open',null,'2026-09-01');s=api.stockAction(s,oil.id,'finish',null,'2026-11-01');
  assert.equal(api.lastingInfo(api.stockRows(s).find(r=>r.id===oil.id)).state,'finished');
  s=api.validateV4(api.undoStockEvent(s,s.stockEvents.at(-1).id));let row=api.stockRows(s).find(r=>r.id===oil.id);
  assert.equal(row.remaining,1);assert.equal(api.lastingInfo(row,'2026-11-02').state,'in-use');
  s=api.undoStockEvent(s,s.stockEvents.at(-1).id);row=api.stockRows(s).find(r=>r.id===oil.id);assert.equal(api.lastingInfo(row).state,'unopened');
  s=api.stockAction(s,oil.id,'open',null,'2026-09-01');s=api.editStockEvent(s,s.stockEvents.at(-1).id,{date:'2026-08-15'});
  assert.equal(api.stockRows(s).find(r=>r.id===oil.id).opened,'2026-08-15');
});
test('a lot can be corrected: size, what is left, name',()=>{
  let s=fresh();s={...s,lots:[...s.lots,api.makeLot({name:'Soy sauce',quantity:1,unit:'bottle',tracking:'count',added:'2026-09-20'})]};const id=s.lots.at(-1).id;
  s=api.validateV4(api.editStockRow(s,id,{name:'Kikkoman soy sauce',quantity:2,remaining:1}));const l=s.lots.find(x=>x.id===id);
  assert.equal(l.name,'Kikkoman soy sauce');assert.equal(l.quantity,2);assert.equal(l.remaining,1);
  assert.throws(()=>api.editStockRow(s,id,{remaining:3}),/between 0/);
});
test('a share can move to another month or become any-time',()=>{
  let s=fresh();const r=s.resources.find(x=>x.name==='Mini pizza'&&x.allocatedMonth==='2026-12');
  s=api.validateV4(api.editStockRow(s,r.id,{allocatedMonth:'2026-09'}));assert.equal(s.resources.find(x=>x.id===r.id).allocatedMonth,'2026-09');
  s=api.editStockRow(s,r.id,{allocatedMonth:''});assert.equal(s.resources.find(x=>x.id===r.id).allocatedMonth,'');
  assert.throws(()=>api.editStockRow(s,r.id,{allocatedMonth:'Sept'}),/month/);
});
test('the monthly plan can be rebalanced, and the change is noted in the history',()=>{
  let s=fresh();const ids=entry(s,'Chicken breast').rows.map(r=>r.id),before=api.monthlyPlan(s,ids),total=Object.values(before).reduce((a,b)=>a+b,0);
  const target={...before,'2026-09':(before['2026-09']||0)+1,'2027-02':(before['2027-02']||0)-1};
  s=api.validateV4(api.setMonthlyPlan(s,ids,target,'2026-09-22'));const ids2=entry(s,'Chicken breast').rows.map(r=>r.id),after=api.monthlyPlan(s,ids2);
  assert.equal(after['2026-09'],target['2026-09']);assert.equal(after['2027-02'],target['2027-02']);assert.equal(Object.values(after).reduce((a,b)=>a+b,0),total);
  const h=api.entryHistory(s,entry(s,'Chicken breast'));assert.equal(h[0].action,'plan');assert.match(h[0].note||s.stockEvents.at(-1).note,/Sept|Sep/);
  assert.equal(api.usageLog(s).filter(x=>x.action==='plan').length,1);
  s=api.setMonthlyPlan(s,ids2,{...after,'':2},'2026-09-22');assert.equal(api.monthlyPlan(s,entry(s,'Chicken breast').rows.map(r=>r.id))[''],2);
  assert.throws(()=>api.setMonthlyPlan(s,ids2,{'2026-10':1.5}),/whole/);
});
test('a meal marked eaten by mistake can be un-eaten, and the cupboard comes back',()=>{
  let s=fresh();const pizza=entry(s,'Mini pizza').rows.map(r=>r.id),oil=entry(s,'Current sunflower oil').rows.map(r=>r.id),left=facts(s,'Mini pizza').left;
  s=api.eatMeal(s,{id:'m',name:'Pizza',date:'2026-09-21',slot:'dinner',servings:1,stock:[{name:'Mini pizza',unit:'pizza',amount:1,ids:pizza},{name:'Sunflower oil',unit:'bottle',ids:oil}]});
  assert.equal(facts(s,'Mini pizza').left,left-1);
  s=api.validateV4(api.uneatMeal(s,'m'));assert.equal(s.mealEntries[0].status,'planned');assert.equal(facts(s,'Mini pizza').left,left);
  assert.equal(s.stockEvents.filter(e=>e.mealId==='m').length,0);assert.equal(api.lastingInfo(api.stockRows(s).find(r=>r.name==='Current sunflower oil')).state,'unopened');
  s=api.cookMeal(s,'m');assert.equal(facts(s,'Mini pizza').left,left-1);
});
test('an old used record can be put back or re-dated',()=>{
  let s=fresh();const r=s.resources.find(x=>x.name==='Tuna'&&!x.used);s={...s,resources:s.resources.map(x=>x.id===r.id?{...x,used:true,usedDate:'2026-09-05'}:x)};
  s=api.editUsedDate(s,r.id,'2026-09-06');assert.equal(s.resources.find(x=>x.id===r.id).usedDate,'2026-09-06');
  s=api.validateV4(api.putBack(s,r.id));assert.equal(s.resources.find(x=>x.id===r.id).used,false);
});
test('subscriptions renew themselves on their day, once',()=>{
  let s=fresh();s.subscriptions=[{id:'sim',name:'SIM card',costPence:1000,categoryId:'ai-software',interval:'monthly',nextDue:'2026-10-12',anchorDay:12,paused:false,auto:true},{id:'man',name:'Manual',costPence:500,categoryId:'ai-software',interval:'monthly',nextDue:'2026-10-01',anchorDay:1,paused:false,auto:false}];
  const f=vm.runInContext('({autoPaySubscriptions,subscriptionsDue,budgetFigures})',ctx);
  assert.equal(f.autoPaySubscriptions(s,'2026-10-11'),s);
  const n=api.validateV4(f.autoPaySubscriptions(s,'2026-11-13'));
  const sim=n.expenses.filter(x=>x.note==='SIM card · subscription');assert.equal(sim.length,2);assert.equal(n.subscriptions[0].nextDue,'2026-12-12');
  assert.equal(n.expenses.filter(x=>/Manual/.test(x.note||'')).length,0,'manual ones wait for confirmation');
  assert.equal(f.autoPaySubscriptions(n,'2026-11-13'),n);
  assert.equal(Math.round(f.budgetFigures(n,'2026-10').totalSpent*100)-Math.round(f.budgetFigures(s,'2026-10').totalSpent*100),1000);
  assert.equal(f.subscriptionsDue(n,'2026-12','2026-11-13').length,2);
});
