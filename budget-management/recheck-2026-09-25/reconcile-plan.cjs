const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({React:{createElement:()=>null}});
for(const f of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(root,'app/src',f+'.js'),'utf8'),ctx);
const api=vm.runInContext('({validateV4,stockRows,reservedAmount})',ctx);
const planRows=[
 ['Tofu',300,'g','3 × 100 g','100 g in October, December and February.'],
 ['Mushrooms',240,'g','4 × 60 g bags','September, November, December and February; September was already eaten.'],
 ['Cheddar slices',10,'slices','5 × 2 slices','2 slices each month, October–February.'],
 ['Grated cheese',500,'g','5 × 100 g','100 g each month, October–February.'],
 ['Spinach',450,'g','5 × 90 g','90 g each month, October–February.'],
 ['Thin ham',8,'portion (10–12 slices)','8 portions of 10–12 slices','2 in September; 1 each month October–February; 1 unassigned.'],
 ['5% steak mince',500,'g','5 × 100 g','100 g each month, October–February.'],
 ['Diced beef',4,'portion (110–115 g)','4 portions of 110–115 g','1 each in October, December, January and February.','Your prepared portion labels are retained; the receipt describes a 430 g pack.'],
 ['Salmon fillet',4,'fillet','4 fillets','1 each in October, December, January and February.'],
 ['King prawns',150,'g','2 × 75 g','75 g in December and February.'],
 ['Chicken breast',13,'half-breast portion','13 half-breast portions','October 1; November 1; December 2; January 1; February 1. Seven were not assigned by the original plan.'],
 ['Mini pizza',2,'pizza','2 frozen mini pizzas','October 1; December 1.','These two planned pizzas are separate from the third pizza on the receipt. Finished pizzas stay finished.'],
 ['Battered white fish',4,'fillet','4 fillets','1 each in October, November, January and February.'],
 ['Tuna',8,'tin','8 tins; 2 meals per tin','September 1; October 1; November 1; December 2; January 1; February 2.'],
 ['Linguine',500,'g','4 × 125 g portions','250 g in October and 250 g in December: two portions each.'],
 ['Fusilli',500,'g','4 × 125 g portions','250 g in January and 250 g in February: two portions each.'],
 ['Instant noodles',12,'pack','12 planned noodle units','October 2; November 2; December 3; January 3; February 2.','Product matching needs checking: Thai Dragon is one purchased 400 g pack but three saved units; one other unit has no identified product. No extra stock has been added.'],
 [['Pineapple tin','Mango tin','Peach tin','Pear tin','Apple tin'],5,'tin','5 fruit tins','One each month, October–February.','The opened peach tin has an unmeasured amount left.'],
 ['Fruit tea',16,'tea bags','16 tea bags','October–January 3 per month; February 4.','Your opening stock count is retained. The September receipt itself is one 15-bag box.'],
 ['Alpen muesli',950,'g','5 × 190 g monthly shares','190 g each month, October–February.'],
 ['Nestlé cereal',625,'g','5 × 125 g monthly shares','125 g each month, October–February; 315 g combined with muesli.'],
 [['Oat drink allocation','MOMA Raspberry & Blonde Chocolate Oat Drink 1L','MOMA Pistachio Oat Drink 1L'],2000,'ml','2 litres total; 400 ml combined per month','400 ml each month, October–February.','400 ml is two 200 ml glasses. The monthly amounts are a stock allocation, not an opened-pack storage instruction; follow each carton’s label.'],
 ['Orange marmalade',420,'g','One jar, divided into 2 × 210 g shares','210 g by the end of November; 210 g by the end of February.'],
 [['Dark chocolate bar 1','Dark chocolate bar 2'],200,'g','2 × 100 g bars','First bar already opened; second originally intended for mid-January.','No new opening reminder is created for a bar already marked finished.'],
 ['Spanish honey',340,'g','One jar; flexible use','Prefer later months or sick days; no fixed monthly ration.'],
 [['Current sunflower oil','Next sunflower oil'],2,'bottle','Current bottle plus next bottle','Aim to finish the current bottle by the end of October; let the next last about ten months.','These are soft goals, not automatic consumption. One bottle was on the September receipt.'],
 ['Frylight olive-oil spray',1,'bottle','One cooking spray','Aim to make it last ten months; no fixed monthly ration.'],
 ['Laundry capsule allowance',60,'capsules','30 washes, using 2 capsules per wash','6 capsules / 3 washes per month, September–June.','Your stated opening stock is 60 capsules. The September receipt pack is labelled 51 washes.'],
 ['Scourer allowance',10,'sponge','10 sponges','1 per month, September–June.'],
 ['Dishwasher tablet allowance',39,'tablets','39 remaining at the start of this plan','September 3, then 4 per month October–June.','One tablet had already been used before this 39-tablet plan. Later recorded usage is also deducted.'],
 ['Toilet paper',18,'rolls','18 rolls; no hard limit','Soft target of about 1.5 rolls a month over ten months.','That pace uses 15 rolls, leaving 3 spare. Only one 9-roll pack is on the September receipt.'],
];
function reconcile(input){
 const s=JSON.parse(JSON.stringify(input));if(s.resourcePlanReference?.version===1)return s;
 const before=JSON.stringify([s.expenses,s.receipts,s.adjustments,s.budgets,s.lots,s.stockEvents,s.mealEntries,s.resources.filter(r=>r.used)]);
 // Move only unused chicken shares. Keep each identity and its existing usage history.
 const targets={'2026-10':1,'2026-11':1,'2026-12':2,'2027-01':1,'2027-02':1};
 for(const r of s.resources.filter(r=>r.name==='Chicken breast'&&r.used))if(targets[r.allocatedMonth])targets[r.allocatedMonth]=Math.max(0,targets[r.allocatedMonth]-r.qty);
 const chicken=s.resources.filter(r=>r.name==='Chicken breast'&&!r.used);
 assert.ok(chicken.every(r=>r.unit==='half-breast portion'&&r.qty===1),'Chicken portions changed: review before assigning.');
 for(const r of chicken){assert.equal(api.reservedAmount(s,r.id),0,'A chicken share is reserved for a meal.');assert.ok(!r.scheduledDate,'A chicken share is scheduled.');if(targets[r.allocatedMonth]>0)targets[r.allocatedMonth]--;else r.allocatedMonth='';}
 // The final pasta instruction is four 125 g portions, two in each named month.
 s.resources=s.resources.flatMap(r=>{
  if(r.used||!['Linguine','Fusilli'].includes(r.name)||r.qty<=125)return [r];
  assert.equal(r.unit,'g');assert.equal(api.reservedAmount(s,r.id),0,'Pasta is reserved for a meal.');assert.ok(!r.scheduledDate);
  const out=[];let left=r.qty;while(left>0){const id=out.length?r.id+'-portion-'+(out.length+1):r.id;assert.ok(id===r.id||!s.resources.some(x=>x.id===id));const qty=Math.min(125,left);out.push({...r,id,qty,...(id===r.id?{}:{parentId:r.parentId||r.id})});if(id!==r.id&&s.resourceMeta[r.id])s.resourceMeta[id]={...s.resourceMeta[r.id]};left-=qty;}return out;
 });
 // If some portions were consumed since the snapshot, do not fill their places from spare stock.
 for(const r of s.resources.filter(r=>r.name==='Orange marmalade'&&!r.used)){
  const meta=s.resourceMeta[r.id]||{};
  if(!meta.level&&!meta.opened&&!meta.amountUnmeasured)s.resourceMeta[r.id]={...meta,tracking:'measured'};
 }
 const entries=planRows.map(([names,total,unit,portions,schedule,note],i)=>{names=Array.isArray(names)?names:[names];return {id:'original-plan-'+i,name:names.length===1?names[0]:({'Pineapple tin':'Fruit tins','Oat drink allocation':'Oat drinks','Dark chocolate bar 1':'Chocolate','Current sunflower oil':'Sunflower oil'})[names[0]],total,unit,portions,schedule,note:note||'',sourceIds:s.resources.filter(r=>names.includes(r.name)).map(r=>r.id)};});
 entries.push({id:'original-plan-tissues',name:'Facial tissues',total:2,unit:'box',portions:'One opened box plus one new 180-tissue box',schedule:'Aim to finish the opened box by the end of September; no individual tissue counting.',note:'Only the new box has a saved stock record. The old opened box’s current status is unknown, so it has not been added as available stock.',sourceIds:s.lots.filter(l=>l.itemId==='item_4efns2it').map(l=>l.id)});
 s.resourcePlanReference={version:1,recordedOn:'2026-09-25',source:'Original resource plan supplied by you',entries};
 const noteFor=(id,text)=>{s.resourceMeta[id]={...s.resourceMeta[id],reviewNote:text};};
 for(const r of s.resources.filter(r=>!r.used&&s.resourceMeta[r.id]?.itemId==='item_vjhnbj6w'))noteFor(r.id,'Count needs checking: one 400 g pack purchased; three units saved. Were these portions?');
 noteFor('res_e2ca8vy3','Product not identified. This saved noodle unit is not matched to a receipt.');
 assert.equal(JSON.stringify([s.expenses,s.receipts,s.adjustments,s.budgets,s.lots,s.stockEvents,s.mealEntries,s.resources.filter(r=>r.used)]),before,'Used stock, saved events, lots, receipts and money must stay unchanged.');
 const totals=resources=>resources.reduce((o,r)=>{const key=r.name+'|'+r.unit+'|'+r.used;o[key]=(o[key]||0)+r.qty;return o;},{});
 assert.deepEqual(totals(s.resources),totals(input.resources),'All stock totals must be conserved.');
 api.validateV4(s);return s;
}
module.exports={reconcile};
if(require.main===module)(async()=>{
 const apply=process.argv.includes('--apply'),base='http://127.0.0.1:47841',current=apply?await(await fetch(base+'/api/state')).json():JSON.parse(fs.readFileSync(path.join(__dirname,'before.json')));
 const next=reconcile(current.state);fs.writeFileSync(path.join(__dirname,apply?'before-apply.json':'preview.json'),JSON.stringify(apply?current:{...current,state:next},null,2));
 if(apply){const response=await fetch(base+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json','X-Planner-Action':'save'},body:JSON.stringify({revision:current.revision,state:next})});assert.equal(response.status,200,await response.text());fs.writeFileSync(path.join(__dirname,'after.json'),JSON.stringify(await(await fetch(base+'/api/state')).json(),null,2));}
 console.log(JSON.stringify({applied:apply,fromRevision:current.revision,referenceEntries:next.resourcePlanReference.entries.length,usedResourcesPreserved:next.resources.filter(r=>r.used).length,eventsPreserved:next.stockEvents.length,chickenRemaining:next.resources.filter(r=>r.name==='Chicken breast'&&!r.used).map(r=>r.allocatedMonth||'Any time')}));
})();
