const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({React:{createElement:()=>null}});for(const file of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file+'.js'),'utf8'),ctx);
const api=vm.runInContext('({migrateV4,defaultState,validateV4,stockRows,stockAction,useStock,itemKey,catalogueEntries,entryFor,entryFacts,entryHistory,entryInsights,suggestTracking,saveItem,planMeal,cookMeal,eatMeal,lastingInfo,makeLot,dueItems,wordsIn})',ctx);
const fresh=()=>api.migrateV4(api.defaultState());
const entry=(s,name)=>api.catalogueEntries(s).find(g=>g.rows.some(r=>r.name===name));

test('one item, however it was named',()=>{
  assert.equal(api.itemKey('Current sunflower oil'),api.itemKey('Next sunflower oil'));
  assert.equal(api.itemKey('Laundry capsule allowance'),'laundry capsule');
  assert.equal(api.itemKey('Dark chocolate bar 2'),'dark chocolate bar');
  const s=fresh(),oil=entry(s,'Current sunflower oil');
  assert(oil.rows.some(r=>r.name==='Next sunflower oil'),'both bottles in one entry');assert.equal(oil.name,'Sunflower oil');
});
test('toilet paper shows one of eighteen used, and when',()=>{
  let s=fresh();const tp=entry(s,'Toilet paper');
  s=api.useStock(s,tp.rows.map(r=>r.id),1,'2026-09-21');
  const g=entry(s,'Toilet paper'),f=api.entryFacts(g);
  assert.equal(f.total,18);assert.equal(f.left,17);assert.equal(f.used,1);
  const h=api.entryHistory(s,g);assert.equal(h[0].action,'use');assert.equal(h[0].date,'2026-09-21');assert.equal(h[0].amount,1);
});
test('the pace of use gives a run-out date',()=>{
  let s=fresh();const ids=entry(s,'Toilet paper').rows.map(r=>r.id);
  s=api.useStock(s,ids,1,'2026-09-01');s=api.useStock(s,entry(s,'Toilet paper').rows.map(r=>r.id),1,'2026-09-15');
  const g=entry(s,'Toilet paper'),f=api.entryFacts(g),ins=api.entryInsights(s,g,api.entryHistory(s,g),f,'2026-09-29');
  assert(Math.abs(ins.perDay-2/28)<1e-9);assert(ins.runOut>'2027-01-01');
});
test('stock added by hand joins its catalogue item and shows in its history',()=>{
  let s=fresh();const item=s.items.find(i=>i.name==='Tomato ketchup');
  s={...s,lots:[...s.lots,api.makeLot({name:'Tomato ketchup',itemId:item.id,quantity:1,unit:'bottle',tracking:'level',categoryId:item.categoryId,added:'2026-09-20'})]};
  api.validateV4(s);const g=api.catalogueEntries(s).find(x=>x.item&&x.item.id===item.id);
  assert.equal(g.rows.length,1);assert(api.entryHistory(s,g).some(x=>x.kind==='added'));assert(api.entryHistory(s,g).some(x=>x.kind==='bought')||!item.observations?.length);
});
test('a recipe with a tablespoon of oil never subtracts from the bottle',()=>{
  let s=fresh();s.recipes=[{id:'r',name:'Fried rice',servings:1,ingredients:[{name:'Sunflower oil',quantity:1,unit:'tbsp'},{name:'oil',quantity:1,unit:'tsp'},{name:'Chicken breast',quantity:1,unit:'half-breast portion'}]}];
  s=api.planMeal(s,{id:'m',name:'Fried rice',recipeId:'r',date:'2026-09-22',servings:1});
  const m=s.mealEntries[0];assert.equal(m.missing.length,0);assert.equal(m.reservations.length,1);assert(m.touches.length>=1);assert.equal(m.touches[0].recipe,'1 tbsp');
  const before=api.entryFacts(entry(s,'Current sunflower oil'));s=api.cookMeal(s,'m');api.validateV4(s);
  const after=api.entryFacts(entry(s,'Current sunflower oil'));assert.equal(after.left,before.left);
  assert.equal(api.lastingInfo(api.stockRows(s).find(r=>r.id===m.touches[0].sourceId),'2026-09-22').state,'in-use');
});
test('a meal can be marked eaten even if something was missing',()=>{
  let s=fresh();s.recipes=[{id:'r',name:'Saffron rice',servings:1,ingredients:[{name:'Saffron',quantity:1,unit:'pinch'}]}];
  s=api.planMeal(s,{id:'m',name:'Saffron rice',recipeId:'r',date:'2026-09-22',servings:1});
  assert.throws(()=>api.cookMeal(s,'m'),/missing/);assert.equal(api.cookMeal(s,'m',0,true).mealEntries[0].status,'cooked');
});
test('new things start with a sensible kind',()=>{
  assert.equal(api.suggestTracking('Soy sauce','uncategorised','item'),'level');
  assert.equal(api.suggestTracking('Olive oil','uncategorised','bottle'),'level');
  assert.equal(api.suggestTracking('Toilet rolls','paper-toilet-rolls','roll'),'count');
  assert.equal(api.suggestTracking('Basmati rice','rice-pasta-wrappers','g'),'measured');
  assert.equal(api.suggestTracking('Wok','kitchen-equipment','item'),'durable');
  assert.equal(api.suggestTracking('Flat white','coffee-snacks-out','item'),'none');
});
test('saving an item as long-lasting moves its stock to long-lasting too',()=>{
  let s=fresh();const pizza=entry(s,'Mini pizza');
  s=api.saveItem(s,{name:'Mini pizza',brand:'Lidl',categoryId:'frozen-food',unit:'pizza',tracking:'count',aliases:pizza.rows.map(r=>r.name),photo:'photos/pizza.jpg',every:'weekly'});api.validateV4(s);
  const g=api.catalogueEntries(s).find(x=>x.item&&x.item.name==='Mini pizza');assert(g&&g.rows.length===pizza.rows.length);assert.equal(g.item.brand,'Lidl');
  const honey=entry(s,'Spanish honey');s=api.saveItem(s,{name:'Spanish honey',categoryId:'breakfast-spreads',unit:'jar',tracking:'measured'});
  assert(api.stockRows(s).filter(r=>r.name==='Spanish honey').every(r=>r.tracking==='measured'));
});
test('a finished bottle teaches how long the next one lasts',()=>{
  let s=fresh();const cur=api.stockRows(s).find(r=>r.name==='Current sunflower oil'),next=api.stockRows(s).find(r=>r.name==='Next sunflower oil');
  s=api.stockAction(s,cur.id,'open',null,'2026-03-01');s=api.stockAction(s,cur.id,'finish',null,'2026-07-01');
  s=api.stockAction(s,next.id,'open',null,'2026-07-02');
  assert.equal(api.stockRows(s).find(r=>r.id===next.id).lastsMonths,4);
  const g=entry(s,'Next sunflower oil'),ins=api.entryInsights(s,g,api.entryHistory(s,g),api.entryFacts(g));assert.equal(ins.lastsMonths,4);
});
test('loose matching only for whole words',()=>{assert(api.wordsIn('olive oil','Frylight olive-oil spray'));assert(!api.wordsIn('olive','Sunflower oil'));});
test('the current bottle is used before the next one',()=>{
  let s=fresh();s.recipes=[{id:'r',name:'Eggs',servings:1,ingredients:[{name:'Sunflower oil',quantity:1,unit:'tsp'}]}];
  s=api.planMeal(s,{id:'m',name:'Eggs',recipeId:'r',date:'2026-09-22',servings:1});
  assert.equal(api.stockRows(s).find(r=>r.id===s.mealEntries[0].touches[0].sourceId).name,'Current sunflower oil');
});
test('one roll reads as one roll',()=>{const d=vm.runInContext('displayQty',ctx);assert.equal(d(1,'rolls'),'1 roll');assert.equal(d(17,'rolls'),'17 rolls');assert.equal(d(2,'pizza'),'2 pizzas');});
test('changing the unit counts what is at home in the new unit, and the amount can be corrected',()=>{
  const f=vm.runInContext('({setHomeAmount})',ctx);
  let s=fresh();const item=s.items.find(i=>i.name==='Cold Brew Tea Mojito');
  s={...s,lots:[...s.lots,api.makeLot({name:'Cold Brew Tea Mojito',itemId:item.id,quantity:1,unit:'bottle',tracking:'count',categoryId:item.categoryId,purchased:'2026-09-21',receiptId:'r'})]};
  s=api.validateV4(api.saveItem(s,{...item,tracking:'count',unit:'tea bags',stockPerUnit:17},{homeTotal:17}));
  const g=api.catalogueEntries(s).find(x=>x.item&&x.item.id===item.id),fa=api.entryFacts(g);
  assert.equal(fa.left,17);assert.equal(fa.unit,'tea bags');assert.equal(fa.tracking,'count');
  assert(api.entryHistory(s,g).some(x=>x.action==='correct'));
  s=api.validateV4(f.setHomeAmount(s,g.key,'tea bags',15,'2026-09-23'));assert.equal(api.entryFacts(api.catalogueEntries(s).find(x=>x.key===g.key)).left,15);
  let t=fresh();const tp=api.catalogueEntries(t).find(x=>x.rows.some(r=>r.name==='Toilet paper'));
  t=api.validateV4(f.setHomeAmount(t,tp.key,'rolls',16,'2026-09-22'));assert.equal(api.entryFacts(api.catalogueEntries(t).find(x=>x.key===tp.key)).left,16);
});
