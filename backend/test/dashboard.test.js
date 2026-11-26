const test = require('node:test')
const assert = require('node:assert/strict')
const { getCrmTasks, updateCrmTaskStatus } = require('../src/data/mockCrmTasks')
const { getHelpdeskTickets, updateHelpdeskTicketStatus } = require('../src/data/mockHelpdeskTickets')
const { calculatePriority } = require('../src/lib/prioritization')

test('CRM mock tasks return valid fields and clickable source links', () => {
  const tasks = getCrmTasks()
  assert.ok(tasks.length >= 6, 'Should have mock CRM tasks')
  for (const t of tasks) {
    assert.ok(t.id.startsWith('CRM-'))
    assert.ok(t.source === 'CRM')
    assert.ok(t.sourceUrl.includes('/crm/'))
    assert.ok(t.employee?.id)
    assert.ok(t.employee?.name)
    assert.ok(['Urgent', 'High', 'Medium', 'Low'].includes(t.urgency))
    assert.ok(t.deadline)
  }
})

test('Helpdesk mock tickets return valid fields and clickable source links', () => {
  const tickets = getHelpdeskTickets()
  assert.ok(tickets.length >= 6, 'Should have mock Helpdesk tickets')
  for (const t of tickets) {
    assert.ok(t.id.startsWith('HD-'))
    assert.ok(t.source === 'Helpdesk')
    assert.ok(t.sourceUrl.includes('/helpdesk/'))
    assert.ok(t.employee?.id)
    assert.ok(t.employee?.name)
    assert.ok(['Urgent', 'High', 'Medium', 'Low'].includes(t.urgency))
    assert.ok(t.deadline)
  }
})

test('Prioritization assigns higher scores to overdue and urgent tasks', () => {
  const overdueUrgent = calculatePriority({
    urgency: 'Urgent',
    deadline: new Date(Date.now() - 86400000).toISOString(),
    status: 'Pending',
  })
  assert.equal(overdueUrgent.level, 'P1 - Critical')
  assert.ok(overdueUrgent.score >= 170)
  assert.equal(overdueUrgent.isOverdue, true)

  const futureLow = calculatePriority({
    urgency: 'Low',
    deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
    status: 'Pending',
  })
  assert.equal(futureLow.level, 'P4 - Low')
  assert.ok(futureLow.score < 60)
  assert.ok(overdueUrgent.score > futureLow.score)
})

test('Task status updates reflect correctly in mock store', () => {
  const task = getCrmTasks()[0]
  const updated = updateCrmTaskStatus(task.id, 'Completed')
  assert.equal(updated.status, 'Completed')
})
