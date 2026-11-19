const express = require('express')
const crypto = require('crypto')
const { repository } = require('../db/repository')
const { AppError } = require('../errors/app-error')
const { validateTaskBody, statuses, priorities } = require('../lib/validation')
const { requireAuth } = require('../middleware/auth')

function createTaskRouter({ jwtSecret, repository: taskRepository = repository } = {}) {
  const router = express.Router()
  router.use(requireAuth({ jwtSecret }))

  router.get('/stats', async (req, res, next) => {
    try {
      res.json(await taskRepository.personalTaskStats(req.userId))
    } catch (error) { next(error) }
  })

  router.get('/', async (req, res, next) => {
    try {
      if (req.query.status && req.query.status !== 'All' && !statuses.includes(req.query.status)) throw new AppError('Invalid status filter', 400, 'VALIDATION_ERROR')
      if (req.query.priority && req.query.priority !== 'All' && !priorities.includes(req.query.priority)) throw new AppError('Invalid priority filter', 400, 'VALIDATION_ERROR')
      const sort = req.query.sort || 'createdAt'
      if (!['createdAt', 'dueDate', 'priority'].includes(sort)) throw new AppError('Invalid sort option', 400, 'VALIDATION_ERROR')
      const tasks = await taskRepository.personalTasks(req.userId, {
        status: req.query.status,
        priority: req.query.priority,
        search: String(req.query.search || '').slice(0, 100),
        sort,
        direction: req.query.direction,
      })
      res.json({ tasks })
    } catch (error) { next(error) }
  })

  router.post('/', async (req, res, next) => {
    try {
      const fields = validateTaskBody(req.body)
      const task = await taskRepository.createTask(fields, null, req.userId)
      res.status(201).json({ task })
    } catch (error) { next(error) }
  })

  router.get('/:id', async (req, res, next) => {
    try {
      if (!crypto.randomUUID && !/^[a-f\d]{24}$/i.test(req.params.id)) throw new AppError('Task not found', 404, 'NOT_FOUND')
      const task = await taskRepository.findTask(req.params.id)
      if (!task || String(task.owner) !== req.userId) throw new AppError('Task not found', 404, 'NOT_FOUND')
      res.json({ task })
    } catch (error) { next(error) }
  })

  router.patch('/:id', async (req, res, next) => {
    try {
      const existing = await taskRepository.findTask(req.params.id)
      if (!existing || String(existing.owner) !== req.userId) throw new AppError('Task not found', 404, 'NOT_FOUND')
      const fields = validateTaskBody(req.body, true)
      const task = await taskRepository.updateTask(req.params.id, null, fields)
      res.json({ task })
    } catch (error) { next(error) }
  })

  router.delete('/:id', async (req, res, next) => {
    try {
      const existing = await taskRepository.findTask(req.params.id)
      if (!existing || String(existing.owner) !== req.userId) throw new AppError('Task not found', 404, 'NOT_FOUND')
      await taskRepository.deleteTask(req.params.id)
      res.status(204).end()
    } catch (error) { next(error) }
  })

  return router
}

module.exports = createTaskRouter
