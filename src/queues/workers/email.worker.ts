import { Worker, Job } from "bullmq";
import { redisConnection } from "@/config/redis";
import { EmailJobData } from "@/queues/email.queue";
import { logger } from "@/utils/logger";
import {
  otpEmailTemplate,
  welcomeEmailTemplate,
  emailVerificationTemplate,
  forgotPasswordTemplate,
  passwordChangedTemplate,
  enrollmentConfirmationTemplate,
  paymentConfirmationTemplate,
  inactivityTemplate,
} from "@/queues/emails/templates";
import { env } from "@/config/env";

// async function sendWelcomeEmail(data: Partial<EmailJobData>): Promise<void> {
// 	logger.info({ to: data.email }, "[email-worker] sending welcome email");
// 	// TODO: implement with your email provider
// }

// async function sendEnrollmentConfirmation(
// 	data: Partial<EmailJobData>,
// ): Promise<void> {
// 	logger.info(
// 		{ studentId: data.studentId },
// 		"[email-worker] sending enrollment confirmation",
// 	);
// 	// TODO: look up student email from DB then send
// }

// async function sendCourseCompletion(
// 	data: Partial<EmailJobData>,
// ): Promise<void> {
// 	logger.info(
// 		{ studentId: data.studentId },
// 		"[email-worker] sending course completion email",
// 	);
// 	// TODO: implement
// }

// async function sendAssessmentPassed(
// 	data: Partial<EmailJobData>,
// ): Promise<void> {
// 	logger.info(
// 		{ studentId: data.studentId },
// 		"[email-worker] sending assessment passed email",
// 	);
// 	// TODO: implement
// }

async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  // Lazy import to avoid initialization issues
  const transporter = (await import("@/config/mailer")).default;

  await transporter.sendMail({
    from: `"Infinix Tech" <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
}

// --- Job processor ---
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { template, ...data } = job.data;
  logger.info({ jobId: job.id, template }, "[email-worker] processing job");

  // switch (template) {
  // 	case "welcome":
  // 		await sendWelcomeEmail(data);
  // 		break;
  // 	case "enrollment-confirmation":
  // 		await sendEnrollmentConfirmation(data);
  // 		break;
  // 	case "course-completion":
  // 		await sendCourseCompletion(data);
  // 		break;
  // 	case "assessment-passed":
  // 		await sendAssessmentPassed(data);
  // 		break;
  // 	default:
  // 		logger.warn({ template }, "[email-worker] unknown template, skipping");
  // }

  switch (template) {
    case "welcome":
      await sendEmail(
        data.email!,
        "Welcome to Infinix Tech",
        welcomeEmailTemplate({
          firstName: data.firstName ?? data.name ?? "there",
          loginLink: data.loginLink ?? "#",
        }),
      );
      break;

    case "otp":
      await sendEmail(
        data.email!,
        "Your verification code – Infinix Tech",
        otpEmailTemplate(data.otp!, data.name ?? data.firstName ?? "there"),
      );
      break;

    case "email-verification":
      await sendEmail(
        data.email!,
        "Confirm Email Address – Infinix Tech",
        emailVerificationTemplate({
          firstName: data.firstName ?? data.name ?? "there",
          verificationCode: data.otp ?? data.verificationCode,
          verificationLink: data.verificationLink ?? "#",
        }),
      );
      break;

    case "forgot-password":
      await sendEmail(
        data.email!,
        "Forgot Password – Infinix Tech",
        forgotPasswordTemplate({
          firstName: data.firstName ?? data.name ?? "there",
          recoveryCode: data.otp ?? data.recoveryCode,
          resetLink: data.resetLink ?? "#",
          timeLimit: data.timeLimit ?? "1 hour",
        }),
      );
      break;

    case "password-changed":
      await sendEmail(
        data.email!,
        "Your password was updated – Infinix Tech",
        passwordChangedTemplate({
          firstName: data.firstName ?? data.name ?? "there",
        }),
      );
      break;

    case "enrollment-confirmation":
      await sendEmail(
        data.email!,
        "Course Enrollment Confirmation – Infinix Tech",
        enrollmentConfirmationTemplate({
          firstName: data.firstName ?? data.name ?? "there",
          courseName: data.courseName ?? "your course",
          courseLink: data.courseLink ?? "#",
        }),
      );
      break;

    case "payment-confirmation":
      await sendEmail(
        data.email!,
        "Payment Confirmation – Infinix Tech",
        paymentConfirmationTemplate({
          firstName: data.firstName ?? data.name ?? "there",
          courseName: data.courseName ?? "your course",
          amount: data.amount ?? "—",
          transactionId: data.transactionId ?? "—",
          paymentDate: data.paymentDate ?? "—",
          courseLink: data.courseLink ?? "#",
        }),
      );
      break;

    case "inactivity":
      await sendEmail(
        data.email!,
        "We miss you – Infinix Tech",
        inactivityTemplate({
          firstName: data.firstName ?? data.name ?? "there",
          dashboardLink: data.dashboardLink ?? data.loginLink ?? "#",
        }),
      );
      break;

    default:
      logger.warn({ template }, "[email-worker] unknown template, skipping");
  }
}

// --- Worker (started automatically when this file is imported) ---

const emailWorker = new Worker<EmailJobData>("email", processEmailJob, {
  // @ts-ignore
  connection: redisConnection,
  concurrency: 5,
});

emailWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "[email-worker] job completed");
});

emailWorker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, error: err.message },
    "[email-worker] job failed",
  );
});

export { emailWorker };

// import { Worker, Job } from "bullmq";
// import { EmailJobData } from "@/queues/email.queue";
// import { logger } from "@/utils/logger";

// async function sendWelcomeEmail(data: Partial<EmailJobData>): Promise<void> {
// 	logger.info({ to: data.email }, "[email-worker] sending welcome email");
// }

// async function sendEnrollmentConfirmation(
// 	data: Partial<EmailJobData>,
// ): Promise<void> {
// 	logger.info(
// 		{ studentId: data.studentId },
// 		"[email-worker] sending enrollment confirmation",
// 	);
// }

// async function sendCourseCompletion(
// 	data: Partial<EmailJobData>,
// ): Promise<void> {
// 	logger.info(
// 		{ studentId: data.studentId },
// 		"[email-worker] sending course completion email",
// 	);
// }

// async function sendAssessmentPassed(
// 	data: Partial<EmailJobData>,
// ): Promise<void> {
// 	logger.info(
// 		{ studentId: data.studentId },
// 		"[email-worker] sending assessment passed email",
// 	);
// }

// async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
// 	const { template, ...data } = job.data;
// 	logger.info({ jobId: job.id, template }, "[email-worker] processing job");

// 	switch (template) {
// 		case "welcome":
// 			await sendWelcomeEmail(data);
// 			break;
// 		case "enrollment-confirmation":
// 			await sendEnrollmentConfirmation(data);
// 			break;
// 		case "course-completion":
// 			await sendCourseCompletion(data);
// 			break;
// 		case "assessment-passed":
// 			await sendAssessmentPassed(data);
// 			break;
// 		default:
// 			logger.warn({ template }, "[email-worker] unknown template, skipping");
// 	}
// }

// // Don't initialize at module load - export a function instead
// export function startEmailWorker(): void {
// 	// Import redisConnection here, AFTER redis is connected
// 	const { redisConnection } = require("@/config/redis");

// 	const emailWorker = new Worker<EmailJobData>("email", processEmailJob, {
// 		connection: redisConnection,
// 		concurrency: 5,
// 	});

// 	emailWorker.on("completed", (job) => {
// 		logger.debug({ jobId: job.id }, "[email-worker] job completed");
// 	});

// 	emailWorker.on("failed", (job, err) => {
// 		logger.error(
// 			{ jobId: job?.id, error: err.message },
// 			"[email-worker] job failed",
// 		);
// 	});

// 	logger.info("[email-worker] started");
// }
