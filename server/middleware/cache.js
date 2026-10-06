const { getRedis, isRedisReady } = require('../config/redis');

const cacheJson = ({ ttlSeconds, keyBuilder }) => {
  return async (req, res, next) => {
    if (!isRedisReady()) {
      return next();
    }

    const redis = getRedis();
    if (!redis) {
      return next();
    }

    const cacheKey = keyBuilder(req);

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        redis
          .set(cacheKey, JSON.stringify(body), 'EX', ttlSeconds)
          .catch(() => {
            // Ignore cache set failures to keep API path stable.
          });
        return originalJson(body);
      };
    } catch (error) {
      // Ignore cache get failures to keep API path stable.
    }

    return next();
  };
};

const invalidateByPattern = async (pattern) => {
  if (!isRedisReady()) return;

  const redis = getRedis();
  if (!redis) return;

  const keys = await redis.keys(pattern);
  if (!keys.length) return;

  await redis.del(...keys);
};

module.exports = { cacheJson, invalidateByPattern };
