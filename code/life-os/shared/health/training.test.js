import {test} from 'node:test'
import assert from 'node:assert/strict'
import {validateDetails} from '../entryTypes.js'
import {makeTrainingSession,finishTraining,trainingHistory,trainingTotals,validateTrainingPlan,validateTrainingSession,validateWorkoutCompletion,previousExercise} from './training.js'
const move={id:'move',name:'A test movement',equipment:'Test equipment',instructions:['A controlled movement'],cues:[],alternatives:[],optional:false,perSide:false,measure:'reps',target:{sets:1,min:5,max:8,restSeconds:60,loadLabel:'kg'}}
const template={id:'a',title:'A',focus:'Technique',warmup:['Warm up'],cooldown:['Cool down'],guidance:['Keep control'],exercises:[move]}
const plan={version:1,summary:'Fixture',goals:['Learn'],equipment:[],phases:[{id:'first',title:'First',description:'Learn',criteria:[]}],templates:[template],milestones:[{id:'learned',title:'Learned',done:false}],sources:[],options:[]}
test('structured data roundtrips through core validation without changing old fields',()=>{
  const session=makeTrainingSession('plan',template,'first')
  const result=validateDetails('workout',{kind:'gym',exercises:'Original source text',training:session,area:'body'})
  assert(result.ok);assert.deepEqual(result.value.training,session);assert.equal(result.value.exercises,'Original source text');assert.deepEqual(result.stripped,[])
  assert(validateDetails('workout-plan',{training:plan}).ok)
  assert(validateDetails('workout',{exercises:'Old workout'}).ok)
})
test('validation rejects duplicate ids, negative loads, malformed data and unsafe source URLs',()=>{
  const session=makeTrainingSession('plan',template,'first');session.exercises[0].sets[0].kg=-1
  assert.throws(()=>validateTrainingSession(session),/kg/)
  session.exercises[0].sets[0].kg=null;session.exercises.push(structuredClone(session.exercises[0]));assert.throws(()=>validateTrainingSession(session),/duplicate/)
  const p=structuredClone(plan);p.sources=[{label:'Bad',url:'javascript:alert(1)'}];assert.throws(()=>validateTrainingPlan(p),/https/)
  assert.equal(validateDetails('workout',{training:{version:1}}).ok,false)
})
test('completion requires actual duration and actual sets; a partial session never ticks the rest',()=>{
  const training=makeTrainingSession('plan',{...template,exercises:[move,{...move,id:'other'}]},'first'),entry={details:{training,moderate_min:0,note:'Preserve'}}
  assert.throws(()=>finishTraining(entry,training),/minutes/)
  training.actualMinutes=25;assert.throws(()=>finishTraining(entry,training),/Tick/)
  training.exercises[0].sets[0]={...training.exercises[0].sets[0],done:true,reps:6,kg:0}
  const patch=finishTraining(entry,training,'2026-10-30T10:00:00Z')
  assert.equal(patch.status,'done');assert.equal(patch.details.duration_min,25);assert.equal(patch.details.note,'Preserve');assert.equal(patch.details.training.exercises[1].sets[0].done,false)
  assert.deepEqual(trainingTotals(patch.details.training),{done:1,total:2,exercises:1})
  assert.throws(()=>validateWorkoutCompletion(entry.details,'done'),/finish it/)
  assert.doesNotThrow(()=>validateWorkoutCompletion(patch.details,patch.status))
  assert.doesNotThrow(()=>validateWorkoutCompletion({duration_min:30},'done'))
})
test('history and previous results use completed workouts from the same plan only',()=>{
  const training=makeTrainingSession('plan',template,'first');training.exercises[0].sets[0].done=true
  const entry=(id,date,status='done',planId='plan')=>({id,type:'workout',start_at:date,status,details:{training:{...structuredClone(training),planId}}})
  const current=entry('current','2026-11-03','planned'),older=entry('older','2026-10-30'),future=entry('future','2026-11-05'),unrelated=entry('unrelated','2026-11-01','done','another')
  assert.equal(trainingHistory([current,older,future,unrelated],'plan').length,2)
  assert.equal(previousExercise([current,older,future,unrelated],current,'move').entry.id,'older')
})
