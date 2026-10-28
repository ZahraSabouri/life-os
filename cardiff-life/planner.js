'use strict';

const CardiffPlanner = (() => {
  const categories={sport:'Sport & fitness',dance:'Dance',creative:'Books, film & crafts',music:'Music',social:'Social & languages',professional:'Tech, talks & careers',volunteering:'Volunteering'};
  const activeStates=new Set(['upcoming','needs_verification','recurring']);
  // Civil-date arithmetic keeps weeks stable across daylight-saving changes.
  const addDays=(date,days)=>new Date(Date.parse(date+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
  const monday=date=>addDays(date,-((new Date(date+'T12:00:00Z').getUTCDay()+6)%7));
  const active=(e,today)=>activeStates.has(e.status)&&(!e.date||e.date>=today);
  const free=e=>/^free\b/i.test(e.cost.trim());
  const minutes=time=>/^\d{2}:\d{2}$/.test(time)?Number(time.slice(0,2))*60+Number(time.slice(3)):null;
  function overlaps(a,b) {
    if(!a.date||!b.date||a.event_id===b.event_id)return false;
    const values=[minutes(a.start_time),minutes(a.end_time),minutes(b.start_time),minutes(b.end_time)];
    if(values.some(x=>x===null))return false;
    let [as,ae,bs,be]=values;
    if(as===ae||bs===be)return false;
    if(ae<as)ae+=1440;if(be<bs)be+=1440;
    const offset=(Date.parse(b.date+'T12:00:00Z')-Date.parse(a.date+'T12:00:00Z'))/60000;
    return as<offset+be&&offset+bs<ae;
  }
  function filter(events,f,choices,today,ranked=[]) {
    const ranking=new Map(ranked.map((id,i)=>[id,i])), query=(f.search||'').trim().toLowerCase();
    return events.filter(e=>{
      if(f.scope==='saved'){if(!choices[e.event_id])return false;}else if(!active(e,today))return false;
      if(f.scope==='shortlist'&&!ranking.has(e.event_id))return false;
      if(f.category&&f.category!=='all'&&e.activity!==f.category)return false;
      if(query&&![e.name,e.organiser,e.location,e.description,e.category,e.activity].join(' ').toLowerCase().includes(query))return false;
      if(f.free&&!free(e))return false;
      if(f.source==='su'&&!e.source_url.includes('cardiffstudents.com/'))return false;
      if(f.source==='university'&&!e.source_url.includes('cardiff.ac.uk/'))return false;
      if(f.source==='city'&&/cardiffstudents\.com|cardiff\.ac\.uk/.test(e.source_url))return false;
      if(f.date&&e.date!==f.date)return false;
      if(f.when==='week'&&(!e.date||e.date<f.week||e.date>addDays(f.week,6)))return false;
      if(f.when==='21'&&(!e.date||e.date<today||e.date>addDays(today,20)))return false;
      if(f.when==='undated'&&e.date)return false;
      return true;
    }).sort((a,b)=>f.scope==='shortlist'?(ranking.get(a.event_id)??999)-(ranking.get(b.event_id)??999):(a.date||'9999').localeCompare(b.date||'9999')||a.start_time.localeCompare(b.start_time));
  }
  function validateBackup(input) {
    if(!input||input.version!==1||!input.choices||typeof input.choices!=='object'||Array.isArray(input.choices))throw Error('This is not a Cardiff Life choices backup.');
    const choices=Object.create(null);
    for(const [id,item] of Object.entries(input.choices)){
      if(!/^[a-z0-9][a-z0-9_-]{0,150}$/i.test(id)||!item||!['maybe','going'].includes(item.status))throw Error('The backup contains an invalid choice.');
      const snapshot={};
      for(const k of ['event_id','name','date','start_time','end_time','location','source_url','activity','status','cost','description','organiser'])snapshot[k]=typeof item.snapshot?.[k]==='string'?item.snapshot[k].slice(0,3000):'';
      if(!Object.hasOwn(categories,snapshot.activity))snapshot.activity='social';
      snapshot.event_id=id;
      if(snapshot.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.date)||Number.isNaN(Date.parse(snapshot.date+'T12:00:00Z'))))throw Error('The backup contains an invalid date.');
      choices[id]={status:item.status,note:typeof item.note==='string'?item.note.slice(0,2000):'',snapshot};
    }
    return choices;
  }
  return {categories,addDays,monday,active,free,overlaps,filter,validateBackup};
})();
if(typeof module!=='undefined')module.exports=CardiffPlanner;

if(typeof document!=='undefined')(()=>{
  const P=CardiffPlanner,$=id=>document.getElementById(id),data=JSON.parse($('cardiff-data').textContent);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=value=>esc(String(value||'Price not stated').replace(/GBP\s?/g,'£'));
  const link=value=>/^https?:\/\//i.test(value||'')?esc(value):'#';
  const format=(date,opts={day:'numeric',month:'short'})=>date?new Intl.DateTimeFormat('en-GB',{...opts,timeZone:'Europe/London'}).format(new Date(date+'T12:00:00Z')):'Date to confirm';
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const key='cardiff-life-choices-v1';
  let choices=Object.create(null),storageOK=true,selectedId=null,originFocus=null,week=P.monday(today);
  let filters={scope:'all',category:'all',search:'',when:'all',source:'all',free:false,date:'',week};
  const byId=new Map(data.events.map(e=>[e.event_id,e])),rank=new Set(data.ranked);
  try{const saved=localStorage.getItem(key);if(saved)choices=P.validateBackup(JSON.parse(saved));}
  catch(error){storageOK=false;$('storage-note').textContent='Browser saving is unavailable or saved data could not be read. Export your choices before closing this page. Existing stored data has not been overwritten.';}
  const label=status=>status==='going'?'Plan to go':status==='maybe'?'Maybe':'Not chosen';
  const allEvents=()=>[...data.events,...Object.entries(choices).filter(([id])=>!byId.has(id)).map(([id,c])=>({...c.snapshot,event_id:id,status:'missing'}))];
  const time=e=>e.start_time?e.start_time+(e.end_time?'–'+e.end_time:''):'Time to confirm';
  const cat=e=>P.categories[e.activity]||'Other';
  function announce(message){$('message').textContent=message;}
  function save(){if(storageOK)try{localStorage.setItem(key,JSON.stringify({version:1,choices}));}catch(error){storageOK=false;$('storage-note').textContent='Your changes are only saved for this visit. Export your choices before closing the page.';}}
  function badge(e){
    if(e.own)return '<span class="flag neutral">Added by you</span>'+(e.date&&e.date<today?'<span class="flag neutral">Past</span>':'');
    if(e.status==='missing')return '<span class="flag">Listing no longer in current research</span>';
    if(!['upcoming','needs_verification','recurring'].includes(e.status))return '<span class="flag">'+esc(e.status.replaceAll('_',' '))+'</span>';
    if(e.date&&e.date<today)return '<span class="flag neutral">Past event · attendance not recorded</span>';
    if(e.status==='needs_verification')return '<span class="flag">Check details first</span>';
    if(!e.date)return '<span class="flag">Next date unconfirmed</span>';
    return '';
  }
  function changed(e){if(e.own)return false;const old=choices[e.event_id]?.snapshot;return old&&['date','start_time','end_time','location'].some(k=>old[k]!==e[k]);}
  function choose(id,status){
    const e=allEvents().find(x=>x.event_id===id);if(!e)return;
    if(selectedId===id&&choices[id]&&$('personal-note'))choices[id].note=$('personal-note').value;
    if(status==='clear')delete choices[id];else choices[id]={status,note:choices[id]?.note||'',snapshot:{...e}};
    save();render();if(selectedId===id)detail(id,false);
    announce(status==='clear'?'Choice removed.':label(status)+' saved for '+e.name+'. This does not book a place.');
  }
  function actions(e){
    const state=choices[e.event_id]?.status,inactive=!P.active(e,today);
    return '<div class="choice-actions">'+(!inactive?['maybe','going'].map(s=>`<button type="button" class="choice ${s}" data-choice="${s}" data-id="${esc(e.event_id)}" aria-pressed="${state===s}" aria-label="${label(s)}: ${esc(e.name)}">${s==='going'?'✓ ':''}${label(s)}</button>`).join(''):'')+(state&&!e.own?`<button type="button" class="text-button" data-choice="clear" data-id="${esc(e.event_id)}" aria-label="Remove choice: ${esc(e.name)}">Remove</button>`:'')+'</div>';
  }
  function card(e){
    const state=choices[e.event_id]?.status;
    return `<article class="event-card ${state||''}" style="--category:var(--${esc(e.activity||'social')})"><div class="card-top"><span class="category">${esc(cat(e))}</span>${state?`<span class="decision ${state}">${label(state)}</span>`:rank.has(e.event_id)?'<span class="shortlisted">Shortlist</span>':''}</div><h3><button class="title-button" data-detail="${esc(e.event_id)}">${esc(e.name)}</button></h3><p class="date-line">${format(e.date,{weekday:'short',day:'numeric',month:'short'})}${e.date?' · '+esc(time(e)):''}</p><p class="location">${esc(e.location||(e.own?'':'Venue to confirm'))}</p><p class="description">${esc(e.description||e.notes||'')}</p><p class="price">${e.own&&!e.cost?'':money(e.cost)}</p>${badge(e)}${changed(e)?'<span class="flag">Date, time or venue changed since you saved it</span>':''}<div class="card-bottom">${actions(e)}<button class="text-button" data-detail="${esc(e.event_id)}">${e.own?'Details, change or remove ↗':'Details & booking ↗'}</button></div></article>`;
  }
  function weekTile(e,option=false){
    const state=choices[e.event_id]?.status;
    return `<button class="week-event ${option?'option':state}" style="--category:var(--${esc(e.activity||'social')})" data-detail="${esc(e.event_id)}"><span class="mini-category">${esc(cat(e))}</span><span class="mini-time">${esc(e.own&&!e.start_time?'Any time':time(e))}</span><strong>${esc(e.name)}</strong>${state?`<span class="decision ${state}">${label(state)}</span>`:'<span class="option-label">Option to explore</span>'}${e.status==='needs_verification'?'<span class="mini-warning">Check details first</span>':''}${!P.active(e,today)?'<span class="mini-warning">'+esc(e.date<today?'Past event':e.status.replaceAll('_',' '))+'</span>':''}${changed(e)?'<span class="mini-warning">Details changed</span>':''}</button>`;
  }
  function renderWeek(){
    const end=P.addDays(week,6),events=allEvents(),weekEvents=events.filter(e=>e.date>=week&&e.date<=end),planned=weekEvents.filter(e=>choices[e.event_id]),going=planned.filter(e=>choices[e.event_id].status==='going'),potential=weekEvents.filter(e=>P.active(e,today));
    $('week-label').textContent=format(week)+' – '+format(end,{day:'numeric',month:'short',year:'numeric'});
    $('week-summary').innerHTML=`<span><b>${going.length}</b> plan to go</span><span><b>${planned.length-going.length}</b> maybe</span><span><b>${potential.length}</b> available options</span>`;
    const counts=Object.entries(P.categories).map(([id,title])=>[title,planned.filter(e=>e.activity===id).length]).filter(x=>x[1]);
    $('week-mix').textContent=counts.length?'Your mix: '+counts.map(([title,n])=>title+' '+n).join(' · '):'Choose an event below to start shaping your week.';
    $('week-grid').innerHTML=Array.from({length:7},(_,i)=>{
      const day=P.addDays(week,i),list=weekEvents.filter(e=>e.date===day).sort((a,b)=>a.start_time.localeCompare(b.start_time)),saved=list.filter(e=>choices[e.event_id]),options=list.filter(e=>!choices[e.event_id]&&P.active(e,today));
      return `<section data-date="${day}" class="day ${day===today?'today':''} ${day<today?'past':''}"><header><span>${format(day,{weekday:'short'})}</span><strong>${format(day,{day:'numeric'})}</strong>${day===today?'<small>Today</small>':''}</header><div class="day-content">${saved.map(e=>weekTile(e)).join('')}${$('show-options').checked?options.slice(0,2).map(e=>weekTile(e,true)).join(''):''}${!saved.length&&!($('show-options').checked&&options.length)?'<p class="day-empty">'+(day<today?'No saved choices':'Nothing planned')+'</p>':''}${options.length?`<button class="day-more" data-day="${day}">Explore ${options.length} option${options.length===1?'':'s'} →</button>`:''}</div></section>`;
    }).join('');
    const clashes=[],selected=events.filter(e=>choices[e.event_id]&&P.active(e,today));
    for(let i=0;i<selected.length;i++)for(let j=i+1;j<selected.length;j++)if((planned.includes(selected[i])||planned.includes(selected[j]))&&P.overlaps(selected[i],selected[j]))clashes.push([selected[i],selected[j]]);
    $('clashes').hidden=!clashes.length;
    $('clashes').innerHTML='<strong>Choices that overlap</strong><ul>'+clashes.map(([a,b])=>`<li>${esc(a.name)} and ${esc(b.name)} · ${format(a.date)}. Both stay saved while you decide.</li>`).join('')+'</ul><small>Only published times are compared; allow extra travel time.</small>';
    const undated=events.filter(e=>choices[e.event_id]&&!e.date);$('unscheduled').hidden=!undated.length;
    $('unscheduled').innerHTML='<h3>Saved · date to confirm</h3>'+undated.map(e=>`<button class="text-button" data-detail="${esc(e.event_id)}">${esc(e.name)} · ${label(choices[e.event_id].status)}</button>`).join('');
    if(typeof window!=='undefined')window.renderUniversity?.();
  }
  function renderExplore(){
    filters.week=week;const result=P.filter(allEvents(),filters,choices,today,data.ranked);
    $('result-count').textContent=result.length+' event'+(result.length===1?'':'s')+(filters.date?' · '+format(filters.date,{weekday:'long',day:'numeric',month:'short'}):'');
    $('date-filter').hidden=!filters.date;
    $('event-grid').innerHTML=result.length?result.map(card).join(''):'<div class="empty"><h3>No events match these filters.</h3><p>Try another week or reset the filters to see all researched choices.</p><button data-reset>Reset filters</button></div>';
    document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===filters.category)));
    document.querySelectorAll('[data-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scope===filters.scope)));
    $('choice-total').textContent=Object.keys(choices).length+' saved';
    if(typeof window!=='undefined')window.renderUniversity?.();
  }
  function render(){renderWeek();renderExplore();}
  // ---- Events she adds herself: kept in Life OS (api/own-events), drawn like any other event.
  const ownApi=(path,method,body)=>(typeof fetch==='function'?fetch('api/own-events'+path,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined}):Promise.reject(Error('Open Cardiff Life inside Life OS to add your own events.'))).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'That could not be saved.');return d;});
  function putOwn(e){const at=data.events.findIndex(x=>x.event_id===e.event_id);if(at>=0)data.events[at]=e;else data.events.push(e);byId.set(e.event_id,e);}
  function ownForm(e){
    const form=$('own-form');form.reset();$('own-error').hidden=true;
    $('own-activity').innerHTML=Object.entries(P.categories).map(([id,title])=>`<option value="${id}">${esc(title)}</option>`).join('');
    for(const k of ['event_id','name','date','start_time','end_time','location','activity','cost','source_url','description'])form.elements[k].value=e?.[k]??(k==='activity'?'social':k==='date'&&!e?(filters.date||(week<=today&&today<=P.addDays(week,6)?today:week)):'');
    $('own-title').textContent=e?'Change my event':'Add my own event';$('own-save').textContent=e?'Save changes':'Add it to my plan';
    if($('event-detail').open)$('event-detail').close();$('own-dialog').showModal();form.elements.name.focus();
  }
  $('add-own').onclick=()=>ownForm(null);$('close-own').onclick=$('own-cancel').onclick=()=>$('own-dialog').close();
  $('own-form').addEventListener('submit',async event=>{
    event.preventDefault();const form=event.target,body=Object.fromEntries(new FormData(form)),id=body.event_id;delete body.event_id;$('own-save').disabled=true;
    try{const saved=(await ownApi(id?'/'+encodeURIComponent(id):'',id?'PATCH':'POST',body)).event;putOwn(saved);
      choices[saved.event_id]={status:choices[saved.event_id]?.status||'going',note:choices[saved.event_id]?.note||'',snapshot:{...saved}};save();
      if(saved.date){week=P.monday(saved.date);}$('own-dialog').close();render();announce((id?'Saved: ':'Added to your plan: ')+saved.name+'.');}
    catch(error){$('own-error').textContent=error.message;$('own-error').hidden=false;}
    finally{$('own-save').disabled=false;}
  });
  document.addEventListener('click',async event=>{
    const change=event.target.closest('[data-own-change]'),remove=event.target.closest('[data-own-remove]');
    if(change)ownForm(byId.get(change.dataset.ownChange));
    if(remove){const id=remove.dataset.ownRemove,e=byId.get(id);if(!e||!confirm('Remove “'+e.name+'”? It is taken off Cardiff Life and your calendar.'))return;
      try{await ownApi('/'+encodeURIComponent(id),'DELETE');data.events=data.events.filter(x=>x.event_id!==id);byId.delete(id);delete choices[id];save();$('event-detail').close();render();announce('Removed: '+e.name+'.');}catch(error){announce(error.message);}}
  });
  ownApi('','GET').then(d=>{let fresh=false;for(const e of d.events||[]){putOwn(e);if(!choices[e.event_id]){choices[e.event_id]={status:'going',note:'',snapshot:{...e}};fresh=true;}}if(fresh)save();if((d.events||[]).length)render();}).catch(()=>{/* opened as a file, without Life OS: only the researched events show */});
  function showView(view){for(const v of ['week','explore','communities','updates']){$(v+'-view').hidden=v!==view;document.querySelector(`[data-view="${v}"]`).setAttribute('aria-current',v===view?'page':'false');}}
  function detail(id,open=true){
    const e=allEvents().find(e=>e.event_id===id);if(!e)return;selectedId=id;$('detail-title').textContent=e.name;
    const fields=[['Where',e.location||'Not stated'],['Cost',String(e.cost||'Not stated').replace(/GBP\s?/g,'£')],['Booking',e.booking_required||'Check organiser page'],['Experience & equipment',e.experience||'See organiser details; requirements are not fully established'],['Could I return?',e.recurring||'Later sessions not established'],['Social value · assessment',e.social_value||'Not assessed'],['Professional value · assessment',e.networking_value||'Not assessed'],['Arriving alone',e.solo_friendliness||'Not established'],['Source notes',e.notes||''],['Verification',e.verification||'Current listing unavailable']];
    if(e.own){
      const facts=[['Where',e.location],['Cost',String(e.cost||'').replace(/GBP\s?/g,'£')]].filter(x=>x[1]);
      $('detail-body').innerHTML=`<p class="category">${esc(cat(e))} · Added by you</p><p class="detail-date">${e.date?format(e.date,{weekday:'long',day:'numeric',month:'long',year:'numeric'})+(e.start_time?' · '+esc(time(e)):''):'No day yet'}</p>${e.date&&e.date<today?'<span class="flag neutral">Past</span>':''}${e.description?'<p>'+esc(e.description)+'</p>':''}${actions(e)}${/^https?:\/\//i.test(e.source_url||'')?`<a class="source-button" href="${link(e.source_url)}" target="_blank" rel="noopener noreferrer">Open the link ↗</a>`:''}${facts.length?'<dl>'+facts.map(([title,value])=>`<dt>${esc(title)}</dt><dd>${esc(value)}</dd>`).join('')+'</dl>':''}<div class="own-tools"><button type="button" data-own-change="${esc(id)}">Change this event</button><button type="button" class="text-button" data-own-remove="${esc(id)}">Remove this event</button></div><p class="small">You added this one. It is on your Life OS calendar as well.</p>${choices[id]?'<label class="note-label" for="personal-note">My note <span class="small">Saved with this choice</span></label><textarea id="personal-note" maxlength="2000" rows="3" placeholder="For example: who is coming, what to bring…"></textarea><button id="save-note">Save note</button>':''}`;
      if(choices[id])$('personal-note').value=choices[id].note;
      if(open){originFocus=document.activeElement;$('event-detail').showModal();}
      return;
    }
    $('detail-body').innerHTML=`<p class="category">${esc(cat(e))} · ${esc(e.organiser)}</p><p class="detail-date">${format(e.date,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}${e.date?' · '+esc(time(e)):''}</p>${badge(e)}${changed(e)?'<p class="flag">Date, time or venue changed since you saved this choice. Recheck before travelling.</p>':''}<p>${esc(e.description||'')}</p>${actions(e)}<p class="small">Planning here does not reserve a place. Use the organiser’s page for any booking.</p><a class="source-button" href="${link(e.source_url)}" target="_blank" rel="noopener noreferrer">Open organiser & ticket details ↗</a><dl>${fields.filter(x=>x[1]).map(([title,value])=>`<dt>${esc(title)}</dt><dd>${esc(value)}</dd>`).join('')}</dl><p class="small">Source checked: ${e.last_checked?format(e.last_checked,{day:'numeric',month:'long',year:'numeric'}):'Current record unavailable'} · Europe/London</p>${choices[id]?'<label class="note-label" for="personal-note">My note <span class="small">Saved with this choice</span></label><textarea id="personal-note" maxlength="2000" rows="3" placeholder="For example: check the ticket, bring a water bottle…"></textarea><button id="save-note">Save note</button>':''}`;
    if(choices[id])$('personal-note').value=choices[id].note;
    if(open){originFocus=document.activeElement;$('event-detail').showModal();}
  }
  function renderCommunities(){const q=$('community-search').value.toLowerCase().trim(),groups=data.communities.filter(c=>[c.name,c.section,...c.body].join(' ').toLowerCase().includes(q));$('community-grid').innerHTML=groups.map(c=>`<article class="community-card"><p class="category">${esc(c.section)}</p><h3>${esc(c.name)}</h3>${c.body.map(t=>'<p>'+t+'</p>').join('')}<a href="${link(c.url)}" target="_blank" rel="noopener noreferrer">Explore this community ↗</a></article>`).join('')||'<p>No matching communities.</p>';}
  function reset(){filters={scope:'all',category:'all',search:'',when:'all',source:'all',free:false,date:'',week};$('search').value='';$('when').value='all';$('source').value='all';$('free-only').checked=false;renderExplore();}
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.view){showView(b.dataset.view);return;}
    if(b.dataset.detail){detail(b.dataset.detail);return;}
    if(b.dataset.choice){choose(b.dataset.id,b.dataset.choice);return;}
    if(b.dataset.category){filters.category=b.dataset.category;renderExplore();return;}
    if(b.dataset.scope){if(b.dataset.scope==='saved')reset();filters.scope=b.dataset.scope;renderExplore();return;}
    if(b.dataset.day){reset();filters.date=b.dataset.day;renderExplore();showView('explore');return;}
    if(b.hasAttribute('data-reset'))reset();
  });
  $('prev-week').onclick=()=>{week=P.addDays(week,-7);render();};$('next-week').onclick=()=>{week=P.addDays(week,7);render();};$('this-week').onclick=()=>{week=P.monday(today);render();};
  $('explore-week').onclick=()=>{reset();filters.when='week';$('when').value='week';renderExplore();showView('explore');};
  $('show-options').onchange=renderWeek;
  $('search').oninput=()=>{filters.search=$('search').value;renderExplore();};$('when').onchange=()=>{filters.when=$('when').value;filters.date='';renderExplore();};$('source').onchange=()=>{filters.source=$('source').value;renderExplore();};$('free-only').onchange=()=>{filters.free=$('free-only').checked;renderExplore();};$('date-filter').onclick=()=>{filters.date='';renderExplore();};$('community-search').oninput=renderCommunities;
  $('close-detail').onclick=()=>$('event-detail').close();$('event-detail').addEventListener('close',()=>{selectedId=null;if(originFocus?.isConnected)originFocus.focus();else $('this-week').focus();});
  $('detail-body').addEventListener('click',e=>{if(e.target.id==='save-note'&&choices[selectedId]){choices[selectedId].note=$('personal-note').value;save();announce('Personal note saved.');e.target.textContent='Note saved';}});
  $('export-choices').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),choices},null,2)],{type:'application/json'}),address=URL.createObjectURL(blob),a=document.createElement('a');a.href=address;a.download='cardiff-life-choices-'+today+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(address),1000);announce('Choices backup prepared. Keep it to restore your plan in another browser.');};
  $('import-choices').onchange=async()=>{const file=$('import-choices').files[0];if(!file)return;try{if(file.size>2000000)throw Error('Backup is too large.');const incoming=P.validateBackup(JSON.parse(await file.text()));let n=0;for(const [id,c] of Object.entries(incoming))if(!choices[id]){choices[id]=c;n++;}save();render();announce(n+' choices imported. Existing choices and notes were kept.');}catch(error){announce('Import failed: '+error.message);}$('import-choices').value='';};
  window.addEventListener('storage',e=>{if(e.key===key&&e.newValue)try{choices=P.validateBackup(JSON.parse(e.newValue));render();}catch{announce('A change from another tab could not be read.');}});
  $('categories').innerHTML='<button data-category="all" aria-pressed="true">All activities</button>'+Object.entries(P.categories).map(([id,title])=>`<button data-category="${id}" aria-pressed="false"><span class="category-dot" style="background:var(--${id})"></span>${title}</button>`).join('');
  const checked=data.events.map(e=>e.last_checked).filter(Boolean).sort().at(-1);$('research-date').textContent='Research checked '+format(checked,{day:'numeric',month:'long',year:'numeric'});
  if(checked&&checked<P.addDays(today,-7)){$('stale').hidden=false;$('stale').textContent='The latest source checks are over a week old. Recheck event details before travelling or booking.';}
  $('coverage').textContent=data.events.filter(e=>P.active(e,today)).length+' researched events and '+data.communities.length+' communities. This is a growing catalogue; it does not include every SU listing.';
  $('deadlines').innerHTML=data.deadlines.map(d=>'<li>'+d+'</li>').join('');$('schedules').innerHTML=data.schedules.map(s=>`<div><strong>${esc(s.name)}</strong><p>${esc(s.when)}</p><span class="schedule-state ${esc(s.state)}">${esc(s.state)}</span></div>`).join('');
  $('build-time').textContent='Page rebuilt '+new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}).format(new Date(data.built))+'. Rebuilding does not recheck sources.';
  render();renderCommunities();
})();
