const express = require('express')
const mongoose = require('mongoose')
const Task = require('../models/task')
const { AppError } = require('../errors/app-error')
const { validateTaskBody, statuses, priorities } = require('../lib/validation')
const { requireAuth } = require('../middleware/auth')

function createTaskRouter({ jwtSecret, TaskModel = Task } = {}) {
  const router = express.Router()
  router.use(requireAuth({ jwtSecret }))

  router.get('/stats', async (req, res, next) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const [total, completed, inProgress, overdue] = await Promise.all([
        TaskModel.countDocuments({ owner: req.userId }),
        TaskModel.countDocuments({ owner: req.userId, status: 'Done' }),
        TaskModel.countDocuments({ owner: req.userId, status: 'In Progress' }),
        TaskModel.countDocuments({ owner: req.userId, status: { $ne: 'Done' }, dueDate: { $lt: today } }),
      ])
      res.json({ total, completed, inProgress, pending: total - completed - inProgress, overdue })
    } catch (error) {
      next(error)
    }
  })

  router.get('/', async (req, res, next) => {
    try {
      const query = { owner: req.userId }
      if (req.query.status && req.query.status !== 'All') {
        if (!statuses.includes(req.query.status)) throw new AppError('Invalid status filter', 400, 'VALIDATION_ERROR')
        query.status = req.query.status
      }
      if (req.query.priority && req.query.priority !== 'All') {
        if (!priorities.includes(req.query.priority)) throw new AppError('Invalid priority filter', 400, 'VALIDATION_ERROR')
        query.priority = req.query.priority
      }
      if (req.query.search) {
        const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        query.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }]
      }
      const sort = req.query.sort || 'createdAt'
      if (!['createdAt', 'dueDate', 'priority'].includes(sort)) throw new AppError('Invalid sort option', 400, 'VALIDATION_ERROR')
      const direction = req.query.direction === 'asc' ? 1 : -1
      const tasks = await TaskModel.find(query).sort(sort === 'priority' ? { createdAt: -1 } : { [sort]: direction }).lean()
      if (sort === 'priority') {
        const rank = { High: 0, Medium: 1, Low: 2 }
        tasks.sort((a, b) => direction * (rank[a.priority] - rank[b.priority]))
      }
      res.json({ tasks })
    } catch (error) {
      next(error)
    }
  })

  router.post('/', async (req, res, next) => {
    try {
      const task = await TaskModel.create({ ...validateTaskBody(req.body), owner: req.userId })
      res.status(201).json({ task })
    } catch (error) {
      next(error)
    }
  })

  router.get('/:id', async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Task not found', 404, 'NOT_FOUND')
      const task = await TaskModel.findOne({ _id: req.params.id, owner: req.userId })
      if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND')
      res.json({ task })
    } catch (error) {
      next(error)
    }
  })

  router.patch('/:id', async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Task not found', 404, 'NOT_FOUND')
      const task = await TaskModel.findOneAndUpdate(
        { _id: req.params.id, owner: req.userId },
        { $set: validateTaskBody(req.body, true) },
        { returnDocument: 'after', runValidators: true },
      )
      if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND')
      res.json({ task })
    } catch (error) {
      next(error)
    }
  })

  router.delete('/:id', async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Task not found', 404, 'NOT_FOUND')
      const task = await TaskModel.findOneAndDelete({ _id: req.params.id, owner: req.userId })
      if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND')
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  })

  return router
}

module.exports = createTaskRouter
