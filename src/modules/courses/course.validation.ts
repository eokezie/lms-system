import { z } from "zod";
import {
	PriceFilter,
	InstructorTypeFilter,
	AvgTimeToCompleteRange,
} from "./course.types";
import { CourseStatus } from "./course.model";

export const createCourseSchema = z.object({
	instructorId: z.string().min(24),
	categoryId: z.string().min(24),
	title: z.string().trim(),
	description: z.string(),
	estimatedCompletionTime: z.coerce.number().min(1),
	summary: z.string(),
	skillLevel: z.string(),
	// requirements: z.array(z.string()),
	// whatToLearn: z.array(z.string()),
	// ctaSection: z.record(z.string(), z.string()),
	requirements: z.string(),
	whatToLearn: z.string(),
	ctaSection: z.string(),
});

const difficultyEnum = z.enum(["Beginner", "Intermediate", "Advanced"]);
const priceEnum = z.nativeEnum(PriceFilter);
const instructorTypeEnum = z.nativeEnum(InstructorTypeFilter);
const avgTimeEnum = z.nativeEnum(AvgTimeToCompleteRange);

export const getExploreCoursesQuerySchema = z
	.object({
		page: z.coerce.number().int().min(1).optional().default(1),
		limit: z.coerce.number().int().min(1).max(100).optional().default(20),
		category: z.string().min(24).optional(),
		search: z.string().trim().optional(),
		q: z.string().trim().optional(),
		difficulty: difficultyEnum.optional(),
		price: priceEnum.optional(),
		instructorType: instructorTypeEnum.optional(),
		avgTimeToComplete: avgTimeEnum.optional(),
	})
	.transform((data) => {
		const { q, ...rest } = data;
		return { ...rest, search: data.search ?? q };
	});

export const courseIdParamSchema = z.object({
	id: z.string().length(24, "Invalid course ID"),
});

export const courseIdOrSlugParamSchema = z.object({
	id: z.string().min(1, "Course id or slug required").max(200),
});

export const getRelatedCoursesQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(10).optional().default(3),
});

export const updateCoursePriceSchema = z.object({
	price: z.number().min(0, "Price must be 0 or greater"),
});

const manageStatusEnum = z.enum(["draft", "published", "all"]);
const manageSortEnum = z.enum([
  "most_recent",
  "most_enrolled",
  "highest_rated",
]);

export const getManageCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  category: z.string().length(24).optional(),
  search: z.string().trim().optional(),
  status: manageStatusEnum.optional().default("all"),
  sort: manageSortEnum.optional().default("most_recent"),
});

export const updateCourseSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  summary: z.string().optional(),
  coverImage: z.string().optional(),
  category: z.string().length(24).optional(),
  tags: z.array(z.string()).optional(),
  price: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
  status: z.nativeEnum(CourseStatus).optional(),
});
