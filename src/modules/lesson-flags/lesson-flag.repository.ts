import mongoose from "mongoose";
import { LessonFlag, ILessonFlag } from "./lesson-flag.model";
import { Course } from "@/modules/courses/course.model";

export async function createLessonFlag(data: {
  studentId: string;
  courseId: string;
  lessonId: string;
  reason: ILessonFlag["reason"];
  description: string;
}): Promise<ILessonFlag> {
  return LessonFlag.create({
    student: new mongoose.Types.ObjectId(data.studentId),
    course: new mongoose.Types.ObjectId(data.courseId),
    lesson: new mongoose.Types.ObjectId(data.lessonId),
    reason: data.reason,
    description: data.description,
    status: "in_review",
  });
}

export function findLessonFlagById(id: string): Promise<ILessonFlag | null> {
  return LessonFlag.findById(id).exec();
}

export async function findLessonFlagByIdPopulated(id: string): Promise<unknown> {
  return LessonFlag.findById(id)
    .populate("student", "firstName lastName email avatar")
    .populate({
      path: "course",
      select: "title slug coverImage instructor",
      populate: {
        path: "instructor",
        select: "firstName lastName email avatar",
      },
    })
    .populate("lesson", "title course type description estimatedCompletionTime")
    .populate("reviewedBy", "firstName lastName email")
    .lean()
    .exec();
}

export async function updateLessonFlagById(
  id: string,
  update: {
    status?: "in_review" | "reviewed";
    adminNote?: string;
    reviewedAt?: Date | null;
    reviewedBy?: mongoose.Types.ObjectId | null;
  },
): Promise<ILessonFlag | null> {
  return LessonFlag.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true },
  ).exec();
}

async function buildCourseFilter(
  instructorId?: string,
): Promise<Record<string, unknown> | null> {
  if (!instructorId) return {};
  const courseIds = await Course.find({
    instructor: new mongoose.Types.ObjectId(instructorId),
  })
    .distinct("_id")
    .exec();
  if (courseIds.length === 0) return null;
  return { course: { $in: courseIds } };
}

export async function findLessonFlagsPaginated(options: {
  page?: number;
  limit?: number;
  status?: "in_review" | "reviewed" | "all";
  search?: string;
  sort?: "most_recent" | "oldest";
  instructorId?: string;
}): Promise<{
  items: unknown[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 100);
  const skip = (page - 1) * limit;
  const sortDir = options.sort === "oldest" ? 1 : -1;

  const courseFilter = await buildCourseFilter(options.instructorId);
  if (courseFilter === null) {
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    };
  }

  const match: Record<string, unknown> = { ...courseFilter };
  if (options.status && options.status !== "all") {
    match.status = options.status;
  }

  const search = options.search?.trim();
  if (!search) {
    const [items, total] = await Promise.all([
      LessonFlag.find(match)
        .sort({ createdAt: sortDir })
        .skip(skip)
        .limit(limit)
        .populate("student", "firstName lastName email avatar")
        .populate("course", "title slug coverImage")
        .populate("lesson", "title type course")
        .lean()
        .exec(),
      LessonFlag.countDocuments(match),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const pipeline: mongoose.PipelineStage[] = [
    { $match: match },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "cd",
      },
    },
    { $unwind: "$cd" },
    {
      $lookup: {
        from: "lessons",
        localField: "lesson",
        foreignField: "_id",
        as: "ld",
      },
    },
    { $unwind: "$ld" },
    {
      $lookup: {
        from: "users",
        localField: "student",
        foreignField: "_id",
        as: "sd",
      },
    },
    { $unwind: "$sd" },
    {
      $match: {
        $or: [
          { description: rx },
          { "cd.title": rx },
          { "ld.title": rx },
          { "sd.firstName": rx },
          { "sd.lastName": rx },
          { "sd.email": rx },
        ],
      },
    },
    {
      $facet: {
        meta: [{ $count: "total" }],
        data: [
          { $sort: { createdAt: sortDir } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              reason: 1,
              description: 1,
              status: 1,
              adminNote: 1,
              reviewedAt: 1,
              createdAt: 1,
              updatedAt: 1,
              student: {
                _id: "$sd._id",
                firstName: "$sd.firstName",
                lastName: "$sd.lastName",
                email: "$sd.email",
                avatar: "$sd.avatar",
              },
              course: {
                _id: "$cd._id",
                title: "$cd.title",
                slug: "$cd.slug",
              },
              lesson: {
                _id: "$ld._id",
                title: "$ld.title",
                type: "$ld.type",
              },
            },
          },
        ],
      },
    },
  ];

  const agg = await LessonFlag.aggregate(pipeline).exec();
  const row = agg[0] as {
    meta: { total: number }[];
    data: unknown[];
  };
  const total = row.meta[0]?.total ?? 0;
  const items = row.data ?? [];

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
