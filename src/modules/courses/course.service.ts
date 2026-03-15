import mongoose from "mongoose";

import { logger } from "@/utils/logger";
import {
  CreateCourseDto,
  ExploreCoursesQuery,
  ManageCoursesQuery,
} from "./course.types";
import {
  createCourse,
  findCourseBySlug,
  findCourseById,
  findCourseByIdOrSlugForStudent,
  findCoursesPaginated,
  findCoursesForManagePaginated,
  findRelatedPublishedCourses,
  updateCourseById,
  deleteCourseById,
  getTotalEnrollmentCount,
  getHighestRatedCourse,
  isCourseOwnedByInstructor,
} from "./course.repository";
import { ApiError } from "@/utils/apiError";
import { findInstructorIdsByIsInfinix } from "../users/user.repository";
import { CourseStatus } from "./course.model";
import { findLessonsByIdsLean } from "../lessons/lesson.repository";

export async function getSingleCourseWithModulesAndLessons(idOrSlug: string) {
  const course = await findCourseByIdOrSlugForStudent(idOrSlug);
  if (!course) throw ApiError.notFound("Course not found");

  const modules = (course as any).courseModules || [];
  const lessonIds: mongoose.Types.ObjectId[] = [];
  for (const m of modules) {
    const list = m.lessons || [];
    for (const lid of list) {
      const id =
        lid && typeof lid === "object" && (lid as any)._id != null
          ? (lid as any)._id
          : lid;
      if (id)
        lessonIds.push(
          id instanceof mongoose.Types.ObjectId
            ? id
            : new mongoose.Types.ObjectId(String(id)),
        );
    }
  }

  const lessonsMap = new Map<string, any>();
  if (lessonIds.length > 0) {
    const lessons = await findLessonsByIdsLean(lessonIds);
    lessons.forEach((l) => lessonsMap.set(String(l._id), l));
  }

  const shapeLessonForResponse = (lesson: any) => {
    if (!lesson) return null;
    const out = { ...lesson };
    if (out.type !== "quiz") delete out.questions;
    return out;
  };

  const courseModules = modules.map((mod: any) => ({
    sectionTitle: mod.sectionTitle,
    moduleId: mod.moduleId,
    lessons: (mod.lessons || [])
      .map((lid: any) => {
        const id =
          lid && typeof lid === "object" && lid._id != null
            ? String(lid._id)
            : String(lid);
        return shapeLessonForResponse(lessonsMap.get(id) ?? null);
      })
      .filter(Boolean),
  }));

  return {
    ...course,
    courseModules,
  };
}

export async function getRelatedCoursesService(
  courseId: string,
  limit: number = 3,
) {
  const course = await findCourseByIdOrSlugForStudent(courseId);
  if (!course) throw ApiError.notFound("Course not found");
  const categoryId = course.category as unknown as mongoose.Types.ObjectId;
  if (!categoryId) return [];
  const related = await findRelatedPublishedCourses(
    categoryId,
    (course as any)._id.toString(),
    limit,
  );
  return related;
}

export async function getManageCoursesService(
  query: ManageCoursesQuery,
  userId: string,
  userRole: string,
) {
  const instructorId = userRole === "instructor" ? userId : undefined;
  return findCoursesForManagePaginated(query, instructorId);
}

export async function getCourseStatsService() {
  const [totalEnrollment, highestRatedCourse] = await Promise.all([
    getTotalEnrollmentCount(),
    getHighestRatedCourse(),
  ]);
  return { totalEnrollment, highestRatedCourse };
}

export async function updateCourseService(
  courseId: string,
  userId: string,
  userRole: string,
  dto: Partial<{
    title: string;
    description: string;
    summary: string;
    coverImage: string;
    category: string;
    tags: string[];
    price: number;
    isFree: boolean;
    status: (typeof CourseStatus)[keyof typeof CourseStatus];
  }>,
) {
  const course = await findCourseById(courseId);
  if (!course) throw ApiError.notFound("Course not found");
  if (userRole === "instructor") {
    const isOwner = await isCourseOwnedByInstructor(courseId, userId);
    if (!isOwner) throw ApiError.forbidden("You can only edit your own course");
  }
  const updated = await updateCourseById(courseId, dto as any);
  if (!updated) throw ApiError.notFound("Course not found");
  logger.info({ courseId, userId }, "Course updated");
  return updated;
}

export async function deleteCourseService(
  courseId: string,
  userId: string,
  userRole: string,
) {
  const course = await findCourseById(courseId);
  if (!course) throw ApiError.notFound("Course not found");
  if (userRole === "instructor") {
    const isOwner = await isCourseOwnedByInstructor(courseId, userId);
    if (!isOwner)
      throw ApiError.forbidden("You can only delete your own course");
  }
  const deleted = await deleteCourseById(courseId);
  if (!deleted) throw ApiError.notFound("Course not found");
  logger.info({ courseId, userId }, "Course deleted");
  return { deleted: true };
}

export async function getExploreCoursesService(query: ExploreCoursesQuery) {
  let instructorIds: string[] | undefined;
  if (query.instructorType) {
    const isInfinix = query.instructorType === "infinix";
    const ids = await findInstructorIdsByIsInfinix(isInfinix);
    instructorIds = ids.map((id) => id.toString());
  }

  const result = await findCoursesPaginated({
    page: query.page,
    limit: query.limit,
    category: query.category,
    status: CourseStatus.published,
    search: query.search,
    skillLevel: query.difficulty,
    price: query.price,
    instructorIds,
    avgTimeToComplete: query.avgTimeToComplete,
  });
  return result;
}

export async function createCourseService(dto: CreateCourseDto) {
  const slug = dto.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const courseExists = await findCourseBySlug(slug);
  if (courseExists)
    throw ApiError.conflict("A course with this title already exists");

  console.log(dto);
  const course = await createCourse(dto);

  logger.info({ courseId: course._id, title: course.title }, "Course created!");

  return course;
}

export async function updateCoursePriceService(
  courseId: string,
  dto: { price: number },
) {
  const updated = await updateCourseById(courseId, {
    price: dto.price,
    isFree: dto.price === 0,
  });
  if (!updated) throw ApiError.notFound("Course not found");

  logger.info(
    { courseId: updated._id, price: updated.price },
    "Course price updated",
  );
  return updated;
}
