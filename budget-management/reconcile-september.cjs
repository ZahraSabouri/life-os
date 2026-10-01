const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const ctx=vm.createContext({React:{createElement:()=>null}});
for(const name of ['core','seed','domain','types','clarity-domain'])vm.runInContext(fs.readFileSync(path.join(__dirname,'app/src',name+'.js'),'utf8'),ctx);
const api=vm.runInContext('({checkout,validateV4,normalizeConnected,budgetFigures,classifyTypeId})',ctx);
const receiptId='receipt-lidl-2026-09-12-103970';
// Transcribed from the signed-in Lidl receipt. Prices are actual line totals;
// the onion and nectarine reductions stay on their own lines.
const lines=[
 ['Antipasti Pepper',1,199,'tins-jars-pulses'],['Ancient Grain Roll',4,140,'bread-bakery'],
 ['Rice Crackers Sweet Chilli',1,89,'snacks-treats'],['6 Welsh Large Free-Range Eggs',1,169,'eggs-dairy'],
 ['Dry Shampoo: Sweet Pink',2,278,'hair-care'],['Rice Snacks Chilli',1,165,'snacks-treats'],
 ['Tefal Light Cook Wok',1,1999,'kitchen-equipment'],['Teriyaki Salmon Rolls',1,349,'fresh-convenience-food'],
 ['Cucumber',1,99,'fruit-vegetables'],['Large Red Onions',1,79,'fruit-vegetables',95],
 ['Dipsauce Squeeze Garlic Mayo',1,89,'sauces-condiments'],['Aberdeen Angus Beef Burgers',1,699,'meat-fish-plant-proteins'],
 ['Green Pitted Olives',1,89,'tins-jars-pulses'],['Nectarines 1kg',1,159,'fruit-vegetables',179],
 ['Garlic',1,45,'fruit-vegetables'],['All Purpose Seasoning',1,75,'spices-baking'],
 ['Italian Herb Seasoning',1,79,'spices-baking'],['Sweet & Crunchy Salad',1,78,'fruit-vegetables'],
 ['Ready to Eat Avocado',1,139,'fruit-vegetables'],['Belgian Chocolate Cookies',2,110,'snacks-treats']
];
function reconcile(input){
 let s=api.normalizeConnected(JSON.parse(JSON.stringify(input)));
 const before=Math.round(api.budgetFigures(s,'2026-09').totalSpent*100),stock=JSON.stringify([s.resources,s.lots,s.stockEvents,s.mealEntries]);
 if(!s.receipts.some(r=>r.id===receiptId)){
   const old=s.expenses.filter(x=>['exp_0jqga9ir','exp_nz7ytpqz'].includes(x.id));
   assert.equal(old.length,2,'Expected the two original Lidl payment records');
   assert.equal(old.reduce((n,x)=>n+Math.round(x.amount*100),0),5128,'Original Lidl total changed; stop for review');
   assert.ok(old.every(x=>x.date==='2026-09-12'&&!x.receiptId));
   assert.ok(!s.adjustments.some(x=>old.some(e=>e.id===x.expenseId)),'Refund links need review');
   const normalize=x=>String(x).toLowerCase().replace(/[^a-z0-9]/g,'');
   const mapped=lines.map(([name,quantity,grossPence,categoryId,regularPence])=>{
     const item=s.items.find(i=>[i.name,...(i.aliases||[])].some(n=>normalize(n)===normalize(name)||name==='Italian Herb Seasoning'&&n==='Italian Herb Season'||name==='6 Welsh Large Free-Range Eggs'&&i.id==='usual-2370a85730de'||name==='Dry Shampoo: Sweet Pink'&&i.id==='usual-7d5d29d5654c'));
     assert.ok(s.categories.some(c=>c.id===categoryId),'Unknown category '+categoryId);
     return {name,quantity,grossPence,categoryId,itemId:item?.id,unit:'item',tracking:'none',offer:!!regularPence,regularPence};
   });
   assert.equal(mapped.reduce((n,l)=>n+l.grossPence,0),5128);
   s={...s,expenses:s.expenses.filter(x=>!old.some(e=>e.id===x.id))};
   s=api.checkout(s,{id:receiptId,date:'2026-09-12',merchant:'Lidl',channel:'in-store',place:'Splott, Cardiff',paidPence:5128,discountPence:0,feePence:0,lines:mapped,note:'Verified against Lidl digital receipt on 22 September 2026. Replaces the existing £33.29 groceries + £17.99 pan entries; no extra spending or stock added. Actual wok price £19.99. £0.36 of line discounts are already included.'});
   s.receipts=s.receipts.map(r=>r.id===receiptId?{...r,sourceUrl:'https://www.lidl.co.uk/mre/purchase-detail?client_id=GreatBritainRetailClient&country_code=gb&language=en-GB&t=130015637320260912103970',verifiedOn:'2026-09-22',discountPence:36,lines:r.lines.map(l=>({...l,grossPence:l.regularPence||l.grossPence}))}:r);
 }
 s.trackingStart='2026-09-08';
 s.receipts=s.receipts.map(r=>r.id==='morrisons-2026-09-08'?{...r,sourceUrl:'https://www.amazon.co.uk/uff/your-account/order-details?orderID=204-3363747-8200329',verifiedOn:'2026-09-22'}:r);
 api.validateV4(s);
 assert.equal(Math.round(api.budgetFigures(s,'2026-09').totalSpent*100),before,'Reconciliation must preserve total spending');
 assert.equal(JSON.stringify([s.resources,s.lots,s.stockEvents,s.mealEntries]),stock,'Do not change recorded stock or consumption');
 return s;
}
module.exports={reconcile};
if(require.main===module){const file=path.join(__dirname,'data/state.json'),wrapped=JSON.parse(fs.readFileSync(file));wrapped.state=reconcile(wrapped.state);fs.writeFileSync(file,JSON.stringify(wrapped,null,2));console.log('Lidl reconciled; total spending, stock and consumption unchanged.');}
