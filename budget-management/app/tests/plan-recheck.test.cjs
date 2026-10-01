const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),{reconcile}=require(path.join(root,'recheck-2026-09-25/reconcile-plan.cjs'));
const fresh=()=>JSON.parse(fs.readFileSync(path.join(root,'recheck-2026-09-25/before.json'))).state;
const ctx=vm.createContext({React:{createElement:()=>null}});for(const f of ['core','seed','domain','types','plan-reference'])vm.runInContext(fs.readFileSync(path.join(root,'app/src',f+'.js'),'utf8'),ctx);
const a=vm.runInContext('({stockRows,originalPlanFacts,referenceStockRows,savedShareSummary,stockAction,normalizeConnected})',ctx),plain=x=>JSON.parse(JSON.stringify(x));
test('original-plan reconciliation conserves all saved use, lots, money and reservations; repeating it is a no-op',()=>{
 const s=fresh(),n=reconcile(s);for(const k of ['expenses','receipts','adjustments','budgets','lots','stockEvents','mealEntries'])assert.deepEqual(n[k],s[k]);
 assert.deepEqual(n.resources.filter(r=>r.used),s.resources.filter(r=>r.used));assert.deepEqual(reconcile(n),n);
 assert.deepEqual(plain(a.normalizeConnected(n).resourcePlanReference),n.resourcePlanReference);
});
test('chicken has six future portions and six spare after one already eaten',()=>{
 const n=reconcile(fresh()),r=n.resources.filter(r=>r.name==='Chicken breast'&&!r.used),totals=r.reduce((o,r)=>(o[r.allocatedMonth||'any']=(o[r.allocatedMonth||'any']||0)+r.qty,o),{});
 assert.deepEqual(totals,{any:6,'2026-10':1,'2026-11':1,'2026-12':2,'2027-01':1,'2027-02':1});
});
test('late consumption before applying the review is never replenished from spare chicken',()=>{
 const s=fresh(),r=s.resources.find(r=>r.name==='Chicken breast'&&r.allocatedMonth==='2026-10'&&!r.used);r.used=true;r.usedDate='2026-09-25';
 const n=reconcile(s);assert.equal(n.resources.filter(r=>r.name==='Chicken breast'&&r.allocatedMonth==='2026-10'&&!r.used).length,0);assert.deepEqual(n.resources.filter(r=>r.used),s.resources.filter(r=>r.used));
});
test('pasta becomes four exact 125 g portions; marmalade stays one jar with two measured shares',()=>{
 const n=reconcile(fresh());for(const name of ['Linguine','Fusilli']){const rows=n.resources.filter(r=>r.name===name);assert.equal(rows.length,4);assert.ok(rows.every(r=>r.qty===125));assert.equal(rows.reduce((n,r)=>n+r.qty,0),500);}
 const m=a.stockRows(n).filter(r=>r.name==='Orange marmalade');assert.equal(m.length,2);assert.ok(m.every(r=>r.tracking==='measured'&&r.remaining===210));
});
test('reference follows partial use and excludes new purchases of the same product',()=>{
 let s=reconcile(fresh());const p=s.resourcePlanReference.entries.find(x=>x.name==='5% steak mince'),id=p.sourceIds[0];s=a.stockAction(s,id,'use',25,'2026-09-25');
 s.lots.push({id:'new-mince',itemId:s.resourceMeta[id].itemId,name:'5% steak mince',quantity:500,remaining:500,unit:'g',tracking:'measured'});
 const f=a.originalPlanFacts(s,p);assert.equal(f.remaining,475);assert.equal(f.used,25);assert.equal(f.early,25);assert.ok(!f.rows.some(r=>r.id==='new-mince'));
});
test('receipt source quantities and pennies match the fresh signed-in receipt review',()=>{
 const s=fresh();
 // In app receipt order. Quantities above 1 are recorded separately below.
 const expected={
 'morrisons-2026-09-08':[80,300,120,175,250,125,150,140,160,125,115,135,155,80,275,100,225,170,95,235,350,200,80,300,205,215,130,140,125,120,335,300,110,140,195,1275,479,100,100,350,175,350,425,150,315,237,320,250,200,235,550,1000,60,550,425,860,335,69,150,150,165,165],
 'receipt-lidl-2026-09-12-103970':[199,140,89,169,278,165,1999,349,99,79,89,699,89,159,45,75,79,78,139,110],
 'receipt-lidl-2026-09-21-1301':[349,179,185,149,139,95,49,229,159,99,169,178,79,58,40]
 };
 const quantities={'morrisons-2026-09-08':{4:2,45:3},'receipt-lidl-2026-09-12-103970':{1:4,4:2,19:2},'receipt-lidl-2026-09-21-1301':{11:2,13:2}};
 for(const [id,prices] of Object.entries(expected)){const r=s.receipts.find(r=>r.id===id);assert.deepEqual(r.lines.map(l=>l.netPence),prices);assert.deepEqual(r.lines.map(l=>l.quantity),prices.map((_,i)=>quantities[id][i]||1));assert.equal(prices.reduce((a,b)=>a+b,0)+(r.feePence||0),r.paidPence);}
 assert.equal(s.receipts.find(r=>r.id==='receipt-lidl-2026-09-21-1301').paidPence,2176);
});
