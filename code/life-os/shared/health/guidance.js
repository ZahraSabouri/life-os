// UK health guidance the Health part of Life OS shows and measures against. Each figure is from
// the NHS or the Food Standards Agency page named with it (checked 15 October 2026); the words
// are written for the app. Change a figure here and every page that uses it follows.

export const SOURCES = {
  activity: { title: 'Physical activity guidelines for adults aged 19 to 64', by: 'NHS', url: 'https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/' },
  strength: { title: 'Strength exercises', by: 'NHS', url: 'https://www.nhs.uk/live-well/exercise/strength-exercises/' },
  strengthFlex: { title: 'How to improve your strength and flexibility', by: 'NHS', url: 'https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/' },
  c25k: { title: 'Couch to 5K running plan', by: 'NHS Better Health', url: 'https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/' },
  walking: { title: 'Walking for health', by: 'NHS', url: 'https://www.nhs.uk/live-well/exercise/walking-for-health/' },
  fitnessStudio: { title: 'Fitness Studio exercise videos', by: 'NHS', url: 'https://www.nhs.uk/conditions/nhs-fitness-studio/' },
  eatwell: { title: 'The Eatwell Guide', by: 'NHS', url: 'https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/' },
  fiveADay: { title: '5 A Day: what counts?', by: 'NHS', url: 'https://www.nhs.uk/live-well/eat-well/5-a-day/5-a-day-what-counts/' },
  fluids: { title: 'Water, drinks and hydration', by: 'NHS', url: 'https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/' },
  labels: { title: 'Food labels', by: 'NHS', url: 'https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/how-to-read-food-labels/' },
  sugar: { title: 'Sugar: the facts', by: 'NHS', url: 'https://www.nhs.uk/live-well/eat-well/food-types/how-does-sugar-in-our-diet-affect-our-health/' },
  tips: { title: '8 tips for healthy eating', by: 'NHS', url: 'https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/eight-tips-for-healthy-eating/' },
  fibre: { title: 'Good foods to help your digestion', by: 'NHS', url: 'https://www.nhs.uk/live-well/eat-well/digestive-health/good-foods-to-help-your-digestion/' },
  calories: { title: 'Understanding calories', by: 'NHS', url: 'https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/understanding-calories/' },
  allergens: { title: 'Food allergy and intolerance', by: 'Food Standards Agency', url: 'https://www.food.gov.uk/safety-hygiene/food-allergy-and-intolerance' },
  recipes: { title: 'Healthier Families recipes', by: 'NHS', url: 'https://www.nhs.uk/healthier-families/recipes/' },
}

// ---- Moving ----------------------------------------------------------------------------------
// The weekly guideline for adults: 150 minutes of moderate activity or 75 of vigorous (or a mix),
// spread over the week, and strengthening activities on at least 2 days. A vigorous minute is
// counted as two moderate ones here, so a mix adds up to one figure.
export const ACTIVITY_TARGET = { moderateMinutes: 150, vigorousMinutes: 75, strengthDays: 2, source: 'activity' }

export const EFFORTS = [
  { key: 'light', label: 'Light', test: 'Easy: you could sing.', counts: false },
  { key: 'moderate', label: 'Moderate', test: 'You can still talk, but not sing.', counts: true, examples: ['brisk walking', 'riding a bike', 'dancing', 'hiking', 'doubles tennis', 'water aerobics'] },
  { key: 'vigorous', label: 'Vigorous', test: 'You cannot say more than a few words without pausing for breath.', counts: true, examples: ['running', 'swimming', 'riding a bike fast or on hills', 'walking up the stairs', 'football, netball, hockey', 'skipping', 'aerobics', 'martial arts'] },
]
export const STRENGTH_EXAMPLES = ['lifting weights', 'resistance bands', 'push-ups and sit-ups', 'yoga', 'pilates', 'carrying heavy shopping', 'heavy gardening']

// Kinds of activity, with how hard they usually are and whether they work the muscles.
export const ACTIVITIES = [
  { key: 'walk', label: 'Brisk walk', effort: 'moderate' },
  { key: 'run', label: 'Run or jog', effort: 'vigorous' },
  { key: 'cycle', label: 'Cycling', effort: 'moderate' },
  { key: 'swim', label: 'Swimming', effort: 'vigorous' },
  { key: 'gym', label: 'Gym (weights)', effort: 'moderate', strength: true },
  { key: 'strength', label: 'Strength at home', effort: 'moderate', strength: true },
  { key: 'yoga', label: 'Yoga or pilates', effort: 'light', strength: true },
  { key: 'class', label: 'Fitness class', effort: 'vigorous' },
  { key: 'sport', label: 'Sport (football, netball…)', effort: 'vigorous' },
  { key: 'dance', label: 'Dancing', effort: 'moderate' },
  { key: 'hike', label: 'Hiking', effort: 'moderate' },
  { key: 'other', label: 'Something else', effort: 'moderate' },
]
export const activity = (key) => ACTIVITIES.find((row) => row.key === key) ?? ACTIVITIES.at(-1)

// ---- Eating ----------------------------------------------------------------------------------
// The Eatwell Guide's five groups, as shares of what is eaten over a day or a week.
export const EATWELL = [
  { key: 'veg', label: 'Fruit and vegetables', share: 40, say: 'At least 5 portions a day, of a variety.' },
  { key: 'starch', label: 'Potatoes, bread, rice, pasta and other starchy carbohydrates', share: 38, say: 'Wholegrain or higher-fibre versions where you can.' },
  { key: 'protein', label: 'Beans, pulses, fish, eggs, meat and other protein', share: 12, say: 'More beans and pulses; 2 portions of fish a week, one of them oily; less red and processed meat.' },
  { key: 'dairy', label: 'Dairy and alternatives', share: 8, say: 'Lower-fat and lower-sugar options.' },
  { key: 'fat', label: 'Oils and spreads', share: 1, say: 'Unsaturated oils, in small amounts.' },
]
export const FIVE_A_DAY = {
  portionGrams: 80, driedGrams: 30, juiceMl: 150,
  rules: ['80 g of fresh, frozen or tinned fruit or vegetables is one portion; 30 g of dried fruit is one.', 'Fruit juice or a smoothie counts once a day, at most 150 ml.', 'Beans and pulses count once a day, however much you eat (about 3 heaped tablespoons).', 'Potatoes, yams and other starchy foods do not count.'],
}
export const FLUIDS = { glasses: [6, 8], say: 'About 6 to 8 cups or glasses a day. Water, lower-fat milk and sugar-free drinks, tea and coffee included, all count. More when it is hot or you are active for long.' }
// Reference intakes for an average adult (the "% RI" on labels), and three daily limits.
export const REFERENCE_INTAKES = [
  { key: 'energy', label: 'Energy', amount: '8,400 kJ / 2,000 kcal' },
  { key: 'fat', label: 'Fat', amount: '70 g' },
  { key: 'saturates', label: 'Saturates', amount: '20 g' },
  { key: 'carbohydrate', label: 'Carbohydrate', amount: '260 g' },
  { key: 'sugars', label: 'Sugars', amount: '90 g' },
  { key: 'protein', label: 'Protein', amount: '50 g' },
  { key: 'salt', label: 'Salt', amount: '6 g' },
]
export const DAILY_LIMITS = [
  { label: 'Free sugars', say: 'No more than 30 g a day (about 7 sugar cubes). Sugar in milk, whole fruit and vegetables is not free sugar.', source: 'sugar' },
  { label: 'Salt', say: 'No more than 6 g a day, about a teaspoon.', source: 'tips' },
  { label: 'Fibre', say: 'Aim for 30 g a day: wholegrains, beans, fruit and vegetables.', source: 'fibre' },
]

// Front-of-pack traffic lights. Per 100 g of food (per 100 ml of a drink): at or below `low` is
// green, above `high` is red, between is amber. A portion over 100 g (150 ml for a drink) is red
// when one portion is above `portionRed`, whatever its colour per 100 g.
export const TRAFFIC_LIGHTS = {
  fat: { label: 'Fat', food: { low: 3, high: 17.5 }, drink: { low: 1.5, high: 8.75 }, portionRed: 21 },
  saturates: { label: 'Saturates', food: { low: 1.5, high: 5 }, drink: { low: 0.75, high: 2.5 }, portionRed: 6 },
  sugars: { label: 'Sugars', food: { low: 5, high: 22.5 }, drink: { low: 2.5, high: 11.25 }, portionRed: 27 },
  salt: { label: 'Salt', food: { low: 0.3, high: 1.5 }, drink: { low: 0.3, high: 0.75 }, portionRed: 1.8 },
}
export function trafficLight(nutrient, per100, { drink = false, portion = null } = {}) {
  const rule = TRAFFIC_LIGHTS[nutrient]
  const value = Number(per100)
  if (!rule || !Number.isFinite(value) || value < 0) return null
  const band = drink ? rule.drink : rule.food
  const portionSize = Number(portion)
  if (Number.isFinite(portionSize) && portionSize > (drink ? 150 : 100) && value * portionSize / 100 > rule.portionRed) return 'red'
  return value <= band.low ? 'green' : value > band.high ? 'red' : 'amber'
}

// The 14 allergens UK food law names: a menu or a label must say when a food contains one.
export const ALLERGENS = [
  { key: 'celery', label: 'Celery', say: 'celery, celeriac; often in stock cubes and soups' },
  { key: 'gluten', label: 'Cereals with gluten', say: 'wheat, rye, barley, oats; bread, pasta, flour' },
  { key: 'crustaceans', label: 'Crustaceans', say: 'prawns, crab, lobster' },
  { key: 'eggs', label: 'Eggs', say: 'also in mayonnaise, cakes, fresh pasta' },
  { key: 'fish', label: 'Fish', say: 'also in Worcestershire sauce and some dressings' },
  { key: 'lupin', label: 'Lupin', say: 'lupin flour and seeds, in some bread and pastry' },
  { key: 'milk', label: 'Milk', say: 'butter, cheese, cream, yoghurt' },
  { key: 'molluscs', label: 'Molluscs', say: 'mussels, squid, oyster sauce' },
  { key: 'mustard', label: 'Mustard', say: 'mustard, and sauces and dressings made with it' },
  { key: 'peanuts', label: 'Peanuts', say: 'peanut butter, satay, some oils' },
  { key: 'sesame', label: 'Sesame', say: 'tahini, hummus, sesame oil and seeds' },
  { key: 'soya', label: 'Soya', say: 'tofu, soy sauce, edamame' },
  { key: 'sulphites', label: 'Sulphur dioxide and sulphites', say: 'dried fruit, wine, some sausages' },
  { key: 'nuts', label: 'Tree nuts', say: 'almonds, hazelnuts, walnuts, cashews and the rest' },
]

// What someone eats, and what a recipe has in it, so the two can be compared.
export const DIETS = [
  { key: 'everything', label: 'Everything' },
  { key: 'pescatarian', label: 'Pescatarian (fish, no meat)' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
]
export const LEAVE_OUT = [{ key: 'pork', label: 'No pork' }, { key: 'beef', label: 'No beef' }, { key: 'alcohol', label: 'No alcohol in cooking' }]
const MEAT = new Set(['beef', 'pork', 'lamb', 'chicken', 'turkey'])
const ANIMAL = new Set(['milk', 'eggs', 'fish', 'crustaceans', 'molluscs', 'honey'])
// Why a recipe does not suit someone's diet, in words; [] when it suits.
export function dietClash(recipe, diet = {}) {
  const contains = new Set([...(recipe.contains ?? []), ...(recipe.allergens ?? [])])
  const why = []
  const eats = diet.eats ?? 'everything'
  if (eats !== 'everything') {
    const meat = [...contains].filter((x) => MEAT.has(x))
    if (meat.length) why.push(`has ${meat.join(' and ')}`)
    if (eats === 'vegetarian' || eats === 'vegan') { const sea = ['fish', 'crustaceans', 'molluscs'].filter((x) => contains.has(x)); if (sea.length) why.push(`has ${sea.join(' and ')}`) }
    if (eats === 'vegan') { const animal = [...contains].filter((x) => ANIMAL.has(x) && !['fish', 'crustaceans', 'molluscs'].includes(x)); if (animal.length) why.push(`has ${animal.join(' and ')}`) }
  }
  for (const key of diet.leaveOut ?? []) if (contains.has(key)) why.push(`has ${key}`)
  for (const key of diet.avoid ?? []) if (contains.has(key)) why.push(`contains ${ALLERGENS.find((a) => a.key === key)?.label.toLowerCase() ?? key}`)
  return [...new Set(why)]
}

// ---- Care ------------------------------------------------------------------------------------
export const CARE_KINDS = [
  { key: 'doctor', label: 'GP or doctor' }, { key: 'dentist', label: 'Dentist' }, { key: 'optician', label: 'Optician (eye test)' },
  { key: 'blood-test', label: 'Blood test' }, { key: 'vaccination', label: 'Vaccination' }, { key: 'scan', label: 'Scan or X-ray' },
  { key: 'hospital', label: 'Hospital or clinic' }, { key: 'physio', label: 'Physiotherapy' }, { key: 'pharmacy', label: 'Pharmacy' },
  { key: 'therapy', label: 'Talking therapy' }, { key: 'sexual-health', label: 'Sexual health clinic' }, { key: 'other', label: 'Something else' },
]
export const RECORD_KINDS = [{ key: 'result', label: 'Test result' }, { key: 'prescription', label: 'Prescription' }, { key: 'letter', label: 'Letter' }, { key: 'note', label: 'Note' }]
export const MEASURES = [
  { key: 'weight', label: 'Weight', unit: 'kg' }, { key: 'waist', label: 'Waist', unit: 'cm' }, { key: 'sleep', label: 'Sleep', unit: 'hours' },
  { key: 'resting-heart-rate', label: 'Resting heart rate', unit: 'bpm' }, { key: 'steps', label: 'Steps', unit: 'steps' },
]
// Ticked on the day, not typed: portions of fruit and veg, glasses of fluid.
export const DAILY_TICKS = [{ key: 'five-a-day', label: '5 A Day', unit: 'portions', of: 5 }, { key: 'water', label: 'Drinks', unit: 'glasses', of: 8 }]
export const URGENT_HELP = [
  { label: '999', say: 'A medical emergency: someone is seriously ill or injured, or their life is at risk.' },
  { label: 'NHS 111', say: 'You need help fast but it is not an emergency: call 111, or use NHS 111 online for where you live (England, Wales and Scotland each have their own).' },
  { label: 'A pharmacist', say: 'Advice and medicines for minor illnesses, without an appointment.' },
]
