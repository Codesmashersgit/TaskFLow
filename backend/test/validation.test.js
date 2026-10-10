const test = require('node:test')
const assert = require('node:assert/strict')
const { validateAuthBody, validateTaskBody, validateProjectBody, validateCommentBody } = require('../src/lib/validation')

test('normalizes registration email and validates credentials', () => {
  assert.deepEqual(validateAuthBody({
    name: '  Ada Lovelace ',
    email: ' ADA@example.com ',
    password: 'a-secure-password',
  }, true), {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'a-secure-password',
  })
  assert.throws(() => validateAuthBody({ email: 'not-an-email', password: '12345678' }, false), {
    code: 'VALIDATION_ERROR',
  })
  assert.throws(() => validateAuthBody({ email: 'ada@example.com', password: 'short' }, false), /8 characters.*72 bytes/)
  assert.throws(() => validateAuthBody({
    email: 'ada@example.com',
    password: `${'a'.repeat(69)}${'💚'}`,
  }, false), /72 bytes/)
  assert.throws(() => validateAuthBody({
    email: 'ada@example.com',
    password: '💚'.repeat(4),
  }, false), /8 characters/)
})

test('validates task input and allows partial updates without accepting empty changes', () => {
  assert.deepEqual(validateTaskBody({
    title: '  Review launch plan ',
    description: '  Check open items  ',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2026-10-11',
  }), {
    title: 'Review launch plan',
    description: 'Check open items',
    status: 'In Progress',
    priority: 'High',
    dueDate: new Date('2026-10-11'),
  })

  test('validates project fields and supports the expanded task workflow', () => {
    assert.deepEqual(validateProjectBody({
      name: ' Product launch ',
      description: ' Ship the new workspace ',
      priority: 'High',
      color: 'blue',
      dueDate: '2026-11-01',
    }), {
      name: 'Product launch',
      description: 'Ship the new workspace',
      priority: 'High',
      color: 'blue',
      dueDate: new Date('2026-11-01'),
    })
    assert.deepEqual(validateTaskBody({
      status: 'In Review',
      labels: [' Product ', 'Product'],
      checklist: [{ text: ' QA pass ' }],
      assignee: '507f1f77bcf86cd799439011',
      parentTask: '507f191e810c19729de860ea',
    }, true), {
      status: 'In Review',
      assignee: '507f1f77bcf86cd799439011',
      parentTask: '507f191e810c19729de860ea',
      labels: ['Product'],
      checklist: [{ text: 'QA pass', done: false }],
    })
    assert.equal(validateCommentBody({ body: '  Reviewed and approved. ' }), 'Reviewed and approved.')
    assert.throws(() => validateProjectBody({ name: ' ' }), /Project name is required/)
    assert.throws(() => validateCommentBody({ body: '' }), /Comment is required/)
  })
  assert.deepEqual(validateTaskBody({ status: 'Done' }, true), { status: 'Done' })
  assert.deepEqual(validateTaskBody({ dueDate: null }, true), { dueDate: null })
  assert.throws(() => validateTaskBody({ title: 'A', status: 'Complete' }), /Status must be/)
  assert.throws(() => validateTaskBody({ title: '' }), /Title is required/)
  assert.throws(() => validateTaskBody({}, true), /at least one/)
})
