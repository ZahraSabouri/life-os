// Everything about one thing on the calendar or the day, read from wherever it is kept, so a
// thing opened shows all it has: what it is, when and where, its note or description, its steps,
// its files and links. Read only. GET /api/thing?id=<calendar item id>
//   core:entry:<id>                 her own entry (a repeating plan's day: core:entry:routine:<id>:<day>)
//   study:native:cards:<id>[:…]     a Study hub card
//   study:native:sessions:<id>      a class
//   study:native:assessments:<id>   a test or coursework
//   career:<deadline|follow-up>:<id> a job in JobMap
//   events:event:<id>               an event
const text = (value, max = 4000) => (typeof value === 'string' ? value.trim().slice(0, max) : '')
const array = (value) => (Array.isArray(value) ? value : [])
const plain = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {})
const parse = (value) => { if (typeof value !== 'string') return plain(value); try { return plain(JSON.parse(value)) } catch { return {} } }
const fact = (label, value) => (value === undefined || value === null || value === '' ? null : { label, value: String(value) })
const facts = (...list) => list.filter(Boolean)
const link = (label, href) => (typeof href === 'string' && /^(https?:\/\/|\/)/.test(href) ? { label, href, external: /^https?:\/\//.test(href) } : null)
const hours = (value) => (Number(value) > 0 ? `${Number(value) < 1 ? `${Math.round(Number(value) * 60)} min` : `${Math.round(Number(value) * 10) / 10} h`}` : '')
const words = { task: 'Task', 'time-block': 'Time set aside', repeat: 'Repeating plan', event: 'Event', appointment: 'Appointment', workout: 'Exercise', note: 'Note', trip: 'Trip', meal: 'Meal' }
const day = (value) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : '')

// A class's description is "Room: … Group: … ID …": the parts worth reading, one a line.
function classLines(data) {
  const lines = []
  const description = text(data.description, 2000)
  for (const part of description.split(/\n+/)) {
    const line = part.trim()
    if (!line || /^ID \d+$/.test(line) || /^Group:/.test(line) || /AccessAble/.test(line)) continue
    lines.push(line)
  }
  return lines
}

function studyCard(row, workspace) {
  const data = plain(row.data)
  const modules = new Map(array(workspace.modules).map((module) => [module.id, module]))
  const materials = new Map(array(workspace.materials).map((material) => [`material-${material.id}`, material]))
  const files = array(data.resourceIds).map((id) => materials.get(id)).filter(Boolean)
    .map((material) => ({ title: text(material.title, 300), href: typeof material.data?.url === 'string' ? material.data.url : '' })).slice(0, 30)
  const module = modules.get(row.module_id)
  return {
    kind: 'Study card', title: text(row.title, 300),
    facts: facts(fact('Module', [module?.data?.code, module?.title].filter(Boolean).join(' · ')), fact('Starts', day(row.start_date)), fact('Due', day(row.end_date)),
      fact('Priority', text(data.priority, 40)), fact('Hours', hours(data.estimatedHours)), fact('Lane', text(data.lane, 40)), fact('Phase', text(data.phase, 120)),
      fact('Done', data.done === true || String(row.status).toLowerCase() === 'done' ? 'Yes' : '')),
    text: [text(data.slotLabel, 300)].filter(Boolean), doneWhen: text(data.doneCondition, 800),
    steps: array(data.checklist).map((step) => ({ id: text(step.id, 120), text: text(step.text, 600), done: step.done === true })).filter((step) => step.text),
    files, links: [], notes: text(data.trackerNotes ?? data.notes, 3000),
  }
}

export function createThing({ loadEntry, loadWorkspace, loadCareer, loadEvents }) {
  return async function thing(id) {
    const key = String(id ?? '')
    if (key.startsWith('core:entry:')) {
      let rest = key.slice('core:entry:'.length)
      let occurrenceDay = ''
      const routine = /^routine:([^:]+):(\d{4}-\d{2}-\d{2})$/.exec(rest)
      if (routine) { rest = routine[1]; occurrenceDay = routine[2] }
      rest = rest.replace(/:\d{4}-\d{2}-\d{2}$/, '')
      const entry = await loadEntry(rest)
      if (!entry) return null
      const details = parse(entry.details)
      const repeat = entry.type === 'repeat'
      return {
        kind: words[entry.type] ?? 'Entry', title: text(entry.title, 300), entryId: entry.id,
        facts: facts(fact('Area', text(details.area, 40)), fact('Status', occurrenceDay ? '' : text(entry.status, 40)),
          fact('Repeats', repeat ? `${text(details.weekdays, 40) ? 'on its days' : ''}${details.start ? ` ${details.start}${details.end ? `–${details.end}` : ''}` : ''}, ${day(entry.start_at)} to ${day(entry.end_at) || 'no end'}`.trim() : ''),
          fact('Priority', text(details.priority, 20)), fact('Due', day(details.due)), fact('Hours', hours(details.estimate)), fact('Place', text(details.location ?? details.place, 300)),
          fact('Paid work', details.work === true ? 'Yes' : ''), fact('Minutes', details.duration_min)),
        text: [text(details.note ?? details.body, 6000)].filter(Boolean),
        doneWhen: text(details.proof, 600),
        steps: array(details.steps).map((step) => ({ id: step.id, text: text(step.text, 600), done: step.done === true })),
        exercises: entry.type === 'workout' ? text(details.exercises, 4000) : '',
        files: [], links: [],
      }
    }
    if (key.startsWith('study:native:')) {
      const [, , entity, recordId] = key.split(':')
      const workspace = await loadWorkspace()
      const row = array(workspace?.[entity]).find((record) => record.id === recordId)
      if (!row) return null
      if (entity === 'cards') return studyCard(row, workspace)
      const data = plain(row.data)
      const module = array(workspace.modules).find((record) => record.id === row.module_id)
      if (entity === 'sessions') {
        return {
          kind: text(data.activity, 80) || 'Class', title: text(row.title, 300),
          facts: facts(fact('Module', [module?.data?.code, module?.title].filter(Boolean).join(' · ')), fact('Kind', text(data.activity, 80)), fact('Staff', text(data.staff, 300).replace(/\bStaff:\s*/g, '')),
            fact('Where', text(data.location, 400).replace(/\s*AccessAble Details:.*$/, '')), fact('Status', text(row.status, 40))),
          text: classLines(data), files: [], steps: [], doneWhen: '',
          links: [link('How to get there (AccessAble)', data.url), link('In the university timetable', data.sourceUrl)].filter(Boolean),
        }
      }
      if (entity === 'assessments') {
        return {
          kind: 'Assessment', title: text(row.title, 300),
          facts: facts(fact('Module', [module?.data?.code, module?.title].filter(Boolean).join(' · ')), fact('Weight', data.weight ? `${data.weight}%` : ''), fact('Due', day(row.end_at) || day(row.end_date)),
            fact('Kind', text(data.kind, 60)), fact('Conditions', text(data.conditions, 200)), fact('Status', text(row.status, 40))),
          text: [text(data.description, 4000)].filter(Boolean), files: [], steps: [], doneWhen: '',
          links: [link('Open it on Learning Central', data.url)].filter(Boolean),
        }
      }
      return null
    }
    if (key.startsWith('career:')) {
      const jobId = key.split(':').slice(2).join(':')
      const career = await loadCareer()
      const job = array(career?.jobs ?? career).find((record) => record?.id === jobId)
      if (!job) return null
      return {
        kind: 'Job', title: `${text(job.role, 200)} · ${text(job.company, 200)}`,
        facts: facts(fact('Status', text(job.status, 60)), fact('Closes', day(job.deadline)), fact('Where', text(job.location, 200)), fact('Pay', text(job.salary, 200)), fact('Hours', text(job.hours, 300)),
          fact('Applied', day(job.applied)), fact('Follow up', day(job.followUp)), fact('Next step', text(job.nextStep, 400))),
        text: [text(job.description, 3000)].filter(Boolean), notes: text(job.notes, 3000), files: [], steps: [], doneWhen: '',
        links: [link('The advert', job.url)].filter(Boolean),
      }
    }
    if (key.startsWith('events:event:')) {
      const eventId = key.slice('events:event:'.length)
      const event = array(await loadEvents()).find((record) => record?.event_id === eventId)
      if (!event) return null
      return {
        kind: 'Event', title: text(event.name, 300),
        facts: facts(fact('When', [day(event.date), text(event.start_time, 10), event.end_time ? `to ${text(event.end_time, 10)}` : ''].filter(Boolean).join(' ')), fact('Where', text(event.location, 300)),
          fact('Price', text(event.price ?? event.cost, 100)), fact('Organiser', text(event.organiser ?? event.organizer ?? event.host, 200)), fact('Category', text(event.category, 100))),
        text: [text(event.description ?? event.summary, 3000)].filter(Boolean), files: [], steps: [], doneWhen: '',
        links: [link('The listing', event.url ?? event.link ?? event.source_url)].filter(Boolean),
      }
    }
    return null
  }
}

export function createThingRouter({ express, thing }) {
  const router = express.Router()
  router.get('/', async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store')
      const found = await thing(String(req.query.id ?? '').slice(0, 300))
      if (!found) return res.status(404).json({ error: 'Nothing more is kept about it.' })
      res.json(found)
    } catch (error) { next(error) }
  })
  return router
}
