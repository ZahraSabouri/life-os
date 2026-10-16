// Finding a recipe's ingredient among the food at home by the words in product names: "Onion"
// finds "Red onion" but not "Spring onions"; "Garlic" does not find "Garlic mayo".

const clean = (text) => ` ${String(text ?? '').toLowerCase().replace(/[^a-z0-9éè&' ]+/g, ' ').replace(/\s+/g, ' ').trim()} `
// A word or phrase as a whole word, singular or plural.
export function hasWords(name, phrase) {
  const hay = clean(name), words = clean(phrase).trim()
  if (!words) return false
  return [words, `${words}s`, `${words}es`, words.replace(/ies$/, 'y'), words.replace(/s$/, ''), words.replace(/es$/, '')].some((form) => form && hay.includes(` ${form} `))
}
// Fresh food and staples are never a drink, a sweet or a flavour: "Raspberry oat drink" is
// neither raspberries nor oats.
const NOT_THE_FOOD = ['drink', 'juice', 'smoothie', 'milkshake', 'squash', 'jam', 'flavour', 'flavoured', 'crisps', 'chocolate', 'sweets', 'bar', 'biscuit', 'biscuits', 'cereal', 'yoghurt', 'yogurt', 'sauce', 'ketchup', 'mayo', 'dressing', 'soup']
export function matchesIngredient(ing, name) {
  if (!(ing.match ?? []).some((word) => hasWords(name, word))) return false
  const hay = clean(name)
  if ((ing.not ?? []).some((word) => hay.includes(clean(word).trim()))) return false
  // An ingredient that is itself one of those words (yoghurt, a sauce) is not ruled out by it.
  const own = clean([ing.name, ...(ing.match ?? [])].join(' '))
  return !NOT_THE_FOOD.some((word) => hay.includes(` ${word} `) && !own.includes(` ${word}`))
}

// A recipe against what is at home. `rows`: { id, name, remaining, unit, itemId } of food at home.
// Staples (oil, salt, stock) are assumed and listed apart; optional ones never make a recipe "missing".
export function recipeAgainstHome(recipe, rows) {
  const lines = recipe.ingredients.map((ing, index) => {
    const found = rows.filter((row) => row.remaining > 0 && matchesIngredient(ing, row.name))
    return { index, name: ing.name, staple: Boolean(ing.staple), optional: Boolean(ing.optional), have: found.map((row) => row.name).filter((n, k, all) => all.indexOf(n) === k).slice(0, 3), rows: found }
  })
  const missing = lines.filter((line) => !line.have.length && !line.staple && !line.optional)
  const needed = lines.filter((line) => !line.staple && !line.optional)
  return { lines, missing: missing.map((line) => line.name), ready: missing.length === 0, haveCount: needed.filter((line) => line.have.length).length, needCount: needed.length }
}
