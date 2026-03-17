import mongoose from "mongoose";
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
              title: 1,
              slug: 1,
              coverImage: 1,
              estimatedCompletionTime: 1,
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
