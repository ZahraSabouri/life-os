/* Food you can use: what is at home for each recipe, what to eat now, recipes as templates,
   and finishing things without a date. Reads the same stock ledger as meals and shopping. */

// A recipe ingredient names a food. A pack linked by hand is used while it lasts; after that,
// any pack of the same product (or the same name) counts, so a recipe stays a template.
const baseIngredientMatcher = ingredientMatcher;
ingredientMatcher = function foodIngredientMatcher(s, ing) {
  if (!ing.sourceIds?.length) return baseIngredientMatcher(s, ing);
  const ids = new Set(ing.sourceIds), idx = itemIndex(s), known = new Set(s.items.map((i) => i.id));
  const linked = [...s.lots, ...s.resources].filter((r) => ids.has(r.id));
  const itemOf = (r) => (r.itemId && known.has(r.itemId) ? r.itemId : idx.get(itemKey(r.name))?.id) || '';
  const items = new Set(linked.map(itemOf).filter(Boolean)), keys = new Set(linked.map((r) => itemKey(r.name)).filter(Boolean));
  return (r) => {
    if (ids.has(r.id)) return true;
    const item = itemOf(r);
    return item ? items.has(item) : keys.has(itemKey(r.name));
  };
};

const FRESH_CATEGORIES = new Set(['fruit-vegetables', 'meat-fish-plant-proteins', 'eggs-dairy', 'fresh-convenience-food', 'bread-bakery', 'milk-alternatives']);
function isFoodRow(s, r) { return r.source === 'lot' ? category(s, r.categoryId).pool === 'grocery' : s.resources.find((x) => x.id === r.id)?.category === 'Food'; }
// Should this be eaten soon? A label date first; without one, fresh food in the fridge that has
// been there a while. `kind`: passed, label, made or fridge; `date` is the label date or the day it came.
function useSoon(s, row, today = isoDate(new Date())) {
  if (!(row.remaining > 0) || ['level', 'durable'].includes(row.tracking)) return null;
  if (row.expiry && validDate(row.expiry)) {
    const days = daysBetween(today, row.expiry), useBy = row.expiryType === 'use-by';
    if (days < 0) return { rank: 3, days, kind: 'passed', date: row.expiry, useBy };
    if (days <= 3) return { rank: 2, days, kind: 'label', date: row.expiry, useBy };
    return null;
  }
  const fridge = /fridge/i.test(row.location || ''), fresh = FRESH_CATEGORIES.has(row.categoryId) || row.prepared;
  if (!fridge || !fresh) return null;
  const since = row.preparedDate || stockPurchase(s, row).date || row.added || '';
  if (!validDate(since)) return null;
  const days = daysBetween(since, today);
  if (row.prepared && days >= 2) return { rank: 2, days: -days, kind: 'made', date: since };
  if (days >= 4) return { rank: 1, days: -days, kind: 'fridge', date: since };
  return null;
}

// Everything at home now, ignoring what planned meals have set aside (a plan can change).
function physicalState(s) { return { ...s, mealEntries: s.mealEntries.map((m) => (m.status === 'planned' ? { ...m, reservations: [] } : m)) }; }

// One ingredient against the cupboard: enough, some, a long-lasting jar, or none.
function ingredientAtHome(s, ing, needed, date, today = isoDate(new Date())) {
  const fits = ingredientMatcher(s, ing), rows = stockRows(s).filter((r) => r.remaining > 0 && r.tracking !== 'durable');
  let lasting = rows.filter((r) => r.tracking === 'level' && fits(r));
  if (!lasting.length && !ing.sourceIds?.length && !ing.itemId && !ing.typeId) lasting = rows.filter((r) => r.tracking === 'level' && wordsIn(ing.name, r.name));
  if (lasting.length) return { state: 'lasting', have: null, rows: lasting, soon: null };
  let have = 0; const used = [];
  for (const r of rows.filter((r) => r.tracking !== 'level' && !r.scheduledDate && fits(r))) {
    const one = convertQty(1, r.unit, ing.unit); if (!one) continue;
    have += r.remaining * one; used.push(r);
  }
  have = +have.toFixed(6);
  const soon = used.map((r) => useSoon(s, r, today)).filter(Boolean).sort((a, b) => b.rank - a.rank)[0] || null;
  return { state: have >= needed - 1e-6 ? 'have' : have > 0 ? 'short' : 'none', have, rows: used, soon };
}

// A recipe against what is at home: each ingredient's state, what is missing, what is kept for
// another planned meal, and a score that puts recipes using food that should go soon first.
function recipeAtHome(s, recipe, { servings, date = isoDate(new Date()), except = '' } = {}) {
  const phys = physicalState(s), want = Number(servings) > 0 ? Number(servings) : recipe.servings, today = isoDate(new Date());
  const lines = (recipe.ingredients || []).map((ing) => {
    const needed = +(ing.quantity * want / recipe.servings).toFixed(4), home = ingredientAtHome(phys, ing, needed, date, today);
    // Meals of this same recipe are not "other" meals: they are said apart, as when it is planned.
    const keptFor = home.rows.flatMap((r) => s.mealEntries.filter((m) => m.status === 'planned' && m.id !== except && m.recipeId !== recipe.id && m.reservations.some((x) => x.sourceId === r.id)));
    const free = home.rows.reduce((n, r) => n + Math.max(0, r.remaining - reservedAmount(s, r.id, except)) * (convertQty(1, r.unit, ing.unit) || 0), 0);
    const kept = home.state === 'have' && free < needed - 1e-6 ? [...new Map(keptFor.map((m) => [m.id, m])).values()] : [];
    return { ing, needed, ...home, kept };
  });
  const missing = lines.filter((l) => !l.ing.optional && ['none', 'short'].includes(l.state));
  const kept = lines.filter((l) => l.kept.length);
  const score = lines.reduce((n, l) => n + (l.soon ? [0, 3, 10, 20][l.soon.rank] : 0), 0);
  const planned = s.mealEntries.filter((m) => m.status === 'planned' && m.recipeId === recipe.id && m.id !== except).sort((a, b) => a.date.localeCompare(b.date));
  return { recipe, servings: want, lines, missing, kept, planned, ready: !missing.length, score, soon: lines.filter((l) => l.soon) };
}

// Recipes in the order to cook them: everything at home first, then one thing missing, then more.
function rankRecipes(s, opts = {}) {
  return s.recipes.filter((r) => !r.archived).map((r) => {
    try { return recipeAtHome(s, r, opts); } catch { return null; }
  }).filter(Boolean).sort((a, b) => a.missing.length - b.missing.length || b.score - a.score || (a.recipe.minutes || 99) - (b.recipe.minutes || 99) || a.recipe.name.localeCompare(b.recipe.name));
}

const SLOT_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
function slotAt(date = new Date()) { const h = date.getHours() + date.getMinutes() / 60; return h < 10.5 ? 'breakfast' : h < 15.5 ? 'lunch' : h < 21.5 ? 'dinner' : 'snack'; }

// What the moment asks: this mealtime's plan, plans from earlier still open, ready portions,
// and food that should be eaten soon.
function foodNow(s, { today = isoDate(new Date()), slot = slotAt() } = {}) {
  const planned = s.mealEntries.filter((m) => m.date === today && (m.slot || 'dinner') === slot && m.status !== 'skipped' && m.kind !== 'prep');
  const prep = s.mealEntries.filter((m) => m.date === today && m.kind === 'prep' && m.status === 'planned');
  const earlierToday = s.mealEntries.filter((m) => m.date === today && m.status === 'planned' && m.kind !== 'prep' && SLOT_ORDER.indexOf(m.slot || 'dinner') < SLOT_ORDER.indexOf(slot));
  const open = s.mealEntries.filter((m) => m.status === 'planned' && m.date < today).sort((a, b) => b.date.localeCompare(a.date) || SLOT_ORDER.indexOf(b.slot) - SLOT_ORDER.indexOf(a.slot));
  const ready = s.lots.filter((l) => l.remaining > 0 && (l.prepared || l.mealId)).map((l) => ({ lot: l, batch: s.mealEntries.find((m) => m.id === l.mealId) || null, soon: useSoon(s, l, today) }));
  const soon = stockRows(s).map((r) => ({ row: r, soon: useSoon(s, r, today) })).filter((x) => x.soon && !x.row.prepared && isFoodRow(s, x.row)).sort((a, b) => b.soon.rank - a.soon.rank || a.soon.days - b.soon.days);
  const next = s.mealEntries.filter((m) => m.status === 'planned' && m.kind !== 'prep' && (m.date > today || m.date === today && SLOT_ORDER.indexOf(m.slot || 'dinner') > SLOT_ORDER.indexOf(slot))).sort((a, b) => a.date.localeCompare(b.date) || SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot))[0] || null;
  return { today, slot, planned, prep, earlierToday, open, ready, soon, next };
}

// Cooking now comes before plans: the new meal takes what is at home, even what another planned
// meal had set aside; that meal is planned again and says what it now needs.
function cookFromHome(s, { id = uid('meal'), date = isoDate(new Date()), slot = slotAt(), recipe, servings } = {}) {
  need(recipe, 'Choose a recipe.');
  const d = { id, date, slot, name: recipe.name, recipeId: recipe.id, servings: Number(servings) > 0 ? Number(servings) : recipe.servings, kind: 'recipe' };
  const fresh = planMeal(physicalState(s), d).mealEntries.find((m) => m.id === id);
  let next = { ...s, mealEntries: [...s.mealEntries, fresh] };
  const used = new Set(fresh.reservations.map((r) => r.sourceId)), rows = new Map(stockRows(s).map((r) => [r.id, r]));
  const over = (st, sourceId) => reservedAmount(st, sourceId) > (rows.get(sourceId)?.remaining || 0) + 1e-6;
  for (const m of s.mealEntries.filter((m) => m.status === 'planned' && m.reservations.some((r) => used.has(r.sourceId) && over(next, r.sourceId)))) {
    const without = { ...next, mealEntries: next.mealEntries.map((x) => (x.id === m.id ? { ...x, reservations: [] } : x)) };
    try { next = planMeal(without, m); }
    catch { next = { ...without, mealEntries: without.mealEntries.map((x) => (x.id === m.id ? { ...x, missing: [...x.missing, ...m.reservations.filter((r) => used.has(r.sourceId)).map((r) => ({ name: r.name, quantity: r.amount, unit: r.unit }))] } : x)) }; }
  }
  return next;
}
function mealsGivingWay(s, recipe, servings) { const x = recipeAtHome(s, recipe, { servings }); return [...new Map(x.kept.flatMap((l) => l.kept).map((m) => [m.id, m])).values()]; }

// Turn a meal into a recipe (a template): its cupboard picks become ingredients that name the food,
// and the meal now follows the recipe.
function mealToRecipe(s, mealId, { id, name, steps = '', minutes = '' } = {}) {
  const meal = s.mealEntries.find((m) => m.id === mealId); need(meal, 'Meal not found.');
  need(meal.status === 'planned' || !meal.recipeId, 'This meal already follows a recipe.');
  const idx = itemIndex(s), rows = new Map(stockRows(s).map((r) => [r.id, r]));
  const servings = Number(meal.servings) > 0 ? Number(meal.servings) : 1;
  const ingredients = (meal.stock || []).map((p) => {
    const row = (p.ids || []).map((id) => rows.get(id)).find(Boolean), item = (row?.itemId && s.items.find((i) => i.id === row.itemId)) || idx.get(itemKey(p.name));
    const line = { name: item ? item.name : niceFoodName(p.name), quantity: p.tracking === 'level' || !(Number(p.amount) > 0) ? 1 : +(Number(p.amount) / servings).toFixed(4), unit: p.tracking === 'level' ? 'a little' : String(p.unit || 'item') };
    if (item) line.itemId = item.id;
    if (p.tracking === 'level' || !(Number(p.amount) > 0)) line.optional = true;
    return line;
  });
  need(ingredients.length || String(steps).trim(), 'Add what goes into it, or write how to make it.');
  need(!id || !s.recipes.some((r) => r.id === id), 'That recipe already exists.');
  const recipe = { id: id || uid('recipe'), name: String(name || meal.name).trim() || meal.name, servings: 1, minutes: minutes === '' ? '' : Number(minutes) || '', ingredients, steps: String(steps || '').trim(), notes: '', source: '', image: '', fromMeal: meal.id };
  let next = { ...s, recipes: [...s.recipes, recipe] };
  if (meal.status === 'planned') next = planMeal(next, { ...meal, recipeId: recipe.id, kind: 'recipe', stock: [], servings });
  else next = { ...next, mealEntries: next.mealEntries.map((m) => (m.id === meal.id ? { ...m, recipeId: recipe.id } : m)) };
  return next;
}
function niceFoodName(n) { const t = String(n || '').trim(); return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Ingredient'; }

// A copy of a recipe to change freely; meals that follow the original keep it.
function copyRecipe(s, id, name, newId) {
  const r = s.recipes.find((x) => x.id === id); need(r, 'Recipe not found.');
  const copy = { ...clone(r), id: newId || uid('recipe'), name: String(name || '').trim() || r.name + ' (copy)', archived: false, copiedFrom: r.id };
  delete copy.fromMeal;
  return { ...s, recipes: [...s.recipes, copy] };
}

// Recipes that use a food (a catalogue entry from Food & supplies).
function recipesUsing(s, g) {
  const rows = g.rows.length ? g.rows : [], keys = entryKeys(g);
  return s.recipes.filter((r) => !r.archived && (r.ingredients || []).some((ing) => {
    if (g.item && ing.itemId === g.item.id) return true;
    const fits = ingredientMatcher(s, ing);
    return rows.some(fits) || (!ing.sourceIds?.length && !ing.itemId && !ing.typeId && keys.has(itemKey(ing.name)));
  }));
}

// Finished (or thrown away) for several things at once. With `undated`, the day is not known:
// the record keeps the day it was noted, and the day-by-day history leaves it out.
// Meals that had set these aside are planned again, so they say what they now need.
function finishStock(s, ids, { date = isoDate(new Date()), undated = false, action = 'finish' } = {}) {
  need(['finish', 'waste'].includes(action), 'Choose what happened.'); need(validDate(date), 'Choose a valid date.');
  const rows = stockRows(s).filter((r) => ids.includes(r.id) && r.remaining > 0 && r.tracking !== 'durable');
  need(rows.length, 'Nothing chosen is still at home.');
  let next = s;
  for (const r of rows) next = stockAction(next, r.id, action, action === 'waste' ? r.remaining : null, date, true, undated ? { undated: true } : {});
  const touched = new Set(rows.map((r) => r.id));
  for (const m of next.mealEntries.filter((m) => m.status === 'planned' && m.reservations.some((x) => touched.has(x.sourceId)))) {
    try { next = planMeal(next, m); }
    catch { // a plan that cannot be made again keeps the rest and lists what went as still needed
      const gone = m.reservations.filter((x) => touched.has(x.sourceId));
      next = { ...next, mealEntries: next.mealEntries.map((x) => (x.id === m.id ? { ...x, reservations: x.reservations.filter((r) => !touched.has(r.sourceId)), missing: [...x.missing, ...gone.map((r) => ({ name: r.name, quantity: r.amount, unit: r.unit }))] } : x)) };
    }
  }
  return next;
}
function mealsUsingStock(s, ids) { const set = new Set(ids); return s.mealEntries.filter((m) => m.status === 'planned' && m.reservations.some((x) => set.has(x.sourceId))); }

// The list things go on: this week's (or the next dated) list that is still open, else a new "This week".
function currentShoppingList(s, today = isoDate(new Date())) {
  const open = s.lists.filter((l) => !l.archived && !l.deleted && (l.weekOf && today >= l.weekOf && today <= addDays(l.weekOf, 6) || l.date && l.date >= today))
    .sort((a, b) => String(a.date || a.weekOf).localeCompare(String(b.date || b.weekOf)));
  return open[0] || null;
}
function addFoodToShopping(s, lines, today = isoDate(new Date())) {
  let list = currentShoppingList(s, today), next = s;
  if (!list) { list = { id: uid('list'), name: 'This week', weekOf: weekStart(today), date: '', merchant: '', channel: 'in-store', lines: [] }; next = { ...s, lists: [...s.lists, list] }; }
  const there = new Set(list.lines.filter((l) => l.status === 'planned').map((l) => itemKey(l.name))), idx = itemIndex(s);
  for (const x of lines) {
    if (!x.name || there.has(itemKey(x.name))) continue;
    const item = (x.itemId && s.items.find((i) => i.id === x.itemId)) || idx.get(itemKey(x.name));
    const quantity = Number(x.quantity) > 0 && !['a little', 'pinch', 'tsp', 'tbsp', 'clove', 'slice'].includes(String(x.unit)) ? +Number(x.quantity).toFixed(2) : 1;
    const unit = quantity === 1 && ['a little', 'pinch', 'tsp', 'tbsp', 'clove', 'slice'].includes(String(x.unit)) ? 'item' : String(x.unit || 'item');
    next = addListLine(next, list.id, { name: item ? item.name : x.name, quantity, unit, itemId: item?.id, categoryId: item?.categoryId || 'uncategorised', tracking: ['g', 'kg', 'ml', 'L'].includes(unit) ? 'measured' : 'count' });
    there.add(itemKey(x.name));
  }
  return next;
}

// Notes the app wrote itself are not the user's; these exact sentences are taken out of their records.
const IMPORT_NOTES = ['From the shared two-week plan. Planned only; no food has been marked consumed.', 'Preparation batch; portions are eaten in linked meals.'];
function isImportNote(text) { const t = String(text || '').trim(); return IMPORT_NOTES.includes(t) || /^Working recipe from the shared conversation\./.test(t); }
