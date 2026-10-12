/* Recipes, preparation and eating share the same stock ledger. */
const basePlanMeal = planMeal, baseCookMeal = cookMeal, baseUneatMeal = uneatMeal, baseUsageLog = usageLog, baseWeeklyUsage = weeklyUsage;
function preparedLots(s,id){return s.lots.filter(l=>l.mealId===id&&l.prepared);}
planMeal = function connectedMealPlan(s,d){
  if(!d.preparedFrom){
    let next=basePlanMeal(s,d);
    if(d.kind==='prep'&&d.id){const children=next.mealEntries.filter(m=>m.status==='planned'&&m.preparedFrom===d.id);need(children.reduce((n,m)=>n+m.servings,0)<=d.servings,'This batch needs enough portions for its linked meals.');for(const child of children)next=planMeal(next,child);}
    return next;
  }
  need(d.preparedFrom!==d.id,'A meal cannot use itself as a prepared batch.');
  const batch=s.mealEntries.find(m=>m.id===d.preparedFrom);
  need(batch&&batch.kind==='prep'&&batch.status!=='skipped','Choose a preparation batch.');
  need(d.date>=batch.date,'This meal is before its preparation batch.');
  const lots=preparedLots(s,batch.id),n=positive(d.servings||1);
  const planned=s.mealEntries.filter(m=>m.status==='planned'&&m.id!==d.id&&m.preparedFrom===batch.id).reduce((a,m)=>a+m.servings,0);
  if(batch.status==='planned')need(planned+n<=batch.servings,'This batch does not make enough portions for these meals.');
  const extra=(d.stock||[]).filter(p=>!(p.ids||[]).some(id=>s.lots.some(l=>l.id===id&&l.mealId===batch.id)));
  const input={...d,recipeId:'',kind:'leftovers',servings:n,stock:[...(lots.length?[{name:lots[0].name,unit:'serving',amount:n,ids:lots.map(l=>l.id)}]:[]),...extra]};
  const next=basePlanMeal(s,input);
  return {...next,mealEntries:next.mealEntries.map(m=>m.id===(d.id||next.mealEntries.at(-1).id)?{...m,waitingForPrep:!lots.length}:m)};
};
cookMeal = function connectedMealConsumption(s,id,leftovers=0,force=false,options={}){
  let m=s.mealEntries.find(x=>x.id===id);
  need(m?.status==='planned','This meal is already completed.');
  const date=options.date||m.date;need(validDate(date),'Choose a valid date.');
  if(m.preparedFrom){
    need(preparedLots(s,m.preparedFrom).length,'Prepare the linked batch first.');
    s=planMeal(s,m);m=s.mealEntries.find(x=>x.id===id);
    need(!m.missing.length,'There are not enough prepared portions left.');
    need(!leftovers,'Eating prepared portions cannot create another batch.');
  }
  if(m.kind==='prep'&&!options.preparing)throw Error('Use “Prepare this batch” to cook it without marking it eaten.');
  const expired=m.reservations.map(r=>stockRows(s).find(x=>x.id===r.sourceId)).filter(r=>r?.expiry&&r.expiryType==='use-by'&&r.expiry<date);
  need(!expired.length,'Check the use-by date before using '+expired.map(r=>r.name).join(', ')+'.');
  const before=new Set(s.lots.map(l=>l.id));
  s={...s,mealEntries:s.mealEntries.map(x=>x.id===id?{...x,date}:x)};
  let next=baseCookMeal(s,id,leftovers,force);
  next={...next,lots:next.lots.map(l=>!before.has(l.id)&&l.mealId===id?{...l,prepared:true,preparedDate:date,location:options.location||'Fridge',expiry:options.expiry||'',expiryType:options.expiry?'use-by':'best-before',notes:'Prepared portions. Ingredients were used once when this batch was cooked. Storage date is entered by you.'}:l),mealEntries:next.mealEntries.map(x=>x.id===id?{...x,cookedDate:date,prepOnly:!!options.preparing}:x)};
  if(options.preparing&&options.freezerServings){
    const frozen=Number(options.freezerServings);need(Number.isInteger(frozen)&&frozen>0&&frozen<=leftovers,'Choose how many whole portions to freeze.');
    next={...next,lots:next.lots.flatMap(l=>!before.has(l.id)&&l.mealId===id?[...(frozen<leftovers?[{...l,quantity:leftovers-frozen,remaining:leftovers-frozen,location:'Fridge'}]:[]),{...l,id:frozen<leftovers?uid('lot'):l.id,quantity:frozen,remaining:frozen,location:'Freezer',expiry:'',expiryType:'best-before'}]:[l])};
  }
  for(const meal of next.mealEntries.filter(x=>x.status==='planned'&&x.preparedFrom===id))next=planMeal(next,meal);
  return next;
};
function prepareMeal(s,id,options={}){
  const m=s.mealEntries.find(x=>x.id===id);need(m?.kind==='prep','Choose a meal-prep batch.');
  need(!options.expiry||validDate(options.expiry)&&options.expiry>=(options.date||m.date),'Check the storage date.');
  need(['Fridge','Freezer'].includes(options.location||'Fridge'),'Choose fridge or freezer.');
  return cookMeal(s,id,m.servings,false,{...options,preparing:true});
}
function skipWorkflowMeal(s,id){
  const meal=s.mealEntries.find(m=>m.id===id);need(meal?.status==='planned','This meal is already completed.');
  return {...s,mealEntries:s.mealEntries.map(m=>m.id===id||meal.kind==='prep'&&m.preparedFrom===id&&m.status==='planned'?{...m,status:'skipped',reservations:[],touches:[]}:m)};
}
uneatMeal = function undoConnectedMeal(s,id){
  const m=s.mealEntries.find(x=>x.id===id);need(m?.status==='cooked','This meal is not completed.');
  const lots=s.lots.filter(l=>l.mealId===id);
  need(!lots.some(l=>l.remaining<l.quantity),'Some prepared portions have already been used. Undo those meals first.');
  let next={...s,mealEntries:s.mealEntries.map(x=>x.status==='planned'&&x.preparedFrom===id?{...x,reservations:[],stock:[],waitingForPrep:true}:x)};
  next=baseUneatMeal(next,id);
  return {...next,mealEntries:next.mealEntries.map(x=>x.id===id?{...x,prepOnly:false,cookedDate:undefined}:x)};
};
usageLog = function connectedUsageLog(s){
  return baseUsageLog(s).map(x=>x.kind==='meal'&&s.mealEntries.find(m=>m.id===x.mealId)?.prepOnly?{...x,kind:'prep',action:'prepared'}:x);
};
weeklyUsage=function connectedWeeklyUsage(s,date){
  const report=baseWeeklyUsage(s,date),prep=usageLog(s).filter(x=>x.kind==='prep'&&x.date>=report.start&&x.date<=report.end);
  const events=[...report.events,...prep].sort((a,b)=>a.date.localeCompare(b.date));
  return {...report,events,prepared:prep,activeDays:new Set(events.map(x=>x.date)).size,days:report.days.map(d=>({...d,events:events.filter(x=>x.date===d.date)}))};
};
function recordReceiptDraft(s,d,replaceId,pendingId){
  if(!replaceId){const next=checkout(s,d);return pendingId?{...next,pendingPayments:(s.pendingPayments||[]).filter(x=>x.id!==pendingId)}:next;}
  const old=s.receipts.find(r=>r.id===replaceId);need(old,'The payment being replaced is no longer here.');
  need(old.lines.length===1&&old.lines[0].tracking==='none'&&!replaceId.startsWith('subscription-'),'Choose a simple payment estimate, not an itemised purchase or renewal.');
  need(!blocked(removalImpact(s,{receiptId:replaceId})),'This payment has linked stock, use or money back. Edit it from its details.');
  const audit={id:uid('reconciliation'),previousReceipt:clone(old),previousExpenses:clone(s.expenses.filter(x=>x.receiptId===replaceId)),replacementReceiptId:d.id};
  const next=checkout(cancelReceipt(s,replaceId),d);
  return {...next,receiptReconciliations:[...(s.receiptReconciliations||[]),audit]};
}
function recipeAvailability(s,r,date=isoDate(new Date())){
  const d={id:'recipe-preview',recipeId:r.id,date,name:r.name,servings:r.servings};
  const meal=planMeal(s,d).mealEntries.find(x=>x.id===d.id);
  return {meal,ready:!meal.missing.length};
}
function moveFoodStock(s,ids,location,date=isoDate(new Date())){
  need(validDate(date)&&['Fridge','Freezer','Cupboard'].includes(location),'Choose a place and date.');
  const rows=stockRows(s).filter(r=>ids.includes(r.id)&&r.remaining>0);need(rows.length,'There is none left to move.');
  const meta={...s.resourceMeta};for(const r of rows.filter(x=>x.source==='resource'))meta[r.id]={...meta[r.id],location};
  return {...s,resourceMeta:meta,lots:s.lots.map(l=>ids.includes(l.id)&&l.remaining>0?{...l,location}:l),stockEvents:[...s.stockEvents,...rows.map(r=>({id:uid('event'),sourceId:r.id,date,action:'store',name:r.name,unit:r.unit,amount:null,note:'Moved to '+location}))]};
}
/* Pasted receipt text is a draft. No stock or spending changes until checkout. */
function parseReceiptText(s,text){
  const raw=String(text||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean),lines=[];
  let paidPence=null,date='',merchant='',last=null;
  for(let i=0;i<raw.length;i++){
    const line=raw[i];
    if(/\blidl\b/i.test(line))merchant='Lidl';
    const dm=/\b(?:Date:\s*)?(\d{2})\/(\d{2})\/(\d{2}|\d{4})\b/.exec(line);
    if(dm)date=(dm[3].length===2?'20'+dm[3]:dm[3])+'-'+dm[2]+'-'+dm[1];
    if(/^TOTAL\s*[:£]?\s*(\d+\.\d{2})?$/i.test(line)){const v=line.match(/\d+\.\d{2}/)?.[0]||raw[i+1];if(/^\d+\.\d{2}$/.test(v||''))paidPence=pennies(v);continue;}
    if(/^Price Cut$/i.test(line)&&last){const cut=/^-([\d]+\.\d{2})$/.exec(raw[i+1]||'');if(cut){last.grossPence-=pennies(cut[1]);last.offer=true;i++;}continue;}
    const match=/^(.+?)\s+£?(\d+\.\d{2})\s*(?:[AB])?$/.exec(line);
    const pipes=line.split('|').map(x=>x.trim());
    if(!match&&pipes.length!==2)continue;
    let name=pipes.length===2?pipes[0]:match[1],price=pipes.length===2?pipes[1]:match[2];
    if(!name||/^(TOTAL|CARD|Amount|VAT|A |B |Date|SALE|TOTAL DISCOUNT)/i.test(name)||!/^\d+\.\d{2}$/.test(price))continue;
    const multi=/\s+(\d+)\s*[x×]\s*£?\d+\.\d{2}\s*$/.exec(name),quantity=multi?Number(multi[1]):1;
    if(multi)name=name.slice(0,multi.index).trim();
    name=name.replace(/\s+\d{7}$/,'');
    const item=itemIndex(s).get(itemKey(name)),filed=typeof classifyTypeId==='function'?classifyTypeId(s,name,'uncategorised'):'',cat=item?.categoryId||(filed&&typeof typeNode==='function'?typeNode(s,filed)?.categoryId:'')||'uncategorised';
    last={key:uid('draftline'),name,quantity,unit:'pack',categoryId:cat,itemId:item?.id,grossPence:pennies(price),tracking:'none',bought:true,stockBasis:'purchase',location:'Cupboard'};lines.push(last);
  }
  need(lines.length,'No item lines found. Paste receipt text or use “name | line total”.');
  need(lines.every(l=>l.grossPence>=0),'A line discount is larger than its price.');
  return {merchant,date,paidPence:paidPence??lines.reduce((n,l)=>n+l.grossPence,0),lines:lines.map(l=>({...l,price:(l.grossPence/100).toFixed(2)}))};
}
