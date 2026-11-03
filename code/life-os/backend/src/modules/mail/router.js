import { Router } from 'express'
import { MailError } from './repository.js'
import { dateKey } from '../../../../shared/calendar.js'
import { birthdayWishes, groupActions, parseOwe, peopleNamed, priorityOf } from '../../../../shared/mail.js'
import { partOf, PARTS } from '../../../../shared/harvest.js'

// /api/mail. inbox is hosting/mail/inbox.mjs (status, scan); importer undoes batches; reads serves
// the pages; findPeople reads the core's People (only read: Life OS never creates a person from mail);
// places finds where harvested vacancies and events are now (hosting/mail/places.mjs, read only).
export function createMailRouter({ repository, importer, inbox, reads, findPeople = () => [], places = async (items) => items, now = () => new Date() }) {
  if (!repository || !importer || !inbox || !reads) throw new TypeError('The mail router needs a repository, an importer, an inbox and reads')
  const router = Router()
  const handler = (callback) => async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store')
      await callback(req, res)
    } catch (error) {
      if (error instanceof MailError || (Number.isInteger(error.status) && error.status >= 400 && error.status < 500)) {
        return res.status(error.status).json({ error: error.message, ...(error.details === undefined ? {} : { details: error.details }) })
      }
      if (['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', '57P01', '57P03', '42P01', '3F000', '28P01'].includes(error.code)) return res.status(503).json({ error: 'Mail storage is unavailable. Try again after the local server is ready.' })
      next(error)
    }
  }
  const revisionOf = (body) => { const revision = Number(body?.revision); if (!Number.isInteger(revision)) throw new MailError(400, 'Send the revision you last saw'); return revision }
  const without = (body, ...keys) => Object.fromEntries(Object.entries(body ?? {}).filter(([key]) => !keys.includes(key)))

  // Everything on Waiting on you: gathered and hers, and today's birthday wishes from People.
  async function allActions() {
    const today = dateKey(now())
    const [rows, people] = await Promise.all([reads.actions(), Promise.resolve(findPeople()).catch(() => [])])
    const birthdays = rows.filter((row) => row.origin === 'birthday')
    const wishes = birthdayWishes(people, today, birthdays).filter((row) => row.virtual)
    return { today, people, actions: [...rows, ...wishes] }
  }

  router.get('/status', handler(async (_req, res) => res.json({ ...(await inbox.status()), lastBatch: await repository.lastBatch(), counts: await repository.counts() })))
  router.post('/scan', handler(async (_req, res) => res.json(await inbox.scan())))
  router.get('/batches', handler(async (_req, res) => res.json(await repository.batches())))
  router.post('/batches/:id/undo', handler(async (req, res) => res.json(await importer.undo(req.params.id))))
  router.get('/digests', handler(async (_req, res) => res.json({ digests: await reads.digests(), lastGathered: await reads.lastGathered() })))

  router.get('/actions', handler(async (_req, res) => { const { today, actions } = await allActions(); res.json({ today, actions }) }))
  // Today, the envelope: the five most pressing, the latest headline, when it was last gathered.
  router.get('/summary', handler(async (_req, res) => {
    const { today, actions } = await allActions()
    const groups = groupActions(actions, today)
    const open = [...groups.today, ...groups.week, ...groups.whenever]
    const [digest] = await reads.digests(1)
    const lastGathered = await reads.lastGathered()
    res.json({
      today, top: open.slice(0, 5), open: open.length, pressing: open.filter((row) => ['urgent', 'high'].includes(priorityOf(row))).length,
      headline: digest?.status === 'applied' ? digest.digest?.headline ?? '' : '', lastGathered,
      staleDays: lastGathered ? Math.floor((now().getTime() - Date.parse(lastGathered)) / 86_400_000) : null,
    })
  }))
  // A line she owes: { text: "text Sam about Saturday" } or { kind, title, person_id, … }.
  router.post('/actions', handler(async (req, res) => {
    const body = req.body ?? {}
    let fields = without(body, 'text', 'who')
    let who = body.who ?? ''
    if (body.text !== undefined) {
      const owed = parseOwe(body.text)
      if (!owed) throw new MailError(400, 'Start with text, call, email or reply, and say who')
      fields = { ...fields, kind: owed.kind, title: owed.title }
      who = owed.who
    }
    let candidates = []
    if (!fields.person_id && who) {
      candidates = peopleNamed(await Promise.resolve(findPeople()).catch(() => []), who)
      if (candidates.length === 1) fields = { ...fields, person_id: String(candidates[0].id), person_name: candidates[0].name }
    }
    const saved = await repository.createHers(fields)
    res.status(201).json({ ...saved, ...(candidates.length > 1 ? { candidates: candidates.map((person) => ({ id: person.id, name: person.name })) } : {}) })
  }))
  router.patch('/actions/:id', handler(async (req, res) => res.json(await repository.patchHers('actions', req.params.id, revisionOf(req.body), without(req.body, 'revision')))))
  router.post('/birthdays', handler(async (req, res) => res.status(201).json(await repository.actOnBirthday(req.body ?? {}))))

  router.get('/messages', handler(async (req, res) => {
    const query = req.query ?? {}
    res.json(await reads.messages({ source: String(query.source ?? ''), filter: String(query.filter ?? 'all'), unread: query.unread === '1', hidden: query.hidden === '1', noise: query.noise === '1', q: String(query.q ?? '') }))
  }))
  router.get('/messages/:id', handler(async (req, res) => {
    const found = await reads.message(req.params.id)
    if (!found) throw new MailError(404, 'Not found')
    const seen = found.seen_at ? found : await repository.markSeen(found.id)
    res.json({ ...found, seen_at: seen.seen_at, revision: seen.revision })
  }))
  router.patch('/messages/:id', handler(async (req, res) => res.json(await repository.patchHers('messages', req.params.id, revisionOf(req.body), without(req.body, 'revision')))))
  // What came in, with where each vacancy and event is now. ?part= one part's (shared/harvest.js
  // partOf), ?day= one London day's, ?open=1 only what is not dismissed or over.
  router.get('/items', handler(async (req, res) => {
    const query = req.query ?? {}
    const today = dateKey(now())
    const part = String(query.part ?? '')
    if (part && !Object.hasOwn(PARTS, part)) throw new MailError(400, `Unknown part: ${part}`)
    const rows = (await reads.items({ day: String(query.day ?? ''), open: query.open === '1', today })).filter((row) => !part || partOf(row) === part)
    res.json({ today, items: await places(rows) })
  }))
  // What came in: Keep, Dismiss, seen. Only her fields, with the revision she last saw.
  router.patch('/items/:id', handler(async (req, res) => res.json(await repository.patchHers('items', req.params.id, revisionOf(req.body), without(req.body, 'revision')))))

  // Everyone with something open or a recent message, keyed by their People id.
  router.get('/people', handler(async (_req, res) => {
    const people = await Promise.resolve(findPeople()).catch(() => [])
    const found = await Promise.all(people.map(async (person) => [String(person.id), await reads.person(person.id, person.contact)]))
    res.json(Object.fromEntries(found.filter(([, entry]) => entry.actions.length || entry.messages.length)))
  }))
  router.get('/people/:id', handler(async (req, res) => {
    const person = (await Promise.resolve(findPeople()).catch(() => [])).find((entry) => String(entry.id) === req.params.id)
    if (!person) throw new MailError(404, 'Not found')
    res.json(await reads.person(person.id, person.contact))
  }))
  router.use((_req, res) => res.status(404).json({ error: 'Mail endpoint was not found' }))
  return router
}
