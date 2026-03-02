import { z } from "zod";

export const createCourseSchema = z.object({
	instructorId: z.string().min(24),
	categoryId: z.string().min(24),
	title: z.string().trim(),
	description: z.string(),
	summary: z.string(),
	skillLevel: z.string(),
	requirements: z.array(z.string()),
	whatToLearn: z.array(z.string()),
	ctaSection: z.record(z.string(), z.string()),
});
