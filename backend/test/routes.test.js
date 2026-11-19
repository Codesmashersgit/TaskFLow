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
  try { await callback(`http://127.0.0.1:${server.address().port}`) }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
}

function makeApp(repository) {
  const app = express()
  app.use(express.json())
  app.use('/api/tasks', createTaskRouter({ jwtSecret: secret, repository }))
  app.use(errorHandler)
  return app
}

function authHeaders() {
  return { cookie: `taskflow_token=${jwt.sign({}, secret, { subject: ownerId, expiresIn: '1h' })}` }
}

test('task routes reject missing and expired authentication cookies', async () => {
  await withServer(makeApp({}), async (url) => {
    assert.equal((await fetch(`${url}/api/tasks`)).status, 401)
    const expired = jwt.sign({}, secret, { subject: ownerId, expiresIn: '-1s' })
    assert.equal((await fetch(`${url}/api/tasks`, { headers: { cookie: `taskflow_token=${expired}` } })).status, 401)
  })
})

test('task list and read repository operations remain scoped to the owner', async () => {
  const calls = []
  const repository = {
    personalTasks: async (userId) => { calls.push(['list', userId]); return [{ _id: taskId, owner: userId }] },
    findTask: async (taskId) => { calls.push(['read', taskId]); return { _id: taskId, owner: ownerId, title: 'Private task' } },
  }
  await withServer(makeApp(repository), async (url) => {
    const list = await fetch(`${url}/api/tasks`, { headers: authHeaders() })
    const detail = await fetch(`${url}/api/tasks/${taskId}`, { headers: authHeaders() })
    assert.equal(list.status, 200)
    assert.equal(detail.status, 200)
  })
  assert.deepEqual(calls, [['list', ownerId], ['read', taskId]])
})

test('task updates and deletes are blocked unless they belong to the owner', async () => {
  let updateId
  let deleteId
  const repository = {
    findTask: async (taskId) => ({ _id: taskId, id: taskId, owner: ownerId, title: 'Before' }),
    updateTask: async (taskId) => { updateId = taskId; return { _id: taskId, id: taskId, owner: ownerId, title: 'Changed' } },
    deleteTask: async (taskId) => { deleteId = taskId },
  }
  await withServer(makeApp(repository), async (url) => {
    const headers = { ...authHeaders(), 'content-type': 'application/json' }
    assert.equal((await fetch(`${url}/api/tasks/${taskId}`, { method: 'PATCH', headers, body: JSON.stringify({ title: 'Changed' }) })).status, 200)
    assert.equal((await fetch(`${url}/api/tasks/${taskId}`, { method: 'DELETE', headers })).status, 204)
  })
  assert.equal(updateId, taskId)
  assert.equal(deleteId, taskId)
})

test('dashboard statistics come from the authenticated owner repository query', async () => {
  const repository = { personalTaskStats: async (userId) => ({ total: 3, completed: 1, inProgress: 1, pending: 1, overdue: 1, ownerId: userId }) }
  await withServer(makeApp(repository), async (url) => {
    const response = await fetch(`${url}/api/tasks/stats`, { headers: authHeaders() })
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.ownerId, ownerId)
    assert.equal(body.total, 3)
  })
})
