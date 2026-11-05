const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const P=require('../planner.js');
const root=path.join(__dirname,'..');
// The page, built by build_html.py from the made-up research in tests/fixture (a city called
// Riverford), in a temporary folder so nothing is written beside the code.
const built=fs.mkdtempSync(path.join(os.tmpdir(),'events-page-'));
fs.cpSync(path.join(__dirname,'fixture'),built,{recursive:true});
const report=JSON.parse(execFileSync(process.env.PYTHON||'python',[path.join(root,'build_html.py'),built],{encoding:'utf8'}));
const html=fs.readFileSync(path.join(built,'index.html'),'utf8');
fs.rmSync(built,{recursive:true,force:true});
const embedded=JSON.parse(html.match(/<script type="application\/json" id="events-data">([\s\S]*?)<\/script>/)[1]);
const KEY='events-choices-v1';
// Behaviour tests use fixed synthetic examples, independent of changing research/statuses.
const event=(event_id,extra={})=>({event_id,name:event_id,organiser:'Fixture organiser',date:'2026-10-04',start_time:'10:00',end_time:'11:00',location:'Fixture room',source_url:'https://example.org/'+event_id,activity:'social',category:'Fixture',status:'upcoming',cost:'Not stated',description:'Fixture activity',last_checked:'2026-09-29',community_id:'fixture',...extra});
const data={events:[
 event('swim-a',{activity:'sport'}),
 event('swim-b',{activity:'sport',cost:'GBP 3 nonmembers; free for members'}),
 event('talk-2026-10-07',{activity:'professional',date:'2026-10-07',cost:'Membership is free; event cost unknown'}),
 event('coffee',{date:'2026-10-02',cost:'Free'}),
 event('series-gardens-volunteering',{date:'',status:'recurring',activity:'volunteering'}),
 event('quiz',{date:'2026-10-06'}),
 event('lunch-a',{start_time:'12:00',end_time:'14:00'}),
 event('lunch-b',{start_time:'13:00',end_time:'15:00'}),
 event('tea',{date:'2026-10-02',start_time:'11:00',end_time:'12:00'})
],ranked:['coffee','quiz'],communities:[],featured:[],deadlines:[],schedules:[],built:'2026-09-29T12:00:00Z'};
class FixtureDate extends Date {
 constructor(...args){super(...(args.length?args:['2026-09-29T12:00:00Z']));}
 static now(){return Date.parse('2026-09-29T12:00:00Z');}
}

const today='2026-09-29';
const find=id=>data.events.find(e=>e.event_id===id);

test('Monday weeks survive year boundaries and British clock changes',()=>{
 assert.equal(P.monday('2027-01-01'),'2026-12-28');
 assert.equal(P.monday('2026-10-25'),'2026-10-19');
 assert.equal(P.addDays('2026-10-19',7),'2026-10-26');
 assert.equal(P.monday('2026-03-29'),'2026-03-23');
});
test('catalogue includes researched sports independently of shortlist ranking',()=>{
 assert.equal(P.filter(data.events,{scope:'all'}, {},today,data.ranked).length,9);
 const sport=P.filter(data.events,{scope:'all',category:'sport'}, {},today,data.ranked);
 assert.equal(sport.length,2);
 assert(sport.some(e=>e.event_id==='swim-a'));
 assert(!data.ranked.includes('swim-a'));
 assert.equal(P.filter(data.events,{scope:'shortlist'}, {},today,data.ranked).length,2);
 assert.deepEqual(P.filter(data.events,{scope:'shortlist'}, {},today,data.ranked).map(e=>e.event_id),data.ranked);
});
test('free filter does not treat free membership or member-only tickets as free entry',()=>{
 assert(!P.free(find('swim-b')));
 assert(!P.free(find('talk-2026-10-07')));
 assert(P.free(find('coffee')));
 assert(!P.free(find('series-gardens-volunteering')));
});
test('week filtering leaves undated opportunities off calendar',()=>{
 const result=P.filter(data.events,{when:'week',week:'2026-10-05'}, {},today);
 assert(result.every(e=>e.date>='2026-10-05'&&e.date<='2026-10-11'));
 assert(result.some(e=>e.event_id==='quiz'));
 assert(!result.some(e=>e.event_id==='series-gardens-volunteering'));
});
test('overlap checks real alternatives, adjacent sessions and overnight events',()=>{
 assert(P.overlaps(find('lunch-a'),find('lunch-b')));
 assert(!P.overlaps(find('coffee'),find('tea')));
 const a={event_id:'a',date:'2026-10-24',start_time:'23:00',end_time:'01:00'};
 const b={event_id:'b',date:'2026-10-25',start_time:'00:30',end_time:'02:00'};
 assert(P.overlaps(a,b));assert(P.overlaps(b,a));
 assert(!P.overlaps(a,{...b,start_time:''}));
 assert(!P.overlaps(a,{...b,start_time:'00:00',end_time:'00:00'}));
});
test('inactive/past events remain in saved choices without being recommended',()=>{
 const e={...find('swim-a'),status:'cancelled'};
 assert.equal(P.filter([e],{scope:'all'},{},today).length,0);
 assert.equal(P.filter([e],{scope:'saved'},{[e.event_id]:{status:'going'}},today).length,1);
 assert.equal(P.filter([find('swim-a')],{scope:'saved'},{'swim-a':{status:'maybe'}},'2026-12-01').length,1);
});
test('backup validation accepts choices and rejects malformed/prototype keys',()=>{
 const backup={version:1,choices:{'swim-a':{status:'maybe',note:'Bring water',snapshot:find('swim-a')}}};
 const restored=P.validateBackup(JSON.parse(JSON.stringify(backup)));
 assert.equal(restored['swim-a'].note,'Bring water');
 assert.equal(restored['swim-a'].snapshot.date,'2026-10-04');
 assert.throws(()=>P.validateBackup({version:1,choices:{bad:{status:'booked'}}}));
 assert.throws(()=>P.validateBackup(JSON.parse('{"version":1,"choices":{"__proto__":{"status":"going"}}}')));
 assert.throws(()=>P.validateBackup({version:2,choices:{}}));
});

// A small DOM harness exercises the generated page's event wiring without a browser.
// It deliberately does not claim to verify layout or native browser file storage.
function boot(payload=data,saved=null,key=KEY){
 const ids=new Map(),nodes=[],handlers={},storage=new Map(saved?[[key,saved]]:[]);
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
 const d=new Element({id:'events-data'});d.textContent=JSON.stringify(payload);ids.set(d.id,d);
 document={getElementById:id=>ids.get(id)||null,querySelectorAll:s=>nodes.filter(n=>matches(n,s)),querySelector:s=>nodes.find(n=>matches(n,s)),addEventListener:(k,fn)=>handlers[k]=fn,activeElement:null};
 const context={document,window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),key:i=>[...storage.keys()][i]??null,get length(){return storage.size;}},Intl,Date:FixtureDate,console,setTimeout,Blob,URL};
 vm.runInNewContext(fs.readFileSync(path.join(root,'planner.js'),'utf8'),context);
 const click=dataset=>handlers.click({target:{dataset,closest(){return this;},hasAttribute:k=>k==='data-reset'&&dataset.reset!==undefined}});
 return {ids,storage,click};
}
test('generated UI boots, saves a choice/note and retains it through refreshed data',()=>{
 const app=boot();
 assert.equal(app.ids.get('choice-total').textContent,'0 saved');
 assert.equal((app.ids.get('week-grid').innerHTML.match(/class="day /g)||[]).length,7);
 assert.equal((app.ids.get('event-grid').innerHTML.match(/<article/g)||[]).length,9);
 app.click({detail:'swim-a'});assert(app.ids.get('event-detail').open);
 app.click({choice:'maybe',id:'swim-a'});
 app.ids.get('personal-note').value='Bring water';
 app.ids.get('detail-body').handlers.click({target:{id:'save-note'}});
 const stored=app.storage.get(KEY);
 assert.equal(JSON.parse(stored).choices['swim-a'].note,'Bring water');
 assert.equal(app.ids.get('choice-total').textContent,'1 saved');
 const refreshed=structuredClone(data);refreshed.events.find(e=>e.event_id==='swim-a').location='Updated venue';
 const reload=boot(refreshed,stored);
 reload.click({scope:'saved'});
 assert.equal((reload.ids.get('event-grid').innerHTML.match(/<article/g)||[]).length,1);
 assert.match(reload.ids.get('event-grid').innerHTML,/venue changed since you saved it/);
 reload.click({detail:'swim-a'});assert.equal(reload.ids.get('personal-note').value,'Bring water');
 reload.click({choice:'going',id:'swim-a'});
 assert.equal(JSON.parse(reload.storage.get(KEY)).choices['swim-a'].status,'going');
 assert.equal(JSON.parse(reload.storage.get(KEY)).choices['swim-a'].note,'Bring water');
});
test('cancelled and missing saved listings remain visible after an update',()=>{
 const backup=JSON.stringify({version:1,choices:{'swim-a':{status:'going',note:'Remember',snapshot:find('swim-a')}}});
 const missing=structuredClone(data);missing.events=missing.events.filter(e=>e.event_id!=='swim-a');
 const app=boot(missing,backup);app.click({scope:'saved'});
 assert.match(app.ids.get('event-grid').innerHTML,/Listing no longer in current research/);
 const cancelled=structuredClone(data);cancelled.events.find(e=>e.event_id==='swim-a').status='cancelled';
 const other=boot(cancelled,backup);other.click({scope:'saved'});assert.match(other.ids.get('event-grid').innerHTML,/cancelled/);
});
test('choices kept under the page\'s earlier name are carried forward, and the old copy stays',()=>{
 const backup=JSON.stringify({version:1,choices:{'swim-a':{status:'going',note:'Kept',snapshot:find('swim-a')}}});
 const app=boot(data,backup,'old-name-choices-v1');
 assert.equal(JSON.parse(app.storage.get(KEY)).choices['swim-a'].note,'Kept');
 assert.equal(app.storage.get('old-name-choices-v1'),backup);
 assert.equal(app.ids.get('choice-total').textContent,'1 saved');
});
test('the page is built from the research and its settings: the city, the sources, the links',()=>{
 assert.equal(report.event_records,3);assert.equal(report.communities,2);
 assert.match(html,/<title>Riverford events · My week<\/title>/);assert.match(html,/A week in Riverford\./);
 assert.match(html,/<option value="su">Students’ Union<\/option><option value="university">University<\/option><option value="city">Wider Riverford<\/option>/);
 assert.match(html,/the union(?:'|&#x27;)s full calendar/);
 assert.deepEqual(P.filter(embedded.events,{source:'su'},{},'2099-01-01',[],embedded.settings.sources).map(e=>e.event_id),['club-run-2099-03-04']);
 assert.deepEqual(P.filter(embedded.events,{source:'university'},{},'2099-01-01',[],embedded.settings.sources).map(e=>e.event_id),['talk-data-2099-03-05']);
 assert.deepEqual(P.filter(embedded.events,{source:'city'},{},'2099-01-01',[],embedded.settings.sources).map(e=>e.event_id),['market-2099-03-07']);
});
test('standalone HTML embeds data and script, without network dependencies',()=>{
 assert(embedded.events.length>0);assert.equal(new Set(embedded.events.map(e=>e.event_id)).size,embedded.events.length);assert(embedded.communities.length>0);
 assert(!/__[A-Z_]+__/.test(html.split('<script')[0]));assert(!/__EVENTS_(DATA|SCRIPT)__/.test(html));
 assert(!/<script[^>]+src=/i.test(html));assert(!/<link[^>]+stylesheet/i.test(html));
 assert(!/url\s*\(/i.test(html.match(/<style>([\s\S]*?)<\/style>/)[1]));
});
