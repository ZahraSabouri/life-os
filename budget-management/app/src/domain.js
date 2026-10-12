/* Version 4 domain operations. Amounts in new records are integer pennies.
   Original allocations remain in resources, without migration changes. */
const clone = x => JSON.parse(JSON.stringify(x));
function need(ok,message){if(!ok)throw new Error(message);}
function pennies(value,blank=false){
  if(value===''||value==null){if(blank)return null;throw new Error('Enter an amount.');}
  need(/^\d+(\.\d{1,2})?$/.test(String(value)),'Use pounds and up to two decimal places.');
  const n=Math.round(Number(value)*100);need(Number.isSafeInteger(n)&&n<=100000000,'Amount is too large.');return n;
}
function positive(value){const n=Number(value);need(Number.isFinite(n)&&n>0&&n<=1e8,'Enter a quantity greater than zero.');return n;}
function category(s,id){return s.categories.find(c=>c.id===id)||s.categories.find(c=>c.id==='uncategorised');}
function validateV4(s){
  need(s&&s.version===4,'Unsupported backup version.');
  if(s.trackingStart){need(validDate(s.trackingStart),'Invalid plan start.');for(const field of ['expenses','receipts','adjustments'])for(const row of s[field]||[])need(row.date>=s.trackingStart,'This plan starts on '+s.trackingStart+'. Keep older products in the catalogue, not in spending.');}
  upgradeState({...s,version:3});
  for(const field of ['categories','items','lists','receipts','lots','stockEvents','mealEntries','recipes','subscriptions','goals','adjustments']){
    need(Array.isArray(s[field]),'Backup is missing '+field+'.');
    const ids=new Set();for(const x of s[field]){need(x&&typeof x.id==='string'&&!ids.has(x.id),'Duplicate or invalid '+field+' record.');ids.add(x.id);}
  }
  for(const c of s.categories)need(typeof c.name==='string'&&['grocery','other','unresolved'].includes(c.pool),'Invalid category.');
  need(s.categories.some(c=>c.id==='uncategorised'),'The pending category is required.');
  for(const x of s.items){need(typeof x.name==='string'&&s.categories.some(c=>c.id===x.categoryId),'Invalid catalogue item.');if(x.stockPerUnit!=null)need(Number.isFinite(x.stockPerUnit)&&x.stockPerUnit>0,'Pack size must be greater than zero.');}
  for(const x of s.expenses)need(validDate(x.date),'Invalid spending date.');
  for(const x of s.expenses)need((x.place==null||typeof x.place==='string')&&(x.details==null||typeof x.details==='string'),'Invalid purchase details.');
  for(const x of s.lots)need(typeof x.name==='string'&&typeof x.unit==='string'&&['count','measured','level','durable'].includes(x.tracking)&&Number.isFinite(x.remaining)&&x.remaining>=0&&Number.isFinite(x.quantity)&&x.quantity>0&&x.remaining<=x.quantity,'Invalid stock lot.');
  for(const x of s.lists){need(typeof x.name==='string'&&validDate(x.date)&&Array.isArray(x.lines),'Invalid shopping list.');for(const l of x.lines)need(typeof l.name==='string'&&Number.isFinite(l.quantity)&&l.quantity>0&&(l.estimatePence==null||Number.isSafeInteger(l.estimatePence)&&l.estimatePence>=0),'Invalid shopping line.');}
  for(const x of s.receipts){need(validDate(x.date)&&Array.isArray(x.lines)&&Number.isSafeInteger(x.paidPence)&&x.paidPence>=0,'Invalid receipt.');need(x.spreadMonths==null||Number.isInteger(x.spreadMonths)&&x.spreadMonths>=1&&x.spreadMonths<=60,'Spread a shop over 1 to 60 months.');need(x.lines.every(l=>Number.isSafeInteger(l.netPence)&&l.netPence>=0)&&x.lines.reduce((n,l)=>n+l.netPence,0)+(x.feePence||0)===x.paidPence,'Receipt totals do not reconcile.');}
  for(const x of s.adjustments)need(Number.isSafeInteger(x.pence)&&x.pence<0&&validDate(x.date)&&s.expenses.some(e=>e.id===x.expenseId),'Invalid refund.');
  for(const x of s.subscriptions)need(typeof x.name==='string'&&validDate(x.nextDue)&&Number.isSafeInteger(x.costPence)&&x.costPence>=0&&['monthly','yearly','weekly'].includes(x.interval),'Invalid subscription.');
  for(const x of s.goals)need(typeof x.name==='string'&&Number.isSafeInteger(x.targetPence)&&x.targetPence>=0&&Array.isArray(x.contributions)&&x.contributions.every(c=>Number.isSafeInteger(c.pence)&&c.pence>0&&validDate(c.date)),'Invalid saving goal.');
  for(const x of s.recipes)need(typeof x.name==='string'&&Number.isFinite(x.servings)&&x.servings>0&&Array.isArray(x.ingredients)&&x.ingredients.every(i=>typeof i.name==='string'&&Number.isFinite(i.quantity)&&i.quantity>0&&typeof i.unit==='string'),'Invalid recipe.');
  for(const x of s.mealEntries)need(x.touches==null||Array.isArray(x.touches)&&x.touches.every(t=>t&&typeof t.sourceId==='string'),'Invalid meal stock.');
  for(const x of s.mealEntries)need(validDate(x.date)&&typeof x.name==='string'&&['planned','cooked','skipped'].includes(x.status)&&Array.isArray(x.reservations)&&Array.isArray(x.missing)&&x.reservations.every(r=>Number.isFinite(r.amount)&&r.amount>0&&(s.resources.some(a=>a.id===r.sourceId)||s.lots.some(a=>a.id===r.sourceId))),'Invalid meal reservation.');
  for(const k of ['resourceMeta','savingIntentions','categoryTargets'])need(s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k]),'Invalid '+k+'.');
  for(const v of Object.values(s.savingIntentions))need(Number.isSafeInteger(v)&&v>=0,'Invalid saving intention.');
  for(const targets of Object.values(s.categoryTargets))need(targets&&typeof targets==='object'&&!Array.isArray(targets)&&Object.entries(targets).every(([id,v])=>s.categories.some(c=>c.id===id)&&Number.isSafeInteger(v)&&v>=0),'Invalid category target.');
  for(const l of s.lots){need(l.tracking!=='count'||Number.isInteger(l.quantity)&&Number.isInteger(l.remaining),'Counted stock needs whole quantities.');need(l.lowAt==null||Number.isFinite(l.lowAt)&&l.lowAt>=0,'Invalid low-stock threshold.');need(!l.expiry||validDate(l.expiry),'Invalid stock label date.');}
  for(const x of s.subscriptions)need(s.categories.some(c=>c.id===x.categoryId),'Choose a category for the subscription.');
  for(const exp of s.expenses)need(-s.adjustments.filter(a=>a.expenseId===exp.id).reduce((n,a)=>n+a.pence,0)<=Math.round(exp.amount*100),'Refunds exceed the original spending.');
  if(s.productTypes!=null){need(Array.isArray(s.productTypes),'Invalid product types.');const tids=new Set();for(const x of s.productTypes){need(x&&typeof x.id==='string'&&!tids.has(x.id)&&typeof x.name==='string'&&x.name.trim(),'Duplicate or invalid product type.');tids.add(x.id);}for(const x of s.productTypes)need(!x.parentId||tids.has(x.parentId),'A product type points at a missing parent.');}
  if(s.shops!=null){need(Array.isArray(s.shops),'Invalid shops.');const ids=new Set();for(const x of s.shops){need(x&&typeof x.id==='string'&&!ids.has(x.id)&&typeof x.name==='string'&&x.name.trim(),'Duplicate or invalid shop.');ids.add(x.id);}}
  for(const i of s.items)for(const o of i.observations||[])need(Number.isFinite(o.linePence)&&o.linePence>=0&&validDate(o.date)&&(o.regularPence==null||Number.isFinite(o.regularPence)&&o.regularPence>=0),'Invalid price record.');
  const allStock=stockRows(s);
  for(const row of allStock){const reserved=reservedAmount(s,row.id);need(reserved<=row.remaining+1e-6,'Stock reserved for a recipe cannot be used, split or removed here. Change the meal first.');need(!reserved||!row.scheduledDate,'This allocation is already reserved for a recipe.');}
  return s;
}
function migrateV4(input){
  if(Number(input?.version)>4)throw new Error('This backup needs a newer app.');
  if(input?.version===4)return validateV4(normalizeConnected(input));
  const old=upgradeState(input);
  const built={...old,version:4,categories:clone(SEED.categories),items:clone(SEED.items),lists:[],receipts:[],lots:[],stockEvents:[],mealEntries:[],recipes:[],subscriptions:[],goals:[],adjustments:[],resourceMeta:{},savingIntentions:{},categoryTargets:{},shops:[]};
  return validateV4(typeof seedTypesInto==='function'?seedTypesInto(built):built);
}
const originalBudgetFigures=budgetFigures;
function ledger(s){return [...s.expenses.map(x=>({...x,type:x.categoryId?(category(s,x.categoryId).pool==='grocery'?'grocery':'other'):x.type})),...(s.adjustments||[]).map(x=>{const exp=s.expenses.find(e=>e.id===x.expenseId);return {...x,amount:x.pence/100,type:exp?.categoryId?(category(s,exp.categoryId).pool==='grocery'?'grocery':'other'):exp?.type||'other',categoryId:exp?.categoryId,category:exp?.category,note:x.kind==='moneyback'?'Money back from '+(x.from||'someone'):'Refund · '+(exp?.note||exp?.category||''),forNote:exp?.note||exp?.category||'',refund:true};})];}
budgetFigures=function(s,m){return originalBudgetFigures(s.version===4?{...s,expenses:ledger(s)}:s,m);};
function subscriptionDates(sub,month){
  if(sub.paused)return [];
  let date=sub.nextDue,out=[],count=0;
  while(date.slice(0,7)<=month&&count++<2000){if(date.slice(0,7)===month)out.push(date);date=advanceDue(date,sub.interval,sub.anchorDay||Number(sub.nextDue.slice(8)));}
  return out;
}
function advanceDue(date,interval,anchor=Number(date.slice(8))){
  const d=new Date(date+'T12:00:00');
  if(interval==='weekly')d.setDate(d.getDate()+7);
  else{d.setDate(1);if(interval==='yearly')d.setFullYear(d.getFullYear()+1);else d.setMonth(d.getMonth()+1);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(anchor,last));}
  return isoDate(d);
}
function forecast(s,month){
  const f=budgetFigures(s,month),lines=s.lists.filter(l=>dateMonth(l.date)===month).flatMap(l=>l.lines.filter(x=>x.status==='planned'));
  const planned=lines.reduce((n,l)=>n+(l.estimatePence||0),0),unknown=lines.filter(l=>l.estimatePence==null).length;
  const subscriptions=s.subscriptions.reduce((n,x)=>n+subscriptionDates(x,month).length*x.costPence,0),intention=s.savingIntentions[month]||0;
  return {...f,plannedPence:planned,unknown,subscriptionPence:subscriptions,intentionPence:intention,projectedPence:Math.round(f.totalRemaining*100)-planned-subscriptions-intention};
}
function upsertItem(s,item){
  need(item.name?.trim(),'Give the item a name.');need(s.categories.some(c=>c.id===item.categoryId),'Choose a category.');
  if(item.stockPerUnit!=null)positive(item.stockPerUnit);
  const old=s.items.find(i=>i.id===item.id);return {...s,items:old?s.items.map(i=>i.id===item.id?{...i,...item,name:item.name.trim()}:i):[...s.items,{id:uid('item'),tracking:'count',unit:'item',usual:true,observations:[],...item,name:item.name.trim()}]};
}
function addListLine(s,listId,line){
  need(line.name?.trim(),'Give the item a name.');const quantity=positive(line.quantity);
  need(line.estimatePence==null||Number.isSafeInteger(line.estimatePence)&&line.estimatePence>=0,'Invalid estimated total.');
  return {...s,lists:s.lists.map(l=>l.id===listId?{...l,lines:[...l.lines,{id:uid('line'),status:'planned',priority:'needed',tracking:'none',unit:'item',categoryId:'uncategorised',...line,name:line.name.trim(),quantity}]}:l)};
}
// Ticking an item off without a receipt: it leaves "to buy" and the forecast, and nothing reaches
// the balance or the cupboard. Unticking puts it back. A line bought on a receipt is not changed here.
function tickListLine(s,listId,lineId,got=true,today=isoDate(new Date())){
  const line=s.lists.find(l=>l.id===listId)?.lines.find(l=>l.id===lineId);need(line,'That item is no longer on the list.');
  need(!line.receiptId,'This item is on a receipt. Change the receipt to bring it back.');
  return {...s,lists:s.lists.map(l=>l.id!==listId?l:{...l,lines:l.lines.map(x=>{if(x.id!==lineId)return x;if(got)return {...x,status:'bought',ticked:true,gotOn:today};const {ticked,gotOn,...rest}=x;return {...rest,status:'planned'};})})};
}
// Every line with its list, and the shop and day it is meant for: its own when it has one, else its list's.
function shoppingRows(s){return s.lists.flatMap(l=>l.lines.map(x=>({line:x,list:l,category:category(s,x.categoryId),shop:shopName(s,x)||shopName(s,l),date:validDate(x.date)?x.date:l.date})));}
// The same items arranged another way: by category, by shop, by day, or all together.
function groupShopping(rows,by){
  if(by==='all')return rows.length?[{key:'all',label:'Everything',rows:rows.slice().sort((a,b)=>a.line.name.localeCompare(b.line.name))}]:[];
  const key=r=>by==='category'?r.category.id:by==='shop'?r.shop.toLowerCase():r.date,label=r=>by==='category'?r.category.name:by==='shop'?(r.shop||'Any shop'):r.date,groups=[];
  for(const r of rows){const k=key(r);let g=groups.find(x=>x.key===k);if(!g){g={key:k,label:label(r),rows:[]};groups.push(g);}g.rows.push(r);}
  return groups.sort((a,b)=>by==='date'?a.key.localeCompare(b.key):!a.key-!b.key||a.label.localeCompare(b.label));
}
function apportion(total,weights){
  const sum=weights.reduce((n,x)=>n+x,0);need(Number.isSafeInteger(total)&&total>=0&&total<=sum,'Discount exceeds the item total.');
  if(!sum)return weights.map(()=>0);
  const out=weights.map(w=>Math.floor(total*w/sum));let remain=total-out.reduce((n,x)=>n+x,0);
  const order=weights.map((w,i)=>({i,f:total*w/sum-out[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);
  for(let i=0;i<remain;i++)out[order[i].i]++;return out;
}
function checkout(s,d){
  need(d.id,'Missing receipt identity.');if(s.receipts.some(r=>r.id===d.id))return s;
  need(validDate(d.date),'Choose a valid purchase date.');need(d.merchant?.trim(),'Give the shop or payee a name.');
  const bought=d.lines.filter(l=>l.bought!==false);need(bought.length,'Choose at least one bought item.');
  const discount=Number(d.discountPence||0),fee=Number(d.feePence||0);need(Number.isSafeInteger(fee)&&fee>=0,'Invalid charges.');
  const lines=bought.map(l=>{need(l.name?.trim(),'Every line needs a name.');positive(l.quantity);need(Number.isSafeInteger(l.grossPence)&&l.grossPence>=0,'Enter each actual line total.');need(s.categories.some(c=>c.id===l.categoryId),'Choose a category.');if(l.planLineId){const plan=s.lists.flatMap(p=>p.lines).find(x=>x.id===l.planLineId);need(plan?.status==='planned'&&l.quantity<=plan.quantity,'Bought quantity exceeds the remaining plan.');}return {...l,id:uid('receiptline')};});
  const splits=apportion(discount,lines.map(l=>l.grossPence));lines.forEach((l,i)=>l.netPence=l.grossPence-splits[i]);
  const total=lines.reduce((n,l)=>n+l.netPence,0)+fee;need(total===d.paidPence,'Item totals plus charges minus discount must match the amount paid.');
  const linked=ensureShop(s,d.shopId&&findShop(s,d.shopId)?d.shopId:d.merchant);s=linked.state;const shopId=linked.shopId,merchant=shopId?findShop(s,shopId).name:d.merchant.trim();
  for(const l of lines){const own=ownLabelFor(s,l);if(own&&!findShop(s,own.shop))s=ensureShop(s,own.shop).state;}
  let items=[...s.items],lots=[...s.lots],expenses=[...s.expenses];
  for(const l of lines){
    let item=items.find(i=>i.id===l.itemId)||items.find(i=>i.name.toLowerCase()===l.name.trim().toLowerCase());
    const filed=l.typeId||(typeof classifyTypeId==='function'?classifyTypeId(s,l.name,l.categoryId):'');
    const own=ownLabelFor(s,l),ownShop=own?findShop(s,own.shop):null;
    if(!item){item={id:uid('item'),name:l.name.trim(),categoryId:l.categoryId,tracking:l.tracking||'none',unit:l.unit||'item',usual:false,observations:[],...(filed?{typeId:filed}:{}),...(ownShop?{shopId:ownShop.id}:{}),...(ownShop&&own.brand?{brand:own.brand}:{})};items.push(item);}
    else {let next=item;
      if(filed&&!next.typeId)next={...next,typeId:filed};
      if(ownShop&&!next.shopId&&!next.brand)next={...next,shopId:ownShop.id,...(own.brand?{brand:own.brand}:{})};
      if(next!==item){item=next;items=items.map(i=>i.id===item.id?item:i);}}
    l.itemId=item.id;
    items=items.map(i=>i.id===item.id?withPriceHistory(i,[...(i.observations||[]),tidyPrice({id:'obs-'+l.id,source:'receipt',receiptId:d.id,receiptLineId:l.id,date:d.date,merchant,shopId,quantity:l.quantity,linePence:l.netPence,stockQuantity:l.stockQuantity||null,stockUnit:l.stockUnit||'',offer:!!l.offer,regularPence:l.regularPence,note:l.priceNote})]):i);
    expenses.push({id:l.id,date:d.date,amount:l.netPence/100,type:category(s,l.categoryId).pool==='grocery'?'grocery':'other',categoryId:l.categoryId,category:category(s,l.categoryId).name,note:merchant+' · '+l.name,receiptId:d.id});
    if(['count','measured','level','durable'].includes(l.tracking)){
      const stockQuantity=l.stockBasis==='purchase'?positive(l.quantity):l.stockBasis==='custom'?positive(l.stockQuantity):l.stockQuantity!=null&&l.stockQuantity!==''?positive(l.stockQuantity):l.quantity*(item.stockPerUnit||1),stockUnit=l.stockBasis==='purchase'?l.unit:l.stockBasis==='custom'?String(l.stockUnit||'').trim():l.stockUnit||item.stockUnit||l.unit;
      need(stockUnit,'Name the stock unit for this purchase.');
      const copies=l.tracking==='level'&&Number.isInteger(stockQuantity)?stockQuantity:1;
      need(copies<=1000,'Record at most 1,000 bottles in one line.');
      for(let i=0;i<copies;i++)lots.push(makeLot({...l,image:item.image||l.image||'',id:uid('lot'),receiptId:d.id,receiptLineId:l.id,purchased:d.date,quantity:copies>1?1:stockQuantity,remaining:copies>1?1:stockQuantity,unit:stockUnit}));
    }
  }
  if(fee)expenses.push({id:d.id+'-fee',date:d.date,amount:fee/100,type:'other',categoryId:'fees-delivery-adjustments',category:'Fees, delivery & adjustments',note:merchant+' · charges',receiptId:d.id});
  const lists=s.lists.map(p=>({...p,lines:p.lines.map(l=>{const b=lines.find(x=>x.planLineId===l.id);if(!b)return l;const remaining=+(l.quantity-b.quantity).toFixed(6);return remaining>0?{...l,quantity:remaining,estimatePence:l.estimatePence==null?null:Math.round(l.estimatePence*remaining/l.quantity)}:{...l,status:'bought',receiptId:d.id};})}));
  return {...s,items,lots,expenses,lists,receipts:[{id:d.id,date:d.date,merchant,...(shopId?{shopId}:{}),...(d.photo?{photo:d.photo}:{}),channel:d.channel||'in-store',paidPence:total,discountPence:discount,feePence:fee,lines,note:d.note||'',...(d.place&&d.place.trim()?{place:d.place.trim()}:{}),unpacked:false},...s.receipts]};
}
function makeLot(d){
  const quantity=positive(d.quantity);need(d.name?.trim(),'Give the stock a name.');need(['count','measured','level','durable'].includes(d.tracking),'Choose a stock tracking method.');
  need(d.tracking!=='count'||Number.isInteger(quantity),'Counted stock needs a whole quantity.');
  return {id:uid('lot'),categoryId:'uncategorised',unit:'item',location:'Cupboard',level:'unopened',notes:'',expiry:'',expiryType:'best-before',...d,name:d.name.trim(),quantity,remaining:d.remaining??quantity};
}
function trackingForResource(s,r){return s.resourceMeta[r.id]?.tracking||(/capsule|tablet|roll|sponge/.test(r.unit)?'count':LASTING_WORDS.test(r.name.toLowerCase())?'level':['g','ml'].includes(r.unit)?'measured':'count');}
function resourceCategory(r){
 const n=r.name.toLowerCase();
 for(const [pattern,cat] of [[/laundry/,'laundry'],[/dishwasher/,'dishwashing'],[/toilet|paper/,'paper-toilet-rolls'],[/scourer|sponge/,'household-consumables'],[/\boil\b|spray/,'cooking-oils-fats'],[/honey|marmalade|cereal|muesli/,'breakfast-spreads'],[/chocolate/,'snacks-treats'],[/\btea\b/,'tea-coffee-soft-drinks'],[/oat drink/,'milk-alternatives'],[/linguine|fusilli|noodle/,'rice-pasta-wrappers'],[/tin|tuna/,'tins-jars-pulses'],[/pizza|battered/,'frozen-food'],[/chicken|beef|mince|salmon|prawn|\bham\b|bacon|tofu/,'meat-fish-plant-proteins'],[/cheese|cheddar/,'eggs-dairy']])if(pattern.test(n))return cat;
 return r.category==='Household'?'household-consumables':'fruit-vegetables';
}
function stockRows(s){return [...s.lots.map(l=>({...l,source:'lot',availableMonth:l.availableMonth||'',location:l.location||'Cupboard'})),...s.resources.map(r=>{const meta=s.resourceMeta[r.id]||{};return {id:r.id,name:r.name,categoryId:resourceCategory(r),unit:r.unit,quantity:Number(r.qty),remaining:r.used?0:Number(r.qty),tracking:trackingForResource(s,r),location:r.storage,notes:r.note,availableMonth:r.allocatedMonth,scheduledDate:r.scheduledDate,source:'resource',...meta};})];}
function runningLow(row){return row.remaining>0&&(row.level==='low'||row.lowAt!=null&&row.remaining<=row.lowAt);}
function withPriceHistory(item,observations){const latest=[...observations].sort((a,b)=>b.date.localeCompare(a.date))[0];return {...item,observations,lastBought:latest?.date||null,lastPricePence:latest?Math.round(latest.linePence/latest.quantity):null};}
function reservedAmount(s,id,except){return s.mealEntries.filter(m=>m.status==='planned'&&m.id!==except).flatMap(m=>m.reservations).filter(r=>r.sourceId===id).reduce((n,r)=>n+r.amount,0);}
function stockAction(s,id,action,value,date=isoDate(new Date()),allowReserved=false,extra={}){
  const row=stockRows(s).find(r=>r.id===id);need(row,'Stock item not found.');need(validDate(date),'Choose a valid date.');
  // Any allocation can be used on any day. Using a later month's share simply takes it out of that month's plan.
  const later=row.tracking!=='level'&&row.availableMonth&&row.availableMonth>dateMonth(date)?{fromMonth:row.availableMonth}:{};
  let next=s,amountOut=null;
  if(action==='touch'){
    need(row.remaining>0,'This is already finished.');
    if(row.tracking==='level'&&(!row.level||row.level==='unopened')){const patch={level:'in-use',opened:row.opened||date};next=row.source==='lot'?{...s,lots:s.lots.map(l=>l.id===id?{...l,...patch}:l)}:{...s,resourceMeta:{...s.resourceMeta,[id]:{...s.resourceMeta[id],...patch}}};}
  }else if(['open','half','low'].includes(action)){
    need(row.remaining>0,'This lot is finished.');need(row.tracking==='level','This item uses quantity tracking.');
    const patch={level:action==='open'?'in-use':action,opened:action==='open'?(row.opened&&row.opened<date?row.opened:date):(row.opened||date),...(action==='half'?{halfAt:date}:action==='low'?{lowAt:date}:{})};
    if(action==='open'&&!row.lastsMonths){const lives=lastingLives(s,new Set([itemKey(row.name)]));if(lives.length)patch.lastsMonths=Math.round(lives.reduce((a,b)=>a+b,0)/lives.length*2)/2;}
    next=row.source==='lot'?{...s,lots:s.lots.map(l=>l.id===id?{...l,...patch}:l)}:{...s,resourceMeta:{...s.resourceMeta,[id]:{...s.resourceMeta[id],...patch}}};
  }else{
    need(row.tracking!=='durable'||action==='return','Durable items stay owned; use return to remove one.');
    const n=action==='finish'||action==='return'&&value==null?row.remaining:positive(value);
    amountOut=n;
    need(n>0&&n<=row.remaining,'There is not enough stock for that amount.');need(allowReserved||n<=row.remaining-reservedAmount(s,id),'Some of this stock is reserved for a meal. Edit that meal first.');
    need(row.tracking!=='count'||!Number.isInteger(row.remaining)||Number.isInteger(n),'Use a whole number for counted stock.');
    next=row.source==='lot'?{...s,lots:s.lots.map(l=>l.id===id?{...l,remaining:+(l.remaining-n).toFixed(6),level:l.remaining===n?'finished':l.level}:l)}:withAmountAction(s,id,n,'use',date);
    if(row.source==='resource'&&['finish','waste'].includes(action))next={...next,resourceMeta:{...next.resourceMeta,[id]:{...next.resourceMeta[id],level:'finished'}}};
  }
  return {...next,stockEvents:[...s.stockEvents,{id:uid('event'),sourceId:id,action,amount:amountOut??(Number(value)||null),date,name:row.name,unit:row.unit,...later,...extra}]};
}
// Oldest share first: leftovers from earlier months, then this month (and anything without a month), then later months.
function stockOrder(date){const month=dateMonth(date);return (a,b)=>(a.availableMonth||month).localeCompare(b.availableMonth||month)||(a.scheduledDate?1:0)-(b.scheduledDate?1:0)||(a.expiry||'9999').localeCompare(b.expiry||'9999')||(a.source==='lot'?0:1)-(b.source==='lot'?0:1);}
function pickStock(s,rows,amount,date,{except,forMeal=false,taken=[]}={}){
  const picks=[];let left=amount;
  for(const r of rows.filter(r=>r.remaining>0&&!(forMeal&&r.scheduledDate)).sort(stockOrder(date))){
    if(left<=1e-9)break;
    const free=r.remaining-reservedAmount(s,r.id,except)-taken.filter(x=>x.sourceId===r.id).reduce((n,x)=>n+x.amount,0);
    let n=Math.min(Math.max(0,free),left);if(r.tracking==='count'&&Number.isInteger(r.remaining))n=Math.floor(n+1e-9);n=+n.toFixed(6);
    if(n<=0)continue;picks.push({row:r,amount:n});left=+(left-n).toFixed(6);
  }
  return {picks,short:Math.max(0,left)};
}
// Use (or throw away) an amount of something, whichever month it was set aside for.
function useStock(s,ids,amount,date,opts={}){
  need(validDate(date),'Choose a valid date.');const action=opts.action||'use';need(['use','waste'].includes(action),'Choose what happened.');
  const rows=stockRows(s).filter(r=>ids.includes(r.id)&&r.remaining>0);need(rows.length,'Stock item not found.');
  need(new Set(rows.map(r=>unitKey(r.unit)+'|'+r.tracking)).size===1,'Choose one unit at a time; packs and portions cannot be added together.');
  need(!rows.some(r=>r.tracking==='level'||r.tracking==='durable'),'Update this one from its own card.');
  const n=positive(amount);need(rows[0].tracking!=='count'||rows.some(r=>!Number.isInteger(r.remaining))||Number.isInteger(n),'Use a whole number for counted stock.');
  const {picks,short}=pickStock(s,rows,n,date);
  if(short>1e-6){const home=rows.reduce((t,r)=>t+r.remaining,0),free=+(n-short).toFixed(6);need(false,free<home?'Only '+displayQty(free,rows[0].unit)+' is free. The rest is kept for a planned meal, so change that meal first.':'You only have '+displayQty(home,rows[0].unit)+' at home.');}
  let next=s;for(const x of picks)next=stockAction(next,x.row.id,action,x.amount,date,false,opts.mealId?{mealId:opts.mealId}:{});
  return next;
}
// Long-lasting things (oil, spray, honey): no measuring. Opened date, how long it usually lasts,
// and the odd "about half" or "running low" give a good estimate of what is left.
function lastingDefault(row){const m=/(\d+(?:\.\d+)?)\s*months?/i.exec(row.notes||'');return m?Number(m[1]):/\boil\b|spray/i.test(row.name||'')?6:3;}
function daysBetween(a,b){return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);}
function addDays(date,n){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return isoDate(d);}
function lastingInfo(row,today=isoDate(new Date())){
  const lasts=Number(row.lastsMonths)>0?Number(row.lastsMonths):lastingDefault(row);
  if(row.remaining<=0||row.level==='finished')return {state:'finished',left:0,lasts};
  const level=row.level&&row.level!=='unopened'?row.level:row.opened?'in-use':'unopened';
  if(level==='unopened')return {state:'unopened',left:1,lasts};
  const opened=row.opened||today,since=Math.max(0,daysBetween(opened,today));let life=Math.max(7,Math.round(lasts*30.44));
  if(level==='half'&&row.halfAt){const t=daysBetween(opened,row.halfAt);if(t>=7)life=2*t;}
  if(level==='low'&&row.lowAt){const t=daysBetween(opened,row.lowAt);if(t>=7)life=Math.round(t/0.85);}
  let left=1-since/life;if(level==='half')left=Math.min(left,.5);if(level==='low')left=Math.min(left,.15);
  return {state:level,left:Math.max(.02,Math.min(1,left)),lasts,opened,since,runOut:addDays(opened,life),daysLeft:Math.max(0,life-since),overdue:since>life};
}
function setLasting(s,id,{lastsMonths,opened}={}){
  const row=stockRows(s).find(r=>r.id===id);need(row,'Stock item not found.');const patch={};
  if(lastsMonths!=null&&lastsMonths!==''){const n=Number(lastsMonths);need(Number.isFinite(n)&&n>0&&n<=60,'Enter how many months it usually lasts.');patch.lastsMonths=n;}
  if(opened){need(validDate(opened),'Choose the day you opened it.');patch.opened=opened;if(!row.level||row.level==='unopened')patch.level='in-use';}
  return row.source==='lot'?{...s,lots:s.lots.map(l=>l.id===id?{...l,...patch}:l)}:{...s,resourceMeta:{...s.resourceMeta,[id]:{...s.resourceMeta[id],...patch}}};
}
// Plan and eat in one go, for something already eaten.
function eatMeal(s,d,leftovers=0){const id=d.id||uid('meal');return cookMeal(planMeal(s,{...d,id}),id,leftovers,true);}
// Everything used, opened or eaten, by day, for the usage calendar.
function usageLog(s){
  const rows=new Map([...s.resources,...s.lots].map(r=>[r.id,r])),meals=new Map(s.mealEntries.map(m=>[m.id,m])),out=[],covered=new Map();
  const family=(id)=>rows.get(id)?.parentId||id;
  const key=(id,date)=>family(id)+'|'+date;
  for(const ev of s.stockEvents){
    const row=rows.get(ev.sourceId)||{};
    out.push({...ev,kind:'stock',name:ev.name||row.name||'Something from the cupboard',unit:ev.unit||row.unit||'',note:ev.note||'',fromMonth:ev.fromMonth||'',meal:meals.get(ev.mealId)?.name||''});
    if(['use','finish','waste','return','retire'].includes(ev.action)){
      const k=key(ev.sourceId,ev.date),amount=Number(ev.amount)||Number(row.qty)||0;
      covered.set(k,(covered.get(k)||0)+amount);
    }
  }
  // Legacy used portions may coexist with recorded events. Match source families and
  // quantities, never just the name: two identical items can be used on the same day.
  for(const r of s.resources)if(r.used&&r.usedDate){
    const k=key(r.id,r.usedDate),qty=Number(r.qty),matched=Math.min(qty,covered.get(k)||0);
    covered.set(k,Math.max(0,(covered.get(k)||0)-matched));
    const amount=+(qty-matched).toFixed(6);
    if(amount>0)out.push({id:'used-'+r.id,date:r.usedDate,kind:'stock',action:'use',name:r.name,unit:r.unit,amount,fromMonth:r.allocatedMonth&&r.allocatedMonth>dateMonth(r.usedDate)?r.allocatedMonth:'',meal:'',sourceId:r.id});
  }
  for(const m of s.mealEntries)if(m.status==='cooked')out.push({id:'meal-'+m.id,date:m.date,kind:'meal',action:'ate',name:m.name,slot:m.slot,mealId:m.id});
  return out.sort((a,b)=>a.date.localeCompare(b.date));
}
// ---- Items: one home for everything about a thing you buy ----
// A stable key so "Current sunflower oil", "Next sunflower oil" and a new bottle all count as one item.
// The bottle to use first: one already open, then "Current …" before "Next …" or a spare.
function bottleRank(r){const n=String(r.name||'').toLowerCase();return (r.level&&r.level!=='unopened'||r.opened?0:10)+(/^current\b/.test(n)?0:/^(next|spare)\b/.test(n)?2:1);}
function bottleOrder(date){const so=stockOrder(date);return (a,b)=>bottleRank(a)-bottleRank(b)||so(a,b);}
function itemKey(name){return String(name||'').toLowerCase().replace(/\(.*?\)/g,' ').replace(/[-_/]+/g,' ').replace(/^\s*(current|next|spare|new|old)\s+/,'').replace(/\s+(allowance|allocation)\s*$/,'').replace(/\s+\d+\s*$/,'').replace(/[^a-z0-9%&' ]+/g,' ').replace(/\s+/g,' ').trim();}
function cleanName(name){const k=String(name||'').replace(/^\s*(current|next|spare)\s+/i,'').replace(/\s+(allowance|allocation)\s*$/i,'').replace(/\s+\d+\s*$/,'').trim();return k.charAt(0).toUpperCase()+k.slice(1);}
function unitKey(u){return String(u||'').toLowerCase().replace(/s$/,'');}
function mostCommon(xs){const c={};let best=xs[0];for(const x of xs){c[x]=(c[x]||0)+1;if(c[x]>c[best])best=x;}return best;}
function itemIndex(s){const map=new Map();for(const i of s.items)for(const k of [i.name,...(i.aliases||[])].map(itemKey))if(k&&!map.has(k))map.set(k,i);return map;}
function catalogueEntries(s){
  const idx=itemIndex(s),byKey=new Map();
  for(const r of stockRows(s)){
    const item=(r.itemId&&s.items.find(i=>i.id===r.itemId))||idx.get(itemKey(r.name))||null,key=item?'item:'+item.id:'name:'+itemKey(r.name);
    let g=byKey.get(key);if(!g){g={key,item,name:item?item.name:cleanName(r.name),rows:[]};byKey.set(key,g);}g.rows.push(r);
  }
  return [...byKey.values()];
}
function entryFor(s,key){const g=catalogueEntries(s).find(x=>x.key===key);if(g)return g;if(key.startsWith('item:')){const item=s.items.find(i=>'item:'+i.id===key);if(item)return {key,item,name:item.name,rows:[]};}return null;}
function entryFacts(g){
  const live=g.rows.filter(r=>r.remaining>0),base=live.length?live:g.rows;
  if(!base.length)return {tracking:g.item?.tracking||'count',unit:g.item?.stockUnit||g.item?.unit||'item',left:0,total:0,used:0};
  const tracking=mostCommon(base.map(r=>r.tracking)),unit=mostCommon(base.map(r=>r.unit)),same=g.rows.filter(r=>unitKey(r.unit)===unitKey(unit));
  const left=+same.reduce((n,r)=>n+r.remaining,0).toFixed(6),total=+same.reduce((n,r)=>n+r.quantity,0).toFixed(6);
  const quantities=[...new Set(live.map(r=>unitKey(r.unit)))].map(key=>{const rs=live.filter(r=>unitKey(r.unit)===key);return {unit:rs[0].unit,left:+rs.reduce((n,r)=>n+r.remaining,0).toFixed(6)};});
  return {tracking,unit,left,total,used:+(total-left).toFixed(6),quantities,mixed:quantities.length>1};
}
function entryKeys(g){return new Set([itemKey(g.name),...g.rows.map(r=>itemKey(r.name)),...(g.item?[g.item.name,...(g.item.aliases||[])].map(itemKey):[])].filter(Boolean));}
// Everything that happened to one item: bought, added, used, opened, finished, eaten in a meal.
function entryHistory(s,g){
  const keys=entryKeys(g),ids=new Set(g.rows.map(r=>r.id));
  const log=usageLog(s).filter(x=>x.kind==='stock'&&(ids.has(x.sourceId)||keys.has(itemKey(x.name))));
  const bought=(g.item?.observations||[]).map((o,i)=>({id:'buy-'+i+'-'+o.date,date:o.date,kind:'bought',action:'bought',amount:o.quantity,unit:g.item.unit||'item',pence:o.linePence,merchant:o.merchant||''}));
  const added=g.rows.filter(r=>r.source==='lot'&&!r.receiptId&&r.added).map(r=>({id:'add-'+r.id,date:r.added,kind:'added',action:'added',amount:r.quantity,unit:r.unit}));
  return [...log,...bought,...added].sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));
}
// How long each finished bottle or jar of this item lasted, in months.
function lastingLives(s,keys){
  const names={};for(const r of s.resources)names[r.id]=r.name;for(const l of s.lots)names[l.id]=l.name;
  const opened={},finished={};
  for(const ev of s.stockEvents){const k=itemKey(ev.name||names[ev.sourceId]);if(!keys.has(k))continue;if(ev.action==='open'&&!opened[ev.sourceId])opened[ev.sourceId]=ev.date;if(ev.action==='finish')finished[ev.sourceId]=ev.date;}
  for(const [id,meta] of Object.entries(s.resourceMeta||{}))if(meta.opened&&!opened[id]&&keys.has(itemKey(names[id])))opened[id]=meta.opened;
  for(const l of s.lots)if(l.opened&&!opened[l.id]&&keys.has(itemKey(l.name)))opened[l.id]=l.opened;
  return Object.keys(finished).filter(id=>opened[id]&&finished[id]>opened[id]).map(id=>daysBetween(opened[id],finished[id])/30.44);
}
function entryInsights(s,g,history,facts,today=isoDate(new Date())){
  const out={};
  const uses=history.filter(x=>x.kind==='stock'&&['use','finish'].includes(x.action)&&x.amount>0&&unitKey(x.unit)===unitKey(facts.unit));
  if(uses.length>=2){const first=uses[uses.length-1].date,days=Math.max(14,daysBetween(first,today)),total=uses.reduce((n,x)=>n+x.amount,0);out.perDay=total/days;if(facts.left>0&&out.perDay>0)out.runOut=addDays(today,Math.round(facts.left/out.perDay));}
  const buys=history.filter(x=>x.kind==='bought');
  if(buys.length){out.buys=buys.length;out.lastBought=buys[0].date;out.lastUnitPence=Math.round(buys[0].pence/(buys[0].amount||1));const shops=buys.map(b=>b.merchant).filter(Boolean);if(shops.length){out.shop=buys[0].merchant||mostCommon(shops);out.usualShop=mostCommon(shops);}}
  const lives=lastingLives(s,entryKeys(g));if(lives.length)out.lastsMonths=Math.round(lives.reduce((a,b)=>a+b,0)/lives.length*2)/2;
  return out;
}
// Sensible starting kind for something new. Long-lasting things are never measured out.
const LASTING_WORDS=/\b(oil|spray|sauce|ketchup|mayo|mayonnaise|mustard|vinegar|soy|pesto|honey|marmalade|jam|spread|peanut butter|nutella|spice|spices|seasoning|salt|pepper|paprika|cumin|turmeric|cinnamon|oregano|stock cubes?|bouillon|gravy|sugar|flour|baking powder|yeast|coffee|shampoo|conditioner|shower gel|body wash|hand wash|soap|washing up|detergent|cleaner|bleach|toothpaste|moisturiser|cream|lotion|deodorant|perfume|serum|dressing|chutney|relish|syrup)\b/;
function suggestTracking(name,categoryId,unit){
  const n=String(name||'').toLowerCase();
  if(['restaurant-meals','takeaway-delivery','coffee-snacks-out','drinks-parties-entertainment','ai-software','media-storage','learning-memberships','travel-fares','repairs-maintenance','health-services-wellbeing','fees-delivery-adjustments','gifts-giving','opening-spending'].includes(categoryId))return 'none';
  if(['kitchen-equipment','home-furnishings','electronics-accessories','clothing','footwear-accessories','bike-cycling-equipment'].includes(categoryId))return 'durable';
  if(LASTING_WORDS.test(n)||['cooking-oils-fats','sauces-condiments','spices-baking'].includes(categoryId))return 'level';
  if(/^(g|kg|ml|l)$/i.test(unit||''))return 'measured';
  return 'count';
}
// Save an item and let the things at home follow its kind (counted, measured or long-lasting).
function saveItem(s,form,opts={}){
  const next=upsertItem(s,form),item=next.items.find(i=>i.id===form.id)||next.items[next.items.length-1];
  if(!['count','measured','level'].includes(item.tracking))return next;
  const g=catalogueEntries(next).find(x=>x.item&&x.item.id===item.id);if(!g)return next;
  let out=next;
  for(const r of g.rows){if(r.tracking===item.tracking||r.remaining<=0||r.tracking==='durable')continue;
    if(r.source==='lot')out={...out,lots:out.lots.map(l=>l.id===r.id?{...l,tracking:item.tracking}:l)};
    else out={...out,resourceMeta:{...out.resourceMeta,[r.id]:{...out.resourceMeta[r.id],tracking:item.tracking}}};}
  if(opts.homeTotal!=null&&item.tracking!=='level')out=setHomeAmount(out,'item:'+item.id,item.stockUnit||item.unit,opts.homeTotal);
  return out;
}
// "At home now": count what is at home in the item's own unit (e.g. 17 tea bags, not 1 bottle) and correct the amount.
function setHomeAmount(s,key,unit,total,date=isoDate(new Date())){
  const g=catalogueEntries(s).find(x=>x.key===key);need(g,'Item not found.');const t=Number(total);need(Number.isFinite(t)&&t>=0,'Enter how much is at home.');
  const target=String(unit||'item').trim()||'item',f=entryFacts(g),before=f.left,beforeUnit=f.unit;
  const rows=g.rows.filter(r=>['count','measured'].includes(r.tracking));need(rows.length||t===0,'Add it with “I have some at home” first.');
  need(rows.every(r=>r.tracking!=='count')||Number.isInteger(t),'Use a whole number for counted things.');
  const ids=new Set(rows.map(r=>r.id));
  let out={...s,lots:s.lots.map(l=>ids.has(l.id)&&l.remaining>0?{...l,unit:target}:l),resources:s.resources.map(r=>ids.has(r.id)&&!r.used?{...r,unit:target}:r)};
  const live=stockRows(out).filter(r=>ids.has(r.id)&&r.remaining>0),left=live.reduce((n,r)=>n+r.remaining,0);let diff=+(t-left).toFixed(6);
  if(Math.abs(diff)>1e-9){
    const lots=out.lots.filter(l=>ids.has(l.id)).sort((a,b)=>String(b.purchased||b.added||'').localeCompare(String(a.purchased||a.added||'')));
    if(lots.length){for(const l of lots){if(Math.abs(diff)<1e-9)break;const take=diff>0?diff:Math.max(diff,-l.remaining),rem=+(l.remaining+take).toFixed(6);out={...out,lots:out.lots.map(x=>x.id===l.id?{...x,remaining:rem,quantity:Math.max(rem,+(x.quantity+take).toFixed(6)),level:rem===0?'finished':x.level==='finished'?'unopened':x.level}:x)};diff=+(diff-take).toFixed(6);}}
    if(Math.abs(diff)>1e-9){const res=[...ids].filter(id=>out.resources.some(r=>r.id===id));need(res.length,'That is less than what is kept for planned meals.');const cm=dateMonth(date),plan=monthlyPlan(out,res),k=plan[cm]!=null?cm:plan['']!=null?'':cm;need((plan[k]||0)+diff>=-1e-9,'That is less than what is set aside. Change the monthly plan instead.');out=setMonthlyPlan(out,res,{[k]:+((plan[k]||0)+diff).toFixed(6)},date);out={...out,stockEvents:out.stockEvents.filter(e=>!(e.action==='plan'&&e.date===date&&e.sourceId&&ids.has(e.sourceId)&&e===out.stockEvents.at(-1)))};}
  }
  if(before!==t||unitKey(beforeUnit)!==unitKey(target))out={...out,stockEvents:[...out.stockEvents,{id:uid('event'),sourceId:rows[0]?.id||'',action:'correct',amount:null,date,name:rows[0]?.name||g.name,unit:target,note:displayQty(before,beforeUnit)+' → '+displayQty(t,target)}]};
  return out;
}
// Loose match for long-lasting ingredients: "oil" or "olive oil" finds "Frylight olive-oil spray".
function wordsIn(a,b){const A=itemKey(a).split(' ').filter(Boolean),B=new Set(itemKey(b).split(' '));return A.length>0&&A.every(w=>B.has(w)||B.has(w+'s')||B.has(w.replace(/s$/,'')));}
const EVERY_DAYS={'few-days':3,weekly:7,fortnightly:14,monthly:30};
function dueItems(s,today=isoDate(new Date())){
  const entries=catalogueEntries(s);
  return s.items.filter(i=>EVERY_DAYS[i.every]).map(i=>{const g=entries.find(x=>x.item&&x.item.id===i.id),home=g?entryFacts(g).left:0,due=i.lastBought?addDays(i.lastBought,EVERY_DAYS[i.every]):today;return {item:i,due,home};}).filter(x=>x.due<=addDays(today,2)&&x.home<=(x.item.lowAt??0)).sort((a,b)=>a.due.localeCompare(b.due));
}
// ---- Editing what is at home, what was set aside for each month, and what was already used ----
// Put a "used" allocation back: merge it into the share it was split from, or simply mark it unused.
function putBack(s,resourceId){
  const r=s.resources.find(x=>x.id===resourceId);need(r&&r.used,'This is not marked as used.');
  const parent=r.parentId&&s.resources.find(x=>x.id===r.parentId&&!x.used&&!x.scheduledDate&&x.unit===r.unit&&(x.allocatedMonth||'')===(r.allocatedMonth||''));
  if(parent)return {...s,resources:s.resources.filter(x=>x.id!==r.id).map(x=>x.id===parent.id?{...x,qty:+(Number(x.qty)+Number(r.qty)).toFixed(6)}:x)};
  return {...s,resources:s.resources.map(x=>x.id===r.id?{...x,used:false,usedDate:''}:x)};
}
const LEVEL_ACTIONS=['open','half','low','finish','touch'];
// After an entry is removed, work out the bottle's state again from what is left in its history.
function recomputeLevel(s,id){
  const row=stockRows(s).find(r=>r.id===id);if(!row||row.tracking!=='level')return s;
  const evs=s.stockEvents.filter(e=>e.sourceId===id&&LEVEL_ACTIONS.includes(e.action)).sort((a,b)=>a.date.localeCompare(b.date));
  const firstOpen=evs.find(e=>e.action!=='finish')?.date||'',last=[...evs].reverse().find(e=>['open','half','low','finish'].includes(e.action));
  const half=evs.filter(e=>e.action==='half').at(-1)?.date,low=evs.filter(e=>e.action==='low').at(-1)?.date;
  const level=row.remaining<=0?'finished':last?.action==='half'?'half':last?.action==='low'?'low':firstOpen?'in-use':'unopened';
  const patch={level,opened:firstOpen||undefined,halfAt:half,lowAt:low};
  if(row.source==='lot')return {...s,lots:s.lots.map(l=>l.id===id?{...l,...patch}:l)};
  return {...s,resourceMeta:{...s.resourceMeta,[id]:{...s.resourceMeta[id],...patch}}};
}
// Undo one history entry and put back whatever it took out of the cupboard.
function undoStockEvent(s,eventId){
  const ev=s.stockEvents.find(x=>x.id===eventId);need(ev,'This entry is already gone.');
  let next={...s,stockEvents:s.stockEvents.filter(x=>x.id!==eventId)};
  if(['use','waste','return','finish'].includes(ev.action)){
    const lot=s.lots.find(l=>l.id===ev.sourceId);
    if(lot){const back=Number(ev.amount)||lot.quantity-lot.remaining;next={...next,lots:next.lots.map(l=>l.id===lot.id?{...l,remaining:+Math.min(l.quantity,l.remaining+back).toFixed(6),level:l.level==='finished'?(l.opened?'in-use':'unopened'):l.level}:l)};}
    else{
      const src=s.resources.find(x=>x.id===ev.sourceId),root=src?.parentId||ev.sourceId;
      const cands=s.resources.filter(r=>r.used&&r.usedDate===ev.date&&(r.id===ev.sourceId||r.parentId===ev.sourceId||r.parentId===root));
      const hit=cands.find(r=>ev.amount!=null&&Math.abs(Number(r.qty)-Number(ev.amount))<1e-6)||cands.find(r=>r.id===ev.sourceId)||cands[0];
      if(hit)next=putBack(next,hit.id);
    }
  }
  return recomputeLevel(next,ev.sourceId);
}
// Change how much, or on which day, something was used.
function editStockEvent(s,eventId,{amount,date}={}){
  const ev=s.stockEvents.find(x=>x.id===eventId);need(ev,'This entry is already gone.');need(validDate(date),'Choose a valid date.');
  const undone=undoStockEvent(s,eventId),extra=ev.mealId?{mealId:ev.mealId}:{};
  if(['use','waste'].includes(ev.action)){
    const n=positive(amount),row=stockRows(undone).find(r=>r.id===ev.sourceId);
    if(row&&row.remaining-reservedAmount(undone,row.id)>=n-1e-9)return stockAction(undone,row.id,ev.action,n,date,false,extra);
    const g=catalogueEntries(undone).find(x=>x.rows.some(r=>r.id===ev.sourceId)||x.rows.some(r=>itemKey(r.name)===itemKey(ev.name)));
    return useStock(undone,g?g.rows.filter(r=>!ev.unit||unitKey(r.unit)===unitKey(ev.unit)).map(r=>r.id):[ev.sourceId],n,date,{action:ev.action,...extra});
  }
  if(LEVEL_ACTIONS.includes(ev.action))return stockAction(undone,ev.sourceId,ev.action,null,date,true,extra);
  need(false,'This entry cannot be changed here.');
}
// Old records marked used before the history existed.
function editUsedDate(s,resourceId,date){need(validDate(date),'Choose a valid date.');const r=s.resources.find(x=>x.id===resourceId);need(r&&r.used,'This is not marked as used.');return {...s,resources:s.resources.map(x=>x.id===resourceId?{...x,usedDate:date}:x)};}
// Change one share or pack: its size, what is left, which month it is set aside for, where it lives.
function editStockRow(s,id,patch={}){
  const row=stockRows(s).find(r=>r.id===id);need(row,'Stock item not found.');const reserved=reservedAmount(s,id);
  const name=patch.name!=null?textOr(patch.name):row.name;need(name,'Give it a name.');
  if(row.source==='lot'){
    const l=s.lots.find(x=>x.id===id),quantity=patch.quantity!=null&&patch.quantity!==''?positive(patch.quantity):l.quantity,remaining=patch.remaining!=null&&patch.remaining!==''?Number(patch.remaining):Math.min(l.remaining,quantity);
    need(Number.isFinite(remaining)&&remaining>=0&&remaining<=quantity+1e-9,'What is left must be between 0 and the full amount.');need(remaining>=reserved-1e-9,'Some of it is kept for a planned meal. Change that meal first.');
    need(l.tracking!=='count'||Number.isInteger(quantity)&&Number.isInteger(remaining),'Use whole numbers for counted stock.');
    return {...s,lots:s.lots.map(x=>x.id===id?{...x,name,quantity,remaining,location:patch.location??x.location,notes:patch.notes??x.notes,...(patch.keepMonths===undefined?{}:{keepMonths:patch.keepMonths===null||patch.keepMonths===''?undefined:positive(patch.keepMonths)}),level:remaining===0?'finished':x.level==='finished'?(x.opened?'in-use':'unopened'):x.level}:x)};
  }
  const r=s.resources.find(x=>x.id===id);need(!r.used,'This one is already used. Put it back first to change it.');
  const qty=patch.qty!=null&&patch.qty!==''?positive(patch.qty):Number(r.qty);need(row.tracking!=='count'||Number.isInteger(qty),'Use a whole number for counted stock.');need(qty>=reserved-1e-9,'Some of it is kept for a planned meal. Change that meal first.');
  const month=patch.allocatedMonth!==undefined?patch.allocatedMonth:r.allocatedMonth;need(month===''||/^\d{4}-(0[1-9]|1[0-2])$/.test(month),'Choose a month, or any time.');
  const moved=month!==r.allocatedMonth;need(!moved||!r.scheduledDate,'This one has a date in the original calendar. Change it there first.');
  return {...s,resources:s.resources.map(x=>x.id===id?{...x,name,qty,allocatedMonth:month,storage:patch.storage??x.storage,note:patch.note??x.note,...(moved?{scope:undefined,availableFrom:undefined}:{})}:x)};
}
// The monthly plan for one item: how much is set aside for each month (or any time).
function planRows(s,ids){return s.resources.filter(r=>ids.includes(r.id)&&!r.used&&!r.scheduledDate&&!reservedAmount(s,r.id));}
function monthlyPlan(s,ids){const out={};for(const r of planRows(s,ids)){const k=r.allocatedMonth||'';out[k]=+((out[k]||0)+Number(r.qty)).toFixed(6);}return out;}
function setMonthlyPlan(s,ids,targets,date=isoDate(new Date())){
  const rows=planRows(s,ids);need(rows.length,'Nothing here can be re-planned.');
  const template=rows[0],tracking=stockRows(s).find(x=>x.id===template.id).tracking,current=monthlyPlan(s,ids),changes=[];let resources=[...s.resources];
  for(const [k,v] of Object.entries(targets)){
    const t=v===''||v==null?0:Number(v);need(Number.isFinite(t)&&t>=0,'Amounts cannot be negative.');need(tracking!=='count'||Number.isInteger(t),'Use whole numbers for counted stock.');need(k===''||/^\d{4}-(0[1-9]|1[0-2])$/.test(k),'Invalid month.');
    const c=current[k]||0;if(Math.abs(t-c)<1e-9)continue;changes.push([k,c,t]);
    if(t>c){const base=rows.find(r=>(r.allocatedMonth||'')===k)||template;resources.push({...base,id:uid('res'),qty:+(t-c).toFixed(6),allocatedMonth:k,used:false,usedDate:'',scheduledDate:'',parentId:undefined,scope:undefined,availableFrom:undefined});}
    else{let drop=+(c-t).toFixed(6);for(const r of rows.filter(r=>(r.allocatedMonth||'')===k).sort((a,b)=>Number(a.qty)-Number(b.qty))){if(drop<=1e-9)break;const q=Number(r.qty);if(q<=drop+1e-9){resources=resources.filter(x=>x.id!==r.id);drop=+(drop-q).toFixed(6);}else{resources=resources.map(x=>x.id===r.id?{...x,qty:+(q-drop).toFixed(6)}:x);drop=0;}}}
  }
  if(!changes.length)return s;
  const fmt=k=>k?new Date(k+'-15T12:00:00').toLocaleDateString('en-GB',{month:'short'}):'any time';
  return {...s,resources,stockEvents:[...s.stockEvents,{id:uid('event'),sourceId:template.id,action:'plan',amount:null,date,name:template.name,unit:template.unit,note:changes.map(([k,c,t])=>fmt(k)+' '+c+' → '+t).join(', ')}]};
}
// A meal marked eaten by mistake: put everything back and make it a planned meal again.
function uneatMeal(s,id){
  const m=s.mealEntries.find(x=>x.id===id);need(m?.status==='cooked','This meal is not marked as eaten.');
  let next=s;for(const ev of s.stockEvents.filter(e=>e.mealId===id).reverse())next=undoStockEvent(next,ev.id);
  next={...next,lots:next.lots.filter(l=>!(l.mealId===id&&l.remaining===l.quantity))};
  return {...next,mealEntries:next.mealEntries.map(x=>x.id===id?{...x,status:'planned',leftovers:0}:x)};
}
// Share one shop's cost across the months it feeds. 1 (or nothing) keeps it all in its own month.
function setReceiptSpread(s,id,months){
  const r=s.receipts.find(x=>x.id===id);need(r,'Receipt not found.');
  const n=months==null||months===''?1:Math.round(Number(months));
  need(Number.isInteger(n)&&n>=1&&n<=60,'Choose between 1 and 60 months.');
  const next={...r};if(n>1)next.spreadMonths=n;else delete next.spreadMonths;
  return {...s,receipts:s.receipts.map(x=>x.id===id?next:x)};
}
// What one shop costs the month you are looking at, once any spreading is applied.
function receiptShareIn(s,receipt,month){
  const n=Number(receipt.spreadMonths),rows=s.expenses.filter(x=>x.receiptId===receipt.id);
  const total=rows.reduce((t,x)=>t+Math.round(x.amount*100),0);
  if(!(n>1))return dateMonth(receipt.date)===month?total:0;
  const months=Math.min(60,Math.round(n)),from=dateMonth(receipt.date);
  let out=0;
  for(const x of rows){const hit=spreadParts(Math.round(x.amount*100),months,from).find(([k])=>k===month);if(hit)out+=hit[1];}
  return out;
}
function spreadNote(s,month){
  const rows=s.receipts.filter(r=>Number(r.spreadMonths)>1&&receiptShareIn(s,r,month)!==0);
  return rows.map(r=>({receipt:r,pence:receiptShareIn(s,r,month),shop:shopName(s,r)||r.merchant}));
}
function refundExpense(s,id,pence,date){
  const exp=s.expenses.find(x=>x.id===id);need(exp,'Purchase not found.');need(validDate(date),'Choose a refund date.');
  const prior=-s.adjustments.filter(a=>a.expenseId===id).reduce((n,a)=>n+a.pence,0);
  need(Number.isSafeInteger(pence)&&pence>0&&pence+prior<=Math.round(exp.amount*100),'Refund cannot exceed the unrefunded amount.');
  return {...s,adjustments:[...s.adjustments,{id:uid('refund'),expenseId:id,pence:-pence,date}]};
}
// Editing what was recorded. Receipt lines stay in step with their receipt, so every total still reconciles.
function textOr(v){return typeof v==='string'?v.trim():'';}
function gbp(p){return '£'+(p/100).toFixed(2);}
function tidy(x){const o={...x};for(const k of ['place','details','photo','shopId'])if(!o[k])delete o[k];return o;}
function paidBackPence(s,id){return -s.adjustments.filter(a=>a.expenseId===id).reduce((n,a)=>n+a.pence,0);}
function editExpense(s,id,patch={}){
  const exp=s.expenses.find(x=>x.id===id);need(exp,'Purchase not found.');
  const pence=patch.pence??Math.round(exp.amount*100);need(Number.isSafeInteger(pence)&&pence>0&&pence<=100000000,'Enter an amount above £0.');
  const back=paidBackPence(s,id);need(pence>=back,gbp(back)+' has already come back for this purchase, so it cannot cost less than that. Remove the money back first.');
  const catId=patch.categoryId||exp.categoryId||null;need(!catId||s.categories.some(c=>c.id===catId),'Choose a category.');
  const cat=catId?category(s,catId):null,catFields=cat?{categoryId:cat.id,category:cat.name,type:cat.pool==='grocery'?'grocery':'other'}:{};
  const details=textOr(patch.details??exp.details);
  if(!exp.receiptId){
    const note=textOr(patch.note??exp.note);need(note,'Give the purchase a name.');
    const date=patch.date??exp.date;need(validDate(date),'Choose a valid date.');
    return {...s,expenses:s.expenses.map(x=>x.id===id?tidy({...x,...catFields,note,amount:pence/100,date,place:textOr(patch.place??exp.place),details}):x)};
  }
  const r=s.receipts.find(x=>x.id===exp.receiptId);need(r,'The receipt for this purchase is missing.');
  const isFee=exp.id===r.id+'-fee',line=r.lines.find(l=>l.id===exp.id);need(isFee||line,'This line is no longer on its receipt.');
  const old=Math.round(exp.amount*100),delta=pence-old;
  const name=isFee?'':textOr(patch.note??line.name);need(isFee||name,'Give the item a name.');
  const lines=isFee?r.lines:r.lines.map(l=>l.id===exp.id?{...l,name,netPence:pence,grossPence:l.grossPence+delta,...(cat?{categoryId:cat.id}:{})}:l);
  const receipt={...r,lines,feePence:isFee?pence:(r.feePence||0),paidPence:r.paidPence+delta};
  const items=isFee||!delta?s.items:s.items.map(i=>{if(i.id!==line.itemId)return i;let done=false;return withPriceHistory(i,(i.observations||[]).map(o=>{if(!done&&o.receiptId===r.id&&o.linePence===old){done=true;return {...o,linePence:pence};}return o;}));});
  return {...s,items,receipts:s.receipts.map(x=>x.id===r.id?receipt:x),expenses:s.expenses.map(x=>x.id===id?tidy({...x,...catFields,amount:pence/100,note:isFee?x.note:r.merchant+' · '+name,details}):x)};
}
// Shop, date and place belong to the whole receipt, so they change for every line on it.
function editReceipt(s,id,patch={}){
  const r=s.receipts.find(x=>x.id===id);need(r,'Receipt not found.');
  const merchant=textOr(patch.merchant??r.merchant);need(merchant,'Give the shop or payee a name.');
  const date=patch.date??r.date;need(validDate(date),'Choose a valid purchase date.');
  const channel=patch.channel||r.channel||'in-store',place=textOr(patch.place??r.place),note=patch.note??r.note??'',photo=patch.photo??r.photo??'';
  const prefix=r.merchant+' · ';
  const linked=merchant===r.merchant&&r.shopId&&findShop(s,r.shopId)?{state:s,shopId:r.shopId}:ensureShop(s,patch.shopId&&findShop(s,patch.shopId)?patch.shopId:merchant);s=linked.state;const shopId=linked.shopId;
  return {...s,
    receipts:s.receipts.map(x=>x.id===id?tidy({...x,merchant,date,channel,place,note,photo,shopId}):x),
    expenses:s.expenses.map(x=>x.receiptId!==id?x:{...x,date,note:typeof x.note==='string'&&x.note.startsWith(prefix)?merchant+' · '+x.note.slice(prefix.length):x.note}),
    lots:s.lots.map(l=>l.receiptId===id?{...l,purchased:date}:l),
    items:s.items.map(i=>(i.observations||[]).some(o=>o.receiptId===id)?withPriceHistory(i,i.observations.map(o=>o.receiptId===id?{...o,date,merchant,shopId}:o)):i)};
}
// Money back: a friend chipping in, or a shop refund. One payment can cover several purchases;
// it is split across them in proportion to what is still left on each.
function recordMoneyBack(s,{from,pence,date,expenseIds,note}={}){
  const who=textOr(from);need(who,'Say who paid you back.');
  need(Number.isSafeInteger(pence)&&pence>0,'Enter the amount you got back.');need(validDate(date),'Choose the day you got it back.');
  const ids=[...new Set(expenseIds||[])];need(ids.length,'Tick the purchase, or purchases, it was for.');
  const rows=ids.map(id=>{const exp=s.expenses.find(x=>x.id===id);need(exp,'Purchase not found.');return {id,left:Math.round(exp.amount*100)-paidBackPence(s,id)};});
  const left=rows.reduce((n,r)=>n+r.left,0);need(pence<=left,'That is more than is left to pay back on '+(ids.length>1?'those purchases':'that purchase')+' ('+gbp(left)+').');
  const shares=apportion(pence,rows.map(r=>r.left)),groupId=uid('moneyback'),text=textOr(note);
  return {...s,adjustments:[...s.adjustments,...rows.map((r,i)=>({id:uid('moneyback'),expenseId:r.id,pence:-shares[i],date,kind:'moneyback',from:who,groupId,...(text?{note:text}:{})})).filter(a=>a.pence<0)]};
}
function moneyBackSplit(s,pence,expenseIds){const rows=expenseIds.map(id=>{const exp=s.expenses.find(x=>x.id===id);return {id,left:exp?Math.round(exp.amount*100)-paidBackPence(s,id):0};}),left=rows.reduce((n,r)=>n+r.left,0);if(!(pence>0)||pence>left)return null;const shares=apportion(pence,rows.map(r=>r.left));return rows.map((r,i)=>({id:r.id,pence:shares[i]}));}
function removeMoneyBack(s,id){const a=s.adjustments.find(x=>x.id===id);need(a,'This money back is already gone.');return {...s,adjustments:s.adjustments.filter(x=>a.groupId?x.groupId!==a.groupId:x.id!==id)};}
// What a removal would also undo, so the app can say it plainly instead of refusing.
function removalImpact(s,{receiptId,lineId=null}){
  const r=s.receipts.find(x=>x.id===receiptId);if(!r)return null;
  const lots=s.lots.filter(l=>l.receiptId===receiptId&&(!lineId||l.receiptLineId===lineId));
  const ids=new Set(lots.map(l=>l.id));
  const expenseIds=new Set(s.expenses.filter(e=>e.receiptId===receiptId&&(!lineId||e.id===lineId)).map(e=>e.id));
  return {lots:lots.length,
    events:s.stockEvents.filter(e=>ids.has(e.sourceId)).length,
    meals:s.mealEntries.filter(m=>(m.reservations||[]).some(a=>ids.has(a.sourceId))).length,
    refunds:s.adjustments.filter(a=>expenseIds.has(a.expenseId)).length,
    unpacked:!lineId&&!!r.unpacked};
}
function impactSentence(i){
  if(!i)return '';const b=[];
  if(i.events)b.push(i.events===1?'1 use or waste note':i.events+' use and waste notes');
  if(i.meals)b.push(i.meals===1?'1 planned meal that reserved it':i.meals+' planned meals that reserved it');
  if(i.refunds)b.push(i.refunds===1?'1 linked refund':i.refunds+' linked refunds');
  if(i.unpacked)b.push('the unpacked surprise bag');
  return b.length?'It also undoes '+b.join(', ')+'.':'';
}
function blocked(i){return !!(i&&(i.events||i.meals||i.refunds||i.unpacked));}
function purgeLots(s,ids){
  return {...s,lots:s.lots.filter(l=>!ids.has(l.id)),
    stockEvents:s.stockEvents.filter(e=>!ids.has(e.sourceId)),
    mealEntries:s.mealEntries.map(m=>{const removed=(m.reservations||[]).filter(a=>ids.has(a.sourceId));if(!removed.length)return m;return {...m,reservations:m.reservations.filter(a=>!ids.has(a.sourceId)),missing:m.status==='planned'?[...m.missing,...removed.map(a=>({name:a.name,quantity:a.amount,unit:a.unit}))]:m.missing};})};
}
// Put a bought line back on the shopping list it came from.
function restorePlanLine(lists,bought){
  return lists.map(p=>({...p,lines:p.lines.map(l=>{
    if(!bought||bought.planLineId!==l.id)return l;
    return {...l,status:'planned',receiptId:undefined,
      quantity:l.status==='bought'?bought.quantity:l.quantity+bought.quantity,
      estimatePence:l.status==='bought'?bought.grossPence:(l.estimatePence==null?null:l.estimatePence+bought.grossPence)};})}));
}
// Remove one mistyped line and reduce the receipt total so it still reconciles.
function removeReceiptLine(s,lineId,force=false){
  const exp=s.expenses.find(x=>x.id===lineId);need(exp&&exp.receiptId,'This spending is not part of a receipt.');
  const r=s.receipts.find(x=>x.id===exp.receiptId);need(r,'Receipt not found.');
  const line=r.lines.find(l=>l.id===lineId);need(line,'That line is no longer on this receipt.');
  const impact=removalImpact(s,{receiptId:r.id,lineId});
  need(force||!blocked(impact),'This line has been used since. '+impactSentence(impact));
  if(r.lines.length===1)return cancelReceipt(s,r.id,force);
  const ids=new Set(s.lots.filter(l=>l.receiptLineId===lineId).map(l=>l.id));
  const next=purgeLots(s,ids);
  const gross=Number.isSafeInteger(line.grossPence)?line.grossPence:line.netPence;
  const receipt={...r,lines:r.lines.filter(l=>l.id!==lineId),paidPence:r.paidPence-line.netPence,
    discountPence:Math.max(0,(r.discountPence||0)-(gross-line.netPence))};
  return {...next,
    lists:restorePlanLine(next.lists,line),
    receipts:next.receipts.map(x=>x.id===r.id?receipt:x),
    expenses:next.expenses.filter(e=>e.id!==lineId),
    adjustments:next.adjustments.filter(a=>a.expenseId!==lineId),
    items:next.items.map(i=>i.id===line.itemId?withPriceHistory(i,(i.observations||[]).filter(o=>o.receiptId!==r.id)):i)};
}
function cancelReceipt(s,id,force=false){
  const r=s.receipts.find(x=>x.id===id);need(r,'Receipt not found.');
  const lots=s.lots.filter(l=>l.receiptId===id);
  const impact=removalImpact(s,{receiptId:id});
  need(force||!blocked(impact),'This receipt has been used since. '+impactSentence(impact));
  // Recreate bought quantities in the original list, including partially bought lines.
  const lists=s.lists.map(p=>({...p,lines:p.lines.map(l=>{const bought=r.lines.find(x=>x.planLineId===l.id);if(!bought)return l;return {...l,status:'planned',receiptId:undefined,quantity:l.status==='bought'?bought.quantity:l.quantity+bought.quantity,estimatePence:l.status==='bought'?bought.grossPence:(l.estimatePence==null?null:l.estimatePence+bought.grossPence)};})}));
  const gone=new Set(s.expenses.filter(e=>e.receiptId===id).map(e=>e.id));
  const next=purgeLots(s,new Set(lots.map(l=>l.id)));
  return {...next,lists,receipts:next.receipts.filter(x=>x.id!==id),expenses:next.expenses.filter(e=>e.receiptId!==id),adjustments:next.adjustments.filter(a=>!gone.has(a.expenseId)),items:next.items.map(i=>withPriceHistory(i,(i.observations||[]).filter(o=>o.receiptId!==id)))};
}
function unpackBag(s,id,contents){
  const receipt=s.receipts.find(r=>r.id===id);need(receipt&&!receipt.unpacked,'This bag was already unpacked.');need(receipt.lines.some(l=>l.categoryId==='too-good-to-go-bags'),'Choose a Too Good To Go receipt.');need(contents.length,'Add the contents first.');
  return {...s,lots:[...s.lots,...contents.map(x=>makeLot({...x,receiptId:id,purchased:receipt.date,notes:'From Too Good To Go; bag cost already recorded.'}))],receipts:s.receipts.map(r=>r.id===id?{...r,unpacked:true}:r)};
}
function paySubscription(s,id){
  const sub=s.subscriptions.find(x=>x.id===id);need(sub&&!sub.paused,'Subscription is paused or missing.');
  const rid='subscription-'+id+'-'+sub.nextDue,paid=checkout(s,{id:rid,date:sub.nextDue,merchant:sub.name,note:sub.auto===false?'':'Renewed automatically on its renewal day',paidPence:sub.costPence,lines:[{name:sub.name,quantity:1,unit:'payment',categoryId:sub.categoryId,tracking:'none',grossPence:sub.costPence}]});
  const next={...paid,expenses:paid.expenses.map(x=>x.receiptId===rid?{...x,note:sub.name+' · subscription'}:x)};
  return {...next,subscriptions:next.subscriptions.map(x=>x.id===id?{...x,anchorDay:x.anchorDay||Number(x.nextDue.slice(8)),nextDue:advanceDue(x.nextDue,x.interval,x.anchorDay||Number(x.nextDue.slice(8)))}:x)};
}
// Renewals take themselves off the allowance on their renewal day. Runs whenever the app opens.
function autoPaySubscriptions(s,today=isoDate(new Date())){
  let next=s,count=0;
  for(const sub of s.subscriptions){if(sub.paused||sub.auto===false)continue;let guard=0;
    while(guard++<60){const cur=next.subscriptions.find(x=>x.id===sub.id);if(!cur||cur.nextDue>today)break;next=paySubscription(next,sub.id);count++;}}
  return count?next:s;
}
function subscriptionsDue(s,month,today=isoDate(new Date())){return s.subscriptions.filter(x=>!x.paused).flatMap(x=>subscriptionDates(x,month).filter(d=>d>today||x.auto===false).map(d=>({sub:x,date:d}))).sort((a,b)=>a.date.localeCompare(b.date));}
function monthlyCost(x){return x.paused?0:x.interval==='yearly'?x.costPence/12:x.interval==='weekly'?x.costPence*52/12:x.costPence;}
function convertQty(n,from,to){
  if(unitKey(from)===unitKey(to))return n;const units={g:['mass',1],kg:['mass',1000],ml:['volume',1],mL:['volume',1],L:['volume',1000],l:['volume',1000]};
  return units[from]&&units[to]&&units[from][0]===units[to][0]?n*units[from][1]/units[to][1]:null;
}
function planMeal(s,d){
  need(validDate(d.date)&&d.name?.trim(),'Choose a date and meal name.');const existing=s.mealEntries.find(m=>m.id===d.id);need(!existing||existing.status==='planned','Cooked meals cannot be replanned.');
  const recipe=d.recipeId?s.recipes.find(r=>r.id===d.recipeId):null;
  const servings=positive(d.servings||1),reserved=[],missing=[],touches=[],rows=stockRows(s);
  for(const ing of recipe?.ingredients||[]){
    let left=ing.quantity*servings/recipe.servings;
    // Oil, sauces, spices: the recipe says how much, the cupboard never subtracts it. Just note a little was used.
    const fits=ingredientMatcher(s,ing);
    const directLasting=rows.filter(r=>r.remaining>0&&r.tracking==='level'&&fits(r));
    const lasting=(directLasting.length?directLasting:rows.filter(r=>r.remaining>0&&r.tracking==='level'&&!ing.sourceIds?.length&&!ing.itemId&&!ing.typeId&&wordsIn(ing.name,r.name))).sort(bottleOrder(d.date));
    if(lasting.length){if(!touches.some(t=>t.sourceId===lasting[0].id))touches.push({sourceId:lasting[0].id,name:lasting[0].name,recipe:+(+left).toFixed(2)+' '+ing.unit});continue;}
    const candidates=rows.filter(r=>r.remaining>0&&r.tracking!=='level'&&r.tracking!=='durable'&&!r.scheduledDate&&fits(r)).sort(stockOrder(d.date));
    for(const r of candidates){const one=convertQty(1,r.unit,ing.unit);if(!one)continue;const free=r.remaining-reservedAmount(s,r.id,d.id)-reserved.filter(x=>x.sourceId===r.id).reduce((n,x)=>n+x.amount,0);const amount=Math.min(Math.max(0,free),left/one);if(amount>0){reserved.push({sourceId:r.id,amount:+amount.toFixed(6),unit:r.unit,name:r.name,...(r.availableMonth&&r.availableMonth>dateMonth(d.date)?{fromMonth:r.availableMonth}:{})});left-=amount*one;}}
    if(left>1e-6&&!ing.optional)missing.push({...ing,quantity:+left.toFixed(6)});
  }
  for(const pick of d.stock||[]){
    let pool=rows.filter(r=>(pick.ids||[]).includes(r.id)&&r.remaining>0);
    if(!pool.length)pool=rows.filter(r=>r.remaining>0&&r.name.toLowerCase()===String(pick.name||'').trim().toLowerCase()&&(!pick.unit||r.unit===pick.unit));
    if(!pool.length){missing.push({name:pick.name,quantity:Number(pick.amount)||1,unit:pick.unit||'item'});continue;}
    if(pool[0].tracking==='level'){const r=[...pool].sort(bottleOrder(d.date))[0];if(!touches.some(t=>t.sourceId===r.id))touches.push({sourceId:r.id,name:r.name});continue;}
    need(pool[0].tracking!=='durable','Things you own, like a pan, are not used up by a meal.');
    const amount=positive(pick.amount),{picks,short}=pickStock(s,pool,amount,d.date,{except:d.id,forMeal:true,taken:reserved});
    for(const x of picks)reserved.push({sourceId:x.row.id,amount:x.amount,unit:x.row.unit,name:x.row.name,...(x.row.availableMonth&&x.row.availableMonth>dateMonth(d.date)?{fromMonth:x.row.availableMonth}:{})});
    if(short>1e-6)missing.push({name:pick.name,quantity:+short.toFixed(6),unit:pick.unit||pool[0].unit});
  }
  const meal={id:d.id||uid('meal'),slot:'dinner',...d,servings,status:'planned',reservations:reserved,missing,touches};
  return {...s,mealEntries:existing?s.mealEntries.map(m=>m.id===d.id?meal:m):[...s.mealEntries,meal]};
}
function refreshMeal(s,id){const meal=s.mealEntries.find(m=>m.id===id);need(meal,'Meal not found.');return planMeal(s,meal);}
function cookMeal(s,id,leftovers=0,force=false){
  const m=s.mealEntries.find(x=>x.id===id);need(m?.status==='planned','This meal is already completed.');need(force||!m.missing.length,'Add or match the missing ingredients, then refresh the reservation.');need(Number.isFinite(leftovers)&&leftovers>=0&&leftovers<=m.servings,'Leftovers must be between zero and the planned servings.');
  let next=s;for(const r of m.reservations)next=stockAction(next,r.sourceId,'use',r.amount,m.date,true,{mealId:m.id});
  for(const t of m.touches||[])if(stockRows(next).some(x=>x.id===t.sourceId&&x.remaining>0))next=stockAction(next,t.sourceId,'touch',null,m.date,true,{mealId:m.id});
  if(leftovers)next={...next,lots:[...next.lots,makeLot({name:m.name+' — leftovers',quantity:leftovers,unit:'serving',tracking:'measured',categoryId:'fresh-convenience-food',location:'Fridge',mealId:m.id,notes:'Ingredients consumed when this batch was cooked. Add the label/storage date yourself.'})]};
  return {...next,mealEntries:next.mealEntries.map(x=>x.id===id?{...x,status:'cooked',leftovers}:x)};
}
function missingToList(s,id){
  const m=s.mealEntries.find(x=>x.id===id);need(m?.status==='planned'&&m.missing.length,'No missing ingredients to add.');
  const listId='meal-shopping-'+id,old=s.lists.find(l=>l.id===listId);
  if(old)return s;
  return {...s,lists:[...s.lists,{id:listId,name:'For '+m.name,date:m.date,merchant:'',channel:'in-store',lines:m.missing.map(i=>({id:uid('line'),name:i.name,quantity:i.quantity,unit:i.unit,categoryId:s.items.find(x=>x.name.toLowerCase()===i.name.toLowerCase())?.categoryId||'uncategorised',tracking:['g','kg','ml','L'].includes(i.unit)?'measured':'count',priority:'needed',status:'planned',estimatePence:null,mealId:id}))}]};
}

// Monday–Sunday weeks use local calendar dates, including across months and DST.
function weekStart(date){need(validDate(date),'Choose a valid date.');const d=new Date(date+'T12:00:00');return addDays(date,-((d.getDay()+6)%7));}
function historyGroup(x){return x.kind==='meal'?'meal':x.action==='retire'?'kept':x.action==='waste'?'waste':x.action==='return'?'returns':['open','half','low'].includes(x.action)?'levels':'used';}
function weeklyUsage(s,date){
 const start=weekStart(date),end=addDays(start,6),events=usageLog(s).filter(x=>x.date>=start&&x.date<=end&&(x.kind==='meal'||['use','finish','touch','open','half','low','waste','return','retire'].includes(x.action)));
 const stock=stockRows(s),byId=new Map(stock.map(x=>[x.id,x])),entries=catalogueEntries(s),entryById=new Map(),index=itemIndex(s),items=new Map();
 for(const g of entries)for(const r of g.rows)entryById.set(r.id,g);
 for(const x of events.filter(x=>historyGroup(x)==='used')){
  const row=byId.get(x.sourceId),g=entryById.get(x.sourceId),item=g?.item||index.get(itemKey(x.name));
  const identity=g?.key||(item?'item:'+item.id:'name:'+itemKey(x.name)),key=identity+'|'+unitKey(x.unit);
  if(!items.has(key))items.set(key,{key,identity,entryKey:g?.key||(item?'item:'+item.id:''),name:item?.name||g?.name||cleanName(x.name),unit:x.unit,categoryId:item?.categoryId||row?.categoryId,image:item?.photo||item?.image||row?.image,amount:0,unmeasured:0,events:[]});
  const total=items.get(key);total.events.push(x);
  // Level-tracked bottles are approximate, even when a finish record contains 1 bottle.
  if(x.action==='touch'||row?.tracking==='level'||!(Number(x.amount)>0))total.unmeasured++;
  else total.amount=+(total.amount+Number(x.amount)).toFixed(6);
 }
 const result=[...items.values()].sort((a,b)=>a.name.localeCompare(b.name));
 return {start,end,events,days:Array.from({length:7},(_,i)=>{const date=addDays(start,i);return {date,events:events.filter(x=>x.date===date)};}),items:result,itemCount:new Set(result.map(x=>x.identity)).size,meals:events.filter(x=>x.kind==='meal'),waste:events.filter(x=>x.action==='waste'),activeDays:new Set(events.map(x=>x.date)).size,borrowedMonths:[...new Set(events.filter(x=>historyGroup(x)==='used'&&x.fromMonth).map(x=>x.fromMonth))].sort()};
}

// Receipts are the source of truth. Otherwise the stock record keeps its own purchase details;
// plan shares store them on the resource so split portions inherit them.
function stockPurchase(s,row){
 const raw=row.source==='resource'?{...(s.resources.find(r=>r.id===row.id)||row),...s.resourceMeta[row.id]}:row;
 const receipt=raw.receiptId?s.receipts.find(r=>r.id===raw.receiptId):null;
 const date=receipt?receipt.date:raw.purchased,shop=receipt?shopName(s,receipt):shopName(s,raw);
 return {date:validDate(date)?date:'',shop,shopKey:shop.toLocaleLowerCase('en-GB'),fromReceipt:!!receipt};
}
// Set where and when stock was bought. Undefined leaves a field alone; an empty string clears it.
function setPurchaseDetails(s,ids,{date,shop}={}){
 need(Array.isArray(ids)&&ids.length,'Choose at least one item.');
 need(date===undefined||date===''||validDate(date),'Choose a valid purchase date.');
 const name=shop===undefined?undefined:String(shop).trim().slice(0,80);
 need(date!==undefined||name!==undefined,'Enter a shop or a date.');
 let shopRef=null;if(name){const r=ensureShop(s,name);s=r.state;shopRef=findShop(s,r.shopId);}
 const wanted=new Set(ids);let changed=0;
 const apply=x=>{changed++;const out={...x};
  if(date!==undefined){if(date)out.purchased=date;else delete out.purchased;}
  if(name!==undefined){if(name){out.merchant=shopRef.name;out.shopId=shopRef.id;}else{delete out.merchant;delete out.shopId;}delete out.shop;}
  return out;};
 const lots=s.lots.map(l=>wanted.has(l.id)&&!l.receiptId?apply(l):l);
 const resources=s.resources.map(r=>wanted.has(r.id)&&!r.receiptId?apply(r):r);
 need(changed,'These come from a receipt. Change the receipt instead.');
 return {...s,lots,resources};
}
function purchaseRange(period,from='',to='',today=isoDate(new Date())){
 if(period==='today')return {from:today,to:today};
 if(period==='week')return {from:weekStart(today),to:addDays(weekStart(today),6)};
 if(period==='month'){const d=new Date(today+'T12:00:00');return {from:today.slice(0,7)+'-01',to:isoDate(new Date(d.getFullYear(),d.getMonth()+1,0,12))};}
 return period==='range'?{from,to}:{};
}
function filterStockPurchases(s,groups,{shop='',categoryId='',period='all',from='',to='',today=isoDate(new Date())}={}){
 const range=purchaseRange(period,from,to,today),invalid=range.from&&range.to&&range.from>range.to;
 if(invalid)return [];
 return groups.map(g=>({...g,purchaseFiltered:!!shop||period!=='all',rows:g.rows.filter(row=>{
  if(categoryId&&(g.item?.categoryId||row.categoryId)!==categoryId)return false;
  const p=stockPurchase(s,row);
  if(shop==='__unknown'?!!p.shop:shop&&p.shopKey!==shop)return false;
  if(period==='unknown')return !p.date;
  if((range.from||range.to)&&!p.date)return false;
  return (!range.from||p.date>=range.from)&&(!range.to||p.date<=range.to);
 })})).filter(g=>g.rows.length);
}

function knownShops(s){
 const out=new Map(),add=n=>{n=String(n||'').trim();const k=n.toLocaleLowerCase('en-GB');if(n&&!out.has(k))out.set(k,n);};
 for(const x of s.shops||[])if(!x.archived)add(x.name);for(const r of s.receipts)add(r.merchant);for(const x of [...s.lots,...s.resources])if(!x.receiptId)add(x.merchant);
 return [...out.values()].sort((a,b)=>a.localeCompare(b));
}


// ---- One connected catalogue: shops, products and their prices ----------------------------
// Shops are records with their own details. Everything that was bought somewhere keeps the shop's
// name as text too, so older data and backups stay readable, and gains a shopId link.
const SHOP_KINDS=[['supermarket','Supermarket'],['local','Local shop or market'],['online','Online'],['cafe','Café or restaurant'],['other','Other']];
function shopKey(name){return String(name||'').toLocaleLowerCase('en-GB').replace(/[’']/g,'').replace(/[^a-z0-9&]+/g,' ').trim();}
function findShop(s,ref){
  if(!ref)return null;const shops=s.shops||[],k=shopKey(ref);
  return shops.find(x=>x.id===ref)||shops.find(x=>shopKey(x.name)===k)||shops.find(x=>(x.aliases||[]).some(a=>shopKey(a)===k))||null;
}
function shopName(s,x){const shop=x?.shopId?findShop(s,x.shopId):null;return shop?shop.name:String(x?.merchant||x?.shop||'').trim();}
function guessShopKind(name){const n=String(name||'').toLowerCase();return /lidl|tesco|aldi|morrisons|sainsbury|asda|co-?op|waitrose|iceland|m&s|marks|farmfoods|spar|londis/.test(n)?'supermarket':/amazon|online|deliveroo|uber|just eat|ocado|too good to go|ebay/.test(n)?'online':/manca|caf[eé]|restaurant|pizza|coffee|costa|starbucks|greggs|pret|bar\b|pub\b/.test(n)?'cafe':'other';}
function newShop(s,name,extra={}){
  const clean=String(name||'').trim(),base='shop-'+(shopKey(clean).replace(/ /g,'-')||'unnamed');
  const id=(s.shops||[]).some(x=>x.id===base)?uid('shop'):base;
  return {id,name:clean,kind:guessShopKind(clean),photo:'',area:'',website:'',notes:'',aliases:[],...extra};
}
// First load after this update: create shop records from every shop name already used.
function normalizeConnected(s){
  if(Array.isArray(s.shops))return typeof seedTypesInto==='function'?seedTypesInto(s):s;
  const names=new Map(),add=n=>{n=String(n||'').trim();const k=shopKey(n);if(n&&!names.has(k))names.set(k,n);};
  const legacy=o=>o.merchant||(String(o.receiptId||'').startsWith('lidl-')?'Lidl':'');
  for(const r of s.receipts||[])add(r.merchant);for(const l of s.lists||[])add(l.merchant);
  for(const i of s.items||[]){add(i.shop);for(const o of i.observations||[])add(legacy(o));}
  for(const x of [...(s.lots||[]),...(s.resources||[])])add(x.merchant);
  let shops=[];for(const n of [...names.values()].sort((a,b)=>a.localeCompare(b)))shops.push(newShop({shops},n));
  // (the linked copy is built below, then the product-type tree is seeded on top)
  const id=n=>findShop({shops},n)?.id;
  const link=x=>{const i=x.merchant&&!x.shopId?id(x.merchant):null;return i?{...x,shopId:i}:x;};
  const out={...s,shops,receipts:(s.receipts||[]).map(link),lists:(s.lists||[]).map(link),lots:(s.lots||[]).map(link),resources:(s.resources||[]).map(link),
    items:(s.items||[]).map(i=>({...i,...(i.shop&&!i.usualShopId&&id(i.shop)?{usualShopId:id(i.shop)}:{}),
      observations:(i.observations||[]).map((o,n)=>{const m=legacy(o),sid=o.shopId||id(m);return {...o,id:o.id||'obs-'+(o.receiptId||'price')+'-'+n,...(m?{merchant:m}:{}),...(sid?{shopId:sid}:{})};})}))};
  return typeof seedTypesInto==='function'?seedTypesInto(out):out;
}
// Find a shop by id or name, or create it. A blank name means "no shop".
function ensureShop(s,ref){
  const name=String(ref||'').trim();if(!name)return {state:s,shopId:''};
  const found=findShop(s,name);if(found)return {state:s,shopId:found.id};
  const shop=newShop(s,name);return {state:{...s,shops:[...(s.shops||[]),shop]},shopId:shop.id};
}
function saveShop(s,form){
  const name=String(form.name||'').trim();need(name,'Give the shop a name.');need(name.length<=80,'Use a shorter name.');
  need(!form.kind||SHOP_KINDS.some(k=>k[0]===form.kind),'Choose a kind of shop.');
  const clash=(s.shops||[]).find(x=>x.id!==form.id&&shopKey(x.name)===shopKey(name));need(!clash,'You already have a shop called '+clash?.name+'.');
  const old=(s.shops||[]).find(x=>x.id===form.id);
  const clean={...form,name,area:String(form.area||'').trim(),website:String(form.website||'').trim(),notes:String(form.notes||'').trim(),aliases:(form.aliases||[]).map(x=>String(x).trim()).filter(Boolean)};
  if(!old){const shop={...newShop(s,name),...clean,id:newShop(s,name).id};return {...s,shops:[...(s.shops||[]),shop]};}
  let next={...s,shops:s.shops.map(x=>x.id===old.id?{...old,...clean}:x)};
  if(old.name!==name){// Renaming: keep the stored names in step so lists, receipts and notes read the same.
    const was=old.name+' · ',fix=x=>x.shopId===old.id?{...x,merchant:name}:x;
    const receiptIds=new Set(next.receipts.filter(r=>r.shopId===old.id).map(r=>r.id));
    next={...next,receipts:next.receipts.map(fix),lists:next.lists.map(fix),lots:next.lots.map(fix),resources:next.resources.map(fix),
      expenses:next.expenses.map(x=>receiptIds.has(x.receiptId)&&typeof x.note==='string'&&x.note.startsWith(was)?{...x,note:name+' · '+x.note.slice(was.length)}:x),
      items:next.items.map(i=>({...i,...(i.usualShopId===old.id?{shop:name}:{}),observations:(i.observations||[]).map(fix)}))};
  }
  return next;
}
// Removing a shop only removes the record. Purchases keep the shop's name as text.
function removeShop(s,id){
  need((s.shops||[]).some(x=>x.id===id),'Shop not found.');
  const un=x=>{if(x.shopId!==id)return x;const o={...x};delete o.shopId;return o;};
  return {...s,shops:s.shops.filter(x=>x.id!==id),receipts:s.receipts.map(un),lists:s.lists.map(un),lots:s.lots.map(un),resources:s.resources.map(un),
    items:s.items.map(i=>{const o={...i,observations:(i.observations||[]).map(un)};if(o.shopId===id)delete o.shopId;if(o.usualShopId===id)delete o.usualShopId;return o;})};
}
function shopMatches(s,shop,x){return x.shopId?x.shopId===shop.id:shopKey(x.merchant)===shopKey(shop.name)||(shop.aliases||[]).some(a=>shopKey(a)===shopKey(x.merchant));}
// Visits, spending and the products bought at one shop.
function shopStats(s,shop){
  const receipts=s.receipts.filter(r=>shopMatches(s,shop,r)).sort((a,b)=>b.date.localeCompare(a.date));
  const products=[];
  for(const i of s.items){const obs=(i.observations||[]).filter(o=>shopMatches(s,shop,o)).sort((a,b)=>b.date.localeCompare(a.date));if(obs.length)products.push({item:i,count:obs.length,last:obs[0],unitPence:unitPrice(obs[0])});}
  products.sort((a,b)=>b.last.date.localeCompare(a.last.date)||a.item.name.localeCompare(b.item.name));
  // A visit is a day you bought something here, however it was recorded.
  const dates=[...receipts.map(r=>r.date),...s.items.flatMap(i=>(i.observations||[]).filter(o=>shopMatches(s,shop,o)).map(o=>o.date))].sort();
  return {receipts,products,visits:new Set(dates).size,spentPence:receipts.reduce((n,r)=>n+r.paidPence,0),lastVisit:dates.at(-1)||'',ownProducts:s.items.filter(i=>i.shopId===shop.id)};
}

// Products: a general type ("Chocolate bar"), then optional brand, then optional shop (own-brand).
// What a product is, in one line: the type it is filed under, the brand, and whose own product it is.
function productLine(s,i){const node=i.typeId?typeNode(s,i.typeId):null;return [node&&node.name.toLocaleLowerCase('en-GB')!==String(i.name||'').toLocaleLowerCase('en-GB')?node.name:'',i.brand,i.shopId?findShop(s,i.shopId)?.name:''].filter(Boolean).join(' · ');}


// ---- Who sells it: a shop's own product, or one you can buy anywhere ----------------------
// Some products belong to one shop and are not sold anywhere else: Morrisons Savers, Morrisons
// The Best, Lidl's Milbona, Aldi's Specially Selected. Everything else - Philadelphia, Nissin,
// a plain white loaf - is the same product wherever you find it, so its prices can be compared
// between shops. A product with no own shop is treated as sold anywhere.
const OWN_LABELS=[
 ['Morrisons',['Morrisons Savers','Morrisons The Best','Morrisons The Fishmonger\u2019s','Morrisons The Greengrocer\u2019s','Morrisons The Butcher\u2019s','Morrisons The Baker\u2019s','Morrisons Market St','Morrisons Market Street','Morrisons Free From','Morrisons','Nutmeg']],
 ['Lidl',['Lidl','Deluxe','Milbona','Cien','Formil','Crownfield','Freeway','Dulano','Combino','Chef Select','Snaktastic','Italiamo','Vemondo','Harvest Basket','Birchwood','Ocean Sea','Alesto','Bellarom','Kania','Maribel','Solevita','Pilos','Belbake','Lupilu','Vitasia','Sondey','Goldessa','Newgate','Eridanous','McEnnedy','W5']],
 ['Aldi',['Aldi','Specially Selected','Everyday Essentials','Nature\u2019s Pick','Ashfields','Cowbelle','Bramwells','Village Bakery','Snackrite','Almat','Lacura','Harvest Morn','The Foodie Market','Four Seasons','Emporium','Corale','Brooklea','Oakhurst','Inspired Cuisine']],
 ['Tesco',['Tesco Finest','Tesco','Stockwell & Co','Hearty Food Co','Ms Molly\u2019s','Creamfields','Eastman\u2019s','Redmere Farms','Willow Farms','Woodside Farms','Rosedene Farms','Nightingale Farms','Suntrail Farms','Boswell Farms']],
 ['Sainsbury\u2019s',['Taste the Difference','By Sainsbury\u2019s','Sainsbury\u2019s','Stamford Street']],
 ['Asda',['Asda Extra Special','Asda Just Essentials','Just Essentials','Asda']],
 ['Co-op',['Co-op Irresistible','Co-op','Coop']],
 ['Waitrose',['Essential Waitrose','Waitrose No 1','Waitrose','Duchy Organic']],
 ['M&S',['Marks & Spencer','Marks and Spencer','M&S']],
 ['Iceland',['Iceland']],
];
function labelKey(x){return String(x||'').toLocaleLowerCase('en-GB').replace(/[\u2019']/g,'').replace(/[^a-z0-9&]+/g,' ').trim();}
// The shop's own range a product name starts with, e.g. "Morrisons Savers Cheese Slices 200g".
function ownLabelGuess(name){
  const key=labelKey(name);if(!key)return null;let best=null;
  for(const [shop,ranges] of OWN_LABELS)for(const range of ranges){const r=labelKey(range);
    if((key===r||key.startsWith(r+' '))&&(!best||r.length>best.key.length))best={shop,brand:range,key:r};}
  return best?{shop:best.shop,brand:best.brand}:null;
}
function ownShopOf(s,item){return item&&item.shopId?findShop(s,item.shopId):null;}
function soldAnywhere(item){return !(item&&item.shopId);}
function listWords(xs){return xs.length<2?xs.join(''):xs.slice(0,-1).join(', ')+' and '+xs[xs.length-1];}
// Where you can buy it: its own shop only, or every shop you have seen it in.
function whereToBuy(s,item){
  const own=ownShopOf(s,item),seen=[];
  for(const o of (item&&item.observations)||[]){const n=shopName(s,o);if(n&&!seen.includes(n))seen.push(n);}
  return {own,shops:seen,anywhere:!own,
   text:own?'Only at '+own.name:seen.length?'Sold anywhere \u00b7 you buy it at '+listWords(seen.slice(0,3)):'Sold anywhere'};
}
// Products of one kind, split into the ones anyone sells and each shop's own versions.
function sellerGroups(s,items){
  const any=items.filter(i=>!i.shopId),out=any.length?[{key:'any',label:'Sold anywhere',items:any}]:[];
  const byShop=new Map();
  for(const i of items)if(i.shopId){const g=byShop.get(i.shopId)||{key:i.shopId,label:'Only at '+((findShop(s,i.shopId)||{}).name||'one shop'),items:[]};g.items.push(i);byShop.set(i.shopId,g);}
  return [...out,...[...byShop.values()].sort((a,b)=>a.label.localeCompare(b.label))];
}
// A bought line can name whose own product it is; an empty name means any shop sells it.
function ownLabelFor(s,l){
  if(l.ownShop!=null){const n=String(l.ownShop).trim();if(!n)return null;const g=ownLabelGuess(l.name);
   return {shop:n,brand:l.brand||(g&&shopKey(g.shop)===shopKey(n)?g.brand:'')};}
  const g=ownLabelGuess(l.name);return g?{shop:g.shop,brand:g.brand}:null;
}

// Prices: every purchase is a price record (from a receipt or added by hand), with optional offer details.
function unitPrice(o){return o.quantity>0?Math.round(o.linePence/o.quantity):o.linePence;}
function tidyPrice(o){const x={...o};if(!x.offer)delete x.offer;if(x.regularPence==null||x.regularPence==='')delete x.regularPence;if(!x.note)delete x.note;else x.note=String(x.note).trim();if(!x.shopId)delete x.shopId;if(!x.merchant)delete x.merchant;return x;}
function priceInput(s,d){
  need(validDate(d.date),'Choose the date.');const quantity=d.quantity==null||d.quantity===''?1:positive(d.quantity);
  need(Number.isSafeInteger(d.linePence)&&d.linePence>=0,'Enter the price you paid.');
  need(d.regularPence==null||Number.isSafeInteger(d.regularPence)&&d.regularPence>=0,'Check the normal price.');
  const linked=ensureShop(s,d.shopId&&findShop(s,d.shopId)?d.shopId:d.shop);
  return {state:linked.state,fields:{date:d.date,quantity,linePence:d.linePence,shopId:linked.shopId,merchant:linked.shopId?findShop(linked.state,linked.shopId).name:'',offer:!!d.offer,regularPence:d.regularPence,note:d.note}};
}
function addPrice(s,itemId,d){
  need(s.items.some(i=>i.id===itemId),'Item not found.');const {state,fields}=priceInput(s,d);
  return {...state,items:state.items.map(i=>i.id===itemId?withPriceHistory(i,[...(i.observations||[]),tidyPrice({id:uid('price'),source:'manual',...fields})]):i)};
}
// Receipt prices keep their amount and date (change those on the receipt); offer details and notes can change.
function editPrice(s,itemId,priceId,d){
  const item=s.items.find(i=>i.id===itemId);need(item,'Item not found.');const old=(item.observations||[]).find(o=>o.id===priceId);need(old,'Price not found.');
  if(old.receiptId){need(d.regularPence==null||Number.isSafeInteger(d.regularPence)&&d.regularPence>=0,'Check the normal price.');
    const next=tidyPrice({...old,offer:!!d.offer,regularPence:d.regularPence,note:d.note});return {...s,items:s.items.map(i=>i.id===itemId?withPriceHistory(i,i.observations.map(o=>o.id===priceId?next:o)):i)};}
  const {state,fields}=priceInput(s,d);
  return {...state,items:state.items.map(i=>i.id===itemId?withPriceHistory(i,i.observations.map(o=>o.id===priceId?tidyPrice({...o,...fields}):o)):i)};
}
function removePrice(s,itemId,priceId){
  const item=s.items.find(i=>i.id===itemId);need(item,'Item not found.');const old=(item.observations||[]).find(o=>o.id===priceId);need(old,'Price not found.');
  need(!old.receiptId,'This price comes from a receipt. Remove that line from the receipt instead.');
  return {...s,items:s.items.map(i=>i.id===itemId?withPriceHistory(i,i.observations.filter(o=>o.id!==priceId)):i)};
}
// Price history for one product: every price per unit in date order, grouped by shop, with the change since last time.
function priceHistory(s,item){
  const points=(item.observations||[]).map((o,n)=>({...o,id:o.id||'obs-'+n,unitPence:unitPrice(o),shop:shopName(s,o)||'Shop not recorded',shopKey:o.shopId||('name:'+shopKey(shopName(s,o)))})).sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
  if(!points.length)return {points,shops:[]};
  const byShop=new Map();for(const p of points){const x=byShop.get(p.shopKey)||{key:p.shopKey,shop:p.shop,points:[]};x.points.push(p);byShop.set(p.shopKey,x);}
  const shops=[...byShop.values()].map(x=>({...x,latest:x.points.at(-1),lowest:x.points.reduce((a,b)=>b.unitPence<a.unitPence?b:a),highest:x.points.reduce((a,b)=>b.unitPence>a.unitPence?b:a)})).sort((a,b)=>b.latest.date.localeCompare(a.latest.date));
  const latest=points.at(-1),previous=byShop.get(latest.shopKey).points.at(-2)||null;
  return {points,shops,latest,previous,change:previous&&previous.unitPence?(latest.unitPence-previous.unitPence)/previous.unitPence:null,
    lowest:points.reduce((a,b)=>b.unitPence<a.unitPence?b:a),highest:points.reduce((a,b)=>b.unitPence>a.unitPence?b:a),offers:points.filter(p=>p.offer||p.regularPence>p.unitPence).length};
}
// Which stock rows fit a recipe ingredient: the exact product, any product of the same general type, or the same name.
function ingredientMatcher(s,ing){
  if(ing.sourceIds?.length)return r=>ing.sourceIds.includes(r.id);
  const idx=itemIndex(s),key=itemKey(ing.name),wanted=ing.typeId?typeDescendants(s,ing.typeId):null;
  return r=>{const item=(r.itemId&&s.items.find(i=>i.id===r.itemId))||idx.get(itemKey(r.name));
    if(ing.itemId)return item?.id===ing.itemId||(!item&&itemKey(r.name)===key);
    if(wanted){const id=item?.typeId||classifyTypeId(s,r.name,item?.categoryId||r.categoryId);if(id&&wanted.has(id))return true;}
    return itemKey(r.name)===key;};
}
// Take something out of the cupboard record entirely (it was never there, or you gave it away).
// This is not "used" or "thrown away", so it does not appear in history. Any purchase stays in your spending.
function removeStockRow(s,id){
  const row=stockRows(s).find(r=>r.id===id);need(row,'Stock item not found.');
  need(!reservedAmount(s,id),'Some of it is kept for a planned meal. Change that meal first.');
  // Past use stays in your history: each record keeps the name and unit it needs.
  const stockEvents=s.stockEvents.map(e=>e.sourceId===id?{...e,name:e.name||row.name,unit:e.unit||row.unit}:e);
  if(row.source==='lot')return {...s,stockEvents,lots:s.lots.filter(l=>l.id!==id)};
  const r=s.resources.find(x=>x.id===id);need(!r.scheduledDate,'This one has a date in the original calendar. Remove it there first.');
  const meta={...s.resourceMeta};delete meta[id];
  return {...s,stockEvents,resources:s.resources.filter(x=>x.id!==id),resourceMeta:meta};
}


// ---- Things you keep ---------------------------------------------------------------------
// A pan, a power bank, storage boxes: owned, never used up. You can record when one goes,
// and put it back if it turns up again. Nothing here counts as consumption.
const KEEP_REASONS=[['binned','Threw it away'],['broke','It broke'],['gave','Gave it away'],['sold','Sold it'],['lost','Lost it'],['returned','Returned it to the shop']];
function keepLabel(reason){return (KEEP_REASONS.find(k=>k[0]===reason)||['','No longer here'])[1];}
function keptRows(s){return stockRows(s).filter(r=>r.tracking==='durable');}
function keptSince(s,row){
  const lot=row.source==='lot'?s.lots.find(l=>l.id===row.id):null;
  return row.purchased||lot?.purchased||lot?.added||row.since||'';
}
function keptAge(s,row,today=isoDate(new Date())){const from=keptSince(s,row);if(!validDate(from))return null;const months=daysBetween(from,today)/30.44;return {from,months,text:months<1.5?Math.max(1,Math.round(daysBetween(from,today)))+' days':months<24?Math.round(months)+' months':(Math.round(months/12*10)/10)+' years'};}
function retireStock(s,id,{reason='binned',date=isoDate(new Date()),note=''}={}){
  const row=stockRows(s).find(r=>r.id===id);need(row,'Stock item not found.');
  need(row.tracking==='durable','Use the cupboard actions for things you use up.');
  need(row.remaining>0,'This one is already recorded as gone.');
  need(validDate(date),'Choose a valid date.');need(KEEP_REASONS.some(k=>k[0]===reason),'Choose what happened to it.');
  need(!reservedAmount(s,id),'It is kept for a planned meal. Change that meal first.');
  const event={id:uid('event'),sourceId:id,action:'retire',reason,amount:row.remaining,unit:row.unit,name:row.name,date,note:String(note||'').trim()};
  const next=row.source==='lot'?{...s,lots:s.lots.map(l=>l.id===id?{...l,remaining:0,retired:{reason,date}}:l)}
    :{...s,resources:s.resources.map(r=>r.id===id?{...r,used:true,usedDate:date}:r),resourceMeta:{...s.resourceMeta,[id]:{...s.resourceMeta[id],retired:{reason,date}}}};
  return {...next,stockEvents:[...next.stockEvents,event]};
}
// It turned up again, or it was recorded by mistake.
function keepStock(s,id){
  const rows=[...s.lots,...s.resources],row=rows.find(r=>r.id===id);need(row,'Stock item not found.');
  const events=s.stockEvents.filter(e=>e.sourceId===id&&e.action==='retire');need(events.length,'This one is not recorded as gone.');
  const last=events.at(-1),amount=Number(last.amount)||1;
  const next=s.lots.some(l=>l.id===id)
    ? {...s,lots:s.lots.map(l=>{if(l.id!==id)return l;const o={...l,remaining:Math.min(l.quantity,amount)};delete o.retired;return o;})}
    : {...s,resources:s.resources.map(r=>r.id===id?{...r,used:false,usedDate:''}:r),resourceMeta:(()=>{const m={...s.resourceMeta,[id]:{...s.resourceMeta[id]}};delete m[id].retired;return m;})()};
  return {...next,stockEvents:next.stockEvents.filter(e=>e.id!==last.id)};
}
function retiredInfo(s,row){
  const lot=row.source==='lot'?s.lots.find(l=>l.id===row.id):null,meta=row.source==='resource'?s.resourceMeta[row.id]:null;
  const kept=lot?.retired||meta?.retired;if(kept)return kept;
  const ev=[...s.stockEvents].reverse().find(e=>e.sourceId===row.id&&e.action==='retire');
  return ev?{reason:ev.reason,date:ev.date}:null;
}
