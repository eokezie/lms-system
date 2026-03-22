import mongoose from "mongoose";
import { z } from "zod";
import { ApiError } from "@/utils/apiError";
import type { UserRole } from "@/modules/users/user.model";
import { findLessonById } from "@/modules/lessons/lesson.repository";
import { findEnrollmentByStudentAndCourse } from "@/modules/enrollments/enrollment.repository";
import { isCourseOwnedByInstructor } from "@/modules/courses/course.repository";
import {
  createLessonFlag,
  findLessonFlagById,
  findLessonFlagByIdPopulated,
  findLessonFlagsPaginated,
  updateLessonFlagById,
} from "./lesson-flag.repository";
import {
  createLessonFlagSchema,
  listLessonFlagsQuerySchema,
  patchLessonFlagSchema,
} from "./lesson-flag.validation";

export async function createLessonFlagService(
  body: z.infer<typeof createLessonFlagSchema>,
  studentId: string,
  role: UserRole,
) {
  if (role !== "student") {
    throw ApiError.forbidden("Only students can flag lessons");
  }

  const { courseId, lessonId, reason, description } = body;

  const lesson = await findLessonById(lessonId);
  if (!lesson) throw ApiError.notFound("Lesson not found");

  if (String(lesson.course) !== courseId) {
    throw ApiError.badRequest("Lesson does not belong to this course");
  }

  const enrollment = await findEnrollmentByStudentAndCourse(
    studentId,
    courseId,
  );
  if (!enrollment || enrollment.status === "dropped") {
    throw ApiError.forbidden(
      "You must be enrolled in this course to flag a lesson",
    );
  }

  const flag = await createLessonFlag({
    studentId,
    courseId,
    lessonId,
    reason,
    description,
  });

  return findLessonFlagByIdPopulated(flag._id.toString());
}

export async function listLessonFlagsService(
  query: z.infer<typeof listLessonFlagsQuerySchema>,
  role: UserRole,
  userId: string,
) {
  if (!["instructor", "admin", "super_admin"].includes(role)) {
    throw ApiError.forbidden("Insufficient permissions");
  }

  const instructorId = role === "instructor" ? userId : undefined;

  return findLessonFlagsPaginated({
    page: query.page,
    limit: query.limit,
    status: query.status,
    search: query.search,
    sort: query.sort,
    instructorId,
  });
}

async function assertCanAccessFlag(
  flagId: string,
  role: UserRole,
  userId: string,
): Promise<void> {
  const flag = await findLessonFlagById(flagId);
  if (!flag) throw ApiError.notFound("Flag not found");

  if (role === "instructor") {
    const owns = await isCourseOwnedByInstructor(
      flag.course.toString(),
      userId,
    );
    if (!owns) {
      throw ApiError.forbidden(
        "You can only manage flags for your own courses",
      );
    }
  } else if (role !== "admin" && role !== "super_admin") {
    throw ApiError.forbidden("Insufficient permissions");
  }
}

export async function getLessonFlagByIdService(
  id: string,
  role: UserRole,
  userId: string,
) {
  await assertCanAccessFlag(id, role, userId);
  const doc = await findLessonFlagByIdPopulated(id);
  if (!doc) throw ApiError.notFound("Flag not found");
  return doc;
}

export async function patchLessonFlagService(
  id: string,
  data: z.infer<typeof patchLessonFlagSchema>,
  role: UserRole,
  userId: string,
) {
  await assertCanAccessFlag(id, role, userId);

  const update: Parameters<typeof updateLessonFlagById>[1] = {};

  if (data.adminNote !== undefined) {
    update.adminNote = data.adminNote;
  }

  if (data.status === "reviewed") {
    update.status = "reviewed";
    update.reviewedAt = new Date();
    update.reviewedBy = new mongoose.Types.ObjectId(userId);
  }

  const updated = await updateLessonFlagById(id, update);
  if (!updated) throw ApiError.notFound("Flag not found");

  return findLessonFlagByIdPopulated(id);
}
