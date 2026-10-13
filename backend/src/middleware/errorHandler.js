const { env } = require('../config/env');

/**
 * Global error handler middleware.
 * Must be registered LAST in the middleware chain (4-arg signature).
 */
function errorHandler(err, req, res, _next) {
  // Log full error server-side
  console.error(`[Error] ${req.method} ${req.path}:`, {
    message: err.message,
    statusCode: err.statusCode || err.status || 500,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    userId: req.user?.email || 'anonymous',
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build response
  // Operational errors (502, 503, 4xx) carry helpful user-facing messages
  const isOperational = statusCode < 500 || statusCode === 502 || statusCode === 503;

  const response = {
    error: isOperational ? err.message : 'Internal server error',
    message: err.message || 'Something went wrong',
  };

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err.details || undefined;
  }

  res.status(statusCode).json(response);
}

/**
 * Wrap an async route handler to catch promise rejections.
 * Usage: router.post('/route', asyncHandler(async (req, res) => { ... }))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
