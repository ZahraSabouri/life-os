import { Router } from 'express'
import { MailError } from './repository.js'
import { dateKey } from '../../../../shared/calendar.js'
import { birthdayWishes, groupActions, parseOwe, peopleNamed, priorityOf } from '../../../../shared/mail.js'
import { partOf, placeOf, PARTS } from '../../../../shared/harvest.js'

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
  // Today, the envelope: the five most pressing, what came in, when it was last harvested.
  router.get('/summary', handler(async (_req, res) => {
    const { today, actions } = await allActions()
    const groups = groupActions(actions, today)
    const open = [...groups.today, ...groups.week, ...groups.whenever]
    const lastGathered = await reads.lastGathered()
    // What came in (stage 5), in place of the digest's headline: what came in today, and what
    // closes soon (shared/harvest.js placeOf: vacancies and opportunities within a week, offers in
    // their last two days), soonest first, with where each is now.
    const open_ = await reads.items({ open: true, today })
    const coming = open_.filter((item) => item.day === today || placeOf(item, today).today)
    res.json({
      today, top: open.slice(0, 5), open: open.length, pressing: open.filter((row) => ['urgent', 'high'].includes(priorityOf(row))).length,
      cameIn: { today: open_.filter((item) => item.day === today).length, lines: await places(coming.slice(0, 6)), more: Math.max(0, coming.length - 6) },
      lastGathered, staleDays: lastGathered ? Math.floor((now().getTime() - Date.parse(lastGathered)) / 86_400_000) : null,
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
    const word = (key) => String(query[key] ?? '')
    res.json(await reads.messages({ source: word('source'), filter: word('filter') || 'all', unread: query.unread === '1', hidden: query.hidden === '1', noise: query.noise === '1', q: word('q'),
      area: word('area'), from: word('from'), to: word('to'), priority: word('priority'), has: word('has'), notSeen: query.notseen === '1' }))
  }))
  // Hide, show again, or mark as opened, for several at once: each with the revision she saw; one
  // that changed since is left as it is and named.
  router.post('/messages/bulk', handler(async (req, res) => {
    const { messages: chosen = [], change } = req.body ?? {}
    const fields = { hide: { hidden_at: now().toISOString() }, show: { hidden_at: null }, seen: { seen_at: now().toISOString() } }[change]
    if (!fields) throw new MailError(400, 'Say hide, show or seen')
    if (!Array.isArray(chosen) || !chosen.length || chosen.length > 1000) throw new MailError(400, 'Choose between 1 and 1000 messages')
    if (!chosen.every((entry) => entry?.id && Number.isInteger(Number(entry.revision)))) throw new MailError(400, 'Send each message with the revision you last saw')
    let saved = 0
    const changed = []
    for (const entry of chosen) {
      try { await repository.patchHers('messages', String(entry.id), Number(entry.revision), fields); saved += 1 }
      catch (error) { if (error.status === 409 || error.status === 404) changed.push(String(entry.id)); else throw error }
    }
    res.json({ saved, changed })
  }))
  // One message, opened: with what was taken from it (its items, with where they are now, and its
  // things to do).
  router.get('/messages/:id', handler(async (req, res) => {
    const found = await reads.message(req.params.id)
    if (!found) throw new MailError(404, 'Not found')
    const seen = found.seen_at ? found : await repository.markSeen(found.id)
    const taken = await reads.taken(found.id)
    res.json({ ...found, seen_at: seen.seen_at, revision: seen.revision, taken: { items: await places(taken.items), actions: taken.actions } })
  }))
  // Her sender rules: fold or hide everything from one address.
  router.get('/senders', handler(async (_req, res) => res.json({ senders: await reads.senders() })))
  router.post('/senders', handler(async (req, res) => res.status(201).json(await repository.setSender(req.body ?? {}))))
  router.post('/senders/:id/remove', handler(async (req, res) => res.json(await repository.removeSender(req.params.id, revisionOf(req.body)))))
  router.patch('/messages/:id', handler(async (req, res) => res.json(await repository.patchHers('messages', req.params.id, revisionOf(req.body), without(req.body, 'revision')))))
  // What came in, with where each vacancy and event is now. ?part= one part's (shared/harvest.js
  // partOf), ?day= one London day's, ?open=1 only what is not dismissed or over.
  // The Everything view adds area, kind, status, closing, q, sort and where (there: found in
  // JobMap or Cardiff Life; missing: not there yet).
  router.get('/items', handler(async (req, res) => {
    const query = req.query ?? {}
    const today = dateKey(now())
    const word = (key) => String(query[key] ?? '')
    const part = word('part')
    if (part && !Object.hasOwn(PARTS, part)) throw new MailError(400, `Unknown part: ${part}`)
    const rows = (await reads.items({ day: word('day'), open: query.open === '1', today, area: word('area'), kind: word('kind'), status: word('status'), closing: word('closing'), q: word('q'), sort: word('sort') }))
      .filter((row) => !part || partOf(row) === part)
    const placed = await places(rows)
    const where = word('where')
    res.json({ today, items: where === 'there' ? placed.filter((row) => row.place?.href) : where === 'missing' ? placed.filter((row) => row.place?.missing) : placed })
  }))
  // Keep, Dismiss or back to new for several at once: each with the revision she saw; one that
  // changed since is left as it is and named, the rest are saved.
  router.post('/items/bulk', handler(async (req, res) => {
    const { items: chosen = [], status } = req.body ?? {}
    if (!['new', 'kept', 'dismissed'].includes(status)) throw new MailError(400, 'Say new, kept or dismissed')
    if (!Array.isArray(chosen) || !chosen.length || chosen.length > 500) throw new MailError(400, 'Choose between 1 and 500 items')
    if (!chosen.every((entry) => entry?.id && Number.isInteger(Number(entry.revision)))) throw new MailError(400, 'Send each item with the revision you last saw')
    const saved = []
    const changed = []
    for (const entry of chosen) {
      try { saved.push(await repository.patchHers('items', String(entry?.id ?? ''), Number(entry?.revision), { status })) }
      catch (error) { if (error.status === 409 || error.status === 404) changed.push(String(entry?.id ?? '')); else throw error }
    }
    res.json({ saved: saved.length, changed })
  }))
  // The Harvest log: the days, one day with its items placed, and the sources as last read.
  router.get('/days', handler(async (_req, res) => res.json({ days: await reads.days(), lastBatch: await repository.lastBatch() })))
  router.get('/days/:day', handler(async (req, res) => {
    const found = await reads.day(req.params.day)
    if (!found) throw new MailError(400, 'A day is written YYYY-MM-DD')
    res.json({ ...found, items: await places(found.items), latestBatchId: (await repository.lastBatch())?.id ?? null })
  }))
  router.get('/sources', handler(async (_req, res) => res.json({ sources: await reads.sources(), lastGathered: await reads.lastGathered() })))
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
