import mongoose, { FilterQuery } from "mongoose";
import { User } from "@/modules/users/user.model";
import { Enrollment, IEnrollment } from "./enrollment.model";

export type EnrollmentListFilterType = "enrolled" | "completed" | "in_progress";

export type EnrollmentListSort = "newest" | "oldest" | "progress" | "title_asc";

export interface EnrollmentPaginationOptions {
  studentId: string;
  page?: number;
  limit?: number;
  search?: string;
  filterType?: EnrollmentListFilterType;
  sort?: EnrollmentListSort;
}

export function findEnrollmentById(id: string): Promise<IEnrollment | null> {
  return Enrollment.findById(id).exec();
}

export function findEnrollmentByStudentAndCourse(
  studentId: string,
  courseId: string,
): Promise<IEnrollment | null> {
  return Enrollment.findOne({ student: studentId, course: courseId }).exec();
}

export function findActiveEnrollment(
  studentId: string,
  courseId: string,
): Promise<IEnrollment | null> {
  return Enrollment.findOne({
    student: studentId,
    course: courseId,
    status: "active",
  }).exec();
}

export function findEnrollmentsByStudent(
  studentId: string,
): Promise<IEnrollment[]> {
  return Enrollment.find({ student: studentId, status: "active" })
    .populate("course", "title slug coverImage instructor")
    .sort({ enrolledAt: -1 })
    .exec();
}

export function findEnrollmentsByCourse(
  courseId: string,
): Promise<IEnrollment[]> {
  return Enrollment.find({ course: courseId })
    .populate("student", "firstName lastName email")
    .sort({ enrolledAt: -1 })
    .exec();
}

export type CourseEnrollmentListSort = "most_recent" | "oldest" | "progress";
export type CourseEnrollmentStatusFilter = "all" | "completed" | "in_progress";

export async function findEnrollmentsByCoursePaginated(
  courseId: string,
  options: {
    page: number;
    limit: number;
    search?: string;
    sort: CourseEnrollmentListSort;
    status: CourseEnrollmentStatusFilter;
  },
): Promise<{
  enrollments: IEnrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { page, limit, search, sort, status } = options;
  const skip = (page - 1) * limit;
  const courseOid = new mongoose.Types.ObjectId(courseId);

  const query: FilterQuery<IEnrollment> = { course: courseOid };

  if (status === "completed") {
    query.status = "completed";
  } else if (status === "in_progress") {
    query.status = "active";
    query.progressPercent = { $lt: 100 };
  } else {
    query.status = { $in: ["active", "completed"] };
  }

  if (search?.trim()) {
    const rx = new RegExp(search.trim(), "i");
    const matchingStudents = await User.find({
      role: "student",
      $or: [{ firstName: rx }, { lastName: rx }, { email: rx }],
    })
      .select("_id")
      .lean()
      .exec();
    const ids = matchingStudents.map((u) => u._id);
    query.student = { $in: ids };
  }

  let sortKey: Record<string, 1 | -1> = { enrolledAt: -1 };
  if (sort === "oldest") sortKey = { enrolledAt: 1 };
  else if (sort === "progress") sortKey = { progressPercent: -1, enrolledAt: -1 };

  const [enrollments, total] = await Promise.all([
    Enrollment.find(query)
      .populate("student", "firstName lastName email avatar")
      .sort(sortKey)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Enrollment.countDocuments(query).exec(),
  ]);

  return {
    enrollments: enrollments as unknown as IEnrollment[],
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function isStudentEnrolled(
  studentId: string,
  courseId: string,
): Promise<boolean> {
  const doc = await Enrollment.exists({
    student: studentId,
    course: courseId,
    status: "active",
  });
  return !!doc;
}

export async function hasActiveOrCompletedEnrollment(
  studentId: string,
  courseId: string,
): Promise<boolean> {
  const doc = await Enrollment.exists({
    student: studentId,
    course: courseId,
    status: { $in: ["active", "completed"] },
  });
  return !!doc;
}

export function createEnrollment(
  studentId: string,
  courseId: string,
  paymentRef?: string,
): Promise<IEnrollment> {
  return Enrollment.create({
    student: studentId,
    course: courseId,
    ...(paymentRef && { paymentRef }),
  });
}

export function updateEnrollmentStatus(
  studentId: string,
  courseId: string,
  status: IEnrollment["status"],
  extra?: Partial<IEnrollment>,
): Promise<IEnrollment | null> {
  return Enrollment.findOneAndUpdate(
    { student: studentId, course: courseId },
    { $set: { status, ...extra } },
    { new: true },
  ).exec();
}

export async function findEnrollmentsForStudentPaginated(
  options: EnrollmentPaginationOptions,
): Promise<{
  enrollments: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const {
    studentId,
    page = 1,
    limit = 12,
    search,
    filterType = "enrolled",
    sort = "newest",
  } = options;

  const match: Record<string, unknown> = {
    student: new mongoose.Types.ObjectId(studentId),
  };

  if (filterType === "completed") {
    match.status = "completed";
  } else if (filterType === "in_progress") {
    match.status = "active";
    match.progressPercent = { $gt: 0, $lt: 100 };
  } else {
    // "enrolled" = all non-dropped enrollments
    match.status = { $in: ["active", "completed"] };
  }

  let sortStage: Record<string, 1 | -1>;
  switch (sort) {
    case "oldest":
      sortStage = { enrolledAt: 1 };
      break;
    case "progress":
      sortStage = { progressPercent: -1, enrolledAt: -1 };
      break;
    case "title_asc":
      sortStage = { "course.title": 1, enrolledAt: -1 };
      break;
    case "newest":
    default:
      sortStage = { enrolledAt: -1 };
      break;
  }

  const pipeline: any[] = [
    { $match: match },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
        pipeline: [
          {
            $project: {
              _id: 1,
              title: 1,
              summary: 1,
              slug: 1,
              coverImage: "$coverImage.fileUrl",
              estimatedCompletionTime: 1,
              totalDuration: 1,
              averageRating: 1,
              totalRatings: 1,
              category: 1,
              instructor: 1,
            },
          },
        ],
      },
    },
    {
      $set: {
        course: { $arrayElemAt: ["$course", 0] },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "course.instructor",
        foreignField: "_id",
        as: "instructor",
        pipeline: [
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
            },
          },
        ],
      },
    },
    {
      $set: {
        instructor: { $arrayElemAt: ["$instructor", 0] },
      },
    },
    {
      $lookup: {
        from: "lessons",
        localField: "course._id",
        foreignField: "course",
        as: "lessons",
        pipeline: [{ $project: { _id: 1 } }],
      },
    },
    {
      $set: {
        lessonsCount: { $size: "$lessons" },
      },
    },
    {
      $project: {
        lessons: 0,
      },
    },
  ];

  if (search) {
    pipeline.push({
      $match: {
        "course.title": { $regex: search, $options: "i" },
      },
    });
  }

  pipeline.push(
    { $sort: sortStage },
    {
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
    {
      $project: {
        enrollments: "$data",
        total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
      },
    },
  );

  const result = await Enrollment.aggregate(pipeline).exec();
  const { enrollments, total } = (result[0] as any) ?? {
    enrollments: [],
    total: 0,
  };

  return {
    enrollments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
