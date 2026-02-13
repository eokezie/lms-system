import { eventBus } from '@/events/eventBus';
import { emailQueue } from '@/queues/email.queue';
import { logger } from '@/utils/logger';

// --- Handlers ---

async function onStudentEnrolled({
  studentId,
  courseId,
}: {
  studentId: string;
  courseId: string;
}) {
  logger.debug({ studentId, courseId }, '[notifications] student.enrolled');
  await emailQueue.add(
    'enrollment-confirmation',
    { studentId, courseId, template: 'enrollment-confirmation' },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
  );
}

async function onCourseCompleted({
  studentId,
  courseId,
}: {
  studentId: string;
  courseId: string;
}) {
  logger.debug({ studentId, courseId }, '[notifications] course.completed');
  await emailQueue.add(
    'course-completion',
    { studentId, courseId, template: 'course-completion' },
    { attempts: 3 },
  );
}

async function onUserRegistered({ userId, email }: { userId: string; email: string }) {
  logger.debug({ userId, email }, '[notifications] user.registered');
  await emailQueue.add(
    'welcome-email',
    { userId, email, template: 'welcome' },
    { attempts: 3 },
  );
}

async function onAssessmentSubmitted({
  studentId,
  assessmentId,
  passed,
}: {
  studentId: string;
  assessmentId: string;
  passed: boolean;
}) {
  if (!passed) return;
  await emailQueue.add(
    'assessment-passed',
    { studentId, assessmentId, template: 'assessment-passed' },
    { attempts: 3 },
  );
}

// --- Registration ---
// Call this once at startup in server.ts

export function registerNotificationListeners(): void {
  eventBus.on('student.enrolled', onStudentEnrolled);
  eventBus.on('course.completed', onCourseCompleted);
  eventBus.on('user.registered', onUserRegistered);
  eventBus.on('assessment.submitted', onAssessmentSubmitted);

  logger.info('[notifications] Event listeners registered');
}
