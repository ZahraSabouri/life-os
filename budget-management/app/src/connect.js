// Shops, products and prices: the screens that tie the catalogue, receipts, lists, recipes and stock together.
ICONS.store='M4 10v10h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-5h4v5';
ICONS.tag='M20 12 12 20 4 12V4h8Zm-12-5h.01';
ICONS.trash='M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3';

const SHOP_ART={supermarket:['Fresh food03.png','Pantry staples02.png','Fresh food02.png','Snacks and drinks01.png'],local:['Fresh food01.png','Pantry staples03.png'],online:['Subscriptions and AI tools.png','Main02.png'],cafe:['Eating out and social.png','Main03.png'],other:['Main04.png','Main05.png']};
// Shops without a photo get a steady picture of their own, so they stay tellable apart.
function shopArt(shop){
 if(shop?.photo||shop?.image)return shop.photo||shop.image;
 const set=SHOP_ART[shop?.kind]||SHOP_ART.other,name=String(shop?.name||'');
 let n=0;for(const ch of name)n=(n*31+ch.charCodeAt(0))%997;
 return set[n%set.length];
}
function kindLabel(k){return (SHOP_KINDS.find(x=>x[0]===k)||SHOP_KINDS.at(-1))[1];}

// Type a shop's name: your shops are suggested, and a new name becomes a new shop when saved.
function ShopInput({state:s,label='Shop',value,onChange,placeholder='Lidl, Tesco, the market…',hint,required=false}){
 const id=React.useId(),name=String(value||'').trim(),known=name&&findShop(s,name);
 return e(React.Fragment,null,e(Input,{label,value:value||'',onChange,list:id,placeholder,autoComplete:'off',required,hint:name&&!known?'New shop · it will be added to your shops.':hint}),
  e('datalist',{id},(s.shops||[]).filter(x=>!x.archived).map(x=>e('option',{key:x.id,value:x.name}))));
}

// ---- Shops ------------------------------------------------------------------------------
function ShopsView({state:s,setDialog}){
 const [query,setQuery]=useState(''),q=query.trim().toLowerCase();
 const shops=(s.shops||[]).filter(x=>!q||[x.name,x.area,...(x.aliases||[])].join(' ').toLowerCase().includes(q)).map(shop=>({shop,st:shopStats(s,shop)}))
  .sort((a,b)=>(b.st.lastVisit||'').localeCompare(a.st.lastVisit||'')||a.shop.name.localeCompare(b.shop.name));
 return e('section',{className:'shops-view'},
  e('div',{className:'shops-head'},e('label',{className:'cupboard-search'},e(Icon,{name:'search',size:18}),e('input',{type:'search',value:query,onChange:ev=>setQuery(ev.target.value),placeholder:'Search your shops','aria-label':'Search your shops'})),e(Btn,{kind:'primary',icon:'plus',onClick:()=>setDialog({type:'shop'})},'Add shop')),
  shops.length?e('div',{className:'shop-grid'},shops.map(({shop,st})=>e('button',{type:'button',className:'shop-card',key:shop.id,onClick:()=>setDialog({type:'shop-page',id:shop.id})},
   e(Art,{file:shopArt(shop),className:'shop-card-art'}),
   e('span',{className:'shop-card-copy'},e('span',{className:'shop-kind'},kindLabel(shop.kind)+(shop.area?' · '+shop.area:'')),e('strong',null,shop.name),
    e('span',{className:'shop-facts'},e('span',null,e('b',null,st.visits),st.visits===1?' visit':' visits'),e('span',null,e('b',null,st.products.length),st.products.length===1?' product':' products'),st.spentPence>0&&e('span',null,e('b',null,pounds(st.spentPence)),' on receipts')),
    e('small',null,st.lastVisit?'Last visit '+prettyDate(st.lastVisit,{day:'numeric',month:'short',year:'numeric'}):'No visits recorded yet'))))):
  e(Empty,{icon:'bag',title:q?'No matching shops':'No shops yet',action:!q&&e(Btn,{kind:'primary',onClick:()=>setDialog({type:'shop'})},'Add your first shop')},q?'Try another name.':'Shops are added automatically when you record a receipt.'));
}
function ShopPage({state:s,dialog:d,setDialog,onClose}){
 const [all,setAll]=useState(false),shop=findShop(s,d.id);if(!shop)return e(Modal,{title:'Shop not found',onClose},e('div',{className:'dialog-body'},e('p',null,'This shop is no longer here.')),e(DialogFooter,{onClose,label:'Done'}));
 const st=shopStats(s,shop),products=all?st.products:st.products.slice(0,12);
 return e(Modal,{title:shop.name,kicker:[kindLabel(shop.kind),shop.area].filter(Boolean).join(' · '),onClose,wide:true},e('div',{className:'dialog-body shop-page'},
  e('div',{className:'shop-hero'},e('button',{type:'button',className:'item-photo-button',onClick:()=>setDialog({type:'shop',id:shop.id,back:shop.id}),'aria-label':'Change the picture'},e(Art,{file:shopArt(shop),className:'item-photo'})),
   e('div',{className:'shop-hero-copy'},
    e('div',{className:'shop-stats'},e(Stat,{label:'Visits',value:st.visits}),e(Stat,{label:'Products',value:st.products.length}),e(Stat,{label:'On receipts',value:pounds(st.spentPence)}),e(Stat,{label:'Last visit',value:st.lastVisit?prettyDate(st.lastVisit):'—'})),
    shop.notes&&e('p',{className:'shop-notes'},shop.notes),shop.website&&e('a',{className:'text-link',href:/^https?:\/\//.test(shop.website)?shop.website:'https://'+shop.website,target:'_blank',rel:'noreferrer'},shop.website.replace(/^https?:\/\//,'')),
    e('div',{className:'inline-actions'},e(Btn,{kind:'primary',icon:'plus',onClick:()=>setDialog({type:'receipt',merchant:shop.name})},'Record a shop here'),e(Btn,{onClick:()=>setDialog({type:'list',merchant:shop.name})},'New list for this shop'),e(Btn,{onClick:()=>setDialog({type:'shop',id:shop.id,back:shop.id})},'Edit shop')))),
  e('h3',{className:'mini-head'},'Products bought here'),
  st.products.length?e(React.Fragment,null,e('div',{className:'shop-products'},products.map(p=>e('button',{type:'button',className:'shop-product',key:p.item.id,onClick:()=>{setDialog(null);setDialog({type:'item-page',key:'item:'+p.item.id});}},
    e(Art,{file:p.item.photo||p.item.image||artFor(s,p.item.categoryId,p.item.name),className:'shop-product-art'}),
    e('span',null,e('strong',null,p.item.name),e('small',null,[productLine(s,p.item),p.count+(p.count===1?' purchase':' purchases')].filter(Boolean).join(' · '))),
    e('span',{className:'shop-product-price'},e('b',null,pounds(p.unitPence)),e('small',null,prettyDate(p.last.date)),p.last.offer&&e(Badge,{tone:'green'},'Offer'))))),
   st.products.length>12&&e(Btn,{small:true,onClick:()=>setAll(!all)},all?'Show fewer':'Show all '+st.products.length)):e('p',{className:'muted'},'Nothing recorded here yet.'),
  st.ownProducts.length>0&&e(React.Fragment,null,e('h3',{className:'mini-head'},shop.name+'’s own products'),e('div',{className:'chip-list'},st.ownProducts.map(i=>e('button',{type:'button',className:'chip',key:i.id,onClick:()=>{setDialog(null);setDialog({type:'item-page',key:'item:'+i.id});}},i.name)))),
  e('h3',{className:'mini-head'},'Receipts'),
  st.receipts.length?st.receipts.map(r=>e('button',{className:'plain-row',key:r.id,onClick:()=>setDialog({type:'receipt-detail',id:r.id})},e(Icon,{name:'bag'}),e('div',null,e('strong',null,prettyDate(r.date,{weekday:'short',day:'numeric',month:'short',year:'numeric'})),e('small',null,r.lines.length+(r.lines.length===1?' item':' items')+(r.photo?' · photo':''))),e('b',null,pounds(r.paidPence)))):e('p',{className:'muted'},'No receipts recorded here yet.')),
 e(DialogFooter,{onClose,label:'Done'}));
}
function ShopEditor({state:s,dialog:d,commit,setDialog,onClose}){
 const old=(s.shops||[]).find(x=>x.id===d.id);
 const [form,set]=useDraft(()=>old?{...old,aliases:(old.aliases||[]).join(', ')}:{name:d.name||'',kind:guessShopKind(d.name||''),area:'',website:'',notes:'',photo:'',image:'',aliases:''});
 const [busy,setBusy]=useState(false),[err,setErr]=useState('');
 async function choose(ev){const file=ev.target.files?.[0];ev.target.value='';if(!file)return;setBusy(true);setErr('');try{set('photo',await uploadPhoto(file,'shop-'+(form.name||'shop')));}catch(x){setErr(x.message);}finally{setBusy(false);}}
 const back=()=>d.back?setDialog({type:'shop-page',id:d.back}):onClose();
 return e(FormModal,{title:old?'Edit shop':'Add a shop',onClose:back,onSubmit:()=>commit(st=>saveShop(st,{...form,id:old?.id,aliases:String(form.aliases||'').split(',')}),'Shop saved').then(()=>{if(d.back)setDialog({type:'shop-page',id:d.back});})},
  e('div',{className:'photo-field'},e(Art,{file:shopArt(form),className:'photo-preview'}),e('div',{className:'photo-actions'},e('label',{className:'button'+(busy?' busy':'')},busy?'Saving the picture…':form.photo?'Change photo':'Upload a photo',e('input',{type:'file',accept:'image/*',className:'sr-only',disabled:busy,onChange:choose})),form.photo&&e(Btn,{small:true,onClick:()=>set('photo','')},'Remove photo'),err&&e('p',{className:'error-box'},err))),
  e(Input,{label:'Name',value:form.name,onChange:v=>set('name',v),required:true,placeholder:'Lidl, Morrisons, Riverside Market…'}),
  e('div',{className:'form-grid'},e(Select,{label:'Kind of shop',value:form.kind||'other',onChange:v=>set('kind',v),options:SHOP_KINDS}),e(Input,{label:'Area (optional)',value:form.area||'',onChange:v=>set('area',v),placeholder:'Splott, city centre…'})),
  e(Input,{label:'Website (optional)',value:form.website||'',onChange:v=>set('website',v),placeholder:'lidl.co.uk'}),
  e(Input,{label:'Other names on receipts (optional)',value:form.aliases||'',onChange:v=>set('aliases',v),placeholder:'Lidl Splott, LIDL GB',hint:'Separate with commas. Receipts under these names count for this shop.'}),
  e(Textarea,{label:'Notes (optional)',value:form.notes||'',onChange:v=>set('notes',v),rows:3}),
  e('details',null,e('summary',null,'Choose one of your pictures instead'),e(ArtPicker,{value:form.image||'',onChange:v=>set('image',v)})),
  old&&e('details',null,e('summary',null,'Remove this shop'),e('p',{className:'muted'},'Receipts and prices keep the shop’s name; only the shop record is removed.'),e(Btn,{kind:'danger',onClick:()=>{if(confirm('Remove '+old.name+' from your shops?'))commit(st=>removeShop(st,old.id),'Shop removed').then(onClose).catch(x=>setErr(x.message));}},'Remove shop')));
}

// ---- Prices ------------------------------------------------------------------------------
const PRICE_SERIES=['#2a78d6','#eb6834','#1baf7a'];
function useWidth(){const ref=React.useRef(null),[w,setW]=useState(0);useEffect(()=>{const el=ref.current;if(!el)return;const set=()=>setW(el.clientWidth);set();if(typeof ResizeObserver==='undefined')return;const ro=new ResizeObserver(set);ro.observe(el);return ()=>ro.disconnect();},[]);return [ref,w];}
function PriceChart({history,unit}){
 const [ref,width]=useWidth(),[hover,setHover]=useState(null);
 const series=history.shops.slice(0,3),points=series.flatMap(x=>x.points);
 if(points.length<2)return e('div',{ref});
 const H=190,pad={l:46,r:16,t:14,b:28},W=Math.max(260,width||600),iw=W-pad.l-pad.r,ih=H-pad.t-pad.b;
 const t=d=>new Date(d+'T12:00:00').getTime(),t0=Math.min(...points.map(p=>t(p.date))),t1=Math.max(...points.map(p=>t(p.date))),span=Math.max(1,t1-t0);
 const max=Math.max(...points.map(p=>Math.max(p.unitPence,p.regularPence||0))),min=Math.min(...points.map(p=>p.unitPence));
 const step=[1,2,5,10,20,25,50,100,200,500,1000,2000,5000].find(s=>(max-Math.max(0,min*0.8))/s<=4)||10000,lo=Math.max(0,Math.floor(min*0.8/step)*step),hi=Math.ceil(max/step)*step+(max%step===0?step:0);
 const x=p=>pad.l+(points.length>1&&t1>t0?(t(p.date)-t0)/span*iw:iw/2),y=v=>pad.t+ih-(v-lo)/Math.max(1,hi-lo)*ih;
 const ticks=[];for(let v=lo;v<=hi+0.1;v+=step)ticks.push(v);
 const dates=[...new Set(points.map(p=>p.date))].sort(),nearest=px=>dates.reduce((a,b)=>Math.abs(x({date:b})-px)<Math.abs(x({date:a})-px)?b:a);
 const move=ev=>{const box=ev.currentTarget.getBoundingClientRect();setHover(nearest((ev.clientX-box.left)*(W/box.width)));};
 const at=hover?series.map((sr,i)=>({sr,i,p:sr.points.filter(p=>p.date===hover).at(-1)})).filter(x=>x.p):[];
 return e('div',{className:'price-chart',ref},
  series.length>1&&e('div',{className:'price-legend'},series.map((sr,i)=>e('span',{key:sr.key},e('i',{style:{background:PRICE_SERIES[i]}}),sr.shop)),history.shops.length>3&&e('span',{className:'muted'},'+'+(history.shops.length-3)+' more in the list'),e('span',null,e('i',{className:'offer-key'}),'On offer')),
  series.length===1&&history.points.some(p=>p.offer)&&e('div',{className:'price-legend'},e('span',null,e('i',{className:'offer-key'}),'On offer')),
  e('svg',{width:W,height:H,viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':'Price per '+unit+' over time',onPointerMove:move,onPointerLeave:()=>setHover(null)},
   ticks.map(v=>e('g',{key:v},e('line',{x1:pad.l,x2:W-pad.r,y1:y(v),y2:y(v),className:'price-grid'}),e('text',{x:pad.l-8,y:y(v)+4,textAnchor:'end',className:'price-tick'},v>=100?'£'+(v/100).toFixed(v%100?2:0):v+'p'))),
   e('text',{x:pad.l,y:H-8,className:'price-tick'},prettyDate(dates[0],{day:'numeric',month:'short'})),dates.length>1&&e('text',{x:W-pad.r,y:H-8,textAnchor:'end',className:'price-tick'},prettyDate(dates.at(-1),{day:'numeric',month:'short'})),
   hover&&e('line',{x1:x({date:hover}),x2:x({date:hover}),y1:pad.t,y2:pad.t+ih,className:'price-cross'}),
   series.map((sr,i)=>e('g',{key:sr.key},sr.points.length>1&&e('polyline',{points:sr.points.map(p=>x(p)+','+y(p.unitPence)).join(' '),fill:'none',stroke:PRICE_SERIES[i],strokeWidth:2,strokeLinejoin:'round',strokeLinecap:'round'}),
    sr.points.map(p=>p.offer||p.regularPence>p.unitPence?e('rect',{key:p.id,x:x(p)-5,y:y(p.unitPence)-5,width:10,height:10,transform:`rotate(45 ${x(p)} ${y(p.unitPence)})`,fill:PRICE_SERIES[i],stroke:'#fffdf7',strokeWidth:2}):e('circle',{key:p.id,cx:x(p),cy:y(p.unitPence),r:4.5,fill:PRICE_SERIES[i],stroke:'#fffdf7',strokeWidth:2}))))),
  hover&&at.length>0&&e('div',{className:'price-tip',style:{left:Math.min(Math.max(x({date:hover})/W*100,12),88)+'%'}},e('small',null,prettyDate(hover,{weekday:'short',day:'numeric',month:'short',year:'numeric'})),at.map(({sr,i,p})=>e('div',{key:sr.key},e('i',{style:{background:PRICE_SERIES[i]}}),e('b',null,pounds(p.unitPence)),e('span',null,sr.shop+(p.offer?' · offer':''))))));
}
function PricesPanel({state:s,item,setDialog}){
 const h=priceHistory(s,item),unit=item.stockUnit&&item.stockPerUnit?'pack':(item.unit||'item');
 const add=e(Btn,{small:true,icon:'plus',onClick:()=>setDialog({type:'price',itemId:item.id})},'Add a price');
 if(!h.points.length)return e('section',{className:'prices-panel'},e('div',{className:'prices-head'},e('h3',{className:'mini-head'},'Prices'),add),e('p',{className:'muted'},'No prices yet. They are added when you record a receipt, or add one yourself.'));
 const pct=h.change==null?null:Math.round(h.change*100);
 return e('section',{className:'prices-panel'},e('div',{className:'prices-head'},e('h3',{className:'mini-head'},'Prices'),add),
  e('div',{className:'price-stats'},
   e('div',{className:'price-stat'},e('span',null,'Latest'),e('strong',null,pounds(h.latest.unitPence)),e('small',null,h.latest.shop+' · '+prettyDate(h.latest.date)),pct!=null&&pct!==0&&e('em',{className:pct>0?'up':'down'},(pct>0?'▲ ':'▼ ')+Math.abs(pct)+'% since last time')),
   e('div',{className:'price-stat'},e('span',null,'Lowest'),e('strong',null,pounds(h.lowest.unitPence)),e('small',null,h.lowest.shop+' · '+prettyDate(h.lowest.date))),
   e('div',{className:'price-stat'},e('span',null,'Highest'),e('strong',null,pounds(h.highest.unitPence)),e('small',null,h.highest.shop+' · '+prettyDate(h.highest.date))),
   e('div',{className:'price-stat'},e('span',null,'Bought'),e('strong',null,h.points.length+'×'),e('small',null,h.offers?h.offers+' on offer':h.shops.length+(h.shops.length===1?' shop':' shops')))),
  e(PriceChart,{history:h,unit}),
  e('div',{className:'price-list'},[...h.points].reverse().map(p=>e('div',{className:'price-row',key:p.id},
   e('span',{className:'price-date'},prettyDate(p.date,{day:'numeric',month:'short',year:'2-digit'})),
   e('span',{className:'price-where'},e('strong',null,p.shop),e('small',null,[p.quantity!==1?p.quantity+' × '+pounds(p.unitPence)+' = '+pounds(p.linePence):'',p.receiptId?(s.receipts.some(r=>r.id===p.receiptId)?'receipt':'historical reference'):'added by you',p.note].filter(Boolean).join(' · '))),
   e('span',{className:'price-amount'},e('b',null,pounds(p.unitPence)),(p.offer||p.regularPence>p.unitPence)&&e(Badge,{tone:'green'},p.regularPence>p.unitPence?'Offer · was '+pounds(p.regularPence):'Offer')),
   e('button',{type:'button',className:'text-link',onClick:()=>setDialog({type:'price',itemId:item.id,id:p.id})},'Edit')))));
}
function PriceEditor({state:s,dialog:d,commit,setDialog,onClose}){
 const item=s.items.find(i=>i.id===d.itemId),old=item&&(item.observations||[]).find(o=>o.id===d.id),fromReceipt=!!old?.receiptId;
 const [form,set]=useDraft(()=>old?{date:old.date,shop:shopName(s,old),price:(old.linePence/100).toFixed(2),quantity:String(old.quantity||1),offer:!!old.offer,regular:old.regularPence==null?'':(old.regularPence/100).toFixed(2),note:old.note||''}:{date:isoDate(new Date()),shop:item?.usualShopId?findShop(s,item.usualShopId)?.name||'':item?.shop||'',price:'',quantity:'1',offer:false,regular:'',note:''});
 const [err,setErr]=useState('');if(!item)return null;
 const back=onClose,data=()=>({date:form.date,shop:form.shop,linePence:pennies(form.price),quantity:form.quantity,offer:form.offer,regularPence:form.regular===''?undefined:pennies(form.regular),note:form.note});
 return e(FormModal,{title:old?'Price details':'Add a price',kicker:item.name.toUpperCase(),onClose:back,onSubmit:()=>commit(st=>old?editPrice(st,item.id,old.id,data()):addPrice(st,item.id,data()),'Price saved')},
  fromReceipt?e('p',{className:'muted'},pounds(old.linePence)+' at '+shopName(s,old)+' on '+prettyDate(old.date,{day:'numeric',month:'long',year:'numeric'})+' · from a receipt. Change the amount or date on the receipt itself.'):
  e(React.Fragment,null,e('div',{className:'form-grid'},e(Input,{label:'Date',type:'date',value:form.date,onChange:v=>set('date',v),required:true,max:isoDate(new Date())}),e(ShopInput,{state:s,label:'Shop (optional)',value:form.shop,onChange:v=>set('shop',v)})),
   e('div',{className:'form-grid'},e(Input,{label:'Price paid (£)',type:'number',min:0,step:'.01',value:form.price,onChange:v=>set('price',v),required:true}),e(Input,{label:'For how many',type:'number',min:'.000001',step:'any',value:form.quantity,onChange:v=>set('quantity',v),hint:'1 unless the price covered several.'}))),
  e('label',{className:'checkbox-label'},e('input',{type:'checkbox',checked:form.offer,onChange:ev=>set('offer',ev.target.checked)}),'It was on offer'),
  e('div',{className:'form-grid'},e(Input,{label:'Normal price each (£, optional)',type:'number',min:0,step:'.01',value:form.regular,onChange:v=>set('regular',v)}),e(Input,{label:'Note (optional)',value:form.note,onChange:v=>set('note',v),placeholder:'Clubcard, yellow sticker, 2 for £3…'})),
  old&&!fromReceipt&&e(Btn,{kind:'danger',onClick:()=>{if(confirm('Remove this price?'))commit(st=>removePrice(st,item.id,old.id),'Price removed').catch(x=>setErr(x.message));}},'Remove this price'),
  old?.receiptId&&s.receipts.some(r=>r.id===old.receiptId)&&e(Btn,{small:true,onClick:()=>setDialog({type:'receipt-detail',id:old.receiptId})},'Open the receipt'),
  e(ErrorMessage,{error:err}));
}

// ---- Picking products: shopping lists and recipes -----------------------------------------
// Suggestions while typing: your products (with photo, brand, shop and last price) and general types.
function productSuggestions(s,query,limit=6){
 const q=String(query||'').trim().toLowerCase();if(!q)return {items:[],types:[]};
 const score=i=>{const hay=[i.name,i.type,i.brand,...(i.aliases||[])].filter(Boolean).join(' ').toLowerCase();if(!hay.includes(q)&&!q.split(/\s+/).every(w=>hay.includes(w)))return -1;return (i.name.toLowerCase().startsWith(q)?3:0)+(i.usual?1:0)+Math.min(2,(i.observations||[]).length/3);};
 const items=s.items.filter(i=>!i.archived).map(i=>({i,sc:score(i)})).filter(x=>x.sc>=0).sort((a,b)=>b.sc-a.sc||a.i.name.localeCompare(b.i.name)).slice(0,limit).map(x=>x.i);
 const types=typeSearch(s,q,3).map(x=>({id:x.node.id,name:x.node.name,count:x.count,path:typeLabel(s,x.node.id)}));
 return {items,types};
}
function ProductSuggestions({state:s,query,onPick,onPickType,selectedId}){
 const {items,types}=productSuggestions(s,query);if(!items.length&&!types.length)return null;
 return e('div',{className:'product-suggest',role:'listbox','aria-label':'From your catalogue'},
  types.map(t=>e('button',{type:'button',key:t.id,className:'product-option type',onClick:()=>onPickType(t)},e('span',{className:'product-option-icon'},e(Icon,{name:'tag',size:16})),e('span',null,e('strong',null,'Any '+t.name.toLowerCase()),e('small',null,[t.path,t.count+(t.count===1?' product':' products')].join(' · '))))),
  items.map(i=>{const h=priceHistory(s,i),home=entryFor(s,'item:'+i.id),left=home?entryFacts(home):null;return e('button',{type:'button',key:i.id,className:'product-option'+(selectedId===i.id?' selected':''),'aria-selected':selectedId===i.id,onClick:()=>onPick(i)},
   e(Art,{file:i.photo||i.image||artFor(s,i.categoryId,i.name),className:'product-option-art'}),
   e('span',null,e('strong',null,i.name),e('small',null,[productLine(s,i),left&&left.left>0?'at home: '+displayQty(left.left,left.unit):''].filter(Boolean).join(' · ')||category(s,i.categoryId).name)),
   h.latest&&e('span',{className:'product-option-price'},e('b',null,pounds(h.latest.unitPence)),e('small',null,h.latest.shop)));}));
}
// Recipe ingredients as rows: pick a product or a general type, then the amount. Shows what is at home.
function IngredientRows({state:s,rows,setRows}){
 const patch=(k,v)=>setRows(rs=>rs.map(r=>r.key===k?{...r,...v}:r));
 const blank=()=>({key:uid('ing'),name:'',quantity:'',unit:'g'});
 return e('div',{className:'ingredient-rows'},rows.map(r=>{
  const fits=r.name.trim()?ingredientMatcher(s,r):null,have=fits?stockRows(s).filter(x=>x.remaining>0&&fits(x)):[],level=have.some(x=>x.tracking==='level'),total=have.filter(x=>x.tracking!=='level').reduce((n,x)=>n+x.remaining,0);
  return e('div',{className:'ingredient-row',key:r.key},
   e('div',{className:'ingredient-main'},e(Input,{label:'Ingredient',value:r.name,onChange:v=>patch(r.key,{name:v,itemId:undefined,typeId:undefined,sourceIds:undefined}),placeholder:'Pasta, chicken breast…',autoComplete:'off'}),
    r.focus!==false&&!r.itemId&&!r.typeId&&!r.sourceIds?.length&&e(ProductSuggestions,{state:s,query:r.name,onPick:i=>patch(r.key,{name:i.name,itemId:i.id,typeId:undefined,unit:r.unit||i.stockUnit||i.unit}),onPickType:t=>patch(r.key,{name:t.name,typeId:t.id,itemId:undefined})})),
   e(Input,{label:'Amount',type:'number',min:'.000001',step:'any',value:r.quantity,onChange:v=>patch(r.key,{quantity:v})}),
   e(Input,{label:'Unit',value:r.unit,onChange:v=>patch(r.key,{unit:v}),placeholder:'g, ml, piece'}),
   e('button',{type:'button',className:'icon-button','aria-label':'Remove '+(r.name||'ingredient'),onClick:()=>setRows(rs=>rs.filter(x=>x.key!==r.key))},'×'),
   e('div',{className:'ingredient-link'},e(Select,{label:'Link to cupboard stock',value:r.sourceIds?.length?r.sourceIds.join('|'):'',onChange:v=>{const ids=v.split('|').filter(Boolean),row=stockRows(s).find(x=>ids.includes(x.id));patch(r.key,{sourceIds:ids.length?ids:undefined,...(row&&row.tracking!=='level'?{unit:row.unit}:{})});},options:[['','Match by product or type'],...workflowStockGroups(s).map(g=>[g.ids.join('|'),g.name+' · '+displayQty(g.free,g.unit)])]}),e('label',{className:'checkbox-label'},e('input',{type:'checkbox',checked:!!r.optional,onChange:ev=>patch(r.key,{optional:ev.target.checked})}),'Optional')),
   r.name.trim()&&e('small',{className:'ingredient-status'+(have.length?' ok':'')},(r.itemId?'Your product · ':r.typeId?'Any '+String(typeNode(s,r.typeId)?.name||'').toLowerCase()+' · ':'')+(level?'long-lasting, at home':have.length?'at home: '+displayQty(+total.toFixed(2),have[0].unit):'not at home now')));
 }),e(Btn,{small:true,icon:'plus',onClick:()=>setRows(rs=>[...rs,blank()])},'Add ingredient'));
}

// ---- What things are: browsing and filing the type tree -----------------------------------
// One line of where a product is filed, e.g. "Pizza › Mini pizza".
function TypeTrail({state:s,id,onPick,root='All products'}){
 const path=typePath(s,id);
 return e('nav',{className:'type-trail','aria-label':'Where you are'},
  e('button',{type:'button',className:'crumb'+(path.length?'':' here'),onClick:()=>onPick('')},root),
  path.map((n,i)=>e(React.Fragment,{key:n.id},e('span',{className:'crumb-sep','aria-hidden':true},'›'),
   e('button',{type:'button',className:'crumb'+(i===path.length-1?' here':''),onClick:()=>onPick(n.id)},n.name))));
}
// Choose where a product belongs: search, or walk the tree; a new name can be added anywhere.
function TypePicker({state:s,value,onChange,label='What is it?'}){
 const [open,setOpen]=useState(false),[where,setWhere]=useState(()=>typeNode(s,value)?.parentId||''),[query,setQuery]=useState('');
 const node=typeNode(s,value),results=query.trim()?typeSearch(s,query,10):[];
 const pick=id=>{onChange(id);setOpen(false);setQuery('');setWhere(typeNode(s,id)?.parentId||'');};
 return e('div',{className:'type-picker'},
  e('div',{className:'field type-picker-value'},e('label',null,label),
   e('div',{className:'type-picker-current'},node?e('span',{className:'type-chip'},typeLabel(s,value,' › ')):e('span',{className:'muted'},'Not filed yet'),
    e(Btn,{small:true,onClick:()=>setOpen(!open)},open?'Close':node?'Change':'Choose'),node&&e(Btn,{small:true,onClick:()=>onChange('')},'Clear')),
   e('small',{className:'muted'},'Family and type, e.g. Pizza › Mini pizza. Lists and recipes can ask for any of them.')),
  open&&e('div',{className:'type-browser'},
   e(Input,{label:'Search',type:'search',value:query,onChange:setQuery,placeholder:'pizza, shampoo, pasta…'}),
   query.trim()?e('div',{className:'type-results'},results.length?results.map(({node:n,count})=>e('button',{type:'button',key:n.id,className:'type-result',onClick:()=>pick(n.id)},e('strong',null,n.name),e('small',null,typeLabel(s,n.parentId)||'Family'),e('span',null,count))):e('p',{className:'muted'},'Nothing with that name yet. Add it below.')):
   e(React.Fragment,null,e(TypeTrail,{state:s,id:where,onPick:setWhere,root:'All'}),
    e('div',{className:'type-options'},typeChildren(s,where).map(n=>{const kids=typeChildren(s,n.id).length;return e('div',{className:'type-option',key:n.id},
     e('button',{type:'button',className:'type-option-main',onClick:()=>pick(n.id)},e('strong',null,n.name),e('small',null,itemsInType(s,n.id).length+' products')),
     kids>0&&e('button',{type:'button',className:'type-option-in','aria-label':'Open '+n.name,onClick:()=>setWhere(n.id)},kids+' inside ',e(Icon,{name:'chevron',size:14})));}))),
   e(TypeAdder,{state:s,parentId:where,onAdd:pick})));
}
function TypeAdder({state:s,parentId,onAdd}){
 const [name,setName]=useState('');const here=typeNode(s,parentId);
 return e('div',{className:'type-add'},e(Input,{label:here?'New type inside '+here.name:'New family',value:name,onChange:setName,placeholder:here?'Mini pizza':'Pizza'}),
  e(Btn,{small:true,kind:'primary',disabled:!name.trim(),onClick:()=>{const r=ensureTypePath(s,[...typePath(s,parentId).map(x=>x.name),name.trim()]);const id=r.id;onAdd(id,r.state);setName('');}},'Add it'));
}
function TypeEditor({state:s,dialog:d,commit,setDialog,onClose}){
 const old=typeNode(s,d.id);
 const [form,set]=useDraft(()=>old?{...old,aliases:(old.aliases||[]).join(', ')}:{name:d.name||'',parentId:d.parentId||'',categoryId:typeNode(s,d.parentId)?.categoryId||'uncategorised',image:'',notes:'',aliases:''});
 const [err,setErr]=useState('');
 const parents=[['','A family of its own'],...typeList(s).filter(x=>x.id!==old?.id&&!typeDescendants(s,old?.id||'zzz').has(x.id)).sort((a,b)=>typeLabel(s,a.id).localeCompare(typeLabel(s,b.id))).map(x=>[x.id,typeLabel(s,x.id,' › ')])];
 return e(FormModal,{title:old?'Edit '+old.name:'New type',onClose,onSubmit:()=>commit(st=>saveType(st,{...form,id:old?.id,aliases:String(form.aliases||'').split(',')}),'Saved')},
  e(Input,{label:'Name',value:form.name,onChange:v=>set('name',v),required:true,placeholder:'Mini pizza'}),
  e(Select,{label:'Belongs to',value:form.parentId||'',onChange:v=>set('parentId',v),options:parents}),
  e(CategorySelect,{state:s,value:form.categoryId,onChange:v=>set('categoryId',v)}),
  e('small',{className:'muted'},'New products filed here start in this spending category.'),
  e(Input,{label:'Other names (optional)',value:form.aliases,onChange:v=>set('aliases',v),placeholder:'pizzette, small pizza',hint:'Separate with commas. Used when filing new products automatically.'}),
  e('details',null,e('summary',null,'Picture'),e(ArtPicker,{value:form.image||'',onChange:v=>set('image',v)})),
  old&&e('details',null,e('summary',null,'Remove this type'),e('p',{className:'muted'},'Anything inside it moves up one level. No product is deleted.'),
   e(Btn,{kind:'danger',onClick:()=>{if(confirm('Remove '+old.name+'?'))commit(st=>removeType(st,old.id),'Type removed').catch(x=>setErr(x.message));}},'Remove it')),
  e(ErrorMessage,{error:err}));
}
function typeArt(s,node){
 if(node?.image)return node.image;
 const first=itemsInType(s,node?.id).find(i=>i.photo||i.image);
 return first?(first.photo||first.image):artFor(s,node?.categoryId||'uncategorised',node?.name||'');
}
// The catalogue: browse what you buy, family by family, down to each brand or shop's version.
function CatalogueBrowser({state:original,setDialog,act,chosen}){
 const [source,setSource]=useState('current'),s=catalogueScope(original,source);

 const [where,setWhere]=useState(''),[query,setQuery]=useState(''),[showEmpty,setShowEmpty]=useState(true),[layout,setLayout]=useLocalPref('everyday_catalogue_layout','cards');
 const q=query.trim().toLowerCase(),node=typeNode(s,where);
 const all=s.items.filter(i=>!i.archived);
 const inHere=where?itemsInType(s,where,{deep:false}):all.filter(i=>!i.typeId);
 const found=q?all.filter(i=>matchesWords(itemHaystack(s,i),q)):null;
 const foundTypes=q?typeSearch(s,q,6):[];
 const shown=found||inHere;
 const sellers=sellerGroups(s,shown);
 const withCount=typeChildren(s,where).map(n=>({n,count:itemsInType(s,n.id).length}));
 const filled=withCount.filter(x=>x.count>0),empty=withCount.filter(x=>!x.count);
 const families=showEmpty?[...filled,...empty]:filled;
 const counted=q?found.length:where?itemsInType(s,where).length:all.length;
 const summary=where?typeSummary(s,where):null;
 const card=i=>{const h=priceHistory(s,i),home=entryFor(s,'item:'+i.id),left=home?entryFacts(home):null;
  return e('article',{className:'catalogue-card',key:i.id},
   e('button',{type:'button',className:'card-art-button',onClick:()=>setDialog({type:'item-page',key:'item:'+i.id}),'aria-label':'Open '+i.name},e(Art,{file:i.photo||i.image||artFor(s,i.categoryId,i.name)})),
   e('div',{className:'catalogue-copy'},historicalItem(original,i)&&e('span',{className:'history-badge'},'Earlier reference · not a current purchase'),
    e('div',{className:'card-title'},e('h3',null,i.name),e('button',{className:'star','aria-label':(i.usual?'Unfavourite ':'Favourite ')+i.name,'aria-pressed':!!i.usual,onClick:()=>act(st=>({...st,items:st.items.map(x=>x.id===i.id?{...x,usual:!x.usual}:x)}),'Collection updated')},i.usual?'★':'☆')),
    e('p',{className:'muted'},productLine(s,i)||category(s,i.categoryId).name),
    h.latest?e('p',{className:'catalogue-price'},e('b',null,pounds(h.latest.unitPence)),e('span',null,h.latest.shop+' · '+prettyDate(h.latest.date)),h.points.length>1&&h.lowest.unitPence<h.latest.unitPence&&e('small',null,'lowest '+pounds(h.lowest.unitPence))):e('p',{className:'catalogue-price muted'},'No price yet'),
    left&&left.left>0&&e('p',{className:'catalogue-home'},'At home: '+(left.mixed?amountLine(left):displayQty(left.left,left.unit))),
    e('div',{className:'inline-actions'},e(Btn,{small:true,onClick:()=>setDialog({type:'item-page',key:'item:'+i.id})},'Details'),e(Btn,{small:true,kind:'primary',onClick:()=>setDialog({type:'line',listId:chosen?.id,itemId:i.id})},'Add to list'))));};
 const row=i=>{const h=priceHistory(s,i);return e('div',{className:'stock-row',key:i.id},
   e('button',{type:'button',className:'stock-row-main',onClick:()=>setDialog({type:'item-page',key:'item:'+i.id})},e(Art,{file:i.photo||i.image||artFor(s,i.categoryId,i.name),className:'stock-row-art'}),
    e('span',{className:'stock-row-copy'},e('strong',null,i.name),e('small',null,[productLine(s,i)||category(s,i.categoryId).name,h.latest?pounds(h.latest.unitPence)+' at '+h.latest.shop:''].filter(Boolean).join(' · ')))),
   e(Btn,{small:true,kind:'primary',onClick:()=>setDialog({type:'line',listId:chosen?.id,itemId:i.id})},'Add to list'));};
 return e(React.Fragment,null,
  e('div',{className:'catalogue-scope'},e(Segment,{label:'Catalogue source',value:source,onChange:v=>{setSource(v);setWhere('');setQuery('');},options:[['current','Current plan'],['history','Earlier references'],['all','Everything']]}),e('p',null,source==='history'?'Before 8 September 2026 · saved price references, not current receipts or stock.':'Current plan starts 8 September 2026. Products and prices live here; quantities live in Food & supplies.')),
  e('div',{className:'cupboard-tools'},
   e('div',{className:'cupboard-search-row'},
    e('label',{className:'cupboard-search'},e(Icon,{name:'search',size:18}),e('input',{type:'search',value:query,onChange:ev=>setQuery(ev.target.value),placeholder:'Search products and types','aria-label':'Search the catalogue'})),
    e('div',{className:'cupboard-count'},e('span',{role:'status'},counted+(counted===1?' product':' products'))),
    e(Segment,{label:'Layout',value:layout,onChange:setLayout,options:[['cards','Cards'],['list','List']]})),
   !q&&e('div',{className:'catalogue-bar'},e(TypeTrail,{state:s,id:where,onPick:setWhere}),
    e('div',{className:'inline-actions'},
     where&&e(Btn,{small:true,onClick:()=>setDialog({type:'product-type',id:where})},'Edit this type'),
     e(Btn,{small:true,onClick:()=>setDialog({type:'product-type',parentId:where})},where?'Add a type here':'Add a family'),
     e(Btn,{small:true,kind:'primary',icon:'plus',onClick:()=>setDialog({type:'item',prefill:{typeId:where,categoryId:node?.categoryId}})},'Add product')))),
  q&&foundTypes.length>0&&e('div',{className:'type-grid'},foundTypes.map(({node,count})=>e('button',{type:'button',className:'type-card',key:node.id,onClick:()=>{setQuery('');setWhere(node.id);}},
   e(Art,{file:typeArt(s,node),className:'type-card-art'}),
   e('span',null,e('strong',null,node.name),e('small',null,[typeLabel(s,node.parentId)||'Family',count+(count===1?' product':' products')].filter(Boolean).join(' · ')))))),
  q?null:summary&&e('div',{className:'type-summary'},
   e(Stat,{label:'Products',value:itemsInType(s,where).length}),
   e(Stat,{label:'At home',value:summary.mixed?summary.products+(summary.products===1?' product':' products'):summary.atHome?(+summary.atHome.toFixed(2))+' '+(summary.unit||''):'None',detail:summary.mixed?'different units':''}),
   e(Stat,{label:'Cheapest seen',value:summary.cheapest?pounds(summary.cheapest.unitPence):'—',detail:summary.cheapest?summary.cheapest.shop:''}),
   e(Stat,{label:'Last bought',value:summary.latest?prettyDate(summary.latest.date):'—',detail:summary.latest?summary.latest.shop:''})),
  !q&&families.length>0&&e('div',{className:'type-grid'},families.map(({n,count})=>e('button',{type:'button',className:'type-card',key:n.id,onClick:()=>setWhere(n.id)},
   e(Art,{file:typeArt(s,n),className:'type-card-art'}),
   e('span',null,e('strong',null,n.name),e('small',null,[count+(count===1?' product':' products'),typeChildren(s,n.id).length?typeChildren(s,n.id).length+' kinds':''].filter(Boolean).join(' · ')))))),
  !q&&empty.length>0&&e('button',{type:'button',className:'text-link show-empty',onClick:()=>setShowEmpty(!showEmpty)},showEmpty?'Hide the '+empty.length+' empty ones':'Show '+empty.length+' more '+(where?'kinds':'families')+' you have not used yet'),
  shown.length>0&&e(React.Fragment,null,
   !q&&where&&e('h3',{className:'catalogue-group-head'},'Products in '+node.name,e('span',null,shown.length)),
   !q&&!where&&e('h3',{className:'catalogue-group-head'},'Not filed yet',e('span',null,shown.length)),
   sellers.length>1?sellers.map(g=>e(React.Fragment,{key:g.key},
    e('h4',{className:'seller-head'},g.label,e('span',null,g.items.length)),
    layout==='list'?e('div',{className:'surface stock-list'},g.items.map(row)):e('div',{className:'catalogue-grid'},g.items.map(card)))):
   layout==='list'?e('div',{className:'surface stock-list'},shown.map(row)):e('div',{className:'catalogue-grid'},shown.map(card))),
  !shown.length&&!families.length&&e(Empty,{icon:'box',title:q?'No matching products':'Nothing here yet',action:e(Btn,{kind:'primary',onClick:()=>setDialog({type:'item',prefill:{typeId:where,categoryId:node?.categoryId}})},'Add a product')},q?'Try another word.':'Add a product, or choose another family.'));
}
