// Programmes: a run of sessions on chosen weekdays. Starting one puts each session on the calendar
// as a planned workout; a session knows its steps from here, by its programme and key.
// Couch to 5K follows the NHS plan exactly (SOURCES.c25k): every run has a 5-minute brisk walk
// before and after, and three runs a week for nine weeks.

const C25K_WEEKS = [
  // [run, walk] minutes in order; a final run closes each list.
  { runs: [[[1, 1.5, 7], [1]]] },
  { runs: [[[1.5, 2, 5], [1.5]]] },
  { runs: [[[1.5, 1.5], [3, 3], [1.5, 1.5], [3]]] },
  { runs: [[[3, 1.5], [5, 2.5], [3, 1.5], [5]]] },
  { runs: [[[5, 3], [5, 3], [5]], [[8, 5], [8]], [[20]]] },
  { runs: [[[5, 3], [8, 3], [5]], [[10, 3], [10]], [[25]]] },
  { runs: [[[25]]] },
  { runs: [[[28]]] },
  { runs: [[[30]]] },
]
const say = (minutes) => (minutes === 1.5 ? '1½ minutes' : minutes === 2.5 ? '2½ minutes' : minutes === 1 ? '1 minute' : `${minutes} minutes`)
function c25kSession(week, run) {
  const plan = C25K_WEEKS[week - 1].runs[Math.min(run, C25K_WEEKS[week - 1].runs.length) - 1]
  const steps = ['Walk briskly for 5 minutes to warm up.']
  let running = 0, walking = 10
  for (const part of plan) {
    const [r, w, times = 1] = part
    running += r * times
    if (w !== undefined) walking += w * times
    if (w === undefined) steps.push(plan.length === 1 ? `Run for ${say(r)} without stopping.` : `Run ${say(r)} to finish.`)
    else steps.push(times > 1 ? `Run ${say(r)}, then walk ${say(w)}. Do this ${times} times.` : `Run ${say(r)}, then walk ${say(w)}.`)
  }
  steps.push('Walk for 5 minutes to cool down, then stretch.')
  return { key: `${week}-${run}`, title: `Couch to 5K · week ${week}, run ${run}`, kind: 'run', minutes: running + walking, moderate: walking, vigorous: running, strength: false, steps, exercises: ['brisk-walk', 'jog'] }
}

const HOME_A = ['squat', 'knee-push-up', 'glute-bridge', 'reverse-lunge', 'plank', 'superman']
const HOME_B = ['sit-to-stand', 'wall-press-up', 'step-up', 'chair-dip', 'side-plank', 'bird-dog']
const GYM_A = ['goblet-squat', 'db-bench-press', 'lat-pulldown', 'romanian-deadlift', 'plank']
const GYM_B = ['leg-press', 'shoulder-press', 'seated-row', 'glute-bridge', 'dead-bug']

export const PROGRAMMES = [
  {
    id: 'c25k', name: 'Couch to 5K', by: 'NHS', source: 'c25k', weeks: 9, perWeek: 3, days: [1, 3, 6], kind: 'run',
    say: 'From walking to running 5 km (or 30 minutes) without stopping, in nine weeks. Three runs a week, with a rest day between.',
    sessions: () => Array.from({ length: 27 }, (_, i) => c25kSession(Math.floor(i / 3) + 1, (i % 3) + 1)),
  },
  {
    id: 'strength-home', name: 'Strength at home', by: 'Life OS, from the NHS strength exercises', source: 'strength', weeks: 6, perWeek: 2, days: [2, 5], kind: 'strength',
    say: 'Two short sessions a week with no equipment, for the guideline\'s two strength days. Two sets of each to start, three from week 4.',
    sessions: () => Array.from({ length: 12 }, (_, i) => {
      const week = Math.floor(i / 2) + 1, a = i % 2 === 0, sets = week >= 4 ? 3 : 2
      const list = a ? HOME_A : HOME_B
      return { key: `${week}-${a ? 'a' : 'b'}`, title: `Strength at home · week ${week}, ${a ? 'A' : 'B'}`, kind: 'strength', minutes: sets === 3 ? 30 : 25, moderate: 0, vigorous: 0, strength: true,
        steps: ['Warm up for 5 minutes: march on the spot, roll your shoulders, a few slow squats.', `Do each exercise below for ${sets} sets of 8 to 12 (holds: 20 to 40 seconds), resting a minute between sets.`, 'Stretch for a few minutes at the end.'], exercises: list }
    }),
  },
  {
    id: 'gym-starter', name: 'Gym starter: whole body', by: 'Life OS', source: 'strengthFlex', weeks: 8, perWeek: 3, days: [1, 3, 5], kind: 'gym',
    say: 'Three gym visits a week, alternating two whole-body workouts. A 10-minute warm-up on the cross-trainer or bike counts towards your 150 minutes.',
    sessions: () => Array.from({ length: 24 }, (_, i) => {
      const week = Math.floor(i / 3) + 1, a = i % 2 === 0
      return { key: `${week}-${(i % 3) + 1}`, title: `Gym starter · week ${week}, workout ${a ? 'A' : 'B'}`, kind: 'gym', minutes: 50, moderate: 10, vigorous: 0, strength: true,
        steps: ['Warm up for 10 minutes on the cross-trainer or bike.', `Do each exercise below for 3 sets of 8 to 12. Choose a weight that makes the last 2 hard but still tidy; add a little when 12 is easy.`, 'Stretch for 5 minutes.'], exercises: a ? GYM_A : GYM_B }
    }),
  },
  {
    id: 'walk-150', name: 'Brisk walks: 150 minutes a week', by: 'Life OS, from the NHS guidelines', source: 'walking', weeks: 4, perWeek: 5, days: [1, 2, 3, 4, 5], kind: 'walk',
    say: 'Five 30-minute brisk walks a week reach the guideline on their own. A walk to class or the shops counts.',
    sessions: () => Array.from({ length: 20 }, (_, i) => ({ key: `${Math.floor(i / 5) + 1}-${(i % 5) + 1}`, title: `Brisk walk, 30 minutes · week ${Math.floor(i / 5) + 1}`, kind: 'walk', minutes: 30, moderate: 30, vigorous: 0, strength: false,
      steps: ['Walk at a pace where you can talk but not sing.', 'Keep going for 30 minutes; three walks of 10 minutes count too.'], exercises: ['brisk-walk'] })),
  },
]
export const programme = (id) => PROGRAMMES.find((row) => row.id === id) ?? null
export function programmeSession(id, key) { return programme(id)?.sessions().find((row) => row.key === key) ?? null }

const addDays = (date, n) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const weekday = (date) => ((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7) + 1 // Monday 1 … Sunday 7

// The days a programme's sessions fall on: from `start`, on the chosen weekdays, one session a day.
export function scheduleProgramme(id, { start, days } = {}) {
  const plan = programme(id)
  if (!plan) throw new Error('No such programme')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start ?? '')) throw new Error('Choose the day to start')
  const chosen = [...new Set((days?.length ? days : plan.days).map(Number))].filter((d) => d >= 1 && d <= 7).sort()
  if (!chosen.length) throw new Error('Choose at least one day of the week')
  const sessions = plan.sessions(), out = []
  for (let date = start; out.length < sessions.length; date = addDays(date, 1)) {
    if (chosen.includes(weekday(date))) out.push({ date, session: sessions[out.length] })
  }
  return out
}
