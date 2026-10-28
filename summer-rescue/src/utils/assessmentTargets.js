// Official assessment records can confirm a countdown without creating a second
// module exam date (which would also create a duplicate calendar event).
const examKinds = new Set(['exam', 'test', 'in-class test', 'in-class-test'])
const finished = new Set(['done', 'completed', 'submitted', 'cancelled', 'canceled', 'archived'])

export function assessmentTargets(assessments = [], modules = [], referenceDate = '') {
  return assessments.flatMap((row) => {
    if (row.deleted_at || finished.has(String(row.status).toLowerCase()) || !examKinds.has(String(row.data?.kind).toLowerCase())) return []
    const date = String(row.start_date || row.start_at || row.end_date || row.end_at || '').slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return []
    const parsed = new Date(`${date}T12:00:00Z`)
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || (referenceDate && date < referenceDate)) return []
    const module = modules.find((entry) => entry.rowId === row.module_id || entry.id === row.module_id)
    return [{ date, label: row.title || 'Assessment', moduleId: module?.id || row.module_id || null, assessmentId: row.id, confirmed: true }]
  })
}
