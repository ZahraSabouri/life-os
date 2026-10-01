function stockLocationKey(value){const x=String(value||'Not recorded').trim();return /freezer/i.test(x)?'Freezer':/fridge/i.test(x)?'Fridge':/pantry|cupboard/i.test(x)?'Cupboard / pantry':x;}
function remainingStockGroups(s){
 return catalogueEntries(s).flatMap(g=>{const grouped=new Map();for(const r of g.rows.filter(r=>r.remaining>0)){
  const purchase=stockPurchase(s,r),key=[stockLocationKey(r.location),unitKey(r.unit),r.tracking,r.receiptId||purchase.date||'opening'].join('|');
  if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(r);
 }return [...grouped].map(([key,rows])=>({...g,key:g.key+'|'+key,entryKey:g.key,rows,location:stockLocationKey(rows[0].location),unit:rows[0].unit,tracking:rows[0].tracking,left:+rows.reduce((n,r)=>n+r.remaining,0).toFixed(6)}));}).sort((a,b)=>a.name.localeCompare(b.name));
}
function repackRemainingStock(s,ids,d,date=isoDate(new Date())){
 const wanted=new Set(ids),rows=stockRows(s).filter(r=>wanted.has(r.id));need(rows.length===wanted.size&&rows.length,'Choose existing stock.');
 need(rows.every(r=>r.remaining>0&&['count','measured'].includes(r.tracking)),'Choose remaining food or counted supplies.');
 need(rows.every(r=>!r.scheduledDate&&!reservedAmount(s,r.id)),'Stock reserved for a meal or a date must stay intact.');
 need(new Set(rows.map(r=>unitKey(r.unit))).size===1,'Change one stock unit at a time.');
 const entries=catalogueEntries(s),entry=entries.find(g=>g.rows.some(r=>r.id===rows[0].id));
 need(entry&&rows.every(r=>entry.rows.some(x=>x.id===r.id)),'Change one product at a time.');
 const purchases=rows.map(r=>stockPurchase(s,r));need(new Set(rows.map((r,i)=>r.receiptId||purchases[i].date||'opening')).size===1,'Change one purchase at a time.');
 const total=positive(d.total),parts=Number(d.parts||1),unit=String(d.unit||'').trim(),tracking=d.tracking;
 need(unit&&unit.length<=60,'Name the unit, for example g, fillet or portion.');need(['count','measured'].includes(tracking),'Choose counted or measured stock.');
 need(Number.isInteger(parts)&&parts>=1&&parts<=1000,'Choose 1 to 1,000 portions.');
 need(tracking!=='count'||Number.isInteger(total)&&Number.isInteger(total/parts),'Each counted portion must contain a whole quantity. Use measured tracking for fractions.');
 const before=+rows.reduce((n,r)=>n+r.remaining,0).toFixed(6);
 need(unitKey(unit)!==unitKey(rows[0].unit)||Math.abs(before-total)<1e-6,'Repacking keeps the amount when the unit is unchanged. Use Correct amount for a stock-count correction.');
 const first=rows[0],purchase=purchases[0],resource=first.source==='resource'?s.resources.find(r=>r.id===first.id):null;
 const receiptId=first.receiptId||resource?.receiptId||s.receipts.find(r=>r.date===purchase.date&&r.lines.some(l=>l.itemId===first.itemId))?.id;
 const receiptLineId=first.receiptLineId||s.receipts.find(r=>r.id===receiptId)?.lines.find(l=>l.itemId===first.itemId)?.id;
 // Retain the already-used part of a lot in its original unit so old usage can still be undone.
 const lots=s.lots.flatMap(l=>{if(!wanted.has(l.id))return [l];const used=+(l.quantity-l.remaining).toFixed(6);return used>0?[{...l,quantity:used,remaining:0}]:[];});
 const created=[],each=total/parts;
 for(let i=0;i<parts;i++){const amount=i===parts-1?+(total-created.reduce((n,l)=>n+l.quantity,0)).toFixed(6):+each.toFixed(6);
  created.push(makeLot({name:first.name,itemId:entry.item?.id||first.itemId,categoryId:first.categoryId,quantity:amount,remaining:amount,unit,tracking,location:String(d.location||first.location),receiptId,receiptLineId,purchased:purchase.date,merchant:purchase.shop,availableMonth:'',notes:String(d.note||''),repackedFrom:rows.map(r=>r.id),repackedOn:date}));
 }
 return {...s,resources:s.resources.filter(r=>!wanted.has(r.id)),lots:[...lots,...created],stockEvents:[...s.stockEvents,{id:uid('event'),sourceId:created[0].id,action:'repack',date,name:first.name,unit,amount:null,note:displayQty(before,first.unit)+' repacked as '+displayQty(total,unit)+' in '+parts+' portions. Earlier usage unchanged.',from:rows.map(r=>({id:r.id,amount:r.remaining,unit:r.unit})),to:created.map(l=>l.id)}]};
}
