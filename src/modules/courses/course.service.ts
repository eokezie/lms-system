import mongoose from "mongoose";

import { logger } from "@/utils/logger";
import {
  AdminSubmissionsQuery,
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
  findCoursesForAdminByStatusPaginated,
  findCourseInReviewByIdForAdmin,
  findRelatedPublishedCourses,
  updateCourseById,
  deleteCourseById,
  getTotalEnrollmentCount,
  getHighestRatedCourse,
  isCourseOwnedByInstructor,
} from "./course.repository";
import { ApiError } from "@/utils/apiError";
import { findInstructorIdsByIsInfinix } from "../users/user.repository";
import type { UserRole } from "@/modules/users/user.model";
import { CourseStatus, ICourseModule, ICtaSection } from "./course.model";
import {
  findLessonsByIdsLean,
  type ILessonListItem,
} from "../lessons/lesson.repository";
import { UploadedFiles } from "@/helpers/multerHelper";
import { uploadFile } from "@/libs/spacesFileUpload";
import { parseJsonField } from "@/helpers/parseToJson";

async function attachLessonsToCourseModules(course: Record<string, unknown>) {
  const modules = (course as { courseModules?: unknown[] }).courseModules || [];
  const lessonIds: mongoose.Types.ObjectId[] = [];
  for (const m of modules) {
    const mod = m as { lessons?: unknown[] };
    const list = mod.lessons || [];
    for (const lid of list) {
      const id =
        lid && typeof lid === "object" && lid !== null && "_id" in lid
          ? (lid as { _id: unknown })._id
          : lid;
      if (id)
        lessonIds.push(
          id instanceof mongoose.Types.ObjectId
            ? id
            : new mongoose.Types.ObjectId(String(id)),
        );
    }
  }

  const lessonsMap = new Map<string, ILessonListItem>();
  if (lessonIds.length > 0) {
    const lessons = await findLessonsByIdsLean(lessonIds);
    lessons.forEach((l) => lessonsMap.set(String(l._id), l));
  }

  const shapeLessonForResponse = (lesson: unknown) => {
    if (!lesson) return null;
    const out = { ...(lesson as Record<string, unknown>) };
    if (out.type !== "quiz") delete out.questions;
    return out;
  };

  const courseModules = modules.map((modRaw) => {
    const mod = modRaw as {
      sectionTitle?: string;
      moduleId?: string;
      lessons?: unknown[];
    };
    return {
      sectionTitle: mod.sectionTitle,
      moduleId: mod.moduleId,
      lessons: (mod.lessons || [])
        .map((lid: unknown) => {
          const id =
            lid && typeof lid === "object" && lid !== null && "_id" in lid
              ? String((lid as { _id: unknown })._id)
              : String(lid);
          return shapeLessonForResponse(lessonsMap.get(id) ?? null);
        })
        .filter(Boolean),
    };
  });

  return {
    ...course,
    courseModules,
  };
}

export async function getSingleCourseWithModulesAndLessons(idOrSlug: string) {
  const course = await findCourseByIdOrSlugForStudent(idOrSlug);
  if (!course) throw ApiError.notFound("Course not found");

  return attachLessonsToCourseModules(course as unknown as Record<string, unknown>);
}

export async function getAdminSubmissionInReviewByIdService(courseId: string) {
  const course = await findCourseInReviewByIdForAdmin(courseId);
  if (!course)
    throw ApiError.notFound("Submission not found or not in review");

  return attachLessonsToCourseModules(course);
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

export async function getAdminSubmissionsInReviewService(
  query: AdminSubmissionsQuery,
) {
  return findCoursesForAdminByStatusPaginated("in_review", query);
}

export async function getAdminSubmissionsArchivedService(
  query: AdminSubmissionsQuery,
) {
  return findCoursesForAdminByStatusPaginated("archived", query);
}

export async function getCourseStatsService(
  userId: string,
  userRole: string,
) {
  const instructorId = userRole === "instructor" ? userId : undefined;
  const [totalEnrollment, highestRatedCourse] = await Promise.all([
    getTotalEnrollmentCount(instructorId),
    getHighestRatedCourse(instructorId),
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

export async function createCourseService(
  dto: CreateCourseDto,
  uploadedFiles: UploadedFiles,
  creatorRole: UserRole,
) {
  const { coverImage } = uploadedFiles;

  /** Instructors submit for review; admins create as draft until they choose to publish. */
  const initialStatus =
    creatorRole === "instructor" ? CourseStatus.in_review : CourseStatus.draft;

  const slug = dto.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const courseExists = await findCourseBySlug(slug);
  if (courseExists)
    throw ApiError.conflict("A course with this title already exists");

  // Parse stringified fields
  const requirements = parseJsonField<string[]>(dto.requirements, []);
  const whatToLearn = parseJsonField<string[]>(dto.whatToLearn, []);
  const ctaSection = parseJsonField<ICtaSection>(dto.ctaSection, {
    heading: "",
    subtext: "",
  });
  // Same as requirements: client often sends courseModules as a JSON string.
  // If we don't parse it, Mongoose never gets real subdocs and moduleId is lost → index dupes on null.
  const courseModules = parseJsonField<ICourseModule[]>(dto.courseModules, []);
  for (const mod of courseModules) {
    if (mod && (mod.moduleId == null || mod.moduleId === "")) {
      mod.moduleId = new mongoose.Types.ObjectId().toString();
    }
  }

  const course = await createCourse(
    {
      ...dto,
      slug,
      requirements,
      whatToLearn,
      ctaSection,
      courseModules,
    },
    initialStatus,
  );

  logger.info({ courseId: course._id, title: course.title }, "Course created!");

  try {
    const coverImageData = coverImage
      ? await uploadFile(coverImage, `Courses/${course._id.toString()}`)
      : undefined;

    course.coverImage = coverImageData;
    await course.save();
  } catch (err) {
    await deleteCourseById(course._id.toString()); // rollback
    throw err;
  }

  return course;
}

export async function updateCoursePriceService(
  courseId: string,
  dto: { price?: number; priceNGN?: number; priceUSD?: number },
) {
  const course = await findCourseById(courseId);
  if (!course) throw ApiError.notFound("Course not found");

  if (dto.price !== undefined) {
    course.price = dto.price;
    // If regional NGN price is not explicitly provided, sync it with legacy price.
    if (dto.priceNGN === undefined && (course as any).priceNGN == null) {
      (course as any).priceNGN = dto.price;
    }
  }
  if (dto.priceNGN !== undefined) {
    (course as any).priceNGN = dto.priceNGN;
    // Keep legacy price in sync with NGN by default.
    course.price = dto.priceNGN;
  }
  if (dto.priceUSD !== undefined) {
    (course as any).priceUSD = dto.priceUSD;
  }

  const priceNGN = ((course as any).priceNGN ?? course.price ?? 0) as number;
  const priceUSD = ((course as any).priceUSD ?? 0) as number;
  course.isFree = priceNGN === 0 && priceUSD === 0;

  const updated = await course.save();

  logger.info(
    {
      courseId: updated._id,
      price: updated.price,
      priceNGN: (updated as any).priceNGN,
      priceUSD: (updated as any).priceUSD,
    },
    "Course price updated",
  );
  return updated;
}
