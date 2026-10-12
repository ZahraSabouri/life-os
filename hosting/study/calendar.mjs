import { dateKey, isDateKey, itemOverlaps, londonDateTime } from '../../code/life-os/shared/calendar.js'
import { expandScheduleRange } from '../../summer-rescue/src/utils/schedule.js'

const inactive = new Set(['archived', 'cancelled', 'canceled', 'deleted', 'inactive', 'rescheduled'])
const finished = new Set(['done', 'completed', 'complete', 'submitted', 'passed'])
const status = record => String(record?.status ?? '').toLowerCase().trim()
const live = record => record && !record.deleted_at && !record.archived && record.data?.active !== false && record.data?.enabled !== false && !inactive.has(status(record))
const complete = record => finished.has(status(record)) || record.done === true || record.completed === true || record.data?.done === true || record.data?.completed === true
const activeParent = record => live(record) && !complete(record)
const rows = value => Array.isArray(value) ? value : []

function instant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(value) || !isDateKey(value.slice(0, 10))) return ''
  const parsed = new Date(value)
  return Number.isFinite(+parsed) ? parsed.toISOString() : ''
}

// `plans`: each open semester's Study hub plan ({ semesterId, plan }). Its study blocks are
// the hours set aside for a card, so they go on the calendar at their clock times.
export function mapNativeStudy(workspace, from, to, plans = []) {
  if (!isDateKey(from) || !isDateKey(to) || from > to) throw new Error('Choose valid inclusive calendar dates')
  const semesters = new Map(rows(workspace?.semesters).map(row => [row.id, row]))
  const modules = new Map(rows(workspace?.modules).map(row => [row.id, row]))
  const visible = record => live(record)
    && (!record.semester_id || !semesters.has(record.semester_id) || activeParent(semesters.get(record.semester_id)))
    && (!record.module_id || !modules.has(record.module_id) || (activeParent(modules.get(record.module_id))
      && (!modules.get(record.module_id).semester_id || !semesters.has(modules.get(record.module_id).semester_id) || activeParent(semesters.get(modules.get(record.module_id).semester_id)))))
  const output = []
  function add(record, entity, suffix, values) {
    const start = instant(values.at) || (isDateKey(values.date) ? values.date : '')
    if (!start) return
    const allDay = isDateKey(start)
    const end = allDay ? (isDateKey(values.endDate) ? values.endDate : null) : instant(values.endAt) || null
    if (end && (allDay ? end < start : Date.parse(end) < Date.parse(start))) return
    const item = {
      id: `study:native:${entity}:${record.id}${suffix ? `:${suffix}` : ''}`, area: 'study', kind: values.kind,
      title: values.title || record.title || 'Study plan', start, end, all_day: allDay,
      // What the Study hub app saved opens in the app; a record kept only as a row opens in the plain list.
      // Everything of Study opens in the Study hub: a card on the card, a class or a test on the Schedule.
      href: entity === 'cards' ? (record.data?.hubCardId ? `/study#/today?card=${encodeURIComponent(record.data.hubCardId)}` : '/study') : '/study#/schedule',
      ...(record.data?.location ? { location: record.data.location } : {}),
      meta: { source: 'native-study', readonly: true, entity, recordId: record.id,
        ...(entity === 'cards' ? { cardId: record.id } : {}), semesterId: record.semester_id, moduleId: record.module_id,
        status: record.status, type: values.type, ...(values.needsVerification ? { needsVerification: true } : {}) }
    }
    if (itemOverlaps(item, from, to)) output.push(item)
  }
  // Study blocks first: a card with blocks is shown by them, at the hours it is worked on.
  const cardsByHubId = new Map(rows(workspace?.cards).filter(card => card.id && card.data?.hubCardId).map(card => [`${card.semester_id}\0${card.data.hubCardId}`, card]))
  const blockDays = new Map()
  for (const entry of rows(plans)) {
    const semester = semesters.get(entry?.semesterId)
    if (!semester || !activeParent(semester)) continue
    for (const day of expandScheduleRange(rows(entry.plan?.scheduleRules), rows(entry.plan?.scheduleExceptions), from, to)) {
      for (const block of day.blocks) {
        const card = [block.cardId, ...rows(block.cardIds)].filter(Boolean).map(id => cardsByHubId.get(`${semester.id}\0${id}`)).find(Boolean) ?? null
        if (card && (!visible(card) || complete(card))) continue
        const start = londonDateTime(day.date, block.start), end = londonDateTime(day.date, block.end)
        if (!start || !end || Date.parse(end) <= Date.parse(start)) continue
        if (card) blockDays.set(card.id, (blockDays.get(card.id) ?? new Set()).add(day.date))
        // The block on a card's due date is where the card falls due.
        const due = card && (card.end_date || card.data?.due_date || card.data?.dueDate) === day.date
        output.push({
          id: `study:block:${semester.id}:${block.occurrenceId}`, area: 'study', kind: due ? 'deadline' : 'plan',
          title: block.title, start, end, all_day: false,
          href: card?.data?.hubCardId ? `/study#/today?card=${encodeURIComponent(card.data.hubCardId)}` : '/study#/schedule',
          ...(block.location ? { location: block.location } : {}),
          meta: { source: 'native-study', readonly: true, entity: 'blocks', type: 'study-block', semesterId: semester.id,
            ...(card ? { cardId: card.id, recordId: card.id, moduleId: card.module_id, status: card.status } : {}) },
        })
      }
    }
  }
  for (const card of rows(workspace?.cards)) {
    if (!card.id || !visible(card) || complete(card)) continue
    const date = card.end_date || card.data?.due_date || card.data?.dueDate
    const worked = blockDays.get(card.id)
    // A card that starts and is due on the same day is one thing that day, not two; a card
    // with study blocks starts where its first block is.
    const oneDay = !card.start_at && isDateKey(card.start_date) && card.start_date === date
    if (!oneDay && !worked) add(card, 'cards', 'start', { date: card.start_date, at: card.start_at, kind: 'plan', type: 'study-plan', title: `Start · ${card.title || 'Study plan'}` })
    if (worked?.has(date)) continue
    const dueTime = card.data?.dueTime || card.data?.due_time
    const configuredTime = dueTime && isDateKey(date) ? londonDateTime(date, dueTime) : ''
    const reminder = card.data?.kind === 'reminder' || rows(card.data?.tags).includes('date-watch')
    add(card, 'cards', 'deadline', { date, at: card.end_at || card.data?.due_at || configuredTime,
      kind: reminder ? 'reminder' : 'deadline', type: 'study-deadline', needsVerification: Boolean(dueTime && !configuredTime && !card.end_at) })
  }
  for (const assessment of rows(workspace?.assessments)) {
    if (!assessment.id || !visible(assessment) || complete(assessment) || (assessment.data?.result != null && assessment.data.result !== '')) continue
    const exam = ['exam', 'examination'].includes(String(assessment.data?.kind || assessment.data?.type || assessment.data?.assessmentType || '').toLowerCase())
    const dueDate = assessment.end_date || assessment.data?.due_date || assessment.data?.dueDate
    const dueAt = assessment.end_at || assessment.data?.due_at
    add(assessment, 'assessments', '', {
      date: exam ? assessment.start_date || dueDate : dueDate || assessment.start_date,
      at: exam ? assessment.start_at || dueAt : dueAt || assessment.start_at,
      ...(exam ? { endDate: assessment.end_date, endAt: assessment.end_at } : {}),
      kind: exam ? 'fixed' : 'deadline', type: exam ? 'study-exam' : 'study-deadline'
    })
  }
  for (const session of rows(workspace?.sessions)) {
    if (!session.id || !visible(session) || complete(session)) continue
    const category = String(session.data?.category || session.data?.kind || session.data?.type || '').toLowerCase().trim()
    const plannedWork = ['study', 'project', 'routine', 'reading', 'exercise'].includes(category)
    add(session, 'sessions', '', { date: session.start_date, at: session.start_at, endDate: session.end_date, endAt: session.end_at,
      kind: plannedWork ? 'plan' : 'fixed', type: 'study-session' })
  }
  return output.sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id))
}
