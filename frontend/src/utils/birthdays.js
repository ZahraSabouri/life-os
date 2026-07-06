const DAY_MS = 24 * 60 * 60 * 1000

function parseBirthday(value) {
  if (typeof value !== 'string') return null

  const match = value.match(/^\d{4}-(\d{2})-(\d{2})/)
  if (!match) return null

  const month = Number(match[1])
  const day = Number(match[2])

  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  return { month, day }
}

function startOfDay(value) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

export function daysUntilNextBirthday(birthday, fromDate = new Date()) {
  const parsed = parseBirthday(birthday)
  if (!parsed) return null

  const today = startOfDay(fromDate)
  let nextBirthday = new Date(today.getFullYear(), parsed.month - 1, parsed.day)

  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, parsed.month - 1, parsed.day)
  }

  return Math.round((nextBirthday - today) / DAY_MS)
}

export function upcomingBirthdays(people, fromDate = new Date(), windowDays = 30) {
  return people
    .map((person) => ({
      ...person,
      daysUntil: daysUntilNextBirthday(person.birthday, fromDate)
    }))
    .filter((person) => person.daysUntil !== null && person.daysUntil <= windowDays)
    .sort((left, right) => left.daysUntil - right.daysUntil || left.name.localeCompare(right.name))
}
