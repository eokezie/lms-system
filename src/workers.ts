/**
 * Standalone worker process entry point.
 *
 * Run this separately from the API when you're ready to split:
 *   docker compose: command: npm run start:worker
 *
 * This process has NO Express server — it only processes queue jobs.
 * It connects to the same external MongoDB and Redis as the API.
 */
import './config/env';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';

// Import all workers — importing them starts them automatically
import './queues/workers/email.worker';
// import './queues/workers/notification.worker'; // add as you create more

async function startWorkers(): Promise<void> {
  try {
    logger.info('Starting worker process...');

    await connectDB();
    await connectRedis();

    logger.info('✅  Workers running. Waiting for jobs...');
  } catch (err) {
    logger.error('Failed to start workers', { error: (err as Error).message });
    process.exit(1);
  }
}

startWorkers();
