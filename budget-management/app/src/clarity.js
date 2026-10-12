/* A quieter overview. Detailed tools remain available in their existing views. */
function BudgetRule({state:s, month:m}) {
  const base = s.budgets[m]?.total;
  return e('div',{className:'budget-rule'},
    e('span',null,'Your monthly plan'),
    base === 225 ? e('strong',null,'£250 budget − £25 for long-lasting supplies = £225 to spend')
      : e('strong',null,base == null ? 'Set a monthly allowance to start' : money(base) + ' spending allowance'),
    e('small',null,'Tracking from 8 September 2026. '+(base===225?'The £25 is reserved, not an extra bill. ':'')+'Receipt cost allocations are shown separately from cash paid. Using stock does not charge you again.'));
}
const FullMoneyView = MoneyV2;
MoneyV2 = function MoneyClarity(p) {
  const {state:s, selectedMonth:m, setDialog} = p;
  if (['goals','subscriptions'].includes(p.route?.view)) return e(FullMoneyView,p);
  const f = forecast(s,m), entries = ledger(s).filter(x => x.date >= PLAN_START && dateMonth(x.date) === m).sort((a,b) => b.date.localeCompare(a.date));
  const rows = transactionRows(s,entries), paid = entries.filter(x=>!x.refund).reduce((n,x)=>n+Math.round(x.amount*100),0), returned = -entries.filter(x=>x.refund).reduce((n,x)=>n+Math.round(x.amount*100),0), shares=spreadNote(s,m);
  const groups = [...new Set(entries.map(x=>x.categoryId||x.category))].map(id=>({id,name:s.categories.find(c=>c.id===id)?.name||id,amount:entries.filter(x=>(x.categoryId||x.category)===id).reduce((n,x)=>n+Math.round(x.amount*100),0)})).sort((a,b)=>b.amount-a.amount);
  return e(React.Fragment,null,
    e(PageHeading,{title:'Money & saving',action:e(Btn,{onClick:()=>setDialog({type:'budget'})},'Edit allowance')},'One payment, one entry. Open a receipt to see its items.'),
    e('div',{className:'page-tabs'},e(Segment,{label:'Money view',value:'overview',onChange:v=>p.go({view:v}),options:[['overview','My month'],['goals','Saving goals'],['subscriptions','Subscriptions']]})),
    e(BudgetRule,{state:s,month:m}),
    e('div',{className:'money-summary'},
      e('section',{className:'balance-card '+(f.totalRemaining<0?'over-budget':'')},e('span',null,monthLabel(m)),e('h2',null,f.totalRemaining<0?'Over your allowance':'Left in this month’s budget'),e('strong',null,s.budgets[m]?money(Math.abs(f.totalRemaining)):'Not set'),e('p',null,money(f.baseTotal)+' allowance'+(f.carryIn?' − '+money(f.carryIn)+' earlier overspend':'')+' − '+money(f.totalSpent)+' counted this month'),shares.map(x=>e('p',{key:x.receipt.id,className:'sub-note'},x.shop+': '+pounds(x.pence)+' counted this month from '+pounds(x.receipt.paidPence)+' paid, allocated over '+x.receipt.spreadMonths+' months.')),f.carryOut>0&&e('small',null,carryForwardText(s,f))),
      e('section',{className:'surface payment-summary'},e('h2',null,'What actually happened'),
        [['Payments',pounds(paid)],['Money back',pounds(returned)],['Net cash paid',pounds(paid-returned)]].map(([label,value])=>e('div',{className:'summary-line',key:label},e('span',null,label),e('b',null,value))),
        e('small',null,rows.filter(x=>!x.refund).length+' payments · '+rows.filter(x=>x.receiptTotal&&s.receipts.find(r=>r.id===x.receiptId)?.lines.some(l=>l.tracking!=='none')).length+' receipts with stock details'))),
    e('section',{className:'surface ledger-panel'},e(SectionTitle,{title:'Bills & receipts',note:'Recorded spending since 8 September. Entries without itemised receipts are labelled.',action:e('div',{className:'ledger-actions'},e(Btn,{icon:'back',onClick:()=>setDialog({type:'money-back'})},'Money back'),e(Btn,{kind:'primary',icon:'plus',onClick:()=>setDialog({type:'receipt'})},'Add payment'))}),
      rows.map(x=>e(LedgerRow,{key:x.id,state:s,x,onOpen:x=>setDialog(transactionDialog(x))})),!rows.length&&e('p',{className:'empty-copy'},'No payments recorded this month.')),
    e('details',{className:'surface quiet-details'},e('summary',null,'Spending calendar'),e(SpendingCalendar,{state:s,month:m,onAdd:date=>setDialog({type:'receipt',date}),onOpen:x=>setDialog(transactionDialog(x))})),
    e('details',{className:'surface quiet-details'},e('summary',null,'Spending by category'),e('div',{className:'details-content'},e(Btn,{small:true,onClick:()=>setDialog({type:'targets'})},'Edit category targets'),groups.map(c=>e('div',{className:'summary-line',key:c.id},e('span',null,c.name),e('b',null,pounds(c.amount)))))),
    e('details',{className:'surface quiet-details'},e('summary',null,'Upcoming costs & saving plans'),e('div',{className:'details-content'},[['Shopping plans',f.plannedPence],['Upcoming subscriptions',f.subscriptionPence],['I want to leave unspent',f.intentionPence],['After these plans',f.projectedPence]].map(([label,n])=>e('div',{className:'summary-line',key:label},e('span',null,label),e('b',null,pounds(n)))),e('p',{className:'muted'},'Plans are estimates. '+(f.unknown?f.unknown+' planned items still need a price.':'')),e(Btn,{small:true,onClick:()=>setDialog({type:'intention'})},'Edit saving intention'))),
    e('details',{className:'surface quiet-details'},e('summary',null,'Monthly review'),e('div',{className:'details-content'},e('ul',null,
      e('li',null,s.lists.filter(l=>dateMonth(l.date)===m).flatMap(l=>l.lines).filter(x=>x.status==='planned'&&x.priority==='optional').length+' optional purchases on your lists'),
      e('li',null,s.stockEvents.filter(x=>x.action==='waste'&&dateMonth(x.date)===m).length+' waste records'),
      e('li',null,s.subscriptions.filter(x=>!x.paused).length+' active subscriptions'),
      e('li',null,s.mealEntries.filter(x=>x.status==='cooked'&&dateMonth(x.date)===m).length+' meals marked cooked')))));
};

class PlannerErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={failed:false};}
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed ? e('main',{className:'welcome'},e('section',null,e('h1',null,'This view could not open'),e('p',null,'Your saved data has not been changed. Reopen the overview to continue.'),e(Btn,{kind:'primary',onClick:()=>{location.hash='#/money';location.reload();}},'Reopen Money & saving'))) : this.props.children;}
}

// Use category artwork for categories, never a randomly selected product pack.
typeArt = function consistentTypeArt(s,node) {
  if (node?.image) return node.image;
  const family = artFamily(s,node?.categoryId||'uncategorised',node?.name||'');
  return (CATEGORY_ART[node?.categoryId]||[])[0] || ART[family] || ART.other;
};
