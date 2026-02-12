import { eventBus } from '@/events/eventBus';
import { emailQueue } from '@/queues/email.queue';
import { logger } from '@/utils/logger';

/**
 * NotificationService registers listeners on the EventBus.
 * It reacts to things that happen elsewhere in the app without
 * being directly called by those modules.
 *
 * Call registerListeners() once at startup in server.ts
 */
class NotificationService {
  registerListeners(): void {
    eventBus.on('student.enrolled', this.onStudentEnrolled.bind(this));
    eventBus.on('course.completed', this.onCourseCompleted.bind(this));
    eventBus.on('user.registered', this.onUserRegistered.bind(this));
    eventBus.on('assessment.submitted', this.onAssessmentSubmitted.bind(this));

    logger.info('[NotificationService] Event listeners registered');
  }

  private async onStudentEnrolled({ studentId, courseId }: { studentId: string; courseId: string }) {
    logger.debug(`[NotificationService] student.enrolled — studentId=${studentId}`);

    // Queue an email — persisted in Redis, survives restarts
    await emailQueue.add(
      'enrollment-confirmation',
      { studentId, courseId, template: 'enrollment-confirmation' },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  private async onCourseCompleted({ studentId, courseId }: { studentId: string; courseId: string }) {
    logger.debug(`[NotificationService] course.completed — studentId=${studentId}`);

    await emailQueue.add(
      'course-completion',
      { studentId, courseId, template: 'course-completion' },
      { attempts: 3 },
    );
  }

  private async onUserRegistered({ userId, email }: { userId: string; email: string }) {
    logger.debug(`[NotificationService] user.registered — email=${email}`);

    await emailQueue.add(
      'welcome-email',
      { userId, email, template: 'welcome' },
      { attempts: 3 },
    );
  }

  private async onAssessmentSubmitted({
    studentId,
    assessmentId,
    passed,
  }: {
    studentId: string;
    assessmentId: string;
    passed: boolean;
  }) {
    if (passed) {
      await emailQueue.add(
        'assessment-passed',
        { studentId, assessmentId, template: 'assessment-passed' },
        { attempts: 3 },
      );
    }
  }
}

export const notificationService = new NotificationService();
