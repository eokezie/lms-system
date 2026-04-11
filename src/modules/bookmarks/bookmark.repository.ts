import mongoose from "mongoose";

import { ApiError } from "@/utils/apiError";
import { Course } from "@/modules/courses/course.model";
import { CourseBookmark, ICourseBookmark } from "./bookmark.model";
import type { ListBookmarksQuery } from "./bookmark.validation";

export async function createCourseBookmark(
  studentId: string,
  courseId: string,
): Promise<ICourseBookmark> {
  const course = await Course.findById(courseId).select("_id status").lean();
  if (!course) throw ApiError.notFound("Course not found");
  if (course.status !== "published") {
    throw ApiError.badRequest("Course is not available for bookmarking");
  }

  try {
    const doc = await CourseBookmark.create({
      student: new mongoose.Types.ObjectId(studentId),
      course: new mongoose.Types.ObjectId(courseId),
    });
    return doc;
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      throw ApiError.conflict("Course is already bookmarked");
    }
    throw err;
  }
}

export async function deleteCourseBookmark(
  studentId: string,
  courseId: string,
): Promise<void> {
  const deleted = await CourseBookmark.findOneAndDelete({
    student: new mongoose.Types.ObjectId(studentId),
    course: new mongoose.Types.ObjectId(courseId),
  }).exec();

  if (!deleted) {
    throw ApiError.notFound("Bookmark not found");
  }
}

export async function findStudentBookmarkedCourseIds(
  studentId: string,
): Promise<string[]> {
  const docs = await CourseBookmark.find({
    student: new mongoose.Types.ObjectId(studentId),
  })
    .select("course")
    .lean()
    .exec();
  return docs.map((d) => String(d.course));
}

export async function findStudentBookmarksPaginated(
  studentId: string,
  options: ListBookmarksQuery,
): Promise<{
  items: Array<Record<string, unknown>>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const courseFilter: Record<string, unknown> = { status: "published" };
  if (options.search?.trim()) {
    courseFilter.title = { $regex: options.search.trim(), $options: "i" };
  }
  if (options.courseType === "free") {
    courseFilter.isFree = true;
  } else if (options.courseType === "paid") {
    courseFilter.isFree = false;
  }

  // Find matching course ids first so we can filter bookmarks by them.
  const matchingCourses = await Course.find(courseFilter)
    .select("_id")
    .lean()
    .exec();
  const courseIds = matchingCourses.map((c) => c._id);

  if (courseIds.length === 0) {
    return { items: [], total: 0, page, limit, totalPages: 1 };
  }

  const sortOrder: Record<string, 1 | -1> =
    options.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

  const baseQuery = CourseBookmark.find({
    student: new mongoose.Types.ObjectId(studentId),
    course: { $in: courseIds },
  });

  const [items, total] = await Promise.all([
    baseQuery
      .clone()
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .populate({
        path: "course",
        select:
          "title slug coverImage summary skillLevel totalDuration averageRating totalRatings isFree price priceNGN priceUSD instructor status",
        populate: { path: "instructor", select: "firstName lastName" },
      })
      .lean()
      .exec(),
    baseQuery.clone().countDocuments(),
  ]);

  let mapped = items as unknown as Array<Record<string, unknown>>;
  if (options.sort === "title_asc") {
    mapped = [...mapped].sort((a, b) => {
      const at = String(
        ((a.course as Record<string, unknown> | undefined)?.title as string) ??
          "",
      );
      const bt = String(
        ((b.course as Record<string, unknown> | undefined)?.title as string) ??
          "",
      );
      return at.localeCompare(bt);
    });
  }

  return {
    items: mapped,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
