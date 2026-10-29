// Personal training is data on core records. No personal routine lives in app code.
const fail = message => { throw new Error(message) }
function object(x, keys, at) { if (!x || typeof x !== 'object' || Array.isArray(x)) fail(`${at} must be an object`); for (const k of Object.keys(x)) if (!keys.includes(k)) fail(`${at}: unknown field ${k}`) }
function text(x, at, max = 3000) { if (typeof x !== 'string' || x.length > max) fail(`${at} must be text up to ${max} characters`) }
function number(x, at, min = 0, max = 10000, nullable = false) { if (nullable && x === null) return; if (typeof x !== 'number' || !Number.isFinite(x) || x < min || x > max) fail(`${at} must be between ${min} and ${max}`) }
function list(x, at, max = 50) { if (!Array.isArray(x) || x.length > max) fail(`${at} must be a list of up to ${max}`) }
function lines(x, at, max = 30) { list(x, at, max); x.forEach(t => text(t, at)) }
function boolean(x, at) { if (typeof x !== 'boolean') fail(`${at} must be true or false`) }
function id(x, at) { text(x, at, 100); if (!x || !/^[\w-]+$/.test(x)) fail(`${at} needs a stable id`) }
function timestamp(x, at) { if (x !== null && (typeof x !== 'string' || !Number.isFinite(Date.parse(x)))) fail(`${at} must be an ISO timestamp or null`) }
function unique(rows, at) { if (new Set(rows.map(x => x.id)).size !== rows.length) fail(`${at} contains duplicate ids`) }
function target(t) {
  object(t, ['sets', 'min', 'max', 'restSeconds', 'loadLabel'], 'target')
  number(t.sets, 'sets', 1, 10); if (!Number.isInteger(t.sets)) fail('sets must be a whole number')
  number(t.min, 'target minimum', 0, 600); number(t.max, 'target maximum', t.min, 600)
  number(t.restSeconds, 'rest', 0, 600); text(t.loadLabel, 'load label', 100)
}
function movement(x, logged = false) {
  object(x, ['id','name','equipment','instructions','cues','alternatives','optional','perSide','measure','target',...(logged?['sets']:[])], 'exercise')
  id(x.id, 'exercise id'); text(x.name, 'exercise name', 200); text(x.equipment, 'equipment', 500)
  lines(x.instructions, 'instructions'); lines(x.cues, 'cues'); lines(x.alternatives, 'alternatives')
  boolean(x.optional, 'optional'); boolean(x.perSide, 'per side'); if (!['reps','seconds'].includes(x.measure)) fail('Choose reps or seconds')
  target(x.target)
  if (logged) {
    list(x.sets, 'sets', 10); unique(x.sets, 'sets')
    for (const s of x.sets) { object(s, ['id','reps','kg','seconds','done'], 'set'); id(s.id,'set id'); number(s.reps,'reps',0,600,true); number(s.kg,'kg',0,1000,true); number(s.seconds,'seconds',0,3600,true); boolean(s.done,'set done') }
  }
}
export function validateTrainingPlan(value) {
  object(value, ['version','summary','goals','equipment','phases','templates','milestones','sources','options'], 'training plan')
  if (value.version !== 1) fail('Unsupported training plan version')
  text(value.summary,'summary',6000); lines(value.goals,'goals'); lines(value.equipment,'equipment')
  list(value.phases,'phases',12); unique(value.phases,'phases')
  for (const p of value.phases) { object(p,['id','title','description','criteria'],'phase'); id(p.id,'phase id'); text(p.title,'phase title',200); text(p.description,'phase description'); lines(p.criteria,'phase criteria') }
  list(value.templates,'templates',12); unique(value.templates,'templates')
  for (const t of value.templates) { object(t,['id','title','focus','warmup','cooldown','guidance','exercises'],'template'); id(t.id,'template id'); text(t.title,'template title',200); text(t.focus,'focus',500); lines(t.warmup,'warmup'); lines(t.cooldown,'cooldown'); lines(t.guidance,'guidance'); list(t.exercises,'exercises',30); unique(t.exercises,'exercises'); t.exercises.forEach(x=>movement(x)) }
  list(value.milestones,'milestones',30); unique(value.milestones,'milestones')
  for (const m of value.milestones) { object(m,['id','title','done'],'milestone'); id(m.id,'milestone id'); text(m.title,'milestone title',500); boolean(m.done,'milestone done') }
  list(value.sources,'sources',30)
  for (const s of value.sources) { object(s,['label','url'],'source'); text(s.label,'source label',500); text(s.url,'source url',2000); if(s.url && !/^https:\/\//i.test(s.url)) fail('Source links must use https') }
  list(value.options,'options',20)
  for (const o of value.options) { object(o,['title','items'],'option group'); text(o.title,'option title',200); lines(o.items,'options') }
  return structuredClone(value)
}
export function validateTrainingSession(value) {
  object(value,['version','planId','templateId','phaseId','warmup','cooldown','guidance','exercises','startedAt','finishedAt','actualMinutes','sessionNote','comfort'],'training session')
  if(value.version!==1)fail('Unsupported training session version')
  id(value.planId,'plan id'); id(value.templateId,'template id'); id(value.phaseId,'phase id')
  lines(value.warmup,'warmup'); lines(value.cooldown,'cooldown'); lines(value.guidance,'guidance')
  list(value.exercises,'exercises',30);unique(value.exercises,'exercises'); value.exercises.forEach(x=>movement(x,true))
  timestamp(value.startedAt,'start');timestamp(value.finishedAt,'finish');number(value.actualMinutes,'actual minutes',0,1440,true)
  text(value.sessionNote,'session note',6000);if(!['','comfortable','adjust','stop'].includes(value.comfort))fail('Choose a comfort response')
  return structuredClone(value)
}
export function validateMobilityRoutine(value) {
  object(value,['version','summary','steps'],'mobility routine'); if(value.version!==1)fail('Unsupported routine version')
  text(value.summary,'routine summary');list(value.steps,'routine steps',30);unique(value.steps,'routine steps')
  for(const s of value.steps){object(s,['id','name','dose','instructions'],'routine step');id(s.id,'step id');text(s.name,'step name',200);text(s.dose,'step dose',200);lines(s.instructions,'step instructions')}
  return structuredClone(value)
}
export const blankSet = (exerciseId, n) => ({id:`${exerciseId}-set-${n}`,reps:null,kg:null,seconds:null,done:false})
export function makeTrainingSession(planId, template, phaseId) {
  return validateTrainingSession({version:1,planId,templateId:template.id,phaseId,warmup:template.warmup,cooldown:template.cooldown,guidance:template.guidance,
    exercises:template.exercises.map(x=>({...structuredClone(x),sets:Array.from({length:x.target.sets},(_,i)=>blankSet(x.id,i+1))})),startedAt:null,finishedAt:null,actualMinutes:null,sessionNote:'',comfort:''})
}
export function trainingTotals(session) {
  const rows=(session?.exercises??[]).flatMap(e=>e.sets??[])
  return {done:rows.filter(s=>s.done).length,total:rows.length,exercises:(session?.exercises??[]).filter(e=>e.sets.some(s=>s.done)).length}
}
export function finishTraining(entry, training, now = new Date().toISOString()) {
  const value=validateTrainingSession(training)
  if (!(value.actualMinutes>0)) fail('Enter the minutes you actually exercised before finishing')
  if (value.exercises.length && trainingTotals(value).done===0) fail('Tick the sets you actually did, or leave this workout planned')
  return {status:'done',details:{...entry.details,training:{...value,finishedAt:now},duration_min:value.actualMinutes}}
}
export function validateWorkoutCompletion(details, status) {
  if (!details?.training || !['done','complete','completed'].includes(status)) return
  const training=validateTrainingSession(details.training)
  if (!(training.actualMinutes>0) || details.duration_min!==training.actualMinutes || !training.finishedAt || (training.exercises.length && !trainingTotals(training).done)) {
    fail('Open this workout in Health and finish it with actual minutes and the sets you did')
  }
}
export function trainingHistory(entries, planId) {
  return entries.filter(e=>e.type==='workout'&&e.details?.training?.planId===planId&&['done','complete','completed'].includes(e.status)).sort((a,b)=>String(b.start_at).localeCompare(String(a.start_at)))
}
export function previousExercise(entries, entry, exerciseId) {
  return entries.filter(e=>e.id!==entry.id&&['done','complete','completed'].includes(e.status)&&e.details?.training?.planId===entry.details?.training?.planId&&String(e.start_at)<String(entry.start_at))
    .sort((a,b)=>String(b.start_at).localeCompare(String(a.start_at))).map(e=>({entry:e,exercise:e.details.training.exercises.find(x=>x.id===exerciseId)})).find(x=>x.exercise?.sets.some(s=>s.done))??null
}
export function setSummary(set, exercise) {
  const dose=exercise.measure==='seconds'?set.seconds:set.reps
  return [dose===null?'dose not recorded':`${dose} ${exercise.measure==='seconds'?'sec':'reps'}${exercise.perSide?' / side':''}`,set.kg===null?'':`${set.kg} ${exercise.target.loadLabel||'kg'}`].filter(Boolean).join(' · ')
}
