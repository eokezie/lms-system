import mongoose from "mongoose";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

let isConnected = false;

export async function connectDB(): Promise<void> {
	if (isConnected) return;

	mongoose.connection.on("connected", () => {
		logger.info("MongoDB connection established");
	});

	mongoose.connection.on("error", (err) => {
		logger.error("MongoDB connection error", err.message);
	});

	mongoose.connection.on("disconnected", () => {
		logger.warn("MongoDB disconnected — attempting to reconnect...");
		isConnected = false;
	});

	await mongoose.connect(env.MONGODB_URI, {
		// These are good defaults — mongoose 8 handles most things automatically
		dbName: "lmsDB",
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000,
	});

	isConnected = true;
}

export async function disconnectDB(): Promise<void> {
	if (!isConnected) return;
	await mongoose.disconnect();
	isConnected = false;
	logger.info("MongoDB disconnected cleanly");
}
