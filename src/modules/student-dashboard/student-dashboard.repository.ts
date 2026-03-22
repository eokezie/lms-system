import mongoose from "mongoose";
import { Enrollment } from "@/modules/enrollments/enrollment.model";
import { Course } from "@/modules/courses/course.model";
import { LearnerProgress } from "@/modules/learnerProgress/learnerProgress.model";
import { DailyActivity } from "@/modules/dailyActivity/dailyActivity.model";
import { Bulletin } from "@/modules/bulletin/bulletin.model";

/**
 * The single course the student was most recently studying.
 * Sorted by lastAccessedAt desc, limited to 1.
 */
export async function findContinueLearningCourse(studentId: string) {
	const results = await Enrollment.aggregate([
		{
			$match: {
				student: new mongoose.Types.ObjectId(studentId),
				status: "active",
				progressPercent: { $gt: 0, $lt: 100 }, // started but not finished
			},
		},
		{ $sort: { lastAccessedAt: -1 } },
		{ $limit: 1 },
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
							"coverImage.fileUrl": 1,
							totalDuration: 1,
							estimatedCompletionTime: 1,
						},
					},
				],
			},
		},
		{ $set: { course: { $arrayElemAt: ["$course", 0] } } },
		{
			$lookup: {
				from: "lessons",
				localField: "lastAccessedLessonId",
				foreignField: "_id",
				as: "lastLesson",
				pipeline: [{ $project: { title: 1, type: 1 } }],
			},
		},
		{ $set: { lastLesson: { $arrayElemAt: ["$lastLesson", 0] } } },
		{
			$project: {
				courseId: "$course._id",
				title: "$course.title",
				slug: "$course.slug",
				coverImage: "$course.coverImage.fileUrl",
				progressPercent: 1,
				lastAccessedAt: 1,
				lastAccessedLessonId: 1,
				lastLessonTitle: "$lastLesson.title",
			},
		},
	]);

	return results[0] ?? null;
}

/**
 * All active enrollments for the dashboard "Courses in Progress" grid.
 * Returns up to 4, excludes the continuelearning course.
 */
export async function findCoursesInProgress(
	studentId: string,
	excludeCourseId?: string,
) {
	const match: Record<string, unknown> = {
		student: new mongoose.Types.ObjectId(studentId),
		status: "active",
	};
	if (excludeCourseId) {
		match.course = { $ne: new mongoose.Types.ObjectId(excludeCourseId) };
	}

	return Enrollment.aggregate([
		{ $match: match },
		{ $sort: { lastAccessedAt: -1 } },
		{ $limit: 4 },
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
							"coverImage.fileUrl": 1,
							averageRating: 1,
							totalDuration: 1,
							instructor: 1,
						},
					},
				],
			},
		},
		{ $set: { course: { $arrayElemAt: ["$course", 0] } } },
		{
			$lookup: {
				from: "users",
				localField: "course.instructor",
				foreignField: "_id",
				as: "instructor",
				pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
			},
		},
		{ $set: { instructor: { $arrayElemAt: ["$instructor", 0] } } },
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
			$project: {
				courseId: "$course._id",
				title: "$course.title",
				slug: "$course.slug",
				coverImage: "$course.coverImage.fileUrl",
				averageRating: "$course.averageRating",
				totalDuration: "$course.totalDuration",
				instructorName: {
					$concat: ["$instructor.firstName", " ", "$instructor.lastName"],
				},
				lessonCount: { $size: "$lessons" },
				progressPercent: 1,
				lastAccessedAt: 1,
			},
		},
	]);
}

/**
 * Recommended courses: published, not already enrolled, matching
 * the student's interestedField preference (falls back to top-rated).
 */
export async function findRecommendedCourses(
	studentId: string,
	interestedField: string | undefined,
	limit = 3,
) {
	// Get courses the student is already enrolled in so we can exclude them
	const enrolledCourseIds = await Enrollment.distinct("course", {
		student: new mongoose.Types.ObjectId(studentId),
		status: { $in: ["active", "completed"] },
	});

	const filter: Record<string, unknown> = {
		status: "published",
		_id: { $nin: enrolledCourseIds },
	};

	// If the student has a preference, try to match by tags or category name
	if (interestedField) {
		filter.tags = { $in: [new RegExp(interestedField, "i")] };
	}

	let courses = await Course.find(filter)
		.populate("instructor", "firstName lastName")
		.select("title slug coverImage averageRating totalDuration instructor")
		.sort({ averageRating: -1, enrollmentCount: -1 })
		.limit(limit)
		.lean();

	// If interest-based query returned nothing, fall back to top-rated overall
	if (courses.length === 0 && interestedField) {
		delete filter.tags;
		courses = await Course.find(filter)
			.populate("instructor", "firstName lastName")
			.select("title slug coverImage averageRating totalDuration instructor")
			.sort({ averageRating: -1, enrollmentCount: -1 })
			.limit(limit)
			.lean();
	}

	return courses;
}

/**
 * Gamification data: XP, streaks, level info.
 * Returns null if no record yet (new student).
 */
export async function findLearnerGamification(studentId: string) {
	return LearnerProgress.findOne({ student: studentId })
		.select(
			"experience currentStreak bestStreak totalLessonsCompleted totalCoursesCompleted",
		)
		.lean();
}

/**
 * Weekly progress: DailyActivity records for the current Mon–Sun week.
 * Returns one entry per day that had activity.
 */
export async function findWeeklyActivity(studentId: string) {
	// Build Mon–Sun boundaries for the current week (UTC)
	const now = new Date();
	const dayOfWeek = now.getUTCDay(); // 0=Sun … 6=Sat
	const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

	const monday = new Date(now);
	monday.setUTCDate(now.getUTCDate() + diffToMonday);
	monday.setUTCHours(0, 0, 0, 0);

	const sunday = new Date(monday);
	sunday.setUTCDate(monday.getUTCDate() + 6);
	sunday.setUTCHours(23, 59, 59, 999);

	const activities = await DailyActivity.find({
		student: new mongoose.Types.ObjectId(studentId),
		date: { $gte: monday, $lte: sunday },
	})
		.select("date minutesSpent lessonsCompleted")
		.lean();

	return { activities, weekStart: monday, weekEnd: sunday };
}

/**
 * Active bulletin board items (not expired).
 */
export async function findActiveBulletins(limit = 6) {
	return Bulletin.find({
		isActive: true,
		$or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
	})
		.select("type title description image ctaLabel ctaLink courseRef createdAt")
		.sort({ createdAt: -1 })
		.limit(limit)
		.lean();
}
