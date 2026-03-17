import { ApiError } from "@/utils/apiError";
import { getSingleCourseWithModulesAndLessons } from "./course.service";
import { Enrollment } from "@/modules/enrollments/enrollment.model";

export async function getCoursePlayerData(idOrSlug: string, studentId: string) {
  const courseWithModules =
    await getSingleCourseWithModulesAndLessons(idOrSlug);
  const courseId = (courseWithModules as any)._id?.toString();
  if (!courseId) throw ApiError.notFound("Course not found");

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
  }).lean();

  if (!enrollment) {
    throw ApiError.forbidden("You are not enrolled in this course");
  }

  const completedLessonIds = new Set(
    (enrollment.completedLessons || []).map((id: any) => id.toString()),
  );

  const modules = (courseWithModules as any).courseModules?.map((mod: any) => ({
    ...mod,
    lessons: (mod.lessons || []).map((lesson: any) => ({
      ...lesson,
      completed: completedLessonIds.has(lesson._id.toString()),
    })),
  }));

  return {
    course: {
      ...(courseWithModules as any),
      courseModules: modules,
    },
    enrollment: {
      id: enrollment._id,
      status: enrollment.status,
      progressPercent: enrollment.progressPercent,
      lastAccessedLessonId: enrollment.lastAccessedLessonId,
      completedLessons: Array.from(completedLessonIds),
    },
  };
}
