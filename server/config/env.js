const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  port: parseNumber(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '1mb',
  requestTimeoutMs: parseNumber(process.env.REQUEST_TIMEOUT_MS, 15000),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || '',
  mongoMaxPoolSize: parseNumber(process.env.MONGODB_MAX_POOL_SIZE, 30),
  mongoMinPoolSize: parseNumber(process.env.MONGODB_MIN_POOL_SIZE, 5),
  mongoServerSelectionTimeoutMs: parseNumber(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS, 5000),
  mongoSocketTimeoutMs: parseNumber(process.env.MONGODB_SOCKET_TIMEOUT_MS, 45000),
  redisUrl: process.env.REDIS_URL || '',
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitGlobalMax: parseNumber(process.env.RATE_LIMIT_GLOBAL_MAX, 1500),
  rateLimitAuthMax: parseNumber(process.env.RATE_LIMIT_AUTH_MAX, 25),
  rateLimitUploadMax: parseNumber(process.env.RATE_LIMIT_UPLOAD_MAX, 40),
  rateLimitSearchMax: parseNumber(process.env.RATE_LIMIT_SEARCH_MAX, 100),
  rateLimitReportMax: parseNumber(process.env.RATE_LIMIT_REPORT_MAX, 40),
  rateLimitVerificationMax: parseNumber(process.env.RATE_LIMIT_VERIFICATION_MAX, 80),
  rateLimitNotificationMax: parseNumber(process.env.RATE_LIMIT_NOTIFICATION_MAX, 180),
};

module.exports = env;
