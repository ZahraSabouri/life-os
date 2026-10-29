/* Standalone income/cashback is separate from spending and linked refunds. */
const beforeMoneyInDialog=ProductDialog;
ProductDialog=function moneyInDialog(p){return p.dialog.type==='credit'?e(CreditEditor,p):e(beforeMoneyInDialog,p);};
function CreditEditor({state:s,dialog:d,selectedMonth:m,commit,onClose}){
 const old=(s.credits||[]).find(x=>x.id===d.id),today=isoDate(new Date());
 const [form,set]=useDraft(()=>old?{...old,amount:(old.pence/100).toFixed(2)}:{from:'',amount:'',date:dateMonth(today)===m?today:monthStart(m),kind:'income',includeInBudget:true,note:''});
 return e(FormModal,{title:old?'Money received':'Record money received',onClose,label:'Save money received',onSubmit:()=>commit(st=>saveCredit(st,{...form,id:old?.id,pence:pennies(form.amount)}),'Money received saved')},
  e('div',{className:'form-grid'},e(Input,{label:'From',value:form.from,onChange:v=>set('from',v),required:true}),e(Input,{label:'Amount (£)',type:'number',min:'.01',step:'.01',value:form.amount,onChange:v=>set('amount',v),required:true})),
  e('div',{className:'form-grid'},e(Input,{label:'Day received',type:'date',value:form.date,onChange:v=>set('date',v),required:true}),e(Select,{label:'Type',value:form.kind,onChange:v=>set('kind',v),options:[['income','Income'],['cashback','Cashback'],['other','Other money received']]})),
  e('label',{className:'checkbox-label'},e('input',{type:'checkbox',checked:form.includeInBudget,onChange:ev=>set('includeInBudget',ev.target.checked)}),'Add to this month’s allowance'),
  e(Textarea,{label:'Note',value:form.note,onChange:v=>set('note',v),rows:3}),
  old&&e('details',{className:'danger-zone'},e('summary',null,'Remove this record'),e(Btn,{kind:'danger',onClick:()=>{if(confirm('Remove this money received record?'))commit(st=>removeCredit(st,old.id),'Money received removed');}},'Remove money received')));
}
