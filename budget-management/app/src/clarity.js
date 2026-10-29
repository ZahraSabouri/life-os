/* A quieter overview. Detailed tools remain available in their existing views. */
const FullMoneyView = MoneyV2;
MoneyV2 = function MoneyClarity(p) {
  const {state:s,selectedMonth:m,setDialog}=p;
  if(['goals','subscriptions'].includes(p.route?.view))return e(FullMoneyView,p);
  const f=forecast(s,m),entries=moneyTransactions(s).filter(x=>(!s.trackingStart||x.date>=s.trackingStart)&&dateMonth(x.date)===m).sort((a,b)=>b.date.localeCompare(a.date));
  const rows=transactionRows(s,entries),paid=entries.filter(x=>!x.refund&&!x.credit).reduce((n,x)=>n+Math.round(x.amount*100),0),returned=-entries.filter(x=>x.refund).reduce((n,x)=>n+Math.round(x.amount*100),0);
  const groups=[...new Set(entries.filter(x=>!x.credit).map(x=>x.categoryId||x.category))].map(id=>({id,name:s.categories.find(c=>c.id===id)?.name||id,amount:entries.filter(x=>(x.categoryId||x.category)===id).reduce((n,x)=>n+Math.round(x.amount*100),0)})).sort((a,b)=>b.amount-a.amount);
  return e(React.Fragment,null,
    e(PageHeading,{title:'Money & saving',action:e(Btn,{onClick:()=>setDialog({type:'budget'})},'Edit allowance')}),
    e('div',{className:'page-tabs'},e(Segment,{label:'Money view',value:'overview',onChange:v=>p.go({view:v}),options:[['overview','My month'],['goals','Saving goals'],['subscriptions','Subscriptions']]})),
    e('div',{className:'money-summary'},
      e('section',{className:'balance-card '+(f.totalRemaining<0?'over-budget':'')},e('span',null,monthLabel(m)),e('h2',null,f.totalRemaining<0?'Over budget':'Remaining'),e('strong',null,s.budgets[m]?money(Math.abs(f.totalRemaining)):'Not set'),e('div',{className:'budget-numbers'},[['Allowance',f.allowanceTotal],['Spent',f.totalSpent],...(f.carryIn?[['Previous overspend',f.carryIn]]:[])].map(([label,n])=>e('div',{className:'summary-line',key:label},e('span',null,label),e('b',null,money(n)))))),
      e('section',{className:'surface payment-summary'},e('h2',null,'Cash flow'),[['Payments',paid],...(returned?[['Refunds',returned]]:[]),...(f.incomePence?[['Income',f.incomePence]]:[]),['Net spent',paid-returned-(f.incomePence||0)]].map(([label,n])=>e('div',{className:'summary-line',key:label},e('span',null,label),e('b',null,pounds(n)))))),
    e(MonthlyTotals,{state:s,month:m}),
    e('section',{className:'surface ledger-panel'},e(SectionTitle,{title:'Transactions',action:e('div',{className:'ledger-actions'},e(Btn,{icon:'plus',onClick:()=>setDialog({type:'credit'})},'Add income'),e(Btn,{icon:'back',onClick:()=>setDialog({type:'money-back'})},'Money back'),e(Btn,{kind:'primary',icon:'plus',onClick:()=>setDialog({type:'receipt'})},'Add payment'))}),rows.map(x=>e(LedgerRow,{key:x.id,state:s,x,onOpen:x=>setDialog(transactionDialog(x))})),!rows.length&&e('p',{className:'empty-copy'},'No transactions.')),
    e('details',{className:'surface quiet-details'},e('summary',null,'Calendar'),e(SpendingCalendar,{state:s,month:m,onAdd:date=>setDialog({type:'receipt',date}),onOpen:x=>setDialog(transactionDialog(x))})),
    e('details',{className:'surface quiet-details'},e('summary',null,'Categories'),e('div',{className:'details-content'},e(Btn,{small:true,onClick:()=>setDialog({type:'targets'})},'Edit targets'),groups.map(c=>e('div',{className:'summary-line',key:c.id},e('span',null,c.name),e('b',null,pounds(c.amount)))))),
    e('details',{className:'surface quiet-details'},e('summary',null,'Forecast'),e('div',{className:'details-content'},[['Shopping',f.plannedPence],['Subscriptions',f.subscriptionPence],['Saving target',f.intentionPence],['Remaining after plans',f.projectedPence]].map(([label,n])=>e('div',{className:'summary-line',key:label},e('span',null,label),e('b',null,pounds(n)))),f.unknown>0&&e('p',{className:'muted'},f.unknown+' items without a price'),e(Btn,{small:true,onClick:()=>setDialog({type:'intention'})},'Edit saving target'))));
};
function MonthlyTotals({state:s,month:m}){
 const through=m>dateMonth(isoDate(new Date()))?m:dateMonth(isoDate(new Date())),rows=monthlyBudgetRows(s,through);
 return e('section',{className:'surface monthly-totals'},e('h2',null,'Monthly totals'),e('div',{className:'month-table-scroll'},e('table',null,e('thead',null,e('tr',null,['Month','Allowance','Spent','Over budget'].map(x=>e('th',{key:x,scope:'col'},x)))),e('tbody',null,rows.map(x=>e('tr',{key:x.month,className:x.month===m?'selected':''},e('th',{scope:'row'},monthLabel(x.month)),e('td',null,x.allowancePence==null?'—':pounds(x.allowancePence)),e('td',null,pounds(x.spentPence)),e('td',{className:x.overPence?'negative':''},x.overPence?pounds(x.overPence):'—')))))));
}

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
