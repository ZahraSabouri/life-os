const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({React:{createElement:()=>null}});for(const file of ['core','seed','domain'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file+'.js'),'utf8'),ctx);
const api=vm.runInContext('({migrateV4,defaultState,validateV4,addListLine,tickListLine,shoppingRows,groupShopping,ensureShop,forecast})',ctx);
const plain=x=>JSON.parse(JSON.stringify(x));
// Two lists: a Lidl shop on the 14th and a list with no shop on the 20th. One item has its own shop and day.
function state(){
  let s=api.migrateV4(api.defaultState());const lidl=api.ensureShop(s,'Lidl');s=lidl.state;const boots=api.ensureShop(s,'Boots');s=boots.state;
  const food=s.categories[0].id,other=s.categories.find(c=>c.id!==food&&c.id!=='uncategorised').id;
  s={...s,lists:[{id:'weekly',name:'Weekly shop',date:'2026-10-14',merchant:'Lidl',shopId:lidl.shopId,channel:'in-store',lines:[]},{id:'later',name:'To buy',date:'2026-10-20',merchant:'',channel:'in-store',lines:[]}]};
  s=api.addListLine(s,'weekly',{name:'Milk',quantity:2,categoryId:food,estimatePence:240});
  s=api.addListLine(s,'weekly',{name:'Bin liners',quantity:1,categoryId:other});
  s=api.addListLine(s,'later',{name:'Shampoo',quantity:1,categoryId:other,merchant:'Boots',shopId:boots.shopId,date:'2026-10-16'});
  s=api.addListLine(s,'later',{name:'A bag',quantity:1});
  return {s,food,other};
}
const id=(s,name)=>s.lists.flatMap(l=>l.lines).find(l=>l.name===name).id;

test('an item can be ticked off with no price, and nothing reaches the budget',()=>{
  const {s}=state(),before=plain(api.forecast(s,'2026-10'));
  const ticked=api.tickListLine(s,'weekly',id(s,'Bin liners'),true,'2026-10-12');
  api.validateV4(ticked);
  const line=ticked.lists[0].lines.find(l=>l.name==='Bin liners');
  assert.deepEqual([line.status,line.ticked,line.gotOn,line.estimatePence],['bought',true,'2026-10-12',undefined]);
  // No receipt, no expense, nothing in the cupboard: only a receipt changes those.
  assert.deepEqual([ticked.receipts.length,ticked.expenses.length,ticked.lots.length],[s.receipts.length,s.expenses.length,s.lots.length]);
  // An unpriced item was never in the forecast's money: only the count of unpriced items to buy goes down.
  assert.deepEqual(plain(api.forecast(ticked,'2026-10')),{...before,unknown:before.unknown-1});
  const back=api.tickListLine(ticked,'weekly',line.id,false);
  assert.deepEqual(plain(back),plain(s));
});
test('a line bought on a receipt is not unticked here',()=>{
  let {s}=state();const milk=id(s,'Milk');
  s={...s,lists:s.lists.map(l=>({...l,lines:l.lines.map(x=>x.id===milk?{...x,status:'bought',receiptId:'r1'}:x)}))};
  assert.throws(()=>api.tickListLine(s,'weekly',milk,false),/receipt/);
  assert.throws(()=>api.tickListLine(s,'weekly','gone',true),/no longer on the list/);
});
test('the same items can be arranged by category, by shop, by day, or all together',()=>{
  const {s}=state(),rows=api.shoppingRows(s),names=g=>g.rows.map(r=>r.line.name);
  assert.equal(rows.length,4);
  // An item's own shop and day win over its list's.
  const shampoo=rows.find(r=>r.line.name==='Shampoo');assert.deepEqual([shampoo.shop,shampoo.date],['Boots','2026-10-16']);
  const byShop=api.groupShopping(rows,'shop');
  assert.deepEqual(plain(byShop.map(g=>[g.label,names(g)])),[['Boots',['Shampoo']],['Lidl',['Milk','Bin liners']],['Any shop',['A bag']]]);
  const byDay=api.groupShopping(rows,'date');
  assert.deepEqual(plain(byDay.map(g=>[g.label,names(g)])),[['2026-10-14',['Milk','Bin liners']],['2026-10-16',['Shampoo']],['2026-10-20',['A bag']]]);
  const byCategory=api.groupShopping(rows,'category');
  assert.equal(byCategory.reduce((n,g)=>n+g.rows.length,0),4);
  assert(byCategory.some(g=>names(g).includes('Bin liners')&&names(g).includes('Shampoo')),'two lists, one category');
  assert.deepEqual(plain(api.groupShopping(rows,'all').map(names)),[['A bag','Bin liners','Milk','Shampoo']]);
  assert.deepEqual(plain(api.groupShopping([],'all')),[]);
});
