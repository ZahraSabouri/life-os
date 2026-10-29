const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({React:{createElement:()=>null}});for(const file of ['core','seed','domain'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file+'.js'),'utf8'),ctx);
const a=vm.runInContext('({newBudgetState,validateV4,saveCredit,removeCredit,budgetFigures,ledger,moneyTransactions,budgetMonthChoices,monthlyBudgetRows})',ctx);
const fresh=()=>({...a.newBudgetState(),trackingStart:'2026-07-01',budgetStart:'2026-09',budgets:{'2026-09':{total:250,grocery:null},'2026-10':{total:250,grocery:null}},expenses:[{id:'july',date:'2026-07-10',amount:400,type:'other'},{id:'sept',date:'2026-09-10',amount:280,type:'other'},{id:'oct',date:'2026-10-10',amount:100,type:'other'}]});
const credit={from:'Example residence',pence:17100,date:'2026-10-07',kind:'cashback',includeInBudget:true};
test('cashback adds available funds once, without changing spending, base allowance, or inventory',()=>{
 const s=fresh(),n=a.saveCredit(s,credit),f=a.budgetFigures(n,'2026-10');a.validateV4(JSON.parse(JSON.stringify(n)));
 assert.equal(f.baseTotal,250);assert.equal(f.budgetIncomePence,17100);assert.equal(f.totalSpent,100);assert.equal(f.carryIn,30);assert.equal(f.totalRemaining,291);
 assert.equal(n.budgets['2026-10'].total,250);assert.equal(a.ledger(n).length,3);assert.equal(a.moneyTransactions(n).filter(x=>x.credit).length,1);
 assert.equal(a.budgetFigures(n,'2026-11').carryIn,0);assert.equal(a.budgetFigures(n,'2026-11').baseTotal,0);
 assert.equal(JSON.stringify(n.resources),JSON.stringify(s.resources));assert.equal(JSON.stringify(n.expenses),JSON.stringify(s.expenses));
 const edited=a.saveCredit(n,{...credit,id:n.credits[0].id,pence:17200});assert.equal(edited.credits.length,1);assert.equal(a.budgetFigures(edited,'2026-10').totalRemaining,292);
 assert.equal(a.budgetFigures(a.removeCredit(n,n.credits[0].id),'2026-10').totalRemaining,120);
});
test('historical purchases do not become allowance debt before its recorded start',()=>{
 const s=fresh();assert.equal(a.budgetFigures(s,'2026-07').totalSpent,400);assert.equal(a.budgetFigures(s,'2026-07').carryOut,0);assert.equal(a.budgetFigures(s,'2026-09').carryIn,0);assert.equal(a.budgetFigures(s,'2026-10').carryIn,30);
 assert(a.budgetMonthChoices(s).includes('2026-07'));
 const old={...s};delete old.budgetStart;assert.equal(a.budgetFigures(old,'2026-09').carryIn,400);
});
test('separately recorded income does not change allowance; invalid or duplicate credits are refused',()=>{
 const s=fresh(),n=a.saveCredit(s,{...credit,includeInBudget:false});assert.equal(a.budgetFigures(n,'2026-10').incomePence,17100);assert.equal(a.budgetFigures(n,'2026-10').budgetIncomePence,0);assert.equal(a.budgetFigures(n,'2026-10').totalRemaining,120);
 for(const patch of [{pence:-1},{pence:1.2},{pence:0},{from:''},{date:'2026-02-30'}])assert.throws(()=>a.saveCredit(s,{...credit,...patch}));
 assert.throws(()=>a.validateV4({...n,credits:[n.credits[0],n.credits[0]]}));assert.throws(()=>a.validateV4({...n,budgetStart:'2026-13'}));
});
test('independent monthly allowances retain every monthly overrun without taking it from the next month',()=>{
 const s={...fresh(),rolloverOverspend:false,budgets:{'2026-09':{total:250,grocery:null},'2026-10':{total:250,grocery:null},'2026-11':{total:250,grocery:null}},expenses:[{id:'sept',date:'2026-09-10',amount:442.45,type:'other'},{id:'oct',date:'2026-10-10',amount:455.57,type:'other'}]};
 const n=a.saveCredit(s,credit),oct=a.budgetFigures(n,'2026-10'),nov=a.budgetFigures(n,'2026-11');
 assert.equal(oct.allowanceTotal,421);assert.equal(oct.carryIn,0);assert.equal(oct.totalRemaining,-34.57);assert.equal(oct.carryOut,0);assert.equal(nov.allowanceTotal,250);assert.equal(nov.totalRemaining,250);assert.equal(nov.carryIn,0);
 const history=a.monthlyBudgetRows(n,'2026-11');assert.equal(history.find(x=>x.month==='2026-09').overPence,19245);assert.equal(history.find(x=>x.month==='2026-10').overPence,3457);assert.equal(history.find(x=>x.month==='2026-11').overPence,0);
 assert.equal(n.expenses.length,2);a.validateV4(n);
});
