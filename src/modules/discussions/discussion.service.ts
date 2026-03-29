import { ApiError } from "@/utils/apiError";
import type { UserRole } from "@/modules/users/user.model";
import {
  findCourseById,
  isCourseOwnedByInstructor,
} from "@/modules/courses/course.repository";
import { hasActiveOrCompletedEnrollment } from "@/modules/enrollments/enrollment.repository";
import { findLessonById } from "@/modules/lessons/lesson.repository";
import { DiscussionThread } from "./discussion.model";
import {
  createDiscussionThread,
  createDiscussionReply,
  findDiscussionThreadById,
  findDiscussionThreadsByCoursePaginated,
  findRepliesByThreadPaginated,
  incrementThreadViews,
  type DiscussionSort,
} from "./discussion.repository";

async function assertCanAccessCourseDiscussions(
  courseId: string,
  userId: string,
  role: UserRole,
): Promise<void> {
  if (role === "admin" || role === "super_admin") return;
  if (role === "instructor") {
    const owns = await isCourseOwnedByInstructor(courseId, userId);
    if (!owns) {
      throw ApiError.forbidden("You can only access discussions for your own courses");
    }
    return;
  }
  if (role === "student") {
    const enrolled = await hasActiveOrCompletedEnrollment(userId, courseId);
    if (!enrolled) {
      throw ApiError.forbidden("You must be enrolled in this course to access discussions");
    }
    return;
  }
  throw ApiError.forbidden("Insufficient permissions");
}

export async function listDiscussionThreadsService(
  courseId: string,
  userId: string,
  role: UserRole,
  query: {
    page: number;
    limit: number;
    lessonId?: string;
    sort: DiscussionSort;
  },
) {
  const course = await findCourseById(courseId);
  if (!course) throw ApiError.notFound("Course not found");
  await assertCanAccessCourseDiscussions(courseId, userId, role);

  const { threads, total } = await findDiscussionThreadsByCoursePaginated(
    courseId,
    query,
  );
  return {
    threads,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit) || 1,
    total,
  };
}

export async function createDiscussionThreadService(
  courseId: string,
  userId: string,
  role: UserRole,
  dto: { title: string; body: string; lessonId?: string | null },
) {
  const course = await findCourseById(courseId);
  if (!course) throw ApiError.notFound("Course not found");

  if (role === "admin" || role === "super_admin") {
    // ok
  } else if (role === "instructor") {
    const owns = await isCourseOwnedByInstructor(courseId, userId);
    if (!owns) {
      throw ApiError.forbidden("You can only create discussions on your own courses");
    }
  } else if (role === "student") {
    const enrolled = await hasActiveOrCompletedEnrollment(userId, courseId);
    if (!enrolled) {
      throw ApiError.forbidden("You must be enrolled in this course to start a discussion");
    }
  } else {
    throw ApiError.forbidden("Insufficient permissions");
  }

  if (dto.lessonId) {
    const lesson = await findLessonById(dto.lessonId);
    if (!lesson) throw ApiError.notFound("Lesson not found");
    if (String(lesson.course) !== courseId) {
      throw ApiError.badRequest("Lesson does not belong to this course");
    }
  }

  const thread = await createDiscussionThread({
    courseId,
    lessonId: dto.lessonId ?? null,
    authorId: userId,
    title: dto.title,
    body: dto.body,
  });
  if (!thread) throw ApiError.internal("Failed to create discussion");
  return thread;
}

export async function getDiscussionThreadDetailService(
  courseId: string,
  threadId: string,
  userId: string,
  role: UserRole,
  repliesQuery: { page: number; limit: number },
) {
  const course = await findCourseById(courseId);
  if (!course) throw ApiError.notFound("Course not found");

  const thread = await findDiscussionThreadById(threadId);
  if (!thread) throw ApiError.notFound("Discussion not found");
  if (String(thread.course) !== courseId) {
    throw ApiError.notFound("Discussion not found");
  }

  await assertCanAccessCourseDiscussions(courseId, userId, role);

  await incrementThreadViews(threadId);

  const [threadDoc, { replies, total }] = await Promise.all([
    DiscussionThread.findById(threadId)
      .populate("author", "firstName lastName avatar role")
      .populate("lesson", "title")
      .lean()
      .exec(),
    findRepliesByThreadPaginated(
      threadId,
      repliesQuery.page,
      repliesQuery.limit,
    ),
  ]);

  return {
    thread: threadDoc,
    replies,
    repliesMeta: {
      page: repliesQuery.page,
      limit: repliesQuery.limit,
      total,
      totalPages: Math.ceil(total / repliesQuery.limit) || 1,
    },
  };
}

export async function createDiscussionReplyService(
  courseId: string,
  threadId: string,
  userId: string,
  role: UserRole,
  dto: { body: string },
) {
  const course = await findCourseById(courseId);
  if (!course) throw ApiError.notFound("Course not found");

  const thread = await findDiscussionThreadById(threadId);
  if (!thread) throw ApiError.notFound("Discussion not found");
  if (String(thread.course) !== courseId) {
    throw ApiError.notFound("Discussion not found");
  }

  await assertCanAccessCourseDiscussions(courseId, userId, role);

  const reply = await createDiscussionReply({
    threadId,
    authorId: userId,
    body: dto.body,
  });
  if (!reply) throw ApiError.notFound("Failed to create reply");
  return reply;
}
