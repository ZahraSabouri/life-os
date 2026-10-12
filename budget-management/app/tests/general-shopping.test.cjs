const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({React:{createElement:()=>null}});for(const f of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),ctx);
const a=vm.runInContext('({newBudgetState,migrateV4,validateV4,addListLine,tickListLine,shoppingRows,groupShopping,shoppingTimingLabel,forecast,budgetMonthChoices})',ctx),plain=x=>JSON.parse(JSON.stringify(x));
test('a new plan has no personal inventory, spending, shopping, meals or preset allowance',()=>{
 const s=a.migrateV4(a.newBudgetState());a.validateV4(s);for(const key of ['resources','expenses','items','lists','receipts','lots','stockEvents','mealEntries','recipes','subscriptions','shops'])assert.equal(s[key].length,0);assert.deepEqual(plain(s.budgets),{});assert.equal(s.foodPlan,undefined);assert.equal(s.trackingStart,undefined);
 assert(a.budgetMonthChoices(s,'2032-07').includes('2032-07'));
});
test('undated and weekly shopping lists save without an invented shopping day',()=>{
 let s=a.newBudgetState();s.lists=[{id:'wish',name:'Someday',date:'',lines:[]},{id:'week',name:'This week',date:'',weekOf:'2032-07-12',lines:[]}];a.validateV4(s);
 assert.equal(a.shoppingTimingLabel(s.lists[0]),'Someday · no date');assert.throws(()=>a.validateV4({...s,lists:[{id:'bad',name:'Bad',date:'2032-07-13',weekOf:'2032-07-12',lines:[]}]}),/shopping list/);
 s=a.addListLine(s,'wish',{name:'Desk',quantity:1,estimatePence:5000});s=a.addListLine(s,'week',{name:'Soap',quantity:1,estimatePence:200});
 assert.equal(a.forecast(s,'2032-07').plannedPence,200);assert.equal(a.shoppingRows(s).find(r=>r.list.id==='wish').date,'');assert.equal(a.shoppingRows(s).find(r=>r.list.id==='week').weekOf,'2032-07-12');
 const groups=a.groupShopping(a.shoppingRows(s),'date');assert(groups.some(g=>g.key===''));assert(groups.some(g=>g.key==='week:2032-07-12'));
});
test('ticking an undated wish preserves money and cupboard stock',()=>{
 let s=a.newBudgetState();s.lists=[{id:'wish',name:'Someday',date:'',lines:[]}];s=a.addListLine(s,'wish',{name:'Desk',quantity:1});const next=a.validateV4(a.tickListLine(s,'wish',s.lists[0].lines[0].id,true,'2032-07-13'));
 assert.equal(next.lists[0].lines[0].status,'bought');assert.deepEqual(plain(next.expenses),plain(s.expenses));assert.deepEqual(plain(next.lots),plain(s.lots));
});
