const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const c=vm.createContext({React:{createElement:()=>null}});
for(const f of ['core','seed','domain','types','meal-workflow-domain','food-domain'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),c);
const a=vm.runInContext('({migrateV4,defaultState,validateV4,makeLot,planMeal,cookMeal,stockRows,usageLog,weeklyUsage,entryHistory,catalogueEntries,entryInsights,entryFacts,reservedAmount,recipeAtHome,rankRecipes,foodNow,finishStock,mealToRecipe,copyRecipe,cookFromHome,addFoodToShopping,recipesUsing,isImportNote,useSoon,ingredientMatcher})',c);
const TODAY='2026-10-14',eq=(x,y,m)=>assert.deepEqual(JSON.parse(JSON.stringify(x)),y,m);
// Two packs of tomatoes (one linked by hand in the recipe), salad, cheese; one recipe that uses them.
function fresh(){
 let s=a.migrateV4(a.defaultState());
 s.items.push({id:'i-tom',name:'Test tomatoes',categoryId:'uncategorised',unit:'number',tracking:'count',observations:[]},{id:'i-salad',name:'Test salad',categoryId:'uncategorised',unit:'pack',tracking:'measured',observations:[]});
 s.lots.push(a.makeLot({id:'tom1',name:'Test tomatoes',itemId:'i-tom',unit:'number',quantity:1,tracking:'count',location:'Fridge',categoryId:'fruit-vegetables',purchased:'2026-10-01'}));
 s.lots.push(a.makeLot({id:'salad',name:'Test salad',itemId:'i-salad',unit:'pack',quantity:1,tracking:'measured',location:'Fridge',categoryId:'fruit-vegetables',purchased:'2026-10-12'}));
 s.recipes.push({id:'r-eggs',name:'Tomato thing',servings:1,ingredients:[{name:'Tomatoes',quantity:1,unit:'number',sourceIds:['tom1']}],steps:'Cook it.'});
 return a.validateV4(s);
}
test('a recipe ingredient means the food: after the linked pack is used, a new pack of it still counts',()=>{
 let s=fresh();assert.equal(a.recipeAtHome(s,s.recipes[0]).ready,true);
 s=a.validateV4(a.finishStock(s,['tom1'],{date:TODAY}));
 assert.equal(a.recipeAtHome(s,s.recipes[0]).ready,false,'nothing left once the only pack is gone');
 s.lots.push(a.makeLot({id:'tom2',name:'Test tomatoes',itemId:'i-tom',unit:'number',quantity:3,tracking:'count',location:'Fridge'}));
 const x=a.recipeAtHome(s,s.recipes[0]);assert.equal(x.ready,true);assert.equal(x.lines[0].have,3);
 s=a.validateV4(a.planMeal(s,{id:'m',date:TODAY,name:'Tomato thing',recipeId:'r-eggs'}));assert.equal(s.mealEntries.find(m=>m.id==='m').reservations[0].sourceId,'tom2');
 assert.equal(a.ingredientMatcher(s,{name:'x',quantity:1,unit:'number',sourceIds:['tom1']})({id:'other',name:'Garlic mayo'}),false,'a different food never matches');
});
test('what is kept for another meal is said, and meals of the same recipe are not counted as other meals',()=>{
 let s=fresh();s.recipes.push({id:'r-two',name:'Other tomato dish',servings:1,ingredients:[{name:'Test tomatoes',quantity:1,unit:'number',itemId:'i-tom'}]});
 s=a.validateV4(a.planMeal(s,{id:'mon',date:'2026-10-12',name:'Tomato thing',recipeId:'r-eggs'}));
 const own=a.recipeAtHome(s,s.recipes[0]),other=a.recipeAtHome(s,s.recipes.find(r=>r.id==='r-two'));
 assert.equal(own.kept.length,0);assert.equal(own.planned.length,1);
 assert.equal(other.ready,true,'physically at home');assert.equal(other.kept[0].kept[0].id,'mon');
});
test('cooking now takes what another plan had set aside, and that plan then says what it needs',()=>{
 let s=fresh();s.recipes.push({id:'r-two',name:'Other tomato dish',servings:1,ingredients:[{name:'Test tomatoes',quantity:1,unit:'number',itemId:'i-tom'}]});
 s=a.validateV4(a.planMeal(s,{id:'mon',date:'2026-10-12',name:'Tomato thing',recipeId:'r-eggs'}));
 s=a.validateV4(a.cookFromHome(s,{id:'now',date:TODAY,slot:'dinner',recipe:s.recipes.find(r=>r.id==='r-two')}));
 const now=s.mealEntries.find(m=>m.id==='now'),mon=s.mealEntries.find(m=>m.id==='mon');
 assert.equal(now.missing.length,0);assert.equal(now.reservations[0].sourceId,'tom1');assert.equal(mon.reservations.length,0);assert.equal(mon.missing.length,1);
});
test('finished with no date: out of the week and the usage rate, in the item history, and planned meals say what they need',()=>{
 let s=fresh();s=a.validateV4(a.planMeal(s,{id:'lunch',date:'2026-10-15',name:'Salad',stock:[{name:'Test salad',unit:'pack',ids:['salad'],amount:0.5}]}));
 s=a.validateV4(a.finishStock(s,['salad','tom1'],{date:TODAY,undated:true}));
 const ev=s.stockEvents.filter(e=>e.undated);assert.equal(ev.length,2);assert(ev.every(e=>e.action==='finish'&&e.date===TODAY));
 assert.equal(a.stockRows(s).find(r=>r.id==='salad').remaining,0);
 assert.equal(a.weeklyUsage(s,TODAY).events.filter(e=>e.kind==='stock').length,0,'not on any day of the week');
 const g=a.catalogueEntries(s).find(x=>x.item&&x.item.id==='i-salad'),h=a.entryHistory(s,g);assert(h.some(x=>x.undated));
 assert.equal(a.entryInsights(s,g,h,a.entryFacts(g),TODAY).perDay,undefined);
 const lunch=s.mealEntries.find(m=>m.id==='lunch');assert.equal(lunch.reservations.length,0);assert.equal(lunch.missing[0].name,'Test salad');
 s=a.validateV4(a.finishStock(fresh(),['tom1'],{date:'2026-10-13',action:'waste'}));assert.equal(s.stockEvents.at(-1).action,'waste');assert.equal(s.stockEvents.at(-1).date,'2026-10-13');
});
test('a meal without a recipe becomes a recipe that names its foods, and the meal follows it',()=>{
 let s=fresh();s=a.validateV4(a.planMeal(s,{id:'lunch',date:TODAY,slot:'lunch',name:'Salad bowl',stock:[{name:'Test salad',unit:'pack',ids:['salad'],amount:0.25},{name:'Test tomatoes',unit:'number',ids:['tom1'],amount:1}]}));
 s=a.validateV4(a.mealToRecipe(s,'lunch',{id:'r-new',steps:'Chop\nMix',minutes:'5'}));
 const r=s.recipes.find(x=>x.id==='r-new'),m=s.mealEntries.find(x=>x.id==='lunch');
 eq(r.ingredients.map(i=>[i.name,i.itemId,i.quantity,i.unit]),[['Test salad','i-salad',0.25,'pack'],['Test tomatoes','i-tom',1,'number']]);
 assert.equal(m.recipeId,'r-new');assert.equal((m.stock||[]).length,0);assert.equal(m.missing.length,0);
 eq(m.reservations.map(x=>[x.sourceId,x.amount]),[['salad',0.25],['tom1',1]]);
 const g=a.catalogueEntries(s).find(x=>x.item&&x.item.id==='i-salad');eq(a.recipesUsing(s,g).map(x=>x.id),['r-new']);
 s=a.validateV4(a.copyRecipe(s,'r-new','My salad','r-copy'));assert.equal(s.recipes.find(x=>x.id==='r-copy').ingredients.length,2);assert.equal(s.recipes.find(x=>x.id==='r-copy').name,'My salad');
});
test('now: this mealtime, meals from earlier still open, and fresh food to eat soon',()=>{
 let s=fresh();s=a.planMeal(s,{id:'old',date:'2026-10-12',slot:'dinner',name:'Old dinner'});s=a.validateV4(a.planMeal(s,{id:'tonight',date:TODAY,slot:'dinner',name:'Tonight'}));
 const n=a.foodNow(s,{today:TODAY,slot:'dinner'});
 eq(n.planned.map(m=>m.id),['tonight']);eq(n.open.map(m=>m.id),['old']);
 assert(n.soon.some(x=>x.row.id==='tom1'),'in the fridge since 1 October');assert(!n.soon.some(x=>x.row.id==='salad'),'bought two days ago');
 const dated={...a.stockRows(s).find(r=>r.id==='salad'),expiry:'2026-10-15',expiryType:'use-by'};assert.equal(a.useSoon(s,dated,TODAY).kind,'label');
 assert.equal(a.rankRecipes(s)[0].recipe.id,'r-eggs');
});
test('missing things go on this week’s list once, and the app’s own import notes are recognised',()=>{
 let s=fresh();s=a.validateV4(a.addFoodToShopping(s,[{name:'Halloumi',quantity:1,unit:'pack'},{name:'Garlic',quantity:1,unit:'clove'}],TODAY));
 const list=s.lists.find(l=>l.name==='This week');assert(list);assert.equal(list.weekOf,'2026-10-12');eq(list.lines.map(l=>[l.name,l.quantity,l.unit]),[['Halloumi',1,'pack'],['Garlic',1,'item']]);
 s=a.validateV4(a.addFoodToShopping(s,[{name:'halloumi',quantity:2,unit:'pack'}],TODAY));assert.equal(s.lists.find(l=>l.name==='This week').lines.length,2,'already on the list');
 assert(a.isImportNote('From the shared two-week plan. Planned only; no food has been marked consumed.'));assert(a.isImportNote('Working recipe from the shared conversation. Portions are planning estimates.'));assert(!a.isImportNote('Prepare three sauce portions.'));
});
