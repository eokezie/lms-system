import mongoose, { ClientSession } from "mongoose";
import { Course, CourseStatus, ICourse } from "./course.model";
import {
  CreateCourseDto,
  UpdateCourseDto,
  CoursePaginationOptions,
  ManageCoursesQuery,
} from "./course.types";

const PUBLISHED = "published";

function isMongoId24(s: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(s);
}

export function findCourseById(
  id: string,
  session?: ClientSession,
): Promise<ICourse | null> {
  return Course.findById(id)
    .session(session ?? null)
    .exec();
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

/** Single course by id or slug for student (published only)*/
export async function findCourseByIdOrSlugForStudent(idOrSlug: string): Promise<
  | (ICourse & {
      instructor?: {
        _id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
      };
    })
  | null
> {
  const matchFilter: Record<string, unknown> = { status: PUBLISHED };
  if (isMongoId24(idOrSlug)) {
    matchFilter._id = new mongoose.Types.ObjectId(idOrSlug);
  } else {
    matchFilter.slug = idOrSlug;
  }
  const docs = await Course.aggregate([
    { $match: matchFilter },
    { $limit: 1 },
    {
      $lookup: {
        from: "users",
        localField: "instructor",
        foreignField: "_id",
        as: "instructorDoc",
        pipeline: [
          { $project: { firstName: 1, lastName: 1, avatar: 1, _id: 1 } },
        ],
      },
    },
    {
      $set: {
        instructor: { $arrayElemAt: ["$instructorDoc", 0] },
      },
    },
    { $project: { instructorDoc: 0 } },
  ]).exec();
  const doc = docs[0] || null;
  return doc as any;
}

/** Related published courses by same category; excludes given course id. */
export function findRelatedPublishedCourses(
  categoryId: mongoose.Types.ObjectId,
  excludeCourseId: string,
  limit: number,
): Promise<
  (ICourse & {
    instructor?: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  })[]
> {
  return Course.find({
    category: categoryId,
    _id: { $ne: new mongoose.Types.ObjectId(excludeCourseId) },
    status: PUBLISHED,
  })
    .populate("instructor", "firstName lastName avatar")
    .limit(limit)
    .sort({ enrollmentCount: -1, createdAt: -1 })
    .lean()
    .exec() as Promise<any>;
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

export function createCourse(
  dto: CreateCourseDto,
  initialStatus: CourseStatus = CourseStatus.draft,
) {
  const { instructorId, categoryId } = dto;
  const priceNGN = dto.priceNGN ?? dto.price ?? 0;
  const priceUSD = dto.priceUSD ?? 0;
  return Course.create({
    ...dto,
    instructor: instructorId,
    category: categoryId,
    price: priceNGN,
    priceNGN,
    priceUSD,
    isFree: dto.isFree === true || (priceNGN === 0 && priceUSD === 0),
    status: initialStatus,
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

export function updateCourseRatingStats(
  courseId: string,
  averageRating: number,
  totalRatings: number,
): Promise<unknown> {
  return Course.findByIdAndUpdate(
    courseId,
    { $set: { averageRating, totalRatings } },
    { new: true },
  ).exec();
}

export async function findCoursesForManagePaginated(
  options: ManageCoursesQuery,
  instructorId?: string,
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
    search,
    status = "all",
    sort = "most_recent",
  } = options;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};
  if (status !== "all") filter.status = status;
  else filter.status = { $in: ["draft", "published"] };
  if (instructorId)
    filter.instructor = new mongoose.Types.ObjectId(instructorId);
  if (category) filter.category = new mongoose.Types.ObjectId(category);
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }
  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === "most_enrolled")
    sortOption = { enrollmentCount: -1, createdAt: -1 };
  else if (sort === "highest_rated")
    sortOption = { averageRating: -1, totalRatings: -1, createdAt: -1 };

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate("instructor", "firstName lastName avatar")
      .populate("category", "label")
      .skip(skip)
      .limit(limit)
      .sort(sortOption)
      .lean()
      .exec(),
    Course.countDocuments(filter),
  ]);
  return {
    courses: courses as unknown as ICourse[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function findCoursesForAdminByStatusPaginated(
  status: "in_review" | "archived",
  options: Omit<ManageCoursesQuery, "status">,
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
    search,
    sort = "most_recent",
  } = options;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = { status };
  if (category) filter.category = new mongoose.Types.ObjectId(category);
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { summary: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }
  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === "most_enrolled")
    sortOption = { enrollmentCount: -1, createdAt: -1 };
  else if (sort === "highest_rated")
    sortOption = { averageRating: -1, totalRatings: -1, createdAt: -1 };

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate("instructor", "firstName lastName avatar email")
      .populate("category", "label")
      .skip(skip)
      .limit(limit)
      .sort(sortOption)
      .lean()
      .exec(),
    Course.countDocuments(filter),
  ]);
  return {
    courses: courses as unknown as ICourse[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/** Single course in admin review queue (in_review only), with instructor + category. */
export async function findCourseInReviewByIdForAdmin(
  courseId: string,
): Promise<Record<string, unknown> | null> {
  if (!isMongoId24(courseId)) return null;
  const doc = await Course.findOne({
    _id: new mongoose.Types.ObjectId(courseId),
    status: "in_review",
  })
    .populate("instructor", "firstName lastName avatar email")
    .populate("category", "label")
    .lean()
    .exec();
  return doc as Record<string, unknown> | null;
}

export async function getTotalEnrollmentCount(
  instructorId?: string,
): Promise<number> {
  const pipeline: mongoose.PipelineStage[] = [];
  if (instructorId) {
    pipeline.push({
      $match: { instructor: new mongoose.Types.ObjectId(instructorId) },
    });
  }
  pipeline.push({ $group: { _id: null, total: { $sum: "$enrollmentCount" } } });
  const result = await Course.aggregate(pipeline).exec();
  return result[0]?.total ?? 0;
}

export async function getHighestRatedCourse(
  instructorId?: string,
): Promise<
  | (ICourse & {
      instructor?: {
        _id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
      };
      category?: { _id: string; label: string };
    })
  | null
> {
  const filter: Record<string, unknown> = { status: PUBLISHED };
  if (instructorId) {
    filter.instructor = new mongoose.Types.ObjectId(instructorId);
  }
  const docs = await Course.find(filter)
    .sort({ averageRating: -1, totalRatings: -1 })
    .limit(1)
    .populate("instructor", "firstName lastName avatar")
    .populate("category", "label")
    .lean()
    .exec();
  return (docs[0] as any) ?? null;
}

export function deleteCourseById(id: string): Promise<ICourse | null> {
  return Course.findByIdAndDelete(id).exec();
}
