/* Food you can use: Now (what to eat), recipes you can read, a meal card that says what it is,
   and finishing things at home without a date. Loaded after meal-workflow-ui.js. */
const FOOD_SLOT_NAMES = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
const FOOD_FRACTIONS = [[0.25, '¼'], [0.33, '⅓'], [0.5, '½'], [0.67, '⅔'], [0.75, '¾']];
// "0.25 pack" reads as "¼ pack"; "1 number" as "1"; "2 pack" as "2 packs".
function foodQty(q, unit) {
  const n = Number(q); if (!Number.isFinite(n)) return String(unit || '');
  const u = String(unit || '').trim();
  if (['number', 'item', 'items', ''].includes(u)) return String(+n.toFixed(2));
  const whole = Math.floor(n + 1e-6), part = n - whole, frac = FOOD_FRACTIONS.find(([v]) => Math.abs(part - v) < 0.02);
  if (frac && (whole < 10)) return (whole ? whole : '') + frac[1] + ' ' + (n > 1 ? displayQty(2, u).replace(/^2 /, '') : u);
  return displayQty(+n.toFixed(2), u);
}
function soonText(x) {
  if (!x) return '';
  if (x.kind === 'passed') return (x.useBy ? 'Use-by ' : 'Best before ') + prettyDate(x.date) + ' has passed';
  if (x.kind === 'label') return x.days === 0 ? 'Use today' : (x.useBy ? 'Use by ' : 'Best before ') + prettyDate(x.date);
  if (x.kind === 'made') return 'Made ' + prettyDate(x.date);
  return 'In the fridge since ' + prettyDate(x.date);
}
// A recipe's method as numbered steps: its own lines, or its sentences when it is one paragraph.
function foodSteps(text) {
  const raw = String(text || '').trim(); if (!raw) return [];
  const lines = raw.split(/\r?\n+/).map((l) => l.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return raw.split(/(?<=[.!?])\s+(?=[A-Z])/).map((x) => x.trim()).filter(Boolean);
}
// "Cook this now", from Now, Recipes or a recipe's page: on the plan for this mealtime, then its card opens.
function foodCookNow({ state: s, commit, setDialog }, recipe, servings, onError = () => {}) {
  const id = uid('meal'), slot = slotAt(), gave = mealsGivingWay(s, recipe, servings);
  const msg = 'On ' + FOOD_SLOT_NAMES[slot].toLowerCase() + ' today' + (gave.length ? ' · ' + gave.map((m) => m.name + ' (' + foodShortDay(m.date) + ')').join(', ') + ' now ' + (gave.length === 1 ? 'needs' : 'need') + ' more' : '');
  return commit((st) => cookFromHome(st, { id, slot, recipe, servings }), msg).then(() => setDialog({ type: 'meal-detail', id })).catch((x) => onError(x.message));
}
function foodDay(date) { return prettyDate(date, { weekday: 'long', day: 'numeric', month: 'long' }); }
function foodShortDay(date, today = isoDate(new Date())) { return date === today ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : date === addDays(today, 1) ? 'Tomorrow' : prettyDate(date, { weekday: 'short', day: 'numeric', month: 'short' }); }
function entryKeyForRow(s, rowId) { return catalogueEntries(s).find((g) => g.rows.some((r) => r.id === rowId))?.key || ''; }
function batchOf(s, meal) { return meal?.preparedFrom ? s.mealEntries.find((x) => x.id === meal.preparedFrom) : null; }

// Words for a meal's state that say what to do, not how it is stored.
mealStatus = function foodMealStatus(m) {
  if (m.status === 'skipped') return 'Skipped';
  if (m.status === 'cooked') return m.prepOnly ? 'Cooked' : 'Eaten';
  if (m.kind === 'prep') return m.missing?.length ? 'Needs ' + m.missing.length + (m.missing.length === 1 ? ' thing' : ' things') : 'Batch · makes ' + m.servings;
  if (m.waitingForPrep) return 'Cook the batch first';
  if (m.missing?.length) return 'Needs ' + m.missing.length + (m.missing.length === 1 ? ' thing' : ' things');
  if (m.date < isoDate(new Date())) return 'Not marked yet';
  return m.reservations?.length || m.touches?.length ? 'All at home' : 'Planned';
};
const foodBaseUsageText = usageText;
usageText = function foodUsageText(x) { const t = foodBaseUsageText(x); return x.undated ? { ...t, sub: t.sub + ' · date not known' } : t; };

const foodBaseProductDialog = ProductDialog;
ProductDialog = function foodDialog(p) {
  const extra = { 'recipe-page': FoodRecipePage, 'meal-to-recipe': FoodWriteMethod, 'finish-stock': FoodFinish, 'copy-recipe': FoodCopyRecipe };
  const C = extra[p.dialog.type]; return C ? e(C, p) : e(foodBaseProductDialog, p);
};

// ---- Meals & recipes: Now · Week · Recipes · Batches · Original calendar ----
MealsV2 = function foodMeals(p) {
  const s = p.state, views = ['now', 'week', 'recipes', 'prep', 'original'], view = views.includes(p.route?.view) ? p.route.view : 'now';
  const tabs = e('div', { className: 'page-tabs' }, e(Segment, { label: 'Meals view', value: view, onChange: (v) => p.go({ view: v, meal: '' }), options: [['now', 'Now'], ['week', 'Week'], ['recipes', 'Recipes'], ['prep', 'Batches'], ['original', 'Original calendar']] }));
  const action = view === 'recipes' ? e(Btn, { kind: 'primary', icon: 'plus', onClick: () => p.setDialog({ type: 'recipe' }) }, 'Add a recipe')
    : view === 'prep' ? e(Btn, { kind: 'primary', icon: 'plus', onClick: () => p.setDialog({ type: 'prep-plan' }) }, 'Plan a batch')
      : e(Btn, { kind: 'primary', icon: 'plus', onClick: () => p.setDialog({ type: 'meal' }) }, 'Add a meal');
  const heading = e(PageHeading, { title: 'Meals & recipes', action: e('div', { className: 'inline-actions' }, view === 'week' && e(Btn, { onClick: () => p.setDialog({ type: 'food-budget' }) }, s.foodPlan ? 'Meal budget' : 'Set meal budget'), action) });
  const body = view === 'now' ? e(FoodNow, p) : view === 'week' ? e(FoodWeek, p) : view === 'recipes' ? e(FoodRecipes, p) : view === 'prep' ? e(FoodBatches, p) : e(Planner, p);
  return e(React.Fragment, null, heading, tabs, body);
};

function FoodNow(p) {
  const s = p.state, today = isoDate(new Date()), [slot, setSlot] = useState(() => slotAt()), now = foodNow(s, { today, slot });
  const ranked = useMemo(() => rankRecipes(s, {}), [s]);
  const ready = ranked.filter((x) => x.ready), one = ranked.filter((x) => x.missing.length === 1), more = ranked.filter((x) => x.missing.length > 1);
  const [showMore, setShowMore] = useState(false), [soonAll, setSoonAll] = useState(false);
  const run = (fn, msg) => p.commit(fn, msg).catch(() => {});
  const cookNow = (x) => foodCookNow(p, x.recipe, x.recipe.servings);
  const openMeals = [...now.earlierToday, ...now.open];
  return e('div', { className: 'food-now' },
    e('section', { className: 'surface food-now-head' },
      e('div', null, e('span', { className: 'eyebrow' }, foodDay(today)), e('h2', null, FOOD_SLOT_NAMES[slot])),
      e(Segment, { label: 'Mealtime', value: slot, onChange: setSlot, options: Object.entries(FOOD_SLOT_NAMES) })),
    e('section', { className: 'food-now-planned' },
      now.planned.length ? now.planned.map((m) => e(FoodMealCard, { key: m.id, state: s, meal: m, setDialog: p.setDialog, run }))
        : e('div', { className: 'surface food-empty' }, e('p', null, 'Nothing planned for ' + FOOD_SLOT_NAMES[slot].toLowerCase() + ' today.'), e('div', { className: 'inline-actions' }, e(Btn, { kind: 'primary', onClick: () => p.setDialog({ type: 'meal', date: today, slot }) }, 'Plan ' + FOOD_SLOT_NAMES[slot].toLowerCase()), ready.length > 0 && e('a', { className: 'text-link', href: '#food-cook' }, 'Or cook from what you have'))),
      now.prep.map((m) => e('div', { className: 'surface food-line', key: m.id }, e('div', null, e('strong', null, 'Cook today: ' + m.name), e('small', null, 'Makes ' + m.servings + (m.servings === 1 ? ' portion' : ' portions') + (s.mealEntries.some((x) => x.preparedFrom === m.id && x.status === 'planned') ? ' for ' + s.mealEntries.filter((x) => x.preparedFrom === m.id && x.status === 'planned').map((x) => foodShortDay(x.date)).join(', ') : ''))), e(Btn, { small: true, kind: 'primary', onClick: () => p.setDialog({ type: 'meal-detail', id: m.id }) }, 'Open'))),
      now.next && !now.planned.length && e('p', { className: 'muted food-next' }, 'Next planned: ' + now.next.name + ' · ' + foodShortDay(now.next.date) + ', ' + FOOD_SLOT_NAMES[now.next.slot || 'dinner'].toLowerCase() + '.')),
    openMeals.length > 0 && e('section', { className: 'surface food-open' },
      e(SectionTitle, { title: 'Did you eat these?', note: 'Planned and not marked yet. Marking one takes what it used out of your cupboard on its own day.' }),
      openMeals.slice(0, 8).map((m) => { const batch = batchOf(s, m), blocked = m.kind === 'prep' || m.waitingForPrep || batch && batch.status !== 'cooked';
        return e('div', { className: 'food-line', key: m.id },
          e('button', { type: 'button', className: 'food-line-main', onClick: () => p.setDialog({ type: 'meal-detail', id: m.id }) }, e('strong', null, m.name), e('small', null, foodShortDay(m.date, today) + ' · ' + FOOD_SLOT_NAMES[m.slot || 'dinner'])),
          e('div', { className: 'inline-actions' }, blocked ? e(Btn, { small: true, onClick: () => p.setDialog({ type: 'meal-detail', id: m.id }) }, 'Open') : e(Btn, { small: true, kind: 'primary', onClick: () => run((st) => cookMeal(st, m.id, 0, true, { date: m.date }), 'Marked eaten on ' + prettyDate(m.date)) }, 'I ate it'),
            m.kind !== 'prep' && e(Btn, { small: true, onClick: () => run((st) => skipWorkflowMeal(st, m.id), 'Marked as not eaten · its food is free again') }, 'I didn’t'))); }),
      openMeals.length > 8 && e('p', { className: 'muted' }, 'and ' + (openMeals.length - 8) + ' more in the Week view.')),
    now.ready.length > 0 && e('section', { className: 'surface food-ready' },
      e(SectionTitle, { title: 'Ready to eat', note: 'Cooked portions waiting in the fridge or freezer.' }),
      now.ready.map((x) => e('div', { className: 'food-line', key: x.lot.id }, e('div', null, e('strong', null, x.batch?.name || x.lot.name.replace(/ — leftovers$/, '')), e('small', null, [foodQty(x.lot.remaining, x.lot.unit === 'serving' ? 'portion' : x.lot.unit) + ' in the ' + String(x.lot.location || 'fridge').toLowerCase(), x.soon ? soonText(x.soon) : ''].filter(Boolean).join(' · '))),
        x.batch?.kind === 'prep' ? e(Btn, { small: true, kind: 'primary', onClick: () => p.setDialog({ type: 'prepared-meal', batchId: x.batch.id }) }, 'Eat a portion') : e(Btn, { small: true, onClick: () => p.setDialog({ type: 'use-stock', ids: [x.lot.id] }) }, 'Eat some')))),
    e('section', { className: 'food-cook', id: 'food-cook' },
      e(SectionTitle, { title: 'Cook from what you have', note: ranked.length ? 'Your recipes, checked against what is at home now. Food that should be eaten soon puts a recipe first.' : 'No recipes yet. Add one, or save a meal as a recipe from its card.', action: e(Btn, { small: true, onClick: () => p.go({ view: 'recipes', meal: '' }) }, 'All recipes') }),
      ready.length > 0 && e(React.Fragment, null, e('h3', { className: 'food-group-head' }, 'Everything is at home', e('span', null, ready.length)), e('div', { className: 'food-recipe-grid' }, ready.map((x) => e(FoodRecipeCard, { key: x.recipe.id, x, state: s, setDialog: p.setDialog, onCook: () => cookNow(x), run })))),
      one.length > 0 && e(React.Fragment, null, e('h3', { className: 'food-group-head' }, 'Missing one thing', e('span', null, one.length)), e('div', { className: 'food-recipe-grid' }, one.map((x) => e(FoodRecipeCard, { key: x.recipe.id, x, state: s, setDialog: p.setDialog, onCook: () => cookNow(x), run })))),
      more.length > 0 && (showMore ? e(React.Fragment, null, e('h3', { className: 'food-group-head' }, 'Missing more', e('span', null, more.length)), e('div', { className: 'food-recipe-grid' }, more.map((x) => e(FoodRecipeCard, { key: x.recipe.id, x, state: s, setDialog: p.setDialog, onCook: () => cookNow(x), run }))))
        : e(Btn, { onClick: () => setShowMore(true) }, 'Show ' + more.length + (more.length === 1 ? ' recipe' : ' recipes') + ' missing more'))),
    now.soon.length > 0 && e('section', { className: 'surface food-soon' },
      e(SectionTitle, { title: 'Eat soon', note: 'Fresh food that has been in the fridge a while, or is near its date. Already gone? Mark it finished.' }),
      now.soon.slice(0, soonAll ? 60 : 6).map(({ row: r, soon }) => e('div', { className: 'food-line', key: r.id },
        e('button', { type: 'button', className: 'food-line-main', onClick: () => { const key = entryKeyForRow(s, r.id); if (key) p.setDialog({ type: 'item-page', key }); } }, e('strong', null, niceName(r.name)), e('small', null, foodQty(r.remaining, r.unit) + ' · ' + soonText(soon))),
        e('div', { className: 'inline-actions' }, e(Btn, { small: true, onClick: () => p.setDialog({ type: 'use-stock', ids: [r.id] }) }, 'Use some'), e(Btn, { small: true, onClick: () => p.setDialog({ type: 'finish-stock', ids: [r.id] }) }, 'Finished')))),
      now.soon.length > 6 && !soonAll && e(Btn, { small: true, onClick: () => setSoonAll(true) }, 'Show all ' + now.soon.length)));
}

// One planned meal, large: what is in it, how to make it, and the one thing to do.
function FoodMealCard({ state: s, meal: m, setDialog, run }) {
  const recipe = s.recipes.find((r) => r.id === m.recipeId), batch = batchOf(s, m), steps = foodSteps(recipe?.steps);
  const parts = recipe ? recipe.ingredients.map((i) => i.name) : [...m.reservations.map((r) => niceName(r.name)), ...(m.touches || []).map((t) => niceName(t.name))];
  const blocked = m.waitingForPrep || batch && batch.status !== 'cooked';
  return e('article', { className: 'surface food-meal-card' + (m.status === 'cooked' ? ' done' : '') },
    e('div', { className: 'food-meal-top' }, e('div', null, e('h3', null, m.name), e('small', null, [mealStatus(m), recipe?.minutes ? recipe.minutes + ' minutes' : ''].filter(Boolean).join(' · '))), e(Badge, { tone: m.status === 'cooked' ? 'green' : m.missing?.length || blocked ? 'amber' : '' }, m.status === 'cooked' ? 'Eaten' : FOOD_SLOT_NAMES[m.slot || 'dinner'])),
    parts.length > 0 && e('p', { className: 'food-parts' }, parts.join(' · ')),
    batch && e('p', { className: 'muted' }, batch.status === 'cooked' ? 'From the ' + batch.name.toLowerCase() + ', already cooked.' : 'Uses the ' + batch.name.toLowerCase() + (batch.date === m.date ? ', cooked today first.' : ', cooked ' + foodShortDay(batch.date) + '.')),
    steps.length > 0 ? e('ol', { className: 'food-steps compact' }, steps.slice(0, 3).map((x, i) => e('li', { key: i }, x)), steps.length > 3 && e('li', { className: 'muted' }, '…')) : !batch && e('p', { className: 'muted' }, 'No method written yet.'),
    e('div', { className: 'inline-actions' },
      m.status === 'planned' && (blocked ? e(Btn, { kind: 'primary', onClick: () => setDialog({ type: 'meal-detail', id: batch?.id || m.id }) }, 'Cook the batch') : e(Btn, { kind: 'primary', icon: 'check', onClick: () => run((st) => cookMeal(st, m.id, 0, true, { date: m.date <= isoDate(new Date()) ? m.date : isoDate(new Date()) }), 'Eaten · taken out of your cupboard') }, 'I ate this')),
      e(Btn, { onClick: () => setDialog({ type: 'meal-detail', id: m.id }) }, 'Open'),
      recipe ? e(Btn, { onClick: () => setDialog({ type: 'recipe-page', id: recipe.id }) }, 'Recipe') : !batch && m.status === 'planned' && e(Btn, { onClick: () => setDialog({ type: 'meal-to-recipe', id: m.id }) }, 'Write how to make it')));
}

// A recipe as a choice: what is at home, what is missing, what it would use up.
function FoodRecipeCard({ x, state: s, setDialog, onCook, run }) {
  const r = x.recipe, soon = x.soon.slice(0, 3), today = isoDate(new Date());
  // "Cooking it now takes Tomatoes from Turkish tomato eggs (Mon 12 Oct)": the food, and the first other meal that had it.
  const kept = x.kept.slice(0, 2).map((l) => l.ing.name + ' from ' + l.kept[0].name + ' (' + foodShortDay(l.kept[0].date, today) + ')' + (l.kept.length > 1 ? ' and ' + (l.kept.length - 1) + ' more' : ''));
  return e('article', { className: 'surface food-recipe-card' },
    e('button', { type: 'button', className: 'food-recipe-title', onClick: () => setDialog({ type: 'recipe-page', id: r.id }) }, e('h3', null, r.name), e('small', null, [r.minutes ? r.minutes + ' min' : '', 'makes ' + r.servings].filter(Boolean).join(' · '))),
    e('ul', { className: 'food-chips' }, x.lines.map((l, i) => e('li', { key: i, className: l.state === 'none' ? (l.ing.optional ? 'optional' : 'missing') : l.state === 'short' ? 'short' : 'have', title: l.state === 'none' ? 'Not at home' : l.state === 'short' ? 'Some at home, not enough' : 'At home' }, l.ing.name))),
    soon.length > 0 && e('p', { className: 'food-soon-note' }, 'Uses food to eat soon: ' + soon.map((l) => l.ing.name + (l.soon.kind === 'fridge' ? ' (since ' + prettyDate(l.soon.date) + ')' : ' (' + soonText(l.soon) + ')')).join(', ')),
    x.planned.length > 0 && e('p', { className: 'muted' }, 'Planned for ' + x.planned.slice(0, 2).map((m) => foodShortDay(m.date, today)).join(' and ') + (x.planned.length > 2 ? ' and more' : '') + '.'),
    kept.length > 0 && e('p', { className: 'muted' }, 'Cooking it now takes ' + kept.join('; ') + (x.kept.length > 2 ? '; and more' : '') + '.'),
    x.missing.length > 0 && e('p', { className: 'muted' }, 'Missing: ' + x.missing.map((l) => l.ing.name).join(', ')),
    e('div', { className: 'inline-actions' },
      x.ready ? e(Btn, { small: true, kind: 'primary', onClick: onCook }, 'Cook this now') : e(Btn, { small: true, kind: 'primary', onClick: () => run((st) => addFoodToShopping(st, x.missing.map((l) => ({ name: l.ing.name, itemId: l.ing.itemId, quantity: l.state === 'short' ? Math.max(0, l.needed - l.have) : l.needed, unit: l.ing.unit }))), 'On your shopping list: ' + x.missing.map((l) => l.ing.name).join(', ')) }, 'Add missing to list'),
      e(Btn, { small: true, onClick: () => setDialog({ type: 'meal', recipeId: r.id }) }, 'Plan it')));
}

// ---- The recipe page: read it, cook it, plan it ----
function FoodRecipePage({ state: s, dialog: d, setDialog, commit, onClose }) {
  const r = s.recipes.find((x) => x.id === d.id), [servings, setServings] = useState(() => r?.servings || 1), [err, setErr] = useState('');
  if (!r) return e(Modal, { title: 'Recipe not found', onClose }, e('div', { className: 'dialog-body' }, e('p', null, 'This recipe is no longer here.')), e(DialogFooter, { onClose, label: 'Done' }));
  const x = recipeAtHome(s, r, { servings }), steps = foodSteps(r.steps), today = isoDate(new Date()), slot = slotAt();
  const eaten = s.mealEntries.filter((m) => m.recipeId === r.id && m.status === 'cooked').sort((a, b) => b.date.localeCompare(a.date));
  const coming = s.mealEntries.filter((m) => m.recipeId === r.id && m.status === 'planned').sort((a, b) => a.date.localeCompare(b.date));
  const run = (fn, msg) => commit(fn, msg).catch((z) => setErr(z.message));
  const cook = () => foodCookNow({ state: s, commit, setDialog }, r, servings, setErr);
  const keyOf = (l) => (l.ing.itemId ? 'item:' + l.ing.itemId : l.rows[0] ? entryKeyForRow(s, l.rows[0].id) : '');
  return e(Modal, { title: r.name, kicker: ['Recipe', r.minutes ? r.minutes + ' minutes' : '', 'makes ' + r.servings].filter(Boolean).join(' · '), onClose, wide: true },
    e('div', { className: 'dialog-body food-recipe-page' },
      e('div', { className: 'food-recipe-status' }, e(Badge, { tone: x.ready ? 'green' : 'amber' }, x.ready ? 'Everything is at home' : 'Missing ' + x.missing.length + (x.missing.length === 1 ? ' thing' : ' things')),
        e('div', { className: 'food-servings', role: 'group', 'aria-label': 'Servings' }, e('button', { type: 'button', 'aria-label': 'Fewer servings', disabled: servings <= 1, onClick: () => setServings(Math.max(1, servings - 1)) }, '−'), e('span', null, servings + (servings === 1 ? ' serving' : ' servings')), e('button', { type: 'button', 'aria-label': 'More servings', onClick: () => setServings(servings + 1) }, '+'))),
      e('div', { className: 'food-recipe-columns' },
        e('section', null, e('h3', { className: 'mini-head' }, 'Ingredients'),
          e('ul', { className: 'food-ingredients' }, x.lines.map((l, i) => { const key = keyOf(l), name = e('span', null, l.ing.name, l.ing.optional && e('small', null, ' · optional'));
            return e('li', { key: i, className: l.state === 'none' ? (l.ing.optional ? 'optional' : 'missing') : l.state === 'short' ? 'short' : 'have' },
              e('i', { 'aria-hidden': true }), key ? e('button', { type: 'button', className: 'text-link', onClick: () => setDialog({ type: 'item-page', key }) }, name) : name,
              e('b', null, l.ing.unit === 'a little' ? 'a little' : foodQty(l.needed, l.ing.unit)),
              e('small', { className: 'food-ing-home' }, l.state === 'lasting' ? 'At home' : l.state === 'have' ? (l.kept.length ? 'At home · planned for ' + l.kept.map((m) => m.name).join(', ') : 'At home') : l.state === 'short' ? 'Only ' + foodQty(l.have, l.ing.unit) + ' at home' : 'Not at home')); })),
          x.missing.length > 0 && e(Btn, { small: true, icon: 'plus', onClick: () => run((st) => addFoodToShopping(st, x.missing.map((l) => ({ name: l.ing.name, itemId: l.ing.itemId, quantity: l.state === 'short' ? Math.max(0, l.needed - l.have) : l.needed, unit: l.ing.unit }))), 'On your shopping list: ' + x.missing.map((l) => l.ing.name).join(', ')) }, 'Add what is missing to the shopping list')),
        e('section', null, e('h3', { className: 'mini-head' }, 'Method'),
          steps.length ? e('ol', { className: 'food-steps' }, steps.map((t, i) => e('li', { key: i }, t)))
            : e('div', { className: 'food-empty-method' }, e('p', { className: 'muted' }, 'No method written yet.'), e(Btn, { small: true, onClick: () => setDialog({ type: 'recipe', id: r.id }) }, 'Write the method')),
          r.notes && !isImportNote(r.notes) && e('p', { className: 'muted food-recipe-notes' }, r.notes))),
      e('div', { className: 'inline-actions food-recipe-actions' },
        e(Btn, { kind: 'primary', onClick: cook }, 'Cook it now'),
        e(Btn, { onClick: () => setDialog({ type: 'meal', recipeId: r.id }) }, 'Plan it for a day'),
        r.servings > 1 && e(Btn, { onClick: () => setDialog({ type: 'prep-plan', recipeId: r.id }) }, 'Cook as a batch'),
        e(Btn, { onClick: () => setDialog({ type: 'recipe', id: r.id }) }, 'Edit'),
        e(Btn, { onClick: () => setDialog({ type: 'copy-recipe', id: r.id }) }, 'Copy as a new recipe')),
      (coming.length > 0 || eaten.length > 0) && e('section', { className: 'food-recipe-history' }, e('h3', { className: 'mini-head' }, 'When'),
        coming.map((m) => e('button', { type: 'button', className: 'food-line-main', key: m.id, onClick: () => setDialog({ type: 'meal-detail', id: m.id }) }, e('strong', null, 'Planned · ' + foodShortDay(m.date) + ', ' + FOOD_SLOT_NAMES[m.slot || 'dinner'].toLowerCase()))),
        eaten.slice(0, 6).map((m) => e('button', { type: 'button', className: 'food-line-main', key: m.id, onClick: () => setDialog({ type: 'meal-detail', id: m.id }) }, e('small', null, 'Eaten · ' + foodShortDay(m.date) + ', ' + FOOD_SLOT_NAMES[m.slot || 'dinner'].toLowerCase())))),
      e(ErrorMessage, { error: err })),
    e(DialogFooter, { onClose, label: 'Done' }));
}
function FoodCopyRecipe({ state: s, dialog: d, setDialog, commit, onClose }) {
  const r = s.recipes.find((x) => x.id === d.id), [name, setName] = useState(r ? r.name + ' (my version)' : '');
  return e(FormModal, { title: 'Copy as a new recipe', onClose, label: 'Make the copy', onSubmit: () => { const id = uid('recipe'); return commit((st) => copyRecipe(st, d.id, name, id), 'Copied · change it as you like').then(() => setDialog({ type: 'recipe', id })); } },
    e('p', null, 'The copy starts with the same ingredients and method. Meals that follow “' + (r?.name || '') + '” keep the original.'), e(Input, { label: 'Name of the new recipe', value: name, onChange: setName, required: true }));
}

// A meal with no recipe: write how it is made, and it becomes a recipe to use again.
function FoodWriteMethod({ state: s, dialog: d, setDialog, commit, onClose }) {
  const meal = s.mealEntries.find((m) => m.id === d.id), [name, setName] = useState(meal?.name || ''), [minutes, setMinutes] = useState(''), [steps, setSteps] = useState('');
  if (!meal) return null;
  const parts = (meal.stock || []).map((x) => niceName(x.name) + (x.amount ? ' · ' + foodQty(x.amount, x.unit) : ''));
  return e(FormModal, { title: 'Write how to make it', kicker: meal.name, onClose, wide: true, label: 'Save as a recipe', onSubmit: () => { const id = uid('recipe'); return commit((st) => mealToRecipe(st, meal.id, { id, name, steps, minutes }), 'Saved as a recipe · ready to use again').then(() => setDialog({ type: 'recipe-page', id })); } },
    e('p', null, 'It becomes a recipe you can plan again, and “' + meal.name + '” follows it.'),
    e('div', { className: 'form-grid' }, e(Input, { label: 'Recipe name', value: name, onChange: setName, required: true }), e(Input, { label: 'Time in minutes (optional)', type: 'number', min: 0, value: minutes, onChange: setMinutes })),
    parts.length > 0 && e('div', null, e('h3', { className: 'mini-head' }, 'Ingredients, from this meal'), e('ul', { className: 'food-plain-list' }, parts.map((x, i) => e('li', { key: i }, x))), e('p', { className: 'muted' }, 'Amounts are for one serving. Change them, or add more, from Edit on the recipe.')),
    e(Textarea, { label: 'How to make it', value: steps, onChange: setSteps, rows: 7, placeholder: 'One step per line:\nSlice the halloumi and fry it until golden\nToss the salad with the dressing\nPut the halloumi on top' }));
}

// ---- The meal card ----
MealDetail = function foodMealDetail({ state: s, dialog: d, setDialog, commit, onClose }) {
  const meal = s.mealEntries.find((x) => x.id === d.id), today = isoDate(new Date());
  const [err, setErr] = useState(''), [left, setLeft] = useState('0'), [otherDay, setOtherDay] = useState(false), [date, setDate] = useState(() => (meal && meal.date <= today ? meal.date : today));
  const [location, setLocation] = useState('Fridge'), [expiry, setExpiry] = useState(''), [frozen, setFrozen] = useState('0'), [sure, setSure] = useState(false);
  if (!meal) return e(Modal, { title: 'Meal not found', onClose }, e('div', { className: 'dialog-body' }, e('p', null, 'This meal is no longer in the plan.')), e(DialogFooter, { onClose, label: 'Done' }));
  const recipe = s.recipes.find((r) => r.id === meal.recipeId), batch = batchOf(s, meal), lots = preparedLots(s, meal.id), steps = foodSteps(recipe?.steps), prep = meal.kind === 'prep';
  const run = (fn, msg) => commit(fn, msg).catch((x) => setErr(x.message)), planned = meal.status === 'planned';
  const children = prep ? s.mealEntries.filter((x) => x.preparedFrom === meal.id && x.status !== 'skipped') : [];
  const kept = [...meal.reservations.map((r) => ({ name: r.name, text: foodQty(r.amount, r.unit), id: r.sourceId, ok: true })), ...(meal.touches || []).map((t) => ({ name: t.name, text: 'a little', id: t.sourceId, ok: true })), ...meal.missing.map((x) => ({ name: x.name, text: foodQty(x.quantity, x.unit), ok: false }))];
  const notes = meal.notes && !isImportNote(meal.notes) ? meal.notes : '';
  const blocked = meal.waitingForPrep || batch && batch.status !== 'cooked';
  return e(Modal, { title: meal.name, kicker: foodDay(meal.date) + ' · ' + (prep ? 'Batch to cook' : FOOD_SLOT_NAMES[meal.slot || 'dinner'] || 'Meal'), onClose, wide: true }, e('div', { className: 'dialog-body form-stack food-meal-detail' },
    e('div', { className: 'food-recipe-status' }, e(Badge, { tone: meal.status === 'cooked' ? 'green' : meal.missing.length || blocked ? 'amber' : '' }, mealStatus(meal)), recipe && e(Btn, { small: true, onClick: () => setDialog({ type: 'recipe-page', id: recipe.id }) }, 'Open the recipe')),
    notes && e('p', null, notes),
    batch && e('div', { className: 'confirmation-box' }, e('strong', null, 'Uses the ' + batch.name.toLowerCase()), e('p', null, batch.status === 'cooked' ? 'Already cooked. This meal takes one of its portions.' : 'Cook it first (planned ' + foodShortDay(batch.date) + '); then this meal takes one of its portions.'), e(Btn, { small: true, onClick: () => setDialog({ type: 'meal-detail', id: batch.id }) }, batch.status === 'cooked' ? 'Open the batch' : 'Open the batch to cook it')),
    e('div', { className: 'food-recipe-columns' },
      e('section', null, e('h3', { className: 'mini-head' }, meal.status === 'cooked' ? 'What it used' : 'What is in it'),
        kept.length ? e('ul', { className: 'food-ingredients' }, kept.map((x, i) => { const key = x.id ? entryKeyForRow(s, x.id) : '';
          return e('li', { key: i, className: x.ok ? 'have' : 'missing' }, e('i', { 'aria-hidden': true }), key ? e('button', { type: 'button', className: 'text-link', onClick: () => setDialog({ type: 'item-page', key }) }, niceName(x.name)) : e('span', null, niceName(x.name)), e('b', null, x.text), e('small', { className: 'food-ing-home' }, x.ok ? (meal.status === 'cooked' ? 'Used' : 'At home, kept for this meal') : 'Not at home')); }))
          : e('p', { className: 'muted' }, batch ? 'One portion of the batch.' : 'Nothing from your cupboard is linked yet.'),
        planned && meal.missing.length > 0 && e('div', { className: 'inline-actions' }, e(Btn, { small: true, onClick: () => run((st) => missingToList(st, meal.id), 'What is missing is on a shopping list') }, 'Add what is missing to shopping'), e(Btn, { small: true, onClick: () => setDialog({ type: 'stock' }) }, 'I have it at home'), recipe && e(Btn, { small: true, onClick: () => setDialog({ type: 'recipe', id: recipe.id }) }, 'Change the recipe'))),
      e('section', null, e('h3', { className: 'mini-head' }, 'How to make it'),
        steps.length ? e('ol', { className: 'food-steps' }, steps.map((t, i) => e('li', { key: i }, t)))
          : batch ? e('p', { className: 'muted' }, 'Warm a portion of the ' + batch.name.toLowerCase() + '.')
            : e('div', { className: 'food-empty-method' }, e('p', { className: 'muted' }, recipe ? 'The recipe has no method written yet.' : 'No method written yet.'),
              recipe ? e(Btn, { small: true, onClick: () => setDialog({ type: 'recipe', id: recipe.id }) }, 'Write the method')
                : e('div', { className: 'inline-actions' }, e(Btn, { small: true, kind: 'primary', onClick: () => setDialog({ type: 'meal-to-recipe', id: meal.id }) }, 'Write how to make it'), planned && s.recipes.some((r) => !r.archived) && e(Btn, { small: true, onClick: () => setDialog({ type: 'meal', id: meal.id }) }, 'Use a recipe I have'))))),
    planned && (prep ? e('section', { className: 'food-act' }, e('h3', { className: 'mini-head' }, 'When it is cooked'),
      e('div', { className: 'form-grid' }, e(Input, { label: 'Cooked on', type: 'date', value: date, onChange: setDate, required: true }), e(Select, { label: 'Keep the portions in', value: location, onChange: setLocation, options: ['Fridge', 'Freezer'] })),
      e('div', { className: 'form-grid' }, e(Input, { label: 'Use-by date on the box (optional)', type: 'date', value: expiry, onChange: setExpiry, min: date }), location === 'Fridge' && e(Input, { label: 'Portions to freeze instead', type: 'number', min: 0, max: meal.servings, step: 1, value: frozen, onChange: setFrozen })),
      e(Btn, { kind: 'primary', icon: 'check', disabled: !!meal.missing.length, onClick: () => run((st) => prepareMeal(st, meal.id, { date, location, expiry, freezerServings: location === 'Fridge' ? Number(frozen) || 0 : 0 }), 'Cooked · ' + meal.servings + ' portions ready') }, 'I cooked this batch'),
      meal.missing.length > 0 && e('p', { className: 'muted' }, 'Something is missing. Add it at home first, or change the recipe.'))
      : e('section', { className: 'food-act' },
        e('div', { className: 'inline-actions' }, e(Btn, { kind: 'primary', icon: 'check', disabled: !!blocked, onClick: () => run((st) => cookMeal(st, meal.id, Number(left) || 0, true, { date }), 'Eaten · taken out of your cupboard') }, otherDay ? 'I ate this on ' + prettyDate(date) : 'I ate this'),
          !otherDay && e('button', { type: 'button', className: 'text-link', onClick: () => setOtherDay(true) }, meal.date < today ? 'Not on ' + prettyDate(meal.date) + '?' : 'Another day?')),
        otherDay && e(Input, { label: 'The day you ate it', type: 'date', value: date, max: today, onChange: setDate }),
        !meal.preparedFrom && meal.servings > 1 && e(Input, { label: 'Portions left for later', type: 'number', min: 0, max: meal.servings - 1, step: 1, value: left, onChange: setLeft }),
        blocked && e('p', { className: 'muted' }, 'Cook the batch first, then mark this eaten.'))),
    planned && e('div', { className: 'inline-actions food-more' },
      e(Btn, { onClick: () => setDialog({ type: prep ? 'prep-plan' : 'meal', id: meal.id }) }, prep ? 'Change the batch' : 'Change day or what is in it'),
      meal.recipeId && e(Btn, { onClick: () => run((st) => refreshMeal(st, meal.id), 'Checked against what is at home') }, 'Check the cupboard again'),
      e(Btn, { onClick: () => run((st) => skipWorkflowMeal(st, meal.id), prep ? 'Skipped, with its meals · food is free again' : 'Skipped · its food is free again') }, prep ? 'Skip the batch and its meals' : 'Skip'),
      !prep && (sure ? e(Btn, { kind: 'danger', onClick: () => run((st) => ({ ...st, mealEntries: st.mealEntries.filter((x) => x.id !== meal.id) }), 'Taken off the plan') }, 'Take it off the plan for good') : e(Btn, { kind: 'danger', onClick: () => setSure(true) }, 'Remove'))),
    prep && children.length > 0 && e('section', null, e('h3', { className: 'mini-head' }, 'Meals from this batch'), children.map((c) => e('button', { type: 'button', className: 'food-line-main', key: c.id, onClick: () => setDialog({ type: 'meal-detail', id: c.id }) }, e('strong', null, c.name), e('small', null, foodShortDay(c.date) + ' · ' + mealStatus(c))))),
    lots.length > 0 && e('section', { className: 'prepared-summary' }, e('h3', null, 'Cooked portions'), lots.map((l) => e('div', { className: 'summary-line', key: l.id }, e('span', null, l.location + (l.expiry ? ' · use by ' + prettyDate(l.expiry) : '')), e('b', null, foodQty(l.remaining, l.unit === 'serving' ? 'portion' : l.unit) + ' left'))), meal.prepOnly && e(Btn, { onClick: () => setDialog({ type: 'prepared-meal', batchId: meal.id }) }, 'Plan a meal from this batch')),
    meal.status === 'cooked' && e(Btn, { onClick: () => run((st) => uneatMeal(st, meal.id), 'Undone · back in your cupboard') }, meal.prepOnly ? 'Not cooked after all' : 'Not eaten after all'),
    meal.status === 'skipped' && e('div', { className: 'inline-actions' }, e(Btn, { onClick: () => run((st) => planMeal({ ...st, mealEntries: st.mealEntries.map((x) => (x.id === meal.id ? { ...x, status: 'planned' } : x)) }, { ...meal, status: 'planned' }), 'Back on the plan') }, 'Put it back on the plan'), e(Btn, { kind: 'danger', onClick: () => run((st) => ({ ...st, mealEntries: st.mealEntries.filter((x) => x.id !== meal.id) }), 'Taken off the plan') }, 'Remove from the plan')),
    e(ErrorMessage, { error: err })), e(DialogFooter, { onClose, label: 'Done' }));
};

// ---- Week, Recipes, Batches ----
function FoodWeek(p) {
  const s = p.state, m = p.selectedMonth, weeks = getWeeks(m), target = s.mealEntries.find((x) => x.id === p.route?.meal)?.date || isoDate(new Date());
  const find = () => Math.max(0, weeks.findIndex((w) => w.some((d) => d.date === target)));
  const [week, setWeek] = useState(find); useEffect(() => setWeek(find()), [m, target]);
  const days = weeks[Math.min(week, weeks.length - 1)], dates = new Set(days.map((d) => d.date));
  const missing = s.mealEntries.filter((x) => x.status === 'planned' && dates.has(x.date) && x.missing?.length);
  return e(React.Fragment, null, e(FoodPlanPanel, p),
    e('div', { className: 'week-toolbar' }, e(Btn, { disabled: week === 0, onClick: () => setWeek(week - 1) }, '← Previous'), e('strong', null, prettyDate(days[0].date) + ' — ' + prettyDate(days[6].date)), e(Btn, { disabled: week === weeks.length - 1, onClick: () => setWeek(week + 1) }, 'Next →'), e(Btn, { onClick: () => p.setDialog({ type: 'copy-week', dates: days.map((d) => d.date) }) }, 'Copy week')),
    missing.length > 0 && e('div', { className: 'surface food-line food-week-missing' }, e('div', null, e('strong', null, (() => { const n = missing.reduce((t, x) => t + x.missing.length, 0); return 'This week’s meals need ' + n + (n === 1 ? ' more thing' : ' more things'); })()), e('small', null, missing.map((x) => x.name + ': ' + x.missing.map((i) => i.name).join(', ')).join(' · '))), e(Btn, { small: true, kind: 'primary', onClick: () => p.commit((st) => addFoodToShopping(st, missing.flatMap((x) => x.missing.map((i) => ({ name: i.name, itemId: i.itemId, quantity: i.quantity, unit: i.unit })))), 'On your shopping list').catch(() => {}) }, 'Add them to the shopping list')),
    e('div', { className: 'meal-week' }, days.map((day) => e(MealDay, { key: day.date, state: s, day, setDialog: p.setDialog }))), e(CupboardStarters, { state: s, month: m, setDialog: p.setDialog }));
}
function FoodRecipes(p) {
  const s = p.state, [query, setQuery] = useState(''), [show, setShow] = useState('all');
  const ranked = useMemo(() => rankRecipes(s, {}), [s]), q = query.trim().toLowerCase();
  const shown = ranked.filter((x) => (!q || matchesWords([x.recipe.name, ...x.recipe.ingredients.map((i) => i.name)].join(' ').toLowerCase(), q)) && (show === 'all' || show === 'ready' && x.ready || show === 'one' && x.missing.length === 1 || show === 'quick' && Number(x.recipe.minutes) > 0 && Number(x.recipe.minutes) <= 20));
  const run = (fn, msg) => p.commit(fn, msg).catch(() => {});
  const cookNow = (x) => foodCookNow(p, x.recipe, x.recipe.servings);
  return e(React.Fragment, null,
    e('div', { className: 'surface food-recipe-tools' }, e(Input, { label: 'Find a recipe or an ingredient', type: 'search', value: query, onChange: setQuery, placeholder: 'Tomato, salmon, pasta…' }), e(Segment, { label: 'Show', value: show, onChange: setShow, options: [['all', 'All ' + ranked.length], ['ready', 'Can make now'], ['one', 'Missing one thing'], ['quick', '20 minutes or less']] })),
    e('div', { className: 'food-recipe-grid' }, shown.map((x) => e(FoodRecipeCard, { key: x.recipe.id, x, state: s, setDialog: p.setDialog, onCook: () => cookNow(x), run }))),
    !shown.length && e(Empty, { icon: 'leaf', title: ranked.length ? 'No recipe matches' : 'No recipes yet', action: e(Btn, { kind: 'primary', onClick: () => p.setDialog({ type: 'recipe' }) }, 'Add a recipe') }, ranked.length ? 'Try another word or another filter.' : 'Add one, or open a meal and choose “Write how to make it”.'));
}
function FoodBatches(p) {
  const s = p.state, batches = s.mealEntries.filter((m) => m.kind === 'prep' && m.status !== 'skipped').sort((a, b) => a.date.localeCompare(b.date));
  return e(React.Fragment, null, e('p', { className: 'muted food-intro' }, 'Cook once, eat several times: a batch uses its ingredients once and makes portions for the meals planned from it.'),
    e('div', { className: 'workflow-tools' }, e(Btn, { onClick: () => p.setDialog({ type: 'prepared-meal' }) }, 'Plan a meal from a batch')),
    e('div', { className: 'prep-grid' }, batches.map((m) => { const lots = preparedLots(s, m.id), used = s.mealEntries.filter((x) => x.preparedFrom === m.id && x.status !== 'skipped');
      return e('article', { className: 'surface prep-card', key: m.id }, e('h2', null, m.name), e('p', null, foodShortDay(m.date) + ' · ' + m.servings + ' portions · ' + mealStatus(m)), lots.map((l) => e('p', { key: l.id }, foodQty(l.remaining, 'portion') + ' in the ' + String(l.location).toLowerCase())), e('ul', null, used.map((x) => e('li', { key: x.id }, foodShortDay(x.date) + ' · ' + x.name + ' · ' + mealStatus(x)))), e(Btn, { kind: 'primary', onClick: () => p.setDialog({ type: 'meal-detail', id: m.id }) }, 'Open batch')); })),
    !batches.length && e(Empty, { icon: 'leaf', title: 'No batches planned', action: e(Btn, { kind: 'primary', onClick: () => p.setDialog({ type: 'prep-plan' }) }, 'Plan a batch') }, 'Choose a recipe that makes several portions.'));
}

// ---- A food's page: the recipes that use it ----
function FoodRecipesUsing({ state: s, g, setDialog }) {
  const list = recipesUsing(s, g); if (!list.length) return null;
  return e('section', { className: 'food-uses' }, e('h3', { className: 'mini-head' }, 'Recipes with it'), e('div', { className: 'food-uses-list' }, list.map((r) => e('button', { type: 'button', key: r.id, className: 'food-chip-button', onClick: () => setDialog({ type: 'recipe-page', id: r.id }) }, r.name))));
}

// ---- Food & supplies: finished, with or without a day ----
function FoodFinish({ state: s, dialog: d, commit, onClose }) {
  const today = isoDate(new Date()), rows = stockRows(s).filter((r) => d.ids.includes(r.id) && r.remaining > 0 && r.tracking !== 'durable');
  const [when, setWhen] = useState(d.when || 'unknown'), [date, setDate] = useState(today), [action, setAction] = useState('finish');
  const meals = mealsUsingStock(s, rows.map((r) => r.id)), names = [...new Set(rows.map((r) => niceName(r.name)))];
  if (!rows.length) return e(Modal, { title: 'Nothing to finish', onClose }, e('div', { className: 'dialog-body' }, e('p', null, 'None of these are still at home.')), e(DialogFooter, { onClose, label: 'Done' }));
  return e(FormModal, { title: names.length === 1 ? names[0] + ' is gone' : names.length + ' things are gone', onClose, label: action === 'waste' ? 'Record as thrown away' : 'Mark finished', onSubmit: () => commit((st) => finishStock(st, rows.map((r) => r.id), { date: when === 'day' ? date : today, undated: when === 'unknown', action }), (names.length === 1 ? names[0] : names.length + ' things') + (action === 'waste' ? ' recorded as thrown away' : ' marked finished') + (when === 'unknown' ? ' · date not known' : '')) },
    names.length > 1 && e('ul', { className: 'food-plain-list' }, names.map((n) => e('li', { key: n }, n))),
    e(Segment, { label: 'What happened', value: action, onChange: setAction, options: [['finish', 'Used up'], ['waste', 'Thrown away']] }),
    e('fieldset', { className: 'food-when' }, e('legend', { className: 'mini-head' }, 'When'),
      [['unknown', 'I don’t know', 'It stays out of the day-by-day history.'], ['today', 'Today', ''], ['day', 'On a day', '']].map(([k, label, hint]) => e('label', { key: k, className: 'radio-label' }, e('input', { type: 'radio', name: 'food-when', checked: when === k, onChange: () => setWhen(k) }), e('span', null, label, hint && e('small', null, ' · ' + hint)))),
      when === 'day' && e(Input, { label: 'The day', type: 'date', value: date, max: today, onChange: setDate, required: true })),
    meals.length > 0 && e('p', { className: 'confirmation-box' }, 'Planned with it: ' + meals.map((m) => m.name + ' (' + foodShortDay(m.date) + ')').join(', ') + '. ' + (meals.length === 1 ? 'That meal' : 'Those meals') + ' will say what they now need.'));
}

// What's left, as rows by place: the fridge first, what to eat soon first inside each place.
// Tick several and mark them finished at once. The cards view is kept as a choice.
const foodBaseRemainingStock = RemainingStock;
RemainingStock = function foodRemainingStock(p) {
  const [layout, setLayout] = useLocalPref('everyday_left_layout', 'list');
  const toggle = e('div', { className: 'food-layout-toggle' }, e(Segment, { label: 'Layout', value: layout, onChange: setLayout, options: [['list', 'List by place'], ['cards', 'Cards']] }));
  return layout === 'cards' ? e(React.Fragment, null, toggle, e(foodBaseRemainingStock, p)) : e(FoodAtHome, { ...p, toggle });
};
const FOOD_PLACE_ORDER = ['Fridge', 'Freezer', 'Fruit bowl', 'Bread bin', 'Cupboard / pantry', 'Kitchen'];
function FoodAtHome(p) {
  const { state: s, setDialog, toggle } = p, today = isoDate(new Date()), [query, setQuery] = useState(''), [place, setPlace] = useState('all'), [picking, setPicking] = useState(false), [picked, setPicked] = useState(() => new Set());
  const all = remainingStockGroups(s), q = query.trim().toLowerCase();
  const shown = all.filter((g) => (place === 'all' || g.location === place) && (!q || [entryName(g), ...g.rows.map((r) => r.name)].some((n) => n.toLowerCase().includes(q))));
  const places = [...new Set(all.map((g) => g.location))].sort((a, b) => (FOOD_PLACE_ORDER.indexOf(a) + 1 || 99) - (FOOD_PLACE_ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b));
  const soonOf = (g) => g.rows.map((r) => useSoon(s, r, today)).filter(Boolean).sort((a, b) => b.rank - a.rank)[0] || null;
  const groups = places.map((pl) => ({ place: pl, list: shown.filter((g) => g.location === pl).map((g) => ({ g, soon: soonOf(g) })).sort((a, b) => (b.soon?.rank || 0) - (a.soon?.rank || 0) || entryName(a.g).localeCompare(entryName(b.g))) })).filter((x) => x.list.length);
  const ids = (g) => g.rows.map((r) => r.id), toggleOne = (g) => setPicked((old) => { const next = new Set(old); const k = g.key; next.has(k) ? next.delete(k) : next.add(k); return next; });
  const pickedIds = all.filter((g) => picked.has(g.key)).flatMap(ids), done = () => { setPicking(false); setPicked(new Set()); };
  const finish = (when) => setDialog({ type: 'finish-stock', ids: pickedIds, when });
  return e(React.Fragment, null,
    e('section', { className: 'surface food-home-tools' },
      e('div', { className: 'food-home-row' }, e(Input, { label: 'Find something at home', type: 'search', value: query, onChange: setQuery, placeholder: 'Chicken, milk, apples…' }), toggle),
      e('div', { className: 'food-home-row' }, e(Segment, { label: 'Place', value: place, onChange: setPlace, options: [['all', 'Everywhere'], ...places.map((x) => [x, x])] }),
        e(Btn, { small: true, kind: picking ? 'primary' : '', onClick: () => (picking ? done() : setPicking(true)) }, picking ? 'Done choosing' : 'Choose several'))),
    picking && e('div', { className: 'food-pick-bar', role: 'region', 'aria-label': 'Chosen things' }, e('strong', null, picked.size ? picked.size + ' chosen' : 'Tick what is gone'),
      e('div', { className: 'inline-actions' }, e(Btn, { small: true, kind: 'primary', disabled: !picked.size, onClick: () => finish('unknown') }, 'Finished · date not known'), e(Btn, { small: true, disabled: !picked.size, onClick: () => finish('today') }, 'Finished today'), e(Btn, { small: true, disabled: !picked.size, onClick: () => finish('day') }, 'Another day…'), e('button', { type: 'button', className: 'text-link', onClick: done }, 'Cancel'))),
    e('p', { className: 'muted' }, shown.length + (shown.length === 1 ? ' thing' : ' things') + ' at home' + (place === 'all' ? '' : ' in ' + place.toLowerCase())),
    groups.map(({ place: pl, list }) => e('section', { className: 'surface food-place', key: pl }, e('h3', { className: 'food-group-head' }, pl, e('span', null, list.length)),
      list.map(({ g, soon }) => { const reserved = g.rows.reduce((n, r) => n + reservedAmount(s, r.id), 0), purchase = stockPurchase(s, g.rows[0]), level = g.tracking === 'level', kept = g.tracking === 'durable', on = picked.has(g.key);
        const amount = g.rows.some((r) => r.amountUnmeasured) ? 'Opened · amount not measured' : level ? g.rows.map((r) => LASTING_LABEL[lastingInfo(r).state]).join(' · ') : foodQty(g.left, g.unit) + (kept ? ' kept' : '');
        return e('div', { className: 'food-home-line' + (on ? ' picked' : ''), key: g.key },
          picking && !kept && e('input', { type: 'checkbox', checked: on, onChange: () => toggleOne(g), 'aria-label': 'Choose ' + entryName(g) }),
          e('button', { type: 'button', className: 'food-line-main', onClick: () => (picking && !kept ? toggleOne(g) : setDialog({ type: 'item-page', key: g.entryKey })) }, e(Art, { file: entryArt(s, g), className: 'food-home-art' }),
            e('span', null, e('strong', null, entryName(g)), e('small', null, [amount, soon ? soonText(soon) : purchase.date ? 'bought ' + prettyDate(purchase.date) : '', reserved > 0 ? foodQty(reserved, g.unit) + ' planned for a meal' : ''].filter(Boolean).join(' · ')))),
          !picking && !kept && e('div', { className: 'inline-actions' }, e(Btn, { small: true, onClick: () => setDialog(level ? { type: 'stock-group', ids: ids(g), name: entryName(g) } : { type: 'use-stock', ids: ids(g) }) }, level ? 'Update' : 'Use some'), e(Btn, { small: true, onClick: () => setDialog({ type: 'finish-stock', ids: ids(g) }) }, 'Finished')));
      }))),
    !shown.length && e('p', { className: 'empty-copy' }, q ? 'Nothing at home matches “' + query + '”.' : 'Nothing recorded here. Choose another place, or add stock.'));
}
