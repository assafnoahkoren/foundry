import Redis from 'ioredis';

/**
 * Create a Redis connection for BullMQ
 * BullMQ requires specific Redis settings for optimal performance
 */
export const createRedisConnection = () => {
  const connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '13007', 10),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false, // Required for BullMQ
  });

  connection.on('error', (error) => {
    console.error('Redis connection error:', error);
  });


  return connection;
};

/**
 * Get Redis connection options for BullMQ
 * This returns the options object instead of a connection instance
 */
export const getRedisOptions = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '13007', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});