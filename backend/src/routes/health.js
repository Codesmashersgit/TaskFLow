const express = require('express')
const mongoose = require('mongoose')

const router = express.Router()

router.get('/', (_req, res) => {
  const ready = mongoose.connection.readyState === 1
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable' })
})

module.exports = router
