
const e = React.createElement;
const {useState,useEffect,useMemo} = React;

const APP_KEY = "zahra_food_budget_planner_v1";
const DEFAULT_MONTHLY_BUDGET = 225;
const SEPTEMBER_OPENING_ID = 'exp_september_2026_opening';
function septemberOpeningExpense(){return {id:SEPTEMBER_OPENING_ID,date:'2026-09-09',amount:125,type:'other',category:'Opening spending',note:'Spent before 10 September (assumed)'};}
const MONTHS = [
  {key:"2026-09",label:"September 2026",short:"Sep"},
  {key:"2026-10",label:"October 2026",short:"Oct"},
  {key:"2026-11",label:"November 2026",short:"Nov"},
  {key:"2026-12",label:"December 2026",short:"Dec"},
  {key:"2027-01",label:"January 2027",short:"Jan"},
  {key:"2027-02",label:"February 2027",short:"Feb"},
  {key:"2027-03",label:"March 2027",short:"Mar"},
  {key:"2027-04",label:"April 2027",short:"Apr"},
  {key:"2027-05",label:"May 2027",short:"May"},
  {key:"2027-06",label:"June 2027",short:"Jun"}
];
const MAIN_MONTHS = MONTHS.slice(0,6);

function monthLabel(k){return (MONTHS.find(m=>m.key===k)||{}).label || (/^\d{4}-(0[1-9]|1[0-2])$/.test(k)?new Date(k+'-01T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'}):k) || "Reserve";}
function nextCalendarMonth(month){const [year,m]=month.split('-').map(Number);return m===12?(year+1)+'-01':year+'-'+String(m+1).padStart(2,'0');}
function uid(prefix="id"){return prefix+"_"+Math.random().toString(36).slice(2,10)}
function money(n){return "£"+Number(n||0).toFixed(2)}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function isoDate(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function dateMonth(date){return date ? date.slice(0,7) : ""}
function statusOf(r){return r.used ? "used" : r.scheduledDate ? "scheduled" : "available"}

function displayQty(qty,unit){
  const q=Number(qty);
  const clean=Number.isInteger(q)?String(q):String(Math.round(q*100)/100);
  if(q!==1&&unit==='box')return clean+' boxes';
  if(q!==1&&unit==='loaf')return clean+' loaves';
  const label=q===1?unit:unit.replace(/^half-breast portion\b/,"half-breast portions").replace(/^portion\b/,"portions");
  if(q===1&&/^(rolls|capsules|tablets|sponges|scourers|bags|packs|tins|bottles|pizzas|eggs|fillets|jars|bars)$/.test(unit))return clean+" "+unit.slice(0,-1);
  if(q!==1&&/^(pizza|tin|bottle|pack|bag|jar|bar|item|slice|egg|serving|fillet|sponge|tablet|capsule|roll|carton|box|can|loaf|piece|scourer)$/.test(unit))return clean+" "+unit+"s";
  return clean+" "+label;
}
function allocationSummary(resources,name,month){
  const rows=resources.filter(r=>r.name===name && (month==="reserve"?!r.allocatedMonth:r.allocatedMonth===month));
  if(!rows.length)return null;
  const unit=rows[0].unit;
  const qty=rows.reduce((a,r)=>a+Number(r.qty||0),0);
  const used=rows.filter(r=>r.used).length;
  const scheduled=rows.filter(r=>r.scheduledDate&&!r.used).length;
  return {rows:rows.length,qty,unit,used,scheduled};
}

function withResourcePatch(state,id,patch){
  return {...state,resources:state.resources.map(r=>r.id===id?{...r,...patch}:r)};
}
function withAddedExpense(state,exp){
  return {...state,expenses:[{id:exp.id||uid("exp"),...exp},...state.expenses]};
}
function withDeletedExpense(state,id){
  return {...state,expenses:state.expenses.filter(x=>x.id!==id)};
}
function withMealField(state,date,field,value){
  return {...state,meals:{...state.meals,[date]:{...(state.meals[date]||{}),[field]:value}}};
}
function withBudgetField(state,month,field,value){
  const amount=value===""&&field==="grocery"?null:Math.max(0,Number(value)||0);
  return {...state,budgets:{...state.budgets,[month]:{...(state.budgets[month]||{}),[field]:amount}}};
}

function correctResource(r){
  const x={...r};
  if(x.name==="Thin ham"&&x.unit==="g"&&Number(x.qty)===50){x.qty=1;x.unit="portion (10–12 slices)";}
  if(x.name==="Diced beef"&&x.unit==="g"&&Number(x.qty)===112.5){x.qty=1;x.unit="portion (110–115 g)";}
  if(x.name==="Chicken breast"&&x.unit==="breast"){x.qty=Number(x.qty)*2;x.unit="half-breast portion";}
  if(x.name==="Orange marmalade"){
    x.scope="deadline";x.availableFrom=x.allocatedMonth==="2027-02"?"2026-12":"2026-09";
    x.note="Use this "+x.qty+" g allocation by the end of "+monthLabel(x.allocatedMonth)+".";
  }
  if(x.name==="Current sunflower oil"){x.scope="deadline";x.availableFrom="2026-09";x.note="Use by the end of October; available before then.";}
  if(x.name==="Dark chocolate bar 1"){x.scope="flexible";x.allocatedMonth="";x.availableFrom="2026-09";x.note="Already opened. Use gradually; no September finish deadline.";}
  if(x.name==="Dark chocolate bar 2"){x.scope="opening";x.availableFrom="2027-01";x.note="Open around mid-January 2027, then use gradually.";}
  if(x.name==="Oat drink allocation")x.note="400 ml combined across both flavours, not 400 ml each. Two 200 ml glasses. Follow each carton’s storage label after opening.";
  if(x.name==="Alpen muesli")x.note="190 g per month. At 40 g per bowl: 4.75 bowls. Split before using part.";
  if(x.name==="Nestlé cereal")x.note="125 g per month. At 40 g per bowl: 3.125 bowls. Combined cereals: 315 g per month.";
  if(x.name.endsWith(" tin")&&x.name!=="Tuna")x.note="One fruit tin per month. This fruit choice is flexible; swap months if you prefer.";
  if(x.name==="Unsmoked back bacon")x.note="Carried over from the earlier app. No month chosen in your latest allocation plan.";
  return x;
}
function upgradeState(input){
  if(!input||typeof input!=="object"||Array.isArray(input)||!Array.isArray(input.resources)||!Array.isArray(input.expenses)||!input.budgets||typeof input.budgets!=="object"||Array.isArray(input.budgets)||!input.meals||typeof input.meals!=="object"||Array.isArray(input.meals))throw new Error("This is not a planner backup.");
  const ids=new Set();
  for(const r of input.resources){
    if(!r||typeof r.id!=="string"||ids.has(r.id)||typeof r.name!=="string"||typeof r.unit!=="string"||!Number.isFinite(Number(r.qty))||Number(r.qty)<=0)throw new Error("Invalid resource in backup.");
    if(r.allocatedMonth&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.allocatedMonth))throw new Error("Unknown allocation month.");
    ids.add(r.id);
  }
  for(const exp of input.expenses)if(!exp||typeof exp.id!=="string"||typeof exp.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(exp.date)||!Number.isFinite(Number(exp.amount))||Number(exp.amount)<0||!["grocery","other"].includes(exp.type))throw new Error("Invalid expense in backup.");
  for(const b of Object.values(input.budgets))if(!b||!Number.isFinite(Number(b.total))||Number(b.total)<0||(b.grocery!=null&&(!Number.isFinite(Number(b.grocery))||Number(b.grocery)<0)))throw new Error("Invalid budget in backup.");
  if(Number(input.version)>3)throw new Error("This backup is from a newer app version.");
  if(Number(input.version)===3)return input;
  if(Number(input.version)===2)return withSeptemberOpening(input);
  let resources=input.resources.map(correctResource);
  const looseToilet=resources.filter(r=>r.name==="Toilet roll allowance"&&!r.used&&!r.scheduledDate);
  if(looseToilet.length){
    const qty=looseToilet.reduce((n,r)=>n+Number(r.qty),0);
    resources=resources.filter(r=>!looseToilet.includes(r));
    resources.push(portion("Toilet paper",qty,"rolls","","Household","Cupboard","Flexible goal: about 1.5 rolls per month over ten months. No strict monthly cap."));
  }
  resources=resources.map(r=>r.name==="Toilet roll allowance"?{...r,name:"Toilet paper",note:"Usage or scheduling preserved from your earlier app."}:r);
  const budgets=JSON.parse(JSON.stringify(input.budgets));
  if(budgets["2026-09"]?.grocery===100&&budgets["2026-09"]?.total===100)budgets["2026-09"].grocery=null;
  return withSeptemberOpening({...input,version:2,resources,budgets});
}
function withSeptemberOpening(state){
  const september=state.budgets['2026-09'];
  // Upgrade once, so reloads and backups never duplicate a record the user can
  // later remove. Keep every existing purchase and any customised monthly limit.
  if(!september)return {...state,version:3};
  const budgets=Number(september.total)===100?{...state.budgets,'2026-09':{...september,total:DEFAULT_MONTHLY_BUDGET,note:'£225 total monthly allowance; £125 assumed spent before 10 September.'}}:state.budgets;
  const expenses=state.expenses.some(x=>x.id===SEPTEMBER_OPENING_ID)?state.expenses:[...state.expenses,septemberOpeningExpense()];
  return {...state,version:3,budgets,expenses};
}
function withSplitResource(state,id,amount){
  const r=state.resources.find(x=>x.id===id),n=Number(amount);
  if(!r||r.used||r.scheduledDate||!Number.isFinite(n)||n<=0||n>=Number(r.qty))return state;
  if(!["g","ml","tin","bottle"].includes(r.unit)&&!Number.isInteger(n))return state;
  const left=Number((Number(r.qty)-n).toFixed(6));
  return {...state,resources:state.resources.flatMap(x=>x.id===id?[{...r,qty:left},{...r,id:uid("res"),qty:n,parentId:r.parentId||r.id}]:[x])};
}
function canSplit(r){return !r.used&&!r.scheduledDate&&(["g","ml","tin","bottle"].includes(r.unit)||Number(r.qty)>1);}
function inPlanningMonth(r,month){
  if(r.scope==="deadline")return month>=r.availableFrom&&month<=r.allocatedMonth;
  if(r.scope==="flexible"||r.scope==="opening")return month>=(r.availableFrom||"2026-09")&&month<="2027-02";
  return r.allocatedMonth===month;
}
// A big stock-up feeds several months, so its cost can be shared between them instead of
// landing on the month you happened to pay. The receipt still shows the full amount you paid.
function spreadParts(total,n,from){
  const step=total<0?-1:1,base=Math.trunc(total/n),rest=Math.abs(total-base*n),out=[];
  let key=from;
  for(let i=0;i<n;i++){out.push([key,base+(i<rest?step:0)]);key=nextCalendarMonth(key);}
  return out;
}
function spreadOf(state,expense){
  if(!expense.receiptId)return null;
  const r=(state.receipts||[]).find(x=>x.id===expense.receiptId);
  const n=r&&Number(r.spreadMonths);
  return n>1&&validDate(r.date)?{n:Math.min(60,Math.round(n)),from:dateMonth(r.date)}:null;
}
function budgetFigures(state,month){
  const b=state.budgets[month]||{grocery:null,total:0};
  const pence=n=>Math.round(Number(n)*100),spending=new Map();
  for(const expense of state.expenses){
    const sp=spreadOf(state,expense),total=pence(expense.amount);
    const parts=sp?spreadParts(total,sp.n,sp.from):[[dateMonth(expense.date),total]];
    for(const [key,amount] of parts){
      const row=spending.get(key)||{total:0,grocery:0};
      row.total+=amount;
      if(expense.type==='grocery')row.grocery+=amount;
      spending.set(key,row);
    }
  }
  // Recompute debt from the ledger, in pennies. Savings never increase a later
  // allowance; a missing budget contributes zero, so outstanding debt is retained.
  const months=[...new Set([...Object.keys(state.budgets),...spending.keys()])].filter(key=>/^\d{4}-(0[1-9]|1[0-2])$/.test(key)&&key<month).sort();
  let debt=0;
  for(const key of months)debt=Math.max(0,debt+(spending.get(key)?.total||0)-pence(state.budgets[key]?.total||0));
  const spent=spending.get(month)||{total:0,grocery:0},base=pence(b.total),adjusted=base-debt,remaining=adjusted-spent.total;
  const groceryCap=b.grocery==null?Math.max(0,adjusted):pence(b.grocery);
  const groceryRemaining=Math.min(groceryCap-spent.grocery,remaining);
  const otherRemaining=b.grocery==null?remaining:Math.min(Math.max(0,adjusted-groceryCap)-(spent.total-spent.grocery),remaining);
  return {b,baseTotal:base/100,carryIn:debt/100,adjustedTotal:adjusted/100,carryOut:Math.max(0,-remaining)/100,nextMonth:nextCalendarMonth(month),grocerySpent:spent.grocery/100,totalSpent:spent.total/100,totalRemaining:remaining/100,groceryLimit:groceryCap/100,groceryRemaining:groceryRemaining/100,otherRemaining:otherRemaining/100};
}


function portion(name, qty, unit, month, category="Food", storage="Freezer", note=""){
  return {id:uid("res"),name,qty,unit,allocatedMonth:month||"",category,storage,note,scheduledDate:"",used:false,usedDate:""};
}
function monthly(name, qty, unit, months, category="Food", storage="Pantry", note=""){
  return months.map(x=>portion(name,qty,unit,x,category,storage,note));
}

function defaultResources(){
  let r=[];

  // Food/freezer resources
  ["2026-10","2026-12","2027-02"].forEach(m=>r.push(portion("Tofu",100,"g",m,"Food","Freezer","1 frozen bag")));
  r.push({...portion("Mushrooms",60,"g","2026-09","Food","Freezer","Used 9 Sep"),used:true,usedDate:"2026-09-09"});
  ["2026-11","2026-12","2027-02"].forEach(m=>r.push(portion("Mushrooms",60,"g",m,"Food","Freezer","1 frozen bag")));
  ["2026-10","2026-11","2026-12","2027-01","2027-02"].forEach(m=>r.push(portion("Cheddar slices",2,"slices",m,"Food","Freezer","2 slices per withdrawal")));
  ["2026-10","2026-11","2026-12","2027-01","2027-02"].forEach(m=>r.push(portion("Grated cheese",100,"g",m,"Food","Freezer","1 bag")));
  ["2026-10","2026-11","2026-12","2027-01","2027-02"].forEach(m=>r.push(portion("Spinach",90,"g",m,"Food","Freezer","1 bag")));

  r.push(portion("Thin ham",50,"g","2026-09","Food","Fridge","Current fridge portion"));
  r.push(portion("Thin ham",50,"g","2026-09","Food","Freezer"));
  ["2026-10","2026-11","2026-12","2027-01","2027-02"].forEach(m=>r.push(portion("Thin ham",50,"g",m,"Food","Freezer")));
  r.push(portion("Thin ham",50,"g","","Food","Freezer","Reserve / unallocated"));

  // Bacon was portioned but not given a month allocation, so keep as reserve.
  for(let i=0;i<5;i++) r.push(portion("Unsmoked back bacon",60,"g","","Food","Freezer","Reserve until allocated"));

  ["2026-10","2026-11","2026-12","2027-01","2027-02"].forEach(m=>r.push(portion("5% steak mince",100,"g",m,"Food","Freezer")));
  ["2026-10","2026-12","2027-01","2027-02"].forEach(m=>r.push(portion("Diced beef",112.5,"g",m,"Food","Freezer","Approx. 110–115g")));
  ["2026-10","2026-12","2027-01","2027-02"].forEach(m=>r.push(portion("Salmon fillet",1,"fillet",m,"Food","Freezer")));
  ["2026-12","2027-02"].forEach(m=>r.push(portion("King prawns",75,"g",m,"Food","Freezer")));

  // 13 half-breast portions: 2 each month, with December receiving the extra 13th portion.
  const chickenAlloc={"2026-09":2,"2026-10":2,"2026-11":2,"2026-12":3,"2027-01":2,"2027-02":2};
  Object.entries(chickenAlloc).forEach(([m,n])=>{
    for(let i=0;i<n;i++) r.push(portion("Chicken breast",0.5,"breast",m,"Food","Freezer","Half-breast portion"));
  });

  ["2026-10","2026-12"].forEach(m=>r.push(portion("Mini pizza",1,"pizza",m,"Food","Freezer")));
  ["2026-10","2026-11","2027-01","2027-02"].forEach(m=>r.push(portion("Battered white fish",1,"fillet",m,"Food","Freezer")));

  // Tuna tins
  const tunaAlloc={"2026-09":1,"2026-10":1,"2026-11":1,"2026-12":2,"2027-01":1,"2027-02":2};
  Object.entries(tunaAlloc).forEach(([m,n])=>{
    for(let i=0;i<n;i++) r.push(portion("Tuna",1,"tin",m,"Food","Pantry","1 tin = about 2 of your meals"));
  });

  // Pasta: four ~125g cooking portions per 500g pack
  for(let i=0;i<2;i++) r.push(portion("Linguine",125,"g","2026-10","Food","Pantry","1/4 of 500g pack"));
  for(let i=0;i<2;i++) r.push(portion("Linguine",125,"g","2026-12","Food","Pantry","1/4 of 500g pack"));
  for(let i=0;i<2;i++) r.push(portion("Fusilli",125,"g","2027-01","Food","Pantry","1/4 of 500g pack"));
  for(let i=0;i<2;i++) r.push(portion("Fusilli",125,"g","2027-02","Food","Pantry","1/4 of 500g pack"));

  // Instant noodles
  const noodleAlloc={"2026-10":2,"2026-11":2,"2026-12":3,"2027-01":3,"2027-02":2};
  Object.entries(noodleAlloc).forEach(([m,n])=>{
    for(let i=0;i<n;i++) r.push(portion("Instant noodles",1,"pack",m,"Food","Pantry"));
  });

  // Fruit tins, one per month. Specific fruit can be moved later.
  [["Pineapple tin","2026-10"],["Mango tin","2026-11"],["Peach tin","2026-12"],["Pear tin","2027-01"],["Apple tin","2027-02"]]
    .forEach(([name,m])=>r.push(portion(name,1,"tin",m,"Food","Pantry","Month choice is editable")));

  // Tea
  [["2026-10",3],["2026-11",3],["2026-12",3],["2027-01",3],["2027-02",4]].forEach(([m,n])=>{
    r.push(portion("Fruit tea",n,"tea bags",m,"Food","Pantry","Monthly allowance"));
  });

  // Cereals
  r.push(...monthly("Alpen muesli",190,"g",["2026-10","2026-11","2026-12","2027-01","2027-02"],"Food","Pantry","~4–5 bowls/month at ~40–45g"));
  r.push(...monthly("Nestlé cereal",125,"g",["2026-10","2026-11","2026-12","2027-01","2027-02"],"Food","Pantry","~3 bowls/month"));

  // Oat milk: allocation rather than physical carton boundary.
  r.push(...monthly("Oat drink allocation",400,"ml",["2026-10","2026-11","2026-12","2027-01","2027-02"],"Food","Pantry","2L total across Oct–Feb; open one carton at a time"));

  // Marmalade / chocolate / honey
  r.push(portion("Orange marmalade",210,"g","2026-11","Food","Pantry","Use roughly first half by end of November"));
  r.push(portion("Orange marmalade",210,"g","2027-02","Food","Pantry","Use second half by end of February"));
  r.push(portion("Dark chocolate bar 1",100,"g","2026-09","Food","Pantry","Already open; use gradually"));
  r.push(portion("Dark chocolate bar 2",100,"g","2027-01","Food","Pantry","Keep sealed until around mid-January"));
  r.push(portion("Spanish honey",340,"g","","Food","Pantry","No strict monthly allocation; reserve / breakfast / sick days"));

  // Long-term cooking supplies
  r.push(portion("Current sunflower oil",1,"bottle","2026-10","Food","Pantry","Target: finish by end of October"));
  r.push(portion("Next sunflower oil",1,"bottle","","Food","Pantry","Long-term reserve; intended to last ~10 months"));
  r.push(portion("Frylight olive-oil spray",1,"bottle","","Food","Pantry","Intended to last ~10 months"));

  // Household supplies: allocations across 10 months Sep-Jun
  MONTHS.forEach((m,idx)=>{
    const toiletQty = idx < 8 ? 2 : 1; // 18 rolls total
    r.push(portion("Toilet roll allowance",toiletQty,"rolls",m.key,"Household","Cupboard","18 rolls over 10 months"));
    r.push(portion("Laundry capsule allowance",6,"capsules",m.key,"Household","Cupboard","≈3 washes/month at 2 capsules per wash"));
    r.push(portion("Scourer allowance",1,"sponge",m.key,"Household","Cupboard","1 scourer/month"));
    const dishQty = idx===0 ? 3 : 4;
    r.push(portion("Dishwasher tablet allowance",dishQty,"tablets",m.key,"Household","Cupboard",idx===0?"3 remaining for September":"4/month"));
  });
  const loose=r.filter(x=>x.name==="Toilet roll allowance");
  r=r.filter(x=>x.name!=="Toilet roll allowance");
  r.push(portion("Toilet paper",loose.reduce((n,x)=>n+x.qty,0),"rolls","","Household","Cupboard","18 rolls. Flexible aim of about 1.5 per month for ten months, leaving approximately 3 in reserve."));
  return r.map(correctResource);
}

function defaultState(){
  return {
    version:3,
    resources:defaultResources(),
    expenses:[septemberOpeningExpense()],
    meals:{},
    budgets:{
      "2026-09":{grocery:null,total:DEFAULT_MONTHLY_BUDGET,note:"£225 total monthly allowance; £125 assumed spent before 10 September."},
      "2026-10":{grocery:125,total:DEFAULT_MONTHLY_BUDGET,note:"£125 grocery ceiling within £225 total monthly spending"},
      "2026-11":{grocery:125,total:DEFAULT_MONTHLY_BUDGET,note:"£125 grocery ceiling within £225 total monthly spending"},
      "2026-12":{grocery:125,total:DEFAULT_MONTHLY_BUDGET,note:"£125 grocery ceiling within £225 total monthly spending"},
      "2027-01":{grocery:125,total:DEFAULT_MONTHLY_BUDGET,note:"£125 grocery ceiling within £225 total monthly spending"},
      "2027-02":{grocery:125,total:DEFAULT_MONTHLY_BUDGET,note:"£125 grocery ceiling within £225 total monthly spending"}
    }
  };
}
function loadState(){
  try{
    const raw=localStorage.getItem(APP_KEY);
    if(!raw)return {state:defaultState(),error:""};
    const parsed=JSON.parse(raw),state=upgradeState(parsed);
    try{if(!localStorage.getItem(APP_KEY+'_before_redesign'))localStorage.setItem(APP_KEY+'_before_redesign',raw);}catch(err){}
    if(!(Number(parsed.version)>=2)&&!localStorage.getItem(APP_KEY+"_before_v1_2"))localStorage.setItem(APP_KEY+"_before_v1_2",raw);
    if(Number(parsed.version)!==3&&!localStorage.getItem(APP_KEY+'_before_september_opening'))localStorage.setItem(APP_KEY+'_before_september_opening',raw);
    return {state,error:""};
  }catch(err){return {state:defaultState(),error:"Saved data could not be loaded. Your previous data has not been overwritten. Import a backup, or use Reset to start a new plan."}}
}

function validDate(date){
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
  const parsed=new Date(date+'T12:00:00');
  return Number.isFinite(parsed.getTime())&&isoDate(parsed)===date;
}
function withAmountAction(state,id,amount,action,date){
  const r=state.resources.find(x=>x.id===id),n=Number(amount);
  if(!r||r.used||!Number.isFinite(n)||n<.000001||n>Number(r.qty)||!['use','schedule'].includes(action)||!validDate(date))throw new Error('Check the amount and date before continuing.');
  if(!['g','ml','tin','bottle'].includes(r.unit)&&!Number.isInteger(n))throw new Error('Use a whole number for this item.');
  if(action==='schedule'&&(r.scheduledDate||!inPlanningMonth(r,dateMonth(date))))throw new Error('This portion cannot be planned for that date.');
  const patch=action==='use'?{used:true,usedDate:date}:{scheduledDate:date};
  if(n===Number(r.qty))return withResourcePatch(state,id,patch);
  const remainder=Number((Number(r.qty)-n).toFixed(6));
  if(remainder<=0)throw new Error('Choose a whole allocation or a smaller amount.');
  return {...state,resources:state.resources.flatMap(x=>x.id===id?[{...r,qty:remainder},{...r,id:uid('res'),parentId:r.parentId||r.id,qty:n,...patch}]:[x])};
}

function getWeeks(monthKey){
  const [y,m]=monthKey.split("-").map(Number);
  const first=new Date(y,m-1,1), last=new Date(y,m,0);
  let start=new Date(first);
  const day=(start.getDay()+6)%7; // Mon=0
  start.setDate(start.getDate()-day);
  const weeks=[];
  let cur=new Date(start);
  while(cur<=last || cur.getMonth()===m-1){
    const days=[];
    for(let i=0;i<7;i++){
      const d=new Date(cur); d.setDate(cur.getDate()+i);
      days.push({date:isoDate(d),inMonth:d.getMonth()===m-1,label:d.toLocaleDateString("en-GB",{weekday:"short"}),day:d.getDate()});
    }
    weeks.push(days);
    cur.setDate(cur.getDate()+7);
    if(weeks.length>6) break;
    if(cur>last && cur.getDay()===1) break;
  }
  return weeks;
}
