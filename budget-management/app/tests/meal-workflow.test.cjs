const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const c=vm.createContext({React:{createElement:()=>null}});
for(const f of ['core','seed','domain','types','meal-workflow-domain'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),c);
const a=vm.runInContext('({migrateV4,defaultState,validateV4,makeLot,planMeal,prepareMeal,cookMeal,uneatMeal,stockRows,usageLog,weeklyUsage,reservedAmount,parseReceiptText,convertQty,refreshMeal,checkout,recordReceiptDraft,skipWorkflowMeal})',c);
function fresh(){let s=a.migrateV4(a.defaultState());s.lots.push(a.makeLot({id:'raw',name:'Test vegetables',unit:'g',quantity:600,tracking:'measured',categoryId:'fruit-vegetables'}));s.recipes.push({id:'r',name:'Vegetable batch',servings:3,ingredients:[{name:'Test vegetables',quantity:600,unit:'g'}]});return s;}
function planned(){let s=fresh();s=a.planMeal(s,{id:'batch',name:'Vegetable batch',recipeId:'r',date:'2026-10-14',kind:'prep',servings:3});s=a.planMeal(s,{id:'dinner',name:'Dinner',preparedFrom:'batch',date:'2026-10-14',servings:1});return a.validateV4(s);}
test('preparing makes portions, eating uses a portion, and raw ingredients are used once',()=>{
 let s=planned();assert.equal(s.lots.find(l=>l.id==='raw').remaining,600);assert(s.mealEntries.find(m=>m.id==='dinner').waitingForPrep);
 s=a.validateV4(a.prepareMeal(s,'batch',{date:'2026-10-14',location:'Fridge',expiry:'2026-10-16'}));
 assert.equal(s.lots.find(l=>l.id==='raw').remaining,0);let ready=s.lots.find(l=>l.prepared);assert.equal(ready.remaining,3);assert.equal(a.reservedAmount(s,ready.id),1);
 assert(a.usageLog(s).some(x=>x.kind==='prep'));assert(!a.usageLog(s).some(x=>x.kind==='meal'));
 s=a.validateV4(a.cookMeal(s,'dinner',0,false,{date:'2026-10-15'}));assert.equal(s.lots.find(l=>l.prepared).remaining,2);assert.equal(s.stockEvents.filter(x=>x.sourceId==='raw'&&x.action==='use').length,1);
 assert.equal(a.usageLog(s).filter(x=>x.kind==='meal').length,1);assert.throws(()=>a.cookMeal(s,'dinner'),/completed/);
});
test('undo restores a portion and then the ingredients, without duplication',()=>{
 let s=a.prepareMeal(planned(),'batch');s=a.cookMeal(s,'dinner');assert.throws(()=>a.uneatMeal(s,'batch'),/already been used/);
 s=a.validateV4(a.uneatMeal(s,'dinner'));assert.equal(s.lots.find(l=>l.prepared).remaining,3);
 s=a.validateV4(a.uneatMeal(s,'batch'));assert.equal(s.lots.find(l=>l.id==='raw').remaining,600);assert.equal(s.lots.filter(l=>l.prepared).length,0);assert(s.mealEntries.find(m=>m.id==='dinner').waitingForPrep);
});
test('batch portions cannot be overbooked or eaten before preparation',()=>{
 let s=planned();assert.throws(()=>a.cookMeal(s,'dinner'),/Prepare/);assert.throws(()=>a.planMeal(s,{id:'too-many',name:'Lunch',preparedFrom:'batch',date:'2026-10-15',servings:3}),/enough portions/);
 assert.throws(()=>a.planMeal(s,{id:'early',name:'Lunch',preparedFrom:'batch',date:'2026-10-13'}),/before/);assert.throws(()=>a.cookMeal(s,'batch'),/Prepare this batch/);
});
test('a prepared use-by date and an actual eating date are respected',()=>{
 let s=a.prepareMeal(planned(),'batch',{date:'2026-10-14',expiry:'2026-10-16'});assert.throws(()=>a.cookMeal(s,'dinner',0,false,{date:'2026-10-17'}),/use-by/);
 s=a.cookMeal(s,'dinner',0,false,{date:'2026-10-15'});assert.equal(s.mealEntries.find(m=>m.id==='dinner').date,'2026-10-15');
});
test('optional ingredients do not block a recipe, and explicit stock links survive refresh',()=>{
 let s=fresh();s.recipes[0].ingredients=[{name:'Broccoli by another name',quantity:600,unit:'g',sourceIds:['raw']},{name:'Optional cheese',quantity:10,unit:'g',optional:true}];
 s=a.planMeal(s,{id:'m',name:'Meal',date:'2026-10-14',recipeId:'r',servings:3});assert.equal(s.mealEntries[0].missing.length,0);s=a.refreshMeal(s,'m');assert.equal(s.mealEntries[0].reservations[0].amount,600);
 assert.equal(a.convertQty(1,'fillets','fillet'),1);assert.equal(a.convertQty(2,'kg','g'),2000);
});
test('pasted Lidl lines retain quantity and the discount on its own item',()=>{
 const r=a.parseReceiptText(fresh(),'Lidl\nTenderstem Broccoli 0082899         1.45 A\nPrice Cut\n-0.26\nBaked Cookies       3 x £0.55       1.65 A\nTOTAL\n2.84\nDate: 12/10/26 Time: 18:27:45');
 assert.equal(r.paidPence,284);assert.equal(r.lines.reduce((n,l)=>n+l.grossPence,0),284);assert.equal(r.lines[0].grossPence,119);assert.equal(r.lines[1].quantity,3);assert.equal(r.lines[1].tracking,'none');assert.equal(r.date,'2026-10-12');
});
test('prepared portions can be split between the fridge and freezer',()=>{
 let s=a.validateV4(a.prepareMeal(planned(),'batch',{date:'2026-10-14',location:'Fridge',freezerServings:1}));
 const lots=s.lots.filter(l=>l.prepared);assert.equal(lots.find(l=>l.location==='Fridge').remaining,2);assert.equal(lots.find(l=>l.location==='Freezer').remaining,1);
 const report=a.weeklyUsage(s,'2026-10-14');assert.equal(report.prepared.length,1);assert.equal(report.meals.length,0);assert(report.events.some(x=>x.kind==='prep'));
});
test('replacing a simple estimate records one corrected receipt and retains the old record',()=>{
 let s=fresh();const old={id:'estimate',date:'2026-10-12',merchant:'Lidl',paidPence:2000,lines:[{name:'Groceries estimate',quantity:1,unit:'payment',categoryId:'uncategorised',tracking:'none',grossPence:2000}]};s=a.checkout(s,old);
 const before=s.expenses.reduce((n,x)=>n+Math.round(x.amount*100),0);s=a.validateV4(a.recordReceiptDraft(s,{id:'actual',date:'2026-10-02',merchant:'Lidl',paidPence:2741,lines:[{name:'Groceries',quantity:1,unit:'payment',categoryId:'fruit-vegetables',tracking:'none',grossPence:2741}]},'estimate'));
 assert(!s.receipts.some(r=>r.id==='estimate'));assert.equal(s.expenses.reduce((n,x)=>n+Math.round(x.amount*100),0)-before,741);assert.equal(s.receiptReconciliations[0].previousReceipt.paidPence,2000);
 assert.throws(()=>a.recordReceiptDraft(s,old,'missing'),/no longer/);
});
test('garlic matches garlic before a garlic-flavoured sauce',()=>{
 let s=fresh();s.lots.push(a.makeLot({id:'mayo',name:'Garlic mayo',quantity:1,unit:'bottle',tracking:'level',opened:'2026-09-01'}),a.makeLot({id:'garlic',name:'Garlic',quantity:1,unit:'bulb',tracking:'level'}));s.recipes.push({id:'garlic-recipe',name:'Garlic dish',servings:1,ingredients:[{name:'Garlic',quantity:1,unit:'clove'}]});
 s=a.planMeal(s,{id:'garlic-meal',name:'Garlic dish',date:'2026-10-14',recipeId:'garlic-recipe',servings:1});assert.equal(s.mealEntries[0].touches[0].sourceId,'garlic');
});
test('piped names stay clean and a completed pending payment is removed',()=>{
 let s=fresh();const r=a.parseReceiptText(s,'Eggs | 1.69\nHalloumi | 1.99');assert.equal(r.lines[0].name,'Eggs');assert.equal(r.lines[1].name,'Halloumi');
 s.pendingPayments=[{id:'pending',month:'2026-10',pence:368}];s=a.recordReceiptDraft(s,{id:'paid',date:'2026-10-12',merchant:'Test shop',paidPence:368,lines:r.lines},null,'pending');assert.equal(s.pendingPayments.length,0);assert.equal(s.receipts[0].paidPence,368);
});
test('changing or skipping a batch respects and releases its linked meals',()=>{
 let s=planned();assert.throws(()=>a.planMeal(s,{...s.mealEntries.find(m=>m.id==='batch'),servings:.5}),/enough portions/);
 s=a.validateV4(a.skipWorkflowMeal(s,'batch'));assert.equal(s.mealEntries.find(m=>m.id==='dinner').status,'skipped');assert.equal(a.reservedAmount(s,'raw'),0);
});
