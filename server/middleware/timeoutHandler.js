const timeout = require('connect-timeout');
const env = require('../config/env');

const requestTimeout = timeout(`${env.requestTimeoutMs}ms`);

const haltOnTimedout = (req, res, next) => {
  if (!req.timedout) {
    next();
  }
};

module.exports = { requestTimeout, haltOnTimedout };
