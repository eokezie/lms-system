import { z } from "zod";

export const enrollmentFilterTypeEnum = z.enum([
  "enrolled",
  "completed",
  "in_progress",
]);

export const enrollmentSortEnum = z.enum([
  "newest",
  "oldest",
  "progress",
  "title_asc",
]);

export const getStudentEnrollmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
  search: z.string().trim().optional(),
  type: enrollmentFilterTypeEnum.optional().default("enrolled"),
  sort: enrollmentSortEnum.optional().default("newest"),
});
