const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='C:/Users/ctrlz/Documents/BudgetManagement',ctx=vm.createContext({React:{createElement:()=>null}});
for(const f of ['core','seed','domain','types'])vm.runInContext(fs.readFileSync(path.join(__dirname,'app/src',f+'.js'),'utf8'),ctx);
const api=vm.runInContext('({normalizeConnected,upsertItem,validateV4,budgetFigures})',ctx);
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases={
 'Belgian Choc Cookie':'Belgian Chocolate Cookies','Red Gala Apples 0080218':'Red Gala Apples','Tomatoes 0082485':'Tomatoes','Waterbutrons Wholemeal Loaf':'Warburtons Wholemeal Loaf',
 'Alpen No Added Sugar Muesli, Breakfast, High in Fibre, Vegetarian, Low Sugar, 950g':'Alpen No Added Sugar Muesli 950g',
 'MOMA Pistachio Oat Drink • 1L • No Added Sugar • Vegan, Nut Free & GF':'MOMA Pistachio Oat Drink 1L',
 'MOMA Raspberry & Blonde Chocolate Oat Drink • 1L • Vegan & Gluten Free':'MOMA Raspberry & Blonde Chocolate Oat Drink 1L',
 'Morrisons The Best 52Percent Cocoa Dark Chocolate with Mint Oil, 100 g':'Morrisons The Best 52% Cocoa Dark Chocolate with Mint Oil 100g',
 'Nestlé Cereals - Shredded Wheat Breakfast Cereal - Bitesize Crunchy Wholegrain Biscuits, High Fibre, No Added Sugar Or Salt - 625g':'Nestle Shredded Wheat Bitesize 625g',
 'NISSIN Soba Wok Style Yakitori Chicken Instant Noodles':'Nissin Soba Wok Style Yakitori Chicken Instant Noodles, 89g',
 'Philadelphia Original Soft Cheese 280g':'Philadelphia Original',
 'Surf 3 in 1 Tropical Lily Laundry Washing Detergent Capsules joy-infused fragrance':'Surf 3 in 1 Tropical Lily Laundry Washing Detergent Capsules, 51 washes',
 'Yutaka Silken Tofu 308g Smooth & Creamy Japanese Soybean Curd':'Yutaka Silken Tofu 308g'
};
function review(input){
 let s=api.normalizeConnected(JSON.parse(JSON.stringify(input)));const before=JSON.stringify([s.lots,s.stockEvents,s.mealEntries,s.budgets,s.resources.filter(r=>r.used)]),changes=[];
 const dir=path.join(root,'assets/images/approved/Products'),files=fs.readdirSync(dir,{recursive:true}).filter(f=>/\.(png|jpe?g|webp)$/i.test(f));
 for(const file of files){const name=path.basename(file,path.extname(file)),target=aliases[name]||name;
  let item=s.items.find(i=>[i.name,...i.aliases||[]].some(n=>norm(n)===norm(target)));
  if(!item){const line=s.receipts.flatMap(r=>r.lines).find(l=>norm(l.name)===norm(target));if(line)item=s.items.find(i=>i.id===line.itemId);}
  if(!item&&name==='Laila Basmati Rice 10Kg'){s=api.upsertItem(s,{name,categoryId:'rice-pasta-wrappers',tracking:'none',unit:'pack',usual:false});item=s.items.find(i=>i.name===name);changes.push('Laila rice added to catalogue only; no stock or expense.');}
  assert.ok(item,'Unmatched approved picture: '+file);
  const photo='approved/Products/'+file.replaceAll('\\','/');s.items=s.items.map(i=>i.id===item.id?{...i,photo}:i);
 }
 const r=s.receipts.find(r=>r.id==='receipt-lidl-2026-09-21-1301');assert.ok(r);
 if(r.paidPence===2156){assert.equal(r.feePence,0);r.paidPence=2176;r.feePence=20;
  s.expenses.push({id:r.id+'-donation',receiptId:r.id,date:r.date,amount:.2,type:'other',categoryId:'fees-delivery-adjustments',category:'Fees, delivery & adjustments',note:'Lidl · NSPCC charity donation'});changes.push('Lidl 21 September: added missing 20p charity donation. Card total £21.76.');
 }else assert.equal(r.paidPence,2176,'Lidl total changed; review required.');
 r.note=(r.note||'').replace(/\s*Card total includes £0\.20 NSPCC charity donation\./g,'')+' Card total includes £0.20 NSPCC charity donation.';
 r.sourceUrl='https://www.lidl.co.uk/mre/purchase-detail?t=130015637620260921132630';r.verifiedOn='2026-09-23';
 for(const receipt of s.receipts.filter(r=>r.merchant==='Morrisons'||r.date==='2026-09-12'&&r.merchant==='Lidl'))receipt.verifiedOn='2026-09-23';
 changes.push(...require('./correct-known-stock.cjs').correctKnownStock(s));
 api.validateV4(s);assert.equal(JSON.stringify([s.lots,s.stockEvents,s.mealEntries,s.budgets,s.resources.filter(r=>r.used)]),before,'Never alter used portions, lots, settings or consumption history during review');
 return {state:s,summary:{pictures:files.length,changes,remaining:api.budgetFigures(s,'2026-09').totalRemaining}};
}
module.exports={review};
if(require.main===module)(async()=>{
 const live=JSON.parse(fs.readFileSync(path.join(root,'data/state.json'))),result=review(live.state);
 fs.writeFileSync('reviewed-purchases-preview.json',JSON.stringify({...live,state:result.state},null,2));console.log(JSON.stringify(result.summary));
 if(process.argv.includes('--apply')){
  const base='http://127.0.0.1:47841',current=await(await fetch(base+'/api/state')).json();
  const next=review(current.state);fs.writeFileSync('backups/before-stock-review-2026-09-23/before-receipt-photos.json',JSON.stringify(current,null,2));
  const response=await fetch(base+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json','X-Planner-Action':'save'},body:JSON.stringify({revision:current.revision,state:next.state})});assert.equal(response.status,200,await response.text());
  console.log('Applied to latest save. All stock, used portions and meal history preserved.');
 }
})();
