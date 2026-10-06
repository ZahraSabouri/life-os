import { Router } from 'express'
import { StudyError, STUDY_ENTITIES } from './schema.js'

export function createStudyRouter({ repository, imports = {} } = {}) {
  if (!repository) throw new TypeError('Study router requires a repository')
  const router = Router()
  const handler = (callback) => async (req, res, next) => {
    try {
      await callback(req, res)
    } catch (error) {
      if (error instanceof StudyError || (Number.isInteger(error.status) && error.status >= 400 && error.status < 500)) {
        return res.status(error.status).json({ error: error.message, ...(error.details === undefined ? {} : { details: error.details }) })
      }
      if (['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '57P01', '57P03', '57014', '53300', '42P01', '3F000', '28P01'].includes(error.code)) return res.status(503).json({ error: 'Study storage is unavailable. Try again after the local server is ready.' })
      next(error)
    }
  }

  router.get('/workspace', handler(async (_req, res) => res.json(await repository.workspace())))
  router.get('/export', handler(async (_req, res) => {
    res.set('Content-Disposition', 'attachment; filename="life-os-study.json"')
    res.json(await repository.exportWorkspace())
  }))
  router.post('/imports/:format/:action', handler(async (req, res) => {
    const { format, action } = req.params
    if (!['preview', 'apply'].includes(action) || !Object.hasOwn(imports, format) || typeof imports[format]?.[action] !== 'function') throw new StudyError(404, 'This Study import format is unavailable')
    res.json(await imports[format][action](req.body ?? {}, { repository, req }))
  }))
  for (const entity of STUDY_ENTITIES) {
    router.post(`/${entity}`, handler(async (req, res) => res.status(201).json(await repository.create(entity, req.body))))
    router.patch(`/${entity}/:id`, handler(async (req, res) => res.json(await repository.patch(entity, req.params.id, req.body))))
    router.delete(`/${entity}/:id`, handler(async (req, res) => {
      const body = req.body ?? {}
      if (Object.keys(body).some((key) => key !== 'revision')) throw new StudyError(400, 'Delete accepts only the current revision')
      res.json(await repository.remove(entity, req.params.id, body.revision))
    }))
  }
  router.use((_req, res) => res.status(404).json({ error: 'Study endpoint was not found' }))
  return router
}
