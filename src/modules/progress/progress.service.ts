import mongoose from "mongoose";
import { ApiError } from "@/utils/apiError";
import { Enrollment } from "@/modules/enrollments/enrollment.model";
import { findCourseById } from "@/modules/courses/course.repository";
import { Lesson } from "@/modules/lessons/lesson.model";

export async function updateLessonProgressService(
  studentId: string,
  courseId: string,
  lessonId: string,
  status: "started" | "completed",
  percent?: number,
) {
  const course = await findCourseById(courseId);
  if (!course) throw ApiError.notFound("Course not found");

  const lessonObjectId = new mongoose.Types.ObjectId(lessonId);

  const lesson = await Lesson.findOne({
    _id: lessonObjectId,
    course: course._id,
  }).select("_id");
  if (!lesson) throw ApiError.notFound("Lesson not found in this course");

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
  });
  if (!enrollment || enrollment.status === "dropped") {
    throw ApiError.forbidden("You are not enrolled in this course");
  }

  // Ensure lessonProgress entry exists
  const lp =
    enrollment.lessonProgress.find((p) => p.lesson.equals(lessonObjectId)) ??
    (() => {
      const created = {
        lesson: lessonObjectId,
        percent: 0,
      } as any;
      enrollment.lessonProgress.push(created);
      return created;
    })();

  if (status === "started") {
    enrollment.lastAccessedLessonId = lessonObjectId;
    enrollment.lastAccessedAt = new Date();
    if (percent != null) {
      lp.percent = Math.max(lp.percent, Math.min(100, percent));
    }
  } else if (status === "completed") {
    lp.percent = 100;
    enrollment.lastAccessedLessonId = lessonObjectId;
    enrollment.lastAccessedAt = new Date();
    if (!enrollment.completedLessons.some((id) => id.equals(lessonObjectId))) {
      enrollment.completedLessons.push(lessonObjectId);
    }
  }

  // Recalculate overall course progress based on lessonProgress vs total lessons
  const totalLessonsCount = await Lesson.countDocuments({ course: course._id });
  if (totalLessonsCount > 0) {
    const completedCount = enrollment.completedLessons.length;
    enrollment.progressPercent = Math.min(
      100,
      Math.round((completedCount / totalLessonsCount) * 100),
    );
  }

  if (enrollment.progressPercent === 100 && enrollment.status !== "completed") {
    enrollment.status = "completed";
    enrollment.completedAt = new Date();
  }

  await enrollment.save();

  return {
    enrollmentId: enrollment._id,
    progressPercent: enrollment.progressPercent,
    lesson: {
      id: lesson._id,
      percent: lp.percent,
      completed: lp.percent === 100,
    },
    status: enrollment.status,
    lastAccessedLessonId: enrollment.lastAccessedLessonId,
  };
}
