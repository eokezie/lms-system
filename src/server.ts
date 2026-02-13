import './config/env'; // validate env first — fail fast before anything else
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { registerNotificationListeners } from './modules/notifications/notification.service';
import './queues/workers/email.worker'; // starts the worker automatically
import app from './config/app';

const PORT = process.env.PORT || 3000;

async function bootstrap(): Promise<void> {
  try {
    // 1. Connect to external MongoDB
    logger.info('Connecting to MongoDB...');
    await connectDB();

    // 2. Connect to Redis
    logger.info('Connecting to Redis...');
    await connectRedis();

    // 3. Register EventBus listeners (NotificationService listens to domain events)
    registerNotificationListeners();

    // 4. Start Express
    const server = app.listen(PORT, () => {
      logger.info(`🚀  LMS API running on port ${PORT} [${process.env.NODE_ENV}]`);
    });

    // --- Graceful shutdown ---
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully...`);

      server.close(async () => {
        const { disconnectDB } = await import('./config/db');
        const { disconnectRedis } = await import('./config/redis');

        await disconnectDB();
        await disconnectRedis();

        logger.info('Cleanup complete. Goodbye.');
        process.exit(0);
      });

      // Force shutdown if graceful close takes too long
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', { error: (err as Error).message });
    process.exit(1);
  }
}

bootstrap();
