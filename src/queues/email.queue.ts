import { Queue } from 'bullmq';
import { redisConnection } from '@/config/redis';

export interface EmailJobData {
  template: string;
  to?: string;
  email?: string;
  studentId?: string;
  userId?: string;
  courseId?: string;
  assessmentId?: string;
  [key: string]: unknown;
}

export const emailQueue = new Queue<EmailJobData>('email', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s
    },
    removeOnComplete: { count: 100 }, // keep last 100 completed jobs for inspection
    removeOnFail: { count: 50 },
  },
});
