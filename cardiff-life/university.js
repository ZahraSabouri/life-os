'use strict';
(() => {
  const data=JSON.parse(document.getElementById('cardiff-data').textContent), uni=data.university||{};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validUrl=s=>/^https:\/\//.test(s||'')?esc(s):'#';
  const dateText=s=>s?new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',...(s.includes('T')?{timeStyle:'short'}:{}),timeZone:'Europe/London'}).format(new Date(s.includes('T')?s:s+'T12:00:00Z')):'Not verified';
  const opportunities=uni.opportunities||[], teaching=uni.teaching||[];
  const state=o=>{
    if(['closed','cancelled'].includes(o.status))return 'closed';
    const event=data.events.find(e=>e.event_id===o.linked_event_id);
    // Event start times are not application deadlines or evidence that booking closed.
    if(event)return event.date<new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London'}).format(new Date())?'closed':o.status;
    return o.deadline&&new Date(o.deadline).getTime()<Date.now()?'closed':o.status;
  };
  const open=opportunities.filter(o=>state(o)!=='closed').sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999'));
  const closed=opportunities.filter(o=>state(o)==='closed');
  function opportunity(o){
    const kind=state(o)==='closed'?'Closed':o.status==='needs_verification'?'Check details':'Action to consider';
    return `<article class="opportunity"><p class="category">${esc(o.type)} · ${kind}</p><h3>${esc(o.title)}</h3><p class="date-line">${esc(o.date_kind)}: ${dateText(o.deadline)}</p><p>${esc(o.summary)}</p><p><strong>Next step:</strong> ${esc(o.action)}</p><details><summary>Eligibility and source</summary><p>${esc(o.eligibility)}</p><p class="small">${esc(o.source_note)}</p></details><a href="${validUrl(o.source_url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a></article>`;
  }
  document.getElementById('university-coverage').textContent=uni.status?.coverage||'University sources have not been checked.';
  document.getElementById('university-list').innerHTML=open.length?open.map(opportunity).join(''):'<p>No current opportunity has been verified in this scan. Check coverage above.</p>';
  document.getElementById('university-closed').innerHTML=closed.map(opportunity).join('');
  document.getElementById('timetable-note').textContent=uni.timetable_note||'Timetable not available.';
  window.renderUniversity=()=>{
    const P=CardiffPlanner;
    document.querySelectorAll('#week-grid .day[data-date]').forEach(day=>{
      day.querySelectorAll('.teaching-block').forEach(n=>n.remove());
      const sessions=teaching.filter(t=>t.date===day.dataset.date).sort((a,b)=>a.start_time.localeCompare(b.start_time));
      if(sessions.length)day.querySelector('.day-empty')?.remove();
      day.querySelector('.day-content')?.insertAdjacentHTML('afterbegin',sessions.map(t=>`<article class="week-event teaching-block"><span class="mini-category">University teaching</span><span class="mini-time">${esc(t.start_time)}–${esc(t.end_time)}</span><strong>${esc(t.name)}</strong><p class="small">${esc(t.location)}</p><details><summary class="small">Source</summary><p class="small">${esc(t.evidence)}</p></details></article>`).join(''));
    });
    document.querySelectorAll('.event-card,.week-event[data-detail]').forEach(node=>{
      node.querySelectorAll('.teaching-clash').forEach(n=>n.remove());
      const id=node.dataset.detail||node.querySelector('[data-detail]')?.dataset.detail,e=data.events.find(e=>e.event_id===id);
      if(!e)return;
      const hits=teaching.filter(t=>P.overlaps(e,t));
      if(hits.length)node.insertAdjacentHTML('beforeend',`<span class="flag teaching-clash">Overlaps teaching: ${hits.map(t=>esc(t.start_time+'–'+t.end_time)).join(', ')}</span>`);
    });
  };
})();
