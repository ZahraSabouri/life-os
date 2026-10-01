const NAV = [['overview','home','Overview'],['planner','calendar','Meal planner'],['resources','box','Food & supplies'],['budget','wallet','Spending']];
const ICONS = {
  home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  calendar:'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z',
  box:'m3 7 9-4 9 4-9 4Zm0 0v10l9 4 9-4V7M12 11v10M7.5 5 17 9',
  wallet:'M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7m0 5h-6v5h6',
  plus:'M12 5v14M5 12h14', chevron:'m9 5 7 7-7 7', back:'m15 5-7 7 7 7',
  check:'m5 12 4 4L19 6', close:'m6 6 12 12M6 18 18 6', search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  settings:'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6', download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  leaf:'M20 3C8 2 2 9 5 16c7 7 16 0 15-13ZM5 20l11-12', arrow:'M5 12h14m-5-5 5 5-5 5', info:'M12 11v6m0-10v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0'
};
function Icon({name,size=20}){return e('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},e('path',{d:ICONS[name]||ICONS.box}));}
function Btn({children,onClick,kind='',icon,small=false,...rest}){return e('button',{type:'button',...rest,onClick,className:`button ${kind} ${small?'small':''}`},icon&&e(Icon,{name:icon,size:18}),children);}
function Badge({children,tone=''}){return e('span',{className:'badge '+tone},children);}
function Meter({value,max,label}){return e('div',{className:'meter',role:'progressbar','aria-label':label,'aria-valuenow':Math.max(0,Number(value)||0),'aria-valuemin':0,'aria-valuemax':Math.max(Number(max)||0,Number(value)||0,1)},e('span',{style:{width:clamp(max>0?value/max*100:value>0?100:0,0,100)+'%'}}));}
function carryForwardText(state,f){
  const next=monthLabel(f.nextMonth);
  return state.budgets[f.nextMonth]?money(f.carryOut)+' will come out of '+next+'’s allowance.'+(f.carryOut>Number(state.budgets[f.nextMonth].total)?' Any uncovered amount continues into later months.':''):money(f.carryOut)+' carries into '+next+'. No allowance is set for that month, so this overspend stays outstanding.';
}
function RolloverSummary({state,month,figures:f,compact=false}){
  if(!f.carryIn&&!f.carryOut)return compact?null:e('p',{className:'rollover-help'},'Overspending comes out of next month’s total allowance automatically. Unspent money does not carry forward.');
  return e('section',{className:'surface rollover-summary','aria-label':'Budget carry-forward'},
    e('h2',null,f.carryIn?'Your allowance after carry-forward':'Spending ahead of next month'),
    f.carryIn>0&&(state.budgets[month]?e('dl',{className:'rollover-breakdown'},e('div',null,e('dt',null,'Original allowance'),e('dd',null,money(f.baseTotal))),e('div',null,e('dt',null,'Earlier overspending'),e('dd',null,'−'+money(f.carryIn))),e('div',null,e('dt',null,'After carry-forward'),e('dd',null,money(f.adjustedTotal)))):e('p',null,money(f.carryIn)+' carried in from earlier overspending. No allowance is set for '+monthLabel(month)+'.')),
    f.carryOut>0&&e('p',{className:'rollover-out'},e(Icon,{name:'arrow',size:18}),e('span',null,carryForwardText(state,f))),
    e('p',{className:'muted rollover-footnote'},'Recalculates automatically when purchases or monthly limits change.'));
}
function Empty({icon='calendar',title,children,action}){return e('div',{className:'empty-state'},e('span',{className:'empty-icon'},e(Icon,{name:icon,size:24})),e('h3',null,title),children&&e('p',null,children),action);}
function Field({label,id,children,hint}){return e('div',{className:'field'},e('label',{htmlFor:id},label),children,hint&&e('small',null,hint));}
function prettyDate(date,opts={day:'numeric',month:'short'}){return new Date(date+'T12:00:00').toLocaleDateString('en-GB',opts);}
function monthStart(month){const today=isoDate(new Date());return today.startsWith(month)?today:month+'-01';}
function titleName(name){return ({'Laundry capsule allowance':'Laundry capsules','Dishwasher tablet allowance':'Dishwasher tablets','Scourer allowance':'Scourers','Oat drink allocation':'Oat drinks'})[name]||name.replace(' allowance','').replace(' allocation','');}
function initialMonth(){const m=dateMonth(isoDate(new Date()));return MONTHS.some(x=>x.key===m)?m:'2026-09';}
function LegacyApp(){
  const initial=useMemo(loadState,[]);
  const [state,setState]=useState(initial.state),[saveError,setSaveError]=useState(initial.error),[canSave,setCanSave]=useState(!initial.error);
  const [tab,setTab]=useState('overview'),[selectedMonth,setSelectedMonth]=useState(initialMonth),[selectedWeek,setSelectedWeek]=useState(0);
  const [dialog,setDialog]=useState(null),[notice,setNotice]=useState(null);
  const [inventory,setInventory]=useState({category:'Food',scope:'month',status:'all',search:'',mode:'cards'});
  const undoRef=React.useRef(null),lastSaved=React.useRef('');
  useEffect(()=>{
    if(!canSave)return;
    try{
      const raw=JSON.stringify(state);
      if(raw!==lastSaved.current){localStorage.setItem(APP_KEY,raw);lastSaved.current=raw;}
      setSaveError('');
    }catch(err){setSaveError('Your latest changes could not be saved. Download a backup to keep them.');}
  },[state,canSave]);
  function commit(next,message){
    setState(current=>{const updated=typeof next==='function'?next(current):next;undoRef.current=current;return updated;});
    setNotice(message);setDialog(null);
  }
  function undo(){if(undoRef.current){setState(undoRef.current);undoRef.current=null;setNotice(null);}}
  function patchResource(id,patch){commit(s=>withResourcePatch(s,id,patch),'Allocation updated');}
  function markUsed(id,date){commit(s=>withResourcePatch(s,id,{used:true,usedDate:date||isoDate(new Date())}),'Marked as used');}
  function unassign(id){commit(s=>withResourcePatch(s,id,{scheduledDate:'',used:false,usedDate:''}),'Allocation restored');}
  function moveMonth(id,month){commit(s=>{const r=s.resources.find(x=>x.id===id);return r?withResourcePatch(s,id,{allocatedMonth:month,scope:'monthly',scheduledDate:r.used||dateMonth(r.scheduledDate)===month?r.scheduledDate:''}):s},'Allocation moved');}
  function scheduleResource(id,date){commit(s=>{const r=s.resources.find(x=>x.id===id);return r&&!r.used&&!r.scheduledDate&&inPlanningMonth(r,dateMonth(date))?withResourcePatch(s,id,{scheduledDate:date}):s},'Added to meal plan');}
  function exportData(data=state,filename='zahra-food-budget-backup.json'){
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function importData(ev){const file=ev.target.files?.[0];ev.target.value='';if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const data=upgradeState(JSON.parse(reader.result));setDialog({type:'import',data});}catch(err){setDialog({type:'error',message:err.message||'This file could not be read.'});}};reader.onerror=()=>setDialog({type:'error',message:'This file could not be read.'});reader.readAsText(file);}
  function changeMonth(m){setSelectedMonth(m);setSelectedWeek(0);}
  function openExpense(){if(!state.budgets[selectedMonth]){setDialog({type:'error',message:'Your spending budget runs from September 2026 to February 2027. Choose one of those months to record a purchase.'});return;}setDialog({type:'expense'});}
  const p={state,inventory,setInventory,tab,setTab,selectedMonth,setSelectedMonth:changeMonth,selectedWeek,setSelectedWeek,patchResource,markUsed,unassign,moveMonth,scheduleResource,commit,setDialog,exportData,importData,saveError,canSave,setCanSave,setSaveError,addExpense:x=>commit(s=>withAddedExpense(s,x),'Spending added'),deleteExpense:id=>commit(s=>withDeletedExpense(s,id),'Spending removed'),setMeal:(d,f,v)=>setState(s=>withMealField(s,d,f,v)),updateBudget:(m,f,v)=>setState(s=>withBudgetField(s,m,f,v)),requestSplit:r=>setDialog({type:'resource',id:r.id,mode:'split'}),openExpense};
  return e('div',{className:'workspace'},
    e('a',{href:'#main-content',className:'skip-link'},'Skip to content'),
    e('aside',{className:'sidebar'},e('div',{className:'brand-lockup'},e('span',{className:'brand-symbol'},'Z'),e('div',null,e('strong',null,'Food & budget'),e('span',null,'Zahra’s planner'))),
      e('div',{className:'nav-caption'},'YOUR EVERYDAY'),
      e('nav',{'aria-label':'Main navigation'},NAV.map(([key,icon,label])=>e('button',{key,className:'side-link '+(tab===key?'active':''),'aria-current':tab===key?'page':undefined,onClick:()=>{setTab(key);setNotice(null);}},e(Icon,{name:icon}),e('span',null,label)))),
      e('div',{className:'sidebar-bottom'},e('div',{className:'plan-duration'},e(Icon,{name:'leaf'}),e('div',null,e('strong',null,'Your allocation plan'),e('span',null,'September 2026 — June 2027'))),
        e('button',{className:'side-link '+(tab==='settings'?'active':''),onClick:()=>setTab('settings')},e(Icon,{name:'settings'}),'Backup & plan'),e('div',{className:'save-status'},e(Icon,{name:saveError?'info':'check',size:15}),saveError?'Save needs attention':'Saved in this browser'))),
    e('div',{className:'workspace-main'},e('header',{className:'app-header'},e('div',{className:'mobile-brand'},e('span',{className:'brand-symbol'},'Z'),e('strong',null,'Food & budget')),
      e('div',{className:'month-control'},e('button',{className:'icon-button','aria-label':'Previous month',disabled:selectedMonth===MONTHS[0].key,onClick:()=>changeMonth(MONTHS[MONTHS.findIndex(m=>m.key===selectedMonth)-1].key)},e(Icon,{name:'back',size:16})),e('select',{'aria-label':'Planning month',value:selectedMonth,onChange:ev=>changeMonth(ev.target.value)},MONTHS.map(m=>e('option',{key:m.key,value:m.key},m.label))),e('button',{className:'icon-button','aria-label':'Next month',disabled:selectedMonth===MONTHS.at(-1).key,onClick:()=>changeMonth(MONTHS[MONTHS.findIndex(m=>m.key===selectedMonth)+1].key)},e(Icon,{name:'chevron',size:16}))),
      e(Btn,{kind:'primary',icon:'plus',onClick:openExpense},'Log spending')),
      e('main',{id:'main-content',className:'main-content'},saveError&&e('div',{className:'alert',role:'alert'},saveError,e(Btn,{small:true,onClick:()=>exportData()},'Download backup')),
        tab==='overview'&&e(Overview,p),tab==='planner'&&e(Planner,p),tab==='resources'&&e(ResourceMap,p),tab==='budget'&&e(Budget,p),tab==='settings'&&(typeof Settings==='function'?e(Settings,p):e('section',{className:'surface'},e('h2',null,'Your plan & backups'),e(Btn,{onClick:()=>exportData()},'Download backup'),e(PlanNotes))),
        e('footer',{className:'page-footer'},'Food & budget · Local edition',e('span',null,'Local & private · No cloud sync')))),
    notice&&e('div',{className:'toast',role:'status'},e(Icon,{name:'check'}),e('span',null,notice),e('button',{onClick:undo},'Undo'),e('button',{'aria-label':'Dismiss notification',onClick:()=>setNotice(null)},e(Icon,{name:'close',size:16}))),
    dialog&&typeof DialogHost==='function'&&e(DialogHost,{...p,dialog,onClose:()=>setDialog(null)})
  );
}
function Overview(p){
  const {state,selectedMonth:month,setTab,setDialog,openExpense}=p;
  const budget=state.budgets[month],f=budgetFigures(state,month);
  const food=state.resources.filter(r=>r.category==='Food'&&inPlanningMonth(r,month));
  const available=food.filter(r=>!r.used&&!r.scheduledDate),scheduled=food.filter(r=>r.scheduledDate&&!r.used).sort((a,b)=>a.scheduledDate.localeCompare(b.scheduledDate));
  const names=[...new Set(available.map(r=>r.name))];
  const household=state.resources.filter(r=>r.category==='Household'&&r.allocatedMonth===month);
  return e(React.Fragment,null,e('div',{className:'page-heading'},e('div',null,e('span',{className:'eyebrow'},'YOUR MONTH, IN VIEW'),e('h1',null,'Your month at a glance.'),e('p',null,'Your money, food and everyday essentials in one place.'))),
    e('div',{className:'overview-top'},e('section',{className:'balance-card'},e('div',{className:'balance-top'},e('span',null,'Left to spend this month'),e(Icon,{name:'wallet',size:26})),
      budget?e(React.Fragment,null,e('div',{className:'balance-number'},money(f.totalRemaining)),e('p',null,f.carryIn?'Includes the deduction for earlier overspending.':month==='2026-09'?'For the rest of September, across all spending.':'Across groceries and everything else.'),e(Meter,{value:f.totalSpent+Math.max(0,-f.adjustedTotal),max:Math.max(0,f.adjustedTotal),label:'Monthly spending'}),e('div',{className:'balance-foot'},e('span',null,money(f.totalSpent)+' spent'),e('span',null,'of '+money(Math.max(0,f.adjustedTotal))+' allowance')),e(Btn,{kind:'on-blue',icon:'plus',onClick:openExpense},'Log a purchase')):
        e(React.Fragment,null,e('h2',null,'No budget set'),e('p',null,'Your spending plan currently ends in February. Household supplies continue through June.'),e(Btn,{kind:'on-blue',onClick:()=>setTab('budget')},'View spending'))),
      e('section',{className:'surface month-summary'},e('span',{className:'eyebrow'},'AT A GLANCE'),e('div',{className:'summary-line'},e('span',null,budget?.grocery==null?'Shared grocery balance':'Available for groceries'),e('strong',null,budget?money(f.groceryRemaining):'—')),e('p',{className:'muted'},budget?.grocery==null?'Groceries use the same remaining balance.':money(budget.grocery)+' grocery ceiling, included in your total.'),
        e('div',{className:'summary-line'},e('span',null,'Food ready to plan'),e('strong',null,names.length+' types')),e('div',{className:'summary-line'},e('span',null,'Food allocations scheduled'),e('strong',null,scheduled.length)),e('button',{className:'text-link',onClick:()=>setTab('planner')},'Open meal planner',e(Icon,{name:'arrow',size:17})))),
    e(RolloverSummary,{state,month,figures:f,compact:true}),
    e('div',{className:'section-heading'},e('h2',null,'Make your next move'),e('span',{className:'muted'},'Small actions keep the plan up to date.')),
    e('div',{className:'quick-actions'},[['calendar','Plan a meal','Give a portion a day.','planner'],['box','Use food or supplies','Record just the amount you used.','resources'],['wallet','Track your spending','Keep your remaining money clear.','budget']].map(([icon,title,subtitle,key])=>e('button',{key,className:'quick-action',onClick:()=>key==='budget'?openExpense():setTab(key)},e('span',{className:'action-icon'},e(Icon,{name:icon})),e('span',null,e('strong',null,title),e('small',null,subtitle)),e(Icon,{name:'chevron',size:16})))),
    e('div',{className:'overview-bottom'},e('section',{className:'surface'},e('div',{className:'section-heading'},e('h2',null,'Ready in your pantry'),e('button',{className:'text-link',onClick:()=>setTab('resources')},'See all',e(Icon,{name:'arrow',size:16}))),
      names.length?e('div',{className:'pantry-preview'},names.slice(0,5).map(name=>{const rows=available.filter(r=>r.name===name);return e('button',{className:'pantry-preview-row',key:name,onClick:()=>{setTab('resources');if(typeof ResourceDialog==='function')setDialog({type:'resource',id:rows[0].id,mode:'use'});}},e('span',{className:'item-glyph'},e(Icon,{name:'box',size:18})),e('span',null,e('strong',null,titleName(name)),e('small',null,[...new Set(rows.map(r=>r.storage))].join(' / '))),e('b',null,displayQty(rows.reduce((n,r)=>n+Number(r.qty),0),rows[0].unit)),e(Icon,{name:'chevron',size:16}));})):
        e(Empty,{icon:'box',title:'All accounted for'},'Use Food & supplies to see scheduled, used and reserve stock.')),
      e('section',{className:'surface'},e('div',{className:'section-heading'},e('h2',null,'On the meal plan'),e('button',{className:'text-link',onClick:()=>setTab('planner')},'Open',e(Icon,{name:'arrow',size:16}))),scheduled.length?scheduled.slice(0,4).map(r=>e('div',{className:'upcoming-row',key:r.id},e('span',{className:'date-tile'},prettyDate(r.scheduledDate,{day:'numeric'}),e('small',null,prettyDate(r.scheduledDate,{month:'short'}))),e('div',null,e('strong',null,r.name),e('p',{className:'muted'},displayQty(r.qty,r.unit))))):e(Empty,{title:'A fresh page for your meals',action:e(Btn,{onClick:()=>setTab('planner'),kind:'secondary'},'Plan a day')},'Choose a day, then add food from this month’s allocations.'))),
    e('section',{className:'household-strip'},e('div',null,e('span',{className:'eyebrow'},'HOUSEHOLD · '+monthLabel(month)),e('h2',null,'The everyday essentials')),household.length?e('div',{className:'household-metrics'},['Laundry capsule allowance','Dishwasher tablet allowance','Scourer allowance'].map(name=>{const rows=household.filter(r=>r.name===name);const left=rows.filter(r=>!r.used).reduce((n,r)=>n+Number(r.qty),0);const total=rows.reduce((n,r)=>n+Number(r.qty),0);return e('div',{key:name},e('strong',null,left,e('span',null,' / '+total)),e('small',null,name==='Laundry capsule allowance'?'Laundry capsules':name==='Dishwasher tablet allowance'?'Dishwasher tablets':'Scourers'));})):null,e(Btn,{onClick:()=>{p.setInventory(s=>({...s,category:'Household',scope:'month',search:'',status:'all',mode:'cards'}));setTab('resources');},kind:'secondary'},'View supplies'))
  );
}
