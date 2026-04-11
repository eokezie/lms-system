import mongoose from "mongoose";
import { ApiError } from "@/utils/apiError";
import { CareerPathEnrollment } from "./career-path-enrollment.model";
import { CareerPath } from "./career-path.model";

export async function deleteEnrollmentsByCareerPathId(
  careerPathId: string,
): Promise<void> {
  await CareerPathEnrollment.deleteMany({
    careerPath: new mongoose.Types.ObjectId(careerPathId),
  }).exec();
}

export async function enrollStudentInCareerPath(
  studentId: string,
  careerPathId: string,
): Promise<void> {
  const path = await CareerPath.findById(careerPathId).select("status").lean();
  if (!path) throw ApiError.notFound("Career path not found");
  if (path.status !== "published") {
    throw ApiError.badRequest(
      "This career path is not available for enrollment",
    );
  }

  try {
    await CareerPathEnrollment.create({
      student: new mongoose.Types.ObjectId(studentId),
      careerPath: new mongoose.Types.ObjectId(careerPathId),
      status: "active",
    });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      throw ApiError.conflict("You are already enrolled in this career path");
    }
    throw err;
  }

  await CareerPath.updateOne(
    { _id: careerPathId },
    { $inc: { enrollmentCount: 1 } },
  ).exec();
}

/**
 * Removes enrollment (active or completed). Decrements path enrollmentCount only
 * when an enrollment document is removed (student leaves / admin removes).
 */
export async function dropStudentCareerPathEnrollment(
  studentId: string,
  careerPathId: string,
): Promise<void> {
  const deleted = await CareerPathEnrollment.findOneAndDelete({
    student: new mongoose.Types.ObjectId(studentId),
    careerPath: new mongoose.Types.ObjectId(careerPathId),
    status: { $in: ["active", "completed"] },
  }).exec();

  if (!deleted) {
    throw ApiError.notFound("Enrollment not found");
  }

  await CareerPath.updateOne(
    { _id: careerPathId },
    { $inc: { enrollmentCount: -1 } },
  ).exec();
}

export async function markCareerPathEnrollmentCompleted(
  studentId: string,
  careerPathId: string,
): Promise<void> {
  const updated = await CareerPathEnrollment.findOneAndUpdate(
    {
      student: new mongoose.Types.ObjectId(studentId),
      careerPath: new mongoose.Types.ObjectId(careerPathId),
      status: "active",
    },
    { $set: { status: "completed", completedAt: new Date() } },
    { new: true },
  ).exec();

  if (!updated) {
    throw ApiError.notFound("No active enrollment found for this career path");
  }
}

export interface StudentCareerPathEnrollmentItem {
  _id: string;
  status: CareerPathEnrollmentStatusValue;
  enrolledAt: Date;
  completedAt?: Date;
  careerPath: Record<string, unknown> | null;
}

type CareerPathEnrollmentStatusValue = "active" | "completed" | "dropped";

export async function listStudentCareerPathEnrollments(
  studentId: string,
): Promise<StudentCareerPathEnrollmentItem[]> {
  const docs = await CareerPathEnrollment.find({
    student: new mongoose.Types.ObjectId(studentId),
    status: { $in: ["active", "completed"] },
  })
    .sort({ enrolledAt: -1 })
    .populate({
      path: "careerPath",
      select:
        "name slug shortDescription thumbnail careerOutcome industryRecognizedCertificate estimatedDuration skillLevel courses status enrollmentCount createdAt updatedAt",
      populate: {
        path: "courses",
        select:
          "title slug coverImage summary estimatedCompletionTime totalDuration averageRating",
      },
    })
    .lean()
    .exec();

  return docs.map((doc) => ({
    _id: String(doc._id),
    status: doc.status as CareerPathEnrollmentStatusValue,
    enrolledAt: doc.enrolledAt,
    completedAt: doc.completedAt,
    careerPath:
      (doc.careerPath as unknown as Record<string, unknown> | null) ?? null,
  }));
}

export async function getCareerPathEnrollmentStats(): Promise<{
  totalUniqueStudents: number;
  totalEnrollmentsActiveOrCompleted: number;
  completedCount: number;
  completionRatePercent: number;
}> {
  const [studentIds, totalEnrollmentsActiveOrCompleted, completedCount] =
    await Promise.all([
      CareerPathEnrollment.distinct("student", {
        status: { $in: ["active", "completed"] },
      }),
      CareerPathEnrollment.countDocuments({
        status: { $in: ["active", "completed"] },
      }),
      CareerPathEnrollment.countDocuments({ status: "completed" }),
    ]);

  const completionRatePercent =
    totalEnrollmentsActiveOrCompleted > 0
      ? Math.round((completedCount / totalEnrollmentsActiveOrCompleted) * 100)
      : 0;

  return {
    totalUniqueStudents: studentIds.length,
    totalEnrollmentsActiveOrCompleted,
    completedCount,
    completionRatePercent,
  };
}
