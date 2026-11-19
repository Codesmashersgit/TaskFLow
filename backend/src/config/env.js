const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:5173'

function loadConfig(env = process.env) {
  const port = Number(env.PORT || 5000)
  const jwtSecret = env.JWT_SECRET
  const frontendOrigin = env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN
  const jwtExpiresIn = env.JWT_EXPIRES_IN || '1d'

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535')
  }
  if (!env.DATABASE_URL || !/^postgres(?:ql)?:\/\//.test(env.DATABASE_URL)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URI')
  }
  if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes')
  }
  if (!/^\d+(?:ms|s|m|h|d|w|y)?$/.test(jwtExpiresIn)) {
    throw new Error('JWT_EXPIRES_IN must be a numeric duration such as 15m, 12h, or 1d')
  }
  const frontendOrigins = frontendOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)
  if (!frontendOrigins.length) throw new Error('FRONTEND_ORIGIN must contain at least one valid HTTP or HTTPS origin')
  try {
    for (const origin of frontendOrigins) {
      const url = new URL(origin)
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) throw new Error()
    }
  } catch {
    throw new Error('FRONTEND_ORIGIN must contain valid HTTP or HTTPS origins')
  }

  return Object.freeze({
    nodeEnv: env.NODE_ENV || 'development',
    port,
    databaseUrl: env.DATABASE_URL,
    databaseTestUrl: env.DATABASE_TEST_URL,
    jwtSecret,
    jwtExpiresIn,
    frontendOrigin,
    frontendOrigins,
    isProduction: env.NODE_ENV === 'production',
  })
}

module.exports = { loadConfig, DEFAULT_FRONTEND_ORIGIN }
