const express = require('express')
const { getCrmTasks, updateCrmTaskStatus, resetCrmTasks } = require('../data/mockCrmTasks')
const { getHelpdeskTickets, updateHelpdeskTicketStatus, resetHelpdeskTickets } = require('../data/mockHelpdeskTickets')
const { calculatePriority } = require('../lib/prioritization')
const { AppError } = require('../errors/app-error')

function normalizeCrmTask(task) {
  const priority = calculatePriority(task)
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    source: 'CRM',
    sourceUrl: task.sourceUrl,
    sourceBadgeColor: 'blue',
    customerOrRequester: task.customer,
    dealOrCategory: task.dealValue,
    metadataLabel: 'Deal Value',
    metadataValue: task.dealValue,
    employee: task.employee,
    rawStatus: task.status,
    status: task.status === 'Completed' ? 'Completed' : task.status === 'In Progress' ? 'In Progress' : 'Pending',
    displayStatus: task.status,
    urgency: task.urgency,
    deadline: task.deadline,
    createdAt: task.createdAt,
    priority,
  }
}

function normalizeHelpdeskTicket(ticket) {
  const priority = calculatePriority(ticket)
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    source: 'Helpdesk',
    sourceUrl: ticket.sourceUrl,
    sourceBadgeColor: 'amber',
    customerOrRequester: ticket.requester,
    dealOrCategory: ticket.category,
    metadataLabel: 'Category',
    metadataValue: ticket.category,
    employee: ticket.employee,
    rawStatus: ticket.status,
    status: ticket.status === 'Resolved' ? 'Completed' : ticket.status === 'In Progress' ? 'In Progress' : 'Pending',
    displayStatus: ticket.status, // 'Open', 'In Progress', 'Resolved'
    urgency: ticket.urgency,
    deadline: ticket.deadline,
    createdAt: ticket.createdAt,
    priority,
  }
}

function createDashboardRouter() {
  const router = express.Router()

  // GET /api/dashboard/tasks - Aggregated, prioritized tasks from CRM & Helpdesk
  router.get('/tasks', async (req, res, next) => {
    try {
      const simulateError = req.query.simulateError // 'crm' | 'helpdesk' | 'both' | 'true'

      const apiHealth = {
        crm: { ok: true, error: null },
        helpdesk: { ok: true, error: null },
      }

      let crmRaw = []
      let helpdeskRaw = []

      // Fetch from CRM Mock REST API
      try {
        if (simulateError === 'crm' || simulateError === 'both' || simulateError === 'all') {
          throw new Error('CRM REST API service unavailable (simulated 503 error)')
        }
        crmRaw = getCrmTasks()
      } catch (err) {
        apiHealth.crm.ok = false
        apiHealth.crm.error = err.message
      }

      // Fetch from Helpdesk Mock REST API
      try {
        if (simulateError === 'helpdesk' || simulateError === 'both' || simulateError === 'all') {
          throw new Error('Helpdesk REST API gateway timeout (simulated 504 error)')
        }
        helpdeskRaw = getHelpdeskTickets()
      } catch (err) {
        apiHealth.helpdesk.ok = false
        apiHealth.helpdesk.error = err.message
      }

      // If both failed, return a 502 Bad Gateway with diagnostic error details
      if (!apiHealth.crm.ok && !apiHealth.helpdesk.ok) {
        return res.status(502).json({
          success: false,
          message: 'Both upstream mock REST APIs (CRM & Helpdesk) failed to respond.',
          apiHealth,
          tasks: [],
        })
      }

      // Normalize tasks from both sources
      const normalizedCrm = crmRaw.map(normalizeCrmTask)
      const normalizedHelpdesk = helpdeskRaw.map(normalizeHelpdeskTicket)

      let allTasks = [...normalizedCrm, ...normalizedHelpdesk]

      // Extract unique employees for filter options
      const employeeMap = new Map()
      allTasks.forEach((t) => {
        if (t.employee && t.employee.id) {
          if (!employeeMap.has(t.employee.id)) {
            employeeMap.set(t.employee.id, {
              ...t.employee,
              taskCount: 0,
            })
          }
          employeeMap.get(t.employee.id).taskCount += 1
        }
      })
      const employees = Array.from(employeeMap.values())

      // 1. Employee Filter
      if (req.query.employee && req.query.employee !== 'All') {
        allTasks = allTasks.filter(
          (t) =>
            t.employee?.id === req.query.employee ||
            t.employee?.name?.toLowerCase() === req.query.employee.toLowerCase()
        )
      }

      // 2. Status Filter
      if (req.query.status && req.query.status !== 'All') {
        const targetStatus = req.query.status.toLowerCase()
        allTasks = allTasks.filter((t) => {
          return (
            t.status.toLowerCase() === targetStatus ||
            t.rawStatus.toLowerCase() === targetStatus
          )
        })
      }

      // 3. Source Filter
      if (req.query.source && req.query.source !== 'All') {
        allTasks = allTasks.filter(
          (t) => t.source.toLowerCase() === req.query.source.toLowerCase()
        )
      }

      // 4. Urgency Filter
      if (req.query.urgency && req.query.urgency !== 'All') {
        allTasks = allTasks.filter(
          (t) => t.urgency.toLowerCase() === req.query.urgency.toLowerCase()
        )
      }

      // 5. Search Filter
      if (req.query.search) {
        const query = req.query.search.toLowerCase().trim()
        allTasks = allTasks.filter((t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.id.toLowerCase().includes(query) ||
          t.customerOrRequester?.toLowerCase().includes(query) ||
          t.employee?.name?.toLowerCase().includes(query)
        )
      }

      // 6. Sorting (Default: Smart Priority based on deadlines and urgency)
      const sortBy = req.query.sortBy || 'priority'
      allTasks.sort((a, b) => {
        if (sortBy === 'priority') {
          // Highest priority score first
          if (b.priority.score !== a.priority.score) {
            return b.priority.score - a.priority.score
          }
          // Tie-break: earliest deadline first
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        }
        if (sortBy === 'deadline') {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        }
        if (sortBy === 'urgency') {
          return b.priority.urgencyWeight - a.priority.urgencyWeight
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        return 0
      })

      // Calculate global summary stats
      const stats = {
        total: allTasks.length,
        crmCount: allTasks.filter((t) => t.source === 'CRM').length,
        helpdeskCount: allTasks.filter((t) => t.source === 'Helpdesk').length,
        urgentCount: allTasks.filter((t) => t.urgency === 'Urgent').length,
        overdueCount: allTasks.filter((t) => t.priority.isOverdue).length,
        dueTodayCount: allTasks.filter((t) => t.priority.isDueToday).length,
        pendingCount: allTasks.filter((t) => t.status === 'Pending').length,
        inProgressCount: allTasks.filter((t) => t.status === 'In Progress').length,
        completedCount: allTasks.filter((t) => t.status === 'Completed').length,
      }

      res.json({
        success: true,
        apiHealth,
        stats,
        employees,
        tasks: allTasks,
      })
    } catch (error) {
      next(error)
    }
  })

  // PATCH /api/dashboard/tasks/:id/status - Update task status in respective mock store
  router.patch('/tasks/:id/status', (req, res, next) => {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!status) {
        throw new AppError('Status is required', 400, 'VALIDATION_ERROR')
      }

      if (id.startsWith('CRM-')) {
        const crmStatus = status === 'Completed' ? 'Completed' : status === 'In Progress' ? 'In Progress' : 'Pending'
        const updated = updateCrmTaskStatus(id, crmStatus)
        if (!updated) throw new AppError(`CRM Task ${id} not found`, 404, 'NOT_FOUND')
        return res.json({ success: true, task: normalizeCrmTask(updated) })
      }

      if (id.startsWith('HD-')) {
        const hdStatus = status === 'Completed' ? 'Resolved' : status === 'In Progress' ? 'In Progress' : 'Open'
        const updated = updateHelpdeskTicketStatus(id, hdStatus)
        if (!updated) throw new AppError(`Helpdesk Ticket ${id} not found`, 404, 'NOT_FOUND')
        return res.json({ success: true, task: normalizeHelpdeskTicket(updated) })
      }

      throw new AppError(`Unknown task ID prefix for ${id}`, 400, 'INVALID_ID')
    } catch (error) {
      next(error)
    }
  })

  // POST /api/dashboard/reset - Reset both mock data stores to initial state
  router.post('/reset', (_req, res) => {
    resetCrmTasks()
    resetHelpdeskTickets()
    res.json({ success: true, message: 'All mock task data reset to initial values' })
  })

  return router
}

module.exports = createDashboardRouter
