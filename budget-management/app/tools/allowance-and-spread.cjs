'use strict';
// Xar's allowance is £250 a month. The £225 figure existed because a year's worth of cupboard
// stock was bought in one go on 8 September; the £25 difference was his own way of paying it
// off. The app now counts a stock-up over the months it feeds, so the allowance goes back to
// its real £250 and the Morrisons order is charged in instalments instead.
const fs=require('fs'),path=require('path'),vm=require('node:vm');
const appDir=process.argv[2],stateIn=process.argv[3],stateOut=process.argv[4],MONTHS=Number(process.argv[5]||6);
const ctx=vm.createContext({React:{createElement:()=>null},console});
for(const f of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(appDir,'src',f+'.js'),'utf8'),ctx);
const api=vm.runInContext('({migrateV4,validateV4,setReceiptSpread,receiptShareIn,budgetFigures,ledger,dateMonth,nextCalendarMonth,spreadNote})',ctx);
const file=JSON.parse(fs.readFileSync(stateIn,'utf8'));
let s=api.migrateV4(file.state);
const before=api.budgetFigures(s,'2026-09');
console.log('before: allowance £'+before.baseTotal.toFixed(2)+' spent £'+before.totalSpent.toFixed(2)+' left £'+before.totalRemaining.toFixed(2));
s=api.setReceiptSpread(s,'morrisons-2026-09-08',MONTHS);
const budgets={...s.budgets};
for(let m='2026-09',i=0;i<14;i++,m=api.nextCalendarMonth(m))
 budgets[m]={...(budgets[m]||{}),total:250,grocery:null,note:'£250 a month, all spending together. A big stock-up is counted over the months it feeds, not all in the month it was paid.'};
s={...s,budgets};
api.validateV4(s);
for(const m of ['2026-09','2026-10','2026-11','2027-02','2027-03']){
 const f=api.budgetFigures(s,m);
 console.log(m+': allowance £'+f.baseTotal.toFixed(2)+' counted £'+f.totalSpent.toFixed(2)+' left £'+f.totalRemaining.toFixed(2)+(f.carryIn?' (carry-in £'+f.carryIn.toFixed(2)+')':''));
}
console.log('September stock-up share £'+(api.receiptShareIn(s,s.receipts.find(r=>r.id==='morrisons-2026-09-08'),'2026-09')/100).toFixed(2));
const total=[...Array(MONTHS)].reduce((n,_,i)=>{let m='2026-09';for(let k=0;k<i;k++)m=api.nextCalendarMonth(m);return n+api.receiptShareIn(s,s.receipts.find(r=>r.id==='morrisons-2026-09-08'),m);},0);
console.log('instalments add back to £'+(total/100).toFixed(2));
fs.writeFileSync(stateOut,JSON.stringify({revision:file.revision+1,savedAt:new Date().toISOString(),state:s},null,2));
console.log('written',stateOut);
