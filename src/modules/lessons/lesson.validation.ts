import { z } from "zod";
import { LessonType } from "./lesson.model";

export const createLessonSchema = z.object({
	courseId: z.string().min(1).trim(),
	moduleId: z.string().min(1).trim(),
	moduleTitle: z.string().optional(),
});

export const updateLessonSchema = z.object({
	title: z.string().min(1).trim().optional(),
	type: z.nativeEnum(LessonType).optional(),
	description: z.string().optional(),

	// coerce converts "30" → 30 before validating
	estimatedCompletionTime: z.coerce.number().min(0).optional(),
	experiencePoints: z.coerce.number().min(0).optional(),

	questions: z.string().optional(),
	article: z.string().optional(),
});

export const muxUploadIdSchema = z.object({
	lessonId: z.string().min(1).trim(),
});

export const lessonIdParamSchema = z.object({
	lessonId: z.string().length(24),
});
