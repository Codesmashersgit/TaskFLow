const test = require('node:test')
const assert = require('node:assert/strict')
const { loadConfig } = require('../src/config/env')
const { AppError } = require('../src/errors/app-error')

const validEnv = {
  DATABASE_URL: 'postgresql://postgres@127.0.0.1:5432/taskflow_test',
  JWT_SECRET: 'local-test-secret-with-more-than-32-bytes',
}

test('loads defaults and validated runtime configuration', () => {
  const config = loadConfig(validEnv)
  assert.equal(config.port, 5000)
  assert.equal(config.frontendOrigin, 'http://localhost:5173')
  assert.equal(config.jwtExpiresIn, '1d')
  assert.equal(config.isProduction, false)
})

test('supports multiple local frontend origins', () => {
  const config = loadConfig({
    ...validEnv,
    FRONTEND_ORIGIN: 'http://localhost:5173,http://localhost:5174',
  })
  assert.deepEqual(config.frontendOrigins, ['http://localhost:5173', 'http://localhost:5174'])
})

test('rejects missing database URI and weak JWT secrets', () => {
  assert.throws(() => loadConfig({ ...validEnv, DATABASE_URL: '' }), /DATABASE_URL/)
  assert.throws(() => loadConfig({ ...validEnv, JWT_SECRET: 'too-short' }), /32 bytes/)
  assert.throws(() => loadConfig({ ...validEnv, JWT_EXPIRES_IN: 'soon' }), /JWT_EXPIRES_IN/)
  assert.throws(() => loadConfig({ ...validEnv, FRONTEND_ORIGIN: 'not-an-origin' }), /FRONTEND_ORIGIN/)
})

test('AppError carries a safe HTTP status and code', () => {
  const error = new AppError('Invalid request', 400, 'BAD_REQUEST')
  assert.equal(error.statusCode, 400)
  assert.equal(error.code, 'BAD_REQUEST')
  assert.equal(error.isOperational, true)
})
