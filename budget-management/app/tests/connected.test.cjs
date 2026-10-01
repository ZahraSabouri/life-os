const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({React:{createElement:()=>null}});for(const f of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),ctx);
const api=vm.runInContext('({migrateV4,defaultState,validateV4,normalizeConnected,ensureShop,findShop,shopName,saveShop,removeShop,shopStats,checkout,editReceipt,addPrice,editPrice,removePrice,priceHistory,productLine,typeNode,typeLabel,typePath,typeChildren,typeDescendants,itemsInType,classifyTypeId,ensureTypePath,saveType,removeType,typeSummary,typeSearch,entryTypeId,seedProductTypes,entryHaystack,itemHaystack,matchesWords,shopStats,upsertItem,planMeal,stockRows,makeLot,removeStockRow,retireStock,keepStock,retiredInfo,keptAge,keptRows,weeklyUsage,stockAction,usageLog,setPurchaseDetails,stockPurchase,catalogueEntries,ownLabelGuess,ownLabelFor,whereToBuy,sellerGroups,soldAnywhere,ownShopOf,setReceiptSpread,receiptShareIn,budgetFigures,spreadNote,nextCalendarMonth})',ctx);
const plain=x=>JSON.parse(JSON.stringify(x));
const fresh=()=>api.migrateV4(api.defaultState());
const cat=s=>s.categories.find(c=>c.pool==='grocery').id;
function buy(s,{id='r1',date='2026-09-10',merchant='Lidl',shopId,lines,photo}){
 const paid=lines.reduce((n,l)=>n+l.grossPence,0);
 return api.checkout(s,{id,date,merchant,shopId,photo,paidPence:paid,discountPence:0,feePence:0,lines:lines.map(l=>({quantity:1,unit:'item',categoryId:cat(s),tracking:'count',...l}))});
}

test('first load builds the product-type tree and files every product in it',()=>{
 let s=fresh();delete s.shops;delete s.productTypes;
 s={...s,items:[...s.items,{id:'p1',name:'Morrisons mini pizza',categoryId:cat(s),tracking:'count',unit:'item',observations:[]},{id:'p2',name:'Nutmeg food storage boxes',categoryId:'kitchen-equipment',tracking:'durable',unit:'set',observations:[]}]};
 const n=api.normalizeConnected(s);
 assert.ok(n.productTypes.length>50);
 assert.deepEqual(plain(api.typePath(n,n.items.find(i=>i.id==='p1').typeId).map(x=>x.name)),['Pizza','Mini pizza']);
 assert.deepEqual(plain(api.typePath(n,n.items.find(i=>i.id==='p2').typeId).map(x=>x.name)),['Kitchen & home','Storage boxes']);
 api.validateV4(n);
});

test('first load creates shop records from names already used, and links them',()=>{
 let s=fresh();delete s.shops;delete s.productTypes;
 s={...s,items:[...s.items,{id:'it1',name:'Salted Caramel Bar',categoryId:cat(s),tracking:'count',unit:'item',observations:[{receiptId:'lidl-2026-08-26-1',date:'2026-08-26',quantity:1,linePence:69}]}],
  receipts:[{id:'rx',date:'2026-09-20',merchant:'Franco Manca',channel:'in-store',paidPence:0,discountPence:0,feePence:0,lines:[]}]};
 const n=api.normalizeConnected(s);
 assert.deepEqual(plain(n.shops.map(x=>x.name)),['Franco Manca','Lidl']);
 assert.equal(n.shops.find(x=>x.name==='Franco Manca').kind,'cafe');
 assert.equal(n.receipts[0].shopId,'shop-franco-manca');
 const o=n.items.find(i=>i.id==='it1').observations[0];assert.equal(o.shopId,'shop-lidl');assert.equal(o.merchant,'Lidl');assert.ok(o.id);
 assert.equal(api.normalizeConnected(n),n,'runs once');
 api.validateV4(n);
});

test('shops are found by name in any case, created when new, and blank means none',()=>{
 let s=fresh();const a=api.ensureShop(s,'Morrisons');s=a.state;assert.equal(a.shopId,'shop-morrisons');
 assert.equal(api.ensureShop(s,' morrisons ').shopId,'shop-morrisons');assert.equal(api.ensureShop(s,'').shopId,'');
 assert.equal(s.shops.find(x=>x.id==='shop-morrisons').kind,'supermarket');
});

test('a receipt links its shop, keeps its photo and records offers on each price',()=>{
 let s=fresh();
 s=buy(s,{merchant:'Tesco Express',photo:'photos/receipt-1.jpg',lines:[{name:'Dairy Milk bar',grossPence:85,offer:true,regularPence:125,priceNote:'Clubcard'}]});
 const shop=api.findShop(s,'Tesco Express');assert.ok(shop);
 assert.equal(s.receipts[0].shopId,shop.id);assert.equal(s.receipts[0].photo,'photos/receipt-1.jpg');
 const item=s.items.find(i=>i.name==='Dairy Milk bar'),o=item.observations[0];
 assert.equal(o.shopId,shop.id);assert.equal(o.offer,true);assert.equal(o.regularPence,125);assert.equal(o.note,'Clubcard');
 api.validateV4(s);
});

test('renaming a shop updates its receipts, prices and purchase notes; removing it keeps the names',()=>{
 let s=buy(fresh(),{merchant:'Lidl',lines:[{name:'Eggs',grossPence:150}]});const shop=api.findShop(s,'Lidl');
 s=api.saveShop(s,{...shop,name:'Lidl Splott'});
 assert.equal(s.receipts[0].merchant,'Lidl Splott');assert.equal(s.items.find(i=>i.name==='Eggs').observations[0].merchant,'Lidl Splott');
 assert.ok(s.expenses.some(x=>x.note==='Lidl Splott · Eggs'));
 assert.throws(()=>api.saveShop(api.ensureShop(s,'Aldi').state,{name:'lidl splott'}),/already have/);
 const r=api.removeShop(s,shop.id);assert.equal(r.shops.length,0);assert.equal(r.receipts[0].merchant,'Lidl Splott');assert.equal(r.receipts[0].shopId,undefined);
 api.validateV4(r);
});

test('prices: add by hand, edit, remove; receipt prices stay tied to the receipt',()=>{
 let s=buy(fresh(),{merchant:'Morrisons',date:'2026-09-01',lines:[{name:'Chocolate bar',grossPence:100}]});
 const id=s.items.find(i=>i.name==='Chocolate bar').id;
 s=api.addPrice(s,id,{date:'2026-09-08',shop:'Morrisons',linePence:120});
 s=api.addPrice(s,id,{date:'2026-09-15',shop:'Tesco',linePence:180,quantity:2,offer:true,regularPence:110,note:'2 for £1.80'});
 let item=s.items.find(i=>i.id===id);assert.equal(item.observations.length,3);assert.equal(item.lastPricePence,90);
 const h=api.priceHistory(s,item);
 assert.equal(h.points.length,3);assert.equal(h.shops.length,2);assert.equal(h.lowest.unitPence,90);assert.equal(h.highest.unitPence,120);assert.equal(h.offers,1);
 assert.equal(h.latest.shop,'Tesco');assert.equal(h.previous,null,'first Tesco price has nothing to compare with');
 const morrisons=h.shops.find(x=>x.shop==='Morrisons');assert.equal(morrisons.points.length,2);
 const manual=item.observations.find(o=>o.source==='manual'&&o.shop!=='x'&&o.linePence===120);
 s=api.editPrice(s,id,manual.id,{date:'2026-09-08',shop:'Morrisons',linePence:95});
 item=s.items.find(i=>i.id===id);const h2=api.priceHistory(s,item);assert.equal(h2.shops.find(x=>x.shop==='Morrisons').latest.unitPence,95);
 const fromReceipt=item.observations.find(o=>o.receiptId);
 s=api.editPrice(s,id,fromReceipt.id,{offer:true,note:'yellow sticker',linePence:1});
 const again=s.items.find(i=>i.id===id).observations.find(o=>o.id===fromReceipt.id);assert.equal(again.linePence,100);assert.equal(again.offer,true);assert.equal(again.note,'yellow sticker');
 assert.throws(()=>api.removePrice(s,id,fromReceipt.id),/receipt/);
 s=api.removePrice(s,id,manual.id);assert.equal(s.items.find(i=>i.id===id).observations.length,2);
 assert.throws(()=>api.addPrice(s,id,{date:'2026-02-30',linePence:5}));
 api.validateV4(s);
});

test('price change is measured against the last price at the same shop',()=>{
 let s=buy(fresh(),{merchant:'Lidl',date:'2026-09-01',lines:[{name:'Butter',grossPence:200}]});const id=s.items.find(i=>i.name==='Butter').id;
 s=api.addPrice(s,id,{date:'2026-09-20',shop:'Lidl',linePence:230});
 const h=api.priceHistory(s,s.items.find(i=>i.id===id));assert.equal(Math.round(h.change*100),15);
});

test('products are filed under a type, with an optional brand and own-brand shop',()=>{
 let s=api.ensureShop(fresh(),'Morrisons').state;
 const pizza=api.typeList?null:null;
 const mini=s.productTypes.find(x=>x.name==='Mini pizza');assert.ok(mini,'the seeded tree has Pizza > Mini pizza');
 assert.deepEqual(plain(api.typePath(s,mini.id).map(x=>x.name)),['Pizza','Mini pizza']);
 s=api.upsertItem(s,{name:'Morrisons mini pizza',typeId:mini.id,shopId:'shop-morrisons',categoryId:cat(s)});
 s=api.upsertItem(s,{name:'Lidl mini pizza',typeId:mini.id,brand:'Trattoria',categoryId:cat(s)});
 const mine=api.itemsInType(s,mini.id).filter(i=>/mini pizza$/i.test(i.name));assert.equal(mine.length,2);
 assert.ok(api.itemsInType(s,api.typePath(s,mini.id)[0].id).length>=2,'the family holds everything inside it');
 assert.equal(api.productLine(s,s.items.find(i=>i.name==='Morrisons mini pizza')),'Mini pizza · Morrisons');
 assert.equal(api.productLine(s,s.items.find(i=>i.name==='Lidl mini pizza')),'Mini pizza · Trattoria');
 assert.equal(api.classifyTypeId(s,'Nutmeg food storage boxes'),s.productTypes.find(x=>x.name==='Storage boxes').id);
});

test('a recipe ingredient can ask for any product of a type, at any level of the tree',()=>{
 let s=fresh();const penneType=s.productTypes.find(x=>x.name==='Penne'),family=s.productTypes.find(x=>x.name==='Pasta & noodles');
 s=api.upsertItem(s,{name:'Tesco Penne',typeId:penneType.id,categoryId:cat(s),tracking:'measured',unit:'g'});
 const item=s.items.find(i=>i.name==='Tesco Penne');
 s={...s,lots:[...s.lots,api.makeLot({name:'Tesco Penne',itemId:item.id,quantity:500,unit:'g',tracking:'measured',categoryId:cat(s)})],
   recipes:[{id:'rc',name:'Pasta bake',servings:2,ingredients:[{name:'Pasta',typeId:family.id,quantity:200,unit:'g'}]}]};
 s=api.planMeal(s,{name:'Pasta bake',date:'2026-09-24',recipeId:'rc',servings:2});
 const meal=s.mealEntries.at(-1);assert.equal(meal.missing.length,0);
 assert.equal(meal.reservations.reduce((n,r)=>n+r.amount,0),200);
 const wanted=api.typeDescendants(s,family.id);
 for(const r of meal.reservations){const row=api.stockRows(s).find(x=>x.id===r.sourceId),it=s.items.find(i=>i.id===row.itemId);
  assert.ok(wanted.has(it?.typeId||api.classifyTypeId(s,row.name,row.categoryId)),'only pasta was reserved');}
 assert.ok(api.typeSummary(s,penneType.id).items.some(i=>i.name==='Tesco Penne'));
});

test('the type tree can be added to, renamed and pruned without losing products',()=>{
 let s=fresh();
 const r=api.ensureTypePath(s,['Pizza','Mini pizza','Morrisons mini pizza']);s=r.state;
 assert.deepEqual(plain(api.typePath(s,r.id).map(x=>x.name)),['Pizza','Mini pizza','Morrisons mini pizza']);
 s=api.upsertItem(s,{name:'Morrisons mini pizza 4 pack',typeId:r.id,categoryId:cat(s)});
 const mini=api.typePath(s,r.id)[1];
 s=api.removeType(s,r.id);
 assert.equal(s.items.find(i=>i.name==='Morrisons mini pizza 4 pack').typeId,mini.id,'products move up, never disappear');
 s=api.saveType(s,{...mini,name:'Small pizza'});
 assert.equal(api.typeNode(s,mini.id).name,'Small pizza');
 assert.throws(()=>api.saveType(s,{name:'Small pizza',parentId:mini.parentId}),/already/);
 assert.throws(()=>api.saveType(s,{...mini,parentId:mini.id}),/inside itself/);
 assert.ok(api.typeSearch(s,'pizza').length>=1);
 api.validateV4(s);
});

test('removing stock drops the record but keeps past use in history',()=>{
 let s=fresh();const lot=api.makeLot({name:'Rice',quantity:1000,unit:'g',tracking:'measured',categoryId:'uncategorised'});s={...s,lots:[...s.lots,lot]};
 s=api.stockAction(s,lot.id,'use',100,'2026-09-20');
 s=api.removeStockRow(s,lot.id);
 assert.ok(!s.lots.some(l=>l.id===lot.id));assert.ok(api.usageLog(s).some(x=>x.name==='Rice'&&x.amount===100));
 const share=s.resources.find(r=>!r.used&&!r.scheduledDate);s=api.removeStockRow(s,share.id);assert.ok(!s.resources.some(r=>r.id===share.id));
 api.validateV4(s);
});

test('recording a shop for stock links the shop record',()=>{
 let s=fresh();const share=s.resources.find(r=>!r.used);
 s=api.setPurchaseDetails(s,[share.id],{shop:'morrisons',date:'2026-09-05'});
 assert.equal(s.resources.find(r=>r.id===share.id).shopId,'shop-morrisons');
 s=api.saveShop(s,{...api.findShop(s,'morrisons'),name:'Morrisons Cardiff'});
 assert.equal(api.stockPurchase(s,api.stockRows(s).find(r=>r.id===share.id)).shop,'Morrisons Cardiff');
});

test('the real saved data upgrades cleanly',()=>{
 const file=path.join(__dirname,'../../data/state.json');if(!fs.existsSync(file))return;
 const s=api.migrateV4(JSON.parse(fs.readFileSync(file,'utf8')).state);
 assert.ok(s.shops.length>=1);assert.ok(s.shops.some(x=>x.name==='Lidl'));
 const withShop=s.items.flatMap(i=>i.observations||[]).filter(o=>o.shopId).length;assert.ok(withShop>0);
});

test('things you keep are never used up, and can be recorded as gone or kept again',()=>{
 let s=fresh();
 const box=api.makeLot({name:'Nutmeg storage boxes',quantity:1,unit:'set',tracking:'durable',categoryId:'kitchen-equipment',purchased:'2026-03-01',keepMonths:12});
 const bank=api.makeLot({name:'Power bank',quantity:1,unit:'item',tracking:'durable',categoryId:'electronics-accessories',purchased:'2026-01-10'});
 s={...s,lots:[...s.lots,box,bank]};
 assert.equal(api.keptRows(s).length,2);
 const age=api.keptAge(s,api.stockRows(s).find(r=>r.id===box.id),'2026-09-22');assert.equal(age.text,'7 months');
 assert.throws(()=>api.retireStock(s,s.resources.find(r=>!r.used).id,{reason:'binned'}),/use up/);
 assert.throws(()=>api.retireStock(s,box.id,{reason:'nonsense'}),/what happened/);
 s=api.retireStock(s,box.id,{reason:'binned',date:'2026-09-20',note:'lid cracked'});
 const row=api.stockRows(s).find(r=>r.id===box.id);
 assert.equal(row.remaining,0);assert.deepEqual({...api.retiredInfo(s,row)},{reason:'binned',date:'2026-09-20'});
 const week=api.weeklyUsage(s,'2026-09-20');
 assert.equal(week.events.filter(x=>x.action==='retire').length,1);
 assert.equal(week.itemCount,0,'a kept thing going is not consumption');
 assert.equal(api.usageLog(s).filter(x=>x.action==='retire'&&x.name==='Nutmeg storage boxes').length,1);
 assert.throws(()=>api.retireStock(s,box.id,{reason:'binned'}),/already/);
 s=api.keepStock(s,box.id);
 assert.equal(api.stockRows(s).find(r=>r.id===box.id).remaining,1);assert.equal(api.retiredInfo(s,api.stockRows(s).find(r=>r.id===box.id)),null);
 assert.equal(api.weeklyUsage(s,'2026-09-20').events.filter(x=>x.action==='retire').length,0);
 api.validateV4(s);
});

test('a receipt files new products and the stock shows up in the cupboard',()=>{
 let s=fresh();const before=api.stockRows(s).length;
 s=api.checkout(s,{id:'r-loop',date:'2026-09-22',merchant:'Morrisons',paidPence:449,discountPence:0,feePence:0,
  lines:[{name:'Morrisons mini pizza',quantity:2,unit:'pack',categoryId:'frozen-food',tracking:'count',grossPence:449,stockQuantity:2,stockUnit:'pizza',location:'Freezer'}]});
 const item=s.items.find(i=>i.name==='Morrisons mini pizza');
 assert.ok(item,'the product is in the catalogue');
 assert.deepEqual(plain(api.typePath(s,item.typeId).map(x=>x.name)),['Pizza','Mini pizza'],'and filed by what it is');
 const rows=api.stockRows(s).filter(r=>r.itemId===item.id);
 assert.equal(rows.length,1);assert.equal(rows[0].remaining,2);assert.equal(api.stockRows(s).length,before+1);
 const entry=api.catalogueEntries(s).find(g=>g.item&&g.item.id===item.id);
 assert.ok(entry,'and it appears as one cupboard entry');
 assert.equal(api.entryTypeId(s,entry),item.typeId);
 // the same shop, product and price all hang together
 assert.equal(api.priceHistory(s,item).latest.shop,'Morrisons');
 assert.equal(api.shopStats(s,api.findShop(s,'Morrisons')).products.length,1);
 api.validateV4(s);
});

test('searching finds things by kind, family or category, not just by name',()=>{
 const s=fresh(),entry=api.catalogueEntries(s).find(g=>g.name==='Mini pizza');
 const hay=api.entryHaystack(s,entry);
 for(const word of ['mini pizza','pizza','frozen'])assert.ok(api.matchesWords(hay,word),'"'+word+'" finds the mini pizza');
 const item=s.items.find(i=>/dry shampoo/i.test(i.name));
 if(item)for(const word of ['shampoo','hair'])assert.ok(api.matchesWords(api.itemHaystack(s,item),word),'"'+word+'" finds the dry shampoo');
});

test('a shop own range is recognised from the name, and other products stay open',()=>{
 assert.deepEqual(plain(api.ownLabelGuess('MORRISONS SAVERS CHEESE SLICES 200G')),{shop:"Morrisons",brand:"Morrisons Savers"});
 assert.deepEqual(plain(api.ownLabelGuess('Morrisons The Fishmonger\u2019s Ready to Eat Seafood Selection 240g')),{shop:'Morrisons',brand:'Morrisons The Fishmonger\u2019s'});
 assert.deepEqual(plain(api.ownLabelGuess('Nutmeg Home Bamboo Chopping Board')),{shop:'Morrisons',brand:'Nutmeg'});
 assert.deepEqual(plain(api.ownLabelGuess('Milbona Greek Style Yogurt')),{shop:'Lidl',brand:'Milbona'});
 assert.equal(api.ownLabelGuess('Philadelphia Original Soft Cheese 280g'),null);
 assert.equal(api.ownLabelGuess('Sharwood\u2019s 4 Plain Mini Naans'),null);
});

test('buying an own-brand product ties it to that shop; a plain one can be bought anywhere',()=>{
 let s=fresh();
 s=buy(s,{id:'r-own',merchant:'Morrisons',lines:[{name:'Morrisons Savers Cheese Slices 200g',grossPence:140},{name:'Philadelphia Original Soft Cheese 280g',grossPence:225}]});
 const own=s.items.find(i=>i.name==='Morrisons Savers Cheese Slices 200g'),any=s.items.find(i=>i.name==='Philadelphia Original Soft Cheese 280g');
 assert.equal(own.shopId,'shop-morrisons');assert.equal(own.brand,'Morrisons Savers');
 assert.equal(api.soldAnywhere(own),false);assert.equal(api.soldAnywhere(any),true);
 assert.equal(api.whereToBuy(s,own).text,'Only at Morrisons');
 s=buy(s,{id:'r-any',merchant:'Lidl',lines:[{name:'Philadelphia Original Soft Cheese 280g',grossPence:210}]});
 const after=s.items.find(i=>i.id===any.id);
 assert.equal(after.shopId,undefined);
 assert.equal(api.whereToBuy(s,after).text,'Sold anywhere \u00b7 you buy it at Morrisons and Lidl');
 assert.equal(api.priceHistory(s,after).shops.length,2,'two shops to compare');
 api.validateV4(s);
});

test('a bought line can say whose own product it is, or leave it open',()=>{
 let s=fresh();
 s=buy(s,{id:'r-say',merchant:'Lidl',lines:[{name:'White hamburger loaf',grossPence:95,ownShop:'Lidl'},{name:'Morrisons Savers Apple Juice Drink 1l',grossPence:110,ownShop:''}]});
 const loaf=s.items.find(i=>i.name==='White hamburger loaf'),juice=s.items.find(i=>i.name.includes('Apple Juice'));
 assert.equal(loaf.shopId,'shop-lidl','named shop wins');
 assert.equal(juice.shopId,undefined,'an empty shop means sold anywhere, whatever the name says');
 api.validateV4(s);
});

test('products of one kind are grouped by who sells them',()=>{
 let s=fresh();
 s=buy(s,{id:'r-g',merchant:'Morrisons',lines:[{name:'Morrisons Savers Pepperoni Mini Pizza 113g',grossPence:79},{name:'Chicago Town Mini Pizza',grossPence:200}]});
 s=buy(s,{id:'r-g2',merchant:'Lidl',lines:[{name:'Deluxe Mini Pizza',grossPence:180}]});
 const kind=s.items.find(i=>i.name==='Morrisons Savers Pepperoni Mini Pizza 113g').typeId;
 const groups=api.sellerGroups(s,api.itemsInType(s,kind));
 assert.deepEqual(plain(groups.map(g=>g.label)),['Sold anywhere','Only at Lidl','Only at Morrisons']);
 assert.deepEqual(plain(groups[0].items.map(i=>i.name)),['Chicago Town Mini Pizza']);
});

test('a stock-up can be counted over the months it feeds, losing not a penny',()=>{
 let s=fresh();
 s={...s,expenses:[],adjustments:[],receipts:[],budgets:{...s.budgets,'2026-09':{total:250,grocery:null},'2026-10':{total:250,grocery:null},'2026-11':{total:250,grocery:null}}};
 s=buy(s,{id:'big',date:'2026-09-08',merchant:'Morrisons',lines:[{name:'Rice 5kg',grossPence:1000},{name:'Washing capsules',grossPence:995}]});
 const whole=api.budgetFigures(s,'2026-09');
 assert.equal(Math.round(whole.totalSpent*100),1995,'all of it lands in September at first');
 s=api.setReceiptSpread(s,'big',3);
 const r=s.receipts.find(x=>x.id==='big');
 const shares=['2026-09','2026-10','2026-11'].map(m=>api.receiptShareIn(s,r,m));
 assert.equal(shares.reduce((a,b)=>a+b,0),1995,'the instalments add back to what was paid');
 for(const [i,m] of ['2026-09','2026-10','2026-11'].entries())
  assert.equal(Math.round(api.budgetFigures(s,m).totalSpent*100),shares[i],'what is shown is what is counted in '+m);
 assert.equal(Math.round(api.budgetFigures(s,'2026-12').totalSpent*100),0,'and it stops after the last month');
 const note=api.spreadNote(s,'2026-10');
 assert.equal(note.length,1);assert.equal(note[0].shop,'Morrisons');
 api.validateV4(s);
});

test('spreading can be turned off again',()=>{
 let s=fresh();
 s={...s,expenses:[],adjustments:[],receipts:[],budgets:{...s.budgets,'2026-09':{total:250,grocery:null}}};
 s=buy(s,{id:'big2',date:'2026-09-08',merchant:'Lidl',lines:[{name:'Rice 5kg',grossPence:1000}]});
 s=api.setReceiptSpread(s,'big2',4);
 assert.equal(s.receipts.find(x=>x.id==='big2').spreadMonths,4);
 s=api.setReceiptSpread(s,'big2',1);
 assert.equal(s.receipts.find(x=>x.id==='big2').spreadMonths,undefined);
 assert.equal(Math.round(api.budgetFigures(s,'2026-09').totalSpent*100),1000);
 assert.throws(()=>api.setReceiptSpread(s,'big2',0));
 assert.throws(()=>api.setReceiptSpread(s,'big2',61));
 api.validateV4(s);
});
