import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCalendarDay } from '../../lib/calendar.js'
import { clockOf } from '../../lib/day.js'
import { isDone, isSkipped } from '../../../../shared/health/week.js'
import { blankSet, finishTraining, previousExercise, setSummary, trainingHistory, trainingTotals, validateTrainingSession } from '../../../../shared/health/training.js'
import ExercisePictures from './ExercisePictures.jsx'

const active = e => !['archived','cancelled'].includes(e.status)
const when = e => `${formatCalendarDay(e.start_at?.slice(0,10),{weekday:'short',month:'short'})}${String(e.start_at).length>10?' · '+clockOf(e.start_at):''}`
const targetText = x => `${x.target.min}${x.target.max!==x.target.min?'–'+x.target.max:''} ${x.measure==='seconds'?'seconds':'reps'}${x.perSide?' each side':''}`
const sessionHref = e => `/health?view=exercise&entry=${encodeURIComponent(e.id)}`
function Words({items,ordered=false}) { const Tag=ordered?'ol':'ul'; return items?.length?<Tag>{items.map((s,i)=><li key={i}>{s}</li>)}</Tag>:null }
export function GymPlanTeaser({page}) {
  const plans=page.entries.filter(e=>e.type==='workout-plan'&&e.details?.training&&active(e))
  if(!plans.length)return null
  const next=page.entries.filter(e=>e.type==='workout'&&e.details?.training&&!isDone(e)&&!isSkipped(e)).sort((a,b)=>String(a.start_at).localeCompare(String(b.start_at)))[0]
  return <section className="day-panel gym-teaser"><div><span className="gym-eyebrow">YOUR TRAINING</span><h2>{plans[0].title}</h2><p>{plans[0].details.days_per_week} visits a week · {trainingHistory(page.entries,plans[0].id).length} workouts completed</p></div><div className="entry-editor-actions"><Link className="entry-editor-save" to="/health?view=gym">Open gym plan</Link>{next?<Link to={sessionHref(next)}>Next: {when(next)}</Link>:null}</div></section>
}
function Technique({exercise}) {
  return <details className="gym-technique"><summary>How to do it</summary><p className="health-small">{exercise.equipment}</p><Words ordered items={exercise.instructions}/><Words items={exercise.cues}/>{exercise.alternatives.length?<><h4>Alternatives</h4><Words items={exercise.alternatives}/></>:null}</details>
}
function PlanEditor({entry,page,onClose}) {
  const [title,setTitle]=useState(entry.title),[summary,setSummary]=useState(entry.details.training.summary),[goals,setGoals]=useState(entry.details.training.goals.join('\n')),[busy,setBusy]=useState(false),[error,setError]=useState('')
  async function save(e){e.preventDefault();if(!title.trim())return setError('Give the plan a name');setBusy(true);try{await page.change(entry.id,{title:title.trim(),details:{...entry.details,training:{...entry.details.training,summary,goals:goals.split('\n').map(s=>s.trim()).filter(Boolean)}}});onClose()}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <form className="gym-plan-editor" onSubmit={save}><label>Plan name<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={200}/></label><label>Overview<textarea value={summary} onChange={e=>setSummary(e.target.value)} rows={3}/></label><label>Goals, one per line<textarea value={goals} onChange={e=>setGoals(e.target.value)} rows={4}/></label>{error?<p role="alert">{error}</p>:null}<div className="entry-editor-actions"><button disabled={busy} className="entry-editor-save">Save plan</button><button type="button" onClick={onClose}>Cancel</button></div></form>
}
export default function GymPlans({page}) {
  const plans=page.entries.filter(e=>e.type==='workout-plan'&&e.details?.training&&active(e))
  const entry=plans.find(e=>e.id===page.params.get('plan'))??plans[0]
  const [editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
  if(page.loading)return <p>Reading your training plan…</p>
  if(!entry)return <section className="day-panel"><h2>Your gym plans</h2><p>No structured training plan saved yet. Existing workouts and programmes are available in Exercise.</p><Link to="/health?view=exercise">Open Exercise</Link></section>
  const plan=entry.details.training,sessions=page.entries.filter(e=>e.type==='workout'&&e.details?.training?.planId===entry.id&&active(e)).sort((a,b)=>String(a.start_at).localeCompare(String(b.start_at)))
  const done=trainingHistory(page.entries,entry.id),next=sessions.find(e=>!isDone(e)&&!isSkipped(e)),tabs=[['overview','Overview'],['workouts','Workouts'],['progress','Progress'],['routine','Desk routine'],['references','References']]
  const tab=tabs.some(([k])=>k===page.params.get('tab'))?page.params.get('tab'):'overview'
  const routines=page.entries.filter(e=>e.type==='routine'&&e.details?.training&&active(e))
  async function milestone(id){setBusy(true);setError('');try{await page.change(entry.id,{details:{...entry.details,training:{...plan,milestones:plan.milestones.map(m=>m.id===id?{...m,done:!m.done}:m)}}})}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <div className="gym-page">
    <header className="gym-heading"><div><span className="gym-eyebrow">YOUR GYM PLAN</span><h2>{entry.title}</h2><p>{entry.details.days_per_week} visits each week · {sessions.length} scheduled · {done.length} completed</p></div><button type="button" onClick={()=>setEditing(!editing)}>Edit overview</button></header>
    {plans.length>1?<label>Plan<select value={entry.id} onChange={e=>page.setParams({view:'gym',plan:e.target.value})}>{plans.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>:null}
    {editing?<PlanEditor key={entry.id} entry={entry} page={page} onClose={()=>setEditing(false)}/>:null}
    <nav className="gym-subnav" aria-label="Gym plan pages">{tabs.map(([key,label])=><button key={key} aria-pressed={tab===key} onClick={()=>page.setParams({view:'gym',plan:entry.id,tab:key})}>{label}</button>)}</nav>
    {error?<p className="form-error" role="alert">{error} Your change was not saved. <button onClick={()=>{page.refetch();setError('')}}>Reload latest</button></p>:null}
    {tab==='overview'?<>
      <section className="gym-overview-grid"><article className="day-panel"><span className="gym-eyebrow">NEXT WORKOUT</span>{next?<><h3>{next.title}</h3><p>{when(next)} · {next.details.duration_min} min reserved</p><p>{next.details.training.exercises.length} exercises · {next.details.training.templateId.toUpperCase()}</p><Link className="entry-editor-save" to={sessionHref(next)}>Open workout</Link></>:<p>No remaining workouts.</p>}</article><article className="day-panel"><h3>What you are building</h3><p>{plan.summary}</p><Words items={plan.goals}/></article></section>
      <section className="gym-template-grid">{plan.templates.map(t=><article className="day-panel" key={t.id}><span className="gym-eyebrow">WORKOUT {t.id.toUpperCase()}</span><h3>{t.title}</h3><p>{t.focus}</p><ol className="gym-template-list">{t.exercises.map(x=><li key={x.id}><div><b>{x.name}</b><span>{x.target.sets} set · {targetText(x)}{x.optional?' · optional':''}</span></div><ExercisePictures name={x.name}/><Technique exercise={x}/></li>)}</ol><details><summary>Warm-up and session guidance</summary><Words items={[...t.warmup,...t.guidance,...t.cooldown]}/></details></article>)}</section>
      <section className="day-panel"><h3>Progress at your pace</h3><p>Use the phase criteria to review readiness. Dates do not increase your weights or sets automatically.</p><div className="gym-phases">{plan.phases.map(p=><details key={p.id}><summary>{p.title}</summary><p>{p.description}</p><Words items={p.criteria}/></details>)}</div></section>
      <section className="day-panel"><h3>Equipment</h3><Words items={plan.equipment}/></section>
    </>:null}
    {tab==='workouts'?<section className="day-panel"><h3>Scheduled workouts</h3><p>The existing calendar slots. Open a session to log its actual sets.</p><ul className="gym-schedule">{sessions.map(e=>{const t=trainingTotals(e.details.training);return <li key={e.id}><div><small>{when(e)}</small><Link to={sessionHref(e)}>{e.title}</Link></div><span>{isDone(e)?'Completed':isSkipped(e)?'Skipped':e.status==='in-progress'?'In progress':'Planned'} · {t.done}/{t.total} sets</span><Link to={sessionHref(e)} aria-label={`Open ${e.title} on ${e.start_at.slice(0,10)}`}>Open →</Link></li>})}</ul></section>:null}
    {tab==='progress'?<>
      <div className="gym-stat-grid"><article><strong>{done.length}</strong><span>workouts completed</span></article><article><strong>{done.reduce((n,e)=>n+trainingTotals(e.details.training).done,0)}</strong><span>sets recorded as done</span></article><article><strong>{plan.milestones.filter(m=>m.done).length}/{plan.milestones.length}</strong><span>milestones you confirmed</span></article></div>
      <section className="day-panel"><h3>Foundation milestones</h3><p>Tick only what you have actually achieved.</p><div className="gym-milestones">{plan.milestones.map(m=><label key={m.id}><input type="checkbox" checked={m.done} disabled={busy} onChange={()=>milestone(m.id)}/><span>{m.title}</span></label>)}</div></section>
      <section className="day-panel"><h3>Workout history</h3>{done.length?done.map(e=><details key={e.id}><summary>{when(e)} · {e.title} · {e.details.training.actualMinutes??e.details.duration_min} min</summary><ul>{e.details.training.exercises.filter(x=>x.sets.some(s=>s.done)).map(x=><li key={x.id}><b>{x.name}</b>: {x.sets.filter(s=>s.done).map(s=>setSummary(s,x)).join('; ')}</li>)}</ul>{e.details.training.sessionNote?<p>{e.details.training.sessionNote}</p>:null}<Link to={sessionHref(e)}>Open recorded workout</Link></details>):<p>No workouts completed yet. Your first saved results will appear here; no progress has been assumed.</p>}</section>
    </>:null}
    {tab==='routine'?<>{routines.map(r=><section className="day-panel" key={r.id}><h3>{r.title}</h3><p>{r.details.training.summary}</p><div className="gym-routine-grid">{r.details.training.steps.map(s=><article key={s.id}><h4>{s.name}</h4><p className="gym-dose">{s.dose}</p><ExercisePictures name={s.name}/><Words ordered items={s.instructions}/></article>)}</div></section>)}{!routines.length?<p>No mobility routine saved.</p>:null}</>:null}
    {tab==='references'?<><section className="day-panel"><h3>Sources and supporting material</h3><ul>{plan.sources.map((s,i)=><li key={i}>{s.url?<a href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a>:s.label}</li>)}</ul></section>{plan.options.map((o,i)=><section className="day-panel" key={i}><h3>{o.title}</h3><Words items={o.items}/></section>)}</>:null}
  </div>
}

function restore(entry,key){try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.dirty){validateTrainingSession(saved.draft);return saved}}catch{}return{draft:structuredClone(entry.details.training),base:entry.updated_at,dirty:false}}
export function StructuredWorkout({entry,page,onEdit,onClose}) {
  const key=`life-os.workout-draft.${entry.id}`
  const [state,setState]=useState(()=>restore(entry,key)),[busy,setBusy]=useState(false),[error,setError]=useState(''),[savedMessage,setSavedMessage]=useState(''),[editingTargets,setEditingTargets]=useState(false)
  const {draft,base,dirty}=state,totals=trainingTotals(draft),done=isDone(entry)
  const [restUntil,setRestUntil]=useState(()=>{try{return Number(localStorage.getItem(key+'.rest'))||0}catch{return 0}}),[now,setNow]=useState(Date.now())
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[])
  useEffect(()=>{try{if(dirty)localStorage.setItem(key,JSON.stringify(state));else localStorage.removeItem(key)}catch{}},[key,state,dirty])
  useEffect(()=>{try{if(restUntil)localStorage.setItem(key+'.rest',String(restUntil));else localStorage.removeItem(key+'.rest')}catch{}},[key,restUntil])
  useEffect(()=>{const warn=e=>{if(dirty){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[dirty])
  useEffect(()=>{if(!dirty&&entry.updated_at!==base)setState({draft:structuredClone(entry.details.training),base:entry.updated_at,dirty:false})},[entry.updated_at,base,dirty,entry.details.training])
  const update=fn=>{setSavedMessage('');setState(s=>({...s,dirty:true,draft:fn(structuredClone(s.draft))}))}
  function setField(exerciseId,setId,name,value){update(t=>{const s=t.exercises.find(x=>x.id===exerciseId).sets.find(x=>x.id===setId);s[name]=value;return t})}
  async function persist(next=draft,extra={}){setBusy(true);setError('');try{validateTrainingSession(next);const saved=await page.change(entry.id,{details:{...entry.details,training:next},...extra},base);setState({draft:structuredClone(saved.details.training),base:saved.updated_at,dirty:false});setSavedMessage('Saved');return saved}catch(e){setError(e.message);return null}finally{setBusy(false)}}
  async function reload(){setBusy(true);try{const e=await page.reload(entry.id);setState({draft:structuredClone(e.details.training),base:e.updated_at,dirty:false});setError('');setSavedMessage('Latest version loaded')}catch(e){setError(e.message)}finally{setBusy(false)}}
  async function finish(){try{const patch=finishTraining(entry,draft);await persist(patch.details.training,{status:patch.status,details:patch.details})}catch(e){setError(e.message)}}
  const rest=Math.max(0,Math.ceil((restUntil-now)/1000)),elapsed=draft.startedAt?Math.max(0,Math.floor((now-Date.parse(draft.startedAt))/60000)):0
  const startRest=seconds=>{const at=Date.now();setNow(at);setRestUntil(at+seconds*1000)}
  const numberInput=e=>e.target.value===''?null:Number(e.target.value)
  return <section className="gym-workout" aria-labelledby="health-session">
    <header className="gym-heading"><div><Link to={`/health?view=gym&plan=${draft.planId}`}>← Gym plan</Link><h2 id="health-session">{entry.title}</h2><p>{when(entry)} · {entry.details.duration_min} min {done?'recorded':'reserved'} · {done?'completed':isSkipped(entry)?'skipped':entry.status==='in-progress'?'in progress':'planned'}</p></div><div className="entry-editor-actions"><button onClick={onEdit}>Change date/time</button><button onClick={onClose}>Close</button></div></header>
    <div className="gym-session-toolbar"><span>{totals.done} of {totals.total} sets ticked</span><div className="gym-rest" role="timer" aria-label="Rest timer">{rest?`${Math.floor(rest/60)}:${String(rest%60).padStart(2,'0')} rest`:restUntil?'Rest finished':'Rest timer'}{restUntil?<button onClick={()=>setRestUntil(0)}>Clear</button>:null}</div>{draft.startedAt?<span>{elapsed} min since start</span>:null}</div>
    {error?<div className="gym-save-error" role="alert"><p>{error}</p><p>Your draft is kept here. Reloading the latest version discards this unsaved draft.</p><button disabled={busy} onClick={reload}>Reload latest</button></div>:null}
    <section className="day-panel"><h3>Before you start</h3><Words ordered items={draft.warmup}/><details><summary>Session guidance</summary><Words items={draft.guidance}/></details>{!draft.startedAt&&!done?<button className="entry-editor-save" disabled={busy} onClick={()=>persist({...draft,startedAt:new Date().toISOString()},{status:'in-progress'})}>Start workout</button>:null}</section>
    <fieldset className="gym-exercises" disabled={busy} aria-label="Workout exercises"><legend>Exercises and sets</legend>
      {draft.exercises.map((x,i)=>{const previous=previousExercise(page.entries,entry,x.id);return <article className="gym-movement" key={x.id}>
        <header><span className="gym-exercise-number">{i+1}</span><div><h3>{x.name}{x.optional?<small> Optional</small>:null}</h3><p>{x.sets.length} {x.sets.length===1?'set':'sets'} · {targetText(x)} · rest {x.target.restSeconds} sec</p></div><button type="button" onClick={()=>startRest(x.target.restSeconds)}>Rest {x.target.restSeconds}s</button></header>
        <ExercisePictures name={x.name}/><Technique exercise={x}/>
        {previous?<p className="health-small">Last time: {previous.exercise.sets.filter(s=>s.done).map(s=>setSummary(s,previous.exercise)).join('; ')}</p>:null}
        {editingTargets?<div className="gym-targets">{[['min','Target from'],['max','Target to'],['restSeconds','Rest seconds']].map(([field,label])=><label key={field}>{label}<input type="number" min="0" max="600" value={x.target[field]} onChange={e=>update(t=>{t.exercises[i].target[field]=Number(e.target.value);return t})}/></label>)}</div>:null}
        <div className="gym-set-table"><div className="gym-set-head"><span>Set</span><span>{x.measure==='seconds'?'Seconds':'Reps'}{x.perSide?' / side':''}</span><span>{x.target.loadLabel||'Load (kg)'}</span><span>Done</span></div>
          {x.sets.map((s,j)=><div className={`gym-set-row${s.done?' is-done':''}`} key={s.id}><span>{j+1}</span><input aria-label={`${x.name} set ${j+1} ${x.measure}`} type="number" min="0" max={x.measure==='seconds'?3600:600} value={(x.measure==='seconds'?s.seconds:s.reps)??''} placeholder={`${x.target.min}–${x.target.max}`} onChange={e=>setField(x.id,s.id,x.measure==='seconds'?'seconds':'reps',numberInput(e))}/><input aria-label={`${x.name} set ${j+1} weight kg`} type="number" min="0" max="1000" step="0.5" value={s.kg??''} placeholder="Optional" onChange={e=>setField(x.id,s.id,'kg',numberInput(e))}/><input type="checkbox" aria-label={`${x.name} set ${j+1} done`} checked={s.done} onChange={e=>setField(x.id,s.id,'done',e.target.checked)}/></div>)}
        </div><button type="button" className="gym-add-set" disabled={x.sets.length>=10} onClick={()=>update(t=>{const e=t.exercises[i];e.sets.push(blankSet(e.id,e.sets.length+1));return t})}>+ Add set</button>
      </article>})}
    </fieldset>
    <button type="button" onClick={()=>setEditingTargets(!editingTargets)}>{editingTargets?'Hide target settings':'Adjust repetition targets and rests'}</button>
    <section className="day-panel"><h3>Finish and record</h3><Words items={draft.cooldown}/><div className="gym-record-grid"><label>Actual exercise minutes<input aria-label="Actual exercise minutes" type="number" min="1" max="1440" value={draft.actualMinutes??''} onChange={e=>update(t=>({...t,actualMinutes:numberInput(e)}))}/></label><label>How it felt<select value={draft.comfort} onChange={e=>update(t=>({...t,comfort:e.target.value}))}><option value="">Not recorded</option><option value="comfortable">Comfortable</option><option value="adjust">Needs an adjustment</option><option value="stop">Stopped because of symptoms</option></select></label></div><label>Session note<textarea rows={3} value={draft.sessionNote} onChange={e=>update(t=>({...t,sessionNote:e.target.value}))} placeholder="Equipment, changes, recovery…"/></label><p className="health-small">Finish records this session with the sets you actually ticked. Unchecked sets remain unchecked.</p></section>
    <div className="gym-savebar"><span role="status">{busy?'Saving…':dirty?'Unsaved changes · draft kept in this browser':savedMessage||'Saved workout'}</span><button className="entry-editor-save" disabled={busy||!dirty} onClick={()=>persist()}>Save progress</button>{done?<button disabled={busy} onClick={()=>persist({...draft,finishedAt:null},{status:'in-progress'})}>Reopen workout</button>:isSkipped(entry)?<button disabled={busy} onClick={()=>persist(draft,{status:'planned'})}>Restore planned session</button>:<><button disabled={busy} onClick={()=>persist(draft,{status:'skipped'})}>Skip this session</button><button disabled={busy} onClick={finish}>Finish workout</button></>}</div>
  </section>
}
