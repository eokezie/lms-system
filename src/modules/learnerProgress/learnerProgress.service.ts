/**
 * learnerProgress.service.ts
 *
 * Central place for ALL gamification side-effects:
 *   - Award XP when a lesson or course is completed
 *   - Update current/best streak
 *   - Upsert DailyActivity for today
 *   - Resolve level from XP (via resolveLevelInfo)
 *
 * This service is called from:
 *   1. progress.service.ts  → after a lesson is marked complete
 *   2. eventBus listeners   → on "course.completed", "login.daily"
 */

import mongoose from "mongoose";
import {
	LearnerProgress,
	EXPERIENCE_REWARDS,
	resolveLevelInfo,
} from "@/modules/learnerProgress/learnerProgress.model";
import { DailyActivity } from "@/modules/dailyActivity/dailyActivity.model";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Normalize a Date to midnight UTC — matches how DailyActivity stores dates */
function toMidnightUTC(date: Date): Date {
	const d = new Date(date);
	d.setUTCHours(0, 0, 0, 0);
	return d;
}

/** Returns true when two dates fall on the same UTC calendar day */
function isSameUTCDay(a: Date, b: Date): boolean {
	return (
		a.getUTCFullYear() === b.getUTCFullYear() &&
		a.getUTCMonth() === b.getUTCMonth() &&
		a.getUTCDate() === b.getUTCDate()
	);
}

/** Returns true when dateB is exactly one calendar day after dateA (UTC) */
function isConsecutiveDay(dateA: Date, dateB: Date): boolean {
	const next = new Date(dateA);
	next.setUTCDate(next.getUTCDate() + 1);
	return isSameUTCDay(next, dateB);
}

// ─── Core: upsert DailyActivity for today ───────────────────────────────────

/**
 * Records that the student was active today.
 * Creates the day's record if missing; otherwise increments counters.
 *
 * Call this on every meaningful learning action (lesson start, lesson complete).
 */
export async function recordDailyActivity(
	studentId: string,
	courseId: string,
	opts: {
		minutesSpent?: number;
		lessonCompleted?: boolean;
	} = {},
) {
	const today = toMidnightUTC(new Date());

	await DailyActivity.findOneAndUpdate(
		{
			student: new mongoose.Types.ObjectId(studentId),
			date: today,
		},
		{
			$setOnInsert: { date: today },
			$inc: {
				minutesSpent: opts.minutesSpent ?? 0,
				lessonsCompleted: opts.lessonCompleted ? 1 : 0,
			},
			$addToSet: {
				coursesTouched: new mongoose.Types.ObjectId(courseId),
			},
		},
		{ upsert: true, new: true },
	);
}

// ─── Core: award XP & update streak ─────────────────────────────────────────

export type XpEvent =
	| "LESSON_COMPLETE"
	| "COURSE_COMPLETE"
	| "QUIZ_PASS"
	| "DAILY_LOGIN"
	| "STREAK_BONUS_7_DAYS";

/**
 * Awards XP to the student and updates their streak.
 *
 * Streak rules:
 *   - lastActiveDate is null          → streak = 1 (first ever activity)
 *   - lastActiveDate is today         → no change (already counted today)
 *   - lastActiveDate is yesterday     → streak++, check for 7-day bonus
 *   - lastActiveDate is older         → streak resets to 1 (broken chain)
 *
 * Returns the updated progress document.
 */
export async function awardXp(
	studentId: string,
	event: XpEvent,
	customPoints?: number, // override if lesson.experiencePoints is set
) {
	const points = customPoints ?? EXPERIENCE_REWARDS[event];
	const today = toMidnightUTC(new Date());

	// Get or create the learner's progress record
	let progress = await LearnerProgress.findOne({ student: studentId });
	if (!progress) {
		progress = new LearnerProgress({
			student: new mongoose.Types.ObjectId(studentId),
		});
	}

	// ── Streak logic ──
	const lastActive = progress.lastActiveDate
		? toMidnightUTC(progress.lastActiveDate)
		: null;

	if (!lastActive) {
		// Very first activity ever
		progress.currentStreak = 1;
	} else if (isSameUTCDay(lastActive, today)) {
		// Already counted today — don't touch streak
	} else if (isConsecutiveDay(lastActive, today)) {
		// Consecutive day — extend streak
		progress.currentStreak += 1;
	} else {
		// Gap detected — reset streak
		progress.currentStreak = 1;
	}

	// Update best streak if current exceeds it
	if (progress.currentStreak > progress.bestStreak) {
		progress.bestStreak = progress.currentStreak;
	}

	// Award streak bonus at every 7-day milestone
	let bonusXp = 0;
	if (progress.currentStreak > 0 && progress.currentStreak % 7 === 0) {
		bonusXp = EXPERIENCE_REWARDS.STREAK_BONUS_7_DAYS;
	}

	// ── XP ──
	progress.experience += points + bonusXp;

	// ── Counters ──
	if (event === "LESSON_COMPLETE") {
		progress.totalLessonsCompleted += 1;
	}
	if (event === "COURSE_COMPLETE") {
		progress.totalCoursesCompleted += 1;
	}

	progress.lastActiveDate = today;
	await progress.save();

	return {
		progress,
		xpAwarded: points + bonusXp,
		bonusXp,
		levelInfo: resolveLevelInfo(progress.experience),
	};
}

// ─── Convenience wrappers ────────────────────────────────────────────────────

/**
 * Called when a student completes a lesson.
 * Awards XP (uses lesson.experiencePoints if set, falls back to default),
 * updates streak, and records daily activity.
 */
export async function onLessonCompleted(opts: {
	studentId: string;
	courseId: string;
	lessonExperiencePoints?: number;
	videoDurationSeconds?: number;
}) {
	const minutesSpent = opts.videoDurationSeconds
		? Math.round(opts.videoDurationSeconds / 60)
		: 0;

	const [xpResult] = await Promise.all([
		awardXp("LESSON_COMPLETE", "LESSON_COMPLETE", opts.lessonExperiencePoints),
		recordDailyActivity(opts.studentId, opts.courseId, {
			minutesSpent,
			lessonCompleted: true,
		}),
	]);

	// Fix: awardXp first arg should be studentId
	return awardXp(
		opts.studentId,
		"LESSON_COMPLETE",
		opts.lessonExperiencePoints,
	);
}

/**
 * Called when a student completes an entire course.
 */
export async function onCourseCompleted(studentId: string, courseId: string) {
	const [xpResult] = await Promise.all([
		awardXp(studentId, "COURSE_COMPLETE"),
		recordDailyActivity(studentId, courseId, {}),
	]);
	return xpResult;
}

/**
 * Called once per day when the student logs in.
 * Safe to call multiple times — streak logic deduplicates by day.
 */
export async function onDailyLogin(studentId: string) {
	return awardXp(studentId, "DAILY_LOGIN");
}
