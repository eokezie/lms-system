import { ClientSession } from "mongoose";
import { Course, ICourse } from "./course.model";
import {
  CreateCourseDto,
  UpdateCourseDto,
  CoursePaginationOptions,
} from "./course.types";

export function findCourseById(
  id: string,
  session: ClientSession,
): Promise<ICourse | null> {
  return Course.findById(id).session(session).exec();
}

export function findCourseByIdWithInstructor(
  id: string,
): Promise<ICourse | null> {
  return Course.findById(id)
    .populate("instructor", "firstName lastName avatar")
    .exec();
}

export function findCourseBySlug(slug: string): Promise<ICourse | null> {
  return Course.findOne({ slug }).exec();
}

function getTimeRangeFilter(
  avgTimeToComplete: CoursePaginationOptions["avgTimeToComplete"],
): { $gte?: number; $lte?: number } | null {
  if (!avgTimeToComplete) return null;
  switch (avgTimeToComplete) {
    case "0-5":
      return { $gte: 0, $lte: 5 };
    case "6-15":
      return { $gte: 6, $lte: 15 };
    case "16-25":
      return { $gte: 16, $lte: 25 };
    case "26+":
      return { $gte: 26 };
    default:
      return null;
  }
}

export async function findCoursesPaginated(
  options: CoursePaginationOptions,
): Promise<{
  courses: ICourse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const {
    page = 1,
    limit = 20,
    category,
    status = "published",
    search,
    skillLevel,
    price,
    instructorIds,
    avgTimeToComplete,
  } = options;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { status };
  if (category) filter.category = category;
  if (skillLevel) filter.skillLevel = skillLevel;
  if (price === "free") filter.isFree = true;
  if (price === "paid") filter.isFree = false;
  if (instructorIds?.length) filter.instructor = { $in: instructorIds };
  if (avgTimeToComplete) {
    const range = getTimeRangeFilter(avgTimeToComplete);
    if (range) filter.estimatedCompletionTime = range;
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate("instructor", "firstName lastName avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec(),
    Course.countDocuments(filter),
  ]);

  return {
    courses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function findCoursesByInstructor(
  instructorId: string,
): Promise<ICourse[]> {
  return Course.find({ instructor: instructorId })
    .sort({ createdAt: -1 })
    .exec();
}

export function createCourse(dto: CreateCourseDto) {
  const { instructorId, categoryId } = dto;
  return Course.create({
    ...dto,
    instructor: instructorId,
    category: categoryId,
    isFree: dto.price === 0 || dto.isFree,
  });
}

export function updateCourseById(
  id: string,
  dto: UpdateCourseDto,
): Promise<ICourse | null> {
  return Course.findByIdAndUpdate(
    id,
    { $set: dto },
    { new: true, runValidators: true },
  ).exec();
}

export function incrementCourseEnrollmentCount(
  courseId: string,
): Promise<ICourse | null> {
  return Course.findByIdAndUpdate(
    courseId,
    { $inc: { enrollmentCount: 1 } },
    { new: true },
  ).exec();
}

export function decrementCourseEnrollmentCount(
  courseId: string,
): Promise<ICourse | null> {
  return Course.findByIdAndUpdate(
    courseId,
    { $inc: { enrollmentCount: -1 } },
    { new: true },
  ).exec();
}

export async function isCourseOwnedByInstructor(
  courseId: string,
  instructorId: string,
): Promise<boolean> {
  const doc = await Course.exists({ _id: courseId, instructor: instructorId });
  return !!doc;
}

export async function findCountOfCoursesPerCategory() {
  return await Course.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
}

export async function findCountOfPublishedCoursesPerCategory() {
  return await Course.aggregate([
    { $match: { status: "published" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
}
