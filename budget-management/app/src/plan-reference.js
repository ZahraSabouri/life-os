// A saved, purchase-specific reference. It never recreates stock or assigns new purchases.
function referenceStockRows(s,plan){
 const ids=new Set(plan.sourceIds),all=[...s.resources,...s.lots];
 let added=true;while(added){added=false;for(const r of all)if(!ids.has(r.id)&&(ids.has(r.parentId)||ids.has(r.splitFrom)||(r.repackedFrom||[]).some(id=>ids.has(id)))){ids.add(r.id);added=true;}}
 return stockRows(s).filter(r=>ids.has(r.id));
}
function savedShareSummary(rows){
 const parts=new Map();for(const r of rows.filter(r=>r.remaining>0&&['count','measured'].includes(r.tracking))){const label=displayQty(r.remaining,r.unit);parts.set(label,(parts.get(label)||0)+1);}
 return rows.length>1?[...parts].map(([label,n])=>n+' × '+label).join(' + '):'';
}
function originalPlanFacts(s,plan){
 const rows=referenceStockRows(s,plan),units=new Set(rows.map(r=>unitKey(r.unit))),same=units.size===1&&units.has(unitKey(plan.unit));
 const remaining=rows.reduce((n,r)=>n+r.remaining,0),used=rows.reduce((n,r)=>n+Math.max(0,r.quantity-r.remaining),0);
 const early=s.resources.filter(r=>rows.some(x=>x.id===r.id)&&r.used&&r.allocatedMonth&&r.usedDate&&r.usedDate.slice(0,7)<r.allocatedMonth).reduce((n,r)=>n+r.qty,0);
 const unmeasured=rows.some(r=>r.remaining>0&&(r.amountUnmeasured||r.tracking==='level'));
 return {rows,same,remaining,used,early,unmeasured};
}
function OriginalPlanReference({state:s}){
 const [query,setQuery]=useState(''),entries=(s.resourcePlanReference?.entries||[]).filter(p=>p.name.toLowerCase().includes(query.toLowerCase()));
 return e('section',{className:'surface original-plan'},e('h2',null,'Your original plan & recorded usage'),e('p',{className:'muted'},'The amounts you gave us, alongside what remains from that stock. This is a reference: early use reduces what is left, and future purchases keep their own portions. Change the active plan in In my monthly plan.'),e(Input,{label:'Find in your original plan',value:query,onChange:setQuery,placeholder:'Chicken, pasta, supplies…'}),entries.map(p=>{const f=originalPlanFacts(s,p);return e('article',{className:'reference-row',key:p.id},e('h3',null,p.name),e('p',null,p.portions),e('p',{className:'muted'},p.schedule),e('div',{className:'share-chips'},e('span',null,'Originally '+displayQty(p.total,p.unit)),e('span',null,!f.rows.length?'Remaining not recorded':!f.same?'Portions changed — see What’s left':f.unmeasured?'Remaining amount not measured':displayQty(f.remaining,p.unit)+' left'),f.same&&f.used>0&&e('span',null,displayQty(f.used,p.unit)+' recorded used'),f.same&&f.early>0&&e('span',null,displayQty(f.early,p.unit)+' used before the planned month')),p.note&&e('small',{className:'muted'},p.note));}),!entries.length&&e('p',null,s.resourcePlanReference?'No matching items.':'No original plan reference saved.'));
}
