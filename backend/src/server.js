require('dotenv').config()

const { loadConfig } = require('./config/env')
const { connectDatabase } = require('./db/connect')
const { createApp } = require('./app')

async function start() {
  const config = loadConfig()
  await connectDatabase(config.mongodbUri)
  const app = createApp({ frontendOrigin: config.frontendOrigin })
  const server = app.listen(config.port, () => {
    console.log(`TaskFlow API listening on port ${config.port}`)
  })

  const shutdown = async () => {
    server.close()
    const mongoose = require('mongoose')
    await mongoose.disconnect()
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

module.exports = { start }
