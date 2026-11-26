const express = require('express')
const { getCrmTasks, updateCrmTaskStatus, resetCrmTasks } = require('../data/mockCrmTasks')
const { AppError } = require('../errors/app-error')

function createCrmRouter() {
  const router = express.Router()

  // GET /api/crm/tasks - Mock CRM REST API
  router.get('/tasks', (req, res, next) => {
    try {
      // Allow testing error handling via query param
      if (req.query.simulateError === 'true' || req.query.simulateError === 'crm') {
        throw new AppError('Mock CRM REST API: Service connection timed out (503)', 503, 'CRM_SERVICE_UNAVAILABLE')
      }

      let tasks = getCrmTasks()

      // Optional filters
      if (req.query.employeeId) {
        tasks = tasks.filter((t) => t.employee?.id === req.query.employeeId)
      }
      if (req.query.status) {
        tasks = tasks.filter((t) => t.status.toLowerCase() === req.query.status.toLowerCase())
      }

      res.json({
        success: true,
        source: 'CRM Mock REST API',
        timestamp: new Date().toISOString(),
        count: tasks.length,
        tasks,
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/crm/tasks/:id
  router.get('/tasks/:id', (req, res, next) => {
    try {
      const task = getCrmTasks().find((t) => t.id === req.params.id)
      if (!task) {
        throw new AppError(`CRM Task ${req.params.id} not found`, 404, 'NOT_FOUND')
      }
      res.json({ success: true, task })
    } catch (error) {
      next(error)
    }
  })

  // PATCH /api/crm/tasks/:id/status
  router.patch('/tasks/:id/status', (req, res, next) => {
    try {
      const { status } = req.body
      if (!status) {
        throw new AppError('Status is required', 400, 'VALIDATION_ERROR')
      }
      const updated = updateCrmTaskStatus(req.params.id, status)
      if (!updated) {
        throw new AppError(`CRM Task ${req.params.id} not found`, 404, 'NOT_FOUND')
      }
      res.json({ success: true, task: updated })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/crm/reset
  router.post('/reset', (_req, res) => {
    resetCrmTasks()
    res.json({ success: true, message: 'CRM mock tasks reset to initial state' })
  })

  return router
}

module.exports = createCrmRouter
