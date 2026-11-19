const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { repository } = require('../db/repository')
const { AppError } = require('../errors/app-error')
const { validateAuthBody } = require('../lib/validation')
const { requireAuth, COOKIE_NAME } = require('../middleware/auth')

function cookieSettings(isProduction) {
  return { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' }
}

function createAuthRouter({ jwtSecret, jwtExpiresIn = '1d', isProduction = false } = {}) {
  const router = express.Router()
  const auth = requireAuth({ jwtSecret })

  router.post('/register', async (req, res, next) => {
    try {
      const { name, email, password } = validateAuthBody(req.body, true)
      const passwordHash = await bcrypt.hash(password, 12)
      if (await repository.findUserByEmail(email)) throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS')
      const user = await repository.createUser({ name, email, passwordHash })
      const token = jwt.sign({}, jwtSecret, { subject: user.id, expiresIn: jwtExpiresIn })
      res.cookie(COOKIE_NAME, token, { ...cookieSettings(isProduction), maxAge: 24 * 60 * 60 * 1000 })
      res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } })
    } catch (error) {
      if (error.code === 11000) return next(new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS'))
      return next(error)
    }
  })

  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = validateAuthBody(req.body, false)
      const user = await repository.findUserByEmail(email)
      if (user?.status === 'disabled') throw new AppError('This account has been disabled', 403, 'ACCOUNT_DISABLED')
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new AppError('Email or password is incorrect', 401, 'INVALID_CREDENTIALS')
      }
      const token = jwt.sign({}, jwtSecret, { subject: user.id, expiresIn: jwtExpiresIn })
      res.cookie(COOKIE_NAME, token, { ...cookieSettings(isProduction), maxAge: 24 * 60 * 60 * 1000 })
      res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } })
    } catch (error) {
      next(error)
    }
  })

  router.post('/logout', (_req, res) => {
    res.clearCookie(COOKIE_NAME, cookieSettings(isProduction))
    res.status(204).end()
  })

  router.get('/me', auth, async (req, res, next) => {
    try {
      const user = await repository.findUserById(req.userId)
      if (!user) throw new AppError('Session is invalid or expired', 401, 'UNAUTHORIZED')
      res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, avatar: user.avatar, preferences: user.preferences } })
    } catch (error) {
      next(error)
    }
  })

  router.patch('/me', auth, async (req, res, next) => {
    try {
      const updates = {}
      if (Object.hasOwn(req.body || {}, 'name')) {
        if (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.trim().length > 80) {
          throw new AppError('Name is required and must be 80 characters or fewer', 400, 'VALIDATION_ERROR')
        }
        updates.name = req.body.name.trim()
      }
      if (Object.hasOwn(req.body || {}, 'preferences')) {
        const preferences = req.body.preferences
        if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences) ||
          Object.values(preferences).some((value) => typeof value !== 'boolean') ||
          Object.keys(preferences).some((key) => !['emailNotifications', 'inAppNotifications'].includes(key))) {
          throw new AppError('Notification preferences must be boolean values', 400, 'VALIDATION_ERROR')
        }
        for (const [key, value] of Object.entries(preferences)) updates[`preferences.${key}`] = value
      }
      if (Object.keys(updates).length === 0) throw new AppError('Provide profile fields to update', 400, 'VALIDATION_ERROR')
      const preferences = req.body.preferences ? { emailNotifications: req.body.preferences.emailNotifications, inAppNotifications: req.body.preferences.inAppNotifications } : undefined
      const user = await repository.updateUser(req.userId, { name: updates.name, preferences })
      if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
      res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, avatar: user.avatar, preferences: user.preferences } })
    } catch (error) {
      next(error)
    }
  })

  router.get('/notifications', auth, async (req, res, next) => {
    try {
      const notifications = await repository.notifications(req.userId)
      res.json({ notifications })
    } catch (error) {
      next(error)
    }
  })

  router.patch('/notifications/read', auth, async (req, res, next) => {
    try {
      await repository.markNotificationsRead(req.userId)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  })

  async function requireAdmin(req) {
    const user = await repository.findUserById(req.userId)
    if (!user || user.role !== 'admin' || user.status !== 'active') {
      throw new AppError('Admin access is required', 403, 'FORBIDDEN')
    }
  }

  router.get('/admin/team', auth, async (req, res, next) => {
    try {
      await requireAdmin(req)
      res.json({ team: await repository.listTeam() })
    } catch (error) { next(error) }
  })

  router.post('/admin/employees', auth, async (req, res, next) => {
    try {
      await requireAdmin(req)
      const { name, email, password } = validateAuthBody(req.body, true)
      if (await repository.findUserByEmail(email)) throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS')
      const passwordHash = await bcrypt.hash(password, 12)
      const employee = await repository.createEmployee({ name, email, passwordHash })
      res.status(201).json({ employee: { id: employee.id, name: employee.name, email: employee.email, role: employee.role, status: employee.status } })
    } catch (error) { next(error) }
  })

  router.patch('/admin/team/:memberId', auth, async (req, res, next) => {
    try {
      await requireAdmin(req)
      const member = await repository.findUserById(req.params.memberId)
      if (!member) throw new AppError('Team member not found', 404, 'NOT_FOUND')
      let updated = member
      if (Object.hasOwn(req.body || {}, 'role')) {
        if (!['admin', 'employee'].includes(req.body.role)) throw new AppError('Role must be admin or employee', 400, 'VALIDATION_ERROR')
        if (member.id === req.userId && req.body.role !== 'admin') throw new AppError('You cannot remove your own admin role', 400, 'VALIDATION_ERROR')
        updated = await repository.setTeamMemberRole(member.id, req.body.role)
      }
      if (Object.hasOwn(req.body || {}, 'status')) {
        if (!['active', 'disabled'].includes(req.body.status)) throw new AppError('Status must be active or disabled', 400, 'VALIDATION_ERROR')
        if (member.id === req.userId && req.body.status !== 'active') throw new AppError('You cannot disable your own account', 400, 'VALIDATION_ERROR')
        updated = await repository.setTeamMemberStatus(member.id, req.body.status)
      }
      res.json({ member: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, status: updated.status } })
    } catch (error) { next(error) }
  })

  return router
}

module.exports = createAuthRouter
