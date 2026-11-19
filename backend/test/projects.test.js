const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const jwt = require('jsonwebtoken')
const { errorHandler } = require('../src/middleware/error-handler')
const createProjectRouter = require('../src/routes/projects')

const secret = 'project-route-test-secret-with-at-least-32-characters'
const userId = '507f1f77bcf86cd799439011'
const projectId = '507f1f77bcf86cd799439012'

async function withServer(app, callback) {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  try { await callback(`http://127.0.0.1:${server.address().port}`) }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
}

function appWith(repository) {
  const app = express()
  app.use(express.json())
  app.use('/api/projects', createProjectRouter({ jwtSecret: secret, repository }))
  app.use(errorHandler)
  return app
}

function authHeaders() {
  return { cookie: `taskflow_token=${jwt.sign({}, secret, { subject: userId, expiresIn: '1h' })}` }
}

test('project task routes require membership before querying tasks', async () => {
  let taskLookup = false
  const repository = {
    findProject: async () => null,
    projectTasks: async () => { taskLookup = true; return [] },
    findUserById: async () => ({ id: userId, role: 'employee', status: 'active' }),
  }
  await withServer(appWith(repository), async (url) => {
    const response = await fetch(`${url}/api/projects/${projectId}/tasks`, { headers: authHeaders() })
    assert.equal(response.status, 404)
  })
  assert.equal(taskLookup, false)
})

test('project task reads stay within the requested project', async () => {
  let requestedProject
  const project = { id: projectId, _id: projectId, owner: { _id: userId }, members: [{ user: { _id: userId } }], status: 'active' }
  const repository = {
    findProject: async (projectId) => project,
    projectTasks: async (projectId) => { requestedProject = projectId; return [{ _id: '507f191e810c19729de860ea', project: projectId }] },
  }
  await withServer(appWith(repository), async (url) => {
    const response = await fetch(`${url}/api/projects/${projectId}/tasks`, { headers: authHeaders() })
    assert.equal(response.status, 200)
  })
  assert.equal(requestedProject, projectId)
})

test('archived projects reject member removal until restored', async () => {
  let removed = false
  const project = { id: projectId, _id: projectId, name: 'Archived', owner: { _id: userId }, status: 'archived', members: [{ user: { _id: userId }, role: 'owner' }] }
  const repository = {
    findProject: async () => project,
    removeProjectMember: async () => { removed = true },
    findUserById: async () => ({ id: userId, role: 'admin', status: 'active' }),
  }
  await withServer(appWith(repository), async (url) => {
    const response = await fetch(`${url}/api/projects/${projectId}/members/507f1f77bcf86cd799439013`, { method: 'DELETE', headers: authHeaders() })
    assert.equal(response.status, 409)
  })
  assert.equal(removed, false)
})

test('employees cannot create or archive projects', async () => {
  const repository = {
    findUserById: async () => ({ id: userId, role: 'employee', status: 'active' }),
  }
  await withServer(appWith(repository), async (url) => {
    const headers = { ...authHeaders(), 'content-type': 'application/json' }
    const create = await fetch(`${url}/api/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Employee project' }),
    })
    assert.equal(create.status, 403)
  })
})
