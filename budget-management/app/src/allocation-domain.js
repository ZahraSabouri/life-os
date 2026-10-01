/* Monthly allocations are a plan for remaining stock, never new purchases. */
function allocationGroups(s,mode='planned'){
 return catalogueEntries(s).flatMap(g=>{
  const rows=allocatableRows(s,g.rows.map(r=>r.id)),key=r=>unitKey(r.unit)+'|'+r.tracking+'|'+(r.receiptId||stockPurchase(s,r).date||'opening');
  return [...new Set(rows.map(key))].map(k=>({...g,key:g.key+'|'+k,rows:rows.filter(r=>key(r)===k)})).filter(group=>mode==='planned'?group.rows.some(r=>r.availableMonth):group.rows.every(r=>!r.availableMonth));
 });
}
function repeatMonthlyAmount(total,amount,from,to){
 need(/^\d{4}-(0[1-9]|1[0-2])$/.test(from)&&/^\d{4}-(0[1-9]|1[0-2])$/.test(to)&&to>=from,'Choose a valid range of months.');
 const n=positive(amount),out={};let month=from;
 while(month<=to&&Object.keys(out).length<120){out[month]=n;month=nextCalendarMonth(month);}
 need(month>to,'Choose at most 120 months.');
 const assigned=+(Object.keys(out).length*n).toFixed(6);need(assigned<=total+1e-6,'There is not enough remaining stock for that amount every month.');
 return {...out,'':+(total-assigned).toFixed(6)};
}
function allocatableRows(s,ids){
 const wanted=ids&&new Set(ids);
 return stockRows(s).filter(r=>(!wanted||wanted.has(r.id))&&r.remaining>0&&['count','measured'].includes(r.tracking)&&!r.scheduledDate&&!reservedAmount(s,r.id));
}
function allocationTotals(s,ids){
 const out={};for(const r of allocatableRows(s,ids)){const k=r.availableMonth||'';out[k]=+((out[k]||0)+r.remaining).toFixed(6);}return out;
}
function assignStockMonths(s,ids,targets,date=isoDate(new Date())){
 const rows=allocatableRows(s,ids);need(rows.length,'No unreserved stock is available to plan.');
 need(new Set(rows.map(r=>unitKey(r.unit))).size===1,'Plan different units separately.');
 need(new Set(rows.map(r=>r.tracking)).size===1,'Plan different tracking methods separately.');
 const total=+rows.reduce((n,r)=>n+r.remaining,0).toFixed(6);
 const chunks=Object.entries(targets).map(([month,value])=>{
   const amount=Number(value||0);need(month===''||/^\d{4}-(0[1-9]|1[0-2])$/.test(month),'Choose a valid month.');
   need(Number.isFinite(amount)&&amount>=0,'Enter zero or a positive amount.');
   need(rows[0].tracking!=='count'||rows.some(r=>!Number.isInteger(r.remaining))||Number.isInteger(amount),'Use whole quantities for counted stock.');
   return {month,amount};
 }).filter(x=>x.amount>0).sort((a,b)=>a.month.localeCompare(b.month));
 need(Math.abs(chunks.reduce((n,x)=>n+x.amount,0)-total)<1e-6,'Keep the total at '+displayQty(total,rows[0].unit)+'. Put anything unassigned in Any time.');
 let resources=[...s.resources],lots=[...s.lots],meta={...s.resourceMeta},index=0;
 for(const row of rows){
   const original=row.source==='lot'?s.lots.find(x=>x.id===row.id):s.resources.find(x=>x.id===row.id);
   let remaining=row.remaining,first=true;
   while(remaining>1e-6){
     while(chunks[index]?.amount<1e-6)index++;
     const chunk=chunks[index];need(chunk,'Allocation total did not reconcile.');
     const take=+Math.min(remaining,chunk.amount).toFixed(6),id=first?row.id:uid(row.source==='lot'?'lot':'res');
     if(row.source==='lot'){
       const used=first?original.quantity-original.remaining:0;
       const next={...original,id,quantity:+(used+take).toFixed(6),remaining:take,availableMonth:chunk.month,splitFrom:original.splitFrom||original.id};
       lots=first?lots.map(x=>x.id===row.id?next:x):[...lots,next];
     }else{
       const next={...original,id,qty:take,allocatedMonth:chunk.month,scope:undefined,availableFrom:undefined};
       if(!first)next.parentId=original.parentId||original.id;
       resources=first?resources.map(x=>x.id===row.id?next:x):[...resources,next];
       if(!first&&meta[row.id])meta[id]={...meta[row.id]};
     }
     remaining=+(remaining-take).toFixed(6);chunk.amount=+(chunk.amount-take).toFixed(6);first=false;
   }
 }
 return {...s,resources,lots,resourceMeta:meta,stockEvents:[...s.stockEvents,{id:uid('event'),sourceId:rows[0].id,name:rows[0].name,unit:rows[0].unit,action:'plan',amount:null,date,note:'Monthly allocation changed; '+displayQty(total,rows[0].unit)+' still at home.'}]};
}
function clearStockMonths(s,date=isoDate(new Date())){
 return {...s,resources:s.resources.map(r=>r.used?r:{...r,allocatedMonth:'',scope:undefined,availableFrom:undefined}),lots:s.lots.map(l=>l.remaining>0?{...l,availableMonth:''}:l),stockEvents:[...s.stockEvents,{id:uid('event'),sourceId:'monthly-plan',name:'Monthly allocation plan',action:'plan',amount:null,date,note:'Cleared month assignments. Stock, past usage, meal reservations and spending kept.'}]};
}
