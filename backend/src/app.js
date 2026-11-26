const express = require('express')
const cors = require('cors')
const healthRouter = require('./routes/health')
const createCrmRouter = require('./routes/crm')
const createHelpdeskRouter = require('./routes/helpdesk')
const createDashboardRouter = require('./routes/dashboard')
const createMockAppsRouter = require('./routes/mockApps')
const { errorHandler } = require('./middleware/error-handler')

function createApp({
  frontendOrigin = 'http://localhost:5173',
  frontendOrigins,
  initializeRequest,
  expressApp,
} = {}) {
  const app = expressApp || express()
  const allowedOrigins = new Set(
    (frontendOrigins || frontendOrigin.split(',')).map((origin) => origin.trim()).filter(Boolean),
  )
  app.disable('x-powered-by')
  app.use(cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true)
      return callback(new Error('Origin is not allowed by CORS'))
    },
  }))
  app.use(express.json({ limit: '10kb' }))

  // Mock Source Applications (Live, responsive HTML portals for CRM & Helpdesk)
  app.use('/mock-apps', createMockAppsRouter())

  // Mock REST APIs & Unified Dashboard endpoints (Standalone & zero DB dependency)
  app.use('/api/crm', createCrmRouter())
  app.use('/api/helpdesk', createHelpdeskRouter())
  app.use('/api/dashboard', createDashboardRouter())

  if (initializeRequest) {
    app.use('/api/health', async (_req, _res, next) => {
      try { await initializeRequest(); next() } catch (error) { next(error) }
    })
  }

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    next()
  })

  app.use('/api/health', healthRouter)

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
