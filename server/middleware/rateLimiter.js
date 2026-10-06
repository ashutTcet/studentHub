const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const env = require('../config/env');
const { getRedis, isRedisReady } = require('../config/redis');

const createStore = () => {
  const redis = getRedis();

  if (!redis || !isRedisReady()) {
    return undefined;
  }

  return new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'studenthub:rate-limit:',
  });
};

const createLimiter = ({ max, windowMs, message }) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    windowMs,
    max,
    message: { message },
    store: createStore(),
  });

const globalLimiter = createLimiter({
  max: env.rateLimitGlobalMax,
  windowMs: env.rateLimitWindowMs,
  message: 'Too many requests. Please try again shortly.',
});

const authLimiter = createLimiter({
  max: env.rateLimitAuthMax,
  windowMs: env.rateLimitWindowMs,
  message: 'Too many authentication attempts. Please wait and try again.',
});

const uploadLimiter = createLimiter({
  max: env.rateLimitUploadMax,
  windowMs: env.rateLimitWindowMs,
  message: 'Upload limit exceeded. Please wait before uploading again.',
});

const expensiveSearchLimiter = createLimiter({
  max: env.rateLimitSearchMax,
  windowMs: env.rateLimitWindowMs,
  message: 'Search rate limit reached. Please slow down and try again.',
});

const reportLimiter = createLimiter({
  max: env.rateLimitReportMax,
  windowMs: env.rateLimitWindowMs,
  message: 'Report generation is currently rate-limited. Please retry shortly.',
});

const verificationLimiter = createLimiter({
  max: env.rateLimitVerificationMax,
  windowMs: env.rateLimitWindowMs,
  message: 'Verification actions are rate-limited. Please retry in a moment.',
});

const notificationLimiter = createLimiter({
  max: env.rateLimitNotificationMax,
  windowMs: env.rateLimitWindowMs,
  message: 'Too many notification requests. Please try again shortly.',
});

module.exports = {
  globalLimiter,
  authLimiter,
  uploadLimiter,
  expensiveSearchLimiter,
  reportLimiter,
  verificationLimiter,
  notificationLimiter,
};
