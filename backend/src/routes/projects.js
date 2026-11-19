const express = require('express')
const crypto = require('crypto')
const { repository } = require('../db/repository')
const { getPool } = require('../db/connect')
const { AppError } = require('../errors/app-error')
const { requireAuth } = require('../middleware/auth')
const { validateProjectBody, validateTaskBody, validateCommentBody, statuses, priorities } = require('../lib/validation')

function createProjectRouter({ jwtSecret, repository: projectRepository = repository, database } = {}) {
  const router = express.Router()
  router.use(requireAuth({ jwtSecret }))

  async function getProject(projectId, userId) {
    if (!crypto.randomUUID && !/^[a-f\d]{24}$/i.test(projectId)) throw new AppError('Project not found', 404, 'NOT_FOUND')
    const project = await projectRepository.findProject(projectId, userId)
    if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND')
    return project
  }

  function requireOwner(project, userId) {
    if (String(project.owner._id || project.owner) !== String(userId)) throw new AppError('Only the project owner can manage members or project settings', 403, 'FORBIDDEN')
  }

  function requireActive(project) {
    if (project.status !== 'active') throw new AppError('Archived projects are read-only. Restore the project to make changes.', 409, 'PROJECT_ARCHIVED')
  }

  async function requireAdmin(userId) {
    const user = await projectRepository.findUserById(userId)
    if (!user || user.role !== 'admin' || user.status !== 'active') throw new AppError('Admin access is required', 403, 'FORBIDDEN')
  }

  router.get('/', async (req, res, next) => {
    try { res.json({ projects: await projectRepository.findProjectsForUser(req.userId, req.query.status === 'archived' ? 'archived' : 'active') }) } catch (error) { next(error) }
  })

  router.post('/', async (req, res, next) => {
    try { await requireAdmin(req.userId); res.status(201).json({ project: await projectRepository.createProject(validateProjectBody(req.body), req.userId) }) } catch (error) { next(error) }
  })

  router.get('/stats', async (req, res, next) => {
    try { res.json(await projectRepository.projectStats(req.userId)) } catch (error) { next(error) }
  })

  router.get('/:projectId', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      const tasks = await getPool().query(`SELECT COUNT(*)::int total,COUNT(*) FILTER (WHERE status='Done')::int completed,
        COUNT(*) FILTER (WHERE status='In Progress')::int "inProgress",
        COUNT(*) FILTER (WHERE status<> 'Done' AND due_date < date_trunc('day',NOW()))::int overdue,
        COUNT(*) FILTER (WHERE assignee_id=$1)::int assigned FROM tasks WHERE project_id=$2`, [req.userId, project.id])
      const row = tasks.rows[0]
      res.json({ project, stats: { ...row, pending: row.total - row.completed - row.inProgress } })
    } catch (error) { next(error) }
  })

  router.patch('/:projectId', async (req, res, next) => {
    try {
      await requireAdmin(req.userId)
      const project = await getProject(req.params.projectId, req.userId)
      requireOwner(project, req.userId)
      const fields = validateProjectBody(req.body, true)
      if (project.status === 'archived' && fields.status !== 'active') requireActive(project)
      res.json({ project: await projectRepository.updateProject(project.id, req.userId, fields) })
    } catch (error) { next(error) }
  })

  router.delete('/:projectId', async (req, res, next) => {
    try {
      await requireAdmin(req.userId)
      const project = await getProject(req.params.projectId, req.userId)
      requireOwner(project, req.userId)
      requireActive(project)
      await projectRepository.archiveProject(project.id)
      res.json({ project: await projectRepository.findProject(project.id, req.userId) })
    } catch (error) { next(error) }
  })

  router.post('/:projectId/members', async (req, res, next) => {
    try {
      await requireAdmin(req.userId)
      const project = await getProject(req.params.projectId, req.userId)
      requireOwner(project, req.userId)
      requireActive(project)
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Enter a valid member email', 400, 'VALIDATION_ERROR')
      const user = await projectRepository.findUserByEmail(email)
      if (!user) throw new AppError('That person needs an account before they can join a project', 404, 'USER_NOT_FOUND')
      if (project.members.some((member) => String(member.user._id || member.user) === user.id)) throw new AppError('This person is already a project member', 409, 'ALREADY_MEMBER')
      await projectRepository.addProjectMember(project.id, user.id)
      await projectRepository.createNotification({ userId: user.id, actorId: req.userId, projectId: project.id, message: `You were added to ${project.name}` })
      res.status(201).json({ members: (await projectRepository.findProject(project.id, req.userId)).members })
    } catch (error) { next(error) }
  })

  router.delete('/:projectId/members/:memberId', async (req, res, next) => {
    try {
      await requireAdmin(req.userId)
      const project = await getProject(req.params.projectId, req.userId)
      requireOwner(project, req.userId)
      requireActive(project)
      if (String(project.owner._id || project.owner) === req.params.memberId) throw new AppError('The project owner cannot be removed', 400, 'VALIDATION_ERROR')
      await projectRepository.removeProjectMember(project.id, req.params.memberId)
      await getPool().query('UPDATE tasks SET assignee_id=NULL,updated_at=NOW() WHERE project_id=$1 AND assignee_id=$2', [project.id, req.params.memberId])
      res.status(204).end()
    } catch (error) { next(error) }
  })

  router.get('/:projectId/tasks', async (req, res, next) => {
    try {
      await getProject(req.params.projectId, req.userId)
      if (req.query.status && req.query.status !== 'All' && !statuses.includes(req.query.status)) throw new AppError('Invalid status filter', 400, 'VALIDATION_ERROR')
      if (req.query.priority && req.query.priority !== 'All' && !priorities.includes(req.query.priority)) throw new AppError('Invalid priority filter', 400, 'VALIDATION_ERROR')
      const sort = req.query.sort || 'createdAt'
      if (!['createdAt','dueDate','priority','updatedAt'].includes(sort)) throw new AppError('Invalid sort option', 400, 'VALIDATION_ERROR')
      res.json({ tasks: await projectRepository.projectTasks(req.params.projectId, {
        status:req.query.status, priority:req.query.priority, assignee:req.query.assignee,
        search:String(req.query.search || '').slice(0,100), sort, direction:req.query.direction,
      }) })
    } catch (error) { next(error) }
  })

  router.post('/:projectId/tasks', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireActive(project)
      const fields = validateTaskBody(req.body)
      if (fields.assignee) {
        if (!project.members.some((member) => String(member.user._id || member.user) === fields.assignee)) throw new AppError('Assignee must be a member of this project', 400, 'INVALID_ASSIGNEE')
      }
      if (fields.parentTask) {
        const parent = await getPool().query('SELECT id FROM tasks WHERE id=$1 AND project_id=$2 AND parent_task_id IS NULL', [fields.parentTask, project.id])
        if (!parent.rows.length) throw new AppError('Subtasks must belong to a top-level task in this project', 400, 'INVALID_PARENT_TASK')
      }
      const task = await projectRepository.createTask(fields, project.id, req.userId)
      if (fields.assignee && fields.assignee !== req.userId) await projectRepository.createNotification({ userId: fields.assignee, actorId: req.userId, projectId: project.id, taskId: task.id, message: `You were assigned "${task.title}"` })
      res.status(201).json({ task })
    } catch (error) { next(error) }
  })

  router.get('/:projectId/tasks/:taskId', async (req, res, next) => {
    try {
      await getProject(req.params.projectId, req.userId)
      const task = await projectRepository.findTask(req.params.taskId, req.params.projectId)
      if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND')
      const subtasks = await getPool().query('SELECT id FROM tasks WHERE parent_task_id=$1 AND project_id=$2', [task.id, req.params.projectId])
      task.subtasks = subtasks.rows.map((row) => ({ _id: row.id, id: row.id }))
      res.json({ task })
    } catch (error) { next(error) }
  })

  router.patch('/:projectId/tasks/:taskId', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireActive(project)
      const existing = await projectRepository.findTask(req.params.taskId, project.id)
      if (!existing) throw new AppError('Task not found', 404, 'NOT_FOUND')
      const fields = validateTaskBody(req.body, true)
      if (Object.hasOwn(fields, 'assignee') && fields.assignee && !project.members.some((member) => String(member.user._id || member.user) === fields.assignee)) throw new AppError('Assignee must be a member of this project', 400, 'INVALID_ASSIGNEE')
      if (fields.parentTask) {
        if (fields.parentTask === existing.id) throw new AppError('Subtasks must belong to a different top-level task in this project', 400, 'INVALID_PARENT_TASK')
        const parent = await getPool().query('SELECT id FROM tasks WHERE id=$1 AND project_id=$2 AND parent_task_id IS NULL', [fields.parentTask, project.id])
        if (!parent.rows.length) throw new AppError('Subtasks must belong to a different top-level task in this project', 400, 'INVALID_PARENT_TASK')
      }
      const task = await projectRepository.updateTask(existing.id, project.id, fields)
      const previousAssignee = String(existing.assignee?._id || existing.assignee || '')
      if (fields.assignee && fields.assignee !== previousAssignee && fields.assignee !== req.userId) await projectRepository.createNotification({ userId: fields.assignee, actorId: req.userId, projectId: project.id, taskId: task.id, message: `You were assigned "${task.title}"` })
      res.json({ task })
    } catch (error) { next(error) }
  })

  router.delete('/:projectId/tasks/:taskId', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireActive(project)
      if (!await projectRepository.findTask(req.params.taskId, project.id)) throw new AppError('Task not found', 404, 'NOT_FOUND')
      await projectRepository.deleteTask(req.params.taskId, project.id)
      res.status(204).end()
    } catch (error) { next(error) }
  })

  router.post('/:projectId/tasks/:taskId/duplicate', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireActive(project)
      const source = await projectRepository.findTask(req.params.taskId, project.id)
      if (!source) throw new AppError('Task not found', 404, 'NOT_FOUND')
      const task = await projectRepository.createTask({
        title:`${source.title} (copy)`, description:source.description, status:'Todo', priority:source.priority,
        dueDate:source.dueDate, assignee:null, parentTask:null, labels:source.labels,
        checklist:(source.checklist||[]).map((item)=>({text:item.text,done:false})),
      }, project.id, req.userId)
      res.status(201).json({ task })
    } catch (error) { next(error) }
  })

  router.post('/:projectId/tasks/:taskId/comments', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireActive(project)
      const task = await projectRepository.findTask(req.params.taskId, project.id)
      if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND')
      const user = await projectRepository.findUserById(req.userId)
      const body = validateCommentBody(req.body)
      const result = await projectRepository.addComment(task.id, project.id, req.userId, user.name, body)
      res.status(201).json(result)
    } catch (error) { next(error) }
  })

  return router
}

module.exports = createProjectRouter
