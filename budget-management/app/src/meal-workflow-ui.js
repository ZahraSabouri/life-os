function workflowStockGroups(s){
 const groups=new Map();for(const r of stockRows(s).filter(r=>r.remaining>0&&r.tracking!=='durable')){
  const key=itemKey(r.name)+'|'+unitKey(r.unit);if(!groups.has(key))groups.set(key,{key,name:r.name,unit:r.unit,ids:[],free:0});
  const g=groups.get(key);g.ids.push(r.id);g.free+=Math.max(0,r.remaining-reservedAmount(s,r.id));
 }return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
const oldWorkflowDialog=ProductDialog, oldWorkflowMeals=MealsV2, oldWorkflowMoney=MoneyV2;
ProductDialog=function workflowDialog(p){
 const extra={'paste-receipt':PasteReceipt,'prep-plan':PrepPlan,'prepared-meal':PreparedMeal};
 const C=extra[p.dialog.type];return C?e(C,p):e(oldWorkflowDialog,p);
};
function PasteReceipt({state:s,dialog:d,setDialog,onClose}){
 const [raw,setRaw]=useState(''),[err,setErr]=useState('');
 return e(Modal,{title:'Paste a receipt',onClose,wide:true},e('div',{className:'dialog-body form-stack'},
  e('p',null,'Copy the item lines and total from your digital receipt. You can also paste one item per line as name | line total.'),
  e(Textarea,{label:'Receipt text',value:raw,onChange:setRaw,rows:14,placeholder:'Eggs | 1.69\nHalloumi | 1.99'}),
  e(ErrorMessage,{error:err}),e(Btn,{kind:'primary',onClick:()=>{try{setDialog({type:'receipt',replaceReceiptId:d.replaceReceiptId,prefill:parseReceiptText(s,raw)});}catch(x){setErr(x.message);}}},'Review items and total')),e(DialogFooter,{onClose,label:'Cancel'}));
}
MoneyV2=function workflowMoney(p){
 const s=p.state,m=p.selectedMonth,pending=(s.pendingPayments||[]).filter(x=>x.month===m),simple=s.receipts.filter(r=>r.date.startsWith(m)&&r.lines.length===1&&r.lines[0].categoryId==='uncategorised'),total=pending.reduce((n,x)=>n+x.pence,0);
 return e(React.Fragment,null,e('div',{className:'workflow-tools'},e(Btn,{icon:'plus',onClick:()=>p.setDialog({type:'paste-receipt'})},'Paste a receipt')),
 (pending.length>0||simple.length>0)&&e('section',{className:'surface payment-review'},e('h2',null,'Payments to check'),pending.map(x=>e('div',{className:'food-priority',key:x.id},e('div',null,e('strong',null,(x.estimated?'About ':'')+pounds(x.pence)+' not recorded'),e('small',null,x.note)),e(Btn,{small:true,onClick:()=>p.setDialog({type:'receipt',pendingPaymentId:x.id,prefill:{paidPence:x.pence,lines:[{key:uid('draftline'),name:'',quantity:1,unit:'payment',categoryId:'uncategorised',tracking:'none',price:(x.pence/100).toFixed(2),bought:true,stockBasis:'purchase',location:'Cupboard'}]}})},'Complete payment'))),simple.map(r=>e('div',{className:'food-priority',key:r.id},e('div',null,e('strong',null,r.merchant+' · '+pounds(r.paidPence)+' recorded'),e('small',null,'Details or purchase date need checking.')),e(Btn,{small:true,onClick:()=>p.setDialog({type:'receipt-detail',id:r.id})},'Check payment'))),total>0&&e('p',{className:'muted'},'Estimated balance after these unrecorded payments: '+money(budgetFigures(s,m).totalRemaining-total/100)+'. They are not counted in the saved ledger yet.')),
 e(oldWorkflowMoney,p));
};
function PrepPlan({state:s,dialog:d,selectedMonth:m,commit,onClose}){
 const old=s.mealEntries.find(x=>x.id===d.id),today=isoDate(new Date()),[recipe,setRecipe]=useState(old?.recipeId||d.recipeId||''),r=s.recipes.find(x=>x.id===recipe);
 const [date,setDate]=useState(old?.date||(dateMonth(today)===m?today:monthStart(m))),[servings,setServings]=useState(String(old?.servings||r?.servings||2));
 return e(FormModal,{title:old?'Change meal prep':'Plan meal prep',onClose,label:'Save preparation batch',onSubmit:()=>{need(r,'Choose a recipe.');return commit(st=>planMeal(st,{...old,id:old?.id||uid('meal'),date,name:r.name,recipeId:r.id,servings:positive(servings),kind:'prep',slot:'dinner',notes:old?.notes||'Preparation batch; portions are eaten in linked meals.'}),'Batch planned · ingredients reserved');}},
  e(Select,{label:'Recipe to prepare',value:recipe,onChange:v=>{setRecipe(v);setServings(String(s.recipes.find(x=>x.id===v)?.servings||2));},options:[['','Choose a recipe'],...s.recipes.filter(x=>!x.archived).map(x=>[x.id,x.name])]}),
  e('div',{className:'form-grid'},e(Input,{label:'Preparation day',type:'date',value:date,onChange:setDate,required:true}),e(Input,{label:'Portions to make',type:'number',min:1,step:1,value:servings,onChange:setServings,required:true})),
  e('p',{className:'muted'},'Preparing uses the ingredients once and adds ready portions. Plan meals from those portions with “Use a prepared batch”.'));
}
function PreparedMeal({state:s,dialog:d,selectedMonth:m,commit,onClose}){
 const today=isoDate(new Date()),[batchId,setBatch]=useState(d.batchId||''),batch=s.mealEntries.find(x=>x.id===batchId);
 const [date,setDate]=useState(dateMonth(today)===m?today:monthStart(m)),[slot,setSlot]=useState('dinner'),[n,setN]=useState('1'),[name,setName]=useState('');
 return e(FormModal,{title:'Use a prepared batch',onClose,label:'Save meal from batch',onSubmit:()=>{need(batch,'Choose a batch.');return commit(st=>planMeal(st,{id:uid('meal'),preparedFrom:batch.id,name:name.trim()||batch.name,date,slot,servings:positive(n)}),'Meal linked · ingredients will not be used twice');}},
  e(Select,{label:'Prepared or planned batch',value:batchId,onChange:setBatch,options:[['','Choose a batch'],...s.mealEntries.filter(x=>x.kind==='prep'&&x.status!=='skipped').map(x=>[x.id,x.name+' · '+prettyDate(x.date)])]}),
  e(Input,{label:'Meal name (optional)',value:name,onChange:setName,placeholder:batch?.name||'Meal'}),
  e('div',{className:'form-grid'},e(Input,{label:'Eating day',type:'date',value:date,min:batch?.date,onChange:setDate,required:true}),e(Select,{label:'Mealtime',value:slot,onChange:setSlot,options:SLOTS})),e(Input,{label:'Portions',type:'number',min:1,step:1,value:n,onChange:setN}),
  e('p',{className:'muted'},'You can plan this before cooking. When the batch is prepared, its portions connect to this meal.'));
}
mealStatus=function workflowMealStatus(m){
 if(m.status==='skipped')return 'Skipped';
 if(m.status==='cooked')return m.prepOnly?'Prepared': 'Eaten';
 if(m.kind==='prep')return m.missing?.length?m.missing.length+' ingredients to check':'Prep · '+m.servings+' portions';
 if(m.waitingForPrep)return 'Waiting for batch';
 if(m.missing?.length)return m.missing.length+' ingredients to check';
 return m.reservations?.length||m.touches?.length?'Ingredients linked':'Planned';
};
const originalUsageText=usageText;
usageText=function workflowUsageText(x){return x.kind==='prep'?{title:x.name,sub:'Prepared batch · ingredients used'}:originalUsageText(x);};
const originalWorkflowHistoryEditor=HistoryEditor;
HistoryEditor=function connectedHistoryEditor(p){const ev=p.state.stockEvents.find(x=>x.id===p.dialog.id);return ev?.mealId?e(MealDetail,{...p,dialog:{type:'meal-detail',id:ev.mealId}}):e(originalWorkflowHistoryEditor,p);};
MealDetail=function workflowMealDetail({state:s,dialog:d,setDialog,commit,onClose}){
 const meal=s.mealEntries.find(x=>x.id===d.id),[err,setErr]=useState(''),[left,setLeft]=useState('0'),[date,setDate]=useState(isoDate(new Date())),[location,setLocation]=useState('Fridge'),[expiry,setExpiry]=useState(''),[frozen,setFrozen]=useState('0');
 if(!meal)return null;
 const recipe=s.recipes.find(r=>r.id===meal.recipeId),batch=s.mealEntries.find(x=>x.id===meal.preparedFrom),lots=preparedLots(s,meal.id),run=(fn,msg)=>commit(fn,msg).catch(x=>setErr(x.message));
 const items=[...meal.reservations.map(r=>({name:r.name,amount:displayQty(r.amount,r.unit),id:r.sourceId})),...(meal.touches||[]).map(t=>({name:t.name,amount:t.recipe||'Used some · amount not measured',id:t.sourceId}))];
 return e(Modal,{title:meal.name,kicker:prettyDate(meal.date)+' · '+(meal.kind==='prep'?'Preparation':(SLOTS.find(x=>x[0]===meal.slot)||[,'Meal'])[1]),onClose,wide:true},e('div',{className:'dialog-body form-stack'},
  e(Badge,{tone:meal.status==='cooked'?'green':''},mealStatus(meal)),meal.notes&&e('p',null,meal.notes),
  batch&&e('div',{className:'confirmation-box'},e('strong',null,'From '+batch.name),e('p',null,meal.waitingForPrep?'Prepare the batch before eating this meal.':'This meal uses ready portions.'),e(Btn,{small:true,onClick:()=>setDialog({type:'meal-detail',id:batch.id})},'Open preparation batch')),
  recipe?.steps&&e('details',{open:true},e('summary',null,'Recipe steps'),e('p',{className:'recipe-steps'},recipe.steps)),
  items.length>0&&e('section',null,e('h3',null,meal.status==='cooked'?'Used from your stock':'Ingredients reserved'),items.map((x,i)=>e('div',{className:'summary-line',key:i},e('span',null,x.name),e('b',null,x.amount)))),
  meal.missing.length>0&&e('section',{className:'confirmation-box'},e('h3',null,'Check these ingredients'),meal.missing.map((x,i)=>e('div',{className:'summary-line',key:i},e('span',null,x.name),e('b',null,displayQty(x.quantity,x.unit)))),e('p',null,'They may be at home with an unrecorded amount or another name.'),e('div',{className:'inline-actions'},recipe&&e(Btn,{onClick:()=>setDialog({type:'recipe',id:recipe.id})},'Link ingredients / amounts'),e(Btn,{onClick:()=>setDialog({type:'stock'})},'Add stock already at home'),e(Btn,{onClick:()=>run(st=>missingToList(st,meal.id),'Missing ingredients added to shopping')},'Add missing to shopping'))),
  meal.status==='planned'&&e(React.Fragment,null,
   e(Input,{label:meal.kind==='prep'?'Date prepared':'Date eaten',type:'date',value:date,onChange:setDate,required:true}),
   meal.kind==='prep'?e(React.Fragment,null,e('div',{className:'form-grid'},e(Select,{label:'Store prepared portions in',value:location,onChange:setLocation,options:['Fridge','Freezer']}),e(Input,{label:'Storage/use-by date (from your label)',type:'date',value:expiry,onChange:setExpiry,min:date})),location==='Fridge'&&e(Input,{label:'Portions to freeze instead',type:'number',min:0,max:meal.servings,step:1,value:frozen,onChange:setFrozen}),e(Btn,{kind:'primary',disabled:!!meal.missing.length,onClick:()=>run(st=>prepareMeal(st,meal.id,{date,location,expiry,freezerServings:location==='Fridge'?Number(frozen)||0:0}),'Prepared · ingredients used once, portions added')},'Prepare this batch')):
   e(React.Fragment,null,!meal.preparedFrom&&meal.servings>1&&e(Input,{label:'Portions saved for later',type:'number',min:0,max:meal.servings-1,step:1,value:left,onChange:setLeft}),e(Btn,{kind:'primary',disabled:meal.waitingForPrep||!!meal.missing.length,onClick:()=>run(st=>cookMeal(st,meal.id,Number(left)||0,false,{date}),'Eaten · stock and history updated')},'I ate this')),
   e('div',{className:'inline-actions'},e(Btn,{onClick:()=>run(st=>refreshMeal(st,meal.id),'Ingredients checked again')},'Check stock again'),!meal.preparedFrom&&e(Btn,{onClick:()=>setDialog({type:meal.kind==='prep'?'prep-plan':'meal',id:meal.id})},meal.kind==='prep'?'Change batch':'Change meal'),e(Btn,{onClick:()=>run(st=>skipWorkflowMeal(st,meal.id),'Skipped · reservations released')},meal.kind==='prep'?'Skip batch and linked meals':'Skip'))),
  lots.length>0&&e('section',{className:'prepared-summary'},e('h3',null,'Prepared portions'),lots.map(l=>e('div',{className:'summary-line',key:l.id},e('span',null,l.location+(l.expiry?' · '+prettyDate(l.expiry):' · storage date not recorded')),e('b',null,displayQty(l.remaining,l.unit)+' left'))),meal.prepOnly&&e(Btn,{onClick:()=>setDialog({type:'prepared-meal',batchId:meal.id})},'Plan a meal from this batch')),
  meal.status==='cooked'&&e(Btn,{onClick:()=>run(st=>uneatMeal(st,meal.id),'Undone · stock restored')},meal.prepOnly?'Undo preparation':'Not eaten after all'),e(ErrorMessage,{error:err})),e(DialogFooter,{onClose,label:'Done'}));
};
function FoodPlanPanel({state:s,setDialog,act}){
 const plan=s.foodPlan;if(!plan)return null;
 const spent=ledger(s).filter(x=>x.date>=plan.start&&x.date<=plan.end&&x.type==='grocery').reduce((n,x)=>n+Math.round(x.amount*100),0),left=plan.budgetPence-spent;
 return e('section',{className:'surface food-plan-panel'},e('div',{className:'section-heading'},e('div',null,e('h2',null,'Your food plan'),e('p',{className:'muted'},prettyDate(plan.start)+' – '+prettyDate(plan.end))),e('div',{className:'food-budget'},e('strong',null,pounds(left)),e('small',null,'grocery budget left'))),e('p',{className:'muted'},pounds(spent)+' food recorded of '+pounds(plan.budgetPence)+'. Household items are separate. '+(plan.budgetNote||'')),
  e('div',{className:'food-priorities'},(plan.priorities||[]).map(t=>{
   const rows=stockRows(s).filter(r=>(t.stockIds||[]).includes(r.id)),live=rows.filter(r=>r.remaining>0),done=t.action==='freeze'?live.length>0&&live.every(r=>r.location==='Freezer'):t.action==='use'&&rows.length>0&&!live.length;
   const linked=s.mealEntries.find(m=>m.status==='planned'&&(m.reservations||[]).some(r=>t.stockIds?.includes(r.sourceId)));
   return e('div',{className:'food-priority'+(done?' done':''),key:t.id},e('div',null,e('strong',null,t.label),e('small',null,done?'Done':t.note||'Check your food label')),e(Btn,{small:true,disabled:done,onClick:()=>t.action==='freeze'?act(st=>moveFoodStock(st,t.stockIds,'Freezer'),'Moved to freezer · stock preserved'):linked?setDialog({type:'meal-detail',id:linked.id}):live.length?setDialog({type:'stock-action',id:live[0].id}):setDialog({type:'stock'})},done?'Done':t.action==='freeze'?'I froze it':linked?'Open meal':'Check / use'));
  })),
  plan.assumptions?.length>0&&e('details',null,e('summary',null,'Amounts and purchases to check'),e('ul',null,plan.assumptions.map((x,i)=>e('li',{key:i},x))),e(Btn,{onClick:()=>setDialog({type:'stock'})},'Add / correct stock')));
}
MealsV2=function workflowMeals(p){
 const s=p.state,view=p.route?.view||'week',m=p.selectedMonth,[query,setQuery]=useState(''),[readyOnly,setReadyOnly]=useState(false),[week,setWeek]=useState(()=>Math.max(0,getWeeks(m).findIndex(w=>w.some(d=>d.date===isoDate(new Date())))));
 useEffect(()=>setWeek(Math.max(0,getWeeks(m).findIndex(w=>w.some(d=>d.date===isoDate(new Date()))))),[m]);
 const tabs=e('div',{className:'page-tabs'},e(Segment,{label:'Meals view',value:view,onChange:v=>p.go({view:v}),options:[['week','Meal plan'],['prep','Meal prep'],['recipes','Recipes'],['original','Original calendar']]}));
 const heading=e(PageHeading,{title:'Meals & recipes',action:e(Btn,{kind:'primary',onClick:()=>p.setDialog({type:view==='prep'?'prep-plan':view==='recipes'?'recipe':'meal'})},view==='prep'?'Plan a batch':view==='recipes'?'Add a recipe':'Add a meal')});
 if(view==='prep'){
  const batches=s.mealEntries.filter(m=>m.kind==='prep'&&m.status!=='skipped');
  return e(React.Fragment,null,heading,tabs,e('div',{className:'workflow-tools'},e(Btn,{onClick:()=>p.go({view:'week'})},'Back to meal plan'),e(Btn,{onClick:()=>p.setDialog({type:'prepared-meal'})},'Use a prepared batch')),e('div',{className:'prep-grid'},batches.map(m=>{const lots=preparedLots(s,m.id),used=s.mealEntries.filter(x=>x.preparedFrom===m.id);return e('article',{className:'surface prep-card',key:m.id},e('h2',null,m.name),e('p',null,prettyDate(m.date)+' · '+m.servings+' portions · '+mealStatus(m)),lots.map(l=>e('p',{key:l.id},displayQty(l.remaining,l.unit)+' in '+l.location)),e('ul',null,used.map(x=>e('li',{key:x.id},prettyDate(x.date)+' · '+x.name+' · '+mealStatus(x)))),e(Btn,{kind:'primary',onClick:()=>p.setDialog({type:'meal-detail',id:m.id})},'Open batch'));})),!batches.length&&e('p',null,'Plan a batch, then link the meals that will use its portions.'));
 }
 if(view==='recipes'){
  const recipes=s.recipes.filter(r=>!r.archived&&r.name.toLowerCase().includes(query.trim().toLowerCase())).map(r=>{let availability;try{availability=recipeAvailability(s,r);}catch{}return {r,availability};}).filter(x=>!readyOnly||x.availability?.ready);
  return e(React.Fragment,null,heading,tabs,e('div',{className:'workflow-tools'},e(Input,{label:'Find a recipe',type:'search',value:query,onChange:setQuery}),e('label',{className:'checkbox-label'},e('input',{type:'checkbox',checked:readyOnly,onChange:ev=>setReadyOnly(ev.target.checked)}),'Ingredients free to use')),
   e('div',{className:'prep-grid recipe-workflow-grid'},recipes.map(({r,availability:a})=>e('article',{className:'surface prep-card',key:r.id},e('h2',null,r.name),e('p',{className:'muted'},r.servings+(r.servings===1?' serving':' servings')+(r.minutes?' · '+r.minutes+' minutes':'')),e('p',{className:a?.ready?'success-text':'muted'},a?.ready?'Ingredients free for this recipe':'Reserved or not recorded: '+(a?.meal.missing||[]).map(i=>i.name).join(', ')),e('div',{className:'inline-actions'},e(Btn,{small:true,onClick:()=>p.setDialog({type:'recipe',id:r.id})},'Recipe / stock links'),e(Btn,{small:true,kind:'primary',onClick:()=>p.setDialog({type:'meal',recipeId:r.id})},'Plan meal'),r.servings>1&&e(Btn,{small:true,onClick:()=>p.setDialog({type:'prep-plan',recipeId:r.id})},'Plan batch'))))),!recipes.length&&e('p',null,'No recipes match this view.'));
 }
 if(view==='original')return e(React.Fragment,null,heading,tabs,e(Planner,p));
 const weeks=getWeeks(m),days=weeks[Math.min(week,weeks.length-1)];
 return e(React.Fragment,null,heading,tabs,e(FoodPlanPanel,p),e('div',{className:'week-toolbar'},e(Btn,{disabled:week===0,onClick:()=>setWeek(week-1)},'← Previous'),e('strong',null,prettyDate(days[0].date)+' — '+prettyDate(days[6].date)),e(Btn,{disabled:week===weeks.length-1,onClick:()=>setWeek(week+1)},'Next →'),e(Btn,{onClick:()=>p.setDialog({type:'copy-week',dates:days.map(d=>d.date)})},'Copy week')),e('div',{className:'meal-week'},days.map(day=>e(MealDay,{key:day.date,state:s,day,setDialog:p.setDialog}))),e(CupboardStarters,{state:s,month:m,setDialog:p.setDialog}));
};
