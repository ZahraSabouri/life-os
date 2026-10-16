// Health → Food: today's meals, her diet, UK recipes checked against what is at home in Budget
// (added to her recipes there in one step), UK guidance on eating, and a food label checker.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api.js'
import { useHealthFood } from '../../lib/useHealth.js'
import { useDay } from '../../lib/useDay.js'
import { ALLERGENS, DAILY_LIMITS, DIETS, EATWELL, FIVE_A_DAY, FLUIDS, LEAVE_OUT, REFERENCE_INTAKES, SOURCES, TRAFFIC_LIGHTS, dietClash, trafficLight } from '../../../../shared/health/guidance.js'
import { MEALS, RECIPE_TAGS, UK_RECIPES, amountText, eatwellGroups, fiveADay } from '../../../../shared/health/recipes.js'
import { DayTicks, Source } from './parts.jsx'

const MEAL_NAMES = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }
const GROUP_LABEL = { veg: 'Fruit & veg', starch: 'Starchy carbs', protein: 'Protein', dairy: 'Dairy' }
const allergenLabel = (key) => ALLERGENS.find((a) => a.key === key)?.label.toLowerCase() ?? key

function DietForm({ diet, onSave, onCancel }) {
  const [form, setForm] = useState({ eats: diet.eats ?? 'everything', leaveOut: diet.leaveOut ?? [], avoid: diet.avoid ?? [] })
  const flip = (key, value) => setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }))
  return <form className="entry-editor health-form" onSubmit={(event) => { event.preventDefault(); onSave(form) }} aria-label="My diet">
    <label><span>I eat</span><select value={form.eats} onChange={(event) => setForm((f) => ({ ...f, eats: event.target.value }))}>{DIETS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}</select></label>
    <fieldset className="health-checks"><legend>I leave out</legend>{LEAVE_OUT.map((x) => <label key={x.key} className="health-choice"><input type="checkbox" checked={form.leaveOut.includes(x.key)} onChange={() => flip('leaveOut', x.key)} /><span>{x.label}</span></label>)}</fieldset>
    <fieldset className="entry-editor-wide health-checks health-allergens"><legend>Allergens I avoid (the 14 UK food law names)</legend>
      {ALLERGENS.map((a) => <label key={a.key} className="health-choice"><input type="checkbox" checked={form.avoid.includes(a.key)} onChange={() => flip('avoid', a.key)} /><span><b>{a.label}</b> <small>{a.say}</small></span></label>)}
    </fieldset>
    <p className="entry-editor-wide health-small">Recipes that do not suit are set aside, with the reason. Always read the label: a product can contain an allergen the recipe does not name. <Source source={SOURCES.allergens} /></p>
    <p className="entry-editor-wide entry-editor-actions"><button type="submit" className="entry-editor-save">Save my diet</button><button type="button" onClick={onCancel}>Cancel</button></p>
  </form>
}

// One UK recipe, open: ingredients (what is at home), method, tip, the similar NHS recipe, and the steps to take.
function RecipeOpen({ recipe, home, food, onClose }) {
  const [state, setState] = useState({ busy: '', said: '', error: '' })
  const haveAt = new Map((home?.have ?? []).map((h) => [h.index, h.names]))
  const missing = recipe.ingredients.filter((x, i) => !x.staple && !x.optional && !haveAt.has(i))
  async function add() {
    setState({ busy: 'add', said: '', error: '' })
    try { const saved = await food.add(recipe.id); setState({ busy: '', said: saved.already ? 'Already in your recipes.' : `Added to your recipes in Budget as “${saved.recipe.name}”.`, error: '' }) } catch (failure) { setState({ busy: '', said: '', error: failure.message }) }
  }
  async function shop() {
    setState({ busy: 'shop', said: '', error: '' })
    try {
      const saved = await apiFetch('/api/home/shopping', { method: 'POST', body: JSON.stringify({ items: missing.map((x) => x.name) }) })
      setState({ busy: '', said: saved.added?.length ? `On “${saved.list.name}”: ${saved.added.join(', ')}.${saved.skipped?.length ? ` Already there: ${saved.skipped.join(', ')}.` : ''}` : `Already on “${saved.list.name}”.`, error: '' })
    } catch (failure) { setState({ busy: '', said: '', error: failure.message }) }
  }
  return <article className="day-panel health-recipe-open" aria-labelledby={`recipe-${recipe.id}`}>
    <header><h2 id={`recipe-${recipe.id}`}>{recipe.name}</h2><button type="button" className="ghost-pill compact-pill" onClick={onClose}>Close</button></header>
    <p className="health-small">{[MEAL_NAMES[recipe.meal], `${recipe.minutes} min`, `serves ${recipe.serves}`, `about ${fiveADay(recipe)} of your 5 A Day a serving`].join(' · ')}</p>
    <p className="health-tags">{recipe.tags.map((t) => <span key={t}>{RECIPE_TAGS[t] ?? t}</span>)}{recipe.allergens.length ? <span className="is-warn">Contains {recipe.allergens.map(allergenLabel).join(', ')}</span> : <span>None of the 14 allergens</span>}</p>
    <div className="health-recipe-columns">
      <section><h3>Ingredients</h3>
        <ul className="health-ingredients">{recipe.ingredients.map((x, i) => { const have = haveAt.get(i)
          return <li key={i} className={x.staple ? 'is-staple' : have ? 'is-have' : x.optional ? 'is-optional' : 'is-missing'}>
            <span><b>{amountText(x)}</b> {x.name}{x.optional ? ' (optional)' : ''}{x.note ? <small> · {x.note}</small> : null}</span>
            <small>{x.staple ? 'check you have it' : have ? `at home: ${have.join(', ')}` : x.optional ? '' : 'not at home'}</small>
          </li> })}</ul>
      </section>
      <section><h3>Method</h3><ol className="health-steps">{recipe.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
        {recipe.tip ? <p className="health-small">{recipe.tip}</p> : null}
        {recipe.nhs ? <p className="health-small">A similar recipe, with its nutrition: <a href={recipe.nhs.url} target="_blank" rel="noreferrer">{recipe.nhs.title} (NHS Healthier Families)</a></p> : null}
      </section>
    </div>
    <p className="entry-editor-actions">
      {home?.added ? <Link className="entry-editor-save" to={`/budget#/meals/recipes?recipe=${encodeURIComponent(home.added)}`}>Open it in your recipes</Link>
        : <button type="button" className="entry-editor-save" disabled={Boolean(state.busy || food.error)} onClick={add}>{state.busy === 'add' ? 'Adding…' : 'Add to my recipes'}</button>}
      {missing.length ? <button type="button" disabled={Boolean(state.busy)} onClick={shop}>{state.busy === 'shop' ? 'Adding…' : `Put the ${missing.length} missing on the shopping list`}</button> : null}
    </p>
    {state.said ? <p className="day-add-hint day-add-done" role="status">{state.said}</p> : null}
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
  </article>
}

// A food label's traffic lights, from its per-100 g (or ml) figures.
function LabelChecker() {
  const [values, setValues] = useState({ fat: '', saturates: '', sugars: '', salt: '' })
  const [drink, setDrink] = useState(false)
  const [portion, setPortion] = useState('')
  const WORD = { green: 'Low', amber: 'Medium', red: 'High' }
  return <section className="day-panel" aria-labelledby="health-label">
    <header><h2 id="health-label">Check a food label</h2></header>
    <p className="health-small">Type the “per 100 {drink ? 'ml' : 'g'}” figures from the back of the pack.</p>
    <div className="day-add-kind" role="group" aria-label="Food or drink"><button type="button" aria-pressed={!drink} onClick={() => setDrink(false)}>Food</button><button type="button" aria-pressed={drink} onClick={() => setDrink(true)}>Drink</button></div>
    <div className="health-label-grid">
      {Object.entries(TRAFFIC_LIGHTS).map(([key, rule]) => { const light = values[key] === '' ? null : trafficLight(key, values[key], { drink, portion })
        return <label key={key} className={`health-light${light ? ` is-${light}` : ''}`}><span>{rule.label} (g)</span><input type="number" min="0" step="0.1" inputMode="decimal" value={values[key]} onChange={(event) => setValues((v) => ({ ...v, [key]: event.target.value }))} /><b>{light ? WORD[light] : ' '}</b></label> })}
      <label><span>Portion (g or ml, optional)</span><input type="number" min="0" step="1" value={portion} onChange={(event) => setPortion(event.target.value)} /></label>
    </div>
    <p className="health-small">Green is low, amber medium, red high. With a portion bigger than {drink ? '150 ml' : '100 g'}, a nutrient is red when one portion holds more than 30% of the day’s reference intake. <Source source={SOURCES.labels} /></p>
  </section>
}

export default function HealthFood({ page }) {
  const food = useHealthFood(true)
  const day = useDay(page.today)
  const meals = day.data?.home?.meals ?? []
  const [editingDiet, setEditingDiet] = useState(false)
  const [meal, setMeal] = useState('')
  const [only, setOnly] = useState('')
  const [suits, setSuits] = useState(true)
  const [words, setWords] = useState('')
  const [open, setOpen] = useState(page.params.get('recipe') ?? '')
  const homeOf = useMemo(() => new Map((food.ideas ?? []).map((x) => [x.id, x])), [food.ideas])
  const diet = page.diet
  const dietWords = [DIETS.find((d) => d.key === diet.eats)?.label, ...(diet.leaveOut ?? []).map((k) => LEAVE_OUT.find((x) => x.key === k)?.label.toLowerCase()), (diet.avoid ?? []).length ? `avoiding ${diet.avoid.map(allergenLabel).join(', ')}` : ''].filter(Boolean)
  const list = UK_RECIPES.map((r) => ({ r, why: dietClash(r, diet), home: homeOf.get(r.id) }))
    .filter(({ r, why, home }) => (!meal || r.meal === meal) && (!suits || !why.length) && (!words.trim() || `${r.name} ${r.ingredients.map((x) => x.name).join(' ')}`.toLowerCase().includes(words.trim().toLowerCase()))
      && (!only || (only === 'ready' ? home?.ready : only === 'quick' ? r.minutes <= 20 : r.tags.includes(only))))
    .sort((a, b) => Number(Boolean(b.home?.ready)) - Number(Boolean(a.home?.ready)) || (b.home ? b.home.haveCount / Math.max(1, b.home.needCount) : 0) - (a.home ? a.home.haveCount / Math.max(1, a.home.needCount) : 0) || a.r.name.localeCompare(b.r.name))
  const setAside = UK_RECIPES.filter((r) => dietClash(r, diet).length).length
  const opened = UK_RECIPES.find((r) => r.id === open)
  return <>
    <div className="health-grid">
      <section className="day-panel" aria-labelledby="health-food-today">
        <header><h2 id="health-food-today">Eating today</h2><Link to="/budget#/meals/now">What can I eat now?</Link></header>
        {meals.length ? <ul className="day-list">{meals.map((m) => <li key={m.id} className={m.cooked ? 'is-done' : undefined}><Link to={m.href}>{m.prep ? `Cook: ${m.name}` : m.name}</Link><small>{MEAL_NAMES[m.slot] ?? 'Meal'}{m.cooked ? ' · eaten' : ''}</small></li>)}</ul>
          : <p className="day-quiet">{day.loading ? 'Reading…' : 'Nothing planned to eat today.'} <Link to="/budget#/meals/week">Plan a meal</Link></p>}
        <DayTicks page={page} day={page.today} />
      </section>
      <section className="day-panel" aria-labelledby="health-diet">
        <header><h2 id="health-diet">My diet</h2>{editingDiet ? null : <button type="button" className="ghost-pill compact-pill" onClick={() => setEditingDiet(true)}>Change</button>}</header>
        {editingDiet ? <DietForm diet={diet} onCancel={() => setEditingDiet(false)} onSave={(value) => { page.setDiet(value).catch(() => {}); setEditingDiet(false) }} />
          : <p>{dietWords.join(' · ')}{setAside ? <small className="health-small"> · {setAside} of the {UK_RECIPES.length} recipes do not suit and are set aside</small> : null}</p>}
      </section>
      <section className="day-panel" aria-labelledby="health-mine">
        <header><h2 id="health-mine">Your recipes</h2><Link to="/budget#/meals/recipes">In Budget</Link></header>
        {food.error ? <p className="day-quiet day-warn">{food.error}</p> : food.loading ? <p className="day-quiet">Reading Budget…</p>
          : food.mine.length ? <><p className="review-value">{food.mine.filter((m) => m.ready).length}<small> of {food.mine.length} can be made from what is at home</small></p>
            <ul className="day-list">{food.mine.slice(0, 5).map((m) => <li key={m.id}><Link to={`/budget#/meals/recipes?recipe=${encodeURIComponent(m.id)}`}>{m.name}</Link><small>{m.ready ? 'everything at home' : `missing ${m.missing.slice(0, 3).join(', ')}`}</small></li>)}</ul></>
            : <p className="day-quiet">No recipes in Budget yet. Add one of the UK recipes below.</p>}
      </section>
    </div>

    <h2 className="health-section-head" id="health-recipes">UK recipes</h2>
    <p className="health-small">British and Welsh favourites and cheap everyday cooking, written for Life OS. Each is checked against the food at home in Budget{food.atHome ? ` (${food.atHome} things)` : ''}; “Add to my recipes” puts it in Budget, where it can be planned and cooked. Similar recipes with their nutrition are on <Source source={SOURCES.recipes} />.</p>
    {opened ? <RecipeOpen key={opened.id} recipe={opened} home={homeOf.get(opened.id)} food={food} onClose={() => setOpen('')} /> : null}
    <div className="health-filters">
      <label><span>Find</span><input type="search" value={words} onChange={(event) => setWords(event.target.value)} placeholder="Leek, curry, eggs…" /></label>
      <label><span>Meal</span><select value={meal} onChange={(event) => setMeal(event.target.value)}><option value="">Any</option>{MEALS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select></label>
      <label><span>Show</span><select value={only} onChange={(event) => setOnly(event.target.value)}><option value="">All</option><option value="ready">Everything at home</option><option value="quick">20 minutes or less</option><option value="budget">Cheap</option><option value="freezes">Freezes</option><option value="batch">Cooks for the week</option><option value="welsh">Welsh</option></select></label>
      <label className="health-choice"><input type="checkbox" checked={suits} onChange={(event) => setSuits(event.target.checked)} /><span>Only what suits my diet</span></label>
    </div>
    <ul className="health-recipe-list">{list.map(({ r, why, home }) => <li key={r.id} className={open === r.id ? 'is-open' : undefined}>
      <button type="button" className="health-recipe-head" onClick={() => setOpen(open === r.id ? '' : r.id)} aria-expanded={open === r.id}>
        <b>{r.name}</b>
        <small>{[MEAL_NAMES[r.meal], `${r.minutes} min`, `serves ${r.serves}`, `${fiveADay(r)} of 5 A Day`].join(' · ')}</small>
        <small className={home?.ready ? 'is-ready' : ''}>{food.loading ? '' : home ? (home.ready ? 'Everything at home' : `Have ${home.haveCount} of ${home.needCount} · missing ${home.missing.slice(0, 3).join(', ')}${home.missing.length > 3 ? '…' : ''}`) : ''}{home?.added ? ' · in your recipes' : ''}</small>
        <span className="health-tags">{eatwellGroups(r).map((g) => <span key={g}>{GROUP_LABEL[g]}</span>)}{why.length ? <span className="is-warn">{why.join(', ')}</span> : null}</span>
      </button>
    </li>)}</ul>
    {!list.length ? <p className="day-quiet">No recipe matches. {suits ? 'Untick “Only what suits my diet” or ' : ''}clear the filters.</p> : null}

    <h2 className="health-section-head" id="health-eating-well">Eating well, the UK way</h2>
    <div className="health-grid">
      <section className="day-panel" aria-labelledby="health-eatwell">
        <header><h2 id="health-eatwell">The Eatwell Guide</h2></header>
        <p className="health-small">How a day’s (or a week’s) food divides up:</p>
        <ul className="health-eatwell">{EATWELL.map((g) => <li key={g.key}><span><b>{g.label}</b><small>{g.say}</small></span><span className="health-bar" role="img" aria-label={`about ${g.share}%`}><i style={{ width: `${Math.max(2, g.share * 2.2)}%` }} /></span><em>{g.share}%</em></li>)}</ul>
        <p className="health-small">Foods high in fat, salt or sugar sit outside it: less often and in small amounts. <Source source={SOURCES.eatwell} /></p>
      </section>
      <section className="day-panel" aria-labelledby="health-five">
        <header><h2 id="health-five">5 A Day and drinks</h2></header>
        <ul className="health-plain">{FIVE_A_DAY.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
        <p className="health-small"><Source source={SOURCES.fiveADay} /></p>
        <p>{FLUIDS.say}</p>
        <p className="health-small"><Source source={SOURCES.fluids} /></p>
      </section>
      <section className="day-panel" aria-labelledby="health-intakes">
        <header><h2 id="health-intakes">On a label, “% RI”</h2></header>
        <p className="health-small">Reference intakes for an average adult in a day, which labels count against:</p>
        <dl className="health-intakes">{REFERENCE_INTAKES.map((r) => <div key={r.key}><dt>{r.label}</dt><dd>{r.amount}</dd></div>)}</dl>
        <ul className="health-plain">{DAILY_LIMITS.map((l) => <li key={l.label}><b>{l.label}:</b> {l.say} <Source source={SOURCES[l.source]} /></li>)}</ul>
      </section>
      <LabelChecker />
    </div>
  </>
}
