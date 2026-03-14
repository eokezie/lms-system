import { logger } from "@/utils/logger";
import { CreateCourseDto, ExploreCoursesQuery } from "./course.types";
import {
  createCourse,
  findCourseBySlug,
  findCoursesPaginated,
} from "./course.repository";
import { ApiError } from "@/utils/apiError";
import { findInstructorIdsByIsInfinix } from "../users/user.repository";
import { CourseStatus } from "./course.model";

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
