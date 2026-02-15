// import "./config/env"; // validate env first — fail fast before anything else
// import { connectDB } from "./config/db";
// import { connectRedis } from "./config/redis";
// import { logger } from "./utils/logger";
// import { registerNotificationListeners } from "./modules/notifications/notification.service";
// import "./queues/workers/email.worker"; // starts the worker automatically
// import app from "./config/app";
// import { startEmailWorker } from "./queues/workers/email.worker";

// const PORT = process.env.PORT || 3000;

// async function bootstrap(): Promise<void> {
// 	try {
// 		// 1. Connect to external MongoDB
// 		logger.info("Connecting to MongoDB...");
// 		await connectDB();

// 		// 2. Connect to Redis
// 		logger.info("Connecting to Redis...");
// 		await connectRedis();

// 		// Start workers AFTER Redis is connected
// 		startEmailWorker();
// 		logger.info("Email worker started");

// 		// Register EventBus listeners (NotificationService listens to domain events)
// 		registerNotificationListeners();

// 		// Start Express
// 		const server = app.listen(PORT, () => {
// 			logger.info(
// 				`🚀  LMS API running on port ${PORT} [${process.env.NODE_ENV}]`,
// 			);
// 		});

// 		// --- Graceful shutdown ---
// 		const shutdown = async (signal: string) => {
// 			logger.info(`${signal} received — shutting down gracefully...`);

// 			server.close(async () => {
// 				const { disconnectDB } = await import("./config/db");
// 				const { disconnectRedis } = await import("./config/redis");

// 				await disconnectDB();
// 				await disconnectRedis();

// 				logger.info("Cleanup complete. Goodbye.");
// 				process.exit(0);
// 			});

// 			// Force shutdown if graceful close takes too long
// 			setTimeout(() => {
// 				logger.error("Forced shutdown after timeout");
// 				process.exit(1);
// 			}, 10_000);
// 		};

// 		process.on("SIGTERM", () => shutdown("SIGTERM"));
// 		process.on("SIGINT", () => shutdown("SIGINT"));
// 	} catch (err: any) {
// 		logger.error("Failed to start server", err.message);
// 		console.error("Error >>", {
// 			message: err.message,
// 			stack: err.stack,
// 			cause: err.cause,
// 			full: err,
// 		});
// 		process.exit(1);
// 	}
// }

// bootstrap();

// import "./config/env"; // This must stay static - needs to run first

// const PORT = process.env.PORT || 3000;

// async function bootstrap(): Promise<void> {
// 	try {
// 		const [
// 			{ connectDB },
// 			{ connectRedis },
// 			{ logger },
// 			{ registerNotificationListeners },
// 			{ startEmailWorker },
// 			{ default: app },
// 		] = await Promise.all([
// 			import("./config/db"),
// 			import("./config/redis"),
// 			import("./utils/logger"),
// 			import("./modules/notifications/notification.service"),
// 			import("./queues/workers/email.worker"),
// 			import("./config/app"),
// 		]);

// 		logger.info("Connecting to MongoDB...");
// 		await connectDB();

// 		logger.info("Connecting to Redis...");
// 		await connectRedis();

// 		startEmailWorker();
// 		logger.info("Email worker started");

// 		registerNotificationListeners();

// 		const server = app.listen(PORT, () => {
// 			logger.info(
// 				`🚀 LMS API running on port ${PORT} [${process.env.NODE_ENV}]`,
// 			);
// 		});

// 		const shutdown = async (signal: string) => {
// 			logger.info(`${signal} received — shutting down gracefully...`);
// 			server.close(async () => {
// 				const { disconnectDB } = await import("./config/db");
// 				const { disconnectRedis } = await import("./config/redis");
// 				await disconnectDB();
// 				await disconnectRedis();
// 				logger.info("Cleanup complete. Goodbye.");
// 				process.exit(0);
// 			});
// 			setTimeout(() => {
// 				logger.error("Forced shutdown after timeout");
// 				process.exit(1);
// 			}, 10_000);
// 		};

// 		process.on("SIGTERM", () => shutdown("SIGTERM"));
// 		process.on("SIGINT", () => shutdown("SIGINT"));
// 	} catch (err: any) {
// 		console.error("Bootstrap failed:", err.message);
// 		console.error("Stack:", err.stack);
// 		process.exit(1);
// 	}
// }

// bootstrap();

import "./config/env";

// Wrap everything else to catch import failures
async function bootstrap(): Promise<void> {
	try {
		const { connectDB, disconnectDB } = await import("./config/db");
		const { connectRedis, disconnectRedis } = await import("./config/redis");
		const { logger } = await import("./utils/logger");
		const { registerNotificationListeners } =
			await import("./modules/notifications/notification.service");

		console.log("✓ All imports loaded"); // Use console.log to bypass logger issues

		await import("./queues/workers/email.worker");
		console.log("✓ Email worker loaded");

		const { default: app } = await import("./config/app");
		console.log("✓ App loaded");

		const PORT = process.env.PORT || 3000;

		console.log("Connecting to MongoDB...");
		await connectDB();
		console.log("✓ MongoDB connected");

		console.log("Connecting to Redis...");
		await connectRedis();
		console.log("✓ Redis connected");

		registerNotificationListeners();
		console.log("✓ Notification listeners registered");

		const server = app.listen(PORT, () => {
			console.log(
				`🚀 LMS API running on port ${PORT} [${process.env.NODE_ENV}]`,
			);
		});

		const shutdown = async (signal: string) => {
			logger.info(`${signal} received — shutting down gracefully...`); // Fixed syntax
			server.close(async () => {
				await disconnectDB();
				await disconnectRedis();
				logger.info("Cleanup complete. Goodbye.");
				process.exit(0);
			});
			setTimeout(() => {
				logger.error("Forced shutdown after timeout");
				process.exit(1);
			}, 10_000);
		};

		process.on("SIGTERM", () => shutdown("SIGTERM"));
		process.on("SIGINT", () => shutdown("SIGINT"));
	} catch (err: any) {
		console.error("Bootstrap failed at:", err.message);
		console.error("Stack:", err.stack);
		process.exit(1);
	}
}

bootstrap();
