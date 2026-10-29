import {test} from 'node:test'
import assert from 'node:assert/strict'
import {renderToStaticMarkup} from 'react-dom/server'
import {MemoryRouter} from 'react-router-dom'
import GymPlans, {StructuredWorkout} from '../src/components/health/GymPlans.jsx'
import HealthExercise from '../src/components/health/HealthExercise.jsx'
import FieldsForm from '../src/components/FieldsForm.jsx'
import {SessionLine} from '../src/components/health/parts.jsx'
import {makeTrainingSession} from '../../shared/health/training.js'
import ExercisePictures from '../src/components/health/ExercisePictures.jsx'
const movement={id:'sample',name:'Sample <script>alert(1)</script>',equipment:'Stable support',instructions:['Move slowly <img onerror=bad>'],cues:[],alternatives:[],optional:false,perSide:false,measure:'reps',target:{sets:1,min:5,max:8,restSeconds:60,loadLabel:'kg'}}
const template={id:'a',title:'Sample A',focus:'Learn control',warmup:['Warm up'],cooldown:['Cool down'],guidance:['Rest when needed'],exercises:[movement]}
const plan={id:'plan',type:'workout-plan',title:'Sample plan',status:'active',details:{days_per_week:2,training:{version:1,summary:'A real plan overview',goals:['A concrete goal'],equipment:[],phases:[],templates:[template],milestones:[],sources:[],options:[]}}}
const entry={id:'workout',type:'workout',title:'Sample workout',status:'planned',start_at:'2026-10-30T09:00:00Z',updated_at:'2026-10-29T00:00:00Z',details:{duration_min:60,exercises:'SECRET_LEGACY_TEXT',training:makeTrainingSession('plan',template,'first')}}
const page={entries:[plan,entry],today:'2026-10-29',loading:false,week:{planned:[],sessions:[],minutes:0,strengthDays:0},params:new URLSearchParams('view=exercise&entry=workout'),setParams(){},change(){},refetch(){}}
const render=x=>renderToStaticMarkup(<MemoryRouter>{x}</MemoryRouter>)
test('saved gym plans show the next workout and exercise technique, without a Ledger dependency',()=>{
  const html=render(<GymPlans page={page}/>);assert.match(html,/Sample plan/);assert.match(html,/Open workout/);assert.match(html,/How to do it/);assert.match(html,/A concrete goal/);assert(!html.includes('/ledger'))
})
test('workout renders accessible set logging, rest and partial-save controls, escaping source text',()=>{
  const html=render(<StructuredWorkout entry={entry} page={page} onEdit={()=>{}} onClose={()=>{}}/>);assert.match(html,/set 1 reps/);assert.match(html,/Save progress/);assert.match(html,/Finish workout/);assert.match(html,/Rest 60s/);assert(!html.includes('<script>'));assert(!html.includes('<img onerror'));assert.match(html,/&lt;script&gt;/)
})
test('an open structured workout omits the raw legacy block and unrelated programme catalogue',()=>{
  const html=render(<HealthExercise page={page}/>);assert(!html.includes('SECRET_LEGACY_TEXT'));assert(!html.includes('health-programmes'));assert.match(html,/Exercises and sets/)
})
test('generic entry forms preserve structured details rather than converting them to a text box',()=>{
  const html=render(<FieldsForm type="workout" details={entry.details} onChange={()=>{}}/>);assert.match(html,/Open them in Health/);assert(!html.includes('[object Object]'))
})
test('Today and Health open set logging rather than marking an unlogged structured workout done',()=>{
  const html=render(<SessionLine row={{entry,day:'2026-10-30'}} page={page} today="2026-10-30"/>);assert.match(html,/Log sets/);assert(!html.includes('>Done<'))
})

test('exercise pictures are visible without opening technique and have an accessible enlargement control',()=>{
  const html=render(<ExercisePictures name="Chair squat / sit-to-stand"/>);assert.match(html,/Enlarge pictures for Chair squat/);assert.match(html,/<img/);assert.match(html,/Two drawings:/);assert(!html.includes('<details'))
  assert.equal(render(<ExercisePictures name="Unknown custom movement"/>),'')
})
