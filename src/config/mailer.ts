import nodemailer from "nodemailer";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

const transporter = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: env.SMTP_PORT,
	secure: env.SMTP_PORT === 465, // true for 465 (SSL), false for 587 (TLS)
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASS,
	},
	tls: {
		rejectUnauthorized: false, // Sometimes needed for Namecheap
	},
});

// Verify connection on startup
export const verifyMailer = async (): Promise<void> => {
	try {
		await transporter.verify();
		logger.info("✉️  Mailer connected and ready");
	} catch (err: any) {
		logger.error({ err }, "Mailer connection failed");
		throw err;
	}
};

export default transporter;
