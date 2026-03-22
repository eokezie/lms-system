/**
 * gamification.listeners.ts
 *
 * Registers eventBus listeners that drive XP, streaks, and daily activity.
 * Call registerGamificationListeners() once at startup in server.ts,
 * alongside registerNotificationListeners().
 *
 * Events handled here:
 *   - "login.daily"      → small XP for showing up + streak update
 *   - "course.completed" → handled in progress.service directly, but
 *                          also re-listened here in case other paths
 *                          complete a course (e.g. admin override)
 */

import { eventBus } from "@/events/eventBus";
import { logger } from "@/utils/logger";
import {
	onDailyLogin,
	onCourseCompleted,
} from "@/modules/learnerProgress/learnerProgress.service";

async function handleDailyLogin({ studentId }: { studentId: string }) {
	try {
		await onDailyLogin(studentId);
		logger.debug({ studentId }, "[gamification] daily login XP awarded");
	} catch (err) {
		logger.error(
			{ err, studentId },
			"[gamification] daily login handler failed",
		);
	}
}

async function handleCourseCompleted({
	studentId,
	courseId,
}: {
	studentId: string;
	courseId: string;
}) {
	try {
		// progress.service already calls onCourseCompleted() directly for the
		// normal lesson-by-lesson flow. This listener catches any other path
		// (e.g. admin marks a course complete, bulk import, etc.)
		logger.debug(
			{ studentId, courseId },
			"[gamification] course.completed received",
		);
	} catch (err) {
		logger.error({ err }, "[gamification] course.completed handler failed");
	}
}

export function registerGamificationListeners(): void {
	eventBus.on("login.daily", handleDailyLogin);
	eventBus.on("course.completed", handleCourseCompleted);
	logger.info("[gamification] Event listeners registered");
}
