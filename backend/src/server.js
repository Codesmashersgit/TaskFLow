require('dotenv').config()

const express = require('express')
const { loadConfig } = require('./config/env')
const { connectDatabase, closeDatabase } = require('./db/connect')
const { createApp } = require('./app')

const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter(Boolean)
  .map((host) => `https://${host}`)
const configuredOrigins = (process.env.FRONTEND_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean)
const config = loadConfig({
  ...process.env,
  FRONTEND_ORIGIN: [...new Set([...configuredOrigins, ...vercelOrigins])].join(',') || undefined,
})

let databaseReady
async function initializeDatabase() {
  if (!databaseReady) {
    databaseReady = connectDatabase(config.databaseUrl).catch((error) => {
      databaseReady = undefined
      throw error
    })
  }
  return databaseReady
}

const app = createApp({
  frontendOrigin: config.frontendOrigin,
  frontendOrigins: config.frontendOrigins,
  initializeRequest: initializeDatabase,
  expressApp: express(),
})

async function start() {
  try {
    await initializeDatabase()
    console.log('Database connected successfully.')
  } catch (dbError) {
    console.warn(`Database connection skipped (${dbError.message}). Running with in-memory Mock REST API mode for CRM & Helpdesk.`)
  }

  const server = app.listen(config.port, () => {
    console.log(`TaskFlow API listening on port ${config.port}`)
    console.log(`- Mock CRM API: http://localhost:${config.port}/api/crm/tasks`)
    console.log(`- Mock Helpdesk API: http://localhost:${config.port}/api/helpdesk/tickets`)
    console.log(`- Dashboard Aggregator: http://localhost:${config.port}/api/dashboard/tasks`)
  })

  const shutdown = async () => {
    server.close()
    await closeDatabase().catch(() => {})
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

if (require.main === module) {
  start().catch((error) => {
    console.error('TaskFlow API failed to start:', error.message)
    process.exitCode = 1
  })
}

module.exports = app
