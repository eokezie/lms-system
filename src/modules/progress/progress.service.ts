import mongoose from "mongoose";
import { ApiError } from "@/utils/apiError";
import { Enrollment } from "@/modules/enrollments/enrollment.model";
import { findCourseById } from "@/modules/courses/course.repository";
import { Lesson } from "@/modules/lessons/lesson.model";
import { eventBus } from "@/events/eventBus";
import {
	onCourseCompleted,
	onLessonCompleted,
	recordDailyActivity,
} from "../learnerProgress/learnerProgress.service";

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
	}).select("_id experiencePoints videoDuration");
	if (!lesson) throw ApiError.notFound("Lesson not found in this course");

	const enrollment = await Enrollment.findOne({
		student: studentId,
		course: courseId,
	});
	if (!enrollment || enrollment.status === "dropped") {
		throw ApiError.forbidden("You are not enrolled in this course");
	}

	// Track whether this is the first time this lesson is being completed
	const alreadyCompleted = enrollment.completedLessons.some((id) =>
		id.equals(lessonObjectId),
	);

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

		// Record presence for streak/daily tracking even on "started"
		await recordDailyActivity(studentId, courseId, {
			minutesSpent: 0,
			lessonCompleted: false,
		});
	} else if (status === "completed") {
		lp.percent = 100;
		enrollment.lastAccessedLessonId = lessonObjectId;
		enrollment.lastAccessedAt = new Date();
		// if (!enrollment.completedLessons.some((id) => id.equals(lessonObjectId))) {
		//   enrollment.completedLessons.push(lessonObjectId);
		// }

		if (!alreadyCompleted) {
			enrollment.completedLessons.push(lessonObjectId);
		}
	}

	// Recalculate overall course progress based on lessonProgress vs total lessons
	const totalLessonsCount = await Lesson.countDocuments({ course: course._id });
	// if (totalLessonsCount > 0) {
	//   const completedCount = enrollment.completedLessons.length;
	//   enrollment.progressPercent = Math.min(
	//     100,
	//     Math.round((completedCount / totalLessonsCount) * 100),
	//   );
	// }

	// if (enrollment.progressPercent === 100 && enrollment.status !== "completed") {
	//   enrollment.status = "completed";
	//   enrollment.completedAt = new Date();
	// }
	if (totalLessonsCount > 0) {
		enrollment.progressPercent = Math.min(
			100,
			Math.round(
				(enrollment.completedLessons.length / totalLessonsCount) * 100,
			),
		);
	}

	const justCompleted =
		enrollment.progressPercent === 100 && enrollment.status !== "completed";

	if (justCompleted) {
		enrollment.status = "completed";
		enrollment.completedAt = new Date();
	}

	await enrollment.save();

	// ── Side-effects: XP, streaks, daily activity ──
	// Only award XP when the lesson is completed for the first time
	if (status === "completed" && !alreadyCompleted) {
		await onLessonCompleted({
			studentId,
			courseId,
			lessonExperiencePoints: lesson.experiencePoints,
			videoDurationSeconds: lesson.videoDuration,
		});
	}

	if (justCompleted) {
		await onCourseCompleted(studentId, courseId);
		// Trigger email notification (already handled by notification.service listener)
		eventBus.emit("course.completed", { studentId, courseId });
	}

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
