const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/clarity-domain.js'),'utf8'),ctx);
const {transactionRows,transactionDialog,catalogueScope}=vm.runInContext('({transactionRows,transactionDialog,catalogueScope})',ctx);
test('receipts aggregate in pennies, keep separate visits and preserve standalone payments and refunds',()=>{
 const s={receipts:[{id:'a',merchant:'Morrisons',lines:[{},{}]},{id:'b',merchant:'Morrisons',lines:[{}]}]};
 const rows=[{id:'a1',receiptId:'a',amount:100.05},{id:'fee',receiptId:'a',amount:1.9},{id:'a2',receiptId:'a',amount:54},{id:'b1',receiptId:'b',amount:5},{id:'bill',amount:10},{id:'r1',refund:true,groupId:'refund1',amount:-3,forNote:'One'},{id:'r2',refund:true,groupId:'refund1',amount:-5,forNote:'Two'}];
 const before=JSON.stringify(rows),out=transactionRows(s,rows);
 assert.equal(out.length,4);assert.equal(out[0].amount,155.95);assert.equal(out[1].amount,5);assert.equal(out[3].amount,-8);
 assert.equal(out.reduce((n,x)=>n+Math.round(x.amount*100),0),rows.reduce((n,x)=>n+Math.round(x.amount*100),0));
 assert.equal(JSON.stringify(rows),before);assert.equal(transactionDialog(out[0]).id,'a');assert.equal(transactionDialog(out[0]).type,'receipt-detail');assert.equal(transactionDialog(out[3]).type,'refund-detail');
});
test('missing receipt references stay visible as individual payments',()=>{
 const out=transactionRows({receipts:[]},[{id:'orphan',receiptId:'missing',amount:9}]);
 assert.equal(out.length,1);assert.equal(out[0].amount,9);assert.equal(transactionDialog(out[0]).type,'expense-detail');
});
test('old catalogue references are reversible and an item bought again rejoins the current plan',()=>{
 const s={trackingStart:'2026-09-08',items:[{id:'old',observations:[{date:'2026-07-06'}]},{id:'new',observations:[]},{id:'again',observations:[{date:'2026-07-06'}]},{id:'boundary',observations:[{date:'2026-09-08'}]}],lots:[],receipts:[{date:'2026-09-08',lines:[{itemId:'again'}]}]};
 const before=JSON.stringify(s);assert.equal(catalogueScope(s).items.length,3);assert.equal(catalogueScope(s,'history').items[0].id,'old');assert.equal(catalogueScope(s,'all'),s);assert.equal(JSON.stringify(s),before);
});
test('a plan without a tracking cutoff does not inherit another plan\'s history date',()=>{
 const s={items:[{id:'mine',observations:[{date:'2022-03-01'}]}],lots:[],receipts:[]};
 assert.equal(catalogueScope(s).items.length,1);assert.equal(catalogueScope(s,'history').items.length,0);
});
