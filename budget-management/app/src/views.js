function PageHeading({eyebrow,title,children,action}){return e('div',{className:'page-heading'},e('div',null,eyebrow&&e('span',{className:'eyebrow'},eyebrow),e('h1',null,title),children&&e('p',null,children)),action);}
function Segment({label,options,value,onChange}){return e('div',{className:'segments',role:'group','aria-label':label},options.map(([key,text])=>e('button',{key,type:'button','aria-pressed':value===key,className:value===key?'selected':'',onClick:()=>onChange(key)},text)));}
function ResourceMap(p){
  const {state,selectedMonth:month,setDialog,inventory,setInventory}=p;
  const {category,scope,status,search,mode}=inventory;
  const change=(key,value)=>setInventory(s=>({...s,[key]:value}));
  const rows=state.resources.filter(r=>{
    if(category!=='all'&&r.category!==category)return false;
    if(scope==='month'&&!(r.allocatedMonth===month||inPlanningMonth(r,month)||(!r.allocatedMonth&&r.category==='Household')))return false;
    if(scope==='reserve'&&r.allocatedMonth)return false;
    if(status!=='all'&&statusOf(r)!==status)return false;
    return !search||[r.name,r.note,r.storage].join(' ').toLowerCase().includes(search.toLowerCase());
  });
  const groups=[...new Set(rows.map(r=>JSON.stringify([r.name,r.unit])))].map(key=>{const [name,unit]=JSON.parse(key);return {key,name,unit,rows:rows.filter(r=>r.name===name&&r.unit===unit)};}).sort((a,b)=>a.name.localeCompare(b.name));
  return e(React.Fragment,null,e(PageHeading,{eyebrow:'EVERY PORTION HAS A PLACE',title:'Food & supplies'},'Find what you need, then use, plan or move an exact amount.'),
    e('div',{className:'inventory-tools'},e(Segment,{label:'Resource category',options:[['Food','Food'],['Household','Household'],['all','Everything']],value:category,onChange:v=>change('category',v)}),
      e('div',{className:'search-field'},e(Icon,{name:'search',size:19}),e('input',{'aria-label':'Search food and supplies',placeholder:'Find food or supplies…',value:search,onChange:ev=>change('search',ev.target.value)}),search&&e('button',{'aria-label':'Clear search',onClick:()=>change('search','')},e(Icon,{name:'close',size:16})))),
    e('div',{className:'filter-row'},e('div',{className:'filter-selects'},e('select',{'aria-label':'Allocation period',value:scope,onChange:ev=>change('scope',ev.target.value)},e('option',{value:'month'},monthLabel(month)),e('option',{value:'all'},'All months'),e('option',{value:'reserve'},'Reserve & flexible')),e('select',{'aria-label':'Resource status',value:status,onChange:ev=>change('status',ev.target.value)},e('option',{value:'all'},'All statuses'),e('option',{value:'available'},'Ready to use'),e('option',{value:'scheduled'},'Planned'),e('option',{value:'used'},'Used'))),
      e(Segment,{label:'Resource view',options:[['cards','Easy view'],['map','Allocation map']],value:mode,onChange:v=>change('mode',v)})),
    e('div',{className:'results-line'},e('span',null,groups.length+' resource types',e('span',null,' · '+rows.length+' allocations')),scope==='month'&&e('span',null,'Includes flexible stock available this month')),
    !groups.length?e('section',{className:'surface'},e(Empty,{icon:'search',title:'Nothing matches these filters',action:e(Btn,{onClick:()=>setInventory({...inventory,search:'',status:'all',scope:'all'})},'Show all months')},'Try a different month or clear your search.')):
      mode==='cards'?e('div',{className:'resource-grid'},groups.map(g=>{
        const left=g.rows.filter(r=>!r.used).reduce((n,r)=>n+Number(r.qty),0),total=g.rows.reduce((n,r)=>n+Number(r.qty),0),planned=g.rows.filter(r=>r.scheduledDate&&!r.used).length;
        const stores=[...new Set(g.rows.map(r=>r.storage))].join(' / ');
        return e('article',{className:'resource-card',key:g.key},e('div',{className:'resource-card-top'},e('span',{className:'item-glyph'},e(Icon,{name:g.rows[0].category==='Food'?'leaf':'box'})),e(Badge,{tone:left===0?'green':planned?'blue':''},left===0?'Used up':planned?planned+' planned':'Ready to use')),
          e('h2',null,titleName(g.name)),e('div',{className:'resource-quantity'},displayQty(left,g.unit)),e('p',{className:'muted'},'left of '+displayQty(total,g.unit)+' in this view'),e(Meter,{value:total-left,max:total,label:'Used '+g.name}),e('div',{className:'resource-card-foot'},e('span',null,stores),e('span',null,g.rows.length+' allocation'+(g.rows.length===1?'':'s'))),
          e('button',{className:'resource-open','aria-label':'View '+g.name+' allocations',onClick:()=>setDialog({type:'group',name:g.name,unit:g.unit,ids:g.rows.map(r=>r.id)})},'View & use',e(Icon,{name:'chevron',size:16})))
      })):
      e('section',{className:'surface map-panel'},e('div',{className:'section-heading'},e('div',null,e('h2',null,'Your exact allocation map'),e('p',{className:'muted'},'“By” marks a deadline. Scroll across for later months.'))),e('div',{className:'map-scroll',tabIndex:0,role:'region','aria-label':'Monthly allocation table'},e('table',{className:'allocation-table'},e('thead',null,e('tr',null,e('th',{scope:'col'},'Resource'),MONTHS.map(m=>e('th',{key:m.key,scope:'col',className:m.key===month?'current':''},m.short,e('small',null,m.key.slice(0,4)))),e('th',{scope:'col'},'Reserve'))),e('tbody',null,groups.map(g=>e('tr',{key:g.key},e('th',{scope:'row'},titleName(g.name)),[...MONTHS.map(m=>m.key),'reserve'].map(key=>{const alloc=g.rows.filter(r=>key==='reserve'?!r.allocatedMonth:r.allocatedMonth===key);const q=alloc.reduce((n,r)=>n+Number(r.qty),0);return e('td',{key,className:key===month?'current':''},alloc.length?e('button',{'aria-label':`${g.name}, ${key==='reserve'?'reserve':monthLabel(key)}: ${displayQty(q,g.unit)}`,onClick:()=>setDialog({type:'group',name:g.name,unit:g.unit,ids:alloc.map(r=>r.id)})},alloc.some(r=>r.scope==='deadline')&&e('small',null,'By'),displayQty(q,g.unit),e('small',null,alloc.filter(r=>r.used).length+' of '+alloc.length+' used')):e('span',{className:'map-dash'},'—'));})))))))
  );
}
function Planner(p){
  const {state,selectedMonth:month,setDialog}=p;
  const [view,setView]=useState('month'),[week,setWeek]=useState(0);
  const weeks=getWeeks(month),today=isoDate(new Date());
  useEffect(()=>{const i=getWeeks(month).findIndex(w=>w.some(d=>d.date===today));setWeek(i<0?0:i);},[month]);
  const inMonth=state.resources.filter(r=>r.scheduledDate?.startsWith(month)||(!r.scheduledDate&&r.used&&r.usedDate?.startsWith(month)));
  function assigned(date){return state.resources.filter(r=>r.scheduledDate===date||(!r.scheduledDate&&r.used&&r.usedDate===date));}
  function mealText(date){return Object.entries(state.meals[date]||{}).filter(([k,v])=>['breakfast','lunch','dinner'].includes(k)&&v).map(([k,v])=>v);}
  const openDay=date=>setDialog({type:'day',date});
  return e(React.Fragment,null,e(PageHeading,{eyebrow:'FROM THE FREEZER TO YOUR DAY',title:'Meal planner',action:e(Btn,{kind:'primary',icon:'plus',onClick:()=>openDay(monthStart(month))},'Plan a day')},'Choose a day. Add meals and the portions you want to use.'),
    e('div',{className:'planner-toolbar'},e(Segment,{label:'Calendar view',options:[['month','Month'],['week','Week']],value:view,onChange:setView}),e('span',{className:'muted'},inMonth.filter(r=>!r.used).length+' allocations planned · '+inMonth.filter(r=>r.used).length+' used')),
    view==='month'?e('section',{className:'calendar-panel'},e('div',{className:'weekday-head'},['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>e('div',{key:d},d))),e('div',{className:'calendar-grid'},weeks.flat().map(day=>{const rs=assigned(day.date),meals=mealText(day.date),has=rs.length||meals.length;return e('button',{key:day.date,className:`calendar-day ${day.inMonth?'':'outside'} ${day.date===today?'today':''}`,'aria-label':`Plan ${prettyDate(day.date,{day:'numeric',month:'long',year:'numeric'})}${has?', '+rs.length+' resources and '+meals.length+' meals':''}`,disabled:!day.inMonth,onClick:()=>openDay(day.date)},e('span',{className:'day-number'},day.day),day.inMonth&&e('div',{className:'day-preview'},meals.slice(0,1).map((t,i)=>e('span',{className:'meal-snippet',key:i},t)),rs.slice(0,2).map(r=>e('span',{className:'food-snippet '+(r.used?'done':''),key:r.id},r.used&&e(Icon,{name:'check',size:12}),titleName(r.name))),rs.length>2&&e('small',null,'+'+(rs.length-2)+' more'),!has&&e('span',{className:'day-add'},e(Icon,{name:'plus',size:14}),'Plan')));}))):
      e('section',null,e('div',{className:'week-picker'},e(Btn,{small:true,icon:'back',disabled:week===0,onClick:()=>setWeek(week-1),'aria-label':'Previous week'}),e('strong',null,prettyDate(weeks[week]?.[0].date||month+'-01')+' – '+prettyDate(weeks[week]?.[6].date||month+'-01')),e(Btn,{small:true,icon:'chevron',disabled:week===weeks.length-1,onClick:()=>setWeek(week+1),'aria-label':'Next week'})),e('div',{className:'agenda'},(weeks[week]||[]).filter(d=>d.inMonth).map(day=>{const rs=assigned(day.date),meals=state.meals[day.date]||{};return e('button',{className:'agenda-day',key:day.date,onClick:()=>openDay(day.date),'aria-label':'Edit meals for '+prettyDate(day.date,{day:'numeric',month:'long'})},e('div',{className:'agenda-date'},e('strong',null,day.day),e('span',null,day.label),day.date===today&&e(Badge,{tone:'blue'},'Today')),e('div',{className:'agenda-meals'},['breakfast','lunch','dinner'].map(k=>e('div',{key:k},e('span',null,k),e('p',{className:meals[k]?'':'muted'},meals[k]||'Not planned')))),e('div',{className:'agenda-stock'},rs.length?e(Badge,{tone:'blue'},rs.length+' allocations'):e('span',{className:'muted'},'Add food'),e(Icon,{name:'chevron',size:17})));}))),
    e('div',{className:'planner-note'},e(Icon,{name:'info',size:19}),e('p',null,'Your allocations stay in their original months. For a smaller amount, open Food & supplies and choose Plan. Flexible and deadline items are available within their own windows.'))
  );
}
function Budget(p){
  const {state,selectedMonth:month,openExpense,setDialog}=p;
  const [filter,setFilter]=useState('all'),[search,setSearch]=useState('');
  const f=budgetFigures(state,month),budget=state.budgets[month];
  const expenses=state.expenses.filter(x=>dateMonth(x.date)===month&&(filter==='all'||x.type===filter)&&(!search||[x.category,x.note].join(' ').toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>b.date.localeCompare(a.date));
  return e(React.Fragment,null,e(PageHeading,{eyebrow:'EVERY PURCHASE, A CLEARER PICTURE',title:'Your spending',action:budget&&e(Btn,{kind:'secondary',icon:'settings',onClick:()=>setDialog({type:'limits'})},'Edit limits')},'Groceries are included in your total monthly budget.'),
    !budget?e(React.Fragment,null,e('section',{className:'surface'},e(Empty,{icon:'wallet',title:'No budget set for this month'},'Your agreed budget runs from September to February. Switch months to view it.')),e(RolloverSummary,{state,month,figures:f,compact:true})):
    e(React.Fragment,null,e('div',{className:'spending-cards'},e('section',{className:'spending-total'},e('span',null,'Total remaining'),e('strong',{className:f.totalRemaining<0?'danger-text':''},money(f.totalRemaining)),e(Meter,{value:f.totalSpent+Math.max(0,-f.adjustedTotal),max:Math.max(0,f.adjustedTotal),label:'Total spending'}),e('p',null,money(f.totalSpent)+' spent of '+money(Math.max(0,f.adjustedTotal))+(f.carryIn?' after carry-forward.':' allowance.'))),e('section',{className:'surface spending-metric'},e('span',null,budget.grocery==null?'Available for groceries':'Grocery balance'),e('strong',{className:f.groceryRemaining<0?'danger-text':''},money(f.groceryRemaining)),e('p',null,budget.grocery==null?'Shared with your other spending.':money(f.grocerySpent)+' spent of your '+money(budget.grocery)+' grocery ceiling.')),e('section',{className:'surface spending-metric'},e('span',null,budget.grocery==null?'Other spending so far':'Other spending balance'),e('strong',{className:budget.grocery!=null&&f.otherRemaining<0?'danger-text':''},money(budget.grocery==null?f.totalSpent-f.grocerySpent:f.otherRemaining)),e('p',null,budget.grocery==null?'Also comes out of your shared total.':'After reserving your grocery allowance.'))),
      e(RolloverSummary,{state,month,figures:f}),
      e('section',{className:'surface spending-ledger'},e('div',{className:'section-heading'},e('h2',null,'Purchase history'),e(Btn,{kind:'primary',icon:'plus',onClick:openExpense},'Add purchase')),e('div',{className:'ledger-tools'},e(Segment,{label:'Spending type',options:[['all','All'],['grocery','Groceries'],['other','Other']],value:filter,onChange:setFilter}),e('div',{className:'search-field'},e(Icon,{name:'search',size:18}),e('input',{'aria-label':'Search purchases',placeholder:'Find a purchase…',value:search,onChange:ev=>setSearch(ev.target.value)}))),
        expenses.length?e('div',{className:'purchases'},expenses.map(x=>e('div',{className:'purchase-row',key:x.id},e('span',{className:'purchase-icon '+x.type},e(Icon,{name:x.type==='grocery'?'leaf':'wallet'})),e('div',{className:'purchase-detail'},e('strong',null,x.note||x.category),e('span',null,prettyDate(x.date)+' · '+x.category)),e(Badge,{tone:x.type==='grocery'?'green':''},x.type==='grocery'?'Grocery':'Other'),e('b',{className:'purchase-amount'},money(x.amount)),e('button',{className:'icon-button','aria-label':'Remove purchase: '+(x.note||x.category),onClick:()=>setDialog({type:'delete-expense',expense:x})},e(Icon,{name:'close',size:16}))))):
          e(Empty,{icon:'wallet',title:filter==='all'&&!search?'Your month starts here':'No matching purchases',action:!search&&filter==='all'&&e(Btn,{kind:'secondary',onClick:openExpense},'Log your first purchase')},filter==='all'&&!search?'Add a purchase to see your remaining balance update.':'Try another filter or search.')))
    );
}
function Settings(p){
  const {state,exportData,importData,setDialog}=p;
  const safety=useMemo(()=>{try{const raw=localStorage.getItem(APP_KEY+'_before_redesign');return raw?upgradeState(JSON.parse(raw)):null;}catch(err){return null;}},[]);
  return e(React.Fragment,null,e(PageHeading,{eyebrow:'KEEP YOUR PLAN YOURS',title:'Backup & plan'},'Your entries stay in this browser. Keep a copy somewhere you trust.'),
    e('section',{className:'surface settings-backup'},e('span',{className:'action-icon'},e(Icon,{name:'download'})),e('div',null,e('h2',null,'A copy of everything'),e('p',{className:'muted'},'Includes your portions, usage, meals, spending and monthly limits.')),e(Btn,{kind:'primary',icon:'download',onClick:()=>exportData()},'Download backup')),
    e('div',{className:'settings-grid'},e('section',{className:'surface'},e('h2',null,'Bring an existing plan'),e('p',{className:'muted'},'Restore a backup from this app or your earlier version. You’ll review it before replacing your entries.'),e('label',{className:'button secondary upload-button'},'Choose a backup',e('input',{type:'file',accept:'.json,application/json','aria-label':'Choose a planner backup',onChange:importData}))),
      e('section',{className:'surface'},e('h2',null,'Keep an offline app copy'),e('p',{className:'muted'},'The app is self-contained. Your entries are separate, so download a backup too.'),e('a',{className:'button secondary',href:'./index.html',download:'Zahra_Food_Budget_Planner.html'},'Download the app'))),
    e('section',{className:'surface rules-card'},e('div',{className:'section-heading'},e('div',null,e('h2',null,'Your allocation rules'),e('p',{className:'muted'},'The quantities and choices behind your plan.'))),e(PlanNotes)),
    safety&&e('section',{className:'surface safety-copy'},e('div',null,e('h2',null,'Before the redesign'),e('p',{className:'muted'},'An automatic safety copy of the entries present when the new interface first opened.')),e(Btn,{icon:'download',onClick:()=>exportData(safety,'zahra-before-redesign.json')},'Download safety copy')),
    e('section',{className:'reset-section'},e('div',null,e('h2',null,'Start over'),e('p',{className:'muted'},'Return to the original allocations and remove logged entries.')),e(Btn,{kind:'danger',onClick:()=>setDialog({type:'reset'})},'Reset planner'))
  );
}

function PlanNotes(){
  return e("details",{className:"card plan-notes"},
    e("summary",null,"Your allocation rules and flexible choices"),
    e("ul",null,
      e("li",null,"Chicken: 13 half-breast portions. Two per month, with the extra currently in December. You can move it in Resource Map."),
      e("li",null,"Ham: eight portions of 10–12 slices. Seven are assigned; one stays in reserve. Beef portions remain 110–115 g."),
      e("li",null,"Linguine: 250 g in October and December. Fusilli: 250 g in January and February. Each 250 g allocation contains two 125 g portions."),
      e("li",null,"Tuna: one tin makes two of your meals. Split a tin into two 0.5-tin allocations when you plan those meals."),
      e("li",null,"Marmalade: 210 g by the end of November, then 210 g by the end of February. “By” means a deadline, with the stock available earlier."),
      e("li",null,"Fruit: one tin in each month October–February. The fruit order is flexible."),
      e("li",null,"Cereal: 190 g Alpen plus 125 g Nestlé each month October–February. That is 315 g combined, or seven 45 g bowls."),
      e("li",null,"Oat drinks: 400 ml per month across both cartons combined, equivalent to two 200 ml glasses. Opening and storage follow the cartons’ labels."),
      e("li",null,"Toilet paper: 18 rolls with a flexible aim of about 1.5 per month. No hard monthly cap. Laundry: six capsules / three washes each month. Scourers: one each month."),
      e("li",null,"Dishwasher tablets: three left for September, then four each month through June. 39 in total."),
      e("li",null,"Open the second chocolate bar around mid-January. The first bar is already open with no September finish deadline."),
      e("li",null,"Use current sunflower oil by the end of October. The next bottle and Frylight have flexible ten-month goals. Honey stays in reserve. Facial tissues are deliberately not counted."),
      e("li",null,"The earlier app’s bacon stock remains in reserve; it has no allocation in your latest plan.")
    )
  );
}
