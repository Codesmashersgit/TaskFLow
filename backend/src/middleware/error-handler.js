function errorHandler(error, _req, res, _next) {
  const statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : Number.isInteger(error.status) && error.status >= 400 && error.status < 500 ? error.status
    : error.type === 'entity.parse.failed' || error.name === 'ValidationError' ? 400
      : error.name === 'CastError' ? 400 : 500
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : statusCode === 400 && error.type === 'entity.parse.failed' ? 'Request body contains invalid JSON'
      : error.message || 'An unexpected error occurred'

  if (statusCode >= 500) console.error(error)
  res.status(statusCode).json({
    error: {
      code: error.code || (statusCode === 413 ? 'PAYLOAD_TOO_LARGE' : statusCode === 400 ? 'BAD_REQUEST' : statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
      message,
    },
  })
}

module.exports = { errorHandler }
