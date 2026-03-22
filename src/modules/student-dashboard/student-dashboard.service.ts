import { IUser } from "@/modules/users/user.model";
import { resolveLevelInfo } from "@/modules/learnerProgress/learnerProgress.model";
import {
	findContinueLearningCourse,
	findCoursesInProgress,
	findRecommendedCourses,
	findLearnerGamification,
	findWeeklyActivity,
	findActiveBulletins,
} from "./student-dashboard.repository";

// Days ordered Mon → Sun to match the UI's weekly tracker
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * Builds the weekly progress tracker shape the frontend expects:
 *
 * {
 *   daysPerWeek: 3,
 *   preferredDays: ["Mon","Wed","Fri"],
 *   week: [
 *     { day: "Mon", isPreferred: true,  active: true  },
 *     { day: "Tue", isPreferred: false, active: false },
 *     ...
 *   ]
 * }
 *
 * A day is "active" when there is a DailyActivity record for it this week.
 */
function buildWeeklyProgress(
	activities: { date: Date }[],
	weekStart: Date,
	studyGoal: IUser["studyGoal"],
) {
	// Normalize activity dates to "YYYY-MM-DD" strings for fast lookup
	const activeDayStrings = new Set(
		activities.map((a) => {
			const d = new Date(a.date);
			return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
		}),
	);

	const week = WEEK_DAYS.map((day, i) => {
		const date = new Date(weekStart);
		date.setUTCDate(weekStart.getUTCDate() + i);
		const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;

		return {
			day,
			date: date.toISOString().split("T")[0], // "2025-03-17" — useful for tooltips
			isPreferred: studyGoal?.preferredDays?.includes(day as any) ?? false,
			active: activeDayStrings.has(key),
		};
	});

	return {
		daysPerWeek: studyGoal?.daysPerWeek ?? 3,
		preferredDays: studyGoal?.preferredDays ?? [],
		week,
		activeDaysThisWeek: week.filter((d) => d.active).length,
	};
}

export async function getDashboardData(user: IUser) {
	const studentId = user._id.toString();

	// Run all independent queries in parallel for speed
	const [
		continueLearning,
		gamificationRaw,
		weeklyData,
		bulletins,
		recommendedCourses,
	] = await Promise.all([
		findContinueLearningCourse(studentId),
		findLearnerGamification(studentId),
		findWeeklyActivity(studentId),
		findActiveBulletins(8),
		findRecommendedCourses(studentId, user.preferences?.interestedField, 3),
	]);

	// Courses in progress (excludes the continue-learning course)
	const coursesInProgress = await findCoursesInProgress(
		studentId,
		continueLearning?.courseId?.toString(),
	);

	// Gamification / XP panel
	const experience = gamificationRaw?.experience ?? 0;
	const levelInfo = resolveLevelInfo(experience);

	const gamification = {
		experience,
		currentStreak: gamificationRaw?.currentStreak ?? 0,
		bestStreak: gamificationRaw?.bestStreak ?? 0,
		totalLessonsCompleted: gamificationRaw?.totalLessonsCompleted ?? 0,
		totalCoursesCompleted: gamificationRaw?.totalCoursesCompleted ?? 0,
		...levelInfo, // currentLevel, nextLevel, experienceToNextLevel, isMaxLevel
	};

	// Weekly progress tracker
	const weeklyProgress = buildWeeklyProgress(
		weeklyData.activities,
		weeklyData.weekStart,
		user.studyGoal,
	);

	return {
		user: {
			firstName: user.firstName,
			lastName: user.lastName,
			avatar: user.avatar ?? null,
		},
		continueLearning: continueLearning ?? null,
		coursesInProgress,
		gamification,
		weeklyProgress,
		recommendedCourses,
		bulletinBoard: bulletins,
	};
}
