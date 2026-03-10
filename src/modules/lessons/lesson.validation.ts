import { z } from "zod";
import { LessonType } from "./lesson.model";

export const createLessonSchema = z.object({
	courseId: z.string().min(1).trim(),
	moduleId: z.string().min(1).trim(),
	title: z.string().min(1).trim(),
	moduleTitle: z.string().optional(),
	type: z.nativeEnum(LessonType),

	// coerce converts "30" → 30 before validating
	estimatedCompletionTime: z.coerce.number().min(0).optional(),
	experiencePoints: z.coerce.number().min(0).optional(),
});
