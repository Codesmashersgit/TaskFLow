const { AppError } = require('../errors/app-error')

const statuses = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done']
const priorities = ['Low', 'Medium', 'High']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function invalid(message) {
  throw new AppError(message, 400, 'VALIDATION_ERROR')
}

function validateAuthBody(body, registering) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('Request body must be an object')
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!emailPattern.test(email) || email.length > 254) invalid('Enter a valid email address')
  if ([...password].length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    invalid('Password must be at least 8 characters and no more than 72 bytes')
  }
  if (!registering) return { email, password }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 80) invalid('Name is required and must be 80 characters or fewer')
  return { name, email, password }
}

function validateTaskBody(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('Request body must be an object')
  const task = {}
  if (!partial || Object.hasOwn(body, 'title')) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 120) {
      invalid('Title is required and must be 120 characters or fewer')
    }
    task.title = body.title.trim()
  }
  if (Object.hasOwn(body, 'description')) {
    if (typeof body.description !== 'string' || body.description.length > 2000) invalid('Description must be 2000 characters or fewer')
    task.description = body.description.trim()
  }
  if (Object.hasOwn(body, 'status')) {
    if (!statuses.includes(body.status)) invalid('Status must be Backlog, Todo, In Progress, In Review, or Done')
    task.status = body.status
  }
  if (Object.hasOwn(body, 'priority')) {
    if (!priorities.includes(body.priority)) invalid('Priority must be Low, Medium, or High')
    task.priority = body.priority
  }
  if (Object.hasOwn(body, 'dueDate')) {
    if (body.dueDate === null || body.dueDate === '') task.dueDate = null
    else if (typeof body.dueDate !== 'string' || !Number.isFinite(Date.parse(body.dueDate))) invalid('Due date must be a valid date')
    else task.dueDate = new Date(body.dueDate)
  }
  if (Object.hasOwn(body, 'assignee')) {
    if (body.assignee === null || body.assignee === '') task.assignee = null
    else if (typeof body.assignee !== 'string' || !/^[a-f\d]{24}$/i.test(body.assignee)) invalid('Assignee must be a valid user ID')
    else task.assignee = body.assignee
  }
  if (Object.hasOwn(body, 'parentTask')) {
    if (body.parentTask === null || body.parentTask === '') task.parentTask = null
    else if (typeof body.parentTask !== 'string' || !/^[a-f\d]{24}$/i.test(body.parentTask)) invalid('Parent task must be a valid task ID')
    else task.parentTask = body.parentTask
  }
  if (Object.hasOwn(body, 'labels')) {
    if (!Array.isArray(body.labels) || body.labels.length > 10 || body.labels.some((label) => typeof label !== 'string' || !label.trim() || label.trim().length > 32)) {
      invalid('Labels must be up to 10 non-empty values of 32 characters or fewer')
    }
    task.labels = [...new Set(body.labels.map((label) => label.trim()))]
  }
  if (Object.hasOwn(body, 'checklist')) {
    if (!Array.isArray(body.checklist) || body.checklist.length > 30 || body.checklist.some((item) => (
      !item || typeof item.text !== 'string' || !item.text.trim() || item.text.trim().length > 240 || (item.done !== undefined && typeof item.done !== 'boolean')
    ))) invalid('Checklist must contain up to 30 valid items')
    task.checklist = body.checklist.map((item) => ({ text: item.text.trim(), done: Boolean(item.done) }))
  }
  if (partial && Object.keys(task).length === 0) invalid('Provide at least one task field to update')
  return task
}

function validateProjectBody(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('Request body must be an object')
  const project = {}
  if (!partial || Object.hasOwn(body, 'name')) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 80) invalid('Project name is required and must be 80 characters or fewer')
    project.name = body.name.trim()
  }
  if (Object.hasOwn(body, 'description')) {
    if (typeof body.description !== 'string' || body.description.length > 1000) invalid('Project description must be 1000 characters or fewer')
    project.description = body.description.trim()
  }
  if (Object.hasOwn(body, 'priority')) {
    if (!priorities.includes(body.priority)) invalid('Priority must be Low, Medium, or High')
    project.priority = body.priority
  }
  if (Object.hasOwn(body, 'dueDate')) {
    if (body.dueDate === null || body.dueDate === '') project.dueDate = null
    else if (typeof body.dueDate !== 'string' || !Number.isFinite(Date.parse(body.dueDate))) invalid('Due date must be a valid date')
    else project.dueDate = new Date(body.dueDate)
  }
  if (Object.hasOwn(body, 'color')) {
    if (!['violet', 'blue', 'green', 'orange'].includes(body.color)) invalid('Project color is invalid')
    project.color = body.color
  }
  if (Object.hasOwn(body, 'status')) {
    if (!['active', 'archived'].includes(body.status)) invalid('Project status must be active or archived')
    project.status = body.status
  }
  if (partial && Object.keys(project).length === 0) invalid('Provide at least one project field to update')
  return project
}

function validateCommentBody(body) {
  if (!body || typeof body.body !== 'string' || !body.body.trim() || body.body.trim().length > 2000) invalid('Comment is required and must be 2000 characters or fewer')
  return body.body.trim()
}

module.exports = { validateAuthBody, validateTaskBody, validateProjectBody, validateCommentBody, statuses, priorities }
