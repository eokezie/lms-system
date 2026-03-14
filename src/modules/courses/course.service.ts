import mongoose from "mongoose";

import { logger } from "@/utils/logger";
import { CreateCourseDto, ExploreCoursesQuery } from "./course.types";
import {
  createCourse,
  findCourseBySlug,
  findCourseByIdOrSlugForStudent,
  findCoursesPaginated,
  findRelatedPublishedCourses,
  updateCourseById,
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
