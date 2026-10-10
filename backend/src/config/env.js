const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:5173'

function loadConfig(env = process.env) {
  const port = Number(env.PORT || 5000)
  const jwtSecret = env.JWT_SECRET
  const frontendOrigin = env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN
  const jwtExpiresIn = env.JWT_EXPIRES_IN || '1d'

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535')
  }
  if (!env.MONGODB_URI || !/^mongodb(?:\+srv)?:\/\//.test(env.MONGODB_URI)) {
    throw new Error('MONGODB_URI must be a MongoDB connection URI')
  }
  if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes')
  }
  if (!/^\d+(?:ms|s|m|h|d|w|y)?$/.test(jwtExpiresIn)) {
    throw new Error('JWT_EXPIRES_IN must be a numeric duration such as 15m, 12h, or 1d')
  }
  try {
    const url = new URL(frontendOrigin)
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== frontendOrigin) throw new Error()
  } catch {
    throw new Error('FRONTEND_ORIGIN must be a valid HTTP or HTTPS origin')
  }

  return Object.freeze({
    nodeEnv: env.NODE_ENV || 'development',
    port,
    mongodbUri: env.MONGODB_URI,
    mongodbTestUri: env.MONGODB_TEST_URI,
    jwtSecret,
    jwtExpiresIn,
    frontendOrigin,
    isProduction: env.NODE_ENV === 'production',
  })
}

module.exports = { loadConfig, DEFAULT_FRONTEND_ORIGIN }
