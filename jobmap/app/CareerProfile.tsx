import {useMemo,useState} from 'react';
import type {CareerProfile,Job,Profile,ProfileEvidence} from '../lib/types';
import {planProfileImport,profilePreparationPrompt,validateCareerProfile} from '../lib/career-profile.mjs';
import {COVERAGE,IMPORTANCE,reviewRequirements} from '../lib/requirements.mjs';
import './career.css';

type Content=Pick<CareerProfile,'summary'|'goals'|'evidence'>;
type ImportPlan={profile:Content;added:number;unchanged:number;conflicts:string[]};
const content=(profile:CareerProfile):Content=>({summary:profile.summary,goals:profile.goals,evidence:profile.evidence});
const DRAFT_KEY='jobmap-profile-draft-v1';
const basisLabels={document:'From a document',self:'My own account',learning:'Currently learning',gap:'A gap I know I have'};
function download(value:Content){
 const url=URL.createObjectURL(new Blob([JSON.stringify({format:'jobmap-profile',version:1,profile:value},null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download='jobmap-profile.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function initial(profile:CareerProfile){
 try{const kept=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');if(kept&&Number.isSafeInteger(kept.baseVersion)&&kept.baseVersion>=0)return {draft:validateCareerProfile(kept.profile,false,true) as Content,baseVersion:kept.baseVersion,dirty:true};}catch{}
 return {draft:content(profile),baseVersion:profile.version,dirty:false};
}
export function CareerProfileEditor({profile,save,reload}:{profile:CareerProfile;save:(value:Content,version:number)=>Promise<CareerProfile>;reload:()=>Promise<void>}){
 const [state,setState]=useState(()=>initial(profile));
 const {draft,baseVersion,dirty}=state;
 const [problem,setProblem]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[preview,setPreview]=useState<ImportPlan|null>(null),[prompt,setPrompt]=useState('');
 const stale=baseVersion!==profile.version;
 function keepDraft(next:Content,version:number){try{localStorage.setItem(DRAFT_KEY,JSON.stringify({baseVersion:version,profile:next}));}catch{setProblem('The browser could not keep a recovery draft. Save your profile or download a copy before closing.');}}
 function edit(next:Content){keepDraft(next,baseVersion);setState(old=>({...old,draft:next,dirty:true}));setMessage('');setPreview(null);}
 function update(id:string,patch:Partial<ProfileEvidence>){edit({...draft,evidence:draft.evidence.map(item=>item.id===id?{...item,...patch}:item)});}
 async function submit(e:React.FormEvent){
  e.preventDefault();setProblem('');setBusy(true);
  try{const valid=validateCareerProfile(draft) as Content;const saved=await save(valid,baseVersion);setState({draft:content(saved),baseVersion:saved.version,dirty:false});try{localStorage.removeItem(DRAFT_KEY);}catch{}setMessage('Profile saved. Your examples are available in each job’s requirements review.');}
  catch(error){setProblem((error as Error).message);}finally{setBusy(false);}
 }
 async function importFile(file:File|undefined){
  setProblem('');setPreview(null);if(!file)return;
  try{if(file.size>512*1024)throw new Error('A profile file can be up to 512 KB.');setPreview(planProfileImport(draft,JSON.parse(await file.text())) as ImportPlan);}
  catch(error){setProblem((error as Error).message);}
 }
 async function prepare(){const text=profilePreparationPrompt();setPrompt(text);try{await navigator.clipboard.writeText(text);setMessage('Instructions copied. Paste them into your AI chat and attach the CV or project documents you choose.');}catch{setMessage('Copy the instructions below into your AI chat.');}}
 async function refresh(){setProblem('');try{await reload();setMessage('Workspace reloaded. Your draft is still here.');}catch(error){setProblem((error as Error).message);}}
 return <div className="career-editor">
  <p className="modal-intro">Keep the examples behind your skills: what you did, where you did it, and the words in your CV or project notes that support it.</p>
  <div className="career-meta"><span>{draft.evidence.length} examples</span><span>{profile.version?'Saved version '+profile.version:'No profile saved yet'}</span><span>{dirty?'Draft kept in this browser':'Saved'}</span></div>
  {problem&&<p className="form-error" role="alert">{problem} <button type="button" className="text-button" onClick={()=>void refresh()}>Reload workspace</button></p>}
  {message&&<p className="career-message" role="status">{message}</p>}
  {stale&&<div className="career-warning"><p>Your saved profile changed since this draft began. Review an additive merge before saving; conflicting examples stay as they are in the latest profile.</p><button type="button" onClick={()=>setPreview(planProfileImport(profile,{format:'jobmap-profile',version:1,profile:draft}) as ImportPlan)}>Review draft against latest profile</button></div>}
  <details className="career-import"><summary>Build or update from my CV</summary>
   <p className="caption">Choose what to share with your AI. Bring its JSON file back here, then review the additions. Your documents are sent only when you send them yourself.</p>
   <div className="career-actions"><button type="button" onClick={()=>void prepare()}>Copy profile instructions</button><label className="subtle file-add">Import profile JSON<input type="file" accept=".json,application/json" onChange={e=>{void importFile(e.target.files?.[0]);e.target.value='';}}/></label><button type="button" onClick={()=>download(draft)}>Download profile JSON</button></div>
   {prompt&&<textarea readOnly aria-label="Profile instructions for your AI" rows={8} value={prompt} onFocus={e=>e.currentTarget.select()}/>}
  </details>
  {preview&&<section className="career-import-preview" aria-label="Profile import preview"><h3>Review additions</h3><p>{preview.added} new examples · {preview.unchanged} already present · {preview.conflicts.length} conflicts left unchanged</p>
   {preview.profile.evidence.filter(item=>!draft.evidence.some(old=>old.id===item.id)).map(item=><details key={item.id}><summary>{item.title}</summary><p>{item.statement}</p><p className="caption">{item.source}</p><blockquote>{item.quote}</blockquote></details>)}
   {preview.conflicts.length>0&&<><p>Kept unchanged; review these manually:</p><ul>{preview.conflicts.map((title,i)=><li key={i}>{title}</li>)}</ul></>}
   <p className="caption">Non-empty summary and goals stay unchanged. Applying adds to the draft; use Save profile to keep it.</p>
   <div className="career-actions"><button type="button" className="primary" onClick={()=>{const version=stale?profile.version:baseVersion;keepDraft(preview.profile,version);setState({draft:preview.profile,baseVersion:version,dirty:true});setPreview(null);setMessage('Additions are in your draft. Review them, then save.');}}>Apply additions to draft</button><button type="button" onClick={()=>setPreview(null)}>Cancel import</button></div>
  </section>}
  <form onSubmit={e=>void submit(e)}>
   <label>Profile summary<textarea aria-label="Profile summary" rows={3} maxLength={3000} value={draft.summary} onChange={e=>edit({...draft,summary:e.target.value})} placeholder="Your background, in your own words"/></label>
   <label>What I want next<textarea aria-label="What I want next" rows={2} maxLength={2000} value={draft.goals} onChange={e=>edit({...draft,goals:e.target.value})} placeholder="Roles, work and direction that interest you"/></label>
   <div className="career-section-heading"><h3>My evidence</h3><button type="button" disabled={draft.evidence.length>=100} onClick={()=>edit({...draft,evidence:[...draft.evidence,{id:crypto.randomUUID(),title:'',skills:[],statement:'',basis:'document',source:'',quote:''}]})}>Add an example</button></div>
   {!draft.evidence.length&&<div className="career-empty"><h3>Start with one piece of work you can explain</h3><p>A project, a problem you solved or a responsibility you held. Add its source and an exact quote so you can find the evidence again.</p><p className="caption">Your matching preferences stay available. Listed skills become evidence here only when you add the supporting example.</p></div>}
   {draft.evidence.map((item,index)=><details className="career-example" key={item.id} open>
    <summary><span>{item.title||'New example '+(index+1)}</span><small>{basisLabels[item.basis]}</small></summary>
    <label>Example title<input required maxLength={200} value={item.title} onChange={e=>update(item.id,{title:e.target.value})}/></label>
    <label>What I actually did<textarea aria-label="What I actually did" required rows={3} maxLength={3000} value={item.statement} onChange={e=>update(item.id,{statement:e.target.value})}/></label>
    <label>Skills this example supports<input maxLength={1500} value={item.skills.join(',')} onChange={e=>update(item.id,{skills:e.target.value.split(',')})} placeholder="Separate skills with commas"/></label>
    <label>Basis<select value={item.basis} onChange={e=>update(item.id,{basis:e.target.value as ProfileEvidence['basis']})}>{Object.entries(basisLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <label>Source and page or section<input required={item.basis==='document'} maxLength={500} value={item.source} onChange={e=>update(item.id,{source:e.target.value})} placeholder="Document name, page and section"/></label>
    <label>Exact supporting quote<textarea aria-label="Exact supporting quote" required={item.basis==='document'} rows={3} maxLength={3000} value={item.quote} onChange={e=>update(item.id,{quote:e.target.value})}/></label>
    <button type="button" className="text-button danger" onClick={()=>edit({...draft,evidence:draft.evidence.filter(old=>old.id!==item.id)})}>Remove example from draft</button>
   </details>)}
   <div className="career-save"><span className="caption">Saving updates your profile only. Job stages, dates, notes and matching preferences stay as you set them.</span><button type="submit" className="primary" disabled={busy||stale||!dirty}>{busy?'Saving…':'Save profile'}</button></div>
  </form>
 </div>;
}

type Requirement={id:string;text:string;importance:keyof typeof IMPORTANCE;coverage:keyof typeof COVERAGE;skills:string[];evidence:ProfileEvidence[];alternatives:boolean;extraCondition:boolean;mixedWording:boolean};
export function RequirementsReview({job,profile,preferences,openProfile}:{job:Job;profile:CareerProfile;preferences:Profile;openProfile:()=>void}){
 const review=useMemo(()=>reviewRequirements(job,profile,preferences),[job,profile,preferences]) as {rows:Requirement[];truncated:boolean;missingAdvert:boolean};
 return <details className="requirements-review" open><summary>Requirements and evidence <span>{review.rows.length} lines</span></summary>
  <p className="caption">Labels follow the saved advert’s wording. Your linked examples support the named skills; check the quoted line for experience levels and other conditions.</p>
  <div className="career-actions"><button type="button" className="text-button" onClick={openProfile}>Open my profile · {profile.evidence.length} examples</button></div>
  {!review.rows.length&&<p>{review.missingAdvert?'The full advert is not saved. Open the original advert to check its requirements.':'No explicit requirements or recognised skill names were found. Check the full advert below; this is not a complete assessment.'}</p>}
  <div className="requirement-list">{review.rows.map(row=><article className="requirement" key={row.id}>
   <div className="requirement-labels"><span className={'requirement-importance importance-'+row.importance}>{IMPORTANCE[row.importance]}</span><span className={'requirement-coverage coverage-'+row.coverage}>{COVERAGE[row.coverage]}</span></div>
   <blockquote>{row.text}</blockquote>
   {row.skills.length>0&&<p className="caption">Named: {row.skills.join(', ')}</p>}
   {row.alternatives&&<p className="caption">The wording includes alternatives. Check which combination is required.</p>}
   {row.mixedWording&&<p className="caption">This line mixes different levels of requirement. Review each named skill separately.</p>}
   {row.extraCondition&&<p className="caption">A named skill does not establish the stated years, qualification, proficiency or eligibility condition.</p>}
   {row.evidence.map(item=><details className="requirement-evidence" key={item.id}><summary>{item.title} · {basisLabels[item.basis]}</summary><p>{item.statement}</p>{item.source&&<p className="caption">Source: {item.source}</p>}{item.quote&&<blockquote>{item.quote}</blockquote>}</details>)}
   {row.coverage==='unknown'&&<p className="caption">Your profile does not provide evidence for this line yet. It may need an example or a question.</p>}
  </article>)}</div>
  {review.truncated&&<p className="caption">Some long or additional lines are omitted. Check the full advert for the rest.</p>}
 </details>;
}
