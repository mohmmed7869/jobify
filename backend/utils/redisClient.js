const Redis = require('ioredis');
const { aiLogger } = require('./winstonLogger');

let redisClient = null;

try {
  // Use environment variable for Redis URL (essential for Production/Render)
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redisClient.on('connect', () => {
    aiLogger.info('✅ Redis Client Connected successfully');
  });

  redisClient.on('error', (err) => {
    aiLogger.error(`❌ Redis Client Error: ${err.message}`);
  });
} catch (error) {
  aiLogger.error(`Failed to initialize Redis: ${error.message}`);
}

const getCache = async (key) => {
  if (!redisClient || redisClient.status !== 'ready') return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    aiLogger.error(`Redis GET error for key ${key}: ${error.message}`);
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = 86400) => {
  if (!redisClient || redisClient.status !== 'ready') return false;
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    return true;
  } catch (error) {
    aiLogger.error(`Redis SET error for key ${key}: ${error.message}`);
    return false;
  }
};

module.exports = {
  redisClient,
  getCache,
  setCache
};
