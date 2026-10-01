const SEASON_HOME={8:'Main05.png',9:'Main05.png',10:'Main05.png'};
const ART={home:'Main01.png',fresh:'Fresh food01.png',pantry:'Pantry staples01.png',oil:'Cooking oils and sauces01.png',frozen:'Frozen food01.png',household:'Household supplies01.png',laundry:'Dishwashing and laundry01.png',care:'Personal care.png',beauty:'Beauty and skincare.png',clothes:'Clothes and accessories.png',social:'Eating out and social.png',tgtg:'Too Good To Go01.png',subscriptions:'Subscriptions and AI tools.png',bike:'Transport and cycling01.png',snacks:'Snacks and drinks01.png',money:'Monthly overview.png',saving:'Savings goal02.png',health:'Personal care.png',tech:'Main02.png',other:'Main04.png'};
const DIRECTION_FOLDER='s01-visual-direction-sampler/s01-visual-direction-sampler-v05/';
const FAMILY_FOLDER='s02-category-illustration-family/s02-category-illustration-family-v01/';
const FAMILY2_FOLDER='s02-category-illustration-family/s02-category-illustration-family-v02/';
const SHELVES=FAMILY2_FOLDER+'s02-category-illustration-family-v0202.png';
const KITCHEN=FAMILY2_FOLDER+'s02-category-illustration-family-v0204.png';
const DESK=DIRECTION_FOLDER+'s01-visual-direction-sampler-v0501.png';
const DETAIL_ART={
 'detail:envelopes':{name:'Savings envelopes · v05 collage',file:DIRECTION_FOLDER+'s01-visual-direction-sampler-v0503.png',crop:[.21,.615,.51,.19]},
 'detail:coins':{name:'Little stack of coins · v05',file:DIRECTION_FOLDER+'s01-visual-direction-sampler-v0504.png',crop:[.345,.83,.19,.135]},
 'detail:budgetbook':{name:'Budget notebook · v05',file:DIRECTION_FOLDER+'s01-visual-direction-sampler-v0504.png',crop:[.38,.59,.39,.20]},
 'detail:shoppingbag':{name:'Fresh grocery bag · v05',file:DIRECTION_FOLDER+'s01-visual-direction-sampler-v0504.png',crop:[.455,.205,.235,.27]},
 'detail:bike':{name:'Bicycle detail · v05 collage',file:DIRECTION_FOLDER+'s01-visual-direction-sampler-v0503.png',crop:[.64,.125,.35,.27]},
 'detail:wardrobe':{name:'Clothes & shopping bags · v05',file:DIRECTION_FOLDER+'s01-visual-direction-sampler-v0504.png',crop:[.67,.245,.24,.245]},
 'detail:beauty':{name:'Skincare corner · v05 collage',file:DIRECTION_FOLDER+'s01-visual-direction-sampler-v0503.png',crop:[.83,.465,.165,.23]},
 'detail:freshshelf':{name:'Fresh groceries · category study',file:FAMILY_FOLDER+'s02-category-illustration-family-v0101.png',crop:[.005,.315,.325,.39]},
 'detail:cleaningshelf':{name:'Household shelf · category study',file:FAMILY_FOLDER+'s02-category-illustration-family-v0101.png',crop:[.336,.355,.327,.35]},
 'detail:careshelf':{name:'Personal care · category study',file:FAMILY_FOLDER+'s02-category-illustration-family-v0101.png',crop:[.675,.335,.32,.385]},
 'detail:laundry':{name:'Laundry capsules · category study',file:FAMILY_FOLDER+'s02-category-illustration-family-v0101.png',crop:[.339,.53,.169,.225]},
 'detail:washingup':{name:'Washing-up corner · category study',file:FAMILY_FOLDER+'s02-category-illustration-family-v0101.png',crop:[.473,.357,.188,.317]},
 'detail:toiletroll':{name:'Toilet rolls · category study',file:FAMILY_FOLDER+'s02-category-illustration-family-v0101.png',crop:[.337,.35,.172,.20]},
 'detail:future':{name:'A cosy future · v04 scene',file:'s01-visual-direction-sampler/s01-visual-direction-sampler-v04/s01-visual-direction-sampler-v0401.png',crop:[.18,.075,.44,.245]},
 'detail:subscriptions':{name:'Subscriptions on the desk · v05',file:DIRECTION_FOLDER+'s01-visual-direction-sampler-v0504.png',crop:[.16,.31,.285,.23]},
 'detail:mealprep':{name:'Meal prep · v05',file:DIRECTION_FOLDER+'s01-visual-direction-sampler-v0503.png',crop:[.745,.62,.25,.23]},
 'detail:budgetdonut':{name:'This month at a glance · shelves study',file:SHELVES,crop:[.035,.622,.29,.185]},
 'detail:subspanel':{name:'Subscriptions list · shelves study',file:SHELVES,crop:[.335,.622,.27,.185]},
 'detail:weekmeals':{name:'This week\u2019s meals · shelves study',file:SHELVES,crop:[.615,.622,.30,.185]},
 'detail:moneyenvelopes':{name:'Money set aside in envelopes · shelves study',file:SHELVES,crop:[.005,.80,.45,.195]},
 'detail:freshcrate':{name:'Fresh groceries crate · shelves study',file:SHELVES,crop:[.03,.17,.30,.22]},
 'detail:cleaningtop':{name:'Kitchen cleaning shelf · shelves study',file:SHELVES,crop:[.35,.17,.27,.19]},
 'detail:laundrypods':{name:'Laundry pods & softener · shelves study',file:SHELVES,crop:[.355,.37,.25,.16]},
 'detail:haircare':{name:'Hair care shelf · shelves study',file:SHELVES,crop:[.66,.16,.31,.18]},
 'detail:skincareshelf':{name:'Skincare & vitamins · shelves study',file:SHELVES,crop:[.665,.33,.31,.17]},
 'detail:tescoreceipt':{name:'Receipt & checklist · shelves study',file:SHELVES,crop:[.10,.475,.22,.115]},
 'detail:homeplanphone':{name:'Home plan on a phone · shelves study',file:SHELVES,crop:[.475,.80,.135,.195]},
 'detail:weekboard':{name:'Weekly budget board · kitchen study',file:KITCHEN,crop:[.02,.005,.21,.19]},
 'detail:savingsenvelope':{name:'Savings envelope · kitchen study',file:KITCHEN,crop:[.605,.645,.115,.135]},
 'detail:cashenvelopes':{name:'Cash envelopes · kitchen study',file:KITCHEN,crop:[.425,.658,.45,.125]},
 'detail:laptopbudget':{name:'Spending so far · kitchen study',file:KITCHEN,crop:[.415,.425,.16,.195]},
 'detail:subsgrid':{name:'Monthly subscriptions · kitchen study',file:KITCHEN,crop:[.575,.428,.205,.19]},
 'detail:threereceipts':{name:'A week of receipts · kitchen study',file:KITCHEN,crop:[.03,.70,.28,.21]},
 'detail:mealplanbook':{name:'Meal plan notebook · kitchen study',file:KITCHEN,crop:[.345,.735,.21,.205]},
 'detail:laundrycorner':{name:'Laundry corner · kitchen study',file:KITCHEN,crop:[.60,.15,.25,.205]},
 'detail:vitamins':{name:'Vitamins & painkillers · kitchen study',file:KITCHEN,crop:[.735,.55,.17,.11]},
 'detail:pantryshelf':{name:'Pantry staples · kitchen study',file:KITCHEN,crop:[.11,.40,.25,.20]},
 'detail:pastabowl':{name:'Something warm to share · kitchen study',file:KITCHEN,crop:[.595,.785,.175,.155]},
 'detail:cookbooks':{name:'Cookbooks · kitchen study',file:KITCHEN,crop:[.85,.695,.15,.165]},
 'detail:bills':{name:'Bills on the table · v05 desk',file:DESK,crop:[.015,.572,.195,.14]},
 'detail:walletcoins':{name:'Purse & coins · v05 desk',file:DESK,crop:[.03,.705,.28,.095]},
 'detail:calculator':{name:'Adding it up · v05 desk',file:DESK,crop:[.245,.60,.25,.18]},
 'detail:subslaptop':{name:'Subscriptions on the laptop · v05 desk',file:DESK,crop:[.345,.30,.235,.20]},
 'detail:shoppingbags':{name:'Clothes & shopping bags · v05 desk',file:DESK,crop:[.695,.215,.28,.25]},
 'detail:techboxes':{name:'Things that last · v05 desk',file:DESK,crop:[.665,.395,.32,.26]},
 'detail:mealprepboxes':{name:'Prepared portions · v05 desk',file:DESK,crop:[.005,.39,.20,.18]},
 'detail:planner':{name:'Meal plan & shopping list · v05 desk',file:DESK,crop:[.505,.60,.30,.215]},
 'detail:wine':{name:'A bottle for the evening · v05 desk',file:DESK,crop:[.595,.20,.10,.33]},
 'detail:citybike':{name:'The bike by the window · v05 desk',file:DESK,crop:[.855,.085,.145,.27]}
};
const IMAGE_VARIANTS={
 fresh:['Fresh food01.png','Fresh food02.png','Fresh food03.png','detail:freshshelf','detail:shoppingbag','detail:freshcrate'],
 pantry:['Pantry staples01.png','Pantry staples02.png','Pantry staples03.png','Pantry staples04.png','detail:pantryshelf'],
 oil:['Cooking oils and sauces01.png','Cooking oils and sauces02.png','Cooking oils and sauces03.png'],
 frozen:['Frozen food01.png','Frozen food02.png','Frozen food03.png'],
 household:['Household supplies01.png','Household supplies02.png','Dishwashing and laundry01.png','detail:cleaningshelf','detail:cleaningtop','detail:laundrypods','detail:laundrycorner'],
 care:['Personal care.png','Beauty and skincare.png','detail:careshelf','detail:beauty','detail:haircare','detail:skincareshelf'],
 health:['detail:vitamins','Personal care.png','detail:skincareshelf'],
 social:['Eating out and social.png','detail:pastabowl'],
 tech:['detail:techboxes','Main02.png','Main03.png'],
 other:['Main04.png','Main01.png','detail:homeplanphone','detail:cookbooks'],
 snacks:['Snacks and drinks01.png','Snacks and drinks02.png','Snacks and drinks03.png'],
 tgtg:['Too Good To Go01.png','Too Good To Go02.png'],
 bike:['Transport and cycling01.png','Transport and cycling02.png','detail:bike','detail:citybike'],
 money:['Budget artwork mood01.png','Budget artwork mood02.png','Budget artwork mood03.png','Budget artwork mood04.png','detail:envelopes','detail:coins','detail:budgetbook','detail:budgetdonut','detail:laptopbudget','detail:weekboard','detail:bills','detail:walletcoins','detail:calculator','detail:threereceipts','detail:tescoreceipt'],clothes:['Clothes and accessories.png','detail:wardrobe','detail:shoppingbags'],subscriptions:['Subscriptions and AI tools.png','detail:subscriptions','detail:subspanel','detail:subsgrid','detail:subslaptop'],
 saving:[...Array.from({length:14},(_,i)=>'Savings goal'+String(i+1).padStart(2,'0')+'.png'),'detail:savingsenvelope','detail:cashenvelopes','detail:moneyenvelopes']
};
const ART_PREFIXES={fresh:'Fresh food',pantry:'Pantry staples',oil:'Cooking oils and sauces',frozen:'Frozen food',household:'Household supplies',laundry:'Dishwashing and laundry',care:'Personal care',beauty:'Beauty and skincare',snacks:'Snacks and drinks',tgtg:'Too Good To Go',bike:'Transport and cycling',clothes:'Clothes and accessories',subscriptions:'Subscriptions and AI tools',money:'Budget artwork mood',saving:'Savings goal',health:'Health and medicines',social:'Eating out and social',tech:'Home and tech',other:'Gifts and giving'};
const ITEM_ART={},CATEGORY_ART={};
function artSlug(x){return String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
// Spread several pictures across the things that share them, the same way every time.
function pickArt(arr,name,offset){if(!arr||!arr.length)return null;if(arr.length===1)return arr[0];const s=artSlug(name);let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return arr[(h+offset)%arr.length];}
function adoptNewArtwork(files){
 let added=0;
 for(const f of files){
  if(f.includes('/'))continue;
  const m=/^(item|category)-(.+)\.(png|jpe?g|webp)$/i.exec(f);if(!m)continue;
  const map=m[1].toLowerCase()==='item'?ITEM_ART:CATEGORY_ART,key=artSlug(m[2]);
  // 'category-bread-bakery02.png' and 'category-bread-bakery-02.png' both belong to bread-bakery
  const keys=[key];const trimmed=/^(.*[a-z])-?\d{1,2}$/.exec(key);if(trimmed)keys.push(trimmed[1]);
  for(const k of keys){const arr=map[k]||(map[k]=[]);if(!arr.includes(f)){arr.push(f);arr.sort();added++;}}
 }
 for(const [family,prefix] of Object.entries(ART_PREFIXES)){
  const pool=IMAGE_VARIANTS[family]||(IMAGE_VARIANTS[family]=[]);
  const found=files.filter(f=>!f.includes('/')&&new RegExp('^'+prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*\\d*\\.(png|jpe?g|webp)$','i').test(f));
  for(const f of found)if(!pool.includes(f)){pool.push(f);added++;}
  pool.sort();
 }
 return added;
}
function artFamily(s,cid,name=''){
 const c=category(s,cid),n=name.toLowerCase();
 if(/\boil\b|sauce/.test(n))return 'oil';
 if(cid==='frozen-food'||cid==='meat-fish-plant-proteins')return 'frozen';
 if(c.group==='Household')return 'household';
 if(c.group==='Personal care & beauty')return 'care';
 if(c.group==='Health & medicines')return 'health';
 return ({'Fresh food':'fresh','Pantry & freezer':'pantry','Snacks & drinks at home':'snacks','Clothes & accessories':'clothes','Eating out & social':'social','Too Good To Go':'tgtg','Subscriptions':'subscriptions','Transport & cycling':'bike','Home, tech & longer-lasting purchases':'tech','Other & to review':'other'})[c.group]||'other';
}
function artFor(s,cid,name='',offset=0){
 const n=name.toLowerCase(),specific='ChatGPT Image Sep 17, 2026, 05_59_33 AM ';
 const own=pickArt(ITEM_ART[artSlug(name)],name,offset);if(own)return own;
 const byCat=pickArt(CATEGORY_ART[cid],name,offset);if(byCat)return byCat;
 if(/laundry capsule/.test(n))return 'detail:laundry';if(/dishwasher/.test(n))return 'Dishwashing and laundry01.png';if(/washing.up|dishwashing/.test(n))return 'detail:washingup';if(/toilet paper|toilet roll/.test(n))return 'detail:toiletroll';
 if(/soy/.test(n))return specific+'(1).png';
 if(/\begg(s)?\b/.test(n)&&!n.includes('sandwich'))return specific+'(2).png';
 if(/chicken breast|inner chicken|diced chicken/.test(n))return specific+'(3).png';
 if(/rice paper/.test(n))return specific+'(4).png';
 const family=artFamily(s,cid,name),pool=IMAGE_VARIANTS[family];if(!pool)return ART[family]||ART.household;
 const names=[...new Set([...s.items.filter(i=>artFamily(s,i.categoryId,i.name)===family).map(i=>i.name),...stockRows(s).filter(r=>artFamily(s,r.categoryId,r.name)===family).map(r=>r.name)])].sort();
 return pool[(Math.max(0,names.indexOf(name))+offset)%pool.length];
}
function goalArt(g,index=0){if(g.image)return g.image;if(/bike|cycl/i.test(g.name))return 'Transport and cycling02.png';return IMAGE_VARIANTS.saving[index%IMAGE_VARIANTS.saving.length];}
function Art({file,alt='',className=''}){
 const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[file]);
 className += /^(approved\/Products\/|products\/|photos\/)/.test(file||'') ? ' product-photo' : '';
 const spec=DETAIL_ART[file]||{file:file||ART.home},src='art/'+spec.file.split('/').map(encodeURIComponent).join('/');
 if(failed)return e('div',{className:'art-fallback '+className},e(Icon,{name:'leaf',size:36}));
 if(spec.crop){const [x,y,w,h]=spec.crop;return e('div',{className:'art art-crop '+className,role:alt?'img':undefined,'aria-label':alt||undefined},e('img',{src,alt:'',loading:'lazy',onError:()=>setFailed(true),style:{position:'absolute',maxWidth:'none',width:100/w+'%',height:100/h+'%',left:-x/w*100+'%',top:-y/h*100+'%'}}));}
 return e('img',{className:'art '+className,src,alt,loading:'lazy',onError:()=>setFailed(true)});
}
function Download(data,name='Budget-Management-backup.json'){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function pounds(n){return money(n/100);}
function Input({label,value,onChange,type='text',hint,...rest}){const id=React.useId();return e(Field,{label,id,hint},e('input',{id,value:value??'',type,onChange:ev=>onChange(ev.target.value),...rest}));}
function Textarea({label,value,onChange,...rest}){const id=React.useId();return e(Field,{label,id},e('textarea',{id,value:value||'',onChange:ev=>onChange(ev.target.value),...rest}));}
function Select({label,value,onChange,options,hint}){const id=React.useId();return e(Field,{label,id,hint},e('select',{id,value,onChange:ev=>onChange(ev.target.value)},options.map(x=>e('option',{key:Array.isArray(x)?x[0]:x,value:Array.isArray(x)?x[0]:x},Array.isArray(x)?x[1]:x))));}
function CategorySelect({state,value,onChange}){return e(Select,{label:'Category',value,onChange,options:state.categories.filter(c=>!c.archived||c.id===value).map(c=>[c.id,c.group+' · '+c.name])});}
const TRACKING=[['none','Just the spending · nothing to keep'],['count','Counted · rolls, eggs, tins, pizzas'],['measured','Measured · g or ml, like rice or milk'],['level','Long-lasting · oil, sauces, spices (never measured)'],['durable','Owned · a pan, clothes, a lamp']];
function ErrorMessage({error}){return error&&e('p',{className:'error-box',role:'alert'},error);}
function FormModal({title,kicker,onClose,onSubmit,children,label='Save',wide=false}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(ev){ev.preventDefault();if(busy)return;setBusy(true);setError('');try{await onSubmit();}catch(err){setError(err.message);}finally{setBusy(false);}}
 return e(Modal,{title,kicker,onClose,wide},e('form',{onSubmit:submit},e('fieldset',{disabled:busy,className:'form-fieldset'},e('div',{className:'dialog-body form-stack'},children,e(ErrorMessage,{error})),e(DialogFooter,{onClose},e(Btn,{type:'submit',kind:'primary'},busy?'Saving…':label)))));
}

// Numbers settle into place instead of snapping, unless the reader asked for less motion.
function useCountUp(value,ms=700){
 const [v,setV]=useState(value),prev=React.useRef(value);
 useEffect(()=>{
  const from=prev.current,to=Number(value)||0;prev.current=to;
  if(from===to)return;
  try{if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){setV(to);return;}}catch{}
  let raf,start;
  const step=ts=>{if(!start)start=ts;const p=Math.min(1,(ts-start)/ms),e=1-Math.pow(1-p,3);setV(from+(to-from)*e);if(p<1)raf=requestAnimationFrame(step);};
  raf=requestAnimationFrame(step);
  return ()=>cancelAnimationFrame(raf);
 },[value]);
 return v;
}
function CountMoney({value,className}){const v=useCountUp(value);return e('span',{className},money(v));}
// A month you can actually look at: every day, what it cost, and whether that was more than the pace.
// One money-back payment can be split across several purchases; show it as the single payment it was.
function groupedLedger(rows,s){if(s)return transactionRows(s,rows);const out=[],seen={};for(const x of rows){if(x.refund&&x.groupId&&seen[x.groupId]){const g=seen[x.groupId];g.amount=Math.round(g.amount*100+x.amount*100)/100;g.fors.push(x.forNote);continue;}const row=x.refund?{...x,fors:[x.forNote]}:x;if(x.refund&&x.groupId)seen[x.groupId]=row;out.push(row);}return out;}
function LedgerRow({state:s,x,onOpen}){
 if(x.receiptTotal){const back=x.expenseIds.reduce((n,id)=>n+paidBackPence(s,id),0);return e('button',{type:'button',className:'plain-row receipt-row',onClick:()=>onOpen(x)},e('span',{className:'item-glyph'},e(Icon,{name:'bag'})),e('div',null,e('strong',null,x.note),e('small',null,prettyDate(x.date)+' · '+x.itemCount+' item lines · Itemised receipt')),e('span',{className:'row-amount'},e('b',null,money(x.amount)),e('small',null,'View receipt →'),back>0&&e('small',{className:'money-in'},pounds(back)+' back')));}

 if(x.refund)return e('button',{type:'button',className:'plain-row moneyback-row',onClick:()=>onOpen(x)},e('span',{className:'item-glyph back-glyph'},e(Icon,{name:'back'})),e('div',null,e('strong',null,x.note),e('small',null,prettyDate(x.date)+(x.kind==='moneyback'?' · for '+x.fors.join(', '):''))),e('b',{className:'money-in'},'\u2212'+money(-x.amount)));
 const back=paidBackPence(s,x.id),place=placeOf(s,x);
 return e('button',{type:'button',className:'plain-row',onClick:()=>onOpen(x)},e('span',{className:'item-glyph'},e(Icon,{name:'wallet'})),e('div',null,e('strong',null,x.note||x.category),e('small',null,[prettyDate(x.date),x.categoryId?category(s,x.categoryId).name:x.category,place,'Payment record'].filter(Boolean).join(' · ')),x.details&&e('small',{className:'row-details'},x.details)),e('span',{className:'row-amount'},e('b',null,money(x.amount)),back>0&&e('small',{className:'money-in'},pounds(back)+' back')));
}
function SpendingCalendar({state:s,month:m,onAdd,onOpen}){
 const [picked,setPicked]=useState(null);
 const f=budgetFigures(s,m),rows=ledger(s).filter(x=>dateMonth(x.date)===m);
 const byDay={},backDay={};for(const x of rows){const p=Math.round(x.amount*100);if(p<0)backDay[x.date]=(backDay[x.date]||0)-p;else byDay[x.date]=(byDay[x.date]||0)+p;}
 const bought=transactionRows(s,rows).filter(x=>!x.refund).length;
 const weeks=getWeeks(m),max=Math.max(1,...Object.values(byDay)),today=isoDate(new Date());
 const [y,mm]=m.split('-').map(Number),daysInMonth=new Date(y,mm,0).getDate();
 const current=m===today.slice(0,7);
 const daysLeft=current?Math.max(1,daysInMonth-Number(today.slice(8,10))+1):daysInMonth;
 const leftPence=Math.max(0,Math.round(f.totalRemaining*100)),perDay=Math.round(leftPence/daysLeft);
 const spentToday=byDay[today]||0,busiest=Object.entries(byDay).sort((a,b)=>b[1]-a[1])[0];
 const dayRows=picked?rows.filter(x=>x.date===picked):[];
 const quiet=weeks.flat().filter(d=>d.inMonth&&d.date<=today&&!byDay[d.date]).length;
 return e('section',{className:'surface calendar-panel'},
  e(SectionTitle,{title:monthLabel(m),note:bought+(bought===1?' purchase':' purchases')+' this month'}),
  e('div',{className:'cal-pace'},
   e('div',null,e('span',{className:'eyebrow'},current?'LEFT TO SPEND, PER DAY':'A DAY, ACROSS THE MONTH'),
    e(CountMoney,{value:perDay/100,className:'cal-pace-figure'}),
    e('small',null,current?('for the '+daysLeft+(daysLeft===1?' day':' days')+' still to come'):'if it had been spread evenly')),
   current&&e('div',{className:'cal-today'},e('span',{className:'eyebrow'},'TODAY'),
    e('strong',null,spentToday?pounds(spentToday):'Nothing yet'),
    e('small',null,(spentToday>perDay&&perDay>0?'above the daily guide':spentToday?'within the pace':'nothing spent today')+(backDay[today]?' · '+pounds(backDay[today])+' came back':'')))),
  e('div',{className:'cal-grid'},
   ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>e('span',{className:'cal-head',key:d},d)),
   weeks.flat().map((d,i)=>{
    const pence=byDay[d.date]||0;
    return e('button',{key:d.date+i,type:'button',disabled:!d.inMonth,
      className:'cal-day'+(d.inMonth?'':' out')+(d.date===today?' today':'')+(picked===d.date?' picked':'')+(perDay>0&&pence>perDay?' over':''),
      style:{animationDelay:Math.min(i,34)*12+'ms'},
      'aria-label':d.date+(pence?', '+pounds(pence):', nothing spent'),
      onClick:()=>setPicked(picked===d.date?null:d.date)},
     e('span',{className:'cal-num'},d.day),
     pence>0&&e('span',{className:'cal-amt'},pounds(pence)),!pence&&backDay[d.date]>0&&e('span',{className:'cal-amt money-in'},'\u2212'+pounds(backDay[d.date])),
     e('span',{className:'cal-bar',style:{height:pence?Math.max(4,Math.round(pence/max*30))+'px':'0'}}));
   })),
  picked&&e('div',{className:'cal-day-detail'},
   e('strong',null,prettyDate(picked)),
   dayRows.length?groupedLedger(dayRows,s).map(x=>e('button',{type:'button',className:'cal-line cal-open',key:x.id,onClick:()=>onOpen&&onOpen(x)},e('span',null,x.note||x.category,placeOf(s,x)&&e('small',null,' · '+placeOf(s,x))),e('b',{className:x.refund?'money-in':''},x.refund?'\u2212'+money(-x.amount):money(x.amount)))):e('p',{className:'muted'},'Nothing recorded on this day.'),
   e(Btn,{kind:'secondary',onClick:()=>onAdd&&onAdd(picked)},'Add a purchase on this day')),
  !picked&&e('p',{className:'muted cal-hint'},busiest?('Highest day: '+prettyDate(busiest[0])+' · '+pounds(busiest[1])+(quiet?' · '+quiet+(quiet===1?' day':' days')+' with no spending':'')):'Tap a day to add a purchase.')
 );
}
// The address bar follows you: #/food/used, #/meals, #/food/item/<item>?m=2026-10. Back and forward work.
const TAB_SLUG={home:'everyday',shopping:'shopping',stock:'food',meals:'meals',money:'money',history:'history',settings:'settings'},SLUG_TAB=Object.fromEntries(Object.entries(TAB_SLUG).map(([k,v])=>[v,k]));
function readRoute(){const raw=(typeof location!=='undefined'?location.hash:'').replace(/^#\/?/,''),[path,query='']=raw.split('?'),parts=path.split('/').filter(Boolean),q=new URLSearchParams(query),at=parts.indexOf('item');let view=parts[1]||'',item='';if(at>0){item=decodeURIComponent(parts.slice(at+1).join('/'));view=at===1?'':parts[1];}return {tab:SLUG_TAB[parts[0]]||'home',view:decodeURIComponent(view),item,month:q.get('m')||'',week:q.get('w')||''};}
function routeHash(r){const q=new URLSearchParams();if(r.month)q.set('m',r.month);if(r.week)q.set('w',r.week);return '#/'+(TAB_SLUG[r.tab]||'everyday')+(r.view?'/'+encodeURIComponent(r.view):'')+(r.item?'/item/'+encodeURIComponent(r.item):'')+(q.size?'?'+q:'');}
function useLocalPref(key,init){const [v,setV]=useState(()=>{try{return localStorage.getItem(key)||init;}catch{return init;}});return [v,x=>{setV(x);try{localStorage.setItem(key,x);}catch{}}];}
function EntryRow({state:s,g,m,setDialog}){
 const f=entryFacts(g),name=entryName(g),level=f.tracking==='level',live=g.rows.filter(r=>r.remaining>0),bottle=level?currentBottle(g):null,info=bottle?lastingInfo(bottle):null,open=()=>setDialog({type:'item-page',key:g.key});
 const primary=level?(bottle?()=>setDialog({type:'stock-action',id:bottle.id}):open):f.tracking==='durable'||!live.length?open:()=>setDialog({type:'use-stock',ids:g.rows.map(x=>x.id)});
 return e('div',{className:'stock-row'},e('button',{type:'button',className:'stock-row-main',onClick:open},e(Art,{file:entryArt(s,g),className:'stock-row-art'}),e('span',{className:'stock-row-copy'},e('strong',null,name),e('small',null,[g.item?.brand,level?(info?(info.state==='unopened'?'Unopened':lastingText(info)):'Finished'):amountLine(f),!level&&g.rows.some(r=>r.source==='resource'&&r.availableMonth&&r.remaining>0)?shareText(live,m):''].filter(Boolean).join(' · ')),g.purchaseFiltered&&e(PurchaseMeta,{state:s,g}),level&&info?e(LastingBar,{info}):f.tracking==='count'?e(UnitDots,{left:f.left,total:f.total}):null)),e(Btn,{small:true,kind:'primary',onClick:primary},level?'Update':f.tracking==='durable'||!live.length?'Open':'Use'));
}
function App(){
 const [state,setState]=useState(null),[setup,setSetup]=useState(null),[fatal,setFatal]=useState(''),[status,setStatus]=useState('Loading'),[route,setRoute]=useState(readRoute),[dialog,setDialog]=useState(null),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[conflict,setConflict]=useState(false);
 const [inventory,setInventory]=useState({category:'all',scope:'month',status:'all',search:'',mode:'map'});
 const revision=React.useRef(0),current=React.useRef(null),locked=React.useRef(false),undoRef=React.useRef(null);
 useEffect(()=>{const on=()=>setRoute(readRoute());window.addEventListener('hashchange',on);if(!location.hash)history.replaceState(null,'',routeHash(readRoute()));return ()=>window.removeEventListener('hashchange',on);},[]);
 const tab=route.tab,month=/^\d{4}-(0[1-9]|1[0-2])$/.test(route.month)?route.month:initialMonth(),pushedItem=React.useRef(false);
 const go=(patch,opts={})=>{const h=routeHash({...readRoute(),...patch});if(h===location.hash)return;if(opts.replace){history.replaceState(null,'',h);setRoute(readRoute());}else location.hash=h;};
 const setTab=id=>{go({tab:id,view:'',item:'',week:''});try{window.scrollTo(0,0);}catch{}},setMonth=v=>go({month:v===initialMonth()?'':v,week:''});
 const openDialog=d=>{if(d&&d.type==='item-page'){pushedItem.current=true;go({item:d.key});return;}setDialog(d);};
 const closeItem=()=>{if(pushedItem.current){pushedItem.current=false;history.back();}else go({item:''},{replace:true});};
 useEffect(()=>{try{document.title=({home:'My everyday',shopping:'Shopping',stock:'Food & supplies',meals:'Meals & recipes',money:'Money & saving',history:'Weekly history',settings:'Settings'}[tab]||'Everyday')+' · Everyday';}catch{}},[tab]);
 useEffect(()=>{try{window.scrollTo(0,0);}catch{}},[route.tab,route.view]);
 const autoRan=React.useRef(false);
 useEffect(()=>{if(!state||autoRan.current||conflict)return;autoRan.current=true;const next=autoPaySubscriptions(state);if(next!==state){const n=next.expenses.length-state.expenses.length;commit(next,n===1?'1 subscription renewal taken off this month':n+' subscription renewals taken off their months',{noUndo:true}).catch(()=>{autoRan.current=false;});}},[state]);
 async function load(){setFatal('');try{
   const res=await fetch('api/state'),disk=await res.json();if(!res.ok)throw new Error(disk.error);revision.current=disk.revision;
   if(disk.state){const next=migrateV4(disk.state);current.current=next;setState(next);setSetup(null);setStatus('Saved locally');setConflict(false);}
   else{let browser=null,error='';try{const raw=localStorage.getItem(APP_KEY);if(raw)browser=migrateV4(JSON.parse(raw));}catch(err){error=err.message;}
     const backup=await (await fetch('api/migration-candidate')).json();let saved=null;try{if(backup.state)saved=migrateV4(backup.state.state||backup.state);}catch{}
     setSetup({browser,saved,filename:backup.filename,error});setStatus('Choose your starting copy');}
 }catch(err){setFatal(err.message||'The local server could not be reached. Use Start Budget Management.cmd.');setStatus('Needs attention');}}
 const [artRound,setArtRound]=useState(0);
 useEffect(()=>{load();},[]);
 useEffect(()=>{fetch('api/art').then(r=>r.json()).then(files=>{if(Array.isArray(files)&&adoptNewArtwork(files))setArtRound(n=>n+1);}).catch(()=>{});},[]);
 async function commit(update,message='Saved',options={}){
   if(locked.current)throw new Error('Please wait for the current save.');if(conflict)throw new Error('Reload the saved copy before making more changes.');
   locked.current=true;setBusy(true);setStatus('Saving…');
   const before=current.current;
   try{const next=validateV4(typeof update==='function'?update(before):update);const res=await fetch('api/state',{method:'PUT',headers:{'Content-Type':'application/json','X-Planner-Action':'save'},body:JSON.stringify({revision:revision.current,state:next})});const result=await res.json();
     if(!res.ok){if(res.status===409)setConflict(true);throw new Error(result.error||'Could not save.');}
     revision.current=result.revision;undoRef.current=options.noUndo?null:before;current.current=next;setState(next);setSetup(null);setStatus('Saved locally');setNotice(message);setDialog(null);
     try{localStorage.setItem(APP_KEY+'_v4cache',JSON.stringify({revision:result.revision,state:next}));}catch{}
   }catch(err){setStatus('Save needs attention');setNotice(err.message);throw err;}finally{locked.current=false;setBusy(false);}
 }
 const act=(fn,msg)=>commit(fn,msg).catch(()=>{});
 const p={state,selectedMonth:month,setSelectedMonth:setMonth,tab,setTab,route,go,setDialog:openDialog,commit,act,busy,inventory,setInventory,exportData:()=>Download(state),openExpense:()=>setDialog({type:'receipt'}),onClose:()=>setDialog(null),dialog};
 if(!state)return e('div',{className:'welcome'},e(Art,{file:'Main04.png'}),e('section',null,null,e('h1',null,'Everyday'),null,fatal?e(React.Fragment,null,e(ErrorMessage,{error:fatal}),e(Btn,{onClick:load},'Try again')):setup?e('div',{className:'form-stack'},e('h2',null,'Choose a starting copy'),e('p',{className:'muted'},'Choose the copy to save in your BudgetManagement folder. Your existing browser copy stays untouched.'),setup.browser&&e(Btn,{kind:'primary',disabled:busy,onClick:()=>act(setup.browser,'Your browser plan is now saved locally')},'Use my current browser plan'),setup.saved&&e(Btn,{disabled:busy,onClick:()=>act(setup.saved,'Saved backup imported')},'Use saved backup · '+setup.filename),e(Btn,{disabled:busy,onClick:()=>{if(confirm('Start from the original allocation plan? Existing browser and backup files remain available.'))act(migrateV4(defaultState()),'Original plan ready');}},'Start from the original plan'),e(ErrorMessage,{error:setup.error})):e('p',{role:'status'},'Opening your planner…')));
 const nav=[['home','home','My everyday'],['history','history','Weekly history'],['shopping','bag','Shopping'],['stock','box','Food & supplies'],['meals','calendar','Meals & recipes'],['money','wallet','Money & saving']];
 const months=[...new Set([...MONTHS.map(m=>m.key),...Object.keys(state.budgets),month])].sort();
 return e('div',{className:'v2-shell'},e('a',{href:'#main-content',className:'skip-link',onClick:ev=>{ev.preventDefault();document.getElementById('main-content')?.focus();}},'Skip to content'),
  e('aside',{className:'v2-sidebar'},e('div',{className:'v2-brand'},e('div',{className:'brand-leaf'},e(Icon,{name:'leaf',size:27})),e('div',null,e('strong',null,'Everyday'),null)),e('nav',{'aria-label':'Main navigation'},nav.map(([id,icon,label])=>e('button',{key:id,className:tab===id?'active':'','aria-current':tab===id?'page':undefined,onClick:()=>setTab(id)},e(Icon,{name:icon}),label))),null,e('button',{className:'settings-link',onClick:()=>setTab('settings')},e(Icon,{name:'settings'}),'Settings & backups'),e('small',{className:'local-status',role:'status'},e('i',{className:status==='Saved locally'?'ok':''}),status)),
  e('div',{className:'v2-work'},e('header',{className:'v2-topbar'},e('span',{className:'top-greeting'},({home:'Overview',history:'Consumption history',shopping:'Shopping',stock:'Food & supplies',meals:'Meals & recipes',money:'Money & saving',settings:'Settings & backups'}[tab])),e('div',{className:'top-actions'},e('select',{'aria-label':'Planning month',value:month,onChange:ev=>setMonth(ev.target.value)},months.map(m=>e('option',{key:m,value:m},monthLabel(m)))),e(Btn,{kind:'primary',icon:'plus',disabled:busy,onClick:p.openExpense},'Add payment'),e(Btn,{kind:'mobile-settings',icon:'settings',onClick:()=>setTab('settings')},e('span',{className:'sr-only'},'Settings & backups')))),
   e('main',{id:'main-content',className:'v2-main',tabIndex:-1},conflict&&e('div',{className:'alert',role:'alert'},'Another tab has saved a newer copy. Your current view has been kept.',e(Btn,{onClick:()=>Download(state)},'Export this view'),e(Btn,{onClick:load},'Reload saved copy')),
     tab==='home'&&e(HomeV2,p),tab==='history'&&e(HistoryV3,p),tab==='shopping'&&e(ShoppingV2,p),tab==='stock'&&e(StockV2,p),tab==='meals'&&e(MealsV2,p),tab==='money'&&e(MoneyV2,p),tab==='settings'&&e(SettingsV2,p),e('footer',{className:'v2-footer'},null,e('button',{className:'photo-credits-button',onClick:()=>setDialog({type:'art-gallery'})},'Images'),e('span',null,'Local & private · '+monthLabel(month))))),
  notice&&e('div',{className:'toast',role:'status'},e('span',null,notice),undoRef.current&&e('button',{disabled:busy||conflict,onClick:()=>commit(undoRef.current,'Undone',{noUndo:true}).catch(()=>{})},'Undo'),e('button',{'aria-label':'Dismiss notification',onClick:()=>setNotice('')},'×')),
  (dialog||route.item)&&e(ProductDialog,dialog?{...p,key:dialog.type+'-'+(dialog.id||dialog.listId||'')}:{...p,dialog:{type:'item-page',key:route.item},onClose:closeItem,key:'item-page-'+route.item}));
}
ICONS.bag='M5 7h14l2 14H3Zm4 0V5a3 3 0 0 1 6 0v2';
function Stat({label,value,detail,tone=''}){return e('div',{className:'v2-stat '+tone},e('span',null,label),e('strong',null,value),detail&&e('small',null,detail));}
function SectionTitle({title,note,action}){return e('div',{className:'section-heading'},e('div',null,e('h2',null,title),note&&e('p',{className:'muted'},note)),action);}
// Regular buys that are probably due: bought "every week" and not bought for a week, with none at home.
function DueStrip({state:s,listId,setDialog}){const due=dueItems(s);if(!due.length)return null;return e('section',{className:'surface due-strip'},e(SectionTitle,{title:'Due to buy',note:''}),e('div',{className:'due-list'},due.slice(0,12).map(({item:i})=>e('div',{className:'due-item',key:i.id},e(Art,{file:i.photo||i.image||artFor(s,i.categoryId,i.name)}),e('div',null,e('strong',null,i.name),e('small',null,(i.lastBought?'Last bought '+prettyDate(i.lastBought):'Not bought yet')+' · '+EVERY_LABEL[i.every])),e(Btn,{small:true,icon:'plus',onClick:()=>setDialog({type:'line',listId,itemId:i.id})},'Add')))));}
function ShoppingV2(p){
 const {state:s,selectedMonth:m,setDialog,act}=p,view=['lists','usual','receipts','shops'].includes(p.route?.view)?p.route.view:'lists',setView=v=>p.go({view:v}),[search,setSearch]=useState(''),[selected,setSelected]=useState(''),[onlyUsual,setOnlyUsual]=useState(true);
 const lists=s.lists,chosen=lists.find(l=>l.id===selected)||lists.find(l=>l.lines.some(x=>x.status==='planned'))||lists[0];
 return e(React.Fragment,null,e(PageHeading,{eyebrow:'',title:'Shopping',action:e(Btn,{kind:'primary',icon:'plus',onClick:()=>setDialog({type:'list'})},'New shopping list')},''),e('div',{className:'page-tabs'},e(Segment,{label:'Shopping view',value:view,onChange:setView,options:[['lists','My lists'],['usual','Catalogue'],['shops','Shops'],['receipts','Receipts']]})),
 view==='lists'&&e(DueStrip,{state:s,listId:chosen?.id,setDialog}),view==='lists'&&e('div',{className:'shopping-layout'},e('section',{className:'list-rail'},e(Art,{file:'approved/Pages/Shopping/Shopping.png'}),lists.map(l=>e('button',{className:'list-choice '+(chosen?.id===l.id?'selected':''),key:l.id,onClick:()=>setSelected(l.id)},e('strong',null,l.name),e('small',null,l.lines.filter(x=>x.status==='planned').length+' left · '+prettyDate(l.date))))),e('section',{className:'surface shopping-detail'},chosen?e(React.Fragment,null,e(SectionTitle,{title:chosen.name,note:(chosen.merchant||'Any shop')+' · '+prettyDate(chosen.date),action:e(Btn,{small:true,onClick:()=>setDialog({type:'list',id:chosen.id})},'Edit list')}),e('div',{className:'inline-actions'},e(Btn,{icon:'plus',onClick:()=>setDialog({type:'line',listId:chosen.id})},'Add item'),e(Btn,{onClick:()=>setView('usual')},'Choose usual buys'),e(Btn,{kind:'primary',onClick:()=>setDialog({type:'receipt',listId:chosen.id})},'Record what I bought')),
 chosen.lines.filter(x=>x.status==='planned').map(l=>e('div',{className:'shopping-line',key:l.id},e('span',{className:'check-circle'}),e('button',{className:'line-main',onClick:()=>setDialog({type:'line',listId:chosen.id,id:l.id})},e('strong',null,l.name),e('small',null,[displayQty(l.quantity,l.unit),l.typeId?'any brand':'',category(s,l.categoryId).name,l.priority].filter(Boolean).join(' · '))),e('b',null,l.estimatePence==null?'Price?':pounds(l.estimatePence)),e('button',{className:'icon-button','aria-label':'Remove '+l.name,onClick:()=>act(st=>({...st,lists:st.lists.map(x=>x.id===chosen.id?{...x,lines:x.lines.filter(i=>i.id!==l.id)}:x)}),'Removed from list')},'×'))),
 !chosen.lines.some(x=>x.status==='planned')&&e(Empty,{icon:'bag',title:'No items on this list'},'Add an item, or browse your usual buys.'),e('div',{className:'list-total'},e('div',null,e('small',null,'ESTIMATED TOTAL'),e('strong',null,pounds(chosen.lines.filter(x=>x.status==='planned').reduce((n,l)=>n+(l.estimatePence||0),0)))),e('p',{className:'muted'},chosen.lines.filter(x=>x.status==='planned'&&x.estimatePence==null).length+' items without prices. Plans affect your forecast; only a paid receipt affects your balance.'))):e(Empty,{icon:'bag',title:'No shopping lists',action:e(Btn,{kind:'primary',onClick:()=>setDialog({type:'list'})},'Create my first list')},''))),
 view==='usual'&&e(CatalogueView,{...p,chosen}),
 view==='shops'&&e(ShopsView,p),
 view==='receipts'&&e('section',{className:'surface'},e(SectionTitle,{title:'Recorded purchases',note:'',action:e(Btn,{onClick:()=>setDialog({type:'receipt'})},'Add receipt')}),s.receipts.filter(r=>r.date>=PLAN_START).slice().sort((a,b)=>b.date.localeCompare(a.date)).map(r=>e('button',{className:'plain-row',key:r.id,onClick:()=>setDialog({type:'receipt-detail',id:r.id})},e(Icon,{name:'bag'}),e('div',null,e('strong',null,shopName(s,r)||r.merchant),e('small',null,prettyDate(r.date)+' · '+r.lines.length+' items · '+r.channel+(r.photo?' · photo':''))),e('b',null,pounds(r.paidPence)))),!s.receipts.length&&e(Empty,{icon:'bag',title:'No receipts'},'')));
}
// Group identical original allocations (same name and unit) into one card; each new physical lot stays separate.
function stockGroups(rows){const groups=[];for(const row of rows){if(row.source==='resource'){const key=row.name+'|'+row.unit;let g=groups.find(x=>x.key===key);if(!g){g={key,row,rows:[]};groups.push(g);}g.rows.push(row);}else groups.push({key:row.id,row,rows:[row]});}return groups;}
function monthShort(k){return new Date(k+'-15T12:00:00').toLocaleDateString('en-GB',{month:'long'});}
// "2 for now · 1 set aside for October"
function shareText(rs,m){
 if(new Set(rs.map(r=>unitKey(r.unit))).size>1)return 'Different units shown separately';
 const unit=rs[0].unit,now=rs.filter(x=>x.remaining>0&&(!x.availableMonth||x.availableMonth<=m)).reduce((n,x)=>n+x.remaining,0),laterRows=rs.filter(x=>x.remaining>0&&x.availableMonth>m),later=laterRows.reduce((n,x)=>n+x.remaining,0);
 const months=[...new Set(laterRows.map(x=>x.availableMonth))].sort().map(monthShort);
 if(!later)return now?displayQty(now,unit)+' for now':'';
 return (now?displayQty(now,unit)+' for now · ':'')+displayQty(later,unit)+' set aside for '+(months.length>2?months[0]+' to '+months[months.length-1]:months.join(' & '));
}
const LASTING_LABEL={unopened:'Unopened','in-use':'In use',half:'About half',low:'Running low',finished:'Finished'};
function lastingText(info){
 if(info.state==='finished')return 'Finished';
 if(info.state==='unopened')return 'Unopened · lasts about '+info.lasts+(info.lasts===1?' month':' months');
 if(info.overdue)return 'Past its usual '+info.lasts+' months';
 const months=Math.round(info.daysLeft/30.44);
 return months>=1?'About '+months+(months===1?' month':' months')+' left':'About '+Math.max(1,info.daysLeft)+(info.daysLeft===1?' day':' days')+' left';
}
function LastingBar({info,big=false}){return e('div',{className:'lasting-bar'+(big?' big':'')+(info.state==='low'||info.overdue?' low':''),role:'img','aria-label':Math.round(info.left*100)+'% estimated left'},e('span',{style:{width:Math.round(info.left*100)+'%'}}));}
function entryName(g){if(g.item)return g.item.name;const n=g.rows[0]?.name||g.name,t=titleName(n);return t!==n?t:g.name;}
function entryArt(s,g){const cat=g.item?.categoryId||g.rows[0]?.categoryId;return g.item?.photo||g.item?.image||g.rows.find(r=>r.image)?.image||artFor(s,cat,entryName(g));}
function currentBottle(g){return g.rows.filter(r=>r.remaining>0).sort(bottleOrder(isoDate(new Date())))[0]||null;}
function niceName(n){const t=titleName(n);return t!==n?t:cleanName(n);}
function entryLow(g){return g.rows.some(r=>runningLow(r)||r.tracking==='level'&&r.remaining>0&&lastingInfo(r).state==='low');}
const KIND_LABEL={count:'Counted',measured:'Measured',level:'Long-lasting',durable:'Owned',none:'Just the spending'};
function UnitDots({left,total,big=false}){if(!(total>0)||total>60||!Number.isInteger(total)||!Number.isInteger(left))return null;return e('div',{className:'unit-dots'+(big?' big':''),role:'img','aria-label':left+' of '+total+' left'},Array.from({length:total},(_,i)=>e('i',{key:i,className:i<left?'':'gone'})));}
function amountLine(f){if(f.mixed)return f.quantities.map(q=>displayQty(q.left,q.unit)).join(' + ')+' left';if(f.tracking==='durable')return f.left>0?'Kept':'No longer kept';if(!f.total)return 'None at home';return f.used>0?(+f.left.toFixed(2))+' of '+displayQty(f.total,f.unit)+' left':displayQty(f.left,f.unit);}
function EntryCard({state:s,g,m,setDialog}){
 const f=entryFacts(g),name=entryName(g),level=f.tracking==='level',live=g.rows.filter(r=>r.remaining>0),bottle=level?currentBottle(g):null,info=bottle?lastingInfo(bottle):null,spares=level&&bottle?live.filter(r=>r.id!==bottle.id).length:0;
 const reserved=g.rows.reduce((n,x)=>n+reservedAmount(s,x.id),0),open=()=>setDialog({type:'item-page',key:g.key});
 const primary=level?(bottle?()=>setDialog({type:'stock-action',id:bottle.id}):open):f.tracking==='durable'||!live.length?open:()=>setDialog({type:'use-stock',ids:g.rows.map(x=>x.id)});
 const low=entryLow(g);
 return e('article',{className:'stock-card'},e('button',{type:'button',className:'card-art-button',onClick:open,'aria-label':'Open '+name},e(Art,{file:entryArt(s,g)})),e('div',{className:'stock-copy'},
  e('div',{className:'card-title'},e('button',{type:'button',className:'title-link',onClick:open},e('h3',null,name)),e(Badge,{tone:low||info?.overdue?'amber':''},level?(info?LASTING_LABEL[info.state]:'Finished'):KIND_LABEL[f.tracking]||'Counted')),
  g.item?.brand&&e('small',{className:'brand-line'},g.item.brand),
  e('strong',{className:'stock-amount'},level?(info?(info.state==='unopened'?displayQty(live.length,bottle.unit)+(live.length>1?', none open yet':', not open yet'):lastingText(info)):'Finished'):amountLine(f)),
  level?e(React.Fragment,null,info&&e(LastingBar,{info}),e('p',{className:'muted'},[info&&info.state!=='unopened'&&info.opened?'Opened '+prettyDate(info.opened):info&&info.state==='unopened'?'Lasts about '+info.lasts+' months once opened':'',spares?spares+(spares===1?' spare, unopened':' spares, unopened'):''].filter(Boolean).join(' · '))):
   e(React.Fragment,null,!f.mixed&&f.tracking==='count'&&e(UnitDots,{left:f.left,total:f.total}),!f.mixed&&f.tracking==='measured'&&f.total>0&&e('div',{className:'lasting-bar'},e('span',{style:{width:Math.round(f.left/f.total*100)+'%'}})),e('p',{className:'muted'},g.rows.some(r=>r.source==='resource'&&r.availableMonth&&r.remaining>0)?shareText(live,m):(live[0]?.location||''))),
  g.purchaseFiltered&&e(PurchaseMeta,{state:s,g}),reserved>0&&e('small',{className:'stock-foot'},displayQty(reserved,f.unit)+' kept for a planned meal'),
  e('div',{className:'inline-actions'},e(Btn,{small:true,kind:'primary',onClick:primary},level?'Update':f.tracking==='durable'||!live.length?'Open':'Use'),e(Btn,{small:true,onClick:open},'History'))));
}
const USE_LABEL={repack:'Portions changed',correct:'Amount at home corrected',plan:'Monthly plan changed',use:'Used',waste:'Thrown away',return:'Returned',open:'Opened',half:'About half left',low:'Running low',finish:'Finished',touch:'Used without measuring',ate:'Ate',retire:'No longer kept'};
function usageKind(x){return x.kind==='meal'?'meal':x.action==='retire'?'waste':x.action==='waste'?'waste':x.fromMonth?'later':['open','half','low','touch'].includes(x.action)?'soft':'';}
function usageText(x){
 if(x.kind==='meal')return {title:x.name,sub:'Ate · '+({breakfast:'Breakfast',lunch:'Lunch',dinner:'Dinner',snack:'Snack'}[x.slot]||'Meal')};
 const bits=[x.action==='retire'?keepLabel(x.reason):USE_LABEL[x.action]||x.action];if(x.amount&&['use','waste','return'].includes(x.action))bits[0]+=' '+displayQty(x.amount,x.unit);
 if(x.meal)bits.push('for '+x.meal);if(x.fromMonth)bits.push('from '+monthShort(x.fromMonth)+'’s share');
 return {title:niceName(x.name),sub:bits.join(' · ')};
}
// A month of what was used, opened, thrown away or eaten.
function UsageCalendar({state:s,month:m,setDialog}){
 const today=isoDate(new Date()),[picked,setPicked]=useState(()=>dateMonth(today)===m?today:null);
 const log=usageLog(s).filter(x=>dateMonth(x.date)===m&&x.action!=='plan'&&x.action!=='correct'),byDay={};for(const x of log)(byDay[x.date]=byDay[x.date]||[]).push(x);
 const weeks=getWeeks(m),items=log.filter(x=>x.kind==='stock'&&['use','finish'].includes(x.action)).length,meals=log.filter(x=>x.kind==='meal').length,borrowed=log.filter(x=>x.fromMonth).length,wasted=log.filter(x=>x.action==='waste').length;
 const dayRows=picked?(byDay[picked]||[]):[];
 return e('section',{className:'surface calendar-panel usage-panel'},
  e(SectionTitle,{title:'What I used',note:monthLabel(m)+' · '+[items+(items===1?' thing used':' things used'),meals+(meals===1?' meal eaten':' meals eaten'),borrowed?borrowed+' from later months':'',wasted?wasted+' thrown away':''].filter(Boolean).join(' · '),action:e(Btn,{kind:'primary',icon:'plus',onClick:()=>setDialog({type:'use-stock',date:picked||today})},'I used something')}),
  e('div',{className:'cal-grid'},['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>e('span',{className:'cal-head',key:d},d)),
   weeks.flat().map((d,i)=>{const xs=byDay[d.date]||[];return e('button',{key:d.date+i,type:'button',disabled:!d.inMonth,className:'cal-day usage-day'+(d.inMonth?'':' out')+(d.date===today?' today':'')+(picked===d.date?' picked':''),style:{animationDelay:Math.min(i,34)*12+'ms'},'aria-label':d.date+', '+(xs.length?xs.length+' entries':'nothing recorded'),onClick:()=>setPicked(picked===d.date?null:d.date)},
    e('span',{className:'cal-num'},d.day),xs.length>0&&e('span',{className:'use-dots'},xs.slice(0,5).map((x,j)=>e('i',{key:j,className:usageKind(x)}))),xs.length>0&&e('span',{className:'cal-amt'},xs.length+(xs.length===1?' entry':' entries')));})),
  e('div',{className:'use-legend'},[['','Used'],['meal','Meal eaten'],['later','From a later month'],['soft','Opened or a little'],['waste','Thrown away']].map(([k,l])=>e('span',{key:l},e('i',{className:k}),l))),
  picked?e('div',{className:'cal-day-detail'},e('strong',null,prettyDate(picked,{weekday:'long',day:'numeric',month:'long'})),
   dayRows.length?dayRows.map(x=>{const t=usageText(x);return e('div',{className:'usage-line',key:x.id},e('i',{className:'dot '+usageKind(x)}),e('div',null,e('strong',null,t.title),e('small',null,t.sub)),x.kind==='meal'&&e(Btn,{small:true,onClick:()=>setDialog({type:'meal-detail',id:x.mealId})},'Open'));}):e('p',{className:'muted'},'Nothing recorded on this day.'),
   e(Btn,{onClick:()=>setDialog({type:'use-stock',date:picked})},'I used something on this day'))
  :e('p',{className:'muted cal-hint'},'Tap a day to see what was used, opened or eaten.'));
}
function StockV2(p){
 const {state:s,selectedMonth:m,setDialog}=p,view=['left','cupboard','history','used','plan'].includes(p.route?.view)?p.route.view:'left',setView=v=>p.go({view:v});
 const [search,setSearch]=useState(''),[filter,setFilter]=useState('available'),[filterTouched,setFilterTouched]=useState(false),[scope,setScope]=useState('all'),[layout,setLayout]=useLocalPref('everyday_food_layout','cards');
 const [shop,setShop]=useState(''),[categoryId,setCategoryId]=useState(''),[group,setGroup]=useState('all'),[typeId,setTypeId]=useState(''),[deep,setDeep]=useState(false);
 const [period,setPeriod]=useState('all'),[from,setFrom]=useState(''),[to,setTo]=useState('');
 const all=catalogueEntries(s),shops=new Map();for(const g of all)for(const r of g.rows){const x=stockPurchase(s,r);if(x.shop&&!shops.has(x.shopKey))shops.set(x.shopKey,x.shop);}
 const q=search.trim().toLowerCase(),inMonth=r=>r.source==='lot'||!r.availableMonth||r.tracking==='level'||inPlanningMonth(s.resources.find(x=>x.id===r.id),m);
 const scoped=all.map(g=>({...g,rows:scope==='all'?g.rows:g.rows.filter(inMonth)})).filter(g=>g.rows.length);
 const catOf=g=>g.item?.categoryId||g.rows[0]?.categoryId,inGroup=g=>group==='all'||category(s,catOf(g)).group===group;
 const used=s.categories.filter(c=>!c.archived&&(group==='all'||c.group===group)).sort((a,b)=>a.name.localeCompare(b.name));
 const categoryOptions=[['','All categories'],...(group==='all'?[...new Set(used.map(c=>c.group))].sort().map(k=>[k,used.filter(c=>c.group===k).map(c=>[c.id,c.name])]):used.map(c=>[c.id,c.name]))];
 // Everything that passes every filter except where you are in the tree.
 // A search looks through everything, even what is finished, unless you picked a Show filter yourself.
 const showing=q&&filter==='available'&&!filterTouched?'all':filter;
 const base=filterStockPurchases(s,scoped.filter(inGroup),{shop,categoryId,period,from,to}).filter(g=>{const home=g.rows.some(r=>r.remaining>0);
  return (!q||matchesWords(entryHaystack(s,g),q))&&(showing==='all'||(showing==='low'?entryLow(g):showing==='kept'?g.rows.some(r=>r.tracking==='durable'):showing==='available'?home:!home));});
 const entryTypes=new Map(base.map(g=>[g.key,entryTypeId(s,g)]));
 // Walk the tree from where you are: each child that holds something becomes a card.
 const here=[],kids=new Map();
 for(const g of base){
  const path=typePath(s,entryTypes.get(g.key)).map(n=>n.id),at=typeId?path.indexOf(typeId):-1;
  if(typeId&&at<0)continue;
  const child=path[at+1];
  if(child&&!q)kids.set(child,[...(kids.get(child)||[]),g]);else here.push(g);
 }
 // A search looks across the whole cupboard, not only where you are standing in the tree.
 const inside=typeId&&!q?base.filter(g=>typeDescendants(s,typeId).has(entryTypes.get(g.key))):base;
 const shown=(q||deep?inside:here).sort((a,b)=>entryName(a).localeCompare(entryName(b)));
 if(!q)for(const node of typeChildren(s,typeId)){
  const cats=[node,...typeList(s).filter(n=>typeDescendants(s,node.id).has(n.id))].map(n=>n.categoryId);
  if((group==='all'||cats.some(id=>category(s,id).group===group))&&(!categoryId||cats.includes(categoryId))&&!kids.has(node.id))kids.set(node.id,[]);
 }
 const cards=[...kids.entries()].map(([id,list])=>({node:typeNode(s,id),list})).filter(x=>x.node).sort((a,b)=>a.node.name.localeCompare(b.node.name));
 // Things you keep (a wok, a carrier bag) sit apart from what gets used up, unless you asked to see only them.
 const keptOnly=g=>g.rows.length>0&&g.rows.every(r=>r.tracking==='durable'),splitKept=showing!=='kept';
 const shownUse=splitKept?shown.filter(g=>!keptOnly(g)):shown,shownKept=splitKept?shown.filter(keptOnly):[];
 const cardsUse=splitKept?cards.filter(c=>!c.list.length||!c.list.every(keptOnly)):cards,cardsKept=splitKept?cards.filter(c=>c.list.length&&c.list.every(keptOnly)):[];
 const typeGrid=list=>e('div',{className:'type-grid'},list.map(({node,list})=>e('button',{type:'button',className:'type-card',key:node.id,onClick:()=>goType(node.id)},
  e(Art,{file:typeArt(s,node),className:'type-card-art'}),
  e('span',null,e('strong',null,node.name),e('small',null,!list.length?'0 products':list.length+(list.length===1?' product · ':' products · ')+(list.every(keptOnly)?list.flatMap(g=>g.rows).filter(r=>r.remaining>0).length+' kept':atHome(list)))))));
 const entryList=list=>layout==='list'?e('div',{className:'surface stock-list'},list.map(g=>e(EntryRow,{key:g.key,state:s,g,m,setDialog}))):e('div',{className:'stock-grid'},list.map(g=>e(EntryCard,{key:g.key,state:s,g,m,setDialog})));
 const atHome=list=>{const rows=list.flatMap(g=>g.rows).filter(r=>r.remaining>0),units=new Set(rows.map(r=>unitKey(r.unit)));
  return rows.length?(units.size===1?displayQty(+rows.reduce((n,r)=>n+r.remaining,0).toFixed(2),rows[0].unit):list.filter(g=>g.rows.some(r=>r.remaining>0)).length+' products at home'):'none at home';};
 const active=!!(q||shop||categoryId||typeId||group!=='all'||period!=='all'||filter!=='available'||scope!=='all'),invalid=period==='range'&&from&&to&&from>to;
 const reset=()=>{setSearch('');setShop('');setCategoryId('');setGroup('all');setTypeId('');setDeep(false);setPeriod('all');setFrom('');setTo('');setFilter('available');setFilterTouched(false);setScope('all');};
 const goType=id=>{setTypeId(id);setDeep(false);};
 return e(React.Fragment,null,e(PageHeading,{title:'Food & supplies',action:e(Btn,{kind:'primary',icon:'plus',onClick:()=>setDialog({type:'stock',prefill:typeId?{typeId,categoryId:typeNode(s,typeId)?.categoryId}:{}})},'Add stock')}),e('div',{className:'page-tabs'},e(Segment,{label:'Stock view',value:view,onChange:setView,options:[['left','What’s left'],['cupboard','Browse by category'],['history','Weekly history'],['used','Monthly history'],['plan','Monthly plan']]})),
 e('p',{className:'stock-source-note'},'What you own, including portions saved for later months. Catalogue references do not add stock.'),
 view==='left'?e(RemainingStock,p):view==='plan'?e(AllocationPlan,p):view==='history'?e(WeeklyHistory,{...p,key:m+'-'+(p.route.week||'')}):view==='used'?e(UsageCalendar,{state:s,month:m,setDialog,key:m}):
 e(React.Fragment,null,e('div',{className:'cupboard-tools'},
  e(CategoryShelf,{state:s,value:group,onChange:v=>{setGroup(v);setCategoryId('');goType('');}}),
  e('div',{className:'cupboard-search-row'},e('label',{className:'cupboard-search'},e(Icon,{name:'search',size:18}),e('input',{type:'search',value:search,onChange:ev=>setSearch(ev.target.value),placeholder:'Search food, kinds and categories','aria-label':'Search your cupboard'})),e('div',{className:'cupboard-count'},e('span',{role:'status'},inside.length+(inside.length===1?' item':' items')),active&&e('button',{type:'button',className:'text-link',onClick:reset},'Clear all')),e(Segment,{label:'Layout',value:layout,onChange:setLayout,options:[['cards','Cards'],['list','List']]})),
  !q&&e('div',{className:'catalogue-bar'},e(TypeTrail,{state:s,id:typeId,onPick:goType,root:group==='all'?'Everything':group}),
   typeId&&e('div',{className:'inline-actions'},cards.length>0&&e(Btn,{small:true,onClick:()=>setDeep(!deep)},deep?'By kind':'Show all '+inside.length),e(Btn,{small:true,onClick:()=>setDialog({type:'product-type',id:typeId})},'Edit this kind'))),
  e('div',{className:'cupboard-filters',role:'group','aria-label':'Filters'},
   e(PillSelect,{label:'Category',value:categoryId,onChange:setCategoryId,options:categoryOptions}),
   e(PillSelect,{label:'Shop',value:shop,onChange:setShop,options:[['','Any shop'],...[...shops].sort((a,b)=>a[1].localeCompare(b[1])),['__unknown','Not recorded']]}),
   e(PillSelect,{label:'Bought',value:period,defaultValue:'all',onChange:setPeriod,options:[['all','Any time'],['today','Today'],['week','This week'],['month','This month'],['range','Choose dates…'],['unknown','Not recorded']]}),
   period==='range'&&e('div',{className:'pill-dates'},e('input',{type:'date','aria-label':'Bought from',value:from,max:to||undefined,onChange:ev=>setFrom(ev.target.value)}),e('span',null,'to'),e('input',{type:'date','aria-label':'Bought through',value:to,min:from||undefined,onChange:ev=>setTo(ev.target.value)})),
   e(PillSelect,{label:'Show',value:showing,defaultValue:'available',onChange:v=>{setFilter(v);setFilterTouched(true);},options:[['available','At home'],['low','Running low'],['kept','Things I keep'],['finished','Finished'],['all','Everything']]}),
   e(PillSelect,{label:'Months',value:scope,defaultValue:'all',onChange:setScope,options:[['all','All months'],['month','Only '+monthLabel(m)]]})),
  q&&e('p',{className:'muted search-note'},[typeId?'Searching the whole cupboard':'',showing==='all'&&filter==='available'?'including what is finished or put away':''].filter(Boolean).join(', ')||'Searching your cupboard'),
  invalid&&e(ErrorMessage,{error:'The end date must be on or after the start date.'}),
  (shop==='__unknown'||period==='unknown')&&shown.length>0&&e('div',{className:'cupboard-hint'},e('span',null,'These have no shop or date yet.'),e(Btn,{small:true,kind:'primary',onClick:()=>setDialog({type:'purchase-details',items:shown.map(g=>{const rows=g.rows.filter(r=>!stockPurchase(s,r).fromReceipt),facts=rows.map(r=>stockPurchase(s,r)),shopNames=[...new Set(facts.map(x=>x.shop).filter(Boolean))],dates=[...new Set(facts.map(x=>x.date).filter(Boolean))].sort();return {key:g.key,name:entryName(g),ids:rows.map(r=>r.id),current:[shopNames.join(', ')||'Shop not recorded',dates.length?prettyDate(dates[0])+(dates.length>1?' – '+prettyDate(dates.at(-1)):''):'Date not recorded'].join(' · ')};})})},'Record shop & date'))),
 !q&&!deep&&cardsUse.length>0&&typeGrid(cardsUse),
 shownUse.length>0&&e(React.Fragment,null,
  !q&&!deep&&cardsUse.length>0&&typeId&&e('h3',{className:'catalogue-group-head'},'Also in '+typeNode(s,typeId).name,e('span',null,shownUse.length)),
  entryList(shownUse)),
 (cardsKept.length>0&&!q&&!deep||shownKept.length>0)&&e('section',{className:'kept-section'},
  e('h3',{className:'catalogue-group-head'},'Things you keep',e('span',null,'Owned · paid for once, never used up')),
  e('p',{className:'muted kept-note'},'Like an umbrella: it stays here until you say it broke, got lost or went in the bin. Nothing here counts as food or supplies running out.'),
  !q&&!deep&&cardsKept.length>0&&typeGrid(cardsKept),
  shownKept.length>0&&entryList(shownKept)),
 !shown.length&&!cards.length&&!invalid&&e(Empty,{icon:'box',title:q?'Nothing matches':'Nothing here yet',action:active&&e(Btn,{onClick:reset},'Clear filters')},q?'Try another word, or check the Show filter.':'Add stock, or choose another shelf.')));
}

function PurchaseMeta({state:s,g}){const facts=g.rows.map(r=>stockPurchase(s,r)),shops=[...new Set(facts.map(x=>x.shop).filter(Boolean))],dates=[...new Set(facts.map(x=>x.date).filter(Boolean))].sort();return e('small',{className:'purchase-meta'},[shops.join(', ')||'Shop not recorded',dates.length?(dates.length===1?prettyDate(dates[0]):prettyDate(dates[0])+' – '+prettyDate(dates.at(-1))):'Date not recorded'].join(' · '));}
const SLOTS=[['breakfast','Breakfast'],['lunch','Lunch'],['dinner','Dinner'],['snack','Snack']];
function mealStatus(meal){if(meal.status==='cooked')return 'Eaten';if(meal.status==='skipped')return 'Skipped';if(meal.missing?.length)return meal.missing.length+' still needed';return (meal.reservations?.length||meal.touches?.length)?'From your cupboard':'Planned';}
function MealDay({state:s,day,setDialog}){
 const meals=s.mealEntries.filter(x=>x.date===day.date),legacy=s.meals[day.date]||{},today=isoDate(new Date());
 return e('section',{className:'meal-day '+(day.date===today?'today':'')},e('div',{className:'meal-date'},e('small',null,day.label),e('strong',null,day.day)),
  SLOTS.map(([slot,label])=>{const here=meals.filter(x=>(x.slot||'dinner')===slot),old=legacy[slot];return e('div',{className:'meal-slot'+(here.length||old?' filled':''),key:slot},
   e('div',{className:'slot-head'},e('small',null,label),e('button',{type:'button',className:'slot-add','aria-label':'Add '+label.toLowerCase()+' on '+prettyDate(day.date),onClick:()=>setDialog({type:'meal',date:day.date,slot})},'+')),
   here.map(meal=>e('button',{type:'button',className:'meal-note '+meal.status,key:meal.id,onClick:()=>setDialog({type:'meal-detail',id:meal.id})},e('strong',null,meal.name),e('span',null,mealStatus(meal)))),
   old&&e('button',{type:'button',className:'meal-note legacy',onClick:()=>setDialog({type:'day',date:day.date})},e('strong',null,old),e('span',null,'Original plan')));}));
}
function isFood(s,r){return r.source==='lot'?category(s,r.categoryId).pool==='grocery':s.resources.find(x=>x.id===r.id)?.category==='Food';}
function CupboardStarters({state:s,month:m,setDialog}){
 const food=stockGroups(stockRows(s).filter(r=>r.remaining-reservedAmount(s,r.id)>0&&r.tracking!=='durable'&&r.tracking!=='level'&&isFood(s,r)));
 const soon=g=>Math.min(...g.rows.map(x=>(x.availableMonth||m)<=m?0:1));food.sort((a,b)=>soon(a)-soon(b));
 return e('section',{className:'surface cook-stock'},e(Art,{file:'detail:mealprep',className:'cook-stock-art'}),e(SectionTitle,{title:'Available ingredients',note:''}),
  e('div',{className:'stock-chips'},food.slice(0,18).map(g=>e('button',{key:g.key,type:'button',onClick:()=>setDialog({type:'meal',pick:{key:g.key,name:g.row.name,unit:g.row.unit,tracking:g.row.tracking,ids:g.rows.map(x=>x.id)}})},niceName(g.row.name)+' +'))),
  null);
}
function MoneyV2(p){
 const {state:s,selectedMonth:m,setDialog,act}=p,f=forecast(s,m),entries=ledger(s).filter(x=>dateMonth(x.date)===m).sort((a,b)=>b.date.localeCompare(a.date)),view=['overview','goals','subscriptions'].includes(p.route?.view)?p.route.view:'overview',setView=v=>p.go({view:v});
 const categories=[...new Set(entries.map(x=>x.categoryId||x.category))].map(id=>({id,name:s.categories.find(c=>c.id===id)?.name||id,amount:entries.filter(x=>(x.categoryId||x.category)===id).reduce((n,x)=>n+Math.round(x.amount*100),0)}));
 const unresolved=entries.filter(x=>x.categoryId&&category(s,x.categoryId).pool==='unresolved').reduce((n,x)=>n+Math.round(x.amount*100),0);
 return e(React.Fragment,null,e(PageHeading,{eyebrow:'',title:'Money & saving',action:e(Btn,{onClick:()=>setDialog({type:'budget'})},'Monthly allowance')},''),e('div',{className:'page-tabs'},e(Segment,{label:'Money view',value:view,onChange:setView,options:[['overview','My month'],['goals','Saving goals'],['subscriptions','Subscriptions']]})),
 view==='overview'&&e(React.Fragment,null,null,e(SpendingCalendar,{state:s,month:m,onAdd:d=>setDialog({type:'receipt',date:d}),onOpen:x=>setDialog(transactionDialog(x))}),e('div',{className:'money-grid'},e('section',{className:'money-main'},e('span',{className:'eyebrow'},monthLabel(m)),e('span',null,'Actual balance'),e('strong',null,s.budgets[m]?money(f.totalRemaining):'No allowance set'),e('p',null,money(f.baseTotal)+' base − '+money(f.carryIn)+' earlier overspend − '+money(f.totalSpent)+' spent'),(()=>{const due=subscriptionsDue(s,m);return due.length?e('p',{className:'sub-note'},'Still to renew this month: '+due.map(x=>x.sub.name+' '+prettyDate(x.date)).join(', ')+' · '+pounds(due.reduce((n,x)=>n+x.sub.costPence,0))):null;})(),e(Meter,{value:f.totalSpent+f.carryIn,max:f.baseTotal,label:'Allowance used'}),f.carryOut>0&&e('p',null,carryForwardText(s,f))),e('section',{className:'surface forecast-card'},e(SectionTitle,{title:'Forecast',action:e(Btn,{small:true,onClick:()=>setDialog({type:'intention'})},'Set intention')}),[['Shopping plans',f.plannedPence],['Upcoming subscriptions',f.subscriptionPence],['I’d like to leave unspent',f.intentionPence]].map(([label,n])=>e('div',{className:'summary-line',key:label},e('span',null,label),e('b',null,pounds(n)))),e('div',{className:'forecast-total'},e('span',null,'After plans & intention'),e('strong',null,pounds(f.projectedPence))),e('small',null,f.unknown?f.unknown+' planned items still need a price.':'Plans and intentions do not count as paid spending.'))),
 e('div',{className:'two-col'},e('section',{className:'surface'},e(SectionTitle,{title:'Where it went',action:e(Btn,{small:true,onClick:()=>setDialog({type:'targets'})},'Category targets')}),unresolved>0&&e('p',{className:'error-box'},pounds(unresolved)+' awaits categorisation. It counts in total spending.'),categories.map(c=>{const target=s.categoryTargets[m]?.[c.id];return e('div',{className:'category-breakdown',key:c.id},e('div',null,e('span',null,c.name),e('b',null,pounds(c.amount)+(target?' / '+pounds(target):''))),e(Meter,{value:Math.max(0,c.amount),max:target||Math.max(1,Math.round(f.totalSpent*100)),label:c.name+' spending'}));}),!entries.length&&null,e('p',{className:'muted'},'Groceries: '+money(f.grocerySpent)+(s.budgets[m]?.grocery==null?' · shared allowance':' of '+money(s.budgets[m]?.grocery)+' ceiling'))),e('section',{className:'surface'},e(SectionTitle,{title:'Monthly summary'}),e('ul',{className:'review-list'},e('li',null,s.lists.filter(l=>dateMonth(l.date)===m).flatMap(l=>l.lines).filter(x=>x.status==='planned'&&x.priority==='optional').length+' optional purchases to revisit.'),e('li',null,s.stockEvents.filter(x=>x.action==='waste'&&dateMonth(x.date)===m).length+' waste records this month.'),e('li',null,s.subscriptions.filter(x=>!x.paused).length+' active subscriptions to review.'),e('li',null,s.mealEntries.filter(x=>x.status==='cooked'&&dateMonth(x.date)===m).length+' meals marked cooked.')))),
 e('section',{className:'surface ledger-panel'},e(SectionTitle,{title:'Purchases',note:'',action:e('div',{className:'ledger-actions'},e(Btn,{icon:'back',onClick:()=>setDialog({type:'money-back'})},'Money back'),e(Btn,{kind:'primary',icon:'plus',onClick:()=>setDialog({type:'receipt'})},'Add purchase'))}),groupedLedger(entries,s).map(x=>e(LedgerRow,{key:x.id,state:s,x,onOpen:x=>setDialog(transactionDialog(x))})),!entries.length&&e('p',{className:'empty-copy'},'Nothing recorded this month yet.'))) ,
 view==='goals'&&e(React.Fragment,null,e('div',{className:'collection-banner'},e('div',null,null,e('h2',null,'Saving goals'),null,e(Btn,{kind:'primary',onClick:()=>setDialog({type:'goal'})},'Create a saving goal')),e(Art,{file:'Savings goal05.png'})),e('div',{className:'goal-grid'},s.goals.map((g,index)=>{const saved=g.contributions.reduce((n,c)=>n+c.pence,0);return e('article',{className:'surface goal-card',key:g.id},e(Art,{file:goalArt(g,index)}),e('h2',null,g.name),e('strong',null,pounds(saved),e('small',null,' of '+pounds(g.targetPence))),e(Meter,{value:saved,max:g.targetPence,label:g.name+' progress'}),g.date&&e('p',{className:'muted'},'Target date: '+prettyDate(g.date)),e('div',{className:'inline-actions'},e(Btn,{kind:'primary',onClick:()=>setDialog({type:'contribution',id:g.id})},'I put money aside'),e(Btn,{onClick:()=>setDialog({type:'goal',id:g.id})},'Edit')),g.contributions.length>0&&e('details',null,e('summary',null,'Contribution history'),g.contributions.map(c=>e('div',{className:'plain-row',key:c.id},e('span',null,c.date+' · '+pounds(c.pence)),e(Btn,{small:true,onClick:()=>act(st=>({...st,goals:st.goals.map(x=>x.id===g.id?{...x,contributions:x.contributions.filter(a=>a.id!==c.id)}:x)}),'Contribution removed')},'Remove')))));})),!s.goals.length&&null),
 view==='subscriptions'&&e('div',{className:'two-col'},e('section',{className:'surface'},e(SectionTitle,{title:'Subscriptions',note:s.subscriptions.length?'About '+pounds(Math.round(s.subscriptions.reduce((n,x)=>n+monthlyCost(x),0)))+' a month, taken off each month’s allowance on the renewal day.':'',action:e(Btn,{kind:'primary',onClick:()=>setDialog({type:'subscription'})},'Add subscription')}),[...s.subscriptions].sort((a,b)=>a.nextDue.localeCompare(b.nextDue)).map(x=>e('article',{className:'subscription-row',key:x.id},e('div',null,e('h3',null,x.name),e('small',null,pounds(x.costPence)+' · '+({monthly:'every month',yearly:'every year',weekly:'every week'}[x.interval]||x.interval)+' · '+(x.paused?'Paused':(x.auto===false?'Next due ':'Renews ')+prettyDate(x.nextDue,{day:'numeric',month:'long'})+(x.auto===false?'':' · taken off automatically')))),e('div',{className:'inline-actions'},e(Btn,{small:true,onClick:()=>setDialog({type:'subscription',id:x.id})},'Edit'),!x.paused&&x.auto===false&&e(Btn,{small:true,kind:'primary',onClick:()=>setDialog({type:'pay-subscription',id:x.id})},'Confirm paid')))),!s.subscriptions.length&&e(Empty,{title:'No subscriptions'},'')),e('aside',{className:'art-aside'},e(Art,{file:ART.subscriptions}),e('p',null,'Pausing here does not cancel the subscription with its provider.'))));
}
function MealsV2(p){
 const {state:s,selectedMonth:m,setDialog,act}=p,view=['week','recipes','original'].includes(p.route?.view)?p.route.view:'week',setView=v=>p.go({view:v}),[week,setWeek]=useState(()=>Math.max(0,getWeeks(m).findIndex(w=>w.some(d=>d.date===isoDate(new Date())))));
 useEffect(()=>{const i=getWeeks(m).findIndex(w=>w.some(d=>d.date===isoDate(new Date())));setWeek(Math.max(0,i));},[m]);
 const weeks=getWeeks(m),days=weeks[Math.min(week,weeks.length-1)],recipes=s.recipes.filter(r=>!r.archived);
 return e(React.Fragment,null,e(PageHeading,{eyebrow:'',title:'Meals & recipes',action:e(Btn,{kind:'primary',icon:'plus',onClick:()=>setDialog({type:'meal'})},'Add a meal')},''),e('div',{className:'page-tabs'},e(Segment,{label:'Meals view',value:view,onChange:setView,options:[['week','This week'],['recipes','My recipes'],['original','Original calendar']]})),
 view==='original'?e(Planner,p):view==='recipes'?e(React.Fragment,null,e('div',{className:'collection-banner recipe-banner'},e('div',null,null,e('h2',null,'Recipes'),null,e(Btn,{kind:'primary',onClick:()=>setDialog({type:'recipe'})},'Add a recipe')),e(Art,{file:'Main03.png'})),e('div',{className:'catalogue-grid'},recipes.map(r=>e('article',{className:'surface recipe-card',key:r.id},r.image?e(Art,{file:r.image}):e('div',{className:'recipe-placeholder'},e(Icon,{name:'leaf',size:32})),e('h2',null,r.name),e('p',{className:'muted'},r.servings+' servings'+(r.minutes?' · '+r.minutes+' minutes':'')),e('p',null,r.notes),e('div',{className:'inline-actions'},e(Btn,{onClick:()=>setDialog({type:'recipe',id:r.id})},'View / edit'),e(Btn,{kind:'primary',onClick:()=>setDialog({type:'meal',recipeId:r.id})},'Plan this')))))):
 e(React.Fragment,null,e('div',{className:'week-toolbar'},e(Btn,{disabled:week===0,onClick:()=>setWeek(week-1)},'← Previous'),e('strong',null,prettyDate(days[0].date)+' — '+prettyDate(days[6].date)),e(Btn,{disabled:week===weeks.length-1,onClick:()=>setWeek(week+1)},'Next →'),e(Btn,{onClick:()=>setDialog({type:'copy-week',dates:days.map(d=>d.date)})},'Copy week')),
 e('div',{className:'meal-week'},days.map(day=>e(MealDay,{key:day.date,state:s,day,setDialog}))),e(CupboardStarters,{state:s,month:m,setDialog})));
}
function SettingsV2(p){
 const {state:s,setDialog,act}=p,[group,setGroup]=useState('categories');
 function importFile(ev){const file=ev.target.files?.[0];if(!file)return;file.text().then(raw=>{try{const input=JSON.parse(raw),data=migrateV4(input.state||input);setDialog({type:'import-v4',data});}catch(err){setDialog({type:'error',message:err.message});}});ev.target.value='';}
 return e(React.Fragment,null,e(PageHeading,{eyebrow:'',title:'Settings & backups',action:e('a',{className:'button',href:'guide.html',target:'_blank',rel:'noreferrer'},'How to use Everyday')},''),e('div',{className:'two-col'},e('section',{className:'surface'},e(SectionTitle,{title:'Backups'}),e('p',null,'Changes are saved locally with automatic backups.'),e('div',{className:'inline-actions'},e(Btn,{onClick:()=>Download(s),icon:'download'},'Export everything'),e('label',{className:'button'},'Restore a backup',e('input',{type:'file',accept:'.json',className:'sr-only',onChange:importFile}))),e('p',{className:'muted'},'Restore previews the backup before replacing current data.')),e('section',{className:'surface'},e(SectionTitle,{title:'Spending from the old version'}),e('p',null,'Import missing purchases from the previous browser version.'),e(Btn,{kind:'primary',onClick:()=>setDialog({type:'import-old'})},'Bring in old spending')),e('section',{className:'surface'},e(Art,{file:'Main02.png',className:'settings-art'}),e(SectionTitle,{title:'Images'}),null,null,e(Btn,{onClick:()=>setDialog({type:'art-gallery'})},'Browse images'))),
 e('section',{className:'surface settings-categories'},e(SectionTitle,{title:'Categories',action:e(Btn,{kind:'primary',onClick:()=>setDialog({type:'category'})},'Add category')}),null,s.categories.map(c=>e('div',{className:'plain-row',key:c.id},e('div',null,e('strong',null,c.name),e('small',null,c.group+' · '+(c.pool==='unresolved'?'Pending categorisation':c.pool==='grocery'?'Within groceries':'Other spending')+(c.archived?' · Archived':''))),e(Btn,{small:true,onClick:()=>setDialog({type:'category',id:c.id})},'Edit'),c.id!=='uncategorised'&&e(Btn,{small:true,onClick:()=>act(st=>({...st,categories:st.categories.map(x=>x.id===c.id?{...x,archived:!x.archived}:x)}),'Category updated')},c.archived?'Restore':'Archive')))));
}

function CategoryShelf({state,value,onChange}){const groups=[['all','Everything','Main04.png'],['Fresh food','Fresh food',ART.fresh],['Pantry & freezer','Pantry & freezer',ART.pantry],['Snacks & drinks at home','Snacks & drinks',ART.snacks],['Household','Household',ART.household],['Personal care & beauty','Care & beauty',ART.care],['Clothes & accessories','Clothes',ART.clothes],['Too Good To Go','Too Good To Go',ART.tgtg],['Transport & cycling','Cycling',ART.bike]];return e('div',{className:'category-shelf',role:'group','aria-label':'Browse stock categories'},groups.map(([key,label,file])=>e('button',{key,className:value===key?'selected':'','aria-pressed':value===key,onClick:()=>onChange(key)},e(Art,{file}),e('span',null,label))));}

// A compact dropdown that reads like a chip ("Shop · Any shop"). It stays a native select for keyboards and screen readers.
function PillSelect({label,value,onChange,options,defaultValue=''}){
 const option=([v,t])=>e('option',{key:v,value:v},t);
 return e('label',{className:'pill-select'+(value!==defaultValue?' active':'')},e('span',{className:'pill-select-label'},label),
  e('select',{value,'aria-label':label,onChange:ev=>onChange(ev.target.value)},options.map(o=>Array.isArray(o[1])?e('optgroup',{key:o[0],label:o[0]},o[1].map(option)):option(o))),
  e(Icon,{name:'chevron',size:13}));
}

function CatalogueView(p){return e(CatalogueBrowser,p);}
