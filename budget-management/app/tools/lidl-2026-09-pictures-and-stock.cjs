'use strict';
// The two September Lidl receipts (Splott, 12 and 21 September 2026) were already recorded.
// This round: give every product its approved picture, say which ones are Lidl's own, put the
// 12 September shop into the cupboard as bought, and record the things you keep - the Tefal wok
// and the carrier bag - as Owned: paid for once, never used up, kept until you say one went.
const fs=require('fs'),path=require('path'),vm=require('node:vm');
const appDir=process.argv[2],stateIn=process.argv[3],stateOut=process.argv[4];
const ctx=vm.createContext({React:{createElement:()=>null},console});
for(const f of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(appDir,'src',f+'.js'),'utf8'),ctx);
const api=vm.runInContext('({migrateV4,validateV4,makeLot,uid,stockRows})',ctx);
const file=JSON.parse(fs.readFileSync(stateIn,'utf8'));
let s=api.migrateV4(file.state);
const R12='receipt-lidl-2026-09-12-103970',R21='receipt-lidl-2026-09-21-1301',LIDL='shop-lidl';
const r12=s.receipts.find(r=>r.id===R12),r21=s.receipts.find(r=>r.id===R21);
if(!r12||!r21)throw new Error('Both Lidl receipts must already be recorded.');
if(s.lots.some(l=>l.receiptId===R12))throw new Error('The 12 September shop is already in the cupboard.');

// --- products: picture, better name, Lidl's own or sold anywhere ------------------------------
// own: true = Lidl's own product (only at Lidl). Fresh produce and real brands stay sold anywhere.
const P12='products/lidl-2026-09-12/',P21='products/lidl-2026-09-21/';
const PRODUCTS={
 'usual-ea7d6541fa1f':{photo:P12+'antipasti-pepper.webp',own:true},
 'usual-e62dc588b778':{photo:P12+'ancient-grain-roll.webp',own:true},
 'usual-0ced9114877b':{photo:P12+'rice-crackers-sweet-chilli.webp',own:true,brand:'Rivercote'},
 'usual-2370a85730de':{photo:P21+'6-welshlarge-fr-eggs.webp',own:true},
 'usual-7d5d29d5654c':{photo:P21+'dry-shampoo-sweet-pink.webp',own:true,brand:'Cien',name:'Dry Shampoo: Sweet Pink'},
 'usual-e8e85a9c5336':{photo:P12+'rice-snacks-chilli.webp',own:true,brand:'Rivercote'},
 'usual-f6f55b19f3a6':{photo:P12+'tefal-light-cook-wok-0537956.webp',own:false,brand:'Tefal'},
 'usual-8cb384e843cf':{photo:P12+'teriyaki-salmon-rolls.webp',own:true},
 'usual-dd832404e8ee':{photo:P12+'cucumber-0082231.webp',own:false},
 'usual-d73c55d3c7e5':{photo:P12+'large-red-onions-0083347.webp',own:false},
 'usual-c38b9538d3f4':{photo:P12+'dipsauce-squeeze-garlic-mayo.webp',own:true,brand:'Batts'},
 'usual-e6baeb5e2af7':{photo:P12+'aberdeen-angus-beef-burgers.webp',own:true},
 'usual-b8958944639d':{photo:P12+'green-pitted-olives.webp',own:true,brand:'Baresa'},
 'usual-c1ea078f4936':{own:false},
 'usual-41024084d2e2':{photo:P12+'garlic-0082706.webp',own:false},
 'usual-4af88502a0df':{photo:P12+'allpurpose-seasoning.webp',own:true,brand:'Batts',name:'All Purpose Seasoning'},
 'usual-7970aa297ae9':{photo:P12+'italian-herb-season.webp',own:true,brand:'Batts',name:'Italian Herb Seasoning'},
 'usual-50f235043948':{photo:P12+'sweet-crunchy-salad.webp',own:true},
 'usual-b61ec4073472':{photo:P12+'ready-to-eat-avocado-0080620.webp',own:false},
 'usual-aa2eebeab806':{photo:P12+'belgian-choc-cookie.webp',own:true},
 'item_c7hue18a':{photo:P21+'asia-dippers.webp',own:true,brand:'Vitasia'},
 'item_z0k6picc':{photo:P21+'rocket-lollies.webp',own:true,brand:'Gelatelli'},
 'item_9b3czzxw':{photo:P21+'welsh-unsalted-butter.webp',own:true},
 'item_b5hggc04':{photo:P21+'tropical-juice-drink.webp',own:true},
 'item_9eajr65z':{photo:P21+'waterbutrons-wholemeal-loaf.webp',own:false,brand:'Warburtons'},
 'item_xlyg06sj':{photo:P21+'make-up-wipes-cleansing.webp',own:true,brand:'Cien'},
 'item_td0xzdxs':{photo:P21+'red-gala-apples-0080218.webp',own:false},
 'item_lkj9m3f0':{photo:P21+'tomatoes-0082485.webp',own:false},
 'item_7uuec99t':{photo:P21+'chocolate-brownie.webp',own:true},
 'item_02mns2g9':{photo:P21+'roll-white-crusty.webp',own:true},
 'usual-025b2e4715a8':{photo:P21+'toffee-yum-yum.webp',own:true},
 'usual-3ec3253bb8ec':{photo:P21+'cold-brew-tea-mojito.webp',own:true,brand:'Lord Nelson'},
 'usual-cefd7921f990':{photo:P21+'carrier-bag.webp',own:true,tracking:'durable',unit:'bag'},
};
const imgDir=path.join(appDir,'..','assets','images','generated');
const renamed=new Map();
s={...s,items:s.items.map(i=>{const p=PRODUCTS[i.id];if(!p)return i;
 if(p.photo&&!fs.existsSync(path.join(imgDir,p.photo)))throw new Error('Missing picture '+p.photo);
 let n={...i};
 if(p.photo)n.photo=p.photo;
 if(p.name&&p.name!==i.name){n.aliases=[...new Set([...(i.aliases||[]),i.name])];n.name=p.name;renamed.set(i.name,p.name);}
 if(p.own){n.shopId=LIDL;}else delete n.shopId;
 if(p.brand)n.brand=p.brand;
 if(p.tracking)n.tracking=p.tracking;
 if(p.unit)n.unit=p.unit;
 return n;})};
const missingIds=Object.keys(PRODUCTS).filter(id=>!s.items.some(i=>i.id===id));
if(missingIds.length)throw new Error('Unknown products: '+missingIds.join(', '));
// Stock rows carry the product name too.
s={...s,lots:s.lots.map(l=>renamed.has(l.name)?{...l,name:renamed.get(l.name)}:l)};

// --- 12 September: everything goes in as bought ----------------------------------------------
// [line id, tracking, how many, unit, where, lasts months once opened (long-lasting only)]
const STOCK12={
 receiptline_2ju9pxp2:['count',1,'tub','Fridge'],
 receiptline_6pvyafa1:['count',4,'roll','Bread bin'],
 receiptline_7vl44pvv:['count',1,'pack','Cupboard'],
 receiptline_jemnq9pn:['count',6,'egg','Fridge'],
 receiptline_h17gwgcc:['level',2,'can','Bathroom',2],
 receiptline_zqt3z3ha:['count',1,'pack','Cupboard'],
 receiptline_5d521m2q:['durable',1,'wok','Kitchen'],
 receiptline_ni16ki3v:['count',1,'pack','Fridge'],
 receiptline_zljsdhd5:['count',1,'cucumber','Fridge'],
 receiptline_33p3qaxg:['count',1,'pack','Cupboard'],
 receiptline_2fzkergw:['level',1,'bottle','Fridge',2],
 receiptline_fizjrpwc:['count',4,'burger','Fridge'],
 receiptline_2eea6a9l:['count',1,'jar','Cupboard'],
 receiptline_2lixzto1:['count',1,'pack','Fruit bowl'],
 receiptline_czgqs4qn:['count',1,'bulb','Cupboard'],
 receiptline_ytjmvywc:['level',1,'jar','Cupboard',6],
 receiptline_3pw8gh0n:['level',1,'jar','Cupboard',6],
 receiptline_yaja6ghf:['count',1,'bag','Fridge'],
 receiptline_1qgd9rts:['count',2,'avocado','Fruit bowl'],
 receiptline_r20yt97g:['count',2,'cookie','Cupboard'],
};
const newLots=[];
const lines12=r12.lines.map(l=>{const x=STOCK12[l.id];if(!x)throw new Error('No stock plan for '+l.name);
 const [tracking,qty,unit,location,lasts]=x,item=s.items.find(i=>i.id===l.itemId);
 const copies=tracking==='level'?qty:1;
 for(let k=0;k<copies;k++)newLots.push(api.makeLot({id:api.uid('lot'),name:item.name,itemId:item.id,categoryId:l.categoryId,tracking,
  quantity:copies>1?1:qty,unit,location,receiptId:R12,receiptLineId:l.id,purchased:r12.date,...(lasts?{lastsMonths:lasts}:{}),
  ...(tracking==='durable'?{notes:'Owned · kept, not used up'}:{})}));
 return {...l,tracking,stockQuantity:qty,stockUnit:unit,location};
});

// --- 21 September: the carrier bag is something you keep ---------------------------------------
const bagLine=r21.lines.find(l=>l.itemId==='usual-cefd7921f990');
newLots.push(api.makeLot({id:api.uid('lot'),name:'Carrier Bag',itemId:bagLine.itemId,categoryId:bagLine.categoryId,tracking:'durable',
 quantity:1,unit:'bag',location:'Kitchen',receiptId:R21,receiptLineId:bagLine.id,purchased:r21.date,notes:'Owned · kept, not used up'}));
const lines21=r21.lines.map(l=>l.id===bagLine.id?{...l,tracking:'durable',stockQuantity:1,stockUnit:'bag',location:'Kitchen'}:l);

s={...s,lots:[...s.lots,...newLots],receipts:s.receipts.map(r=>r.id===R12?{...r,lines:lines12,
  note:'Verified against Lidl digital receipt on 22 September 2026. Actual wok price £19.99. £0.36 of line discounts are already included. Put in the cupboard as bought on 23 September 2026; the wok is kept as Owned.'}
 :r.id===R21?{...r,lines:lines21}:r)};

api.validateV4(s);
fs.writeFileSync(stateOut,JSON.stringify({revision:file.revision+1,savedAt:new Date().toISOString(),state:s},null,2));
console.log('products updated:',Object.keys(PRODUCTS).length,'renamed:',[...renamed].map(x=>x.join(' -> ')).join('; '));
console.log('lots added:',newLots.length);for(const l of newLots)console.log(' ·',l.name,l.tracking,l.quantity,l.unit,l.location);
console.log('written',stateOut,'revision',file.revision+1);
