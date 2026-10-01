// Reconcile only the specific stock facts stated in the user's supplied Claude prompts.
const assert=require('node:assert/strict');
function correctKnownStock(s){
 const changes=[];if(s.stockReview?.oatFlavours)return changes;
 const ids=['res_k2mp467k','res_bs9eap6g','res_308l1t34','res_o32w38cq','res_2hutcqkr','res_4saroxn5'];
 const rows=ids.map(id=>s.resources.find(r=>r.id===id));
 // Do not override a later correction by the user.
 if(rows.some(r=>!r)||rows.map(r=>r.qty).join(',')!=='400,50,350,400,400,400'||rows.map(r=>!!r.used).join(',')!=='true,false,true,false,false,false')return ['Oat-drink quantities changed since review; retained for manual checking.'];
 const raspberry=s.items.find(i=>/MOMA Raspberry/.test(i.name)),pistachio=s.items.find(i=>/MOMA Pistachio/.test(i.name)),receipt=s.receipts.find(r=>r.id==='morrisons-2026-09-08');
 assert.ok(raspberry&&pistachio&&receipt);
 const usedBefore=JSON.stringify(s.resources.filter(r=>r.used)),events=JSON.stringify(s.stockEvents),before={};
 for(const r of rows)before[r.allocatedMonth]=(before[r.allocatedMonth]||0)+(r.used?0:r.qty);
 const split={...rows[3],id:'review-moma-pistachio-dec',qty:200,parentId:rows[3].id};assert.ok(!s.resources.some(r=>r.id===split.id));
 rows[3].qty=200;s.resources.push(split);
 for(const r of [...rows,split]){
  const item=[ids[0],ids[1],ids[2],ids[3]].includes(r.id)?raspberry:pistachio;
  const line=receipt.lines.find(l=>l.itemId===item.id);assert.ok(line);
  s.resourceMeta[r.id]={...s.resourceMeta[r.id],itemId:item.id,name:item.name,categoryId:item.categoryId,receiptId:receipt.id,receiptLineId:line.id,purchased:receipt.date,merchant:receipt.merchant};
  if(!r.used){r.name=item.name;r.storage=item.id===raspberry.id?'Fridge':'Pantry';r.note='Flavour separated using your recorded 750 ml raspberry consumption; original monthly totals preserved.';}
 }
 const after={};for(const r of [...rows,split])after[r.allocatedMonth]=(after[r.allocatedMonth]||0)+(r.used?0:r.qty);
 assert.deepEqual(after,before);assert.equal(JSON.stringify(s.resources.filter(r=>r.used)),usedBefore);assert.equal(JSON.stringify(s.stockEvents),events);
 const peach=s.resources.find(r=>!r.used&&/peach/i.test(r.name));
 if(peach){peach.storage='Fridge';peach.note='You recorded opening this tin and keeping it in the fridge. Remaining amount has not been measured.';s.resourceMeta[peach.id]={...s.resourceMeta[peach.id],amountUnmeasured:true};}
 s.stockReview={...s.stockReview,oatFlavours:'2026-09-23'};
 changes.push('Separated saved oat drinks: 250 ml raspberry in fridge, 1,000 ml pistachio in pantry; 750 ml already used and monthly totals preserved.');
 if(peach)changes.push('Opened peaches moved to Fridge; remaining amount labelled unmeasured.');
 return changes;
}
module.exports={correctKnownStock};
