import { IEnrollment } from "./enrollment.model";
import {
  findEnrollmentByStudentAndCourse,
  findActiveEnrollment,
  findEnrollmentsByStudent,
  findEnrollmentsByCourse,
  findEnrollmentsByCoursePaginated,
  findEnrollmentsForStudentPaginated,
  isStudentEnrolled,
  createEnrollment,
  updateEnrollmentStatus,
  EnrollmentPaginationOptions,
} from "./enrollment.repository";
import {
  findCourseById,
  incrementCourseEnrollmentCount,
  decrementCourseEnrollmentCount,
  isCourseOwnedByInstructor,
} from "@/modules/courses/course.repository";
import { ApiError } from "@/utils/apiError";
import { eventBus } from "@/events/eventBus";

export async function enrollStudentInFreeCourse(
  studentId: string,
  courseId: string,
): Promise<IEnrollment> {
  const course = await findCourseById(courseId);
  if (!course) throw ApiError.notFound("Course not found");
  if (!course.isFree) {
    throw ApiError.badRequest(
      "This course is not free; complete checkout to enroll",
    );
  }
  return enrollStudent(studentId, courseId);
}

export async function enrollStudent(
  studentId: string,
  courseId: string,
): Promise<IEnrollment> {
  const course = await findCourseById(courseId);
  if (!course) throw ApiError.notFound("Course not found");
  if (course.status !== "published") {
    throw ApiError.badRequest("This course is not available for enrollment");
  }

  const existing = await findEnrollmentByStudentAndCourse(studentId, courseId);
  if (existing) {
    if (existing.status === "dropped") {
      const reEnrolled = await updateEnrollmentStatus(
        studentId,
        courseId,
        "active",
        {
          enrolledAt: new Date(),
        } as Partial<IEnrollment>,
      );
      return reEnrolled!;
    }
    throw ApiError.conflict("You are already enrolled in this course");
  }

  const enrollment = await createEnrollment(studentId, courseId);
  await incrementCourseEnrollmentCount(courseId);

  eventBus.emit("student.enrolled", { studentId, courseId });

  return enrollment;
}

export async function dropEnrollment(
  studentId: string,
  courseId: string,
): Promise<void> {
  const enrollment = await findActiveEnrollment(studentId, courseId);
  if (!enrollment) throw ApiError.notFound("Active enrollment not found");

  await updateEnrollmentStatus(studentId, courseId, "dropped");
  await decrementCourseEnrollmentCount(courseId);

  eventBus.emit("student.unenrolled", { studentId, courseId });
}

export function getStudentEnrollments(
  studentId: string,
): Promise<IEnrollment[]> {
  return findEnrollmentsByStudent(studentId);
}

export async function getCourseEnrollments(
  courseId: string,
  requesterId: string,
): Promise<IEnrollment[]> {
  const isOwner = await isCourseOwnedByInstructor(courseId, requesterId);
  if (!isOwner)
    throw ApiError.forbidden("Only the course instructor can view enrollments");
  return findEnrollmentsByCourse(courseId);
}

export async function getCourseEnrollmentsListService(
  courseId: string,
  query: {
    page: number;
    limit: number;
    search?: string;
    sort: "most_recent" | "oldest" | "progress";
    status: "all" | "completed" | "in_progress";
  },
  userId: string,
  userRole: string,
) {
  const course = await findCourseById(courseId);
  if (!course) throw ApiError.notFound("Course not found");

  if (userRole === "admin" || userRole === "super_admin") {
    return findEnrollmentsByCoursePaginated(courseId, query);
  }
  if (userRole === "instructor") {
    const owns = await isCourseOwnedByInstructor(courseId, userId);
    if (!owns) {
      throw ApiError.forbidden("You can only view enrollments for your own courses");
    }
    return findEnrollmentsByCoursePaginated(courseId, query);
  }
  throw ApiError.forbidden("Insufficient permissions");
}

export function checkIsEnrolled(
  studentId: string,
  courseId: string,
): Promise<boolean> {
  return isStudentEnrolled(studentId, courseId);
}

export async function getStudentEnrollmentsPaginated(
  studentId: string,
  options: Omit<EnrollmentPaginationOptions, "studentId">,
) {
  return findEnrollmentsForStudentPaginated({
    ...options,
    studentId,
  });
}
