const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const frontend=path.resolve(__dirname,'../../../code/life-os/frontend'),React=require(require.resolve('react',{paths:[frontend]})),{renderToStaticMarkup}=require(require.resolve('react-dom/server',{paths:[frontend]}));
const ctx=vm.createContext({React,console,window:{},location:{hash:''}});
for(const file of ['core','seed','domain','clarity-domain','allocation-domain','types','stock-flex-domain','plan-reference','meal-workflow-domain','food-domain','app','views','dialogs','product','product-dialogs','history','connect','clarity','allocation-ui','stock-flex-ui','approved-art','meal-workflow-ui','food-ui','money-in-ui'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file+'.js'),'utf8'),ctx);
const a=vm.runInContext('({newBudgetState,MoneyV2,ProductDialog,HomeV2})',ctx);
test('the final Money view shows standalone income, correct cash totals and an editable detail',()=>{
 const s={...a.newBudgetState(),budgets:{'2026-10':{total:100,grocery:null}},expenses:[{id:'expense',date:'2026-10-08',amount:20,type:'other',categoryId:'uncategorised',note:'Example payment'}],credits:[{id:'credit',from:'Example residence',date:'2026-10-07',pence:1234,kind:'cashback',includeInBudget:true,note:'Test credit'}]};
 const props={state:s,selectedMonth:'2026-10',route:{view:'overview'},setDialog:()=>{},go:()=>{},act:()=>{}};
 const html=renderToStaticMarkup(React.createElement(a.MoneyV2,props));
 assert.match(html,/Cashback from Example residence/);assert.match(html,/\+£12\.34/);assert.match(html,/Allowance<\/span><b>£112\.34/);assert.match(html,/Net spent<\/span><b>£7\.66/);assert.match(html,/Monthly totals/);assert.doesNotMatch(html,/Receipt cost allocations|Using stock does not|counted this month|unknown costs/);
 const detail=renderToStaticMarkup(React.createElement(a.ProductDialog,{...props,dialog:{type:'credit',id:'credit'},commit:()=>{},onClose:()=>{}}));assert.match(detail,/Example residence/);assert.match(detail,/Add to this month/);assert.match(detail,/12\.34/);
 const allowance=renderToStaticMarkup(React.createElement(a.ProductDialog,{...props,dialog:{type:'budget'},commit:()=>{},onClose:()=>{}}));assert.match(allowance,/value="112\.34"/);assert.doesNotMatch(allowance,/Overspending is deducted/);
 const home=renderToStaticMarkup(React.createElement(a.HomeV2,{...props,setTab:()=>{}}));assert.match(home,/Allowance<\/span><b>£112\.34/);assert.doesNotMatch(home,/Your monthly plan|Using stock does not|After plans|unknown costs|will come out of/);
});
