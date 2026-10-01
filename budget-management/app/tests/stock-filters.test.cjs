const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({React:{createElement:()=>null}});for(const f of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),ctx);
const api=vm.runInContext('({resourceCategory,migrateV4,defaultState,validateV4,stockRows,stockAction,catalogueEntries,makeLot,stockPurchase,purchaseRange,filterStockPurchases,setPurchaseDetails,knownShops})',ctx);
const fresh=()=>api.migrateV4(api.defaultState());
// Two trips for the same item: one with a receipt, one added by hand; plus an untracked plan share.
function sample(){
 let s=fresh();const cat=s.categories.find(c=>c.id!=='uncategorised').id;
 const receipt={id:'r-lidl',date:'2026-09-21',merchant:'Lidl',channel:'in-store',paidPence:150,lines:[{id:'l1',name:'Eggs',quantity:1,grossPence:150,netPence:150,categoryId:cat}]};
 const a=api.makeLot({name:'Eggs',quantity:6,unit:'egg',tracking:'count',categoryId:cat,receiptId:'r-lidl',receiptLineId:'l1',purchased:'2026-09-21',merchant:'Wrong shop'});
 const b=api.makeLot({name:'Eggs',quantity:6,unit:'egg',tracking:'count',categoryId:cat,purchased:'2026-09-02',merchant:'Morrisons'});
 const c=api.makeLot({name:'Rice',quantity:1000,unit:'g',tracking:'measured',categoryId:'uncategorised'});
 s={...s,receipts:[...s.receipts,receipt],lots:[...s.lots,a,b,c]};
 return {s,a,b,c,cat};
}
const rowOf=(s,id)=>api.stockRows(s).find(r=>r.id===id);
const names=gs=>gs.map(g=>g.name).sort();

test('receipts are the source of truth for where and when something was bought',()=>{
 const {s,a,b,c}=sample();
 assert.deepEqual({...api.stockPurchase(s,rowOf(s,a.id))},{date:'2026-09-21',shop:'Lidl',shopKey:'lidl',fromReceipt:true});
 assert.equal(api.stockPurchase(s,rowOf(s,b.id)).shop,'Morrisons');
 assert.deepEqual({...api.stockPurchase(s,rowOf(s,c.id))},{date:'',shop:'',shopKey:'',fromReceipt:false});
 assert.equal(api.stockPurchase({...s,lots:s.lots.map(l=>l.id===b.id?{...l,purchased:'2026-02-30'}:l)},{...rowOf(s,b.id),purchased:'2026-02-30'}).date,'');
});

test('shop filter keeps only the matching trip of an item and supports "not recorded"',()=>{
 const {s,a,b,c}=sample(),groups=api.catalogueEntries(s);
 const lidl=api.filterStockPurchases(s,groups,{shop:'lidl'});
 const eggs=lidl.find(g=>g.rows.some(r=>r.id===a.id));
 assert.ok(eggs);assert.deepEqual([...eggs.rows.map(r=>r.id)],[a.id]);assert.equal(eggs.purchaseFiltered,true);
 const unknown=api.filterStockPurchases(s,groups,{shop:'__unknown'});
 assert.ok(unknown.some(g=>g.rows.some(r=>r.id===c.id)));
 assert.ok(!unknown.some(g=>g.rows.some(r=>r.id===a.id||r.id===b.id)));
});

test('purchase date filters: today, week, month, range, not recorded and invalid ranges',()=>{
 const {s,a,b,c}=sample(),groups=api.catalogueEntries(s),has=(gs,id)=>gs.some(g=>g.rows.some(r=>r.id===id));
 const f=o=>api.filterStockPurchases(s,groups,{...o,today:'2026-09-22'});
 assert.ok(has(f({period:'week'}),a.id));assert.ok(!has(f({period:'week'}),b.id));
 assert.ok(has(f({period:'month'}),b.id));assert.ok(!has(f({period:'month'}),c.id));
 assert.ok(!has(f({period:'today'}),a.id));
 assert.ok(has(f({period:'range',from:'2026-09-01',to:'2026-09-05'}),b.id));assert.ok(!has(f({period:'range',from:'2026-09-01',to:'2026-09-05'}),a.id));
 assert.ok(has(f({period:'range',from:'2026-09-21'}),a.id));
 assert.ok(has(f({period:'unknown'}),c.id));assert.ok(!has(f({period:'unknown'}),a.id));
 assert.equal(f({period:'range',from:'2026-09-10',to:'2026-09-01'}).length,0);
 assert.deepEqual({...api.purchaseRange('month','','','2028-02-10')},{from:'2028-02-01',to:'2028-02-29'});
 assert.deepEqual({...api.purchaseRange('week','','','2026-09-27')},{from:'2026-09-21',to:'2026-09-27'});
});

test('category filter combines with shop and date',()=>{
 const {s,a,cat}=sample(),groups=api.catalogueEntries(s);
 const out=api.filterStockPurchases(s,groups,{categoryId:cat,shop:'lidl',period:'range',from:'2026-09-21',to:'2026-09-21'});
 assert.ok(out.length>=1);assert.ok(out.every(g=>g.rows.every(r=>(g.item?.categoryId||r.categoryId)===cat)));
 assert.ok(out.some(g=>g.rows.some(r=>r.id===a.id)));
 assert.equal(api.filterStockPurchases(s,groups,{categoryId:'uncategorised',shop:'lidl'}).some(g=>g.rows.some(r=>r.id===a.id)),false);
});

test('recording shop and date for plan shares and packs, never overriding receipts',()=>{
 let {s,a,c}=sample();const share=s.resources.find(r=>!r.used);
 s=api.setPurchaseDetails(s,[share.id,c.id,a.id],{shop:' Morrisons ',date:'2026-09-05'});
 api.validateV4(s);
 assert.deepEqual({...api.stockPurchase(s,rowOf(s,share.id))},{date:'2026-09-05',shop:'Morrisons',shopKey:'morrisons',fromReceipt:false});
 assert.equal(api.stockPurchase(s,rowOf(s,c.id)).shop,'Morrisons');
 assert.equal(api.stockPurchase(s,rowOf(s,a.id)).shop,'Lidl');
 // A blank (undefined) field is left alone; an empty string clears it.
 s=api.setPurchaseDetails(s,[c.id],{date:'2026-09-06'});assert.equal(api.stockPurchase(s,rowOf(s,c.id)).shop,'Morrisons');
 s=api.setPurchaseDetails(s,[c.id],{shop:''});assert.equal(api.stockPurchase(s,rowOf(s,c.id)).shop,'');assert.equal(api.stockPurchase(s,rowOf(s,c.id)).date,'2026-09-06');
 assert.throws(()=>api.setPurchaseDetails(s,[a.id],{shop:'Aldi'}),/receipt/);
 assert.throws(()=>api.setPurchaseDetails(s,[c.id],{date:'2026-13-01'}));
 assert.throws(()=>api.setPurchaseDetails(s,[c.id],{}));
 assert.deepEqual([...api.knownShops({...s,receipts:[...s.receipts,{merchant:'lidl'}]})],['Lidl','Morrisons']);
});

test('portions split from a share keep its purchase details',()=>{
 let s=fresh();const share=s.resources.find(r=>!r.used&&['g','ml'].includes(r.unit)&&Number(r.qty)>=20&&!r.scheduledDate);
 s=api.setPurchaseDetails(s,[share.id],{shop:'Morrisons',date:'2026-09-05'});
 s=api.stockAction(s,share.id,'use',10,isoToday());
 const family=s.resources.filter(r=>r.id===share.id||r.parentId===share.id);
 assert.ok(family.length>=2);
 for(const r of family)assert.equal(r.merchant,'Morrisons');
 const unknown=api.filterStockPurchases(s,api.catalogueEntries(s),{shop:'__unknown'});
 assert.ok(!unknown.some(g=>g.rows.some(r=>family.some(f=>f.id===r.id))));
});
function isoToday(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}

test('plan shares get the right category ("steak" is not tea)',()=>{
 assert.equal(api.resourceCategory({name:'5% steak mince'}),'meat-fish-plant-proteins');
 assert.equal(api.resourceCategory({name:'Fruit tea'}),'tea-coffee-soft-drinks');
 assert.equal(api.resourceCategory({name:'Thin ham'}),'meat-fish-plant-proteins');
});
