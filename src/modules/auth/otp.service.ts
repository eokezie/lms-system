// src/modules/auth/otp.service.ts

import crypto from "crypto";
import { redisConnection } from "@/config/redis";
import { logger } from "@/utils/logger";

const OTP_TTL = 10 * 60; // 10 minutes in seconds
const OTP_LENGTH = 6;

export const generateOTP = (): string => {
	// Cryptographically secure OTP
	return crypto.randomInt(100000, 999999).toString();
};

export const saveOTP = async (userId: string, otp: string): Promise<void> => {
	const key = `otp:${userId}`;
	await redisConnection.setex(key, OTP_TTL, otp);
	logger.info({ userId }, "OTP saved to Redis");
};

export const verifyOTP = async (
	userId: string,
	otp: string,
): Promise<boolean> => {
	const key = `otp:${userId}`;
	const storedOtp = await redisConnection.get(key);

	if (!storedOtp) {
		logger.warn({ userId }, "OTP not found or expired");
		return false;
	}

	const isValid = storedOtp === otp;

	if (isValid) {
		// Delete OTP after successful verification (one-time use)
		await redisConnection.del(key);
		logger.info({ userId }, "OTP verified and deleted");
	} else {
		logger.warn({ userId }, "Invalid OTP provided");
	}

	return isValid;
};

export const deleteOTP = async (userId: string): Promise<void> => {
	await redisConnection.del(`otp:${userId}`);
};
