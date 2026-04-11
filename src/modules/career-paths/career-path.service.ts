import mongoose from "mongoose";
import { ApiError } from "@/utils/apiError";
import { logger } from "@/utils/logger";
import { parseJsonField } from "@/helpers/parseToJson";
import { uploadFile, isSpacesConfigured } from "@/libs/spacesFileUpload";
import {
  createCareerPath,
  findCareerPathById,
  findCareerPathsPaginated,
  findPublishedCareerPathsPaginated,
  findMostEnrolledPublishedCareerPath,
  updateCareerPathById,
  deleteCareerPathById,
  validatePublishedCourses,
} from "./career-path.repository";
import {
  deleteEnrollmentsByCareerPathId,
  enrollStudentInCareerPath,
  dropStudentCareerPathEnrollment,
  markCareerPathEnrollmentCompleted,
  getCareerPathEnrollmentStats,
  listStudentCareerPathEnrollments,
  type StudentCareerPathEnrollmentItem,
} from "./career-path-enrollment.repository";
import type { z } from "zod";
import {
  listCareerPathsQuerySchema,
  exploreCareerPathsQuerySchema,
} from "./career-path.validation";
import { ICareerPath, CareerPathStatus } from "./career-path.model";

function normalizeCourseIds(raw: string | undefined): string[] {
  const arr = parseJsonField<string[]>(raw, []);
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of arr) {
    if (id == null || id === "") continue;
    const s = String(id).trim();
    if (!/^[a-fA-F0-9]{24}$/.test(s)) {
      throw ApiError.badRequest(`Invalid course id: ${s}`);
    }
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export async function createCareerPathService(
  body: {
    name: string;
    shortDescription: string;
    careerOutcome: string;
    industryRecognizedCertificate: boolean;
    estimatedDuration: string;
    skillLevel: string;
    courseIds?: string;
    status: "draft" | "published";
    slug?: string;
  },
  thumbnailFile: Express.Multer.File | null,
  userId: string,
): Promise<ICareerPath> {
  const courseIds = normalizeCourseIds(body.courseIds);

  if (body.status === "published" && courseIds.length === 0) {
    throw ApiError.badRequest(
      "Add at least one published course before publishing a career path",
    );
  }

  if (courseIds.length > 0) {
    await validatePublishedCourses(courseIds);
  }

  const courses = courseIds.map((id) => new mongoose.Types.ObjectId(id));

  let doc: ICareerPath;
  try {
    doc = await createCareerPath({
      name: body.name,
      slug: body.slug ?? undefined,
      shortDescription: body.shortDescription,
      careerOutcome: body.careerOutcome,
      industryRecognizedCertificate: body.industryRecognizedCertificate,
      estimatedDuration: body.estimatedDuration,
      skillLevel: body.skillLevel as ICareerPath["skillLevel"],
      courses,
      status: body.status as CareerPathStatus,
      createdBy: new mongoose.Types.ObjectId(userId),
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      throw ApiError.conflict(
        "A career path with this name or slug already exists",
      );
    }
    throw err;
  }

  if (thumbnailFile) {
    if (!isSpacesConfigured()) {
      await deleteCareerPathById(doc._id.toString());
      throw ApiError.badRequest(
        "File upload is not configured (DigitalOcean Spaces keys missing)",
      );
    }
    try {
      const uploaded = await uploadFile(
        thumbnailFile,
        `CareerPaths/${doc._id}`,
      );
      doc = (await updateCareerPathById(doc._id.toString(), {
        thumbnail: uploaded,
      } as Partial<ICareerPath>))!;
    } catch (e) {
      await deleteCareerPathById(doc._id.toString());
      throw e;
    }
  }

  logger.info({ careerPathId: doc._id }, "Career path created");
  const full = await findCareerPathById(doc._id.toString());
  if (!full) throw ApiError.internal("Failed to load career path after create");
  return full;
}

export async function updateCareerPathService(
  id: string,
  body: Partial<{
    name: string;
    shortDescription: string;
    careerOutcome: string;
    industryRecognizedCertificate: boolean;
    estimatedDuration: string;
    skillLevel: string;
    courseIds: string;
    status: "draft" | "published" | "archived";
    slug: string;
  }>,
  thumbnailFile: Express.Multer.File | null,
): Promise<ICareerPath | null> {
  const existing = await findCareerPathById(id);
  if (!existing) throw ApiError.notFound("Career path not found");

  const update: Partial<ICareerPath> = {};

  if (body.name !== undefined) update.name = body.name;
  if (body.shortDescription !== undefined)
    update.shortDescription = body.shortDescription;
  if (body.careerOutcome !== undefined)
    update.careerOutcome = body.careerOutcome;
  if (body.industryRecognizedCertificate !== undefined)
    update.industryRecognizedCertificate = body.industryRecognizedCertificate;
  if (body.estimatedDuration !== undefined)
    update.estimatedDuration = body.estimatedDuration;
  if (body.skillLevel !== undefined)
    update.skillLevel = body.skillLevel as ICareerPath["skillLevel"];
  if (body.status !== undefined)
    update.status = body.status as CareerPathStatus;
  if (body.slug !== undefined) update.slug = body.slug;

  if (body.courseIds !== undefined) {
    const courseIds = normalizeCourseIds(body.courseIds);
    const nextStatus = (body.status ?? existing.status) as CareerPathStatus;
    if (nextStatus === "published" && courseIds.length === 0) {
      throw ApiError.badRequest(
        "Add at least one published course before publishing a career path",
      );
    }
    if (courseIds.length > 0) {
      await validatePublishedCourses(courseIds);
    }
    update.courses = courseIds.map((cid) => new mongoose.Types.ObjectId(cid));
  } else if (body.status === "published" && existing.courses.length === 0) {
    throw ApiError.badRequest(
      "Add at least one published course before publishing a career path",
    );
  }

  if (thumbnailFile) {
    if (!isSpacesConfigured()) {
      throw ApiError.badRequest(
        "File upload is not configured (DigitalOcean Spaces keys missing)",
      );
    }
    const uploaded = await uploadFile(thumbnailFile, `CareerPaths/${id}`);
    update.thumbnail = uploaded;
  }

  if (Object.keys(update).length === 0) {
    return findCareerPathById(id);
  }

  try {
    const updated = await updateCareerPathById(id, update);
    if (!updated) throw ApiError.notFound("Career path not found");
    return findCareerPathById(id) as Promise<ICareerPath | null>;
  } catch (err: any) {
    if (err?.code === 11000) {
      throw ApiError.conflict("A career path with this slug already exists");
    }
    throw err;
  }
}

function mapCareerPathAdminListItem(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  const courses = doc.courses as unknown[] | undefined;
  const coursesCount = Array.isArray(courses) ? courses.length : 0;
  const enrollmentCount =
    typeof doc.enrollmentCount === "number" ? doc.enrollmentCount : 0;
  return {
    ...doc,
    numberOfCourses: coursesCount,
    coursesCount,
    enrollmentCount,
  };
}

export async function listCareerPathsAdminService(
  query: z.infer<typeof listCareerPathsQuerySchema>,
) {
  const result = await findCareerPathsPaginated(query);
  return {
    ...result,
    items: result.items.map((row) =>
      mapCareerPathAdminListItem(row as unknown as Record<string, unknown>),
    ),
  };
}

export async function getCareerPathStatsService() {
  const [enrollmentStats, mostEnrolled] = await Promise.all([
    getCareerPathEnrollmentStats(),
    findMostEnrolledPublishedCareerPath(),
  ]);

  return {
    enrolledCareerPathLearners: {
      totalStudents: enrollmentStats.totalUniqueStudents,
      completionRatePercent: enrollmentStats.completionRatePercent,
      totalEnrollments: enrollmentStats.totalEnrollmentsActiveOrCompleted,
      completedEnrollments: enrollmentStats.completedCount,
    },
    mostEnrolledCareerPath: mostEnrolled,
  };
}

export async function enrollInCareerPathService(
  careerPathId: string,
  studentId: string,
): Promise<void> {
  await enrollStudentInCareerPath(studentId, careerPathId);
}

export async function dropCareerPathEnrollmentService(
  careerPathId: string,
  studentId: string,
): Promise<void> {
  await dropStudentCareerPathEnrollment(studentId, careerPathId);
}

export async function completeCareerPathEnrollmentService(
  careerPathId: string,
  studentId: string,
): Promise<void> {
  await markCareerPathEnrollmentCompleted(studentId, careerPathId);
}

export async function listMyCareerPathsService(
  studentId: string,
): Promise<StudentCareerPathEnrollmentItem[]> {
  return listStudentCareerPathEnrollments(studentId);
}

export function exploreCareerPathsService(
  query: z.infer<typeof exploreCareerPathsQuerySchema>,
) {
  return findPublishedCareerPathsPaginated(query);
}

export async function getCareerPathByIdForViewer(
  id: string,
  role: string,
): Promise<ICareerPath> {
  const doc = await findCareerPathById(id);
  if (!doc) throw ApiError.notFound("Career path not found");
  if (role === "student" && doc.status !== "published") {
    throw ApiError.notFound("Career path not found");
  }
  return doc;
}

export async function deleteCareerPathService(id: string): Promise<void> {
  const existing = await findCareerPathById(id);
  if (!existing) throw ApiError.notFound("Career path not found");
  await deleteEnrollmentsByCareerPathId(id);
  await deleteCareerPathById(id);
}
