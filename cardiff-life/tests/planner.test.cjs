const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const P=require('../planner.js');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const data=JSON.parse(html.match(/<script type="application\/json" id="cardiff-data">([\s\S]*?)<\/script>/)[1]);
const today='2026-09-29';
const find=id=>data.events.find(e=>e.event_id===id);

test('Monday weeks survive year boundaries and British clock changes',()=>{
 assert.equal(P.monday('2027-01-01'),'2026-12-28');
 assert.equal(P.monday('2026-10-25'),'2026-10-19');
 assert.equal(P.addDays('2026-10-19',7),'2026-10-26');
 assert.equal(P.monday('2026-03-29'),'2026-03-23');
});
test('catalogue includes researched sports independently of shortlist ranking',()=>{
 // Counts follow the researched file, which grows with every search: the rule is tested, not one day's total.
 assert.equal(P.filter(data.events,{scope:'all'}, {},today,data.ranked).length,data.events.length);
 const sport=P.filter(data.events,{scope:'all',category:'sport'}, {},today,data.ranked);
 assert.equal(sport.length,data.events.filter(e=>e.activity==='sport').length);assert(sport.length>0);
 assert(sport.some(e=>e.event_id==='su-43429'));
 assert(!data.ranked.includes('su-43429'));
 assert.equal(P.filter(data.events,{scope:'shortlist'}, {},today,data.ranked).length,data.ranked.length);assert(data.ranked.length>0);
 assert.deepEqual(P.filter(data.events,{scope:'shortlist'}, {},today,data.ranked).map(e=>e.event_id),data.ranked);
});
test('free filter does not treat free membership or member-only tickets as free entry',()=>{
 assert(!P.free(find('su-43351')));
 assert(!P.free(find('aiwales-rag-2026-10-07')));
 assert(P.free(find('su-43441')));
 assert(!P.free(find('series-global-gardens-volunteering')));
});
test('week filtering leaves undated opportunities off calendar',()=>{
 const result=P.filter(data.events,{when:'week',week:'2026-10-05'}, {},today);
 assert(result.every(e=>e.date>='2026-10-05'&&e.date<='2026-10-11'));
 assert(result.some(e=>e.event_id==='su-43388'));
 assert(!result.some(e=>e.event_id==='series-global-gardens-volunteering'));
});
test('overlap checks real alternatives, adjacent sessions and overnight events',()=>{
 assert(P.overlaps(find('su-43270'),find('su-43426')));
 assert(!P.overlaps(find('su-43441'),find('su-43801')));
 const a={event_id:'a',date:'2026-10-24',start_time:'23:00',end_time:'01:00'};
 const b={event_id:'b',date:'2026-10-25',start_time:'00:30',end_time:'02:00'};
 assert(P.overlaps(a,b));assert(P.overlaps(b,a));
 assert(!P.overlaps(a,{...b,start_time:''}));
 assert(!P.overlaps(a,{...b,start_time:'00:00',end_time:'00:00'}));
});
test('inactive/past events remain in saved choices without being recommended',()=>{
 const e={...find('su-43429'),status:'cancelled'};
 assert.equal(P.filter([e],{scope:'all'},{},today).length,0);
 assert.equal(P.filter([e],{scope:'saved'},{[e.event_id]:{status:'going'}},today).length,1);
 assert.equal(P.filter([find('su-43429')],{scope:'saved'},{'su-43429':{status:'maybe'}},'2026-12-01').length,1);
});
test('backup validation accepts choices and rejects malformed/prototype keys',()=>{
 const backup={version:1,choices:{'su-43429':{status:'maybe',note:'Bring water',snapshot:find('su-43429')}}};
 const restored=P.validateBackup(JSON.parse(JSON.stringify(backup)));
 assert.equal(restored['su-43429'].note,'Bring water');
 assert.equal(restored['su-43429'].snapshot.date,'2026-10-04');
 assert.throws(()=>P.validateBackup({version:1,choices:{bad:{status:'booked'}}}));
 assert.throws(()=>P.validateBackup(JSON.parse('{"version":1,"choices":{"__proto__":{"status":"going"}}}')));
 assert.throws(()=>P.validateBackup({version:2,choices:{}}));
});

// A small DOM harness exercises the generated page's event wiring without a browser.
// It deliberately does not claim to verify layout or native browser file storage.
function boot(payload=data,saved=null){
 const ids=new Map(),nodes=[],handlers={},storage=new Map(saved?[['cardiff-life-choices-v1',saved]]:[]);
 let document;
 class Element{
  constructor(attrs={}){this.attrs=attrs;this.id=attrs.id;this.dataset={};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;this.hidden='hidden'in attrs;this.checked='checked'in attrs;this.value='';this.handlers={};this.isConnected=true;}
  set innerHTML(value){this._html=value;parse(value);}get innerHTML(){return this._html||'';}
  setAttribute(k,v){this.attrs[k]=v;}hasAttribute(k){return k in this.attrs;}
  addEventListener(k,fn){this.handlers[k]=fn;}
  closest(){return this;}focus(){document.activeElement=this;}
  showModal(){this.open=true;}close(){this.open=false;this.handlers.close?.();}
 }
 function parse(markup){for(const tag of markup.matchAll(/<(\w+)\b([^>]*)>/g)){const attrs={};for(const m of tag[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[m[1]]=m[2]??'';const e=new Element(attrs);nodes.push(e);if(e.id)ids.set(e.id,e);}}
 function matches(n,selector){const pairs=[...selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)];return pairs.length&&pairs.every(([,k,v])=>v===undefined?k in n.attrs:n.attrs[k]===v);}
 parse(html.split('<script')[0]);
 const d=new Element({id:'cardiff-data'});d.textContent=JSON.stringify(payload);ids.set(d.id,d);
 document={getElementById:id=>ids.get(id)||null,querySelectorAll:s=>nodes.filter(n=>matches(n,s)),querySelector:s=>nodes.find(n=>matches(n,s)),addEventListener:(k,fn)=>handlers[k]=fn,activeElement:null};
 const context={document,window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Intl,Date,console,setTimeout,Blob,URL};
 vm.runInNewContext(fs.readFileSync(path.join(root,'planner.js'),'utf8'),context);
 const click=dataset=>handlers.click({target:{dataset,closest(){return this;},hasAttribute:k=>k==='data-reset'&&dataset.reset!==undefined}});
 return {ids,storage,click};
}
test('generated UI boots, saves a choice/note and retains it through refreshed data',()=>{
 const app=boot();
 assert.equal((app.ids.get('week-grid').innerHTML.match(/class="day /g)||[]).length,7);
 // The page opens on what is still to come, by its own clock: as many cards as its own rule gives for today.
 const now=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London'}).format(new Date());
 assert.equal((app.ids.get('event-grid').innerHTML.match(/<article/g)||[]).length,P.filter(data.events,{scope:'all',category:'all',search:'',when:'all',source:'all',free:false,date:'',week:P.monday(now)},{},now,data.ranked).length);
 app.click({detail:'su-43429'});assert(app.ids.get('event-detail').open);
 app.click({choice:'maybe',id:'su-43429'});
 app.ids.get('personal-note').value='Bring water';
 app.ids.get('detail-body').handlers.click({target:{id:'save-note'}});
 const stored=app.storage.get('cardiff-life-choices-v1');
 assert.equal(JSON.parse(stored).choices['su-43429'].note,'Bring water');
 const refreshed=structuredClone(data);refreshed.events.find(e=>e.event_id==='su-43429').location='Updated venue';
 const reload=boot(refreshed,stored);
 reload.click({scope:'saved'});
 assert.equal((reload.ids.get('event-grid').innerHTML.match(/<article/g)||[]).length,1);
 assert.match(reload.ids.get('event-grid').innerHTML,/venue changed since you saved it/);
 reload.click({detail:'su-43429'});assert.equal(reload.ids.get('personal-note').value,'Bring water');
 reload.click({choice:'going',id:'su-43429'});
 assert.equal(JSON.parse(reload.storage.get('cardiff-life-choices-v1')).choices['su-43429'].status,'going');
 assert.equal(JSON.parse(reload.storage.get('cardiff-life-choices-v1')).choices['su-43429'].note,'Bring water');
});
test('cancelled and missing saved listings remain visible after an update',()=>{
 const backup=JSON.stringify({version:1,choices:{'su-43429':{status:'going',note:'Remember',snapshot:find('su-43429')}}});
 const missing=structuredClone(data);missing.events=missing.events.filter(e=>e.event_id!=='su-43429');
 const app=boot(missing,backup);app.click({scope:'saved'});
 assert.match(app.ids.get('event-grid').innerHTML,/Listing no longer in current research/);
 const cancelled=structuredClone(data);cancelled.events.find(e=>e.event_id==='su-43429').status='cancelled';
 const other=boot(cancelled,backup);other.click({scope:'saved'});assert.match(other.ids.get('event-grid').innerHTML,/cancelled/);
});
test('standalone HTML embeds data and script, without network dependencies',()=>{
 assert(data.events.length>0);assert.equal(new Set(data.events.map(e=>e.event_id)).size,data.events.length);assert(data.communities.length>0);
 assert(!/__CARDIFF_(DATA|SCRIPT)__/.test(html));
 assert(!/<script[^>]+src=/i.test(html));assert(!/<link[^>]+stylesheet/i.test(html));
 assert(!/url\s*\(/i.test(html.match(/<style>([\s\S]*?)<\/style>/)[1]));
});
