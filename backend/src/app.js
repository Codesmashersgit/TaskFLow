const express = require('express')
const cors = require('cors')
const healthRouter = require('./routes/health')
const authRouter = require('./routes/auth')
const taskRouter = require('./routes/tasks')
const projectRouter = require('./routes/projects')
const { errorHandler } = require('./middleware/error-handler')

function createApp({
  frontendOrigin = 'http://localhost:5173',
  jwtSecret = process.env.JWT_SECRET,
  jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d',
  isProduction = process.env.NODE_ENV === 'production',
} = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: frontendOrigin, credentials: true }))
  app.use(express.json({ limit: '10kb' }))
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    next()
  })
  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter({ jwtSecret, jwtExpiresIn, isProduction }))
  app.use('/api/tasks', taskRouter({ jwtSecret }))
  app.use('/api/projects', projectRouter({ jwtSecret }))
  app.use((_req, _res, next) => {
    const error = new Error('Route not found')
    error.statusCode = 404
    error.code = 'NOT_FOUND'
    next(error)
  })
  app.use(errorHandler)
  return app
}

module.exports = { createApp }
