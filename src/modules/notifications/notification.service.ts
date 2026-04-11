import { eventBus } from "@/events/eventBus";
// import { emailQueue } from '@/queues/email.queue';
import { logger } from "@/utils/logger";
import { redisConnection } from "@/config/redis";
import { createEmailQueue } from "@/queues/email.queue";

import {
  countUnreadForUser,
  createNotificationDoc,
  deleteNotificationById,
  findNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  type CreateNotificationInput,
} from "./notification.repository";
import { ApiError } from "@/utils/apiError";
import type { ListNotificationsQuery } from "./notification.validation";

const emailQueue = createEmailQueue(redisConnection);

// ---------------------------------------------------------------------------
// In-app notification service (used by the controller / drawer)
// ---------------------------------------------------------------------------

export async function createNotificationService(
  input: CreateNotificationInput,
) {
  return createNotificationDoc(input);
}

export async function listMyNotificationsService(
  userId: string,
  query: ListNotificationsQuery,
) {
  return findNotificationsForUser(userId, query);
}

export async function getMyUnreadCountService(userId: string) {
  return countUnreadForUser(userId);
}

export async function markNotificationReadService(
  userId: string,
  notificationId: string,
) {
  return markNotificationRead(userId, notificationId);
}

export async function markAllNotificationsReadService(userId: string) {
  return markAllNotificationsRead(userId);
}

export async function deleteNotificationService(
  userId: string,
  notificationId: string,
) {
  const deleted = await deleteNotificationById(userId, notificationId);
  if (!deleted) throw ApiError.notFound("Notification not found");
}

async function safeCreate(input: CreateNotificationInput): Promise<void> {
  try {
    await createNotificationDoc(input);
  } catch (err) {
    logger.error(
      { err },
      "[notifications] failed to persist in-app notification",
    );
  }
}

// --- Handlers ---

async function onStudentEnrolled({
  studentId,
  courseId,
}: {
  studentId: string;
  courseId: string;
}) {
  logger.debug({ studentId, courseId }, "[notifications] student.enrolled");
  await emailQueue.add(
    "enrollment-confirmation",
    { studentId, courseId, template: "enrollment-confirmation" },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
  );
  await safeCreate({
    user: studentId,
    type: "enrollment_confirmation",
    title: "You're enrolled in a new course",
    message: "Welcome aboard — start learning whenever you're ready.",
    link: `/my-learning/${courseId}`,
    metadata: { courseId },
  });
}

async function onCourseCompleted({
  studentId,
  courseId,
}: {
  studentId: string;
  courseId: string;
}) {
  logger.debug({ studentId, courseId }, "[notifications] course.completed");
  await emailQueue.add(
    "course-completion",
    { studentId, courseId, template: "course-completion" },
    { attempts: 3 },
  );
  await safeCreate({
    user: studentId,
    type: "certificate_ready",
    title: "Your certificate is ready for download",
    message: "Congrats on finishing the course — grab your certificate.",
    link: `/my-learning/${courseId}/certificate`,
    metadata: { courseId },
  });
}

// Welcome + OTP emails are sent via Resend in auth.service (register), not the queue.
async function onUserRegistered(_payload: { userId: string; email: string }) {
  logger.debug(
    _payload,
    "[notifications] user.registered (emails sent by auth-email.service)",
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
    "assessment-passed",
    { studentId, assessmentId, template: "assessment-passed" },
    { attempts: 3 },
  );
  await safeCreate({
    user: studentId,
    type: "assessment_passed",
    title: "You passed an assessment 🎉",
    message: "Great work — keep the momentum going.",
    metadata: { assessmentId },
  });
}

async function onDiscussionReply({
  recipientId,
  actorId,
  threadId,
  courseId,
  preview,
}: {
  recipientId: string;
  actorId?: string;
  threadId: string;
  courseId: string;
  preview?: string;
}) {
  await safeCreate({
    user: recipientId,
    type: "discussion_reply",
    title: preview
      ? `New reply: "${preview.slice(0, 80)}"`
      : "Someone replied to your discussion",
    actor: actorId ?? null,
    link: `/my-learning/${courseId}?thread=${threadId}`,
    metadata: { threadId, courseId },
  });
}

// --- Registration ---
// Call this once at startup in server.ts

export function registerNotificationListeners(): void {
  eventBus.on("student.enrolled", onStudentEnrolled);
  eventBus.on("course.completed", onCourseCompleted);
  eventBus.on("user.registered", onUserRegistered);
  eventBus.on("assessment.submitted", onAssessmentSubmitted);
  eventBus.on("discussion.reply", onDiscussionReply);

  logger.info("[notifications] Event listeners registered");
}
