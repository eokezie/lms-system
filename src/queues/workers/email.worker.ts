import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/config/redis';
import { EmailJobData } from '@/queues/email.queue';
import { logger } from '@/utils/logger';

// --- Individual senders (replace with nodemailer / Resend / SES) ---

async function sendWelcomeEmail(data: Partial<EmailJobData>): Promise<void> {
  logger.info({ to: data.email }, '[email-worker] sending welcome email');
  // TODO: implement with your email provider
}

async function sendEnrollmentConfirmation(data: Partial<EmailJobData>): Promise<void> {
  logger.info({ studentId: data.studentId }, '[email-worker] sending enrollment confirmation');
  // TODO: look up student email from DB then send
}

async function sendCourseCompletion(data: Partial<EmailJobData>): Promise<void> {
  logger.info({ studentId: data.studentId }, '[email-worker] sending course completion email');
  // TODO: implement
}

async function sendAssessmentPassed(data: Partial<EmailJobData>): Promise<void> {
  logger.info({ studentId: data.studentId }, '[email-worker] sending assessment passed email');
  // TODO: implement
}

// --- Job processor ---

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { template, ...data } = job.data;
  logger.info({ jobId: job.id, template }, '[email-worker] processing job');

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
      logger.warn({ template }, '[email-worker] unknown template, skipping');
  }
}

// --- Worker (started automatically when this file is imported) ---

const emailWorker = new Worker<EmailJobData>('email', processEmailJob, {
  connection: redisConnection,
  concurrency: 5,
});

emailWorker.on('completed', (job) => {
  logger.debug({ jobId: job.id }, '[email-worker] job completed');
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, '[email-worker] job failed');
});

export { emailWorker };
