const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const storage=new Map();
const context=vm.createContext({React:{createElement:()=>null},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/core.js'),'utf8'),context);
const api=vm.runInContext('({budgetFigures,defaultState,withAddedExpense,withDeletedExpense,withBudgetField,upgradeState,loadState,monthLabel})',context);
const figures=api.budgetFigures;
function purchase(month,amount,type='other',id='purchase'){return {id,date:month+'-15',amount,type,category:'Other',note:''};}
function plan(...expenses){const initial=api.defaultState();return {...initial,expenses:[...initial.expenses,...expenses]};}
function legacyPlan(...expenses){const initial=api.defaultState();return {...initial,version:2,budgets:{...initial.budgets,'2026-09':{grocery:null,total:100,note:'Earlier September plan'}},expenses};}
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}return value;}

test('£20 over September reduces October from £225 to £205',()=>{
  const state=plan(purchase('2026-09',120));
  assert.equal(figures(state,'2026-09').totalRemaining,-20);
  assert.equal(figures(state,'2026-09').carryOut,20);
  const october=figures(state,'2026-10');
  assert.equal(october.baseTotal,225);
  assert.equal(october.carryIn,20);
  assert.equal(october.adjustedTotal,205);
  assert.equal(october.totalRemaining,205);
  assert.equal(october.groceryRemaining,125);
  assert.equal(october.otherRemaining,80);
});
test('later overspending is measured against the reduced allowance',()=>{
  const state=plan(purchase('2026-09',120),purchase('2026-10',210));
  assert.equal(figures(state,'2026-10').carryOut,5);
  assert.equal(figures(state,'2026-11').totalRemaining,220);
  assert.equal(figures(state,'2026-12').totalRemaining,225);
});
test('large overspend continues until subsequent allowances cover it',()=>{
  const state=plan(purchase('2026-09',500));
  assert.equal(figures(state,'2026-10').carryIn,400);
  assert.equal(figures(state,'2026-10').totalRemaining,-175);
  assert.equal(figures(state,'2026-11').totalRemaining,50);
  assert.equal(figures(state,'2026-11').otherRemaining,0);
  assert.equal(figures(state,'2026-11').groceryRemaining,50);
  assert.equal(figures(state,'2026-12').totalRemaining,225);
});
test('unspent money does not increase future budgets or offset later debt',()=>{
  const state=plan(purchase('2026-09',10),purchase('2026-10',235));
  assert.equal(figures(state,'2026-10').adjustedTotal,225);
  assert.equal(figures(state,'2026-11').adjustedTotal,215);
});
test('deleting or correcting an earlier purchase recalculates later months',()=>{
  const state=plan(purchase('2026-09',120));
  assert.equal(figures(api.withDeletedExpense(state,'purchase'),'2026-10').totalRemaining,225);
  const corrected={...state,expenses:state.expenses.map(expense=>expense.id==='purchase'?{...expense,amount:110}:expense)};
  assert.equal(figures(corrected,'2026-10').totalRemaining,215);
});
test('changing the base limit recalculates the debt without compounding it',()=>{
  const state=plan(purchase('2026-09',120));
  const raised=api.withBudgetField(state,'2026-09','total',235);
  assert.equal(figures(raised,'2026-10').totalRemaining,215);
  const october=api.withBudgetField(state,'2026-10','total',230);
  assert.equal(figures(october,'2026-10').totalRemaining,210);
  assert.equal(figures(october,'2026-10').b.total,230);
});
test('future purchases do not affect past months',()=>{
  const state=plan(purchase('2027-01',1000));
  assert.equal(figures(state,'2026-09').totalRemaining,100);
  assert.equal(figures(state,'2026-12').totalRemaining,225);
});
test('a grocery ceiling overrun alone does not carry forward',()=>{
  const state=plan(purchase('2026-10',150,'grocery'));
  assert.equal(figures(state,'2026-10').groceryRemaining,-25);
  assert.equal(figures(state,'2026-10').carryOut,0);
  assert.equal(figures(state,'2026-11').totalRemaining,225);
});
test('grocery and other purchases share the reduced total',()=>{
  const state=plan(purchase('2026-09',120),purchase('2026-10',100,'grocery'),purchase('2026-10',110));
  assert.equal(figures(state,'2026-10').totalRemaining,-5);
  assert.equal(figures(state,'2026-10').groceryRemaining,-5);
  assert.equal(figures(state,'2026-11').carryIn,5);
});
test('shared category balances follow the reduced total',()=>{
  const state=plan(purchase('2026-09',120));
  state.budgets['2026-10'].grocery=null;
  assert.equal(figures(state,'2026-10').groceryRemaining,205);
  assert.equal(figures(state,'2026-10').otherRemaining,205);
});
test('zero allowances and missing months retain debt',()=>{
  const state=plan(purchase('2026-09',120),purchase('2026-11',5));
  state.budgets['2026-10']={total:0,grocery:null};
  delete state.budgets['2026-11'];
  assert.equal(figures(state,'2026-10').totalRemaining,-20);
  assert.equal(figures(state,'2026-11').totalRemaining,-25);
  assert.equal(figures(state,'2026-12').totalRemaining,200);
});
test('carry survives the end of the plan without invented allowances',()=>{
  const state=plan(purchase('2027-02',250));
  assert.equal(figures(state,'2027-03').carryIn,25);
  assert.equal(figures(state,'2027-03').baseTotal,0);
  assert.equal(figures(state,'2027-06').carryOut,25);
  assert.equal(figures(state,'2027-06').nextMonth,'2027-07');
  assert.equal(api.monthLabel('2027-07'),'July 2027');
});
test('December debt moves into January of the next year',()=>{
  const state=plan(purchase('2026-12',235));
  assert.equal(figures(state,'2026-12').nextMonth,'2027-01');
  assert.equal(figures(state,'2027-01').totalRemaining,215);
});
test('pennies remain exact with decimal purchases and multiple carry-forwards',()=>{
  const state=plan(purchase('2026-09',99.99),purchase('2026-09',.01),purchase('2026-09',.01),purchase('2026-10',225.02));
  assert.equal(figures(state,'2026-09').totalRemaining,-.01);
  assert.equal(figures(state,'2026-10').adjustedTotal,224.99);
  assert.equal(figures(state,'2026-11').carryIn,.03);
  assert.equal(figures(state,'2026-11').totalRemaining,224.97);
});
test('adding then undoing a purchase restores every later allowance',()=>{
  const original=plan();
  const saved=api.withAddedExpense(original,purchase('2026-09',120));
  assert.equal(figures(saved,'2026-10').totalRemaining,205);
  assert.equal(figures(original,'2026-10').totalRemaining,225);
});
test('order, reload and backup import do not duplicate deductions or mutate the plan',()=>{
  const state=freeze(plan(purchase('2026-11',221),purchase('2026-09',120),purchase('2026-10',210)));
  const before=JSON.stringify(state);
  assert.equal(figures(state,'2026-12').totalRemaining,224);
  assert.equal(figures(state,'2026-12').totalRemaining,224);
  assert.equal(JSON.stringify(state),before);
  const restored=api.upgradeState(JSON.parse(before));
  assert.equal(figures(restored,'2026-12').totalRemaining,224);
  assert.equal(JSON.stringify(restored),before);
});

test('the legacy allocation template preserves its original monthly allowance and opening record',()=>{
  const state=api.defaultState();
  assert.ok(Object.values(state.budgets).every(b=>b.total===225));
  assert.equal(state.expenses.length,1);
  assert.equal(state.expenses[0].amount,125);
  assert.equal(state.expenses[0].date,'2026-09-09');
  assert.match(state.expenses[0].note,/before 10 September \(assumed\)/);
  assert.equal(figures(state,'2026-09').totalRemaining,100);
  assert.equal(figures(state,'2026-10').carryIn,0);
  assert.equal(figures(state,'2026-10').totalRemaining,225);
});
test('older plans retain their entries, allocations and balances during the update',()=>{
  const old=legacyPlan(purchase('2026-09',120));
  old.meals['2026-09-15']={dinner:'Existing meal'};
  old.resources[0].scheduledDate='2026-10-05';
  freeze(old);
  const before=JSON.stringify(old),updated=api.upgradeState(old);
  assert.equal(JSON.stringify(old),before);
  assert.equal(updated.version,3);
  assert.equal(updated.budgets['2026-09'].total,225);
  assert.equal(updated.expenses.length,2);
  assert.equal(updated.expenses[0],old.expenses[0]);
  assert.equal(updated.resources,old.resources);
  assert.equal(updated.meals,old.meals);
  for(const month of Object.keys(old.budgets))assert.equal(figures(updated,month).totalRemaining,figures(old,month).totalRemaining);
});
test('version 1 backups receive both upgrades in order',()=>{
  const old=legacyPlan();old.version=1;old.budgets['2026-09'].grocery=100;
  const updated=api.upgradeState(old);
  assert.equal(updated.version,3);
  assert.equal(updated.budgets['2026-09'].total,225);
  assert.equal(updated.budgets['2026-09'].grocery,null);
  assert.equal(figures(updated,'2026-09').totalRemaining,100);
});
test('repeated upgrades and importing updated backups never duplicate the opening entry',()=>{
  const updated=api.upgradeState(legacyPlan());
  assert.equal(api.upgradeState(updated),updated);
  const restored=api.upgradeState(JSON.parse(JSON.stringify(updated)));
  assert.equal(restored.expenses.length,1);
  assert.equal(figures(restored,'2026-09').totalRemaining,100);
  const partial={...updated,version:2};
  assert.equal(api.upgradeState(partial).expenses.length,1);
});
test('removing the opening record stays removed across later loads and imports',()=>{
  const initial=api.defaultState();
  const removed=api.withDeletedExpense(initial,initial.expenses[0].id);
  const restored=api.upgradeState(JSON.parse(JSON.stringify(removed)));
  assert.equal(restored.expenses.length,0);
  assert.equal(figures(restored,'2026-09').totalRemaining,225);
});
test('customised limits and deliberately absent months remain unchanged',()=>{
  const old=legacyPlan();old.budgets['2026-09'].total=250;old.budgets['2026-10'].total=230;
  const updated=api.upgradeState(old);
  assert.equal(updated.budgets['2026-09'].total,250);
  assert.equal(updated.budgets['2026-10'].total,230);
  delete old.budgets['2026-09'];
  const withoutSeptember=api.upgradeState(old);
  assert.equal(withoutSeptember.expenses.length,0);
  assert.equal(withoutSeptember.budgets['2026-09'],undefined);
});
test('load preserves the exact old plan in a safety copy and upgrades once',()=>{
  storage.clear();
  const key='zahra_food_budget_planner_v1',raw=JSON.stringify(legacyPlan(purchase('2026-09',12.34)));
  storage.set(key,raw);
  const loaded=api.loadState();
  assert.equal(loaded.error,'');
  assert.equal(storage.get(key+'_before_september_opening'),raw);
  assert.equal(storage.get(key),raw);
  assert.equal(figures(loaded.state,'2026-09').totalRemaining,87.66);
  storage.set(key,JSON.stringify(loaded.state));
  const reloaded=api.loadState();
  assert.equal(reloaded.state.expenses.length,2);
  assert.equal(storage.get(key+'_before_september_opening'),raw);
  assert.equal(figures(reloaded.state,'2026-09').totalRemaining,87.66);
});
