const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const jwt = require('jsonwebtoken')
const { errorHandler } = require('../src/middleware/error-handler')
const createTaskRouter = require('../src/routes/tasks')

const secret = 'middleware-test-secret-with-at-least-32-characters'
const ownerId = '507f1f77bcf86cd799439011'
const taskId = '507f191e810c19729de860ea'

async function withServer(app, callback) {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  try {
    await callback(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

function makeApp(TaskModel) {
  const app = express()
  app.use(express.json())
  app.use('/api/tasks', createTaskRouter({ jwtSecret: secret, TaskModel }))
  app.use(errorHandler)
  return app
}

function tokenFor(userId = ownerId, expiresIn = '1h') {
  return jwt.sign({}, secret, { subject: userId, expiresIn })
}

test('task routes reject requests without a valid authentication cookie', async () => {
  await withServer(makeApp({}), async (url) => {
    const missing = await fetch(`${url}/api/tasks`)
    assert.equal(missing.status, 401)
    assert.equal((await missing.json()).error.code, 'UNAUTHORIZED')

    const expired = await fetch(`${url}/api/tasks`, {
      headers: { cookie: `taskflow_token=${tokenFor(ownerId, '-1s')}` },
    })
    assert.equal(expired.status, 401)
  })
})

test('task list and read queries are always scoped to the authenticated owner', async () => {
  const queries = []
  const task = { _id: taskId, title: 'Private task', owner: ownerId }
  const TaskModel = {
    find(query) {
      queries.push(query)
      return { sort() { return this }, lean: async () => [task] }
    },
    findOne: async (query) => { queries.push(query); return task },
  }
  await withServer(makeApp(TaskModel), async (url) => {
    const headers = { cookie: `taskflow_token=${tokenFor()}` }
    const list = await fetch(`${url}/api/tasks`, { headers })
    assert.equal(list.status, 200)
    const detail = await fetch(`${url}/api/tasks/${taskId}`, { headers })
    assert.equal(detail.status, 200)
    assert.deepEqual(queries, [
      { owner: ownerId },
      { _id: taskId, owner: ownerId },
    ])
  })
})

test('task updates and deletes include the authenticated owner in their database predicates', async () => {
  const queries = []
  const TaskModel = {
    findOneAndUpdate: async (query) => { queries.push(query); return { _id: taskId, title: 'Changed' } },
    findOneAndDelete: async (query) => { queries.push(query); return { _id: taskId } },
  }
  await withServer(makeApp(TaskModel), async (url) => {
    const headers = {
      cookie: `taskflow_token=${tokenFor()}`,
      'content-type': 'application/json',
    }
    const update = await fetch(`${url}/api/tasks/${taskId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ title: 'Changed' }),
    })
    assert.equal(update.status, 200)
    const remove = await fetch(`${url}/api/tasks/${taskId}`, { method: 'DELETE', headers })
    assert.equal(remove.status, 204)
    assert.deepEqual(queries, [
      { _id: taskId, owner: ownerId },
      { _id: taskId, owner: ownerId },
    ])
  })
})

test('dashboard statistics aggregate only the authenticated owner’s tasks', async () => {
  const queries = []
  const TaskModel = {
    countDocuments: async (query) => {
      queries.push(query)
      if (query.owner !== ownerId) return 0
      if (query.dueDate) return 1
      if (query.status === 'Done' || query.status === 'In Progress') return 1
      return 3
    },
  }
  await withServer(makeApp(TaskModel), async (url) => {
    const response = await fetch(`${url}/api/tasks/stats`, {
      headers: { cookie: `taskflow_token=${tokenFor()}` },
    })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      total: 3,
      completed: 1,
      inProgress: 1,
      pending: 1,
      overdue: 1,
    })
    assert.equal(queries.length, 4)
    assert.ok(queries.every((query) => query.owner === ownerId))
  })
})

test('malformed and oversized request bodies return consistent client errors', async () => {
  const app = express()
  app.use(express.json({ limit: '10b' }))
  app.post('/test', (_req, res) => res.sendStatus(204))
  app.use(errorHandler)
  await withServer(app, async (url) => {
    const malformed = await fetch(`${url}/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    })
    assert.equal(malformed.status, 400)
    assert.equal((await malformed.json()).error.code, 'BAD_REQUEST')
    const oversized = await fetch(`${url}/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: 'long-enough-to-exceed-limit' }),
    })
    assert.equal(oversized.status, 413)
    assert.equal((await oversized.json()).error.code, 'PAYLOAD_TOO_LARGE')
  })
})
