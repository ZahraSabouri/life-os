// A read-only view of the same stock and meal records used throughout Everyday.
ICONS.history='M3 11a9 9 0 1 1 2.5 7M3 4v7h7m2-5v6l4 2';
function historyDate(d,options={day:'numeric',month:'short'}){return new Date(d+'T12:00:00').toLocaleDateString('en-GB',options);}
function weekLabel(start){return historyDate(start)+' – '+historyDate(addDays(start,6),{day:'numeric',month:'short',year:'numeric'});}
function historyAnchor(month){const now=isoDate(new Date());return month===dateMonth(now)?now:month+'-01';}
function historyAmount(item){
 const parts=[];
 if(item.amount>0)parts.push(displayQty(item.amount,item.unit));
 if(item.unmeasured)parts.push(item.unmeasured+(item.unmeasured===1?' unmeasured use':' unmeasured uses'));
 return parts.join(' · ')||'Amount not recorded';
}
function HistoryV3(p){
 const monthView=p.route.view==='month';
 return e(React.Fragment,null,
  e(PageHeading,{eyebrow:'',title:'Weekly history',action:e(Btn,{kind:'primary',icon:'plus',onClick:()=>p.setDialog({type:'use-stock',date:isoDate(new Date())})},'Log what I used')},''),
  e('div',{className:'page-tabs history-tabs'},e(Segment,{label:'History view',value:monthView?'month':'week',onChange:view=>p.go({view}),options:[['week','Week by week'],['month','Month calendar']]})),
  monthView?e(UsageCalendar,{state:p.state,month:p.selectedMonth,setDialog:p.setDialog,key:p.selectedMonth}):e(WeeklyHistory,{...p,key:p.selectedMonth+'-'+(p.route.week||'')})
 );
}
function WeeklyHistory(p){
 const {state:s,setDialog}=p,today=isoDate(new Date());
 const anchor=validDate(p.route?.week)?p.route.week:historyAnchor(p.selectedMonth);
 const report=weeklyUsage(s,anchor),[filter,setFilter]=useState('all'),[search,setSearch]=useState(''),[day,setDay]=useState('');
 const q=search.trim().toLowerCase(),isThis=report.start===weekStart(today);
 const move=date=>{p.go({week:weekStart(date)});};
 const matches=x=>(!q||[x.name,x.meal,x.note].filter(Boolean).join(' ').toLowerCase().includes(q))&&(filter==='all'||filter===historyGroup(x));
 const filtered=report.events.filter(matches),visibleDates=report.days.filter(d=>day?d.date===day:filtered.some(x=>x.date===d.date));
 const shownItems=report.items.filter(i=>!q||[i.name,...i.events.map(x=>x.meal)].join(' ').toLowerCase().includes(q));
 const openItem=i=>{const entry=catalogueEntries(s).find(g=>g.key===i.entryKey);if(entry)setDialog({type:'item-page',key:entry.key});};
 return e('div',{className:'weekly-history'},
  e('section',{className:'history-weekbar','aria-label':'Choose a week'},
   e('div',{className:'week-title','aria-live':'polite'},e('span',{className:'eyebrow'},isThis?'THIS WEEK':'WEEK IN REVIEW'),e('h2',null,weekLabel(report.start))),
   e('div',{className:'history-week-controls'},e(Btn,{'aria-label':'Previous week',onClick:()=>move(addDays(report.start,-7))},e(Icon,{name:'back',size:17})),e(Btn,{onClick:()=>move(today),disabled:isThis},'This week'),e(Btn,{'aria-label':'Next week',onClick:()=>move(addDays(report.start,7))},e(Icon,{name:'chevron',size:17})),e(Input,{label:'Jump to a date',type:'date',value:anchor,onChange:v=>{if(validDate(v))move(v);}}))),
  e('div',{className:'history-metrics'},
   e(Stat,{label:'Meals eaten',value:report.meals.length,detail:''}),
   e(Stat,{label:'Items used',value:report.itemCount,detail:''}),
   e(Stat,{label:'Days recorded',value:report.activeDays+' / 7',detail:''}),
   e(Stat,{label:'Waste recorded',value:report.waste.length,detail:'',tone:report.waste.length?'history-waste':''})),
  e('div',{className:'history-days','aria-label':'Filter by day'},report.days.map(d=>e('button',{key:d.date,type:'button',className:'history-day'+(day===d.date?' selected':'')+(d.date===today?' today':''),'aria-pressed':day===d.date,'aria-label':historyDate(d.date,{weekday:'long',day:'numeric',month:'long'})+', '+d.events.length+' records',onClick:()=>setDay(day===d.date?'':d.date)},e('span',null,historyDate(d.date,{weekday:'short'})),e('strong',null,historyDate(d.date,{day:'numeric'})),e('span',{className:'history-day-track','aria-hidden':true},e('i',{style:{height:d.events.length?Math.max(12,Math.round(d.events.length/Math.max(1,...report.days.map(x=>x.events.length))*100))+'%':'0'}})),e('small',null,d.events.length?d.events.length+' logged':d.date>today?'Ahead':'No entries')))),
  e('div',{className:'history-layout'},
   e('section',{className:'surface history-journal'},
    e(SectionTitle,{title:'Day by day',note:day?historyDate(day,{weekday:'long',day:'numeric',month:'long'}):'',action:day&&e(Btn,{small:true,onClick:()=>setDay('')},'Show whole week')}),
    e('div',{className:'history-filters'},e(Input,{label:'Search this week',type:'search',value:search,onChange:setSearch,placeholder:'Find a food, meal or supply…'}),e(Select,{label:'Activity',value:filter,onChange:setFilter,options:[['all','All activity'],['meal','Meals eaten'],['used','Items used'],['levels','Bottle updates'],['waste','Waste'],['kept','Things you keep'],['returns','Returns']]})),
    e('div',{'aria-live':'polite',className:'history-results'},(q||filter!=='all')&&e('p',{className:'muted history-result-count'},filtered.filter(x=>!day||x.date===day).length+' matching records'),
     visibleDates.length?visibleDates.map(d=>{
      const rows=filtered.filter(x=>x.date===d.date),mealRows=rows.filter(x=>x.kind==='meal');
      const shownMeals=new Set(filter==='all'?mealRows.map(x=>x.mealId):[]);
      const loose=rows.filter(x=>x.kind!=='meal'&&!shownMeals.has(x.mealId));
      return e('section',{className:'journal-day',key:d.date},e('div',{className:'journal-date'},e('span',null,historyDate(d.date,{weekday:'short'})),e('strong',null,historyDate(d.date,{day:'numeric'})),d.date===today&&e('small',null,'Today')),
       e('div',{className:'journal-entries'},rows.length?e(React.Fragment,null,
        mealRows.map(x=>e('article',{className:'journal-meal',key:x.id},e('div',{className:'journal-meal-heading'},e('span',{className:'journal-icon'},e(Icon,{name:'check',size:18})),e('div',null,e('span',{className:'eyebrow'},({breakfast:'Breakfast',lunch:'Lunch',dinner:'Dinner',snack:'Snack'}[x.slot]||'Meal')+' · Eaten'),e('h3',null,x.name)),e(Btn,{small:true,onClick:()=>setDialog({type:'meal-detail',id:x.mealId})},'View meal')),filter==='all'&&rows.filter(y=>y.kind==='stock'&&y.mealId===x.mealId).length>0&&e('div',{className:'journal-ingredients'},e('p',{className:'muted'},'Used for this meal'),rows.filter(y=>y.kind==='stock'&&y.mealId===x.mealId).map(y=>e(HistoryLine,{key:y.id,x:y,setDialog,ingredient:true}))))),
        loose.map(x=>e(HistoryLine,{key:x.id,x,setDialog})))
       :e('div',{className:'journal-empty'},e('p',null,q||filter!=='all'?'No matching activity.':d.date>today?'This day is still ahead.':'Nothing recorded.'),!q&&filter==='all'&&d.date<=today&&e('button',{type:'button',className:'text-link',onClick:()=>setDialog({type:'use-stock',date:d.date})},'Add a record'))));
     }):e(Empty,{icon:q||filter!=='all'?'search':'history',title:q||filter!=='all'?'No matching records':'Nothing recorded this week'},q||filter!=='all'?'Try another search or activity filter.':'Choose a day above to add what you used.')),
    null),
   e('aside',{className:'history-summary'},e('section',{className:'surface history-totals'},null,e('h2',null,'What you used'),null,
    shownItems.length?e('div',{className:'history-item-list'},shownItems.map(i=>e('button',{className:'history-item',type:'button',key:i.key,disabled:!i.entryKey,onClick:()=>openItem(i)},e(Art,{file:i.image||artFor(s,i.categoryId,i.name)}),e('span',null,e('strong',null,niceName(i.name)),e('small',null,historyAmount(i))),e(Icon,{name:'chevron',size:15})))):e('p',{className:'empty-copy'},q?'No matching items this week.':'No item use recorded this week.'),
    null),
    report.waste.length>0&&e('section',{className:'surface history-waste-note'},e('h3',null,'Recorded as waste'),report.waste.map(x=>e('div',{className:'waste-row',key:x.id},e('span',null,niceName(x.name)),e('strong',null,x.amount?displayQty(x.amount,x.unit):'Amount unknown')))),
    
    null))
 );
}
function HistoryLine({x,setDialog,ingredient=false}){
 const group=historyGroup(x),t=usageText(x),label=group==='used'?'Used':group==='waste'?'Waste':group==='kept'?'Kept thing':group==='returns'?'Returned':'Bottle update';
 const editable=x.kind==='stock'&&(x.id.startsWith('used-')||['use','waste','open','half','low','touch','finish'].includes(x.action));
 return e('div',{className:'history-line '+group+(ingredient?' ingredient':'')},e('span',{className:'history-kind'},label),e('div',{className:'history-line-copy'},e('strong',null,t.title),e('small',null,t.sub),x.note&&e('small',null,x.note)),editable&&e('button',{type:'button',className:'history-edit','aria-label':'Edit '+t.title+' on '+x.date,onClick:()=>setDialog({type:'event-edit',id:x.id})},'Edit'));
}
function WeekSnapshot({state:s,month,go,setDialog}){
 const r=weeklyUsage(s,historyAnchor(month));
 return e('section',{className:'surface home-week'},e('div',{className:'home-week-top'},e('span',{className:'eyebrow'},r.start===weekStart(isoDate(new Date()))?'THIS WEEK':'WEEK IN REVIEW'),e(Icon,{name:'history',size:21})),e('h2',null,'Weekly history'),e('p',{className:'muted'},weekLabel(r.start)),e('div',{className:'home-week-numbers'},e('div',null,e('strong',null,r.meals.length),e('span',null,r.meals.length===1?'meal eaten':'meals eaten')),e('div',null,e('strong',null,r.itemCount),e('span',null,r.itemCount===1?'item used':'items used'))),e('div',{className:'home-week-days'},r.days.map(d=>e('button',{key:d.date,type:'button','aria-label':'View history for week of '+d.date,onClick:()=>go({tab:'history',view:'week',week:r.start,item:''})},e('span',null,historyDate(d.date,{weekday:'narrow'})),e('i',{className:d.events.length?'logged':''},d.events.length?e(Icon,{name:'check',size:13}):'·')))),e('p',{className:'home-week-note'},r.events.length?r.activeDays+' of 7 days recorded':'No records this week.'),e(Btn,{onClick:()=>go({tab:'history',view:'week',week:r.start,item:''})},'View history',e(Icon,{name:'arrow',size:17})));
}
function HomeV2(p){
 const {state:s,selectedMonth:m,setTab,setDialog,go}=p,f=forecast(s,m),pending=s.lists.flatMap(l=>l.lines).filter(x=>x.status==='planned');
 const today=isoDate(new Date()),low=stockRows(s).filter(x=>x.remaining>0&&(runningLow(x)||x.expiry&&x.expiry<=addDays(today,7))),meals=s.mealEntries.filter(x=>dateMonth(x.date)===m&&x.status==='planned');
 const days=m===dateMonth(today)?new Date(Number(m.slice(0,4)),Number(m.slice(5)),0).getDate()-Number(today.slice(8))+1:new Date(Number(m.slice(0,4)),Number(m.slice(5)),0).getDate();
 return e(React.Fragment,null,
  e('div',{className:'home-heading home-heading-v3'},e('div',null,e('span',{className:'eyebrow'},historyDate(today,{weekday:'long',day:'numeric',month:'long'}).toUpperCase()),e('h1',null,'My everyday'),null),e(Btn,{icon:'plus',onClick:()=>setDialog({type:'use-stock',date:today})},'Log what I used')),
  e(BudgetRule,{state:s,month:m}),
  e('div',{className:'home-overview'},
   e('section',{className:'home-hero'},e('div',{className:'hero-copy'},e('span',{className:'eyebrow'},monthLabel(m).toUpperCase()),e('span',{className:'balance-label'},f.totalRemaining<0?'Over your allowance':'Left in your allowance'),e('strong',{className:'hero-amount '+(f.totalRemaining<0?'negative':'')},s.budgets[m]?money(Math.abs(f.totalRemaining)):'Not set'),e('p',null,s.budgets[m]?money(f.totalSpent)+' counted this month · '+money(f.baseTotal)+' base allowance':'Set your monthly allowance in Money & saving.'),e(Meter,{value:Math.max(0,f.totalSpent+f.carryIn),max:f.baseTotal,label:'Monthly spending'}),e('div',{className:'hero-bottom'},e('div',null,e('small',null,'After plans & saving intention'),e('b',null,(f.projectedPence<0?'−'+pounds(-f.projectedPence):pounds(f.projectedPence))+(f.unknown?' + unknown costs':''))),e(Btn,{onClick:()=>setTab('money')},'View money',e(Icon,{name:'arrow',size:16}))),f.carryOut>0&&e('small',{className:'carry-note'},carryForwardText(s,f))),e('div',{className:'hero-image'},e(Art,{file:SEASON_HOME[new Date().getMonth()]||ART.home,alt:'Illustrated home and everyday supplies'}))),
   e(WeekSnapshot,{state:s,month:m,go,setDialog})),
  e('div',{className:'stat-strip'},e(Stat,{label:'On your shopping lists',value:pending.length+' items',detail:f.unknown?f.unknown+' prices to add':''}),e(Stat,{label:'Weekly spending guide',value:pounds(Math.max(0,Math.floor(f.projectedPence/days*7))),detail:''}),e(Stat,{label:'Meals planned',value:meals.length,detail:'In '+monthLabel(m)}),e(Stat,{label:'Stock alerts',value:low.length+' items',detail:''})),
  e(SectionTitle,{title:'Quick actions'}),e('div',{className:'action-cards'},[
   ['Plan a shop','','approved/Pages/My everyday/Plan a Shop.png','shopping','Open shopping'],['See what’s at home','','approved/Pages/My everyday/See what’s at home.png','stock','Open cupboard'],['Make a meal','','approved/Pages/My everyday/Make a meal.png','meals','Open meals']
  ].map(([title,copy,file,tab,label])=>e('button',{className:'art-card',key:tab,onClick:()=>setTab(tab)},e(Art,{file}),e('div',null,e('h3',null,title),copy&&e('p',null,copy),e('span',null,label+' ↗'))))),
  e('div',{className:'two-col'},e('section',{className:'surface'},e(SectionTitle,{title:'Shopping lists',action:e(Btn,{small:true,onClick:()=>setDialog({type:'list'})},'New list')}),s.lists.filter(l=>l.lines.some(x=>x.status==='planned')).slice(0,3).map(l=>e('button',{className:'plain-row',key:l.id,onClick:()=>setTab('shopping')},e(Icon,{name:'bag'}),e('div',null,e('strong',null,l.name),e('small',null,prettyDate(l.date)+' · '+(l.merchant||'Any shop'))),e('b',null,pounds(l.lines.filter(x=>x.status==='planned').reduce((n,x)=>n+(x.estimatePence||0),0))))),!pending.length&&e('p',{className:'empty-copy'},'No shopping lists.')),
   e('section',{className:'surface'},e(SectionTitle,{title:'Stock alerts'}),low.length?low.slice(0,4).map(x=>e('button',{className:'plain-row',key:x.id,onClick:()=>setDialog({type:'stock-action',id:x.id})},e(Icon,{name:'leaf'}),e('div',null,e('strong',null,x.name),e('small',null,runningLow(x)?'Running low':x.expiryType+' · '+x.expiry)))):e('p',{className:'empty-copy'},'No stock alerts.'))));
}
