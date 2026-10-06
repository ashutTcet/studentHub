const pinoHttp = require('pino-http');
const logger = require('../config/logger');

const requestLogger = pinoHttp({
  logger,
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
      };
    },
  },
  customLogLevel(req, res, error) {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} completed with ${res.statusCode}`;
  },
  customErrorMessage(req, res, error) {
    return `${req.method} ${req.url} failed with ${res.statusCode || 500}: ${error.message}`;
  },
  autoLogging: {
    ignore(req) {
      return req.url.startsWith('/api/health/live');
    },
  },
});

module.exports = { requestLogger };
