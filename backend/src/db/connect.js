const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

let pool

function createPool(connectionString) {
  if (!pool) pool = new Pool({ connectionString, max: 20, idleTimeoutMillis: 30000 })
  return pool
}

async function connectDatabase(connectionString) {
  let compatibleConnectionString = connectionString
  try {
    const url = new URL(connectionString)
    if (url.searchParams.get('sslmode') === 'require' && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
      url.searchParams.set('uselibpqcompat', 'true')
      compatibleConnectionString = url.toString()
    }
  } catch {
    // The database configuration validator reports malformed connection strings.
  }
  const database = createPool(compatibleConnectionString)
  await database.query('SELECT 1')
  await database.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'))
  return database
}

function getPool() {
  if (!pool) throw new Error('PostgreSQL has not been initialized')
  return pool
}

async function closeDatabase() {
  if (pool) await pool.end()
  pool = undefined
}

module.exports = { connectDatabase, createPool, getPool, closeDatabase }
