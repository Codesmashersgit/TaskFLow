const express = require('express')
const mongoose = require('mongoose')
const Project = require('../models/project')
const Task = require('../models/task')
const User = require('../models/user')
const Notification = require('../models/notification')
const { AppError } = require('../errors/app-error')
const { requireAuth } = require('../middleware/auth')
const { validateProjectBody, validateTaskBody, validateCommentBody, statuses, priorities } = require('../lib/validation')

function createProjectRouter({ jwtSecret, ProjectModel = Project, TaskModel = Task, UserModel = User, NotificationModel = Notification } = {}) {
  const router = express.Router()
  router.use(requireAuth({ jwtSecret }))

  async function getProject(projectId, userId) {
    if (!mongoose.isValidObjectId(projectId)) throw new AppError('Project not found', 404, 'NOT_FOUND')
    const project = await ProjectModel.findOne({ _id: projectId, 'members.user': userId })
    if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND')
    return project
  }

  function requireOwner(project, userId) {
    const isOwner = project.owner.toString() === userId.toString()
    if (!isOwner) throw new AppError('Only the project owner can manage members or project settings', 403, 'FORBIDDEN')
  }

  function requireActive(project) {
    if (project.status !== 'active') throw new AppError('Archived projects are read-only. Restore the project to make changes.', 409, 'PROJECT_ARCHIVED')
  }

  function addActivity(task, user, action, detail = '') {
    task.activity.push({ actor: user._id, actorName: user.name, action, detail })
  }

  async function checkAssignee(project, assigneeId) {
    if (!assigneeId) return null
    const isMember = project.members.some((member) => member.user.toString() === assigneeId.toString())
    if (!isMember) throw new AppError('Assignee must be a member of this project', 400, 'INVALID_ASSIGNEE')
    const assignee = await UserModel.findById(assigneeId).select('name')
    if (!assignee) throw new AppError('Assignee not found', 400, 'INVALID_ASSIGNEE')
    return assignee
  }

  async function notify(userId, notification) {
    const recipient = await UserModel.findById(userId).select('preferences')
    if (recipient?.preferences?.inAppNotifications === false) return
    await NotificationModel.create({ user: userId, ...notification })
  }

  router.get('/', async (req, res, next) => {
    try {
      const projects = await ProjectModel.find({ 'members.user': req.userId, status: req.query.status === 'archived' ? 'archived' : 'active' })
        .populate('owner', 'name email')
        .populate('members.user', 'name email')
        .sort({ updatedAt: -1 })
        .lean()
      const ids = projects.map((project) => project._id)
      const counts = await TaskModel.aggregate([
        { $match: { project: { $in: ids } } },
        { $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } },
      ])
      const summaries = new Map()
      for (const row of counts) {
        const key = row._id.project.toString()
        const summary = summaries.get(key) || { total: 0, completed: 0 }
        summary.total += row.count
        if (row._id.status === 'Done') summary.completed += row.count
        summaries.set(key, summary)
      }
      res.json({ projects: projects.map((project) => ({ ...project, stats: summaries.get(project._id.toString()) || { total: 0, completed: 0 } })) })
    } catch (error) {
      next(error)
    }
  })

  router.post('/', async (req, res, next) => {
    try {
      const project = await ProjectModel.create({
        ...validateProjectBody(req.body),
        owner: req.userId,
        members: [{ user: req.userId, role: 'owner' }],
      })
      res.status(201).json({ project })
    } catch (error) {
      next(error)
    }
  })

  router.get('/stats', async (req, res, next) => {
    try {
      const projects = await ProjectModel.find({ 'members.user': req.userId, status: 'active' }).select('_id').lean()
      const ids = projects.map((project) => project._id)
      const today = startOfToday()
      const [total, completed, inProgress, overdue, assigned] = await Promise.all([
        TaskModel.countDocuments({ project: { $in: ids } }),
        TaskModel.countDocuments({ project: { $in: ids }, status: 'Done' }),
        TaskModel.countDocuments({ project: { $in: ids }, status: { $in: ['In Progress', 'In Review'] } }),
        TaskModel.countDocuments({ project: { $in: ids }, status: { $ne: 'Done' }, dueDate: { $lt: today } }),
        TaskModel.countDocuments({ project: { $in: ids }, assignee: req.userId }),
      ])
      res.json({ total, completed, inProgress, pending: total - completed - inProgress, overdue, assigned, projectCount: ids.length })
    } catch (error) {
      next(error)
    }
  })

  router.get('/:projectId', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      await project.populate([{ path: 'owner', select: 'name email' }, { path: 'members.user', select: 'name email' }])
      const [total, completed, inProgress, overdue, assigned] = await Promise.all([
        TaskModel.countDocuments({ project: project._id }),
        TaskModel.countDocuments({ project: project._id, status: 'Done' }),
        TaskModel.countDocuments({ project: project._id, status: 'In Progress' }),
        TaskModel.countDocuments({ project: project._id, status: { $ne: 'Done' }, dueDate: { $lt: startOfToday() } }),
        TaskModel.countDocuments({ project: project._id, assignee: req.userId }),
      ])
      res.json({ project, stats: { total, completed, inProgress, pending: total - completed - inProgress, overdue, assigned } })
    } catch (error) {
      next(error)
    }
  })

  router.patch('/:projectId', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireOwner(project, req.userId)
      const fields = validateProjectBody(req.body, true)
      if (project.status === 'archived' && fields.status !== 'active') requireActive(project)
      Object.assign(project, fields)
      await project.save()
      res.json({ project })
    } catch (error) {
      next(error)
    }
  })

  router.delete('/:projectId', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireOwner(project, req.userId)
      requireActive(project)
      project.status = 'archived'
      await project.save()
      res.json({ project })
    } catch (error) {
      next(error)
    }
  })

  router.post('/:projectId/members', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireOwner(project, req.userId)
      requireActive(project)
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Enter a valid member email', 400, 'VALIDATION_ERROR')
      const user = await UserModel.findOne({ email }).select('name email')
      if (!user) throw new AppError('That person needs an account before they can join a project', 404, 'USER_NOT_FOUND')
      if (project.members.some((member) => member.user.toString() === user.id)) throw new AppError('This person is already a project member', 409, 'ALREADY_MEMBER')
      project.members.push({ user: user._id, role: 'member' })
      await project.save()
      await notify(user._id, { actor: req.userId, project: project._id, message: `You were added to ${project.name}` })
      await project.populate('members.user', 'name email')
      res.status(201).json({ members: project.members })
    } catch (error) {
      next(error)
    }
  })

  router.delete('/:projectId/members/:memberId', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireOwner(project, req.userId)
      requireActive(project)
      if (project.owner.toString() === req.params.memberId) throw new AppError('The project owner cannot be removed', 400, 'VALIDATION_ERROR')
      project.members = project.members.filter((member) => member.user.toString() !== req.params.memberId)
      await project.save()
      await TaskModel.updateMany({ project: project._id, assignee: req.params.memberId }, { $set: { assignee: null } })
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  })

  router.get('/:projectId/tasks', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      const query = { project: project._id }
      if (req.query.status && req.query.status !== 'All') {
        if (!statuses.includes(req.query.status)) throw new AppError('Invalid status filter', 400, 'VALIDATION_ERROR')
        query.status = req.query.status
      }
      if (req.query.priority && req.query.priority !== 'All') {
        if (!priorities.includes(req.query.priority)) throw new AppError('Invalid priority filter', 400, 'VALIDATION_ERROR')
        query.priority = req.query.priority
      }
      if (req.query.assignee && req.query.assignee !== 'All') query.assignee = req.query.assignee === 'unassigned' ? null : req.query.assignee
      if (req.query.search) {
        const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        query.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }, { labels: { $regex: search, $options: 'i' } }]
      }
      const sort = req.query.sort || 'createdAt'
      if (!['createdAt', 'dueDate', 'priority', 'updatedAt'].includes(sort)) throw new AppError('Invalid sort option', 400, 'VALIDATION_ERROR')
      const direction = req.query.direction === 'asc' ? 1 : -1
      let tasks = await TaskModel.find(query).populate('assignee', 'name email').sort(sort === 'priority' ? { createdAt: -1 } : { [sort]: direction }).lean()
      if (sort === 'priority') {
        const rank = { High: 0, Medium: 1, Low: 2 }
        tasks = tasks.sort((a, b) => direction * (rank[a.priority] - rank[b.priority]))
      }
      res.json({ tasks })
    } catch (error) {
      next(error)
    }
  })

  router.post('/:projectId/tasks', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireActive(project)
      const fields = validateTaskBody(req.body)
      await checkAssignee(project, fields.assignee)
      if (fields.parentTask && !await TaskModel.exists({ _id: fields.parentTask, project: project._id, parentTask: null })) {
        throw new AppError('Subtasks must belong to a top-level task in this project', 400, 'INVALID_PARENT_TASK')
      }
      const user = await UserModel.findById(req.userId).select('name')
      const task = await TaskModel.create({ ...fields, project: project._id, owner: req.userId, createdBy: req.userId })
      addActivity(task, user, 'created this task')
      await task.save()
      if (fields.assignee && fields.assignee.toString() !== req.userId) {
        await notify(fields.assignee, { actor: req.userId, project: project._id, task: task._id, message: `You were assigned "${task.title}"` })
      }
      await task.populate('assignee', 'name email')
      res.status(201).json({ task })
    } catch (error) {
      next(error)
    }
  })

  router.get('/:projectId/tasks/:taskId', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      const task = await TaskModel.findOne({ _id: req.params.taskId, project: project._id }).populate('assignee', 'name email')
      if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND')
      res.json({ task })
    } catch (error) {
      next(error)
    }
  })

  router.patch('/:projectId/tasks/:taskId', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireActive(project)
      const task = await TaskModel.findOne({ _id: req.params.taskId, project: project._id })
      if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND')
      const fields = validateTaskBody(req.body, true)
      if (Object.hasOwn(fields, 'assignee')) await checkAssignee(project, fields.assignee)
      if (Object.hasOwn(fields, 'parentTask') && fields.parentTask) {
        if (String(fields.parentTask) === String(task._id) || !await TaskModel.exists({ _id: fields.parentTask, project: project._id, parentTask: null })) {
          throw new AppError('Subtasks must belong to a different top-level task in this project', 400, 'INVALID_PARENT_TASK')
        }
      }
      const actor = await UserModel.findById(req.userId).select('name')
      if (fields.status && fields.status !== task.status) addActivity(task, actor, 'moved this task', `${task.status} → ${fields.status}`)
      if (fields.assignee !== undefined && String(fields.assignee || '') !== String(task.assignee || '')) {
        if (fields.assignee) await notify(fields.assignee, { actor: req.userId, project: project._id, task: task._id, message: `You were assigned "${task.title}"` })
        addActivity(task, actor, 'changed the assignee')
      }
      const detailFields = Object.keys(fields).filter((key) => !['status', 'assignee'].includes(key))
      if (detailFields.length) addActivity(task, actor, 'updated task details', detailFields.join(', '))
      Object.assign(task, fields)
      await task.save()
      await task.populate('assignee', 'name email')
      res.json({ task })
    } catch (error) {
      next(error)
    }
  })

  router.delete('/:projectId/tasks/:taskId', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireActive(project)
      const task = await TaskModel.findOneAndDelete({ _id: req.params.taskId, project: project._id })
      if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND')
      await TaskModel.deleteMany({ parentTask: task._id })
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  })

  router.post('/:projectId/tasks/:taskId/duplicate', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireActive(project)
      const source = await TaskModel.findOne({ _id: req.params.taskId, project: project._id }).lean()
      if (!source) throw new AppError('Task not found', 404, 'NOT_FOUND')
      const user = await UserModel.findById(req.userId).select('name')
      const { _id, createdAt, updatedAt, __v, comments, activity, ...fields } = source
      fields.title = `${source.title} (copy)`
      fields.status = 'Todo'
      fields.owner = req.userId
      fields.createdBy = req.userId
      fields.assignee = null
      fields.parentTask = null
      fields.checklist = source.checklist.map((item) => ({ text: item.text, done: false }))
      fields.comments = []
      fields.activity = [{ actor: req.userId, actorName: user.name, action: 'duplicated this task', detail: '' }]
      const task = await TaskModel.create(fields)
      await task.populate('assignee', 'name email')
      res.status(201).json({ task })
    } catch (error) {
      next(error)
    }
  })

  router.post('/:projectId/tasks/:taskId/comments', async (req, res, next) => {
    try {
      const project = await getProject(req.params.projectId, req.userId)
      requireActive(project)
      const task = await TaskModel.findOne({ _id: req.params.taskId, project: project._id })
      if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND')
      const body = validateCommentBody(req.body)
      const user = await UserModel.findById(req.userId).select('name')
      task.comments.push({ author: req.userId, authorName: user.name, body })
      addActivity(task, user, 'left a comment')
      await task.save()
      const recipients = new Set(project.members.map((member) => member.user.toString()).filter((id) => id !== req.userId))
      if (task.assignee) recipients.add(task.assignee.toString())
      if (recipients.size) {
        const enabledRecipients = await UserModel.find({ _id: { $in: [...recipients] }, 'preferences.inAppNotifications': { $ne: false } }).select('_id')
        if (enabledRecipients.length) await NotificationModel.insertMany(enabledRecipients.map((recipient) => ({
          user: recipient._id, actor: req.userId, project: project._id, task: task._id, message: `${user.name} commented on "${task.title}"`,
        })))
      }
      res.status(201).json({ comment: task.comments.at(-1), activity: task.activity.at(-1) })
    } catch (error) {
      next(error)
    }
  })

  return router
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = createProjectRouter
