const env = require('../config/env');
const logger = require('../config/logger');

const notFoundHandler = (req, res) => {
  res.status(404).json({ message: 'Route not found.' });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = Number(err.statusCode) || 500;
  const isServerError = statusCode >= 500;

  logger.error(
    {
      requestId: req.requestId,
      path: req.originalUrl,
      method: req.method,
      statusCode,
      error: err.message,
      stack: env.isProduction ? undefined : err.stack,
    },
    'API error'
  );

  if (req.timedout) {
    return res.status(503).json({ message: 'Request timed out. Please try again.' });
  }

  return res.status(statusCode).json({
    message: isServerError && env.isProduction ? 'Internal server error.' : err.message || 'Internal server error.',
  });
};

module.exports = { notFoundHandler, errorHandler };
