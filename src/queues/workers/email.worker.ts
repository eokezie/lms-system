import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/config/redis';
import { EmailJobData } from '@/queues/email.queue';
import { logger } from '@/utils/logger';

/**
 * This worker runs in the background, pulling jobs off the email queue.
 * If you later split into separate containers, move this to workers.ts
 * and run it as its own process — zero code changes needed.
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { template, ...data } = job.data;

  logger.info(`[EmailWorker] Processing job ${job.id} — template: ${template}`);

  switch (template) {
    case 'welcome':
      await sendWelcomeEmail(data);
      break;
    case 'enrollment-confirmation':
      await sendEnrollmentConfirmation(data);
      break;
    case 'course-completion':
      await sendCourseCompletion(data);
      break;
    case 'assessment-passed':
      await sendAssessmentPassed(data);
      break;
    default:
      logger.warn(`[EmailWorker] Unknown template: ${template}`);
  }
}

// --- Placeholder senders (replace with nodemailer / Resend / SES) ---

async function sendWelcomeEmail(data: Partial<EmailJobData>): Promise<void> {
  logger.info('[EmailWorker] Sending welcome email', { to: data.email });
  // TODO: implement with your email provider
}

async function sendEnrollmentConfirmation(data: Partial<EmailJobData>): Promise<void> {
  logger.info('[EmailWorker] Sending enrollment confirmation', { studentId: data.studentId });
  // TODO: look up student email from DB, then send
}

async function sendCourseCompletion(data: Partial<EmailJobData>): Promise<void> {
  logger.info('[EmailWorker] Sending course completion email', { studentId: data.studentId });
  // TODO: implement
}

async function sendAssessmentPassed(data: Partial<EmailJobData>): Promise<void> {
  logger.info('[EmailWorker] Sending assessment passed email', { studentId: data.studentId });
  // TODO: implement
}

// --- Worker instance ---

export const emailWorker = new Worker<EmailJobData>('email', processEmailJob, {
  connection: redisConnection,
  concurrency: 5, // process up to 5 jobs at the same time
});

emailWorker.on('completed', (job) => {
  logger.debug(`[EmailWorker] Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`[EmailWorker] Job ${job?.id} failed`, { error: err.message });
});
