import { Redis } from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

// BullMQ requires its own connection instance — do not share with other Redis usage
export const redisConnection = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Required by BullMQ
  lazyConnect: true,
});

redisConnection.on('connect', () => {
  logger.info('Redis connected');
});

redisConnection.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message });
});

export async function connectRedis(): Promise<void> {
  await redisConnection.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redisConnection.quit();
  logger.info('Redis disconnected cleanly');
}
