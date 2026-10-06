const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

let redisClient = null;
let redisReady = false;

const initRedis = async () => {
  if (!env.redisUrl) {
    logger.info('REDIS_URL not provided. Redis-backed features will gracefully fallback.');
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    lazyConnect: false,
  });

  redisClient.on('ready', () => {
    redisReady = true;
    logger.info('Redis connection is ready');
  });

  redisClient.on('error', (error) => {
    redisReady = false;
    logger.warn({ error: error.message }, 'Redis error. Falling back for non-critical features.');
  });

  redisClient.on('end', () => {
    redisReady = false;
    logger.warn('Redis connection ended');
  });

  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    redisReady = false;
    logger.warn({ error: error.message }, 'Redis connect failed. App will continue without Redis.');
    return null;
  }
};

const getRedis = () => redisClient;
const isRedisReady = () => Boolean(redisClient && redisReady && redisClient.status === 'ready');

const closeRedis = async () => {
  if (!redisClient) return;

  try {
    await redisClient.quit();
  } catch (error) {
    logger.warn({ error: error.message }, 'Redis quit failed; disconnecting forcefully');
    redisClient.disconnect();
  } finally {
    redisClient = null;
    redisReady = false;
  }
};

module.exports = { initRedis, getRedis, isRedisReady, closeRedis };
