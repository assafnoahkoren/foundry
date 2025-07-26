import Redis from 'ioredis';
import { config } from '../../shared/config/config';

/**
 * Create a Redis connection for BullMQ
 * BullMQ requires specific Redis settings for optimal performance
 */
export const createRedisConnection = () => {
  const connection = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
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
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});