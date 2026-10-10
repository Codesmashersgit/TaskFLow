const jwt = require('jsonwebtoken')
const { AppError } = require('../errors/app-error')

const COOKIE_NAME = 'taskflow_token'

function readCookie(req, name) {
  const cookieHeader = req.headers.cookie || ''
  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=')
    if (separator < 0 || cookie.slice(0, separator).trim() !== name) continue
    try {
      return decodeURIComponent(cookie.slice(separator + 1).trim())
    } catch {
      return null
    }
  }
  return null
}

function requireAuth({ jwtSecret } = {}) {
  return (req, _res, next) => {
    const token = readCookie(req, COOKIE_NAME)
    if (!token) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
    if (!jwtSecret) return next(new AppError('Authentication is not configured', 500, 'INTERNAL_ERROR'))
    try {
      const payload = jwt.verify(token, jwtSecret)
      if (typeof payload.sub !== 'string') throw new Error('Invalid token subject')
      req.userId = payload.sub
      return next()
    } catch {
      return next(new AppError('Session is invalid or expired', 401, 'UNAUTHORIZED'))
    }
  }
}

module.exports = { requireAuth, COOKIE_NAME }
