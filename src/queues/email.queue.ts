import { Queue } from "bullmq";
import { redisConnection } from "@/config/redis";
import { logger } from "@/utils/logger";

export interface EmailJobData {
	template:
		| "welcome"
		| "otp"
		| "enrollment-confirmation"
		| "course-completion"
		| "assessment-passed";
	to?: string;
	email?: string;
	studentId?: string;
	userId?: string;
	courseId?: string;
	assessmentId?: string;
	otp?: string;
	name?: string;
	[key: string]: unknown;
}
// export const emailQueue = new Queue<EmailJobData>("email", {
// 	// @ts-ignore
// 	connection: redisConnection,
// 	defaultJobOptions: {
// 		attempts: 3,
// 		backoff: {
// 			type: "exponential",
// 			delay: 5000, // 5s, 10s, 20s
// 		},
// 		removeOnComplete: { count: 100 }, // keep last 100 completed jobs for inspection
// 		removeOnFail: { count: 50 },
// 	},
// });

export function createEmailQueue(redisConnection: any): Queue<EmailJobData> {
	const emailQueue = new Queue<EmailJobData>("email", {
		connection: redisConnection,
		defaultJobOptions: {
			attempts: 3,
			backoff: {
				type: "exponential",
				delay: 2000,
			},
			removeOnComplete: 100, // Keep last 100 completed jobs
			removeOnFail: 50, // Keep last 50 failed jobs
		},
	});

	logger.info("[email-queue] initialized");
	return emailQueue;
}
