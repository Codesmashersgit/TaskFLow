const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Notification = require('../models/notification')
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
      const user = await User.create({ name, email, passwordHash })
      const token = jwt.sign({}, jwtSecret, { subject: user.id, expiresIn: jwtExpiresIn })
      res.cookie(COOKIE_NAME, token, { ...cookieSettings(isProduction), maxAge: 24 * 60 * 60 * 1000 })
      res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } })
    } catch (error) {
      if (error.code === 11000) return next(new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS'))
      return next(error)
    }
  })

  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = validateAuthBody(req.body, false)
      const user = await User.findOne({ email }).select('+passwordHash')
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new AppError('Email or password is incorrect', 401, 'INVALID_CREDENTIALS')
      }
      const token = jwt.sign({}, jwtSecret, { subject: user.id, expiresIn: jwtExpiresIn })
      res.cookie(COOKIE_NAME, token, { ...cookieSettings(isProduction), maxAge: 24 * 60 * 60 * 1000 })
      res.json({ user: { id: user.id, name: user.name, email: user.email } })
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
      const user = await User.findById(req.userId).select('name email avatar preferences')
      if (!user) throw new AppError('Session is invalid or expired', 401, 'UNAUTHORIZED')
      res.json({ user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, preferences: user.preferences } })
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
      const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true }).select('name email avatar preferences')
      if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
      res.json({ user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, preferences: user.preferences } })
    } catch (error) {
      next(error)
    }
  })

  router.get('/notifications', auth, async (req, res, next) => {
    try {
      const notifications = await Notification.find({ user: req.userId }).sort({ createdAt: -1 }).limit(30).lean()
      res.json({ notifications })
    } catch (error) {
      next(error)
    }
  })

  router.patch('/notifications/read', auth, async (req, res, next) => {
    try {
      await Notification.updateMany({ user: req.userId, readAt: null }, { $set: { readAt: new Date() } })
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  })

  return router
}

module.exports = createAuthRouter
