import mongoose from "mongoose";
import { Course } from "@/modules/courses/course.model";
import { ApiError } from "@/utils/apiError";
import { CareerPath, ICareerPath } from "./career-path.model";

export async function createCareerPath(
  data: Partial<ICareerPath>,
): Promise<ICareerPath> {
  return CareerPath.create(data);
}

export function findCareerPathById(id: string): Promise<ICareerPath | null> {
  return CareerPath.findById(id)
    .populate(
      "courses",
      "title slug coverImage summary skillLevel estimatedCompletionTime totalDuration averageRating status",
    )
    .populate("createdBy", "firstName lastName email")
    .exec();
}

export function findCareerPathBySlug(
  slug: string,
): Promise<ICareerPath | null> {
  return CareerPath.findOne({ slug })
    .populate(
      "courses",
      "title slug coverImage summary skillLevel estimatedCompletionTime totalDuration averageRating status",
    )
    .exec();
}

export async function findCareerPathsPaginated(options: {
  page?: number;
  limit?: number;
  status?: "draft" | "published" | "archived" | "all";
  search?: string;
  /** Most recent = newest created first; oldest = oldest created first */
  sort?: "recent" | "oldest";
}): Promise<{
  items: ICareerPath[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (options.status && options.status !== "all") {
    filter.status = options.status;
  }
  if (options.search?.trim()) {
    const q = options.search.trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { shortDescription: { $regex: q, $options: "i" } },
    ];
  }

  const sort =
    options.sort === "oldest"
      ? { createdAt: 1 as const }
      : { createdAt: -1 as const };

  const [items, total] = await Promise.all([
    CareerPath.find(filter)
      .select(
        "name slug shortDescription thumbnail skillLevel estimatedDuration status courses enrollmentCount createdAt updatedAt createdBy",
      )
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    CareerPath.countDocuments(filter),
  ]);

  return {
    items: items as unknown as ICareerPath[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/** Published path with highest enrollmentCount (ties: newest). */
export async function findMostEnrolledPublishedCareerPath(): Promise<{
  careerPath: {
    _id: string;
    name: string;
    thumbnail?: unknown;
    skillLevel: string;
    estimatedDuration: string;
    coursesCount: number;
    enrollmentCount: number;
  };
  category: { _id: string; name: string } | null;
} | null> {
  const doc = await CareerPath.findOne({ status: "published" })
    .sort({ enrollmentCount: -1, createdAt: -1 })
    .select(
      "name thumbnail skillLevel estimatedDuration courses enrollmentCount",
    )
    .lean()
    .exec();

  if (!doc) return null;

  const coursesCount = Array.isArray(doc.courses) ? doc.courses.length : 0;
  let category: { _id: string; name: string } | null = null;
  const firstCourseId = doc.courses?.[0];
  if (firstCourseId) {
    const course = await Course.findById(firstCourseId)
      .populate("category", "name")
      .select("category")
      .lean()
      .exec();
    if (course?.category) {
      const c = course.category as unknown as {
        _id: mongoose.Types.ObjectId;
        name: string;
      };
      category = { _id: c._id.toString(), name: c.name };
    }
  }

  return {
    careerPath: {
      _id: doc._id.toString(),
      name: doc.name,
      thumbnail: doc.thumbnail,
      skillLevel: doc.skillLevel,
      estimatedDuration: doc.estimatedDuration,
      coursesCount,
      enrollmentCount: doc.enrollmentCount ?? 0,
    },
    category,
  };
}

export async function findPublishedCareerPathsPaginated(options: {
  page?: number;
  limit?: number;
  search?: string;
  skillLevel?: string;
}): Promise<{
  items: ICareerPath[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { status: "published" };
  if (options.search?.trim()) {
    const q = options.search.trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { shortDescription: { $regex: q, $options: "i" } },
    ];
  }
  if (options.skillLevel) {
    filter.skillLevel = options.skillLevel;
  }

  const [items, total] = await Promise.all([
    CareerPath.find(filter)
      .select(
        "name slug shortDescription thumbnail careerOutcome industryRecognizedCertificate estimatedDuration skillLevel courses status enrollmentCount createdAt updatedAt",
      )
      .populate(
        "courses",
        "title slug coverImage summary estimatedCompletionTime totalDuration averageRating",
      )
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    CareerPath.countDocuments(filter),
  ]);

  return {
    items: items as unknown as ICareerPath[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export function updateCareerPathById(
  id: string,
  update: Partial<ICareerPath>,
): Promise<ICareerPath | null> {
  return CareerPath.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true },
  )
    .populate("courses", "title slug coverImage summary skillLevel status")
    .exec();
}

export function deleteCareerPathById(id: string): Promise<ICareerPath | null> {
  return CareerPath.findByIdAndDelete(id).exec();
}

/** Validates all ids exist and are published. */
export async function validatePublishedCourses(
  courseIds: string[],
): Promise<void> {
  if (courseIds.length === 0) return;
  const ids = courseIds.map((id) => new mongoose.Types.ObjectId(id));
  const found = await Course.find({
    _id: { $in: ids },
    status: "published",
  })
    .select("_id")
    .lean()
    .exec();
  if (found.length !== courseIds.length) {
    const foundSet = new Set(found.map((c) => String(c._id)));
    const missing = courseIds.filter((id) => !foundSet.has(id));
    throw ApiError.badRequest(
      `Invalid or unpublished course id(s): ${missing.join(", ")}`,
    );
  }
}
