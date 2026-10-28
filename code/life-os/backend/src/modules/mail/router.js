import { Router } from 'express'
import { MailError } from './repository.js'

// /api/mail. inbox is hosting/mail/inbox.mjs (status, scan); importer undoes batches.
export function createMailRouter({ repository, importer, inbox }) {
  if (!repository || !importer || !inbox) throw new TypeError('The mail router needs a repository, an importer and an inbox')
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
  router.get('/status', handler(async (_req, res) => res.json({ ...(await inbox.status()), lastBatch: await repository.lastBatch(), counts: await repository.counts() })))
  router.post('/scan', handler(async (_req, res) => res.json(await inbox.scan())))
  router.get('/batches', handler(async (_req, res) => res.json(await repository.batches())))
  router.post('/batches/:id/undo', handler(async (req, res) => res.json(await importer.undo(req.params.id))))
  router.use((_req, res) => res.status(404).json({ error: 'Mail endpoint was not found' }))
  return router
}
