const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({React:{createElement:()=>null}});
for(const f of ['core','seed','domain','types','allocation-domain','stock-flex-domain'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),ctx);
const a=vm.runInContext('({normalizeConnected,validateV4,remainingStockGroups,repackRemainingStock,checkout,useStock,undoStockEvent,stockAction,stockRows,entryFacts,allocationGroups,assignStockMonths,allocationTotals,repeatMonthlyAmount,catalogueEntries,editStockEvent})',ctx);
const plain=x=>JSON.parse(JSON.stringify(x));
const fresh=()=>a.normalizeConnected(JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/stock-before-review.json'))).state);
function lot(s,extra={}){const x={id:'flex-test',name:'Test chicken',itemId:'test-chicken',categoryId:'meat-fish-plant-proteins',tracking:'measured',unit:'g',quantity:500,remaining:400,purchased:'2026-09-12',location:'Freezer',...extra};s.lots.push(x);return x;}
test('repack only remaining stock, preserve money and old usage, and allow old usage to be undone',()=>{
 const s=fresh(),l=lot(s);s.items.push({id:l.itemId,name:l.name,categoryId:l.categoryId,unit:'pack',tracking:'count',observations:[]});
 s.stockEvents.push({id:'old-use',sourceId:l.id,name:l.name,action:'use',amount:100,unit:'g',date:'2026-09-13'});
 const n=a.validateV4(a.repackRemainingStock(s,[l.id],{total:4,unit:'portion',parts:4,tracking:'count',location:'Freezer'}));
 assert.equal(n.lots.find(x=>x.id===l.id).quantity,100);assert.equal(n.lots.find(x=>x.id===l.id).remaining,0);
 assert.equal(n.lots.filter(x=>x.repackedFrom?.includes(l.id)).reduce((t,x)=>t+x.remaining,0),4);
 for(const k of ['expenses','receipts','budgets','mealEntries','items'])assert.deepEqual(plain(n[k]),plain(s[k]));
 assert.deepEqual(plain(n.stockEvents.slice(0,-1)),plain(s.stockEvents));
 const back=a.undoStockEvent(n,'old-use');assert.equal(back.lots.find(x=>x.id===l.id).remaining,100);
 const facts=a.entryFacts(a.catalogueEntries(back).find(g=>g.item?.id===l.itemId));assert.equal(facts.mixed,true);assert.deepEqual(plain(facts.quantities).sort((a,b)=>a.unit.localeCompare(b.unit)),[{unit:'g',left:100},{unit:'portion',left:4}]);
});
test('new purchases never inherit an earlier portion conversion unless explicitly selected',()=>{
 const s=fresh();s.items.push({id:'test-chicken',name:'Test chicken',categoryId:'meat-fish-plant-proteins',tracking:'count',unit:'half-breast',stockPerUnit:8,stockUnit:'half-breast',observations:[]});
 const buy=(id,basis,custom={})=>a.checkout(s,{id,date:'2026-09-23',merchant:'Test shop',paidPence:500,lines:[{itemId:'test-chicken',name:'Test chicken',categoryId:'meat-fish-plant-proteins',quantity:1,unit:'pack',tracking:'count',stockBasis:basis,grossPence:500,...custom}]});
 const n=buy('as-bought','purchase');assert.equal(n.lots.at(-1).quantity,1);assert.equal(n.lots.at(-1).unit,'pack');assert.equal(n.lots.at(-1).availableMonth,undefined);
 const custom=buy('custom','custom',{stockQuantity:5,stockUnit:'portion'});assert.equal(custom.lots.at(-1).quantity,5);assert.equal(custom.lots.at(-1).unit,'portion');assert.equal(custom.items.find(i=>i.id==='test-chicken').stockPerUnit,8);
 assert.throws(()=>buy('missing','custom'),/greater than zero/);
});
test('mixed units cannot be consumed together; fractional amounts already recorded remain usable',()=>{
 const s=fresh();lot(s,{id:'pack',unit:'pack',tracking:'count',quantity:1,remaining:.5});lot(s,{id:'portion',unit:'portion',tracking:'count',quantity:4,remaining:4});
 assert.throws(()=>a.useStock(s,['pack','portion'],1,'2026-09-23'),/one unit/);
 const n=a.useStock(s,['pack'],.5,'2026-09-23');assert.equal(n.lots.find(l=>l.id==='pack').remaining,0);
 assert.equal(a.undoStockEvent(n,n.stockEvents.at(-1).id).lots.find(l=>l.id==='pack').remaining,.5);
 assert.throws(()=>a.useStock(s,['portion'],.5,'2026-09-23'),/whole/);
});
test('monthly plan excludes unassigned purchases, including Lidl, and repeating amounts conserves stock',()=>{
 const s=fresh(),groups=a.allocationGroups(s);assert.ok(groups.length);assert.ok(groups.every(g=>g.rows.some(r=>r.availableMonth)));
 const lidlIds=new Set(s.receipts.filter(r=>r.merchant==='Lidl').map(r=>r.id));assert.ok(groups.every(g=>g.rows.every(r=>!lidlIds.has(r.receiptId))));
 assert.ok(a.allocationGroups(s,'available').some(g=>g.rows.some(r=>lidlIds.has(r.receiptId))));
 assert.deepEqual(plain(a.repeatMonthlyAmount(20,3,'2026-10','2027-03')),{'2026-10':3,'2026-11':3,'2026-12':3,'2027-01':3,'2027-02':3,'2027-03':3,'':2});
 assert.throws(()=>a.repeatMonthlyAmount(10,3,'2026-10','2027-03'),/not enough/);
 const fractional=s.lots.find(l=>l.remaining===.5);assert.ok(fractional);const n=a.assignStockMonths(s,[fractional.id],{'2026-10':.5});assert.equal(a.stockRows(n).find(r=>r.id===fractional.id).remaining,.5);
});
test('remaining stock view excludes finished goods and separates units, purchases and locations',()=>{
 const s=fresh();lot(s,{id:'a',unit:'g',remaining:100,location:'Fridge'});lot(s,{id:'b',unit:'g',remaining:200,location:'Freezer'});lot(s,{id:'c',unit:'portion',remaining:3,location:'Freezer'});lot(s,{id:'d',unit:'portion',remaining:2,location:'Freezer',purchased:'2026-09-21'});lot(s,{id:'e',remaining:0});
 const groups=a.remainingStockGroups(s).filter(g=>g.name==='Test chicken');assert.equal(groups.length,4);assert.ok(groups.every(g=>g.rows.every(r=>r.remaining>0)));
});
test('repack rejects mixed products or purchases, reserved stock and same-unit quantity changes',()=>{
 const s=fresh();lot(s);lot(s,{id:'different',name:'Other chicken',itemId:'other'});lot(s,{id:'later',purchased:'2026-09-21'});const d={total:4,unit:'portion',parts:4,tracking:'count'};
 assert.throws(()=>a.repackRemainingStock(s,['flex-test','different'],d),/one product/);
 assert.throws(()=>a.repackRemainingStock(s,['flex-test','later'],d),/one purchase/);
 assert.throws(()=>a.repackRemainingStock(s,['flex-test'],{...d,total:5,unit:'g',tracking:'measured'}),/unchanged/);
 s.mealEntries.push({id:'reserved',status:'planned',reservations:[{sourceId:'flex-test',amount:50}]});assert.throws(()=>a.repackRemainingStock(s,['flex-test'],d),/reserved/);
});
test('old resource usage survives repacking and can still be undone in the original unit',()=>{
 let s=fresh();const r={id:'resource-chicken',name:'Test chicken',qty:3,unit:'fillet',allocatedMonth:'2026-10',category:'Food',storage:'Freezer',note:'',used:false,usedDate:''};s.resources.push(r);
 s=a.stockAction(s,r.id,'use',1,'2026-09-23');const ev=s.stockEvents.at(-1),used=plain(s.resources.filter(r=>r.used));
 const n=a.repackRemainingStock(s,[r.id],{total:100,unit:'g',parts:2,tracking:'measured'});assert.deepEqual(plain(n.resources.filter(r=>r.used)),used);
 const back=a.undoStockEvent(n,ev.id);assert.ok(a.stockRows(back).some(x=>x.name===r.name&&x.remaining===1&&x.unit===r.unit));
});
test('receipt/photo review is repeatable and retains every saved consumption record',()=>{
 const s=fresh(),{review}=require('../../review-purchases.cjs'),n=review(s).state;assert.deepEqual(plain(review(n).state),plain(n));
 for(const k of ['lots','stockEvents','mealEntries','budgets'])assert.deepEqual(plain(n[k]),plain(s[k]));
 assert.deepEqual(plain(n.resources.filter(r=>r.used)),plain(s.resources.filter(r=>r.used)));
 const qty=s=>s.resources.reduce((o,r)=>{const key=r.unit+'|'+r.allocatedMonth;o[key]=(o[key]||0)+(r.used?0:r.qty);return o;},{});assert.deepEqual(qty(n),qty(s));
 const oat=a.stockRows(n).filter(r=>/MOMA/.test(r.name));assert.equal(oat.filter(r=>/Raspberry/.test(r.name)).reduce((t,r)=>t+r.remaining,0),250);assert.equal(oat.filter(r=>/Pistachio/.test(r.name)).reduce((t,r)=>t+r.remaining,0),1000);
 const r=n.receipts.find(r=>r.date==='2026-09-21');assert.equal(r.paidPence,2176);assert.equal(r.lines.reduce((n,l)=>n+l.netPence,0)+r.feePence,r.paidPence);
});
