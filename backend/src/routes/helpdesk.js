const express = require('express')
const { getHelpdeskTickets, updateHelpdeskTicketStatus, resetHelpdeskTickets } = require('../data/mockHelpdeskTickets')
const { AppError } = require('../errors/app-error')

function createHelpdeskRouter() {
  const router = express.Router()

  // GET /api/helpdesk/tickets - Mock Helpdesk REST API
  router.get('/tickets', (req, res, next) => {
    try {
      // Allow testing error handling via query param
      if (req.query.simulateError === 'true' || req.query.simulateError === 'helpdesk') {
        throw new AppError('Mock Helpdesk REST API: Gateway timeout 504 (Origin server unreachable)', 504, 'HELPDESK_GATEWAY_TIMEOUT')
      }

      let tickets = getHelpdeskTickets()

      if (req.query.employeeId) {
        tickets = tickets.filter((t) => t.employee?.id === req.query.employeeId)
      }
      if (req.query.status) {
        tickets = tickets.filter((t) => t.status.toLowerCase() === req.query.status.toLowerCase())
      }

      res.json({
        success: true,
        source: 'Helpdesk Mock REST API',
        timestamp: new Date().toISOString(),
        count: tickets.length,
        tickets,
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/helpdesk/tickets/:id
  router.get('/tickets/:id', (req, res, next) => {
    try {
      const ticket = getHelpdeskTickets().find((t) => t.id === req.params.id)
      if (!ticket) {
        throw new AppError(`Helpdesk Ticket ${req.params.id} not found`, 404, 'NOT_FOUND')
      }
      res.json({ success: true, ticket })
    } catch (error) {
      next(error)
    }
  })

  // PATCH /api/helpdesk/tickets/:id/status
  router.patch('/tickets/:id/status', (req, res, next) => {
    try {
      const { status } = req.body
      if (!status) {
        throw new AppError('Status is required', 400, 'VALIDATION_ERROR')
      }
      const updated = updateHelpdeskTicketStatus(req.params.id, status)
      if (!updated) {
        throw new AppError(`Helpdesk Ticket ${req.params.id} not found`, 404, 'NOT_FOUND')
      }
      res.json({ success: true, ticket: updated })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/helpdesk/reset
  router.post('/reset', (_req, res) => {
    resetHelpdeskTickets()
    res.json({ success: true, message: 'Helpdesk mock tickets reset to initial state' })
  })

  return router
}

module.exports = createHelpdeskRouter
