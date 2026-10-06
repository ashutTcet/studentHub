const pino = require('pino');
const env = require('./env');

const logger = pino({
  level: process.env.LOG_LEVEL || (env.isProduction ? 'info' : 'debug'),
  redact: {
    paths: ['req.headers.cookie', 'req.headers.authorization', 'password', 'token', 'jwt'],
    censor: '[REDACTED]',
  },
});

module.exports = logger;
