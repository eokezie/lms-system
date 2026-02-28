import { Schema, model, Document, Types } from "mongoose";

/**
 * Level progression config — single source of truth.
 *
 * Each entry represents a level. The *next* entry's name is what the
 * frontend shows as "next level to reach" (what you saw labelled "Starter"
 * on the card — that was just the next level name, not a badge).
 *
 * So for a student at 0 XP:
 *   currentLevel  → 'Novice'
 *   nextLevel     → 'Starter'   (i.e. LEVEL_CONFIG[1].name)
 *   xpToNextLevel → 250 - 0 = 250
 */
export const LEVEL_CONFIG = [
	{ name: "Novice", minExperience: 0 },
	{ name: "Starter", minExperience: 250 },
	{ name: "Apprentice", minExperience: 600 },
	{ name: "Practitioner", minExperience: 1200 },
	{ name: "Advanced", minExperience: 2500 },
	{ name: "Expert", minExperience: 5000 },
	{ name: "Master", minExperience: 9000 },
] as const;

export type LevelName = (typeof LEVEL_CONFIG)[number]["name"];

/**
 * Given a student's total experience, returns everything the frontend
 * needs to render the gamification card:
 *
 * {
 *   currentLevel:        'Novice',
 *   nextLevel:           'Starter',   // null if at max level
 *   experienceToNextLevel: 50,        // how far from next level threshold
 *   isMaxLevel:          false,
 * }
 */
export function resolveLevelInfo(experience: number) {
	let currentIndex = 0;

	for (let i = 0; i < LEVEL_CONFIG.length; i++) {
		if (experience >= LEVEL_CONFIG[i].minExperience) {
			currentIndex = i;
		}
	}

	const current = LEVEL_CONFIG[currentIndex];
	const next = LEVEL_CONFIG[currentIndex + 1] ?? null;

	return {
		currentLevel: current.name,
		nextLevel: next ? next.name : null,
		experienceToNextLevel: next ? next.minExperience - experience : 0,
		isMaxLevel: !next,
	};
}

// Experience rewards — tune these without touching any other logic
export const EXPERIENCE_REWARDS = {
	LESSON_COMPLETE: 10,
	COURSE_COMPLETE: 100,
	QUIZ_PASS: 25,
	DAILY_LOGIN: 5,
	STREAK_BONUS_7_DAYS: 50,
} as const;

export interface ILearnerProgress extends Document {
	student: Types.ObjectId;
	experience: number; // renamed from xp — same concept, clearer name
	currentStreak: number;
	bestStreak: number;
	lastActiveDate: Date;
	totalLessonsCompleted: number;
	totalCoursesCompleted: number;
	totalMinutesLearned: number;
}

const learnerProgressSchema = new Schema<ILearnerProgress>(
	{
		student: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
			index: true,
		},
		experience: { type: Number, default: 0, min: 0 },
		currentStreak: { type: Number, default: 0, min: 0 },
		bestStreak: { type: Number, default: 0, min: 0 },
		lastActiveDate: { type: Date },
		totalLessonsCompleted: { type: Number, default: 0, min: 0 },
		totalCoursesCompleted: { type: Number, default: 0, min: 0 },
		totalMinutesLearned: { type: Number, default: 0, min: 0 },
	},
	{
		timestamps: true,
		toJSON: {
			transform(_doc, ret: Record<string, any>) {
				delete ret.__v;
				return ret;
			},
		},
	},
);

export const LearnerProgress = model<ILearnerProgress>(
	"LearnerProgress",
	learnerProgressSchema,
);
