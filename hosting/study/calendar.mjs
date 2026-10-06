import { dateKey, isDateKey, itemOverlaps, londonDateTime } from '../../code/life-os/shared/calendar.js'

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

export function mapNativeStudy(workspace, from, to) {
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
      href: `/study-native?${entity === 'cards' ? 'card' : entity === 'assessments' ? 'assessment' : 'session'}=${encodeURIComponent(record.id)}`,
      ...(record.data?.location ? { location: record.data.location } : {}),
      meta: { source: 'native-study', readonly: true, entity, recordId: record.id,
        ...(entity === 'cards' ? { cardId: record.id } : {}), semesterId: record.semester_id, moduleId: record.module_id,
        status: record.status, type: values.type, ...(values.needsVerification ? { needsVerification: true } : {}) }
    }
    if (itemOverlaps(item, from, to)) output.push(item)
  }
  for (const card of rows(workspace?.cards)) {
    if (!card.id || !visible(card) || complete(card)) continue
    add(card, 'cards', 'start', { date: card.start_date, at: card.start_at, kind: 'plan', type: 'study-plan', title: `Start · ${card.title || 'Study plan'}` })
    const date = card.end_date || card.data?.due_date || card.data?.dueDate
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
