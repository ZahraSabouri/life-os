// node --test code/life-os/shared/health/health.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { trafficLight, dietClash, ACTIVITY_TARGET, ALLERGENS } from './guidance.js'
import { EXERCISES, exercise } from './exercises.js'
import { PROGRAMMES, scheduleProgramme, programmeSession } from './programmes.js'
import { UK_RECIPES, fiveADay, eatwellGroups, amountText } from './recipes.js'
import { matchesIngredient, recipeAgainstHome, hasWords } from './match.js'
import { weekOfMoving, sessionCounts, weekStart, dayTicks } from './week.js'

test('Couch to 5K follows the NHS plan: 27 runs, the right totals, warm-up and cool-down included', () => {
  const runs = programme('c25k')
  assert.equal(runs.length, 27)
  const total = (key) => runs.find((r) => r.key === key).minutes
  assert.deepEqual(['1-1', '2-1', '3-1', '4-1', '5-1', '5-2', '5-3', '6-1', '6-2', '6-3', '7-1', '8-1', '9-3'].map(total), [28.5, 29, 25, 31.5, 31, 31, 30, 34, 33, 35, 35, 38, 40])
  const w1 = programmeSession('c25k', '1-1')
  assert.equal(w1.vigorous, 8); assert.equal(w1.moderate, 20.5)
  assert.match(w1.steps[1], /Run 1 minute, then walk 1½ minutes\. Do this 7 times\./)
  assert.match(programmeSession('c25k', '5-3').steps[1], /Run for 20 minutes without stopping/)
})
function programme(id) { return PROGRAMMES.find((p) => p.id === id).sessions() }

test('every programme session names exercises from the library and a programme schedules on the chosen weekdays', () => {
  for (const p of PROGRAMMES) for (const s of p.sessions()) for (const id of s.exercises) assert.ok(exercise(id), `${p.id} ${s.key}: ${id}`)
  const plan = scheduleProgramme('c25k', { start: '2026-10-15', days: [1, 3, 6] }) // a Thursday
  assert.equal(plan.length, 27)
  assert.deepEqual(plan.slice(0, 4).map((x) => x.date), ['2026-10-17', '2026-10-19', '2026-10-21', '2026-10-24'])
  assert.equal(plan[0].session.key, '1-1')
  assert.throws(() => scheduleProgramme('c25k', { start: 'soon' }), /day to start/)
})

test('a week counts moderate minutes, vigorous twice, strength days, and only what was done', () => {
  const at = (day, details, status = 'done') => ({ type: 'workout', status, start_at: day, details })
  const week = weekOfMoving([
    at('2026-10-12', { kind: 'walk', duration_min: 30 }), // moderate by its kind
    at('2026-10-13', { kind: 'run', duration_min: 20, effort: 'vigorous' }),
    at('2026-10-14', { kind: 'gym', duration_min: 50, moderate_min: 10, vigorous_min: 0, strength: true }),
    at('2026-10-15', { kind: 'strength', duration_min: 25, moderate_min: 0, vigorous_min: 0, strength: true }),
    at('2026-10-16', { kind: 'run', duration_min: 30 }, 'planned'),
    at('2026-10-19', { kind: 'walk', duration_min: 60 }), // next week
  ], '2026-10-15')
  assert.equal(week.from, '2026-10-12'); assert.equal(week.to, '2026-10-18')
  assert.equal(week.minutes, 30 + 40 + 10)
  assert.equal(week.strengthDays, 2); assert.equal(week.activeDays, 4); assert.equal(week.planned.length, 1)
  assert.equal(week.met, false)
  assert.equal(ACTIVITY_TARGET.moderateMinutes, 150)
  assert.deepEqual(sessionCounts({ details: { kind: 'yoga', duration_min: 45 } }), { total: 45, moderate: 0, vigorous: 0, counted: 0, strength: true })
  assert.equal(weekStart('2026-10-18'), '2026-10-12')
  const ticks = dayTicks([{ type: 'measurement', start_at: '2026-10-15', created_at: '1', details: { metric: 'five-a-day', value: 2 } }, { type: 'measurement', start_at: '2026-10-15', created_at: '2', details: { metric: 'five-a-day', value: 3 } }], '2026-10-15')
  assert.equal(ticks['five-a-day'].value, 3)
})

test('traffic lights follow the UK bands, with the portion rule', () => {
  assert.equal(trafficLight('fat', 3), 'green'); assert.equal(trafficLight('fat', 3.1), 'amber'); assert.equal(trafficLight('fat', 17.6), 'red')
  assert.equal(trafficLight('salt', 1.5), 'amber'); assert.equal(trafficLight('salt', 1.6), 'red')
  assert.equal(trafficLight('sugars', 10, { drink: true }), 'amber'); assert.equal(trafficLight('sugars', 12, { drink: true }), 'red')
  assert.equal(trafficLight('fat', 10, { portion: 250 }), 'red', '25 g of fat in one 250 g portion')
  assert.equal(trafficLight('fat', -1), null)
  assert.equal(ALLERGENS.length, 14)
})

test('a diet and the allergens to avoid say why a recipe does not suit', () => {
  const r = (id) => UK_RECIPES.find((x) => x.id === id)
  assert.deepEqual(dietClash(r('cawl'), { eats: 'vegetarian' }), ['has lamb'])
  assert.deepEqual(dietClash(r('kedgeree'), { eats: 'pescatarian' }), [])
  assert.deepEqual(dietClash(r('welsh-rarebit'), { eats: 'vegan' }), ['has milk'])
  assert.deepEqual(dietClash(r('red-lentil-dhal'), { eats: 'vegan', avoid: ['gluten'] }), [])
  assert.deepEqual(dietClash(r('sausage-mash-gravy'), { leaveOut: ['pork'] }), ['has pork'])
  assert.ok(dietClash(r('egg-fried-rice'), { avoid: ['soya'] }).some((why) => /soya/.test(why)))
})

test('the recipes are whole: steps, ingredients, honest labels', () => {
  const ids = new Set()
  for (const r of UK_RECIPES) {
    assert.ok(!ids.has(r.id), r.id); ids.add(r.id)
    assert.ok(r.steps.length >= 2 && r.ingredients.length >= 2 && r.serves > 0 && r.minutes > 0, r.id)
    if (r.tags.includes('vegan')) assert.deepEqual(dietClash(r, { eats: 'vegan' }), [], `${r.id} is labelled vegan`)
    if (r.tags.includes('vegetarian')) assert.deepEqual(dietClash(r, { eats: 'vegetarian' }), [], `${r.id} is labelled vegetarian`)
    for (const a of r.allergens) assert.ok(ALLERGENS.some((x) => x.key === a), `${r.id}: ${a}`)
    if (r.nhs) assert.match(r.nhs.url, /^https:\/\/www\.nhs\.uk\/healthier-families\/recipes\/[a-z0-9-]+\/$/)
    assert.ok(eatwellGroups(r).length >= 1, r.id)
  }
  assert.equal(fiveADay(UK_RECIPES.find((r) => r.id === 'beans-on-toast')), 1, 'beans count once')
  assert.equal(amountText({ qty: 0.5, unit: '' }), '½'); assert.equal(amountText({ qty: 400, unit: 'g' }), '400g'); assert.equal(amountText({ qty: 2, unit: 'cloves' }), '2 cloves')
  assert.ok(EXERCISES.length >= 40)
})

test('ingredients find food at home by whole words, never a drink, a sauce or a flavour', () => {
  const onion = UK_RECIPES.find((r) => r.id === 'shakshuka').ingredients[0]
  assert.ok(matchesIngredient(onion, 'Red onion')); assert.ok(!matchesIngredient(onion, 'Spring onions')); assert.ok(!matchesIngredient(onion, 'Pickled red onions'))
  const oats = UK_RECIPES.find((r) => r.id === 'porridge-berries').ingredients[0]
  assert.ok(matchesIngredient(oats, 'Scottish porridge oats 1kg')); assert.ok(!matchesIngredient(oats, 'MOMA Raspberry & Blonde Chocolate Oat Drink 1L'))
  const berries = UK_RECIPES.find((r) => r.id === 'porridge-berries').ingredients[2]
  assert.ok(matchesIngredient(berries, 'Frozen raspberries')); assert.ok(!matchesIngredient(berries, 'Raspberry jam'))
  const yoghurt = UK_RECIPES.find((r) => r.id === 'yoghurt-berries').ingredients[0]
  assert.ok(matchesIngredient(yoghurt, 'Greek style natural yoghurt'), 'a yoghurt is not ruled out by the word yoghurt')
  assert.ok(hasWords('Free range eggs', 'egg')); assert.ok(!hasWords('Eggplant', 'egg'))
  const home = recipeAgainstHome(UK_RECIPES.find((r) => r.id === 'beans-on-toast'), [{ name: 'Heinz beanz', remaining: 1 }, { name: 'Wholemeal loaf', remaining: 1 }])
  assert.equal(home.ready, true); assert.equal(home.missing.length, 0)
})
