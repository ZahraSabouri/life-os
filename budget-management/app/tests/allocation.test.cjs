const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({React:{createElement:()=>null}});
for(const f of ['core','seed','domain','types','allocation-domain'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),ctx);
const a=vm.runInContext('({normalizeConnected,validateV4,allocatableRows,allocationTotals,assignStockMonths,clearStockMonths,stockAction,undoStockEvent,budgetFigures,stockRows,planMeal})',ctx);
const fresh=()=>a.normalizeConnected(JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/allocations-before-review.json'))).state);
const totals=s=>a.stockRows(s).reduce((o,r)=>{const k=r.name+'|'+r.unit;o[k]=+((o[k]||0)+r.remaining).toFixed(6);return o;},{});
test('every existing product can retain its plan without changing stock or money',()=>{
 const s=fresh(),groups=new Map();for(const r of a.allocatableRows(s)){const k=r.name+'|'+r.unit+'|'+r.tracking;groups.set(k,[...(groups.get(k)||[]),r.id]);}
 for(const [key,ids]of groups){const n=a.validateV4(a.assignStockMonths(s,ids,a.allocationTotals(s,ids)));assert.deepEqual(totals(n),totals(s),key);assert.equal(JSON.stringify(n.expenses),JSON.stringify(s.expenses));assert.equal(JSON.stringify(n.mealEntries),JSON.stringify(s.mealEntries));}
});
test('new receipt stock can be split by month, used early, and undone without losing historical usage',()=>{
 let s=fresh();s.lots.push({id:'test-lot',name:'Test tablets',quantity:10,remaining:8,unit:'tablet',tracking:'count',categoryId:'dishwashing'});
 s.stockEvents.push({id:'test-use',sourceId:'test-lot',name:'Test tablets',action:'use',amount:2,date:'2026-09-10'});
 const before=JSON.stringify(s),n=a.validateV4(a.assignStockMonths(s,['test-lot'],{'2026-10':3,'2026-11':3,'':2}));
 assert.equal(JSON.stringify(s),before);assert.equal(n.lots.filter(l=>l.name==='Test tablets').reduce((t,l)=>t+l.quantity,0),10);
 const october=n.lots.find(l=>l.name==='Test tablets'&&l.availableMonth==='2026-10');
 const used=a.stockAction(n,october.id,'use',1,'2026-09-23');assert.equal(used.stockEvents.at(-1).fromMonth,'2026-10');
 const undone=a.undoStockEvent(n,'test-use');assert.equal(undone.lots.filter(l=>l.name==='Test tablets').reduce((t,l)=>t+l.remaining,0),10);
});
test('clearing assignments preserves quantities, receipts, previous use and meal reservations',()=>{
 const s=fresh(),n=a.validateV4(a.clearStockMonths(s));assert.deepEqual(totals(n),totals(s));
 for(const key of ['expenses','receipts','adjustments','mealEntries'])assert.equal(JSON.stringify(n[key]),JSON.stringify(s[key]));
 assert.equal(JSON.stringify(n.stockEvents.slice(0,-1)),JSON.stringify(s.stockEvents));
 assert.ok(n.resources.filter(r=>!r.used).every(r=>!r.allocatedMonth));assert.ok(n.lots.filter(r=>r.remaining).every(r=>!r.availableMonth));
 assert.equal(JSON.stringify(n.resources.filter(r=>r.used)),JSON.stringify(s.resources.filter(r=>r.used)));
});
test('over-allocation, fractions of counted items and reserved stock are rejected without mutation',()=>{
 const s=fresh();s.lots.push({id:'test-lot',name:'Tablets',quantity:6,remaining:6,unit:'tablet',tracking:'count',categoryId:'dishwashing'});const before=JSON.stringify(s);
 assert.throws(()=>a.assignStockMonths(s,['test-lot'],{'2026-10':7}),/Keep the total/);
 assert.throws(()=>a.assignStockMonths(s,['test-lot'],{'2026-10':3.5,'':2.5}),/whole/);
 s.mealEntries.push({id:'test-meal',status:'planned',reservations:[{sourceId:'test-lot',amount:1}]});
 assert.throws(()=>a.assignStockMonths(s,['test-lot'],{'':6}),/No unreserved/);s.mealEntries.pop();assert.equal(JSON.stringify(s),before);
});
test('receipt reconciliation is idempotent and keeps all current settings, stock and cash',()=>{
 const s=fresh(),n=require('../../reconcile-september.cjs').reconcile(s),again=require('../../reconcile-september.cjs').reconcile(n);
 assert.equal(JSON.stringify(again),JSON.stringify(n));
 for(const key of ['resources','lots','stockEvents','mealEntries','budgets'])assert.equal(JSON.stringify(n[key]),JSON.stringify(s[key]));
 assert.equal(a.budgetFigures(n,'2026-09').totalSpent,a.budgetFigures(s,'2026-09').totalSpent);
 assert.equal(n.receipts.find(r=>r.id==='morrisons-2026-09-08').spreadMonths,6);
 assert.equal(n.receipts.find(r=>r.id==='receipt-lidl-2026-09-12-103970').paidPence,5128);
 assert.equal(n.items.filter(i=>/dry shampoo/i.test(i.name)).length,s.items.filter(i=>/dry shampoo/i.test(i.name)).length);
});
test('September start blocks earlier cash records, but allows catalogue references',()=>{
 const s=fresh();s.trackingStart='2026-09-08';a.validateV4(s);
 const n=JSON.parse(JSON.stringify(s));n.expenses[0].date='2026-09-07';assert.throws(()=>a.validateV4(n),/plan starts/);
 s.items[0].observations.push({date:'2026-02-07',quantity:1,linePence:100,merchant:'Amazon'});a.validateV4(s);
});
