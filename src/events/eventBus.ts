import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';

// Typed event map — add new domain events here as the app grows
export interface LMSEvents {
  'student.enrolled': { studentId: string; courseId: string };
  'student.unenrolled': { studentId: string; courseId: string };
  'lesson.completed': { studentId: string; lessonId: string; courseId: string };
  'course.completed': { studentId: string; courseId: string };
  'assessment.submitted': { studentId: string; assessmentId: string; passed: boolean };
  'user.registered': { userId: string; email: string };
  'user.passwordReset': { userId: string; email: string };
}

type EventName = keyof LMSEvents;

class LMSEventBus extends EventEmitter {
  /**
   * Typed emit — TypeScript will complain if you pass the wrong payload shape
   */
  emit<K extends EventName>(event: K, payload: LMSEvents[K]): boolean {
    logger.debug(`[EventBus] emit: ${event}`, { payload });
    return super.emit(event, payload);
  }

  /**
   * Typed listener registration
   */
  on<K extends EventName>(event: K, listener: (payload: LMSEvents[K]) => void): this {
    return super.on(event, listener);
  }

  /**
   * One-time typed listener
   */
  once<K extends EventName>(event: K, listener: (payload: LMSEvents[K]) => void): this {
    return super.once(event, listener);
  }
}

// Singleton — one bus for the whole process
export const eventBus = new LMSEventBus();

// Catch any listener that throws — don't let it crash the process silently
eventBus.on('error', (err: Error) => {
  logger.error('[EventBus] Unhandled error in listener', { error: err.message });
});
