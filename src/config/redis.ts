import { Redis } from "ioredis";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

// BullMQ requires its own connection instance — do not share with other Redis usage
export const redisConnection = new Redis({
	host: env.REDIS_HOST,
	port: env.REDIS_PORT,
	...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
	maxRetriesPerRequest: null, // Required by BullMQ
	enableReadyCheck: false, // Required by BullMQ
	lazyConnect: true, // Don't connect on instantiation
});

redisConnection.on("connect", () => {
	logger.info("Redis connected");
});

redisConnection.on("error", (err: any) => {
	logger.error("Redis connection error", err.message);
});

export async function connectRedis(): Promise<void> {
	// Only connect if not already connected
	if (
		redisConnection.status === "ready" ||
		redisConnection.status === "connecting"
	) {
		logger.info("Redis already connected, skipping...");
		return;
	}
	await redisConnection.connect();
}

export async function disconnectRedis(): Promise<void> {
	await redisConnection.quit();
	logger.info("Redis disconnected cleanly");
}
