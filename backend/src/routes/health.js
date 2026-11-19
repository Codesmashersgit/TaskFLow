const express = require('express')
const { getPool } = require('../db/connect')

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    await getPool().query('SELECT 1')
    res.status(200).json({ status: 'ok', database: 'postgresql' })
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'postgresql' })
  }
})

module.exports = router
