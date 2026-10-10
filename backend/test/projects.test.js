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
  try {
    await callback(`http://127.0.0.1:${server.address().port}`)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

function appWith(ProjectModel, TaskModel = {}) {
  const app = express()
  app.use(express.json())
  app.use('/api/projects', createProjectRouter({ jwtSecret: secret, ProjectModel, TaskModel }))
  app.use(errorHandler)
  return app
}

function authHeaders() {
  return { cookie: `taskflow_token=${jwt.sign({}, secret, { subject: userId, expiresIn: '1h' })}` }
}

test('project task routes require a project membership match before querying tasks', async () => {
  const projectQueries = []
  let taskQueryCount = 0
  const ProjectModel = {
    findOne: async (query) => { projectQueries.push(query); return null },
  }
  const TaskModel = {
    find() { taskQueryCount += 1; throw new Error('task query should not run for a non-member') },
  }
  await withServer(appWith(ProjectModel, TaskModel), async (url) => {
    const response = await fetch(`${url}/api/projects/${projectId}/tasks`, { headers: authHeaders() })
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: { code: 'NOT_FOUND', message: 'Project not found' } })
    assert.deepEqual(projectQueries, [{ _id: projectId, 'members.user': userId }])
    assert.equal(taskQueryCount, 0)
  })
})

test('project task reads are filtered to the requested member project', async () => {
  const project = { _id: projectId, owner: userId, members: [{ user: userId, role: 'owner' }] }
  let querySeen
  const ProjectModel = { findOne: async (query) => { assert.deepEqual(query, { _id: projectId, 'members.user': userId }); return project } }
  const task = { _id: '507f191e810c19729de860ea', title: 'Scoped', project: projectId }
  const TaskModel = {
    find(query) {
      querySeen = query
      return { populate() { return this }, sort() { return this }, lean: async () => [task] }
    },
  }
  await withServer(appWith(ProjectModel, TaskModel), async (url) => {
    const response = await fetch(`${url}/api/projects/${projectId}/tasks`, { headers: authHeaders() })
    assert.equal(response.status, 200)
    assert.deepEqual((await response.json()).tasks, [task])
    assert.deepEqual(querySeen, { project: projectId })
  })
})

test('archived projects reject member removal until restored', async () => {
  let saveCount = 0
  const project = {
    _id: projectId,
    owner: userId,
    status: 'archived',
    members: [{ user: userId }, { user: '507f1f77bcf86cd799439013' }],
    save: async () => { saveCount += 1 },
  }
  const ProjectModel = { findOne: async () => project }
  await withServer(appWith(ProjectModel), async (url) => {
    const response = await fetch(`${url}/api/projects/${projectId}/members/507f1f77bcf86cd799439013`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    assert.equal(response.status, 409)
    assert.deepEqual(await response.json(), {
      error: { code: 'PROJECT_ARCHIVED', message: 'Archived projects are read-only. Restore the project to make changes.' },
    })
    assert.equal(project.members.length, 2)
    assert.equal(saveCount, 0)
  })
})
