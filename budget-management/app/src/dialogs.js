function Modal({title,kicker,children,onClose,wide=false}){
  const ref=React.useRef(null),titleId=React.useId();
  useEffect(()=>{const previous=document.activeElement;ref.current.showModal();const first=ref.current.querySelector('input:not([type="file"]),textarea,select');if(first)first.focus();return()=>{if(previous?.isConnected)previous.focus();};},[]);
  return e('dialog',{ref,className:'app-dialog '+(wide?'wide':''),'aria-labelledby':titleId,onCancel:ev=>{ev.preventDefault();onClose();}},
    e('div',{className:'dialog-heading'},e('div',null,kicker&&e('span',{className:'eyebrow'},kicker),e('h2',{id:titleId},title)),e('button',{className:'icon-button',type:'button','aria-label':'Close dialog',onClick:onClose},e(Icon,{name:'close',size:19}))),children);
}
function DialogFooter({children,onClose,label='Cancel'}){return e('div',{className:'dialog-footer'},e(Btn,{onClick:onClose},label),children);}
function DialogHost(p){
  const {dialog:d,onClose}=p;
  if(d.type==='expense')return e(ExpenseDialog,p);
  if(d.type==='limits')return e(LimitsDialog,p);
  if(d.type==='group')return e(GroupDialog,p);
  if(d.type==='resource')return e(ResourceDialog,{...p,key:d.id+'-'+(d.mode||'use')});
  if(d.type==='day')return e(DayDialog,{...p,key:d.date});
  if(d.type==='error')return e(Modal,{title:'Something needs attention',onClose},e('div',{className:'dialog-body'},e('p',null,d.message)),e(DialogFooter,{onClose,label:'Close'}));
  return e(ConfirmDialog,p);
}
function ExpenseDialog({state,selectedMonth,commit,onClose}){
  const [amount,setAmount]=useState(''),[date,setDate]=useState(monthStart(selectedMonth)),[type,setType]=useState('grocery'),[category,setCategory]=useState('Fresh groceries'),[note,setNote]=useState('');
  const [error,setError]=useState('');
  const value=Number(amount),month=dateMonth(date),valid=validDate(date)&&!!state.budgets[month]&&Number.isFinite(value)&&value>0&&Math.abs(value*100-Math.round(value*100))<1e-7;
  const preview=valid?budgetFigures({...state,expenses:[...state.expenses,{date,amount:value,type}]},month):null;
  const remaining=preview?.totalRemaining||0;
  function submit(ev){ev.preventDefault();if(!valid){setError('Enter a positive amount in pounds and a date within a budgeted month.');return;}commit(s=>withAddedExpense(s,{id:uid('exp'),date,amount:Math.round(value*100)/100,type,category,note:note.trim()}),'Purchase added · '+money(value));}
  return e(Modal,{title:'Log a purchase',kicker:'A QUICK CHECK-IN',onClose},e('form',{onSubmit:submit},e('div',{className:'dialog-body form-stack'},
    e(Field,{label:'Amount',id:'expense-amount'},e('div',{className:'amount-field'},e('span',null,'£'),e('input',{id:'expense-amount',autoFocus:true,inputMode:'decimal',type:'number',min:'.01',step:'.01',required:true,placeholder:'0.00',value:amount,onChange:ev=>setAmount(ev.target.value)}))),
    e(Segment,{label:'Purchase type',options:[['grocery','Groceries'],['other','Other spending']],value:type,onChange:v=>{setType(v);setCategory(v==='grocery'?'Fresh groceries':'Other');}}),
    e('div',{className:'form-grid'},e(Field,{label:'Date',id:'expense-date'},e('input',{id:'expense-date',type:'date',value:date,required:true,onChange:ev=>setDate(ev.target.value)})),e(Field,{label:'Category',id:'expense-category'},e('select',{id:'expense-category',value:category,onChange:ev=>setCategory(ev.target.value)},['Fresh groceries','Eggs / dairy','Bread / carbs','Fruit / vegetables','Replacement protein','Eating out','Transport','Household','Other'].map(x=>e('option',{key:x},x))))),
    e(Field,{label:'Where or what? (optional)',id:'expense-note'},e('input',{id:'expense-note',placeholder:'e.g. Lidl — milk, eggs and salad',value:note,onChange:ev=>setNote(ev.target.value),maxLength:300})),
    valid&&e('div',{className:'confirmation-box '+(remaining<0?'caution':'')},e('span',null,'Your '+monthLabel(month)+' balance after this purchase'),e('strong',null,money(remaining)),preview.carryOut>0&&e('small',null,carryForwardText(state,preview))),error&&e('p',{className:'danger-text',role:'alert'},error)),
    e(DialogFooter,{onClose},e(Btn,{type:'submit',kind:'primary',disabled:!valid,icon:'check'},'Save purchase'))));
}
function LimitsDialog({state,selectedMonth:month,commit,onClose}){
  const original=state.budgets[month];
  const [total,setTotal]=useState(String(original.total)),[grocery,setGrocery]=useState(original.grocery==null?'':String(original.grocery));
  const valid=total.trim()!==''&&Number.isFinite(Number(total))&&Number(total)>=0&&(grocery===''||(Number.isFinite(Number(grocery))&&Number(grocery)>=0&&Number(grocery)<=Number(total)));
  return e(Modal,{title:'Monthly limits',kicker:monthLabel(month),onClose},e('form',{onSubmit:ev=>{ev.preventDefault();if(valid)commit(s=>({...s,budgets:{...s.budgets,[month]:{...s.budgets[month],total:Number(total),grocery:grocery===''?null:Number(grocery),note:grocery===''?'Shared total for groceries and other spending.':'Grocery ceiling included within the total monthly budget.'}}}),'Monthly limits updated');}},e('div',{className:'dialog-body form-stack'},
    e(Field,{id:'limit-total',label:'Total monthly budget (£)',hint:'Your original allowance, before any deduction for earlier overspending.'},e('input',{id:'limit-total',type:'number',step:'.01',min:0,required:true,autoFocus:true,value:total,onChange:ev=>setTotal(ev.target.value)})),
    e(Field,{id:'limit-grocery',label:'Grocery ceiling (£)',hint:'Included within the total. Leave blank to use a shared balance.'},e('input',{id:'limit-grocery',type:'number',step:'.01',min:0,value:grocery,onChange:ev=>setGrocery(ev.target.value),placeholder:'Shared balance'})),
    !valid&&e('p',{className:'danger-text'},'Use positive amounts or zero. Your grocery ceiling cannot exceed the total.')),
    e(DialogFooter,{onClose},e(Btn,{type:'submit',kind:'primary',disabled:!valid},'Save limits'))));
}
function GroupDialog({state,dialog:d,setDialog,onClose}){
  const rows=state.resources.filter(r=>d.ids.includes(r.id));
  const left=rows.filter(r=>!r.used).reduce((n,r)=>n+Number(r.qty),0);
  return e(Modal,{title:titleName(d.name),kicker:displayQty(left,d.unit)+' LEFT IN THIS VIEW',onClose,wide:true},e('div',{className:'dialog-body'},e('p',{className:'muted dialog-intro'},'Choose the allocation you want to use or change. Every portion keeps its exact quantity and month.'),
    e('div',{className:'allocation-list'},rows.map(r=>e('article',{className:'allocation-row',key:r.id},e('div',{className:'allocation-row-title'},e('strong',null,displayQty(r.qty,r.unit)),e(Badge,{tone:r.used?'green':r.scheduledDate?'blue':''},r.used?'Used':r.scheduledDate?'Planned':'Ready')),e('p',{className:'allocation-meta'},(r.scope==='deadline'?'Use by ':r.scope==='opening'?'Open from ':'')+monthLabel(r.allocatedMonth)+' · '+r.storage),r.note&&e('p',{className:'muted'},r.note),(r.scheduledDate||r.usedDate)&&e('p',{className:'allocation-date'},r.used?'Used '+prettyDate(r.usedDate||r.scheduledDate):'Planned for '+prettyDate(r.scheduledDate)),
      e('div',{className:'allocation-actions'},!r.used&&e(Btn,{small:true,kind:'primary',onClick:()=>setDialog({type:'resource',id:r.id,mode:'use'})},'Use an amount'),!r.used&&!r.scheduledDate&&e(Btn,{small:true,onClick:()=>setDialog({type:'resource',id:r.id,mode:'schedule'})},'Plan'),e(Btn,{small:true,kind:'quiet',onClick:()=>setDialog({type:'resource',id:r.id,mode:'move'})},'Move'),!r.used&&!r.scheduledDate&&canSplit(r)&&e(Btn,{small:true,kind:'quiet',onClick:()=>setDialog({type:'resource',id:r.id,mode:'split'})},'Split'),(r.used||r.scheduledDate)&&e(Btn,{small:true,onClick:()=>setDialog({type:'resource',id:r.id,mode:'restore'})},r.used?'Restore':'Unplan')))))),e(DialogFooter,{onClose,label:'Done'}));
}
function ResourceDialog({state,dialog:d,selectedMonth,commit,onClose}){
  const r=state.resources.find(x=>x.id===d.id),mode=d.mode||'use';
  const [amount,setAmount]=useState(()=>String(mode==='split'?r.unit==='capsules'?Math.min(2,r.qty/2):r.qty/2:r.qty));
  const [date,setDate]=useState(()=>mode==='schedule'?monthStart(inPlanningMonth(r,selectedMonth)?selectedMonth:r.allocatedMonth||selectedMonth):r.scheduledDate||isoDate(new Date()));
  const [month,setMonth]=useState(r.allocatedMonth||''),[error,setError]=useState('');
  const fractional=['g','ml','tin','bottle'].includes(r.unit),n=Number(amount),isAmount=['use','schedule','split'].includes(mode);
  const validAmount=amount.trim()!==''&&Number.isFinite(n)&&n>0&&n<=Number(r.qty)&&(fractional||Number.isInteger(n))&&Number.isFinite(n)&&n>=.000001;
  const valid=(mode==='move'||mode==='restore')||(validAmount&&(mode==='split'?n<r.qty&&!r.used&&!r.scheduledDate:!r.used&&validDate(date)&&(mode!=='schedule'||(!r.scheduledDate&&inPlanningMonth(r,dateMonth(date))))));
  const titles={use:'How much did you use?',schedule:'Plan an exact amount',split:'Make a separate portion',move:'Move this allocation',restore:r.used?'Restore this portion?':'Remove from the meal plan?'};
  async function submit(ev){ev.preventDefault();if(!valid)return;
    try{
      if(mode==='move')await commit(s=>withResourcePatch(s,r.id,{allocatedMonth:month,scope:'monthly',scheduledDate:r.used||dateMonth(r.scheduledDate)===month?r.scheduledDate:''}),'Allocation moved');
      else if(mode==='restore')await commit(s=>withResourcePatch(s,r.id,{used:false,usedDate:'',scheduledDate:''}),'Portion restored');
      else if(mode==='split')await commit(s=>withSplitResource(s,r.id,n),'Portion split');
      else await commit(s=>withAmountAction(s,r.id,n,mode,date),(mode==='use'?'Used ':'Planned ')+displayQty(n,r.unit)+' · '+titleName(r.name));
    }catch(err){setError(err.message);}
  }
  return e(Modal,{title:titles[mode],kicker:titleName(r.name),onClose},e('form',{onSubmit:submit},e('div',{className:'dialog-body form-stack'},
    e('div',{className:'resource-context'},e('span',{className:'item-glyph'},e(Icon,{name:'box'})),e('div',null,e('strong',null,displayQty(r.qty,r.unit)),e('p',{className:'muted'},monthLabel(r.allocatedMonth)+' · '+r.storage))),
    isAmount&&e(React.Fragment,null,e(Field,{id:'resource-amount',label:mode==='use'?'Amount used':mode==='schedule'?'Amount to plan':'Amount for the new portion'},e('div',{className:'quantity-field'},e('input',{id:'resource-amount',type:'number',autoFocus:true,required:true,min:fractional?.000001:1,step:fractional?'any':1,max:r.qty,value:amount,onChange:ev=>setAmount(ev.target.value)}),e('span',null,r.unit))),
      e('div',{className:'amount-presets'},r.unit==='capsules'&&r.qty>=2&&e(Btn,{small:true,onClick:()=>setAmount('2')},'One wash · 2 capsules'),(fractional||Number.isInteger(r.qty/2))&&e(Btn,{small:true,onClick:()=>setAmount(String(r.qty/2))},'Half'),mode!=='split'&&e(Btn,{small:true,onClick:()=>setAmount(String(r.qty))},'All'))),
    (mode==='use'||mode==='schedule')&&e(Field,{id:'resource-date',label:mode==='use'?'Date used':'Planned date'},e('input',{id:'resource-date',type:'date',required:true,value:date,onChange:ev=>setDate(ev.target.value)})),
    mode==='schedule'&&validDate(date)&&!inPlanningMonth(r,dateMonth(date))&&e('p',{className:'form-warning'},'This date is outside the allocation’s window. Choose a date within its month, or move the allocation first.'),
    mode==='move'&&e(React.Fragment,null,e(Field,{id:'move-month',label:'Move to'},e('select',{id:'move-month',autoFocus:true,value:month,onChange:ev=>setMonth(ev.target.value)},e('option',{value:''},'Reserve'),MONTHS.map(m=>e('option',{key:m.key,value:m.key},m.label)))),r.scope&&r.scope!=='monthly'&&e('p',{className:'form-warning'},'Moving this item replaces its flexible or deadline window with a monthly allocation.'),r.scheduledDate&&!r.used&&dateMonth(r.scheduledDate)!==month&&e('p',{className:'form-warning'},'Its planned date will be removed because it belongs to another month.')),
    mode==='restore'&&e('p',{className:'muted'},'This exact quantity will become available again in its allocated month. Its planned and used dates will be cleared.'),
    isAmount&&validAmount&&e('div',{className:'confirmation-box'},e('span',null,mode==='split'?'Remaining in the original portion':'Left after this action'),e('strong',null,displayQty(Number((r.qty-n).toFixed(6)),r.unit)),n<r.qty&&e('small',null,'The remaining amount keeps its allocation.')),
    error&&e('p',{role:'alert',className:'danger-text'},error)),e(DialogFooter,{onClose},e(Btn,{type:'submit',kind:'primary',disabled:!valid},({use:'Confirm use',schedule:'Add to meal plan',split:'Split portion',move:'Move allocation',restore:'Restore portion'})[mode]))));
}
function DayDialog({state,dialog:d,commit,onClose}){
  const date=d.date,originalMeals=state.meals[date]||{};
  const [dayError,setDayError]=useState('');
  const [meals,setMeals]=useState({...originalMeals}),[added,setAdded]=useState([]),[removed,setRemoved]=useState([]),[used,setUsed]=useState([]),[pick,setPick]=useState('');
  const original=state.resources.filter(r=>r.scheduledDate===date||(!r.scheduledDate&&r.used&&r.usedDate===date));
  const shown=[...original,...state.resources.filter(r=>added.includes(r.id))].filter(r=>!removed.includes(r.id));
  const available=state.resources.filter(r=>r.category==='Food'&&!r.used&&!r.scheduledDate&&inPlanningMonth(r,dateMonth(date))&&!added.includes(r.id)&&(!state.mealEntries||!reservedAmount(state,r.id)));
  async function save(ev){ev.preventDefault();try{await commit(s=>{
    let next={...s,meals:{...s.meals,[date]:{...(s.meals[date]||{}),...meals}}};
    next={...next,resources:next.resources.map(r=>{
      if(removed.includes(r.id))return {...r,used:false,usedDate:'',scheduledDate:''};
      if(added.includes(r.id)||used.includes(r.id))return {...r,scheduledDate:date,...(used.includes(r.id)?{used:true,usedDate:date}:{})};
      return r;
    })};return next;
  },'Saved '+prettyDate(date)+' meal plan');}catch(err){setDayError(err.message);}}
  return e(Modal,{title:prettyDate(date,{weekday:'long',day:'numeric',month:'long'}),kicker:'ONE DAY AT A TIME',onClose,wide:true},e('form',{onSubmit:save},e('div',{className:'dialog-body form-stack'},
    dayError&&e('p',{className:'error-box',role:'alert'},dayError),e('div',{className:'meal-fields'},['breakfast','lunch','dinner'].map((field,i)=>e(Field,{key:field,id:'meal-'+field,label:field[0].toUpperCase()+field.slice(1)},e('input',{id:'meal-'+field,autoFocus:i===0,placeholder:'What would you like?',value:meals[field]||'',onChange:ev=>setMeals(s=>({...s,[field]:ev.target.value})),maxLength:500})))),
    e('div',{className:'divider'}),e('div',null,e('h3',null,'Food from your plan'),e('p',{className:'muted'},'Choose an allocation available for this day.')),
    shown.length?e('div',{className:'day-assigned'},shown.map(r=>e('div',{className:'day-assigned-row',key:r.id},e('div',null,e('strong',null,titleName(r.name)),e('p',{className:'muted'},displayQty(r.qty,r.unit))),e('div',{className:'inline-actions'},r.used||used.includes(r.id)?e(Badge,{tone:'green'},'Used'):e(Btn,{small:true,onClick:()=>setUsed(s=>[...s,r.id])},'Use this portion'),e('button',{className:'icon-button','aria-label':'Remove '+r.name+' from day',onClick:()=>{setRemoved(s=>[...s,r.id]);setAdded(s=>s.filter(x=>x!==r.id));setUsed(s=>s.filter(x=>x!==r.id));}},e(Icon,{name:'close',size:15})))))):e('p',{className:'muted'},'No food assigned yet. Meal notes can also stand on their own.'),
    e('div',{className:'add-to-day'},e(Field,{label:'Add an allocation',id:'day-allocation'},e('select',{id:'day-allocation',value:pick,onChange:ev=>setPick(ev.target.value)},e('option',{value:''},'Choose from this month…'),available.map(r=>e('option',{key:r.id,value:r.id},r.name+' · '+displayQty(r.qty,r.unit)+' · '+r.storage)))),e(Btn,{icon:'plus',disabled:!pick,onClick:()=>{setAdded(s=>[...s,pick]);setRemoved(s=>s.filter(x=>x!==pick));setPick('');}},'Add')),
    e('p',{className:'muted'},'Need a smaller amount? Food & supplies → View & use → Plan lets you choose an exact quantity.')),
    e(DialogFooter,{onClose},e(Btn,{kind:'primary',type:'submit',icon:'check'},'Save day'))));
}
function ConfirmDialog({dialog:d,state,commit,exportData,setCanSave,setSaveError,onClose}){
  const [confirmation,setConfirmation]=useState(''),[error,setError]=useState('');
  const reset=d.type==='reset',importing=d.type==='import';
  function apply(){
    if(reset||importing){try{localStorage.setItem(APP_KEY+'_before_replace',JSON.stringify(state));}catch(err){setError('Could not preserve a safety copy. Download a backup before clearing browser storage, then try again.');return;}}
    if(importing){setCanSave(true);setSaveError('');commit(d.data,'Backup restored');}
    else if(reset){setCanSave(true);setSaveError('');commit(newBudgetState(),'Empty plan ready');}
    else commit(s=>withDeletedExpense(s,d.expense.id),'Purchase removed');
  }
  return e(Modal,{title:reset?'Start again with your original plan?':importing?'Restore this backup?':'Remove this purchase?',onClose},e('div',{className:'dialog-body form-stack'},
    reset?e(React.Fragment,null,e('p',null,'This removes your spending, meal plans and usage changes. Your original portions and allocations will return.'),e(Btn,{icon:'download',onClick:()=>exportData()},'Download current backup first'),e(Field,{id:'reset-confirmation',label:'Type RESET to confirm'},e('input',{id:'reset-confirmation',value:confirmation,onChange:ev=>setConfirmation(ev.target.value),autoComplete:'off'}))):importing?e(React.Fragment,null,e('div',{className:'import-preview'},e('div',null,e('strong',null,d.data.resources.length),e('span',null,'allocations')),e('div',null,e('strong',null,d.data.expenses.length),e('span',null,'purchases')),e('div',null,e('strong',null,Object.keys(d.data.meals).length),e('span',null,'meal days'))),e('p',{className:'muted'},'This will replace the current entries. A safety copy is kept in this browser; download a separate backup if you want to keep both.'),e(Btn,{icon:'download',onClick:()=>exportData()},'Download current backup')):e('div',{className:'confirmation-box'},e('span',null,d.expense.note||d.expense.category),e('strong',null,money(d.expense.amount)),e('small',null,prettyDate(d.expense.date))),error&&e('p',{className:'danger-text',role:'alert'},error)),
    e(DialogFooter,{onClose},e(Btn,{kind:importing?'primary':'danger',onClick:apply,disabled:reset&&confirmation!=='RESET'},reset?'Reset planner':importing?'Restore backup':'Remove purchase')));
}
