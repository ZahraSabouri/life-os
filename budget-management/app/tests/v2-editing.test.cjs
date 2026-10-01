const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({React:{createElement:()=>null}});for(const file of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file+'.js'),'utf8'),ctx);
const api=vm.runInContext('({migrateV4,defaultState,validateV4,budgetFigures,checkout,ledger,editExpense,editReceipt,recordMoneyBack,removeMoneyBack,moneyBackSplit,refundExpense,withDeletedExpense})',ctx);
const fresh=()=>api.migrateV4(api.defaultState());
const spent=(s,m='2026-09')=>api.budgetFigures(s,m).totalSpent;
function withOld(){const s=fresh();s.expenses=[...s.expenses,
  {id:'cider',date:'2026-09-16',amount:5,type:'grocery',category:'Eating out',note:'Cider with Shivalika'},
  {id:'wine',date:'2026-09-10',amount:5.76,type:'other',category:'Other',note:'Wine & Pizza with Shivalika'},
  {id:'sim',date:'2026-09-12',amount:10,type:'other',category:'Other',note:'SIM Card'}];return api.validateV4(s);}
const line=(name,p,cat='fruit-vegetables',other={})=>({name,grossPence:p,quantity:1,unit:'item',categoryId:cat,tracking:'none',...other});

test('editing a simple purchase changes name, amount, date, place and details',()=>{
  const s=withOld(),before=spent(s);
  const n=api.validateV4(api.editExpense(s,'cider',{note:'Cider at Tiny Rebel',pence:650,date:'2026-09-17',place:'Tiny Rebel, Cardiff',details:'With Shivalika after class'}));
  const x=n.expenses.find(e=>e.id==='cider');
  assert.equal(x.note,'Cider at Tiny Rebel');assert.equal(x.amount,6.5);assert.equal(x.date,'2026-09-17');
  assert.equal(x.place,'Tiny Rebel, Cardiff');assert.equal(x.details,'With Shivalika after class');
  assert.equal(Math.round((spent(n)-before)*100),150);
});
test('an old-version purchase keeps its category and grocery split unless a new one is chosen',()=>{
  const s=withOld(),n=api.editExpense(s,'cider',{note:'Cider'});
  const x=n.expenses.find(e=>e.id==='cider');
  assert.equal(x.categoryId,undefined);assert.equal(x.type,'grocery');assert.equal(x.category,'Eating out');
  assert.equal(api.budgetFigures(n,'2026-09').grocerySpent,api.budgetFigures(s,'2026-09').grocerySpent);
  const m=api.validateV4(api.editExpense(s,'cider',{categoryId:'restaurant-meals'})),y=m.expenses.find(e=>e.id==='cider');
  assert.equal(y.categoryId,'restaurant-meals');assert.equal(y.category,api.ledger(m).find(e=>e.id==='cider').category);
});
test('clearing place and details removes them',()=>{
  const s=api.editExpense(withOld(),'sim',{place:'Queen Street',details:'giffgaff'}),n=api.editExpense(s,'sim',{place:'  ',details:''});
  const x=n.expenses.find(e=>e.id==='sim');assert.equal('place' in x,false);assert.equal('details' in x,false);
});
test('bad edits are refused',()=>{
  const s=withOld();
  assert.throws(()=>api.editExpense(s,'sim',{pence:0}),/above £0/);
  assert.throws(()=>api.editExpense(s,'sim',{note:'  '}),/name/);
  assert.throws(()=>api.editExpense(s,'sim',{date:'2026-13-01'}),/date/);
  assert.throws(()=>api.editExpense(s,'nope',{}),/not found/);
});
test('one money back covering two purchases splits by what is left and lowers spending once',()=>{
  const s=withOld(),before=spent(s);
  const n=api.validateV4(api.recordMoneyBack(s,{from:'Shivalika',pence:800,date:'2026-09-18',expenseIds:['cider','wine']}));
  const back=n.adjustments.filter(a=>a.kind==='moneyback');
  assert.equal(back.length,2);assert.equal(new Set(back.map(a=>a.groupId)).size,1);
  assert.equal(back.reduce((t,a)=>t+a.pence,0),-800);
  assert.equal(back.map(a=>-a.pence).sort((a,b)=>a-b).join(','),'372,428');
  assert.equal(Math.round((before-spent(n))*100),800);
  const rows=api.ledger(n).filter(r=>r.refund);assert.equal(rows[0].note,'Money back from Shivalika');
});
test('money back cannot exceed what was spent, and removing it removes the whole payment',()=>{
  const s=withOld();
  assert.throws(()=>api.recordMoneyBack(s,{from:'Shivalika',pence:1077,date:'2026-09-18',expenseIds:['cider','wine']}),/more than is left/);
  assert.throws(()=>api.recordMoneyBack(s,{from:'',pence:100,date:'2026-09-18',expenseIds:['cider']}),/who/);
  assert.throws(()=>api.recordMoneyBack(s,{from:'Ben',pence:100,date:'2026-09-18',expenseIds:[]}),/Tick/);
  const n=api.recordMoneyBack(s,{from:'Shivalika',pence:1076,date:'2026-09-18',expenseIds:['cider','wine']});
  assert.throws(()=>api.recordMoneyBack(n,{from:'Shivalika',pence:1,date:'2026-09-18',expenseIds:['cider']}),/more than is left/);
  const back=api.removeMoneyBack(n,n.adjustments[0].id);assert.equal(back.adjustments.length,0);assert.equal(spent(back),spent(s));
});
test('a purchase with money back cannot be edited below what came back',()=>{
  const n=api.recordMoneyBack(withOld(),{from:'Ben',pence:300,date:'2026-09-18',expenseIds:['cider']});
  assert.throws(()=>api.editExpense(n,'cider',{pence:299}),/already come back/);
  assert.equal(api.editExpense(n,'cider',{pence:300}).expenses.find(e=>e.id==='cider').amount,3);
});
test('split preview matches what is saved',()=>{
  const s=withOld(),split=api.moneyBackSplit(s,800,['cider','wine']);
  const n=api.recordMoneyBack(s,{from:'S',pence:800,date:'2026-09-18',expenseIds:['cider','wine']});
  for(const x of split)assert.equal(-n.adjustments.find(a=>a.expenseId===x.id).pence,x.pence);
  assert.equal(api.moneyBackSplit(s,99999,['cider']),null);
});
test('editing a receipt line keeps the receipt balanced and the price history right',()=>{
  let s=api.checkout(fresh(),{id:'r1',date:'2026-09-17',merchant:'Lidl',place:'Newport Road',lines:[line('Milk',150),line('Bread',100)],discountPence:20,paidPence:230});
  assert.equal(s.receipts[0].place,'Newport Road');
  const milk=s.receipts[0].lines.find(l=>l.name==='Milk'),old=milk.netPence;
  const n=api.validateV4(api.editExpense(s,milk.id,{note:'Oat milk',pence:old+50,details:'on offer'}));
  const r=n.receipts[0],l=r.lines.find(x=>x.id===milk.id);
  assert.equal(l.name,'Oat milk');assert.equal(l.netPence,old+50);assert.equal(r.paidPence,280);
  assert.equal(n.expenses.find(e=>e.id===milk.id).note,'Lidl · Oat milk');
  const item=n.items.find(i=>i.id===l.itemId);assert(item.observations.some(o=>o.receiptId==='r1'&&o.linePence===old+50));
  assert.equal(Math.round((spent(n)-spent(s))*100),50);
});
test('editing a receipt moves every line to the new shop and date',()=>{
  let s=api.checkout(fresh(),{id:'r1',date:'2026-09-17',merchant:'Lidl',lines:[line('Milk',150),line('Bread',100)],feePence:30,paidPence:280});
  const n=api.validateV4(api.editReceipt(s,'r1',{merchant:'Aldi',date:'2026-09-19',place:'City Road'}));
  const mine=n.expenses.filter(e=>e.receiptId==='r1');
  assert.equal(mine.length,3);assert(mine.every(e=>e.date==='2026-09-19'));
  assert(mine.filter(e=>!e.id.endsWith('-fee')).every(e=>e.note.startsWith('Aldi · ')));
  assert.equal(n.receipts[0].place,'City Road');assert.equal(n.receipts[0].merchant,'Aldi');
  const fee=n.expenses.find(e=>e.id==='r1-fee'),m=api.validateV4(api.editExpense(n,fee.id,{pence:100}));
  assert.equal(m.receipts[0].feePence,100);assert.equal(m.receipts[0].paidPence,350);
});
test('old style refunds still work next to money back',()=>{
  let s=withOld();s=api.refundExpense(s,'sim',200,'2026-09-18');s=api.recordMoneyBack(s,{from:'Ben',pence:800,date:'2026-09-18',expenseIds:['sim']});
  api.validateV4(s);assert.throws(()=>api.recordMoneyBack(s,{from:'Ben',pence:1,date:'2026-09-18',expenseIds:['sim']}),/more than/);
  assert.equal(api.ledger(s).filter(r=>r.refund).map(r=>r.note).join('|'),'Refund · SIM Card|Money back from Ben');
});
