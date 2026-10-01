'use strict';
// Record the Morrisons delivery of 8 September 2026 (ordered through Amazon, order 204-3363747-8200329,
// 65 items, 62 lines, GBP 155.95, no delivery fee) into the budget app: one receipt with every line,
// its price, its picture and where it is filed, then link what was already portioned in the monthly
// plan to its real product, then record what has been eaten since.
const fs=require('fs'),path=require('path'),vm=require('node:vm');
const appDir=process.argv[2],stateIn=process.argv[3],stateOut=process.argv[4],imagesFile=process.argv[5];
const ctx=vm.createContext({React:{createElement:()=>null},console});
for(const f of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(appDir,'src',f+'.js'),'utf8'),ctx);
const api=vm.runInContext('({migrateV4,validateV4,checkout,stockAction,useStock,setPurchaseDetails,findShop,ensureShop,classifyTypeId,typeLabel,typeNode,ensureTypePath,upsertItem,withDeletedExpense,stockRows,catalogueEntries,entryFacts,ownLabelGuess,whereToBuy})',ctx);
const file=JSON.parse(fs.readFileSync(stateIn,'utf8'));
const images=JSON.parse(fs.readFileSync(imagesFile,'utf8'));
let s=api.migrateV4(file.state);
const DATE='2026-09-08',RECEIPT='morrisons-2026-09-08';
if(s.receipts.some(r=>r.id===RECEIPT)){console.log('Already imported.');process.exit(0);}

// --- the order, exactly as the invoice reads ------------------------------------------------
// plan:  this is already portioned in the monthly plan under that name - link it, do not add stock again
// lot:   nothing in the app for it yet - put it in the cupboard
// pool:  take N shares from a shared pool of plan shares (the generic "Instant noodles")
const L=(name,qty,pence,categoryId,extra={})=>({name,quantity:qty,pence,categoryId,...extra});
const ORDER=[
 L('Morrisons Linguine 500g',1,80,'rice-pasta-wrappers',{plan:'Linguine'}),
 L('Morrisons Toilet Tissue Rolls, Pack of 9, White',1,300,'paper-toilet-rolls',{plan:'Toilet paper'}),
 L('Morrisons Pineapple Slices in Juice 425g',1,120,'tins-jars-pulses',{plan:'Pineapple tin'}),
 L('itsu Rice Noodles, Vietnamese Rice Noodles (Pack of 6 x 180g)',1,175,'rice-pasta-wrappers',{lot:{tracking:'count',quantity:6,unit:'portion',location:'Pantry'}}),
 L('Namdong Chicken Jjigae Noodle Pot Korean-style instant noodles with a sachet of chilli mix 84 g',2,250,'rice-pasta-wrappers',{pool:2}),
 L('Mama Mi Goreng Noodles 80g',1,125,'rice-pasta-wrappers',{pool:1}),
 L('Samyang Hot Chicken Cup Ramen 70g',1,150,'rice-pasta-wrappers',{pool:1}),
 L('Del Monte Mango Slices in Light Syrup Tin 425g',1,140,'tins-jars-pulses',{plan:'Mango tin'}),
 L('Morrisons Sunflower Oil 1 Litre',1,160,'cooking-oils-fats',{plan:['Current sunflower oil','Next sunflower oil']}),
 L('Morrisons Savers Family Size Facial Tissues 180pk',1,125,'paper-toilet-rolls',{lot:{tracking:'level',quantity:1,unit:'box',location:'Cupboard'}}),
 L('Morrisons Peach Slices in Juice 411g',1,115,'tins-jars-pulses',{plan:'Peach tin'}),
 L('Del Monte Pear Halves in Juice, 415g',1,135,'tins-jars-pulses',{plan:'Pear tin'}),
 L('Thai Dragon Rice Stick Noodles, 400g',1,155,'rice-pasta-wrappers',{pool:3}),
 L('Morrisons Fusilli 500g',1,80,'rice-pasta-wrappers',{plan:'Fusilli'}),
 L('Morrisons Savers 4 Battered White Fish Fillets 500g (Frozen)',1,275,'frozen-food',{plan:'Battered white fish'}),
 L('Nissin Demae Ramen Tonkotsu Noodles, 100g',1,100,'rice-pasta-wrappers',{pool:1}),
 L('Philadelphia Original Soft Cheese 280g',1,225,'eggs-dairy',{itemName:'Philadelphia Original',lot:{tracking:'measured',quantity:280,unit:'g',location:'Fridge'}}),
 L('Button Mushrooms 250g',1,170,'fruit-vegetables',{plan:'Mushrooms'}),
 L('Fyffes Bananas 5pk',1,95,'fruit-vegetables',{lot:{tracking:'count',quantity:5,unit:'banana',location:'Fruit bowl'}}),
 L('MOMA Raspberry & Blonde Chocolate Oat Drink 1L',1,235,'milk-alternatives',{}),
 L('Actimel Strawberry and Blueberry Yoghurt Drink, 12x100g',1,350,'eggs-dairy',{lot:{tracking:'count',quantity:12,unit:'bottle',location:'Fridge'}}),
 L('Good Earth Hibiscus, Rose & Sweet Berries Fruit Tea, 15 Tea Bags',1,200,'tea-coffee-soft-drinks',{plan:'Fruit tea'}),
 L('Morrisons Savers Orange Marmalade 420g',1,80,'breakfast-spreads',{plan:'Orange marmalade'}),
 L('Nestle Shredded Wheat Bitesize 625g',1,300,'breakfast-spreads',{plan:'Nestlé cereal'}),
 L('Morrisons The Best 52% Cocoa Dark Chocolate with Mint Oil 100g',1,205,'snacks-treats',{plan:'Dark chocolate bar 1'}),
 L('Morrisons Savers Wafer Thin Cooked Ham, 400g',1,215,'meat-fish-plant-proteins',{plan:'Thin ham'}),
 L('Morrisons Savers Assorted Fruit Flavour Lollies, Pack of 8 (Frozen)',1,130,'frozen-food',{lot:{tracking:'count',quantity:8,unit:'lolly',location:'Freezer'}}),
 L('Morrisons Savers Jumbo Kitchen Towel Roll',1,140,'paper-toilet-rolls',{lot:{tracking:'level',quantity:1,unit:'roll',location:'Cupboard'}}),
 L('The Laughing Cow Original Cheese Triangles 120g',1,125,'eggs-dairy',{lot:{tracking:'count',quantity:8,unit:'triangle',location:'Fridge'}}),
 L('Morrisons Apple Slices 385g',1,120,'tins-jars-pulses',{plan:'Apple tin'}),
 L('Morrisons Tuna Chunks In Spring Water, 4 x 145g',1,335,'tins-jars-pulses',{plan:{name:'Tuna',take:4}}),
 L('Morrisons Savers Grated Mixed Cheese 500g',1,300,'eggs-dairy',{plan:'Grated cheese'}),
 L('Morrisons Savers Apple Juice Drink 1L',1,110,'tea-coffee-soft-drinks',{lot:{tracking:'level',quantity:1,unit:'bottle',location:'Cupboard'}}),
 L('Morrisons Savers Cheese Slices 200g',1,140,'eggs-dairy',{plan:'Cheddar slices'}),
 L('Morrisons The Best 72% Cocoa Dominican Republic Dark Chocolate 100g',1,195,'snacks-treats',{plan:'Dark chocolate bar 2'}),
 L('Morrisons British Chicken Breast Fillets, 2kg',1,1275,'meat-fish-plant-proteins',{plan:'Chicken breast'}),
 L('Morrisons The Best Spanish Forest Honey, 340g',1,479,'breakfast-spreads',{plan:'Spanish honey'}),
 L('Pastry',1,100,'bread-bakery',{note:'Sent instead of the air fryer liners'}),
 L('Nutmeg Food Storage',1,100,'kitchen-equipment',{lot:{tracking:'durable',quantity:1,unit:'set',location:'Kitchen'},note:'Sent instead of the 5 x 600ml food storage set'}),
 L('Morrisons The Best Milano Salami 100g',1,350,'meat-fish-plant-proteins',{lot:{tracking:'count',quantity:4,unit:'portion',location:'Fridge'}}),
 L('Frylight Extra Virgin Olive Oil Cooking Spray, 190ml',1,175,'cooking-oils-fats',{plan:'Frylight olive-oil spray'}),
 L('Morrisons All in One Lemon Dishwasher Tablets 40pk',1,350,'dishwashing',{plan:'Dishwasher tablet allowance'}),
 L('Alpen No Added Sugar Muesli 950g',1,425,'breakfast-spreads',{plan:'Alpen muesli'}),
 L('Nissin Cup Noodles Soba Wok Style Classic Flavour, 90g',1,150,'rice-pasta-wrappers',{pool:1}),
 L('Morrisons The Fishmonger’s Ready to Eat Seafood Selection 240g',1,315,'meat-fish-plant-proteins',{lot:{tracking:'measured',quantity:240,unit:'g',location:'Fridge'}}),
 L('Morrisons Savers Pepperoni Mini Pizza 113g',3,237,'frozen-food',{plan:'Mini pizza'}),
 L('Nutmeg Home Bamboo Chopping Board',1,320,'kitchen-equipment',{lot:{tracking:'durable',quantity:1,unit:'board',location:'Kitchen'}}),
 L('Morrisons Savers King Prawns 150g',1,250,'meat-fish-plant-proteins',{plan:'King prawns'}),
 L('Morrisons The Greengrocer’s on Market Street Spinach 450g',1,200,'fruit-vegetables',{plan:'Spinach'}),
 L('MOMA Pistachio Oat Drink 1L',1,235,'milk-alternatives',{}),
 L('Morrisons British Steak Mince 5% Fat 500g',1,550,'meat-fish-plant-proteins',{plan:'5% steak mince'}),
 L('Surf 3 in 1 Tropical Lily Laundry Washing Detergent Capsules, 51 washes',1,1000,'laundry',{plan:'Laundry capsule allowance'}),
 L('Morrisons Savers Sponge Scourers, Pack of 10',1,60,'dishwashing',{plan:'Scourer allowance'}),
 L('Morrisons Diced Beef 430g',1,550,'meat-fish-plant-proteins',{plan:'Diced beef'}),
 L('Morrisons LED GLS A60 40W 470LM 4.2W ES 2pk',1,425,'home-furnishings',{lot:{tracking:'durable',quantity:2,unit:'bulb',location:'Home'}}),
 L('Morrisons Market St 4 Salmon Fillets 440g',1,860,'meat-fish-plant-proteins',{plan:'Salmon fillet'}),
 L('Morrisons Fad Free Tuna Chunks In Sunflower Oil 4 x 145g',1,335,'tins-jars-pulses',{plan:{name:'Tuna',take:4}}),
 L('Nissin Beef Noodles, 100g',1,69,'rice-pasta-wrappers',{pool:1}),
 L('Nissin Soba Wok Style Yakitori Chicken Instant Noodles, 89g',1,150,'rice-pasta-wrappers',{pool:1}),
 L('Morrisons Savers Unsmoked Back Bacon 300g',1,150,'meat-fish-plant-proteins',{plan:'Unsmoked back bacon'}),
 L('Yutaka Silken Tofu 308g',1,165,'meat-fish-plant-proteins',{plan:'Tofu'}),
 L('Sharwood’s 4 Plain Mini Naans, 235g',1,165,'bread-bakery',{lot:{tracking:'count',quantity:4,unit:'naan',location:'Bread bin'}}),
];
const TOTAL=15595;
const sum=ORDER.reduce((n,l)=>n+l.pence,0);
if(sum!==TOTAL)throw new Error('Lines add up to '+sum+', the invoice says '+TOTAL);

// Pictures: the photos Xar approved for this delivery, matched to their line by name.
const IMG_FIX={
 'Morrisons Peach Slices in Juice 411g':'Morrisons Peach Slices in Juice 411G.png',
 'Morrisons Savers 4 Battered White Fish Fillets 500g (Frozen)':'MORRISONS Savers 4 Battered White Fish Fillets 500g (Frozen).png',
 'Morrisons Savers Grated Mixed Cheese 500g':'MORRISONS SAVERS GRATED MIXED CHEESE 500G.png',
 'Morrisons Savers Cheese Slices 200g':'MORRISONS SAVERS CHEESE SLICES 200G.png',
 'Morrisons Savers Apple Juice Drink 1L':'Morrisons Savers Apple Juice Drink 1l.png',
 'Morrisons Savers King Prawns 150g':'MORRISONS Savers King Prawns 150g.png',
 'Morrisons Diced Beef 430g':'MORRISONS DICED BEEF 430G.png',
 'MOMA Raspberry & Blonde Chocolate Oat Drink 1L':'MOMA Raspberry & Blonde Chocolate Oat Drink • 1L • Vegan & Gluten Free.png',
 'MOMA Pistachio Oat Drink 1L':'MOMA Pistachio Oat Drink • 1L • No Added Sugar • Vegan, Nut Free & GF.png',
 'Good Earth Hibiscus, Rose & Sweet Berries Fruit Tea, 15 Tea Bags':null,
 'Nestle Shredded Wheat Bitesize 625g':'Nestlé Cereals - Shredded Wheat Breakfast Cereal - Bitesize Crunchy Wholegrain Biscuits, High Fibre, No Added Sugar Or Salt - 625g.png',
 'Morrisons The Best 52% Cocoa Dark Chocolate with Mint Oil 100g':'Morrisons The Best 52Percent Cocoa Dark Chocolate with Mint Oil, 100 g.png',
 'The Laughing Cow Original Cheese Triangles 120g':"'The Laughing Cow Original Cheese Triangles 120g.png",
 'Alpen No Added Sugar Muesli 950g':'Alpen No Added Sugar Muesli, Breakfast, High in Fibre, Vegetarian, Low Sugar, 950g.png',
 'Nissin Cup Noodles Soba Wok Style Classic Flavour, 90g':null,
 'Nissin Soba Wok Style Yakitori Chicken Instant Noodles, 89g':'NISSIN Soba Wok Style Yakitori Chicken Instant Noodles.png',
 'Surf 3 in 1 Tropical Lily Laundry Washing Detergent Capsules, 51 washes':'Surf 3 in 1 Tropical Lily Laundry Washing Detergent Capsules joy-infused fragrance.png',
 'Yutaka Silken Tofu 308g':'Yutaka Silken Tofu 308g Smooth & Creamy Japanese Soybean Curd.png',
 'Namdong Chicken Jjigae Noodle Pot Korean-style instant noodles with a sachet of chilli mix 84 g':'Namdong Chicken Jjigae Noodle Pot Korean-style instant noodles with a sachet of chilli mix 84 g.png',
 'Morrisons The Fishmonger’s Ready to Eat Seafood Selection 240g':"Morrisons The Fishmonger's Ready to Eat Seafood Selection 240g.png",
 'Morrisons The Greengrocer’s on Market Street Spinach 450g':"Morrisons The Greengrocer's on Market Street Spinach 450g.png",
 'Sharwood’s 4 Plain Mini Naans, 235g':"Sharwood's 4 Plain Mini Naans, 235g.png",
 'Morrisons Fad Free Tuna Chunks In Sunflower Oil 4 x 145g':'Morrisons Fad Free Tuna Chunks In Sunflower Oil 4 X 145G.png',
 'Pastry':null,'Nutmeg Food Storage':null,'Morrisons Tuna Chunks In Spring Water, 4 x 145g':null,
 'Morrisons Savers Pepperoni Mini Pizza 113g':null,'Morrisons LED GLS A60 40W 470LM 4.2W ES 2pk':null,
 'Actimel Strawberry and Blueberry Yoghurt Drink, 12x100g':null,'Button Mushrooms 250g':null,
 'Morrisons All in One Lemon Dishwasher Tablets 40pk':'Morrisons All in One Lemon Dishwasher Tablets 40pk.png',
};
function pictureFor(name){
 if(Object.prototype.hasOwnProperty.call(IMG_FIX,name)){const f=IMG_FIX[name];return f?images[f]||'':'';}
 const exact=Object.keys(images).find(k=>k.replace(/\.(png|jpe?g|webp)$/i,'')===name);
 return exact?images[exact]:'';
}
const missing=ORDER.filter(l=>!pictureFor(l.name));
console.log('Lines without a picture:',missing.length,missing.map(l=>l.name).join(' | '));

// --- one receipt ----------------------------------------------------------------------------
const existing=new Map(s.items.map(i=>[i.name.toLowerCase(),i]));
const lines=ORDER.map(l=>{
 const known=l.itemName?s.items.find(i=>i.name===l.itemName):existing.get(l.name.toLowerCase());
 const lot=l.lot||null;
 return {name:l.name,quantity:l.quantity,unit:l.quantity>1?'pack':'item',categoryId:l.categoryId,
  grossPence:l.pence,itemId:known?known.id:undefined,
  tracking:lot?lot.tracking:'none',
  ...(lot?{stockQuantity:lot.quantity,stockUnit:lot.unit,location:lot.location}:{}),
  ...(l.note?{note:l.note}:{})};
});
s=api.checkout(s,{id:RECEIPT,date:DATE,merchant:'Morrisons',channel:'delivery',
 note:'Morrisons groceries delivered through Amazon · order 204-3363747-8200329 · 65 items, no delivery fee.',
 paidPence:TOTAL,discountPence:0,feePence:0,lines});
console.log('receipt saved:',s.receipts[0].merchant,s.receipts[0].paidPence,'lines',s.receipts[0].lines.length);

// --- pictures on the products ---------------------------------------------------------------
let pictured=0;
s={...s,items:s.items.map(i=>{const l=ORDER.find(x=>(x.itemName||x.name)===i.name||x.name===i.name);if(!l)return i;
 const p=pictureFor(l.name);if(!p||i.photo)return i;pictured++;return {...i,photo:p};})};
console.log('pictures set on',pictured,'products');

// --- link what the monthly plan already holds -------------------------------------------------
const itemFor=name=>{const l=ORDER.find(x=>x.name===name);const target=l&&l.itemName?l.itemName:name;
 const it=s.items.find(i=>i.name===target);if(!it)throw new Error('No catalogue product for '+name);return it;};
const taken=new Set();
function claim(spec){
 if(typeof spec==='string')spec={name:spec};
 if(Array.isArray(spec))return spec.flatMap(n=>claim(n));
 const all=s.resources.filter(r=>r.name===spec.name&&!taken.has(r.id));
 const use=spec.take?all.slice(0,spec.take):all;
 for(const r of use)taken.add(r.id);
 return use.map(r=>r.id);
}
const pool=s.resources.filter(r=>r.name==='Instant noodles').map(r=>r.id);let poolAt=0;
const links=[];
for(const l of ORDER){
 let ids=[];
 if(l.plan)ids=claim(l.plan);
 else if(l.pool){ids=pool.slice(poolAt,poolAt+l.pool);poolAt+=l.pool;}
 if(!ids.length)continue;
 const item=itemFor(l.name);
 links.push({name:l.name,itemId:item.id,ids});
 const meta={...s.resourceMeta};
 for(const id of ids)meta[id]={...meta[id],itemId:item.id,categoryId:l.categoryId};
 s={...s,resourceMeta:meta};
}
console.log('plan shares linked:',links.reduce((n,x)=>n+x.ids.length,0),'across',links.length,'products');
const linkedIds=links.flatMap(x=>x.ids);
s=api.setPurchaseDetails(s,linkedIds,{date:DATE,shop:'Morrisons'});
const spare=s.resources.filter(r=>r.name==='Instant noodles'&&!s.resourceMeta[r.id]?.itemId).length;
console.log('generic noodle shares still unlinked:',spare);

// --- the third mini pizza: the plan only held two ---------------------------------------------
const pizza=itemFor('Morrisons Savers Pepperoni Mini Pizza 113g');
const extraPizza='lot-mini-pizza-3-'+RECEIPT;
s={...s,lots:[...s.lots,{id:extraPizza,name:'Mini pizza',itemId:pizza.id,categoryId:'frozen-food',tracking:'count',
 unit:'pizza',quantity:1,remaining:1,location:'Freezer',level:'unopened',notes:'Third pizza of the pack of three',
 expiry:'',expiryType:'best-before',purchased:DATE,merchant:'Morrisons',shopId:'shop-morrisons'}]};

// --- what has been eaten since ----------------------------------------------------------------
const rows=()=>api.stockRows(s);
const lotOf=name=>{const r=rows().filter(x=>x.source==='lot'&&x.name===name&&x.remaining>0);if(!r.length)throw new Error('No lot at home called '+name);return r[0].id;};
const shareOf=(name,n=1)=>{const r=rows().filter(x=>x.source==='resource'&&x.name===name&&x.remaining>0);if(r.length<n)throw new Error('Not enough shares of '+name);return r.slice(0,n).map(x=>x.id);};
const linkedShares=name=>{const item=itemFor(name);return rows().filter(x=>x.source==='resource'&&x.itemId===item.id&&x.remaining>0).map(x=>x.id);};
const use=(id,amount,date,action='use')=>{s=api.stockAction(s,id,action,amount,date);};
const eaten=[];
function note(t){eaten.push(t);}

// Four meals of itsu rice noodles with the ready-to-eat seafood selection, all gone.
const itsu=lotOf('itsu Rice Noodles, Vietnamese Rice Noodles (Pack of 6 x 180g)');
const seafood=lotOf('Morrisons The Fishmonger’s Ready to Eat Seafood Selection 240g');
for(const [i,date] of [['1','2026-09-09'],['2','2026-09-10'],['3','2026-09-12'],['4','2026-09-14']]){
 use(itsu,1,date);use(seafood,60,date);
}
note('4 itsu noodle portions with the whole seafood selection, 9-14 September');
// Three Morrisons Savers mini pizzas as snacks; two were already ticked off in the plan.
use(extraPizza,1,'2026-09-16');note('the third mini pizza, 16 September (the other two were already recorded)');
// Samyang hot chicken noodles, with one of the cheese slices.
use(linkedShares('Samyang Hot Chicken Cup Ramen 70g')[0],1,'2026-09-13');
note('Samyang hot chicken ramen, 13 September');
// One of the two Namdong chicken jjigae pots.
use(linkedShares('Namdong Chicken Jjigae Noodle Pot Korean-style instant noodles with a sachet of chilli mix 84 g')[0],1,'2026-09-17');
note('one of the two Namdong chicken jjigae pots, 17 September');
// The tin of peaches is open in the fridge.
s=api.stockAction(s,linkedShares('Morrisons Peach Slices in Juice 411g')[0],'touch',null,'2026-09-21');
note('the tin of peaches opened and being eaten, 21 September');
// Philadelphia: about 20 g of the 280 g tub left.
use(lotOf('Philadelphia Original Soft Cheese 280g'),260,'2026-09-19');
note('260 g of the 280 g Philadelphia, about 20 g left');
// Three quarters of the litre of MOMA raspberry oat drink.
s=api.useStock(s,shareOf('Oat drink allocation',2),750,'2026-09-18');
note('750 ml of the MOMA raspberry oat drink, 18 September');
// Three bags of the fruit tea.
use(linkedShares('Good Earth Hibiscus, Rose & Sweet Berries Fruit Tea, 15 Tea Bags')[0],3,'2026-09-15');
note('3 fruit tea bags, 15 September');
// One portion of the wafer thin ham and one of the unsmoked back bacon.
use(linkedShares('Morrisons Savers Wafer Thin Cooked Ham, 400g')[0],1,'2026-09-11');
note('one portion of wafer thin ham, 11 September');
use(linkedShares('Morrisons Savers Unsmoked Back Bacon 300g')[0],60,'2026-09-12');
note('60 g of unsmoked back bacon, 12 September');
// One portion of the Milano salami.
use(lotOf('Morrisons The Best Milano Salami 100g'),1,'2026-09-16');
note('one portion of Milano salami, 16 September');
// All eight fruit lollies, the litre of apple juice and all four mini naans are finished.
use(lotOf('Morrisons Savers Assorted Fruit Flavour Lollies, Pack of 8 (Frozen)'),8,'2026-09-20');
note('all 8 fruit lollies, recorded together on 20 September');
s=api.stockAction(s,lotOf('Morrisons Savers Apple Juice Drink 1L'),'finish',null,'2026-09-17');
note('the litre of apple juice drink finished, 17 September');
use(lotOf('Sharwood’s 4 Plain Mini Naans, 235g'),4,'2026-09-19');
note('all 4 mini naans, 19 September');
// A second sponge scourer (one was already ticked off).
use(shareOf('Scourer allowance')[0],1,'2026-09-14');
note('a second sponge scourer, 14 September');

// --- the assumed lump sum this receipt replaces --------------------------------------------
const assumed=s.expenses.find(x=>/assumed/i.test(x.note||'')&&x.date==='2026-09-09');
if(assumed){s=api.withDeletedExpense(s,assumed.id);
 s={...s,budgets:{...s.budgets,'2026-09':{...s.budgets['2026-09'],note:'£225 total monthly allowance. The £125 assumed for early September was replaced by the real Morrisons receipt of 8 September (£155.95).'}}};
 console.log('removed the assumed early-September lump of £'+assumed.amount);}

api.validateV4(s);
fs.writeFileSync(stateOut,JSON.stringify({revision:file.revision+1,savedAt:new Date().toISOString(),state:s},null,2));
console.log('\nRecorded:');for(const t of eaten)console.log(' · '+t);
console.log('\nwritten to',stateOut);
